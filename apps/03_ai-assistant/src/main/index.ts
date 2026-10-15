import { app, BrowserWindow, dialog, ipcMain, safeStorage, shell } from 'electron'
import { join } from 'node:path'
import { existsSync, writeFileSync } from 'node:fs'
import { startLocalApi, type LocalApi } from './api/server'
import { DEFAULT_EXTENSION_PORT, startExtensionApi, type ExtensionApi } from './extension/server'
import { createVaultService, resolveVaultRoot } from './vault/service'
import { createKeyStore, type KeyStore } from './cloud/keys'
import { createCloudClient, type CloudClient } from './cloud/client'
import { providerById } from '../shared/lib/providers'
import {
  EMPTY_SETTINGS,
  folderProblem,
  readSettings,
  vaultCandidates,
  writeSettings,
  type AppSettings,
} from './settings'
import { normalizePermissions } from '../shared/lib/permissions'
import { registerArtifactIpc } from './artifacts/ipc'
import { createEngineSocket, type EngineSocket } from './engine/socket'
import { normalizeEngine } from '../shared/lib/engine'
import type { EngineEvent } from '../shared/lib/engine'

/**
 * The main process. Everything that touches the machine lives on this side:
 * files, the vault index, Ollama, the database. The renderer only ever talks to
 * it through the preload bridge, so there is no localhost HTTP and no CORS.
 */

/**
 * The port the browser extension posts to. Fixed, because an extension cannot
 * discover a moving port; overridable for a machine where something else already
 * owns 8765.
 */
function extensionPortWanted(): number {
  const wanted = Number(process.env.AI_ASSISTANT_EXTENSION_PORT || DEFAULT_EXTENSION_PORT)
  return Number.isFinite(wanted) && wanted > 0 && wanted < 65536 ? wanted : DEFAULT_EXTENSION_PORT
}

/**
 * The port the app's own API listens on. Fixed rather than ephemeral only so the
 * Vite dev server's proxy can find it in dev; if it is taken, the app falls back
 * to any free port and says so, because a busy port is not the user's problem.
 */
const API_PORT = Number(process.env.AI_ASSISTANT_API_PORT || 41979)

/**
 * Where the vault is, in order of who decides:
 *
 * 1. the folder the user chose in Settings — the only one that is a decision
 * 2. what the environment asks for, which is how the tests and the browser
 *    preview point at a throwaway vault
 * 3. `vault/AI-Brain` in the checkout, so a fresh clone works with no setup
 * 4. this user's own app data folder, for a packaged build
 *
 * The first path that exists wins. Nothing is ever created — a missing vault is
 * reported by the interface, because replacing the vault somebody meant to point
 * at would be the worst outcome available.
 */
function vaultRoot(): string {
  const checkout = app.isPackaged ? '' : join(app.getAppPath(), '..', '..', 'vault', 'AI-Brain')
  return resolveVaultRoot(
    vaultCandidates({
      chosen: settings.vaultPath,
      env: process.env,
      checkout,
      userData: join(app.getPath('userData'), 'vault'),
    })
  ).root
}

/**
 * The providers, as the interface may see them: a label, where a key comes from,
 * whether one is saved, and whether it is only in this run. The key itself never
 * crosses into the renderer — this process is the only one that holds it.
 */
function cloudView(): {
  ok: boolean
  encryption: 'os' | 'none'
  providers: ReturnType<CloudClient['providers']>
} {
  return {
    ok: true,
    encryption: keyStore?.encryption || 'none',
    providers: cloud?.providers() || [],
  }
}

/**
 * Push an engine event to every open window and remember it, so a window
 * opened mid-turn still sees what happened. Small on purpose: context for a
 * person, not a log file.
 */
function pushEngineEvent(event: EngineEvent): void {
  engineHistory.push(event)
  if (engineHistory.length > 100) engineHistory.shift()
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('engine:event', event)
  }
}

/** Everything the renderer is allowed to ask about settings and the folder. */
/** Settings, the folder picker and the providers — everything the renderer asks the machine. */
function registerBridges(): void {
  ipcMain.handle('settings:read', () => settings)

  ipcMain.handle(
    'settings:update',
    (
      _event,
      patch: {
        vaultPath?: string
        cloud?: { baseUrl?: string; model?: string }
        permissions?: unknown
      }
    ): { ok: boolean; error?: string; settings: AppSettings; status?: unknown } => {
      // A provider endpoint is a plain preference, so it is written first: a
      // folder problem must never lose what somebody just typed into the other
      // pane of the same window.
      if (patch?.cloud && typeof patch.cloud === 'object') {
        const cloud = settings.cloud
        settings = writeSettings(settingsFile, {
          ...settings,
          cloud: {
            baseUrl: typeof patch.cloud.baseUrl === 'string' ? patch.cloud.baseUrl : cloud.baseUrl,
            model: typeof patch.cloud.model === 'string' ? patch.cloud.model : cloud.model,
          },
        })
      }
      // What an agent may do. Sanitised on the way in — the window asks, the main
      // process decides — and the app's own settings file is the record.
      if (patch?.permissions && typeof patch.permissions === 'object') {
        settings = writeSettings(settingsFile, {
          ...settings,
          permissions: normalizePermissions(patch.permissions),
        })
      }
      // No vault path in the patch means the caller is not moving the vault, so
      // there is nothing to check and nothing to reconsider.
      if (typeof patch?.vaultPath !== 'string') return { ok: true, settings }
      const wanted = patch.vaultPath
      const problem = folderProblem(wanted)
      if (problem) return { ok: false, error: problem, settings }
      settings = writeSettings(settingsFile, { ...settings, vaultPath: wanted.trim() })
    // Point the running service at the new folder. No restart, and the interface
    // is told the result instead of assuming it worked.
      const next = createVaultService({ vaultPath: vaultRoot() })
      api?.setVault(next)
      return { ok: true, settings, status: next.status() }
    }
  )

  ipcMain.handle('cloud:providers', () => cloudView())

  /**
   * Every model the saved keys can reach, with each provider's own problem
   * reported against it. A provider that is slow or down never holds up the
   * others, and a failure is a sentence here, never a thrown error in the
   * interface.
   */
  ipcMain.handle('cloud:models', async () => {
    if (!cloud) return { ok: false, error: 'Cloud providers are not running in this process.', models: [], problems: [] }
    try {
      const { models, problems } = await cloud.models()
      return { ok: true, models, problems }
    } catch (error) {
      return { ok: false, error: (error as Error).message, models: [], problems: [] }
    }
  })

  ipcMain.handle('cloud:save-key', (_event, id: string, key: string) => {
    const provider = providerById(String(id || ''))
    if (!provider || !keyStore) return { ok: false, error: 'That is not a provider this app knows.' }
    if (!String(key || '').trim()) return { ok: false, error: 'Paste a key first.' }
    keyStore.set(provider.id, String(key))
    return cloudView()
  })

  ipcMain.handle('cloud:clear-key', (_event, id: string) => {
    keyStore?.clear(String(id || ''))
    return cloudView()
  })

  /** The Test button: one provider, asked for its own model list. */
  ipcMain.handle('cloud:test', async (_event, id: string) => {
    if (!cloud) return { ok: false, error: 'Cloud providers are not running in this process.' }
    try {
      const models = await cloud.listModels(String(id || ''))
      return { ok: true, count: models.length, first: models[0]?.label || '' }
    } catch (error) {
      return { ok: false, error: (error as Error).message }
    }
  })

  /**
   * Whether the browser extension can reach this app, and where. Shown in
   * Settings > System: a port that is open is a fact the person should be able to
   * see, not something to find out from an extension that quietly stopped working.
   */
  ipcMain.handle('extension:status', () => ({
    ok: true,
    listening: Boolean(extensionApi?.listening),
    port: extensionApi?.port ?? extensionPortWanted(),
    url: extensionApi?.url || `http://127.0.0.1:${extensionPortWanted()}`,
    error: extensionApi?.error || '',
  }))

  ipcMain.handle('vault:choose-folder', async () => {
    const [window] = BrowserWindow.getAllWindows()
    const chosen = await dialog.showOpenDialog(window, {
      title: 'Choose the folder AI ASSistant keeps its notes in',
      buttonLabel: 'Use this folder',
      properties: ['openDirectory', 'createDirectory'],
    })
    return chosen.canceled || !chosen.filePaths.length ? null : chosen.filePaths[0]
  })

  // The artifact library, in this user's own app-data folder. Not the vault:
  // the vault is the person's curated notes, and the app does not scatter its
  // own working files through it without being asked.
  registerArtifactIpc(join(app.getPath('userData'), 'artifacts'))

  // The engine: read the choice, change it, hand it a task, answer its
  // permission cards. Every answer is a value or a plain sentence — a refused
  // task is information, not an exception.
  ipcMain.handle('engine:read', () => ({
    engine: settings.engine,
    running: engine?.running() === true,
    history: [...engineHistory],
  }))

  ipcMain.handle('engine:pick', (_event, id: string): { ok: boolean; answer: string } => {
    const wanted = normalizeEngine({ id }).id
    settings = writeSettings(settingsFile, { ...settings, engine: { ...settings.engine, id: wanted } })
    return { ok: true, answer: `engine set to ${wanted}` }
  })

  ipcMain.handle(
    'engine:send',
    (_event, prompt: string, cwd: string): { ok: boolean; answer: string } => {
      const text = typeof prompt === 'string' ? prompt.trim().slice(0, 20000) : ''
      if (!text) return { ok: false, answer: 'Write what the engine should do first.' }
      if (!engine) return { ok: false, answer: 'The engine is still waking up — try again in a moment.' }
      const working = typeof cwd === 'string' && cwd ? cwd : vaultRoot()
      const started = engine.begin({
        cwd: working,
        settings: settings.engine,
        onEvent: pushEngineEvent,
      })
      if (!started.ok) return started
      engine.current()?.send(text)
      return { ok: true, answer: 'started' }
    },
  )

  ipcMain.handle('engine:answer', (_event, requestId: string, allow: boolean): { ok: boolean } => {
    const session = engine?.current()
    if (!session || typeof requestId !== 'string' || !requestId) return { ok: false }
    session.answer(requestId, allow === true)
    return { ok: true }
  })

  ipcMain.handle('engine:stop', () => {
    engine?.stop()
    return { ok: true }
  })
}

const isSmoke = process.argv.includes('--smoke')
const smokeOutArg = process.argv.find(arg => arg.startsWith('--smoke-out='))
const smokeOut = smokeOutArg ? smokeOutArg.split('=')[1] : ''

/** Renderer console output, kept so the smoke run can fail on it. */
const consoleErrors: string[] = []
const consoleWarnings: string[] = []

let api: LocalApi | null = null
let extensionApi: ExtensionApi | null = null
let settings: AppSettings = { ...EMPTY_SETTINGS }
let settingsFile = ''
let keyStore: KeyStore | null = null
let cloud: CloudClient | null = null
/** The engine plug and the last events it produced, for windows opened mid-turn. */
let engine: EngineSocket | null = null
const engineHistory: EngineEvent[] = []

/**
 * The icon file, when this build has one.
 *
 * In a packaged Windows build the icon comes from the executable itself, so
 * nothing is passed; in the checkout the repo's own BrainMark is used, which is
 * what the taskbar shows during development. An absent file is not an error —
 * it just means the operating system's default stands.
 */
function windowIcon(): string | undefined {
  for (const candidate of [join(app.getAppPath(), 'resources', 'icon.png'), join(process.resourcesPath || '', 'icon.png')]) {
    try {
      if (candidate && existsSync(candidate)) return candidate
    } catch {
      // process.resourcesPath is undefined outside a package; keep looking.
    }
  }
  return undefined
}

function createWindow(): BrowserWindow {
  const icon = windowIcon()
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 620,
    show: false,
    ...(icon ? { icon } : {}),
    // The window paints this before the renderer draws, so there is never a white flash.
    backgroundColor: '#141417',
    title: 'AI ASSistant',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Electron changed this event's payload shape across versions; read both.
  window.webContents.on('console-message', (...args: unknown[]) => {
    const maybeDetails = args[1]
    const details =
      maybeDetails && typeof maybeDetails === 'object'
        ? (maybeDetails as { level?: string | number; message?: string })
        : null
    const level = details ? details.level : (args[1] as string | number)
    const message = details ? details.message : (args[2] as string)
    const text = String(message ?? '')
    if (level === 'error' || level === 3) consoleErrors.push(text)
    else if (level === 'warning' || level === 2) consoleWarnings.push(text)
  })

  window.webContents.on('preload-error', (_event, path, error) => {
    consoleErrors.push(`preload failed at ${path}: ${error.message}`)
  })

  window.webContents.on('did-fail-load', (_event, code, description) => {
    consoleErrors.push(`renderer failed to load (${code}): ${description}`)
  })

  // External links open in the real browser, never inside the app window.
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  // Show on first paint so there is never a white flash, and so a screenshot
  // taken by the smoke run captures something real rather than an unpainted frame.
  window.once('ready-to-show', () => window.show())

  // The interface is always loaded over http, never from file://, so that its
  // fetch calls are same-origin and the local API boundary sees a real Origin.
  // In dev that origin is Vite's, which forwards /api to the server below.
  const devServer = process.env['ELECTRON_RENDERER_URL']
  if (devServer) {
    void window.loadURL(devServer)
  } else if (api) {
    void window.loadURL(`${api.url}/`)
  } else {
    // The API failed to start. Show the interface anyway rather than nothing —
    // it renders its own offline state, which is more useful than a blank window.
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  if (isSmoke) runSmoke(window)

  return window
}

/**
 * Headless proof that the shell works: wait for the renderer, photograph the
 * window, and exit non-zero if the renderer logged anything it shouldn't have.
 * This is the test that makes "the window opens" a fact instead of a claim.
 */
function runSmoke(window: BrowserWindow): void {
  const started = Date.now()
  window.webContents.once('did-finish-load', () => {
    setTimeout(async () => {
      try {
        const image = await window.webContents.capturePage()
        if (smokeOut) writeFileSync(smokeOut, image.toPNG())
        const bounds = window.getBounds()
        const title = window.getTitle()
        const blank = image.isEmpty()
        console.log(
          `SMOKE ${blank ? 'BLANK' : 'OK'} title="${title}" size=${bounds.width}x${bounds.height} ` +
            `in ${Date.now() - started}ms errors=${consoleErrors.length} warnings=${consoleWarnings.length}`
        )
        for (const line of consoleErrors.slice(0, 10)) console.log(`  ERROR: ${line}`)
        for (const line of consoleWarnings.slice(0, 10)) console.log(`  WARN:  ${line}`)
        const failed = consoleErrors.length > 0 || blank
        app.exit(failed ? 1 : 0)
      } catch (error) {
        console.log(`SMOKE FAILED: ${(error as Error).message}`)
        app.exit(1)
      }
    }, 1500)
  })
}

// One copy at a time. A second launch focuses the window you already have.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [existing] = BrowserWindow.getAllWindows()
    if (existing) {
      if (existing.isMinimized()) existing.restore()
      existing.focus()
    }
  })

  void app.whenReady().then(async () => {
    const rendererDir = process.env['ELECTRON_RENDERER_URL']
      ? undefined
      : join(__dirname, '../renderer')
    // What the user chose last time, read before anything can need it. A damaged
    // file means "nothing chosen yet", never a failed launch.
    settingsFile = join(app.getPath('userData'), 'settings.json')
    settings = readSettings(settingsFile)
    engine = createEngineSocket()
    registerBridges()

    // Keys are sealed by the operating system — safeStorage is the keychain on
    // macOS and Windows and the desktop's own secret store on Linux. When a
    // machine gives the app nothing to seal with, the key is held for this run
    // and the app says so, rather than writing it to disk in the clear.
    let seal: ((value: string) => string) | undefined
    let unseal: ((value: string) => string) | undefined
    try {
      if (safeStorage.isEncryptionAvailable()) {
        seal = value => safeStorage.encryptString(value).toString('base64')
        unseal = value => safeStorage.decryptString(Buffer.from(value, 'base64'))
      }
    } catch {
      // No keychain here: the store below keeps keys in memory for this run.
    }
    keyStore = createKeyStore({ file: join(app.getPath('userData'), 'keys.json'), encrypt: seal, decrypt: unseal })
    // `custom` is the provider whose address and model a person types in
    // themselves; the client reads it fresh on every request, so changing it in
    // Settings needs no restart.
    cloud = createCloudClient({
      keys: keyStore,
      config: () => ({ custom: settings.cloud }),
      // Read fresh on every call, so a switch in Settings takes effect at once.
      permissions: () => settings.permissions,
      env: process.env,
    })
    const enabled = keyStore.ids().length
    console.log(
      `[cloud] keys ${keyStore.encryption === 'os' ? 'sealed by this machine' : 'held for this run only'}; ` +
        `${enabled} provider${enabled === 1 ? '' : 's'} enabled`
    )

    // The vault lives in this process: no companion server to start, no port to
    // find, and the interface's /api/vault calls land on these files.
    const vault = createVaultService({ vaultPath: vaultRoot() })
    console.log(
      vault.available()
        ? `[vault] ${vault.root}`
        : `[vault] nothing at ${vault.root}; captures will report that rather than create one.`
    )
    try {
      // The API is handed the cloud client, so a chat whose model names a
      // provider streams from there — through the same address, as the same
      // records, with no second path for the interface to know about.
      api = await startLocalApi({ port: API_PORT, rendererDir, vault, cloud: cloud || undefined })
      if (api.port !== API_PORT) {
        console.log(`[api] port ${API_PORT} was busy; listening on ${api.port} instead.`)
      }
    } catch (error) {
      console.log(`[api] could not start: ${(error as Error).message}`)
      api = null
    }
    // The extension's own port. Narrow on purpose (see src/main/extension/server.ts):
    // it carries the capture side of the vault and nothing that could spend a key
    // or change a setting. A busy port is reported, never fatal.
    extensionApi = await startExtensionApi({
      port: extensionPortWanted(),
      vault,
      mayCapture: () => settings.permissions.browserCapture,
    })
    if (extensionApi.listening) {
      console.log(`[extension] listening at ${extensionApi.url} — captures, context and the never-check list only`)
    }

    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('before-quit', () => {
    void api?.close()
    void extensionApi?.close()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
