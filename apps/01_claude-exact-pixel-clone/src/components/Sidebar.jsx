import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Code2,
  Command,
  ExternalLink,
  Folder,
  FolderPlus,
  Menu,
  MessageSquare,
  MoreHorizontal,
  PanelLeft,
  Pencil,
  Pin,
  Plus,
  Search,
  Shapes,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { USER_INITIALS, USER_NAME } from '../lib/constants.js'
import { groupChats } from '../lib/chats.js'
import UserMenu from './UserMenu.jsx'

function IconBtn({ children, title, onClick }) {
  return (
    <button type="button" title={title} onClick={onClick} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ui-body hover:bg-ui-hover">
      {children}
    </button>
  )
}

export default function Sidebar({
  chats,
  activeId,
  onSelect,
  onNew,
  onRename,
  onTogglePin,
  onDelete,
  onOpenInWindow,
  onToggleSidebar,
  onOpenSettings,
  onOpenApps,
  onToggleVault,
}) {
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuSub, setMenuSub] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [ctx, setCtx] = useState(null) // { x, y, chat }
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const searchRef = useRef(null)

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q ? chats.filter((c) => c.title.toLowerCase().includes(q)) : chats
    return groupChats(list)
  }, [chats, search])

  const startRename = (chat) => {
    setCtx(null)
    setRenamingId(chat.id)
    setRenameValue(chat.title)
  }
  const finishRename = (save) => {
    if (save && renamingId) onRename(renamingId, renameValue)
    setRenamingId(null)
  }

  const ctxItems = (chat) => [
    { id: 'window', label: 'Open in new window', icon: ExternalLink, run: () => onOpenInWindow(chat.id) },
    { id: 'pin', label: chat.pinned ? 'Unpin' : 'Pin', key: 'P', icon: Pin, run: () => onTogglePin(chat.id) },
    { id: 'rename', label: 'Rename', key: 'R', icon: Pencil, run: () => startRename(chat) },
    { id: 'project', label: 'Add to project', icon: FolderPlus, sub: true, disabled: true },
    { id: 'group', label: 'Move to group', icon: Folder, sub: true, disabled: true },
    'sep',
    {
      id: 'delete',
      label: 'Delete',
      key: 'D',
      icon: Trash2,
      danger: true,
      run: () => {
        if (window.confirm(`Delete "${chat.title}" and its messages from AI ASSistant? This cannot be undone.`)) onDelete(chat.id)
      },
    },
  ]

  // Keyboard shortcuts while the context menu is open (P, R, D, Esc), as shown in the screenshot.
  useEffect(() => {
    if (!ctx) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setCtx(null)
        return
      }
      const k = e.key.toLowerCase()
      const item = ctxItems(ctx.chat).find((i) => i.key && i.key.toLowerCase() === k)
      if (item) {
        e.preventDefault()
        setCtx(null)
        item.run()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // ctxItems closes over props that do not change while the menu is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx])

  const MENUS = {
    File: [
      { label: 'New chat', kbd: 'Ctrl+N', run: onNew },
      { label: 'Settings', kbd: 'Ctrl+,', run: onOpenSettings },
      'sep',
      { label: 'Close window', disabled: true },
    ],
    Edit: [
      { label: 'Undo', run: () => document.execCommand('undo') },
      { label: 'Redo', run: () => document.execCommand('redo') },
      'sep',
      { label: 'Cut', run: () => document.execCommand('cut') },
      { label: 'Copy', run: () => document.execCommand('copy') },
      { label: 'Select all', run: () => document.execCommand('selectAll') },
    ],
    View: [
      { label: 'Toggle sidebar', run: onToggleSidebar },
      { label: 'Toggle vault panel', run: onToggleVault },
      { label: 'Appearance settings', run: onOpenSettings },
    ],
    Go: [
      { label: 'Search chats', run: () => searchRef.current?.focus() },
      { label: 'Projects', disabled: true },
      { label: 'Artifacts', disabled: true },
    ],
    Help: [
      { label: 'Get help', disabled: true },
      { label: 'About AI ASSistant', disabled: true },
    ],
  }

  const ctxPos = ctx
    ? { left: Math.max(8, Math.min(ctx.x, window.innerWidth - 245)), top: Math.max(8, Math.min(ctx.y, window.innerHeight - 320)) }
    : null

  return (
    <aside className="relative flex h-full w-[384px] shrink-0 flex-col bg-ui-side">
      {/* Toolbar: menu, sidebar toggle, back/forward, chat vs code switch */}
      <div className="flex h-12 shrink-0 items-center gap-2 pl-[15px] pr-[11px]">
        <IconBtn title="Menu" onClick={() => setMenuOpen((o) => !o)}>
          <Menu size={18} />
        </IconBtn>
        <IconBtn title="Hide sidebar" onClick={onToggleSidebar}>
          <PanelLeft size={18} />
        </IconBtn>
        <IconBtn title="Back (no history yet)">
          <ArrowLeft size={18} />
        </IconBtn>
        <IconBtn title="Forward (no history yet)">
          <ArrowRight size={18} />
        </IconBtn>
        <div className="ml-auto flex items-center rounded-md bg-ui-seg p-[3px]">
          <span className="flex h-6 w-7 items-center justify-center rounded bg-ui-active text-ui-text">
            <MessageSquare size={15} />
          </span>
          <span title="Code view (not built yet)" className="flex h-6 w-7 items-center justify-center text-ui-muted">
            <Code2 size={15} />
          </span>
        </div>
      </div>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setMenuOpen(false)
              setMenuSub(null)
            }}
          />
          <div className="absolute left-[15px] top-[12px] z-50 w-[135px] rounded-xl border border-ui-line bg-ui-menu p-1.5 shadow-2xl">
            {Object.keys(MENUS).map((name) => (
              <div key={name} className="relative" onMouseEnter={() => setMenuSub(name)}>
                <button
                  onClick={() => setMenuSub((s) => (s === name ? null : name))}
                  className={`flex h-8 w-full items-center justify-between rounded-md px-2.5 text-[14px] text-ui-body hover:bg-ui-hover ${menuSub === name ? 'bg-ui-hover' : ''}`}
                >
                  <span>{name}</span>
                  <ChevronRight size={14} className="text-ui-muted" />
                </button>
                {menuSub === name && (
                  <div className="absolute left-full top-0 z-50 ml-1 w-[230px] rounded-xl border border-ui-line bg-ui-menu p-1.5 shadow-2xl">
                    {MENUS[name].map((it, i) =>
                      it === 'sep' ? (
                        <div key={`s-${i}`} className="my-1 h-px bg-ui-line" />
                      ) : (
                        <button
                          key={it.label}
                          disabled={it.disabled}
                          title={it.disabled ? 'Not built yet' : undefined}
                          onClick={() => {
                            setMenuOpen(false)
                            setMenuSub(null)
                            it.run?.()
                          }}
                          className="flex h-8 w-full items-center justify-between rounded-md px-2.5 text-left text-[14px] text-ui-body hover:bg-ui-hover disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          <span>{it.label}</span>
                          {it.kbd && <span className="text-xs text-ui-muted">{it.kbd}</span>}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Search, New, nav */}
      <div className="shrink-0 px-[14px] pt-[15px]">
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-ui-muted" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="h-8 w-full rounded-lg bg-ui-search pl-[34px] pr-3 text-[15px] text-ui-text outline-none placeholder:text-ui-muted focus:ring-1 focus:ring-ui-line"
          />
        </label>
        <button
          onClick={onNew}
          className={`mt-[14px] flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[15px] text-ui-text hover:bg-ui-hover ${activeId === null ? 'bg-ui-active' : ''}`}
        >
          <Plus size={18} />
          New
        </button>
        {[
          ['Projects', Folder],
          ['Artifacts', Shapes],
          ['Customize', Briefcase],
        ].map(([label, Icon]) => (
          <button
            key={label}
            title={`${label} (not built yet)`}
            className="mt-px flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[15px] text-ui-body hover:bg-ui-hover"
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* Chat list */}
      <nav className="mt-4 min-h-0 flex-1 overflow-y-auto pb-3">
        {groups.length === 0 && (
          <div className="px-6 py-3 text-[14px] text-ui-muted">{search ? 'No chats match.' : 'No chats yet. Send a message to start one.'}</div>
        )}
        {groups.map((g) => (
          <div key={g.label} className="mb-2">
            <div className="flex h-8 items-center justify-between px-6 text-[14px] text-ui-muted">
              <span>{g.label}</span>
              {g.label === 'Older' ? <ArrowUpRight size={14} /> : g.label !== 'Pinned' && <SlidersHorizontal size={14} />}
            </div>
            {g.items.map((c) =>
              renamingId === c.id ? (
                <div key={c.id} className="mx-[11px] mb-1 h-[34px]">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishRename(true)
                      if (e.key === 'Escape') finishRename(false)
                    }}
                    onBlur={() => finishRename(true)}
                    className="h-full w-full rounded-lg bg-ui-search px-3 text-[15px] text-ui-text outline-none ring-1 ring-ui-line"
                  />
                </div>
              ) : (
                <div
                  key={c.id}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setCtx({ x: e.clientX, y: e.clientY, chat: c })
                  }}
                  className={`group relative mx-[11px] mb-1 flex h-[34px] items-center rounded-lg ${activeId === c.id ? 'bg-ui-active' : 'hover:bg-ui-hover'}`}
                >
                  <button
                    onClick={() => onSelect(c.id)}
                    title={c.title}
                    className={`min-w-0 flex-1 truncate pl-[13px] pr-9 text-left text-[15px] ${activeId === c.id ? 'text-ui-text' : 'text-ui-body'}`}
                  >
                    {c.pinned && <Pin size={12} className="mr-1.5 inline -translate-y-px text-ui-muted" />}
                    {c.title}
                  </button>
                  <button
                    title="More"
                    onClick={(e) => {
                      e.stopPropagation()
                      const r = e.currentTarget.getBoundingClientRect()
                      setCtx({ x: r.right - 233, y: r.bottom + 4, chat: c })
                    }}
                    className="absolute right-1.5 hidden h-6 w-6 items-center justify-center rounded text-ui-muted hover:bg-ui-line group-hover:flex"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              ),
            )}
          </div>
        ))}
      </nav>

      {ctx && ctxPos && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setCtx(null)} onContextMenu={(e) => { e.preventDefault(); setCtx(null) }} />
          <div className="fixed z-50 w-[233px] rounded-xl border border-ui-line bg-ui-menu p-1.5 text-[15px] shadow-2xl" style={ctxPos}>
            {ctxItems(ctx.chat).map((it, i) =>
              it === 'sep' ? (
                <div key={`c-${i}`} className="my-1.5 h-px bg-ui-line" />
              ) : (
                <button
                  key={it.id}
                  disabled={it.disabled}
                  title={it.disabled ? 'Not built yet' : undefined}
                  onClick={() => {
                    setCtx(null)
                    it.run?.()
                  }}
                  className={`flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left hover:bg-ui-hover disabled:opacity-40 disabled:hover:bg-transparent ${it.danger ? 'text-ui-danger' : 'text-ui-body'}`}
                >
                  <it.icon size={16} className="shrink-0" />
                  <span className="flex-1 truncate">{it.label}</span>
                  {it.key && <span className="text-xs text-ui-muted">{it.key}</span>}
                  {it.sub && <ChevronRight size={14} className="text-ui-muted" />}
                </button>
              ),
            )}
          </div>
        </>
      )}

      {/* Footer: account */}
      <div className="relative flex h-[52px] shrink-0 items-center justify-between px-[14px]">
        {userMenuOpen && (
          <UserMenu
            onClose={() => setUserMenuOpen(false)}
            onSettings={onOpenSettings}
            onApps={onOpenApps}
          />
        )}
        <button onClick={() => setUserMenuOpen((o) => !o)} className="flex min-w-0 items-center gap-2.5 rounded-lg px-1.5 py-1 hover:bg-ui-hover">
          <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-ui-avatar text-[12px] font-semibold text-ui-body">{USER_INITIALS}</span>
          <span className="text-[15px] text-ui-text">{USER_NAME}</span>
          <span className="text-[15px] text-ui-muted">· Free</span>
          <ChevronDown size={14} className="text-ui-muted" />
        </button>
        <button title="Keyboard shortcuts (not built yet)" className="flex h-7 w-7 items-center justify-center rounded-md text-ui-muted hover:bg-ui-hover">
          <Command size={16} />
        </button>
      </div>
    </aside>
  )
}
