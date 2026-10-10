import { useEffect } from 'react'
import { Code2, Terminal, Blocks, X, Chrome, Monitor, Smartphone, ExternalLink, Puzzle } from 'lucide-react'

function CapabilityChip({ children, icon: Icon }) {
  return <span className="app-capability-chip">{Icon ? <Icon size={14} /> : null}{children}</span>
}

export default function AppsExtensionsModal({ isOpen, onClose, onNotice }) {
  useEffect(() => {
    if (!isOpen) return undefined
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const showInfo = (message) => onNotice?.(message)

  return (
    <div className="modal-backdrop apps-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className="apps-modal" role="dialog" aria-modal="true" aria-label="Apps and extensions">
        <header className="apps-modal-header">
          <strong>Apps and extensions</strong>
          <button type="button" onClick={onClose} aria-label="Close apps and extensions"><X size={19} /></button>
        </header>
        <div className="apps-modal-body">
          <h1>Do more with Claude, everywhere you work</h1>
          <article className="apps-feature-card">
            <div className="apps-feature-copy">
              <div className="apps-app-title"><span className="apps-icon claude-code-icon"><Code2 size={19} /></span><div><h2>Claude Code</h2><p>Build, debug, and ship from your terminal or IDE.</p></div></div>
              <button className="apps-primary-button" type="button" onClick={() => showInfo('Claude Code is a separate Claude service. It is not part of this local Ollama app.')}>Learn about Claude Code</button>
              <div className="apps-chip-label">Available in</div>
              <div className="apps-chip-list">
                <CapabilityChip icon={Terminal}>Terminal</CapabilityChip>
                <CapabilityChip icon={Code2}>VS Code</CapabilityChip>
                <CapabilityChip icon={Monitor}>Desktop app</CapabilityChip>
                <CapabilityChip icon={Blocks}>JetBrains</CapabilityChip>
                <CapabilityChip>Slack</CapabilityChip>
                <CapabilityChip icon={Smartphone}>Mobile</CapabilityChip>
              </div>
            </div>
            <div className="apps-code-preview" aria-hidden="true">
              <div className="apps-window-dots"><i /><i /><i /></div>
              <div className="apps-code-line prompt">› Fix the auth bug in signup flow</div>
              <div className="apps-code-line success">✓ Reading src/auth/signup.ts</div>
              <div className="apps-code-line success">✓ Found the issue in validateToken()</div>
              <div className="apps-code-line success">✓ Editing src/auth/validateToken.ts</div>
              <div className="apps-code-box"><span>src/auth/validateToken.ts</span><code>- if (token == null) return false;<br />+ if (!token || token.length &lt; 32) return<br />&nbsp;&nbsp;false;</code></div>
              <div className="apps-code-line cooking">* Cooking…</div>
            </div>
          </article>
          <div className="apps-card-grid">
            <article className="apps-small-card">
              <div className="apps-app-title"><span className="apps-icon m365-icon"><Blocks size={19} /></span><div><h2>Microsoft 365</h2><p>Analyze data, build presentations, draft documents, and triage your inbox.</p></div></div>
              <button className="apps-secondary-button" type="button" onClick={() => showInfo('Microsoft 365 is not connected in the local build.')}>Not connected</button>
            </article>
            <article className="apps-small-card">
              <div className="apps-app-title"><span className="apps-icon chrome-icon"><Chrome size={19} /></span><div><h2>Chrome</h2><p>Use AI ASSistant's local extension to collect allowed pages and insert capsules.</p></div></div>
              <div className="apps-local-status"><Puzzle size={14} /> Local extension · no external account</div>
              <button className="apps-secondary-button" type="button" onClick={() => showInfo('The extension source is in the repository extension/ folder. Chrome installation and end-to-end vault testing are still pending.')}>View local setup status <ExternalLink size={13} /></button>
            </article>
          </div>
        </div>
      </section>
    </div>
  )
}
