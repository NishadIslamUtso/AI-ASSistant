import { VAULT_PROXY } from './constants.js'

export async function vaultContext(q, signal) {
  const res = await fetch(`${VAULT_PROXY}/context?q=${encodeURIComponent(q)}`, { signal })
  if (!res.ok) throw new Error(`vault HTTP ${res.status}`)
  const data = await res.json()
  return data.capsules || []
}

// Fire-and-forget: the chat must keep working even when the vault API is not running.
export function vaultCapture(payload) {
  return fetch(`${VAULT_PROXY}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => null)
}
