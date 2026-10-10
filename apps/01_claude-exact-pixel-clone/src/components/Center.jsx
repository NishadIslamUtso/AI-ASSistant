import { useEffect, useMemo, useRef, useState } from 'react'
import { AudioLines, ArrowUp, ChevronDown, Check, FolderOpen, Mic, Plus, RefreshCw, Square } from 'lucide-react'
import { OLLAMA_BASE, USER } from '../lib/config.js'
import { getGreeting } from '../lib/greeting.js'
import { vaultCapture, vaultContext } from '../lib/api.js'

const WIDTHS = { narrow: 736, medium: 864, wide: 1024 }      // composer + transcript max width (CSS px)
const TEXT = { small: '15px', medium: '16px', large: '18px' }  // transcript font size
const SYSTEM_PROMPT =
  'You are AI ASSistant, a helpful local assistant for Utso. Answer the question directly. ' +
  'Do not write code or games unless the user explicitly asks for code. Keep answers simple.'

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export default function Center({ chatId, chats, setChats, onCreateChat, settings, patchSettings, models, onRefreshModels, toast }) {
  const chat = chatId ? chats.find((c) => c.id === chatId) || null : null
  const messages = chat?.messages || []
  const isEmpty = messages.length === 0

  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [hits, setHits] = useState([])
  const [modelOpen, setModelOpen] = useState(false)
  const abortRef = useRef(null)
  const endRef = useRef(null)
  const taRef = useRef(null)

  const width = WIDTHS[settings.transcriptWidth] || WIDTHS.narrow
  const motion = settings.motion === 'reduced' ? 'auto' : 'smooth'

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: motion }) }, [messages.length, messages[messages.length - 1]?.content, motion])

  // Auto-grow composer (max 200px)
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`
  }, [input])

  // Vault memory lookup while typing (debounced). Non-blocking: if the vault is down, nothing shows.
  useEffect(() => {
    if (input.trim().length < 3) { setHits([]); return undefined }
    const t = setTimeout(async () => {
      try {
        const data = await vaultContext(input.trim().slice(-80))
        setHits((data.capsules || []).slice(0, 3))
      } catch {
        setHits([])
      }
    }, 500)
    return () => clearTimeout(t)
  }, [input])

  const patchChat = (id, fn) => setChats((prev) => prev.map((c) => (c.id === id ? { ...c, ...fn(c) } : c)))

  async function send() {
    const text = input.trim()
    if (!text || busy) return

    const id = chatId || onCreateChat(text.slice(0, 60))
    const prior = chatId ? messages : []
    const userMsg = { id: uid(), role: 'user', content: text, at: new Date().toISOString() }
    const asstId = uid()
    setInput('')
    setHits([])
    setBusy(true)
    patchChat(id, (c) => ({
      messages: [...c.messages, userMsg, { id: asstId, role: 'assistant', content: '', at: new Date().toISOString(), streaming: true }],
    }))

    // Vault context goes to the model only; the transcript keeps what the user typed.
    const vaultText = hits.length
      ? `\n\nRelevant AI-Brain memory:\n${hits.map((c) => `[${c.title}: ${(c.background || '').slice(0, 200)}]`).join('\n')}`
      : ''
    const payload = {
      model: settings.model,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...prior.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: text + vaultText },
      ],
    }

    const controller = new AbortController()
    abortRef.current = controller
    let answer = ''
    let failed = null
    try {
      const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`Ollama answered HTTP ${res.status}. Is model "${settings.model}" pulled?`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let nl
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim()
          buffer = buffer.slice(nl + 1)
          if (!line) continue
          try {
            const json = JSON.parse(line)
            if (json.error) throw new Error(json.error)
            const piece = json.message?.content
            if (piece) {
              answer += piece
              patchChat(id, (c) => ({ messages: c.messages.map((m) => (m.id === asstId ? { ...m, content: answer } : m)) }))
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue // partial JSON line: wait for more bytes
            throw e
          }
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        answer = answer || '(stopped)'
      } else {
        failed = e.message
        answer = answer || `Could not get an answer: ${e.message}`
      }
    } finally {
      abortRef.current = null
      setBusy(false)
      patchChat(id, (c) => ({
        messages: c.messages.map((m) => (m.id === asstId ? { ...m, content: answer, streaming: false, error: !!failed } : m)),
      }))
    }

    // Save the whole transcript to AI-Brain (one file per chat, overwritten with the full text).
    if (!failed) {
      const transcript = [...prior, userMsg, { role: 'assistant', text: answer, at: new Date().toISOString() }]
        .map((m) => ({ role: m.role, text: m.content ?? m.text, timestamp: m.at }))
      vaultCapture({
        type: 'conversation',
        provider: 'AI ASSistant',
        conversation_id: id,
        title: text.slice(0, 60),
        messages: transcript,
        completeness: 'full',
        captured_at: new Date().toISOString(),
      }).catch(() => toast('AI-Brain vault is not running, so this chat was not saved to the vault'))
    }
  }

  const stop = () => abortRef.current?.abort()

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  const composer = (
    <div className="flex min-h-[112px] w-full flex-col justify-between rounded-[22px] border border-line bg-elev px-4 pb-2.5 pt-4 shadow-[0_1px_0_rgba(255,255,255,0.02)]" style={{ maxWidth: width }}>
      <textarea
        ref={taRef}
        value={input}
        rows={1}
        autoFocus
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={isEmpty ? 'How can I help you today?' : 'Reply…'}
        aria-label="Message AI ASSistant"
        className="block max-h-[200px] min-h-[28px] w-full resize-none bg-transparent text-[16px] leading-7 text-fg outline-none placeholder-fg3"
      />
      <div className="mt-2 flex items-center justify-between">
        <button type="button" aria-label="Attach (not available yet)" title="Attach (file/image upload is roadmap P5)" onClick={() => toast('File and image upload is not available yet (roadmap P5)')} className="flex h-8 w-8 items-center justify-center rounded-full text-fg2 hover:bg-hover">
          <Plus size={20} />
        </button>
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="Voice input (not available yet)" title="Voice input" onClick={() => toast('Voice input is not available yet')} className="flex h-8 w-8 items-center justify-center rounded-full text-fg2 hover:bg-hover">
            <Mic size={18} />
          </button>
          <button type="button" aria-label="Voice style" title="Voice" onClick={() => toast(`Voice: ${settings.voiceStyle}, ${settings.voiceSpeed} speed (speech output not wired yet)`)} className="flex h-8 items-center gap-0.5 rounded-full px-1.5 text-fg2 hover:bg-hover">
            <AudioLines size={18} />
            <ChevronDown size={13} className="text-fg3" />
          </button>
          {busy ? (
            <button type="button" onClick={stop} aria-label="Stop" className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-fg">
              <Square size={13} fill="currentColor" />
            </button>
          ) : input.trim() ? (
            <button type="button" onClick={send} aria-label="Send" className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-fg hover:opacity-90">
              <ArrowUp size={18} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )

  const belowComposer = (
    <div className="mt-2.5 flex w-full items-center justify-between text-[14px]" style={{ maxWidth: width }}>
      <button type="button" onClick={() => toast('Projects are not available yet')} className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-fg2 hover:bg-hover">
        <FolderOpen size={15} className="text-fg3" /> Project <ChevronDown size={14} className="text-fg3" />
      </button>
      <div className="relative flex items-center gap-3 text-[14px]">
        <ModelSelector
          open={modelOpen}
          setOpen={setModelOpen}
          value={settings.model}
          models={models}
          onPick={(m) => { patchSettings({ model: m }); setModelOpen(false) }}
          onRefresh={onRefreshModels}
        />
        <span className="cursor-default text-fg3" title="Effort (display only, not wired yet)">Medium</span>
        <span className="cursor-default text-fg3" title="Permission mode (display only, not wired yet)">Manual</span>
      </div>
    </div>
  )

  const hitsLine = hits.length > 0 && (
    <div className="mt-2 w-full text-[12.5px] text-fg3" style={{ maxWidth: width }}>
      AI-Brain memory: {hits.map((h) => h.title).join(' · ')}
    </div>
  )

  return (
    <main className="relative flex min-w-0 flex-1 flex-col bg-main">
      <div className="flex h-[100px] shrink-0 items-end justify-center">
        <div className="flex items-center gap-2 rounded-full bg-side px-4 py-1.5 text-[14px] text-fg3">
          <span>Free plan</span>
          <span>·</span>
          <button type="button" onClick={() => toast('AI ASSistant is free and local-only. No upgrade needed.')} className="text-link hover:underline">Upgrade</button>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex min-h-0 flex-1 flex-col items-center px-6 pt-[221px]">
          <div className="mb-8 flex items-center justify-center gap-3.5">
            <Starburst />
            <h1 className="font-serif text-[36px] leading-none tracking-[-0.2px] text-fg">{getGreeting()}, {USER.name}</h1>
          </div>
          <div className="flex w-full flex-col items-center px-2">
            {composer}
            {hitsLine}
            {belowComposer}
          </div>
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 justify-center overflow-y-auto">
            <div className="w-full px-6 pb-6 pt-4" style={{ maxWidth: width }}>
              <div className="space-y-7">
                {messages.map((m) => <Message key={m.id} m={m} settings={settings} />)}
              </div>
              <div ref={endRef} />
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center px-6 pb-4 pt-2">
            {composer}
            {hitsLine}
            {belowComposer}
          </div>
        </>
      )}
    </main>
  )
}

function Message({ m, settings }) {
  const font = settings.chatFont === 'sans' ? 'font-sans' : 'font-serif'
  const size = { fontSize: TEXT[settings.transcriptSize] || TEXT.medium }
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className={`max-w-[82%] whitespace-pre-wrap rounded-2xl bg-bubble px-4 py-2.5 leading-7 text-fg ${font}`} style={size}>
          {m.content}
        </div>
      </div>
    )
  }
  return (
    <div className={`flex gap-3 text-fg ${font}`} style={size}>
      <div className="mt-1.5 shrink-0"><Starburst size={18} spin={!!m.streaming} /></div>
      <div className="min-w-0 flex-1 leading-7">
        {m.streaming && !m.content ? (
          <span className="text-fg3">Thinking…</span>
        ) : (
          <Formatted text={m.content} />
        )}
        {m.error && <div className="mt-2 text-[13px] text-[#ef5350]">Check that Ollama is running and the model is pulled.</div>}
      </div>
    </div>
  )
}

// Minimal formatting: fenced code blocks are shown in <pre>, everything else keeps line breaks.
function Formatted({ text }) {
  const parts = (text || '').split(/```/)
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? (
        <pre key={i} className="my-3 overflow-x-auto rounded-xl border border-line bg-side p-3 font-mono text-[13px] leading-6 text-fg">{part.replace(/^[a-zA-Z0-9]*\n/, '')}</pre>
      ) : (
        <span key={i} className="whitespace-pre-wrap">{part}</span>
      )))}
    </>
  )
}

function ModelSelector({ open, setOpen, value, models, onPick, onRefresh }) {
  return (
    <>
      <button
        type="button"
        onClick={() => { if (!open) onRefresh(); setOpen(!open) }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-md px-1 py-0.5 text-fg2 hover:bg-hover"
        title="Choose a local Ollama model"
      >
        {value} <ChevronDown size={14} className="text-fg3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={() => setOpen(false)} />
          <div role="listbox" className="absolute bottom-full right-0 z-50 mb-2 w-[260px] rounded-xl border border-line bg-elev p-1.5 text-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
            <div className="px-2.5 pb-1.5 pt-1 text-[12px] uppercase tracking-wide text-fg3">Ollama models</div>
            {models.list.map((m) => (
              <button key={m} type="button" role="option" aria-selected={m === value} onClick={() => onPick(m)} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-fg hover:bg-hover">
                <span className="truncate">{m}</span>
                {m === value && <Check size={15} className="shrink-0 text-fg2" />}
              </button>
            ))}
            {models.error && <div className="px-2.5 py-2 text-[12.5px] text-fg3">{models.error}</div>}
            <button type="button" onClick={onRefresh} className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-fg3 hover:bg-hover">
              <RefreshCw size={13} /> Refresh list
            </button>
          </div>
        </>
      )}
    </>
  )
}

// The orange "✳" mark from the screenshots (eight rounded spokes).
export function Starburst({ size = 36, spin = false }) {
  const spokes = [0, 45, 90, 135]
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className={spin ? 'spin-star' : ''} style={{ color: 'var(--accent)' }}>
      <g fill="currentColor">
        {spokes.map((a) => (
          <rect key={a} x="17.6" y="3" width="4.8" height="34" rx="2.4" transform={`rotate(${a} 20 20)`} />
        ))}
      </g>
    </svg>
  )
}
