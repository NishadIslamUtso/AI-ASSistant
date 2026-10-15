import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, FolderOpen, RefreshCw, Terminal, Trash2 } from 'lucide-react'
import { useEngine } from '@/state/engine'
import { bridge } from '@/platform/bridge'

/**
 * Code (06) — the engine's workspace, on screen.
 *
 * The one place that answers "where is the engine working, and what does it
 * remember?" — the folder, the throttle, and the resumable threads per
 * folder. Every piece is the real machinery from Track A wearing its face:
 * the workspace is the one the engine genuinely uses, the threads are the
 * ones a fresh launch genuinely continues, and forgetting one means the next
 * launch starts clean.
 */

const leaf = (folder: string): string => folder.split(/[\\/]/).filter(Boolean).at(-1) ?? folder

const THROTTLE: Array<{ id: 'ask' | 'edits' | 'full'; label: string; note: string }> = [
  { id: 'ask', label: 'Ask me', note: 'Every step beyond reading asks you first.' },
  { id: 'edits', label: 'Auto-edits', note: 'Files change unasked; other commands still ask.' },
  {
    id: 'full',
    label: 'Full speed',
    note: 'Everything runs unasked. The engine\u2019s own deny rules and guarded deletions still hold.',
  },
]

export default function CodeView() {
  const engine = useEngine()
  const [sessions, setSessions] = useState<Array<{ workspace: string; sessionId: string }>>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  const load = useCallback((): void => {
    bridge.engine
      .sessions()
      .then((list) => {
        setSessions(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const workspace = engine.settings.workspace
  const current = workspace || 'the vault (default)'

  return (
    <div className="flex-1 overflow-y-auto" aria-label="Code">
      <div className="mx-auto w-full max-w-[var(--chat-width)] px-4 py-8">
        <header className="flex items-center gap-2.5">
          <Terminal size={18} className="text-muted" aria-hidden />
          <h1 className="text-[20px] font-semibold text-ink">Code</h1>
          <span
            className={`h-2 w-2 rounded-full ${engine.alive ? 'animate-pulse bg-ok' : 'bg-muted'}`}
            title={engine.alive ? 'The engine is running' : 'The engine starts with the next task'}
          />
        </header>

        {/* The workspace: where engine work actually happens. */}
        <section className="mt-5 rounded-xl border border-line bg-card p-3.5" aria-label="Workspace">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted">Workspace</h2>
          <p className="mt-1.5 truncate text-[13.5px] text-ink" title={workspace || undefined}>
            {current}
          </p>
          <p className="mt-0.5 text-[11.5px] text-muted">
            {engine.settings.id} · {engine.settings.model} · brain {engine.settings.approval === 'full' ? 'at full speed' : engine.settings.approval === 'edits' ? 'auto-edits' : 'asking first'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => void engine.pickWorkspace().then(load)}
              className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] text-muted hover:text-ink"
            >
              <FolderOpen size={11} aria-hidden /> Choose folder…
            </button>
            {workspace ? (
              <button
                type="button"
                onClick={() => void bridge.engine.setWorkspace('').then(load)}
                className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] text-muted hover:text-ink"
              >
                Back to the vault
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                const folder = workspace
                if (!folder) {
                  setNotice('The vault is the workplace; choose a folder first to open one.')
                  return
                }
                void bridge.engine.openFolder(folder)
              }}
              className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] text-muted hover:text-ink"
            >
              <ExternalLink size={11} aria-hidden /> Open folder
            </button>
            {notice ? <span className="text-[11.5px] text-muted">{notice}</span> : null}
          </div>

          {/* The throttle, quick-set. Same control as the bay, same engine. */}
          <div className="mt-3 flex items-center gap-1.5" role="radiogroup" aria-label="Throttle">
            {THROTTLE.map((step) => {
              const active = (engine.settings.approval ?? 'ask') === step.id
              return (
                <button
                  key={step.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  title={step.note}
                  onClick={() => void engine.setApproval(step.id)}
                  className={`rounded-lg px-2.5 py-1 text-[11.5px] transition-colors ${
                    active ? 'bg-accent text-white' : 'border border-line text-muted hover:text-ink'
                  }`}
                >
                  {step.label}
                </button>
              )
            })}
          </div>
        </section>

        {/* The threads: what a fresh launch will continue, per folder. */}
        <section className="mt-5" aria-label="Engine sessions">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted">Continuing threads</h2>
            <button
              type="button"
              onClick={load}
              aria-label="Refresh sessions"
              className="rounded-lg p-1 text-muted hover:text-ink"
            >
              <RefreshCw size={11} aria-hidden />
            </button>
          </div>
          {loading ? (
            <p className="mt-2 text-[12.5px] text-muted">Reading the sessions…</p>
          ) : sessions.length === 0 ? (
            <p className="mt-2 text-[12.5px] text-muted">
              None yet. Give the engine work in a folder and its thread is remembered here — close the app, come back,
              and the conversation continues.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1">
              {sessions.map((session) => (
                <li
                  key={session.workspace}
                  className="flex items-center gap-2.5 rounded-lg border border-line bg-card px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink" title={session.workspace}>
                    {leaf(session.workspace)}
                  </span>
                  <span className="shrink-0 font-mono text-[10.5px] text-muted">{session.sessionId.slice(0, 12)}…</span>
                  <button
                    type="button"
                    onClick={() => {
                      void bridge.engine.forgetSession(session.workspace).then(load)
                    }}
                    title="Forget this thread — the next launch starts clean"
                    aria-label={`Forget the thread in ${session.workspace}`}
                    className="shrink-0 rounded-lg p-1 text-muted hover:text-warn"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[11px] text-muted">
            Threads continue automatically: the next task in the same folder picks up where this one ended.
          </p>
        </section>
      </div>
    </div>
  )
}
