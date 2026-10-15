import { EventEmitter } from 'node:events'
import { sep as pathSep } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createEngineParser } from '../src/main/engine/stream'
import {
  brainEnvironment,
  engineArguments,
  enginePathPrepend,
  startClaudeCodeSession,
} from '../src/main/engine/claudeCode'
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
 *
 * The launch-line, multi-turn, charset and flush tests exist because six
 * reviewers ran the REAL CLI and found exactly these broken while the fake
 * process tests stayed green. Each fix carries the test that would have
 * caught it.
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

/** A fake engine command line: a process that records how it was started and what we write to it. */
function fakeEngine() {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter
    stderr: EventEmitter
    stdin: { write(data: string): boolean }
    killed: boolean
    exitCode: number | null
    signalCode: null
    kill(): void
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

/** A spawn stub that hands back the fake child and remembers its arguments. */
function spawnCapturing(child: unknown): { spawn: unknown; args: string[]; command: string } {
  const captured = { args: [] as string[], command: '' }
  const spawn = ((command: string, args: string[]): unknown => {
    captured.command = command
    captured.args.push(...args)
    return child
  }) as unknown
  return { spawn, args: captured.args, command: captured.command }
}

test('the launch line pins the two permission flags — without them no card can ever appear', () => {
  const fake = fakeEngine()
  const { spawn, args } = spawnCapturing(fake.child)
  startClaudeCodeSession({
    cwd: '.',
    settings: DEFAULT_ENGINE,
    onEvent: () => undefined,
    spawnProcess: spawn as typeof import('node:child_process').spawn,
  })
  // Proven against the real v2.1.300: manual mode is what makes the CLI ask
  // instead of deciding by itself, and the stdio prompt tool is what routes
  // the question to this process. Both must be on the launch line.
  assert.match(args.join(' '), /--permission-mode manual/)
  assert.match(args.join(' '), /--permission-prompt-tool stdio/)
  assert.match(args.join(' '), /--output-format stream-json/)
  assert.match(args.join(' '), /--input-format stream-json/)
  assert.match(args.join(' '), /--verbose/)
  assert.match(args.join(' '), /--model gemma4:cloud/)
})

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
  assert.deepEqual(events, [
    { kind: 'permission', requestId: 'req-7', tool: 'Bash', summary: 'npm test', detail: 'npm test' },
  ])
})

test('the wire: self-denials, retries and failed tools are news, not silence', () => {
  const parser = createEngineParser()
  const events = parser.feed(
    [
      JSON.stringify({ type: 'system', subtype: 'permission_denied' }),
      JSON.stringify({ type: 'system', subtype: 'api_retry', attempt: 3 }),
      JSON.stringify({
        type: 'user',
        message: { content: [{ type: 'tool_result', is_error: true, content: 'bash: nope: command not found' }] },
      }),
    ].join('\n') + '\n',
  )
  assert.equal(events.length, 3)
  assert.match(events[0].text, /denied/)
  assert.match(events[1].text, /retry 3/)
  assert.match(events[2].text, /command not found/)
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

test('the wire: a final line without its newline is flushed when the engine closes', () => {
  const parser = createEngineParser()
  const last = JSON.stringify({ type: 'result', subtype: 'success', result: 'final words' })
  // The engine said the goodbye but died before the newline.
  assert.deepEqual(parser.feed(last), [])
  assert.deepEqual(parser.flush(), [{ kind: 'done', text: 'final words' }])
  assert.deepEqual(parser.flush(), [], 'a second flush hands back nothing')
})

test('the adapter: a Bangla character split across data chunks arrives intact', () => {
  const fake = fakeEngine()
  const rec = recorder()
  const session = startClaudeCodeSession({
    cwd: '.',
    settings: DEFAULT_ENGINE,
    onEvent: rec.on,
    spawnProcess: (() => fake.child) as unknown as typeof import('node:child_process').spawn,
  })
  const word = 'বাংলা'
  const line = JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: word }] } }) + '\n'
  const bytes = Buffer.from(line, 'utf8')
  // Cut inside the first Bangla character (byte 0 is ASCII, byte 1 is not).
  const cut = 15
  fake.child.stdout.emit('data', bytes.subarray(0, cut))
  fake.child.stdout.emit('data', bytes.subarray(cut))
  const text = rec.last('text') as Extract<EngineEvent, { kind: 'text' }>
  assert.equal(text.text, word)
  session.stop()
})

test('a session: the task goes down the wire, the events come back up', () => {
  const fake = fakeEngine()
  const rec = recorder()
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

test('a session: a denial carries a message — the real CLI rejects a bare deny', () => {
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
        request_id: 'req-10',
        request: { subtype: 'can_use_tool', tool_name: 'Bash', input: { command: 'rm -rf /' } },
      }) + '\n',
      'utf8',
    ),
  )
  const card = rec.last('permission') as Extract<EngineEvent, { kind: 'permission' }>
  session.answer(card.requestId, false)
  const deny = JSON.parse(fake.written[0] ?? '{}')
  assert.equal(deny.response.response.behavior, 'deny')
  assert.equal(typeof deny.response.response.message, 'string')
  assert.ok((deny.response.response.message as string).length > 0)
})

test('a session: closing always announces itself — the window must never wait forever', () => {
  const fake = fakeEngine()
  const rec = recorder()
  let closedCode: number | null | undefined
  const session = startClaudeCodeSession({
    cwd: '.',
    settings: DEFAULT_ENGINE,
    onEvent: rec.on,
    onClose: (code) => {
      closedCode = code
    },
    spawnProcess: (() => fake.child) as unknown as typeof import('node:child_process').spawn,
  })
  session.stop()
  assert.equal(closedCode, 0)
  assert.deepEqual(rec.events.at(-1), { kind: 'closed' })
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

test('the engine PATH: Windows gets its npm folders prepended, other systems get nothing', () => {
  // The owner hit "'claude' is not recognized" inside the installed app —
  // a packaged app does not inherit PowerShell's PATH. These folders are
  // where npm and the native installer put claude on Windows.
  assert.equal(enginePathPrepend('linux', {}), '')
  assert.equal(enginePathPrepend('darwin', {}), '')
  const windowsPath = enginePathPrepend('win32', { APPDATA: 'C:\\Users\\x\\AppData\\Roaming', USERPROFILE: 'C:\\Users\\x' })
  // Built with the same path.join the code uses, so the separators are
  // correct on whichever platform runs the test.
  const expected = ['C:\\Users\\x\\AppData\\Roaming', 'npm'].join(pathSep) + ';' + ['C:\\Users\\x', '.local', 'bin'].join(pathSep)
  assert.equal(windowsPath, expected)
  assert.equal(enginePathPrepend('win32', {}), '', 'empty variables contribute nothing, never a bare separator')
})

test('the brain wiring: the Ollama door is set explicitly, no door means no override', () => {
  assert.deepEqual(brainEnvironment('http://localhost:11434'), {
    ANTHROPIC_BASE_URL: 'http://localhost:11434',
    ANTHROPIC_AUTH_TOKEN: 'ollama',
    ANTHROPIC_API_KEY: '',
  })
  assert.deepEqual(brainEnvironment(''), {})
})

test('the launch arguments are a pure function of the model', () => {
  assert.deepEqual(engineArguments('qwen2.5-coder:3b').slice(-2), ['--model', 'qwen2.5-coder:3b'])
  assert.equal(engineArguments('').includes('--model'), false)
})

test('the throttle maps to the engine\u2019s own official modes, ask unchanged', () => {
  // The default stays exactly what always ran: manual (the CLI's alias for ask-first).
  assert.equal(engineArguments('m').includes('manual'), true)
  assert.equal(engineArguments('m', 'ask').includes('manual'), true)
  assert.equal(engineArguments('m', 'edits').includes('acceptEdits'), true)
  assert.equal(engineArguments('m', 'full').includes('bypassPermissions'), true)
  // Only the mode value moves; the wire sentence and prompt tool stay pinned.
  for (const mode of ['ask', 'edits', 'full'] as const) {
    const args = engineArguments('m', mode)
    assert.equal(args.includes('--permission-prompt-tool'), true)
    assert.equal(args.includes('stream-json'), true)
  }
})

test('the socket: one task at a time, but the next task reuses the living engine', () => {
  const fake = fakeEngine()
  const rec = recorder()
  const socket = createEngineSocket()
  const input = {
    cwd: '.',
    settings: DEFAULT_ENGINE,
    onEvent: rec.on,
    spawnProcess: (() => fake.child) as unknown as typeof import('node:child_process').spawn,
  }
  const first = socket.send('first task', input)
  assert.equal(first.ok, true)
  assert.equal(socket.turnBusy(), true)
  // While it works, a second task is refused politely.
  const during = socket.send('second task', input)
  assert.equal(during.ok, false)
  assert.match(during.answer, /already working/)
  // The engine finishes — same process, ready for more (the real CLI does
  // exactly this; the old code refused the second task forever).
  const line = JSON.stringify({ type: 'result', subtype: 'success', result: 'done' }) + '\n'
  fake.child.stdout.emit('data', Buffer.from(line, 'utf8'))
  assert.equal(socket.turnBusy(), false)
  const second = socket.send('second task', input)
  assert.equal(second.ok, true, 'a finished task must not block the next one')
  assert.equal(fake.written.filter((line_) => line_.includes('"type":"user"')).length, 2)
  socket.stop()
})

test('the socket: a stop frees the turn even before any event arrives', () => {
  const fake = fakeEngine()
  const rec = recorder()
  const socket = createEngineSocket()
  socket.send('x', {
    cwd: '.',
    settings: DEFAULT_ENGINE,
    onEvent: rec.on,
    spawnProcess: (() => fake.child) as unknown as typeof import('node:child_process').spawn,
  })
  socket.stop()
  assert.equal(socket.turnBusy(), false)
  assert.equal(socket.running(), false)
})

test('the socket: agy answers honestly and does not pretend to start', async () => {
  const rec = recorder()
  const socket = createEngineSocket()
  const answer = socket.send('x', {
    cwd: '.',
    settings: { ...DEFAULT_ENGINE, id: 'agy' },
    onEvent: rec.on,
  })
  assert.equal(answer.ok, false)
  assert.match(answer.answer, /not wired in yet/)
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

test('engine settings: a model name can never carry shell meaning', () => {
  // The model reaches a command line, so anything shell-shaped falls back to
  // the safe default instead of travelling further.
  assert.equal(normalizeEngine({ model: 'gemma4:cloud & del /q *' }).model, DEFAULT_ENGINE.model)
  assert.equal(normalizeEngine({ model: 'x"; calc' }).model, DEFAULT_ENGINE.model)
  assert.equal(normalizeEngine({ model: 'gemma4:cloud' }).model, 'gemma4:cloud')
  // The throttle: anything unknown falls back to ask; the real modes persist.
  assert.equal(normalizeEngine({ approval: 'yolo' }).approval, 'ask')
  assert.equal(normalizeEngine({ approval: 'full' }).approval, 'full')
  assert.equal(normalizeEngine({}).approval, 'ask')
})

test('tool summaries speak about the thing, not the JSON', () => {
  assert.equal(toolSummary('Bash', { command: 'npm test', timeout: 3000 }), 'npm test')
  assert.equal(toolSummary('Read', { file_path: '/vault/today.md', limit: 10 }), '/vault/today.md')
  assert.equal(toolSummary('Whatever', { a: 1 }).length <= 160, true)
})
