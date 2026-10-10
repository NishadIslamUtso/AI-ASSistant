import { useEffect } from 'react'
import { X } from 'lucide-react'

// Shared overlay + panel. Closes on Escape and on backdrop click.
export default function Modal({ title, onClose, children, className = '' }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`relative bg-[#1a1a1a] text-[#e8e6e1] rounded-xl border border-[#2f2f2f] shadow-2xl overflow-hidden ${className}`}
      >
        {children}
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 p-1.5 rounded-md text-[#aaa] hover:bg-[#2a2a2a] hover:text-white">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
