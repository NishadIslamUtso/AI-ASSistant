/**
 * Bringing a brain home, the app's way.
 *
 * His decision (2026-10-16): the trio is downloaded INSIDE the app, into
 * locations under the app's control — never bundled in the installer, never
 * scattered machine-wide by us. Every endpoint here is OFFICIAL and exact;
 * a URL that is not on this list is refused by code, not by promise. Google
 * has no stable, verifiable direct endpoint for agy yet, so agy honestly
 * links its official page instead of pretending — that refusal is data too.
 */

export type EngineDownloadKind = 'zip' | 'installer-script' | 'page'

export type EngineDownloadInfo = {
  /** The exact official endpoint for Windows, the machine he runs. */
  windows: string
  kind: EngineDownloadKind
  /** The only host a download for this engine may come from. */
  host: string
  /** What the card says before any byte moves. */
  note: string
  /** For kind 'page': the official page to open by hand. */
  page?: string
}

export const ENGINE_DOWNLOADS: Record<string, EngineDownloadInfo | undefined> = {
  'claude-code': {
    windows: 'https://claude.ai/install.ps1',
    kind: 'installer-script',
    host: 'claude.ai',
    note: 'Anthropic\u2019s own native installer script. Needs no Node. The app stages it, and running it is a separate permission.',
  },
  ollama: {
    windows: 'https://ollama.com/download/ollama-windows-amd64.zip',
    kind: 'zip',
    host: 'ollama.com',
    note: 'The headless runtime only, from ollama.com\u2019s own zip. No desktop app, no tray, nothing autostarts: start and stop it right here — or run your own Ollama and leave this staged copy alone.',
  },
  agy: {
    windows: '',
    kind: 'page',
    host: 'antigravity.google',
    page: 'https://antigravity.google',
    note: 'Google\u2019s official page (the CLI is the thing, not the IDE). On macOS/Linux the official installer is antigravity.google/cli/install.sh — verified live; on Windows the page points at the official installer. Never an invented URL.',
  },
}

/** True only for the exact official https URL of this engine. */
export function isOfficialUrl(engine: string, url: string): boolean {
  const info = ENGINE_DOWNLOADS[engine]
  if (!info) return false
  if (info.kind === 'page') return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.host === info.host && parsed.href === info.windows
  } catch {
    return false
  }
}

/** Nothing gets bigger than this without an honest refusal (Ollama's zip is far smaller). */
export const MAX_DOWNLOAD_BYTES = 400 * 1024 * 1024

/** Pull a 64-hex digest out of a published checksum file, if one is there. */
export function parseShaLine(text: string): string {
  const match = /\b([a-f0-9]{64})\b/.exec(text ?? '')
  return match ? match[1] : ''
}

/** Where the app keeps what it brought home. One folder per engine, app-owned. */
export function enginesRoot(base: string): string {
  return `${base}/engines`
}
