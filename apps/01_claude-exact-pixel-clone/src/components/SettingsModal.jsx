import { useEffect, useMemo, useState } from 'react'
import { Bell, Briefcase, ChevronDown, CircleUser, Code2, CreditCard, History, Layers, Monitor, Moon, Plug, Puzzle, Search, Settings, Shield, Sun, Timer, Wrench, X } from 'lucide-react'

// Layout from screenshot 191707. Only "General > Appearance" and "Voice" are wired.
// Other tabs are shown with an honest "not available yet" note.
const NAV = [
  { label: 'General', icon: Settings },
  { label: 'Account', icon: CircleUser },
  { label: 'Privacy', icon: Shield },
  { label: 'Billing', icon: CreditCard },
  { label: 'Capabilities', icon: Briefcase },
  { label: 'Memory', icon: History },
  { label: 'Reflect', icon: Bell },
  { label: 'Time and focus', icon: Timer },
  { label: 'Claude Code', icon: Code2 },
  { group: 'This computer' },
  { label: 'System', icon: Monitor },
  { label: 'Extensions', icon: Plug },
  { label: 'Developer', icon: Wrench },
  { group: 'Customize' },
  { label: 'Skills', icon: Layers },
  { label: 'Connectors', icon: Puzzle },
]

const SEG = 'flex overflow-hidden rounded-xl bg-elev p-[3px]'
const SEG_BTN = (on) => `h-8 min-w-[64px] rounded-lg px-3 text-[14px] transition-colors ${on ? 'bg-[#3c3c3b] text-fg' : 'text-fg2 hover:text-fg'}`

export default function SettingsModal({ tab, setTab, settings, patchSettings, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const [search, setSearch] = useState('')
  const items = useMemo(() => NAV.filter((n) => n.group || n.label.toLowerCase().includes(search.toLowerCase())), [search])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--overlay)] p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-label="Settings" className="flex h-[min(900px,92vh)] w-[min(1400px,95vw)] overflow-hidden rounded-2xl border border-line bg-modal shadow-2xl">
        {/* Left nav */}
        <aside className="flex w-[232px] shrink-0 flex-col border-r border-soft px-3 pb-4 pt-5">
          <div className="relative mb-5">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg3" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" aria-label="Search settings" className="h-9 w-full rounded-lg border border-soft bg-[#212121] pl-9 pr-3 text-[14px] text-fg placeholder-fg3 outline-none" autoFocus />
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto">
            {items.map((n, i) => n.group ? (
              <div key={`g${i}`} className="px-3 pb-1.5 pt-4 text-[13px] text-fg3">{n.group}</div>
            ) : (
              <button
                key={n.label}
                type="button"
                onClick={() => setTab(n.label)}
                className={`mb-0.5 flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-[14.5px] ${tab === n.label ? 'bg-[#383838] text-fg' : 'text-fg2 hover:bg-hover hover:text-fg'}`}
              >
                <n.icon size={16} className={tab === n.label ? 'text-fg' : 'text-fg2'} />
                {n.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right content */}
        <section className="relative min-w-0 flex-1 overflow-y-auto px-14 pb-12 pt-10">
          <button type="button" onClick={onClose} aria-label="Close settings" className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-fg2 hover:bg-hover"><X size={18} /></button>
          {tab === 'General' ? (
            <Appearance settings={settings} patch={patchSettings} />
          ) : (
            <div>
              <h2 className="text-[20px] font-medium text-fg">{tab}</h2>
              <p className="mt-3 max-w-[560px] text-[15px] leading-6 text-fg2">This section is not available in AI ASSistant yet. Your settings for it are not stored.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Appearance({ settings, patch }) {
  const THEMES = [
    { id: 'system', label: 'System', icon: Monitor },
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
  ]
  return (
    <div>
      <h2 className="text-[20px] font-medium text-fg">Appearance</h2>

      <Row title="Theme">
        <div className={SEG}>
          {THEMES.map((t) => (
            <button key={t.id} type="button" aria-label={`Theme: ${t.label}`} title={t.label} onClick={() => patch({ theme: t.id })} className={`flex h-8 w-10 items-center justify-center rounded-lg ${settings.theme === t.id ? 'bg-[#3c3c3b] text-fg' : 'text-fg2 hover:text-fg'}`}>
              <t.icon size={16} />
            </button>
          ))}
        </div>
      </Row>

      <Row title="Chat font">
        <label className="relative">
          <select
            value={settings.chatFont}
            onChange={(e) => patch({ chatFont: e.target.value })}
            className="h-9 cursor-pointer appearance-none rounded-lg bg-elev pl-3 pr-8 font-serif text-[15px] text-fg outline-none"
          >
            <option value="serif">Anthropic Serif</option>
            <option value="sans">Sans</option>
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-fg2" />
        </label>
      </Row>

      <Row title="Transcript text size" desc="Size of the conversation transcript text.">
        <Segmented value={settings.transcriptSize} onChange={(v) => patch({ transcriptSize: v })} options={[['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]} />
      </Row>

      <Row title="Transcript width" desc="Maximum width of the transcript and composer columns.">
        <Segmented value={settings.transcriptWidth} onChange={(v) => patch({ transcriptWidth: v })} options={[['narrow', 'Narrow'], ['medium', 'Medium'], ['wide', 'Wide']]} />
      </Row>

      <Row title="Motion" desc="Reduce animation in streaming responses and other interface elements.">
        <Segmented value={settings.motion} onChange={(v) => patch({ motion: v })} options={[['system', 'System'], ['reduced', 'Reduced']]} />
      </Row>

      <h2 className="mt-12 text-[20px] font-medium text-fg">Voice</h2>
      <Row title="Language">
        <Select value={settings.voiceLanguage} onChange={(v) => patch({ voiceLanguage: v })} options={['English']} />
      </Row>
      <Row title="Style">
        <Select value={settings.voiceStyle} onChange={(v) => patch({ voiceStyle: v })} options={['Buttery', 'Plain']} />
      </Row>
      <Row title="Speed">
        <Select value={settings.voiceSpeed} onChange={(v) => patch({ voiceSpeed: v })} options={['Slow', 'Normal', 'Fast']} />
      </Row>
      <p className="mt-3 text-[13px] text-fg3">Voice choices are saved, but speech output is not connected yet.</p>
    </div>
  )
}

function Row({ title, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-8 py-[18px]">
      <div className="min-w-0">
        <div className="text-[15px] text-fg">{title}</div>
        {desc && <div className="mt-1 text-[13.5px] leading-5 text-fg3">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Segmented({ value, onChange, options }) {
  return (
    <div className={SEG}>
      {options.map(([id, label]) => (
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)} className={SEG_BTN(value === id)}>{label}</button>
      ))}
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <label className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 cursor-pointer appearance-none rounded-lg bg-elev pl-3 pr-8 text-[15px] text-fg outline-none">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-fg2" />
    </label>
  )
}
