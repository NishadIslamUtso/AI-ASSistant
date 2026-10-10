import { X, Terminal, Monitor, Smartphone, Code2, Braces, Hash } from 'lucide-react'

// Apps and extensions modal from screenshot 191636.png.
export default function AppsExtensionsModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div
        className="w-[calc(100%-140px)] h-[calc(100%-96px)] max-w-[1500px] rounded-xl bg-[var(--bg-main)] border border-[var(--bd)] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-[var(--bd)]">
          <span className="text-[15px] font-medium text-[var(--tx)]">Apps and extensions</span>
          <button onClick={onClose} className="p-1.5 rounded-md text-[var(--tx2)] hover:text-[var(--tx)] hover:bg-[var(--bg-hover)]" title="Close"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-10">
          <h1 className="serif text-center text-[32px] text-[var(--tx)] mb-12">Do more with Claude, everywhere you work</h1>

          {/* Claude Code hero card */}
          <div className="max-w-[1200px] mx-auto rounded-2xl border border-[var(--bd)] bg-[var(--bg-side)] p-8 mb-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-[18px] font-semibold text-[var(--tx)] mb-2">Claude Code</h3>
              <p className="text-[15px] text-[var(--tx2)] mb-5 max-w-[340px]">Build, debug, and ship from your terminal or IDE.</p>
              <button className="bg-white text-black text-[15px] font-medium rounded-lg px-5 py-2.5 mb-7">Upgrade</button>
              <div className="text-[13px] text-[var(--tx2)] mb-3">Or try it in</div>
              <div className="flex flex-wrap gap-2.5">
                <Chip icon={<Terminal size={15} />} label="Terminal" />
                <Chip icon={<VSIcon />} label="VS Code" />
                <Chip icon={<Monitor size={15} />} label="Desktop app" />
                <Chip icon={<Braces size={15} className="text-[#fe2857]" />} label="JetBrains" />
                <Chip icon={<Hash size={15} className="text-[#e01e5a]" />} label="Slack" />
                <Chip icon={<Smartphone size={15} />} label="Mobile" />
              </div>
            </div>
            <div className="rounded-lg border border-[var(--bd2)] bg-[#1e1e1e] overflow-hidden font-mono text-[13px]">
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#252525]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="p-4 relative">
                <InvaderIcon />
                <div className="text-[#e0e0e0] mb-4"><span className="text-[#888]">&gt;</span> Fix the auth bug in signup flow</div>
                <div className="text-[#888] mb-2"><span className="text-[#28c840]">✓</span> Reading src/auth/signup.ts</div>
                <div className="text-[#888] mb-2"><span className="text-[#28c840]">✓</span> Found the issue in validateToken()</div>
                <div className="text-[#888] mb-4"><span className="text-[#28c840]">✓</span> Editing src/auth/validateToken.ts</div>
                <div className="rounded-md bg-[#252525] border border-[#333] mb-4">
                  <div className="px-3 py-1.5 text-[#888] border-b border-[#333]">src/auth/validateToken.ts</div>
                  <div className="px-3 py-2">
                    <div className="text-[#f0554d]">- if (token == null) return false;</div>
                    <div className="text-[#28c840]">+ if (!token || token.length &lt; 32) return false;</div>
                  </div>
                </div>
                <div className="text-[#d97757]">✳ Cooking…</div>
              </div>
            </div>
          </div>

          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[var(--bd)] bg-[var(--bg-side)] p-7">
              <h3 className="text-[17px] font-semibold text-[var(--tx)] mb-2">Microsoft 365</h3>
              <p className="text-[15px] text-[var(--tx2)]">Analyze data, build presentations, draft documents, and triage your inbox with Claude alongside you.</p>
            </div>
            <div className="rounded-2xl border border-[var(--bd)] bg-[var(--bg-side)] p-7">
              <h3 className="text-[17px] font-semibold text-[var(--tx)] mb-2">Chrome</h3>
              <p className="text-[15px] text-[var(--tx2)]">Claude navigates, clicks buttons, and fills forms in your browser. Works in Cowork.</p>
              <p className="text-[13px] text-[var(--tx3)] mt-4">This repo ships the local-only MV3 extension in extension/ — load unpacked in Chrome, vault API at 127.0.0.1:8765.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Chip({ icon, label }) {
  return (
    <span className="flex items-center gap-2 rounded-lg border border-[var(--bd2)] bg-[var(--bg-main)] px-3.5 py-2 text-[14px] text-[var(--tx)]">
      <span className="text-[var(--tx2)]">{icon}</span> {label}
    </span>
  )
}

function VSIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M17 2l7 4v12l-7 4-10-8-4 3-2-2 5-5-5-5 2-2 4 3 10-8z" fill="#2eaaf4" />
    </svg>
  )
}

function InvaderIcon() {
  // pixel space-invader, orange — matches the terminal mock in 191636.png
  const cells = [
    [2,0],[8,0],[3,1],[7,1],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],
    [1,3],[2,3],[4,3],[5,3],[6,3],[8,3],[9,3],
    [0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],
    [0,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[10,5],
    [0,6],[2,6],[8,6],[10,6],[3,7],[4,7],[6,7],[7,7],
  ]
  return (
    <svg width="44" height="34" viewBox="0 0 11 8" className="absolute right-4 top-3">
      {cells.map(([x, y], i) => <rect key={i} x={x} y={y} width="1" height="1" fill="#d97757" />)}
    </svg>
  )
}
