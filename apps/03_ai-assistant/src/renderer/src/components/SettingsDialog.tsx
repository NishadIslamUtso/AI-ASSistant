import { useEffect, useState } from 'react'
import { bridge, isDemo } from '../platform/bridge'
import type { VaultState } from '../hooks/useVault'

/**
 * Settings.
 *
 * One section so far, and it is the one that matters first: where your
 * conversations are kept. A vault that works but cannot be pointed anywhere is
 * only half a feature — this is the other half.
 *
 * The dialog never guesses. Choosing a folder goes to the main process, which
 * says whether it worked and what the vault looks like now; the path shown is
 * always the one the vault itself reported, not the one that was typed. Nothing
 * here creates a folder: if the path is wrong you are told, and nothing is made
 * in its place.
 */
export default function SettingsDialog({
  open,
  onClose,
  vault,
  onChanged,
}: {
  open: boolean
  onClose: () => void
  vault: VaultState
  /** Called after the vault moves, so the rest of the app re-reads it. */
  onChanged: () => void
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

  const state =
    vault.state === 'ready'
      ? { dot: 'bg-ok', label: 'Keeping conversations', detail: vault.path }
      : vault.state === 'missing'
        ? { dot: 'bg-warn', label: 'No vault yet', detail: vault.error }
        : vault.state === 'offline'
          ? { dot: 'bg-muted', label: 'Vault unreachable', detail: 'The app is still running; nothing is being written.' }
          : { dot: 'bg-muted', label: 'Checking…', detail: '' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-6 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-xl border border-line bg-panel shadow-2xl"
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

        <section className="px-4 py-4">
          <h3 className="text-[13px] font-medium">Where your conversations are kept</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            Finished conversations are written as Markdown into your vault, in folders you can read and edit
            yourself — no database, nothing you need this app to open.
          </p>

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-card px-3 py-2.5">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${state.dot}`} />
            <div className="min-w-0">
              <div className="text-[12.5px]">{state.label}</div>
              {state.detail && (
                <div className="mt-0.5 break-all text-[11.5px] leading-relaxed text-muted">{state.detail}</div>
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

        <footer className="border-t border-line px-4 py-3 text-[11.5px] text-muted">
          Appearance, performance and agent access are the next sections here.
        </footer>
      </div>
    </div>
  )
}
