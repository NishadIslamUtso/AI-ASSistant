/**
 * Small local static host for the built app, with its same-origin Ollama and
 * vault proxies. The default listener is loopback-only; set HOST=0.0.0.0 only
 * when a trusted preview proxy must reach this process.
 */
const http = require('node:http')
const https = require('node:https')
const fs = require('node:fs')
const path = require('node:path')
const { localApiRejection, localTarget } = require('./proxy-policy.cjs')

// `dist` and `node_modules` are not persisted by the preview sandbox. This
// separate output directory survives resets; ordinary local builds still work.
const ROOT = [path.resolve(__dirname, '..', 'preview-dist'), path.resolve(__dirname, '..', 'dist')]
  .find((dir) => fs.existsSync(path.join(dir, 'index.html'))) || path.resolve(__dirname, '..', 'preview-dist')
const PORT = Number(process.env.PORT || 4173)
const HOST = process.env.HOST || '127.0.0.1'
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json',
  '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
}
const SECURITY_HEADERS = {
  'Content-Security-Policy': "frame-src 'none'; object-src 'none'; base-uri 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
}

function resolveStaticFile(root, pathname) {
  let decoded
  try { decoded = decodeURIComponent(pathname) } catch { return null }
  if (decoded.includes('\0') || decoded.includes('\\')) return null
  const base = path.resolve(root)
  const candidate = path.resolve(base, `.${decoded.startsWith('/') ? decoded : `/${decoded}`}`)
  const relative = path.relative(base, candidate)
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null
  return fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : null
}

function proxy(request, response, targetValue, prefix, rewrite, label) {
  const target = new URL(targetValue)
  const url = new URL(request.url, 'http://localhost')
  const upstreamPath = `${rewrite(url.pathname.slice(prefix.length) || '/')}${url.search}`
  const headers = { ...request.headers, host: target.host }
  delete headers.cookie
  delete headers.authorization
  if (label === 'Ollama') delete headers.origin
  const transport = target.protocol === 'https:' ? https : http
  const upstream = transport.request({
    hostname: target.hostname,
    port: Number(target.port || (target.protocol === 'https:' ? 443 : 80)),
    path: upstreamPath,
    method: request.method,
    headers,
  }, (up) => {
    response.writeHead(up.statusCode || 502, up.headers)
    up.pipe(response)
  })
  upstream.on('error', (error) => {
    if (response.headersSent) return response.destroy(error)
    response.writeHead(503, { ...SECURITY_HEADERS, 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ error: `${label} is not reachable on ${target.hostname}:${target.port || (target.protocol === 'https:' ? 443 : 80)}. ${error.message}` }))
  })
  request.pipe(upstream)
}

function createServer({ root = ROOT,
  ollamaTarget = localTarget(process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434', 'OLLAMA_API_URL'),
  vaultTarget = localTarget(process.env.VAULT_API_URL || 'http://127.0.0.1:8765', 'VAULT_API_URL'),
} = {}) {
  const staticRoot = path.resolve(root)
  return http.createServer((request, response) => {
    const rejection = localApiRejection(request)
    if (rejection) {
      response.writeHead(rejection.status, { ...SECURITY_HEADERS, 'Content-Type': 'application/json' })
      return response.end(JSON.stringify({ error: rejection.error }))
    }

    const pathname = new URL(request.url, 'http://localhost').pathname
    // Only allow the exact API surface in proxy-policy.cjs to reach the local
    // Ollama/vault services; never expose their arbitrary paths through preview.
    if (pathname === '/api/ollama' || pathname.startsWith('/api/ollama/')) return proxy(request, response, ollamaTarget, '/api/ollama', rest => `/api${rest}`, 'Ollama')
    if (pathname === '/api/vault' || pathname.startsWith('/api/vault/')) return proxy(request, response, vaultTarget, '/api/vault', rest => rest, 'The vault API')

    const file = resolveStaticFile(staticRoot, pathname) || path.join(staticRoot, 'index.html')
    if (!fs.existsSync(file)) {
      // Never answer with a blank page — a silent white screen is undiagnosable.
      response.writeHead(503, { ...SECURITY_HEADERS, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
      return response.end(`<!doctype html><html><head><title>AI ASSistant — not built</title></head>
<body style="font:14px/1.6 system-ui,sans-serif;padding:32px;max-width:44rem">
<h1>The app is built, but the build output is missing.</h1>
<p>Looked for <code>preview-dist/index.html</code> and <code>dist/index.html</code>.
Neither exists. This sandbox does not keep <code>dist/</code> or <code>node_modules/</code>
between resets, which is why the preview can go blank.</p>
<p>Rebuild with:</p><pre>npm install &amp;&amp; npm run build:preview</pre>
</body></html>`)
    }
    response.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
    fs.createReadStream(file).pipe(response)
  })
}

if (require.main === module) {
  const server = createServer()
  server.listen(PORT, HOST, () => {
    console.log(`AI ASSistant (built)  ->  http://${HOST}:${PORT}`)
    console.log(`serving               ->  ${ROOT}`)
    console.log('proxy /api/ollama/*   ->  loopback Ollama /api/* (policy-filtered)')
    console.log('proxy /api/vault/*    ->  loopback vault API (policy-filtered)')
  })
  server.on('error', (error) => {
    console.error(`Preview server could not start: ${error.message}`)
    process.exitCode = 1
  })
}

module.exports = { createServer, resolveStaticFile }
