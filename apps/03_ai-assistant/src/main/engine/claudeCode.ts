/**
 * Engine adapter #1: Claude Code, spawned and driven over the wire.
 *
 * This launches the real `claude` command line in stream mode and translates
 * both directions: everything it says becomes engine events for the window,
 * and everything the window answers (a prompt, a permission decision) becomes
 * wire sentences. The CLI keeps doing what it is good at; the app keeps being
 * the face.
 *
 * The brain wiring (which door, which brain) is set per launch from the app's
 * own settings, so the engine works no matter what environment variables the
 * machine happens to have — a fresh laptop needs nothing outside this app.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import type { EngineEvent, EngineSettings } from '../../shared/lib/engine'
import { createEngineParser } from './stream'

export type EngineSession = {
  /** Hand the engine a task. Returns false if the session already closed. */
  send(prompt: string): boolean
  /** Answer a permission the engine asked for. */
  answer(requestId: string, allow: boolean): void
  /** Close the engine now. */
  stop(): void
  isRunning(): boolean
}

export type StartSessionInput = {
  cwd: string
  settings: EngineSettings
  onEvent(event: EngineEvent): void
  onClose?(code: number | null): void
  /**
   * Overridable for tests — how a process is started. Production leaves this
   * out and gets the real `spawn`.
   */
  spawnProcess?: typeof spawn
}

/**
 * The environment the engine needs to think with the app's chosen brain.
 * With the local Ollama door there is no key and no account — the token is
 * the literal word `ollama`, which that door accepts.
 */
export function brainEnvironment(baseUrl: string): Record<string, string> {
  if (!baseUrl) return {}
  return {
    ANTHROPIC_BASE_URL: baseUrl,
    ANTHROPIC_AUTH_TOKEN: 'ollama',
    ANTHROPIC_API_KEY: '',
  }
}

export function startClaudeCodeSession(input: StartSessionInput): EngineSession {
  const args = ['--output-format', 'stream-json', '--input-format', 'stream-json', '--verbose']
  if (input.settings.model) args.push('--model', input.settings.model)

  let child: ChildProcess
  const start = input.spawnProcess ?? spawn
  try {
    child = start('claude', args, {
      cwd: input.cwd,
      env: { ...process.env, ...brainEnvironment(input.settings.baseUrl) },
      // On Windows the command lives behind an npm `.cmd` shim, which only
      // runs through the shell. The arguments are all ours — no user text is
      // ever placed on the command line — so this is safe to enable there.
      shell: process.platform === 'win32',
    })
  } catch {
    input.onEvent({ kind: 'error', text: notFoundMessage() })
    input.onClose?.(null)
    return deadSession()
  }

  child.on('error', () => {
    // Usually "the command line does not exist" — the engine was never installed.
    input.onEvent({ kind: 'error', text: notFoundMessage() })
  })

  const parser = createEngineParser()
  let stderrTail = ''
  child.stdout?.on('data', (chunk: Buffer) => {
    for (const event of parser.feed(chunk.toString('utf8'))) input.onEvent(event)
  })
  child.stderr?.on('data', (chunk: Buffer) => {
    // Keep only the last few hundred characters — the part that says why.
    stderrTail = `${stderrTail}${chunk.toString('utf8')}`.slice(-600)
  })
  child.on('close', (code: number | null) => {
    if (stderrTail.trim() && code !== 0) {
      input.onEvent({ kind: 'error', text: `engine closed with an error: ${stderrTail.trim()}` })
    }
    input.onClose?.(code)
  })

  return {
    send(prompt: string): boolean {
      if (!isRunning()) return false
      child.stdin?.write(`${JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text: prompt }] } })}\n`)
      return true
    },
    answer(requestId: string, allow: boolean): void {
      if (!isRunning()) return
      child.stdin?.write(
        `${JSON.stringify({
          type: 'control_response',
          response: { request_id: requestId, subtype: 'success', response: { behavior: allow ? 'allow' : 'deny' } },
        })}\n`,
      )
    },
    stop(): void {
      if (isRunning()) child.kill()
    },
    isRunning,
  }

  function isRunning(): boolean {
    return child.exitCode === null && child.signalCode === null && !child.killed
  }

  function deadSession(): EngineSession {
    return {
      send: () => false,
      answer: () => undefined,
      stop: () => undefined,
      isRunning: () => false,
    }
  }
}

function notFoundMessage(): string {
  return 'Claude Code was not found on this machine. Install it once with: npm install -g @anthropic-ai/claude-code'
}
