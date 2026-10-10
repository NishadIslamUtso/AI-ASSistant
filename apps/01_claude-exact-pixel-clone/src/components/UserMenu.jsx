import {
  Settings, Globe, HelpCircle, ArrowUpCircle, LayoutGrid, Info, KeyRound, LogOut,
  ChevronRight, ExternalLink,
} from 'lucide-react'

// User menu from screenshot 191608.png — opens above the bottom-left avatar.
export default function UserMenu({ onClose, onOpenSettings, onOpenApps }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-[52px] left-2 z-50 w-[290px] rounded-xl bg-[var(--bg-elup)] border border-[var(--bd2)] shadow-2xl py-1.5">
        <div className="px-3.5 py-2 text-[13px] text-[var(--tx2)] truncate">nishadislamutso@gmail.com</div>
        <Item icon={<Settings size={16} />} label="Settings" kbd="Ctrl+," onClick={onOpenSettings} />
        <Item icon={<Globe size={16} />} label="Language" right={<span className="text-[13px] text-[var(--tx2)]">English</span>} onClick={onClose} />
        <Item icon={<HelpCircle size={16} />} label="Get help" onClick={onClose} />
        <div className="my-1 border-t border-[var(--bd2)]" />
        <Item icon={<ArrowUpCircle size={16} />} label="Upgrade plan" onClick={onClose} />
        <Item icon={<LayoutGrid size={16} />} label="Get apps and extensions" onClick={() => { onOpenApps && onOpenApps() }} />
        <Item icon={<Info size={16} />} label="Learn more" right={<ChevronRight size={14} className="text-[var(--tx2)]" />} onClick={onClose} />
        <div className="my-1 border-t border-[var(--bd2)]" />
        <Item icon={<KeyRound size={16} />} label="Get API keys" right={<ExternalLink size={13} className="text-[var(--tx2)]" />} onClick={onClose} />
        <div className="my-1 border-t border-[var(--bd2)]" />
        <Item icon={<LogOut size={16} />} label="Log out" onClick={onClose} />
      </div>
    </>
  )
}

function Item({ icon, label, kbd, right, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3.5 py-2 text-left text-[14px] text-[var(--tx)] hover:bg-[var(--bg-hover)]">
      <span className="text-[var(--tx2)]">{icon}</span>
      <span className="flex-1">{label}</span>
      {kbd && <span className="text-[12px] text-[var(--tx3)]">{kbd}</span>}
      {right}
    </button>
  )
}
