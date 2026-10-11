import { useEffect, useRef, useState } from 'react'
import {
  ArrowUp,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Folder,
  Plus,
  Square,
  Sparkles,
  X,
  Blocks,
  Database,
  AlertTriangle,
} from 'lucide-react'
import Dropdown from './Dropdown.jsx'
import { shortModelName, modelSupportsImages } from '../lib/ollama.js'

/**
 * Composer — the #242424 rounded-xl input from screenshot 191547.png.
 *
 *   [ + attach ] [ Project ⌄ ]            [ model ⌄ ] [ effort ⌄ ] [ thinking ⌄ ] [ ↑ ]
 *
 * Everything in the bottom row is live:
 *   model    -> listed from Ollama /api/tags, remembered in settings
 *   effort   -> Low/Medium/High (generation budget)
 *   thinking -> Manual/Auto/Off (shows the reasoning panel)
 *   project  -> attaches the chat to a project
 *   +        -> upload a file, upload an image, or pull a Capsule from the vault
 * Drag a Capsule from the AI-Brain panel onto the composer to inject it.
 */
export default function Composer({
  value,
  onChange,
  onSend,
  onStop,
  isLoading,
  placeholder = 'How can I help you today?',
  compact = false,
  model,
  models = [],
  onModelChange,
  effort,
  onEffortChange,
  thinking,
  onThinkingChange,
  project,
  projects = [],
  onProjectChange,
  attachments = [],
  onPickFiles,
  onRemoveAttachment,
  injected = [],
  onRemoveInjected,
  onDropCapsule,
  onCookPrompt,
  cooking = false,
  ollamaOk,
  onOpenVault,
  artifactMode,
  onToggleArtifactMode,
  vaultHits = [],
  onAddHit,
  autoFocus = false,
}) {
  const taRef = useRef(null)
  const fileRef = useRef(null)
  const imageRef = useRef(null)
  const [attachOpen, setAttachOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // auto-grow
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [value])

  useEffect(() => {
    if (autoFocus) taRef.current?.focus()
  }, [autoFocus])

  const modelOptions =
    models.length > 0
      ? models.map((m) => ({
          value: m.name,
          label: m.name,
          hint: [m.sizeLabel, m.vision ? 'vision' : ''].filter(Boolean).join(' · ') || undefined,
        }))
      : [{ value: model, label: model || 'no model' }]

  const visionOk = modelSupportsImages(model)
  const hasImages = attachments.some((a) => a.kind === 'image')

  return (
    <div
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/x-ai-capsule')) {
          e.preventDefault()
          setDragOver(true)
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        const raw = e.dataTransfer.getData('application/x-ai-capsule')
        if (!raw) return
        e.preventDefault()
        setDragOver(false)
        try {
          onDropCapsule?.(JSON.parse(raw))
        } catch (err) {
          /* ignore malformed capsule */
        }
      }}
      className={`bg-[var(--bg-elev)] border px-4 pt-3.5 pb-3 transition-colors ${
        dragOver ? 'border-[var(--accent)] rounded-[18px]' : 'border-[var(--border-strong)] rounded-[18px]'
      }`}
    >
      {/* chips: attachments + injected capsules */}
      {attachments.length || injected.length ? (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {attachments.map((a, i) => (
            <span
              key={`att-${i}`}
              className="inline-flex items-center gap-1.5 text-[11.5px] px-2 py-1 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--ink2)]"
            >
              {a.kind === 'image' ? (
                a.preview ? (
                  <img src={a.preview} alt="" className="w-4 h-4 rounded object-cover" />
                ) : (
                  <ImageIcon size={11} />
                )
              ) : (
                <FileText size={11} />
              )}
              <span className="max-w-[150px] truncate">{a.name}</span>
              {a.kind === 'image' && !visionOk ? (
                <span className="text-[var(--danger)]" title={`${model} does not accept images`}>
                  <AlertTriangle size={10} />
                </span>
              ) : null}
              <button
                onClick={() => onRemoveAttachment?.(i)}
                className="text-[var(--ink3)] hover:text-[var(--ink)]"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          {injected.map((c) => (
            <span
              key={`cap-${c.id}`}
              className="inline-flex items-center gap-1.5 text-[11.5px] px-2 py-1 rounded-md bg-[var(--accent)]/15 border border-[var(--accent)]/40 text-[var(--ink)]"
            >
              <Database size={11} className="text-[var(--accent)]" />
              <span className="max-w-[170px] truncate">{c.title}</span>
              <button
                onClick={() => onRemoveInjected?.(c.id)}
                className="text-[var(--ink3)] hover:text-[var(--ink)]"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {/* vault context — offered, never injected silently */}
      {vaultHits.length ? (
        <div className="mb-2 flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] text-[var(--ink3)]">From your vault:</span>
          {vaultHits.slice(0, 3).map((h) => (
            <button
              key={h.id}
              onClick={() => onAddHit?.(h)}
              title="Add this memory to the message"
              className="text-[11px] px-2 py-[3px] rounded-md bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--ink2)] hover:text-[var(--ink)] hover:border-[var(--border-strong)] max-w-[210px] truncate"
            >
              + {h.title}
            </button>
          ))}
        </div>
      ) : null}

      {/* textarea */}
      <textarea
        ref={taRef}
        value={value}
        rows={1}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSend()
          }
        }}
        placeholder={placeholder}
        className="w-full bg-transparent resize-none outline-none text-[15px] leading-6 text-[var(--ink)] placeholder-[var(--ink3)] min-h-[26px] max-h-[200px]"
      />

      {/* bottom row */}
      <div className="flex items-center justify-between mt-2.5 gap-2">
        <div className="flex items-center gap-1 min-w-0">
          {/* attach */}
          <div className="relative">
            <button
              onClick={() => setAttachOpen((v) => !v)}
              title="Attach"
              className="w-7 h-7 rounded-full border border-[var(--border-strong)] hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--ink2)]"
            >
              <Plus size={15} />
            </button>
            {attachOpen ? (
              <div
                className="absolute left-0 bottom-9 z-50 w-[236px] bg-[var(--bg-elev)] border border-[var(--border-strong)] rounded-lg py-1 shadow-pop"
                onMouseLeave={() => setAttachOpen(false)}
              >
                <MenuItem
                  icon={<FileText size={14} />}
                  label="Upload a file"
                  hint="text, code, md, csv"
                  onClick={() => fileRef.current?.click()}
                />
                <MenuItem
                  icon={<ImageIcon size={14} />}
                  label="Upload an image"
                  hint={visionOk ? 'this model reads images' : `${model} is text-only`}
                  onClick={() => imageRef.current?.click()}
                />
                <div className="my-1 h-px bg-[var(--border)]" />
                <MenuItem
                  icon={<Database size={14} />}
                  label="Insert from vault…"
                  onClick={() => {
                    setAttachOpen(false)
                    onOpenVault?.()
                  }}
                />
                <MenuItem
                  icon={<Blocks size={14} />}
                  label={artifactMode ? 'Artifact mode: ON' : 'Artifact mode: off'}
                  hint="explicit builds only"
                  onClick={() => {
                    onToggleArtifactMode?.(!artifactMode)
                    setAttachOpen(false)
                  }}
                />
                <MenuItem
                  icon={<Sparkles size={14} />}
                  label={cooking ? 'Cooking…' : 'Cook This Prompt'}
                  hint="vault context"
                  onClick={() => {
                    setAttachOpen(false)
                    onCookPrompt?.()
                  }}
                />
                <div className="my-1 h-px bg-[var(--border)]" />
                <MenuItem
                  icon={<Paperclip size={14} />}
                  label="Attach any file"
                  onClick={() => fileRef.current?.click()}
                />
              </div>
            ) : null}
          </div>

          {/* project */}
          <Dropdown
            variant="plain"
            value={project}
            onChange={onProjectChange}
            align="left"
            menuWidth={220}
            title="Project"
            options={[
              { value: '', label: 'Project', icon: <Folder size={12} /> },
              ...projects.map((p) => ({ value: p.id, label: p.name, icon: <Folder size={12} /> })),
            ]}
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasImages && !visionOk ? (
            <span className="text-[11px] text-[var(--danger)] whitespace-nowrap">
              images need a vision model
            </span>
          ) : null}

          <Dropdown
            variant="plain"
            value={model}
            onChange={onModelChange}
            align="right"
            menuWidth={280}
            title={ollamaOk ? 'Model (Ollama)' : 'Model — Ollama not reachable'}
            options={modelOptions}
            className="max-w-[190px]"
          />
          <span className="text-[var(--ink3)] text-[11px]">·</span>
          <Dropdown
            variant="plain"
            value={effort}
            onChange={onEffortChange}
            align="right"
            menuWidth={160}
            title="Effort"
            options={['Low', 'Medium', 'High'].map((v) => ({ value: v, label: v }))}
          />
          <span className="text-[var(--ink3)] text-[11px]">·</span>
          <Dropdown
            variant="plain"
            value={thinking}
            onChange={onThinkingChange}
            align="right"
            menuWidth={180}
            title="Thinking"
            options={['Manual', 'Auto', 'Off'].map((v) => ({ value: v, label: v }))}
          />

          {isLoading ? (
            <button
              onClick={onStop}
              title="Stop"
              className="w-7 h-7 rounded-full bg-[var(--ink)] text-[var(--bg-main)] flex items-center justify-center ml-1"
            >
              <Square size={12} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!value.trim() && attachments.length === 0}
              title="Send"
              className={`w-7 h-7 rounded-full flex items-center justify-center ml-1 transition-colors ${
                value.trim() || attachments.length
                  ? 'bg-[var(--btn)] text-[var(--btn-fg)] hover:opacity-85'
                  : 'bg-[var(--bg-hover)] text-[var(--ink3)]'
              }`}
            >
              <ArrowUp size={15} strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>

      {compact ? null : (
        <div className="mt-1.5 text-[11px] text-[var(--ink3)] text-center">
          Enter to send · Shift+Enter for a new line{ollamaOk ? '' : ' · Ollama offline'}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          onPickFiles?.(Array.from(e.target.files || []), 'file')
          e.target.value = ''
        }}
      />
      <input
        ref={imageRef}
        type="file"
        multiple
        accept="image/*"
        hidden
        onChange={(e) => {
          onPickFiles?.(Array.from(e.target.files || []), 'image')
          e.target.value = ''
        }}
      />
    </div>
  )
}

function MenuItem({ icon, label, hint, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-[7px] text-[13px] text-[var(--ink)] hover:bg-[var(--bg-hover)] text-left"
    >
      <span className="text-[var(--ink2)] shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {hint ? <span className="text-[11px] text-[var(--ink3)]">{hint}</span> : null}
    </button>
  )
}
