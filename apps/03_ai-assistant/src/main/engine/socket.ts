/**
 * The socket: the one plug between the app and whatever engine is chosen.
 *
 * The window never knows which engine is behind it — it sends a task, receives
 * events, answers permission cards. Adding engine #2 (agy) later means adding
 * one branch here and nothing else.
 *
 * One engine works at a time: a second task while one is running is refused
 * with a plain sentence, the way the rest of the app answers, not an exception.
 */
import type { EngineEvent, EngineId, EngineSettings } from '../../shared/lib/engine'
import { startClaudeCodeSession, type EngineSession, type StartSessionInput } from './claudeCode'

export type EngineSocket = {
  begin(input: Omit<StartSessionInput, 'command'>): { ok: boolean; answer: string }
  current(): EngineSession | null
  running(): boolean
  stop(): void
}

export function createEngineSocket(): EngineSocket {
  let session: EngineSession | null = null

  const begin = (input: Omit<StartSessionInput, 'command'>): { ok: boolean; answer: string } => {
    if (session?.isRunning()) {
      return { ok: false, answer: 'An engine is already working. Stop it first, or wait for it to finish.' }
    }
    session = spawnById(input.settings, input)
    return { ok: true, answer: 'started' }
  }

  const spawnById = (settings: EngineSettings, input: Omit<StartSessionInput, 'command'>): EngineSession => {
    const id: EngineId = settings.id
    if (id === 'agy') {
      // Engine #2 arrives after its Windows check (architecture doc, 6.3).
      // Until then it answers honestly instead of pretending.
      const onEvent = input.onEvent
      const text = 'agy is not wired in yet — its Windows check comes first (plan 6.3).'
      queueMicrotask(() => {
        onEvent({ kind: 'error', text } satisfies EngineEvent)
        input.onClose?.(null)
      })
      return deadSession()
    }
    return startClaudeCodeSession(input)
  }

  const deadSession = (): EngineSession => ({
    send: () => false,
    answer: () => undefined,
    stop: () => undefined,
    isRunning: () => false,
  })

  return {
    begin,
    current: () => session,
    running: () => session?.isRunning() === true,
    stop: () => session?.stop(),
  }
}
