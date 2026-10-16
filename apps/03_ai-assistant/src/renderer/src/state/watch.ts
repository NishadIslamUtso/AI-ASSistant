import { useSyncExternalStore } from 'react'
import { getEngineApi } from '@/platform/bridge'
import { engineStore } from './engine'
import {
  shouldWatchFire,
  watchOrder,
  WATCH_COOLDOWN_MS,
  WATCH_DEBOUNCE_MS,
  type WatchFireDecision,
} from '@shared/lib/watchMode'

/**
 * Watch mode, orchestrated. The watcher in main REPORTS changes; this side
 * makes the one decision — fire or wait — and when it fires, the run is an
 * ordinary turn through the engine store's ONE send path. Files the engine
 * wrote during a run are suppressed for one cooldown, so the watcher can
 * never chase its own tail.
 */

export type WatchState = {
  active: boolean
  folder: string
  order: string
  runs: number
  lastFired: string
  error: string
}

let state: WatchState = {
  active: false,
  folder: '',
  order: '',
  runs: 0,
  lastFired: '',
  error: '',
}

const listeners = new Set<() => void>()
let version = 0

const emit = (): void => {
  version += 1
  for (const listener of listeners) listener()
}

const patch = (part: Partial<WatchState>): void => {
  state = { ...state, ...part }
  emit()
}

let lastEventAt = 0
let lastFireAt = 0
let cooldownUntil = 0
let suppressed: string[] = []
let gathered = new Set<string>()
let quiet: ReturnType<typeof setTimeout> | null = null

/** Files to stop watching for one window: what the engine's last run touched. */
const toolPathsOfLastTurn = (): string[] => {
  const turn = engineStore().turn
  if (!turn) return []
  return turn.items
    .filter(item => item.kind === 'tool')
    .map(item => ((item as { summary?: string }).summary ?? '').trim())
    .filter(Boolean)
}

const maybeFire = (names: string[]): void => {
  // Gather, then wait for quiet: a change fires after a few seconds in
  // which nothing else happened — not on the first heartbeat of a burst.
  lastEventAt = Date.now()
  for (const name of names) gathered.add(name)
  if (quiet) clearTimeout(quiet)
  quiet = setTimeout(() => {
    quiet = null
    if (!state.active) return
    const batch = [...gathered]
    gathered = new Set()
    const store = engineStore()
    const decision: WatchFireDecision = shouldWatchFire({
      names: batch,
      suppressed,
      now: Date.now(),
      lastEventAt,
      lastFireAt,
      cooldownUntil,
      busy: store.turn?.state === 'running',
    })
    if (!decision.fire) return
    const prompt = watchOrder(decision.names, state.order)
    lastFireAt = Date.now()
    cooldownUntil = lastFireAt + WATCH_COOLDOWN_MS
    void (async () => {
      await store.send(prompt)
      // Whatever the engine just wrote is ignored for one cooldown.
      suppressed = toolPathsOfLastTurn()
      patch({ runs: state.runs + 1, lastFired: decision.names.join(', ') })
    })()
  }, WATCH_DEBOUNCE_MS)
}

/** Start watching a folder; the order is saved and said back in full. */
export async function startWatching(folder: string, order: string): Promise<boolean> {
  if (!order.trim()) {
    patch({ error: 'The order is what runs on a change; write it first.' })
    return false
  }
  if (!folder.trim()) {
    patch({ error: 'Set the engine\u2019s working folder first, in the bay above; that is the folder it watches.' })
    return false
  }
  const answer = await getEngineApi().watch.start(folder)
  if (!answer.ok) {
    patch({ error: answer.answer })
    return false
  }
  patch({ active: true, folder, order: order.trim(), error: '', runs: 0, lastFired: '' })
  void getEngineApi().watch.onEvent((tick) => maybeFire(tick.names))
  return true
}

export async function stopWatching(): Promise<void> {
  const answer = await getEngineApi().watch.stop()
  patch({ active: false, folder: '', error: answer.ok ? '' : answer.answer })
}

export const watchState = (): WatchState => state

export function useWatch(): WatchState {
  useSyncExternalStore(
    listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => version,
  )
  return state
}
