import { useEffect, useRef, useState } from 'react'
import { ArrowUp, AudioLines, Check, ChevronDown, Ghost, Mic, Minus, PanelLeft, Plus, Square, X } from 'lucide-react'
import Asterisk from './Asterisk.jsx'
import { USER_NAME } from '../lib/constants.js'
import { greetingFor } from '../lib/chats.js'
import { vaultContext } from '../lib/vault.js'

function WinBtn({ children, title, danger, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-12 w-[63px] items-center justify-center text-ui-body ${danger ? 'hover:bg-[#c42b1c] hover:text-white' : 'hover:bg-ui-hover'}`}
    >
      {children}
    </button>
  )
}

// Lists models from the local Ollama (via /api/ollama/api/tags). The selection is saved in App.
function ModelPicker({ model, models, error, onChange, onRefresh }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (!open) onRefresh()
          setOpen((o) => !o)
        }}
        title="Choose a local Ollama model"
        className="flex items-center gap-1 text-ui-body hover:text-ui-text"
      >
        {model}
        <ChevronDown size={14} className="text-ui-muted" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full right-0 z-50 mb-2 w-[300px] rounded-xl border border-ui-line bg-ui-menu p-1.5 text-[14px] shadow-2xl">
            <div className="px-2.5 pb-1 pt-1.5 text-[12px] text-ui-muted">Local models (Ollama)</div>
            {models.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onChange(m)
                  setOpen(false)
                }}
                className="flex h-8 w-full items-center justify-between rounded-md px-2.5 text-left text-ui-body hover:bg-ui-hover"
              >
                <span className="truncate">{m}</span>
                {m === model && <Check size={14} className="text-ui-text" />}
              </button>
            ))}
            {error && <div className="px-2.5 py-2 text-[12px] leading-5 text-ui-muted">{error}</div>}
          </div>
        </>
      )}
    </div>
  )
}

export default function Center({
  messages,
  isLoading,
  onSend,
  onStop,
  model,
  models,
  modelsError,
  onModelChange,
  onRefreshModels,
  sidebarOpen,
  onExpandSidebar,
}) {
  const [input, setInput] = useState('')
  const [hits, setHits] = useState([])
  const taRef = useRef(null)
  const bottomRef = useRef(null)
  const empty = messages.length === 0
  const lastId = messages[messages.length - 1]?.id

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  useEffect(() => {
    const ta = taRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`
    }
  }, [input])

  // Vault lookup while typing (debounced). Matches are shown under the composer and sent as context.
  useEffect(() => {
    const q = input.trim()
    if (q.length < 3) {
      setHits([])
      return undefined
    }
    const ac = new AbortController()
    const t = setTimeout(() => {
      vaultContext(q.slice(-80), ac.signal)
        .then((caps) => setHits(caps.slice(0, 3)))
        .catch(() => setHits([]))
    }, 400)
    return () => {
      clearTimeout(t)
      ac.abort()
    }
  }, [input])

  const submit = () => {
    const text = input.trim()
    if (!text || isLoading) return
    onSend(text, hits)
    setInput('')
    setHits([])
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  const composer = (
    <div className="mx-auto w-full max-w-[var(--col-w)]">
      <div className="rounded-[18px] bg-ui-composer px-[22px] pb-[20px] pt-[20px]">
        <textarea
          ref={taRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="How can I help you today?"
          className="block max-h-[200px] min-h-[28px] w-full resize-none bg-transparent text-[17px] leading-7 text-ui-text outline-none placeholder:text-ui-muted"
        />
        <div className="mt-3 flex items-center justify-between">
          <button type="button" title="Attach (not built yet)" className="flex h-7 w-7 items-center justify-center rounded-full text-ui-body hover:bg-ui-hover">
            <Plus size={20} />
          </button>
          <div className="flex items-center gap-3 text-ui-body">
            {isLoading ? (
              <button type="button" onClick={onStop} title="Stop generating" className="flex h-8 w-8 items-center justify-center rounded-full bg-ui-text text-ui-main">
                <Square size={12} fill="currentColor" />
              </button>
            ) : input.trim() ? (
              <button type="button" onClick={submit} title="Send (Enter)" className="flex h-8 w-8 items-center justify-center rounded-full bg-ui-text text-ui-main">
                <ArrowUp size={18} />
              </button>
            ) : (
              <>
                <button type="button" title="Voice input (not built yet)" className="flex h-7 w-7 items-center justify-center text-ui-muted">
                  <Mic size={20} />
                </button>
                <button type="button" title="Voice mode (not built yet)" className="flex h-7 items-center gap-1 text-ui-body">
                  <AudioLines size={20} />
                  <ChevronDown size={14} className="text-ui-muted" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mt-[20px] flex items-center justify-between px-[21px] text-[15px]">
        <button type="button" title="Projects (not built yet)" className="flex items-center gap-1.5 text-ui-body">
          Project
          <ChevronDown size={14} className="text-ui-muted" />
        </button>
        <div className="flex items-center gap-4">
          <ModelPicker model={model} models={models} error={modelsError} onChange={onModelChange} onRefresh={onRefreshModels} />
          <span title="Not wired yet" className="text-ui-muted">Medium</span>
          <span title="Not wired yet" className="text-ui-body">Manual</span>
        </div>
      </div>
      {hits.length > 0 && (
        <div className="mt-2 px-[21px] text-[12px] text-ui-muted">Vault match: {hits.map((h) => h.title).join(' · ')}</div>
      )}
    </div>
  )

  return (
    <main className="relative flex min-w-0 flex-1 flex-col bg-ui-main">
      <div className="absolute inset-x-0 top-0 z-10 flex h-12 items-center justify-between">
        <div className="pl-3">
          {!sidebarOpen && (
            <button type="button" title="Show sidebar" onClick={onExpandSidebar} className="flex h-7 w-7 items-center justify-center rounded-md text-ui-body hover:bg-ui-hover">
              <PanelLeft size={18} />
            </button>
          )}
        </div>
        <div className="flex h-full items-center">
          <WinBtn title="Temporary chat (not built yet)">
            <Ghost size={17} />
          </WinBtn>
          <WinBtn title="Window controls are active in the Windows app build">
            <Minus size={17} />
          </WinBtn>
          <WinBtn title="Window controls are active in the Windows app build">
            <Square size={13} />
          </WinBtn>
          <WinBtn danger title="Window controls are active in the Windows app build">
            <X size={17} />
          </WinBtn>
        </div>
      </div>

      {empty ? (
        <div className="relative flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-12">
          <div className="absolute left-1/2 top-[118px] -translate-x-1/2 rounded-full bg-ui-pill px-5 py-2 text-[15px]">
            <span className="text-ui-muted">Free plan</span>
            <span className="mx-2 text-ui-muted">·</span>
            <button type="button" title="Not built yet" className="text-ui-link hover:underline">
              Upgrade
            </button>
          </div>
          <div className="mb-[38px] -mt-8 flex items-center gap-[14px]">
            <Asterisk className="h-11 w-11 text-ui-accent" />
            <h1 className="font-serif text-[44px] leading-none text-ui-text">
              {greetingFor()}, {USER_NAME}
            </h1>
          </div>
          <div className="w-full px-0">{composer}</div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto pt-16">
            <div className="mx-auto w-full max-w-[var(--col-w)] space-y-7 px-6 pb-6">
              {messages.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="transcript-text max-w-[80%] whitespace-pre-wrap rounded-[18px] bg-ui-composer px-4 py-2.5 text-ui-text">{m.content}</div>
                  </div>
                ) : (
                  <div key={m.id} className={`transcript-text whitespace-pre-wrap ${m.error ? 'text-ui-muted' : 'text-ui-text'}`}>
                    {m.content}
                    {!m.content && !m.error && m.id === lastId && isLoading && (
                      <span className="inline-flex items-center gap-2 text-ui-muted">
                        <Asterisk className="h-4 w-4 animate-ai-spin text-ui-accent" />
                        Thinking…
                      </span>
                    )}
                  </div>
                ),
              )}
              <div ref={bottomRef} />
            </div>
          </div>
          <div className="px-6 pb-5 pt-2">{composer}</div>
        </>
      )}
    </main>
  )
}
