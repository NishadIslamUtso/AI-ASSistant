/**
 * storeIndex.ts (main) — Mods Phase 2: the pack index client.
 *
 * A store is an index file, not a service: a folder with an `index.json`
 * (a repo checkout, a USB stick) or an https URL answering the same JSON.
 * The index lists packs with a pinned sha-256 of the pack folder's contents;
 * browsing reads the index you added, and an install recomputes the digest
 * from the real files and refuses the copy when one byte differs.
 *
 * An index entry whose `source` is itself a URL is listed but not installable
 * yet — downloading and verifying a remote zip is later work, and pretending
 * otherwise would be a button that lies.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { installPackFromFolder, type PackTargets } from './packs'

const MAX_INDEX_BYTES = 2_000_000
const FETCH_TIMEOUT_MS = 10_000

export type IndexEntry = {
  id: string
  name: string
  version: string
  author: string
  description: string
  permissions: Record<string, unknown>
  /** sha-256 over the pack folder, in the form packDigest() writes. */
  checksum: string
  /** Where the pack lives, relative to the index folder (folder indexes). */
  source: string
}

export type ReadIndexAnswer =
  | { ok: true; name: string; packs: Array<IndexEntry & { verified: boolean; problem: string }> }
  | { ok: false; problem: string }

export type IndexSource = { kind: 'folder'; path: string } | { kind: 'url'; url: string }

/** Every file under the folder, relative, sorted — the digest's input order. */
function relativeFiles(root: string, dir: string = ''): string[] {
  const abs = dir ? join(root, dir) : root
  const out: string[] = []
  for (const name of readdirSync(abs).sort()) {
    if (name === '.installed.json') continue
    const rel = dir ? `${dir}/${name}` : name
    if (statSync(join(abs, name)).isDirectory()) out.push(...relativeFiles(root, rel))
    else out.push(rel)
  }
  return out
}

/**
 * The pack's digest: each file's own sha-256, over the sorted relative
 * paths — so the number is stable across machines and edit-visible.
 */
export function packDigest(folder: string): { digest?: string; problem?: string } {
  if (!existsSync(folder)) return { problem: 'The pack folder is gone.' }
  let files: string[]
  try {
    files = relativeFiles(folder)
  } catch {
    return { problem: 'The pack folder cannot be read.' }
  }
  if (!files.length) return { problem: 'The pack folder is empty.' }
  const hash = createHash('sha256')
  for (const rel of files) {
    hash.update(rel)
    hash.update('\n')
    hash.update(createHash('sha256').update(readFileSync(join(folder, rel))).digest('hex'))
    hash.update('\n')
  }
  return { digest: hash.digest('hex') }
}

const isHex64 = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{64}$/.test(value)

const cleanText = (value: unknown, cap: number): string =>
  typeof value === 'string' ? value.trim().slice(0, cap) : ''

/** Strict: a bad index is an honest error, never a partial list. */
export function parseIndex(raw: string): { name: string; packs: IndexEntry[] } | { problem: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { problem: 'The index is not valid JSON.' }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { problem: 'The index is not an object.' }
  const record = parsed as Record<string, unknown>
  const name = cleanText(record['name'], 80)
  if (!name) return { problem: 'The index needs a name.' }
  const list = record['packs']
  if (!Array.isArray(list)) return { problem: 'The index needs a packs array.' }
  const packs: IndexEntry[] = []
  for (const item of list.slice(0, 500)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { problem: 'A pack entry is not an object.' }
    const entry = item as Record<string, unknown>
    const id = cleanText(entry['id'], 80)
    if (!/^[a-z0-9][a-z0-9.-]{1,78}[a-z0-9]$/.test(id)) return { problem: `A pack entry needs a real id (got "${String(entry['id']).slice(0, 40)}").` }
    const packName = cleanText(entry['name'], 80)
    if (!packName) return { problem: `The pack "${id}" needs a name.` }
    const version = cleanText(entry['version'], 20)
    if (!/^\d+\.\d+\.\d+$/.test(version)) return { problem: `The pack "${id}" needs a version like 1.0.0.` }
    if (!isHex64(entry['checksum'])) return { problem: `The pack "${id}" needs a sha-256 checksum (64 hex characters) — an index that cannot prove its packs is not an index this app trusts.` }
    const source = cleanText(entry['source'], 300)
    if (!source) return { problem: `The pack "${id}" needs a source.` }
    if (source.includes('..') || source.startsWith('/')) return { problem: `The pack "${id}" names a source outside the index folder.` }
    packs.push({
      id,
      name: packName,
      version,
      author: cleanText(entry['author'], 80) || 'unknown author',
      description: cleanText(entry['description'], 300),
      permissions: entry['permissions'] && typeof entry['permissions'] === 'object' && !Array.isArray(entry['permissions'])
        ? (entry['permissions'] as Record<string, unknown>)
        : {},
      checksum: entry['checksum'],
      source,
    })
  }
  return { name, packs }
}

function readIndexRaw(source: IndexSource): Promise<{ raw?: string; problem?: string }> {
  if (source.kind === 'folder') {
    const file = join(source.path, 'index.json')
    if (!existsSync(file)) return Promise.resolve({ problem: 'That folder holds no index.json.' })
    if (statSync(file).size > MAX_INDEX_BYTES) return Promise.resolve({ problem: 'That index is too large to read in full.' })
    return Promise.resolve({ raw: readFileSync(file, 'utf8') })
  }
  // https URL: one GET from the privileged main process, capped and timed.
  // electron is imported lazily so the pure parts of this module stay
  // testable without the runtime.
  let parsed: URL
  try {
    parsed = new URL(source.url)
  } catch {
    return Promise.resolve({ problem: 'That is not a URL.' })
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return Promise.resolve({ problem: 'Index URLs must be http or https.' })
  }
  return new Promise(resolveFetch => {
    const timer = setTimeout(() => resolveFetch({ problem: 'The index did not answer within ten seconds.' }), FETCH_TIMEOUT_MS)
    void import('electron')
      .then(({ net }) =>
        net.fetch(parsed.toString()).then(async res => {
          if (!res.ok) throw new Error(`The index answered ${res.status}.`)
          const text = await res.text()
          if (text.length > MAX_INDEX_BYTES) throw new Error('That index is too large to read in full.')
          return text
        }),
      )
      .then(text => resolveFetch({ raw: text }))
      .catch((error: unknown) => {
        resolveFetch({ problem: error instanceof Error ? error.message : 'The index could not be fetched.' })
      })
      .finally(() => clearTimeout(timer))
  })
}

export async function readIndex(source: IndexSource): Promise<ReadIndexAnswer> {
  const raw = await readIndexRaw(source)
  if (raw.problem) return { ok: false, problem: raw.problem }
  const parsed = parseIndex(raw.raw ?? '')
  if ('problem' in parsed) return { ok: false, problem: parsed.problem }
  const root = source.kind === 'folder' ? resolve(source.path) : ''
  const packs = parsed.packs.map(entry => {
    if (source.kind === 'url') {
      // Remote entries are listed honestly but not installable yet.
      return { ...entry, verified: false, problem: 'This entry points at a download; install it from a folder index you can verify.' }
    }
    if (/^[a-z]+:\/\//.test(entry.source)) {
      return { ...entry, verified: false, problem: 'This entry points at a download; install it from a folder index you can verify.' }
    }
    const folder = join(root, entry.source)
    if (!inside(root, folder)) return { ...entry, verified: false, problem: 'Its source would leave the index folder.' }
    if (!existsSync(join(folder, 'manifest.json'))) {
      return { ...entry, verified: false, problem: 'Its folder holds no manifest.json.' }
    }
    const { digest, problem } = packDigest(folder)
    if (problem || digest !== entry.checksum) {
      return { ...entry, verified: false, problem: problem || 'Its files do not match the checksum the index pinned.' }
    }
    return { ...entry, verified: true, problem: '' }
  })
  return { ok: true, name: parsed.name, packs }
}

const inside = (root: string, target: string): boolean => {
  const rootPath = resolve(root)
  const targetPath = resolve(target)
  return targetPath === rootPath || targetPath.startsWith(rootPath + sep)
}

export type InstallFromIndexAnswer =
  | { ok: true; answer: string; written: string[]; folder: string }
  | { ok: false; answer: string }

/** Install one entry of a FOLDER index, after the digest check passes again. */
export async function installFromIndex(
  source: IndexSource,
  id: string,
  targets: PackTargets,
): Promise<InstallFromIndexAnswer> {
  if (source.kind === 'url') return { ok: false, answer: 'This index is a URL. Packs install from folder indexes, where the files can be checked against the pinned checksum.' }
  const index = await readIndex(source)
  if (!index.ok) return { ok: false, answer: index.problem }
  const entry = index.packs.find(pack => pack.id === id)
  if (!entry) return { ok: false, answer: `The index does not list "${id}".` }
  if (!entry.verified) return { ok: false, answer: entry.problem || 'The pack did not pass the checksum check, so it is refused.' }
  const folder = join(resolve(source.path), entry.source)
  const result = installPackFromFolder(folder, targets)
  if (!result.ok) return { ok: false, answer: result.answer }
  return { ok: true, answer: `${result.pack.name} ${result.pack.version} installed from the index (checksum verified).`, written: result.written, folder: result.folder }
}
