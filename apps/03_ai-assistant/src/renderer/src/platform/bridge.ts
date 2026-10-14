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
 *      model output — it returns empty, or a sentence saying what is missing,
 *      so the UI's own empty state is what the person sees.
 */
import type { CloudModelsAnswer, CloudTestAnswer, CloudView } from '@shared/lib/providers'

/** What the preload script exposes today. It grows as the main process does. */
export type DesktopBridge = {
  app: {
    version: string
    platform: string
  }
  settings: {
    /** What the app has been told to do. */
    read: () => Promise<{ vaultPath: string; cloud: { baseUrl: string; model: string } }>
    /** Save a change; the main process decides and reports what happened. */
    update: (patch: { vaultPath?: string; cloud?: { baseUrl?: string; model?: string } }) => Promise<{
      ok: boolean
      error?: string
      settings?: { vaultPath: string; cloud?: { baseUrl: string; model: string } }
      status?: {
        ok: boolean
        available: boolean
        vault: string
        error?: string
        counts?: { files: number; entities: number }
      }
    }>
  }
  vault: {
    /** The operating system's folder picker. null when the person closed it. */
    chooseFolder: () => Promise<string | null>
  }
  /** Whether the browser extension can reach this app, and where. */
  extension: {
    status: () => Promise<{ ok: boolean; listening: boolean; port: number; url: string; error: string }>
  }
  /**
   * Online providers. In the desktop app these are questions for the main
   * process, which holds the keys; the interface is never handed one.
   */
  cloud: {
    /** The providers and whether a key is saved for each. Never the key. */
    providers: () => Promise<CloudView>
    /** Every model the saved keys can reach, with each provider's own problem. */
    models: () => Promise<CloudModelsAnswer>
    saveKey: (id: string, key: string) => Promise<CloudView>
    clearKey: (id: string) => Promise<CloudView>
    test: (id: string) => Promise<CloudTestAnswer>
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

/** Empty, and honest about it. See rule 2 above. */
const demoBridge: DesktopBridge = {
  app: { version: 'web preview', platform: 'web' },
  settings: {
    read: async () => ({ vaultPath: '', cloud: { baseUrl: '', model: '' } }),
    update: async () => ({
      ok: false,
      error: 'Settings are part of the desktop app. This window is the interface only, so there is no folder to change.',
    }),
  },
  vault: { chooseFolder: async () => null },
  // No socket is open here, and none can be: this is a page, not the app.
  extension: {
    status: async () => ({
      ok: false,
      listening: false,
      port: 8765,
      url: 'http://127.0.0.1:8765',
      error: 'The port the browser extension posts to belongs to the desktop app, not to this window.',
    }),
  },
  /**
   * No keychain, no main process, no key: every answer says that rather than
   * pretending a provider was reached.
   */
  cloud: {
    providers: async (): Promise<CloudView> => ({
      ok: false,
      error: 'Keys are kept by the machine’s own keychain, in the desktop app.',
      encryption: 'none',
      providers: [],
    }),
    models: async (): Promise<CloudModelsAnswer> => ({
      ok: false,
      error: 'There is no main process behind this window, so no provider can be asked for its models.',
      models: [],
      problems: [],
    }),
    saveKey: async (): Promise<CloudView> => ({
      ok: false,
      error: 'A key is kept by the desktop app, where the keychain is.',
      encryption: 'none',
      providers: [],
    }),
    clearKey: async (): Promise<CloudView> => ({
      ok: false,
      error: 'There is no saved key in this window.',
      encryption: 'none',
      providers: [],
    }),
    test: async (): Promise<CloudTestAnswer> => ({
      ok: false,
      error: 'Testing a key needs the desktop app: this window is the interface only.',
    }),
  },
}

export const bridge: DesktopBridge = hasDesktopBridge() ? (window.api as DesktopBridge) : demoBridge

/** True in the browser preview, where there is no main process behind the UI. */
export const isDemo = !hasDesktopBridge()
