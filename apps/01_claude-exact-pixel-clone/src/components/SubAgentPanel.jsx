import { useState } from 'react'
import { X, Bot, Plus, Play, Trash2, Copy, CornerDownLeft, Square, AlertTriangle, Database, RefreshCw } from 'lucide-react'
import { AGENT_PRESETS } from '../hooks/useSubAgents.js'
import Markdown from './Markdown.jsx'

/**
 * SubAgentPanel — run a task in its own context.
 *
 * Nothing here is appended to the open chat until the person presses
 * "Insert into composer", which is the whole point: the main transcript stays
 * about the conversation, not about every side investigation.
 */
export default function SubAgentPanel({ subAgents, models, onClose, onInsert, notify, onExternalLink }) {
  const { agents, activeId, setActiveId, busy, add, remove, run, patch } = subAgents
  const [draft, setDraft] = useState(null)
  const agent = agents.find(entry => entry.id === activeId) || null
  const preset = AGENT_PRESETS.find(entry => entry.id === agent?.preset) || AGENT_PRESETS[0]
  const edit = changes => { if (agent) patch(agent.id, changes) }
  const running = agent?.status === 'running'

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); notify('Sub-agent result copied.') } catch { notify('Clipboard permission is unavailable. Select the text and copy it instead.') }
  }

  return <aside className="side-panel agents-panel" aria-label="Sub agents">
    <header className="panel-header"><div><h2>Sub agents</h2><small>Isolated context · one job at a time</small></div><button className="icon-button" aria-label="Close sub agents" onClick={onClose}><X size={17} /></button></header>
    <div className="agents-body">
      <div className="agents-list">
        <button className="secondary-button new-agent" onClick={() => add({ preset: 'researcher', task: '' })}><Plus size={14} />New sub agent</button>
        {!agents.length && <p className="agents-empty">A sub-agent takes one task, works in its own context, and leaves one result. Use it for research, critique, extraction or code that the conversation should not carry.</p>}
        {agents.map(entry => <button key={entry.id} className={`agent-chip ${entry.id === activeId ? 'selected' : ''}`} onClick={() => { setActiveId(entry.id); setDraft(null) }}>
          <Bot size={14} />
          <span><strong>{entry.name}</strong><small>{entry.status === 'running' ? 'Running…' : entry.status === 'waiting' ? 'Queued…' : entry.status === 'done' ? `Done · ${Math.max(1, Math.round((entry.ms || 0) / 1000))}s` : entry.status === 'error' ? 'Failed' : AGENT_PRESETS.find(item => item.id === entry.preset)?.name || 'Custom'}</small></span>
          {entry.status === 'running' && <span className="agent-pulse" aria-hidden="true" />}
        </button>)}
      </div>
      {agent ? <div className="agent-editor">
        <label className="agent-field"><span>Name</span><input value={agent.name} maxLength={60} onChange={event => edit({ name: event.target.value })} /></label>
        <label className="agent-field"><span>Role</span><select value={agent.preset} onChange={event => edit({ preset: event.target.value })}>{AGENT_PRESETS.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
        <p className="agent-hint">{preset.hint}</p>
        <label className="agent-field"><span>Task</span><textarea rows={6} value={draft ?? agent.task} placeholder="One self-contained task. The sub-agent cannot see this chat." onChange={event => { setDraft(event.target.value); edit({ task: event.target.value }) }} /></label>
        <div className="agent-controls">
          <label className="agent-toggle"><input type="checkbox" checked={Boolean(agent.useVault)} onChange={event => edit({ useVault: event.target.checked })} /><Database size={13} />Search AI-Brain for context</label>
          <small>{String(draft ?? agent.task).length.toLocaleString()} / 12,000 characters</small>
        </div>
        <div className="agent-actions">
          {running ? <button className="secondary-button" onClick={() => subAgents.stop?.()}><Square size={13} />Running…</button>
            : <button className="white-button" disabled={busy || !(draft ?? agent.task).trim()} onClick={() => run(agent.id)}><Play size={13} />Run agent</button>}
          <button className="icon-button" aria-label="Delete sub agent" disabled={running} onClick={() => remove(agent.id)}><Trash2 size={15} /></button>
        </div>
        {agent.status === 'waiting' && <p className="muted">Queued — it starts as soon as the running job finishes. The GPU is only ever doing one job.</p>}
        {busy && !running && agent.status !== 'waiting' && <p className="muted">Another sub-agent is running. This one will run when that finishes.</p>}
        {agent.status === 'error' && <p className="error-text" role="alert"><AlertTriangle size={13} /> {agent.error}</p>}
        {agent.output && <div className="agent-output">
          <header><span>Result · {agent.model}</span><div>
            <button className="icon-button" aria-label="Copy result" onClick={() => copy(agent.output)}><Copy size={13} /></button>
            <button className="icon-button" aria-label="Insert result into the composer" title="Put this result in the message box, not in the chat" onClick={() => { onInsert(agent.output); notify('Sub-agent result placed in the composer. Nothing is sent until you send it.') }}><CornerDownLeft size={13} /></button>
          </div></header>
          <div className="agent-result"><Markdown onExternalLink={onExternalLink}>{agent.output}</Markdown></div>
          {agent.vaultSources?.length > 0 && <footer><RefreshCw size={11} />Vault context: {agent.vaultSources.map(item => item.title).join(' · ')}</footer>}
        </div>}
      </div> : agents.length ? <p className="agents-empty">Select a sub-agent, or create one.</p> : null}
    </div>
    <footer className="panel-footnote">Isolated message list · never merged into the chat by itself<br />Runs on your local model through the same local proxy</footer>
  </aside>
}
