import { useEffect, useRef } from 'react'
import type { Chat } from '@shared/types'
import type { ModelState } from '@/hooks/useModels'
import { useDesignTokens } from '@/hooks/useDesignTokens'
import { viewsForMessage, type LiveArtifacts } from '@/state/artifactView'
import Composer from './Composer'
import MessageRow from './MessageRow'
import BrainMark from './BrainMark'

const STARTERS = [
  'Explain how a hash table works, in plain language',
  'Summarise this text and list the key points',
  'Write a Python script that renames files by date',
]

/**
 * The conversation, and the box you write in.
 *
 * Autoscroll follows the reply while the model is writing, but lets go the moment
 * the reader scrolls up — scrolling back to read something must not be yanked
 * away every time a token arrives.
 */
export default function ChatView({
  chat,
  draft,
  setDraft,
  onSend,
  onStop,
  busy,
  models,
  notice,
  preview,
  live,
  highlightId,
}: {
  chat: Chat | null
  draft: string
  setDraft: (value: string) => void
  onSend: () => void
  onStop: () => void
  busy: boolean
  models: ModelState
  notice: string
  preview?: string
  /** What the streaming sweep currently has, so a draft redraws as it is written. */
  live?: LiveArtifacts
  /** Briefly set when the rail jumps to an artifact in this conversation. */
  highlightId?: string
}) {
  const scroller = useRef<HTMLDivElement | null>(null)
  const follow = useRef(true)
  const tokens = useDesignTokens()

  const messages = chat?.messages || []
  const liveArtifacts: LiveArtifacts = live || { messageId: '', artifacts: [] }
  const lastContent = messages.length
    ? messages[messages.length - 1].content.length + (messages[messages.length - 1].status || '')
    : ''

  useEffect(() => {
    const element = scroller.current
    if (!element || !follow.current) return
    element.scrollTop = element.scrollHeight
  }, [lastContent, chat?.id])

  const trackScroll = (): void => {
    const element = scroller.current
    if (!element) return
    follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <div ref={scroller} onScroll={trackScroll} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-6 py-6">
          {messages.length === 0 ? (
            <EmptyState onPick={setDraft} />
          ) : (
            <div className="flex flex-col gap-7">
              {messages.map(message => (
                <MessageRow
                  key={message.id}
                  message={message}
                  artifacts={viewsForMessage(message.id, message.artifacts, liveArtifacts)}
                  tokens={tokens}
                  highlightId={highlightId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Composer
        value={draft}
        onChange={setDraft}
        onSend={onSend}
        onStop={onStop}
        busy={busy}
        models={models}
        notice={notice}
        preview={preview}
      />
    </main>
  )
}

function EmptyState({ onPick }: { onPick: (value: string) => void }) {
  return (
    <div className="flex flex-col items-center pt-24 text-center">
      <BrainMark size={64} />
      <h1 className="mt-5 text-[22px] font-semibold tracking-tight">
        How can I help you today?
      </h1>
      <p className="mt-2 max-w-[420px] text-[13px] leading-relaxed text-muted">
        Everything here runs on this machine. Nothing is sent anywhere unless you set
        up a cloud provider yourself.
      </p>
      <ul className="mt-7 flex w-full max-w-[520px] flex-col gap-2">
        {STARTERS.map(starter => (
          <li key={starter}>
            <button
              type="button"
              onClick={() => onPick(starter)}
              className="w-full rounded-xl border border-line bg-panel px-4 py-2.5 text-left text-[13px] text-muted transition-colors hover:border-accent/40 hover:text-ink"
            >
              {starter}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
