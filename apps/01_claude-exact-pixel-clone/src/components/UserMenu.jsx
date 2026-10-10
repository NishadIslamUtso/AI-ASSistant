import { useEffect, useRef } from 'react'
import { Settings, Globe, HelpCircle, ArrowUpCircle, LayoutGrid, Info, KeyRound, LogOut, ExternalLink, ChevronRight } from 'lucide-react'

const Item = ({ icon: Icon, label, shortcut, trailing, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full flex items-center gap-3 px-3 py-[7px] text-[14px] text-[#e8e6e1] rounded-md hover:bg-[#333] disabled:opacity-60 disabled:hover:bg-transparent"
  >
    <Icon size={16} className="text-[#bbb] shrink-0" />
    <span className="flex-1 text-left">{label}</span>
    {shortcut && <span className="text-[12px] text-[#888]">{shortcut}</span>}
    {trailing === 'chevron' && <ChevronRight size={14} className="text-[#888]" />}
    {trailing === 'external' && <ExternalLink size={14} className="text-[#888]" />}
  </button>
)

const Sep = () => <div className="my-1.5 border-t border-[#333]" />

// Opens above the NU avatar in the sidebar footer (screenshot 191608).
export default function UserMenu({ email, onClose, onOpenSettings, onOpenApps }) {
  const ref = useRef(null)
  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [onClose])

  const run = (fn) => () => { onClose(); fn && fn() }
  // Items that need a real account/backend are shown as in the screenshot but do nothing locally.
  const localOnly = undefined

  return (
    <div ref={ref} className="absolute bottom-full left-2 mb-2 w-[300px] bg-[#262626] border border-[#333] rounded-xl p-2 shadow-2xl z-40">
      <div className="px-3 py-2 text-[13px] text-[#999] truncate">{email}</div>
      <Item icon={Settings} label="Settings" shortcut="Ctrl+," onClick={run(onOpenSettings)} />
      <Item icon={Globe} label="Language" onClick={run(() => onOpenSettings && onOpenSettings('voice'))} />
      <Item icon={HelpCircle} label="Get help" onClick={run(localOnly)} disabled />
      <Sep />
      <Item icon={ArrowUpCircle} label="Upgrade plan" onClick={run(localOnly)} disabled />
      <Item icon={LayoutGrid} label="Get apps and extensions" onClick={run(onOpenApps)} />
      <Item icon={Info} label="Learn more" trailing="chevron" onClick={run(localOnly)} disabled />
      <Sep />
      <Item icon={KeyRound} label="Get API keys" trailing="external" onClick={run(localOnly)} disabled />
      <Sep />
      <Item icon={LogOut} label="Log out" onClick={run(localOnly)} disabled />
    </div>
  )
}
