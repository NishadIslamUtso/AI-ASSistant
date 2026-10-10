import { OLLAMA_PROXY } from './constants.js'

export async function listModels(signal) {
  const res = await fetch(`${OLLAMA_PROXY}/api/tags`, { signal })
  if (!res.ok) throw new Error(`Ollama returned HTTP ${res.status}`)
  const data = await res.json()
  return (data.models || []).map((m) => m.name).filter(Boolean)
}

// Streams /api/chat (NDJSON). Buffers partial lines so JSON split across network chunks still parses.
export async function streamChat({ model, messages, onToken, signal }) {
  const res = await fetch(`${OLLAMA_PROXY}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Ollama returned HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const handleLine = (line) => {
    if (!line.trim()) return
    let json
    try {
      json = JSON.parse(line)
    } catch {
      return
    }
    if (json.error) throw new Error(json.error)
    if (json.message?.content) onToken(json.message.content)
  }
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let idx
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 1)
      handleLine(line)
    }
  }
  buffer += decoder.decode()
  if (buffer.trim()) handleLine(buffer)
}
