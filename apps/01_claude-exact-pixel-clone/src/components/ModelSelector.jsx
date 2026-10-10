import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, HardDrive, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'

function formatSize(bytes) {
  if (!bytes || !Number.isFinite(Number(bytes))) return ''
  const size = Number(bytes)
  if (size >= 1024 ** 3) return `${(size / (1024 ** 3)).toFixed(1)} GB`
  if (size >= 1024 ** 2) return `${(size / (1024 ** 2)).toFixed(0)} MB`
  return ''
}

export default function ModelSelector({ model, models = [], status = 'idle', error = '', onSelect, onRefresh }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const availableModels = models.length ? models : (model ? [{ name: model, configured: true }] : [])

  useEffect(() => {
    if (!open) return undefined
    const closeOutside = event => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    const closeOnEscape = event => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(value => !value)} className="group inline-flex max-w-[230px] items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--text-muted)]">
        <HardDrive size={13} className="shrink-0 text-[var(--text-muted)]" />
        <span className="truncate font-medium text-[var(--text-primary)]">{model || 'Choose model'}</span>
        <span className="hidden text-[10px] text-[var(--text-muted)] sm:inline">Local</span>
        <ChevronDown size={13} className="shrink-0 text-[var(--text-muted)]" />
      </button>
      {open && <div className="absolute bottom-[calc(100%+8px)] right-0 z-40 w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-1.5 shadow-[0_12px_36px_rgba(0,0,0,.55)]">
        <div className="flex items-center justify-between px-2.5 py-2">
          <div><div className="text-xs font-semibold text-[var(--text-primary)]">Local models</div><div className="mt-0.5 text-[10px] text-[var(--text-muted)]">Ollama · {status === 'online' ? 'Connected' : status === 'loading' ? 'Checking…' : 'Not connected'}</div></div>
          <button type="button" aria-label="Refresh Ollama models" disabled={status === 'loading'} onClick={() => onRefresh?.()} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:opacity-50">{status === 'loading' ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}</button>
        </div>
        {status === 'error' && <div className="mx-1 mb-2 flex items-start gap-2 rounded-lg border border-amber-900/60 bg-amber-950/30 p-2.5 text-[11px] leading-4 text-amber-200"><AlertTriangle size={14} className="mt-0.5 shrink-0"/><span>{error || 'Ollama could not be reached. Check that it is running on this computer.'}</span></div>}
        <div role="listbox" aria-label="Available local models" className="max-h-56 overflow-y-auto">
          {availableModels.length ? availableModels.map(item => {
            const name = typeof item === 'string' ? item : item.name
            if (!name) return null
            return <button key={name} type="button" role="option" aria-selected={model === name} onClick={() => { onSelect?.(name); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-[var(--surface-hover)]">
              <span className="min-w-0 flex-1"><span className="block truncate text-xs text-[var(--text-primary)]">{name}</span><span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">{item?.details?.family ? `${item.details.family}${item.details.parameter_size ? ` · ${item.details.parameter_size}` : ''}` : item?.configured ? 'Configured default · waiting for Ollama' : 'Ollama model'}</span></span>
              {item?.size && <span className="text-[10px] text-[var(--text-muted)]">{formatSize(item.size)}</span>}
              {model === name && <Check size={14} className="shrink-0 text-emerald-400"/>}
            </button>
          }) : <p className="px-2.5 py-3 text-xs text-[var(--text-muted)]">No model name is configured. Start Ollama, then refresh.</p>}
        </div>
        <div className="border-t border-[var(--border)] px-2.5 pb-1 pt-2 text-[10px] leading-4 text-[var(--text-muted)]">Only installed Ollama models are listed. This app will not download or switch to a cloud model.</div>
      </div>}
    </div>
  )
}
