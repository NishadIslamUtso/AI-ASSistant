/**
 * blacklist.js — the never-check list.
 *
 * The vault is the source of truth: patterns live in
 * "00 System/Privacy & Access.md" and are served by GET /blacklist. This module
 * reads them from there and only falls back to local storage when the desktop
 * app is not running, so a pattern added in the app takes effect in the browser
 * without any extra sync step.
 *
 * Matching is deliberately identical to the server's excluded() in
 * apps/01_claude-exact-pixel-clone/server/vault-api.cjs. A substring shortcut
 * here previously matched "bank.com.evil.org" against the pattern "bank.com/*",
 * which is exactly the spoof the host-aware rules below exist to stop.
 * tests/blacklist.test.js asserts both implementations agree.
 */

const DEFAULT_EXCLUDED = ['bank.com/*']
const BLACKLIST_ENDPOINT = '/blacklist'
const CACHE_KEY = 'excluded_patterns_cache'

function isExtensionValid() {
  try { return !!(chrome.runtime && chrome.runtime.id) } catch (e) { return false }
}

function localApi() {
  return (typeof LOCAL_API !== 'undefined' && LOCAL_API) || 'http://127.0.0.1:8765'
}

/** Escape everything regex-special except *, which stays a wildcard. */
function escapePattern(text) {
  return String(text).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
}

/**
 * Does one pattern exclude one URL?
 * - "https://host/path" matches the full href
 * - "host/path" or "host/*" match hostname (including subdomains) plus path
 * - "host" alone matches the host and any subdomain, at any path
 */
function matchesPattern(url, pattern) {
  const value = String(pattern || '').trim().toLowerCase()
  if (!value || !url) return false
  let parsed
  try { parsed = new URL(url) } catch (e) { return false }
  try {
    if (/^https?:\/\//.test(value)) return new RegExp(`^${escapePattern(value)}$`, 'i').test(parsed.href)
    const [host, ...rest] = value.split('/')
    if (!host) return false
    // Subdomains of the host are part of the same site; a look-alike suffix
    // such as "bank.com.evil.org" is not, because it would have to end the
    // hostname with ".bank.com" or equal it exactly.
    const hostRegex = new RegExp(`^(?:[^.]+\\.)*${escapePattern(host)}$`, 'i')
    if (!hostRegex.test(parsed.hostname)) return false
    if (!rest.length) return true
    return new RegExp(`^/${escapePattern(rest.join('/'))}$`, 'i').test(parsed.pathname + parsed.search)
  } catch (e) { return false }
}

function isExcluded(url, patterns) {
  if (!url) return false
  const list = Array.isArray(patterns) ? patterns : []
  return list.some(pattern => matchesPattern(url, pattern))
}

/** Read the list from the running app; fall back to the last known copy. */
async function readStoredPatterns() {
  if (!isExtensionValid()) return DEFAULT_EXCLUDED.slice()
  try {
    const data = await chrome.storage.sync.get({ excluded_patterns: DEFAULT_EXCLUDED.slice() })
    return Array.isArray(data.excluded_patterns) ? data.excluded_patterns : DEFAULT_EXCLUDED.slice()
  } catch (e) { return DEFAULT_EXCLUDED.slice() }
}

async function writeStoredPatterns(list) {
  if (!isExtensionValid()) return
  try { await chrome.storage.sync.set({ excluded_patterns: list }) } catch (e) { /* storage unavailable */ }
}

async function getBlacklist() {
  const stored = await readStoredPatterns()
  try {
    const response = await fetch(`${localApi()}${BLACKLIST_ENDPOINT}`, { headers: { Accept: 'application/json' } })
    if (!response.ok) return stored
    const data = await response.json()
    const vault = Array.isArray(data?.excluded_patterns) ? data.excluded_patterns : null
    if (!vault) return stored
    await writeStoredPatterns(vault)   // keep the offline copy current
    return vault
  } catch (e) {
    // App not running is normal; the cached copy is still authoritative enough.
    return stored
  }
}

async function checkBlacklist(url) {
  return isExcluded(url, await getBlacklist())
}

async function addToBlacklist(pattern) {
  const value = String(pattern || '').trim()
  if (!value) return
  const list = await readStoredPatterns()
  if (!list.includes(value)) list.push(value)
  await writeStoredPatterns(list)
  try {
    await fetch(`${localApi()}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'blacklist_update', excluded_patterns: list }),
    })
  } catch (e) { /* queued on the next successful read */ }
}

async function removeFromBlacklist(pattern) {
  const value = String(pattern || '').trim()
  const list = (await readStoredPatterns()).filter(item => item !== value)
  await writeStoredPatterns(list)
  try {
    await fetch(`${localApi()}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'blacklist_update', excluded_patterns: list }),
    })
  } catch (e) { /* queued on the next successful read */ }
}

// Loaded as a classic content script in the browser, where these must stay
// global; exported for the tests that keep it in step with the server.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { matchesPattern, isExcluded, getBlacklist, checkBlacklist, addToBlacklist, removeFromBlacklist, DEFAULT_EXCLUDED }
}
