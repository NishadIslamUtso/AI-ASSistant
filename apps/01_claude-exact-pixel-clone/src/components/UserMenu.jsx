import { ArrowUpCircle, Globe, HelpCircle, Info, Key, LayoutGrid, LogOut, Settings } from 'lucide-react'
import { USER_EMAIL } from '../lib/constants.js'

// Items marked soon are shown exactly as in the screenshot but are not built yet.
export default function UserMenu({ onSettings, onApps, onClose }) {
  const items = [
    { label: 'Settings', icon: Settings, kbd: 'Ctrl+,', run: onSettings },
    { label: 'Language', icon: Globe, soon: true },
    { label: 'Get help', icon: HelpCircle, soon: true },
    'sep',
    { label: 'Upgrade plan', icon: ArrowUpCircle, soon: true },
    { label: 'Get apps and extensions', icon: LayoutGrid, run: onApps },
    { label: 'Learn more', icon: Info, chevron: true, soon: true },
    'sep',
    { label: 'Get API keys', icon: Key, soon: true },
    'sep',
    { label: 'Log out', icon: LogOut, soon: true },
  ]
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full left-[12px] z-50 mb-1 w-[371px] rounded-xl border border-ui-line bg-ui-menu p-2 text-[15px] shadow-2xl">
        <div className="truncate px-3 pb-2 pt-1.5 text-[14px] text-ui-muted">{USER_EMAIL}</div>
        {items.map((it, i) =>
          it === 'sep' ? (
            <div key={`sep-${i}`} className="my-1.5 h-px bg-ui-line" />
          ) : (
            <button
              key={it.label}
              title={it.soon ? 'Not built yet' : undefined}
              onClick={() => {
                onClose()
                it.run?.()
              }}
              className={`flex h-[33px] w-full items-center gap-3 rounded-md px-3 text-left text-ui-body hover:bg-ui-hover ${it.soon ? 'opacity-60' : ''}`}
            >
              <it.icon size={16} className="shrink-0 text-ui-muted" />
              <span className="flex-1">{it.label}</span>
              {it.kbd && <span className="text-xs text-ui-muted">{it.kbd}</span>}
              {it.chevron && <span className="text-ui-muted">›</span>}
            </button>
          ),
        )}
      </div>
    </>
  )
}
