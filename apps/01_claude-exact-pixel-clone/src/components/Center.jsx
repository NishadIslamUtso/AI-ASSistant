import { useEffect, useRef } from 'react'
import Composer from './Composer.jsx'
import Message from './Message.jsx'
import Spark from './Spark.jsx'

/**
 * Center — #1a1a1a main column from screenshot 191547.png.
 *
 * Empty chat : the greeting ("Evening, Utso." + orange ✳) with the composer
 *              centred underneath it.
 * With history: the transcript, composer pinned at the bottom.
 */
export default function Center({
  chat,
  messages = [],
  isStreaming = false,
  streamingId,
  transcriptClass,
  fontClass,
  widthClass,
  input,
  setInput,
  onSend,
  onStop,
  attachments,
  onPickFiles,
  onRemoveAttachment,
  injected,
  onRemoveInjected,
  onDropCapsule,
  onCookPrompt,
  cooking,
  model,
  models,
  onModelChange,
  effort,
  onEffortChange,
  thinking,
  onThinkingChange,
  project,
  projects,
  onProjectChange,
  onOpenVault,
  onOpenArtifact,
  onRegenerate,
  ollamaOk,
  onOpenUpgrade,
  settings,
  artifactMode,
  onToggleArtifactMode,
  vaultHits = [],
  onAddHit,
}) {
  const scrollRef = useRef(null)
  const bottomRef = useRef(null)
  const atBottomRef = useRef(true)
  const lastLenRef = useRef(0)

  // Auto-scroll only while the user is already near the bottom.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const last = messages[messages.length - 1]
    const len = (last?.content || '').length
    if (len !== lastLenRef.current) {
      lastLenRef.current = len
      if (atBottomRef.current) bottomRef.current?.scrollIntoView({ block: 'end' })
    }
  }, [messages])

  const empty = messages.length === 0

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-[var(--bg-main)]">
      {/* ── top bar: Free plan · Upgrade ──────────────────── */}
      <div className="h-[52px] shrink-0 flex items-center justify-end px-4">
        <button
          onClick={onOpenUpgrade}
          className="flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] transition-colors"
          title="Account"
        >
          <span className="text-[var(--ink2)]">Free plan</span>
          <span className="text-[var(--ink3)]">·</span>
          <span className="text-[var(--ink)]">Upgrade</span>
        </button>
      </div>

      {/* ── body ──────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {empty ? (
          <div className="h-full flex flex-col items-center justify-center px-6 pb-10">
            <div className={`w-full ${widthClass}`}>
              {/* measured: greeting serif ~44px, spark ~46px, accent #d97757 */}
              <div className="flex items-baseline gap-2 mb-6">
                <h1 className="text-[44px] leading-[52px] font-serif-claude text-[var(--ink)]">
                  {greeting()}, {settings.userName}.
                </h1>
                <Spark size={46} className="translate-y-[-6px]" />
              </div>

              <Composer
                value={input}
                onChange={setInput}
                onSend={onSend}
                onStop={onStop}
                isLoading={isStreaming}
                placeholder="How can I help you today?"
                model={model}
                models={models}
                onModelChange={onModelChange}
                effort={effort}
                onEffortChange={onEffortChange}
                thinking={thinking}
                onThinkingChange={onThinkingChange}
                project={project}
                projects={projects}
                onProjectChange={onProjectChange}
                attachments={attachments}
                onPickFiles={onPickFiles}
                onRemoveAttachment={onRemoveAttachment}
                injected={injected}
                onRemoveInjected={onRemoveInjected}
                onDropCapsule={onDropCapsule}
                onCookPrompt={onCookPrompt}
                cooking={cooking}
                ollamaOk={ollamaOk}
                onOpenVault={onOpenVault}
                artifactMode={artifactMode}
                onToggleArtifactMode={onToggleArtifactMode}
                vaultHits={vaultHits}
                onAddHit={onAddHit}
              />
            </div>
          </div>
        ) : (
          <div className="min-h-full flex flex-col">
            <div className={`w-full mx-auto px-6 pt-2 pb-4 ${widthClass} flex-1`}>
              <div className={`space-y-7 ${transcriptClass} ${fontClass}`}>
                {messages.map((m, i) => (
                  <Message
                    key={m.id}
                    message={m}
                    transcriptClass={transcriptClass}
                    fontClass={fontClass}
                    isStreaming={isStreaming && m.id === streamingId}
                    onOpenArtifact={onOpenArtifact}
                    onRegenerate={onRegenerate}
                    isLast={i === messages.length - 1}
                  />
                ))}
              </div>
              <div ref={bottomRef} />
            </div>

            {/* composer pinned to the bottom of the column */}
            <div className="sticky bottom-0 bg-[var(--bg-main)] pt-2 pb-4 px-6">
              <div className={`w-full mx-auto ${widthClass}`}>
                <Composer
                  compact
                  autoFocus
                  value={input}
                  onChange={setInput}
                  onSend={onSend}
                  onStop={onStop}
                  isLoading={isStreaming}
                  placeholder="Reply to Claude…"
                  model={model}
                  models={models}
                  onModelChange={onModelChange}
                  effort={effort}
                  onEffortChange={onEffortChange}
                  thinking={thinking}
                  onThinkingChange={onThinkingChange}
                  project={project}
                  projects={projects}
                  onProjectChange={onProjectChange}
                  attachments={attachments}
                  onPickFiles={onPickFiles}
                  onRemoveAttachment={onRemoveAttachment}
                  injected={injected}
                  onRemoveInjected={onRemoveInjected}
                  onDropCapsule={onDropCapsule}
                  onCookPrompt={onCookPrompt}
                  cooking={cooking}
                  ollamaOk={ollamaOk}
                  onOpenVault={onOpenVault}
                  artifactMode={artifactMode}
                  onToggleArtifactMode={onToggleArtifactMode}
                  vaultHits={vaultHits}
                  onAddHit={onAddHit}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Time-based greeting exactly as it reads in screenshot 191547.png:
 * "Evening, Utso."  (not "Good evening").
 */
export function greeting(d = new Date()) {
  const h = d.getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}
