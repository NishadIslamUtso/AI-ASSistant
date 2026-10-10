import { Code2, X } from 'lucide-react'

export default function ArtifactLibrary({ artifacts = [], onOpen, onClose }) {
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/60 p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose?.() }}>
      <section role="dialog" aria-modal="true" aria-label="Artifacts" className="max-h-[80vh] w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-main)] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div className="flex items-center gap-2"><Code2 size={17}/><h2 className="text-sm font-semibold">Artifacts</h2><span className="rounded-full bg-[var(--surface-hover)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">{artifacts.length}</span></div><button aria-label="Close artifacts" type="button" onClick={onClose} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"><X size={17}/></button></header>
        <div className="max-h-[calc(80vh-60px)] overflow-y-auto p-3">
          {artifacts.length ? <div className="space-y-1">{artifacts.map(({ artifact, chatTitle }) => <button key={artifact.id} type="button" onClick={() => { onOpen?.(artifact); onClose?.() }} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-[var(--surface-hover)]"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--surface-selected)]"><Code2 size={16}/></div><div className="min-w-0 flex-1"><div className="truncate text-sm text-[var(--text-primary)]">{artifact.title}</div><div className="mt-1 truncate text-xs text-[var(--text-muted)]">{chatTitle || 'Local conversation'} · HTML Application</div></div><span className="text-xs text-[var(--text-muted)]">Open preview →</span></button>)}</div> : <div className="px-6 py-12 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[var(--surface)] text-[var(--text-muted)]"><Code2 size={21}/></div><h3 className="mt-4 text-sm font-medium">No artifacts yet</h3><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Ask for a runnable webpage, tool, or game to create a sandboxed HTML preview. The assistant will not generate artifacts unless you ask.</p></div>}
        </div>
      </section>
    </div>
  )
}
