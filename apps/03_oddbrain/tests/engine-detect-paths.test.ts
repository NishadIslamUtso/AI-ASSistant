import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkBinary, defaultCandidates } from '../src/main/engine/availability'
import { engineCandidates, resolveEngineCommand } from '../src/main/engine/enginePath'
import type { EngineAvailability } from '../src/shared/lib/engine'

/**
 * The owner's machine: engines installed while the app's PATH snapshot was
 * stale, so a bare-name spawn answered "'agy' is not recognized as an
 * internal or external command". Three guards are pinned here: the known
 * install spots are listed at all, detection probes them by absolute path
 * when the PATH answer fails, and a launch prefers an absolute binary.
 */

const fakeEnv = (dir: string): NodeJS.ProcessEnv => ({ APPDATA: dir, USERPROFILE: dir, LOCALAPPDATA: join(dir, 'local') })

test('engineCandidates lists the npm folder and .local/bin on Windows-shaped envs', () => {
  const spots = engineCandidates('claude-code', fakeEnv('\\Users\\nishad\\home'))
  assert.ok(spots.some(p => p.includes('npm') && p.endsWith('claude.cmd')), JSON.stringify(spots))
  assert.ok(spots.some(p => p.includes('.local') && p.includes('bin')), JSON.stringify(spots))
  const agySpots = engineCandidates('agy', fakeEnv('\\Users\\nishad\\home'))
  assert.ok(agySpots.some(p => p.endsWith('agy.exe')), JSON.stringify(agySpots))
})

test('checkBinary falls back to an absolute probe and reports where it found the engine', async () => {
  const asked: string[] = []
  const runner = (command: string, _args: string[], onDone: (error: unknown, stdout: string) => void) => {
    asked.push(command)
    if (command.endsWith('.cmd') || command === 'claude') onDone(new Error('not recognized'), '')
    else onDone(null, '2.1.0 (Claude Code)')
  }
  const answer: EngineAvailability = await checkBinary('claude', 'claude-code', {
    runner,
    exists: () => true,
    candidates: ['/users/nishad/npm/claude.cmd', '/users/nishad/.local/bin/claude.exe'],
  })
  assert.equal(answer.found, true)
  assert.equal(answer.version, '2.1.0 (Claude Code)')
  assert.equal(answer.path, '/users/nishad/.local/bin/claude.exe')
  assert.ok(asked.includes('claude'), 'the PATH answer is tried first')
  assert.deepEqual(asked, ['claude', '/users/nishad/npm/claude.cmd', '/users/nishad/.local/bin/claude.exe'], 'spots are probed in order, PATH first')
})

test('checkBinary stays honest when nothing exists: not found, no invented path', async () => {
  const runner = (_command: string, _args: string[], onDone: (error: unknown, stdout: string) => void) =>
    onDone(new Error('not recognized'), '')
  const answer = await checkBinary('agy', 'agy', { runner, exists: () => false })
  assert.equal(answer.found, false)
  assert.equal(answer.path, undefined)
})

test('resolveEngineCommand prefers a binary that really exists on disk', () => {
  const root = mkdtempSync(join(tmpdir(), 'engine-detect-'))
  try {
    mkdirSync(join(root, 'npm'), { recursive: true })
    writeFileSync(join(root, 'npm', 'claude.cmd'), 'echo ok\r\n')
    const env = { APPDATA: root, USERPROFILE: join(root, 'home'), LOCALAPPDATA: join(root, 'local') }
    const command = resolveEngineCommand('claude-code', env)
    assert.equal(command, join(root, 'npm', 'claude.cmd'))
    // ...and hands back the bare name when the machine has none of the spots.
    const bare = resolveEngineCommand('claude-code', { APPDATA: join(root, 'nothing') })
    assert.equal(bare, 'claude')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('defaultCandidates mirrors engineCandidates for both engines', () => {
  const env = fakeEnv('/x')
  assert.deepEqual(defaultCandidates('claude-code', env), engineCandidates('claude-code', env))
  assert.deepEqual(defaultCandidates('agy', env), engineCandidates('agy', env))
})
