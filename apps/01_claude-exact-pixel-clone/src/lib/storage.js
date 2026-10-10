/**
 * storage.js — tiny typed wrapper over localStorage.
 * Every key is namespaced with `ai_assistant.` except the two legacy keys
 * (`claude_exact_chats`, `claude_exact_settings`) which older builds used,
 * so an existing install keeps its data.
 */

export const KEYS = {
  chats: 'claude_exact_chats',
  settings: 'claude_exact_settings',
  messages: 'ai_assistant.messages',
  artifacts: 'ai_assistant.artifacts',
  projects: 'ai_assistant.projects',
  pinned: 'ai_assistant.pinned',
}

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch (e) {
    console.warn('[storage] bad JSON for', key, e)
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('[storage] write failed for', key, e)
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    /* ignore */
  }
}

/** Wipe every AI ASSistant key (used by Settings > Advanced > Reset local data). */
export function wipeAll() {
  const keys = Object.values(KEYS)
  // also catch legacy keys from earlier builds
  keys.push(
    'claude_exact_chats',
    'claude_exact_settings',
    'chat_history',
    'selected_provider',
    'selected_model',
  )
  for (const k of new Set(keys)) remove(k)
}
