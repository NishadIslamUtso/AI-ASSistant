import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Eye, Code2, Copy, Download, Save, Trash2, ChevronDown, RotateCcw } from 'lucide-react'
import { toPreviewDoc } from '../lib/artifacts.js'
import { vault } from '../lib/vault.js'

/**
 * ArtifactPanel — Claude's right-hand artifact workspace.
 *
 * Only shows up when there IS an artifact, and artifacts are only produced when
 * the user explicitly asks for one (see lib/artifacts.explicitlyAsked) or opens
 * a code block with "Open in artifacts". That is what stops the old
 * "every reply is a Tic Tac Toe game" behaviour.
 *
 * HTML/SVG run in a sandboxed iframe. React/JSX is shown as code only — there is
 * no in-browser build step, and pretending otherwise would be a lie.
 */
export default function ArtifactPanel({
  artifacts = [],
  activeId,
  onSelect,
  onClose,
  onUpdate,
  onDelete,
}) {
  const [tab, setTab] = useState('preview') // 'preview' | 'code'
  const [draft, setDraft] = useState('')
  const [dirty, setDirty] = useState(false)
  const [nonce, setNonce] = useState(0)
  const [saved, setSaved] = useState(false)
  const frameRef = useRef(null)

  const active = artifacts.find((a) => a.id === activeId) || artifacts[artifacts.length - 1]

  useEffect(() => {
    setDraft(active?.content || '')
    setDirty(false)
    setNonce((n) => n + 1)
    setSaved(false)
  }, [active?.id])

  const doc = useMemo(() => (active ? toPreviewDoc(active) : ''), [active])

  if (!active) {
    return (
      <div className="w-[380px] shrink-0 bg-[var(--bg-side)] border-l border-[var(--line)] h-full flex flex-col items-center justify-center text-[var(--ink3)] text-[13px]">
        No artifacts in this chat yet.
      </div>
    )
  }

  const isReact = active.type === 'react'
  const effectiveTab = isReact ? 'code' : tab

  async function copy() {
    try {
      await navigator.clipboard.writeText(active.content)
    } catch (e) {
      /* ignore */
    }
  }

  function download() {
    const ext = active.type === 'svg' ? 'svg' : active.type === 'react' ? 'jsx' : 'html'
    const blob = new Blob([active.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(active.title || 'artifact').replace(/[^\w\- ]+/g, '').trim() || 'artifact'}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function saveToVault() {
    const res = await vault.saveArtifact({
      id: active.id,
      title: active.title,
      type: active.type,
      lang: active.lang,
      content: active.content,
    })
    setSaved(Boolean(res?.ok))
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="w-[46%] min-w-[380px] max-w-[720px] shrink-0 bg-[var(--bg-side)] border-l border-[var(--line)] h-full flex flex-col">
      {/* header */}
      <div className="h-11 shrink-0 flex items-center gap-2 px-3 border-b border-[var(--line)]">
        {artifacts.length > 1 ? (
          <div className="relative group">
            <button className="flex items-center gap-1 text-[13px] text-[var(--ink)] hover:bg-[var(--bg-hover)] px-2 py-1 rounded-md max-w-[220px]">
              <span className="truncate">{active.title}</span>
              <ChevronDown size={13} className="text-[var(--ink3)] shrink-0" />
            </button>
            <div className="hidden group-hover:block absolute left-0 top-8 z-40 w-[280px] bg-[var(--bg-elev)] border border-[var(--border-strong)] rounded-lg shadow-pop py-1">
              {artifacts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onSelect?.(a.id)}
                  className={`w-full text-left px-3 py-2 text-[13px] hover:bg-[var(--bg-hover)] ${
                    a.id === active.id ? 'text-[var(--ink)]' : 'text-[var(--ink2)]'
                  }`}
                >
                  <span className="truncate block">{a.title}</span>
                  <span className="text-[11px] text-[var(--ink3)]">
                    v{a.version} · {a.type.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-[13px] text-[var(--ink)] truncate px-2">{active.title}</span>
        )}

        <span className="text-[11px] text-[var(--ink3)] shrink-0">v{active.version}</span>

        <div className="ml-auto flex items-center gap-1">
          <IconBtn title="Copy" onClick={copy}>
            <Copy size={14} />
          </IconBtn>
          <IconBtn title="Download" onClick={download}>
            <Download size={14} />
          </IconBtn>
          <IconBtn title="Save to vault (02 Sources/Attachments)" onClick={saveToVault}>
            <Save size={14} className={saved ? 'text-green-500' : ''} />
          </IconBtn>
          <IconBtn title="Delete artifact" onClick={() => onDelete?.(active.id)}>
            <Trash2 size={14} />
          </IconBtn>
          <IconBtn title="Close" onClick={onClose}>
            <X size={14} />
          </IconBtn>
        </div>
      </div>

      {/* tabs */}
      <div className="h-9 shrink-0 flex items-center gap-1 px-3 border-b border-[var(--line)]">
        <TabBtn active={effectiveTab === 'preview'} disabled={isReact} onClick={() => setTab('preview')}>
          <Eye size={13} /> Preview
        </TabBtn>
        <TabBtn active={effectiveTab === 'code'} onClick={() => setTab('code')}>
          <Code2 size={13} /> Code
        </TabBtn>
        {isReact ? (
          <span className="ml-2 text-[11px] text-[var(--ink3)]">
            React needs a build step — code only.
          </span>
        ) : null}
        {dirty ? (
          <button
            onClick={() => {
              onUpdate?.(active.id, draft)
              setDirty(false)
              setNonce((n) => n + 1)
            }}
            className="ml-auto flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-md bg-[var(--accent)] text-white"
          >
            <RotateCcw size={12} /> Run update
          </button>
        ) : null}
      </div>

      {/* body */}
      <div className="flex-1 min-h-0">
        {effectiveTab === 'preview' ? (
          <iframe
            key={nonce}
            ref={frameRef}
            title={active.title}
            sandbox="allow-scripts allow-modals allow-forms allow-popups"
            srcDoc={doc}
            className="artifact-preview w-full h-full border-0"
          />
        ) : (
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setDirty(e.target.value !== active.content)
            }}
            spellCheck={false}
            className="w-full h-full bg-[var(--bg-main)] text-[var(--ink)] font-mono text-[12.5px] leading-5 p-4 outline-none resize-none"
          />
        )}
      </div>

      {saved ? (
        <div className="px-3 py-1.5 text-[11px] text-[var(--ink3)] border-t border-[var(--line)]">
          Saved to vault · 02 Sources/Attachments
        </div>
      ) : null}
    </div>
  )
}

function TabBtn({ children, active, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] ${
        disabled
          ? 'text-[var(--ink3)] opacity-50 cursor-default'
          : active
            ? 'bg-[var(--bg-hover)] text-[var(--ink)]'
            : 'text-[var(--ink2)] hover:bg-[var(--bg-hover)] hover:text-[var(--ink)]'
      }`}
    >
      {children}
    </button>
  )
}

function IconBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded-md hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--ink2)]"
    >
      {children}
    </button>
  )
}
