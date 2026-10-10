import { useEffect } from 'react'
import { X } from 'lucide-react'

// Layout from screenshot 191636. Copy is adjusted where AI ASSistant does not have the feature yet.
export default function AppsExtensionsModal({ onClose, toast }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--overlay)] p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-label="Apps and extensions" className="flex h-[min(860px,90vh)] w-[min(1180px,94vw)] flex-col overflow-hidden rounded-2xl border border-line bg-[#1e1e1d] shadow-2xl">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-soft px-6">
          <span className="text-[16px] font-medium text-fg">Apps and extensions</span>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-fg2 hover:bg-hover"><X size={18} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-10 pb-10 pt-12">
          <h2 className="text-center font-serif text-[36px] leading-tight text-fg">Do more with Claude, everywhere you work</h2>

          <div className="mx-auto mt-10 max-w-[1040px] rounded-[28px] border border-soft bg-main p-9">
            <div className="grid grid-cols-[1fr_1.2fr] gap-10">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-[22px] font-medium text-fg">Claude Code</h3>
                  <Tag>Coming later</Tag>
                </div>
                <p className="mt-3 max-w-[300px] text-[15px] leading-6 text-fg2">Build, debug, and ship from your terminal or IDE.</p>
                <button type="button" disabled className="mt-6 cursor-default rounded-full bg-primary px-5 py-2 text-[14px] font-medium text-primary-fg opacity-60">Upgrade</button>
                <p className="mt-8 text-[13px] text-fg3">Or try it in</p>
                <p className="mt-2 max-w-[360px] text-[13px] leading-5 text-fg3">Terminal, VS Code, desktop app, JetBrains, Slack and mobile are not connected to AI ASSistant yet.</p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-soft bg-[#111111] text-[14px] text-fg2">
                <div className="flex items-center gap-1.5 border-b border-soft px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="space-y-3 p-5 font-mono text-[13.5px] leading-6">
                  <div className="text-fg">&gt; Check the local stack</div>
                  <div><span className="text-[#6fbf73]">✓</span> Chat model: qwen2.5:3b via Ollama (127.0.0.1:11434)</div>
                  <div><span className="text-[#6fbf73]">✓</span> Memory: AI-Brain vault driver (127.0.0.1:8765)</div>
                  <div><span className="text-[#6fbf73]">✓</span> Nothing leaves this PC</div>
                  <div className="pt-2 text-accent">* Working…</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-6 grid max-w-[1040px] grid-cols-2 gap-6">
            <Card title="Microsoft 365" tag="Coming later" text="Analyze data, build presentations, draft documents, and triage your inbox with Claude alongside you." />
            <Card
              title="Chrome"
              tag="Available in extension/"
              text="AI ASSistant’s Chrome extension saves the AI chats and pages you choose into your local AI-Brain vault. Local-only, no account needed."
              action={<button type="button" onClick={() => toast('Load extension/ as an unpacked extension in chrome://extensions (developer mode)')} className="mt-5 rounded-full border border-line px-4 py-1.5 text-[14px] text-fg hover:bg-hover">How to load it</button>}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({ title, text, tag, action }) {
  return (
    <div className="rounded-[28px] border border-soft bg-main p-8">
      <div className="flex items-center gap-3">
        <h3 className="text-[20px] font-medium text-fg">{title}</h3>
        <Tag>{tag}</Tag>
      </div>
      <p className="mt-3 max-w-[460px] text-[15px] leading-6 text-fg2">{text}</p>
      {action}
    </div>
  )
}

function Tag({ children }) {
  return <span className="rounded-full bg-hover px-2.5 py-0.5 text-[12px] text-fg3">{children}</span>
}
