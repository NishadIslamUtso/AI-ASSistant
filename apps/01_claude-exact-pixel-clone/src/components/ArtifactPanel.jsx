import React, { useState } from 'react'
import { C } from '../theme.js'
import { Icon, P } from './Icons.jsx'

/**
 * Artifact runner — the assistant's HTML/React artifact is executed in a
 * sandboxed iframe (srcDoc, sandbox="allow-scripts"). Artifacts are only ever
 * created from an explicit ```artifact:… fence or when the user asked for an
 * app, which is what fixes the old Tic-Tac-Toe loop.
 */
export default function ArtifactPanel({ artifact, artifacts, onSelect, onClose }) {
  const [tab, setTab] = useState('preview')
  const [key, setKey] = useState(0)
  if (!artifact) return null

  const download = () => {
    const blob = new Blob([artifact.html || artifact.code], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${artifact.title.replace(/[^\w-]+/g, '_')}.html`
    a.click()
  }

  return (
    <div className="shrink-0 flex flex-col h-full" style={{ width: '46%', minWidth: 380, borderLeft: `1px solid ${C.border}`, background: C.appBg }}>
      <div className="flex items-center gap-[10px] px-[14px] shrink-0" style={{ height: 46, borderBottom: `1px solid ${C.border}` }}>
        <Icon d={P.code} size={14} />
        <span className="text-[13.5px] truncate flex-1" style={{ color: C.text }}>{artifact.title}</span>
        <div className="flex items-center rounded-[8px] overflow-hidden" style={{ border: `1px solid ${C.borderBtn}` }}>
          {['preview', 'code'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className="px-[10px] text-[12px]" style={{
              height: 24, background: tab === t ? 'rgba(255,255,255,.12)' : 'transparent',
              color: tab === t ? C.text : C.text3,
            }}>{t}</button>
          ))}
        </div>
        <button onClick={() => setKey((k) => k + 1)} title="Reload" style={{ color: C.text3 }}><Icon d={P.refresh} size={14} /></button>
        <button onClick={download} title="Download .html" style={{ color: C.text3 }}><Icon d={P.file} size={14} /></button>
        <a href={`data:text/html;base64,${btoa(unescape(encodeURIComponent(artifact.html || artifact.code)))}`}
          target="_blank" rel="noreferrer" title="Open in new window" style={{ color: C.text3 }}>
          <Icon d={P.external} size={14} />
        </a>
        <button onClick={onClose} title="Close" style={{ color: C.text3 }}><Icon d={P.x} size={15} /></button>
      </div>

      {tab === 'preview' ? (
        <iframe
          key={key}
          title={artifact.title}
          srcDoc={artifact.html || artifact.code}
          sandbox="allow-scripts allow-forms allow-modals"
          className="flex-1 w-full"
          style={{ background: '#fff', border: 0 }}
        />
      ) : (
        <pre className="flex-1 overflow-auto p-[14px] text-[12.5px] leading-[19px]"
          style={{ background: '#171716', color: C.text2, fontFamily: 'ui-monospace, Menlo, Consolas, monospace' }}>
          {artifact.code}
        </pre>
      )}

      {artifacts?.length > 1 && (
        <div className="shrink-0 flex gap-[8px] px-[14px] py-[10px] overflow-x-auto" style={{ borderTop: `1px solid ${C.border}` }}>
          {artifacts.map((a) => (
            <button key={a.id} onClick={() => onSelect(a)}
              className="rounded-[8px] px-[10px] py-[5px] text-[11.5px] shrink-0"
              style={{
                background: a.id === artifact.id ? 'rgba(255,255,255,.12)' : C.inputBg,
                border: `1px solid ${C.borderBtn}`, color: a.id === artifact.id ? C.text : C.text3,
              }}>
              {a.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
