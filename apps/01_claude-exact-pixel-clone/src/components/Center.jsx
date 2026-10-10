import { useState, useEffect, useRef } from 'react'
import { Plus, Mic, ChevronDown, ArrowUp, Bell, Minus, Square, X, Package, Folder } from 'lucide-react'
import ModelSelector from './ModelSelector.jsx'
import { extractArtifacts } from '../lib/artifacts.js'
import { getGreeting, todayLabel, TRANSCRIPT_SIZE, TRANSCRIPT_WIDTH } from '../lib/defaults.js'

export function ClaudeLogo({ size = 20 }) {
  const spokes = Array.from({ length: 12 }, (_, i) => i * 30)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
      {spokes.map(a => (
        <rect key={a} x="11.15" y="1.5" width="1.7" height="8.5" rx="0.85" fill="var(--accent)" transform={`rotate(${a} 12 12)`} />
      ))}
    </svg>
  )
}

function Waveform({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="6" width="1.6" height="4" rx="0.8" />
      <rect x="4" y="4" width="1.6" height="8" rx="0.8" />
      <rect x="7" y="2" width="1.6" height="12" rx="0.8" />
      <rect x="10" y="5" width="1.6" height="6" rx="0.8" />
      <rect x="13" y="7" width="1.6" height="2" rx="0.8" />
    </svg>
  )
}

// Top-level so the textarea keeps focus across re-renders.
function Composer({ input, setInput, send, widthCls, placeholder }) {
  return (
    <div className={`w-full ${widthCls} bg-[var(--bg-el)] border border-[var(--bd2)] rounded-2xl p-4 shadow-sm`}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        placeholder={placeholder}
        rows={Math.min(8, Math.max(1, input.split('\n').length))}
        className="w-full bg-transparent resize-none outline-none text-[15px] leading-6 text-[var(--tx)] placeholder-[var(--tx3)]"
      />
      <div className="flex items-center justify-between mt-2">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--tx2)] hover:bg-[var(--bg-hover)]" title="Add files (P5 upload)">
          <Plus size={18} />
        </button>
        <div className="flex items-center gap-2">
          {input.trim() && (
            <button onClick={send} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#e6e6e6]" title="Send">
              <ArrowUp size={17} />
            </button>
          )}
          <button className="p-1.5 rounded-md text-[var(--tx2)] hover:text-[var(--tx)]" title="Voice (see Settings)"><Mic size={17} /></button>
          <button className="p-1.5 rounded-md text-[var(--tx2)] hover:text-[var(--tx)] flex items-center gap-1" title="Voice mode">
            <Waveform size={16} /> <ChevronDown size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Center({ settings, chats, setChats, currentChat, setCurrentChat, messages, updateMessages, onOpenArtifact, artifacts }) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState(() => localStorage.getItem('selected_model') || 'qwen2.5:3b')
  const endRef = useRef(null)

  useEffect(() => { localStorage.setItem('selected_model', model) }, [model])
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: settings.motion === 'Reduced' ? 'auto' : 'smooth' })
  }, [messages, isLoading, settings.motion])

  const sizeCls = TRANSCRIPT_SIZE[settings.transcriptSize] || TRANSCRIPT_SIZE.Medium
  const widthCls = TRANSCRIPT_WIDTH[settings.width] || TRANSCRIPT_WIDTH.Medium
  const fontCls = settings.chatFont === 'Anthropic Serif' ? 'serif' : ''

  async function cookPrompt() {
    if (input.trim().length < 3) return
    try {
      const res = await fetch(`http://127.0.0.1:8765/context?q=${encodeURIComponent(input.slice(-80))}`)
      if (!res.ok) return
      const data = await res.json()
      const caps = (data.capsules || []).slice(0, 3)
      if (!caps.length) return
      const block = '\n\n[Vault memory:\n' + caps.map(c => `- ${c.title}: ${(c.background || '').slice(0, 180)}`).join('\n') + '\n]'
      setInput(v => v + block)
    } catch {}
  }

  async function send() {
    if (!input.trim() || isLoading) return
    const userMsg = input.trim()

    let chatId = currentChat
    if (!chatId) {
      chatId = 'c' + Date.now()
      const nc = { id: chatId, title: userMsg.slice(0, 48), date: todayLabel() }
      setChats(p => [nc, ...p])
      setCurrentChat(chatId)
    }

    const userMessage = { role: 'user', content: userMsg, id: 'm' + Date.now() }
    updateMessages(chatId, prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // fire-and-forget vault capture of the user turn
    try {
      await fetch('http://127.0.0.1:8765/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'conversation', provider: 'AI ASSistant', title: userMsg.slice(0, 50),
          messages: [{ role: 'user', text: userMsg, timestamp: new Date().toISOString() }],
          completeness: 'full', captured_at: new Date().toISOString(),
        }),
      })
    } catch {}

    // relevant vault context (auto, read-only)
    let vaultInjection = ''
    try {
      const res = await fetch(`http://127.0.0.1:8765/context?q=${encodeURIComponent(userMsg.slice(-80))}`)
      if (res.ok) {
        const data = await res.json()
        const caps = (data.capsules || []).slice(0, 3)
        if (caps.length) vaultInjection = '\n\nRelevant vault memory:\n' + caps.map(c => `[${c.title}: ${(c.background || '').slice(0, 200)}]`).join('\n') + '\n'
      }
    } catch {}

    const assistantId = 'm' + (Date.now() + 1)
    updateMessages(chatId, prev => [...prev, { role: 'assistant', content: '', id: assistantId }])

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are AI ASSistant, a helpful local AI. Use AI-Brain vault as memory when provided. Prefer simple step-by-step answers. User is Utso. Only create code, games or HTML artifacts when explicitly asked.' },
            ...history,
            { role: 'user', content: userMsg + vaultInjection },
          ],
          stream: true,
        }),
      })
      if (!res.ok) throw new Error('Ollama not responding')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const json = JSON.parse(line)
            if (json.message?.content) {
              assistantContent += json.message.content
              const snapshot = assistantContent
              updateMessages(chatId, prev => prev.map(m => (m.id === assistantId ? { ...m, content: snapshot } : m)))
            }
          } catch {}
        }
      }
      // capture the finished exchange
      try {
        await fetch('http://127.0.0.1:8765/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'conversation', provider: 'AI ASSistant', title: userMsg.slice(0, 50),
            messages: [
              { role: 'user', text: userMsg, timestamp: new Date().toISOString() },
              { role: 'assistant', text: assistantContent, timestamp: new Date().toISOString() },
            ],
            completeness: 'full', captured_at: new Date().toISOString(),
          }),
        })
      } catch {}
    } catch (e) {
      updateMessages(chatId, prev => prev.map(m => (m.id === assistantId
        ? { ...m, content: `Error: ${e.message}. Check Ollama at 127.0.0.1:11434 (setx OLLAMA_ORIGINS "*" then restart Ollama if CORS).` }
        : m)))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* top bar */}
      <div className="relative h-12 shrink-0 flex items-center justify-end px-3 gap-1">
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[var(--bg-elup)] rounded-full px-4 py-1.5 text-[13px]">
          <span className="text-[var(--tx2)]">Free plan</span>
          <span className="text-[var(--tx3)]">·</span>
          <button className="text-[var(--link)] underline">Upgrade</button>
        </div>
        <button className="p-1.5 rounded-md text-[var(--tx2)] hover:text-[var(--tx)]" title="Notifications"><Bell size={17} /></button>
        <button className="p-1.5 rounded-md text-[var(--tx2)] hover:text-[var(--tx)]" title="Minimize"><Minus size={17} /></button>
        <button className="p-1.5 rounded-md text-[var(--tx2)] hover:text-[var(--tx)]" title="Maximize"><Square size={14} /></button>
        <button className="p-1.5 rounded-md text-[var(--tx2)] hover:text-[var(--tx)]" title="Close"><X size={17} /></button>
      </div>

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className={`flex items-center gap-3 mb-8 ${fontCls}`}>
            <ClaudeLogo size={34} />
            <h1 className="text-[32px] text-[var(--tx)]">{getGreeting()}, Utso</h1>
          </div>
          <Composer input={input} setInput={setInput} send={send} widthCls={widthCls} placeholder="How can I help you today?" />
          <div className={`w-full ${widthCls} flex items-center justify-between mt-3 text-[13px]`}>
            <button className="flex items-center gap-1.5 text-[var(--tx2)] hover:text-[var(--tx)]">
              <Folder size={14} /> Project <ChevronDown size={13} />
            </button>
            <ModelSelector model={model} setModel={setModel} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className={`w-full ${widthCls} mx-auto px-6 py-8 space-y-6`}>
            {messages.map(m => {
              const arts = m.role === 'assistant' ? extractArtifacts(m.content) : []
              return (
                <div key={m.id}>
                  {m.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="bg-[var(--bubble)] rounded-2xl px-4 py-2.5 max-w-[80%] text-[15px] leading-6 whitespace-pre-wrap text-[var(--tx)]">{m.content}</div>
                    </div>
                  ) : (
                    <div className={`${sizeCls} whitespace-pre-wrap text-[var(--tx)]`}>
                      {m.content || '…'}
                      {arts.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {arts.map(a => (
                            <button
                              key={a.id}
                              onClick={() => onOpenArtifact(a)}
                              className="flex items-center gap-2 rounded-lg border border-[var(--bd2)] bg-[var(--bg-el)] px-3 py-1.5 text-[13px] text-[var(--tx)] hover:bg-[var(--bg-hover)]"
                            >
                              <Package size={14} className="text-[var(--accent)]" /> {a.title} <span className="text-[var(--tx3)]">HTML</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {isLoading && (
              <div className="flex items-center gap-2 text-[var(--tx2)] text-[14px]">
                <ClaudeLogo size={18} /> Thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="sticky bottom-0 bg-[var(--bg-main)] px-6 pb-4 pt-2">
            <div className="mx-auto flex flex-col items-center">
              <Composer input={input} setInput={setInput} send={send} widthCls={widthCls} placeholder="Reply…" />
              <div className={`w-full ${widthCls} flex items-center justify-between mt-2 text-[12px] text-[var(--tx3)]`}>
                <button onClick={cookPrompt} className="rounded-full border border-[var(--bd2)] px-3 py-1 hover:bg-[var(--bg-hover)] hover:text-[var(--tx)]" title="Enhance prompt with relevant vault memory">
                  Cook This Prompt
                </button>
                <ModelSelector model={model} setModel={setModel} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
