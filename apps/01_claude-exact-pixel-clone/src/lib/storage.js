import { DEFAULT_SETTINGS, SEED_CHATS, STORAGE_KEYS } from './config.js'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (e) {
    console.warn(`localStorage ${key} is corrupt, using defaults`, e)
    return fallback
  }
}

export function loadChats() {
  const saved = readJSON(STORAGE_KEYS.chats, null)
  if (!Array.isArray(saved)) return SEED_CHATS
  // Older saves had no messages/pinned fields; normalise them.
  return saved.map((c) => ({ pinned: false, messages: [], group: 'Older', ...c }))
}

export function saveChats(chats) {
  try {
    localStorage.setItem(STORAGE_KEYS.chats, JSON.stringify(chats))
  } catch (e) {
    console.warn('Could not save chats (storage full?)', e)
  }
}

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...readJSON(STORAGE_KEYS.settings, {}) }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
}
