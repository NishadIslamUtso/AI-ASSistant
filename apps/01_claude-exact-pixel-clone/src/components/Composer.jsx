import React, { useRef, useEffect } from 'react'
import { C, M } from '../theme.js'
import { Icon, P } from './Icons.jsx'

/**
 * Composer — measured from 191547.png
 *   box:   x 475  y 344  w 587  h 95   bg #20201f  border #292928  r 8
 *   place: "How can I help you today?"  #898781  at +14 x / +15 y
 *   row:   "+" bottom-left, tools + mic bottom-right
 *   footer (outside the box, 10px below):  Project  ....  Sonnet 5.5 · Medium · Manual
 */
export default function Composer({
  value, onChange, onSend, onStop, loading,
  models, model, onModel, effort, onEffort, memory, onMemory,
  onAttach, onImage, onCook, captureCount, modelLabel,
}) {
  const ta = useRef(null)

  useEffect(() => {
    const el = ta.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [value])

  const canSend = value.trim().length > 0 && !loading

  return (
    <div className="w-full" style={{ maxWidth: 'var(--transcript-width)' }}>
      <div
        className="relative"
        style={{
          background: C.composerBg,
          border: `1px solid ${C.border}`,
          borderRadius: M.composer.radius,
          padding: '15px 14px 7px',
        }}
      >
        <textarea
          ref={ta}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (canSend) onSend() }
          }}
          placeholder={M ? 'How can I help you today?' : ''}
          rows={1}
          className="block w-full bg-transparent resize-none outline-none placeholder-[#898781]"
          style={{ color: C.text, fontSize: 14, lineHeight: '24px', minHeight: 24, maxHeight: 200 }}
        />

        {captureCount > 0 && (
          <div className="mt-[6px] text-[11px]" style={{ color: C.text3 }}>
            {captureCount} attachment{captureCount > 1 ? 's' : ''}
          </div>
        )}

        {/* bottom row inside the composer */}
        <div className="flex items-center justify-between mt-[18px]">
          <div className="flex items-center gap-[10px]">
            <button onClick={onAttach} title="Attach files" className="opacity-80 hover:opacity-100"
              style={{ color: C.text2 }}>
              <Icon d={P.plus} size={18} />
            </button>
            <button onClick={onImage} title="Attach image (vision)" className="opacity-70 hover:opacity-100"
              style={{ color: C.text2 }}>
              <Icon d={P.paperclip} size={15} />
            </button>
            <button onClick={onCook} title="Cook This Prompt — inject AI-Brain memory"
              className="text-[11px] rounded-full px-[9px] py-[2px]"
              style={{ background: C.inputBg, color: C.text3 }}>
              Cook This Prompt
            </button>
          </div>

          <div className="flex items-center gap-[12px]">
            <button title="Voice" className="opacity-80 hover:opacity-100" style={{ color: C.text }}>
              <Icon d={P.mic} size={18} />
            </button>
            {loading ? (
              <button onClick={onStop} title="Stop"
                className="rounded-full flex items-center justify-center"
                style={{ width: 30, height: 30, background: C.text, color: '#111' }}>
                <Icon d={P.stop} size={13} fill="currentColor" strokeWidth={0} />
              </button>
            ) : (
              <button
                onClick={() => canSend && onSend()}
                title="Send"
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 30, height: 30,
                  background: canSend ? '#ffffff' : '#3a3a39',
                  color: canSend ? '#111111' : '#7a7a78',
                }}
              >
                <Icon d={P.send} size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* footer row below the composer box */}
      <div
        className="flex items-center justify-between mt-[10px] text-[12px]"
        style={{ color: C.text3 }}
      >
        <button className="flex items-center gap-[6px] hover:opacity-80" style={{ color: C.text2 }}>
          <Icon d={P.folder} size={13} />
          <span>Project</span>
          <Icon d={P.chevronDown} size={11} />
        </button>

        <div className="flex items-center gap-[14px]">
          <ModelMenu models={models} model={model} onModel={onModel} label={modelLabel} />
          <button onClick={onEffort} className="hover:opacity-80">{effort}</button>
          <button onClick={onMemory} className="hover:opacity-80">{memory}</button>
        </div>
      </div>
    </div>
  )
}

function ModelMenu({ models, model, onModel, label }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-[5px] hover:opacity-80"
        style={{ color: C.text2 }}
        title={`Running: ${model} (local Ollama)`}
      >
        <span>{label || model}</span>
        <Icon d={P.chevronDown} size={11} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 bottom-[26px] z-50 rounded-[8px] py-[4px] w-[260px] shadow-2xl"
            style={{ background: '#2a2a29', border: '1px solid #3a3a39' }}
          >
            <div className="px-[11px] py-[6px] text-[11px]" style={{ color: C.text3 }}>
              Local Ollama models (127.0.0.1:11434)
            </div>
            {models.length === 0 && (
              <div className="px-[11px] py-[8px] text-[12px]" style={{ color: C.text3 }}>
                No models found — is Ollama running?
              </div>
            )}
            {models.map((m) => (
              <button
                key={m.name}
                onClick={() => { onModel(m.name); setOpen(false) }}
                className="flex items-center w-full px-[11px] py-[7px] text-left hover:bg-[#383837]"
              >
                <span className="text-[12.5px] flex-1" style={{ color: C.text2 }}>{m.name}</span>
                {m.vision && <span className="text-[10px] ml-2" style={{ color: C.text3 }}>vision</span>}
                {m.name === model && <Icon d={P.check} size={13} className="ml-2" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
