import { contextBridge, ipcRenderer } from 'electron'
import type {
  CloudModelsAnswer,
  CloudTestAnswer,
  CloudView,
} from '../shared/lib/providers'
import type { Permissions } from '../shared/lib/permissions'
import type { ApprovalMode, EngineAvailability, EngineEvent, EngineId, EngineModelEntry, EngineSettings } from '../shared/lib/engine'
import type { HouseRules } from '../shared/lib/houseRules'
import type { Project } from '../shared/lib/projects'
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
/** The engine, exactly as the window may touch it: ask, task, answer, watch. */
const engineApi = {
  /** The chosen engine, whether it is working, and what it last said. */
  read: (): Promise<{ engine: EngineSettings; running: boolean; history: EngineEvent[] }> =>
    ipcRenderer.invoke('engine:read'),
  /** Choose which engine thinks inside the app. */
  pick: (id: EngineId): Promise<{ ok: boolean; answer: string }> => ipcRenderer.invoke('engine:pick', id),
  /** The brains this engine can use, as its own door reports them. */
  models: (): Promise<{ ok: boolean; models: EngineModelEntry[]; error?: string }> =>
    ipcRenderer.invoke('engine:models'),
  /** What engines are really installed on this machine. */
  detect: (): Promise<EngineAvailability[]> => ipcRenderer.invoke('engine:detect'),
  /** Bring a brain home; progress arrives through onPullEvent. */
  pull: (name: string): Promise<{ ok: boolean; answer: string }> => ipcRenderer.invoke('engine:pull', name),
  /** Take a brain off this machine. */
  deleteModel: (name: string): Promise<{ ok: boolean; answer: string }> =>
    ipcRenderer.invoke('engine:model-delete', name),
  /** The rulebook, as it stands (blanks already filled from the defaults). */
  readHouseRules: (): Promise<{ rules: HouseRules; defaults: HouseRules }> =>
    ipcRenderer.invoke('houserules:read'),
  /** Save the rulebook and deploy it to every engine's global file. */
  writeHouseRules: (rules: HouseRules): Promise<{ ok: boolean; written: string[] }> =>
    ipcRenderer.invoke('houserules:write', rules),
  /** Pull progress ticks, in the same shape `parsePullLine` produces. */
  onPullEvent: (listener: (tick: unknown) => void): (() => void) => {
    const channel = 'engine:pull-event'
    const wrapped = (_event: unknown, tick: unknown): void => listener(tick)
    ipcRenderer.on(channel, wrapped)
    return () => ipcRenderer.removeListener(channel, wrapped)
  },
  /** Pick which brain the engine thinks with. */
  setModel: (model: string): Promise<{ ok: boolean; answer: string }> =>
    ipcRenderer.invoke('engine:model', model),
  /** Set the throttle: how much the engine may do before asking. */
  setApproval: (mode: ApprovalMode): Promise<{ ok: boolean; answer: string }> =>
    ipcRenderer.invoke('engine:approval', mode),
  /** "Open a folder": choose where the engine works. */
  pickWorkspace: (): Promise<{ ok: boolean; answer: string }> =>
    ipcRenderer.invoke('engine:pick-workspace'),
  /** Hand the engine a task. Events arrive through `onEvent` from then on. */
  send: (prompt: string, cwd: string): Promise<{ ok: boolean; answer: string }> =>
    ipcRenderer.invoke('engine:send', prompt, cwd),
  /** Answer one of the engine's permission cards. */
  answer: (requestId: string, allow: boolean): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke('engine:answer', requestId, allow),
  /** Make the engine stop. */
  stop: (): Promise<{ ok: boolean }> => ipcRenderer.invoke('engine:stop'),
  /** Watch the engine live. Returns the unsubscribe function. */
  onEvent: (listener: (event: EngineEvent) => void): (() => void) => {
    const channel = (_outer: unknown, event: EngineEvent): void => listener(event)
    ipcRenderer.on('engine:event', channel)
    return () => ipcRenderer.removeListener('engine:event', channel)
  },
}

const api = {
  app: {
    /** Which build is running. Used by the About panel and bug reports. */
    version: process.env['npm_package_version'] ?? '0.1.0',
    platform: process.platform,
    /** Open the vault folder in the file manager — the owner's own folder. */
    openVaultFolder: (): Promise<{ ok: boolean }> => ipcRenderer.invoke('vault:open-folder'),
    /** Open a https://github.com link in the person's browser. */
    openExternal: (url: string): Promise<{ ok: boolean }> => ipcRenderer.invoke('app:open-external', url),
    /** The native menu talks to the window through these channels. */
    onMenu: (channel: string, callback: () => void): (() => void) => {
      const listener = (): void => callback()
      ipcRenderer.on(String(channel), listener)
      return () => ipcRenderer.removeListener(String(channel), listener)
    },
  },
  projects: {
    read: (): Promise<Project[]> => ipcRenderer.invoke('projects:read'),
    write: (projects: Project[]): Promise<{ ok: boolean; projects: Project[] }> =>
      ipcRenderer.invoke('projects:write', projects),
    blank: (name: string): Promise<Project> => ipcRenderer.invoke('projects:new', name),
  },
  engine: {
    setWorkspace: (folder: string): Promise<{ ok: boolean; answer: string }> =>
      ipcRenderer.invoke('engine:workspace-set', folder),
    sessions: (): Promise<Array<{ workspace: string; sessionId: string }>> => ipcRenderer.invoke('engine:sessions'),
    forgetSession: (workspace: string): Promise<{ ok: boolean }> => ipcRenderer.invoke('engine:sessions-forget', workspace),
    openFolder: (folder: string): Promise<{ ok: boolean }> => ipcRenderer.invoke('app:open-folder', folder),
  },
  houseRules: {
    read: (): Promise<{ rules: HouseRules; defaults: HouseRules }> => ipcRenderer.invoke('houserules:read'),
    write: (rules: HouseRules): Promise<{ ok: boolean; written: string[] }> =>
      ipcRenderer.invoke('houserules:write', rules),
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
  skills: {
    /** Install one skill from the app's own catalog, into every engine. */
    installCatalog: (name: string): Promise<{ ok: boolean; answer: string; written?: string[] }> =>
      ipcRenderer.invoke('skills:install-catalog', name),
  },
  mcp: {
    /** The one MCP server list, and which engine configs it was deployed to. */
    read: (): Promise<{ servers: Array<{ name: string; command?: string; args?: string[]; url?: string }> }> =>
      ipcRenderer.invoke('mcp:read'),
    write: (
      servers: Array<{ name: string; command?: string; args?: string[]; url?: string }>,
    ): Promise<{ ok: boolean; written: string[] }> => ipcRenderer.invoke('mcp:write', { servers }),
  },
  vault: {
    /** The operating system's folder picker. null when the person closed it. */
    chooseFolder: (): Promise<string | null> => ipcRenderer.invoke('vault:choose-folder'),
    /** A finished turn, written into the vault as a handoff document. */
    saveHandoff: (name: string, markdown: string): Promise<{ ok: boolean; answer: string }> =>
      ipcRenderer.invoke('vault:save-handoff', { name, markdown }),
    /** A timestamped portable copy of the vault, written to the exports folder. */
    exportCopy: (): Promise<{ ok: boolean; answer: string }> => ipcRenderer.invoke('vault:export-copy'),
    /** The open conversation, captured into the vault as a capsule. */
    captureChat: (title: string, markdown: string): Promise<{ ok: boolean; answer: string }> =>
      ipcRenderer.invoke('vault:capture-chat', { title, markdown }),
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
contextBridge.exposeInMainWorld('engineApi', engineApi)

export type Api = typeof api
