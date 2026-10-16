/**
 * Checkpoints: the file's old self, kept the moment before the engine changes
 * it. The idea is Replit's and Claude Code's (auto-snapshot before a risky
 * write, one way back), built app-side so it holds no matter which engine.
 * One file, one copy, honest names: the epoch the copy was taken, the file it
 * was taken FROM. Restore puts that copy back exactly where it came from.
 */
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join, basename } from 'node:path'

export type Checkpoint = {
  /** Where the file lives in the workspace. */
  original: string
  /** The kept copy inside the checkpoints folder; empty for a ghost. */
  copy: string
  /** When it was kept, as the owner sees it. */
  at: string
  /** False when the file did not exist yet: restoring deletes it. */
  existed?: boolean
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
 * Keep the file's current self. A file that does not exist yet is recorded
 * as a GHOST: nothing to keep, but restoring must delete what the engine
 * created. Returns null only when the path tells nothing at all.
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
    return { original, copy: '', at: new Date(epochMs).toISOString(), existed: false }
  }
  await mkdir(dir, { recursive: true })
  const copy = join(dir, copyName(original, epochMs))
  await writeFile(copy, before)
  return { original, copy, at: new Date(epochMs).toISOString(), existed: true }
}

/** Put a kept copy back, or delete a ghost the engine created. */
export async function restoreCheckpoint(dir: string, copy: string): Promise<{ ok: boolean; answer: string }> {
  const index = await readIndex(dir)
  const ghost = index.find(entry => entry.existed === false && !entry.copy)
  if (!copy && ghost) {
    try {
      await rm(ghost.original, { force: true })
      return { ok: true, answer: `Removed ${ghost.original} (it did not exist before the engine)` }
    } catch (failure) {
      return { ok: false, answer: `Could not remove: ${(failure as Error).message}` }
    }
  }
  const inside = copy.startsWith(dir)
  if (!inside) return { ok: false, answer: 'That copy is not one of this app\'s checkpoints.' }
  const byCopy = index.find(entry => entry.copy === copy)
  if (!byCopy) return { ok: false, answer: 'That copy has no record of where it came from.' }
  try {
    await copyFile(copy, byCopy.original)
    return { ok: true, answer: `Restored ${byCopy.original}` }
  } catch (failure) {
    return { ok: false, answer: `Could not restore: ${(failure as Error).message}` }
  }
}

/** The checkpoints folder's own little index: one JSON line per copy. */
export type CheckpointRecord = { copy: string; original: string; at: string; existed?: boolean }

async function readIndex(dir: string): Promise<CheckpointRecord[]> {
  try {
    return JSON.parse(await readFile(join(dir, 'index.json'), 'utf8')) as CheckpointRecord[]
  } catch {
    return []
  }
}

export async function writeIndex(dir: string, records: CheckpointRecord[]): Promise<void> {
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'index.json'), JSON.stringify(records.slice(-200), null, 2))
}

/** The latest checkpoints, newest first, capped. Ghosts ride along. */
export async function listCheckpoints(dir: string, cap = 20): Promise<CheckpointRecord[]> {
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
