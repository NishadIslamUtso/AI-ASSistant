/**
 * One door, checked twice.
 *
 * The renderer is our own build, but a renderer cannot be trusted to STAY
 * ours: a clicked citation link, a bad artifact, a future bug — any of them
 * can point the window somewhere else. Electron runs the preload again for
 * the new page, which would hand the app's whole IPC surface to whatever
 * origin the window landed on. So the surface travels with a lock: every
 * handler registered through this module refuses any caller whose page is
 * not one the app itself loaded.
 */
import { ipcMain, shell, type IpcMainInvokeEvent, type WebContents } from 'electron'

type Listener = (event: IpcMainInvokeEvent, ...args: never[]) => unknown

let ownOrigins: RegExp | null = null

const escapeRe = (u: string): string => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Pin the only page origins IPC may ever come from. Called when the windows
 * are created, with every URL the app itself loads; `file:` is always ours.
 */
export function pinOwnOrigins(urls: Array<string | undefined | null>): void {
  const parts = urls
    .filter((u): u is string => typeof u === 'string' && u.length > 0)
    .map(escapeRe)
  parts.push('file:')
  ownOrigins = new RegExp(`^(?:${parts.join('|')})`)
}

/**
 * ipcMain.handle, but every caller is checked. Registering a handler any
 * other way is a review finding, not a style choice.
 */
export function handle(channel: string, listener: Listener): void {
  ipcMain.handle(channel, (event, ...args) => {
    const url: string = event.senderFrame?.url ?? ''
    if (ownOrigins && !ownOrigins.test(url)) {
      throw new Error(`OddBrain refused "${channel}" from a page it did not load (${url || 'no url'}).`)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (listener as (event: IpcMainInvokeEvent, ...args: any[]) => unknown)(event, ...(args as never[]))
  })
}

/** True when the URL may open in the person's real browser: plain web links. */
export function safeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * Navigation lockdown for an app window: pages the app loaded may load again;
 * anything else is bounced to the real browser when it is a plain web link
 * and refused when it is not. A citation link can therefore never walk the
 * app window off its own origin — it opens in the browser, where it belonged.
 */
export function lockNavigation(contents: WebContents): void {
  contents.setWindowOpenHandler(({ url }) => {
    if (safeExternalUrl(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  contents.on('will-navigate', (event, url) => {
    if (ownOrigins?.test(url)) return
    event.preventDefault()
    if (safeExternalUrl(url)) void shell.openExternal(url)
  })
}
