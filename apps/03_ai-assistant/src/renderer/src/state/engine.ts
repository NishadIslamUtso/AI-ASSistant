/**
 * The engine, as the interface sees it.
 *
 * All state lives in one small module-level store with a subscribe function —
 * the same shape the rest of this app's state uses, so both the composer's
 * toggle and the activity panel can look at the same engine without prop
 * drilling or a context. Nothing here talks to an engine directly: every
 * machine word goes through the bridge, and a missing machine (the browser
 * preview) gets honest refusals, never invented work.
 */
import { useSyncExternalStore } from 'react'
import type {
  ApprovalMode,
  EngineAvailability,
  EngineEvent,
  EngineId,
  EngineModelEntry,
  EngineSettings,
  EngineUsage,
} from '@shared/lib/engine'
import { DEFAULT_ENGINE } from '@shared/lib/engine'
import { getEngineApi } from '@/platform/bridge'

/** One finished thing the engine said, already shaped for drawing. */
export type EngineItem =
  | { kind: 'status'; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'thinking'; text: string }
  | { kind: 'tool'; name: string; summary: string }
  | { kind: 'error'; text: string }

/** A question from the engine that a person must answer. */
export type EnginePermission = { requestId: string; tool: string; summary: string; detail?: string }

/** The engine's brains, as its own door reports them. */
export type EngineModels = { loading: boolean; entries: EngineModelEntry[]; error: string }

/** What is really installed on this machine, as the last detection saw it. */
export type EngineDetection = { loading: boolean; engines: EngineAvailability[] }

/** Bringing a brain home, as the door reports its progress. */
export type PullState = {
  active: boolean
  name: string
  status: string
  /** 0..1 while downloading; null when the door gives no sizes. */
  fraction: number | null
  error: string
}

/** One work order, from the moment it is sent to the moment it lands. */
export type EngineTurn = {
  prompt: string
  items: EngineItem[]
  /**
   * The questions waiting for a person, in arrival order. The engine can ask
   * faster than a person answers: a queue means no question is lost under
   * the one being looked at (the old single card silently dropped all but
   * the last, and the engine waited forever on a card nobody held).
   */
  permissions: EnginePermission[]
  state: 'running' | 'done' | 'error'
  /** The engine's own session id, when it opened one — the resumable thread. */
  sessionId: string | null
  /** What the turn cost, as the engine itself reported. */
  usage: EngineUsage | null
}

export type EngineState = {
  settings: EngineSettings
  /** Whether the composer sends work to the engine instead of the chat brain. */
  on: boolean
  turn: EngineTurn | null
  models: EngineModels
  detection: EngineDetection
  pull: PullState
  /** Whether the engine process is alive on this machine, as last reported. */
  alive: boolean
}

type EngineStore = EngineState & {
  /** Wire the bridge up once: read the settings, listen for events. */
  init(): Promise<void>
  setOn(value: boolean): void
  send(prompt: string): Promise<{ ok: boolean; answer: string }>
  answer(allow: boolean): Promise<void>
  stop(): Promise<void>
  /** Fold one wire event into the turn. Public so tests can drive it directly. */
  ingest(event: EngineEvent): void
  /** Whether the engine process is alive on this machine. */
  running(): boolean
  /** Choose which engine thinks inside the app; persists. */
  pick(id: EngineId): Promise<void>
  /** Ask the brain door what the engine can use. */
  loadModels(): Promise<void>
  /** Pick the engine's brain; persists. */
  setModel(name: string, provider?: 'anthropic'): Promise<void>
  /** Set the throttle: how much the engine may do before asking; persists. */
  setApproval(mode: ApprovalMode): Promise<void>
  /** "Open a folder": pick where the engine works; persists. */
  pickWorkspace(): Promise<void>
  /** Ask the machine which engines really exist. */
  checkEngines(): Promise<void>
  /** Bring a brain home; progress lands in `pull`. */
  startPull(name: string): Promise<{ ok: boolean; answer: string }>
  /** Take a brain off this machine. */
  removeModel(name: string): Promise<{ ok: boolean; answer: string }>
}

const state: EngineState = {
  settings: { ...DEFAULT_ENGINE },
  on: false,
  turn: null,
  models: { loading: false, entries: [], error: '' },
  detection: { loading: false, engines: [] },
  pull: { active: false, name: '', status: '', fraction: null, error: '' },
  alive: false,
}

let subscribed = false
let initializing = false
let version = 0
const listeners = new Set<() => void>()

const emit = (): void => {
  version += 1
  for (const listener of listeners) listener()
}

const setState = (patch: Partial<EngineState>): void => {
  Object.assign(state, patch)
  emit()
}

/** Fold one wire event into the current turn, whatever order they arrive in. */
const ingest = (event: EngineEvent): void => {
  // The engine's existence is not a per-turn fact: even with no task under
  // way, a closed engine must dim its light.
  if (event.kind === 'closed') state.alive = false
  const turn = state.turn
  if (!turn) return
  if (event.kind === 'session') {
    turn.sessionId = event.id
  } else if (event.kind === 'status') {
    turn.items.push({ kind: 'status', text: event.text })
  } else if (event.kind === 'text') {
    turn.items.push({ kind: 'text', text: event.text })
  } else if (event.kind === 'delta') {
    // The stream, as it forms: the engine's last item grows word by word
    // instead of a hundred one-word items being stacked up.
    const last = turn.items.at(-1)
    if (last?.kind === 'text') last.text += event.text
    else turn.items.push({ kind: 'text', text: event.text })
  } else if (event.kind === 'thinking') {
    // The model's scratchwork, folded away from the answer. It grows like a
    // delta while the thinking block streams, and stays one item, not a
    // hundred fragments.
    const last = turn.items.at(-1)
    if (last?.kind === 'thinking') last.text += event.text
    else turn.items.push({ kind: 'thinking', text: event.text })
  } else if (event.kind === 'tool') {
    turn.items.push({ kind: 'tool', name: event.name, summary: event.summary })
  } else if (event.kind === 'permission') {
    turn.permissions.push({
      requestId: event.requestId,
      tool: event.tool,
      summary: event.summary,
      detail: event.detail,
    })
  } else if (event.kind === 'done') {
    // The wire says the same goodbye twice (once as the engine's last words,
    // once as the result) — show it once.
    const last = turn.items.at(-1)
    const alreadySaid = event.text && last?.kind === 'text' && last.text === event.text
    if (event.text && !alreadySaid) turn.items.push({ kind: 'text', text: event.text })
    if (event.usage) turn.usage = event.usage
    turn.state = 'done'
    turn.permissions = []
  } else if (event.kind === 'closed') {
    // The engine process ended. After a finished task this changes nothing;
    // after a Stop or a crash it is what closes the turn — without it the
    // panel would say "working" forever (a reviewed-and-reproduced bug).
    if (turn.state === 'running') {
      turn.items.push({ kind: 'status', text: 'engine stopped' })
      turn.state = 'done'
      turn.permissions = []
    }
  } else {
    turn.items.push({ kind: 'error', text: event.text })
    if ('usage' in event && event.usage) turn.usage = event.usage
    turn.state = 'error'
    turn.permissions = []
  }
  emit()
}

const store: EngineStore = {
  // Getters, not copies: anything that reads the store reads the live state,
  // and React's snapshot is the version counter bumped on every change.
  get settings() {
    return state.settings
  },
  get on() {
    return state.on
  },
  get turn() {
    return state.turn
  },
  get models() {
    return state.models
  },
  get alive() {
    return state.alive
  },
  get detection() {
    return state.detection
  },
  get pull() {
    return state.pull
  },

  async init(): Promise<void> {
    if (subscribed || initializing) return
    initializing = true
    const api = getEngineApi()
    try {
      const read = await api.read()
      setState({ settings: read.engine, alive: read.running })
      // Hydrate-or-drop. A window opened mid-turn (or reloaded after one)
      // replays the remembered events so the work is not invisible. A turn
      // that cannot be told whole is dropped, never half-shown: whatever
      // still says "running" when the engine is not is a phantom, and is
      // closed as one.
      const remembered = (Array.isArray(read.history) ? read.history : []).filter(
        (event): event is EngineEvent => Boolean(event && typeof event === 'object' && 'kind' in event)
      )
      const worthShowing = remembered.some((event) =>
        ['status', 'text', 'thinking', 'tool', 'permission', 'done', 'error'].includes(event.kind)
      )
      if (worthShowing && !state.turn) {
        state.turn = {
          prompt: '(from before this window opened)',
          items: [],
          permissions: [],
          // Replayed as if live; reconciled with the machine below.
        state: 'running',
          sessionId: null,
          usage: null,
        }
        for (const event of remembered) ingest(event)
        // The engine being gone changes the story: a still-"running" replay
        // is closed honestly, and a question it still waits on is dropped —
        // nobody can answer it anymore.
        if (!read.running) {
          state.turn.permissions = []
          if (state.turn.state === 'running') {
            state.turn.items.push({ kind: 'status', text: 'engine stopped' })
            state.turn.state = 'done'
          }
        }
        emit()
      }
    } finally {
      initializing = false
    }
    api.onEvent(ingest)
    api.onPullEvent((tick) => {
      const record = (tick && typeof tick === 'object' ? tick : {}) as Record<string, unknown>
      const status = typeof record.status === 'string' ? record.status : ''
      const error = typeof record.error === 'string' ? record.error : ''
      const total = typeof record.total === 'number' ? record.total : null
      const completed = typeof record.completed === 'number' ? record.completed : null
      const fraction = total !== null && completed !== null && total > 0 ? Math.min(1, completed / total) : null
      setState({ pull: { ...state.pull, status, error, fraction } })
    })
    subscribed = true
  },

  setOn(value: boolean): void {
    setState({ on: value === true })
    if (state.on) void store.init()
  },

  async send(prompt: string): Promise<{ ok: boolean; answer: string }> {
    if (state.turn?.state === 'running') {
      return { ok: false, answer: 'The engine is already working on the last task.' }
    }
    void store.init()
    const turn: EngineTurn = { prompt, items: [], permissions: [], state: 'running', sessionId: null, usage: null }
    setState({ turn })
    const answer = await getEngineApi().send(prompt, '')
    if (answer.ok) state.alive = true
    if (!answer.ok) {
      // The refusal is the result, shown where the work would have appeared —
      // the same honesty rule the rest of the app follows.
      turn.items.push({ kind: 'error', text: answer.answer })
      turn.state = 'error'
      emit()
    }
    return answer
  },

  async answer(allow: boolean): Promise<void> {
    const turn = state.turn
    const permission = turn?.permissions[0]
    if (!permission) return
    turn.permissions = turn.permissions.slice(1)
    emit()
    await getEngineApi().answer(permission.requestId, allow)
  },

  running(): boolean {
    return state.alive
  },

  async pick(id: EngineId): Promise<void> {
    const answer = await getEngineApi().pick(id)
    if (answer.ok) setState({ settings: { ...state.settings, id } })
  },

  async loadModels(): Promise<void> {
    if (state.models.loading) return
    setState({ models: { ...state.models, loading: true, error: '' } })
    const answer = await getEngineApi().models()
    setState({
      models: { loading: false, entries: answer.models, error: answer.ok ? '' : answer.error || 'the brain door did not answer' },
    })
  },

  async setModel(name: string, provider?: 'anthropic'): Promise<void> {
    const answer = await getEngineApi().setModel(name, provider)
    if (answer.ok) setState({ settings: { ...state.settings, model: name } })
  },

  async setApproval(mode: ApprovalMode): Promise<void> {
    const answer = await getEngineApi().setApproval(mode)
    if (answer.ok) setState({ settings: { ...state.settings, approval: mode } })
  },

  async checkEngines(): Promise<void> {
    if (state.detection.loading) return
    setState({ detection: { ...state.detection, loading: true } })
    const engines = await getEngineApi().detect()
    setState({ detection: { loading: false, engines } })
  },

  async startPull(name: string): Promise<{ ok: boolean; answer: string }> {
    if (state.pull.active) return { ok: false, answer: 'A brain is already downloading.' }
    setState({ pull: { active: true, name, status: 'asking the door', fraction: null, error: '' } })
    const answer = await getEngineApi().pull(name)
    setState({
      pull: answer.ok
        ? { active: false, name: '', status: 'done', fraction: 1, error: '' }
        : { ...state.pull, active: false, error: answer.answer },
    })
    if (answer.ok) void store.loadModels()
    return answer
  },

  async removeModel(name: string): Promise<{ ok: boolean; answer: string }> {
    const answer = await getEngineApi().deleteModel(name)
    if (answer.ok) void store.loadModels()
    return answer
  },

  async pickWorkspace(): Promise<void> {
    const answer = await getEngineApi().pickWorkspace()
    if (answer.ok) setState({ settings: { ...state.settings, workspace: answer.answer } })
  },

  async stop(): Promise<void> {
    await getEngineApi().stop()
    // Belt and suspenders: the 'closed' event also closes the turn, but the
    // person who pressed Stop should never wait for a wire to agree.
    state.alive = false
    const turn = state.turn
    if (turn?.state === 'running') {
      turn.items.push({ kind: 'status', text: 'stopped by you' })
      turn.state = 'done'
      turn.permissions = []
      emit()
    }
  },

  ingest,
}

/** Subscribe React to the store. The selector keeps redraws small. */
export function useEngine(): EngineStore & EngineState {
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => version,
  )
  return store
}

/** The store without React, for tests and for non-drawing callers. */
export function engineStore(): EngineStore {
  return store
}

/**
 * How many engine questions are waiting on a person, as a subscription that
 * re-renders only when THAT number changes — a header pulse must not redraw
 * on every streamed word, and the full store hook would make it.
 */
export function usePermissionsWaiting(): number {
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => store.turn?.permissions.length ?? 0,
  )
  return store.turn?.permissions.length ?? 0
}

/** Test seam: put the store back to its first day. */
export function resetEngineForTests(): void {
  subscribed = false
  state.on = false
  state.turn = null
  state.settings = { ...DEFAULT_ENGINE }
  state.models = { loading: false, entries: [], error: '' }
  state.detection = { loading: false, engines: [] }
  state.pull = { active: false, name: '', status: '', fraction: null, error: '' }
  state.alive = false
  emit()
}
