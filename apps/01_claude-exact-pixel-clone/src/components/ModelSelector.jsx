import { useState, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'

// Functional model selector (TODO_NEXT P4): lists Ollama models from
// http://127.0.0.1:11434/api/tags, falls back to qwen2.5:3b when Ollama is
// offline (e.g. this preview sandbox), selection stored in localStorage.
export default function ModelSelector({ model, setModel }) {
  const [open, setOpen] = useState(false)
  const [models, setModels] = useState([])
  const [online, setOnline] = useState(null)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const res = await fetch('http://127.0.0.1:11434/api/tags')
        if (!res.ok) throw new Error('bad status')
        const data = await res.json()
        if (!alive) return
        const names = (data.models || []).map(m => m.name)
        setModels(names.length ? names : ['qwen2.5:3b'])
        setOnline(true)
      } catch {
        if (!alive) return
        setModels(prev => (prev.length ? prev : ['qwen2.5:3b']))
        setOnline(false)
      }
    }
    load()
    const t = setInterval(load, 15000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  const list = models.includes(model) ? models : [model, ...models]

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 text-[13px] hover:opacity-80" title="Choose local model">
        <span className="font-medium text-[var(--tx)]">{model}</span>
        <span className="text-[var(--tx3)]">Medium</span>
        <span className="text-[var(--tx)]">Manual</span>
        <ChevronDown size={13} className="text-[var(--tx3)]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-7 z-50 w-72 rounded-xl bg-[var(--bg-elup)] border border-[var(--bd2)] shadow-2xl py-1.5">
            <div className="px-3 py-1.5 text-[12px] text-[var(--tx2)]">Local models · Ollama {online === false && '(offline — saved model shown)'}</div>
            {list.map(name => (
              <button
                key={name}
                onClick={() => { setModel(name); setOpen(false) }}
                className="w-full flex items-center justify-between px-3 py-2 text-left text-[14px] text-[var(--tx)] hover:bg-[var(--bg-hover)]"
              >
                <span className="truncate">{name}</span>
                {name === model && <Check size={14} className="text-[var(--tx2)]" />}
              </button>
            ))}
            <div className="mt-1 border-t border-[var(--bd2)] px-3 py-2 text-[11px] text-[var(--tx3)]">
              Runs on your machine at 127.0.0.1:11434. No downloads triggered automatically.
            </div>
          </div>
        </>
      )}
    </div>
  )
}
