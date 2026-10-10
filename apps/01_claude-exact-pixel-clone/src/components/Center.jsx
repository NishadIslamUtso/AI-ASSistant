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
export default function Center({ chat, onArtifact, onRetryCapture, settings, notify, onExternalLink, ...composerProps }) {
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
      <div className="reply-composer"><Composer chat={chat} notify={notify} {...composerProps} />
        <div className="chat-save-status">{chat.vaultStatus === 'saved' ? 'Saved in local chat history and AI-Brain' : chat.vaultStatus === 'saving' ? 'Saving to AI-Brain…' : chat.vaultStatus === 'error' ? <><span title={chat.vaultError}>Local chat kept · vault capture failed</span><button onClick={() => onRetryCapture(chat)}><RefreshCw size={11} />Retry</button></> : 'Local chat history · check important answers'}</div>
      </div>
    </> : <div className="home-content"><div className="greeting"><ClaudeMark size={28} /><h1>{getGreeting()}, Utso</h1></div><Composer chat={chat} notify={notify} {...composerProps} /></div>}
  </main>
}
