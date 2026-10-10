import React, { useEffect, useState } from 'react'
import { C, M } from '../theme.js'
import { Icon, P } from './Icons.jsx'
import { vault } from '../lib/vault.js'

/**
 * Today view — surfaces Current Snapshot, today's journal draft, due
 * follow-ups (answer / skip / snooze / stop) and one useful next action.
 * Nothing is invented: everything is read from the vault.
 */
export default function TodayView({ onClose, onAsk }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setData(await vault.today())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const d = data || {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: `min(900px, calc(100vw - 80px))`,
          height: `min(600px, calc(100vh - 80px))`,
          background: C.modalBg, border: `1px solid ${C.modalBorder}`, borderRadius: 12,
        }}
      >
        <div className="flex items-center gap-[10px] px-[21px] shrink-0" style={{ height: 52, borderBottom: `1px solid ${C.modalDivider}` }}>
          <Icon d={P.journal} size={16} />
          <span className="text-[16px]" style={{ color: C.text }}>Today</span>
          <span className="text-[12px] ml-[6px]" style={{ color: C.text3 }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <button onClick={onClose} className="ml-auto rounded-[6px] hover:bg-white/10 flex items-center justify-center"
            style={{ width: 28, height: 28, color: C.text3 }}><Icon d={P.x} size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin p-[21px] grid grid-cols-2 gap-[18px]">
          <Card title="Current snapshot">
            {loading ? <Muted>Loading…</Muted>
              : d.snapshot ? <Pre>{d.snapshot}</Pre>
              : <Muted>No 04 Working Memory/Current Snapshot.md yet.</Muted>}
          </Card>

          <Card title="Open loops">
            {d.openLoops ? <Pre>{d.openLoops}</Pre> : <Muted>No open loops.</Muted>}
          </Card>

          <Card title="Due follow-ups">
            {(d.followups || []).length === 0 && <Muted>Nothing due. Silence is not resolution — check again later.</Muted>}
            {(d.followups || []).map((f, i) => (
              <div key={i} className="rounded-[8px] p-[10px] mb-[8px]" style={{ background: C.composerBg, border: `1px solid ${C.border}` }}>
                <div className="text-[13px]" style={{ color: C.text2 }}>{f.topic}</div>
                {f.last_update && <div className="text-[11.5px] mt-[3px]" style={{ color: C.text3 }}>Last: {f.last_update}</div>}
                <div className="flex gap-[6px] mt-[8px]">
                  {['Answer', 'Skip', 'Snooze', 'Stop'].map((a) => (
                    <button key={a}
                      onClick={() => onAsk?.(a === 'Answer' ? f.topic : `${a} follow-up: ${f.topic}`)}
                      className="rounded-[6px] px-[9px] py-[3px] text-[11.5px]"
                      style={{ background: C.inputBg, border: `1px solid ${C.borderBtn}`, color: C.text2 }}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </Card>

          <Card title="Journal draft">
            {d.journal ? <Pre>{d.journal}</Pre>
              : <Muted>No journal entry for today yet (08 Journal/&lt;year&gt;/&lt;date&gt;.md).</Muted>}
          </Card>
        </div>

        <div className="shrink-0 flex items-center justify-between px-[21px] py-[12px]"
          style={{ borderTop: `1px solid ${C.modalDivider}` }}>
          <div className="text-[12.5px]" style={{ color: C.text3 }}>
            {d.vault ? `Vault: ${d.vault}` : 'Vault API offline (127.0.0.1:8765)'}
          </div>
          <button onClick={load} className="rounded-[8px] px-[12px] py-[6px] text-[12.5px]"
            style={{ background: C.btnBg, color: C.text }}>Refresh</button>
        </div>
      </div>
    </div>
  )
}

const Card = ({ title, children }) => (
  <div className="rounded-[10px] p-[14px]" style={{ border: `1px solid ${C.modalDivider}`, background: '#1d1d1c' }}>
    <div className="text-[13px] mb-[8px]" style={{ color: C.text }}>{title}</div>
    {children}
  </div>
)
const Muted = ({ children }) => <div className="text-[12px]" style={{ color: C.text3 }}>{children}</div>
const Pre = ({ children }) => (
  <pre className="whitespace-pre-wrap text-[12px] leading-[18px]" style={{ color: C.text2 }}>{children}</pre>
)
