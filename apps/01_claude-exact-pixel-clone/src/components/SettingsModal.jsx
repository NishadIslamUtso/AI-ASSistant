import { useState } from 'react'
import { Search, Monitor, Sun, Moon, Settings, User, Shield, CreditCard, Briefcase, Brain, Bell, Clock, Code, Plug, Puzzle, Wrench, Layers, Link2 } from 'lucide-react'
import Modal from './Modal.jsx'

const NAV = [
  { group: 'Settings', items: [
    ['General', Settings], ['Account', User], ['Privacy', Shield], ['Billing', CreditCard],
    ['Capabilities', Briefcase], ['Memory', Brain], ['Reflect', Bell], ['Time and focus', Clock], ['Claude Code', Code],
  ] },
  { group: 'This computer', items: [['System', Monitor], ['Extensions', Puzzle], ['Developer', Wrench]] },
  { group: 'Customize', items: [['Skills', Layers], ['Connectors', Link2]] },
]

const Row = ({ title, desc, children }) => (
  <div className="flex items-center justify-between gap-6 py-5 border-b border-[#2a2a2a]">
    <div className="min-w-0">
      <div className="text-[15px] text-[#e8e6e1]">{title}</div>
      {desc && <div className="text-[13px] text-[#888] mt-1 leading-5">{desc}</div>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
)

// Segmented control: selected option is lighter with a border, like screenshot 191707.
const Segmented = ({ options, value, onChange }) => (
  <div className="inline-flex bg-[#242424] rounded-lg p-0.5 border border-[#2f2f2f]">
    {options.map(([id, label, Icon]) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        aria-pressed={value === id}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md ${value === id ? 'bg-[#3a3a3a] text-white' : 'text-[#999] hover:text-[#ddd]'}`}
      >
        {Icon && <Icon size={14} />}{label}
      </button>
    ))}
  </div>
)

const Select = ({ value, options, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="bg-[#242424] border border-[#2f2f2f] rounded-lg px-3 py-1.5 text-[14px] text-[#e8e6e1] outline-none cursor-pointer"
  >
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>
)

export default function SettingsModal({ settings, setSettings, onClose, initialSection = 'General' }) {
  const [active, setActive] = useState(initialSection)
  const [query, setQuery] = useState('')
  const set = (key) => (value) => setSettings((s) => ({ ...s, [key]: value }))

  const groups = NAV.map((g) => ({ ...g, items: g.items.filter(([n]) => n.toLowerCase().includes(query.toLowerCase())) })).filter((g) => g.items.length)

  return (
    <Modal title="Settings" onClose={onClose} className="w-[min(1000px,94vw)] h-[min(760px,92vh)] flex">
      {/* Left nav */}
      <div className="w-[260px] shrink-0 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col pt-6 pb-4">
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 bg-[#242424] border border-[#2f2f2f] rounded-lg px-3 py-2">
            <Search size={14} className="text-[#888]" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="bg-transparent outline-none text-[14px] w-full placeholder-[#777]" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 space-y-4">
          {groups.map((g) => (
            <div key={g.group}>
              <div className="px-3 text-[13px] text-[#888] mb-1.5">{g.group}</div>
              {g.items.map(([name, Icon]) => (
                <button key={name} onClick={() => setActive(name)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] ${active === name ? 'bg-[#2a2a2a] text-white' : 'text-[#bbb] hover:bg-[#222]'}`}>
                  <Icon size={16} className="shrink-0" />{name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 overflow-y-auto px-12 py-10">
        {active === 'General' ? (
          <>
            <h2 className="text-[22px] font-medium mb-4">Appearance</h2>
            <Row title="Theme">
              <Segmented value={settings.theme} onChange={set('theme')} options={[['system', '', Monitor], ['light', '', Sun], ['dark', '', Moon]]} />
            </Row>
            <Row title="Chat font">
              <Select value={settings.chatFont} onChange={set('chatFont')} options={['Anthropic Serif', 'Anthropic Sans']} />
            </Row>
            <Row title="Transcript text size" desc="Size of the conversation transcript text.">
              <Segmented value={settings.transcriptSize} onChange={set('transcriptSize')} options={[['Small', 'Small'], ['Medium', 'Medium'], ['Large', 'Large']]} />
            </Row>
            <Row title="Transcript width" desc="Maximum width of the transcript and composer columns.">
              <Segmented value={settings.transcriptWidth} onChange={set('transcriptWidth')} options={[['Narrow', 'Narrow'], ['Medium', 'Medium'], ['Wide', 'Wide']]} />
            </Row>
            <Row title="Motion" desc="Reduce animation in streaming responses and other interface elements.">
              <Segmented value={settings.motion} onChange={set('motion')} options={[['System', 'System'], ['Reduced', 'Reduced']]} />
            </Row>

            <h2 className="text-[22px] font-medium mt-10 mb-4">Voice</h2>
            <Row title="Language">
              <Select value={settings.voiceLanguage} onChange={set('voiceLanguage')} options={['English']} />
            </Row>
            <Row title="Style">
              <Select value={settings.voiceStyle} onChange={set('voiceStyle')} options={['Buttery', 'Calm', 'Bright']} />
            </Row>
            <Row title="Speed">
              <Select value={settings.voiceSpeed} onChange={set('voiceSpeed')} options={['Slow', 'Normal', 'Fast']} />
            </Row>
            <p className="text-[12px] text-[#666] mt-6">Settings are saved on this computer only (localStorage key claude_exact_settings).</p>
          </>
        ) : (
          <div className="text-[#888] text-[14px] pt-10">
            <div className="text-[18px] text-[#e8e6e1] mb-2">{active}</div>
            Not built in this clone yet. Only General (Appearance and Voice) is wired.
          </div>
        )}
      </div>
    </Modal>
  )
}
