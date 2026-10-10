import { STORAGE } from './constants.js'
import { loadJSON, saveJSON } from './storage.js'

export const DEFAULT_SETTINGS = {
  theme: 'dark', // 'system' | 'light' | 'dark'  (dark is the user's default)
  chatFont: 'serif', // 'serif' = Anthropic Serif | 'sans'
  transcriptSize: 'medium', // small | medium | large
  transcriptWidth: 'narrow', // narrow | medium | wide
  motion: 'system', // system | reduced
  voiceLanguage: 'English', // stored only; voice output is not built yet
  voiceStyle: 'Buttery',
  voiceSpeed: 'Normal',
}

// Narrow = 880px matches the composer width measured in the screenshot.
export const TRANSCRIPT_SIZES = {
  small: { label: 'Small', px: 14 },
  medium: { label: 'Medium', px: 16 },
  large: { label: 'Large', px: 18 },
}
export const TRANSCRIPT_WIDTHS = {
  narrow: { label: 'Narrow', px: 880 },
  medium: { label: 'Medium', px: 1040 },
  wide: { label: 'Wide', px: 1280 },
}

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...loadJSON(STORAGE.settings, {}) }
}

export function saveSettings(settings) {
  saveJSON(STORAGE.settings, settings)
}

export function resolveTheme(theme) {
  if (theme === 'system') {
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  return theme === 'light' ? 'light' : 'dark'
}

export function applySettings(settings) {
  const root = document.documentElement
  root.dataset.theme = resolveTheme(settings.theme)
  root.dataset.font = settings.chatFont === 'sans' ? 'sans' : 'serif'
  root.dataset.motion = settings.motion === 'reduced' ? 'reduced' : 'system'
  root.style.setProperty('--transcript-size', `${TRANSCRIPT_SIZES[settings.transcriptSize]?.px ?? 16}px`)
  root.style.setProperty('--col-w', `${TRANSCRIPT_WIDTHS[settings.transcriptWidth]?.px ?? 880}px`)
}
