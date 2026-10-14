import { useState } from 'react'
import { Check, ChevronDown, ChevronRight, Copy, FileCode2, Package } from 'lucide-react'
import type { Message } from '@shared/types'
import { createZip, downloadBytes, slugify, staticSiteEntries } from '@shared/lib/zip'
import type { ArtifactView } from '@/state/artifactView'
import ArtifactPreview from './ArtifactPreview'
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
}: {
  message: Message
  /** Already resolved for this message: live draft while streaming, saved after. */
  artifacts?: ArtifactView[]
  tokens?: string
  /** Set briefly when the rail jumps to an artifact here. */
  highlightId?: string
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
          <p className="mt-2 text-[11px] text-muted">
            {message.model} · {(message.ms / 1000).toFixed(1)}s
          </p>
        ) : null}
      </div>
    </div>
  )
}

/**
 * A file the model wrote: its preview, and the two things a person actually wants
 * from one — the source, and a folder they can deploy.
 */
function ArtifactCard({
  view,
  tokens,
  highlighted,
}: {
  view: ArtifactView
  tokens: string
  highlighted: boolean
}) {
  const { artifact, source, draft } = view
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(true)
  const [problem, setProblem] = useState('')

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(source)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // A refused clipboard is not worth a dialog: the source is visible above.
    }
  }

  /**
   * The deployable folder: the document, the two hosting configs, and a README.
   * Entries and the archive both come from the shared library, which is where the
   * ZIP writing is already tested.
   */
  const exportZip = (): void => {
    try {
      const entries = staticSiteEntries({
        title: artifact.title,
        source,
        type: artifact.type,
        note: draft ? 'Exported while the model was still writing this file.' : '',
      })
      const bytes = createZip(entries)
      downloadBytes(bytes, `${slugify(artifact.title)}.zip`, 'application/zip', setProblem)
    } catch (error) {
      setProblem((error as Error).message)
    }
  }

  return (
    <li
      id={`artifact-${artifact.id}`}
      className={`rounded-xl border bg-card p-2.5 transition-colors ${
        highlighted ? 'border-accent/70' : 'border-line'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? 'Hide preview' : 'Show preview'}
          title={open ? 'Hide preview' : 'Show preview'}
          className="shrink-0 rounded p-0.5 text-muted hover:text-ink"
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
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
          title="Copy the source"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[12px] text-muted hover:text-ink"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          type="button"
          onClick={exportZip}
          title="Download a folder you can put on any static host"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[12px] text-muted hover:text-ink"
        >
          <Package size={13} />
          ZIP
        </button>
      </div>

      {open ? (
        <div className="mt-2.5">
          <ArtifactPreview
            artifact={artifact}
            source={source}
            draft={draft}
            tokens={tokens}
            height={420}
          />
        </div>
      ) : null}

      {problem ? <p className="mt-2 text-[11.5px] text-warn">{problem}</p> : null}
    </li>
  )
}
