/**
 * Watch mode: keep an eye on a folder; when its files change, send a saved
 * work order. The toolbrain/morphllm idea (run the check on every change),
 * made the app's: the runs are ordinary engine turns — same cards, same
 * Stop — and the watcher cannot chase its own tail, because the files the
 * engine itself just touched are suppressed for one cooldown. Deleting is
 * not change enough to spend a run on; the note says so up front.
 */

import { REPO_MAP_IGNORES } from './repoMap'

export const WATCH_DEBOUNCE_MS = 5_000
export const WATCH_MIN_GAP_MS = 15_000
export const WATCH_COOLDOWN_MS = 15_000
export const WATCH_MAX_NAMES = 5

export type WatchFireInput = {
  /** Watch-event file names, already rooted at the watched folder. */
  names: string[]
  /** Files to ignore once: the engine touched these during the last run. */
  suppressed: string[]
  now: number
  lastEventAt: number
  lastFireAt: number
  /** Set when a run finishes: its cooldown holds until this moment. */
  cooldownUntil: number
  busy: boolean
}

export type WatchFireDecision = { fire: false; why: string } | { fire: true; names: string[] }

/** A name worth watching: not hidden, not in an ignored folder, not deep junk. */
export function watchableName(name: string): boolean {
  if (!name) return false
  const parts = name.split(/[\\/]/)
  if (parts.some(part => REPO_MAP_IGNORES.has(part))) return false
  if (parts.some(part => part.startsWith('.'))) return false
  return true
}

/**
 * The one decision the watcher gets right or wrong: fire, or say why not.
 * Debounce waits for quiet; the gap and the engine-touched cooldown keep it
 * from chasing its own tail; a busy engine never gets a second task quietly.
 */
export function shouldWatchFire(input: WatchFireInput): WatchFireDecision {
  if (input.busy) return { fire: false, why: 'busy' }
  if (input.now < input.cooldownUntil) return { fire: false, why: 'cooldown' }
  if (input.now - input.lastEventAt < WATCH_DEBOUNCE_MS) return { fire: false, why: 'debounce' }
  if (input.lastFireAt > 0 && input.now - input.lastFireAt < WATCH_MIN_GAP_MS) return { fire: false, why: 'gap' }
  const names = input.names
    .filter(name => watchableName(name))
    .filter(name => !input.suppressed.some(hidden => name === hidden || name.startsWith(`${hidden}/`)))
  if (!names.length) return { fire: false, why: 'nothing-watchable' }
  return { fire: true, names: names.slice(0, WATCH_MAX_NAMES) }
}

/** The one-time order the watcher sends. Plain, checkable, no loops of its own. */
export function watchOrder(names: string[], order: string): string {
  const list = names.join(', ')
  return `${order.trim()}\n\n(The watcher sent this because these files changed: ${list}. Deal with the change the order describes; do not edit those files just because they changed.)`
}

/** The note under the form, so the deletion rule is never a surprise. */
export const WATCH_NOTE =
  'Changes fire the order after a few seconds of quiet; deletions do not fire it. Files the engine itself wrote are ignored for one cooldown, so the watcher never chases its own tail. Stop is always one press away.'
