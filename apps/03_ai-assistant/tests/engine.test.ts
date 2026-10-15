import { EventEmitter } from 'node:events'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createEngineParser } from '../src/main/engine/stream'
import { brainEnvironment, startClaudeCodeSession } from '../src/main/engine/claudeCode'
import { createEngineSocket } from '../src/main/engine/socket'
import { DEFAULT_ENGINE, normalizeEngine, toolSummary, type EngineEvent } from '../src/shared/lib/engine'

/**
 * The engine socket, end to end but without a real engine.
 *
 * What is worth testing is not JSON parsing for its own sake: it is that the
 * wire between the app and Claude Code behaves like the architecture doc says
 * — every sentence the engine speaks becomes something a person can read, a
 * permission question can always be answered, a broken or unknown sentence
 * never crashes anything, and a missing engine produces a sentence that tells
 * the person how to fix it.
 */

/** Collect events, with helpers for the common assertions. */
function recorder(): { events: EngineEvent[]; on(event: EngineEvent): void; last(kind: EngineEvent['kind']): EngineEvent } {
  const events: EngineEvent[] = []
  return {
    events,
    on: (event) => events.push(event),
    last: (kind) => {
      const found = events.filter((event) => event.kind === kind).at(-1)
      assert.ok(found, `expected a ${kind} event, got: ${JSON.stringify(events)}`)
      return found
    },
  }
}

test('the wire: init, words, a tool, and a result become readable events', () => {
  const parser = createEngineParser()
  const events = parser.feed(
    [
      JSON.stringify({ type: 'system', subtype: 'init', model: 'gemma4:cloud' }),
      JSON.stringify({
        type: 'assistant',
        message: { content: [{ type: 'thinking', thinking: 'hidden' }, { type: 'text', text: 'On it.' }] },
      }),
      JSON.stringify({
        type: 'assistant',
        message: { content: [{ type: 'tool_use', name: 'Edit', input: { file_path: 'C:\\my notes\\a.md' } }] },
      }),
      JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: 'File edited.' }),
    ].join('\n') + '\n',
  )
  assert.deepEqual(events, [
    { kind: 'status', text: 'engine ready' },
    { kind: 'text', text: 'On it.' },
    { kind: 'tool', name: 'Edit', summary: 'C:\\my notes\\a.md' },
    { kind: 'done', text: 'File edited.' },
  ])
})

test('the wire: a permission request becomes a card, thinking stays private', () => {
  const parser = createEngineParser()
  const events = parser.feed(
    [
      JSON.stringify({
        type: 'control_request',
        request_id: 'req-7',
        request: { subtype: 'can_use_tool', tool_name: 'Bash', input: { command: 'npm test' } },
      }),
      JSON.stringify({ type: 'assistant', message: { content: [{ type: 'thinking', thinking: 'hmm' }] } }),
    ].join('\n') + '\n',
  )
  assert.deepEqual(events, [{ kind: 'permission', requestId: 'req-7', tool: 'Bash', summary: 'npm test' }])
})

test('the wire: split lines survive, a broken line is skipped, nothing crashes', () => {
  const parser = createEngineParser()
  const first = JSON.stringify({ type: 'system', subtype: 'init' })
  const second = JSON.stringify({ type: 'result', subtype: 'success', result: 'ok' })
  // A stray non-JSON line on its own is skipped and costs nothing.
  assert.deepEqual(parser.feed('total rubbish not json\n'), [])
  // A sentence chopped in half is reassembled from whatever chunks arrive.
  assert.deepEqual(parser.feed(first.slice(0, 12)), [])
  assert.deepEqual(parser.feed(first.slice(12) + '\n'), [{ kind: 'status', text: 'engine ready' }])
  assert.deepEqual(parser.feed(second.slice(0, 12)), [])
  assert.deepEqual(parser.feed(second.slice(12) + '\n'), [{ kind: 'done', text: 'ok' }])
})

test('the wire: a failed result and an unknown future type are handled', () => {
  const parser = createEngineParser()
  const events = parser.feed(
    [
      JSON.stringify({ type: 'teleport', subtype: 'future-feature', magic: true }),
      JSON.stringify({ type: 'result', subtype: 'error_during_execution', is_error: true, result: 'no such file' }),
    ].join('\n') + '\n',
  )
  assert.deepEqual(events, [{ kind: 'error', text: 'no such file' }])
})

test('tool summaries speak about the thing, not the JSON', () => {
  assert.equal(toolSummary('Bash', { command: 'npm test', timeout: 3000 }), 'npm test')
  assert.equal(toolSummary('Read', { file_path: '/vault/today.md', limit: 10 }), '/vault/today.md')
  assert.equal(toolSummary('Whatever', { a: 1 }).length <= 160, true)
})

/** A fake engine command line: a process that records what we write to it. */
function fakeEngine() {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter
    stderr: EventEmitter
    stdin: { write(data: string): boolean }
    killed: boolean
    exitCode: number | null
    signalCode: null
  }
  child.stdout = new EventEmitter()
  child.stderr = new EventEmitter()
  const written: string[] = []
  child.stdin = { write: (data) => (written.push(data), true) }
  child.killed = false
  child.exitCode = null
  child.signalCode = null
  child.kill = function kill() {
    this.killed = true
    this.emit('close', 0)
  }
  return { child, written }
}

test('a session: the task goes down the wire, the events come back up', () => {
  const fake = fakeEngine()
  const rec = recorder()
  const spawnFake = (): unknown => fake.child
  const session = startClaudeCodeSession({
    cwd: '.',
    settings: DEFAULT_ENGINE,
    onEvent: rec.on,
    spawnProcess: (() => fake.child) as unknown as typeof import('node:child_process').spawn,
  })
  assert.equal(session.send('write hello2.txt'), true)
  assert.match(fake.written[0] ?? '', /"type":"user"/)
  assert.match(fake.written[0] ?? '', /hello2\.txt/)
  // The engine answers through stdout, in two pieces, like a real pipe.
  const line = JSON.stringify({ type: 'result', subtype: 'success', result: 'wrote it' }) + '\n'
  fake.child.stdout.emit('data', Buffer.from(line.slice(0, 20), 'utf8'))
  fake.child.stdout.emit('data', Buffer.from(line.slice(20), 'utf8'))
  assert.equal(rec.last('done').text, 'wrote it')
  session.stop()
})

test('a session: a permission card can be allowed, and the answer is on the wire', () => {
  const fake = fakeEngine()
  const rec = recorder()
  const session = startClaudeCodeSession({
    cwd: '.',
    settings: DEFAULT_ENGINE,
    onEvent: rec.on,
    spawnProcess: (() => fake.child) as unknown as typeof import('node:child_process').spawn,
  })
  fake.child.stdout.emit(
    'data',
    Buffer.from(
      JSON.stringify({
        type: 'control_request',
        request_id: 'req-9',
        request: { subtype: 'can_use_tool', tool_name: 'Write', input: { file_path: '/x.txt' } },
      }) + '\n',
      'utf8',
    ),
  )
  const card = rec.last('permission') as Extract<EngineEvent, { kind: 'permission' }>
  session.answer(card.requestId, true)
  assert.match(fake.written[0] ?? '', /"behavior":"allow"/)
  assert.match(fake.written[0] ?? '', /req-9/)
})

test('a session: a missing engine becomes a sentence, not a crash', async () => {
  const rec = recorder()
  const child = new EventEmitter()
  const spawnBroken = (): unknown => {
    // Node reports a command it cannot find asynchronously, through 'error'.
    queueMicrotask(() => child.emit('error', new Error('spawn claude ENOENT')))
    return child
  }
  const session = startClaudeCodeSession({
    cwd: '.',
    settings: DEFAULT_ENGINE,
    onEvent: rec.on,
    spawnProcess: spawnBroken as unknown as typeof import('node:child_process').spawn,
  })
  await new Promise((resolve) => setImmediate(resolve))
  const error = rec.last('error') as Extract<EngineEvent, { kind: 'error' }>
  assert.match(error.text, /not found/i)
  assert.match(error.text, /npm install -g @anthropic-ai\/claude-code/)
  assert.equal(session.send('anything'), false)
})

test('the brain wiring: the Ollama door is set explicitly, no door means no override', () => {
  assert.deepEqual(brainEnvironment('http://localhost:11434'), {
    ANTHROPIC_BASE_URL: 'http://localhost:11434',
    ANTHROPIC_AUTH_TOKEN: 'ollama',
    ANTHROPIC_API_KEY: '',
  })
  assert.deepEqual(brainEnvironment(''), {})
})

test('the socket: one engine at a time, the second task is refused politely', () => {
  const fake = fakeEngine()
  const rec = recorder()
  const socket = createEngineSocket()
  const first = socket.begin({
    cwd: '.',
    settings: DEFAULT_ENGINE,
    onEvent: rec.on,
    spawnProcess: (() => fake.child) as unknown as typeof import('node:child_process').spawn,
  })
  assert.equal(first.ok, true)
  const second = socket.begin({ cwd: '.', settings: DEFAULT_ENGINE, onEvent: rec.on })
  assert.equal(second.ok, false)
  assert.match(second.answer, /already working/)
  socket.stop()
  // After a stop the socket is free again.
  assert.equal(socket.running(), false)
})

test('the socket: agy answers honestly until its Windows check lands', async () => {
  const rec = recorder()
  const socket = createEngineSocket()
  const started = socket.begin({
    cwd: '.',
    settings: { ...DEFAULT_ENGINE, id: 'agy' },
    onEvent: rec.on,
  })
  assert.equal(started.ok, true)
  await new Promise((resolve) => setTimeout(resolve, 10))
  const error = rec.last('error') as Extract<EngineEvent, { kind: 'error' }>
  assert.match(error.text, /not wired in yet/)
})

test('engine settings: a damaged file falls back to the defaults that work', () => {
  assert.deepEqual(normalizeEngine(undefined), DEFAULT_ENGINE)
  assert.deepEqual(normalizeEngine({ id: 'skynet', model: 42 }), DEFAULT_ENGINE)
  const picked = normalizeEngine({ id: 'claude-code', model: ' qwen2.5-coder:3b ', baseUrl: '' })
  assert.equal(picked.model, 'qwen2.5-coder:3b')
  assert.equal(picked.baseUrl, DEFAULT_ENGINE.baseUrl)
})
