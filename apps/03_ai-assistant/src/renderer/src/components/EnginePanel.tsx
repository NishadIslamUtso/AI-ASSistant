import { Wrench, FilePen, Terminal, Search, CircleCheck, TriangleAlert, Square } from 'lucide-react'
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
  if (!turn) return null

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
        ) : null}
      </header>

      <p className="mt-1.5 line-clamp-3 text-[12.5px] text-muted">▸ {turn.prompt}</p>

      <ul className="mt-2 flex flex-col gap-1.5">
        {turn.items.map((item, index) => (
          <EngineItemRow key={index} item={item} />
        ))}
      </ul>

      {turn.permission ? (
        <div className="mt-2.5 rounded-lg border border-line bg-bg p-2.5">
          <p className="text-[12.5px] text-ink">
            The engine wants to use <span className="font-medium">{turn.permission.tool}</span>
          </p>
          {turn.permission.summary ? (
            <p className="mt-0.5 break-words font-mono text-[11.5px] text-muted">{turn.permission.summary}</p>
          ) : null}
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
