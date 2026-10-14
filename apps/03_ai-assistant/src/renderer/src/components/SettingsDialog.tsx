import { useEffect, useState } from 'react'
import { bridge, isDemo } from '../platform/bridge'
import type { VaultState } from '../hooks/useVault'
import type { ModelState } from '../hooks/useModels'
import { INFERENCE_PROFILES, vramWarning, type InferenceSettings } from '@shared/lib/inference'
import { ACCENTS, WIDTHS, type Appearance } from '../state/appearance'
import {
  CUSTOM_FIELDS,
  clampCustomOption,
  customRange,
  customValue,
  withCustomOption,
  withProfile,
} from '../state/performance'

/**
 * Settings.
 *
 * Three sections, and each one is wired to something real rather than to a
 * preference the app forgets:
 *
 * - Where your conversations are kept: the folder, chosen through the main
 *   process, which says whether it worked and what the vault looks like now.
 *   The path shown is always the one the vault itself reported. Nothing here
 *   creates a folder — if the path is wrong you are told, and nothing is made
 *   in its place.
 * - Appearance: the two theme tokens the interface reads. The app draws itself
 *   from tokens, so this is a re-theme, not a repaint.
 * - Performance: Ollama's own options, from the profile table in inference.ts.
 *   What is shown as running is what Ollama actually reported, never a guess.
 *
 * Anything that needs a machine says so plainly when there is not one — the
 * browser preview has no folder to choose and no model to run.
 */
export default function SettingsDialog({
  open,
  onClose,
  vault,
  onChanged,
  appearance,
  onAppearanceChange,
  inference,
  onInferenceChange,
  models,
}: {
  open: boolean
  onClose: () => void
  vault: VaultState
  /** Called after the vault moves, so the rest of the app re-reads it. */
  onChanged: () => void
  appearance: Appearance
  onAppearanceChange: (next: Appearance) => void
  inference: InferenceSettings
  onInferenceChange: (next: InferenceSettings) => void
  models: ModelState
}) {
  const [typed, setTyped] = useState('')
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setProblem('')
    // Show the folder that is actually in use, so the field is a starting point
    // rather than a blank box to guess into.
    bridge.settings.read().then(settings => setTyped(settings.vaultPath || '')).catch(() => {})
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function apply(folder: string): Promise<void> {
    if (busy) return
    setBusy(true)
    setProblem('')
    try {
      const result = await bridge.settings.update({ vaultPath: folder })
      if (!result.ok) {
        setProblem(result.error || 'That folder could not be used.')
        return
      }
      setTyped(result.settings?.vaultPath || folder)
      onChanged()
    } catch (error) {
      setProblem((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function choose(): Promise<void> {
    const folder = await bridge.vault.chooseFolder()
    if (!folder) return
    setTyped(folder)
    await apply(folder)
  }

  const stored = isDemo
    ? {
        // "Checking…" here would be a small lie: nothing is being checked, and
        // nothing is going to arrive.
        dot: 'bg-muted',
        label: 'Not in this window',
        detail: 'The desktop app keeps conversations in the vault folder you choose.',
      }
    : vault.state === 'ready'
      ? { dot: 'bg-ok', label: 'Keeping conversations', detail: vault.path }
      : vault.state === 'missing'
        ? { dot: 'bg-warn', label: 'No vault yet', detail: vault.error }
        : vault.state === 'offline'
          ? { dot: 'bg-muted', label: 'Vault unreachable', detail: 'The app is still running; nothing is being written.' }
          : { dot: 'bg-muted', label: 'Checking…', detail: '' }

  // What is actually loaded right now. In the preview there is no machine, so
  // the section says that instead of pretending Ollama is fine.
  const installed = models.models.find(entry => entry.name === models.model)
  const warning = vramWarning(inference, installed?.size || 0)
  const running = isDemo
    ? {
        dot: 'bg-muted',
        label: 'No machine behind this window',
        detail:
          'The browser preview is the interface only. These choices are remembered here and take effect in the desktop app.',
      }
    : models.status === 'online' && models.available
      ? {
          dot: 'bg-ok',
          label: `Running on this machine: ${models.model}`,
          detail: installed?.size
            ? `${(installed.size / 1e9).toFixed(1)} GB on disk · answers come from Ollama on 127.0.0.1`
            : 'Answers come from Ollama on 127.0.0.1',
        }
      : models.status === 'loading'
        ? { dot: 'bg-muted', label: 'Looking for Ollama…', detail: '' }
        : {
            dot: 'bg-warn',
            label: 'Ollama is not answering',
            detail:
              models.error ||
              'Start Ollama, then open Settings again to see what this will run on. The profile below is kept either way.',
          }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-6 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex w-full max-w-lg flex-col rounded-xl border border-line bg-panel shadow-2xl"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <header className="flex items-center gap-2 border-b border-line px-4 py-3">
          <h2 className="text-[14px] font-medium">Settings</h2>
          <button
            className="ml-auto rounded-md px-2 py-1 text-[12px] text-muted hover:bg-white/[0.06]"
            onClick={onClose}
            aria-label="Close settings"
          >
            Close
          </button>
        </header>

        {/* The body scrolls so the window never grows off the bottom of a screen. */}
        <div className="max-h-[min(72vh,640px)] overflow-y-auto">
          <section className="px-4 py-4">
            <h3 className="text-[13px] font-medium">Where your conversations are kept</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Finished conversations are written as Markdown into your vault, in folders you can read and edit
              yourself — no database, nothing you need this app to open.
            </p>

            <div className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-card px-3 py-2.5">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${stored.dot}`} />
              <div className="min-w-0">
                <div className="text-[12.5px]">{stored.label}</div>
                {stored.detail && (
                  <div className="mt-0.5 break-all text-[11.5px] leading-relaxed text-muted">{stored.detail}</div>
                )}
                {vault.state === 'ready' && typeof vault.files === 'number' && (
                  <div className="mt-0.5 text-[11.5px] text-muted">
                    {vault.files} files on disk
                  </div>
                )}
              </div>
            </div>

            {isDemo ? (
              <p className="mt-3 text-[12px] leading-relaxed text-muted">
                This window is the browser preview, so there is no machine behind it and nothing to point at a
                vault. In the desktop app this is where you choose the folder.
              </p>
            ) : (
              <>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg border border-line px-3 py-2 text-[12.5px] hover:bg-white/[0.06]"
                    onClick={() => void choose()}
                    disabled={busy}
                    aria-label="Choose folder"
                  >
                    Choose folder…
                  </button>
                  <div className="flex min-w-0 flex-1 gap-2">
                    <input
                      className="min-w-0 flex-1 rounded-lg border border-line bg-card px-3 py-2 text-[12.5px] outline-none focus:border-accent"
                      value={typed}
                      onChange={event => setTyped(event.target.value)}
                      placeholder="Paste a folder path"
                      aria-label="Vault folder path"
                      spellCheck={false}
                    />
                    <button
                      className="rounded-lg border border-line px-3 py-2 text-[12.5px] hover:bg-white/[0.06] disabled:opacity-50"
                      onClick={() => void apply(typed)}
                      disabled={busy || !typed.trim()}
                      aria-label="Use this folder"
                    >
                      Use
                    </button>
                  </div>
                </div>
                {problem && (
                  <p className="mt-2 text-[12px] text-warn" role="status">
                    {problem}
                  </p>
                )}
                <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
                  The folder has to exist. Nothing is created for you, and an empty replacement vault is never
                  made in its place — if the path is wrong, this says so instead.
                </p>
              </>
            )}
          </section>

          <section className="border-t border-line px-4 py-4">
            <h3 className="text-[13px] font-medium">Appearance</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              The interface is drawn from theme tokens, so these rewrite the tokens themselves rather than
              painting over them. Both apply at once and are remembered on this machine.
            </p>

            <div className="mt-3 flex items-center gap-3">
              <span className="w-[112px] shrink-0 text-[12px] text-muted">Accent</span>
              <div className="flex gap-1.5">
                {ACCENTS.map(accent => (
                  <button
                    key={accent.name}
                    type="button"
                    className={`h-6 w-6 rounded-full border-2 ${
                      appearance.accent === accent.name ? 'border-ink' : 'border-transparent'
                    }`}
                    style={{ background: accent.hex }}
                    onClick={() => onAppearanceChange({ ...appearance, accent: accent.name })}
                    aria-label={`Accent: ${accent.label}`}
                    aria-pressed={appearance.accent === accent.name}
                    title={accent.label}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <span className="w-[112px] shrink-0 text-[12px] text-muted">Conversation width</span>
              <div className="flex gap-1.5">
                {WIDTHS.map(width => (
                  <button
                    key={width.name}
                    type="button"
                    className={`rounded-full border px-3 py-1 text-[12px] ${
                      appearance.width === width.name
                        ? 'border-accent bg-accent/15 text-ink'
                        : 'border-line text-muted hover:bg-white/[0.06]'
                    }`}
                    onClick={() => onAppearanceChange({ ...appearance, width: width.name })}
                    aria-label={`Conversation width: ${width.label}`}
                    aria-pressed={appearance.width === width.name}
                    title={`${width.px} pixels wide`}
                  >
                    {width.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-line px-4 py-4">
            <h3 className="text-[13px] font-medium">Performance</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Ollama's own options, sent with each message. This is how a small card copes: the profile decides
              how much memory a reply is allowed to ask for.
            </p>

            <div className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-card px-3 py-2.5">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${running.dot}`} />
              <div className="min-w-0">
                <div className="text-[12.5px]">{running.label}</div>
                {running.detail && (
                  <div className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{running.detail}</div>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1.5">
              {INFERENCE_PROFILES.map(profile => {
                const selected = inference.profile === profile.id
                return (
                  <button
                    key={profile.id}
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-left ${
                      selected ? 'border-accent bg-card' : 'border-line hover:bg-white/[0.04]'
                    }`}
                    onClick={() => onInferenceChange(withProfile(inference, profile.id))}
                    aria-label={`Profile: ${profile.label}`}
                    aria-pressed={selected}
                  >
                    <span className="flex items-center gap-2 text-[12.5px]">
                      <span className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-accent' : 'bg-line'}`} />
                      {profile.label}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted">
                      {profile.hint}
                    </span>
                  </button>
                )
              })}
            </div>

            {inference.profile === 'custom' && (
              <>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {CUSTOM_FIELDS.map(field => (
                    <label key={field.key} className="rounded-lg border border-line bg-card px-3 py-2">
                      <span className="block text-[11.5px] text-muted">{field.label}</span>
                      <input
                        className="mt-0.5 w-full bg-transparent text-[13px] outline-none placeholder:text-muted/60"
                        inputMode="numeric"
                        value={customValue(inference, field.key)}
                        placeholder={customRange(field.key)}
                        aria-label={field.label}
                        spellCheck={false}
                        onChange={event =>
                          onInferenceChange(withCustomOption(inference, field.key, event.target.value))
                        }
                        onBlur={() => onInferenceChange(clampCustomOption(inference, field.key))}
                      />
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
                        {field.hint}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
                  Leave a box empty to keep the model's own default. A value outside the range shown is pulled
                  back into it.
                </p>
              </>
            )}

            {warning && (
              <p className="mt-2 text-[12px] leading-relaxed text-warn" role="status">
                {warning}
              </p>
            )}
          </section>
        </div>

        <footer className="border-t border-line px-4 py-3 text-[11.5px] text-muted">
          Agent access is the next section here.
        </footer>
      </div>
    </div>
  )
}
