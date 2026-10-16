import { useEffect, useState } from 'react'
import { bridge } from '../platform/bridge'
import ConnectionGraph from './ConnectionGraph'
import type { VaultState } from '../hooks/useVault'

/**
 * Brain — the vault's connections as a first-class view, not a settings
 * embed. This is the "Claude OS" idea from the design talks: the machine's
 * second brain as a living constellation you can turn in your hand, one
 * sidebar click away. The same graph engine as Settings › Vault draws it,
 * here at full height; the numbers beside it are the link check's own words,
 * never invented.
 */

type Links = {
  files: number
  checked: number
  dead: Array<{ from: string; target: string }>
  ambiguous: Array<{ from: string; target: string; matches: string[] }>
  edges: Array<{ from: string; to: string }>
  error?: string
}

export default function BrainView({
  vault,
  isDemo,
  onOpenVault,
}: {
  vault: VaultState
  isDemo: boolean
  onOpenVault: () => void
}) {
  const path = vault.path
  const [links, setLinks] = useState<Links | null>(null)

  useEffect(() => {
    if (isDemo || !path) return
    let live = true
    bridge.structure
      .linkCheck()
      .then(result => {
        if (live) setLinks(result)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [path, isDemo])

  const stat = (label: string, value: string | number) => (
    <div className="rounded-lg border border-line bg-card px-3 py-2" key={label}>
      <div className="text-[15px] font-semibold text-ink">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  )

  if (isDemo || !path) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-y-auto" aria-label="Brain">
        <div className="mx-auto max-w-[440px] rounded-xl border border-line bg-card p-5 text-center">
          <h1 className="text-[16px] font-semibold text-ink">The brain draws from the real vault</h1>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
            Every node is a note, every edge a resolved [[link]]. Choose a folder in Vault and this view
            fills with it.
          </p>
          <button
            type="button"
            onClick={onOpenVault}
            className="mt-4 rounded-lg bg-accent px-3 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-accent/90"
          >
            Open Vault
          </button>
        </div>
      </div>
    )
  }

  const dead = links?.error ? '—' : links ? links.dead.length : '…'
  const ambiguous = links?.error ? '—' : links ? links.ambiguous.length : '…'

  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-label="Brain">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 pt-5">
        <h1 className="text-[20px] font-semibold text-ink">Brain</h1>
        <span className="min-w-0 truncate text-[12px] text-muted">{path}</span>
      </header>

      <div className="mt-3 grid grid-cols-2 gap-2 px-5 sm:grid-cols-4" aria-label="Link counts">
        {stat('notes with links', links?.error ? '—' : links ? links.files : '…')}
        {stat('links checked', links?.error ? '—' : links ? links.checked : '…')}
        {stat('edges drawn', links?.error ? '—' : links ? links.edges.length : '…')}
        {stat('dead / ambiguous', links ? `${dead} / ${ambiguous}` : '…')}
      </div>
      {links?.error ? (
        <p className="mt-2 px-5 text-[12px] text-muted" role="status">
          {links.error}
        </p>
      ) : null}

      <div className="mx-5 mb-2 mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-line bg-card">
        <ConnectionGraph path={path} isDemo={isDemo} variant="full" />
      </div>
      <p className="px-5 pb-4 text-[11px] text-muted">
        Drag to rotate, scroll to zoom. Edges are resolved [[links]] only — dead and ambiguous links stay
        counted in the numbers above and in Settings › Vault, never drawn as if they connected.
      </p>
    </div>
  )
}
