// Direct Ollama client (no proxy). Runs in the browser at 127.0.0.1:11434.
// Requires OLLAMA_ORIGINS="*" if Ollama rejects the browser origin (see start-app.bat).

import { OLLAMA_URL, VAULT_URL } from './store.js'

export async function listModels() {
  const res = await fetch(`${OLLAMA_URL}/api/tags`)
  if (!res.ok) throw new Error(`Ollama returned ${res.status}`)
  const data = await res.json()
  return (data.models || []).map((m) => m.name)
}

// Streams a chat completion. Calls onToken(text) for every chunk.
// Handles JSON lines that are split across network reads.
export async function streamChat({ model, messages, onToken, signal }) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  })
  if (!res.ok) throw new Error(`Ollama returned ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const handleLine = (line) => {
    if (!line.trim()) return
    let json
    try { json = JSON.parse(line) } catch (e) { return } // ignore a malformed partial line
    if (json.error) throw new Error(json.error)
    if (json.message?.content) onToken(json.message.content)
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let idx
    while ((idx = buffer.indexOf('\n')) >= 0) {
      handleLine(buffer.slice(0, idx))
      buffer = buffer.slice(idx + 1)
    }
  }
  buffer += decoder.decode()
  handleLine(buffer)
}

// Best-effort vault context lookup. Never throws; returns [] when the vault API is off.
export async function fetchVaultContext(query) {
  try {
    const res = await fetch(`${VAULT_URL}/context?q=${encodeURIComponent(query.slice(-80))}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.capsules || []).slice(0, 3)
  } catch (e) {
    return []
  }
}
