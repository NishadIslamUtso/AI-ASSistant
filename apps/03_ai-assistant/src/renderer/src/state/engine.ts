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
import type { EngineEvent, EngineSettings } from '@shared/lib/engine'
import { DEFAULT_ENGINE } from '@shared/lib/engine'
import { getEngineApi } from '@/platform/bridge'

/** One finished thing the engine said, already shaped for drawing. */
export type EngineItem =
  | { kind: 'status'; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'tool'; name: string; summary: string }
  | { kind: 'error'; text: string }

/** A question from the engine that a person must answer. */
export type EnginePermission = { requestId: string; tool: string; summary: string }

/** One work order, from the moment it is sent to the moment it lands. */
export type EngineTurn = {
  prompt: string
  items: EngineItem[]
  permission: EnginePermission | null
  state: 'running' | 'done' | 'error'
}

export type EngineState = {
  settings: EngineSettings
  /** Whether the composer sends work to the engine instead of the chat brain. */
  on: boolean
  turn: EngineTurn | null
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
}

const state: EngineState = {
  settings: { ...DEFAULT_ENGINE },
  on: false,
  turn: null,
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
  const turn = state.turn
  if (!turn) return
  if (event.kind === 'status') {
    turn.items.push({ kind: 'status', text: event.text })
  } else if (event.kind === 'text') {
    turn.items.push({ kind: 'text', text: event.text })
  } else if (event.kind === 'tool') {
    turn.items.push({ kind: 'tool', name: event.name, summary: event.summary })
  } else if (event.kind === 'permission') {
    turn.permission = { requestId: event.requestId, tool: event.tool, summary: event.summary }
  } else if (event.kind === 'done') {
    // The wire says the same goodbye twice (once as the engine's last words,
    // once as the result) — show it once.
    const last = turn.items.at(-1)
    const alreadySaid = event.text && last?.kind === 'text' && last.text === event.text
    if (event.text && !alreadySaid) turn.items.push({ kind: 'text', text: event.text })
    turn.state = 'done'
    turn.permission = null
  } else if (event.kind === 'closed') {
    // The engine process ended. After a finished task this changes nothing;
    // after a Stop or a crash it is what closes the turn — without it the
    // panel would say "working" forever (a reviewed-and-reproduced bug).
    if (turn.state === 'running') {
      turn.items.push({ kind: 'status', text: 'engine stopped' })
      turn.state = 'done'
      turn.permission = null
    }
  } else {
    turn.items.push({ kind: 'error', text: event.text })
    turn.state = 'error'
    turn.permission = null
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

  async init(): Promise<void> {
    if (subscribed || initializing) return
    initializing = true
    const api = getEngineApi()
    try {
      const read = await api.read()
      setState({ settings: read.engine })
    } finally {
      initializing = false
    }
    api.onEvent(ingest)
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
    const turn: EngineTurn = { prompt, items: [], permission: null, state: 'running' }
    setState({ turn })
    const answer = await getEngineApi().send(prompt, '')
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
    const permission = turn?.permission
    if (!permission) return
    turn.permission = null
    emit()
    await getEngineApi().answer(permission.requestId, allow)
  },

  async stop(): Promise<void> {
    await getEngineApi().stop()
    // Belt and suspenders: the 'closed' event also closes the turn, but the
    // person who pressed Stop should never wait for a wire to agree.
    const turn = state.turn
    if (turn?.state === 'running') {
      turn.items.push({ kind: 'status', text: 'stopped by you' })
      turn.state = 'done'
      turn.permission = null
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

/** Test seam: put the store back to its first day. */
export function resetEngineForTests(): void {
  subscribed = false
  state.on = false
  state.turn = null
  state.settings = { ...DEFAULT_ENGINE }
  emit()
}
