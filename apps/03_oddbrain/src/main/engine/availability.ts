/**
 * availability.ts — what is really on this machine, and whose brains are whose.
 *
 * Two promises live here. First, the engine bay never shows a pickable lie:
 * an engine that is not installed is shown as not installed, with the one
 * command that fixes it. Second, each engine's model list comes from its own
 * true source — Claude Code's brains come from the owner's door (Ollama),
 * because Claude Code reads its brain from the door; agy's brains come from
 * Google and only Google, so until agy has been installed and signed in on
 * this machine, the app says exactly that instead of inventing entries.
 *
 * Detection runs the engine's `--version` once and caches briefly: launching
 * a CLI is cheap, but launching it on every redraw is not.
 */
import { execFile } from 'node:child_process'
import { enginePathSync } from './enginePath'
import type { EngineAvailability, EngineId } from '../../shared/lib/engine'

const INSTALL_HINT: Record<EngineId, string> = {
  'claude-code':
    'Install it once in PowerShell: npm install -g @anthropic-ai/claude-code, then fully quit and reopen OddBrain.',
  agy: 'Install it from google-antigravity/antigravity-cli (antigravity.google), beware fake "gemini-antigravity-cli" repos that hand out exe files.',
}

/** True when the version answer looks like the engine talking, not an error page. */
const plausibleVersion = (text: string): boolean => text.trim().length > 0 && text.length < 200

/**
 * Ask one engine binary whether it exists. Injected runner for tests: in
 * production this is execFile, with the shell on Windows because the engines
 * live behind npm `.cmd` shims there.
 */
export function checkBinary(
  command: string,
  id: EngineId,
  options: {
    runner?: (
      command: string,
      args: string[],
      onDone: (error: unknown, stdout: string) => void,
    ) => void
    timeoutMs?: number
  } = {},
): Promise<EngineAvailability> {
  const run =
    options.runner ??
    ((cmd: string, args: string[], onDone: (error: unknown, stdout: string) => void) => {
      execFile(cmd, args, { shell: process.platform === 'win32', timeout: options.timeoutMs ?? 4000, env: { ...process.env, PATH: enginePathSync() } }, (error, stdout) =>
        onDone(error, typeof stdout === 'string' ? stdout : ''),
      )
    })
  return new Promise((resolve) => {
    run(command, ['--version'], (error, stdout) => {
      resolve({
        id,
        found: !error && plausibleVersion(stdout),
        version: !error && plausibleVersion(stdout) ? stdout.trim().split('\n')[0].slice(0, 80) : '',
        install: INSTALL_HINT[id],
      })
    })
  })
}

const CACHE_MS = 30_000
const cache = new Map<EngineId, { at: number; answer: EngineAvailability }>()

/** Cached once per short window so the bay can ask on every open. */
export async function detectEngine(id: EngineId): Promise<EngineAvailability> {
  const hit = cache.get(id)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.answer
  const answer = await checkBinary(id === 'agy' ? 'agy' : 'claude', id)
  cache.set(id, { at: Date.now(), answer })
  return answer
}

/**
 * The model sources, one per engine — the routing table behind
 * `engine:models`. Claude Code reads its brains from the owner's door; agy
 * answers only to Google. A third engine adds one entry here.
 */
export type ModelSource = {
  /** The brains this engine can really use, from its own source. */
  models(): Promise<{ ok: boolean; models: Array<{ name: string; cloud: boolean; sizeGB: number | null }>; error?: string }>
}

export function agyModelSource(installed: boolean): ModelSource {
  return {
    async models() {
      if (!installed) {
        return {
          ok: false,
          models: [],
          error:
            'agy is not on this machine yet, its brain list is Google\u2019s own (plan-dependent) and appears once agy is installed and signed in. Your Ollama brains cannot plug into agy: it has no custom door.',
        }
      }
      return {
        ok: false,
        models: [],
        error:
          'agy is installed. Sign in once by running `agy` in a terminal, then reopen the bay, its own brain list (Gemini family, plan-gated) will be read from the machine. Ollama brains cannot plug into agy.',
      }
    },
  }
}
