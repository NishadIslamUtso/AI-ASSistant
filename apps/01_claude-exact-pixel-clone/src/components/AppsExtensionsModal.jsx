import { useEffect, useState } from 'react'
import { X, Terminal, Code2, Monitor, Slack, Smartphone, Blocks } from 'lucide-react'

// Layout from screenshot 191636.png. Only the Chrome card is real in this local build.
export default function AppsExtensionsModal({ onClose, toast }) {
  const [showSteps, setShowSteps] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const soon = (label) => () => toast(`${label}: not in the local build yet`)

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center c-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Apps and extensions"
        className="flex h-[min(790px,92vh)] w-[min(1435px,96vw)] flex-col overflow-hidden rounded-2xl c-main border c-border"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b c-border px-6">
          <span className="text-sm font-medium">Apps and extensions</span>
          <button type="button" aria-label="Close apps and extensions" onClick={onClose} className="c-hover rounded-md p-1.5 c-muted-2">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-10">
          <h2 className="serif text-center text-[34px] mt-10 mb-10">Do more with Claude, everywhere you work</h2>

          {/* Claude Code card (layout from screenshot; these tools are not part of the local build) */}
          <div className="mx-auto max-w-[1000px] rounded-2xl border c-border p-8">
            <div className="text-lg font-semibold">Claude Code</div>
            <p className="mt-2 max-w-[360px] text-sm c-muted-2">Build, debug, and ship from your terminal or IDE.</p>
            <button type="button" onClick={soon('Upgrade')} className="mt-5 rounded-lg px-4 py-2 text-sm font-medium" style={{ background: 'var(--send-bg)', color: 'var(--send-fg)' }}>
              Upgrade
            </button>
            <div className="mt-6 text-xs c-muted">Or try it in</div>
            <div className="mt-3 flex flex-wrap gap-3">
              {[
                { label: 'Terminal', icon: Terminal },
                { label: 'VS Code', icon: Code2 },
                { label: 'Desktop app', icon: Monitor },
                { label: 'JetBrains', icon: Blocks },
                { label: 'Slack', icon: Slack },
                { label: 'Mobile', icon: Smartphone },
              ].map(({ label, icon: Icon }) => (
                <button key={label} type="button" onClick={soon(label)} className="flex items-center gap-2 rounded-lg border c-border px-3 py-2 text-sm c-hover">
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-6 grid max-w-[1000px] grid-cols-2 gap-6">
            <div className="rounded-2xl border c-border p-8">
              <div className="text-lg font-semibold">Microsoft 365</div>
              <p className="mt-2 text-sm c-muted-2">Analyze data, build presentations, draft documents, and triage your inbox with Claude alongside you.</p>
              <p className="mt-4 text-xs c-muted">Not in the local build yet.</p>
            </div>

            <div className="rounded-2xl border c-border p-8">
              <div className="text-lg font-semibold">AI ASSistant Chrome extension</div>
              <p className="mt-2 text-sm c-muted-2">Local-only. Saves what you choose into your AI-Brain vault at 127.0.0.1:8765. No account needed.</p>
              <button type="button" onClick={() => setShowSteps((s) => !s)} aria-expanded={showSteps} className="mt-5 rounded-lg border c-border px-4 py-2 text-sm c-hover">
                {showSteps ? 'Hide setup steps' : 'Show setup steps'}
              </button>
              {showSteps && (
                <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm c-muted-2">
                  <li>Start the app with start-app.bat so the vault API runs on port 8765.</li>
                  <li>In Chrome, open chrome://extensions and turn on Developer mode.</li>
                  <li>Click Load unpacked and choose the extension/ folder from this repo.</li>
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
