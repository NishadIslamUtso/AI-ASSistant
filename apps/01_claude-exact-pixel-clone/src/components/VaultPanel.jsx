import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { vaultContext, vaultStatus } from '../lib/api.js'

// AI-Brain panel (View > Toggle AI-Brain panel). Read-only for now:
// status of the vault driver (127.0.0.1:8765) and a memory search. Drag-drop capsules = roadmap P5/P7.
export default function VaultPanel({ onClose }) {
  const [status, setStatus] = useState(null)
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => { vaultStatus().then(setStatus) }, [])

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); setErr(null); return undefined }
    const t = setTimeout(async () => {
      try {
        const data = await vaultContext(q.trim())
        setResults(data.capsules || [])
        setErr(null)
      } catch (e) {
        setErr(e.message)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-soft bg-side">
      <div className="flex h-12 shrink-0 items-center justify-between px-4">
        <span className="text-[15px] font-medium text-fg">AI-Brain</span>
        <button type="button" onClick={onClose} aria-label="Close AI-Brain panel" className="flex h-7 w-7 items-center justify-center rounded-md text-fg2 hover:bg-hover"><X size={16} /></button>
      </div>
      <div className="space-y-3 overflow-y-auto px-4 pb-4 text-[13.5px] text-fg2">
        <div className="rounded-xl border border-soft bg-main p-3 leading-6">
          {status === null && 'Checking vault driver…'}
          {status && status.ok && <>Connected to <span className="text-fg">127.0.0.1:8765</span><div className="truncate text-fg3" title={status.vault}>{status.vault}</div></>}
          {status && !status.ok && <>Vault driver is not running. Start it with <span className="text-fg">start-app.bat</span>.</>}
        </div>
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search memory" aria-label="Search AI-Brain memory" className="h-9 w-full rounded-lg border border-soft bg-input pl-8 pr-3 text-[14px] text-fg placeholder-fg3 outline-none" />
        </div>
        {err && <div className="text-[#ef5350]">Search failed: {err}</div>}
        {results.map((c) => (
          <div key={c.id} className="rounded-xl border border-soft bg-main p-3">
            <div className="truncate text-[14px] text-fg">{c.title}</div>
            <div className="mt-1 line-clamp-3 text-[12.5px] leading-5 text-fg3">{(c.background || '').replace(/---[\s\S]*?---/, '').trim()}</div>
          </div>
        ))}
        {q.trim().length >= 2 && !err && results.length === 0 && <div className="text-fg3">No matching memory yet.</div>}
      </div>
    </aside>
  )
}
