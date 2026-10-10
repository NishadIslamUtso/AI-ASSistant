import { useEffect, useRef } from 'react'
import {
  Settings,
  Globe,
  HelpCircle,
  Sparkles,
  LayoutGrid,
  Info,
  Key,
  LogOut,
} from 'lucide-react'

/**
 * UserMenu — exact content of screenshot 191608.png
 *   nishadislamutso@gmail.com
 *   Settings / Language / Get help / Upgrade plan /
 *   Get apps and extensions / Learn more / Get API keys / Log out
 *
 * Rendered ABOVE the avatar (bottom-left), ~244px wide, #2a2a2a, rounded.
 */

export default function UserMenu({ anchor = 'bottom-left', onClose, onNavigate, email, plan }) {
  const ref = useRef(null)

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    const onKey = (e) => e.key === 'Escape' && onClose()
    const t = setTimeout(() => document.addEventListener('mousedown', onDown), 0)
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const items = [
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'language', icon: Globe, label: 'Language' },
    { id: 'help', icon: HelpCircle, label: 'Get help' },
    { id: 'upgrade', icon: Sparkles, label: 'Upgrade plan' },
    { id: 'apps', icon: LayoutGrid, label: 'Get apps and extensions' },
    { id: 'learn', icon: Info, label: 'Learn more' },
    { id: 'keys', icon: Key, label: 'Get API keys' },
    { id: 'logout', icon: LogOut, label: 'Log out' },
  ]

  return (
    <div
      ref={ref}
      style={anchor === 'bottom-left' ? { left: 12, bottom: 52 } : { left: 12, bottom: 52 }}
      className="fixed z-[70] w-[244px] bg-[var(--bg-elev)] border border-[var(--border-strong)] rounded-xl py-1 shadow-pop animate-in-fast overflow-hidden"
      role="menu"
    >
      <div className="px-3 py-2 text-[13px] text-[var(--text-2)] truncate border-b border-[var(--border)] mb-1">
        {email}
      </div>
      {items.map((it, i) => {
        const Icon = it.icon
        const showSep = i === 3 || i === 4 || i === 6
        return (
          <div key={it.id}>
            {showSep ? <div className="my-1 h-px bg-[var(--border)]" /> : null}
            <button
              role="menuitem"
              onClick={() => {
                onNavigate?.(it.id)
                onClose()
              }}
              className="w-full flex items-center gap-2.5 px-3 py-[7px] text-[13px] text-[var(--text)] hover:bg-[var(--bg-hover)] text-left"
            >
              <Icon size={15} className="text-[var(--text-2)] shrink-0" />
              <span className="truncate">{it.label}</span>
              {it.id === 'upgrade' && plan ? (
                <span className="ml-auto text-[11px] text-[var(--text-3)]">{plan}</span>
              ) : null}
            </button>
          </div>
        )
      })}
    </div>
  )
}
