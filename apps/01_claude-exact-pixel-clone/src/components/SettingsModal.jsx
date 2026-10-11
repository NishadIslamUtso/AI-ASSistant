import { useEffect, useState } from 'react'
import {
  X,
  Sliders,
  User,
  Shield,
  CreditCard,
  Blocks,
  Brain,
  Compass,
  Clock,
  Terminal,
  Cpu,
  Puzzle,
  Code2,
  Wrench,
  Plug,
  Monitor,
  Sun,
  Moon,
  Trash2,
  RefreshCw,
  Database,
} from 'lucide-react'
import Dropdown from './Dropdown.jsx'
import Dialog from './Dialog.jsx'
import { useSettings } from '../context/SettingsContext.jsx'
import { vault } from '../lib/vault.js'
import { modelSupportsImages } from '../lib/ollama.js'

/**
 * SettingsModal — screenshot 191707.png
 *
 * Left nav: General, Account, Privacy, Billing, Capabilities, Memory, Reflect,
 *           Time and focus, Claude Code, System, Extensions, Developer, Skills,
 *           Connectors
 * Right (General): Appearance — Theme / Chat font / Transcript size / Width /
 *           Motion / Voice (Language, Style, Speed)
 *
 * Everything the local build can actually honour is wired up; the Claude-cloud
 * only sections say so honestly instead of faking controls.
 */

/**
 * Measured from 191707.png: the nav is grouped, 263px wide, items on a 44px
 * pitch, and the group labels ("Settings", "This computer", "Customize") are
 * shown. The earlier flat 14-item list was a guess.
 */
const NAV_GROUPS = [
  {
    group: 'Settings',
    items: [
      { id: 'general', label: 'General', icon: Sliders },
      { id: 'account', label: 'Account', icon: User },
      { id: 'privacy', label: 'Privacy', icon: Shield },
      { id: 'billing', label: 'Billing', icon: CreditCard },
      { id: 'capabilities', label: 'Capabilities', icon: Blocks },
      { id: 'memory', label: 'Memory', icon: Brain },
      { id: 'reflect', label: 'Reflect', icon: Compass },
      { id: 'focus', label: 'Time and focus', icon: Clock },
      { id: 'claude-code', label: 'Claude Code', icon: Terminal },
    ],
  },
  {
    group: 'This computer',
    items: [
      { id: 'system', label: 'System', icon: Cpu },
      { id: 'extensions', label: 'Extensions', icon: Puzzle },
      { id: 'developer', label: 'Developer', icon: Code2 },
    ],
  },
  {
    group: 'Customize',
    items: [
      { id: 'skills', label: 'Skills', icon: Wrench },
      { id: 'connectors', label: 'Connectors', icon: Plug },
    ],
  },
]

const NAV = NAV_GROUPS.flatMap((g) => g.items)

export default function SettingsModal({
  onClose,
  onOpenAppsExtensions,
  onOpenVault,
  onResetData,
  initialTab = 'general',
}) {
  const { settings, update, resolvedTheme } = useSettings()
  const [tab, setTab] = useState(initialTab)
  const [vaultStatus, setVaultStatus] = useState(null)
  const [blacklist, setBlacklist] = useState([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [s, b] = await Promise.all([vault.status(), vault.blacklist()])
      if (!alive) return
      setVaultStatus(s)
      setBlacklist(b?.patterns || [])
    })()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <Dialog
      title={labelFor(tab)}
      onClose={onClose}
      className="w-[1000px] max-w-[calc(100vw-32px)] h-[640px] max-h-[calc(100vh-32px)]"
    >
      <div className="flex-1 flex min-h-0">
        {/* ── left nav ─────────────────────────────────────── */}
        <div className="w-[263px] shrink-0 bg-[var(--bg-side)] border-r border-[var(--line)] overflow-y-auto py-3">
          {NAV_GROUPS.map((g) => (
            <div key={g.group} className="mb-2">
              <div className="px-4 pb-1 text-[11px] uppercase tracking-wide text-[var(--ink3)]">
                {g.group}
              </div>
              {g.items.map((n) => {
                const Icon = n.icon
                const active = tab === n.id
                return (
                  <button
                    key={n.id}
                    onClick={() => setTab(n.id)}
                    className={`flex items-center gap-2.5 px-4 text-[13px] text-left ${
                      active
                        ? 'bg-[var(--bg-active)] text-[var(--ink)]'
                        : 'text-[var(--ink2)] hover:bg-[var(--bg-hover)] hover:text-[var(--ink)]'
                    }`}
                    style={{ width: 'calc(100% - 16px)', height: 44, margin: '0 8px', borderRadius: 8 }}
                  >
                    <Icon size={15} className="shrink-0 opacity-85" />
                    <span className="truncate">{n.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* ── right content ────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {tab === 'general' ? <Appearance settings={settings} update={update} /> : null}

            {tab === 'account' ? (
              <Section title="Account">
                <Field label="Name">
                  <input
                    value={settings.userName}
                    onChange={(e) => update({ userName: e.target.value })}
                    className="w-64 bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--border-strong)]"
                  />
                </Field>
                <Field label="Email">
                  <input
                    value={settings.userEmail}
                    onChange={(e) => update({ userEmail: e.target.value })}
                    className="w-72 bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--border-strong)]"
                  />
                </Field>
                <Field label="Initials" hint="Shown in the avatar">
                  <input
                    value={settings.userInitials}
                    maxLength={3}
                    onChange={(e) => update({ userInitials: e.target.value.toUpperCase() })}
                    className="w-20 bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--border-strong)]"
                  />
                </Field>
                <p className="mt-4 text-[12px] text-[var(--ink3)] leading-5 max-w-[520px]">
                  Local build: there is no sign-in. Your name and email are stored only in this
                  browser's localStorage and are never sent anywhere. They are never inferred from a
                  Windows path or a folder name.
                </p>
              </Section>
            ) : null}

            {tab === 'privacy' ? (
              <Section title="Privacy">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-3 max-w-[560px]">
                  <div className="text-[13px] text-[var(--ink)] mb-1">Never-check blacklist</div>
                  <div className="text-[12px] text-[var(--ink2)] mb-2 leading-5">
                    Default allow, explicit deny. Anything matching one of these patterns is never
                    checked or captured by the extension. Editable and revocable at any time.
                  </div>
                  {blacklist.length === 0 ? (
                    <div className="text-[12px] text-[var(--ink3)]">
                      No excluded patterns. Open the AI-Brain panel to add one
                      (e.g. <code className="font-mono">bank.com/*</code>).
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {blacklist.map((p) => (
                        <li key={p} className="text-[12px] font-mono text-[var(--ink2)]">
                          • {p}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    onClick={onOpenVault}
                    className="mt-3 text-[12px] text-[var(--ink)] underline underline-offset-2"
                  >
                    Manage in AI-Brain panel
                  </button>
                </div>
                <p className="mt-4 text-[12px] text-[var(--ink3)] leading-5 max-w-[520px]">
                  Never collected even with broad permission: passwords, cookies, auth tokens,
                  payment fields, unsent drafts, hidden keystrokes, continuous screenshots.
                </p>
              </Section>
            ) : null}

            {tab === 'capabilities' ? (
              <Section title="Capabilities">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-3 max-w-[560px] text-[13px] leading-6">
                  <KV k="Active model" v={settings.model} />
                  <KV k="Text" v="Yes" />
                  <KV k="Images (vision)" v={modelSupportsImages(settings.model) ? 'Yes' : 'No — pick a *-vl / llava model'} />
                  <KV k="Artifacts" v="HTML + SVG run in the preview panel; React shows code only" />
                  <KV k="Streaming" v="Yes (Ollama /api/chat)" />
                  <KV k="Tools / web search" v="Not in the local build" />
                </div>
                <p className="mt-3 text-[12px] text-[var(--ink3)] leading-5 max-w-[520px]">
                  Model-aware: controls that the selected model cannot support are marked, not
                  silently ignored.
                </p>

                <div className="mt-5 pt-4 border-t border-[var(--line)] max-w-[560px]">
                  <Toggle
                    label="Demo responder (used only when Ollama is offline)"
                    checked={Boolean(settings.demoMode)}
                    onChange={(v) => update({ demoMode: v })}
                  />
                  <p className="text-[11.5px] text-[var(--ink3)] leading-5">
                    Answers with canned text so the UI — streaming, markdown, artifacts — can be
                    tested without a model. Every demo reply says so at the top. It is never used
                    when a real model is reachable.
                  </p>
                </div>
              </Section>
            ) : null}

            {tab === 'memory' ? (
              <Section title="Memory">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-3 max-w-[560px] text-[13px] leading-6">
                  <KV k="Vault API" v={settings.vaultUrl} />
                  <KV
                    k="Status"
                    v={vaultStatus ? 'connected' : 'offline — start server/vault-api.cjs'}
                  />
                  {vaultStatus?.vault ? <KV k="Path" v={vaultStatus.vault} /> : null}
                  {vaultStatus?.counts ? (
                    <KV
                      k="Files"
                      v={`${vaultStatus.counts.files} · ${vaultStatus.counts.entities} entities`}
                    />
                  ) : null}
                </div>
                <p className="mt-3 text-[12px] text-[var(--ink3)] leading-5 max-w-[520px]">
                  The Obsidian vault is the canonical memory. Nothing else is authoritative —
                  indexes can always be rebuilt from the Markdown files.
                </p>
                <button
                  onClick={onOpenVault}
                  className="mt-3 text-[12px] text-[var(--ink)] underline underline-offset-2"
                >
                  Open AI-Brain panel
                </button>
              </Section>
            ) : null}

            {tab === 'system' ? (
              <Section title="System">
                <Field label="Ollama URL">
                  <input
                    value={settings.ollamaUrl}
                    onChange={(e) => update({ ollamaUrl: e.target.value })}
                    className="w-72 bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--border-strong)] font-mono"
                  />
                </Field>
                <Field label="Vault API URL">
                  <input
                    value={settings.vaultUrl}
                    onChange={(e) => update({ vaultUrl: e.target.value })}
                    className="w-72 bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--border-strong)] font-mono"
                  />
                </Field>
                <Toggle
                  label="Show File / Edit / View / Go / Help menu bar"
                  checked={settings.showMenuBar}
                  onChange={(v) => update({ showMenuBar: v })}
                />
                <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-3 max-w-[560px]">
                  <div className="text-[13px] text-[var(--ink)] mb-1 flex items-center gap-2">
                    <Database size={14} /> Local data
                  </div>
                  <p className="text-[12px] text-[var(--ink2)] leading-5 mb-3">
                    Chats, artifacts and settings live in this browser's localStorage. Use this if a
                    reply ever gets stuck repeating itself (the old "Tic Tac Toe loop").
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={onResetData}
                      className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg border border-[var(--danger)]/40 text-[var(--danger)] hover:bg-[var(--danger)]/10"
                    >
                      <Trash2 size={13} /> Reset local data
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-[var(--ink2)] hover:bg-[var(--bg-hover)]"
                    >
                      <RefreshCw size={13} /> Reload
                    </button>
                  </div>
                </div>
              </Section>
            ) : null}

            {tab === 'extensions' ? (
              <Section title="Extensions">
                <p className="text-[13px] text-[var(--ink2)] leading-6 max-w-[520px]">
                  Browser extension for Chrome: captures pages and AI chats into the vault, injects
                  saved Capsules into any chat box, and gives Quillbot-style inline suggestions.
                  Local-only, no account.
                </p>
                <button
                  onClick={onOpenAppsExtensions}
                  className="mt-3 text-[13px] px-3 py-2 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] text-[var(--ink)]"
                >
                  Open apps and extensions
                </button>
              </Section>
            ) : null}

            {['billing', 'reflect', 'focus', 'claude-code', 'developer', 'skills', 'connectors'].includes(
              tab,
            ) ? (
              <NotInLocalBuild tab={tab} />
            ) : null}
          </div>
        </div>
      </div>
    </Dialog>
  )
}

/* ── pieces ──────────────────────────────────────────────────── */

function labelFor(tab) {
  return NAV.find((n) => n.id === tab)?.label || 'Settings'
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-[17px] font-medium text-[var(--ink)] mb-4">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="flex items-start gap-4 mb-3">
      <div className="w-[96px] shrink-0 pt-2 text-[13px] text-[var(--ink)]">
        {label}
        {hint ? <div className="text-[11px] text-[var(--ink3)]">{hint}</div> : null}
      </div>
      {children}
    </div>
  )
}

function KV({ k, v }) {
  return (
    <div className="flex gap-3">
      <span className="w-[120px] shrink-0 text-[var(--ink2)]">{k}</span>
      <span className="text-[var(--ink)] break-all">{v}</span>
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full max-w-[560px] flex items-center justify-between gap-4 py-2 text-left"
    >
      <span className="text-[13px] text-[var(--ink)]">{label}</span>
      <span
        className={`w-9 h-5 rounded-full relative transition-colors ${
          checked ? 'bg-[var(--accent)]' : 'bg-[var(--border-strong)]'
        }`}
      >
        <span
          className={`absolute top-[2px] w-4 h-4 rounded-full bg-white transition-all ${
            checked ? 'left-[18px]' : 'left-[2px]'
          }`}
        />
      </span>
    </button>
  )
}

function ThemeTiles({ value, onChange }) {
  const opts = [
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ]
  return (
    <div className="flex gap-2">
      {opts.map((o) => {
        const Icon = o.icon
        const active = value === o.value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`w-[92px] py-3 rounded-lg flex flex-col items-center gap-2 border transition-colors ${
              active
                ? 'border-white bg-[var(--bg-hover)] text-[var(--ink)]'
                : 'border-[var(--border-strong)] bg-[var(--bg-elev)] text-[var(--ink2)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <Icon size={20} />
            <span className="text-[12px]">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="inline-flex bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg p-0.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-3.5 py-1.5 text-[12px] rounded-[6px] transition-colors ${
            value === o ? 'bg-[var(--bg-active)] text-[var(--ink)]' : 'text-[var(--ink2)] hover:text-[var(--ink)]'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

function Appearance({ settings, update }) {
  return (
    <Section title="Appearance">
      <Field label="Theme">
        <ThemeTiles value={settings.theme} onChange={(v) => update({ theme: v })} />
      </Field>

      <Field label="Chat font">
        <div className="w-64">
          <Dropdown
            value={settings.chatFont}
            onChange={(v) => update({ chatFont: v })}
            options={['Default', 'Anthropic Serif', 'Monospace'].map((v) => ({ value: v, label: v }))}
          />
        </div>
      </Field>

      <Field label="Transcript size">
        <Segmented
          value={settings.transcriptSize}
          options={['Small', 'Medium', 'Large']}
          onChange={(v) => update({ transcriptSize: v.toLowerCase() })}
        />
      </Field>

      <Field label="Width">
        <Segmented
          value={settings.width}
          options={['Narrow', 'Medium', 'Wide']}
          onChange={(v) => update({ width: v.toLowerCase() })}
        />
      </Field>

      <Field label="Motion">
        <Segmented
          value={settings.motion}
          options={['System', 'Reduced']}
          onChange={(v) => update({ motion: v.toLowerCase() })}
        />
      </Field>

      <div className="mt-6 pt-5 border-t border-[var(--line)]">
        <h4 className="text-[13px] text-[var(--ink)] mb-3">Voice</h4>
        <Field label="Language">
          <div className="w-64">
            <Dropdown
              value={settings.voiceLanguage}
              onChange={(v) => update({ voiceLanguage: v })}
              options={['English', 'Bengali', 'Auto'].map((v) => ({ value: v, label: v }))}
            />
          </div>
        </Field>
        <Field label="Style">
          <div className="w-64">
            <Dropdown
              value={settings.voiceStyle}
              onChange={(v) => update({ voiceStyle: v })}
              options={['Buttery', 'Clear', 'Crisp', 'Warm'].map((v) => ({ value: v, label: v }))}
            />
          </div>
        </Field>
        <Field label="Speed">
          <div className="w-64">
            <Dropdown
              value={settings.voiceSpeed}
              onChange={(v) => update({ voiceSpeed: v })}
              options={['Slow', 'Normal', 'Fast'].map((v) => ({ value: v, label: v }))}
            />
          </div>
        </Field>
        <p className="text-[11px] text-[var(--ink3)] max-w-[520px] leading-5">
          Voice preferences are stored and applied to browser speech synthesis when it is used.
          Playback happens locally.
        </p>
      </div>
    </Section>
  )
}

function NotInLocalBuild({ tab }) {
  const notes = {
    billing: 'Billing is a Claude-cloud concept. This build is local and free — there is nothing to bill.',
    reflect: 'Reflect (periodic reflection over your memory) is planned. The vault already keeps the material it would reflect on (03 Memory, 04 Working Memory).',
    focus: 'Time and focus limits are a Claude-cloud feature. Not implemented locally.',
    'claude-code': 'Claude Code is Anthropic’s terminal agent. Not bundled. The local equivalent is the artifact runner plus the vault.',
    developer: 'Developer settings for hosted API keys are not applicable — this build talks to a local Ollama server and keeps everything on the machine.',
    skills: 'Skills are not in the local build yet. Capsules in the AI-Brain panel are the local equivalent of a reusable skill.',
    connectors: 'Connectors are not in the local build. The vault API at 127.0.0.1:8765 is the only integration point, and it is local-only.',
  }
  return (
    <div className="max-w-[560px] rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-4">
      <div className="text-[13px] text-[var(--ink)] mb-2">Not in the local build</div>
      <p className="text-[12.5px] text-[var(--ink2)] leading-6">{notes[tab]}</p>
    </div>
  )
}
