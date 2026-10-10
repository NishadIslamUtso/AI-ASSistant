import { useState, useEffect, useRef } from 'react'
import { ArrowUp, ExternalLink } from 'lucide-react'
import {
  createHtmlArtifact,
  extractExplicitHtmlArtifact,
  isExplicitArtifactRequest,
} from '../lib/artifacts.js'

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function Composer({ input, setInput, onSend, isLoading, placeholder, compact = false }) {
  return (
    <div className="w-full rounded-xl border border-[#333] bg-[#242424] p-3">
      <textarea
        value={input}
        onChange={event => setInput(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            onSend()
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-h-[42px] max-h-[200px] w-full resize-y bg-transparent text-[15px] leading-6 text-[#e0e0e0] outline-none placeholder-[#777]"
        rows={compact ? 1 : 2}
      />
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full border border-[#3a3a3a] bg-[#2a2a2a] text-lg leading-none text-[#aaa] hover:bg-[#353535]" aria-label="Add attachment" title="Add attachment">+</button>
          <span className="text-[#777]" aria-hidden="true">🎤 〰</span>
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={!input.trim() || isLoading}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition hover:bg-[#ddd] disabled:cursor-not-allowed disabled:bg-[#555] disabled:text-[#999]"
          title="Send message"
          aria-label="Send message"
        >
          <ArrowUp size={17} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

export default function Center({
  chats,
  currentChat,
  messages,
  setMessages,
  setChats,
  showVault,
  setShowVault,
  onArtifactCreated,
  onOpenArtifact,
}) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [vaultContext, setVaultContext] = useState([])
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (input.length < 3) {
      setVaultContext([])
      return
    }
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/context?q=${encodeURIComponent(input.slice(-80))}`)
        if (response.ok) {
          const data = await response.json()
          setVaultContext((data.capsules || []).slice(0, 3))
        }
      } catch {
        setVaultContext([])
      }
    }, 500)
    return () => window.clearTimeout(timer)
  }, [input])

  async function send() {
    const userMsg = input.trim()
    if (!userMsg || isLoading) return

    const artifactRequest = isExplicitArtifactRequest(userMsg)
    const userMessage = { role: 'user', content: userMsg, id: createMessageId() }
    const assistantId = createMessageId()
    const contextForRequest = vaultContext
    setMessages(previous => [...previous, userMessage])
    setInput('')
    setVaultContext([])
    setIsLoading(true)

    let assistantContent = ''
    let assistantAdded = false

    try {
      try {
        await fetch('/api/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'conversation',
            provider: 'AI ASSistant',
            title: userMsg.slice(0, 50),
            messages: [{ role: 'user', text: userMsg, timestamp: new Date().toISOString() }],
            completeness: 'full',
            captured_at: new Date().toISOString(),
          }),
        })
      } catch {
        // Chat remains usable when the optional local vault API is unavailable.
      }

      const vaultInjection = contextForRequest.length
        ? `\n\nRelevant vault memory:\n${contextForRequest.map(item => `[${item.title}: ${item.background?.slice(0, 200) || ''}]`).join('\n')}\n`
        : ''
      const systemPrompt = [
        'You are AI ASSistant, a helpful local assistant. Use supplied vault memory only when it is relevant.',
        'Answer ordinary questions normally. Never turn a greeting or a general question into a game, app, website, or code artifact.',
        'Do not generate runnable HTML or an artifact unless the user directly asks you to create one.',
        'When the user explicitly asks for a runnable webpage, app, game, or similar visual artifact, return one complete, self-contained HTML document in a single fenced html code block.',
        'For that HTML, use inline CSS and JavaScript, and do not depend on external websites, scripts, fonts, packages, or network requests.',
      ].join(' ')
      const model = localStorage.getItem('selected_model') || 'qwen2.5:3b'
      const response = await fetch('/ollama/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-20).map(message => ({ role: message.role, content: message.content })),
            { role: 'user', content: userMsg + vaultInjection },
          ],
          stream: true,
        }),
      })

      if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}`)
      if (!response.body) throw new Error('Ollama did not return a response stream')

      setMessages(previous => [...previous, { role: 'assistant', content: '', id: assistantId }])
      assistantAdded = true

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      function consumeLine(line) {
        if (!line.trim()) return
        const event = JSON.parse(line)
        if (event.error) throw new Error(event.error)
        const fragment = event.message?.content
        if (fragment) {
          assistantContent += fragment
          setMessages(previous => previous.map(message =>
            message.id === assistantId ? { ...message, content: assistantContent } : message,
          ))
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) consumeLine(line)
      }
      buffer += decoder.decode()
      if (buffer.trim()) consumeLine(buffer)
      if (!assistantContent.trim()) throw new Error('The model returned an empty response')

      const extracted = artifactRequest ? extractExplicitHtmlArtifact(assistantContent, userMsg) : null
      if (extracted) {
        const artifact = createHtmlArtifact(extracted.html)
        onArtifactCreated?.(artifact)
        const reply = extracted.remaining || `Created “${artifact.title}” as an HTML application and opened its preview in Artifacts.`
        setMessages(previous => previous.map(message =>
          message.id === assistantId ? { ...message, content: reply, artifactId: artifact.id } : message,
        ))
      }
    } catch (error) {
      const errorMessage = `Error: ${error.message}. Check that Ollama is running and the selected local model is installed.`
      if (assistantAdded) {
        setMessages(previous => previous.map(message =>
          message.id === assistantId ? { ...message, content: errorMessage } : message,
        ))
      } else {
        setMessages(previous => [...previous, { role: 'assistant', content: errorMessage, id: assistantId }])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const greeting = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'

  return (
    <div className="flex h-screen min-w-0 flex-1 flex-col bg-[#1a1a1a]">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#2a2a2a] px-4">
        <div />
        <div className="flex items-center gap-2 rounded-full bg-[#202020] px-3 py-1 text-xs">
          <span className="text-[#aaa]">Free plan</span>
          <button type="button" className="text-[#83aaff] hover:underline">Upgrade</button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6">
            <div className="mb-7 flex items-center gap-3">
              <span className="text-[34px] leading-none text-[#ed8863]" aria-hidden="true">✳</span>
              <h1 className="serif text-[32px] font-normal text-[#e8e5e2]">{greeting}, Utso.</h1>
            </div>
            <Composer input={input} setInput={setInput} onSend={send} isLoading={isLoading} placeholder="How can I help you today?" />
            <div className="mt-3 flex w-full items-center justify-between px-3 text-xs text-[#888]">
              <button type="button" className="hover:text-[#ccc]">Project⌄</button>
              <div className="flex gap-3"><span>Sonnet 5.5</span><span>Medium</span><span>Manual</span></div>
            </div>
          </div>
        ) : (
          <div className="flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
            <div className="flex-1 space-y-6">
              {messages.map(message => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'assistant' && <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ed8863] text-[10px] text-[#201814]">✳</div>}
                  <div className={`min-w-0 ${message.role === 'user' ? 'max-w-[80%] rounded-2xl bg-[#2a2a2a] px-4 py-2' : 'flex-1'} text-[15px] leading-6`}>
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    {message.artifactId && (
                      <button
                        type="button"
                        onClick={() => onOpenArtifact?.(message.artifactId)}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#3a3a3a] bg-[#242424] px-3 py-2 text-xs text-[#d7d7d7] transition hover:border-[#555] hover:bg-[#2b2b2b]"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#333]">&lt;/&gt;</span>
                        Open HTML Application preview
                        <ExternalLink size={13} className="text-[#888]" />
                      </button>
                    )}
                  </div>
                  {message.role === 'user' && <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#c4a484] text-xs text-black">N</div>}
                </div>
              ))}
              {isLoading && <div className="flex gap-3"><div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ed8863] text-[10px] text-[#201814]">✳</div><div className="text-sm text-[#777]">Thinking…</div></div>}
              <div ref={endRef} />
            </div>
            <div className="sticky bottom-0 mt-5 bg-[#1a1a1a] pt-3">
              {vaultContext.length > 0 && (
                <div className="mb-2 truncate px-2 text-[11px] text-[#777]" title="Relevant local vault context is ready">Local vault context ready · {vaultContext.length} item{vaultContext.length === 1 ? '' : 's'}</div>
              )}
              <Composer input={input} setInput={setInput} onSend={send} isLoading={isLoading} placeholder="Reply…" compact />
              <div className="mt-2 flex justify-between px-1 text-[11px] text-[#666]"><span>{localStorage.getItem('selected_model') || 'qwen2.5:3b'}</span><button type="button" className="hover:text-[#aaa]">Cook This Prompt</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
