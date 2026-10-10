// Shared constants. Name/email come from the user's own screenshots (191547, 191608).
export const USER = {
  name: 'Utso',
  email: 'nishadislamutso@gmail.com',
  initials: 'NU',
  plan: 'Free',
}

// Browser-facing endpoints are RELATIVE; vite.config.js proxies them to the local services.
export const VAULT_BASE = '/vault'     // -> http://127.0.0.1:8765 (vault driver)
export const OLLAMA_BASE = '/ollama'   // -> http://127.0.0.1:11434 (Ollama)
export const FALLBACK_MODEL = 'qwen2.5:3b'

export const STORAGE_KEYS = {
  chats: 'claude_exact_chats',
  settings: 'claude_exact_settings',
}

// Defaults match the Settings > Appearance screenshot (191707):
// Dark theme, Anthropic Serif, Medium text, Narrow width, System motion, English/Buttery/Normal.
export const DEFAULT_SETTINGS = {
  theme: 'dark',              // system | light | dark
  chatFont: 'serif',          // serif | sans
  transcriptSize: 'medium',   // small | medium | large
  transcriptWidth: 'narrow',  // narrow | medium | wide
  motion: 'system',           // system | reduced
  voiceLanguage: 'English',
  voiceStyle: 'Buttery',
  voiceSpeed: 'Normal',
  model: FALLBACK_MODEL,
  sidebarOpen: true,
}

// Seed chats = sidebar titles visible in screenshot 191547 / 191646 (demo data, deletable).
// "group" is the sidebar section label. Titles are cut exactly as they appear in the screenshot.
export const SEED_CHATS = [
  { id: 's01', title: 'Refining a 5-day workout cycle', group: 'Oct 8' },
  { id: 's02', title: 'Identifying your charisma type', group: 'Older' },
  { id: 's03', title: 'Repurposing an old Realme 6i phone', group: 'Older' },
  { id: 's04', title: 'Fix AI-generated Facebook profile picture', group: 'Older' },
  { id: 's05', title: 'Psychiatric prescription for multiple diagnoses', group: 'Older' },
  { id: 's06', title: 'PSY 101 midterm exam preparation and pr', group: 'Older' },
  { id: 's07', title: 'PSY 101 midterm exam preparation and ch', group: 'Older' },
  { id: 's08', title: 'STA201 MID', group: 'Older' },
  { id: 's09', title: 'Creating a new skill', group: 'Older' },
  { id: 's10', title: 'PHY-112 electrostatics study notes compi', group: 'Older' },
  { id: 's11', title: 'Hash table search and function impleme', group: 'Older' },
  { id: 's12', title: 'CSE220 MID', group: 'Older' },
  { id: 's13', title: 'PSY 101 midterm exam preparation and ch', group: 'Older' },
  { id: 's14', title: 'Student-style problem solving approach', group: 'Older' },
  { id: 's15', title: 'Comprehensive notes from slides with fo', group: 'Older' },
  { id: 's16', title: 'Quick income for ADHD students', group: 'Older' },
  { id: 's17', title: 'মাতৃভাষার প্রি', group: 'Older' },
  { id: 's18', title: 'Battery pricin', group: 'Older' },
].map((c) => ({ ...c, pinned: false, messages: [] }))
