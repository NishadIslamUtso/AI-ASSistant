/**
 * The app's own settings, in one small JSON file beside the app's data.
 *
 * Small on purpose: this file holds only what has to be known *before* the
 * interface exists — where the vault is — and nothing else. Preferences that only
 * the interface cares about stay in the interface, so this remains something a
 * person can open and read without a manual.
 *
 * The reader never throws. An unreadable or damaged file means "nothing chosen
 * yet", because a lost preference must never cost somebody a launch.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export type AppSettings = {
  /**
   * The vault the user chose. Empty means "work it out from the checkout and the
   * environment", which is what a fresh install or a fresh clone does.
   */
  vaultPath: string
}

export const EMPTY_SETTINGS: AppSettings = { vaultPath: '' }

export function readSettings(file: string): AppSettings {
  try {
    if (!existsSync(file)) return { ...EMPTY_SETTINGS }
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
    return {
      vaultPath:
        typeof parsed.vaultPath === 'string' && parsed.vaultPath.length <= 4096 ? parsed.vaultPath : '',
    }
  } catch {
    return { ...EMPTY_SETTINGS }
  }
}

export function writeSettings(file: string, settings: AppSettings): AppSettings {
  const clean: AppSettings = {
    vaultPath: typeof settings.vaultPath === 'string' ? settings.vaultPath.trim().slice(0, 4096) : '',
  }
  mkdirSync(dirname(file), { recursive: true })
  // Write beside the file and rename over it: a crash mid-write cannot leave a
  // half-written settings file for the next launch to guess at.
  const temporary = `${file}.tmp`
  writeFileSync(temporary, `${JSON.stringify(clean, null, 2)}\n`, 'utf8')
  renameSync(temporary, file)
  return clean
}

/**
 * Why this folder cannot be used as a vault — or '' when it can.
 *
 * It only ever *reads*: no folder is created here. Pointing the app at a folder
 * is the user's decision, and quietly making one for them is how somebody ends up
 * with a second, empty vault and no idea which one their notes went into.
 */
export function folderProblem(folder: string): string {
  const value = String(folder || '').trim()
  if (!value) return 'Choose a folder first.'
  if (!existsSync(value)) return 'That folder is not there. Nothing was created for you.'
  try {
    if (!statSync(value).isDirectory()) return 'That path is a file, not a folder.'
  } catch {
    return 'That folder could not be read.'
  }
  return ''
}
