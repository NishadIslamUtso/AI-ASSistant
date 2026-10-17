// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * The pairing, from the extension's side of the wire. The app refuses any
 * request without the x-oddbrain-pair token (see extension-port.test.ts);
 * these tests prove the shipped extension actually presents it, stores it
 * the way the popup writes it, and never queues page contents while unpaired.
 */

type Stored = Record<string, unknown>
let storage: Stored
let captures: Array<{ headers: Record<string, string>; body: unknown; path: string }>
let respond: (status: number) => void

const chromeStub = () => {
  ;(globalThis as Record<string, unknown>).chrome = {
    runtime: { id: 'test-extension-id' },
    storage: {
      local: {
        get: async (defaults: Stored) => {
          const out: Stored = {}
          for (const key of Object.keys(defaults)) out[key] = key in storage ? storage[key] : defaults[key]
          return out
        },
        set: async (values: Stored) => {
          Object.assign(storage, values)
        },
      },
    },
  }
}

const fetchStub = () => {
  ;(globalThis as Record<string, unknown>).fetch = vi.fn(async (input: string | URL, init?: { headers?: Record<string, string>; body?: string }) => {
    captures.push({
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: init?.body ? JSON.parse(init.body) : null,
      path: String(input).replace('http://127.0.0.1:8765', ''),
    })
    respond(200)
    return { ok: true, status: 200, json: async () => ({ capsules: [] }) }
  })
}

const loadWriter = async () => (await import('../../extension/lib/vault-writer.js')) as {
  postCapture(payload: unknown): Promise<{ ok: boolean; unpaired?: boolean }>
  flushQueue(): Promise<void>
}

describe('the extension speaks the pairing dialect', () => {
  beforeEach(() => {
    storage = { pairToken: 'a'.repeat(64) }
    captures = []
    respond = () => undefined
    chromeStub()
    fetchStub()
    vi.resetModules()
  })

  it('every capture carries the stored token as x-oddbrain-pair', async () => {
    const writer = await loadWriter()
    await writer.postCapture({ type: 'page', url: 'https://example.com' })
    expect(captures).toHaveLength(1)
    expect(captures[0].headers['x-oddbrain-pair']).toBe('a'.repeat(64))
    expect(captures[0].headers['Content-Type']).toBe('application/json')
  })

  it('the context ask carries the token too', async () => {
    const writer = await loadWriter()
    await writer.getContext('needle')
    expect(captures[0].path).toBe('/context?q=needle')
    expect(captures[0].headers['x-oddbrain-pair']).toBe('a'.repeat(64))
  })

  it('a refused (unpaired) capture is NOT queued: page contents never wait in this browser', async () => {
    respond = (status) => {
      const call = captures[captures.length - 1]
      void call
      // replay: make the fetch answer 401 instead
    }
    ;(globalThis as Record<string, unknown>).fetch = vi.fn(async (input: string | URL, init?: { headers?: Record<string, string>; body?: string }) => {
      captures.push({ headers: (init?.headers ?? {}) as Record<string, string>, body: init?.body ? JSON.parse(init.body) : null, path: String(input) })
      return { ok: false, status: 401, json: async () => ({}) }
    })
    const writer = await loadWriter()
    const answer = await writer.postCapture({ type: 'page', url: 'https://example.com/private' })
    expect(answer.unpaired).toBe(true)
    expect((storage.queue as unknown[] | undefined) ?? []).toHaveLength(0, 'an unpaired capture must not be parked in storage')
    const activity = (storage.activity as Array<{ reason?: string }>) ?? []
    expect(activity.some(entry => /not paired/i.test(entry.reason ?? ''))).toBe(true, 'the refusal says why, in the activity log')
  })

  it('no token stored means the request goes out without the header \u2014 and the app refuses it', async () => {
    storage = {}
    const writer = await loadWriter()
    await writer.postCapture({ type: 'page', url: 'https://example.com' })
    expect(captures[0].headers['x-oddbrain-pair']).toBeUndefined()
  })
})
