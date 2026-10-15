import type { EngineId } from './engine'

/**
 * houseRules.ts — one set of instructions, spoken in every engine's language.
 *
 * The problem: Claude Code and agy each arrive with their own instructions
 * hard-coded inside them, and no app can rewrite those. But both engines were
 * built with official channels for the house rules of the place they run in:
 * Claude Code reads CLAUDE.md, agy reads AGENTS.md (and .agents/rules/). So
 * the app keeps ONE canonical rulebook and each adapter projects it into the
 * file that engine already obeys. The engines keep their nature; the house
 * keeps its rules.
 *
 * The same trick answers consistency across brains: models differ in taste,
 * but the contract below is constant — where files go, what counts as done,
 * what must never be faked — and the app verifies the contract (files exist,
 * artifacts render) instead of trusting any one brain's prose.
 */

/** The canonical rulebook, editable later in Settings. */
export type HouseRules = {
  /** Who the engine is inside this app, and where it works. */
  identity: string
  /** The artifact contract: build real files the app can show. */
  artifacts: string
  /** Approvals go through the engine's own channel, shown as the app's card. */
  permissions: string
  /** Plain words, real results, no mocking. */
  style: string
}

export const DEFAULT_HOUSE_RULES: HouseRules = {
  identity:
    'You are the engine inside AI ASSistant, a desktop app on the owner\u2019s machine. ' +
    'You work in the folder the app gives you. The app shows your work, so keep machine-readable output exact and your words plain.',
  artifacts:
    'Anything visual or shareable — a page, a chart, a diagram, a document — is written as a standalone file in the ' +
    'artifacts/ folder of the workspace (HTML, SVG or Markdown), so the app can show it live. ' +
    'Never describe what you could build: build the file.',
  permissions:
    'When a step needs approval, use the engine\u2019s own approval channel; the app shows it to the owner as a card. ' +
    'Never try to bypass or silently skip an approval.',
  style:
    'Plain words over jargon. Answer the question that was asked. Real files and real results, never placeholders or ' +
    'mocked data — and if something blocked you, say honestly what and why.',
}

/** Where each engine expects its house rules file, by name. */
export const HOUSE_RULES_FILENAME: Record<EngineId, string> = {
  'claude-code': 'CLAUDE.md',
  agy: 'AGENTS.md',
}

/** A heading per engine, so the projection reads native, not translated. */
const HEADING: Record<EngineId, string> = {
  'claude-code': '# House rules (AI ASSistant)',
  agy: '# House rules (AI ASSistant)',
}

/**
 * Compile the canonical rulebook for one engine: the body is the same — that
 * is the whole point — only the file name and heading are native to it.
 */
export function compileFor(engine: EngineId, rules: HouseRules = DEFAULT_HOUSE_RULES): string {
  if (!HOUSE_RULES_FILENAME[engine]) {
    throw new Error(`no house-rules channel for engine: ${String(engine)}`)
  }
  const sections: Array<[string, string]> = [
    ['Who you are', rules.identity],
    ['Artifacts', rules.artifacts],
    ['Approvals', rules.permissions],
    ['How you write', rules.style],
  ]
  const body = sections
    .filter(([, text]) => text.trim().length > 0)
    .map(([title, text]) => `## ${title}\n\n${text.trim()}`)
    .join('\n\n')
  return `${HEADING[engine]}\n\n${body}\n`
}

/**
 * Known quirks of particular brains, absorbed as a small extra instruction
 * block so the owner does not have to re-prompt around them. Empty for
 * brains with nothing recorded — the table grows with experience, and the
 * mechanism (constant rules + per-brain footnote) is what kills variance,
 * not any single entry.
 */
const MODEL_HINTS: Array<{ match: RegExp; hint: string }> = [
  {
    match: /^gemma/i,
    hint:
      'Prefer short, concrete steps and exact file paths. When a task has more than three parts, ' +
      'do them one at a time and check each file exists before moving on.',
  },
  {
    match: /qwen/i,
    hint: 'State every file you create as a full path, and finish with a one-line list of what changed.',
  },
]

export function modelHints(model: string): string {
  const found = MODEL_HINTS.filter(entry => entry.match.test(model)).map(entry => entry.hint)
  return found.join(' ')
}

/** The full instruction block for a turn: rules, then the brain's footnote. */
export function instructionBlock(engine: EngineId, model: string, rules: HouseRules = DEFAULT_HOUSE_RULES): string {
  const hints = modelHints(model)
  const base = compileFor(engine, rules)
  return hints ? `${base}\n## Notes for this brain\n\n${hints}\n` : base
}
