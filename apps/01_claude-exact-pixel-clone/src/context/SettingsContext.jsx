import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { KEYS, load, save } from '../lib/storage.js'

/**
 * Settings — mirrors Settings > Appearance in screenshot 191707.png
 *   Theme (System / Light / Dark), Chat font, Transcript size,
 *   Width, Motion, Voice (Language / Style / Speed)
 * plus runtime settings the app needs (model, effort, thinking, endpoints).
 *
 * Persisted to localStorage key `claude_exact_settings`.
 */

export const DEFAULT_SETTINGS = {
  // ---- Appearance (191707.png) ----
  theme: 'dark', // 'system' | 'light' | 'dark'
  chatFont: 'Anthropic Serif', // 'Default' | 'Anthropic Serif' | 'Monospace'
  transcriptSize: 'medium', // 'small' | 'medium' | 'large'
  width: 'medium', // 'narrow' | 'medium' | 'wide'
  motion: 'system', // 'system' | 'reduced'
  voiceLanguage: 'English',
  voiceStyle: 'Buttery',
  voiceSpeed: 'Normal',

  // ---- Model / runtime ----
  model: 'qwen2.5:3b',
  effort: 'Medium', // 'Low' | 'Medium' | 'High' -> maps to generation options
  thinking: 'Manual', // 'Manual' | 'Auto' | 'Off' (Claude shows "Manual")
  ollamaUrl: 'http://127.0.0.1:11434',
  vaultUrl: 'http://127.0.0.1:8765',
  // Offline UI tester. OFF unless ?demo=1 is in the URL or it is switched on
  // in Settings > Capabilities. Never used when a real model is reachable.
  demoMode: false,

  // ---- Window / chrome ----
  showMenuBar: true, // File Edit View Go Help (Electron uses the native menu instead)

  // ---- Identity (never inferred from a Windows path — always user-editable) ----
  userName: 'Utso',
  userEmail: 'nishadislamutso@gmail.com',
  userInitials: 'NU',
  plan: 'Free',
}

const SettingsContext = createContext(null)

function systemPrefersDark() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch (e) {
    return true
  }
}

function resolveTheme(theme) {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return theme
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...load(KEYS.settings, {}),
  }))

  useEffect(() => {
    save(KEYS.settings, settings)
  }, [settings])

  // Apply theme + motion to <html>
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', resolveTheme(settings.theme))
    root.setAttribute('data-motion', settings.motion)
    root.style.colorScheme = resolveTheme(settings.theme)
    root.style.background = resolveTheme(settings.theme) === 'dark' ? '#1a1a1a' : '#ffffff'
  }, [settings.theme, settings.motion])

  // Follow the OS when theme === 'system'
  useEffect(() => {
    if (settings.theme !== 'system') return
    let mq
    try {
      mq = window.matchMedia('(prefers-color-scheme: dark)')
    } catch (e) {
      return
    }
    const onChange = () => {
      document.documentElement.setAttribute('data-theme', systemPrefersDark() ? 'dark' : 'light')
    }
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [settings.theme])

  // Motion: 'system' follows prefers-reduced-motion
  useEffect(() => {
    if (settings.motion !== 'system') return
    let mq
    try {
      mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    } catch (e) {
      return
    }
    const onChange = () =>
      document.documentElement.setAttribute(
        'data-motion',
        mq.matches ? 'reduced' : 'full',
      )
    onChange()
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [settings.motion])

  const value = useMemo(() => {
    const update = (patch) =>
      setSettings((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
    return {
      settings,
      update,
      set: update,
      reset: () => setSettings({ ...DEFAULT_SETTINGS }),
      resolvedTheme: resolveTheme(settings.theme),
      widthClass:
        settings.width === 'narrow' ? 'max-w-[640px]' : settings.width === 'wide' ? 'max-w-[880px]' : 'max-w-[768px]',
      transcriptClass:
        settings.transcriptSize === 'small' ? 'ts-small' : settings.transcriptSize === 'large' ? 'ts-large' : 'ts-medium',
      fontClass:
        settings.chatFont === 'Anthropic Serif' ? 'font-serif-claude' : settings.chatFont === 'Monospace' ? 'font-mono' : '',
    }
  }, [settings])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
