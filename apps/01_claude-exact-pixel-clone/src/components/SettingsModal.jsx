import { useEffect, useMemo, useState } from 'react'
import {
  Settings,
  UserRound,
  Shield,
  CreditCard,
  SlidersHorizontal,
  Brain,
  Sparkles,
  Clock3,
  Code2,
  Monitor,
  Puzzle,
  Wrench,
  GraduationCap,
  Blocks,
  Search,
  Sun,
  Moon,
  X,
  ChevronDown,
} from 'lucide-react'

const navigation = [
  { section: 'Settings' },
  { label: 'General', icon: Settings },
  { label: 'Account', icon: UserRound },
  { label: 'Privacy', icon: Shield },
  { label: 'Billing', icon: CreditCard },
  { label: 'Capabilities', icon: SlidersHorizontal },
  { label: 'Memory', icon: Brain },
  { label: 'Reflect', icon: Sparkles },
  { label: 'Time and focus', icon: Clock3 },
  { label: 'Claude Code', icon: Code2 },
  { section: 'This computer' },
  { label: 'System', icon: Monitor },
  { label: 'Extensions', icon: Puzzle },
  { label: 'Developer', icon: Wrench },
  { section: 'Customize' },
  { label: 'Skills', icon: GraduationCap },
  { label: 'Connectors', icon: Blocks },
]

const settingDefaults = {
  theme: 'Dark',
  chatFont: 'Anthropic Serif',
  transcriptSize: 'Medium',
  transcriptWidth: 'Medium',
  motion: 'System',
  voiceLanguage: 'English',
  voiceStyle: 'Buttery',
  voiceSpeed: 'Normal',
}

function SegmentedControl({ value, options, onChange, label }) {
  return (
    <div className="settings-segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'is-selected' : ''}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.icon ? <option.icon size={20} aria-hidden="true" /> : null}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  )
}

function SettingRow({ title, description, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-copy">
        <div className="settings-row-title">{title}</div>
        {description ? <div className="settings-row-description">{description}</div> : null}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  )
}

export default function SettingsModal({ isOpen, onClose, settings = {}, onSettingsChange, initialSection = 'General' }) {
  const [activeSection, setActiveSection] = useState(initialSection)
  const [search, setSearch] = useState('')
  const values = { ...settingDefaults, ...settings }
  const filteredNavigation = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return navigation
    const matches = navigation.filter((item) => item.label?.toLowerCase().includes(term))
    return matches.length ? [{ section: 'Search results' }, ...matches] : []
  }, [search])

  useEffect(() => {
    if (!isOpen) return undefined
    setActiveSection(initialSection)
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, initialSection, onClose])

  if (!isOpen) return null

  const update = (key, value) => {
    onSettingsChange?.((previous) => ({ ...settingDefaults, ...previous, [key]: value }))
  }
  const themeOptions = [
    { value: 'System', label: 'System', icon: Monitor },
    { value: 'Light', label: 'Light', icon: Sun },
    { value: 'Dark', label: 'Dark', icon: Moon },
  ]

  return (
    <div className="modal-backdrop settings-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className="settings-modal" role="dialog" aria-modal="true" aria-label="Settings">
        <aside className="settings-sidebar">
          <div className="settings-search-wrap">
            <Search size={17} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              aria-label="Search settings"
            />
          </div>
          <nav className="settings-nav" aria-label="Settings sections">
            {filteredNavigation.map((item, index) => {
              if (item.section) return <div className="settings-nav-section" key={`${item.section}-${index}`}>{item.section}</div>
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`settings-nav-item ${activeSection === item.label ? 'is-active' : ''}`}
                  onClick={() => setActiveSection(item.label)}
                >
                  <Icon size={19} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              )
            })}
            {filteredNavigation.every((item) => !item.label) ? <p className="settings-no-results">No matching settings</p> : null}
          </nav>
        </aside>

        <main className="settings-content">
          <button type="button" className="settings-close" onClick={onClose} aria-label="Close settings"><X size={19} /></button>
          {activeSection === 'General' ? (
            <div className="appearance-settings">
              <h2>Appearance</h2>
              <SettingRow title="Theme">
                <SegmentedControl value={values.theme} options={themeOptions} onChange={(value) => update('theme', value)} label="Theme" />
              </SettingRow>
              <SettingRow title="Chat font">
                <label className="settings-select-wrap">
                  <select value={values.chatFont} onChange={(event) => update('chatFont', event.target.value)} aria-label="Chat font">
                    <option>Anthropic Serif</option>
                    <option>Sans Serif</option>
                    <option>Monospace</option>
                  </select>
                  <ChevronDown size={16} aria-hidden="true" />
                </label>
              </SettingRow>
              <SettingRow title="Transcript text size" description="Size of the conversation transcript text.">
                <SegmentedControl
                  value={values.transcriptSize}
                  options={['Small', 'Medium', 'Large'].map((label) => ({ value: label, label }))}
                  onChange={(value) => update('transcriptSize', value)}
                  label="Transcript text size"
                />
              </SettingRow>
              <SettingRow title="Transcript width" description="Maximum width of the transcript and composer columns.">
                <SegmentedControl
                  value={values.transcriptWidth}
                  options={['Narrow', 'Medium', 'Wide'].map((label) => ({ value: label, label }))}
                  onChange={(value) => update('transcriptWidth', value)}
                  label="Transcript width"
                />
              </SettingRow>
              <SettingRow title="Motion" description="Reduce animation in streaming responses and other interface elements.">
                <SegmentedControl
                  value={values.motion}
                  options={['System', 'Reduced'].map((label) => ({ value: label, label }))}
                  onChange={(value) => update('motion', value)}
                  label="Motion"
                />
              </SettingRow>
              <h3 className="settings-subheading">Voice</h3>
              <SettingRow title="Language">
                <label className="settings-select-wrap">
                  <select value={values.voiceLanguage} onChange={(event) => update('voiceLanguage', event.target.value)} aria-label="Voice language">
                    <option>English</option>
                    <option>Bengali</option>
                    <option>Auto-detect</option>
                  </select>
                  <ChevronDown size={16} aria-hidden="true" />
                </label>
              </SettingRow>
              <SettingRow title="Style">
                <label className="settings-select-wrap">
                  <select value={values.voiceStyle} onChange={(event) => update('voiceStyle', event.target.value)} aria-label="Voice style">
                    <option>Buttery</option>
                    <option>Natural</option>
                    <option>Clear</option>
                  </select>
                  <ChevronDown size={16} aria-hidden="true" />
                </label>
              </SettingRow>
              <SettingRow title="Speed">
                <label className="settings-select-wrap">
                  <select value={values.voiceSpeed} onChange={(event) => update('voiceSpeed', event.target.value)} aria-label="Voice speed">
                    <option>Slow</option>
                    <option>Normal</option>
                    <option>Fast</option>
                  </select>
                  <ChevronDown size={16} aria-hidden="true" />
                </label>
              </SettingRow>
            </div>
          ) : (
            <div className="settings-placeholder">
              <div className="settings-placeholder-icon"><Settings size={21} /></div>
              <h2>{activeSection}</h2>
              <p>This section is visible to match the Claude settings navigation. Its account or service-specific controls are not connected in this local build.</p>
            </div>
          )}
        </main>
      </section>
    </div>
  )
}
