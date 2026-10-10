// Settings for the exact clone. Stored in localStorage key claude_exact_settings.
export const SETTINGS_KEY = 'claude_exact_settings'

export const DEFAULT_SETTINGS = {
  theme: 'dark',            // system | light | dark   (dark is the default)
  chatFont: 'Anthropic Serif', // Anthropic Serif | Anthropic Sans
  transcriptSize: 'Medium', // Small | Medium | Large
  transcriptWidth: 'Narrow',// Narrow | Medium | Wide
  motion: 'System',         // System | Reduced
  voiceLanguage: 'English',
  voiceStyle: 'Buttery',
  voiceSpeed: 'Normal',
}

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    return { ...DEFAULT_SETTINGS, ...saved }
  } catch (e) {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
