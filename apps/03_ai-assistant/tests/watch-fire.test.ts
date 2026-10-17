// @vitest-environment jsdom
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * Watch mode's END TO END proof: a real change event drives the store's own
 * debounce, fire decision and ONE send path. This is the test that fails when
 * maybeFire is bricked — its predecessors tested the decision function and the
 * disk filter, and a watch mode that never fired passed all of them.
 */

const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

test('a real change fires the order once, through the one send path; the cooldown holds', async () => {
  // The debounce and quiet windows are product values (seconds). The seam
  // shortens them for the test only — the machinery under test is unchanged.
  ;(globalThis as { __obWatchDebounceMs?: number }).__obWatchDebounceMs = 40

  const sends: string[] = []
  let onTick: null | ((tick: { names: string[] }) => void) = null
  ;(window as unknown as Record<string, unknown>).api = {}
  ;(window as unknown as Record<string, unknown>).engineApi = {
    read: async () => ({
      engine: { id: 'claude-code', model: 'm', baseUrl: '', workspace: '', approval: 'ask' },
      running: false,
      history: [],
    }),
    send: async (prompt: string) => {
      sends.push(prompt)
      return { ok: true, answer: 'started' }
    },
    onEvent: () => () => undefined,
    onPullEvent: () => () => undefined,
    watch: {
      start: async () => ({ ok: true, answer: 'watching' }),
      stop: async () => ({ ok: true, answer: '' }),
      onEvent: (listener: typeof onTick) => {
        onTick = listener
        return () => undefined
      },
    },
  }
  const { resetEngineForTests } = await import('../src/renderer/src/state/engine')
  const { startWatching, watchState } = await import('../src/renderer/src/state/watch')
  resetEngineForTests()

  const folder = mkdtempSync(join(tmpdir(), 'watch-fire-'))
  const started = await startWatching(folder, 'Summarise what changed in one line.')
  assert.equal(started, true, 'the watch started')
  assert.ok(onTick, 'the store subscribed to the watcher')

  // A REAL file really changes; the tick carries the relative name the
  // watcher would report.
  writeFileSync(join(folder, 'notes.md'), 'the engine should hear about this')
  onTick!({ names: ['notes.md'] })
  await wait(300)

  assert.equal(sends.length, 1, `exactly one fire, got ${sends.length}`)
  assert.match(sends[0] ?? '', /notes\.md/, 'the fire names what changed')
  assert.match(sends[0] ?? '', /Summarise what changed in one line\./, 'the order rides the send')
  assert.equal(watchState().runs, 1, 'the counter tells the truth')

  // A second tick inside the cooldown is the tail the mode exists to avoid.
  onTick!({ names: ['notes.md'] })
  await wait(300)
  assert.equal(sends.length, 1, 'the cooldown holds: no tail-chase')

  rmSync(folder, { recursive: true, force: true })
  delete (globalThis as { __obWatchDebounceMs?: number }).__obWatchDebounceMs
})
