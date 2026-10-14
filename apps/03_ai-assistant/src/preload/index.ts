import { contextBridge, ipcRenderer } from 'electron'
import type {
  CloudModelsAnswer,
  CloudTestAnswer,
  CloudView,
} from '../shared/lib/providers'
import type { Permissions } from '../shared/lib/permissions'
import type {
  AdoptInput,
  ItemAnswer,
  ListAnswer,
  ReadAnswer,
  RemoveAnswer,
  SaveInput,
} from '../main/artifacts/store'

/**
 * The only bridge between the window and the machine.
 *
 * Every API added here gets an explicit, narrow shape: no raw `ipcRenderer`, so
 * the renderer can only call the functions named below and never an arbitrary
 * channel. Each one returns a value or a plain sentence — nothing here throws at
 * the interface, because a failed folder choice is not an exception, it is an
 * answer.
 */
const api = {
  app: {
    /** Which build is running. Used by the About panel and bug reports. */
    version: process.env['npm_package_version'] ?? '0.1.0',
    platform: process.platform,
  },
  settings: {
    /** What the app has been told to do, as the main process holds it. */
    read: (): Promise<{
      vaultPath: string
      cloud: { baseUrl: string; model: string }
      permissions: Permissions
    }> => ipcRenderer.invoke('settings:read'),
    /**
     * Save a change. The main process decides whether it is possible and says
     * what happened; the renderer is told the result rather than assuming one.
     */
    update: (
      patch: { vaultPath?: string; cloud?: { baseUrl?: string; model?: string }; permissions?: Permissions }
    ): Promise<{
      ok: boolean
      error?: string
      settings?: { vaultPath: string; cloud: { baseUrl: string; model: string }; permissions: Permissions }
      status?: { ok: boolean; available: boolean; vault: string; error?: string; counts?: { files: number; entities: number } }
    }> => ipcRenderer.invoke('settings:update', patch),
  },
  /**
   * Online providers. The key is handed over once and never comes back: what the
   * interface can ask is which providers are enabled, which models they offer,
   * and whether one of them answers — never the key itself.
   */
  cloud: {
    /** The providers and whether a key is saved for each. Never the key. */
    providers: (): Promise<CloudView> => ipcRenderer.invoke('cloud:providers'),
    /** Every model the saved keys can reach, with each provider's own problem. */
    models: (): Promise<CloudModelsAnswer> => ipcRenderer.invoke('cloud:models'),
    /** Save a key. It is sealed by the machine's keychain, or held for this run. */
    saveKey: (id: string, key: string): Promise<CloudView> =>
      ipcRenderer.invoke('cloud:save-key', id, key),
    /** Take a key away. Nothing else about that provider is touched. */
    clearKey: (id: string): Promise<CloudView> => ipcRenderer.invoke('cloud:clear-key', id),
    /** Ask one provider for its model list, which is what the Test button does. */
    test: (id: string): Promise<CloudTestAnswer> => ipcRenderer.invoke('cloud:test', id),
  },
  vault: {
    /** The operating system's folder picker. null when the person closed it. */
    chooseFolder: (): Promise<string | null> => ipcRenderer.invoke('vault:choose-folder'),
  },
  extension: {
    /**
     * Whether the browser extension can reach this app, and at what address. A
     * port that is open is a fact the interface shows rather than something to
     * discover from an extension that quietly stopped working.
     */
    status: (): Promise<{ ok: boolean; listening: boolean; port: number; url: string; error: string }> =>
      ipcRenderer.invoke('extension:status'),
  },
  /**
   * The artifact library, on disk in this user's own app-data folder.
   *
   * Every call answers rather than throws: a library that cannot be read says
   * so in a sentence the screen can show, because an exception here would be a
   * blank grid with no explanation.
   */
  artifacts: {
    list: (): Promise<ListAnswer> => ipcRenderer.invoke('artifacts:list'),
    /** One document. `version` is 1-based, the number the chips show. */
    read: (id: string, version?: number): Promise<ReadAnswer> => ipcRenderer.invoke('artifacts:read', id, version),
    /** Create, or append a version to an existing artifact. */
    save: (input: SaveInput): Promise<ItemAnswer> => ipcRenderer.invoke('artifacts:save', input),
    rename: (id: string, title: string): Promise<ItemAnswer> => ipcRenderer.invoke('artifacts:rename', id, title),
    duplicate: (id: string): Promise<ItemAnswer> => ipcRenderer.invoke('artifacts:duplicate', id),
    /** Put an older version back — by appending it, never by truncating. */
    restore: (id: string, version: number): Promise<ItemAnswer> => ipcRenderer.invoke('artifacts:restore', id, version),
    /** Take it out of the library; the folder moves to the library's trash. */
    remove: (id: string): Promise<RemoveAnswer> => ipcRenderer.invoke('artifacts:remove', id),
    /** Write artifacts found in saved conversations in, once each. */
    adopt: (records: AdoptInput[]): Promise<{ ok: true; adopted: number; skipped: number; refused: number }> =>
      ipcRenderer.invoke('artifacts:adopt', records),
    /** The operating system's file picker, for a page or a drawing to bring in. */
    import: (): Promise<{ ok: boolean; item?: unknown; error?: string; canceled?: boolean }> =>
      ipcRenderer.invoke('artifacts:import'),
  },
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
