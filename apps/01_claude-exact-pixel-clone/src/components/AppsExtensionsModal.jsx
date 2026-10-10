import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

// Layout and copy follow screenshot 191636. The Chrome card describes this app's own browser extension.
// Claude Code, Microsoft 365, and mobile integrations are shown for layout only.
export default function AppsExtensionsModal({ onClose }) {
  const [showSteps, setShowSteps] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ui-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div role="dialog" aria-modal="true" aria-label="Apps and extensions" className="flex h-[min(887px,calc(100vh-100px))] w-[min(1757px,calc(100vw-164px))] flex-col overflow-hidden rounded-2xl border border-ui-line bg-ui-main shadow-2xl">
        <div className="flex h-[65px] shrink-0 items-center justify-between border-b border-ui-line px-[18px]">
          <div className="text-[16px] font-semibold text-ui-text">Apps and extensions</div>
          <button type="button" onClick={onClose} title="Close (Esc)" className="flex h-8 w-8 items-center justify-center rounded-md text-ui-body hover:bg-ui-hover">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-16 pt-12">
          <div className="mx-auto max-w-[1180px]">
            <h2 className="text-center font-serif text-[44px] leading-tight text-ui-text">Do more with Claude, everywhere you work</h2>

            {/* Claude Code card */}
            <div className="mt-12 grid grid-cols-2 gap-10 rounded-[28px] border border-ui-line bg-ui-panel p-10">
              <div>
                <div className="text-[22px] font-medium text-ui-text">Claude Code</div>
                <p className="mt-2 max-w-[320px] text-[16px] leading-6 text-ui-body">Build, debug, and ship from your terminal or IDE.</p>
                <div className="mt-8 text-[14px] text-ui-muted">Or try it in</div>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {['Terminal', 'VS Code', 'Desktop app', 'JetBrains', 'Slack', 'Mobile'].map((label) => (
                    <span key={label} title="Not available in AI ASSistant" className="rounded-lg border border-ui-line px-3.5 py-2 text-[14px] text-ui-faint">
                      {label}
                    </span>
                  ))}
                </div>
                <p className="mt-6 text-[12px] text-ui-muted">Claude Code and the integrations above are not available in AI ASSistant.</p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-ui-line bg-ui-side">
                <div className="flex gap-2 px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="space-y-2.5 p-6 font-mono text-[14px] text-ui-body">
                  <div className="text-ui-accent">&gt; Fix the auth bug in signup flow</div>
                  <div>✓ Reading src/auth/signup.ts</div>
                  <div>✓ Found the issue in validateToken()</div>
                  <div>✓ Editing src/auth/validateToken.ts</div>
                  <div className="mt-4 rounded-lg bg-ui-main p-3 text-[13px] leading-5">
                    <div className="text-ui-muted">src/auth/validateToken.ts</div>
                    <div className="text-[#e5534b]">- if (token == null) return false;</div>
                    <div className="text-[#6fbf73]">+ if (!token || token.length &lt; 32) return false;</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6">
              {/* Microsoft 365 card */}
              <div className="rounded-[28px] border border-ui-line bg-ui-panel p-10">
                <div className="text-[22px] font-medium text-ui-text">Microsoft 365</div>
                <p className="mt-2 text-[16px] leading-6 text-ui-body">Analyze data, build presentations, draft documents, and triage your inbox with Claude alongside you.</p>
                <span title="Not available in AI ASSistant" className="mt-6 inline-block rounded-lg border border-ui-line px-3.5 py-2 text-[14px] text-ui-faint">Not available here</span>
              </div>

              {/* AI ASSistant browser extension card */}
              <div className="rounded-[28px] border border-ui-line bg-ui-panel p-10">
                <div className="text-[22px] font-medium text-ui-text">AI ASSistant browser extension</div>
                <p className="mt-2 text-[16px] leading-6 text-ui-body">
                  Saves pages and AI chats into your local Obsidian vault and offers context suggestions. Local only, no account.
                </p>
                <button type="button" onClick={() => setShowSteps((s) => !s)} className="mt-6 rounded-lg bg-ui-text px-4 py-2 text-[14px] font-medium text-ui-main">
                  {showSteps ? 'Hide setup steps' : 'Setup steps'}
                </button>
                {showSteps && (
                  <ol className="mt-5 list-decimal space-y-1.5 pl-5 text-[14px] leading-6 text-ui-body">
                    <li>Start the app with start-app.bat so the vault API runs on port 8765.</li>
                    <li>Open chrome://extensions in Chrome or Edge.</li>
                    <li>Turn on Developer mode.</li>
                    <li>Click "Load unpacked" and choose the extension folder in this repo.</li>
                  </ol>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
