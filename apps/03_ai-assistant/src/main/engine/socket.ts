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
import { startAgySession } from './agy'

export type EngineAnswer = { ok: boolean; answer: string }

export type EngineSocket = {
  /** Hand the engine a task — starts it on the first one, reuses it after. */
  send(prompt: string, input: EngineStartInput & {
    images?: Array<{ mime: string; data: string }>
    /** Overridable for tests — which process starts. Production leaves this out. */
    spawnProcess?: typeof import('node:child_process').spawn
  }): EngineAnswer
  current(): EngineSession | null
  /** True only while a TASK is in flight, not merely while the process lives. */
  turnBusy(): boolean
  running(): boolean
  stop(): void
  /** End the session AND forget its resume id: the next send starts fresh.
   *  Compaction's second half — without the forget, --resume would drag the
   *  whole long conversation right back in. */
  fresh(): void
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
  let sessionEngine: string | null = null
  let busy = false
  let currentCwd = ''

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

  const start = (input: EngineStartInput & { spawnProcess?: typeof import('node:child_process').spawn }): EngineSession => {
    const spawnArgs = {
      ...input,
      onEvent: (event: EngineEvent) => onEvent(input, event),
      onClose: (code: number | null) => {
        busy = false
        input.onClose?.(code)
      },
    }
    // One plug, two adapters: each engine's own file speaks its own wire and
    // emits the same EngineEvents. The face never learns the difference.
    sessionEngine = input.settings.id
    return input.settings.id === 'agy' ? startAgySession(spawnArgs) : startClaudeCodeSession(spawnArgs)
  }

  return {
    send(prompt: string, input: EngineStartInput & { images?: Array<{ mime: string; data: string }> }): EngineAnswer {
      currentCwd = input.cwd

      // Both engines are wired: claude-code on its stream-json wire, agy on
      // its own (verified against the real v1.4.0 binary). An engine that is
      // missing from the machine says so honestly at spawn time — the branch
      // below routes to the right adapter by the setting, nothing else.
      // A different engine was picked: the old process is not asked to speak
      // the other's wire — it is set aside and the chosen engine starts fresh.
      if (session && sessionEngine && input.settings.id !== sessionEngine) {
        session.stop()
        session = null
        sessionEngine = null
        busy = false
      }
      if (session?.isRunning()) {
        if (busy) {
          return { ok: false, answer: 'An engine is already working. Stop it first, or wait for it to finish.' }
        }
        // Same engine, new task — no relaunch, no refusal.
        const sent = session.send(prompt, input.images)
        if (!sent) return { ok: false, answer: 'The engine just closed, try again.' }
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
      const sent = session.send(prompt, input.images)
      if (!sent) return { ok: true, answer: 'starting' }
      busy = true
      return { ok: true, answer: 'started' }
    },
    current: () => session,
    turnBusy: () => busy,
    running: () => session?.isRunning() === true,
    stop: () => session?.stop(),
    fresh: () => {
      session?.stop()
      session = null
      busy = false
      if (currentCwd) memory.save(currentCwd, '')
    },
  }
}
