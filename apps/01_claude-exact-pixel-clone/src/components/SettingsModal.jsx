import { useState } from 'react'
import { Settings, CircleUserRound, Shield, CreditCard, Briefcase, History, Bell, MoonStar, Code2, Monitor, Plug, Wrench, ScrollText, Blocks, Search, X, Sun, Moon } from 'lucide-react'
import Dialog from './Dialog.jsx'
import BlacklistManager from './BlacklistManager.jsx'
const navigation = [
  ['Settings', [['General', Settings], ['Account', CircleUserRound], ['Privacy', Shield], ['Billing', CreditCard], ['Capabilities', Briefcase], ['Memory', History], ['Reflect', Bell], ['Time and focus', MoonStar], ['Claude Code', Code2]]],
  ['This computer', [['System', Monitor], ['Extensions', Plug], ['Developer', Wrench]]],
  ['Customize', [['Skills', ScrollText], ['Connectors', Blocks]]],
]
function Segments({ label, options, value, onChange, icons }) {
  return <div className="segmented" role="group" aria-label={label}>{options.map((option, index) => <button key={option} aria-label={option} aria-pressed={value === option} className={value === option ? 'selected' : ''} onClick={() => onChange(option)}>{icons ? icons[index] : option}</button>)}</div>
}
function Row({ label, description, children }) {
  return <div className={`settings-row ${description ? 'with-description' : ''}`}><div><div>{label}</div>{description && <p>{description}</p>}</div>{children}</div>
}
function Select({ label, value, options, onChange }) {
  return <select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option}>{option}</option>)}</select>
}
export default function SettingsModal({ settings, setSettings, onClose, onApps, onVault, models }) {
  const [active, setActive] = useState('General')
  const [search, setSearch] = useState('')
  const update = (key, value) => setSettings(previous => ({ ...previous, [key]: value }))
  return <Dialog onClose={onClose} className="settings-dialog" labelledBy="settings-title">
    <aside className="settings-nav">
      <label className="settings-search"><Search size={17} /><input aria-label="Search settings" placeholder="Search" value={search} onChange={event => setSearch(event.target.value)} /></label>
      <nav aria-label="Settings sections">{navigation.map(([heading, items]) => <div key={heading}><p>{heading}</p>{items.filter(([name]) => name.toLowerCase().includes(search.toLowerCase())).map(([name, Icon]) => <button key={name} onClick={() => setActive(name)} className={active === name ? 'selected' : ''} aria-current={active === name ? 'page' : undefined}><Icon size={18} />{name}</button>)}</div>)}</nav>
    </aside>
    <div className="settings-main">
      <button className="icon-button settings-close" aria-label="Close settings" onClick={onClose}><X size={19} /></button>
      {active === 'General' ? <>
        <h2 id="settings-title">Appearance</h2>
        <Row label="Theme"><Segments label="Theme" options={['system', 'light', 'dark']} icons={[<Monitor key="system" size={19} />, <Sun key="light" size={19} />, <Moon key="dark" size={19} />]} value={settings.theme} onChange={value => update('theme', value)} /></Row>
        <Row label="Chat font"><Select label="Chat font" options={['Anthropic Serif', 'System', 'Monospace']} value={settings.chatFont} onChange={value => update('chatFont', value)} /></Row>
        <Row label="Transcript text size" description="Size of the conversation transcript text."><Segments label="Transcript text size" options={['Small', 'Medium', 'Large']} value={settings.transcriptSize} onChange={value => update('transcriptSize', value)} /></Row>
        <Row label="Transcript width" description="Maximum width of the transcript and composer columns."><Segments label="Transcript width" options={['Narrow', 'Medium', 'Wide']} value={settings.transcriptWidth} onChange={value => update('transcriptWidth', value)} /></Row>
        <Row label="Motion" description="Reduce animation in streaming responses and other interface elements."><Segments label="Motion" options={['System', 'Reduced']} value={settings.motion} onChange={value => update('motion', value)} /></Row>
        <h2 className="voice-heading">Voice</h2>
        <Row label="Language"><Select label="Voice language" options={['English', 'Bengali']} value={settings.voiceLanguage} onChange={value => update('voiceLanguage', value)} /></Row>
        <Row label="Style"><Select label="Voice style" options={['Buttery', 'Calm']} value={settings.voiceStyle} onChange={value => update('voiceStyle', value)} /></Row>
        <Row label="Speed"><Select label="Voice speed" options={['Slow', 'Normal', 'Fast']} value={settings.voiceSpeed} onChange={value => update('voiceSpeed', value)} /></Row>
        <p className="settings-footnote">Voice preferences are saved locally. A speech engine is not connected in this build.</p>
      </> : <>
        <h2 id="settings-title">{active}</h2>
        {active === 'Account' && <div className="settings-copy"><h3>Utso</h3><p>nishadislamutso@gmail.com</p><p>This is the profile from your screenshot, not an authenticated Claude account. No external sign-in is used.</p></div>}
        {active === 'Privacy' && <><p className="settings-copy">Local-first. Excluded sources are denied at the vault API. Passwords, cookies, tokens, payment fields and unsent drafts must never be captured. Browser-side scope sync still needs end-to-end verification.</p><BlacklistManager /></>}
        {active === 'Billing' && <p className="settings-copy">Local mode is free. There is no Claude subscription, billing connection or upgrade in this app.</p>}
        {active === 'Capabilities' && <div className="settings-copy"><p>Selected model: <strong>{models.model}</strong></p><p>Text chat and text/code attachments run locally.</p><p>Vision: {models.capabilities.vision ? 'verified by Ollama /api/show' : 'unavailable or not verified'}</p><p>Thinking: {models.capabilities.thinking ? 'verified by Ollama /api/show' : 'unavailable or not verified'}</p><p>Model capabilities are not inferred from names. This UI does not make qwen2.5:3b as capable as Claude.</p></div>}
        {active === 'Memory' && <div className="settings-copy"><p>Canonical memory: the Markdown files in vault/AI-Brain. The app does not create a second authoritative database.</p><button className="secondary-button" onClick={() => { onClose(); onVault() }}>Open AI-Brain vault</button></div>}
        {active === 'System' && <div className="settings-copy"><p>AI ASSistant 0.2.0 · Vite web build</p><p>Ollama: 127.0.0.1:11434</p><p>Vault driver: 127.0.0.1:8765</p><p>Browser requests are proxied through this app. A native Windows title bar and menu will require the pending Electron wrapper.</p></div>}
        {active === 'Extensions' && <div className="settings-copy"><p>The local MV3 collector lives in the repository’s extension folder. Chrome installation and capture still require Windows/Chrome testing.</p><button className="secondary-button" onClick={onApps}>Apps and extensions</button></div>}
        {active === 'Developer' && <div className="settings-copy"><p>npm test · npm run build · npm run test:e2e</p><p>No native build tools or model downloads are needed. If Ollama is offline, run your existing Ollama installation and refresh the model list.</p></div>}
        {!['Account', 'Privacy', 'Billing', 'Capabilities', 'Memory', 'System', 'Extensions', 'Developer'].includes(active) && <p className="settings-copy">{active} is a screenshot-matched navigation entry. Its runtime integration is not implemented yet; no background action is enabled.</p>}
      </>}
    </div>
  </Dialog>
}
