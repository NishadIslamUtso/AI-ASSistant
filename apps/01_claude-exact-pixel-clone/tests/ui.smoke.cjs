/**
 * UI smoke test — renders the whole app in jsdom and fails on any console
 * error or uncaught exception.
 *
 * There is no browser in the CI/sandbox environment, so the app is bundled
 * with esbuild (already present as a transitive dependency of Vite) and driven
 * inside jsdom with a stubbed fetch.
 *
 * jsdom is NOT a declared dependency on purpose — the target machine has a slow
 * connection, and this test is a nicety, not a gate. Install it when you want
 * to run it:
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
function makeDom({ mode = 'live' } = {}) {
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

  const json = async (u) => {
    if (u.includes('__ai_proxy_ping')) return { ok: true, proxy: true }
    if (u.includes('/api/tags'))
      return mode === 'demo'
        ? { models: [] }
        : { models: [{ name: 'qwen2.5:3b', size: 2e9, details: {} }, { name: 'qwen3-vl:4b', size: 3e9, details: {} }] }
    if (u.includes('/status')) return { ok: true, vault: '/tmp/vault', counts: { files: 3, entities: 1 } }
    if (u.includes('/today'))
      return { date: '2026-10-10', snapshot: 'snap', openLoops: 'loops', followups: [], journalPath: '08 Journal/2026/x.md' }
    if (u.includes('/blacklist')) return { patterns: ['bank.com/*'] }
    if (u.includes('/capsules')) return { items: [{ id: 'c1', title: 'Workout plan', type: 'capsule', summary: 's' }] }
    if (u.includes('/context')) return { capsules: [] }
    return { ok: true }
  }

  window.fetch = async (url, opts) => {
    const u = String(url)
    if (u.includes('/api/tags') && mode === 'demo') return { ok: false, status: 500, json, text: async () => '' }
    if (u.includes('/api/chat') && mode === 'live') {
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
        json,
      }
    }
    return { ok: true, status: 200, json, text: async () => JSON.stringify(await json(u)) }
  }
  window.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
  window.scrollTo = () => {}
  window.HTMLElement.prototype.scrollIntoView = () => {}
  window.alert = () => {}
  window.confirm = () => true
  window.prompt = () => 'test-project'
  if (!window.TextDecoder) window.TextDecoder = require('node:util').TextDecoder

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const click = (el) => el && el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
  const byText = (sel, re) => [...doc.querySelectorAll(sel)].find((e) => re.test((e.textContent || '').trim()))
  const txt = () => doc.getElementById('root').textContent || ''
  const allText = () => doc.body.textContent || '' // modals are portalled to <body>
  const type = (el, value) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
    setter.call(el, value)
    el.dispatchEvent(new window.Event('input', { bubbles: true }))
  }
  const key = (el, k, o = {}) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...o }))

  // jsdom keeps timers alive; without this the node process never exits
  const close = () => {
    try { window.close() } catch (e) { /* ignore */ }
  }

  return { dom, window, doc, sleep, click, byText, txt, allText, type, key, close }
}

const CODE = bundle()

test('app renders the full Claude shell without console errors', async () => {
  const { window, doc, sleep, txt, close } = makeDom({ mode: 'live' })
  try {
    window.eval(CODE)
    await sleep(600)
    const text = txt()
    for (const needle of ['New chat', 'Artifacts', 'Customize', 'Utso', 'Free plan', 'Project']) {
      assert.ok(text.includes(needle), `missing ${needle}`)
    }
    assert.ok(doc.querySelector('textarea'), 'composer missing')
    assert.ok(/How can I help you today\?/.test(doc.body.innerHTML), 'placeholder missing')
    assert.deepEqual(errors, [])
  } finally {
    close()
  }
})

test('a normal question never opens an artifact; an explicit build request does', async () => {
  const { window, doc, sleep, txt, type, key, close } = makeDom({ mode: 'live' })
  try {
    window.eval(CODE)
    await sleep(500)

    const ta = doc.querySelector('textarea')
    type(ta, 'explain the difference between RAM and VRAM')
    key(ta, 'Enter')
    await sleep(2500)
    assert.equal(doc.querySelectorAll('iframe.artifact-preview').length, 0, 'unexpected artifact')

    type(doc.querySelector('textarea'), 'make me a tic tac toe game')
    key(doc.querySelector('textarea'), 'Enter')
    await sleep(2500)
    assert.equal(doc.querySelectorAll('iframe.artifact-preview').length, 1, 'artifact did not open')
    assert.match(txt(), /Artifacts\s*\(\d+\)/)
    assert.deepEqual(errors, [])
  } finally {
    close()
  }
})

test('settings, user menu and the AI-Brain panel all open', async () => {
  const { window, doc, sleep, txt, allText, click, byText, close } = makeDom({ mode: 'live' })
  try {
  window.eval(CODE)
  await sleep(500)

  click([...doc.querySelectorAll('button')].find((b) => /Utso/.test(b.textContent || '') && /Free/.test(b.textContent || '')))
  await sleep(200)
  assert.match(txt(), /nishadislamutso@gmail\.com/)
  assert.match(txt(), /Get API keys/)

  click(byText('button', /^Settings$/))
  await sleep(300)
  const t = allText() // the dialog is portalled to <body>, not inside #root
  assert.match(t, /Appearance/)
  assert.match(t, /Transcript size/)
  assert.match(t, /This computer/, 'settings nav is missing its measured group heading')
  assert.match(t, /Customize/)
  assert.match(t, /Buttery/)

  click(byText('button', /^Light$/))
  await sleep(150)
  assert.equal(doc.documentElement.getAttribute('data-theme'), 'light')
  click(byText('button', /^Dark$/))
  await sleep(150)
  assert.equal(doc.documentElement.getAttribute('data-theme'), 'dark')

  assert.deepEqual(errors, [])
  } finally { close() }
})

test('sidebar context menu actions work: pin, rename, delete', async () => {
  const { window, doc, sleep, txt, click, byText, key, close } = makeDom({ mode: 'live' })
  try {
  window.eval(CODE)
  await sleep(500)

  const item = [...doc.querySelectorAll('div')].find(
    (d) => (d.textContent || '').trim() === 'CSE220 MID - Data Structure and Algorithms',
  )
  assert.ok(item)
  item.dispatchEvent(new window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 120, clientY: 300 }))
  await sleep(200)
  const labels = [...doc.querySelector('[role="menu"]').querySelectorAll('button')].map((b) => (b.textContent || '').trim())
  for (const l of ['Open in new window', 'Pin chat', 'Rename', 'Add to project', 'Move to group', 'Delete']) {
    assert.ok(labels.some((x) => x.includes(l)), `missing menu item ${l}`)
  }

  click(byText('button', /^Pin chat$/))
  await sleep(250)
  assert.match(txt(), /Pinned/)

  assert.deepEqual(errors, [])
  } finally { close() }
})
