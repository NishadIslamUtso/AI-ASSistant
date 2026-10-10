import { useEffect, useRef } from 'react'
import { HelpCircle, ExternalLink, Info, KeyRound, Languages, LayoutGrid, LogOut, Settings, Star } from 'lucide-react'
import { MenuItem, MenuSep, MENU_SURFACE } from './menu.jsx'
import { USER } from '../lib/config.js'

// Opens above the NU avatar (screenshot 191608). Width 310 CSS px = 371 px in the screenshot.
export default function UserMenu({ onClose, onSettings, onApps, toast }) {
  const ref = useRef(null)

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const soon = (msg) => () => { onClose(); toast(msg) }

  return (
    <div ref={ref} role="menu" className={`absolute bottom-full left-0 z-50 mb-2 w-[310px] ${MENU_SURFACE}`}>
      <div className="truncate px-2.5 pb-2 pt-1.5 text-[13px] text-fg3">{USER.email}</div>
      <MenuItem icon={<Settings size={16} />} label="Settings" shortcut="Ctrl+," onClick={onSettings} />
      <MenuItem icon={<Languages size={16} />} label="Language" onClick={soon('Language: English only for now')} />
      <MenuItem icon={<HelpCircle size={16} />} label="Get help" onClick={soon('Help: this is the local AI ASSistant build. See README.md in the repo.')} />
      <MenuSep />
      <MenuItem icon={<Star size={16} />} label="Upgrade plan" onClick={soon('AI ASSistant is free and local-only. No upgrade needed.')} />
      <MenuItem icon={<LayoutGrid size={16} />} label="Get apps and extensions" onClick={() => { onClose(); onApps() }} />
      <MenuItem icon={<Info size={16} />} label="Learn more" submenu onClick={soon('Learn more: see 00_LIVING_DOCS/ in the repo')} />
      <MenuSep />
      <MenuItem icon={<KeyRound size={16} />} label="Get API keys" external onClick={soon('No API keys needed: models run locally through Ollama.')} />
      <MenuSep />
      <MenuItem icon={<LogOut size={16} />} label="Log out" onClick={soon('Local-only app: there is no account to log out of.')} />
    </div>
  )
}
