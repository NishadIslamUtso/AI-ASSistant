import { useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useDismiss } from '../lib/hooks.js'
import { listModels } from '../lib/ollama.js'
import { DEFAULT_MODEL, OLLAMA_URL } from '../lib/store.js'

// Lists models that are already installed in Ollama (GET /api/tags). Nothing is downloaded here.
export default function ModelPicker({ model, onChange }) {
  const [open, setOpen] = useState(false)
  const [models, setModels] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | ok | error
  const ref = useRef(null)
  useDismiss(ref, () => setOpen(false), open)

  const load = async () => {
    setStatus('loading')
    try {
      const list = await listModels()
      setModels(list)
      setStatus('ok')
    } catch (e) {
      setStatus('error')
    }
  }

  const toggle = () => {
    if (open) { setOpen(false); return }
    setOpen(true)
    load()
  }

  // Always show the selected model, even if Ollama is offline.
  const shown = Array.from(new Set([model, ...models]))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs c-muted-2 c-hover"
      >
        <span>{model}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div role="listbox" aria-label="Model" className="absolute right-0 bottom-full mb-2 z-[60] w-64 rounded-xl c-menu p-1.5 text-sm">
          <div className="px-2 py-1.5 text-xs c-muted">Installed in Ollama</div>
          {status === 'loading' && <div className="px-2 py-2 c-muted">Loading models...</div>}
          {status === 'error' && (
            <div className="px-2 py-2 text-xs c-muted">
              Ollama is not reachable at {OLLAMA_URL}. Start Ollama, then open this list again.
            </div>
          )}
          {shown.map((name) => (
            <button
              key={name}
              type="button"
              role="option"
              aria-selected={name === model}
              onClick={() => { onChange(name); setOpen(false) }}
              className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left c-hover"
            >
              <span className="truncate">
                {name}
                {name === DEFAULT_MODEL && <span className="ml-2 text-xs c-muted">default</span>}
              </span>
              {name === model && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
