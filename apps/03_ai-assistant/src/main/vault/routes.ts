/**
 * The vault's HTTP surface: nine small routes, all of them local.
 *
 * Kept apart from the service so the service can be tested without a socket and
 * this table can be read in one screen. The boundary in ../api/guard.ts decides
 * who is allowed to call these; this file decides what they answer, and it is
 * the only place that turns a failure into a status code.
 *
 * Three outcomes, and nothing else:
 *
 *   400 — the request itself was wrong (bad name, missing field, bad timestamp)
 *   503 — there is no vault where the app was told to look
 *   500 — something genuinely failed; the vault says so rather than reporting a
 *         save that did not happen
 */
import { InputError, VaultMissingError } from './errors'
import { createSourceMap } from './sources'
import type { VaultService } from './service'

export type VaultRouteRequest = {
  /** The path with '/api/vault' already removed: '', '/status', '/capture'… */
  route: string
  method: string
  query: URLSearchParams
  body: unknown
}

export type VaultRouteReply = { status: number; body: Record<string, any> }

/** The whole surface, so a wrong method is answered as one instead of as a 404. */
const ROUTES: Record<string, string[]> = {
  '/health': ['GET'],
  '/status': ['GET'],
  '/today': ['GET'],
  '/blacklist': ['GET', 'POST'],
  '/capsules': ['GET'],
  '/context': ['GET'],
  '/sources': ['GET'],
  '/capture': ['POST'],
  '/export-zip': ['POST'],
}

export function handleVaultRequest(service: VaultService, request: VaultRouteRequest): VaultRouteReply {
  const route = request.route.replace(/\/+$/, '') || '/'
  const query = request.query.get('q') || ''
  try {
    if (request.method === 'GET') {
      if (route === '/' || route === '/health') {
        const status = service.status()
        return {
          status: 200,
          body: {
            ok: status.ok,
            available: status.available,
            vault: service.root,
            counts: status.counts,
            message: 'AI ASSistant Markdown vault, served by the app itself',
            timezone: 'Asia/Dhaka',
            ...(status.error ? { error: status.error } : {}),
          },
        }
      }
      if (route === '/status') return { status: 200, body: service.status() }
      if (route === '/today') return { status: 200, body: service.today() }
      if (route === '/blacklist') return { status: 200, body: { excluded_patterns: service.blacklist() } }
      if (route === '/capsules') return { status: 200, body: { capsules: service.capsules(query) } }
      if (route === '/context') return { status: 200, body: service.context(query) }
      if (route === '/sources') {
        // The map of what was read and when: the vault's own sources, read for
        // exactly what each one says. `days` is a window, 0 or absent means all.
        const kind = String(request.query.get('kind') || '')
        const days = Number(request.query.get('days') || 0)
        const map = createSourceMap(service.files()).read({
          q: query,
          kind,
          days: Number.isFinite(days) && days > 0 ? days : 0,
        })
        return {
          status: 200,
          body: {
            ok: true,
            vault: service.root,
            available: service.available(),
            ...map,
          },
        }
      }
      return fallback(route, request.method)
    }
    if (request.method === 'POST') {
      if (route === '/capture') return { status: 200, body: service.capture(request.body as Record<string, any>) }
      if (route === '/blacklist') return { status: 200, body: service.updateBlacklist(request.body as Record<string, any>) }
      if (route === '/export-zip') return { status: 200, body: service.exportZip(request.body as Record<string, any>) }
      return fallback(route, request.method)
    }
    return fallback(route, request.method)
  } catch (error) {
    if (error instanceof VaultMissingError) {
      return { status: 503, body: { ok: false, available: false, vault: service.root, error: error.message } }
    }
    if (error instanceof InputError) return { status: 400, body: { ok: false, error: error.message } }
    // A real failure: one line in the main process log, and a sentence the
    // interface can show. Never a success response.
    console.error(`[vault] ${(error as Error).message}`)
    return {
      status: 500,
      body: { ok: false, error: 'Vault operation failed. Check the vault folder and its permissions, then try again.' },
    }
  }
}

const unknownRoute = (route: string): VaultRouteReply => ({
  status: 404,
  body: { ok: false, error: `There is no vault route called ${route}.` },
})

/**
 * A path that exists with a method it does not answer is a 405; a path that does
 * not exist at all is a 404. Both say which one they are, so a caller is never
 * left guessing whether they used the wrong verb or the wrong address.
 */
function fallback(route: string, method: string): VaultRouteReply {
  const allowed = ROUTES[route]
  if (!allowed) return unknownRoute(route)
  return {
    status: 405,
    body: {
      ok: false,
      error: `${method} is not a method ${route} answers. It answers ${allowed.join(' and ')}.`,
    },
  }
}
