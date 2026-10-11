import { useEffect, useRef } from 'react'
import { Code2, FileText, Image, RefreshCw } from 'lucide-react'
import ClaudeMark from './ClaudeMark.jsx'
import Composer from './Composer.jsx'
import Markdown from './Markdown.jsx'
import ThinkingDisplay from './ThinkingDisplay.jsx'
export function getGreeting(date = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', hour: 'numeric', hourCycle: 'h23' }).format(date))
  return hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'
}
export default function Center({ seed, chat, onArtifact, onRetryCapture, settings, notify, onExternalLink, ...composerProps }) {
  const transcript = useRef(null)
  const messages = chat?.messages || []
  useEffect(() => {
    const element = transcript.current
    if (element && element.scrollHeight - element.scrollTop - element.clientHeight < 260) element.scrollTo({ top: element.scrollHeight, behavior: settings.motion === 'Reduced' ? 'instant' : 'smooth' })
  }, [messages, settings.motion])
  const hasMessages = messages.length > 0
  return <main className={`center ${hasMessages ? 'has-messages' : 'home'}`} data-model-ready={composerProps.models.available}>
    {!hasMessages && <div className="free-plan"><span>Free plan</span><span>·</span><button onClick={() => notify('This is a free local Ollama app. Claude plans and billing are not connected.')}>Upgrade</button></div>}
    {hasMessages ? <>
      <header className="chat-header"><h1>{chat.title}</h1><small>Local · {composerProps.models.model}</small></header>
      <div className="transcript-scroll" ref={transcript}><div className="transcript" key={chat.id}>
        {messages.map(message => <article key={message.id} className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`} aria-label={message.role === 'user' ? 'Your message' : 'Assistant response'}>
          {message.role === 'assistant' && <ClaudeMark size={23} />}
          <div className="message-body"><ThinkingDisplay thinking={message.thinking} streaming={message.status === 'streaming'} />
            {message.role === 'user' ? <div className="user-text">{message.content}</div> : <Markdown onExternalLink={onExternalLink}>{message.content}</Markdown>}
            {message.attachments?.length > 0 && <div className="sent-attachments">{message.attachments.map(file => <span key={file.id}>{file.kind === 'image' ? <Image size={13} /> : <FileText size={13} />}{file.name}</span>)}</div>}
            {message.context && <details className="sent-context"><summary>Included vault context</summary><pre>{message.context}</pre></details>}
            {message.status === 'streaming' && !message.content && !message.thinking && <p className="generating">Responding locally…</p>}
            {message.error && <p className={message.status === 'error' ? 'error-text response-error' : 'muted'} role={message.status === 'error' ? 'alert' : undefined}>{message.error}</p>}
            {message.artifacts?.map(artifact => <button key={artifact.id} className="artifact-message-card" onClick={() => onArtifact(artifact.id)}><Code2 size={20} /><span><strong>{artifact.title}</strong><small>{artifact.type === 'html' ? 'HTML Application' : 'SVG Image'} · Open preview</small></span></button>)}
          </div>
        </article>)}
      </div></div>
      <div className="reply-composer"><Composer chat={chat} notify={notify} seed={seed} {...composerProps} />
        <div className="chat-save-status">{chat.vaultStatus === 'saved' ? 'Saved in local chat history and AI-Brain' : chat.vaultStatus === 'saving' ? 'Saving to AI-Brain…' : chat.vaultStatus === 'error' ? <><span title={chat.vaultError}>Local chat kept · vault capture failed</span><button onClick={() => onRetryCapture(chat)}><RefreshCw size={11} />Retry</button></> : 'Local chat history · check important answers'}</div>
      </div>
    </> : <div className="home-content"><div className="greeting"><ClaudeMark size={28} /><h1>{getGreeting()}, Utso</h1></div><Composer chat={chat} notify={notify} seed={seed} {...composerProps} /></div>}
  </main>
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
