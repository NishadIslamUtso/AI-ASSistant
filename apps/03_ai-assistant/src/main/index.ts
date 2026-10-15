import { app, BrowserWindow, dialog, ipcMain, safeStorage, shell } from 'electron'
import { join } from 'node:path'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
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
import { APPROVAL_MODES, type ApprovalMode, type EngineEvent, type EngineId, type EngineModelEntry } from '../shared/lib/engine'
import { agyModelSource, detectEngine } from './engine/availability'
import { parsePullLine, validateModelName } from './engine/pull'
import { deployMcp, deploySkill, scanClaudeSkills, type McpServer, type VaultSkill } from './engine/deploy'
import { installCatalogSkill } from './engine/skillCatalogInstall'
import { exportVaultCopy } from './vault/exportCopy'
import { deployHouseRules } from './engine/houseRulesDeploy'
import { DEFAULT_HOUSE_RULES, type HouseRules } from '../shared/lib/houseRules'
import { newProject, normalizeProjects, type Project } from '../shared/lib/projects'

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
/** A Dhaka-time stamp for export folder names: vault-2026-10-16-1430. */
function stampFor(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now)
  const get = (type: string): string => parts.find((part) => part.type === type)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}-${get('hour')}${get('minute')}`
}

function pushEngineEvent(event: EngineEvent): void {
  // Stream pieces are for the live window only: a hundred of them would
  // crowd out the real story from the small remembered history, and the
  // finished text arrives in its own event for whoever reads it later.
  if (event.kind !== 'delta') engineHistory.push(event)
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
      // The working folder is the app's decision, never the window's: the
      // folder the owner picked in the engine bay, or the vault when none.
      // The renderer's value is deliberately not consulted (review finding).
      void cwd
      deployRulesNow()
      return engine.send(text, {
        cwd: settings.engine.workspace || vaultRoot(),
        settings: settings.engine,
        onEvent: pushEngineEvent,
      })
    },
  )

  ipcMain.handle('engine:answer', (_event, requestId: string, allow: boolean): { ok: boolean } => {
    const session = engine?.current()
    if (!session || typeof requestId !== 'string' || !requestId) return { ok: false }
    session.answer(requestId, allow === true)
    return { ok: true }
  })

  // The two folders skills deploy into: Claude Code reads its skills from
  // the user's own folder; agy reads workspace skills next to the work.
  const skillTargets = (): { claudeSkillsDir: string; agySkillsDir: string } => {
    const home = process.env['USERPROFILE'] || process.env['HOME'] || ''
    const workspace = settings.engine.workspace || vaultRoot()
    return {
      claudeSkillsDir: join(home, '.claude', 'skills'),
      agySkillsDir: join(workspace, '.agents', 'skills'),
    }
  }
  const mcpFile = join(app.getPath('userData'), 'mcp.json')

  // The canonical rulebook, as the owner edited it (blanks fall back to the
  // defaults inside the compiler — never an empty rule).
  const houseRulesFile = join(app.getPath('userData'), 'house-rules.json')
  const readHouseRules = (): Partial<HouseRules> => {
    try {
      return JSON.parse(readFileSync(houseRulesFile, 'utf8')) as Partial<HouseRules>
    } catch {
      return {}
    }
  }
  const deployRulesNow = (): void => {
    try {
      const home = process.env['USERPROFILE'] || process.env['HOME'] || ''
      deployHouseRules(settings.engine.id, settings.engine.model, home, readHouseRules())
    } catch {
      // A failed rules deploy must never block the work itself.
    }
  }

  // The vault folder, opened in the file manager. The vault root only —
  // this door is a convenience for the owner, not a general launcher.
  ipcMain.handle('vault:open-folder', async (): Promise<{ ok: boolean }> => {
    const error = await shell.openPath(vaultRoot())
    return { ok: !error }
  })

  // What is really installed on this machine — the bay refuses to guess.
  ipcMain.handle('engine:detect', async (): Promise<Array<{ id: EngineId; found: boolean; version: string; install: string }>> => {
    const ids: EngineId[] = ['claude-code', 'agy']
    return Promise.all(ids.map((id) => detectEngine(id)))
  })

  ipcMain.handle('engine:stop', () => {
    engine?.stop()
    return { ok: true }
  })

  // Bringing a brain home. The door streams progress sentences; each becomes
  // an event on the same channel the engine's own events use, so the bay can
  // show a real bar instead of a spinner of lies.
  ipcMain.handle('engine:pull', async (_event, rawName: string): Promise<{ ok: boolean; answer: string }> => {
    const name = validateModelName(rawName)
    if (!name) return { ok: false, answer: 'That is not a model name this app will ask for.' }
    const door = settings.engine.baseUrl || 'http://localhost:11434'
    const send = (tick: unknown): void => {
      for (const window of BrowserWindow.getAllWindows()) window.webContents.send('engine:pull-event', tick)
    }
    try {
      const answer = await fetch(`${door}/api/pull`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: name }),
      })
      if (!answer.ok || !answer.body) {
        const why = `the brain door answered ${answer.status}`
        send({ status: '', total: null, completed: null, done: false, error: why })
        return { ok: false, answer: why }
      }
      const decoder = new TextDecoder()
      let carry = ''
      // Node's undici stream is async-iterable at runtime; the type lib here
      // does not say so, hence the one honest cast.
      const body = answer.body as unknown as AsyncIterable<Uint8Array>
      for await (const chunk of body) {
        carry = `${carry}${decoder.decode(chunk as Buffer, { stream: true })}`
        const lines = carry.split('\n')
        carry = lines.at(-1) ?? ''
        for (const line of lines.slice(0, -1)) {
          const tick = parsePullLine(line)
          if (tick.status || tick.error) send(tick)
          if (tick.error) return { ok: false, answer: `the pull failed: ${tick.error}` }
        }
      }
      const finalTick = parsePullLine(carry)
      if (finalTick.error) return { ok: false, answer: `the pull failed: ${finalTick.error}` }
      send({ status: 'success', total: null, completed: null, done: true, error: '' })
      return { ok: true, answer: `${name} is home — it is in the brain list now` }
    } catch {
      const why = 'the brain door (Ollama) is not answering — start it, then try again'
      send({ status: '', total: null, completed: null, done: false, error: why })
      return { ok: false, answer: why }
    }
  })

  // Taking a brain off the machine, when the owner no longer wants it.
  ipcMain.handle('engine:model-delete', async (_event, rawName: string): Promise<{ ok: boolean; answer: string }> => {
    const name = validateModelName(rawName)
    if (!name) return { ok: false, answer: 'That is not a model name this app will ask for.' }
    const door = settings.engine.baseUrl || 'http://localhost:11434'
    try {
      const answer = await fetch(`${door}/api/delete`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: name }),
      })
      if (!answer.ok) return { ok: false, answer: `the brain door answered ${answer.status}` }
      return { ok: true, answer: `${name} is gone from this machine` }
    } catch {
      return { ok: false, answer: 'the brain door (Ollama) is not answering — start it, then try again' }
    }
  })

  // A handoff: the finished turn, written into the vault as one markdown
  // document any later session (here or in a terminal) can continue from.
  // The name is validated and the vault's own path rules apply.
  ipcMain.handle('vault:save-handoff', (_event, payload: { name: string; markdown: string }): { ok: boolean; answer: string } => {
    const name = typeof payload?.name === 'string' ? payload.name.trim() : ''
    const markdown = typeof payload?.markdown === 'string' ? payload.markdown : ''
    if (!name || name.length > 120 || /[\\/:*?"<>|\n\r]/.test(name) || !markdown || markdown.length > 200_000) {
      return { ok: false, answer: 'That is not a name and document this app will write.' }
    }
    const service = createVaultService({ vaultPath: vaultRoot() })
    if (!service.available()) return { ok: false, answer: 'No vault to write the handoff into.' }
    try {
      service.files().write(`handoffs/${name}`, markdown)
      return { ok: true, answer: `handoffs/${name}` }
    } catch (error) {
      return { ok: false, answer: error instanceof Error ? error.message : 'The vault refused the handoff.' }
    }
  })

  // A timestamped, portable copy of the vault: every markdown file, same
  // structure, written to the app's exports folder. Obsidian (or a backup,
  // or another machine) takes folders of markdown as they are — nothing is
  // converted, because nothing needs converting.
  ipcMain.handle('vault:export-copy', (): { ok: boolean; answer: string } => {
    const service = createVaultService({ vaultPath: vaultRoot() })
    if (!service.available()) return { ok: false, answer: 'No vault to copy.' }
    const stamp = stampFor(new Date())
    const destination = join(app.getPath('userData'), 'exports', `vault-${stamp}`)
    const result = exportVaultCopy(service.root, destination)
    if (!result.ok) return { ok: false, answer: result.answer }
    return { ok: true, answer: `${result.count} files copied to ${result.destination}` }
  })

  // The skills the owner's engine already has — the import list.
  ipcMain.handle('skills:scan', () => {
    const home = process.env['USERPROFILE'] || process.env['HOME'] || ''
    return scanClaudeSkills(join(home, '.claude', 'skills'))
  })

  // Install a skill from the app's own catalog: the name is checked against
  // the catalog (this door fetches nothing else), the file comes from
  // anthropics/skills, and it lands in every engine's own folder through the
  // same deploy everything else uses.
  ipcMain.handle('skills:install-catalog', async (_event, name: string): Promise<{ ok: boolean; answer: string; written?: string[] }> => {
    const result = await installCatalogSkill(String(name ?? ''), skillTargets())
    if (!result.ok) return { ok: false, answer: result.answer }
    return { ok: true, answer: `${result.skill.name} installed to ${result.written.length} engine folders`, written: result.written }
  })

  // Deploy the app's vault into every engine's own folder. The renderer sends
  // its vault; the main process validates every name before anything lands.
  ipcMain.handle('skills:deploy', (_event, skills: VaultSkill[]): { ok: boolean; written: string[] } => {
    const written: string[] = []
    for (const skill of Array.isArray(skills) ? skills.slice(0, 200) : []) {
      if (!skill || typeof skill.name !== 'string' || !skill.name.trim()) continue
      const clean: VaultSkill = {
        name: String(skill.name),
        description: typeof skill.description === 'string' ? skill.description : '',
        body: typeof skill.body === 'string' ? skill.body.slice(0, 20_000) : '',
      }
      if (!clean.body) continue
      written.push(...deploySkill(clean, skillTargets()))
    }
    return { ok: true, written }
  })

  // The one MCP list, stored once, deployed to every engine's config.
  ipcMain.handle('mcp:read', () => {
    try {
      return JSON.parse(readFileSync(mcpFile, 'utf8')) as { servers: McpServer[] }
    } catch {
      return { servers: [] as McpServer[] }
    }
  })

  ipcMain.handle('mcp:write', (_event, payload: { servers: McpServer[] }): { ok: boolean; written: string[] } => {
    const servers = Array.isArray(payload?.servers) ? payload.servers.slice(0, 100) : []
    writeFileSync(mcpFile, JSON.stringify({ servers }), 'utf8')
    return { ok: true, written: deployMcp(servers, settings.engine.workspace || vaultRoot()) }
  })

  // Projects: the owner's named homes for related work. Stored once,
  // validated on the way in and the way out; a damaged file means "no
  // projects yet", never a failed launch.
  const projectsFile = join(app.getPath('userData'), 'projects.json')
  ipcMain.handle('projects:read', (): Project[] => {
    try {
      return normalizeProjects(JSON.parse(readFileSync(projectsFile, 'utf8')))
    } catch {
      return []
    }
  })

  ipcMain.handle('projects:write', (_event, projects: unknown): { ok: boolean; projects: Project[] } => {
    const clean = normalizeProjects(projects)
    writeFileSync(projectsFile, JSON.stringify(clean, null, 2), 'utf8')
    return { ok: true, projects: clean }
  })

  ipcMain.handle('projects:new', (_event, name: string): Project => newProject(String(name ?? '')))

  // "Work here" — the owner points the engine at a project's folder. The
  // window never chooses a working folder behind the app's back; this door
  // IS the owner's explicit choice, same as the picker.
  ipcMain.handle('engine:workspace-set', (_event, folder: string): { ok: boolean; answer: string } => {
    const clean = typeof folder === 'string' ? folder.trim().slice(0, 4096) : ''
    // Empty is allowed and means "back to the vault" — a real choice, not a mistake.
    if (clean === '') {
      settings = writeSettings(settingsFile, { ...settings, engine: { ...settings.engine, workspace: '' } })
      return { ok: true, answer: '' }
    }
    if (/[\n\r]/.test(clean) || /^https?:\/\//.test(clean)) {
      return { ok: false, answer: 'That is not a folder this app will work in.' }
    }
    if (!existsSync(clean)) return { ok: false, answer: 'That folder does not exist on this machine.' }
    settings = writeSettings(settingsFile, { ...settings, engine: { ...settings.engine, workspace: clean } })
    return { ok: true, answer: clean }
  })

  // The engine sessions, per workspace: the threads a fresh launch will
  // continue. Read-only for the screen, with an explicit forget.
  const sessionsFile = (): string => join(app.getPath('userData'), 'engine-sessions.json')
  ipcMain.handle('engine:sessions', (): Array<{ workspace: string; sessionId: string }> => {
    try {
      const data = JSON.parse(readFileSync(sessionsFile(), 'utf8')) as Record<string, string>
      return Object.entries(data)
        .filter(([, id]) => typeof id === 'string' && id.length > 3)
        .map(([workspace, sessionId]) => ({ workspace, sessionId: String(sessionId).slice(0, 64) }))
        .slice(0, 20)
    } catch {
      return []
    }
  })

  ipcMain.handle('engine:sessions-forget', (_event, workspace: string): { ok: boolean } => {
    try {
      const file = sessionsFile()
      const data = JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>
      delete data[String(workspace ?? '')]
      writeFileSync(file, JSON.stringify(data), 'utf8')
      return { ok: true }
    } catch {
      return { ok: true }
    }
  })

  // Open a folder in the file manager. Guarded to folders that exist and are
  // at least plausible; it is the owner's machine and this is a convenience.
  ipcMain.handle('app:open-folder', async (_event, folder: string): Promise<{ ok: boolean }> => {
    const clean = typeof folder === 'string' ? folder.trim() : ''
    if (!clean || clean.length > 4096 || /[\n\r]/.test(clean)) return { ok: false }
    if (!existsSync(clean)) return { ok: false }
    const error = await shell.openPath(clean)
    return { ok: !error }
  })

  // The rulebook itself: read for the edit screen, write to persist and
  // deploy immediately to every engine's global file.
  ipcMain.handle('houserules:read', () => {
    const rules = readHouseRules()
    return {
      rules: {
        identity: rules.identity ?? DEFAULT_HOUSE_RULES.identity,
        artifacts: rules.artifacts ?? DEFAULT_HOUSE_RULES.artifacts,
        permissions: rules.permissions ?? DEFAULT_HOUSE_RULES.permissions,
        memory: rules.memory ?? DEFAULT_HOUSE_RULES.memory,
        style: rules.style ?? DEFAULT_HOUSE_RULES.style,
      },
      defaults: DEFAULT_HOUSE_RULES,
    }
  })

  ipcMain.handle('houserules:write', (_event, rules: Partial<HouseRules>): { ok: boolean; written: string[] } => {
    const clean: Partial<HouseRules> = {}
    for (const key of Object.keys(DEFAULT_HOUSE_RULES) as Array<keyof HouseRules>) {
      const value = rules?.[key]
      if (typeof value === 'string' && value.trim()) clean[key] = value
    }
    writeFileSync(houseRulesFile, JSON.stringify(clean), 'utf8')
    const home = process.env['USERPROFILE'] || process.env['HOME'] || ''
    const written = deployHouseRules(settings.engine.id, settings.engine.model, home, clean)
    return { ok: true, written }
  })

  // The brains the engine can actually use, straight from the brain door —
  // the same list Claude Code itself would choose from. Real data only: what
  // Ollama reports, with cloud brains flagged because their work leaves the
  // machine and the label must say so.
  ipcMain.handle('engine:models', async (): Promise<{ ok: boolean; models: EngineModelEntry[]; error?: string }> => {
    // Each engine is served by its OWN source: Claude Code reads its brains
    // from the owner's door; agy answers only to Google. Never a pickable lie.
    if (settings.engine.id !== 'claude-code') {
      const known = await detectEngine(settings.engine.id as EngineId)
      const answer = await agyModelSource(known.found).models()
      return answer
    }
    const door = settings.engine.baseUrl || 'http://localhost:11434'
    try {
      const answer = await fetch(`${door}/api/tags`, { signal: AbortSignal.timeout(4000) })
      if (!answer.ok) return { ok: false, models: [], error: `the brain door answered ${answer.status}` }
      const data = (await answer.json()) as { models?: Array<{ name?: string; size?: number; remote_model?: string }> }
      const models = (data.models ?? [])
        .filter((m): m is { name: string; size?: number; remote_model?: string } => typeof m.name === 'string')
        .map((m) => {
          const cloud = Boolean(m.remote_model) || m.name.endsWith(':cloud')
          return {
            name: m.name,
            cloud,
            sizeGB: cloud || typeof m.size !== 'number' ? null : Math.round((m.size / 1e9) * 10) / 10,
          }
        })
      return { ok: true, models }
    } catch {
      return { ok: false, models: [], error: 'the brain door (Ollama) is not answering — start Ollama, then refresh' }
    }
  })

  // The throttle: how much the engine may do before asking. The app offers
  // the engine's own official settings and imposes nothing beyond them.
  ipcMain.handle('engine:approval', (_event, approval: string): { ok: boolean; answer: string } => {
    const mode: ApprovalMode = APPROVAL_MODES.includes(approval as ApprovalMode)
      ? (approval as ApprovalMode)
      : 'ask'
    settings = writeSettings(settingsFile, { ...settings, engine: { ...settings.engine, approval: mode } })
    return { ok: true, answer: mode }
  })

  ipcMain.handle('engine:model', (_event, model: string): { ok: boolean; answer: string } => {
    const clean = normalizeEngine({ ...settings.engine, model }).model
    settings = writeSettings(settingsFile, { ...settings, engine: { ...settings.engine, model: clean } })
    return { ok: true, answer: `brain set to ${clean}` }
  })

  // "Open a folder" — the engine's workplace, chosen once and remembered.
  ipcMain.handle('engine:pick-workspace', async (): Promise<{ ok: boolean; answer: string }> => {
    const answer = await dialog.showOpenDialog({
      title: 'Where should the engine work?',
      properties: ['openDirectory', 'createDirectory'],
    })
    if (answer.canceled || !answer.filePaths[0]) {
      return { ok: false, answer: 'No folder chosen — the vault stays the workplace.' }
    }
    const workspace = answer.filePaths[0]
    settings = writeSettings(settingsFile, { ...settings, engine: { ...settings.engine, workspace } })
    return { ok: true, answer: workspace }
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
        // The rule the owner set: a WARNING is already a failure. The smoke
        // run is the console-clean gate, so it enforces the whole sentence.
        const failed = consoleErrors.length > 0 || consoleWarnings.length > 0 || blank
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
    engine = createEngineSocket({
      // Engine sessions, remembered per workspace so a conversation survives
      // an app restart (the engine's own --resume). A damaged file means
      // "nothing to resume", never a failed launch.
      load: (cwd) => {
        try {
          const file = join(app.getPath('userData'), 'engine-sessions.json')
          const data = JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>
          return typeof data[cwd] === 'string' ? data[cwd] : ''
        } catch {
          return ''
        }
      },
      save: (cwd, sessionId) => {
        try {
          const file = join(app.getPath('userData'), 'engine-sessions.json')
          let data: Record<string, string> = {}
          try {
            data = JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>
          } catch {
            data = {}
          }
          data[cwd] = sessionId
          // Keep the map small: the twenty most recent workplaces are enough.
          const entries = Object.entries(data).slice(-20)
          writeFileSync(file, JSON.stringify(Object.fromEntries(entries)), 'utf8')
        } catch {
          // A failed save costs only the resume; the work itself is unaffected.
        }
      },
    })
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
