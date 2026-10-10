import { useState } from 'react'
import { X, Package, Code2, Eye } from 'lucide-react'

// Artifact runner (TODO_NEXT P3, ported concept from 02_electron ArtifactPanel):
// right-hand panel with Preview (sandboxed iframe) and Code tabs.
export default function ArtifactPanel({ artifact, onClose }) {
  const [tab, setTab] = useState('preview')
  return (
    <div className="w-[520px] max-w-[60vw] shrink-0 h-screen flex flex-col bg-[var(--bg-side)] border-l border-[var(--bd)]">
      <div className="h-12 shrink-0 flex items-center gap-2 px-4 border-b border-[var(--bd)]">
        <Package size={16} className="text-[var(--accent)]" />
        <span className="text-[14px] font-medium text-[var(--tx)] truncate">{artifact.title}</span>
        <span className="text-[11px] text-[var(--tx2)] border border-[var(--bd2)] rounded px-1.5 py-0.5">HTML Application</span>
        <div className="flex-1" />
        <div className="flex items-center bg-[var(--bg-hover)] rounded-lg p-0.5">
          <button onClick={() => setTab('preview')} className={`flex items-center gap-1.5 px-3 h-7 rounded-md text-[12px] ${tab === 'preview' ? 'bg-[var(--bg-sel)] text-[var(--tx)]' : 'text-[var(--tx2)]'}`}>
            <Eye size={13} /> Preview
          </button>
          <button onClick={() => setTab('code')} className={`flex items-center gap-1.5 px-3 h-7 rounded-md text-[12px] ${tab === 'code' ? 'bg-[var(--bg-sel)] text-[var(--tx)]' : 'text-[var(--tx2)]'}`}>
            <Code2 size={13} /> Code
          </button>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md text-[var(--tx2)] hover:text-[var(--tx)]" title="Close"><X size={16} /></button>
      </div>
      <div className="flex-1 min-h-0">
        {tab === 'preview' ? (
          <iframe title={artifact.title} sandbox="allow-scripts" srcDoc={artifact.content} className="w-full h-full bg-white border-0" />
        ) : (
          <pre className="w-full h-full overflow-auto p-4 text-[12px] leading-5 text-[var(--tx)] font-mono whitespace-pre-wrap">{artifact.content}</pre>
        )}
      </div>
    </div>
  )
}
