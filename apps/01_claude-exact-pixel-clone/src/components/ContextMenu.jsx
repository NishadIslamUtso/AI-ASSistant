import { useEffect, useRef } from 'react'

/**
 * ContextMenu — the dark rounded menu from screenshot 191646.png
 *   Open in new window / Pin chat / Rename / Add to project / Move to group / Delete
 * Items: { icon, label, onSelect, danger, separator, hint, disabled }
 */

export default function ContextMenu({ x, y, items = [], onClose, width = 208 }) {
  const ref = useRef(null)

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    // defer so the click that opened the menu doesn't immediately close it
    const t = setTimeout(() => document.addEventListener('mousedown', onDown), 0)
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // keep the menu inside the viewport
  const left = Math.min(x, window.innerWidth - width - 8)
  const top = Math.min(y, window.innerHeight - items.length * 36 - 16)

  return (
    <div
      ref={ref}
      style={{ left: Math.max(8, left), top: Math.max(8, top), width }}
      className="fixed z-[80] bg-[var(--bg-elev)] border border-[var(--border-strong)] rounded-lg py-1 shadow-pop text-[13px] animate-in-fast"
      role="menu"
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((it, i) =>
        it.separator ? (
          <div key={`sep-${i}`} className="my-1 h-px bg-[var(--border-strong)]" />
        ) : (
          <button
            key={i}
            role="menuitem"
            disabled={it.disabled}
            onClick={() => {
              it.onSelect?.()
              onClose()
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-[7px] text-left rounded-md mx-1 ${
              it.disabled
                ? 'opacity-40 cursor-default'
                : it.danger
                  ? 'hover:bg-[var(--danger)]/15 text-[var(--danger)]'
                  : 'hover:bg-[var(--bg-hover)] text-[var(--text)]'
            }`}
            style={{ width: width - 8 }}
          >
            {it.icon ? <span className="shrink-0 opacity-80">{it.icon}</span> : null}
            <span className="flex-1 truncate">{it.label}</span>
            {it.hint ? <span className="text-[var(--text-3)] text-xs">{it.hint}</span> : null}
          </button>
        ),
      )}
    </div>
  )
}
