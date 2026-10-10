import Modal from './Modal.jsx'
import { Terminal, Monitor, Smartphone } from 'lucide-react'

const Pill = ({ icon: Icon, label, color }) => (
  <span className="inline-flex items-center gap-2 border border-[#3a3a3a] rounded-lg px-3 py-2 text-[14px] text-[#e8e6e1] bg-[#1f1f1f]">
    <Icon size={15} className={color || 'text-[#ccc]'} />{label}
  </span>
)

// Screenshot 191636. Local clone: cards show the same copy; actions are informational.
export default function AppsExtensionsModal({ onClose }) {
  return (
    <Modal title="Apps and extensions" onClose={onClose} className="w-[min(1100px,94vw)] h-[min(820px,92vh)] flex flex-col">
      <div className="px-6 py-4 border-b border-[#2a2a2a] text-[15px] font-medium">Apps and extensions</div>
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <h2 className="text-center font-serif text-[30px] mb-8" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
          Do more with Claude, everywhere you work
        </h2>

        <div className="rounded-2xl border border-[#2f2f2f] bg-[#202020] p-6 mb-5">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-[18px] font-medium mb-2">Claude Code</div>
              <p className="text-[14px] text-[#aaa] mb-4 leading-6">Build, debug, and ship from your terminal or IDE.</p>
              <button className="bg-white text-black text-[14px] font-medium rounded-lg px-4 py-2 mb-5">Upgrade</button>
              <div className="text-[13px] text-[#888] mb-2">Or try it in</div>
              <div className="flex flex-wrap gap-2">
                <Pill icon={Terminal} label="Terminal" />
                <Pill icon={Monitor} label="VS Code" color="text-[#4aa3ff]" />
                <Pill icon={Monitor} label="Desktop app" />
                <Pill icon={Smartphone} label="Mobile" />
              </div>
            </div>
            <div className="rounded-xl border border-[#2f2f2f] bg-[#1a1a1a] p-4 font-mono text-[13px] leading-6 text-[#bbb]">
              <div className="text-[#e8a87c]">&gt; Fix the auth bug in signup flow</div>
              <div>✓ Reading src/auth/signup.ts</div>
              <div>✓ Found the issue in validateToken()</div>
              <div>✓ Editing src/auth/validateToken.ts</div>
              <div className="mt-3 text-[#ff8a80]">- if (token == null) return false;</div>
              <div className="text-[#8fd694]">+ if (!token || token.length &lt; 32) return false;</div>
              <div className="mt-3 text-[#e8a87c]">* Cooking...</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="rounded-2xl border border-[#2f2f2f] bg-[#202020] p-6">
            <div className="text-[18px] font-medium mb-2">Microsoft 365</div>
            <p className="text-[14px] text-[#aaa] leading-6">Analyze data, build presentations, draft documents, and triage your inbox with Claude alongside you.</p>
          </div>
          <div className="rounded-2xl border border-[#2f2f2f] bg-[#202020] p-6">
            <div className="text-[18px] font-medium mb-2">Chrome</div>
            <p className="text-[14px] text-[#aaa] leading-6">Claude navigates, clicks buttons, and fills forms in your browser. Works in Cowork.</p>
            <p className="text-[13px] text-[#8fb8ff] mt-3 leading-5">AI ASSistant local-only extension: load the unpacked <span className="font-mono">extension/</span> folder in Chrome. No external account needed.</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
