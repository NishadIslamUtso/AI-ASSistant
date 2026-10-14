import { Smartphone } from 'lucide-react'
import { DesktopIcon, JetBrainsIcon, SlackIcon, TerminalIcon, VSCodeIcon } from './IntegrationIcons.jsx'
import Dialog from './Dialog.jsx'
const integrations = [[TerminalIcon, 'Terminal'], [VSCodeIcon, 'VS Code'], [DesktopIcon, 'Desktop app'], [JetBrainsIcon, 'JetBrains'], [SlackIcon, 'Slack'], [Smartphone, 'Mobile']]
export default function AppsExtensionsModal({ onClose, notify }) {
  return <Dialog title="Apps and extensions" onClose={onClose} className="apps-dialog" labelledBy="apps-title">
    <div className="apps-content">
      <h3>Do more with AI ASSistant, everywhere you work</h3>
      <div className="app-feature-card">
        <div className="app-feature-copy"><h4>Code agents</h4><p>Build, debug, and ship from your terminal<br />or IDE.</p><button className="white-button" onClick={() => notify('No code agent is bundled or connected. AI ASSistant runs your own local Ollama models.')}>Upgrade</button><small>Or try it in</small><div className="integration-chips">{integrations.map(([Icon, label]) => <button key={label} onClick={() => notify(`${label} integration is not connected in this local build.`)}><Icon size={18} />{label}</button>)}</div></div>
        <div className="terminal-illustration" aria-label="Code agent illustration, not a running terminal"><div className="terminal-title"><i /><i /><i /></div><div className="terminal-lines"><p><b>›</b> Fix the auth bug in signup flow</p><p><b>✓</b> Reading src/auth/signup.ts</p><p><b>✓</b> Found the issue in validateToken()</p><p><b>✓</b> Editing src/auth/validateToken.ts</p><div className="terminal-file"><header>src/auth/validateToken.ts</header><div className="diff-remove">- if (token == null) return false;</div><div className="diff-add">+ if (!token || token.length &lt; 32) return false;</div></div><p className="cooking">* Cooking…</p></div><svg className="pixel-mascot" width="48" height="38" viewBox="0 0 48 38" aria-hidden="true"><path fill="currentColor" d="M8 2h28v7h8v9h-6v16h-5V23H14v11H9V18H2V9h6z" /><path fill="#242424" d="M13 6h4v4h-4zm15 0h4v4h-4z" /></svg></div>
      </div>
      <div className="apps-bottom-grid"><div className="app-small-card"><h4>Microsoft 365</h4><p>Analyze data, build presentations, draft documents, and triage your inbox with AI ASSistant alongside you.</p><small>Not connected. No documents or account data are accessed.</small></div><div className="app-small-card"><h4>Chrome</h4><p>Keep context close while you browse, with the local AI ASSistant extension.</p><button className="secondary-button" onClick={() => notify('On Windows: open chrome://extensions, turn on Developer mode, choose Load unpacked, then select the repository’s extension folder. The vault API must be running. No external account is required.')}>Set up local extension</button><small>Capture, blacklist and inline suggestions need Chrome verification.</small></div></div>
      <p className="apps-disclaimer">Screenshot-matched interface. External integrations are not part of this local app; nothing is installed or sent by clicking these controls.</p>
    </div>
  </Dialog>
}
