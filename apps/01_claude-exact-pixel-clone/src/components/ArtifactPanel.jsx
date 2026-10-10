import { useState } from 'react'
import { Check, Code2, Copy, Download, Eye, ShieldCheck, X } from 'lucide-react'
import { makeSandboxDocument } from '../lib/artifacts.js'

export default function ArtifactPanel({ artifact, onClose }) {
  const [view, setView] = useState('preview')
  const [copied, setCopied] = useState(false)
  if (!artifact) return null

  async function copySource() {
    try {
      await navigator.clipboard.writeText(artifact.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  function downloadSource() {
    const blob = new Blob([artifact.content], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${(artifact.title || 'artifact').replace(/[^a-z0-9_-]+/gi, '-').toLowerCase()}.html`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <aside className="artifact-panel flex h-full w-[min(520px,48vw)] min-w-[340px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--bg-main)]" aria-label="Artifact preview">
      <header className="flex min-h-[58px] items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg-sidebar)] px-4 py-2">
        <div className="flex min-w-0 items-center gap-2.5"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-selected)]"><Code2 size={16}/></div><div className="min-w-0"><h2 className="truncate text-sm font-medium">{artifact.title || 'HTML Application'}</h2><div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">HTML · local artifact</div></div></div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" aria-label="Copy HTML source" onClick={copySource} title={copied ? 'Copied' : 'Copy source'} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]">{copied ? <Check size={15} className="text-emerald-400"/> : <Copy size={15}/>}</button>
          <button type="button" aria-label="Download HTML artifact" onClick={downloadSource} title="Download HTML" className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"><Download size={15}/></button>
          <button type="button" aria-label="Close artifact" onClick={onClose} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"><X size={16}/></button>
        </div>
      </header>
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border)] px-3">
        <div className="flex items-center gap-1 rounded-lg bg-[var(--surface)] p-0.5">
          <button type="button" onClick={() => setView('preview')} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs ${view === 'preview' ? 'bg-[var(--surface-selected)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}><Eye size={13}/>Preview</button>
          <button type="button" onClick={() => setView('source')} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs ${view === 'source' ? 'bg-[var(--surface-selected)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}><Code2 size={13}/>Source</button>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]"><ShieldCheck size={12}/>Sandboxed · offline</span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {view === 'preview' ? <iframe key={artifact.id || artifact.content.slice(0, 32)} title={artifact.title || 'HTML artifact preview'} srcDoc={makeSandboxDocument(artifact.content)} sandbox="allow-scripts" referrerPolicy="no-referrer" className="h-full w-full border-0 bg-white"/> : <pre className="h-full overflow-auto bg-[#171717] p-4 text-xs leading-5 text-[#dedede]"><code>{artifact.content}</code></pre>}
      </div>
      <footer className="border-t border-[var(--border)] px-3 py-2 text-[10px] leading-4 text-[var(--text-muted)]">The preview runs in a sandboxed frame. Network requests and access to this app are blocked.</footer>
    </aside>
  )
}
