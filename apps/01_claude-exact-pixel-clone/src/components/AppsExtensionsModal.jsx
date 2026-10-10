import React from 'react'
import { C, M } from '../theme.js'
import { Icon, P } from './Icons.jsx'

/** Apps & extensions — 191636.png (1173 x 593, centred) */
const TARGETS = [
  { name: 'Terminal', icon: P.code },
  { name: 'VS Code', icon: P.code },
  { name: 'Desktop app', icon: P.monitor },
  { name: 'JetBrains', icon: P.code },
  { name: 'Slack', icon: P.plug },
  { name: 'Mobile', icon: P.grid },
]

export default function AppsExtensionsModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: `min(${M.modal.w}px, calc(100vw - 107px))`,
          height: `min(593px, calc(100vh - 66px))`,
          background: '#151515', border: `1px solid ${C.modalBorder}`, borderRadius: 12,
        }}
      >
        {/* header — measured 66..133 device px (44 px tall, #1a1a19) */}
        <div className="flex items-center justify-between px-[21px] shrink-0"
          style={{ height: 45, background: '#1a1a19' }}>
          <div className="text-[14px]" style={{ color: C.text }}>Apps and extensions</div>
          <button onClick={onClose} className="rounded-[6px] hover:bg-white/10 flex items-center justify-center"
            style={{ width: 26, height: 26, color: C.text3 }}>
            <Icon d={P.x} size={15} />
          </button>
        </div>
        <div style={{ height: 1, background: '#484847' }} />

        <div className="flex-1 overflow-y-auto scroll-thin pb-[24px]">
          {/* content column measured from 191636: 853 px wide, centred in the panel */}
          <div className="mx-auto px-[21px]" style={{ maxWidth: 853 }}>
          {/* big heading */}
          <h2 className="text-center mt-[30px]" style={{ fontSize: 27, color: C.text, lineHeight: 1.25 }}>
            Do more with Claude everywhere you work
          </h2>

          {/* featured card: Claude Code */}
          <div className="mt-[47px] rounded-[12px] overflow-hidden flex" style={{ border: `1px solid ${C.modalDivider}` }}>
            <div className="p-[21px] w-[46%]">
              <div className="text-[16px]" style={{ color: C.text }}>Claude Code</div>
              <p className="mt-[8px] text-[12.5px]" style={{ color: C.text3 }}>
                Build, debug, and ship from your terminal or IDE.
              </p>
              <div className="mt-[18px] flex flex-wrap gap-[8px]">
                {TARGETS.map((t) => (
                  <button key={t.name}
                    className="flex items-center gap-[6px] rounded-[8px] px-[10px] py-[6px] text-[12px] hover:brightness-110"
                    style={{ background: C.inputBg, border: `1px solid ${C.borderBtn}`, color: C.text2 }}>
                    <Icon d={t.icon} size={12} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 p-[14px]" style={{ background: '#151514', borderLeft: `1px solid ${C.modalDivider}` }}>
              <div className="rounded-[8px] p-[12px] text-[12px] space-y-[8px] font-mono"
                style={{ background: '#1d1d1c', color: C.text2, minHeight: 180 }}>
                <div style={{ color: C.text }}>&gt; Fix the auth bug in signup flow</div>
                <div style={{ color: C.text3 }}>Reading src/auth/…</div>
                <div style={{ color: C.text3 }}>• validateToken()</div>
                <div>Found the issue in validateToken()</div>
              </div>
            </div>
          </div>

          {/* two cards */}
          <div className="mt-[16px] grid grid-cols-2 gap-[16px]">
            <Card
              title="Microsoft 365"
              body="Analyze data, build presentations, draft documents, and triage your inbox with Claude alongside you."
              icon={P.grid}
            />
            <Card
              title="Chrome"
              body="Claude navigates, clicks buttons, and fills forms in your browser. Works in Cowork."
              icon={P.globe}
              note="AI ASSistant extension — collects into your local AI-Brain vault, local-only, no account."
            />
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({ title, body, icon, note }) {
  return (
    <div className="rounded-[12px] p-[18px]" style={{ border: `1px solid ${C.modalDivider}`, background: '#1d1d1c' }}>
      <div className="flex items-center gap-[8px]">
        <Icon d={icon} size={16} />
        <span className="text-[15px]" style={{ color: C.text }}>{title}</span>
      </div>
      <p className="mt-[8px] text-[12.5px]" style={{ color: C.text3 }}>{body}</p>
      {note && <p className="mt-[8px] text-[11.5px]" style={{ color: C.accent }}>{note}</p>}
    </div>
  )
}
