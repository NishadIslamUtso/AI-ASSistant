// Shared constants + localStorage helpers for the exact Claude clone.
// Storage keys are versioned (_v2) so older test data never breaks the new layout.

import { useEffect, useState } from 'react'

export const USER = {
  name: 'Utso',
  initials: 'NU',
  email: 'nishadislamutso@gmail.com', // from user's screenshot 191608.png
  plan: 'Free',
}

export const DEFAULT_MODEL = 'qwen2.5:3b'
export const OLLAMA_URL = 'http://127.0.0.1:11434'
export const VAULT_URL = 'http://127.0.0.1:8765'

export const KEYS = {
  chats: 'claude_exact_chats_v2',
  messages: 'claude_exact_messages_v2',
  settings: 'claude_exact_settings',
  model: 'selected_model',
}

// Defaults from screenshot 191547.png (sidebar list). Titles that are cut off in the
// screenshot are stored as the visible prefix, and the sidebar truncates them.
export const DEFAULT_CHATS = [
  { id: 'c-workout', title: 'Refining a 5-day workout cycle', group: 'Oct 8', pinned: false },
  { id: 'c-charisma', title: 'Identifying your charisma type', group: 'Older', pinned: false },
  { id: 'c-realme', title: 'Repurposing an old Realme 6i phone', group: 'Older', pinned: false },
  { id: 'c-facebook', title: 'Fix AI-generated Facebook profile picture', group: 'Older', pinned: false },
  { id: 'c-psych', title: 'Psychiatric prescription for multiple diag', group: 'Older', pinned: false },
  { id: 'c-psy1', title: 'PSY 101 midterm exam preparation and pr', group: 'Older', pinned: false },
  { id: 'c-psy2', title: 'PSY 101 midterm exam preparation and ch', group: 'Older', pinned: false },
  { id: 'c-sta201', title: 'STA201 MID', group: 'Older', pinned: false },
  { id: 'c-skill', title: 'Creating a new skill', group: 'Older', pinned: false },
  { id: 'c-phy112', title: 'PHY-112 electrostatics study notes compi', group: 'Older', pinned: false },
  { id: 'c-hash', title: 'Hash table search and function impleme', group: 'Older', pinned: false },
  { id: 'c-cse220', title: 'CSE220 MID', group: 'Older', pinned: false },
  { id: 'c-psy3', title: 'PSY 101 midterm exam preparation and ch', group: 'Older', pinned: false },
  { id: 'c-student', title: 'Student-style problem solving approach', group: 'Older', pinned: false },
  { id: 'c-slides', title: 'Comprehensive notes from slides with fo', group: 'Older', pinned: false },
  { id: 'c-adhd', title: 'Quick income for ADHD students', group: 'Older', pinned: false },
  { id: 'c-battery', title: 'Battery pricing', group: 'Older', pinned: false },
]

export const DEFAULT_SETTINGS = {
  theme: 'dark',              // 'system' | 'light' | 'dark'  (app default = dark, per user rule)
  chatFont: 'serif',          // 'serif' = Anthropic Serif look | 'sans'
  transcriptSize: 'medium',   // 'small' | 'medium' | 'large'
  transcriptWidth: 'narrow',  // 'narrow' | 'medium' | 'wide'
  motion: 'system',           // 'system' | 'reduced'
  voiceLanguage: 'English',
  voiceStyle: 'Buttery',
  voiceSpeed: 'Normal',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch (e) {
    return fallback
  }
}

// useState that persists to localStorage on every change.
export function useStored(key, fallback) {
  const [value, setValue] = useState(() => read(key, fallback))
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch (e) { /* quota or private mode */ }
  }, [key, value])
  return [value, setValue]
}

export function getGreeting(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

export function groupLabel(chat) {
  if (chat.pinned) return 'Pinned'
  if (chat.group === 'Today') return 'Today'
  if (chat.group === 'Oct 8') return 'Oct 8'
  return 'Older'
}

export const WIDTH_PX = { narrow: 720, medium: 880, wide: 1040 }
export const TEXT_PX = { small: 14, medium: 16, large: 18 }
