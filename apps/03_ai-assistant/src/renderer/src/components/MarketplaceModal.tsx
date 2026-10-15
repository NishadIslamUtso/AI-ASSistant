import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import SkillsCatalogSection from './SkillsCatalogSection'
import { bridge, isDemo } from '@/platform/bridge'
import { useEngine } from '@/state/engine'

/**
 * The marketplace — the approved mockup's "Get apps and extensions" screen.
 *
 * What the app can really reach, in one place: the engines on this machine
 * (with their honest install lines when missing), the Chrome extension and
 * whether its door is open, and the skill catalog with working installs.
 * Nothing here is a promise; every row reports a real door's real answer.
 */
export default function MarketplaceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const engine = useEngine()
  const [extension, setExtension] = useState('')

  // Escape closes, like every other way out of this modal. Without this the
  // keyboard is trapped behind the × and the overlay.
  useEffect(() => {
    if (!open) return
    const dismiss = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', dismiss)
    return () => window.removeEventListener('keydown', dismiss)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    void engine.checkEngines()
    void bridge.extension
      .status()
      .then((answer) => {
        setExtension(
          answer.ok && answer.listening
            ? `Connected — the capture door is open on port ${answer.port}.`
            : 'Not connected. The desktop app opens the door when it runs.',
        )
      })
      .catch(() => setExtension('Not connected.'))
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Marketplace"
    >
      <div
        className="flex max-h-[82vh] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h1 className="text-[16px] font-semibold text-ink">Do more with AI ASSistant everywhere you work</h1>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted hover:bg-white/[0.06] hover:text-ink"
          >
            <X size={16} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* The hero, as the approved screen shows it: the engine at work in a
              terminal that is drawing its own honest future. */}
          <section className="mb-5 grid grid-cols-1 gap-4 rounded-2xl border border-line bg-bg p-5 sm:grid-cols-2">
            <div>
              <h2 className="text-[17px] font-semibold text-ink">The engine does the work</h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                Pick an engine below the composer, hand it real work, approve its steps. The app is its
                face — it adds no rules and takes no cut.
              </p>
              <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted">Or try it in</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {['Terminal', 'VS Code', 'Desktop'].map(place => (
                  <span key={place} className="rounded-lg border border-line px-2.5 py-1 text-[11.5px] text-muted">
                    {place}
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-line bg-panel p-3 font-mono text-[11.5px] leading-relaxed" aria-hidden="true">
              <p className="text-ink">{'> fix the auth bug in signup flow'}</p>
              <p className="mt-1 text-ok">✓ reading src/auth/signup.ts</p>
              <p className="text-ok">✓ found the issue in validateToken()</p>
              <p className="text-ok">✓ editing src/auth/validateToken.ts</p>
              <p className="mt-1.5 animate-pulse text-accent motion-reduce:animate-none">* cooking…</p>
            </div>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted">Engines, on this machine</h2>
            {(engine.detection.engines.length
              ? engine.detection.engines
              : [
                  { id: 'claude-code' as const, found: false, version: '', install: 'npm install -g @anthropic-ai/claude-code' },
                  { id: 'agy' as const, found: false, version: '', install: 'Install the agy CLI, then reopen.' },
                ]
            ).map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-line bg-bg px-3.5 py-3">
                <span className={`h-2 w-2 shrink-0 rounded-full ${entry.found ? 'bg-ok' : 'bg-muted'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-ink">{entry.id}</p>
                  <p className="truncate text-[11.5px] text-muted">
                    {entry.found ? entry.version || 'Installed.' : entry.install}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-muted">{entry.found ? 'Ready' : 'Not installed'}</span>
              </div>
            ))}
            <p className="text-[11px] leading-relaxed text-muted">
              An engine is the muscle: it reads the task, runs the tools, edits the files. The app is its face —
              it adds no rules and takes no cut.
            </p>
          </section>

          <section className="mt-5 flex flex-col gap-2">
            <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted">Extensions</h2>
            <div className="flex items-center gap-3 rounded-xl border border-line bg-bg px-3.5 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/20 text-[13px]">
                ⌘
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-ink">Chrome extension — capture the page you are reading</p>
                <p className="truncate text-[11.5px] text-muted">{isDemo ? 'The desktop app opens the door.' : extension}</p>
              </div>
            </div>
          </section>

          <section className="mt-5 flex flex-col gap-2">
            <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted">Skills — one vault, every engine</h2>
            <SkillsCatalogSection />
          </section>
        </div>
      </div>
    </div>
  )
}
