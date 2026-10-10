import { useEffect } from 'react'

// Calls onDismiss when the user clicks outside ref or presses Escape.
export function useDismiss(ref, onDismiss, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onDismiss() }
    const onKey = (e) => { if (e.key === 'Escape') onDismiss() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, onDismiss, enabled])
}
