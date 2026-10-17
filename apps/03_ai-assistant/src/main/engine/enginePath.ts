/**
 * The machine's REAL PATH, for finding the engines.
 *
 * A launched app inherits a slim PATH; the owner's shell knows much more
 * (winget, Chocolatey, scoop, a custom npm prefix, a portable claude.exe).
 * The old fix prepended two guessed Windows folders and hoped. The honest
 * fix, learned from Claude Desktop's shell-path worker: ASK THE SHELL once
 * at startup, merge, cache, and fall back to the old prepend list when the
 * shell cannot be reached. Pure local; nothing leaves the machine.
 */

import { execFile } from 'node:child_process'
import { join } from 'node:path'

/** The folders the app has always prepended — now the FALLBACK, not the whole answer.
 *  (Kept under its old name too: the pinned contract does not move.) */
export const enginePathPrepend = fallbackPrepend

export function fallbackPrepend(platform = process.platform, env = process.env): string[] {
  if (platform === 'win32') {
    const appData = env['APPDATA'] ?? ''
    const userProfile = env['USERPROFILE'] ?? ''
    return [
      appData ? join(appData, 'npm') : '',
      userProfile ? join(userProfile, '.local', 'bin') : '',
    ].filter(Boolean)
  }
  // The platform argument names the dialect: a POSIX entry must be POSIX
  // even when the host joining it is Windows (a backslash inside a POSIX
  // PATH list is not a path, it is a mistake).
  const home = env['HOME'] ?? ''
  return [home ? `${home}/.local/bin` : ''].filter(Boolean)
}

/**
 * Merge PATH entries: the app's folders FIRST (they must shadow whatever a
 * stale machine PATH carries), then the shell's, then the inherited env's —
 * case-insensitively de-duplicated on Windows, exactly on the rest.
 */
export function mergePath(appFolders: readonly string[], shellPath: string, currentPath: string, platform = process.platform): string {
  const sep = platform === 'win32' ? ';' : ':'
  const seen = new Set<string>()
  const parts: string[] = []
  for (const entry of [...appFolders, ...shellPath.split(sep), ...currentPath.split(sep)]) {
    const key = platform === 'win32' ? entry.toLowerCase() : entry
    const trimmed = entry.trim()
    if (!trimmed) continue
    if (seen.has(key)) continue
    seen.add(key)
    parts.push(trimmed)
  }
  return parts.join(sep)
}

export type ShellRunner = (command: string, args: string[], onDone: (error: unknown, stdout: string) => void) => void

const DEFAULT_RUNNER: ShellRunner = (command, args, onDone) => {
  execFile(command, args, { timeout: 4000, windowsHide: true }, (error, stdout) =>
    onDone(error, typeof stdout === 'string' ? stdout : ''),
  )
}

/**
 * Ask the user's own shell what PATH it really has. One probe, 4 s budget,
 * and any failure returns null — the caller falls back, never blocks.
 */
export async function askShellPath(platform = process.platform, env = process.env, runner: ShellRunner = DEFAULT_RUNNER): Promise<string | null> {
  if (platform === 'win32') {
    // The registry truth (Machine + User), not the launched app's slim copy.
    const command = env['SystemRoot'] ? join(env['SystemRoot'], 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe') : 'powershell.exe'
    return new Promise((resolve) => {
      runner(command, ['-NoProfile', '-NonInteractive', '-Command', "[Environment]::GetEnvironmentVariable('PATH','Machine') + ';' + [Environment]::GetEnvironmentVariable('PATH','User')"], (error, stdout) => {
        const text = stdout.trim()
        resolve(!error && text.includes(';') ? text : null)
      })
    })
  }
  const shell = env['SHELL'] || '/bin/bash'
  return new Promise((resolve) => {
    // A login, interactive shell: the one that loads the user's rc files,
    // where nvm/sdk/homebrew exports live. Marker-delimited, so motd noise
    // cannot poison the answer.
    runner(shell, ['-l', '-i', '-c', 'echo "__OB_PATH__$PATH"'], (error, stdout) => {
      const marker = stdout.indexOf('__OB_PATH__')
      if (error || marker === -1) return resolve(null)
      const text = stdout.slice(marker + '__OB_PATH__'.length).trim()
      resolve(text.includes(':') ? text : null)
    })
  })
}

let cached: string | null = null
let cachedAt = 0
const CACHE_MS = 5 * 60_000

/** The PATH the engines spawn with. Resolved once, refreshed every 5 minutes. */
export async function enginePath(platform = process.platform, env = process.env, runner?: ShellRunner): Promise<string> {
  const now = Date.now()
  if (cached && now - cachedAt < CACHE_MS) return cached
  const shell = await askShellPath(platform, env, runner)
  cached = mergePath(fallbackPrepend(platform, env), shell ?? '', env['PATH'] ?? '', platform)
  cachedAt = now
  return cached
}

/** Test seam: forget the cached answer. */
export function resetEnginePathCache(): void {
  cached = null
  cachedAt = 0
}

/**
 * The sync read for spawn sites that must not await: the cached answer when
 * the app warmed it (it warms at boot), the honest fallback otherwise.
 */
export function enginePathSync(platform = process.platform, env = process.env): string {
  return cached ?? mergePath(fallbackPrepend(platform, env), '', env['PATH'] ?? '', platform)
}
