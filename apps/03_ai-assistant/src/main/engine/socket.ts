/**
 * The socket: the one plug between the app and whatever engine is chosen.
 *
 * The window never knows which engine is behind it — it sends a task, receives
 * events, answers permission cards. Adding engine #2 (agy) later means adding
 * one branch here and nothing else.
 *
 * Sessions outlive tasks. The real CLI stays alive after finishing a task,
 * ready for the next one (verified against v2.1.300), so one session serves
 * many tasks: a second task while the engine is idle goes to the same
 * process; only a task arriving while another is still running is refused.
 */
import type { EngineEvent } from '../../shared/lib/engine'
import { startClaudeCodeSession, type EngineSession, type EngineStartInput } from './claudeCode'

export type EngineAnswer = { ok: boolean; answer: string }

export type EngineSocket = {
  /** Hand the engine a task — starts it on the first one, reuses it after. */
  send(prompt: string, input: EngineStartInput): EngineAnswer
  current(): EngineSession | null
  /** True only while a TASK is in flight, not merely while the process lives. */
  turnBusy(): boolean
  running(): boolean
  stop(): void
}

/**
 * Where the socket remembers engine sessions, so a conversation can survive
 * an app restart: one id per workspace folder. Both halves are injectable
 * for tests; production hands a small JSON file.
 */
export type SessionMemory = {
  load(cwd: string): string
  save(cwd: string, sessionId: string): void
}

export const noSessionMemory: SessionMemory = { load: () => '', save: () => undefined }

export function createEngineSocket(memory: SessionMemory = noSessionMemory): EngineSocket {
  let session: EngineSession | null = null
  let busy = false

  const onEvent = (input: EngineStartInput, event: EngineEvent): void => {
    // The socket owns the busy flag: a finished or failed task frees the
    // engine for the next one. Everything else is forwarded untouched.
    if (event.kind === 'done' || event.kind === 'error') busy = false
    if (event.kind === 'session') {
      // Persisted per workspace, so the next launch of the app can continue
      // this conversation where it left off. (The live process is tracked by
      // `session` itself; the memory matters only after the process is gone.)
      memory.save(input.cwd, event.id)
    }
    input.onEvent(event)
  }

  const start = (input: EngineStartInput): EngineSession => {
    return startClaudeCodeSession({
      ...input,
      onEvent: (event) => onEvent(input, event),
      onClose: (code) => {
        busy = false
        input.onClose?.(code)
      },
    })
  }

  return {
    send(prompt: string, input: EngineStartInput): EngineAnswer {
      // Engine #2 arrives after its Windows check (architecture doc, 6.3).
      // Until then it refuses honestly instead of pretending to start.
      if (input.settings.id === 'agy') {
        const text = 'agy is not wired in yet — its Windows check comes first (plan 6.3).'
        queueMicrotask(() => {
          input.onEvent({ kind: 'error', text } satisfies EngineEvent)
          input.onClose?.(null)
        })
        return { ok: false, answer: text }
      }
      if (session?.isRunning()) {
        if (busy) {
          return { ok: false, answer: 'An engine is already working. Stop it first, or wait for it to finish.' }
        }
        // Same engine, new task — no relaunch, no refusal.
        const sent = session.send(prompt)
        if (!sent) return { ok: false, answer: 'The engine just closed — try again.' }
        busy = true
        return { ok: true, answer: 'started' }
      }
      // Fresh start. If this workspace had a session before the app (or the
      // engine) closed, continue it — the owner's conversation is not lost
      // just because a process ended.
      session = start({ ...input, resumeId: memory.load(input.cwd) })
      if (!session.isRunning()) {
        return { ok: false, answer: 'The engine could not be started on this machine.' }
      }
      const sent = session.send(prompt)
      if (!sent) return { ok: true, answer: 'starting' }
      busy = true
      return { ok: true, answer: 'started' }
    },
    current: () => session,
    turnBusy: () => busy,
    running: () => session?.isRunning() === true,
    stop: () => session?.stop(),
  }
}
