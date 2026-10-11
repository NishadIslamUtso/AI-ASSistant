import { useEffect, useMemo, useState } from 'react'
import {
  X,
  Database,
  Search,
  Plus,
  Trash2,
  Ban,
  BookOpen,
  ListChecks,
  RefreshCw,
  CornerDownLeft,
  AlertCircle,
} from 'lucide-react'
import { vault } from '../lib/vault.js'

/**
 * VaultPanel — the AI-Brain side panel. The app is the DRIVER of the vault:
 * it reads memory out of the Obsidian Markdown files and writes captures back.
 *
 *  Capsules  — Capsule Hub style library. Drag a card onto the composer (or press
 *              Insert) to inject goals / constraints / background / decisions.
 *  Blacklist — never-check patterns. Default allow, explicit deny, editable and
 *              revocable. Stored in 00 System/Privacy & Access.md.
 *  Today     — Current Snapshot + Open Loops from 04 Working Memory.
 */
export default function VaultPanel({ onClose, onInsertCapsule, onOpenToday }) {
  const [tab, setTab] = useState('capsules')
  const [status, setStatus] = useState(null)
  const [capsules, setCapsules] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [today, setToday] = useState(null)
  const [patterns, setPatterns] = useState([])
  const [draft, setDraft] = useState('')

  async function refresh() {
    setLoading(true)
    const [s, c, t, b] = await Promise.all([
      vault.status(),
      vault.capsules(),
      vault.today(),
      vault.blacklist(),
    ])
    setStatus(s)
    setCapsules(c?.items || [])
    setToday(t)
    setPatterns(b?.patterns || [])
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return capsules
    return capsules.filter((c) =>
      `${c.title} ${c.summary || ''} ${c.type || ''}`.toLowerCase().includes(needle),
    )
  }, [capsules, q])

  async function addPattern() {
    const p = draft.trim()
    if (!p) return
    const next = Array.from(new Set([...patterns, p]))
    setPatterns(next)
    setDraft('')
    await vault.setBlacklist(next)
  }

  async function removePattern(p) {
    const next = patterns.filter((x) => x !== p)
    setPatterns(next)
    await vault.setBlacklist(next)
  }

  const offline = status === null

  return (
    <div className="w-[360px] shrink-0 bg-[var(--bg-side)] border-l border-[var(--line)] h-full flex flex-col">
      {/* header */}
      <div className="h-11 shrink-0 flex items-center gap-2 px-3 border-b border-[var(--line)]">
        <Database size={15} className="text-[var(--accent)] shrink-0" />
        <span className="text-[13px] text-[var(--ink)] flex-1 truncate">AI-Brain</span>
        <button
          onClick={refresh}
          title="Refresh"
          className="w-7 h-7 rounded-md hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--ink2)]"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={onClose}
          title="Hide"
          className="w-7 h-7 rounded-md hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--ink2)]"
        >
          <X size={14} />
        </button>
      </div>

      {/* status strip */}
      <div className="px-3 py-2 border-b border-[var(--line)] text-[11px] flex items-center gap-1.5">
        {offline ? (
          <>
            <AlertCircle size={12} className="text-[var(--danger)]" />
            <span className="text-[var(--ink2)]">
              Vault API offline — run <code className="font-mono">server\vault-api.cjs</code>
            </span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[var(--ink2)] truncate" title={status?.vault}>
              {status?.vault || 'vault connected'}
            </span>
          </>
        )}
      </div>

      {/* tabs */}
      <div className="h-9 shrink-0 flex items-center gap-1 px-2 border-b border-[var(--line)]">
        <Tab active={tab === 'capsules'} onClick={() => setTab('capsules')}>
          Capsules {capsules.length ? `(${capsules.length})` : ''}
        </Tab>
        <Tab active={tab === 'blacklist'} onClick={() => setTab('blacklist')}>
          <Ban size={11} /> Never-check
        </Tab>
        <Tab active={tab === 'today'} onClick={() => setTab('today')}>
          Today
        </Tab>
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {tab === 'capsules' ? (
          <>
            <div className="relative mb-3">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink3)] pointer-events-none"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search capsules"
                className="w-full bg-[var(--bg-hover)] border border-transparent focus:border-[var(--border-strong)] rounded-lg pl-8 pr-2 py-[6px] text-[12.5px] text-[var(--ink)] placeholder-[var(--ink3)] outline-none"
              />
            </div>

            {offline ? (
              <Empty text="Start the vault API to see your capsules." />
            ) : filtered.length === 0 ? (
              <Empty
                text={
                  capsules.length === 0
                    ? 'No capsules yet. Capture one from the browser extension, or write a note into 03 Memory/Entities.'
                    : 'Nothing matches that search.'
                }
              />
            ) : (
              <div className="space-y-2">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        'application/x-ai-capsule',
                        JSON.stringify({
                          id: c.id,
                          title: c.title,
                          goals: c.goals || [],
                          constraints: c.constraints || [],
                          background: c.background || c.summary || '',
                          decisions: c.decisions || [],
                        }),
                      )
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    className="group rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-2.5 cursor-grab active:cursor-grabbing hover:border-[var(--border-strong)]"
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] text-[var(--ink)] truncate">{c.title}</div>
                        <div className="text-[11px] text-[var(--ink3)] mt-0.5">
                          {c.type || 'entity'}
                          {c.updated ? ` · ${c.updated}` : ''}
                        </div>
                        {c.summary ? (
                          <div className="text-[11.5px] text-[var(--ink2)] leading-4 mt-1.5 line-clamp-3">
                            {c.summary}
                          </div>
                        ) : null}
                      </div>
                      <button
                        onClick={() => onInsertCapsule?.(c)}
                        title="Insert into composer"
                        className="shrink-0 w-6 h-6 rounded-md hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--ink3)] hover:text-[var(--ink)] opacity-0 group-hover:opacity-100"
                      >
                        <CornerDownLeft size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-3 text-[11px] text-[var(--ink3)] leading-4">
              Drag a capsule onto the composer to inject it into your next message.
            </p>
          </>
        ) : null}

        {tab === 'blacklist' ? (
          <>
            <div className="flex gap-1.5 mb-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPattern()}
                placeholder="bank.com/*  or  https://site/page"
                className="flex-1 min-w-0 bg-[var(--bg-hover)] border border-transparent focus:border-[var(--border-strong)] rounded-lg px-2.5 py-[6px] text-[12.5px] text-[var(--ink)] placeholder-[var(--ink3)] outline-none font-mono"
              />
              <button
                onClick={addPattern}
                className="shrink-0 w-8 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] flex items-center justify-center text-[var(--ink2)]"
                title="Add pattern"
              >
                <Plus size={14} />
              </button>
            </div>

            {patterns.length === 0 ? (
              <Empty text="No excluded patterns. Default is allow; add a pattern to deny it forever." />
            ) : (
              <ul className="space-y-1.5">
                {patterns.map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 py-1.5"
                  >
                    <Ban size={12} className="text-[var(--danger)] shrink-0" />
                    <span className="flex-1 truncate font-mono text-[11.5px] text-[var(--ink2)]">
                      {p}
                    </span>
                    <button
                      onClick={() => removePattern(p)}
                      title="Remove (revoke)"
                      className="text-[var(--ink3)] hover:text-[var(--danger)]"
                    >
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 text-[11px] text-[var(--ink3)] leading-4">
              Stored in 00 System/Privacy &amp; Access.md and mirrored to the extension. Anything
              matching is never checked or captured. Removable at any time.
            </p>
          </>
        ) : null}

        {tab === 'today' ? (
          <>
            <Block title="Current Snapshot" icon={<BookOpen size={12} />}>
              {today?.snapshot?.trim() ? (
                <pre className="whitespace-pre-wrap font-sans text-[11.5px] leading-5 text-[var(--ink2)]">
                  {today.snapshot.trim()}
                </pre>
              ) : (
                <Empty small text="04 Working Memory/Current Snapshot.md is empty." />
              )}
            </Block>

            <Block title="Open Loops" icon={<ListChecks size={12} />}>
              {today?.openLoops?.trim() ? (
                <pre className="whitespace-pre-wrap font-sans text-[11.5px] leading-5 text-[var(--ink2)]">
                  {today.openLoops.trim()}
                </pre>
              ) : (
                <Empty small text="04 Working Memory/Open Loops.md is empty." />
              )}
            </Block>

            {today?.journalPath ? (
              <Block title="Today's journal">
                <code className="font-mono text-[11px] text-[var(--ink2)]">{today.journalPath}</code>
              </Block>
            ) : null}

            <button
              onClick={onOpenToday}
              className="w-full text-[12px] px-3 py-2 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-strong)] text-[var(--ink)] hover:bg-[var(--bg-active)]"
            >
              Open full Today view
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}

function Tab({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] ${
        active
          ? 'bg-[var(--bg-hover)] text-[var(--ink)]'
          : 'text-[var(--ink2)] hover:bg-[var(--bg-hover)] hover:text-[var(--ink)]'
      }`}
    >
      {children}
    </button>
  )
}

function Block({ title, icon, children }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--ink3)] mb-1.5">
        {icon}
        {title}
      </div>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-2.5">{children}</div>
    </div>
  )
}

function Empty({ text, small }) {
  return <div className={`${small ? 'text-[11px]' : 'text-[12px]'} text-[var(--ink3)] leading-5`}>{text}</div>
}
