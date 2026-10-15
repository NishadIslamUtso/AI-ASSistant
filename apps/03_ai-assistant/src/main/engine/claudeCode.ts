/**
 * Engine adapter #1: Claude Code, spawned and driven over the wire.
 *
 * This launches the real `claude` command line in stream mode and translates
 * both directions: everything it says becomes engine events for the window,
 * and everything the window answers (a prompt, a permission decision) becomes
 * wire sentences. The CLI keeps doing what it is good at; the app keeps being
 * the face.
 *
 * The two permission flags are not optional. Verified against the real CLI
 * (v2.1.300): without `--permission-mode manual` the CLI runs in "auto" mode
 * and decides for itself (no card is ever sent); without
 * `--permission-prompt-tool stdio` the "may I use this tool?" question never
 * reaches this process, so the app's Allow/Deny cards can never appear.
 * Both were proven by six independent reviewers running the real binary.
 *
 * The brain wiring (which door, which brain) is set per launch from the app's
 * own settings, so the engine works no matter what environment variables the
 * machine happens to have — a fresh laptop needs nothing outside this app.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { StringDecoder } from 'node:string_decoder'
import { join } from 'node:path'
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
 * Everything the engine needs besides the process: where it works and with
 * which brain. The socket passes this shape, so it never has to know which
 * keys the adapter ignores.
 */
export type EngineStartInput = Omit<StartSessionInput, 'spawnProcess'>

/**
 * The engine's launch line, in one place so a test can pin it. The two
 * permission flags are the difference between "the app gates every tool" and
 * "the CLI does whatever it likes" — see the header comment.
 */
export function engineArguments(model: string): string[] {
  const args = [
    '--output-format', 'stream-json',
    '--input-format', 'stream-json',
    '--verbose',
    '--permission-mode', 'manual',
    '--permission-prompt-tool', 'stdio',
  ]
  if (model) args.push('--model', model)
  return args
}

/**
 * Where Windows keeps the `claude` command, which a packaged app cannot see
 * on its own: the installer put it in the USER's npm folder (or the native
 * installer's bin), and PowerShell finds it through the user's PATH — but a
 * launched app gets a slim PATH that knows neither. Prepending those folders
 * to the engine's PATH is the fix, verified by the owner's own error:
 * "'claude' is not recognized as an internal or external command".
 */
export function enginePathPrepend(platform = process.platform, env = process.env): string {
  if (platform !== 'win32') return ''
  const appData = env['APPDATA'] ?? ''
  const userProfile = env['USERPROFILE'] ?? ''
  return [
    appData ? join(appData, 'npm') : '',
    userProfile ? join(userProfile, '.local', 'bin') : '',
  ]
    .filter(Boolean)
    .join(';')
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
  const args = engineArguments(input.settings.model)

  let child: ChildProcess
  const start = input.spawnProcess ?? spawn
  try {
    child = start('claude', args, {
      cwd: input.cwd,
      env: {
        ...process.env,
        ...brainEnvironment(input.settings.baseUrl),
        ...(enginePathPrepend() ? { PATH: `${enginePathPrepend()};${process.env['PATH'] ?? ''}` } : {}),
      },
      // On Windows the command lives behind an npm `.cmd` shim, which only
      // runs through the shell. The one argument that is not a fixed flag is
      // the model name, which the settings layer validates against a strict
      // pattern (`MODEL_PATTERN` in shared/lib/engine.ts) before it can ever
      // reach this line — the safety rule is code, not this comment.
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
  // Bytes can be chopped in the middle of a multi-byte character (Bangla
  // characters are three bytes long, and pipe chunks land wherever they
  // land), so decoding is left to a StringDecoder, which holds the partial
  // character until its remaining bytes arrive. Decoding each chunk on its
  // own corrupts text — that bug was demonstrated by reviewers with real
  // Bangla content, and this is its fix.
  const decoder = new StringDecoder('utf8')
  let stderrTail = ''
  let finished = false

  const deliver = (text: string): void => {
    for (const event of parser.feed(text)) input.onEvent(event)
  }

  child.stdout?.on('data', (chunk: Buffer) => deliver(decoder.write(chunk)))
  child.stderr?.on('data', (chunk: Buffer) => {
    // Keep only the last few hundred characters — the part that says why.
    stderrTail = `${stderrTail}${chunk.toString('utf8')}`.slice(-600)
  })
  child.on('close', (code: number | null) => {
    if (finished) return
    finished = true
    // Anything the engine said in its final breath still counts.
    try {
      for (const event of [...parser.feed(decoder.end()), ...parser.flush()]) input.onEvent(event)
    } catch {
      // A decoder error at the very end must not mask the close itself.
    }
    if (stderrTail.trim() && code !== 0) {
      input.onEvent({ kind: 'error', text: `engine closed with an error: ${stderrTail.trim()}` })
    }
    input.onClose?.(code)
    input.onEvent({ kind: 'closed' })
  })

  return {
    send(prompt: string): boolean {
      if (!isRunning()) return false
      child.stdin?.write(`${JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text: prompt }] } })}\n`)
      return true
    },
    answer(requestId: string, allow: boolean): void {
      if (!isRunning()) return
      // The deny shape needs a `message` — the real CLI rejects a bare deny
      // as an invalid permission result (proven against v2.1.300).
      child.stdin?.write(
        `${JSON.stringify({
          type: 'control_response',
          response: {
            request_id: requestId,
            subtype: 'success',
            response: allow
              ? { behavior: 'allow' }
              : { behavior: 'deny', message: 'The owner said no to this action in AI ASSistant.' },
          },
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
  return (
    'Claude Code was not found on this machine. Install it once in PowerShell: ' +
    'npm install -g @anthropic-ai/claude-code — then fully close AI ASSistant (right-click its tray/taskbar icon, Quit) ' +
    'and open it again, so it can see the fresh install.'
  )
}
