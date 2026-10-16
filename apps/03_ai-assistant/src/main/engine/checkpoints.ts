/**
 * Checkpoints: the file's old self, kept the moment before the engine changes
 * it. The idea is Replit's and Claude Code's (auto-snapshot before a risky
 * write, one way back), built app-side so it holds no matter which engine.
 * One file, one copy, honest names: the epoch the copy was taken, the file it
 * was taken FROM. Restore puts that copy back exactly where it came from.
 */
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, basename } from 'node:path'

export type Checkpoint = {
  /** Where the file lives in the workspace. */
  original: string
  /** The kept copy inside the checkpoints folder. */
  copy: string
  /** When it was kept, as the owner sees it. */
  at: string
}

/** The file tools whose Allow is worth a checkpoint. Bash never gets one: a
 *  command can touch anything, and pretending otherwise would lie. */
const CHECKPOINT_TOOLS = new Set(['Write', 'Edit', 'NotebookEdit', 'MultiEdit'])

export function checkpointWorthTaking(tool: string): boolean {
  return CHECKPOINT_TOOLS.has(tool)
}

/** The name a copy carries: epoch, a short hash of the path, the basename. */
export function copyName(original: string, epochMs: number): string {
  const safe = basename(original).replace(/[^A-Za-z0-9._-]/g, '_').slice(-60)
  return `${epochMs}-${safe}`
}

/**
 * Keep the file's current self. A file that does not exist yet has nothing to
 * keep (a delete-on-restore is v2, recorded honestly in the ledger).
 * Returns the checkpoint, or null when there was nothing to keep.
 */
export async function snapshotFile(
  dir: string,
  original: string,
  epochMs = Date.now(),
): Promise<Checkpoint | null> {
  let before: Buffer
  try {
    before = await readFile(original)
  } catch {
    return null
  }
  await mkdir(dir, { recursive: true })
  const copy = join(dir, copyName(original, epochMs))
  await writeFile(copy, before)
  return { original, copy, at: new Date(epochMs).toISOString() }
}

/** Put a kept copy back. The copy must live in the checkpoints folder. */
export async function restoreCheckpoint(dir: string, copy: string): Promise<{ ok: boolean; answer: string }> {
  const inside = copy.startsWith(dir)
  if (!inside) return { ok: false, answer: 'That copy is not one of this app\'s checkpoints.' }
  // The original path rides beside the copy in the index; restoring without
  // it would guess. Refusals name the reason.
  const index = await readIndex(dir)
  const record = index.find(entry => entry.copy === copy)
  if (!record) return { ok: false, answer: 'That copy has no record of where it came from.' }
  try {
    await copyFile(copy, record.original)
    return { ok: true, answer: `Restored ${record.original}` }
  } catch (failure) {
    return { ok: false, answer: `Could not restore: ${(failure as Error).message}` }
  }
}

/** The checkpoints folder's own little index: one JSON line per copy. */
async function readIndex(dir: string): Promise<Array<{ copy: string; original: string; at: string }>> {
  try {
    return JSON.parse(await readFile(join(dir, 'index.json'), 'utf8')) as Array<{ copy: string; original: string; at: string }>
  } catch {
    return []
  }
}

export async function writeIndex(dir: string, records: Array<{ copy: string; original: string; at: string }>): Promise<void> {
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'index.json'), JSON.stringify(records.slice(-200), null, 2))
}

/** The latest checkpoints, newest first, capped. */
export async function listCheckpoints(dir: string, cap = 20): Promise<Array<{ copy: string; original: string; at: string }>> {
  const records = await readIndex(dir)
  const known = new Set(await readdir(dir).catch(() => [] as string[]))
  return records
    .filter(record => known.has(record.copy.split(/[\\/]/).pop() ?? ''))
    .reverse()
    .slice(0, cap)
}

/** Keep the file's self AND remember it, in one call. */
export async function takeCheckpoint(dir: string, original: string, epochMs = Date.now()): Promise<Checkpoint | null> {
  const kept = await snapshotFile(dir, original, epochMs)
  if (kept) await rememberCheckpoint(dir, kept)
  return kept
}

/**
 * Remember a snapshot in the folder's index: append, newest last, never
 * losing older records even when the write races a restart.
 */
export async function rememberCheckpoint(dir: string, record: Checkpoint): Promise<void> {
  const records = await readIndex(dir)
  records.push(record)
  await writeIndex(dir, records)
}
