import { useEffect, useMemo, useState } from 'react'
import {
  Blocks, Brain, Briefcase, ChevronDown, HelpCircle, Code2, CreditCard,
  Moon, Monitor, Search, Settings2, Shield, Sparkles, Sun, UserRound, X,
  Clock3, Plug, SlidersHorizontal, Wand2,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'Settings',
    items: [
      ['General', Settings2], ['Account', UserRound], ['Privacy', Shield], ['Billing', CreditCard],
      ['Capabilities', Briefcase], ['Memory', Brain], ['Reflect', Sparkles], ['Time and focus', Clock3], ['Claude Code', Code2],
    ],
  },
  { label: 'This computer', items: [['System', Monitor], ['Extensions', Plug], ['Developer', SlidersHorizontal]] },
  { label: 'Customize', items: [['Skills', Wand2], ['Connectors', Blocks]] },
]

const SEGMENTS = {
  transcriptSize: ['Small', 'Medium', 'Large'],
  transcriptWidth: ['Narrow', 'Medium', 'Wide'],
  motion: ['System', 'Reduced'],
}

function SegmentControl({ value, options, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg bg-[var(--surface-hover)] p-0.5">
      {options.map(option => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option.toLowerCase()}
          onClick={() => onChange(option.toLowerCase())}
          className={`rounded-md px-3 py-1.5 text-[13px] transition-colors ${value === option.toLowerCase() ? 'bg-[var(--surface-selected)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >{option}</button>
      ))}
    </div>
  )
}

function AppearanceSettings({ settings, onChange }) {
  const set = (key, value) => onChange({ ...settings, [key]: value })
  const themes = [
    ['system', 'System', Monitor], ['light', 'Light', Sun], ['dark', 'Dark', Moon],
  ]

  return (
    <div className="space-y-0">
      <h2 className="mb-2 text-base font-semibold text-[var(--text-primary)]">Appearance</h2>
      <div className="settings-row min-h-[74px]">
        <div><div className="text-sm font-medium">Theme</div><div className="mt-1 text-xs text-[var(--text-muted)]">Choose how AI ASSistant looks on this device.</div></div>
        <div className="flex items-center rounded-lg bg-[var(--surface-hover)] p-1">
          {themes.map(([value, label, Icon]) => (
            <button key={value} type="button" aria-label={`${label} theme`} aria-pressed={settings.theme === value} onClick={() => set('theme', value)} className={`flex h-9 w-10 items-center justify-center rounded-md transition-colors ${settings.theme === value ? 'bg-[var(--surface-selected)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              <Icon size={17} />
            </button>
          ))}
        </div>
      </div>

      <div className="settings-row min-h-[64px]">
        <div><div className="text-sm font-medium">Chat font</div><div className="mt-1 text-xs text-[var(--text-muted)]">Font used in the conversation.</div></div>
        <label className="relative">
          <span className="sr-only">Chat font</span>
          <select value={settings.chatFont} onChange={event => set('chatFont', event.target.value)} className="appearance-none rounded-lg bg-transparent py-2 pl-3 pr-8 text-right text-sm text-[var(--text-primary)] outline-none hover:bg-[var(--surface-hover)] focus:ring-1 focus:ring-[var(--text-muted)]">
            <option>Anthropic Serif</option><option>System</option><option>Sans-serif</option>
          </select><ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        </label>
      </div>

      <div className="settings-row min-h-[76px]">
        <div><div className="text-sm font-medium">Transcript text size</div><div className="mt-1 text-xs text-[var(--text-muted)]">Size of the conversation transcript text.</div></div>
        <SegmentControl label="Transcript text size" value={settings.transcriptSize} options={SEGMENTS.transcriptSize} onChange={value => set('transcriptSize', value)} />
      </div>

      <div className="settings-row min-h-[76px]">
        <div><div className="text-sm font-medium">Transcript width</div><div className="mt-1 text-xs text-[var(--text-muted)]">Maximum width of the transcript and composer columns.</div></div>
        <SegmentControl label="Transcript width" value={settings.transcriptWidth} options={SEGMENTS.transcriptWidth} onChange={value => set('transcriptWidth', value)} />
      </div>

      <div className="settings-row min-h-[70px]">
        <div><div className="text-sm font-medium">Motion</div><div className="mt-1 text-xs text-[var(--text-muted)]">Reduce animation in streaming responses and other interface elements.</div></div>
        <SegmentControl label="Motion preference" value={settings.motion} options={SEGMENTS.motion} onChange={value => set('motion', value)} />
      </div>

      <div className="pb-2 pt-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Voice</h3>
      </div>
      {[
        ['voiceLanguage', 'Language', ['English', 'Bengali']],
        ['voiceStyle', 'Style', ['Buttery', 'Natural', 'Clear']],
        ['voiceSpeed', 'Speed', ['Slow', 'Normal', 'Fast']],
      ].map(([key, label, options]) => (
        <div className="settings-row min-h-[58px]" key={key}>
          <div className="text-sm">{label}</div>
          <label className="relative">
            <span className="sr-only">Voice {label}</span>
            <select value={settings[key]} onChange={event => set(key, event.target.value)} className="appearance-none rounded-lg bg-transparent py-2 pl-3 pr-8 text-right text-sm text-[var(--text-primary)] outline-none hover:bg-[var(--surface-hover)] focus:ring-1 focus:ring-[var(--text-muted)]">
              {options.map(option => <option key={option}>{option}</option>)}
            </select><ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          </label>
        </div>
      ))}
      <p className="pt-4 text-xs text-[var(--text-muted)]">Appearance changes are saved on this device automatically.</p>
    </div>
  )
}

function PlaceholderSettings({ section, onOpenApps }) {
  if (section === 'Extensions') {
    return (
      <div className="max-w-xl">
        <h2 className="text-base font-semibold">Extensions</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">The local browser extension is included in this repository. It is not installed into your browser by this settings page.</p>
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--surface-hover)]"><Plug size={18} /></div><div><div className="text-sm font-medium">AI ASSistant browser extension</div><div className="mt-1 text-xs text-[var(--text-muted)]">Local package · setup is manual · no external account</div></div></div>
          <button type="button" onClick={onOpenApps} className="mt-4 rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--surface-hover)]">View apps and extensions</button>
        </div>
      </div>
    )
  }
  if (section === 'General') return null
  return (
    <div className="max-w-xl">
      <h2 className="text-base font-semibold">{section}</h2>
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-start gap-3"><InfoIcon /><div><div className="text-sm font-medium">Local-only settings area</div><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">This screen matches the settings navigation in the reference. {section} controls are not connected yet; no account, billing, or remote service action will be performed here.</p></div></div>
      </div>
    </div>
  )
}

function InfoIcon() { return <HelpCircle size={18} className="mt-0.5 shrink-0 text-[var(--text-muted)]" /> }

export default function SettingsModal({ settings, onChange, onClose, onOpenApps }) {
  const [section, setSection] = useState('General')
  const [search, setSearch] = useState('')
  const flatItems = useMemo(() => NAV_GROUPS.map(group => ({ ...group, items: group.items.filter(([name]) => name.toLowerCase().includes(search.toLowerCase())) })).filter(group => group.items.length), [search])

  useEffect(() => {
    const handleKey = event => { if (event.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 backdrop-blur-[2px]" onMouseDown={event => { if (event.target === event.currentTarget) onClose?.() }}>
      <section role="dialog" aria-modal="true" aria-label="Settings" className="settings-modal relative flex h-[min(90vh,740px)] w-[min(94vw,1160px)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-main)] shadow-2xl">
        <aside className="flex w-[216px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-sidebar)]">
          <div className="p-3 pb-1"><label className="flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5"><Search size={15} className="shrink-0 text-[var(--text-muted)]" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--text-muted)]" /></label></div>
          <nav className="settings-nav flex-1 overflow-y-auto px-2 pb-4 pt-2" aria-label="Settings sections">
            {flatItems.map(group => <div key={group.label} className="mb-4">
              <div className="px-2 pb-1.5 pt-2 text-[11px] text-[var(--text-muted)]">{group.label}</div>
              {group.items.map(([name, Icon]) => <button key={name} type="button" onClick={() => setSection(name)} aria-current={section === name ? 'page' : undefined} className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] transition-colors ${section === name ? 'bg-[var(--surface-selected)] font-medium text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'}`}><Icon size={16} className="shrink-0" /><span>{name}</span></button>)}
            </div>)}
            {flatItems.length === 0 && <p className="px-2 py-3 text-xs text-[var(--text-muted)]">No settings found.</p>}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto px-7 pb-8 pt-8 sm:px-9">
          <button type="button" aria-label="Close settings" onClick={onClose} className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"><X size={18} /></button>
          {section === 'General' ? <AppearanceSettings settings={settings} onChange={onChange} /> : <PlaceholderSettings section={section} onOpenApps={onOpenApps} />}
        </main>
      </section>
    </div>
  )
}
