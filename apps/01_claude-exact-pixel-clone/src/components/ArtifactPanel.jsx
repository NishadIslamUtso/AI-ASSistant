import { useEffect, useMemo, useState } from 'react'
import { Code2, Eye, X, Copy, Check, Download, RefreshCw, ExternalLink, ChevronDown, FileCode2 } from 'lucide-react'

const SANDBOX_CSP = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline' data:; script-src 'unsafe-inline' blob:; font-src data:; connect-src 'none'; form-action 'none'; object-src 'none'; base-uri 'none'; frame-src 'none'">`

function sandboxDocument(source) {
  const trimmed = String(source || '').trim()
  const html = /^<!doctype|^<html/i.test(trimmed)
    ? trimmed
    : `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${SANDBOX_CSP}</head><body>${trimmed}</body></html>`

  if (/<head(?:\s[^>]*)?>/i.test(html) && !html.includes(SANDBOX_CSP)) {
    return html.replace(/<head(?:\s[^>]*)?>/i, (match) => `${match}${SANDBOX_CSP}`)
  }
  return html
}

export default function ArtifactPanel({ isOpen, artifacts = [], selectedArtifactId, onSelectArtifact, onClose }) {
  const [view, setView] = useState('preview')
  const [refreshKey, setRefreshKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const artifact = useMemo(
    () => artifacts.find((item) => item.id === selectedArtifactId) || artifacts[0] || null,
    [artifacts, selectedArtifactId],
  )

  useEffect(() => { setView('preview') }, [artifact?.id])
  if (!isOpen) return null

  const copySource = async () => {
    if (!artifact) return
    try {
      await navigator.clipboard.writeText(artifact.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setView('source')
    }
  }

  const downloadSource = () => {
    if (!artifact) return
    const blob = new Blob([artifact.content], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${(artifact.title || 'artifact').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.html`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const openInTab = () => {
    if (!artifact) return
    const blob = new Blob([sandboxDocument(artifact.content)], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
  }

  return (
    <aside className="artifact-panel" aria-label="Artifacts">
      <header className="artifact-header">
        <div className="artifact-header-title">
          <div className="artifact-header-icon"><FileCode2 size={17} /></div>
          <div className="artifact-title-stack">
            <span>Artifacts</span>
            <small>{artifact ? artifact.title : 'HTML preview'}</small>
          </div>
        </div>
        <div className="artifact-header-actions">
          <button type="button" title="Refresh preview" aria-label="Refresh preview" disabled={!artifact} onClick={() => setRefreshKey((value) => value + 1)}><RefreshCw size={15} /></button>
          <button type="button" title="Open in a new tab" aria-label="Open in a new tab" disabled={!artifact} onClick={openInTab}><ExternalLink size={15} /></button>
          <button type="button" title="Close artifacts" aria-label="Close artifacts" onClick={onClose}><X size={17} /></button>
        </div>
      </header>

      {artifacts.length > 0 ? (
        <div className="artifact-toolbar">
          <label className="artifact-select-wrap">
            <select value={artifact?.id || ''} onChange={(event) => onSelectArtifact?.(event.target.value)} aria-label="Choose an artifact">
              {artifacts.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
            <ChevronDown size={14} />
          </label>
          <div className="artifact-view-tabs">
            <button type="button" className={view === 'preview' ? 'is-active' : ''} onClick={() => setView('preview')}><Eye size={14} /> Preview</button>
            <button type="button" className={view === 'source' ? 'is-active' : ''} onClick={() => setView('source')}><Code2 size={14} /> Source</button>
          </div>
          <div className="artifact-toolbar-actions">
            <button type="button" title="Copy source" aria-label="Copy source" onClick={copySource}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
            <button type="button" title="Download HTML" aria-label="Download HTML" onClick={downloadSource}><Download size={14} /></button>
          </div>
        </div>
      ) : null}

      <div className="artifact-body">
        {!artifact ? (
          <div className="artifact-empty">
            <FileCode2 size={30} />
            <strong>No artifacts yet</strong>
            <p>Ask AI ASSistant to build an HTML app, page, or interactive demo. It only creates an artifact when you explicitly ask.</p>
          </div>
        ) : view === 'source' ? (
          <pre className="artifact-source"><code>{artifact.content}</code></pre>
        ) : (
          <iframe
            key={`${artifact.id}-${refreshKey}`}
            title={artifact.title}
            srcDoc={sandboxDocument(artifact.content)}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            className="artifact-iframe"
          />
        )}
      </div>
      {artifact ? <footer className="artifact-safety-note">Preview runs in an isolated frame. Network requests and access to local app data are blocked.</footer> : null}
    </aside>
  )
}
