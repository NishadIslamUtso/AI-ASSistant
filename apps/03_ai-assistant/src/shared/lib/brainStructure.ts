/**
 * brainStructure.ts — the second-brain structure (his 2026-10-16 order):
 * the LLM-wiki architecture adapted into this app's own taxonomy, as the
 * DEFAULT, offered through a choice: generate a new structure, or adopt an
 * existing folder without ever overwriting what is already there.
 *
 * The mapping is honest, not cosmetic:
 *   02 Sources  = the immutable intake wall (/raw + /raw/processed) — the
 *                 capture pipeline writes it once and nothing edits it, in
 *                 code, not just in rules;
 *   09 Activity & Undo = the audit log;
 *   00 System/Privacy & Access = the never-check list (/private done right:
 *                 enforced for captures, taught to the engine for reads);
 *   03 Memory/Entities = capsules, the seeded entity layer.
 * What the app was missing is what this adds: 04 Wiki (the engine's own
 * synthesized layer), 05 Journal, 06 People, the index map, and the engine
 * rulebooks (CLAUDE.md, AGENTS.md) at the root where the engines read them.
 */

/** Folders this structure adds, with the one-line purpose each README carries. */
export const BRAIN_FOLDERS: ReadonlyArray<{ relative: string; purpose: string }> = [
  {
    relative: '05 Knowledge',
    purpose:
      'Reusable synthesis, always linked to sources: short, single-topic notes derived from the capture record — never invented, never source of truth.',
  },
  {
    relative: '10 People',
    purpose: 'One file per person: who they are, what was decided with them, with sources linked.',
  },
]

/** Root files this structure adds. */
export const BRAIN_ROOT_FILES: ReadonlyArray<string> = ['index.md', 'CLAUDE.md', 'AGENTS.md']

/** Every relative path the structure may ever write, in a stable order. */
export function brainFilePaths(): string[] {
  const paths: string[] = []
  for (const folder of BRAIN_FOLDERS) paths.push(`${folder.relative}/README.md`)
  paths.push(...BRAIN_ROOT_FILES)
  return paths
}

/** The vault kinds an inspect can honestly report. */
export type BrainKind = 'app-structure' | 'obsidian' | 'llm-wiki' | 'empty' | 'other'

const APP_SIGNATURE = ['00 System', '02 Sources', '09 Activity & Undo']

/**
 * What is this folder? Counted from the real entries, never assumed. An
 * "other" folder is a person's own layout and is treated with the same
 * respect as an app vault: adoption adds, it never bulldozes.
 */
export function classifyBrainRoot(entries: string[]): { kind: BrainKind; entries: string[] } {
  const names = entries.filter(entry => typeof entry === 'string').slice(0, 500)
  const has = (name: string): boolean => names.includes(name)
  let kind: BrainKind = 'other'
  if (names.length === 0 || names.every(name => name.startsWith('.'))) kind = 'empty'
  else if (APP_SIGNATURE.every(has)) kind = 'app-structure'
  else if (has('.obsidian')) kind = 'obsidian'
  else if (has('raw') && has('wiki')) kind = 'llm-wiki'
  return { kind, entries: names }
}

/** The index map: what exists and where the engine records its changes. */
export function indexContent(kind: BrainKind): string {
  const lines = [
    '# Index',
    '',
    'The map of this vault, maintained by the engine. When something is added,',
    'moved, or decided, a line goes under **Changes** — the map is the first',
    'thing read, so it must be the first thing kept true.',
    '',
    '## Where things live',
    '',
  ]
  const places: Array<[string, string]> =
    kind === 'app-structure' || kind === 'empty' || kind === 'other'
      ? [
          ['00 System', 'The app\'s system documents. Privacy & Access is the never-check list — absolute.'],
          ['01 Inbox', 'Intake that still needs attention.'],
          ['02 Sources', 'The capture record. Written once by the app, never edited by anyone.'],
          ['03 Memory', 'Entities, events, connections — the seeded memory layer.'],
          ['04 Working Memory', 'Current Snapshot and Open Loops — what the app is holding right now.'],
          ['05 Knowledge', 'Reusable synthesis, always linked to sources. Not source of truth.'],
          ['06 Review', 'Questions, conflicts, keep-or-forget — ask rather than guess.'],
          ['07 Sharing Receipts', 'What was sent where, and when, with the approval kept.'],
          ['08 Journal', 'Dated notes — the app\'s own journal captures land here.'],
          ['09 Activity & Undo', 'The audit log of every capture.'],
          ['10 People', 'One file per person, decisions linked to sources.'],
        ]
      : kind === 'llm-wiki'
        ? [
            ['raw', 'The intake. Read it, extract from it, never edit it.'],
            ['wiki', 'Synthesized, single-topic notes — the engine\'s own writing.'],
          ]
        : kind === 'obsidian'
          ? [['(the vault\'s own folders)', 'This vault came with its own layout; the app added only what was missing.']]
          : []
  for (const [place, what] of places) lines.push(`- **${place}** — ${what}`)
  lines.push('', '## Changes', '')
  return lines.join('\n')
}

/**
 * The engine rulebook, built from what the folder really is. The engines read
 * CLAUDE.md (claude-code) from the workspace root by itself; AGENTS.md carries
 * the same rules in the other convention. Nothing here is claimed to be
 * enforced by magic: the wall in 02 Sources is enforced by the app's code —
 * this file teaches the engine the rest.
 */
export function rulesContent(kind: BrainKind, forClaude: boolean): string {
  const title = forClaude
    ? '# CLAUDE.md — how to work in this vault'
    : '# AGENTS.md — how to work in this vault'
  const lines = [
    title,
    '',
    'This folder is a second brain. The app captures sources into it; you make',
    'it useful. The rules below are few and absolute.',
    '',
    '## The wall',
    '',
  ]
  if (kind === 'llm-wiki') {
    lines.push('- Never edit or delete anything in `raw/`. It is the record of what came in; synthesis lands in `wiki/`.')
  } else {
    lines.push(
      '- Never edit or delete anything in `02 Sources/`. The app writes each file there once, and that file IS the record of what was captured. Synthesis lands in `05 Knowledge/`.',
      '- Leave `00 System/`, `04 Working Memory/` and `09 Activity & Undo/` to the app.'
    )
  }
  lines.push(
    '',
    '## Privacy',
    '',
  )
  if (kind === 'app-structure' || kind === 'empty' || kind === 'other') {
    lines.push(
      '- `00 System/Privacy & Access.md` lists excluded patterns. They are absolute: never read, index, quote, or link a file whose path matches one — and never copy its contents into a new note.'
    )
  } else {
    lines.push('- If this vault gains a privacy list (the app keeps one in `00 System/Privacy & Access.md`), its patterns are absolute: never read, index, or quote matching files.')
  }
  lines.push(
    '',
    '## Writing notes',
    '',
    '- One topic per note, in `05 Knowledge/` (or `wiki/` where that is the vault\'s own name).',
    '- Every note starts with YAML frontmatter:',
    '',
    '  ```yaml',
    '  ---',
    '  id: YYYYMMDDHHMMSS',
    '  title: "Short title"',
    '  type: concept        # concept | person | project | summary',
    '  status: raw          # raw | processing | verified',
    '  tags: [lowercase-tags]',
    '  connections: ["[[an existing note]]"]',
    '  last_ai_audit: YYYY-MM-DDTHH:MM:SS',
    '  ---',
    '  ```',
    '',
    '- Link only files that exist. A `[[link]]` to a file that is not there is a lie in bold brackets — create the note or drop the link. Link by the file\'s path from the vault root (`[[05 Knowledge/Foo]]`), not by bare name: two files sharing a name make bare links ambiguous, and the app\'s link check reports them.',
    '- Start every new note from a template in `00 System/Templates/` — `Person.md` for someone new, `Knowledge Note.md` for synthesis. Never leave a template\'s placeholders in a finished note.',
    '- A new fact that fits an existing verified note is appended under `## Evolution [YYYY-MM-DD]` — history stays, nothing is silently rewritten. A fact that contradicts it gets `## Contradiction` and both sides.',
    '- Status is a lifecycle, not a mood: `raw` while written, `processing` while you work it, `verified` only when you have re-read it against its sources — and stamp `last_ai_audit` with the date you did.',
    '- A file tagged `#manual` belongs to the owner alone: never edit its text, and never touch even its frontmatter without being asked.',
    '- Say what a source says, never what it implies about being read or agreed with. A visit is not a reading.',
    '- When a new fact contradicts an existing verified note, add a `## Contradiction` section to the old note and say both sides. Do not silently pick a winner.',
    '',
    '## Bookkeeping',
    '',
    '- After any change, append one line under `## Changes` in `index.md`: the date, what was done, where.',
    '- When a source has been fully used, note it and move on — the sources folder keeps everything, so nothing needs deleting.',
    '',
    '## Growing the structure',
    '',
    '- You may add folders or files when the work needs them. Record every addition in `index.md`. Never rename, move, or delete the folders described above.',
  )
  return lines.join('\n')
}

function readmeContent(folder: { relative: string; purpose: string }): string {
  return `# ${folder.relative.split('/').slice(-1)[0]}\n\n${folder.purpose}\n`
}

/** A new person note starts here; the engine copies it, never invents fields. */
const PERSON_TEMPLATE = `---
id: person-<stable-id>
type: person
status: confirmed
importance: normal
sensitivity: ordinary
retention: keep-until-user-deletes
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
sources: ["[[source-id]]"]
related: []
---

# {{title}}

## Overview
Who this is, in two sentences, with the source for each claim.

## Decisions
### <YYYY-MM-DD> - What was decided
- decision: ...
- context: ...
- source: "[[source-id]]"

## Meetings
- [[source-id]] - what it was

## Open Loops
- ...

## Sources
- [[source-id]]
`

/** A synthesized note starts here; status stays raw until audited against its sources. */
const KNOWLEDGE_TEMPLATE = `---
id: <YYYYMMDDHHMMSS>
title: "Short title"
type: concept
status: raw
tags: [lowercase-tags]
connections: ["[[05 Knowledge/an-existing-note]]"]
last_ai_audit: ""
created: <YYYY-MM-DD>
---

# {{title}}

One topic. Say only what the sources say.

## Sources
- [[02 Sources/...]] — what this source contributed

## Evolution
`

/** The exact bytes each structure path gets, adapted to the vault kind. */
export function brainFileContents(kind: BrainKind): Map<string, string> {
  const contents = new Map<string, string>()
  for (const folder of BRAIN_FOLDERS) contents.set(`${folder.relative}/README.md`, readmeContent(folder))
  contents.set('index.md', indexContent(kind))
  contents.set('CLAUDE.md', rulesContent(kind, true))
  contents.set('AGENTS.md', rulesContent(kind, false))
  // Templates are part of the app-shaped vault: an adopted foreign layout is
  // never handed a 00 System folder it did not ask for.
  if (kind === 'app-structure' || kind === 'empty') {
    contents.set('00 System/Templates/Person.md', PERSON_TEMPLATE)
    contents.set('00 System/Templates/Knowledge Note.md', KNOWLEDGE_TEMPLATE)
  }
  return contents
}

/**
 * Which already-present rulebooks differ from the app's current wording —
 * reported by inspect, rewritten by apply only when the owner presses
 * Replace. Rulebooks are the app's own files (COG's framework/content split):
 * they follow the app version, while every note stays the owner's.
 */
export function planBrainRefresh(
  kind: BrainKind,
  readExisting: (relative: string) => string | null
): string[] {
  const contents = brainFileContents(kind)
  const differing: string[] = []
  for (const relative of ['index.md', 'CLAUDE.md', 'AGENTS.md']) {
    const current = contents.get(relative)
    if (current === undefined) continue
    const existing = readExisting(relative)
    if (existing !== null && existing !== current) differing.push(relative)
  }
  return differing
}

/**
 * The plan an apply follows: every structure path that is already there is
 * left exactly as it is (adoption never overwrites), everything missing is
 * written with its full content. `exists` answers for one relative path; the
 * main process backs it with the same path rules as everything else.
 */
export type BrainPlan = {
  kind: BrainKind
  present: string[]
  missing: string[]
  writes: Array<{ relative: string; content: string }>
}

export function planBrainApply(kind: BrainKind, exists: (relative: string) => boolean): BrainPlan {
  const contents = brainFileContents(kind)
  const present: string[] = []
  const missing: string[] = []
  const writes: Array<{ relative: string; content: string }> = []
  for (const [relative, content] of contents) {
    if (exists(relative)) present.push(relative)
    else {
      missing.push(relative)
      writes.push({ relative, content })
    }
  }
  return { kind, present, missing, writes }
}
