import { useEffect, useState } from 'react'
import { Handshake, Minimize2, Wrench, FilePen, Terminal, Search, CircleCheck, TriangleAlert, Square, X } from 'lucide-react'
import { buildHandoff, handoffFileName } from '@shared/lib/handoff'
import { pickGerund } from '@shared/lib/gerunds'
import { BRIEF_ORDER } from '@shared/lib/compact'
import { bridge } from '@/platform/bridge'
import { useEngine, type EngineItem } from '@/state/engine'
import { cancelBrief, clearCompactNotice, finishCompact, useCompact, writeBrief } from '@/state/compact'

/**
 * The engine's work order, drawn where the conversation can see it.
 *
 * The engine is not a chat partner: it is a worker. Its turn reads as a card —
 * what was asked, what it touched, what it needs approved, how it ended — in
 * the same visual language as the rest of the app (the same tokens, the same
 * rounded cards, nothing new invented).
 */
type Kept = { copy: string; original: string; at: string }

export default function EnginePanel() {
  const engine = useEngine()
  const turn = engine.turn
  const [handed, setHanded] = useState('')
  // What the app kept before allowed writes this session, and what a restore said.
  const [kept, setKept] = useState<Kept[]>([])
  const [restored, setRestored] = useState('')
  const finished = turn?.state === 'done' || turn?.state === 'error'
  useEffect(() => {
    if (!finished) return
    void bridge.engine.checkpoints.list().then((answer) => {
      if (answer.ok) setKept(answer.checkpoints.slice(0, 3))
    })
  }, [finished])
  // The working word: one per turn, turning over while the engine works, so
  // a wait reads as a worker at work rather than a frozen card.
  const running = turn?.state === 'running'
  const [word, setWord] = useState(() => pickGerund())
  useEffect(() => {
    if (!running) return
    setWord(pickGerund())
    const timer = setInterval(() => setWord(pickGerund()), 3_500)
    return () => clearInterval(timer)
  }, [running])
  const [compacting, setCompacting] = useState(false)
  const compact = useCompact()
  if (!turn) return null

  // The handoff: the finished turn written into the vault as one document a
  // later session can continue from — and copied, so it can go anywhere.
  const handOff = (): void => {
    if (turn.state === 'running') return
    const markdown = buildHandoff({
      prompt: turn.prompt,
      items: turn.items,
      state: turn.state,
      sessionId: turn.sessionId,
      usage: turn.usage,
      engine: engine.settings.id,
      model: engine.settings.model,
      workspace: engine.settings.workspace,
      date: new Date().toISOString(),
    })
    const name = handoffFileName(new Date().toISOString(), turn.prompt).split('/').at(-1) ?? 'handoff.md'
    void bridge.vault.saveHandoff(name, markdown).then((answer) => {
      void navigator.clipboard?.writeText(markdown).catch(() => undefined)
      setHanded(answer.ok ? `Saved to the vault: ${answer.answer} (also copied)` : answer.answer)
    })
  }

  return (
    <>
    <section
      aria-label="Engine work"
      className="mx-auto mb-3 w-full max-w-[var(--chat-width)] rounded-xl border border-line bg-card px-4 py-3"
    >
      <header className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            turn.state === 'running' ? 'bg-warn' : turn.state === 'error' ? 'bg-warn' : 'bg-ok'
          }`}
        />
        <h2 className="text-[12px] font-medium text-muted">
          Engine · {engine.settings.id} · {engine.settings.model}
          {' · ' + (engine.settings.workspace ? engine.settings.workspace.split(/[\\/]/).filter(Boolean).at(-1) : 'vault')}
          {turn.state === 'running' ? ` · ${word}…` : turn.state === 'error' ? ' · stopped' : ' · done'}
        </h2>
        {turn.state === 'running' ? (
          <button
            type="button"
            onClick={() => void engine.stop()}
            className="ml-auto flex items-center gap-1 rounded-lg border border-line px-2 py-0.5 text-[11px] text-muted hover:text-ink"
          >
            <Square size={10} /> Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={handOff}
            title="Write this finished task into the vault as a document any later session can continue from"
            className="ml-auto flex items-center gap-1 rounded-lg border border-line px-2 py-0.5 text-[11px] text-muted hover:text-ink"
          >
            <Handshake size={10} /> Hand off
          </button>
        )}
        {turn.state !== 'running' ? (
          <button
            type="button"
            onClick={() => setCompacting(true)}
            title="Compact: the engine pours this conversation into a brief, the session ends fresh, the brief rides along"
            className="flex items-center gap-1 rounded-lg border border-line px-2 py-0.5 text-[11px] text-muted hover:text-ink"
          >
            <Minimize2 size={10} /> Compact
          </button>
        ) : null}
      </header>

      {compact.notice ? (
        <p role="status" className="mt-1.5 rounded-lg border border-line bg-bg px-2 py-1 text-[11.5px] leading-relaxed text-ink">
          {compact.notice}
          <button type="button" onClick={clearCompactNotice} aria-label="Dismiss" className="ml-2 text-muted hover:text-ink">×</button>
        </p>
      ) : null}

      <p className="mt-1.5 line-clamp-3 text-[12.5px] text-muted">
        ▸ {turn.prompt}
        {turn.pictures ? <span className="text-muted"> + {turn.pictures} picture{turn.pictures === 1 ? '' : 's'}</span> : null}
      </p>

      <ul className="mt-2 flex flex-col gap-1.5">
        {turn.state === 'running' && turn.items.length === 0 ? (
          <li className="text-[12.5px] text-muted" aria-live="polite">{word}…</li>
        ) : null}
        {turn.items.map((item, index) => {
          // The thinking block that is still being written stays unfolded;
          // once the answer starts (or the turn ends) it folds away.
          const live = turn.state === 'running' && item.kind === 'thinking' && index === turn.items.length - 1
          return <EngineItemRow key={`${index}-${live ? 'live' : 'kept'}`} item={item} live={live} />
        })}
      </ul>

      {handed ? <p className="mt-1 text-[11px] text-muted">{handed}</p> : null}
      {finished && kept.length > 0 ? (
        <div className="mt-2 rounded-lg border border-line bg-bg p-2">
          <p className="text-[11px] text-muted">Kept before the engine changed a file, newest first:</p>
          <ul className="mt-1 flex flex-col gap-1">
            {kept.map(entry => (
              <li key={entry.copy} className="flex items-center gap-2 text-[11.5px]">
                <span className="min-w-0 flex-1 truncate text-muted" title={entry.original}>
                  {entry.original.split(/[\\/]/).filter(Boolean).at(-1)} · {new Date(entry.at).toLocaleTimeString()}
                </span>
                <button
                  type="button"
                  title={`Put the older self of ${entry.original} back`}
                  onClick={() => {
                    void bridge.engine.checkpoints.restore(entry.copy).then((answer) => {
                      setRestored(answer.answer)
                      if (answer.ok) setKept(current => current.filter(row => row.copy !== entry.copy))
                    })
                  }}
                  className="rounded-lg border border-line px-2 py-0.5 text-[11px] text-muted hover:text-ink"
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
          {restored ? <p className="mt-1 text-[11px] text-muted">{restored}</p> : null}
        </div>
      ) : null}
      {turn.usage && turn.state !== 'running' ? (
        <p className="mt-2 text-[11px] text-muted" title="What the engine itself reported for this turn">
          {turn.usage.inTokens.toLocaleString()} in · {turn.usage.outTokens.toLocaleString()} out
          {turn.usage.durationMs !== null ? ` · ${(turn.usage.durationMs / 1000).toFixed(1)}s` : ''}
          {turn.usage.costUsd !== null ? ` · $${turn.usage.costUsd.toFixed(4)}` : ''}
          {turn.bumps ? ` · ${turn.bumps} bump${turn.bumps === 1 ? '' : 's'}, recovered` : ''}
        </p>
      ) : null}

      {turn.permissions.length > 0 ? (
        <div className="mt-2.5 rounded-lg border border-line bg-bg p-2.5">
          <p className="text-[12.5px] text-ink">
            The engine wants to use{' '}
            <span className="font-medium">{turn.permissions[0].tool}</span>
            {turn.permissions.length > 1 ? (
              <span className="ml-2 rounded-md border border-line px-1.5 py-0.5 text-[10.5px] text-muted">
                +{turn.permissions.length - 1} more waiting
              </span>
            ) : null}
          </p>
          {turn.permissions[0].summary ? (
            <p className="mt-0.5 break-words font-mono text-[11.5px] text-muted">{turn.permissions[0].summary}</p>
          ) : null}
          {turn.permissions[0].detail ? <DiffBlock detail={turn.permissions[0].detail} /> : null}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void engine.answer(true)}
              className="rounded-lg border border-ok/50 px-2.5 py-1 text-[12px] text-ink hover:border-ok"
            >
              Allow
            </button>
            <button
              type="button"
              onClick={() => void engine.answer(false)}
              className="rounded-lg border border-line px-2.5 py-1 text-[12px] text-muted hover:text-ink"
            >
              Deny
            </button>
          </div>
        </div>
      ) : null}
    </section>
    {compacting ? <CompactDialog onClose={() => setCompacting(false)} /> : null}
    </>
  )
}

/** One line of the engine's story, with the icon that matches the act. */
function EngineItemRow({ item, live = false }: { item: EngineItem; live?: boolean }) {
  if (item.kind === 'thinking') {
    // The model's scratchwork, folded like the chat brain's thinking. While
    // it is the newest thing in a running turn it stays open; afterwards it
    // is one click, never noise.
    return (
      <li>
        <details
          open={live || undefined}
          className="rounded-lg border border-line bg-panel/60 px-3 py-2"
        >
          <summary className="cursor-pointer text-[12px] text-muted">
            Thinking{live ? ', still going' : ''}
          </summary>
          <p className="mt-2 whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-muted">
            {item.text}
          </p>
        </details>
      </li>
    )
  }
  if (item.kind === 'text') {
    return <li className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-ink">{item.text}</li>
  }
  if (item.kind === 'error') {
    return (
      <li className="flex items-start gap-1.5 text-[12.5px] text-warn">
        <TriangleAlert size={13} className="mt-0.5 shrink-0" />
        <span className="break-words">{item.text}</span>
      </li>
    )
  }
  if (item.kind === 'status') {
    return (
      <li className="flex items-center gap-1.5 text-[11.5px] text-muted">
        <CircleCheck size={12} className="shrink-0" /> {item.text}
      </li>
    )
  }
  return (
    <li className="flex items-start gap-1.5 text-[12.5px] text-muted">
      <ToolIcon name={item.name} />
      <span className="min-w-0">
        <span className="text-ink">{item.name}</span>
        {item.summary ? <span className="break-all font-mono text-[11.5px]"> {item.summary}</span> : null}
      </span>
    </li>
  )
}

function ToolIcon({ name }: { name: string }) {
  const className = 'mt-0.5 shrink-0'
  if (name === 'Bash' || name === 'bash') return <Terminal size={13} className={className} />
  if (name === 'Read' || name === 'Write' || name === 'Edit' || name === 'NotebookEdit')
    return <FilePen size={13} className={className} />
  if (name === 'Grep' || name === 'Glob') return <Search size={13} className={className} />
  return <Wrench size={13} className={className} />
}


/**
 * A permission card's detail, read for shape: when it carries a diff (the
 * engine's edit requests do), the changed lines are shown red and green so a
 * person can SEE the edit before allowing it — Nimbalyst's red/green review,
 * sized to our cards.
 *
 * The honesty line: the engine's own permission door allows or denies a whole
 * edit. A "hunk" cannot be half-applied through it, so there are no per-hunk
 * buttons here — only the full change, coloured, and one Allow / Deny pair
 * that means the whole change.
 */
export function DiffBlock({ detail }: { detail: string }) {
  const lines = detail.split('\n')
  const looksLikeDiff =
    lines.filter(line => /^(---|\+\+\+|@@|[+-])\s?/.test(line)).length >= 2 && lines.length >= 3
  if (!looksLikeDiff) {
    return (
      <pre className="mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-line bg-panel p-2 font-mono text-[11px] leading-relaxed text-muted">
        {detail}
      </pre>
    )
  }
  return (
    <pre className="mt-1.5 max-h-56 overflow-auto whitespace-pre rounded-md border border-line bg-panel p-2 font-mono text-[11px] leading-relaxed">
      {lines.map((line, index) => {
        const kind = line.startsWith('+') && !line.startsWith('+++') ? 'add' : line.startsWith('-') && !line.startsWith('---') ? 'del' : line.startsWith('@@') ? 'hunk' : 'ctx'
        return (
          <div
            key={index}
            className={
              kind === 'add'
                ? 'bg-ok/10 text-ok'
                : kind === 'del'
                  ? 'bg-warn/10 text-warn'
                  : kind === 'hunk'
                    ? 'text-accent'
                    : 'text-muted'
            }
          >
            {line || ' '}
          </div>
        )
      })}
    </pre>
  )
}

/**
 * The Compact dialog, in two honest steps. Step one shows the work order and
 * lets the engine write the brief; step two shows the brief IN FULL and only
 * then ends the session. Cancel at any point and the conversation is exactly
 * as it was — a compaction that did not happen costs nothing.
 */
function CompactDialog({ onClose }: { onClose: () => void }) {
  const compact = useCompact()
  const engine = useEngine()
  const busy = compact.phase === 'briefing' || compact.phase === 'ending'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" role="dialog" aria-label="Compact the conversation" onClick={() => { if (!busy) { cancelBrief(); onClose() } }}>
      <div className="max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-2xl border border-line bg-card p-5" onClick={event => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Compact the conversation</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Only the engine knows how full its head is. Compact asks it to pour what matters into a
              brief, ends this session, and hands the brief to the next one. The cards above stay here;
              nothing you can see is deleted.
            </p>
          </div>
          <button type="button" onClick={() => { if (!busy) { cancelBrief(); onClose() } }} aria-label="Close" className="text-muted hover:text-ink">
            <X size={15} />
          </button>
        </div>

        {compact.phase === 'idle' || compact.phase === 'briefing' ? (
          <>
            <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-muted">What will be sent</p>
            <pre className="mt-1.5 max-h-[160px] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-bg p-2.5 text-[12px] leading-relaxed text-ink">
              {BRIEF_ORDER}
            </pre>
            {compact.error ? <p className="mt-2 text-[11.5px] text-warn">{compact.error}</p> : null}
            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-[11px] leading-snug text-muted">The engine writes the brief as a normal turn; nothing ends yet.</p>
              <button
                type="button"
                onClick={() => void writeBrief()}
                disabled={compact.phase === 'briefing'}
                className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium ${compact.phase === 'briefing' ? 'bg-white/[0.06] text-muted' : 'bg-accent text-white hover:bg-accent/90'}`}
              >
                {compact.phase === 'briefing' ? 'Pouring…' : 'Write the brief'}
              </button>
            </div>
          </>
        ) : null}

        {compact.phase === 'ready' || compact.phase === 'ending' ? (
          <>
            <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-muted">
              The brief, in full · {compact.words} words
            </p>
            <pre className="mt-1.5 max-h-[240px] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-bg p-2.5 text-[12px] leading-relaxed text-ink">
              {compact.brief}
            </pre>
            {compact.error ? <p className="mt-2 text-[11.5px] text-warn">{compact.error}</p> : null}
            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-[11px] leading-snug text-muted">
                Ending ends {engine.settings.id}'s session and forgets the resume thread. The brief rides with your next message.
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => { cancelBrief(); onClose() }}
                  className="h-8 rounded-lg border border-line px-3 text-[12px] text-muted hover:text-ink"
                >
                  Keep the session
                </button>
                <button
                  type="button"
                  onClick={() => void finishCompact().then((ok) => { if (ok) onClose() })}
                  disabled={compact.phase === 'ending'}
                  className={`h-8 rounded-lg px-3 text-[12.5px] font-medium ${compact.phase === 'ending' ? 'bg-white/[0.06] text-muted' : 'bg-accent text-white hover:bg-accent/90'}`}
                >
                  {compact.phase === 'ending' ? 'Ending…' : 'Compact now'}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
