import { useState } from 'react'
import {
  HelpCircle, Code2, ExternalLink, Globe2, Grid2X2, Info, KeyRound,
  LogOut, Settings2, Sparkles, ChevronRight, Check,
} from 'lucide-react'

const MENU_ITEMS = [
  { id: 'settings', label: 'Settings', icon: Settings2, shortcut: 'Ctrl+,' },
  { id: 'language', label: 'Language', icon: Globe2, expandable: true },
  { id: 'help', label: 'Get help', icon: HelpCircle },
  { id: 'upgrade', label: 'Upgrade plan', icon: Sparkles, separatorBefore: true },
  { id: 'apps', label: 'Get apps and extensions', icon: Grid2X2 },
  { id: 'learn', label: 'Learn more', icon: Info, expandable: true },
  { id: 'keys', label: 'Get API keys', icon: KeyRound, separatorBefore: true, external: true },
  { id: 'logout', label: 'Log out', icon: LogOut, separatorBefore: true },
]

export default function UserMenu({ onSettings, onApps, onAction, onClose }) {
  const [languageOpen, setLanguageOpen] = useState(false)
  const [language, setLanguage] = useState(() => localStorage.getItem('claude_exact_language') || 'English')

  function choose(item) {
    if (item.id === 'language') {
      setLanguageOpen(value => !value)
      return
    }
    if (item.id === 'settings') onSettings?.()
    else if (item.id === 'apps') onApps?.()
    else onAction?.(item.id)
    if (item.id !== 'language') onClose?.()
  }

  return (
    <div
      role="menu"
      aria-label="User menu"
      className="absolute bottom-[calc(100%+8px)] left-2 z-50 w-[244px] rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-1.5 text-[13px] shadow-[0_12px_36px_rgba(0,0,0,.55)]"
      onClick={event => event.stopPropagation()}
    >
      <div className="truncate px-2.5 pb-2 pt-1.5 text-xs text-[var(--text-muted)]">nishadislamutso@gmail.com</div>
      {MENU_ITEMS.map(item => {
        const Icon = item.icon
        return (
          <div key={item.id} className={item.separatorBefore ? 'mt-1 border-t border-[var(--border)] pt-1' : ''}>
            <button
              type="button"
              role="menuitem"
              onClick={() => choose(item)}
              className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[var(--text-primary)] hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--text-muted)]"
            >
              <Icon size={15} className="shrink-0 text-[var(--text-muted)]" />
              <span className="flex-1">{item.label}</span>
              {item.id === 'language' && <span className="text-xs text-[var(--text-muted)]">{language}</span>}
              {item.shortcut && <span className="text-xs text-[var(--text-muted)]">{item.shortcut}</span>}
              {item.expandable && item.id !== 'language' && <ChevronRight size={14} className="text-[var(--text-muted)]" />}
              {item.external && <ExternalLink size={13} className="text-[var(--text-muted)]" />}
            </button>
            {item.id === 'language' && languageOpen && (
              <div className="mb-1 ml-8 rounded-md border border-[var(--border)] bg-[var(--surface)] p-1">
                {['English', 'বাংলা'].map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setLanguage(option)
                      localStorage.setItem('claude_exact_language', option)
                      setLanguageOpen(false)
                    }}
                    className="flex h-7 w-full items-center justify-between rounded px-2 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                  >
                    {option}{language === option && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
      <div className="mt-1 border-t border-[var(--border)] px-2.5 pb-1 pt-2 text-[10px] leading-relaxed text-[var(--text-muted)]">
        Local AI ASSistant · no Claude account is connected
      </div>
    </div>
  )
}
