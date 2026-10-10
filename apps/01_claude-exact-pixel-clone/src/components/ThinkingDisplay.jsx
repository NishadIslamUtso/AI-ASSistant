import { useState } from 'react'
import { ChevronRight, Brain, Sparkles } from 'lucide-react'

/**
 * ThinkingDisplay — collapsible "reasoning" block.
 * Models like qwen3 / deepseek-r1 emit <think>...</think>; the app splits that
 * out (see lib/ollama.splitThinking) and shows it here instead of dumping it
 * into the transcript.
 */
export default function ThinkingDisplay({ thinking, isStreaming = false, modelName }) {
  const [open, setOpen] = useState(false)
  if (!thinking && !isStreaming) return null

  const chars = (thinking || '').length

  return (
    <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[var(--bg-hover)] text-left"
      >
        <ChevronRight
          size={14}
          className={`text-[var(--ink3)] transition-transform ${open ? 'rotate-90' : ''}`}
        />
        {isStreaming && thinking ? (
          <Sparkles size={14} className="text-[var(--ink3)] shrink-0" />
        ) : (
          <Brain size={14} className="text-[var(--ink3)] shrink-0" />
        )}
        <span className="text-[13px] text-[var(--ink2)] flex-1">
          {isStreaming && thinking ? 'Thinking…' : open ? 'Hide reasoning' : 'Show reasoning'}
        </span>
        {modelName ? <span className="text-[11px] text-[var(--ink3)]">{modelName}</span> : null}
        {!isStreaming && chars > 0 ? (
          <span className="text-[11px] text-[var(--ink3)]">{chars.toLocaleString()} chars</span>
        ) : null}
      </button>
      {open ? (
        <div className="border-t border-[var(--border)] px-3.5 py-3 max-h-[280px] overflow-y-auto">
          <pre className="whitespace-pre-wrap font-sans text-[12.5px] leading-5 text-[var(--ink2)]">
            {thinking}
          </pre>
        </div>
      ) : null}
    </div>
  )
}
