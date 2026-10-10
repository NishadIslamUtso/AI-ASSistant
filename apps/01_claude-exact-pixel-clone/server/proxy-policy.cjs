// Only the local driver endpoints used by this UI are exposed by Vite.
// In particular, pull/delete/copy/create (models) and arbitrary vault paths
// are not a browser API. JSON + same-origin writes also block form CSRF.
const routes = new Map([
  ['/api/ollama/tags', ['GET']], ['/api/ollama/show', ['POST']], ['/api/ollama/chat', ['POST']],
  ['/api/vault', ['GET']], ['/api/vault/', ['GET']], ['/api/vault/health', ['GET']],
  ['/api/vault/context', ['GET']], ['/api/vault/capsules', ['GET']],
  ['/api/vault/blacklist', ['GET', 'POST']], ['/api/vault/capture', ['POST']],
])
function protectLocalApi(request, response, next) {
  const pathname = request.url.split('?')[0]
  if (!pathname.startsWith('/api/ollama') && !pathname.startsWith('/api/vault')) return next()
  const deny = (status, error) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ error })) }
  if (!routes.get(pathname)?.includes(request.method)) return deny(403, 'This local API operation is not enabled. No model downloads, deletes, shell or cloud actions are exposed.')
  if (request.headers.origin) {
    let origin
    try { origin = new URL(request.headers.origin) } catch { return deny(403, 'Invalid API request origin.') }
    const host = String(request.headers['x-forwarded-host'] || request.headers.host || '').split(',')[0].trim()
    if (!['http:', 'https:'].includes(origin.protocol) || origin.host !== host) return deny(403, 'Cross-origin API requests are not authorized.')
  }
  if (request.method === 'POST' && !/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] || '')) return deny(415, 'Local API writes require application/json, not browser forms.')
  next()
}
function localTarget(value, label) {
  const target = new URL(value)
  if (!['http:', 'https:'].includes(target.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) || target.username || target.password) throw new Error(`${label} must target an unauthenticated loopback service. Remote AI/vault destinations are not approved.`)
  return value
}
module.exports = { protectLocalApi, localTarget }
