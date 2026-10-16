import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ChevronDown, CookingPot, Cpu, FolderOpen, Layers, Square } from 'lucide-react'
import type { Project } from '@shared/lib/projects'
import { vaultGet, type VaultReply } from '@shared/lib/vault'
import { useEngine, type EngineTurn } from '@/state/engine'
import useDismiss from '@/hooks/useDismiss'

/**
 * The composer.
 *
 * Enter sends, Shift+Enter starts a new line, Escape stops work still running.
 * The draft is kept in the parent so that a failed send keeps the text where
 * it was instead of clearing the box and losing it.
 *
 * There is exactly one way to talk: through the engine. There is no toggle,
 * no second brain behind the app — the app adds nothing of its own. The two
 * small chips at the bottom are the engine's own controls wearing the app's
 * face: the first chooses WHICH engine and how much it may do before asking
 * (the engine's own modes, nothing invented); the second lists the models
 * THAT engine can really use, from the engine's own door.
 */
export default function Composer({
  value,
  onChange,
  onSend,
  onStop,
  busy,
  notice,
  preview,
  projects = [],
  project = null,
  onProject,
}: {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  busy: boolean
  notice: string
  /** Set in the browser preview, where there is no machine behind the window. */
  preview?: string
  /** The project picker, as the approved composer shows it. */
  projects?: Project[]
  project?: string | null
  onProject?: (id: string | null) => void
}) {
  const box = useRef<HTMLTextAreaElement | null>(null)
  const [boxOpen, setBoxOpen] = useState<'engine' | 'models' | null>(null)
  const [cook, setCook] = useState(false)
  const pickerRef = useRef<HTMLDivElement | null>(null)
  useDismiss(pickerRef, () => setBoxOpen(null), boxOpen !== null)

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
    if (event.key === 'Escape') {
      if (boxOpen) setBoxOpen(null)
      else if (busy) onStop()
    }
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
        <div className="flex items-center gap-1.5 px-2.5 pb-2 pt-1" ref={pickerRef}>
          <ProjectDropdown projects={projects} project={project} onProject={onProject} />
          <span className="ml-auto" />
          <EngineChip open={boxOpen === 'engine'} onToggle={() => setBoxOpen(boxOpen === 'engine' ? null : 'engine')} />
          <ModelChip open={boxOpen === 'models'} onToggle={() => setBoxOpen(boxOpen === 'models' ? null : 'models')} />
          <span className="ml-auto flex items-center gap-2">
            {busy ? (
              <button
                type="button"
                onClick={onStop}
                title="Stop (Esc)"
                className="flex h-7 items-center gap-1.5 rounded-lg border border-line px-2 text-[11.5px] text-muted hover:text-ink"
              >
                <Square size={10} />
                Stop
              </button>
            ) : null}
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              aria-label="Send"
              title="Send (Enter)"
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                canSend ? 'bg-accent text-white hover:bg-accent/90' : 'bg-white/[0.06] text-muted'
              }`}
            >
              <ArrowUp size={15} />
            </button>
          </span>
        </div>
      </div>

      {value.trim() && !busy ? (
        <div className="relative px-1 pt-1.5">
          <button
            type="button"
            onClick={() => setCook(open => !open)}
            aria-expanded={cook}
            title="Cook this prompt: pull matching vault notes in as [Title: line] context, preview, then send"
            className="flex h-7 items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 text-[11.5px] text-muted hover:text-ink"
          >
            <CookingPot size={11} aria-hidden />
            Cook This Prompt
          </button>
          {cook ? <CookDialog draft={value} onDone={(next) => { if (next !== null) onChange(next); setCook(false) }} /> : null}
        </div>
      ) : null}
      {preview ? <p className="px-1 pt-2 text-[12px] text-muted">{preview}</p> : null}
      {notice ? <p className="px-1 pt-2 text-[12px] text-warn">{notice}</p> : null}
    </div>
  )
}

/** The picker on the composer's left: which project this work belongs to. */
function ProjectDropdown({
  projects,
  project,
  onProject,
}: {
  projects: Project[]
  project: string | null
  onProject?: (id: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  useDismiss(ref, () => setOpen(false), open)
  const current = projects.find(entry => entry.id === project)
  if (!onProject) return null
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Which project this conversation belongs to"
        className="flex h-7 min-w-0 items-center gap-1.5 rounded-lg px-2 text-[11.5px] text-muted hover:text-ink"
      >
        <FolderOpen size={11} aria-hidden />
        <span className="min-w-0 max-w-[120px] truncate">{current ? current.name : 'Project'}</span>
        <ChevronDown size={11} />
      </button>
      {open ? (
        <div role="menu" aria-label="Projects" className="absolute bottom-9 left-0 z-20 w-[220px] rounded-xl border border-line bg-card p-1.5 shadow-xl">
          <button
            type="button"
            role="menuitemradio"
            aria-checked={project === null}
            onClick={() => { onProject(null); setOpen(false) }}
            className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-[12.5px] text-muted hover:text-ink"
          >
            No project
          </button>
          {projects.map(entry => (
            <button
              key={entry.id}
              type="button"
              role="menuitemradio"
              aria-checked={entry.id === project}
              onClick={() => { onProject(entry.id); setOpen(false) }}
              className={`flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-[12.5px] ${
                entry.id === project ? 'bg-white/[0.06] text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              <span className="min-w-0 flex-1 truncate">{entry.name}</span>
            </button>
          ))}
          {projects.length === 0 ? (
            <p className="px-2.5 py-2 text-[11.5px] leading-relaxed text-muted">
              No projects yet. Projects is where one is made.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Cook This Prompt: the vault as context, in the approved format. The draft's
 * own words are the search against the vault's content; the hits become
 * `[Title: line]` entries, shown for a yes or no — nothing enters the prompt
 * unshown, and nothing leaves the machine.
 */
function CookDialog({ draft, onDone }: { draft: string; onDone: (next: string | null) => void }) {
  const [hits, setHits] = useState<Array<{ path: string; line: number; text: string }>>([])
  const [state, setState] = useState('looking')
  const [picked, setPicked] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const words = Array.from(new Set(draft.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 3))).slice(0, 3)
    if (!words.length) {
      setState('empty')
      return
    }
    const controller = new AbortController()
    // One search per word: the grep matches a whole needle as one phrase, and
    // a three-word phrase rarely survives verbatim in the vault. Word by word
    // finds the files that matter, and the merge keeps the best six.
    void Promise.all(
      words.map(word =>
        vaultGet(`/grep?q=${encodeURIComponent(word)}`, controller.signal).catch(() => 'failed'),
      ),
    ).then((replies) => {
      // A refused or unreachable door is not the same as an empty vault — the
      // two states get different sentences.
      if (replies.some(reply => reply === 'failed')) {
        setState('offline')
        return
      }
      const seen = new Set<string>()
      const found: Array<{ path: string; line: number; text: string }> = []
      for (const reply of replies as VaultReply[]) {
        for (const hit of Array.isArray(reply?.hits) ? reply.hits : []) {
          const key = `${hit.path}:${hit.line}`
          if (seen.has(key)) continue
          seen.add(key)
          found.push(hit)
          if (found.length >= 6) break
        }
        if (found.length >= 6) break
      }
      setHits(found)
      setPicked(Object.fromEntries(found.map((hit: { path: string }) => [hit.path, true])))
      setState(found.length ? 'ready' : 'nothing')
    })
    return () => controller.abort()
  }, [draft])

  const title = (path: string): string => path.replace(/\.md$/i, '').split('/').at(-1) ?? path

  return (
    <div className="absolute bottom-9 left-1 z-30 w-[340px] rounded-xl border border-line bg-card p-3 shadow-xl" role="dialog" aria-label="Cook this prompt">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Enhanced prompt</p>
      {state === 'looking' ? <p className="mt-2 text-[12px] text-muted">Searching the vault…</p> : null}
      {state === 'empty' ? <p className="mt-2 text-[12px] text-muted">Write the prompt first, its words are the search.</p> : null}
      {state === 'offline' ? <p className="mt-2 text-[12px] text-muted">The vault is not reachable right now.</p> : null}
      {state === 'nothing' ? <p className="mt-2 text-[12px] text-muted">Nothing in the vault matches this prompt.</p> : null}
      {state === 'ready' ? (
        <div className="mt-2 flex max-h-[180px] flex-col gap-1 overflow-y-auto">
          {hits.map(hit => (
            <label key={`${hit.path}:${hit.line}`} className="flex cursor-pointer items-start gap-2 rounded-lg px-1.5 py-1 hover:bg-white/[0.04]">
              <input
                type="checkbox"
                checked={picked[hit.path] === true}
                onChange={() => setPicked(previous => ({ ...previous, [hit.path]: previous[hit.path] !== true }))}
                className="mt-0.5 accent-[var(--color-accent)]"
              />
              <span className="min-w-0">
                <span className="block text-[12px] text-ink">[{title(hit.path)}]</span>
                <span className="block truncate text-[11px] text-muted">{hit.text}</span>
              </span>
            </label>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex items-center justify-end gap-2">
        <button type="button" onClick={() => onDone(null)} className="rounded-lg px-3 py-1 text-[12px] text-muted hover:text-ink">
          Cancel
        </button>
        <button
          type="button"
          disabled={state !== 'ready'}
          onClick={() => {
            const lines = hits.filter(hit => picked[hit.path] === true).map(hit => `[${title(hit.path)}: ${hit.text.trim().slice(0, 120)}]`)
            onDone(lines.length ? `${lines.join('\n')}\n\n${draft}` : draft)
          }}
          className="rounded-lg bg-accent px-3 py-1 text-[12px] font-medium text-white hover:bg-accent/90 disabled:opacity-50"
        >
          OK
        </button>
      </div>
    </div>
  )
}

/** The engine chip: which engine, and its own three modes. Nothing from the app. */
function EngineChip({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const engine = useEngine()
  const modes: Array<{ id: 'ask' | 'edits' | 'full'; label: string; note: string }> = [
    { id: 'ask', label: 'Ask me', note: 'Every step beyond reading asks you first.' },
    { id: 'edits', label: 'Auto-edits', note: 'Files change unasked; other commands still ask.' },
    { id: 'full', label: 'Full speed', note: 'Everything runs unasked. The engine\u2019s own deny rules still hold.' },
  ]
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Which engine works here, and how much it may do before asking"
        className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11.5px] text-muted hover:text-ink"
      >
        <Cpu size={11} aria-hidden />
        {engine.settings.id}
        <ChevronDown size={11} />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Engines and how much they may do"
          className="absolute bottom-9 left-0 z-20 w-[270px] rounded-xl border border-line bg-card p-1.5 shadow-xl"
        >
          {engine.detection.engines.length === 0 ? (
            <button
              type="button"
              onClick={() => void engine.checkEngines()}
              className="w-full rounded-lg px-2.5 py-2 text-left text-[12px] text-muted hover:text-ink"
            >
              Asking this machine which engines are installed…
            </button>
          ) : (
            engine.detection.engines.map(entry => (
              <button
                key={entry.id}
                type="button"
                role="menuitemradio"
                aria-checked={entry.id === engine.settings.id}
                onClick={() => {
                  if (entry.found) void engine.pick(entry.id)
                }}
                title={entry.found ? entry.version : entry.install}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] ${
                  entry.id === engine.settings.id ? 'bg-white/[0.06] text-ink' : entry.found ? 'text-muted hover:text-ink' : 'text-muted/50'
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{entry.id}</span>
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${entry.found ? 'bg-ok' : 'bg-muted'}`} />
              </button>
            ))
          )}
          <div className="mt-1 border-t border-line px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wide text-muted">
            Before it acts
          </div>
          {modes.map(mode => (
            <button
              key={mode.id}
              type="button"
              role="menuitemradio"
              aria-checked={(engine.settings.approval ?? 'ask') === mode.id}
              title={mode.note}
              onClick={() => void engine.setApproval(mode.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] ${
                (engine.settings.approval ?? 'ask') === mode.id ? 'bg-white/[0.06] text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {mode.label}
            </button>
          ))}
          <p className="px-2.5 pb-1.5 pt-1.5 text-[10.5px] leading-relaxed text-muted">
            These are the engine's own modes. The app adds no rules of its own.
          </p>
        </div>
      ) : null}
    </div>
  )
}

/** The models chip: what the CHOSEN engine can really use, from its own door. */
function ModelChip({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const engine = useEngine()
  const [filter, setFilter] = useState('')
  const entries = engine.models.entries.filter((entry) => entry.name.toLowerCase().includes(filter.toLowerCase()))
  // Adopted from the better pickers in the landscape (nexu-io's model search,
  // backchat's shared picker): a long list is searched, not scrolled blind.
  const searchable = engine.models.entries.length > 8
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (!open) void engine.loadModels()
          onToggle()
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        title="The models this engine can use, from the engine itself"
        className="flex h-7 min-w-0 items-center gap-1.5 rounded-lg px-2 text-[11.5px] text-muted hover:text-ink"
      >
        <Layers size={11} aria-hidden />
        <span className="min-w-0 max-w-[160px] truncate">{engine.settings.model || 'choose a model'}</span>
        <ChevronDown size={11} />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={`Models for ${engine.settings.id}`}
          className="absolute bottom-9 left-0 z-20 max-h-[280px] w-[260px] overflow-y-auto rounded-xl border border-line bg-card p-1.5 shadow-xl"
        >
          {searchable ? (
            <input
              autoFocus
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter models…"
              aria-label="Filter models"
              className="mb-1 h-7 w-full rounded-lg border border-line bg-bg px-2 text-[12px] text-ink outline-none placeholder:text-muted focus:border-accent/60"
            />
          ) : null}
          {engine.models.entries.length === 0 ? (
            <p className="px-2.5 py-2 text-[12px] leading-relaxed text-muted">
              {engine.models.loading
                ? 'Asking the engine what it can use…'
                : engine.models.error || `The engine named no models. ${engine.settings.id === 'claude-code' ? 'Log in once with the CLI, or point it at a brain in Settings.' : 'Its own check has not run yet.'}`}
            </p>
          ) : (
            entries.map(entry => (
              <button
                key={entry.name}
                type="button"
                role="menuitemradio"
                aria-checked={entry.name === engine.settings.model}
                onClick={() => {
                  void engine.setModel(entry.name, entry.provider)
                  onToggle()
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] ${
                  entry.name === engine.settings.model ? 'bg-white/[0.06] text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                {entry.cloud ? (
                  <span className="shrink-0 rounded-md border border-line px-1.5 text-[10px] text-muted">cloud</span>
                ) : typeof entry.sizeGB === 'number' ? (
                  <span className="shrink-0 text-[10.5px] text-muted">{entry.sizeGB.toFixed(1)} GB</span>
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

export type { EngineTurn }
