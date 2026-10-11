const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createServer, resolveStaticFile } = require('../server/preview-server.cjs')

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject)
      resolve(server.address().port)
    })
  })
}
function close(server) {
  return new Promise(resolve => server.close(resolve))
}

test('static preview applies the same-origin API boundary before either local proxy', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-assistant-preview-'))
  fs.writeFileSync(path.join(temp, 'index.html'), '<!doctype html><title>preview test</title>')
  const forwarded = []
  const ollama = http.createServer((req, res) => {
    forwarded.push({ service: 'ollama', path: req.url, origin: req.headers.origin, cookie: req.headers.cookie, authorization: req.headers.authorization })
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ models: [{ name: 'qwen2.5:3b' }] }))
  })
  const vault = http.createServer((req, res) => {
    forwarded.push({ service: 'vault', path: req.url })
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
  })
  const ollamaPort = await listen(ollama)
  const vaultPort = await listen(vault)
  const app = createServer({
    root: temp,
    ollamaTarget: `http://127.0.0.1:${ollamaPort}`,
    vaultTarget: `http://127.0.0.1:${vaultPort}`,
  })
  const appPort = await listen(app)
  const base = `http://127.0.0.1:${appPort}`
  try {
    const page = await fetch(`${base}/`)
    assert.equal(page.status, 200)
    assert.match(page.headers.get('content-security-policy'), /frame-src 'none'/)

    const tags = await fetch(`${base}/api/ollama/tags`, { headers: { origin: base, cookie: 'session=not-forwarded', authorization: 'Bearer not-forwarded' } })
    assert.deepEqual(await tags.json(), { models: [{ name: 'qwen2.5:3b' }] })
    assert.deepEqual(forwarded[0], { service: 'ollama', path: '/api/tags', origin: undefined, cookie: undefined, authorization: undefined })

    const deniedMethod = await fetch(`${base}/api/ollama/pull`, { method: 'POST', headers: { origin: base, 'content-type': 'application/json' }, body: '{}' })
    assert.equal(deniedMethod.status, 403)
    const deniedOrigin = await fetch(`${base}/api/vault/capture`, { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: '{}' })
    assert.equal(deniedOrigin.status, 403)
    assert.equal(forwarded.length, 1, 'blocked routes must never reach either local service')
  } finally {
    await Promise.all([close(app), close(ollama), close(vault)])
    fs.rmSync(temp, { recursive: true, force: true })
  }
})

test('static file resolution rejects encoded traversal and backslash paths', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-assistant-static-'))
  fs.writeFileSync(path.join(root, 'index.html'), 'safe')
  fs.writeFileSync(path.join(root, 'secret.txt'), 'not public')
  try {
    assert.equal(resolveStaticFile(root, '/index.html'), path.join(root, 'index.html'))
    assert.equal(resolveStaticFile(root, '/%2e%2e/secret.txt'), null)
    assert.equal(resolveStaticFile(root, '/%2e%2e%2fsecret.txt'), null)
    assert.equal(resolveStaticFile(root, '/%5c..%5csecret.txt'), null)
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})
