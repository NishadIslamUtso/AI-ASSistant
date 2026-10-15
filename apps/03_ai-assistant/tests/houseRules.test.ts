import { describe, expect, test } from 'vitest'
import {
  DEFAULT_HOUSE_RULES,
  HOUSE_RULES_FILENAME,
  compileFor,
  instructionBlock,
  modelHints,
} from '../src/shared/lib/houseRules'

/**
 * House rules: one rulebook, projected into every engine's own channel.
 * These tests pin the contract that makes results consistent across brains:
 * same body everywhere, native filename per engine, per-brain footnotes.
 */
describe('house rules', () => {
  test('every engine has an official channel to project into', () => {
    expect(HOUSE_RULES_FILENAME['claude-code']).toBe('CLAUDE.md')
    expect(HOUSE_RULES_FILENAME.agy).toBe('AGENTS.md')
  })

  test('compiling for both engines yields the same body, only the wrapper differs', () => {
    const cc = compileFor('claude-code')
    const agy = compileFor('agy')
    expect(cc).toContain('# House rules (AI ASSistant)')
    expect(agy).toContain('# House rules (AI ASSistant)')
    // The portable core: every section appears in both projections.
    for (const section of ['Who you are', 'Artifacts', 'Approvals', 'How you write']) {
      expect(cc).toContain(`## ${section}`)
      expect(agy).toContain(`## ${section}`)
    }
    expect(cc).toBe(agy)
  })

  test('the artifact contract is in the rules: build real files, never describe', () => {
    const text = compileFor('claude-code')
    expect(text).toMatch(/artifacts\//)
    expect(text).toMatch(/build the file/)
  })

  test('no rule section is ever empty in the defaults', () => {
    for (const value of Object.values(DEFAULT_HOUSE_RULES)) {
      expect(value.trim().length).toBeGreaterThan(20)
    }
  })

  test('compiling is deterministic — same rules in, same file out', () => {
    expect(compileFor('claude-code')).toBe(compileFor('claude-code'))
    expect(compileFor('agy', DEFAULT_HOUSE_RULES)).toBe(compileFor('agy'))
  })

  test('a custom rulebook flows through unchanged in meaning', () => {
    const mine = { ...DEFAULT_HOUSE_RULES, style: 'Always answer in Bengali first.' }
    const text = compileFor('claude-code', mine)
    expect(text).toContain('Always answer in Bengali first.')
    expect(text).not.toContain('Plain words over jargon')
  })

  test('an engine with no channel is refused loudly, not silently dropped', () => {
    expect(() => compileFor('mystery' as never)).toThrow(/no house-rules channel/)
  })

  test('per-brain hints: known brains get a footnote, unknown get silence', () => {
    expect(modelHints('gemma4:cloud')).toMatch(/short, concrete steps/)
    expect(modelHints('qwen2.5-coder:3b')).toMatch(/full path/)
    expect(modelHints('some-future-brain:70b')).toBe('')
  })

  test('the full instruction block is rules + footnote, and stable', () => {
    const withHints = instructionBlock('claude-code', 'gemma4:cloud')
    expect(withHints).toContain('# House rules (AI ASSistant)')
    expect(withHints).toContain('Notes for this brain')
    expect(instructionBlock('claude-code', 'unknown-brain')).toBe(compileFor('claude-code'))
  })
})
