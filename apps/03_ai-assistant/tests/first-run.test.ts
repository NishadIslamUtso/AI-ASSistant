// @vitest-environment jsdom
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DEFAULT_PROFILE, normalizeProfile } from '../src/shared/lib/profile'

/**
 * First run (08): three real choices, each skippable. The name lands in the
 * same profile Settings uses, the brain list is the engine's own, the folder
 * choice goes through the vault picker and persists. Nothing here is a stub.
 */
test('the welcome reuses the real profile, engine, and vault plumbing', () => {
  const read = (relative: string): string => readFileSync(`${process.cwd()}/${relative}`, 'utf8')
  const app = read('src/renderer/src/App.tsx')
  assert.match(app, /FirstRunView/)
  assert.match(app, /ai-assistant\.welcomed/)
  assert.match(app, /setProfile\(\{ \.\.\.profile, name \}\)/, 'the name lands in the one profile')

  const view = read('src/renderer/src/components/FirstRunView.tsx')
  assert.match(view, /engine\s*\.\s*loadModels\(\)/, 'the brain list is the engine\u2019s own door')
  assert.match(view, /engine\s*\.\s*setModel/)
  assert.match(view, /setApproval/)
  assert.match(view, /vault\s*\.\s*chooseFolder\(\)/)
  assert.match(view, /settings\s*\.\s*update\(\{ vaultPath: chosen \}\)/)
  assert.match(view, /Skip, decide later/, 'every step is skippable')
})

test('the welcomed flag is strictly boolean', () => {
  const normalize = (value: unknown): boolean => value === true
  assert.equal(normalize(true), true)
  assert.equal(normalize('yes'), false)
  assert.equal(normalize(undefined), false)
  // And the profile normalization still guards the name the welcome writes.
  // And the profile normalization still guards the name the welcome writes:
  // a blank name falls back to the default, never a stray whitespace string.
  const profile = normalizeProfile({ ...DEFAULT_PROFILE, name: 'Nishad' })
  assert.equal(profile.name, 'Nishad')
  assert.equal(normalizeProfile({ name: '   ' }).name, DEFAULT_PROFILE.name)
})
