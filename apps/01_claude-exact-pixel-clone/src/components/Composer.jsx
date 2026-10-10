import { useEffect, useRef, useState } from 'react'
import { Plus, Mic, AudioLines, ChevronDown, ArrowUp, Square } from 'lucide-react'

export default function Composer({ busy, onSend, onStop, placeholder, toast }) {
  const [text, setText] = useState('')
  const ref = useRef(null)

  useEffect(() => { ref.current?.focus() }, [])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [text])

  const submit = () => {
    if (busy) { onStop(); return }
    if (!text.trim()) return
    const value = text
    setText('')
    onSend(value)
  }

  const canSend = busy || text.trim().length > 0

  return (
    <div className="c-composer rounded-2xl px-4 pt-3 pb-2.5">
      <textarea
        ref={ref}
        value={text}
        rows={1}
        aria-label="Message"
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
        }}
        className="chat-text w-full resize-none bg-transparent outline-none placeholder:text-[var(--text-3)] min-h-[28px] max-h-[200px]"
        style={{ fontSize: 16 }}
      />
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Add attachment"
          onClick={() => toast('Attachments and image upload: not in the local build yet')}
          className="flex h-8 w-8 items-center justify-center rounded-full border c-border c-muted-2 c-hover"
        >
          <Plus size={16} />
        </button>
        <div className="flex items-center gap-2 c-muted-2">
          <button type="button" aria-label="Voice input" title="Voice input: not in the local build yet" onClick={() => toast('Voice input: not in the local build yet')} className="rounded-md p-1.5 c-hover">
            <Mic size={16} />
          </button>
          <button type="button" aria-label="Voice mode" title="Voice mode: not in the local build yet" onClick={() => toast('Voice mode: not in the local build yet')} className="flex items-center rounded-md p-1.5 c-hover">
            <AudioLines size={16} />
            <ChevronDown size={12} />
          </button>
          <button
            type="button"
            aria-label={busy ? 'Stop generating' : 'Send message'}
            onClick={submit}
            disabled={!canSend}
            className="flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-40"
            style={{ background: 'var(--send-bg)', color: 'var(--send-fg)' }}
          >
            {busy ? <Square size={12} fill="currentColor" /> : <ArrowUp size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
