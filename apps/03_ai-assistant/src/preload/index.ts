import { contextBridge } from 'electron'

/**
 * The only bridge between the window and the machine.
 *
 * Nothing is exposed yet on purpose — phase 0 is a shell. Every API added here
 * gets an explicit, narrow shape: no raw `ipcRenderer`, so the renderer can only
 * call the functions we name, never an arbitrary channel.
 */
const api = {
  app: {
    /** Which build is running. Used by the About panel and bug reports. */
    version: process.env['npm_package_version'] ?? '0.1.0',
    platform: process.platform,
  },
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
