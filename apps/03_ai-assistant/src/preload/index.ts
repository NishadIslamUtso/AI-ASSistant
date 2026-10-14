import { contextBridge, ipcRenderer } from 'electron'

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
    read: (): Promise<{ vaultPath: string }> => ipcRenderer.invoke('settings:read'),
    /**
     * Save a change. The main process decides whether it is possible and says
     * what happened; the renderer is told the result rather than assuming one.
     */
    update: (
      patch: { vaultPath?: string }
    ): Promise<{
      ok: boolean
      error?: string
      settings?: { vaultPath: string }
      status?: { ok: boolean; available: boolean; vault: string; error?: string; counts?: { files: number; entities: number } }
    }> => ipcRenderer.invoke('settings:update', patch),
  },
  vault: {
    /** The operating system's folder picker. null when the person closed it. */
    chooseFolder: (): Promise<string | null> => ipcRenderer.invoke('vault:choose-folder'),
  },
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
