// @vitest-environment jsdom
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { engineStore, resetEngineForTests, type EngineStore } from '../src/renderer/src/state/engine'
import type { EngineEvent } from '../src/shared/lib/engine'

/**
 * The engine's face: the store the panel draws from, and the wiring that puts
 * the panel and the toggle where a person can reach them.
 *
 * The store is tested as logic, because that is where the decisions live: a
 * turn folds whatever order the wire delivers, a permission question always
 * reaches the bridge with the id it came with, and a window with no machine
 * behind it gets honest refusals instead of invented work. The wiring is
 * pinned the way the appearance tests pin their files: the panel is rendered
 * by the chat, the toggle exists, and a send in engine mode never reaches the
 * chat brain.
 */

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8')

type FakeApi = {
  sent: Array<{ prompt: string; cwd: string }>
  answered: Array<{ requestId: string; allow: boolean }>
  stopped: number
  listener: ((event: EngineEvent) => void) | null
}

function withFakeEngine(): FakeApi {
  const fake: FakeApi = { sent: [], answered: [], stopped: 0, listener: null }
  const api = {
    read: async () => ({
      engine: { id: 'claude-code', model: 'gemma4:cloud', baseUrl: 'http://localhost:11434' },
      running: false,
      history: [],
    }),
    pick: async () => ({ ok: true, answer: 'picked' }),
    send: async (prompt: string, cwd: string) => {
      fake.sent.push({ prompt, cwd })
      return { ok: true, answer: 'started' }
    },
    answer: async (requestId: string, allow: boolean) => {
      fake.answered.push({ requestId, allow })
      return { ok: true }
    },
    stop: async () => {
      fake.stopped += 1
      return { ok: true }
    },
    onEvent: (listener: (event: EngineEvent) => void) => {
      fake.listener = listener
      return () => undefined
    },
  }
  ;(window as unknown as Record<string, unknown>).api = {}
  ;(window as unknown as Record<string, unknown>).engineApi = api
  return fake
}

function freshStore(): { store: EngineStore; fake: FakeApi } {
  resetEngineForTests()
  const fake = withFakeEngine()
  return { store: engineStore(), fake }
}

test('a turn folds whatever order the wire delivers it', async () => {
  const { store, fake } = freshStore()
  const started = await store.send('tidy the vault notes')
  assert.equal(started.ok, true)
  assert.deepEqual(fake.sent[0], { prompt: 'tidy the vault notes', cwd: '' })

  const events: EngineEvent[] = [
    { kind: 'status', text: 'engine ready' },
    { kind: 'tool', name: 'Read', summary: 'C:\\vault\\a.md' },
    { kind: 'text', text: 'Reading done, writing now.' },
    { kind: 'permission', requestId: 'r1', tool: 'Write', summary: 'C:\\vault\\a.md' },
    { kind: 'done', text: 'All tidied.' },
  ]
  for (const event of events) fake.listener?.(event)

  const turn = store.turn
  assert.ok(turn, 'a turn exists')
  assert.equal(turn?.state, 'done')
  assert.equal(turn?.permission, null)
  assert.deepEqual(
    turn?.items.map(item => item.kind),
    ['status', 'tool', 'text', 'text'],
    'the permission was a question, not a line of the story; the done text joined it',
  )
  assert.equal(turn?.prompt, 'tidy the vault notes')
})

test('a permission question goes back to the bridge with the id it came with', async () => {
  const { store, fake } = freshStore()
  await store.send('x')
  fake.listener?.({ kind: 'permission', requestId: 'req-11', tool: 'Bash', summary: 'npm test' })
  assert.equal(store.turn?.permission?.requestId, 'req-11')

  await store.answer(true)
  assert.deepEqual(fake.answered, [{ requestId: 'req-11', allow: true }])
  assert.equal(store.turn?.permission, null, 'the card is gone the moment it is answered')
  await store.answer(false)
  assert.equal(fake.answered.length, 1, 'answering with no card on the table does nothing')
})

test('a refused send is shown as the result, and the draft rule belongs to the caller', async () => {
  resetEngineForTests()
  ;(window as unknown as Record<string, unknown>).api = {}
  delete (window as unknown as Record<string, unknown>).engineApi // the browser preview: no engine
  const store = engineStore()
  const answer = await store.send('hello')
  assert.equal(answer.ok, false)
  assert.match(answer.answer, /desktop app/)
  assert.equal(store.turn?.state, 'error')
  assert.match(store.turn?.items[0]?.text ?? '', /desktop app/)
})

test('a second task while one is running is refused politely', async () => {
  const { store } = freshStore()
  assert.equal((await store.send('first')).ok, true)
  const second = await store.send('second')
  assert.equal(second.ok, false)
  assert.match(second.answer, /already working/)
})

test('stop reaches the bridge and closes the turn immediately — no wedged panel', async () => {
  const { store, fake } = freshStore()
  await store.send('x')
  await store.stop()
  assert.equal(fake.stopped, 1)
  assert.equal(store.turn?.state, 'done', 'the person who pressed Stop never waits for the wire')
  assert.match(store.turn?.items.at(-1)?.text ?? '', /stopped by you/)
  // And the next task is accepted — the reviewed bug was exactly this refusal.
  const second = await store.send('next task')
  assert.equal(second.ok, true)
})

test('a closed engine announces itself, closing a running turn', async () => {
  const { store, fake } = freshStore()
  await store.send('x')
  fake.listener?.({ kind: 'closed' })
  assert.equal(store.turn?.state, 'done')
  assert.match(store.turn?.items.at(-1)?.text ?? '', /engine stopped/)
  const next = await store.send('again')
  assert.equal(next.ok, true)
})

test('the goodbye is shown once, not twice', async () => {
  const { store, fake } = freshStore()
  await store.send('x')
  fake.listener?.({ kind: 'text', text: 'All tidied.' })
  fake.listener?.({ kind: 'done', text: 'All tidied.' })
  const textItems = store.turn?.items.filter(item => item.kind === 'text') ?? []
  assert.equal(textItems.length, 1)
  assert.equal(store.turn?.state, 'done')
})

test('an error still closes the turn', async () => {
  const { store, fake } = freshStore()
  await store.send('x')
  fake.listener?.({ kind: 'error', text: 'the engine closed with an error: boom' })
  assert.equal(store.turn?.state, 'error')
  assert.equal(store.turn?.permission, null)
})

test('the face is wired: the panel is in the chat, the toggle is in the composer', () => {
  const chat = read('../src/renderer/src/components/ChatView.tsx')
  assert.match(chat, /import EnginePanel from '\.\/EnginePanel'/)
  assert.match(chat, /<EnginePanel \/>/)
  assert.match(chat, /engineOn=\{engineOn\}/)
  const composer = read('../src/renderer/src/components/Composer.tsx')
  assert.match(composer, /aria-pressed=\{engineOn === true\}/)
  assert.match(composer, /onEngineToggle\?/)
  const app = read('../src/renderer/src/App.tsx')
  assert.match(app, /engineStore\(\)\.send\(text\)/)
  assert.match(app, /setEngineOn\(value => !value\)/)
  // The shared contract the whole face speaks.
  assert.match(read('../src/renderer/src/state/engine.ts'), /useSyncExternalStore/)
})
