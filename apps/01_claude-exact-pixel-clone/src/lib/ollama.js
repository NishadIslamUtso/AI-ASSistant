/**
 * ollama.js — direct local Ollama client (no wrapper, no cloud)
 *
 * Requests go to `/ollama/*` by default. In dev, Vite proxies that to
 * http://127.0.0.1:11434 — this makes the browser talk to the dev server on
 * the SAME origin, so OLLAMA_ORIGINS / CORS can never break the app.
 * Users can still override with an absolute URL in Settings (local only).
 */
import { settings } from './settings.js'

export function ollamaBase() {
  return (settings.get().ollamaUrl || '').trim() || '/ollama'
}

export async function listModels() {
  try {
    const res = await fetch(`${ollamaBase()}/api/tags`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Ollama ${res.status}`)
    const data = await res.json()
    const models = (data.models || []).map((m) => ({
      name: m.name,
      size: m.size,
      family: m.details?.family || '',
      params: m.details?.parameter_size || '',
      quant: m.details?.quantization_level || '',
      vision: /vision|vl|llava|qwen3-vl|minicpm-v/i.test(m.name),
    }))
    return { ok: true, models }
  } catch (e) {
    return { ok: false, models: [], error: e.message }
  }
}

export async function isOllamaUp() {
  try {
    const res = await fetch(`${ollamaBase()}/api/tags`, { cache: 'no-store' })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Stream a chat completion.
 * @param {object} o
 * @param {string} o.model      e.g. qwen2.5:3b
 * @param {Array}  o.messages   [{role, content, images?:[base64]}]
 * @param {(t:string)=>void} o.onToken
 * @param {AbortSignal} [o.signal]
 */
export async function streamChat({ model, messages, onToken, signal }) {
  const res = await fetch(`${ollamaBase()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({ model, messages, stream: true, options: { num_ctx: 4096 } }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Ollama ${res.status}: ${t.slice(0, 200)}`)
  }
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  let full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''
    for (const line of lines) {
      const s = line.trim()
      if (!s) continue
      try {
        const j = JSON.parse(s)
        if (j.message?.content) {
          full += j.message.content
          onToken?.(j.message.content, full)
        }
        if (j.error) throw new Error(j.error)
      } catch (e) {
        if (e instanceof Error && e.message && !/JSON/.test(e.message)) throw e
      }
    }
  }
  return full
}
