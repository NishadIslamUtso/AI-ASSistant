import { useState } from 'react'
import {
  X, Search, Settings, UserRound, ShieldCheck, CreditCard, Briefcase, BrainCog,
  Sunrise, MoonStar, TerminalSquare, Monitor, Plug, Wrench, Sparkles, Grid2x2,
  Sun, Moon, ChevronDown, Check,
} from 'lucide-react'

// Settings modal from screenshot 191707.png.
// Appearance controls are live: theme, chat font, transcript size, width, motion, voice.
// Stored in localStorage key claude_exact_settings.

const NAV = [
  { section: 'Settings', items: [
    { id: 'General', icon: Settings },
    { id: 'Account', icon: UserRound },
    { id: 'Privacy', icon: ShieldCheck },
    { id: 'Billing', icon: CreditCard },
    { id: 'Capabilities', icon: Briefcase },
    { id: 'Memory', icon: BrainCog },
    { id: 'Reflect', icon: Sunrise },
    { id: 'Time and focus', icon: MoonStar },
    { id: 'Claude Code', icon: TerminalSquare },
  ]},
  { section: 'This computer', items: [
    { id: 'System', icon: Monitor },
    { id: 'Extensions', icon: Plug },
    { id: 'Developer', icon: Wrench },
  ]},
  { section: 'Customize', items: [
    { id: 'Skills', icon: Sparkles },
    { id: 'Connectors', icon: Grid2x2 },
  ]},
]

export default function SettingsModal({ settings, setSettings, onClose, onOpenApps }) {
  const [tab, setTab] = useState('General')
  const [query, setQuery] = useState('')

  function set(patch) { setSettings(prev => ({ ...prev, ...patch })) }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div
        className="w-[calc(100%-140px)] h-[calc(100%-96px)] max-w-[1500px] rounded-xl bg-[var(--bg-main)] border border-[var(--bd)] shadow-2xl flex overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* left nav */}
        <div className="w-[240px] shrink-0 bg-[var(--bg-side)] border-r border-[var(--bd)] flex flex-col">
          <div className="p-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tx3)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full h-9 bg-[var(--bg-hover)] rounded-lg pl-9 pr-3 text-[14px] text-[var(--tx)] placeholder-[var(--tx3)] outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {NAV.map(sec => {
              const items = sec.items.filter(i => i.id.toLowerCase().includes(query.toLowerCase()))
              if (!items.length) return null
              return (
                <div key={sec.section} className="mb-3">
                  <div className="px-2 pt-2 pb-1 text-[12px] text-[var(--tx2)]">{sec.section}</div>
                  {items.map(i => (
                    <button
                      key={i.id}
                      onClick={() => setTab(i.id)}
                      className={`w-full flex items-center gap-2.5 px-2 py-[7px] rounded-lg text-[14px] ${tab === i.id ? 'bg-[var(--bg-hover)] text-[var(--tx)]' : 'text-[var(--tx)] hover:bg-[var(--bg-hover)]'}`}
                    >
                      <i.icon size={16} className="text-[var(--tx2)]" /> {i.id}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* right content */}
        <div className="flex-1 relative overflow-y-auto">
          <button onClick={onClose} className="absolute right-5 top-5 p-1.5 rounded-md text-[var(--tx2)] hover:text-[var(--tx)] hover:bg-[var(--bg-hover)]" title="Close"><X size={18} /></button>
          <div className="px-10 py-8 max-w-[1100px]">
            {tab === 'General' && (
              <>
                <h2 className="text-[19px] font-semibold mb-6">Appearance</h2>

                <Row label="Theme">
                  <div className="flex items-center bg-[var(--bg-hover)] rounded-lg p-0.5">
                    <ThemeBtn active={settings.theme === 'system'} onClick={() => set({ theme: 'system' })} title="System"><Monitor size={16} /></ThemeBtn>
                    <ThemeBtn active={settings.theme === 'light'} onClick={() => set({ theme: 'light' })} title="Light"><Sun size={16} /></ThemeBtn>
                    <ThemeBtn active={settings.theme === 'dark'} onClick={() => set({ theme: 'dark' })} title="Dark"><Moon size={16} /></ThemeBtn>
                  </div>
                </Row>

                <Row label="Chat font">
                  <Dropdown
                    value={settings.chatFont}
                    options={['Anthropic Serif', 'Sans']}
                    onChange={(v) => set({ chatFont: v })}
                    serif={settings.chatFont === 'Anthropic Serif'}
                  />
                </Row>

                <Row label="Transcript text size" sub="Size of the conversation transcript text.">
                  <Segmented value={settings.transcriptSize} options={['Small', 'Medium', 'Large']} onChange={(v) => set({ transcriptSize: v })} />
                </Row>

                <Row label="Transcript width" sub="Maximum width of the transcript and composer columns.">
                  <Segmented value={settings.width} options={['Narrow', 'Medium', 'Wide']} onChange={(v) => set({ width: v })} />
                </Row>

                <Row label="Motion" sub="Reduce animation in streaming responses and other interface elements.">
                  <Segmented value={settings.motion} options={['System', 'Reduced']} onChange={(v) => set({ motion: v })} />
                </Row>

                <h2 className="text-[19px] font-semibold mt-10 mb-4">Voice</h2>
                <Row label="Language"><Dropdown value={settings.voiceLang} options={['English']} onChange={(v) => set({ voiceLang: v })} /></Row>
                <Row label="Style"><Dropdown value={settings.voiceStyle} options={['Buttery', 'Friendly', 'Calm']} onChange={(v) => set({ voiceStyle: v })} /></Row>
                <Row label="Speed"><Dropdown value={settings.voiceSpeed} options={['Slow', 'Normal', 'Fast']} onChange={(v) => set({ voiceSpeed: v })} /></Row>
              </>
            )}

            {tab === 'Extensions' && (
              <>
                <h2 className="text-[19px] font-semibold mb-4">Extensions</h2>
                <p className="text-[14px] text-[var(--tx2)] mb-4">Chrome extension (local-only collector + Capsule Hub + Quillbot) and vault driver integrations.</p>
                <button onClick={() => { onClose(); onOpenApps && onOpenApps() }} className="bg-white text-black text-[14px] font-medium rounded-lg px-4 py-2">Open Apps and extensions</button>
              </>
            )}

            {tab !== 'General' && tab !== 'Extensions' && (
              <>
                <h2 className="text-[19px] font-semibold mb-4">{tab}</h2>
                <p className="text-[14px] text-[var(--tx2)]">The {tab} panel is part of the Claude layout spec. Local build: nothing to configure here yet — settings live in General, Extensions and the vault (00 System/).</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, sub, children }) {
  return (
    <div className="flex items-center justify-between gap-6 py-5 border-b border-[var(--bd)]">
      <div>
        <div className="text-[15px] text-[var(--tx)]">{label}</div>
        {sub && <div className="text-[13px] text-[var(--tx2)] mt-1">{sub}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function ThemeBtn({ active, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-10 h-8 flex items-center justify-center rounded-md ${active ? 'bg-[var(--bg-sel)] text-[var(--tx)]' : 'text-[var(--tx2)] hover:text-[var(--tx)]'}`}
    >
      {children}
    </button>
  )
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="flex items-center bg-[var(--bg-hover)] rounded-lg p-0.5">
      {options.map(o => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-4 h-8 rounded-md text-[14px] ${value === o ? 'bg-[var(--bg-sel)] text-[var(--tx)] border border-[var(--bd2)]' : 'text-[var(--tx2)] hover:text-[var(--tx)]'}`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

function Dropdown({ value, options, onChange, serif }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[15px] text-[var(--tx)] ${serif ? 'serif' : ''}`}>
        {value} <ChevronDown size={15} className="text-[var(--tx2)]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 w-44 rounded-xl bg-[var(--bg-elup)] border border-[var(--bd2)] shadow-2xl py-1.5">
            {options.map(o => (
              <button key={o} onClick={() => { onChange(o); setOpen(false) }} className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-[14px] hover:bg-[var(--bg-hover)] ${o === value ? 'text-[var(--tx)]' : 'text-[var(--tx2)]'}`}>
                {o} {o === value && <Check size={14} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
