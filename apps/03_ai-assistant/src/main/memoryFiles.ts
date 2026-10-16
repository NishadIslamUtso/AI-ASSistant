/**
 * The memory folder's reader: what the engine wrote, listed for the owner.
 * Reads only inside the vault's memory folder — the path is validated
 * against tricks before anything opens — and deletes are exactly one file,
 * never a glob.
 */
import { readFile, readdir, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { MEMORY_DIR, MEMORY_READ_CAP, safeMemoryRelative, type MemoryFile } from '../shared/lib/memory'

export type MemoryListAnswer = {
  ok: boolean
  answer?: string
  folder?: string
  files?: MemoryFile[]
}

export function createMemoryManager(vaultRoot: () => string) {
  const folder = (): string => join(vaultRoot(), MEMORY_DIR)

  const list = async (): Promise<MemoryListAnswer> => {
    let names: string[]
    try {
      names = (await readdir(folder())).filter(entry => entry.endsWith('.md')).sort()
    } catch {
      // No folder yet: the engine has remembered nothing. That is honest.
      return { ok: true, folder: folder(), files: [] }
    }
    const files: MemoryFile[] = []
    for (const name of names) {
      const full = join(folder(), name)
      try {
        const info = await stat(full)
        const raw = await readFile(full, 'utf8')
        files.push({
          name,
          path: `${MEMORY_DIR}/${name}`,
          updated: info.mtime.toISOString(),
          content: raw.length > MEMORY_READ_CAP ? raw.slice(0, MEMORY_READ_CAP) : raw,
          clipped: raw.length > MEMORY_READ_CAP,
        })
      } catch {
        continue
      }
    }
    return { ok: true, folder: folder(), files }
  }

  const remove = async (name: string): Promise<{ ok: boolean; answer: string }> => {
    const checked = safeMemoryRelative(name)
    if (!checked.ok) return checked
    try {
      await rm(join(vaultRoot(), checked.rel), { force: false })
      return { ok: true, answer: `Removed ${checked.rel}. The lines are gone; nothing was kept in secret.` }
    } catch (failure) {
      const code = (failure as NodeJS.ErrnoException).code
      if (code === 'ENOENT') return { ok: false, answer: 'That memory file does not exist.' }
      return { ok: false, answer: `Could not remove: ${(failure as Error).message}` }
    }
  }

  const read = async (name: string): Promise<{ ok: boolean; content?: string; answer?: string }> => {
    const checked = safeMemoryRelative(name)
    if (!checked.ok) return checked
    try {
      return { ok: true, content: await readFile(join(vaultRoot(), checked.rel), 'utf8') }
    } catch (failure) {
      const code = (failure as NodeJS.ErrnoException).code
      if (code === 'ENOENT') return { ok: false, answer: 'That memory file does not exist yet.' }
      return { ok: false, answer: `Could not read: ${(failure as Error).message}` }
    }
  }

  return { list, remove, read }
}

export type MemoryManager = ReturnType<typeof createMemoryManager>
