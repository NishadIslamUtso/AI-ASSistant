/**
 * vault.js — the app is the DRIVER of the Obsidian vault (AI-Brain).
 *
 * Requests go to `/vault/*`; Vite dev proxies to http://127.0.0.1:8765.
 * Every call fails soft — the app must keep working when the vault API is down.
 */
import { settings } from './settings.js'

function base() {
  return (settings.get().vaultUrl || '').trim() || '/vault'
}

async function j(path, opts) {
  try {
    const res = await fetch(`${base()}${path}`, opts)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export const vault = {
  async status() { return j('/') },
  /** relevant capsules / entities for a prompt */
  async context(q) { return j(`/context?q=${encodeURIComponent(q || '')}`) },
  async capture(payload) {
    return j('/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },
  async capsules() { return j('/capsules') },
  async today() { return j('/today') },
  async blacklist() { return j('/blacklist') },
  async setBlacklist(patterns) {
    return j('/blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ excluded_patterns: patterns }),
    })
  },
  async logInaccessible(url, reason, provider = 'web') {
    return this.capture({
      type: 'wasnt_accessible',
      url, reason, provider,
      captured_at: new Date().toISOString(),
    })
  },
}

/** Fire-and-forget capture of a conversation turn (never blocks the UI) */
export function captureTurn(title, messages, provider = 'AI ASSistant') {
  vault.capture({
    type: 'conversation',
    provider,
    title: String(title || '').slice(0, 80),
    url: 'app://ai-assistant',
    captured_at: new Date().toISOString(),
    completeness: 'full',
    messages: messages.map((m) => ({
      role: m.role, text: m.content, timestamp: m.ts || new Date().toISOString(),
    })),
  }).catch(() => {})
}

/**
 * "Cook This Prompt" — enhance the user's draft with relevent vault memory.
 * Local only: it just prepends retrieved context, it never sends anything out.
 */
export async function cookPrompt(draft) {
  const r = await vault.context(draft)
  const caps = r?.capsules || []
  if (!caps.length) return { ok: false, prompt: draft, note: 'No vault memory matched.' }
  const block = caps
    .slice(0, 3)
    .map((c) => `- ${c.title}: ${String(c.background || '').replace(/\s+/g, ' ').slice(0, 220)}`)
    .join('\n')
  return {
    ok: true,
    prompt: `${draft.trim()}\n\n<vault-memory>\n${block}\n</vault-memory>`,
    note: `Injected ${Math.min(3, caps.length)} capsule(s) from AI-Brain.`,
  }
}
