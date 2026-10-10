import { useEffect, useMemo, useState } from 'react'
import { X, Search, Settings, CircleUser, Shield, Wallet, Briefcase, History, Bell, MoonStar, Code2, Monitor, Sun, Moon, Plug, Wrench, Sparkles, Puzzle } from 'lucide-react'
import { DEFAULT_SETTINGS } from '../lib/store.js'

// Left nav exactly as in screenshot 191707.png.
const NAV = [
  { group: 'Settings', items: [
    { id: 'General', icon: Settings },
    { id: 'Account', icon: CircleUser },
    { id: 'Privacy', icon: Shield },
    { id: 'Billing', icon: Wallet },
    { id: 'Capabilities', icon: Briefcase },
    { id: 'Memory', icon: History },
    { id: 'Reflect', icon: Bell },
    { id: 'Time and focus', icon: MoonStar },
    { id: 'Claude Code', icon: Code2 },
  ] },
  { group: 'This computer', items: [
    { id: 'System', icon: Monitor },
    { id: 'Extensions', icon: Plug },
    { id: 'Developer', icon: Wrench },
  ] },
  { group: 'Customize', items: [
    { id: 'Skills', icon: Sparkles },
    { id: 'Connectors', icon: Puzzle },
  ] },
]

export default function SettingsModal({ settings, setSettings, section, setSection, onClose, onOpenApps }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (key, value) => setSettings((s) => ({ ...s, [key]: value }))

  const filteredNav = useMemo(() => {
    const q = query.trim().toLowerCase()
    return NAV.map((g) => ({ ...g, items: g.items.filter((i) => !q || i.id.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0)
  }, [query])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center c-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="relative flex h-[min(780px,90vh)] w-[min(1400px,94vw)] overflow-hidden rounded-2xl c-main border c-border"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <nav className="w-[230px] shrink-0 c-side border-r c-border flex flex-col p-3">
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 c-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search settings"
              className="w-full rounded-lg py-1.5 pl-8 pr-3 text-sm outline-none c-main border c-border"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredNav.map((g) => (
              <div key={g.group} className="mb-3">
                <div className="px-3 py-1 text-xs c-muted">{g.group}</div>
                {g.items.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSection(id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-left c-hover ${section === id ? 'c-active' : 'c-muted-2'}`}
                  >
                    <Icon size={16} />
                    <span>{id}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </nav>

        <section className="relative flex-1 overflow-y-auto px-10 py-8">
          <button type="button" aria-label="Close settings" onClick={onClose} className="absolute right-5 top-5 c-hover rounded-md p-1.5 c-muted-2">
            <X size={18} />
          </button>

          {section === 'General' && (
            <>
              <h2 className="text-lg font-semibold mb-4">Appearance</h2>
              <Row label="Theme">
                <Segmented
                  value={settings.theme}
                  onChange={(v) => set('theme', v)}
                  options={[
                    { value: 'system', label: 'System', icon: Monitor },
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                  ]}
                />
              </Row>
              <Row label="Chat font">
                <select className="c-select" value={settings.chatFont} onChange={(e) => set('chatFont', e.target.value)} aria-label="Chat font">
                  <option value="serif">Anthropic Serif</option>
                  <option value="sans">Sans-serif</option>
                </select>
              </Row>
              <Row label="Transcript text size" description="Size of the conversation transcript text.">
                <Segmented
                  value={settings.transcriptSize}
                  onChange={(v) => set('transcriptSize', v)}
                  options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]}
                />
              </Row>
              <Row label="Transcript width" description="Maximum width of the transcript and composer columns.">
                <Segmented
                  value={settings.transcriptWidth}
                  onChange={(v) => set('transcriptWidth', v)}
                  options={[{ value: 'narrow', label: 'Narrow' }, { value: 'medium', label: 'Medium' }, { value: 'wide', label: 'Wide' }]}
                />
              </Row>
              <Row label="Motion" description="Reduce animation in streaming responses and other interface elements.">
                <Segmented
                  value={settings.motion}
                  onChange={(v) => set('motion', v)}
                  options={[{ value: 'system', label: 'System' }, { value: 'reduced', label: 'Reduced' }]}
                />
              </Row>

              <h2 className="text-lg font-semibold mb-4 mt-10">Voice</h2>
              <Row label="Language">
                <select className="c-select" value={settings.voiceLanguage} onChange={(e) => set('voiceLanguage', e.target.value)} aria-label="Voice language">
                  <option>English</option>
                </select>
              </Row>
              <Row label="Style">
                <select className="c-select" value={settings.voiceStyle} onChange={(e) => set('voiceStyle', e.target.value)} aria-label="Voice style">
                  <option>Buttery</option>
                </select>
              </Row>
              <Row label="Speed">
                <select className="c-select" value={settings.voiceSpeed} onChange={(e) => set('voiceSpeed', e.target.value)} aria-label="Voice speed">
                  <option>Slow</option>
                  <option>Normal</option>
                  <option>Fast</option>
                </select>
              </Row>
              <p className="mt-4 text-xs c-muted">Voice output is not in the local build yet. These choices are saved for later.</p>

              <div className="mt-10">
                <button
                  type="button"
                  onClick={() => setSettings(DEFAULT_SETTINGS)}
                  className="rounded-lg border c-border px-3 py-1.5 text-sm c-hover c-muted-2"
                >
                  Reset appearance to defaults
                </button>
              </div>
            </>
          )}

          {section === 'Extensions' && (
            <>
              <h2 className="text-lg font-semibold mb-2">Extensions</h2>
              <p className="text-sm c-muted-2 mb-4">The AI ASSistant browser extension is local-only. Load the extension/ folder unpacked in Chrome.</p>
              <button type="button" onClick={onOpenApps} className="rounded-lg border c-border px-3 py-1.5 text-sm c-hover">Open Apps and extensions</button>
            </>
          )}

          {!['General', 'Extensions'].includes(section) && (
            <>
              <h2 className="text-lg font-semibold mb-2">{section}</h2>
              <p className="text-sm c-muted">Not in the local build yet.</p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function Row({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b c-border py-4">
      <div>
        <div className="text-sm">{label}</div>
        {description && <div className="mt-1 text-xs c-muted">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Segmented({ value, onChange, options }) {
  return (
    <div role="radiogroup" className="flex rounded-lg p-0.5" style={{ background: 'var(--bg-hover)' }}>
      {options.map(({ value: v, label, icon: Icon }) => {
        const on = value === v
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={label}
            title={label}
            onClick={() => onChange(v)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${on ? 'c-active shadow-sm' : 'c-muted-2'}`}
            style={on ? { background: 'var(--bg-active)' } : undefined}
          >
            {Icon && <Icon size={14} />}
            {!Icon && label}
          </button>
        )
      })}
    </div>
  )
}
