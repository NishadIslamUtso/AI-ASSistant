/**
 * Vault API integration test.
 *
 * Spins the real server up against a throwaway vault on a spare port and
 * asserts that things actually land on disk. Idea ported from the 01199af1
 * branch ("validate vault write acknowledgements") and rewritten for this
 * build's endpoints.
 *
 * Runs with plain `node --test` — no new dependencies.
 */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')

const PORT = 8766
const BASE = `http://127.0.0.1:${PORT}`
const SERVER = path.join(__dirname, '..', 'server', 'vault-api.cjs')

let tmpDir
let child

function seed(file, content) {
  const full = path.join(tmpDir, file)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}
function read(file) {
  return fs.readFileSync(path.join(tmpDir, file), 'utf-8')
}
async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${BASE}/status`)
      if (res.ok) return
    } catch (e) {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('vault API did not start')
}

test.before(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-brain-test-'))
  seed(
    '04 Working Memory/Open Loops.md',
    '# Open Loops\n\n- [ ] Follow-up: [[gym-plan]] - next check 2026-10-12\n- [x] Done: [[old]]\n',
  )
  seed('04 Working Memory/Current Snapshot.md', '# Current Snapshot\n\nWorking on the clone.\n')

  child = spawn(process.execPath, [SERVER], {
    env: { ...process.env, AI_BRAIN_PATH: tmpDir, AI_ASSISTANT_VAULT_PORT: String(PORT) },
    stdio: 'ignore',
  })
  await waitForServer()
})

test.after(() => {
  child?.kill()
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

test('status reports the vault it is writing into', async () => {
  const res = await fetch(`${BASE}/status`)
  const data = await res.json()
  assert.equal(data.ok, true)
  assert.equal(data.vault, tmpDir)
  assert.ok(data.counts.files >= 2)
})

test('today returns snapshot, open loops, parsed follow-ups and the journal path', async () => {
  const data = await (await fetch(`${BASE}/today`)).json()
  assert.match(data.snapshot, /Working on the clone/)
  assert.match(data.openLoops, /gym-plan/)
  assert.equal(data.followups.length, 1)
  assert.equal(data.followups[0].topic, 'Follow-up: gym-plan')
  assert.equal(data.followups[0].next_check, '2026-10-12')
  assert.match(data.journalPath, /^08 Journal\/\d{4}\/\d{4}-\d{2}-\d{2}\.md$/)
  assert.equal(data.vault, tmpDir)
})

test('blacklist round-trips and is written into Privacy & Access.md', async () => {
  let data = await (await fetch(`${BASE}/blacklist`)).json()
  assert.deepEqual(data.patterns, [])

  const post = await fetch(`${BASE}/blacklist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patterns: ['bank.com/*', 'https://private.example.com/page'] }),
  })
  assert.equal((await post.json()).ok, true)

  data = await (await fetch(`${BASE}/blacklist`)).json()
  assert.deepEqual(data.patterns, ['bank.com/*', 'https://private.example.com/page'])

  const md = read('00 System/Privacy & Access.md')
  assert.match(md, /## Excluded patterns/)
  assert.match(md, /- bank\.com\/\*/)

  // revocable
  await fetch(`${BASE}/blacklist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patterns: [] }),
  })
  data = await (await fetch(`${BASE}/blacklist`)).json()
  assert.deepEqual(data.patterns, [])
})

test('a conversation capture is written to disk under the provider folder', async () => {
  const res = await fetch(`${BASE}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'conversation',
      provider: 'AI ASSistant',
      conversation_id: 'test-1',
      title: 'Unit test chat',
      captured_at: new Date().toISOString(),
      completeness: 'full',
      messages: [{ role: 'user', text: 'hello', timestamp: new Date().toISOString() }],
    }),
  })
  assert.equal((await res.json()).ok, true)

  const year = new Date().getFullYear()
  const file = `02 Sources/Conversations/AI ASSistant/${year}/test-1.md`
  const md = read(file)
  assert.match(md, /Unit test chat/)
  assert.match(md, /### \[user\]/)
  assert.match(md, /hello/)
})

test("an inaccessible source is logged, never silently dropped", async () => {
  const res = await fetch(`${BASE}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'wasnt_accessible',
      url: 'https://blocked.example.com/x',
      reason: 'permission denied',
      provider: 'web',
      captured_at: new Date().toISOString(),
    }),
  })
  assert.equal((await res.json()).ok, true)

  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const errors = read(`01 Inbox/Processing Errors/${year}-${month}.md`)
  assert.match(errors, /wasn't accessible: https:\/\/blocked\.example\.com\/x/)
  assert.match(errors, /permission denied/)
})

test('an artifact capture writes the runnable file and a linked note', async () => {
  const res = await fetch(`${BASE}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'artifact',
      artifact: {
        id: 'art-1',
        title: 'Tic Tac Toe',
        type: 'html',
        content: '<!doctype html><html><body>hi</body></html>',
      },
    }),
  })
  assert.equal((await res.json()).ok, true)
  assert.match(read('02 Sources/Attachments/artifacts/art-1.html'), /<body>hi<\/body>/)
  assert.match(read('02 Sources/Attachments/artifacts/art-1.md'), /Tic Tac Toe/)
})
