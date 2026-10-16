import { useEffect, useState } from 'react'
import { FolderOpen, Package, Trash2, Check, Palette, MessageSquare, BookOpen } from 'lucide-react'
import { bridge, isDemo } from '@/platform/bridge'
import { describePermissions, type Pack } from '@shared/lib/packs'
import { readStored, writeStored } from '@shared/lib/storage'
import { savePrompt } from '@shared/lib/prompts'
import type { Appearance } from '../state/appearance'

/**
 * Settings > Extensions — mods, Phase 1.
 *
 * A pack is a folder with a manifest.json. This screen installs one from a
 * folder the person picks, says in plain words what it may do BEFORE it
 * lands, keeps every installed pack visible with its real path, and removes
 * one by undoing exactly what the install wrote. Skills deploy to every
 * engine; prompts join the prompt library; a theme becomes a look in Appearance.
 * No index, no server, no account — that is Phase 2's work, and it will be
 * the same list with a new source.
 */

type Listed = { pack: Pack; folder: string; installedAt: string }

const THEMES_KEY = 'ai-assistant.pack-themes'

/** Themes seen at install, kept by pack id so a look can be re-applied later. */
const packTheme = (id: string): Record<string, string> | null => {
  const all = readStored<Record<string, Record<string, string>>>(THEMES_KEY, {}, value => (typeof value === 'object' && value ? (value as Record<string, Record<string, string>>) : {})).value
  return all[id] ?? null
}

const rememberTheme = (id: string, appearance: Record<string, string>): void => {
  const all = readStored<Record<string, Record<string, string>>>(THEMES_KEY, {}, value => (typeof value === 'object' && value ? (value as Record<string, Record<string, string>>) : {})).value
  writeStored(THEMES_KEY, { ...all, [id]: appearance })
}

export default function ModsSection({
  onAppearanceChange,
  appearance,
}: {
  /** A theme is an appearance preset; applying it is the Appearance screen's own door. */
  onAppearanceChange: (appearance: Appearance) => void
  appearance: Appearance
}) {
  const [packs, setPacks] = useState<Listed[]>([])
  const [loading, setLoading] = useState(!isDemo)
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const [applied, setApplied] = useState('')

  const refresh = (): void => {
    void bridge.mods
      .list()
      .then(list => setPacks(list as Listed[]))
      .catch(() => setPacks([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [])

  const install = (): void => {
    if (busy || isDemo) return
    setBusy(true)
    setAnswer('')
    void bridge.mods
      .installFromFile()
      .then(reply => {
        if (!reply.ok) {
          setAnswer(reply.answer)
          return
        }
        // Prompts join the prompt library the composer's prompt features read — the renderer owns it.
        for (const prompt of reply.prompts ?? []) {
          try {
            savePrompt({ name: prompt.name, hint: 'from a pack', body: prompt.body })
          } catch {
            // A prompt that will not fit is skipped; the pack still stands.
          }
        }
        const theme = reply.themes?.[0]
        const pack = reply.pack
        if (theme && pack?.id) {
          rememberTheme(pack.id, theme.appearance)
          onAppearanceChange({ ...currentAppearance(), ...theme.appearance } as Appearance)
          setApplied(theme.name)
        }
        setAnswer(reply.answer)
        refresh()
      })
      .catch(() => setAnswer('The install did not finish. Nothing is assumed installed.'))
      .finally(() => setBusy(false))
  }

  /** The appearance as it stands, so a theme layers onto it rather than resetting it. */
  const currentAppearance = (): Appearance => appearance

  const remove = (id: string): void => {
    if (busy || isDemo) return
    setBusy(true)
    void bridge.mods
      .remove(id)
      .then(reply => {
        setAnswer(reply.answer)
        refresh()
      })
      .finally(() => setBusy(false))
  }

  const applyTheme = (pack: Pack): void => {
    const appearance = packTheme(pack.id)
    if (!appearance) {
      setAnswer(`No theme was kept for ${pack.name}. Reinstall the pack to bring its look back.`)
      return
    }
    onAppearanceChange({ ...currentAppearance(), ...appearance } as Appearance)
    setAnswer(`Theme applied from ${pack.name}.`)
  }

  if (isDemo) {
    return (
      <p className="text-[12px] leading-relaxed text-muted">
        Mods are installed by the desktop app — this preview has no machine behind it.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] leading-relaxed text-muted">
        A mod is a folder with a <span className="font-mono">manifest.json</span> — skills for the engines, prompts for the
        prompt library, a theme for the app. Nothing here comes from a server: you pick the folder, the app reads it in front of
        you, and every installed pack stays visible below with its real path.
      </p>

      <button
        type="button"
        onClick={install}
        disabled={busy}
        className="flex w-fit items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] text-ink hover:border-accent disabled:opacity-60"
      >
        <FolderOpen size={13} aria-hidden /> Install from folder…
      </button>

      {answer ? <p className="text-[12px] text-muted">{answer}</p> : null}
      {applied ? (
        <p className="text-[12px] text-ok">
          <Check size={12} className="inline" aria-hidden /> Theme “{applied}” applied — see Appearance.
        </p>
      ) : null}

      {loading ? (
        <p className="text-[12px] text-muted">Reading the installed packs…</p>
      ) : packs.length === 0 ? (
        <p className="text-[12px] text-muted">
          No mods installed yet. A pack is any folder shaped like this:
          <span className="mt-1 block rounded-md border border-line bg-panel p-2 font-mono text-[10.5px] leading-relaxed">
            {`manifest.json
skills/my-skill/SKILL.md
prompts/my-prompt.md
themes/paper.json`}
          </span>
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {packs.map(({ pack, folder }) => {
            const perms = describePermissions(pack)
            return (
              <li key={pack.id} className="rounded-xl border border-line bg-card p-3">
                <div className="flex items-start gap-2.5">
                  <Package size={15} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-ink">
                      {pack.name}{' '}
                      <span className="text-[11px] text-muted">
                        v{pack.version} · {pack.author}
                      </span>
                      <span
                        className="ml-2 rounded-md border border-warn/50 px-1.5 py-0.5 text-[10px] text-warn"
                        title="Not from the built-in index — you installed it from a folder yourself."
                      >
                        unverified
                      </span>
                    </p>
                    {pack.description ? <p className="mt-0.5 text-[11.5px] text-muted">{pack.description}</p> : null}
                    <p className="mt-0.5 text-[11.5px] text-muted">
                      {[
                        pack.contributes.skills.length ? `${pack.contributes.skills.length} skill${pack.contributes.skills.length === 1 ? '' : 's'}` : '',
                        pack.contributes.prompts.length ? `${pack.contributes.prompts.length} prompt${pack.contributes.prompts.length === 1 ? '' : 's'}` : '',
                        pack.contributes.themes.length ? `${pack.contributes.themes.length} theme${pack.contributes.themes.length === 1 ? '' : 's'}` : '',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-[11px] text-muted hover:text-ink">What it may do</summary>
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {perms.map(line => (
                          <li key={line} className="text-[11px] leading-relaxed text-muted">
                            · {line}
                          </li>
                        ))}
                      </ul>
                    </details>
                    <p className="mt-1.5 truncate font-mono text-[10.5px] text-muted" title={folder}>
                      {folder}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {pack.contributes.themes.length ? (
                      <button
                        type="button"
                        title="Apply this pack's theme"
                        aria-label={`Apply the theme from ${pack.name}`}
                        onClick={() => applyTheme(pack)}
                        className="rounded-lg border border-line p-1.5 text-muted hover:text-ink"
                      >
                        <Palette size={12} aria-hidden />
                      </button>
                    ) : null}
                    {pack.contributes.prompts.length ? (
                      <span className="rounded-lg border border-line p-1.5 text-muted" title="Its prompts are saved to the prompt library">
                        <MessageSquare size={12} aria-hidden />
                      </span>
                    ) : null}
                    {pack.contributes.skills.length ? (
                      <span className="rounded-lg border border-line p-1.5 text-muted" title="Its skills are in every engine's folder">
                        <BookOpen size={12} aria-hidden />
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => remove(pack.id)}
                      disabled={busy}
                      title={`Remove ${pack.name} — undoes the skills it deployed`}
                      aria-label={`Remove ${pack.name}`}
                      className="rounded-lg border border-line p-1.5 text-muted hover:text-warn disabled:opacity-60"
                    >
                      <Trash2 size={12} aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
