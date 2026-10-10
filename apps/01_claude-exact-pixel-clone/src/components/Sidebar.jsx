import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search,
  Plus,
  Folder,
  Package,
  Palette,
  Pin,
  Pencil,
  Trash2,
  ExternalLink,
  FolderPlus,
  MoveRight,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import ContextMenu from './ContextMenu.jsx'

/**
 * Sidebar — 260px, #202020, from screenshot 191547.png
 *   [logo] [collapse]
 *   Search
 *   + New chat
 *   Projects / Artifacts (n) / Customize
 *   Oct 8  /  Older  (chat groups)
 *   [NU] Utso · Free  ⌄        -> UserMenu
 *
 * Right-click a chat -> the 191646.png context menu, and every entry works:
 * open in new window, pin, rename (inline), add to project, move to group, delete.
 */

const GROUP_ORDER = [
  'Pinned',
  'Today',
  'Yesterday',
  'Previous 7 days',
  'Previous 30 days',
  'Oct 8',
  'Older',
]

export default function Sidebar({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onTogglePin,
  onMoveGroup,
  onAddToProject,
  projects = [],
  artifactCount = 0,
  onOpenArtifacts,
  onOpenProjects,
  onOpenCustomize,
  onOpenUserMenu,
  userMenuOpen,
  collapsed,
  onToggleCollapse,
  user,
  searchFocusToken = 0,
}) {
  const [search, setSearch] = useState('')
  const [menu, setMenu] = useState(null) // {x,y,chat}
  const [renamingId, setRenamingId] = useState(null)
  const [renameDraft, setRenameDraft] = useState('')
  const renameRef = useRef(null)
  const searchRef = useRef(null)

  // File > Go > Search chats (and Ctrl+K style flows) focus this box
  useEffect(() => {
    if (searchFocusToken > 0) {
      searchRef.current?.focus()
      searchRef.current?.select()
    }
  }, [searchFocusToken])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q ? chats.filter((c) => (c.title || '').toLowerCase().includes(q)) : chats
    return list
  }, [chats, search])

  const groups = useMemo(() => {
    const g = new Map()
    for (const c of visible) {
      const key = c.pinned ? 'Pinned' : c.group || 'Older'
      if (!g.has(key)) g.set(key, [])
      g.get(key).push(c)
    }
    const keys = [...g.keys()].sort((a, b) => {
      const ia = GROUP_ORDER.indexOf(a)
      const ib = GROUP_ORDER.indexOf(b)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })
    // Newest first inside each group
    for (const k of keys) g.get(k).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    return keys.map((k) => ({ name: k, items: g.get(k) }))
  }, [visible])

  function openMenu(e, chat) {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, chat })
  }

  function startRename(chat) {
    setRenamingId(chat.id)
    setRenameDraft(chat.title)
    setTimeout(() => renameRef.current?.select(), 0)
  }

  function commitRename() {
    const t = renameDraft.trim()
    if (t) onRenameChat?.(renamingId, t)
    setRenamingId(null)
  }

  const menuItems = (chat) => [
    {
      icon: <ExternalLink size={14} />,
      label: 'Open in new window',
      onSelect: () => window.open(window.location.href, '_blank', 'noopener'),
    },
    {
      icon: <Pin size={14} />,
      label: chat.pinned ? 'Unpin chat' : 'Pin chat',
      onSelect: () => onTogglePin?.(chat.id),
    },
    { icon: <Pencil size={14} />, label: 'Rename', onSelect: () => startRename(chat) },
    {
      icon: <FolderPlus size={14} />,
      label: 'Add to project',
      hint: '›',
      onSelect: () => {
        const name = window.prompt('Add to project (name):', projects[0]?.name || 'My project')
        if (name) onAddToProject?.(chat.id, name.trim())
      },
    },
    {
      icon: <MoveRight size={14} />,
      label: 'Move to group',
      hint: '›',
      onSelect: () => {
        const g = window.prompt(
          'Move to group:',
          chat.group || 'Older',
        )
        if (g) onMoveGroup?.(chat.id, g.trim())
      },
    },
    { separator: true },
    {
      icon: <Trash2 size={14} />,
      label: 'Delete',
      danger: true,
      onSelect: () => {
        if (window.confirm(`Delete "${chat.title}"? This cannot be undone.`)) onDeleteChat?.(chat.id)
      },
    },
  ]

  if (collapsed) {
    return (
      <div className="w-[52px] bg-[var(--bg-side)] border-r border-[var(--line)] flex flex-col h-full shrink-0 items-center py-2 gap-2">
        <button
          onClick={onToggleCollapse}
          title="Show sidebar"
          className="w-8 h-8 rounded-lg hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--ink2)]"
        >
          <PanelLeftOpen size={16} />
        </button>
        <button
          onClick={onNewChat}
          title="New chat"
          className="w-8 h-8 rounded-lg hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--ink2)]"
        >
          <Plus size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="w-[260px] bg-[var(--bg-side)] border-r border-[var(--line)] flex flex-col h-full shrink-0">
      {/* ── top row: brand + collapse ───────────────────────── */}
      <div className="h-11 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent)] text-[17px] leading-none select-none">✳</span>
          <span className="text-[13px] text-[var(--ink2)] select-none">AI ASSistant</span>
        </div>
        <button
          onClick={onToggleCollapse}
          title="Hide sidebar"
          className="w-7 h-7 rounded-md hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--ink2)]"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* ── search ──────────────────────────────────────────── */}
      <div className="px-3 pb-2 shrink-0">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink3)] pointer-events-none"
          />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full bg-[var(--bg-hover)] border border-transparent focus:border-[var(--border-strong)] rounded-lg pl-8 pr-2 py-[7px] text-[13px] text-[var(--ink)] placeholder-[var(--ink3)] outline-none"
          />
        </div>

        <button
          onClick={onNewChat}
          className="mt-2 w-full flex items-center gap-2 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] rounded-lg py-[7px] px-2.5 text-[13px] text-[var(--ink)] transition-colors"
        >
          <Plus size={15} className="text-[var(--ink2)]" />
          New chat
        </button>
      </div>

      {/* ── Projects / Artifacts / Customize ────────────────── */}
      <div className="px-2 pb-1 shrink-0">
        <Row icon={<Folder size={15} />} label="Projects" onClick={onOpenProjects} />
        <Row
          icon={<Package size={15} />}
          label="Artifacts"
          count={artifactCount}
          onClick={onOpenArtifacts}
        />
        <Row icon={<Palette size={15} />} label="Customize" onClick={onOpenCustomize} />
      </div>

      {/* ── chat groups ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {groups.length === 0 ? (
          <div className="px-2 py-6 text-[12px] text-[var(--ink3)] text-center">
            {search ? 'No chats match your search.' : 'No chats yet.'}
          </div>
        ) : null}

        {groups.map((g) => (
          <div key={g.name} className="mb-1">
            <div className="flex items-center justify-between px-2 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--ink3)]">
              <span>{g.name}</span>
              <span className="opacity-0 group-hover:opacity-100">
                {g.name === 'Pinned' ? <Pin size={11} /> : null}
              </span>
            </div>
            <div className="space-y-[2px]">
              {g.items.map((c) => {
                const active = c.id === currentChatId
                return renamingId === c.id ? (
                  <input
                    key={c.id}
                    ref={renameRef}
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename()
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    className="w-full px-2 py-[6px] text-[13px] rounded-lg bg-[var(--bg-active)] border border-[var(--border-strong)] text-[var(--ink)] outline-none"
                  />
                ) : (
                  <div
                    key={c.id}
                    onClick={() => onSelectChat?.(c.id)}
                    onContextMenu={(e) => openMenu(e, c)}
                    title={c.title}
                    className={`group flex items-center gap-1.5 px-2 py-[6px] rounded-lg text-[13px] cursor-pointer truncate transition-colors ${
                      active
                        ? 'bg-[var(--bg-active)] text-[var(--ink)]'
                        : 'text-[var(--ink2)] hover:bg-[var(--bg-hover)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {c.pinned ? <Pin size={11} className="shrink-0 opacity-60" /> : null}
                    <span className="truncate flex-1">{c.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openMenu(e, c)
                      }}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded hover:bg-[var(--border-strong)] flex items-center justify-center text-[var(--ink2)] shrink-0"
                      title="More"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── account row -> UserMenu (191608.png) ────────────── */}
      <div className="border-t border-[var(--line)] p-2 shrink-0">
        <button
          onClick={onOpenUserMenu}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-left ${
            userMenuOpen ? 'bg-[var(--bg-hover)]' : ''
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-[#c4a484] text-black text-[11px] font-bold flex items-center justify-center shrink-0">
            {user.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] text-[var(--ink)] truncate leading-tight">{user.name}</div>
            <div className="text-[11px] text-[var(--ink3)] leading-tight">{user.plan}</div>
          </div>
          <ChevronRight
            size={13}
            className={`text-[var(--ink3)] transition-transform ${userMenuOpen ? 'rotate-90' : ''}`}
          />
        </button>
      </div>

      {menu ? (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems(menu.chat)} onClose={() => setMenu(null)} />
      ) : null}
    </div>
  )
}

function Row({ icon, label, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2 py-[6px] rounded-lg text-[13px] text-[var(--ink2)] hover:bg-[var(--bg-hover)] hover:text-[var(--ink)] text-left"
    >
      <span className="shrink-0 opacity-80">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {typeof count === 'number' && count > 0 ? (
        <span className="text-[11px] text-[var(--ink3)]">({count})</span>
      ) : null}
    </button>
  )
}
