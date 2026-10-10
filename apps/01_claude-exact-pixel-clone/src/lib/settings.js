/**
 * settings.js — localStorage-backed settings, mirrors Settings modal (191707.png)
 */
const KEY = 'claude_exact_settings'

const DEFAULTS = {
  theme: 'dark',            // system | light | dark  (dark is the default per user constraint)
  chatFont: 'Anthropic Serif',
  transcriptSize: 'Medium', // Small | Medium | Large
  transcriptWidth: 'Medium',// Narrow | Medium | Wide
  motion: 'System',         // System | Reduced
  voiceLanguage: 'English',
  voiceStyle: 'Buttery',
  voiceSpeed: 'Normal',
  model: 'qwen2.5:3b',
  effort: 'Medium',
  memory: 'Manual',
  ollamaUrl: '',            // empty => use /ollama dev proxy
  vaultUrl: '',             // empty => use /vault dev proxy
  project: '',
  showTitleBar: true,
  blacklist: [],            // never-check patterns
}

function read() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

let state = read()
const subs = new Set()

export const settings = {
  get: () => state,
  set(patch) {
    state = { ...state, ...patch }
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
    subs.forEach((f) => f(state))
    return state
  },
  reset() { state = { ...DEFAULTS }; try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {} ; subs.forEach(f=>f(state)) },
  subscribe(f) { subs.add(f); return () => subs.delete(f) },
}

/* ---------- apply to <html> so Tailwind + plain CSS can react ---------- */
export function applySettings(s = state) {
  const root = document.documentElement
  const sysDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
  const dark = s.theme === 'dark' || (s.theme === 'system' && sysDark)
  root.classList.toggle('dark', dark)
  root.dataset.theme = dark ? 'dark' : 'light'
  root.style.setProperty('--app-bg', dark ? '#151515' : '#ffffff')
  root.style.setProperty('--sidebar-bg', dark ? '#111111' : '#f5f5f4')
  root.style.setProperty('--composer-bg', dark ? '#20201f' : '#ffffff')
  root.style.setProperty('--text', dark ? '#f0efec' : '#1f1e1d')
  root.style.setProperty('--text2', dark ? '#c3c2b7' : '#3d3c3a')
  root.style.setProperty('--text3', dark ? '#898781' : '#83827d')
  root.style.setProperty('--border', dark ? '#292929' : '#e5e5e3')
  root.style.setProperty('--transcript-size',
    s.transcriptSize === 'Small' ? '13px' : s.transcriptSize === 'Large' ? '16px' : '14.5px')
  root.style.setProperty('--transcript-width',
    s.transcriptWidth === 'Narrow' ? '480px' : s.transcriptWidth === 'Wide' ? '800px' : '586px')
  root.style.setProperty('--motion', s.motion === 'Reduced' ? '0ms' : '160ms')
  root.style.setProperty('--chat-font',
    s.chatFont === 'Monospace' ? 'ui-monospace, Menlo, Consolas, monospace'
      : s.chatFont === 'System Sans' ? 'Inter, system-ui, sans-serif'
      : '"Anthropic Serif", Copernicus, Georgia, serif')
}
