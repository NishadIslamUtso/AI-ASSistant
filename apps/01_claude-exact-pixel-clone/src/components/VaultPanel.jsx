import { useState, useEffect } from 'react'
import { X, Search, Package } from 'lucide-react'

// Right-side AI-Brain vault panel. Lists capsules from the vault driver
// (127.0.0.1:8765 /context) and shows driver status. Drag-drop inject,
// blacklist manager, Open Loops and Current Snapshot are P7 (TODO_NEXT).
export default function VaultPanel({ onClose }) {
  const [q, setQ] = useState('')
  const [capsules, setCapsules] = useState([])
  const [online, setOnline] = useState(null)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const res = await fetch(`http://127.0.0.1:8765/context?q=${encodeURIComponent(q || 'a')}`)
        if (!res.ok) throw new Error('bad status')
        const data = await res.json()
        if (!alive) return
        setCapsules(data.capsules || [])
        setOnline(true)
      } catch {
        if (alive) setOnline(false)
      }
    }
    const t = setTimeout(load, 250)
    return () => { alive = false; clearTimeout(t) }
  }, [q])

  return (
    <div className="w-80 shrink-0 h-screen flex flex-col bg-[var(--bg-side)] border-l border-[var(--bd)]">
      <div className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-[var(--bd)]">
        <span className="text-[14px] font-medium text-[var(--tx)]">AI-Brain Vault</span>
        <button onClick={onClose} className="p-1.5 rounded-md text-[var(--tx2)] hover:text-[var(--tx)]" title="Hide"><X size={16} /></button>
      </div>
      <div className="p-3 border-b border-[var(--bd)]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tx3)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search capsules"
            className="w-full h-8 bg-[var(--bg-hover)] rounded-lg pl-8 pr-3 text-[13px] text-[var(--tx)] placeholder-[var(--tx3)] outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {online === false && (
          <div className="text-[12px] text-[var(--tx2)] bg-[var(--bg-el)] border border-[var(--bd2)] rounded-lg p-3">
            Vault driver offline. Start it with <code className="text-[var(--tx)]">node server/vault-api.cjs</code> (start-app.bat does this). Canonical memory stays in the Obsidian vault at vault/AI-Brain/.
          </div>
        )}
        {capsules.map(c => (
          <div key={c.id} className="bg-[var(--bg-el)] border border-[var(--bd2)] rounded-lg p-3">
            <div className="flex items-center gap-2 text-[13px] text-[var(--tx)]"><Package size={13} className="text-[var(--accent)]" /> {c.title}</div>
            <div className="text-[11px] text-[var(--tx2)] mt-1 line-clamp-3">{(c.background || '').slice(0, 220)}</div>
          </div>
        ))}
        {online && capsules.length === 0 && (
          <div className="text-[12px] text-[var(--tx2)] p-2">No matching capsules yet. Captured conversations and capsules land in vault/AI-Brain/03 Memory/Entities/.</div>
        )}
      </div>
      <div className="p-3 border-t border-[var(--bd)] text-[11px] text-[var(--tx3)]">
        Vault: AI-Brain/ (canonical) · API: 127.0.0.1:8765 · local-only
      </div>
    </div>
  )
}
