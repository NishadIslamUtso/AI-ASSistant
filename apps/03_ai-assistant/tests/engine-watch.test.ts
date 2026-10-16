import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { shouldWatchFire, watchOrder, watchableName, WATCH_NOTE } from '../src/shared/lib/watchMode'

/**
 * Watch mode: a saved order runs when the watched folder changes — but the
 * watcher cannot chase its own tail (engine-written files are suppressed for
 * one cooldown), a busy engine never gets a quiet second task, deletions do
 * not fire, and the fire decision always has a why.
 */

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8')

const base = {
  names: ['notes.md'],
  suppressed: [],
  now: 1_000_000,
  lastEventAt: 0,
  lastFireAt: 0,
  cooldownUntil: 0,
  busy: false,
}

test('the fire decision: quiet first, gaps between, busy never, cooldown holds', () => {
  assert.equal(shouldWatchFire({ ...base, lastEventAt: base.now - 100 }).fire, false, 'still rumbling: debounce')
  const fired = shouldWatchFire({ ...base, lastEventAt: base.now - 6_000 })
  assert.equal(fired.fire, true)
  if (fired.fire) assert.deepEqual(fired.names, ['notes.md'])
  assert.equal(shouldWatchFire({ ...base, lastEventAt: base.now - 6_000, lastFireAt: base.now - 5_000 }).fire, false, 'too soon since the last run: gap')
  assert.equal(shouldWatchFire({ ...base, lastEventAt: base.now - 6_000, busy: true }).fire, false, 'a busy engine gets no quiet second task')
  assert.equal(shouldWatchFire({ ...base, lastEventAt: base.now - 6_000, cooldownUntil: base.now + 1 }).fire, false, 'the tail-chase cooldown holds')
})

test('what counts as change: junk, hidden, and engine-written files are not fire-worthy', () => {
  assert.equal(watchableName('node_modules/x/index.js'), false)
  assert.equal(watchableName('.git/HEAD'), false)
  assert.equal(watchableName('.hidden'), false)
  assert.equal(watchableName('notes.md'), true)
  const suppressed = shouldWatchFire({ ...base, lastEventAt: base.now - 6_000, names: ['src/generated.ts', 'real.md'], suppressed: ['src/generated.ts'] })
  assert.ok(suppressed.fire)
  if (suppressed.fire) assert.deepEqual(suppressed.names, ['real.md'], 'the engine\u2019s own last write is skipped; the real change still fires')
  const none = shouldWatchFire({ ...base, lastEventAt: base.now - 6_000, names: ['node_modules/a.js'] })
  assert.equal(none.fire, false)
  if (!none.fire) assert.equal(none.why, 'nothing-watchable')
})

test('the order carries the trigger names and the anti-loop line', () => {
  const order = watchOrder(['a.md', 'b.md'], 'Summarise what changed in one line.')
  assert.match(order, /^Summarise what changed in one line\./)
  assert.match(order, /a\.md, b\.md/)
  assert.match(order, /do not edit those files just because they changed/)
  assert.match(WATCH_NOTE, /deletions do not fire it/)
  assert.match(WATCH_NOTE, /never chases its own tail/)
})

test('the wiring: the bay has the section, main reports events, and the renderer owns the fire', () => {
  const bay = read('../src/renderer/src/components/EngineBay.tsx')
  assert.match(bay, /WatchSection/, 'the section is mounted')
  const section = read('../src/renderer/src/components/WatchSection.tsx')
  assert.match(section, /Watch the working folder/, 'the folder is the engine\u2019s own working folder')
  assert.match(section, /getEngineApi\(\)\.read\(\)/, 'no second picker: the workspace is where it watches')
  const state = read('../src/renderer/src/state/watch.ts')
  assert.match(state, /store\.send\(prompt\)/, 'a watch run goes through the one send path')
  assert.match(state, /toolPathsOfLastTurn/, 'engine-written files are suppressed after a run')
  const main = read('../src/main/index.ts')
  for (const door of ["'watch:start'", "'watch:stop'", "'watch:status'"]) {
    assert.match(main, new RegExp(door.replace(/[-:]/g, '\\$&')), `main answers ${door}`)
  }
  assert.match(main, /watch:event/, 'main reports, it does not fire')
  const preload = read('../src/preload/index.ts')
  assert.match(preload, /watch:event/)
  const bridge = read('../src/renderer/src/platform/bridge.ts')
  assert.match(bridge, /Watching lives in the desktop app\./, 'the preview fallback refuses honestly')
})
