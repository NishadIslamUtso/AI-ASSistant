import { ChevronRight, ExternalLink } from 'lucide-react'

// Shared dropdown/menu primitives. Sizes measured from screenshots (CSS px = screenshot px / 1.2).
export const MENU_SURFACE = 'rounded-xl border border-line bg-elev p-1.5 text-[14px] text-fg shadow-[0_12px_40px_rgba(0,0,0,0.55)]'

export function MenuItem({ icon, label, shortcut, onClick, onMouseEnter, submenu, external, danger, disabled, active, className = '' }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-[7px] text-left disabled:cursor-default disabled:opacity-40 ${
        danger ? 'text-[#ef5350] hover:bg-hover' : 'hover:bg-hover'
      } ${active ? 'bg-hover' : ''} ${className}`}
    >
      {icon && <span className={`flex w-4 shrink-0 justify-center ${danger ? '' : 'text-fg2'}`}>{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
      {shortcut && <span className="text-[13px] text-fg3">{shortcut}</span>}
      {submenu && <ChevronRight size={15} className="text-fg3" />}
      {external && <ExternalLink size={14} className="text-fg3" />}
    </button>
  )
}

export function MenuSep() {
  return <div className="my-1.5 h-px bg-line" />
}
