/**
 * The engine contract — shared by the machine side and the window side.
 *
 * An "engine" is a worker that reads files, edits them and runs commands on the
 * user's behalf: Claude Code today, agy after its Windows check, others later.
 * The app never talks to an engine's private details — it only ever speaks this
 * shape, which is why a second engine can be added without touching a screen.
 *
 * Everything here is plain data on purpose: it crosses the preload bridge, and
 * the window only ever draws it — it never decides anything about it.
 */

export type EngineId = 'claude-code' | 'agy'

/**
 * Which engine to use, which brain to think with, and where the brain lives.
 * The defaults are the ones the owner already verified work on this machine:
 * the big free cloud brain through the local Ollama door.
 */
export type EngineSettings = {
  id: EngineId
  /** The brain the engine thinks with, e.g. `gemma4:cloud`. */
  model: string
  /**
   * Where the engine works — a folder the owner picked, like "open a folder"
   * in a real code app. Empty means the vault, which is the default workplace.
   */
  workspace: string
  /**
   * The door the brain lives behind. Empty means "whatever this machine
   * already has", which lets an Anthropic key work later without app changes.
   */
  baseUrl: string
}

export const DEFAULT_ENGINE: EngineSettings = {
  id: 'claude-code',
  model: 'gemma4:cloud',
  baseUrl: 'http://localhost:11434',
  workspace: '',
}

/** One brain the engine can use, as the engine itself reports it. */
export type EngineModelEntry = {
  name: string
  /** A cloud brain: its work leaves the machine, so the label must say so. */
  cloud: boolean
  /** Gigabytes on disk, for local brains. Cloud brains carry no size. */
  sizeGB: number | null
}

const ENGINES: readonly EngineId[] = ['claude-code', 'agy']

/**
 * A model name may only be a model name. It reaches a command line, so the
 * rule is a pattern, not a comment: letters, digits, dots, colons, and a few
 * separator characters — nothing that a shell could interpret.
 */
const MODEL_PATTERN = /^[\w.:@/-]+$/

/**
 * Read engine settings from a parsed settings file without ever throwing —
 * the same promise the rest of the settings make. Anything missing, unknown
 * or absurd falls back to the default, because a damaged line in a file must
 * never cost somebody their working assistant.
 */
export function normalizeEngine(raw: unknown): EngineSettings {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const id = ENGINES.includes(value.id as EngineId) ? (value.id as EngineId) : DEFAULT_ENGINE.id
  const text = (input: unknown, fallback: string, limit: number): string => {
    const trimmed = typeof input === 'string' ? input.trim().slice(0, limit) : ''
    return trimmed || fallback
  }
  const model = text(value.model, DEFAULT_ENGINE.model, 300)
  return {
    id,
    model: MODEL_PATTERN.test(model) ? model : DEFAULT_ENGINE.model,
    baseUrl: text(value.baseUrl, DEFAULT_ENGINE.baseUrl, 2048),
    workspace: typeof value.workspace === 'string' ? value.workspace.trim().slice(0, 4096) : '',
  }
}

/**
 * One thing the engine did, in the order it happened. The window draws these
 * as they arrive: text becomes bubbles, tool entries become activity cards,
 * a permission becomes an approve/deny card, done/error closes the turn.
 */
export type EngineEvent =
  | { kind: 'status'; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'tool'; name: string; summary: string }
  | { kind: 'permission'; requestId: string; tool: string; summary: string }
  | { kind: 'done'; text: string }
  | { kind: 'error'; text: string }
  | { kind: 'closed' }

/**
 * A short human sentence about a tool call — what it touches, not its whole
 * input. "runs `npm test`" beats forty lines of JSON in a chat bubble.
 */
export function toolSummary(name: string, input: unknown): string {
  const value = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const string_ = (key: string): string => (typeof value[key] === 'string' ? (value[key] as string) : '')
  if (name === 'Bash' || name === 'bash') return string_('command').slice(0, 160)
  if (name === 'Read' || name === 'Write' || name === 'Edit' || name === 'NotebookEdit')
    return string_('file_path').slice(0, 200)
  if (name === 'Glob' || name === 'Grep') return string_('pattern').slice(0, 120)
  const text = JSON.stringify(value) ?? ''
  return text.length <= 160 ? text : `${text.slice(0, 157)}…`
}
