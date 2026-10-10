import React, { useEffect, useRef } from 'react'
import { C, M } from '../theme.js'
import { Asterisk, Icon, P } from './Icons.jsx'
import Composer from './Composer.jsx'
import ThinkingDisplay from './ThinkingDisplay.jsx'
import Markdown from '../lib/markdown.jsx'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'
}

export default function Center({
  messages, input, setInput, onSend, onStop, loading,
  models, model, onModel, effort, onEffort, memory, onMemory,
  onAttach, onImage, onCook, attachments,
  artifacts, onOpenArtifact, onUpgrade, userName = 'Utso',
  modelLabel, width,
}) {
  const endRef = useRef(null)
  const hasMsgs = messages.length > 0

  useEffect(() => {
    if (hasMsgs) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full" style={{ background: 'var(--app-bg)' }}>
      {/* title-bar spacer (32px custom title bar drawn by TitleBar) */}
      <div className="shrink-0" style={{ height: M.titleBar }} />

      {/* Free plan · Upgrade — measured y=91..114, centred, bg #111111 */}
      <div className="shrink-0 flex justify-center" style={{ height: 23, marginTop: 56 }}>
        <div
          className="flex items-center gap-[6px] rounded-[6px] px-[10px] text-[12px]"
          style={{ background: '#111111', color: C.text3 }}
        >
          <span>Free plan</span>
          <span style={{ color: C.text3 }}>·</span>
          <button onClick={onUpgrade} style={{ color: C.link }}>Upgrade</button>
        </div>
      </div>

      {!hasMsgs ? (
        /* ---------- new-chat screen: greeting + composer, measured top y=290 ---------- */
        <div className="flex-1 flex flex-col items-center justify-center pb-[35px] px-[24px]">
          <div className="w-full" style={{ maxWidth: 'var(--transcript-width)' }}>
            <div className="flex items-center justify-center gap-[11px] mb-[20px]">
              <Asterisk size={M.greeting.asterisk} />
              <h1 style={{ fontFamily: 'var(--chat-font)', fontSize: M.greeting.size, color: C.text, lineHeight: 1.15 }}>
                {greeting()}, {userName}.
              </h1>
            </div>
            <Composer
              value={input} onChange={setInput} onSend={onSend} onStop={onStop} loading={loading}
              models={models} model={model} onModel={onModel}
              effort={effort} onEffort={onEffort} memory={memory} onMemory={onMemory}
              onAttach={onAttach} onImage={onImage} onCook={onCook}
              captureCount={attachments?.length || 0} modelLabel={modelLabel}
            />
          </div>
        </div>
      ) : (
        /* ---------- conversation ---------- */
        <>
          <div className="flex-1 overflow-y-auto scroll-thin">
            <div className="mx-auto px-[24px] py-[24px] space-y-[22px]"
              style={{ maxWidth: 'var(--transcript-width)', fontSize: 'var(--transcript-size)' }}>
              {messages.map((m, i) => (
                <Message key={m.id || i} m={m} onOpenArtifact={onOpenArtifact} />
              ))}
              {loading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-[11px]">
                  <Asterisk size={22} />
                  <div className="text-[13px] pt-[4px]" style={{ color: C.text3 }}>Thinking…</div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          <div className="shrink-0 px-[24px] pb-[28px] pt-[8px] flex justify-center">
            <Composer
              value={input} onChange={setInput} onSend={onSend} onStop={onStop} loading={loading}
              models={models} model={model} onModel={onModel}
              effort={effort} onEffort={onEffort} memory={memory} onMemory={onMemory}
              onAttach={onAttach} onImage={onImage} onCook={onCook}
              captureCount={attachments?.length || 0} modelLabel={modelLabel}
            />
          </div>
        </>
      )}
    </div>
  )
}

function Message({ m, onOpenArtifact }) {
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="rounded-[18px] px-[14px] py-[8px] whitespace-pre-wrap"
          style={{ background: '#2a2a29', color: C.text, maxWidth: '80%' }}
        >
          {m.images?.length > 0 && (
            <div className="flex gap-[6px] mb-[6px] flex-wrap">
              {m.images.map((src, i) => (
                <img key={i} src={`data:image/png;base64,${src}`} alt="attachment"
                  className="rounded-[8px]" style={{ maxHeight: 140, maxWidth: 200 }} />
              ))}
            </div>
          )}
          {m.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-[11px]">
      <div className="shrink-0 pt-[2px]"><Asterisk size={22} /></div>
      <div className="flex-1 min-w-0" style={{ color: 'var(--text)' }}>
        {m.thinking && <ThinkingDisplay text={m.thinking} streaming={!!m.streaming} />}
        {m.artifacts?.length > 0 && (
          <div className="flex flex-wrap gap-[8px] mb-[10px]">
            {m.artifacts.map((a) => (
              <button
                key={a.id}
                onClick={() => onOpenArtifact(a)}
                className="flex items-center gap-[8px] rounded-[8px] px-[11px] py-[7px] text-[12.5px] hover:brightness-110"
                style={{ background: '#1d1d1c', border: '1px solid #2a2a29', color: C.text2 }}
              >
                <Icon d={P.code} size={13} />
                <span>{a.title}</span>
                <span style={{ color: C.text3 }}>{a.kind}</span>
              </button>
            ))}
          </div>
        )}
        {m.content ? (
          <Markdown text={m.content} />
        ) : (
          !m.thinking && <span className="opacity-60">…</span>
        )}
      </div>
    </div>
  )
}
