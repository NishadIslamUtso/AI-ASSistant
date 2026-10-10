import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight, ChevronDown, Command, ExternalLink, Folder, FolderInput, FolderPlus,
  Pencil, Pin, Search, SlidersHorizontal, Trash2, Plus, Shapes, Palette, Clock,
} from 'lucide-react'
import { MenuItem, MenuSep, MENU_SURFACE } from './menu.jsx'
import UserMenu from './UserMenu.jsx'
import { USER } from '../lib/config.js'

const MENU_W = 194

export default function Sidebar({ width, chats, setChats, currentChatId, onSelect, onNew, onOpenSettings, onOpenApps, toast }) {
  const [search, setSearch] = useState('')
  const [ctx, setCtx] = useState(null)          // { x, y, chat, sub }
  const [renaming, setRenaming] = useState(null) // { id, value }
  const [userOpen, setUserOpen] = useState(false)
  const ctxRef = useRef(null)

  const q = search.trim().toLowerCase()
  const visible = useMemo(() => chats.filter((c) => !q || c.title.toLowerCase().includes(q)), [chats, q])
  const pinned = visible.filter((c) => c.pinned)
  // Section order = order of first appearance (chats are newest-first), "Today" always first.
  const groupOrder = useMemo(() => {
    const seen = []
    for (const c of chats) if (!c.pinned && !seen.includes(c.group)) seen.push(c.group)
    return seen.sort((a, b) => (a === 'Today' ? -1 : b === 'Today' ? 1 : 0))
  }, [chats])
  const sections = groupOrder
    .map((g) => ({ label: g, items: visible.filter((c) => !c.pinned && c.group === g) }))
    .filter((s) => s.items.length > 0)

  // Context menu: close on outside click / Escape, and P/R/D shortcuts like the desktop menu.
  useEffect(() => {
    if (!ctx) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setCtx(null)
      else if (e.key === 'p' || e.key === 'P') { e.preventDefault(); pinChat(ctx.chat.id) }
      else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); startRename(ctx.chat) }
      else if (e.key === 'd' || e.key === 'D') { e.preventDefault(); deleteChat(ctx.chat.id) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx])

  const updateChat = (id, patch) => setChats((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch(c) } : c)))
  const pinChat = (id) => { updateChat(id, (c) => ({ pinned: !c.pinned })); setCtx(null) }
  const startRename = (chat) => { setRenaming({ id: chat.id, value: chat.title }); setCtx(null) }
  const commitRename = () => {
    if (renaming && renaming.value.trim()) updateChat(renaming.id, () => ({ title: renaming.value.trim() }))
    setRenaming(null)
  }
  const deleteChat = (id) => {
    setCtx(null)
    if (!window.confirm('Delete this chat? This removes it from this browser.')) return
    setChats((prev) => prev.filter((c) => c.id !== id))
    if (currentChatId === id) onNew()
  }
  const moveToGroup = (id, group) => { updateChat(id, () => ({ group, pinned: false })); setCtx(null) }

  const openCtx = (e, chat, anchor) => {
    e.preventDefault()
    e.stopPropagation()
    let x = e.clientX, y = e.clientY
    if (anchor) { const r = anchor.getBoundingClientRect(); x = r.left - MENU_W + 24; y = r.bottom + 4 }
    const maxX = window.innerWidth - MENU_W - 8
    const maxY = window.innerHeight - 330
    setCtx({ x: Math.max(8, Math.min(x, maxX)), y: Math.max(8, Math.min(y, maxY)), chat, sub: null })
  }

  const openInNewWindow = (chat) => {
    setCtx(null)
    window.open(`${location.pathname}?chat=${encodeURIComponent(chat.id)}`, '_blank', 'width=1100,height=800')
  }

  const row = (c) => {
    const active = currentChatId === c.id
    if (renaming && renaming.id === c.id) {
      return (
        <input
          key={c.id}
          autoFocus
          value={renaming.value}
          onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
          onBlur={commitRename}
          onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null) }}
          className="mx-1 mb-0.5 h-8 w-[calc(100%-8px)] rounded-lg border border-line bg-input px-2.5 text-[14px] text-fg outline-none"
        />
      )
    }
    return (
      <div
        key={c.id}
        onClick={() => onSelect(c.id)}
        onDoubleClick={() => startRename(c)}
        onContextMenu={(e) => openCtx(e, c)}
        className={`group relative flex h-8 cursor-pointer items-center rounded-lg pl-2.5 pr-2 text-[14px] ${
          active ? 'bg-active text-fg' : 'text-fg2 hover:bg-hover'
        }`}
      >
        <span className="truncate">{c.title}</span>
        <button
          type="button"
          aria-label="Chat options"
          title="Chat options"
          onClick={(e) => openCtx(e, c, e.currentTarget)}
          className="absolute right-1 top-1/2 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md bg-hover text-fg2 hover:bg-active group-hover:flex"
        >
          <span className="text-[16px] leading-none">⋯</span>
        </button>
      </div>
    )
  }

  return (
    <aside className="relative flex h-full shrink-0 flex-col border-r border-soft bg-side" style={{ width }}>
      <div className="px-3 pt-2">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            aria-label="Search chats"
            className="h-8 w-full rounded-lg border border-soft bg-input pl-8 pr-2.5 text-[14px] text-fg placeholder-fg3 outline-none focus:border-line"
          />
        </div>

        <button
          type="button"
          onClick={onNew}
          className={`mt-2 flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[14px] text-fg hover:bg-active ${currentChatId === null ? 'bg-active' : ''}`}
        >
          <Plus size={16} className="text-fg2" /> New
        </button>
        <SideItem icon={<Folder size={16} />} label="Projects" onClick={() => toast('Projects are not available yet')} />
        <SideItem icon={<Shapes size={16} />} label="Artifacts" onClick={() => toast('Artifacts panel is not available yet (roadmap P3)')} />
        <SideItem icon={<Palette size={16} />} label="Customize" onClick={() => onOpenSettings()} />
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pb-3 pl-3 pr-1">
        {pinned.length > 0 && (
          <Section label="Pinned">
            {pinned.map(row)}
          </Section>
        )}
        {sections.map((s) => (
          <Section
            key={s.label}
            label={s.label}
            right={s.label === 'Oct 8' || s.label === 'Today' ? <SlidersHorizontal size={14} className="text-fg3" /> : <ArrowUpRight size={15} className="text-fg3 opacity-0 group-hover/sec:opacity-100" />}
            chevron={s.label === 'Older'}
          >
            {s.items.map(row)}
          </Section>
        ))}
        {visible.length === 0 && <div className="px-2.5 py-3 text-[13px] text-fg3">No chats match “{search}”.</div>}
      </div>

      <div className="relative flex h-12 shrink-0 items-center justify-between px-3">
        <button
          type="button"
          onClick={() => setUserOpen((o) => !o)}
          className="flex h-9 min-w-0 items-center gap-2 rounded-lg px-1.5 hover:bg-hover"
          aria-haspopup="menu"
          aria-expanded={userOpen}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#292929] text-[11px] font-medium text-fg">{USER.initials}</span>
          <span className="truncate text-[14px] text-fg">{USER.name}</span>
          <span className="text-[13px] text-fg3">· {USER.plan}</span>
          <ChevronDown size={14} className="text-fg3" />
        </button>
        <button type="button" title="Keyboard shortcuts (Ctrl+,)" aria-label="Keyboard shortcuts" onClick={() => toast('Shortcuts: Ctrl+N new chat · Ctrl+, settings · Ctrl+B sidebar')} className="flex h-7 w-7 items-center justify-center rounded-md text-fg3 hover:bg-hover">
          <Command size={15} />
        </button>
        {userOpen && (
          <UserMenu
            onClose={() => setUserOpen(false)}
            onSettings={() => { setUserOpen(false); onOpenSettings() }}
            onApps={() => { setUserOpen(false); onOpenApps() }}
            toast={toast}
          />
        )}
      </div>

      {ctx && (
        <div className="fixed inset-0 z-50" onMouseDown={() => setCtx(null)} onContextMenu={(e) => { e.preventDefault(); setCtx(null) }}>
          <div
            role="menu"
            style={{ left: ctx.x, top: ctx.y, width: MENU_W }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`absolute ${MENU_SURFACE}`}
          >
            <MenuItem icon={<ExternalLink size={15} />} label="Open in new window" onClick={() => openInNewWindow(ctx.chat)} />
            <MenuItem icon={<Pin size={15} />} label={ctx.chat.pinned ? 'Unpin' : 'Pin'} shortcut="P" onClick={() => pinChat(ctx.chat.id)} />
            <MenuItem icon={<Pencil size={15} />} label="Rename" shortcut="R" onClick={() => startRename(ctx.chat)} />
            <MenuItem icon={<FolderPlus size={15} />} label="Add to project" submenu onMouseEnter={() => setCtx({ ...ctx, sub: 'project' })} onClick={() => setCtx({ ...ctx, sub: ctx.sub === 'project' ? null : 'project' })} />
            <MenuItem icon={<FolderInput size={15} />} label="Move to group" submenu onMouseEnter={() => setCtx({ ...ctx, sub: 'group' })} onClick={() => setCtx({ ...ctx, sub: ctx.sub === 'group' ? null : 'group' })} />
            <MenuSep />
            <MenuItem icon={<Trash2 size={15} />} label="Delete" shortcut="D" danger onClick={() => deleteChat(ctx.chat.id)} />

            {ctx.sub && (
              <div
                className={`absolute top-0 ${MENU_SURFACE} w-[210px]`}
                style={{ left: MENU_W + 6 }}
              >
                {ctx.sub === 'project' && <div className="px-2.5 py-2 text-[13px] text-fg3">No projects yet</div>}
                {ctx.sub === 'group' && (
                  <>
                    {[...new Set(chats.filter((c) => !c.pinned).map((c) => c.group).concat('Today'))]
                      .filter((g) => g !== ctx.chat.group)
                      .map((g) => <MenuItem key={g} icon={<Clock size={14} />} label={g} onClick={() => moveToGroup(ctx.chat.id, g)} />)}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

function SideItem({ icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="mt-0.5 flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[14px] text-fg hover:bg-hover">
      <span className="text-fg2">{icon}</span>
      {label}
    </button>
  )
}

function Section({ label, children, right, chevron }) {
  return (
    <div className="group/sec mb-2">
      <div className="flex h-8 items-center justify-between pl-2.5 pr-2 text-[13px] text-fg3">
        <span className="flex items-center gap-1">
          {label}
          {chevron && <ChevronDown size={13} className="opacity-0 group-hover/sec:opacity-100" />}
        </span>
        {right}
      </div>
      <div className="flex flex-col gap-px">{children}</div>
    </div>
  )
}
