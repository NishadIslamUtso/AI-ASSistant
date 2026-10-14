import type { Artifact, Message } from '@shared/types'
import type { ElementPick } from '@shared/lib/artifacts'
import { parseCloudModel } from '@shared/lib/providers'
import type { ArtifactView } from '@/state/artifactView'
import ArtifactCard from './ArtifactCard'
import BrainMark from './BrainMark'

/**
 * One turn in the conversation.
 *
 * A user message is a bubble on the right because it is something that was said.
 * A reply is not a bubble: it is the document, so it runs the full width with the
 * app's mark beside it. Thinking, when the model reports it separately, is folded
 * away rather than mixed into the answer.
 */
export default function MessageRow({
  message,
  artifacts = [],
  tokens = '',
  highlightId = '',
  onRewrite,
  onRestore,
  busyArtifactId = '',
  rewriteStage = '',
  rewriteError = '',
  rewriteErrorFor = '',
}: {
  message: Message
  /** Already resolved for this message: live draft while streaming, saved after. */
  artifacts?: ArtifactView[]
  tokens?: string
  /** Set briefly when the rail jumps to an artifact here. */
  highlightId?: string
  onRewrite: (request: {
    artifact: Artifact
    source: string
    pick: ElementPick
    comment: string
  }) => Promise<boolean>
  onRestore: (artifact: Artifact, index: number) => void
  busyArtifactId?: string
  rewriteStage?: string
  rewriteError?: string
  /** The artifact the error belongs to, so it is not printed on every card. */
  rewriteErrorFor?: string
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl bg-card px-4 py-2.5 text-[14px] leading-relaxed">
          {message.content}
          {message.editedAt && <span className="mt-1 block text-[11px] text-muted">edited</span>}
          {(message.attachments || []).length > 0 && (
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {message.attachments?.map(file => (
                <li
                  key={file.id}
                  className="rounded-md border border-line px-1.5 py-0.5 text-[11px] text-muted"
                >
                  {file.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  const streaming = message.status === 'streaming'
  return (
    <div className="flex gap-3.5">
      <span className="mt-0.5 shrink-0">
        <BrainMark size={26} />
      </span>
      <div className="min-w-0 flex-1">
        {message.thinking ? (
          <details className="mb-2 rounded-lg border border-line bg-panel/60 px-3 py-2">
            <summary className="cursor-pointer text-[12px] text-muted">
              Thinking{streaming ? ' (still going)' : ''}
            </summary>
            <p className="mt-2 whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-muted">
              {message.thinking}
            </p>
          </details>
        ) : null}

        {message.stage ? (
          <p className="mb-2 text-[12px] italic text-muted">{message.stage}</p>
        ) : null}

        {message.content ? (
          <div className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">
            {message.content}
          </div>
        ) : null}

        {streaming && !message.content && !message.stage ? (
          <p className="text-[13px] text-muted">Thinking…</p>
        ) : null}
        {streaming && message.content ? (
          <span className="caret ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-accent" />
        ) : null}

        {artifacts.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-3">
            {artifacts.map(view => (
              <ArtifactCard
                key={view.artifact.id}
                view={view}
                tokens={tokens}
                highlighted={view.artifact.id === highlightId}
                onRewrite={onRewrite}
                onRestore={onRestore}
                busy={busyArtifactId === view.artifact.id}
                stage={busyArtifactId === view.artifact.id ? rewriteStage : ''}
                error={rewriteErrorFor === view.artifact.id ? rewriteError : ''}
              />
            ))}
          </ul>
        ) : null}

        {message.citations && message.citations.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {message.citations.map(citation => (
              <li key={citation.id}>
                <a
                  href={citation.url}
                  className="rounded-md border border-line px-2 py-1 text-[11px] text-muted hover:border-accent/50 hover:text-ink"
                >
                  {citation.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        {message.error ? <p className="mt-2 text-[12px] text-warn">{message.error}</p> : null}

        {message.status === 'complete' && typeof message.ms === 'number' ? (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
            {/* Where this answer came from, said on every reply. An online answer
                is the one that left the machine, so it is labelled rather than
                left to be inferred from a model's name. */}
            {(() => {
              const online = parseCloudModel(message.model)
              return online ? (
                <span
                  className="rounded-md border border-line px-1.5 py-0.5"
                  title={`Answered online by ${online.provider.label}.`}
                >
                  online · {online.provider.label}
                </span>
              ) : (
                <span
                  className="rounded-md border border-line px-1.5 py-0.5"
                  title="Answered by a model on this machine."
                >
                  local
                </span>
              )
            })()}
            {message.model} · {(message.ms / 1000).toFixed(1)}s
          </p>
        ) : null}
      </div>
    </div>
  )
}
