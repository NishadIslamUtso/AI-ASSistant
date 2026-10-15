import { Database, FolderOpen, MessageSquare, Shapes, SquareTerminal, Sun } from 'lucide-react'

/**
 * The app's own sections, at the top of the sidebar.
 *
 * Two entries, because two screens exist. Code, Projects, Vault and Today are
 * in the design and are not built yet; they are named in one muted line rather
 * than drawn as entries that do nothing. A nav that looks complete and is not
 * is worse than a short one that is — that is the rule this file exists to
 * keep.
 */

export type View = 'chat' | 'artifacts' | 'today' | 'projects' | 'vault' | 'code'

const ITEMS: Array<{ id: View; label: string; Icon: typeof MessageSquare }> = [
  { id: 'chat', label: 'Chat', Icon: MessageSquare },
  { id: 'artifacts', label: 'Artifacts', Icon: Shapes },
  { id: 'today', label: 'Today', Icon: Sun },
  { id: 'projects', label: 'Projects', Icon: FolderOpen },
  { id: 'vault', label: 'Vault', Icon: Database },
  { id: 'code', label: 'Code', Icon: SquareTerminal },
]

export default function AppNav({
  view,
  onView,
  collapsed = false,
  artifactCount = 0,
}: {
  view: View
  onView: (view: View) => void
  collapsed?: boolean
  artifactCount?: number
}) {
  return (
    <nav aria-label="Sections" className={collapsed ? 'flex flex-col items-center gap-1 py-1' : 'flex flex-col gap-1'}>
      {ITEMS.map(({ id, label, Icon }) => {
        const active = view === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onView(id)}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            title={label}
            className={
              collapsed
                ? `flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    active ? 'bg-white/[0.08] text-ink' : 'text-muted hover:bg-white/[0.06] hover:text-ink'
                  }`
                : `flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] transition-colors ${
                    active ? 'bg-white/[0.08] text-ink' : 'text-muted hover:bg-white/[0.04] hover:text-ink'
                  }`
            }
          >
            <Icon size={14.5} className="shrink-0" />
            {collapsed ? null : <span className="flex-1">{label}</span>}
            {collapsed || id !== 'artifacts' || !artifactCount ? null : (
              <span className="text-[11px] text-muted">{artifactCount}</span>
            )}
          </button>
        )
      })}

    </nav>
  )
}
