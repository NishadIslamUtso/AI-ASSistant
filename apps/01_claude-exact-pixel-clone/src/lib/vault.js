/**
 * vault.js — client for the local vault API (server/vault-api.cjs, 127.0.0.1:8765).
 *
 * The APP is the driver: it reads context from the Obsidian vault and writes
 * captures back into it. The vault is the canonical memory (Markdown files),
 * never a database.
 *
 * Every call fails soft: a vault that is not running must degrade the UI,
 * never break the chat.
 */

export const DEFAULT_VAULT_URL = 'http://127.0.0.1:8765'

let _vaultUrl = DEFAULT_VAULT_URL
export function setVaultUrl(url) {
  _vaultUrl = String(url || DEFAULT_VAULT_URL).replace(/\/+$/, '')
}
export function getVaultUrl() {
  return _vaultUrl
}

async function get(path, timeout = 4000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(`${_vaultUrl}${path}`, { signal: ctrl.signal, cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    return null
  } finally {
    clearTimeout(t)
  }
}

async function post(path, body, timeout = 8000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(`${_vaultUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    return null
  } finally {
    clearTimeout(t)
  }
}

export const vault = {
  /** Health + vault path + counts. null when offline. */
  status: () => get('/status'),

  /** Semantic-ish keyword search across entities/capsules. */
  context: (q, limit = 6) => get(`/context?q=${encodeURIComponent(q)}&limit=${limit}`),

  /** Capsule / entity library for the right-hand panel. */
  capsules: () => get('/capsules?limit=200'),

  /** Working memory: Current Snapshot + Open Loops + today's journal. */
  today: () => get('/today'),

  /** Never-check blacklist (default allow, explicit deny). */
  blacklist: () => get('/blacklist'),
  setBlacklist: (patterns) => post('/blacklist', { patterns }),

  /** Generic capture sink used by the app and the browser extension. */
  capture: (payload) => post('/capture', payload),

  /**
   * Log "wasn't accessible - reason".
   * Per the capture policy this is silent: no popup, no question, just a record
   * in 09 Activity & Undo + 01 Inbox/Processing Errors.
   */
  logInaccessible: (url, reason, provider = 'web') =>
    post('/capture', {
      type: 'wasnt_accessible',
      url,
      reason,
      provider,
      captured_at: new Date().toISOString(),
    }, 3000),

  /** Save an artifact produced in chat into 02 Sources/Attachments. */
  saveArtifact: (artifact) =>
    post('/capture', {
      type: 'artifact',
      artifact,
      captured_at: new Date().toISOString(),
    }, 8000),
}

/** Turn a capsule/entity into a compact block that can be injected into a prompt. */
export function capsuleToPromptText(c) {
  const parts = []
  parts.push(`# ${c.title || 'Untitled'}${c.type ? ` (${c.type})` : ''}`)
  if (Array.isArray(c.goals) && c.goals.length) parts.push('Goals:\n' + c.goals.map((g) => `- ${g}`).join('\n'))
  if (Array.isArray(c.constraints) && c.constraints.length)
    parts.push('Constraints:\n' + c.constraints.map((g) => `- ${g}`).join('\n'))
  if (c.background) parts.push('Background:\n' + String(c.background).trim())
  if (Array.isArray(c.decisions) && c.decisions.length)
    parts.push('Decisions:\n' + c.decisions.map((g) => `- ${g}`).join('\n'))
  if (c.summary) parts.push('Summary:\n' + String(c.summary).trim())
  if (c.path) parts.push(`Source: ${c.path}`)
  return parts.join('\n\n')
}
