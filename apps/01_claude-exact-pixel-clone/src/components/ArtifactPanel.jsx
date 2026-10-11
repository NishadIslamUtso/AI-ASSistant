import { useEffect, useMemo, useRef, useState } from 'react'
import { Code2, Eye, X, Copy, Download, RefreshCw, Save, FileCode2, MapPin } from 'lucide-react'
import { artifactSource, buildPreviewHtml } from '../lib/artifacts.js'
import { newId } from '../lib/storage.js'
export default function ArtifactPanel({ artifact, onClose, onSave, notify, onPin, live = false }) {
  const [view, setView] = useState('preview')
  const [version, setVersion] = useState(artifact.versions.length - 1)
  const [draft, setDraft] = useState(artifactSource(artifact))
  const [reload, setReload] = useState(0)
  const [error, setError] = useState('')
  const [pinOn, setPinOn] = useState(false)
  const frame = useRef(null)
  const channel = useRef(newId())
  const source = artifactSource(artifact, version)
  const dirty = draft !== source
  const html = useMemo(() => buildPreviewHtml(source, channel.current), [source])
  useEffect(() => { setVersion(artifact.versions.length - 1) }, [artifact.versions.length])
  useEffect(() => { setDraft(source); setError('') }, [source])
  useEffect(() => {
    if (pinOn) frame.current?.contentWindow?.postMessage({ type: 'ai-assistant-pin-mode', on: true, channel: channel.current }, '*')
  }, [reload, version, pinOn])
  useEffect(() => {
    const onMessage = event => {
      if (event.source !== frame.current?.contentWindow || event.data?.channel !== channel.current) return
      if (event.data.type === 'ai-assistant-artifact-error' && typeof event.data.message === 'string') setError(event.data.message.slice(0, 500))
      if (event.data.type === 'ai-assistant-artifact-pin' && pinOn) onPin?.({ selector: event.data.selector || '', snippet: event.data.snippet || '' })
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [pinOn, onPin])
  function togglePin() {
    const next = !pinOn
    setPinOn(next)
    frame.current?.contentWindow?.postMessage({ type: 'ai-assistant-pin-mode', on: next, channel: channel.current }, '*')
    notify(next ? 'Comment mode on — click an element in the preview to quote it into the composer.' : 'Comment mode off.')
  }
  async function copy() {
    try { await navigator.clipboard.writeText(draft); notify('Artifact source copied.') } catch { notify('Clipboard permission is unavailable. Select and copy the source instead.') }
  }
  function download() {
    const blob = new Blob([draft], { type: artifact.type === 'svg' ? 'image/svg+xml' : 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `${artifact.title.replace(/[^a-z0-9_-]/gi, '-').slice(0, 60) || 'artifact'}.${artifact.type === 'svg' ? 'svg' : 'html'}`
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    notify('Source downloaded. Review it before running outside the sandbox; the exported source is not network-isolated.')
  }
  return <aside className="artifact-panel side-panel" aria-label="Artifact workbench">
    <header className="panel-header"><div><h2>{artifact.title}</h2><small>{live ? 'Live · streaming from the model' : artifact.type === 'html' ? 'HTML Application' : 'SVG Image'}</small></div><button className="icon-button" aria-label="Close artifact" onClick={onClose}><X size={17} /></button></header>
    <div className="artifact-toolbar"><div className="panel-tabs"><button className={view === 'preview' ? 'selected' : ''} onClick={() => { if (dirty) { notify('Save your source as a new version before previewing changes.'); return } setView('preview') }}><Eye size={14} />Preview</button><button className={view === 'source' ? 'selected' : ''} onClick={() => setView('source')}><Code2 size={14} />Source</button></div><div><button className={`icon-button ${pinOn ? 'pin-active' : ''}`} aria-label="Toggle comment mode pin" aria-pressed={pinOn} title="Comment mode: click an element in the preview to quote it into the composer" disabled={view !== 'preview'} onClick={togglePin}><MapPin size={14} /></button><button className="icon-button" aria-label="Copy artifact source" onClick={copy}><Copy size={14} /></button><button className="icon-button" aria-label="Download artifact source" onClick={download}><Download size={14} /></button></div></div>
    <div className="workbench-file"><FileCode2 size={14} /><span>{artifact.type === 'html' ? 'index.html' : 'image.svg'}</span>{!live && <select aria-label="Artifact version" value={version} onChange={event => setVersion(Number(event.target.value))}>{artifact.versions.map((entry, index) => <option key={index} value={index}>Version {index + 1}{entry.edited ? ' · edited' : ''}</option>)}</select>}{view === 'preview' && <button className="icon-button" aria-label="Refresh artifact preview" onClick={() => { setError(''); setReload(value => value + 1) }}><RefreshCw size={14} /></button>}</div>
    {view === 'source' ? <><textarea className="source-editor" aria-label="Artifact source editor" spellCheck={false} readOnly={live} value={draft} onChange={event => setDraft(event.target.value)} /><div className="source-actions"><small>{live ? 'Live source — read-only until the response finishes' : dirty ? 'Unsaved source changes' : 'Source kept in local chat history'}</small>{!live && <button className="secondary-button" disabled={!dirty || !draft.trim() || draft.length > 200_000} onClick={() => onSave(artifact.id, draft)}><Save size={14} />Save version</button>}</div></> : <>
      {error && <p className="preview-error" role="alert">Preview error: {error}</p>}
      <iframe key={`${version}-${reload}`} ref={frame} title={`Artifact preview: ${artifact.title}`} srcDoc={html} sandbox="allow-scripts" referrerPolicy="no-referrer" />
    </>}
    <footer className="panel-footnote">Isolated preview · no network, vault access, forms or popups.<br />HTML/inline JS and SVG only. React/CDN and shell execution are not supported.</footer>
  </aside>
}
