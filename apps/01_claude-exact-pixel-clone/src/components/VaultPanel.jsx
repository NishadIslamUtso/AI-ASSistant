import { useEffect, useState } from 'react'
import { X, Database, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

export default function VaultPanel({ setShowVault }) {
  const [status, setStatus] = useState('checking')
  const [vault, setVault] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/vault/')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Vault API not responding')))
      .then((data) => {
        if (cancelled) return
        setStatus('connected')
        setVault(data.vault || 'Local AI-Brain vault')
      })
      .catch(() => { if (!cancelled) setStatus('offline') })
    return () => { cancelled = true }
  }, [])

  return (
    <aside className="vault-panel">
      <header className="vault-panel-header">
        <span className="flex items-center gap-2"><Database size={15} /> AI-Brain Vault</span>
        <button type="button" aria-label="Hide vault panel" onClick={() => setShowVault(false)}><X size={16} /></button>
      </header>
      <div className="vault-panel-body">
        <div className={`flex items-center gap-2 mb-3 ${status === 'connected' ? 'text-green-400' : status === 'offline' ? 'text-amber-300' : ''}`}>
          {status === 'connected' ? <CheckCircle2 size={15} /> : status === 'offline' ? <AlertCircle size={15} /> : <RefreshCw size={14} className="animate-spin" />}
          <span>{status === 'connected' ? 'Vault API connected' : status === 'offline' ? 'Vault API not reachable' : 'Checking local vault…'}</span>
        </div>
        <div>Vault: {vault || 'AI-Brain/ (configured on the local server)'}</div>
        <div>Driver API: local loopback via Vite proxy</div>
        <div>Active model: local Ollama selection</div>
        {status === 'offline' ? <p className="mt-3">Start the vault API with <code>start-app.bat</code> to enable local memory search and capture.</p> : null}
      </div>
    </aside>
  )
}
