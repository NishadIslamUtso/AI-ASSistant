/**
 * ollama.js — direct, dependency-free client for a local Ollama server.
 *
 * Constraints honoured:
 *  - Uses the model already pulled on the machine (default qwen2.5:3b). No download.
 *  - Talks to http://127.0.0.1:11434 by default; the app must cope with an
 *    Ollama that is ALREADY running (we never try to start it from the browser).
 *  - Ollama needs OLLAMA_ORIGINS="*" (or the app origin) or the browser blocks
 *    the request — that is surfaced as a clear, actionable error, not a crash.
 */

export const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434'

/** Models whose name tells us they accept images (model-aware UI). */
const VISION_HINTS = [
  'vl',
  'vision',
  'llava',
  'bakllava',
  'minicpm-v',
  'pixtral',
  'gemma3',
  'gemma-3',
  'llama4',
  'llama-4',
]

export function modelSupportsImages(modelName = '') {
  const m = String(modelName).toLowerCase()
  return VISION_HINTS.some((h) => m.includes(h))
}

/** Rough parameter-size read from a tag like `qwen2.5:3b`, `llama3.1:8b-instruct-q4_0`. */
export function modelSizeLabel(name = '') {
  const m = String(name).match(/(\d+(?:\.\d+)?)\s*b\b/i)
  return m ? `${m[1]}B` : ''
}

/** Human label for the model selector (keeps Claude's compact "Sonnet 5.5" look). */
export function shortModelName(name = '') {
  const base = String(name).split(':')[0]
  return base.length > 18 ? base.slice(0, 17) + '…' : base
}

function normalizeBase(url) {
  return String(url || DEFAULT_OLLAMA_URL).replace(/\/+$/, '')
}

/** True when the Ollama daemon answers on /api/tags. */
export async function ping(baseUrl = DEFAULT_OLLAMA_URL) {
  try {
    const res = await fetch(`${normalizeBase(baseUrl)}/api/tags`, { cache: 'no-store' })
    if (!res.ok) return { ok: false, status: res.status }
    const data = await res.json()
    return { ok: true, models: data.models || [] }
  } catch (e) {
    return { ok: false, error: e }
  }
}

/** GET /api/tags -> [{ name, size, label, sizeLabel, vision }] */
export async function listModels(baseUrl = DEFAULT_OLLAMA_URL) {
  const res = await fetch(`${normalizeBase(baseUrl)}/api/tags`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Ollama /api/tags returned ${res.status}`)
  const data = await res.json()
  const models = (data.models || []).map((m) => ({
    name: m.name,
    label: m.name,
    sizeLabel: modelSizeLabel(m.name),
    sizeBytes: m.size || 0,
    vision: modelSupportsImages(m.name),
    family: m.details?.family || '',
    parameterSize: m.details?.parameter_size || '',
    quantization: m.details?.quantization_level || '',
  }))
  models.sort((a, b) => a.name.localeCompare(b.name))
  return models
}

/**
 * Streaming chat.
 * @param {object} opts
 * @param {string} opts.baseUrl
 * @param {string} opts.model
 * @param {Array<{role:string,content:string,images?:string[]}>} opts.messages
 * @param {(text:string)=>void} opts.onToken   called with each text delta
 * @param {(info:any)=>void} [opts.onMeta]     called with the final non-content payload
 * @param {AbortSignal} [opts.signal]
 * @param {object} [opts.options]              raw Ollama options (temperature, num_predict...)
 */
export async function chatStream({
  baseUrl = DEFAULT_OLLAMA_URL,
  model,
  messages,
  onToken,
  onMeta,
  signal,
  options = {},
  keepAlive = '5m',
}) {
  const res = await fetch(`${normalizeBase(baseUrl)}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      keep_alive: keepAlive,
      options,
    }),
  })

  if (!res.ok) {
    let detail = ''
    try {
      const err = await res.json()
      detail = err.error || ''
    } catch (e) {
      /* body may not be JSON */
    }
    throw new Error(
      detail
        ? `Ollama: ${detail}`
        : `Ollama /api/chat returned ${res.status}. Is "ollama serve" running and is ${model} pulled?`,
    )
  }
  if (!res.body) throw new Error('Ollama returned no response body (streaming unsupported).')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const t = line.trim()
      if (!t) continue
      let json
      try {
        json = JSON.parse(t)
      } catch (e) {
        continue
      }
      if (json.error) throw new Error(`Ollama: ${json.error}`)
      if (json.message?.content) {
        full += json.message.content
        onToken?.(json.message.content)
      }
      if (json.done) onMeta?.(json)
    }
  }
  // flush trailing line
  if (buffer.trim()) {
    try {
      const json = JSON.parse(buffer.trim())
      if (json.message?.content) {
        full += json.message.content
        onToken?.(json.message.content)
      }
      if (json.done) onMeta?.(json)
    } catch (e) {
      /* ignore partial */
    }
  }
  return full
}

/**
 * Split a model reply into visible answer + <think>...</think> reasoning.
 * qwen3 / deepseek-r1 style models emit <think> blocks.
 */
export function splitThinking(text = '') {
  const out = { thinking: '', answer: '' }
  let rest = String(text)
  // handles both closed pairs and an unclosed trailing <think>
  const re = /<think>([\s\S]*?)(?:<\/think>|$)/g
  let m
  let consumed = 0
  while ((m = re.exec(rest)) !== null) {
    out.thinking += m[1]
    consumed = re.lastIndex
  }
  if (consumed > 0) {
    out.answer = rest.slice(consumed).replace(/<\/think>/g, '').trimStart()
    out.thinking = out.thinking.trim()
  } else {
    out.answer = rest
  }
  return out
}
