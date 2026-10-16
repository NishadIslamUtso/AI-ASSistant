import { useEffect, useState } from 'react'
import { bridge } from '../platform/bridge'

/**
 * Second-brain structure (his 2026-10-16 order): the LLM-wiki architecture as
 * the default, offered through the choice he described — generate a new
 * structure, or use a folder that already has its own. Either way the rule is
 * the same and shown before it runs: only what is missing is added, and what
 * is already there is never rewritten.
 */

type Inspection = { ok: boolean; kind?: string; present?: string[]; missing?: string[]; differing?: string[]; error?: string }

const KIND_LABEL: Record<string, string> = {
  'app-structure': 'This vault already speaks the app\'s structure.',
  obsidian: 'An Obsidian vault — its own layout stays untouched.',
  'llm-wiki': 'A raw/wiki layout — the intake wall is already in place.',
  empty: 'An empty folder, ready for a full structure.',
  other: 'The folder\'s own layout — it stays as it is; only additions are made.',
}

/** A count, not a vibe: "3 of 5 structure files present." */
function countLine(inspection: Inspection): string {
  const present = inspection.present?.length ?? 0
  const missing = inspection.missing?.length ?? 0
  return `${present} of ${present + missing} structure files present.`
}

export default function BrainStructureSection({ path, isDemo }: { path: string; isDemo: boolean }) {
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [asked, setAsked] = useState(false)
  const [adopted, setAdopted] = useState<{ root: string; inspection: Inspection } | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [links, setLinks] = useState<{ files: number; checked: number; dead: Array<{ from: string; target: string }>; ambiguous: Array<{ from: string; target: string; matches: string[] }>; error?: string } | null>(null)

  useEffect(() => {
    if (isDemo || !path) return
    let live = true
    bridge.structure
      .inspect(path)
      .then(result => {
        if (live) setInspection(result)
      })
      .catch(() => {
        if (live) setInspection({ ok: false, error: 'The folder could not be inspected.' })
      })
    return () => {
      live = false
    }
  }, [path, isDemo])

  async function apply(root: string): Promise<void> {
    setBusy(true)
    setNotice('')
    try {
      const result = await bridge.structure.apply(root)
      if (!result.ok) {
        setNotice(result.error || 'Nothing was written.')
        return
      }
      const written = result.written ?? []
      setNotice(
        written.length
          ? `Added ${written.length} file${written.length === 1 ? '' : 's'}: ${written.join(', ')}. Nothing existing was touched.`
          : 'Nothing to add — every structure file is already in place.'
      )
      setAdopted(null)
      setAsked(false)
      const fresh = await bridge.structure.inspect(root)
      if (root === path) setInspection(fresh)
      else if (fresh.ok) setNotice(`Added ${written.length} file${written.length === 1 ? '' : 's'} to ${root}. To make it the app's vault, use Folder > Choose folder above.`)
    } catch (error) {
      setNotice((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function pickExisting(): Promise<void> {
    const folder = await bridge.vault.chooseFolder()
    if (!folder) return
    setBusy(true)
    setNotice('')
    try {
      const result = await bridge.structure.inspect(folder)
      if (!result.ok) {
        setNotice(result.error || 'That folder cannot be read.')
        return
      }
      setAdopted({ root: folder, inspection: result })
    } finally {
      setBusy(false)
    }
  }

  async function refresh(root: string): Promise<void> {
    setBusy(true)
    setNotice('')
    try {
      const result = await bridge.structure.apply(root, { refresh: true })
      if (!result.ok) {
        setNotice(result.error || 'Nothing was written.')
        return
      }
      const refreshed = result.refreshed ?? []
      const written = result.written ?? []
      const parts: string[] = []
      if (refreshed.length) parts.push(`Replaced with the current wording: ${refreshed.join(', ')}. Notes were never touched.`)
      if (written.length) parts.push(`Added ${written.length} missing file${written.length === 1 ? '' : 's'}: ${written.join(', ')}.`)
      setNotice(parts.length ? parts.join(' ') : 'Already up to date — nothing replaced.')
      const fresh = await bridge.structure.inspect(root)
      if (root === path) setInspection(fresh)
    } catch (error) {
      setNotice((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function checkLinks(): Promise<void> {
    setBusy(true)
    try {
      setLinks(await bridge.structure.linkCheck())
    } catch (error) {
      setLinks({ files: 0, checked: 0, dead: [], ambiguous: [], error: (error as Error).message })
    } finally {
      setBusy(false)
    }
  }

  function linksLine(): string {
    if (!links) return ''
    if (links.error) return links.error
    const dead = links.dead.length
    const ambiguous = links.ambiguous.length
    if (!dead && !ambiguous) return `${links.checked} links across ${links.files} notes — every one resolves.`
    const deadNames = dead ? `${dead} dead (${links.dead.slice(0, 3).map(h => h.target).join(', ')}${dead > 3 ? '…' : ''})` : ''
    const ambNames = ambiguous ? `${ambiguous} ambiguous bare names (${links.ambiguous.slice(0, 3).map(h => h.target).join(', ')}${ambiguous > 3 ? '…' : ''})` : ''
    return `${links.checked} links across ${links.files} notes — ${[deadNames, ambNames].filter(Boolean).join(', ')}.`
  }

  if (isDemo) {
    return (
      <p className="text-[12px] text-muted">
        The structure — wiki, people, index and the engine rulebooks — is set up from the desktop app, where the real
        folder is.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12.5px]">
        The second-brain structure: <span className="font-semibold">05 Knowledge</span> (the engine's own synthesized
        notes), <span className="font-semibold">10 People</span>, <span className="font-semibold">index.md</span>, and
        the rulebooks (<span className="font-semibold">CLAUDE.md</span>, <span className="font-semibold">AGENTS.md</span>)
        the engines read at the vault root. The capture record stays write-once; the structure only ever adds what is
        missing.
      </p>
      {!path ? (
        <p className="text-[12px] text-muted">Choose the vault folder first — the structure is built inside it.</p>
      ) : inspection?.ok ? (
        <p className="text-[12px] text-muted" role="status">
          {KIND_LABEL[inspection.kind || 'other'] || KIND_LABEL.other} {countLine(inspection)}
        </p>
      ) : (
        <p className="text-[12px] text-muted">{inspection?.error || 'Checking the folder…'}</p>
      )}
      {path && !asked ? (
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-line px-3 py-2 text-[12.5px] hover:bg-white/[0.06] disabled:opacity-50"
            disabled={busy}
            onClick={() => setAsked(true)}
            aria-label="Set up structure"
          >
            Set up structure…
          </button>
          <button
            className="rounded-lg border border-line px-3 py-2 text-[12.5px] hover:bg-white/[0.06] disabled:opacity-50"
            disabled={busy}
            onClick={() => void checkLinks()}
            aria-label="Check links"
          >
            Check links
          </button>
        </div>
      ) : null}
      {links ? (
        <p className="break-words text-[12px] text-muted" role="status">
          {linksLine()}
        </p>
      ) : null}
      {inspection?.ok && inspection.differing?.length ? (
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-card p-2.5">
          <p className="text-[12px] text-muted">
            The app's wording of {inspection.differing.join(', ')} is newer than what the vault holds. Your notes are
            never touched — only that file's rules text.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-line px-3 py-2 text-[12.5px] hover:bg-white/[0.06] disabled:opacity-50"
              disabled={busy}
              onClick={() => void refresh(path)}
              aria-label="Replace rulebooks with current wording"
            >
              Replace with current wording
            </button>
          </div>
        </div>
      ) : null}
      {asked ? (
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-card p-2.5">
          <p className="text-[12.5px]">Generate a new structure here, or use a folder that already has its own?</p>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-line px-3 py-2 text-[12.5px] hover:bg-white/[0.06] disabled:opacity-50"
              disabled={busy}
              onClick={() => void apply(path)}
              aria-label="Generate a new structure"
            >
              Generate a new structure
            </button>
            <button
              className="rounded-lg border border-line px-3 py-2 text-[12.5px] hover:bg-white/[0.06] disabled:opacity-50"
              disabled={busy}
              onClick={() => void pickExisting()}
              aria-label="Use an existing folder"
            >
              Use an existing folder…
            </button>
            <button
              className="rounded-lg border border-line px-3 py-2 text-[12.5px] text-muted hover:bg-white/[0.06] disabled:opacity-50"
              disabled={busy}
              onClick={() => setAsked(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {adopted ? (
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-card p-2.5">
          <p className="text-[12.5px]">
            {KIND_LABEL[adopted.inspection.kind || 'other'] || KIND_LABEL.other} {countLine(adopted.inspection)}
          </p>
          {adopted.inspection.missing?.length ? (
            <>
              <p className="text-[12px] text-muted">
                Would be added, nothing else touched: {adopted.inspection.missing.join(', ')}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-lg border border-line px-3 py-2 text-[12.5px] hover:bg-white/[0.06] disabled:opacity-50"
                  disabled={busy}
                  onClick={() => void apply(adopted.root)}
                  aria-label="Add missing structure files"
                >
                  Add {adopted.inspection.missing.length} missing file{adopted.inspection.missing.length === 1 ? '' : 's'}
                </button>
                <button
                  className="rounded-lg border border-line px-3 py-2 text-[12.5px] text-muted hover:bg-white/[0.06] disabled:opacity-50"
                  disabled={busy}
                  onClick={() => setAdopted(null)}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <p className="text-[12px] text-muted">Nothing to add there — it is already complete.</p>
          )}
        </div>
      ) : null}
      {notice ? (
        <p className="break-words text-[12px]" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  )
}
