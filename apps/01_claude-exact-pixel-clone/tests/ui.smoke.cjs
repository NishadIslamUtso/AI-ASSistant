/**
 * UI smoke test — renders the whole app in jsdom and fails on any console
 * error or uncaught exception.
 *
 * There is no browser in the sandbox, so the app is bundled with esbuild
 * (already present as a transitive dependency of Vite) and driven inside
 * jsdom with a stubbed fetch.
 *
 * jsdom is NOT a declared dependency on purpose — the target machine has a
 * slow connection, and this test is a nicety, not a gate. Install it when you
 * want to run it:
 *
 *     npm i -D jsdom && npm run test:ui
 *
 * Without jsdom the file skips cleanly.
 */
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')

let jsdom, esbuild
try {
  jsdom = require('jsdom')
  esbuild = require('esbuild')
} catch (e) {
  test('UI smoke test', { skip: 'jsdom/esbuild not installed — run `npm i -D jsdom` to enable' }, () => {})
  return
}

const ROOT = path.join(__dirname, '..')
const errors = []

function bundle() {
  const result = esbuild.buildSync({
    entryPoints: [path.join(ROOT, 'src', 'main.jsx')],
    bundle: true,
    format: 'iife',
    jsx: 'automatic',
    loader: { '.jsx': 'jsx', '.css': 'empty' },
    define: { 'process.env.NODE_ENV': '"development"' },
    write: false,
    logLevel: 'silent',
  })
  return result.outputFiles[0].text
}

function ndjson(lines) {
  const enc = new TextEncoder()
  return new ReadableStream({
    start(c) {
      for (const l of lines) c.enqueue(enc.encode(JSON.stringify(l) + '\n'))
      c.close()
    },
  })
}

/** Build a jsdom window whose fetch answers like a local Ollama + vault API. */
function makeDom() {
  const { JSDOM, VirtualConsole } = jsdom
  const vc = new VirtualConsole()
  vc.on('jsdomError', (e) => errors.push('jsdomError: ' + (e.stack || e.message)))
  vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')))

  const dom = new JSDOM(
    '<!doctype html><html data-theme="dark"><head></head><body><div id="root"></div></body></html>',
    { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost:5173/', virtualConsole: vc },
  )
  const { window } = dom
  const doc = window.document

  const payload = async (u) => {
    if (u.includes('/tags'))
      return { models: [{ name: 'qwen2.5:3b', size: 2e9, details: {} }, { name: 'qwen3-vl:4b', size: 3e9, details: {} }] }
    if (u.includes('/show')) return { details: { family: 'qwen2' }, capabilities: ['completion'] }
    if (u.includes('/status')) return { ok: true, vault: '/tmp/vault', counts: { files: 3, entities: 1 } }
    if (u.includes('/today'))
      return {
        date: '2026-10-11',
        snapshot: 'Working on the Claude clone.',
        openLoops: '- [ ] Follow-up: [[gym-plan]] - next check 2026-10-12',
        followups: [{ topic: 'Follow-up: gym-plan', next_check: '2026-10-12', last_update: '' }],
        journal: '',
        journalPath: '08 Journal/2026/2026-10-11.md',
        vault: '/tmp/vault',
      }
    if (u.includes('/blacklist')) return { excluded_patterns: ['bank.com/*'] }
    if (u.includes('/capsules')) return { items: [{ id: 'c1', title: 'Workout plan', type: 'capsule' }] }
    if (u.includes('/context')) return { capsules: [], entities: [] }
    if (u.includes('/capture')) return { ok: true, source: '02 Sources/Conversations/AI ASSISTANT/2026/x.md', duplicate: false }
    return { ok: true }
  }

  window.fetch = async (url, opts) => {
    const u = String(url)
    if (u.includes('/chat')) {
      const body = JSON.parse(opts.body)
      const reply = /\b(tic|tac|toe|game)\b/i.test(JSON.stringify(body.messages))
        ? 'Sure:\n\n```html\n<!doctype html><html><title>Tic Tac Toe</title><body>hi</body></html>\n```\n'
        : 'Sure — here is the answer.\n\n- one\n- two\n'
      const chunks = reply.match(/[\s\S]{1,25}/g) || []
      return {
        ok: true,
        status: 200,
        body: ndjson([
          ...chunks.map((c) => ({ message: { role: 'assistant', content: c }, done: false })),
          { message: { role: 'assistant', content: '' }, done: true },
        ]),
        json: async () => ({}),
        text: async () => '',
      }
    }
    return { ok: true, status: 200, json: async () => payload(u), text: async () => JSON.stringify(await payload(u)) }
  }
  window.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
  window.scrollTo = () => {}
  // jsdom implements neither Element.scrollTo nor scrollIntoView; browsers do.
  // The transcript auto-scroll calls Element.scrollTo on every render.
  window.Element.prototype.scrollTo = () => {}
  window.HTMLElement.prototype.scrollTo = () => {}
  window.HTMLElement.prototype.scrollIntoView = () => {}
  window.alert = () => {}
  window.confirm = () => true
  window.prompt = () => 'test-project'
  if (!window.TextDecoder) window.TextDecoder = require('node:util').TextDecoder

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const click = (el) => el && el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
  const byText = (sel, re) => [...doc.querySelectorAll(sel)].find((e) => re.test((e.textContent || '').trim()))
  const txt = () => doc.getElementById('root').textContent || ''
  const allText = () => doc.body.textContent || '' // dialogs are portalled to <body>
  const type = (el, value) => {
    const proto = el.tagName === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set
    setter.call(el, value)
    el.dispatchEvent(new window.Event('input', { bubbles: true }))
  }
  const key = (el, k, o = {}) =>
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...o }))

  /** Wait until the running response finishes (the Stop button disappears). */
  const waitIdle = async () => {
    await sleep(400)
    const settled = await waitFor(() => !doc.querySelector('[aria-label="Stop response"]'), 15_000)
    if (!settled) throw new Error('the response never finished')
    await sleep(200)
  }
  const waitFor = async (fn, timeout = 8000) => {
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
      if (fn()) return true
      await sleep(100)
    }
    return false
  }
  /**
   * The composer is a controlled textarea: React must process the input event
   * before Enter is pressed, or the handler still sees the previous value.
   * It is also recreated when a new chat opens, so always take a live node.
   */
  const send = async (text) => {
    const el = [...doc.querySelectorAll('textarea')].find((t) => t.isConnected)
    type(el, text)
    await sleep(120)
    key(el, 'Enter')
    await sleep(120)
  }

  // jsdom keeps timers alive; without this the node process never exits
  const close = () => {
    try { window.close() } catch (e) { /* ignore */ }
  }

  return { dom, window, doc, sleep, click, byText, txt, allText, type, key, send, waitFor, waitIdle, close }
}

const CODE = bundle()

test('app renders the full shell without console errors', async () => {
  const { window, doc, sleep, txt, close } = makeDom()
  try {
    window.eval(CODE)
    await sleep(700)
    const text = txt()
    for (const needle of ['New', 'Projects', 'Artifacts', 'Today', 'Friend']) {
      assert.ok(text.includes(needle), `missing ${needle}`)
    }
    assert.ok(doc.querySelector('textarea'), 'composer missing')
    assert.ok(/How can I help you today\?/.test(doc.body.innerHTML), 'composer placeholder missing')
    assert.deepEqual(errors, [])
  } finally {
    close()
  }
})

test('a normal question produces no artifact; an explicit build request does', async () => {
  const { window, doc, sleep, send, waitFor, waitIdle, click, close } = makeDom()
  try {
    window.eval(CODE)
    await sleep(700)

    await send('explain the difference between RAM and VRAM')
    await waitIdle()
    assert.equal(doc.querySelectorAll('.artifact-message-card').length, 0, 'a normal question opened an artifact')

    await send('make me a tic tac toe game')
    await waitIdle()
    const cards = doc.querySelectorAll('.artifact-message-card').length
    assert.equal(cards, 1, 'the build request produced no artifact card; DOM tail = ' + doc.body.textContent.slice(-400) + ' notices=' + [...doc.querySelectorAll('.notice')].map(n => n.textContent).join('|'))

    click(doc.querySelector('.artifact-message-card'))
    assert.ok(await waitFor(() => doc.querySelector('iframe[title^="Artifact preview"]')), 'clicking the card did not open a sandboxed preview')
    assert.equal(doc.querySelector('iframe[title^="Artifact preview"]').getAttribute('sandbox'), 'allow-scripts')
    assert.deepEqual(errors, [])
  } finally {
    close()
  }
})

test('user menu, settings and the theme switch all work', async () => {
  const { window, doc, sleep, allText, click, byText, close } = makeDom()
  try {
    window.eval(CODE)
    await sleep(600)

    click(byText('button', /Friend/))
    await sleep(200)
    assert.match(allText(), /Friend · this browser only/)
    assert.match(allText(), /Get API keys/)

    click(byText('button', /^Settings/))
    await sleep(300)
    const t = allText() // the dialog is portalled to <body>, not inside #root
    assert.match(t, /Appearance/)
    assert.match(t, /Transcript text size/)
    assert.match(t, /Voice/)
    assert.match(t, /Buttery/)

    const themeButton = (name) => doc.querySelector(`[role="group"][aria-label="Theme"] button[aria-label="${name}"]`)
    click(themeButton('light'))
    await sleep(200)
    assert.equal(doc.documentElement.getAttribute('data-theme'), 'light')
    click(themeButton('dark'))
    await sleep(200)
    assert.equal(doc.documentElement.getAttribute('data-theme'), 'dark')
    assert.deepEqual(errors, [])
  } finally {
    close()
  }
})

test('the Today view opens with Alt+T and reads the vault', async () => {
  const { window, doc, sleep, allText, key, close } = makeDom()
  try {
    window.eval(CODE)
    await sleep(600)

    key(doc.body, 't', { altKey: true })
    await sleep(600)
    assert.ok(doc.querySelector('[role="dialog"]'), 'Alt+T did not open the Today view')
    const text = allText()
    assert.match(text, /Current snapshot/i)
    assert.match(text, /Open loops/i)
    assert.match(text, /Working on the Claude clone/, 'snapshot text from the vault API is missing')
    assert.match(text, /gym-plan/, 'parsed follow-up is missing')
    assert.deepEqual(errors, [])
  } finally {
    close()
  }
})

test('sidebar chat context menu offers the documented actions', async () => {
  const { window, doc, sleep, click, byText, close } = makeDom()
  try {
    window.eval(CODE)
    await sleep(600)

    const item = [...doc.querySelectorAll('.chat-item')].find((d) =>
      /Refining a 5-day workout cycle/.test(d.textContent || ''),
    )
    assert.ok(item, 'default chat row missing')
    item.dispatchEvent(new window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 120, clientY: 300 }))
    await sleep(250)
    const labels = [...doc.querySelectorAll('button')].map((b) => (b.textContent || '').trim())
    for (const l of ['Open in new window', 'Pin', 'Rename', 'Add to project', 'Move to group', 'Delete']) {
      assert.ok(labels.some((x) => x.includes(l)), `missing menu item ${l}`)
    }

    click(byText('button', /^Pin[Pp]?$/))
    await sleep(300)
    assert.match(doc.getElementById('root').textContent, /Pinned/)
    assert.deepEqual(errors, [])
  } finally {
    close()
  }
})

test('the account name is editable and no native file control is ever visible', async () => {
  const { window, doc, sleep, allText, click, byText, type, close } = makeDom()
  try {
    window.eval(CODE)
    await sleep(700)

    // Open Settings via the account menu.
    click(byText('button', /Friend/))
    await sleep(200)
    click(byText('button', /^Settings/))
    await sleep(300)

    // The Account section holds the profile editor.
    click(byText('button', /^Account$/))
    await sleep(300)

    const nameInput = doc.querySelector('input[aria-label="Name"]')
    assert.ok(nameInput, 'Account section has no Name field')
    assert.equal(nameInput.value, 'Friend', 'Name should default to the neutral profile')

    const emailInput = doc.querySelector('input[aria-label="Email"]')
    assert.ok(emailInput, 'Account section has no Email field')
    assert.equal(emailInput.placeholder, 'you@example.com')

    // The whole point of the custom picker: the browser's own control, which
    // renders the words "No file chosen", must never be on screen.
    const fileInputs = [...doc.querySelectorAll('input[type="file"]')]
    assert.ok(fileInputs.length > 0, 'expected a hidden file input backing the picker')
    for (const el of fileInputs) {
      assert.ok(el.hasAttribute('hidden'), 'a file input is visible — the browser will render "No file chosen"')
    }
    assert.ok(allText().includes('Choose image…'), 'the styled picker button is missing')
    assert.ok(!allText().includes('No file chosen'), 'native file-control text leaked into the UI')

    // Renaming updates the greeting and the sidebar without a reload.
    type(nameInput, 'Nishad Islam Utso')
    await sleep(400)
    assert.match(allText(), /Nishad/, 'renaming did not update the account button')
    assert.match(doc.body.textContent, /Utso/, 'renaming did not propagate')

    assert.deepEqual(errors, [])
  } finally {
    close()
  }
})
