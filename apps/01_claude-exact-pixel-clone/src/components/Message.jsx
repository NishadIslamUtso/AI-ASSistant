import { useState } from 'react'
import { Copy, Check, FileText, Image as ImageIcon, Code2, Eye, AlertTriangle } from 'lucide-react'
import { renderMarkdown } from '../lib/markdown.jsx'
import ThinkingDisplay from './ThinkingDisplay.jsx'

/**
 * Message — one turn in the transcript.
 *  assistant: orange ✳ avatar on the left, markdown body, "Open artifact" under
 *             runnable HTML/SVG blocks.
 *  user:      right-aligned bubble (#2a2a2a in dark), attachments as chips.
 */
export default function Message({
  message,
  transcriptClass = 'ts-medium',
  fontClass = '',
  isStreaming = false,
  onOpenArtifact,
  onRegenerate,
  isLast,
}) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch (e) {
      /* clipboard blocked — ignore */
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%]">
          {message.attachments?.length ? (
            <div className="flex flex-wrap gap-1.5 justify-end mb-1.5">
              {message.attachments.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--ink2)]"
                >
                  {a.kind === 'image' ? <ImageIcon size={11} /> : <FileText size={11} />}
                  <span className="max-w-[160px] truncate">{a.name}</span>
                  {a.size ? <span className="text-[var(--ink3)]">{fmtSize(a.size)}</span> : null}
                </span>
              ))}
            </div>
          ) : null}
          <div
            className={`bg-[var(--bubble-user)] rounded-2xl px-4 py-2.5 whitespace-pre-wrap break-words ${transcriptClass} ${fontClass}`}
          >
            {message.content}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group">
      {message.thinking ? (
        <ThinkingDisplay
          thinking={message.thinking}
          isStreaming={isStreaming && !message.content}
          modelName={message.model}
        />
      ) : null}

      <div className="flex gap-3">
        <div className="w-[22px] h-[22px] rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-[11px] shrink-0 mt-0.5">
          ✳
        </div>
        <div className={`min-w-0 flex-1 ${transcriptClass} ${fontClass}`}>
          {message.error ? (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2.5 text-[13px] text-[var(--ink)]">
              <AlertTriangle size={15} className="text-[var(--danger)] shrink-0 mt-0.5" />
              <div>
                <div className="mb-1">{message.content}</div>
                {message.hint ? (
                  <div className="text-[12px] text-[var(--ink2)] leading-5">{message.hint}</div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="break-words">
              {renderMarkdown(message.content || '', (code, lang, key) => (
                <CodeBlockWithArtifact key={key} code={code} lang={lang} onOpenArtifact={onOpenArtifact} />
              ))}
              {isStreaming && !message.content ? (
                <span className="inline-flex gap-1 items-center py-1">
                  <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-[var(--ink3)]" />
                  <span
                    className="thinking-dot w-1.5 h-1.5 rounded-full bg-[var(--ink3)]"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <span
                    className="thinking-dot w-1.5 h-1.5 rounded-full bg-[var(--ink3)]"
                    style={{ animationDelay: '0.4s' }}
                  />
                </span>
              ) : null}
            </div>
          )}

          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconBtn onClick={copy} title="Copy">
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </IconBtn>
            {isLast && !isStreaming && !message.error ? (
              <IconBtn onClick={onRegenerate} title="Regenerate">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              </IconBtn>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function CodeBlockWithArtifact({ code, lang, onOpenArtifact }) {
  const l = (lang || '').toLowerCase()
  const runnable = ['html', 'htm', 'svg', 'xml', 'react', 'jsx'].includes(l)
  return (
    <div className="my-3 rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--code-bg)]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)]">
        <span className="flex items-center gap-1.5 text-[11px] text-[var(--ink3)] font-mono">
          <Code2 size={11} /> {lang || 'code'}
        </span>
        <div className="flex items-center gap-1">
          {runnable ? (
            <button
              onClick={() => onOpenArtifact?.(code, l)}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md text-[var(--ink2)] hover:bg-[var(--bg-hover)] hover:text-[var(--ink)]"
            >
              <Eye size={11} /> Open in artifacts
            </button>
          ) : null}
          <CopyBtn text={code} />
        </div>
      </div>
      <pre className="overflow-x-auto p-3 text-[12.5px] leading-5 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function CopyBtn({ text }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setOk(true)
          setTimeout(() => setOk(false), 1200)
        } catch (e) {
          /* ignore */
        }
      }}
      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md text-[var(--ink3)] hover:bg-[var(--bg-hover)] hover:text-[var(--ink)]"
    >
      {ok ? <Check size={11} /> : <Copy size={11} />} {ok ? 'Copied' : 'Copy'}
    </button>
  )
}

function IconBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-6 h-6 rounded-md hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--ink3)] hover:text-[var(--ink)]"
    >
      {children}
    </button>
  )
}

function fmtSize(n) {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
