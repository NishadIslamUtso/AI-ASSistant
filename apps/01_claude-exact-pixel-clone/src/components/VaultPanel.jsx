// Placeholder panel (View > Toggle vault panel). Capsule library, blacklist, Open Loops are still TODO (TODO_NEXT P5/P7).
export default function VaultPanel({ setShowVault }) {
  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-ui-line bg-ui-side">
      <div className="flex h-12 items-center justify-between px-4 border-b border-ui-line">
        <span className="text-sm font-medium text-ui-text">AI-Brain Vault</span>
        <button onClick={() => setShowVault(false)} className="text-xs text-ui-muted hover:text-ui-text">Hide</button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4 text-xs text-ui-muted">
        <div>Vault: AI-Brain/ (canonical memory)</div>
        <div>API: /api/vault → 127.0.0.1:8765</div>
        <div>Capsule library, blacklist, Open Loops: not built yet.</div>
      </div>
    </div>
  )
}
