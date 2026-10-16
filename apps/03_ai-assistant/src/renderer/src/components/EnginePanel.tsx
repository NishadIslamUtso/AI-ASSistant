import { useState } from 'react'
import { Handshake, Wrench, FilePen, Terminal, Search, CircleCheck, TriangleAlert, Square } from 'lucide-react'
import { buildHandoff, handoffFileName } from '@shared/lib/handoff'
import { bridge } from '@/platform/bridge'
import { useEngine, type EngineItem } from '@/state/engine'

/**
 * The engine's work order, drawn where the conversation can see it.
 *
 * The engine is not a chat partner: it is a worker. Its turn reads as a card —
 * what was asked, what it touched, what it needs approved, how it ended — in
 * the same visual language as the rest of the app (the same tokens, the same
 * rounded cards, nothing new invented).
 */
export default function EnginePanel() {
  const engine = useEngine()
  const turn = engine.turn
  const [handed, setHanded] = useState('')
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
    <section
      aria-label="Engine work"
      className="mx-auto mb-3 w-full max-w-[var(--chat-width)] rounded-xl border border-line bg-card px-4 py-3"
    >
      <header className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            turn.state === 'running' ? 'animate-pulse bg-warn' : turn.state === 'error' ? 'bg-warn' : 'bg-ok'
          }`}
        />
        <h2 className="text-[12px] font-medium text-muted">
          Engine · {engine.settings.id} · {engine.settings.model}
          {' · ' + (engine.settings.workspace ? engine.settings.workspace.split(/[\\/]/).filter(Boolean).at(-1) : 'vault')}
          {turn.state === 'running' ? ' · working' : turn.state === 'error' ? ' · stopped' : ' · done'}
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
      </header>

      <p className="mt-1.5 line-clamp-3 text-[12.5px] text-muted">▸ {turn.prompt}</p>

      <ul className="mt-2 flex flex-col gap-1.5">
        {turn.items.map((item, index) => (
          <EngineItemRow key={index} item={item} />
        ))}
      </ul>

      {handed ? <p className="mt-1 text-[11px] text-muted">{handed}</p> : null}
      {turn.usage && turn.state !== 'running' ? (
        <p className="mt-2 text-[11px] text-muted" title="What the engine itself reported for this turn">
          {turn.usage.inTokens.toLocaleString()} in · {turn.usage.outTokens.toLocaleString()} out
          {turn.usage.durationMs !== null ? ` · ${(turn.usage.durationMs / 1000).toFixed(1)}s` : ''}
          {turn.usage.costUsd !== null ? ` · $${turn.usage.costUsd.toFixed(4)}` : ''}
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
  )
}

/** One line of the engine's story, with the icon that matches the act. */
function EngineItemRow({ item }: { item: EngineItem }) {
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
