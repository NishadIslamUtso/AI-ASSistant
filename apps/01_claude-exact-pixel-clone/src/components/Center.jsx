import { useEffect, useRef } from 'react'
import { Folder, ChevronDown } from 'lucide-react'
import Spark from './Spark.jsx'
import Composer from './Composer.jsx'
import ModelPicker from './ModelPicker.jsx'
import { USER, getGreeting } from '../lib/store.js'

export default function Center({ currentChat, messages, busy, onSend, onStop, model, onModelChange, actions }) {
  const endRef = useRef(null)
  const isEmpty = messages.length === 0

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  const widthStyle = { maxWidth: 'var(--transcript-width)' }
  const toast = actions.toast

  const modelRow = (
    <div className="mx-auto mt-2 flex w-full items-center justify-between px-1 text-xs" style={widthStyle}>
      {isEmpty ? (
        <button type="button" onClick={() => toast('Projects: not in the local build yet')} className="flex items-center gap-1.5 rounded-md px-1.5 py-1 c-muted-2 c-hover">
          <Folder size={13} /> Project <ChevronDown size={12} />
        </button>
      ) : <span />}
      <div className="flex items-center gap-3">
        <ModelPicker model={model} onChange={onModelChange} />
        <span className="c-muted" title="Display only in this build">Medium</span>
        <span className="c-muted" title="Display only in this build">Manual</span>
      </div>
    </div>
  )

  return (
    <main className="flex h-screen min-w-0 flex-1 flex-col c-main">
      <div className="flex h-11 shrink-0 items-center justify-center">
        <div className="flex items-center gap-2 rounded-full px-3 py-1 text-sm c-hover">
          <span className="c-muted-2">Free plan</span>
          <span className="c-muted">·</span>
          <button type="button" onClick={() => toast('Upgrade: this local build is free')} className="text-[#6b9bff]">Upgrade</button>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-16">
          <div className="mb-8 flex items-center gap-3">
            <Spark size={34} />
            <h1 className="serif text-[36px] leading-none">{getGreeting()}, {USER.name}</h1>
          </div>
          <div className="w-full" style={widthStyle}>
            <Composer busy={busy} onSend={onSend} onStop={onStop} toast={toast} placeholder="How can I help you today?" />
          </div>
          {modelRow}
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto space-y-6 px-6 py-8" style={widthStyle}>
              {messages.map((m) => (
                m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="chat-text max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5" style={{ background: 'var(--bg-hover)' }}>
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-3">
                    <Spark size={20} className="mt-1 shrink-0" />
                    <div className={`chat-text min-w-0 flex-1 whitespace-pre-wrap ${m.error ? 'text-[var(--danger)]' : ''}`}>
                      {m.content || (busy && <span className="c-muted">Thinking...</span>)}
                    </div>
                  </div>
                )
              ))}
              <div ref={endRef} />
            </div>
          </div>
          <div className="shrink-0 px-6 pb-4 pt-2">
            <div className="mx-auto w-full" style={widthStyle}>
              <Composer busy={busy} onSend={onSend} onStop={onStop} toast={toast} placeholder="Reply..." />
              {modelRow}
            </div>
          </div>
        </>
      )}
    </main>
  )
}
