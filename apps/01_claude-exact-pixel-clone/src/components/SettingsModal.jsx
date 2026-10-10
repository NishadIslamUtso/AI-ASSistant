import React from 'react'
import { C, M, APPEARANCE_ROWS, VOICE_ROWS } from '../theme.js'
import { Icon, P } from './Icons.jsx'
import { settings } from '../lib/settings.js'

/* row heights measured from the separator lines in 191707.png (device y / 1.5) */
const ROWS = [
  { h: 140 }, { h: 52 }, { h: 63 }, { h: 63 }, { h: 184 }, { h: 52 }, { h: 61 },
]
const NAV = [
  { label: 'General', top: 98 }, { label: 'Account', top: 129 }, { label: 'Privacy', top: 159 },
  { label: 'Billing', top: 189 }, { label: 'Capabilities', top: 220 }, { label: 'Memory', top: 250 },
  { label: 'Reflect', top: 280 }, { label: 'Time and focus', top: 311 }, { label: 'Claude Code', top: 341 },
  { label: 'System', top: 419 }, { label: 'Extensions', top: 449 }, { label: 'Developer', top: 479 },
  { label: 'Skills', top: 557 }, { label: 'Connectors', top: 587 },
]

export default function SettingsModal({ section, onSection, onClose, models, model, onModel, onOpenApps }) {
  const s = settings.get()
  const set = (patch) => { settings.set(patch); window.dispatchEvent(new Event('settings-changed')) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div
        className="relative flex overflow-hidden"
        style={{
          width: `min(${M.modal.w}px, calc(100vw - 107px))`,
          height: `min(${M.modal.h}px, calc(100vh - 66px))`,
          background: C.modalBg, border: `1px solid ${C.modalBorder}`, borderRadius: 12,
        }}
      >
        {/* ---------------- left nav ---------------- */}
        <div
          className="shrink-0 relative"
          style={{ width: M.modal.nav, background: C.modalNavBg, borderRight: `1px solid ${C.modalDivider}` }}
        >
          <div className="px-[12px]">
            <div
              className="flex items-center rounded-[6px] mt-[16px] px-[8px]"
              style={{ height: 22, background: C.inputBg, border: `1px solid ${C.borderBtn}` }}
            >
              <Icon d={P.search} size={12} className="opacity-70" />
              <input placeholder="Search" className="bg-transparent outline-none text-[12px] px-[6px] w-full placeholder-[#898781]" />
            </div>
          </div>
          <div className="px-[16px] mt-[26px] text-[13px]" style={{ color: C.text3 }}>Settings</div>
          <div className="relative mt-[10px] px-[8px]">
            {NAV.map((n) => (
              <button
                key={n.label}
                onClick={() => onSection(n.label === 'Extensions' ? 'Extensions' : n.label)}
                className="absolute left-[8px] right-[8px] flex items-center rounded-[6px] px-[8px] hover:bg-white/5"
                style={{
                  top: n.top - 88, height: 26,
                  background: section === n.label ? 'rgba(255,255,255,.06)' : 'transparent',
                  color: section === n.label ? C.text : C.text3,
                }}
              >
                <Icon d={P.gear} size={13} />
                <span className="ml-[10px] text-[12.5px] truncate">{n.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ---------------- right content ---------------- */}
        <div className="flex-1 min-w-0 overflow-y-auto scroll-thin" style={{ paddingLeft: 21, paddingRight: 45 }}>
          {section === 'General' ? <Appearance set={set} s={s} models={models} model={model} onModel={onModel} /> : null}
          {section === 'Privacy' ? <Privacy s={s} set={set} /> : null}
          {section === 'Extensions' ? <Extensions onOpenApps={onOpenApps} /> : null}
          {!['General', 'Privacy', 'Extensions'].includes(section) && <Placeholder section={section} />}
        </div>

        <button
          onClick={onClose}
          className="absolute rounded-[6px] hover:bg-white/10 flex items-center justify-center"
          style={{ top: 12, right: 12, width: 28, height: 28, color: C.text3 }}
          title="Close"
        >
          <Icon d={P.x} size={16} />
        </button>
      </div>
    </div>
  )
}

/* ============ Appearance (measured, 191707.png) ============ */
function Appearance({ set, s, models, model, onModel }) {
  const start = 0
  const rowTops = ROWS.reduce((acc, r) => { acc.push((acc.length ? acc[acc.length - 1] : 0) + r.h); return acc }, [])
  const topOf = (i) => (i === 0 ? 0 : rowTops[i - 1])

  return (
    <div className="pb-[40px]">
      {/* row 0: heading + Theme */}
      <div className="relative" style={{ height: ROWS[0].h }}>
        <div className="absolute" style={{ top: 59 }}>
          <h2 style={{ fontSize: 20, color: C.text }}>Appearance</h2>
        </div>
        <Row y={108}>
          <Label>Theme</Label>
          <div className="flex items-center rounded-[8px] overflow-hidden" style={{ border: `1px solid ${C.borderBtn}`, background: C.inputBg }}>
            {[['system', P.monitor], ['light', P.sun], ['dark', P.moon]].map(([k, icon], i) => (
              <button
                key={k}
                onClick={() => set({ theme: k })}
                className="flex items-center justify-center"
                style={{
                  width: 24, height: 26,
                  background: s.theme === k ? 'rgba(255,255,255,.14)' : 'transparent',
                  color: s.theme === k ? C.text : C.text3,
                  borderLeft: i ? `1px solid ${C.borderBtn}` : 'none',
                }}
                title={k}
              >
                <Icon d={icon} size={14} />
              </button>
            ))}
          </div>
        </Row>
      </div>

      {/* row 1: Chat font */}
      <Sep />
      <div style={{ height: ROWS[1].h }}>
        <Row y={20}>
          <Label>Chat font</Label>
          <Select value={s.chatFont} options={APPEARANCE_ROWS[1].options} onChange={(v) => set({ chatFont: v })} />
        </Row>
      </div>

      {/* row 2: Transcript text size */}
      <Sep />
      <div style={{ height: ROWS[2].h }}>
        <Row y={15}>
          <div>
            <Label>Transcript text size</Label>
            <Desc>{APPEARANCE_ROWS[2].desc}</Desc>
          </div>
          <Seg options={APPEARANCE_ROWS[2].options} value={s.transcriptSize} onChange={(v) => set({ transcriptSize: v })} />
        </Row>
      </div>

      {/* row 3: Transcript width */}
      <Sep />
      <div style={{ height: ROWS[3].h }}>
        <Row y={15}>
          <div>
            <Label>Transcript width</Label>
            <Desc>{APPEARANCE_ROWS[3].desc}</Desc>
          </div>
          <Seg options={APPEARANCE_ROWS[3].options} value={s.transcriptWidth} onChange={(v) => set({ transcriptWidth: v })} />
        </Row>
      </div>

      {/* row 4: Motion + Voice + Language */}
      <Sep />
      <div style={{ height: ROWS[4].h }}>
        <Row y={15}>
          <div>
            <Label>Motion</Label>
            <Desc>{APPEARANCE_ROWS[4].desc}</Desc>
          </div>
          <Seg options={APPEARANCE_ROWS[4].options} value={s.motion} onChange={(v) => set({ motion: v })} />
        </Row>
        <Row y={103}>
          <Label>Voice</Label>
        </Row>
        <Row y={153}>
          <Label>Language</Label>
          <Select value={s.voiceLanguage} options={VOICE_ROWS[0].options} onChange={(v) => set({ voiceLanguage: v })} />
        </Row>
      </div>

      {/* row 5: Style */}
      <Sep />
      <div style={{ height: ROWS[5].h }}>
        <Row y={20}>
          <Label>Style</Label>
          <Select value={s.voiceStyle} options={VOICE_ROWS[1].options} onChange={(v) => set({ voiceStyle: v })} />
        </Row>
      </div>

      {/* row 6: Speed */}
      <Sep />
      <div style={{ height: ROWS[6].h }}>
        <Row y={20}>
          <Label>Speed</Label>
          <Select value={s.voiceSpeed} options={VOICE_ROWS[2].options} onChange={(v) => set({ voiceSpeed: v })} />
        </Row>
      </div>

      <Sep />
      <div className="pt-[18px] pb-[30px] space-y-[14px]">
        <div className="text-[13px]" style={{ color: C.text3 }}>
          Local model (Ollama) — this app runs fully offline on your machine.
        </div>
        <Row>
          <Label>Model</Label>
          <Select
            value={model}
            options={models.length ? models.map((m) => m.name) : ['qwen2.5:3b']}
            onChange={onModel}
            wide
          />
        </Row>
        <Row>
          <Label>Ollama URL</Label>
          <input
            defaultValue={s.ollamaUrl}
            onBlur={(e) => set({ ollamaUrl: e.target.value.trim() })}
            placeholder="/ollama  (dev proxy to 127.0.0.1:11434)"
            className="rounded-[8px] px-[10px] py-[5px] text-[12.5px] outline-none w-[240px]"
            style={{ background: C.inputBg, border: `1px solid ${C.borderBtn}`, color: C.text2 }}
          />
        </Row>
        <Row>
          <Label>Vault API URL</Label>
          <input
            defaultValue={s.vaultUrl}
            onBlur={(e) => set({ vaultUrl: e.target.value.trim() })}
            placeholder="/vault  (dev proxy to 127.0.0.1:8765)"
            className="rounded-[8px] px-[10px] py-[5px] text-[12.5px] outline-none w-[240px]"
            style={{ background: C.inputBg, border: `1px solid ${C.borderBtn}`, color: C.text2 }}
          />
        </Row>
      </div>
    </div>
  )
}

function Row({ y = 0, children }) {
  return (
    <div className="absolute left-0 right-0 flex items-start justify-between gap-[20px]" style={{ top: y }}>
      {children}
    </div>
  )
}
const Label = ({ children }) => <div className="text-[13.5px]" style={{ color: C.text }}>{children}</div>
const Desc = ({ children }) => <div className="text-[12.5px] mt-[5px] max-w-[560px]" style={{ color: C.text3 }}>{children}</div>
const Sep = () => <div style={{ height: 1, background: C.modalDivider }} />

function Seg({ options, value, onChange }) {
  return (
    <div className="flex items-center rounded-[8px] overflow-hidden shrink-0" style={{ border: `1px solid ${C.borderBtn}`, background: C.inputBg }}>
      {options.map((o, i) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className="px-[14px] text-[12.5px]"
          style={{
            height: 28,
            background: value === o ? 'rgba(255,255,255,.14)' : 'transparent',
            color: value === o ? C.text : C.text3,
            borderLeft: i ? `1px solid ${C.borderBtn}` : 'none',
          }}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

function Select({ value, options, onChange, wide }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-[8px] rounded-[8px] px-[10px] text-[12.5px]"
        style={{ height: 30, minWidth: wide ? 200 : 100, background: C.inputBg, border: `1px solid ${C.borderBtn}`, color: C.text2 }}
      >
        <span className="truncate">{value}</span>
        <Icon d={P.chevronDown} size={12} className="opacity-70" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-[4px] rounded-[8px] py-[4px] min-w-[160px] shadow-2xl"
            style={{ background: '#2a2a29', border: '1px solid #3a3a39' }}>
            {options.map((o) => (
              <button key={o} onClick={() => { onChange(o); setOpen(false) }}
                className="flex items-center w-full px-[11px] py-[7px] text-left hover:bg-[#383837]">
                <span className="text-[12.5px] flex-1 truncate" style={{ color: C.text2 }}>{o}</span>
                {o === value && <Icon d={P.check} size={12} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ============ Privacy: never-check blacklist ============ */
function Privacy({ s, set }) {
  const [text, setText] = React.useState('')
  const list = s.blacklist || []
  return (
    <div className="py-[24px] pr-[20%]">
      <h2 style={{ fontSize: 20, color: C.text }}>Privacy &amp; access</h2>
      <p className="mt-[10px] text-[13px]" style={{ color: C.text3 }}>
        Default policy: check everything on every site and every AI after one-time permission.
        Add a URL, domain or pattern here to never check it again (default allow, explicit deny).
        Anything inaccessible is logged as “wasn't accessible – reason” instead of prompting you.
      </p>
      <div className="mt-[18px] flex gap-[8px]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="bank.com/*  or  https://private.example.com/page"
          className="flex-1 rounded-[8px] px-[10px] py-[7px] text-[13px] outline-none"
          style={{ background: C.inputBg, border: `1px solid ${C.borderBtn}`, color: C.text2 }}
        />
        <button
          onClick={() => { const v = text.trim(); if (v && !list.includes(v)) set({ blacklist: [...list, v] }); setText('') }}
          className="rounded-[8px] px-[14px] text-[13px]"
          style={{ background: C.btnBg, color: C.text }}
        >Add</button>
      </div>
      <div className="mt-[14px] space-y-[6px]">
        {list.length === 0 && <div className="text-[12.5px]" style={{ color: C.text3 }}>No excluded patterns — everything is checked.</div>}
        {list.map((p) => (
          <div key={p} className="flex items-center justify-between rounded-[8px] px-[10px] py-[7px]"
            style={{ background: C.inputBg, border: `1px solid ${C.borderBtn}` }}>
            <span className="text-[12.5px]" style={{ color: C.text2 }}>{p}</span>
            <button onClick={() => set({ blacklist: list.filter((x) => x !== p) })} style={{ color: C.text3 }} title="Revoke">
              <Icon d={P.x} size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============ Extensions ============ */
function Extensions({ onOpenApps }) {
  return (
    <div className="py-[24px] pr-[20%]">
      <h2 style={{ fontSize: 20, color: C.text }}>Extensions</h2>
      <p className="mt-[10px] text-[13px]" style={{ color: C.text3 }}>
        Claude Code (terminal / VS Code), Microsoft 365 and the Chrome extension collector.
      </p>
      <button onClick={onOpenApps} className="mt-[16px] rounded-[8px] px-[14px] py-[8px] text-[13px]"
        style={{ background: C.btnBg, color: C.text }}>
        Open apps &amp; extensions
      </button>
    </div>
  )
}

function Placeholder({ section }) {
  return (
    <div className="py-[24px] pr-[20%]">
      <h2 style={{ fontSize: 20, color: C.text }}>{section}</h2>
      <p className="mt-[10px] text-[13px]" style={{ color: C.text3 }}>
        This section is not part of the local build yet. Only what the screenshots define is implemented —
        nothing is faked.
      </p>
    </div>
  )
}
