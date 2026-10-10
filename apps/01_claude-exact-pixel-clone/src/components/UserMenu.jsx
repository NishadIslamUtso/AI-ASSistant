import { Settings, Globe, HelpCircle, ArrowUpCircle, LayoutGrid, Info, KeyRound, LogOut, ChevronRight, ExternalLink } from 'lucide-react'
import { USER } from '../lib/store.js'

// Popover above the avatar (screenshot 191608.png). Outside click / Escape closing is handled by the Sidebar footer.
export default function UserMenu({ onSettings, onApps, toast }) {
  const note = (msg) => () => toast(msg)
  const Item = ({ icon: Icon, label, shortcut, onClick, chevron, external }) => (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-left c-hover">
      <Icon size={16} className="c-muted-2 shrink-0" />
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-xs c-muted">{shortcut}</span>}
      {chevron && <ChevronRight size={14} className="c-muted" />}
      {external && <ExternalLink size={14} className="c-muted" />}
    </button>
  )
  const Sep = () => <div className="my-1 border-t c-border" />

  return (
    <div role="menu" className="absolute bottom-full left-3 mb-2 w-[300px] rounded-xl c-menu p-1.5 z-[60]">
      <div className="px-3 py-2 text-sm c-muted truncate">{USER.email}</div>
      <Item icon={Settings} label="Settings" shortcut="Ctrl+," onClick={onSettings} />
      <Item icon={Globe} label="Language" chevron onClick={note('Language: English. Other languages are not in the local build yet.')} />
      <Item icon={HelpCircle} label="Get help" onClick={note('Get help: local build. See README.md in the repo.')} />
      <Sep />
      <Item icon={ArrowUpCircle} label="Upgrade plan" onClick={note('Local build is free. Models run on your computer through Ollama.')} />
      <Item icon={LayoutGrid} label="Get apps and extensions" onClick={onApps} />
      <Item icon={Info} label="Learn more" chevron onClick={note('Learn more: see docs/ and 00_LIVING_DOCS/ in the repo.')} />
      <Sep />
      <Item icon={KeyRound} label="Get API keys" external onClick={note('No API keys needed. Models run locally through Ollama.')} />
      <Sep />
      <Item icon={LogOut} label="Log out" onClick={note('Local build has no account to log out of.')} />
    </div>
  )
}
