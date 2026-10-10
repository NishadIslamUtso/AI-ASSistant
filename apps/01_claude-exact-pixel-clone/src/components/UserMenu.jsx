import { useEffect, useRef } from 'react'
import {
  Settings,
  Globe2,
  HelpCircle,
  Sparkles,
  LayoutGrid,
  Info,
  KeyRound,
  LogOut,
  ChevronRight,
} from 'lucide-react'

const rows = [
  { label: 'Settings', icon: Settings, action: 'settings' },
  { label: 'Language', icon: Globe2, action: 'language' },
  { label: 'Get help', icon: HelpCircle, action: 'help' },
  { separator: true },
  { label: 'Upgrade plan', icon: Sparkles, action: 'upgrade' },
  { label: 'Get apps and extensions', icon: LayoutGrid, action: 'apps' },
  { label: 'Learn more', icon: Info, action: 'learn', trailing: true },
  { separator: true },
  { label: 'Get API keys', icon: KeyRound, action: 'keys' },
  { separator: true },
  { label: 'Log out', icon: LogOut, action: 'logout' },
]

export default function UserMenu({ onClose, onSettings, onApps, onNotice }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) onClose?.()
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const handleAction = (action) => {
    onClose?.()
    if (action === 'settings') return onSettings?.()
    if (action === 'apps') return onApps?.()

    const notices = {
      language: 'Language preferences are available in Settings. The local interface is currently in English.',
      help: 'AI ASSistant runs locally. Check the repository README and living handover for setup help.',
      upgrade: 'This local build has no paid plan or billing connection.',
      learn: 'AI ASSistant uses your selected local Ollama model and local vault connection.',
      keys: 'The current build uses Ollama locally and does not need a cloud API key.',
      logout: 'This local-only build has no account session to log out of.',
    }
    onNotice?.(notices[action] || 'This action is not connected in the local build yet.')
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="User menu"
      className="user-menu"
    >
      <div className="user-menu-email">nishadislamutso@gmail.com</div>
      {rows.map((row, index) => {
        if (row.separator) return <div key={`separator-${index}`} className="user-menu-separator" />
        const Icon = row.icon
        return (
          <button
            key={row.action}
            type="button"
            role="menuitem"
            className="user-menu-item"
            onClick={() => handleAction(row.action)}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{row.label}</span>
            {row.trailing && <ChevronRight size={14} className="user-menu-trailing" aria-hidden="true" />}
          </button>
        )
      })}
    </div>
  )
}
