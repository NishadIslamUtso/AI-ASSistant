import { FALLBACK_MODEL, OLLAMA_BASE, VAULT_BASE } from './config.js'

// Ollama model list. Returns { models, error }. Never throws.
export async function listOllamaModels() {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const names = (data.models || []).map((m) => m.name).filter(Boolean)
    if (!names.includes(FALLBACK_MODEL)) names.unshift(FALLBACK_MODEL)
    return { models: names, error: null }
  } catch (e) {
    return { models: [FALLBACK_MODEL], error: `Ollama not reachable (${e.message})` }
  }
}

// Vault driver health. Returns { ok, vault } or { ok:false }.
export async function vaultStatus() {
  try {
    const res = await fetch(`${VAULT_BASE}/`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    return { ok: false }
  }
}

export async function vaultContext(query) {
  const res = await fetch(`${VAULT_BASE}/context?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function vaultCapture(payload) {
  const res = await fetch(`${VAULT_BASE}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
