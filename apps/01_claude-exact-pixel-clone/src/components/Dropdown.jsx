import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

/**
 * Dropdown — the small dark control used across Settings and the composer.
 * variant: 'button' (default, #2a2a2a pill) | 'plain' (bare text + chevron, used
 * for "Sonnet 5.5 / Medium / Manual" in the composer).
 */
export default function Dropdown({
  value,
  options = [], // [{value,label,hint,icon}]
  onChange,
  align = 'left',
  variant = 'button',
  className = '',
  menuWidth = 220,
  title,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = options.find((o) => o.value === value)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        title={title}
        onClick={() => setOpen((v) => !v)}
        className={
          variant === 'plain'
            ? 'flex items-center gap-1 text-[12px] text-[var(--ink2)] hover:text-[var(--ink)] rounded px-1 py-0.5 hover:bg-[var(--bg-hover)]'
            : 'w-full flex items-center justify-between gap-2 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--ink)]'
        }
      >
        <span className="truncate flex items-center gap-1.5">
          {current?.icon ? <span className="shrink-0">{current.icon}</span> : null}
          {current?.label ?? value ?? 'Select'}
        </span>
        <ChevronDown size={13} className="text-[var(--ink3)] shrink-0" />
      </button>

      {open ? (
        <div
          style={{ width: menuWidth }}
          className={`absolute z-[90] mt-1 bg-[var(--bg-elev)] border border-[var(--border-strong)] rounded-lg py-1 shadow-pop animate-in-fast max-h-[320px] overflow-y-auto ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-[12px] text-[var(--ink3)]">No options</div>
          ) : null}
          {options.map((o) => (
            <button
              key={String(o.value)}
              onClick={() => {
                onChange?.(o.value)
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-[7px] text-[13px] text-[var(--ink)] hover:bg-[var(--bg-hover)] text-left"
            >
              {o.icon ? <span className="shrink-0 text-[var(--ink2)]">{o.icon}</span> : null}
              <span className="flex-1 truncate">{o.label}</span>
              {o.hint ? <span className="text-[11px] text-[var(--ink3)]">{o.hint}</span> : null}
              {o.value === value ? <Check size={13} className="text-[var(--ink2)] shrink-0" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
