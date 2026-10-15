import { useEffect, useRef, useState } from 'react'
import { ChevronDown, FolderOpen, RefreshCw, Cpu, Cloud } from 'lucide-react'
import { useEngine, type EngineModels } from '@/state/engine'
import useDismiss from '@/hooks/useDismiss'
import type { ApprovalMode, EngineId } from '@shared/lib/engine'

/**
 * The engine bay — the app's own engine selection system.
 *
 * This is the shell's spine, not an accessory: which engine thinks (Claude
 * Code today, agy when its Windows check lands), which brain it thinks with
 * (the list comes FROM the engine's own door — what it can really use, with
 * cloud brains flagged because their work leaves the machine), and which
 * folder it works in ("open a folder", remembered).
 *
 * Everything here is real: the model list is what the brain door reports,
 * the folder is a folder on disk, and a choice is saved the moment it is
 * made. In the browser preview every control answers honestly that it needs
 * the desktop app.
 */

const ENGINES: Array<{ id: EngineId; label: string; hint: string }> = [
  { id: 'claude-code', label: 'Claude Code', hint: 'Anthropic’s agent, wired to your free brains' },
  { id: 'agy', label: 'agy', hint: 'Google’s agent — arrives after its Windows check' },
]

/** The last part of a path, whichever slash the platform uses. */
const leaf = (folder: string): string => folder.split(/[\\/]/).filter(Boolean).at(-1) ?? folder

/** The throttle: how much the engine may do before it asks. Its own official settings, nothing added. */
const THROTTLE: Array<{ id: ApprovalMode; label: string; note: string }> = [
  {
    id: 'ask',
    label: 'Ask me',
    note: 'Every step beyond reading asks you first — as a card in the chat.',
  },
  {
    id: 'edits',
    label: 'Auto-edits',
    note: 'Files in the workspace change without asking; other commands still ask.',
  },
  {
    id: 'full',
    label: 'Full speed',
    note:
      'Everything runs without asking. The engine\u2019s own deny rules and guarded deletions still block. ' +
      'Your machine, your call — takes hold from the next engine start.',
  },
]

export default function EngineBay() {
  const engine = useEngine()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  useDismiss(menuRef, () => setMenuOpen(false), menuOpen)

  // The brain list is real data from the engine's door: ask once when the
  // bay appears, and again whenever the person asks for a refresh.
  useEffect(() => {
    void engine.loadModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const models: EngineModels = engine.models
  const workspaceLabel = engine.settings.workspace ? leaf(engine.settings.workspace) : 'Vault (default)'

  return (
    <section aria-label="Engine" className="rounded-xl border border-line bg-card p-2">
      <header className="flex items-center gap-1.5 px-1 pb-1.5">
        <Cpu size={12} className="text-muted" aria-hidden />
        <h2 className="text-[10.5px] font-semibold uppercase tracking-wide text-muted">Engine</h2>
        <span
          className={`ml-auto h-1.5 w-1.5 rounded-full ${engine.running() ? 'animate-pulse bg-ok' : 'bg-muted'}`}
          title={engine.running() ? 'The engine is on this machine' : 'Idle'}
        />
      </header>

      {/* The engine selection system. */}
      <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Which engine">
        {ENGINES.map((entry) => {
          const active = engine.settings.id === entry.id
          return (
            <button
              key={entry.id}
              type="button"
              role="radio"
              aria-checked={active}
              title={entry.hint}
              onClick={() => void engine.pick(entry.id)}
              className={`rounded-lg border px-2 py-1.5 text-left text-[12px] transition-colors ${
                active ? 'border-accent text-ink' : 'border-line text-muted hover:text-ink'
              }`}
            >
              {entry.label}
              {entry.id === 'agy' ? <span className="ml-1 text-[10px] text-warn">soon</span> : null}
            </button>
          )
        })}
      </div>

      {/* The brain, chosen from the engine's own list. */}
      <div className="relative mt-1.5" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex w-full items-center gap-1.5 rounded-lg border border-line px-2 py-1.5 text-left text-[12px] text-muted hover:text-ink"
        >
          <span className="min-w-0 flex-1 truncate">{engine.settings.model}</span>
          <ChevronDown size={12} aria-hidden />
        </button>
        {menuOpen ? (
          <div
            role="menu"
            aria-label="Brains this engine can use"
            className="absolute bottom-9 left-0 z-30 w-[240px] rounded-xl border border-line bg-card p-1.5 shadow-xl"
          >
            {models.loading ? (
              <p className="px-2.5 py-2 text-[12px] text-muted">Asking the engine what it can use…</p>
            ) : models.error ? (
              <p className="px-2.5 py-2 text-[12px] leading-relaxed text-muted">{models.error}</p>
            ) : (
              models.entries.map((entry) => (
                <button
                  key={entry.name}
                  type="button"
                  role="menuitemradio"
                  aria-checked={entry.name === engine.settings.model}
                  onClick={() => {
                    void engine.setModel(entry.name)
                    setMenuOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] ${
                    entry.name === engine.settings.model ? 'bg-white/[0.06] text-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                  {entry.cloud ? (
                    <span className="flex shrink-0 items-center gap-0.5 rounded-md border border-warn/50 px-1.5 text-[10.5px] text-warn">
                      <Cloud size={9} aria-hidden /> cloud
                    </span>
                  ) : entry.sizeGB !== null ? (
                    <span className="shrink-0 text-[11px] text-muted">{entry.sizeGB.toFixed(1)} GB</span>
                  ) : null}
                </button>
              ))
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => void engine.loadModels()}
              className="mt-1 flex w-full items-center gap-1.5 rounded-lg border-t border-line px-2.5 py-1.5 text-left text-[12px] text-muted hover:text-ink"
            >
              <RefreshCw size={11} aria-hidden /> Refresh the list
            </button>
          </div>
        ) : null}
      </div>

      {/* Where the engine works. */}
      <button
        type="button"
        onClick={() => void engine.pickWorkspace()}
        title={engine.settings.workspace || 'The vault is the workplace until a folder is chosen'}
        className="mt-1.5 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[12px] text-muted hover:text-ink"
      >
        <FolderOpen size={12} aria-hidden className="shrink-0" />
        <span className="min-w-0 flex-1 truncate">{workspaceLabel}</span>
      </button>

      {/* The throttle: the engine's own settings, from ask-me to full speed. */}
      <div
        role="radiogroup"
        aria-label="How much the engine may do before asking"
        className="mt-1 grid grid-cols-3 gap-1 rounded-lg border border-line p-1"
      >
        {THROTTLE.map((step) => {
          const active = (engine.settings.approval ?? 'ask') === step.id
          return (
            <button
              key={step.id}
              type="button"
              role="radio"
              aria-checked={active}
              title={step.note}
              onClick={() => void engine.setApproval(step.id)}
              className={`rounded-md px-1 py-1 text-[11px] transition-colors ${
                active ? 'bg-accent text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {step.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
