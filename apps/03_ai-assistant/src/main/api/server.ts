import { createServer, request as httpRequest, type IncomingMessage, type ServerResponse } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { localTarget, protectLocalApi } from './guard'

/**
 * The local API, inside the app.
 *
 * The renderer talks to `/api/ollama/*` and `/api/vault/*` on the same origin it
 * was served from. In the packaged app that is this server: it serves the built
 * interface AND forwards those two prefixes. That is why the renderer's fetch
 * calls are plain relative URLs — one code path, no port plumbing, no CORS, and
 * the guard in guard.ts sees a real Origin header instead of `null`.
 *
 * In dev the interface is served by Vite instead, and Vite's proxy forwards
 * /api to this same server (see electron.vite.config.ts), so the renderer still
 * cannot tell the difference.
 */

export type LocalApiOptions = {
  port: number
  /** Directory holding the built renderer. Omitted in dev, where Vite serves it. */
  rendererDir?: string
  ollamaUrl?: string
  vaultUrl?: string
}

export type LocalApi = {
  port: number
  url: string
  close: () => Promise<void>
}

const OLLAMA_DEFAULT = 'http://127.0.0.1:11434'
const VAULT_DEFAULT = 'http://127.0.0.1:8765'

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}

/**
 * Forward one request to a loopback service and stream the answer straight back.
 *
 * Streaming matters here and is not an optimisation: a reply arrives as NDJSON
 * records, and buffering the response would hold every token until the model
 * finished — the exact behaviour the interface exists to avoid.
 */
function forward(
  request: IncomingMessage,
  response: ServerResponse,
  target: string,
  toTargetPath: (rest: string) => string,
  label: string
): void {
  // request.url is a path ('/api/ollama/tags'), not an absolute URL, so it has
  // to be parsed against a base. Without one this throws inside the request
  // handler — which in a packaged app means the window never finishes loading.
  const url = new URL(request.url || '/', 'http://127.0.0.1')
  const upstream = httpRequest(
    {
      protocol: new URL(target).protocol,
      hostname: new URL(target).hostname,
      port: new URL(target).port,
      path: toTargetPath(url.pathname.replace(/^\/api\/(?:ollama|vault)/, '') + url.search),
      method: request.method,
      headers: { ...request.headers, host: new URL(target).host },
    },
    upstreamResponse => {
      response.writeHead(upstreamResponse.statusCode || 502, {
        'Content-Type': upstreamResponse.headers['content-type'] || 'application/json',
        // Streaming NDJSON must not be buffered by anything in between.
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      })
      upstreamResponse.pipe(response)
    }
  )
  upstream.on('error', () => {
    // Quiet by construction: the interface shows "offline" from the status code,
    // and nothing is written to the console that a user would have to interpret.
    if (!response.headersSent) {
      response.writeHead(502, { 'Content-Type': 'application/json' })
    }
    response.end(
      JSON.stringify({
        error: `${label} is not reachable on this machine. Start it and try again — nothing was sent anywhere else.`,
      })
    )
  })
  // If the interface stops the request (a stopped reply), stop asking upstream.
  request.on('aborted', () => upstream.destroy())
  request.pipe(upstream)
}

function serveStatic(file: string, response: ServerResponse): void {
  response.writeHead(200, {
    'Content-Type': CONTENT_TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  })
  createReadStream(file).pipe(response)
}

function handleStatic(
  rendererDir: string,
  request: IncomingMessage,
  response: ServerResponse
): void {
  const url = new URL(request.url || '/', 'http://localhost')
  const requested = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
  let file = resolve(join(rendererDir, requested))
  // Never serve anything outside the built interface.
  if (!file.startsWith(resolve(rendererDir))) file = join(resolve(rendererDir), 'index.html')
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(resolve(rendererDir), 'index.html')
  if (!existsSync(file)) {
    response.writeHead(404, { 'Content-Type': 'text/plain' })
    response.end('The interface has not been built yet. Run npm run build.')
    return
  }
  serveStatic(file, response)
}

/** Start the API. Resolves once it is listening so the caller can load the window. */
export function startLocalApi(options: LocalApiOptions): Promise<LocalApi> {
  const ollama = localTarget(options.ollamaUrl || OLLAMA_DEFAULT, 'OLLAMA_API_URL')
  const vault = localTarget(options.vaultUrl || VAULT_DEFAULT, 'VAULT_API_URL')

  const server = createServer((request, response) => {
    try {
      handle(request, response)
    } catch (error) {
      // A bug in this file must cost one request, not the application. Anything
      // unexpected answers 500 with a sentence and is never retried silently.
      if (!response.headersSent) {
        response.writeHead(500, { 'Content-Type': 'application/json' })
      }
      response.end(
        JSON.stringify({
          error: `The local API could not handle that request (${(error as Error).message}).`,
        })
      )
    }
  })

  function handle(request: IncomingMessage, response: ServerResponse): void {
    const pathname = (request.url || '/').split('?')[0]
    protectLocalApi(
      { url: request.url || '/', method: request.method, headers: request.headers },
      response,
      () => {
        if (pathname.startsWith('/api/ollama')) {
          forward(request, response, ollama, rest => `/api${rest}`, 'Ollama')
          return
        }
        if (pathname.startsWith('/api/vault')) {
          forward(request, response, vault, rest => rest || '/', 'The vault service')
          return
        }
        if (options.rendererDir) {
          handleStatic(options.rendererDir, request, response)
          return
        }
        response.writeHead(404, { 'Content-Type': 'text/plain' })
        response.end('Not found.')
      }
    )
  }

  return new Promise<LocalApi>((resolvePromise, reject) => {
    server.once('error', reject)
    // Loopback only. This server is not part of the network, it is part of the app.
    server.listen(options.port, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : options.port
      resolvePromise({
        port,
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>(done => server.close(() => done())),
      })
    })
  })
}
