import { useState } from 'react'
import { Check, Copy, FileCode2 } from 'lucide-react'
import type { Message } from '@shared/types'
import { artifactSource } from '@shared/lib/artifacts'
import BrainMark from './BrainMark'

/**
 * One turn in the conversation.
 *
 * A user message is a bubble on the right because it is something that was said.
 * A reply is not a bubble: it is the document, so it runs the full width with the
 * app's mark beside it. Thinking, when the model reports it separately, is folded
 * away rather than mixed into the answer.
 */
export default function MessageRow({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl bg-card px-4 py-2.5 text-[14px] leading-relaxed">
          {message.content}
          {message.editedAt && (
            <span className="mt-1 block text-[11px] text-muted">edited</span>
          )}
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

        {message.artifacts && message.artifacts.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {message.artifacts.map(artifact => (
              <ArtifactCard key={artifact.id} message={message} artifactId={artifact.id} />
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

        {message.error ? (
          <p className="mt-2 text-[12px] text-warn">{message.error}</p>
        ) : null}

        {message.status === 'complete' && typeof message.ms === 'number' ? (
          <p className="mt-2 text-[11px] text-muted">
            {message.model} · {(message.ms / 1000).toFixed(1)}s
          </p>
        ) : null}
      </div>
    </div>
  )
}

/**
 * A file the model wrote. The preview panel arrives with the artifacts step; until
 * then the card is honest about what is here — the source, and a way to take it.
 */
function ArtifactCard({ message, artifactId }: { message: Message; artifactId: string }) {
  const [copied, setCopied] = useState(false)
  const artifact = message.artifacts?.find(entry => entry.id === artifactId)
  if (!artifact) return null
  const draft = artifact.partial || artifact.versions.some(version => version.draft)

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(artifactSource(artifact))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard access can be refused. Saying nothing is fine: the source is
      // in the transcript above and nothing was lost.
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
        <FileCode2 size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px]">{artifact.title}</span>
        <span className="text-[11px] text-muted">
          {artifact.type.toUpperCase()}
          {draft ? ' · still being written' : ''}
        </span>
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[12px] text-muted hover:text-ink"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </li>
  )
}
