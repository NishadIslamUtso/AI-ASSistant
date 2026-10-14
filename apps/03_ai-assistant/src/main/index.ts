import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { writeFileSync } from 'node:fs'
import { startLocalApi, type LocalApi } from './api/server'

/**
 * The main process. Everything that touches the machine lives on this side:
 * files, the vault index, Ollama, the database. The renderer only ever talks to
 * it through the preload bridge, so there is no localhost HTTP and no CORS.
 */

/**
 * The port the app's own API listens on. Fixed rather than ephemeral only so the
 * Vite dev server's proxy can find it in dev; if it is taken, the app falls back
 * to any free port and says so, because a busy port is not the user's problem.
 */
const API_PORT = Number(process.env.AI_ASSISTANT_API_PORT || 41979)

const isSmoke = process.argv.includes('--smoke')
const smokeOutArg = process.argv.find(arg => arg.startsWith('--smoke-out='))
const smokeOut = smokeOutArg ? smokeOutArg.split('=')[1] : ''

/** Renderer console output, kept so the smoke run can fail on it. */
const consoleErrors: string[] = []
const consoleWarnings: string[] = []

let api: LocalApi | null = null

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 620,
    show: false,
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
    try {
      api = await startLocalApi({ port: API_PORT, rendererDir })
      if (api.port !== API_PORT) {
        console.log(`[api] port ${API_PORT} was busy; listening on ${api.port} instead.`)
      }
    } catch (error) {
      console.log(`[api] could not start: ${(error as Error).message}`)
      api = null
    }
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('before-quit', () => {
    void api?.close()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
