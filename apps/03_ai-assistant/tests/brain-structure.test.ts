import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  brainFileContents,
  brainFilePaths,
  classifyBrainRoot,
  planBrainApply,
} from '../src/shared/lib/brainStructure'

/**
 * The second-brain structure (his 2026-10-16 order). The one rule everything
 * here protects: adoption ADDS, it never overwrites. What a folder already
 * holds is counted, named, and left exactly as it was.
 */

test('classify reads the real entries, never guesses', () => {
  assert.equal(classifyBrainRoot(['00 System', '02 Sources', '09 Activity & Undo', 'index.md']).kind, 'app-structure')
  assert.equal(classifyBrainRoot(['.obsidian', 'Notes', 'Daily']).kind, 'obsidian')
  assert.equal(classifyBrainRoot(['raw', 'wiki', 'journal', 'CLAUDE.md']).kind, 'llm-wiki')
  assert.equal(classifyBrainRoot([]).kind, 'empty')
  assert.equal(classifyBrainRoot(['.stash']).kind, 'empty')
  assert.equal(classifyBrainRoot(['Documents', 'budget.xlsx']).kind, 'other')
})

test('the default structure is five files: wiki, people, index and the two rulebooks', () => {
  assert.deepEqual([...brainFilePaths()].sort(), [
    '05 Knowledge/README.md',
    '10 People/README.md',
    'AGENTS.md',
    'CLAUDE.md',
    'index.md',
  ])
})

test('on a fresh folder the plan writes everything, and the rules carry the wall and the link honesty', () => {
  const plan = planBrainApply('app-structure', () => false)
  assert.equal(plan.writes.length, 5)
  const claude = plan.writes.find(file => file.relative === 'CLAUDE.md')
  assert.ok(claude)
  assert.match(claude.content, /Never edit or delete anything in `02 Sources\/`/)
  assert.match(claude.content, /Synthesis lands in `05 Knowledge\/`/)
  assert.match(claude.content, /Link only files that exist/)
  assert.match(claude.content, /excluded patterns.*absolute/s)
  const agy = plan.writes.find(file => file.relative === 'AGENTS.md')
  assert.ok(agy && agy.content.includes('AGENTS.md'))
  const index = plan.writes.find(file => file.relative === 'index.md')
  assert.ok(index && index.content.includes('## Changes'))
})

test('a raw/wiki vault is met where it stands: the rules speak its names', () => {
  const plan = planBrainApply('llm-wiki', relative => relative === 'raw/README.md')
  const claude = plan.writes.find(file => file.relative === 'CLAUDE.md')
  assert.ok(claude)
  assert.match(claude.content, /Never edit or delete anything in `raw\/`/)
  assert.ok(!claude.content.includes('02 Sources'))
  // An existing path is never planned for writing, even when siblings are missing.
  assert.ok(!plan.writes.some(file => file.relative === 'raw/README.md'))
  assert.ok(plan.writes.every(file => brainFilePaths().includes(file.relative)))
  // And the index map speaks this vault's own names.
  const index = plan.writes.find(file => file.relative === 'index.md')
  assert.ok(index && index.content.includes('raw') && index.content.includes('wiki'))
})

test('apply on a real folder lands byte for byte, and a second apply adds nothing', t => {
  const root = mkdtempSync(join(tmpdir(), 'ai-assistant-structure-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  // The app's own door logic: plan, then write each file exclusively.
  const applyOnce = (): string[] => {
    const names = existsSync(root) ? [] : []
    const { kind } = classifyBrainRoot(names.length ? names : [])
    const plan = planBrainApply(kind, relative => existsSync(join(root, relative)))
    for (const file of plan.writes) {
      mkdirSync(join(root, file.relative, '..'), { recursive: true })
      writeFileSync(join(root, file.relative), file.content, { flag: 'wx' })
    }
    return plan.writes.map(file => file.relative)
  }
  const first = applyOnce()
  assert.equal(first.length, 5)
  assert.ok(existsSync(join(root, '05 Knowledge/README.md')))
  assert.ok(existsSync(join(root, '10 People/README.md')))
  assert.match(readFileSync(join(root, 'index.md'), 'utf8'), /## Changes/)
  const second = applyOnce()
  assert.equal(second.length, 0)
})

test('the structure content is a fixed, honest set — same bytes for the same kind', () => {
  const a = brainFileContents('app-structure')
  const b = brainFileContents('app-structure')
  assert.equal(a.get('CLAUDE.md'), b.get('CLAUDE.md'))
  assert.notEqual(a.get('CLAUDE.md'), a.get('AGENTS.md'))
})
