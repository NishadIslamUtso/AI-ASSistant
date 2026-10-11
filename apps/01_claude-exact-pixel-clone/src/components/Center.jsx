import { useEffect, useRef, useState } from 'react'
import { Code2, FileText, GitBranch, Image, PencilLine, RefreshCw, X } from 'lucide-react'
import ClaudeMark from './ClaudeMark.jsx'
import Composer from './Composer.jsx'
import Markdown from './Markdown.jsx'
import ThinkingDisplay from './ThinkingDisplay.jsx'
import ArtifactInlinePreview from './ArtifactInlinePreview.jsx'
import { buildEditPrompt, MAX_PINNED_EXCERPT } from '../lib/edit-pin.js'

export function getGreeting(date = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', hour: 'numeric', hourCycle: 'h23' }).format(date))
  return hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'
}

export default function Center({ seed, chat, onArtifact, onRetryCapture, onBranch, onPinToEdit, settings, notify, onExternalLink, ...composerProps }) {
  const transcript = useRef(null)
  const [selected, setSelected] = useState(null)
  const [pinning, setPinning] = useState(null)
  const messages = chat?.messages || []

  useEffect(() => {
    const element = transcript.current
    if (element && element.scrollHeight - element.scrollTop - element.clientHeight < 260) {
      element.scrollTo({ top: element.scrollHeight, behavior: settings.motion === 'Reduced' ? 'instant' : 'smooth' })
    }
  }, [messages, settings.motion])

  function captureSelection(event, message) {
    if (event.target.closest?.('.edit-pin, button, textarea, input')) return
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.rangeCount) return
    const body = event.currentTarget.querySelector('.message-body')
    const range = selection.getRangeAt(0)
    if (!body?.contains(range.commonAncestorContainer)) return
    const excerpt = selection.toString().trim()
    if (!excerpt) return
    if (excerpt.length > MAX_PINNED_EXCERPT) {
      setSelected(null)
      notify(`Select no more than ${MAX_PINNED_EXCERPT.toLocaleString()} characters at a time.`)
      return
    }
    setSelected({ messageId: message.id, excerpt })
  }

  function addPinToDraft() {
    try {
      onPinToEdit(buildEditPrompt(pinning.excerpt, pinning.note))
      setSelected(null)
      setPinning(null)
      window.getSelection()?.removeAllRanges()
    } catch (error) { notify(error.message) }
  }

  const hasMessages = messages.length > 0
  return <main className={`center ${hasMessages ? 'has-messages' : 'home'}`} data-model-ready={composerProps.models.available}>
    {!hasMessages && <div className="free-plan"><span>Free plan</span><span>·</span><button onClick={() => notify('This is a free local Ollama app. Claude plans and billing are not connected.')}>Upgrade</button></div>}
    {hasMessages ? <>
      <header className="chat-header"><h1>{chat.title}</h1><small>{chat.parentChatId ? 'Local branch' : 'Local'} · {composerProps.models.model}</small></header>
      <div className="transcript-scroll" ref={transcript}><div className="transcript" key={chat.id}>
        {messages.map((message, index) => <article
          key={message.id}
          className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          aria-label={message.role === 'user' ? 'Your message' : 'Assistant response'}
          onMouseUp={event => captureSelection(event, message)}
          onTouchEnd={event => captureSelection(event, message)}
        >
          {message.role === 'assistant' && <ClaudeMark size={23} />}
          <div className="message-body">
            <ThinkingDisplay thinking={message.thinking} streaming={message.status === 'streaming'} />
            {message.role === 'user' ? <div className="user-text">{message.content}</div> : <Markdown onExternalLink={onExternalLink}>{message.content}</Markdown>}
            {message.attachments?.length > 0 && <div className="sent-attachments">{message.attachments.map(file => <span key={file.id}>{file.kind === 'image' ? <Image size={13} /> : <FileText size={13} />}{file.name}</span>)}</div>}
            {message.context && <details className="sent-context"><summary>Included vault context</summary><pre>{message.context}</pre></details>}
            {message.status === 'streaming' && !message.content && !message.thinking && <p className="generating">Responding locally…</p>}
            {message.error && <p className={message.status === 'error' ? 'error-text response-error' : 'muted'} role={message.status === 'error' ? 'alert' : undefined}>{message.error}</p>}
            {message.artifacts?.map(artifact => <section key={artifact.id} className="artifact-message">
              <button className="artifact-message-card" onClick={() => onArtifact(artifact.id)}>
                <Code2 size={20} /><span><strong>{artifact.title}</strong><small>{artifact.type === 'html' ? 'HTML Application' : 'SVG Image'} · Open full workbench</small></span>
              </button>
              <ArtifactInlinePreview artifact={artifact} />
            </section>)}
            <div className="message-actions" aria-label={`Actions for message ${index + 1}`}>
              {selected?.messageId === message.id && <button onClick={() => { setPinning({ ...selected, note: '' }); setSelected(null) }}><PencilLine size={13} />Pin selection to edit</button>}
              {message.status !== 'streaming' && <button aria-label={`Branch from message ${index + 1}`} title="Create a local conversation branch from this point" onClick={() => onBranch(message.id)}><GitBranch size={13} />Branch here</button>}
            </div>
            {pinning?.messageId === message.id && <aside className="edit-pin" aria-label="Pin excerpt to edit">
              <header><strong>Pin selection to edit</strong><button className="icon-button" aria-label="Cancel pinned edit" onClick={() => setPinning(null)}><X size={14} /></button></header>
              <blockquote>{pinning.excerpt}</blockquote>
              <label>Optional edit comment<textarea aria-label="Optional edit comment" placeholder="What should change? This stays in the draft until you send it." value={pinning.note} maxLength={1000} onChange={event => setPinning(value => ({ ...value, note: event.target.value }))} /></label>
              <footer><button className="secondary-button" onClick={() => setPinning(null)}>Cancel</button><button className="white-button" onClick={addPinToDraft}>Add to draft</button></footer>
            </aside>}
          </div>
        </article>)}
      </div></div>
      <div className="reply-composer"><Composer chat={chat} notify={notify} seed={seed} {...composerProps} />
        <div className="chat-save-status">{chat.vaultStatus === 'saved' ? 'Saved in local chat history and AI-Brain' : chat.vaultStatus === 'saving' ? 'Saving to AI-Brain…' : chat.vaultStatus === 'error' ? <><span title={chat.vaultError}>Local chat kept · vault capture failed</span><button onClick={() => onRetryCapture(chat)}><RefreshCw size={11} />Retry</button></> : 'Local chat history · check important answers'}</div>
      </div>
    </> : <div className="home-content"><div className="greeting"><ClaudeMark size={28} /><h1>{getGreeting()}, Utso</h1></div><Composer chat={chat} notify={notify} seed={seed} {...composerProps} /></div>}
  </main>
}
