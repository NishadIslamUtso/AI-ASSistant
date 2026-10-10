import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  FileCode2,
  RefreshCw,
  X,
} from 'lucide-react'
import { buildSandboxedPreviewDocument } from '../lib/artifacts.js'

function formatCreatedAt(value) {
  if (!value) return 'Saved locally'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Saved locally'
  return `Created ${date.toLocaleDateString()}`
}

function downloadHtml(artifact) {
  const blob = new Blob([artifact.content], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const safeName = artifact.title.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60) || 'html-application'
  link.href = url
  link.download = `${safeName}.html`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ArtifactPanel({
  isOpen,
  artifacts = [],
  selectedArtifactId = null,
  onClose,
  onSelectArtifact,
  onUpdateArtifact,
}) {
  const artifact = artifacts.find(item => item.id === selectedArtifactId) || null
  const [view, setView] = useState('preview')
  const [draftSource, setDraftSource] = useState('')
  const [copied, setCopied] = useState(false)
  const [previewRevision, setPreviewRevision] = useState(0)

  useEffect(() => {
    setView('preview')
    setDraftSource(artifact?.content || '')
    setCopied(false)
  }, [artifact?.id, artifact?.content])

  const previewDocument = useMemo(
    () => artifact ? buildSandboxedPreviewDocument(artifact.content, artifact.title) : '',
    [artifact?.content, artifact?.title],
  )

  if (!isOpen) return null

  async function copySource() {
    if (!artifact) return
    try {
      await navigator.clipboard.writeText(artifact.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  function runEditedSource() {
    if (!artifact || !draftSource.trim()) return
    onUpdateArtifact?.({ ...artifact, content: draftSource, updatedAt: new Date().toISOString() })
    setView('preview')
    setPreviewRevision(value => value + 1)
  }

  const panelTitle = artifact?.title || 'Artifacts'

  return (
    <section
      aria-label="Artifacts"
      className="absolute inset-y-0 right-0 z-40 flex min-w-0 flex-col border-l border-[#333] bg-[#1a1a1a] text-[#e0e0e0] shadow-2xl"
      style={{ width: 'min(860px, calc(100% - 260px))' }}
    >
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#2a2a2a] bg-[#202020] px-4">
        <div className="flex min-w-0 items-center gap-3">
          {artifact && (
            <button
              type="button"
              onClick={() => onSelectArtifact?.(null)}
              className="rounded-md p-1.5 text-[#999] transition hover:bg-[#333] hover:text-white"
              title="Back to artifacts"
              aria-label="Back to artifacts"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2a2a2a] text-[#c8c8c8]">
            {artifact ? <Code2 size={17} /> : <FileCode2 size={17} />}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium">{panelTitle}</h2>
            <div className="truncate text-[11px] text-[#888]">
              {artifact ? `HTML APPLICATION · ${formatCreatedAt(artifact.createdAt)}` : `${artifacts.length} saved locally`}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {artifact && (
            <>
              <button
                type="button"
                onClick={() => setPreviewRevision(value => value + 1)}
                className="rounded-md p-2 text-[#999] transition hover:bg-[#333] hover:text-white"
                title="Refresh preview"
                aria-label="Refresh preview"
              >
                <RefreshCw size={15} />
              </button>
              <button
                type="button"
                onClick={copySource}
                className="rounded-md p-2 text-[#999] transition hover:bg-[#333] hover:text-white"
                title="Copy HTML source"
                aria-label="Copy HTML source"
              >
                {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              </button>
              <button
                type="button"
                onClick={() => downloadHtml(artifact)}
                className="rounded-md p-2 text-[#999] transition hover:bg-[#333] hover:text-white"
                title="Download HTML file"
                aria-label="Download HTML file"
              >
                <Download size={15} />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-[#999] transition hover:bg-[#333] hover:text-white"
            title="Close artifacts"
            aria-label="Close artifacts"
          >
            <X size={17} />
          </button>
        </div>
      </header>

      {!artifact ? (
        <div className="flex-1 overflow-y-auto p-5">
          {artifacts.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {artifacts.map(item => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => onSelectArtifact?.(item.id)}
                  className="group flex min-h-24 items-start gap-3 rounded-xl border border-[#333] bg-[#222] p-4 text-left transition hover:border-[#555] hover:bg-[#282828]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#303030] text-[#c8c8c8]">
                    <FileCode2 size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[#e5e5e5]">{item.title}</span>
                    <span className="mt-1 block text-xs text-[#888]">HTML Application · {formatCreatedAt(item.createdAt)}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs text-[#aaa] group-hover:text-white">
                      <Eye size={13} /> Open preview
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#242424] text-[#999]">
                <FileCode2 size={26} />
              </div>
              <h3 className="text-sm font-medium text-[#ddd]">No artifacts yet</h3>
              <p className="mt-2 max-w-xs text-xs leading-5 text-[#888]">
                Ask for a runnable web page, app, or game to create an HTML preview. Ordinary questions stay in chat.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#2a2a2a] px-4">
            <div className="flex items-center gap-1 rounded-lg bg-[#242424] p-1">
              <button
                type="button"
                onClick={() => setView('preview')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition ${view === 'preview' ? 'bg-[#3a3a3a] text-white' : 'text-[#999] hover:text-white'}`}
              >
                <Eye size={13} /> Preview
              </button>
              <button
                type="button"
                onClick={() => setView('source')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition ${view === 'source' ? 'bg-[#3a3a3a] text-white' : 'text-[#999] hover:text-white'}`}
              >
                <Code2 size={13} /> Source
              </button>
            </div>
            {view === 'source' && (
              <button
                type="button"
                onClick={runEditedSource}
                disabled={!draftSource.trim() || draftSource === artifact.content}
                className="rounded-md bg-[#efefef] px-3 py-1.5 text-xs font-medium text-[#191919] transition hover:bg-white disabled:cursor-not-allowed disabled:bg-[#393939] disabled:text-[#777]"
              >
                Apply &amp; run
              </button>
            )}
          </div>

          {view === 'preview' ? (
            <div className="min-h-0 flex-1 bg-white">
              <iframe
                key={`${artifact.id}-${previewRevision}-${artifact.updatedAt || ''}`}
                title={`${artifact.title} preview`}
                srcDoc={previewDocument}
                sandbox="allow-scripts allow-forms allow-modals"
                referrerPolicy="no-referrer"
                className="h-full w-full border-0 bg-white"
              />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col bg-[#181818]">
              <div className="flex h-9 shrink-0 items-center gap-2 border-b border-[#2a2a2a] px-4 font-mono text-[11px] text-[#888]">
                <span className="text-[#e5a36f]">HTML</span>
                <span>index.html</span>
              </div>
              <textarea
                aria-label="Artifact HTML source"
                value={draftSource}
                onChange={event => setDraftSource(event.target.value)}
                spellCheck={false}
                className="min-h-0 flex-1 resize-none bg-[#181818] p-4 font-mono text-xs leading-5 text-[#d4d4d4] outline-none selection:bg-[#39424c]"
              />
            </div>
          )}
        </>
      )}
    </section>
  )
}
