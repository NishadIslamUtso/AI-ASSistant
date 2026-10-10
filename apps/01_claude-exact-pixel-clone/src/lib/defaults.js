// Shared defaults, theme tokens and helpers for the exact Claude clone.
// Source of truth for pixels: spec/CLAUDE_SPEC_FROM_SCREENSHOTS.md + spec/screenshots/191547-191707.png

export const DEFAULT_CHATS = [
  { id: 'c1', title: 'Refining a 5-day workout cycle', date: 'Oct 8' },
  { id: 'c2', title: 'Identifying your charisma type', date: 'Older' },
  { id: 'c3', title: 'Repurposing an old Realme 6i phone', date: 'Older' },
  { id: 'c4', title: 'Fix AI-generated Facebook profile picture', date: 'Older' },
  { id: 'c5', title: 'Psychiatric prescription for multiple diagnoses', date: 'Older' },
  { id: 'c6', title: 'PSY 101 midterm exam preparation and practice', date: 'Older' },
  { id: 'c7', title: 'PSY 101 midterm exam preparation and chapters', date: 'Older' },
  { id: 'c8', title: 'STA201 MID', date: 'Older' },
  { id: 'c9', title: 'Creating a new skill', date: 'Older' },
  { id: 'c10', title: 'PHY-112 electrostatics study notes complete', date: 'Older' },
  { id: 'c11', title: 'Hash table search and function implementation', date: 'Older' },
  { id: 'c12', title: 'CSE220 MID', date: 'Older' },
  { id: 'c13', title: 'Student-style problem solving approach', date: 'Older' },
  { id: 'c14', title: 'Comprehensive notes from slides with focus', date: 'Older' },
  { id: 'c15', title: 'Quick income for ADHD students', date: 'Older' },
  { id: 'c16', title: 'মাতৃভাষার প্রতি ভালোবাসা', date: 'Older' },
  { id: 'c17', title: 'Battery pricing trends analysis', date: 'Older' },
]

export const DEFAULT_SETTINGS = {
  theme: 'dark',            // 'dark' | 'light' | 'system'  (dark default per user constraint)
  chatFont: 'Anthropic Serif', // 'Anthropic Serif' | 'Sans'
  transcriptSize: 'Medium', // 'Small' | 'Medium' | 'Large'
  width: 'Medium',          // 'Narrow' | 'Medium' | 'Wide'
  motion: 'System',         // 'System' | 'Reduced'
  voiceLang: 'English',
  voiceStyle: 'Buttery',
  voiceSpeed: 'Normal',
}

export const THEMES = {
  dark: {
    main: '#1a1a1a', side: '#202020', el: '#242424', elUp: '#262626',
    hover: '#2a2a2a', neu: '#2f2f2f', sel: '#3f3f3f',
    bd: '#2a2a2a', bd2: '#333333',
    tx: '#e8e8e8', tx2: '#9a9a9a', tx3: '#666666',
    bubble: '#2a2a2a', accent: '#d97757', link: '#6b9bff',
  },
  light: {
    main: '#f5f4ef', side: '#eceae3', el: '#ffffff', elUp: '#ffffff',
    hover: '#e6e3da', neu: '#e0ddd3', sel: '#d7d3c8',
    bd: '#e3e0d7', bd2: '#d8d4c9',
    tx: '#1f1f1c', tx2: '#6b6b66', tx3: '#98968f',
    bubble: '#e9e6dd', accent: '#cc5f2e', link: '#2563eb',
  },
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem('claude_exact_settings')
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(s) {
  localStorage.setItem('claude_exact_settings', JSON.stringify(s))
}

export function resolveTheme(theme) {
  if (theme === 'system') {
    try {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    } catch { return 'dark' }
  }
  return theme === 'light' ? 'light' : 'dark'
}

export function themeVars(mode) {
  const t = THEMES[mode] || THEMES.dark
  return {
    '--bg-main': t.main, '--bg-side': t.side, '--bg-el': t.el, '--bg-elup': t.elUp,
    '--bg-hover': t.hover, '--bg-neu': t.neu, '--bg-sel': t.sel,
    '--bd': t.bd, '--bd2': t.bd2,
    '--tx': t.tx, '--tx2': t.tx2, '--tx3': t.tx3,
    '--bubble': t.bubble, '--accent': t.accent, '--link': t.link,
  }
}

export function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Morning'
  if (h >= 12 && h < 17) return 'Afternoon'
  return 'Evening'
}

export function todayLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const TRANSCRIPT_SIZE = {
  Small: 'text-[14px] leading-[22px]',
  Medium: 'text-[15px] leading-6',
  Large: 'text-[17px] leading-7',
}

export const TRANSCRIPT_WIDTH = {
  Narrow: 'max-w-xl',
  Medium: 'max-w-3xl',
  Wide: 'max-w-5xl',
}
