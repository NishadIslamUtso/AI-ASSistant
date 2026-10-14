import { useEffect, useMemo, useRef } from 'react'
import { Code2, FileText, GitBranch, Image, RefreshCw } from 'lucide-react'
import BrainMark from './BrainMark.jsx'
import Composer from './Composer.jsx'
import Markdown from './Markdown.jsx'
import ThinkingDisplay from './ThinkingDisplay.jsx'
import { firstName } from '../lib/profile.js'

/** Pull the first fenced ```svg block out of a reply so it can render inline. */
export function extractSvgBlock(text = '') {
  const match = /```svg\s*\n([\s\S]*?)```/i.exec(text)
  if (!match) return ''
  const svg = match[1].trim()
  return /^<svg[\s>]/i.test(svg) ? svg : ''
}
export function getGreeting(date = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', hour: 'numeric', hourCycle: 'h23' }).format(date))
  return hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'
}
export default function Center({ seed, chat, onArtifact, onRetryCapture, settings, notify, onExternalLink, onBranch, onNavigateBranch, profile, ...composerProps }) {
  const transcript = useRef(null)
  const messages = chat?.messages || []
  const branches = chat?.branches || []
  useEffect(() => {
    const element = transcript.current
    if (element && element.scrollHeight - element.scrollTop - element.clientHeight < 260) element.scrollTo({ top: element.scrollHeight, behavior: settings.motion === 'Reduced' ? 'instant' : 'smooth' })
  }, [messages, settings.motion])
  const hasMessages = messages.length > 0
  return <main className={`center ${hasMessages ? 'has-messages' : 'home'}`} data-model-ready={composerProps.models.available}>
    {!hasMessages && <div className="free-plan"><span>Free plan</span><span>·</span><button onClick={() => notify('This is a free local Ollama app. No plan or billing is connected.')}>Upgrade</button></div>}
    {hasMessages ? <>
      <header className="chat-header"><h1>{chat.title}</h1><small>Local · {composerProps.models.model}</small>
        {branches.length > 1 && <label className="branch-picker" title="Switch between branches of this conversation">
          <GitBranch size={12} />
          <select value={chat.id} onChange={event => event.target.value !== chat.id && onNavigateBranch(event.target.value)}>
            {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.label}</option>)}
          </select>
        </label>}
      </header>
      <div className="transcript-scroll" ref={transcript}><div className="transcript" key={chat.id}>
        {messages.map(message => <article key={message.id} className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`} aria-label={message.role === 'user' ? 'Your message' : 'Assistant response'}>
          {message.role === 'assistant' && <BrainMark size={23} />}
          <div className="message-body"><ThinkingDisplay thinking={message.thinking} streaming={message.status === 'streaming'} />
            {message.role === 'user' ? <div className="user-text">{message.content}</div> : <Markdown onExternalLink={onExternalLink}>{message.content}</Markdown>}
            {message.attachments?.length > 0 && <div className="sent-attachments">{message.attachments.map(file => <span key={file.id}>{file.kind === 'image' ? <Image size={13} /> : <FileText size={13} />}{file.name}</span>)}</div>}
            {message.context && <details className="sent-context"><summary>Included vault context</summary><pre>{message.context}</pre></details>}
            {message.status === 'streaming' && !message.content && !message.thinking && <p className="generating">Responding locally…</p>}
            {message.error && <p className={message.status === 'error' ? 'error-text response-error' : 'muted'} role={message.status === 'error' ? 'alert' : undefined}>{message.error}</p>}
            {message.artifacts?.map(artifact => <button key={artifact.id} className="artifact-message-card" onClick={() => onArtifact(artifact.id)}><Code2 size={20} /><span><strong>{artifact.title}</strong><small>{artifact.type === 'html' ? 'HTML Application' : 'SVG Image'} · Open preview</small></span></button>)}
            {message.role === 'assistant' && message.status === 'done' && <InlineSvg text={message.content} />}
            {message.visionBridged && <p className="bridge-note"><Image size={11} />Answered by {message.model}{message.requestedModel ? ` · vision bridge from ${message.requestedModel}` : ''}</p>}
            {message.citations?.length > 0 && <ul className="citations">{message.citations.map(source => <li key={source.id}><button onClick={() => onExternalLink?.(source.url)}>{source.label || source.url}</button></li>)}</ul>}
            {message.role === 'assistant' && message.status === 'done' && <div className="message-actions"><button onClick={() => onBranch(message.id)} title="Branch a new conversation from this reply"><GitBranch size={12} />Branch off here</button></div>}
          </div>
        </article>)}
      </div></div>
      <div className="reply-composer"><Composer chat={chat} notify={notify} seed={seed} {...composerProps} />
        <div className="chat-save-status">{chat.vaultStatus === 'saved' ? 'Saved in local chat history and AI-Brain' : chat.vaultStatus === 'saving' ? 'Saving to AI-Brain…' : chat.vaultStatus === 'error' ? <><span title={chat.vaultError}>Local chat kept · vault capture failed</span><button onClick={() => onRetryCapture(chat)}><RefreshCw size={11} />Retry</button></> : 'Local chat history · check important answers'}</div>
      </div>
    </> : <div className="home-content"><div className="greeting"><BrainMark size={28} /><h1>{getGreeting()}, {firstName(profile.name)}</h1></div><Composer chat={chat} notify={notify} seed={seed} {...composerProps} /></div>}
  </main>
}

/** Render a fenced SVG reply directly in the transcript — no download step. */
function InlineSvg({ text }) {
  const svg = useMemo(() => extractSvgBlock(text), [text])
  if (!svg) return null
  return <figure className="inline-svg"><img src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} alt="Generated graphic" /></figure>
}
