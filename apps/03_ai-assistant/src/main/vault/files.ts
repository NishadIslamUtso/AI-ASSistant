/**
 * The vault on disk. Every read and write in this app goes through here, so the
 * rules about where a file may live are in exactly one place.
 *
 * Three rules, and each one has a test behind it:
 *
 * - Nothing outside the vault root, ever. A path that escapes is refused, not
 *   clamped into place — "it worked but wrote somewhere else" is worse than an
 *   error.
 * - A symlink that leads out of the vault is refused before anything is written,
 *   including a symlink on a directory that does not exist yet.
 * - A source file is written once. Captures are evidence, so a re-capture
 *   deduplicates instead of overwriting history.
 */
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs'
import { dirname, resolve, sep } from 'node:path'
import { InputError } from './errors'
import { dhakaParts } from './text'

export function createVaultFiles(root: string, clock: () => Date) {
  const realRoot = realpathSync(root)

  function filePath(relative: string): string {
    const full = resolve(root, relative)
    if (!full.startsWith(root + sep)) throw new InputError('Path outside vault.')
    return full
  }

  function ensureDirectory(relative: string): string {
    const full = filePath(relative)
    let ancestor = full
    while (!existsSync(ancestor)) ancestor = dirname(ancestor)
    const existingReal = realpathSync(ancestor)
    if (existingReal !== realRoot && !existingReal.startsWith(realRoot + sep)) {
      throw new InputError('Symlink outside vault.')
    }
    mkdirSync(full, { recursive: true })
    const real = realpathSync(full)
    if (!real.startsWith(realRoot + sep)) throw new InputError('Symlink outside vault.')
    return full
  }

  function read(relative: string): string {
    const full = filePath(relative)
    if (!existsSync(full)) return ''
    const real = realpathSync(full)
    if (!real.startsWith(realRoot + sep)) throw new InputError('Symlink outside vault.')
    return readFileSync(full, 'utf8')
  }

  /** Write a file only if it is not there yet. Returns true when it already was. */
  function writeOnce(relative: string, content: string | Uint8Array): boolean {
    ensureDirectory(dirname(relative))
    const full = filePath(relative)
    try {
      writeFileSync(full, content, { flag: 'wx' })
      return false
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') return true
      throw error
    }
  }

  function append(relative: string, text: string): void {
    ensureDirectory(dirname(relative))
    const full = filePath(relative)
    if (existsSync(full) && !realpathSync(full).startsWith(realRoot + sep)) {
      throw new InputError('Symlink outside vault.')
    }
    appendFileSync(full, text)
  }

  function write(relative: string, text: string): void {
    ensureDirectory(dirname(relative))
    const full = filePath(relative)
    if (existsSync(full) && !realpathSync(full).startsWith(realRoot + sep)) {
      throw new InputError('Symlink outside vault.')
    }
    writeFileSync(full, text, 'utf8')
  }

  /** The plain-language log of what the app did, in the vault, on the user's side. */
  function activity(message: string): void {
    const now = clock()
    const { year, month } = dhakaParts(now)
    append(
      `09 Activity & Undo/${year}/${month}.md`,
      `- [${now.toISOString()}] ${message.replace(/\r?\n/g, ' ')}\n`
    )
  }

  /** How many files the vault holds, for the status line. Unreadable parts are skipped. */
  function countFiles(): number {
    let files = 0
    const walk = (directory: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue
        const full = resolve(directory, entry.name)
        if (entry.isDirectory()) walk(full)
        else files += 1
      }
    }
    try {
      walk(root)
    } catch {
      /* Partially unreadable vault: report what counted rather than nothing. */
    }
    return files
  }

  /** Markdown file names in one folder, for the entity library. */
  function listMarkdown(relative: string): string[] {
    const directory = filePath(relative)
    if (!existsSync(directory)) return []
    return readdirSync(directory).filter(file => file.endsWith('.md'))
  }

  return { root, filePath, ensureDirectory, read, writeOnce, write, append, activity, countFiles, listMarkdown }
}

export type VaultFiles = ReturnType<typeof createVaultFiles>
