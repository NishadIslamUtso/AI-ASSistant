import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ChevronDown, Cpu, Square } from 'lucide-react'
import { useEngine } from '@/state/engine'
import type { ModelState } from '@/hooks/useModels'
import useDismiss from '@/hooks/useDismiss'

/**
 * The composer.
 *
 * Enter sends, Shift+Enter starts a new line, Escape stops a reply that is still
 * being written. The draft is kept in the parent so that a failed send keeps the
 * text where it was instead of clearing the box and losing it.
 */
export default function Composer({
  value,
  onChange,
  onSend,
  onStop,
  busy,
  models,
  notice,
  preview,
  engineOn,
  onEngineToggle,
}: {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  busy: boolean
  models: ModelState
  notice: string
  /** Set in the browser preview, where there is no machine behind the window. */
  preview?: string
  /** Engine mode: sends go to the worker engine instead of the chat brain. */
  engineOn?: boolean
  onEngineToggle?: () => void
}) {
  const engine = useEngine()
  const box = useRef<HTMLTextAreaElement | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  useDismiss(menuRef, () => setMenuOpen(false), menuOpen)

  // Grow with the text, up to a point, then scroll. A composer that stays one
  // line high while you write a paragraph hides what you are writing.
  useEffect(() => {
    const element = box.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`
  }, [value])

  const canSend = value.trim().length > 0 && !busy

  const keydown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (canSend) onSend()
      return
    }
    if (event.key === 'Escape' && busy) onStop()
  }

  return (
    <div className="shrink-0 px-6 pb-4">
      <div className="rounded-2xl border border-line bg-card focus-within:border-accent/50">
        <textarea
          ref={box}
          value={value}
          onChange={event => onChange(event.target.value)}
          onKeyDown={keydown}
          rows={1}
          placeholder="How can I help you today?"
          aria-label="Message"
          className="block max-h-[200px] w-full resize-none bg-transparent px-4 pt-3.5 text-[14px] leading-relaxed text-ink outline-none placeholder:text-muted"
        />
        <div className="flex items-center gap-2 px-3 pb-2.5 pt-1.5">
          {onEngineToggle ? (
            <button
              type="button"
              aria-pressed={engineOn === true}
              aria-label="Engine mode: give work to the engine instead of the chat"
              onClick={onEngineToggle}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] ${
                engineOn ? 'border-accent text-ink' : 'border-line text-muted hover:text-ink'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${engineOn ? 'bg-accent' : 'bg-muted'}`} />
              Engine
            </button>
          ) : null}
          {engineOn ? (
            <span
              className="flex h-8 items-center gap-1.5 rounded-lg border border-accent px-2.5 text-[12px] text-ink"
              title="Engine mode — the full picker lives in the sidebar's Engine bay"
            >
              <Cpu size={12} aria-hidden />
              <span className="min-w-0 max-w-[180px] truncate">{engine.settings.model}</span>
              <span className="text-[10.5px] text-muted">{engine.settings.id}</span>
            </span>
          ) : (
            <ModelMenu models={models} open={menuOpen} setOpen={setMenuOpen} menuRef={menuRef} />
          )}
          <span className="ml-auto flex items-center gap-2">
            {busy ? (
              <button
                type="button"
                onClick={onStop}
                title="Stop (Esc)"
                className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-[12px] text-muted hover:text-ink"
              >
                <Square size={11} />
                Stop
              </button>
            ) : null}
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              aria-label="Send"
              title="Send (Enter)"
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                canSend ? 'bg-accent text-white hover:bg-accent/90' : 'bg-white/[0.06] text-muted'
              }`}
            >
              <ArrowUp size={16} />
            </button>
          </span>
        </div>
      </div>

      {preview ? <p className="px-1 pt-2 text-[12px] text-muted">{preview}</p> : null}
      {notice ? <p className="px-1 pt-2 text-[12px] text-warn">{notice}</p> : null}
      {/* One line, and only when the model that is selected cannot answer. An
          online model an a machine without Ollama is not a problem to report. */}
      {!notice && !models.available && models.error ? (
        <p className="px-1 pt-2 text-[12px] text-muted">{models.error}</p>
      ) : null}
    </div>
  )
}

/**
 * Which model answers. Only what is installed on this machine is listed, and the
 * list says so when there is nothing to choose from.
 */
function ModelMenu({
  models,
  open,
  setOpen,
  menuRef,
}: {
  models: ModelState
  open: boolean
  setOpen: (open: boolean) => void
  menuRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-[12px] text-muted hover:text-ink"
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            models.available ? 'bg-ok' : models.status === 'loading' ? 'bg-warn' : models.status === 'online' ? 'bg-warn' : 'bg-muted'
          }`}
        />
        {models.model}
        <ChevronDown size={12} />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Models this app can use"
          className="absolute bottom-10 left-0 z-20 w-[260px] rounded-xl border border-line bg-card p-1.5 shadow-xl"
        >
          {models.models.length === 0 ? (
            <p className="px-2.5 py-2 text-[12px] leading-relaxed text-muted">
              {models.status === 'loading'
                ? 'Asking Ollama what is installed…'
                : 'No models yet. Ollama is not running or has none installed, and no provider key is saved — Settings > Models is where a key goes. Nothing is downloaded automatically.'}
            </p>
          ) : (
            models.models.map(entry => (
              <button
                key={entry.name}
                type="button"
                role="menuitemradio"
                aria-checked={entry.name === models.model}
                onClick={() => {
                  models.select(entry.name)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] ${
                  entry.name === models.model ? 'bg-white/[0.06] text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                {entry.cloud ? (
                  <span className="shrink-0 rounded-md border border-line px-1.5 text-[10.5px] text-muted">
                    online
                  </span>
                ) : typeof entry.size === 'number' ? (
                  <span className="shrink-0 text-[11px] text-muted">
                    {(entry.size / 1e9).toFixed(1)} GB
                  </span>
                ) : null}
              </button>
            ))
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              models.refresh()
              setOpen(false)
            }}
            className="mt-1 w-full rounded-lg border-t border-line px-2.5 py-1.5 text-left text-[12px] text-muted hover:text-ink"
          >
            Refresh the list
          </button>
        </div>
      ) : null}
    </div>
  )
}
