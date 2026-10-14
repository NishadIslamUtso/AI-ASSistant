/**
 * The one place the interface talks to the machine.
 *
 * In the desktop app, `window.api` is put there by the preload script, and every
 * method on it is a bridge to the main process — files, the vault, the models,
 * shell access. In a browser there is no preload script, so `window.api` is
 * simply absent, and that is the case this file exists for: the web preview
 * (see vite.web.config.ts) must render the real interface rather than a blank
 * page or a stack trace.
 *
 * Two rules, both taken straight from the project's no-warnings rule:
 *
 *   1. Nothing here throws at import time or at call time. Every method
 *      resolves. A capability that is missing is a value the UI can show as
 *      "not available here", never an exception in the console.
 *   2. Nothing here pretends to be real. `isDemo` is true in the browser, and
 *      the demo layer never returns invented vault contents, chat history or
 *      model output — it returns empty, so the UI's own empty state is what the
 *      person sees.
 */

/** What the preload script exposes today. It grows as the main process does. */
export type DesktopBridge = {
  app: {
    version: string
    platform: string
  }
}

declare global {
  interface Window {
    api?: DesktopBridge
  }
}

/**
 * True when the app is running inside the desktop shell. The interface uses this
 * to decide whether to offer things that need the machine at all.
 */
export const hasDesktopBridge = (): boolean =>
  typeof window !== 'undefined' && typeof window.api === 'object' && window.api !== null

/** Empty, not invented. See rule 2 above. */
const demoBridge: DesktopBridge = {
  app: { version: 'web preview', platform: 'web' },
}

export const bridge: DesktopBridge = hasDesktopBridge()
  ? (window.api as DesktopBridge)
  : demoBridge

/** True in the browser preview, where there is no main process behind the UI. */
export const isDemo = !hasDesktopBridge()
