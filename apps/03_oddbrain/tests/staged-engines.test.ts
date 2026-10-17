import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  engineCandidates,
  registerStagingRoot,
  resetStagingRoots,
  resolveEngineCommand,
} from '../src/main/engine/enginePath'
import { readFileSync } from 'node:fs'

/**
 * The owner's machine: he put engines where the APP stages them
 * (engines/<id>/app under the app's data folder) and the probe ignored that
 * folder — "still not detected". These pins make the app's own staging
 * ground first-class for probing AND spawning.
 */

const env = { APPDATA: '/x/npm-root', USERPROFILE: '/x/home', LOCALAPPDATA: '/x/local' }

test('a registered staging root is probed first, before the machine spots', () => {
  resetStagingRoots()
  registerStagingRoot('/staged')
  const candidates = engineCandidates('agy', env)
  assert.ok(candidates[0] === join('/staged', 'agy', 'app', 'agy.exe'), candidates[0])
  assert.ok(candidates.some((p) => p === join('/staged', 'agy', 'agy.exe')), JSON.stringify(candidates))
  // claude-code gets its staged spots too, ahead of npm and .local/bin
  const claude = engineCandidates('claude-code', env)
  assert.ok(claude[0] === join('/staged', 'claude-code', 'app', 'claude.exe'))
  assert.ok(claude.some((p) => p.includes('npm')), 'machine spots still listed after the staged ones')
})

test('a binary dropped in the staged folder is what launches', () => {
  const root = mkdtempSync(join(tmpdir(), 'staged-'))
  try {
    const appDir = join(root, 'agy', 'app')
    mkdirSync(appDir, { recursive: true })
    writeFileSync(join(appDir, 'agy.exe'), 'binary', { mode: 0o755 })
    resetStagingRoots()
    registerStagingRoot(root)
    assert.equal(resolveEngineCommand('agy', env), join(appDir, 'agy.exe'))
  } finally {
    resetStagingRoots()
    rmSync(root, { recursive: true, force: true })
  }
})

test('registering the same root twice does not duplicate candidates', () => {
  resetStagingRoots()
  registerStagingRoot('/once')
  registerStagingRoot('/once')
  const candidates = engineCandidates('agy', env)
  assert.equal(candidates.filter((p) => p.startsWith('/once')).length, 5)
})

test('the boot registers the app data engines folder, and retries name the actual fix', () => {
  const index = readFileSync(new URL('../src/main/index.ts', import.meta.url), 'utf8')
  assert.match(index, /registerStagingRoot\(join\(app\.getPath\('userData'\), 'engines'\)\)/)
  const stream = readFileSync(new URL('../src/main/engine/stream.ts', import.meta.url), 'utf8')
  assert.match(stream, /run `claude` once in a terminal and sign in/)
})
