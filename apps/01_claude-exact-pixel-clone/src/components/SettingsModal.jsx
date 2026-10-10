import { useEffect, useState } from 'react'
import { Blocks, Bell, Briefcase, ChevronDown, Clock, Code2, CreditCard, History, Lock, Monitor, Moon, Plug, Puzzle, Search, Settings, Sun, UserRound, Wrench, X } from 'lucide-react'
import { TRANSCRIPT_SIZES, TRANSCRIPT_WIDTHS } from '../lib/settings.js'

// Left nav exactly as in screenshot 191707. Only General (Appearance + Voice) is built.
const NAV = [
  {
    group: 'Settings',
    items: [
      ['general', 'General', Settings],
      ['account', 'Account', UserRound],
      ['privacy', 'Privacy', Lock],
      ['billing', 'Billing', CreditCard],
      ['capabilities', 'Capabilities', Briefcase],
      ['memory', 'Memory', History],
      ['reflect', 'Reflect', Bell],
      ['time', 'Time and focus', Clock],
      ['claude-code', 'Claude Code', Code2],
    ],
  },
  {
    group: 'This computer',
    items: [
      ['system', 'System', Monitor],
      ['extensions', 'Extensions', Plug],
      ['developer', 'Developer', Wrench],
    ],
  },
  {
    group: 'Customize',
    items: [
      ['skills', 'Skills', Blocks],
      ['connectors', 'Connectors', Puzzle],
    ],
  },
]

const CHAT_FONTS = [
  { value: 'serif', label: 'Anthropic Serif' },
  { value: 'sans', label: 'Anthropic Sans' },
]

function Row({ title, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-10 py-[22px]">
      <div className="min-w-0">
        <div className="text-[16px] text-ui-text">{title}</div>
        {desc && <div className="mt-1 text-[14px] leading-5 text-ui-muted">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="flex rounded-lg bg-ui-seg p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={`flex h-8 min-w-[44px] items-center justify-center rounded-md px-3.5 text-[15px] ${value === o.value ? 'bg-ui-active text-ui-text' : 'text-ui-muted hover:text-ui-body'}`}
        >
          {o.icon ? <o.icon size={17} /> : o.label}
        </button>
      ))}
    </div>
  )
}

function Select({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value)
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[15px] text-ui-text hover:bg-ui-hover">
        {current?.label}
        <ChevronDown size={15} className="text-ui-muted" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-ui-line bg-ui-menu p-1.5 shadow-2xl">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className="flex h-9 w-full items-center rounded-md px-2.5 text-left text-[15px] text-ui-body hover:bg-ui-hover"
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Appearance({ settings, onChange }) {
  return (
    <>
      <h2 className="text-[22px] font-semibold text-ui-text">Appearance</h2>
      <div className="mt-2">
        <Row title="Theme">
          <Segmented
            value={settings.theme}
            onChange={(v) => onChange({ theme: v })}
            options={[
              { value: 'system', icon: Monitor, title: 'System' },
              { value: 'light', icon: Sun, title: 'Light' },
              { value: 'dark', icon: Moon, title: 'Dark' },
            ]}
          />
        </Row>
        <Row title="Chat font">
          <Select value={settings.chatFont} options={CHAT_FONTS} onChange={(v) => onChange({ chatFont: v })} />
        </Row>
        <Row title="Transcript text size" desc="Size of the conversation transcript text.">
          <Segmented
            value={settings.transcriptSize}
            onChange={(v) => onChange({ transcriptSize: v })}
            options={Object.entries(TRANSCRIPT_SIZES).map(([value, o]) => ({ value, label: o.label }))}
          />
        </Row>
        <Row title="Transcript width" desc="Maximum width of the transcript and composer columns.">
          <Segmented
            value={settings.transcriptWidth}
            onChange={(v) => onChange({ transcriptWidth: v })}
            options={Object.entries(TRANSCRIPT_WIDTHS).map(([value, o]) => ({ value, label: o.label }))}
          />
        </Row>
        <Row title="Motion" desc="Reduce animation in streaming responses and other interface elements.">
          <Segmented
            value={settings.motion}
            onChange={(v) => onChange({ motion: v })}
            options={[
              { value: 'system', label: 'System' },
              { value: 'reduced', label: 'Reduced' },
            ]}
          />
        </Row>
      </div>

      <h2 className="mt-10 text-[22px] font-semibold text-ui-text">Voice</h2>
      <p className="mt-1 text-[14px] text-ui-muted">Preferences are saved. Voice output is not built yet.</p>
      <div className="mt-2">
        {[
          ['Language', settings.voiceLanguage],
          ['Style', settings.voiceStyle],
          ['Speed', settings.voiceSpeed],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-[22px]">
            <div className="text-[16px] text-ui-text">{label}</div>
            <div className="flex items-center gap-1.5 text-[15px] text-ui-text">
              {value}
              <ChevronDown size={15} className="text-ui-muted" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default function SettingsModal({ settings, onChange, onClose }) {
  const [section, setSection] = useState('general')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const q = query.trim().toLowerCase()
  const label = NAV.flatMap((g) => g.items).find(([id]) => id === section)?.[1] || ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ui-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div role="dialog" aria-modal="true" aria-label="Settings" className="relative flex h-[min(920px,calc(100vh-100px))] w-[min(1757px,calc(100vw-164px))] overflow-hidden rounded-2xl border border-ui-line bg-ui-main shadow-2xl">
        <aside className="flex w-[263px] shrink-0 flex-col px-[16px] pt-[16px]">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ui-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="h-9 w-full rounded-lg border border-ui-line bg-ui-main pl-9 pr-3 text-[15px] text-ui-text outline-none placeholder:text-ui-muted"
            />
          </label>
          <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
            {NAV.map((g) => (
              <div key={g.group} className="mb-4">
                <div className="px-2 pb-1.5 text-[14px] text-ui-muted">{g.group}</div>
                {g.items
                  .filter(([, name]) => !q || name.toLowerCase().includes(q))
                  .map(([id, name, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSection(id)}
                      className={`mb-px flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] ${section === id ? 'bg-ui-active text-ui-text' : 'text-ui-body hover:bg-ui-hover'}`}
                    >
                      <Icon size={17} className="shrink-0" />
                      {name}
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </aside>

        <section className="relative flex-1 overflow-y-auto bg-ui-panel px-12 pb-12 pt-[52px]">
          <button type="button" onClick={onClose} title="Close (Esc)" className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-md text-ui-body hover:bg-ui-hover">
            <X size={18} />
          </button>
          {section === 'general' ? (
            <div className="max-w-[1000px]">
              <Appearance settings={settings} onChange={onChange} />
            </div>
          ) : (
            <div className="text-[15px] text-ui-muted">{label} is not built in AI ASSistant yet.</div>
          )}
        </section>
      </div>
    </div>
  )
}
