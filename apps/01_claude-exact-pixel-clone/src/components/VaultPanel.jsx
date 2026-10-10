import React, { useEffect, useState } from 'react'
import { C } from '../theme.js'
import { Icon, P } from './Icons.jsx'
import { vault } from '../lib/vault.js'
import { settings } from '../lib/settings.js'

/**
 * AI-Brain vault panel — capsules (drag into the composer), never-check
 * blacklist, working memory and today's follow-ups.
 */
export default function VaultPanel({ onClose, onInject, onOpenToday }) {
  const [st, setSt] = useState(null)
  const [caps, setCaps] = useState([])
  const [q, setQ] = useState('')
  const [bl, setBl] = useState('')
  const [today, setToday] = useState(null)
  const s = settings.get()

  const load = async () => {
    setSt(await vault.status())
    const c = await vault.capsules()
    setCaps(c?.capsules || [])
    setToday(await vault.today())
  }

  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t) }, [])

  const filtered = caps.filter((c) => (c.title || '').toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="shrink-0 flex flex-col h-full" style={{ width: 320, background: C.sidebarBg, borderLeft: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-[8px] px-[14px] shrink-0" style={{ height: 46, borderBottom: `1px solid ${C.border}` }}>
        <Icon d={P.brain} size={15} />
        <span className="text-[13.5px] flex-1" style={{ color: C.text }}>AI-Brain</span>
        <button onClick={onOpenToday} title="Today view" style={{ color: C.text3 }}><Icon d={P.journal} size={14} /></button>
        <button onClick={onClose} title="Hide" style={{ color: C.text3 }}><Icon d={P.x} size={15} /></button>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin p-[14px] space-y-[16px]">
        <Section title="Vault">
          <KV k="Status" v={st ? 'online' : 'offline'} danger={!st} />
          <KV k="Path" v={st?.vault || '—'} />
          <KV k="API" v="127.0.0.1:8765" />
          <KV k="Model" v={s.model} />
        </Section>

        <Section title="Today">
          {today ? (
            <>
              <BtnRow onClick={onOpenToday} label="Open Today view" icon={P.journal} />
              <div className="mt-[6px] text-[11.5px]" style={{ color: C.text3 }}>
                {(today.followups?.length || 0)} follow-up(s) due · {today.snapshot ? 'snapshot loaded' : 'no snapshot'}
              </div>
            </>
          ) : (
            <div className="text-[11.5px]" style={{ color: C.text3 }}>Vault API offline — start server/vault-api.cjs</div>
          )}
        </Section>

        <Section title="Capsules (drag into composer)">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search capsules"
            className="w-full rounded-[6px] px-[8px] py-[4px] text-[12px] outline-none mb-[8px]"
            style={{ background: C.inputBg, border: `1px solid ${C.borderBtn}`, color: C.text2 }} />
          {!filtered.length && <div className="text-[11.5px]" style={{ color: C.text3 }}>No capsules yet.</div>}
          {filtered.map((c) => (
            <div
              key={c.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', capsuleText(c))}
              onDoubleClick={() => onInject?.(capsuleText(c))}
              className="rounded-[8px] p-[9px] mb-[6px] cursor-grab active:cursor-grabbing hover:brightness-110"
              style={{ background: C.composerBg, border: `1px solid ${C.border}` }}
              title="Drag into the composer, or double-click to insert"
            >
              <div className="flex items-center gap-[6px]">
                <Icon d={P.capsule} size={12} />
                <span className="text-[12.5px] truncate" style={{ color: C.text2 }}>{c.title}</span>
              </div>
              {c.background && (
                <div className="mt-[4px] text-[11px] line-clamp-2" style={{ color: C.text3 }}>
                  {String(c.background).replace(/\s+/g, ' ').slice(0, 110)}
                </div>
              )}
            </div>
          ))}
        </Section>

        <Section title="Never-check blacklist">
          <div className="flex gap-[6px]">
            <input value={bl} onChange={(e) => setBl(e.target.value)} placeholder="bank.com/*"
              className="flex-1 rounded-[6px] px-[8px] py-[4px] text-[12px] outline-none"
              style={{ background: C.inputBg, border: `1px solid ${C.borderBtn}`, color: C.text2 }} />
            <button
              onClick={async () => {
                const v = bl.trim(); if (!v) return
                const list = [...(settings.get().blacklist || []), v]
                settings.set({ blacklist: list }); setBl('')
                await vault.setBlacklist(list)
              }}
              className="rounded-[6px] px-[9px] text-[12px]" style={{ background: C.btnBg, color: C.text }}>Add</button>
          </div>
          <div className="mt-[8px] space-y-[4px]">
            {(s.blacklist || []).map((p) => (
              <div key={p} className="flex items-center justify-between rounded-[6px] px-[8px] py-[4px]"
                style={{ background: C.inputBg }}>
                <span className="text-[11.5px]" style={{ color: C.text2 }}>{p}</span>
                <button
                  onClick={async () => {
                    const list = (settings.get().blacklist || []).filter((x) => x !== p)
                    settings.set({ blacklist: list }); await vault.setBlacklist(list); load()
                  }}
                  style={{ color: C.text3 }}><Icon d={P.x} size={11} /></button>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

function capsuleText(c) {
  return `<capsule ${c.id}: ${c.title}>\n${c.goals?.length ? 'Goals:\n' + c.goals.map((g) => '- ' + g).join('\n') + '\n' : ''}${c.background ? 'Background: ' + String(c.background).slice(0, 600) + '\n' : ''}${c.constraints?.length ? 'Constraints:\n' + c.constraints.map((g) => '- ' + g).join('\n') : ''}\n</capsule>`
}

const Section = ({ title, children }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wide mb-[7px]" style={{ color: C.text3 }}>{title}</div>
    {children}
  </div>
)
const KV = ({ k, v, danger }) => (
  <div className="flex items-center justify-between text-[11.5px]" style={{ color: C.text3 }}>
    <span>{k}</span><span style={{ color: danger ? C.danger : C.text2 }}>{v}</span>
  </div>
)
const BtnRow = ({ onClick, label, icon }) => (
  <button onClick={onClick} className="flex items-center gap-[7px] rounded-[8px] px-[10px] py-[6px] text-[12px] w-full"
    style={{ background: C.composerBg, border: `1px solid ${C.border}`, color: C.text2 }}>
    <Icon d={icon} size={13} />{label}
  </button>
)
