// Only the local driver endpoints used by this UI are exposed by the app server.
// In particular, pull/delete/copy/create (models) and arbitrary vault paths
// are not browser APIs. JSON + same-origin writes also block form CSRF.
const routes = new Map([
  ['/api/ollama/tags', ['GET']], ['/api/ollama/show', ['POST']], ['/api/ollama/chat', ['POST']],
  ['/api/vault', ['GET']], ['/api/vault/', ['GET']], ['/api/vault/health', ['GET']],
  ['/api/vault/context', ['GET']], ['/api/vault/capsules', ['GET']],
  ['/api/vault/status', ['GET']], ['/api/vault/today', ['GET']],
  ['/api/vault/blacklist', ['GET', 'POST']], ['/api/vault/capture', ['POST']],
])

/** Return a policy failure, or null for a request that may reach a local API. */
function localApiRejection(request) {
  const pathname = String(request.url || '').split('?')[0]
  if (!pathname.startsWith('/api/ollama') && !pathname.startsWith('/api/vault')) return null
  const reject = (status, error) => ({ status, error })
  if (!routes.get(pathname)?.includes(request.method)) return reject(403, 'This local API operation is not enabled. No model downloads, deletes, shell or cloud actions are exposed.')
  if (request.headers?.origin) {
    let origin
    try { origin = new URL(request.headers.origin) } catch { return reject(403, 'Invalid API request origin.') }
    if (!['http:', 'https:'].includes(origin.protocol)) return reject(403, 'Cross-origin API requests are not authorized.')
    // Strict same-origin by default. A forwarded/preview host is only trusted
    // when ALLOW_PREVIEW_ORIGINS=1 is set explicitly, matching the vault API.
    const host = String(request.headers['x-forwarded-host'] || request.headers.host || '').split(',')[0].trim()
    const preview = process.env.ALLOW_PREVIEW_ORIGINS === '1' && origin.hostname.endsWith('.e2b.app')
    if (!preview && origin.host !== host) return reject(403, 'Cross-origin API requests are not authorized.')
  }
  if (request.method === 'POST' && !/^application\/json(?:\s*;|$)/i.test(request.headers?.['content-type'] || '')) return reject(415, 'Local API writes require application/json, not browser forms.')
  return null
}

function protectLocalApi(request, response, next) {
  const rejection = localApiRejection(request)
  if (rejection) {
    response.writeHead(rejection.status, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ error: rejection.error }))
    return
  }
  next()
}

function localTarget(value, label) {
  const target = new URL(value)
  if (!['http:', 'https:'].includes(target.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) || target.username || target.password) throw new Error(`${label} must target an unauthenticated loopback service. Remote AI/vault destinations are not approved.`)
  return value
}

module.exports = { protectLocalApi, localApiRejection, localTarget }
