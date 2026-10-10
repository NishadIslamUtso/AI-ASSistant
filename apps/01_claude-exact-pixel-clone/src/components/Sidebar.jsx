import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Plus, Folder, Boxes, Briefcase, MoreHorizontal, ChevronDown, PanelLeft, ArrowLeft, ArrowRight, Keyboard } from 'lucide-react'
import MenuBar from './MenuBar.jsx'
import UserMenu from './UserMenu.jsx'
import { USER, groupLabel } from '../lib/store.js'
import { useDismiss } from '../lib/hooks.js'

const SECTION_ORDER = ['Pinned', 'Today', 'Oct 8', 'Older']
const MENU_W = 224
const MENU_H = 232

export default function Sidebar({ chats, currentChatId, actions }) {
  const [search, setSearch] = useState('')
  const [menu, setMenu] = useState(null) // { x, y, chat }
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [userOpen, setUserOpen] = useState(false)
  const footerRef = useRef(null)
  const menuRef = useRef(null)
  useDismiss(footerRef, () => setUserOpen(false), userOpen)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return chats.filter((c) => !q || c.title.toLowerCase().includes(q))
  }, [chats, search])

  const sections = SECTION_ORDER.map((label) => ({
    label,
    items: filtered.filter((c) => groupLabel(c) === label),
  })).filter((s) => s.items.length > 0)

  // Position the row menu inside the viewport (from right-click point or the ⋮ button).
  const openMenuAt = (x, y, chat) => {
    const left = Math.min(x, window.innerWidth - MENU_W - 8)
    const top = y + MENU_H > window.innerHeight ? Math.max(8, y - MENU_H) : y
    setMenu({ x: Math.max(8, left), y: top, chat })
  }

  // Keyboard shortcuts shown in the row menu: P pin, R rename, D delete.
  useEffect(() => {
    if (!menu) return
    const onKey = (e) => {
      if (e.key === 'Escape') setMenu(null)
      if (e.target.tagName === 'INPUT') return
      const k = e.key.toLowerCase()
      if (!['p', 'r', 'd'].includes(k)) return
      // preventDefault stops the letter from also being typed into the rename field.
      e.preventDefault()
      if (k === 'p') { actions.togglePin(menu.chat.id); setMenu(null) }
      if (k === 'r') { startRename(menu.chat); setMenu(null) }
      if (k === 'd') { actions.deleteChat(menu.chat.id); setMenu(null) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu])

  useEffect(() => {
    if (!menu) return
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(null) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menu])

  const startRename = (chat) => { setRenamingId(chat.id); setRenameValue(chat.title) }
  const finishRename = (commit) => {
    if (commit && renamingId) actions.renameChat(renamingId, renameValue)
    setRenamingId(null)
  }

  const comingSoon = (label) => () => actions.toast(`${label}: not in the local build yet`)

  return (
    <aside className="w-[260px] c-side border-r c-border flex flex-col h-screen shrink-0">
      <div className="h-11 flex items-center px-2 gap-1 shrink-0">
        <MenuBar actions={actions} />
        <button type="button" aria-label="Toggle sidebar" onClick={actions.toggleSidebar} className="c-hover rounded-md p-1.5 c-muted-2">
          <PanelLeft size={16} />
        </button>
        <button type="button" aria-label="Back" disabled className="rounded-md p-1.5 c-muted opacity-50"><ArrowLeft size={16} /></button>
        <button type="button" aria-label="Forward" disabled className="rounded-md p-1.5 c-muted opacity-50"><ArrowRight size={16} /></button>
      </div>

      <div className="px-3 pt-1">
        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 c-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            aria-label="Search chats"
            className="w-full c-composer rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none placeholder:text-[var(--text-4)]"
            style={{ background: 'var(--bg-composer)' }}
          />
        </div>

        <button
          type="button"
          onClick={actions.newChat}
          className="w-full c-active rounded-lg py-2 px-3 text-sm flex items-center gap-2 mb-1 text-left"
        >
          <Plus size={16} /> New
        </button>
        <button type="button" onClick={comingSoon('Projects')} className="w-full c-hover rounded-lg py-2 px-3 text-sm flex items-center gap-2 c-muted-2 text-left">
          <Folder size={16} /> Projects
        </button>
        <button type="button" onClick={comingSoon('Artifacts')} className="w-full c-hover rounded-lg py-2 px-3 text-sm flex items-center gap-2 c-muted-2 text-left">
          <Boxes size={16} /> Artifacts
        </button>
        <button type="button" onClick={comingSoon('Customize')} className="w-full c-hover rounded-lg py-2 px-3 text-sm flex items-center gap-2 c-muted-2 text-left">
          <Briefcase size={16} /> Customize
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-2 mt-4">
        {sections.length === 0 && (
          <div className="px-2 py-3 text-xs c-muted">{search ? 'No chats match your search.' : 'No chats yet.'}</div>
        )}
        {sections.map((section) => (
          <div key={section.label} className="mb-3">
            <div className="flex items-center justify-between px-2 py-1 text-xs c-muted">
              <span>{section.label}</span>
              {section.label === 'Older' && <ChevronDown size={12} />}
            </div>
            <div className="space-y-0.5">
              {section.items.map((c) => {
                const active = currentChatId === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => renamingId !== c.id && actions.selectChat(c.id)}
                    onContextMenu={(e) => { e.preventDefault(); openMenuAt(e.clientX, e.clientY, c) }}
                    className={`group relative flex items-center rounded-lg px-2 py-1.5 text-sm cursor-pointer c-hover ${active ? 'c-active' : 'c-muted-2'}`}
                  >
                    {renamingId === c.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') finishRename(true)
                          if (e.key === 'Escape') finishRename(false)
                        }}
                        onBlur={() => finishRename(true)}
                        className="w-full bg-transparent outline-none border-b c-border"
                        aria-label="Rename chat"
                      />
                    ) : (
                      <>
                        {c.pinned && <span className="mr-1 text-[10px] c-muted" title="Pinned">●</span>}
                        <span className="truncate flex-1">{c.title}</span>
                        <button
                          type="button"
                          aria-label={`Options for ${c.title}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            const r = e.currentTarget.getBoundingClientRect()
                            openMenuAt(r.left, r.bottom + 4, c)
                          }}
                          className="ml-1 hidden group-hover:block rounded p-0.5 c-muted hover:c-muted-2"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div ref={footerRef} className="relative border-t c-border px-3 py-2.5 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={() => setUserOpen((o) => !o)}
          aria-expanded={userOpen}
          className="flex items-center gap-2 rounded-lg px-1.5 py-1 c-hover"
        >
          <span className="w-7 h-7 rounded-full bg-[#c4a484] text-black text-xs font-semibold flex items-center justify-center">{USER.initials}</span>
          <span className="text-sm">{USER.name} <span className="c-muted text-xs">· {USER.plan}</span></span>
          <ChevronDown size={12} className="c-muted" />
        </button>
        <Keyboard size={16} className="c-muted" aria-hidden="true" />
        {userOpen && (
          <UserMenu
            onClose={() => setUserOpen(false)}
            onSettings={() => { setUserOpen(false); actions.openSettings() }}
            onApps={() => { setUserOpen(false); actions.openApps() }}
            toast={actions.toast}
          />
        )}
      </div>

      {menu && (
        <div
          ref={menuRef}
          role="menu"
          style={{ left: menu.x, top: menu.y, width: MENU_W }}
          className="fixed z-[70] c-menu rounded-lg p-1 text-sm"
        >
          <MenuItem onClick={() => { actions.openInNewWindow(menu.chat.id); setMenu(null) }}>Open in new window</MenuItem>
          <MenuItem shortcut="P" onClick={() => { actions.togglePin(menu.chat.id); setMenu(null) }}>{menu.chat.pinned ? 'Unpin' : 'Pin'}</MenuItem>
          <MenuItem shortcut="R" onClick={() => { startRename(menu.chat); setMenu(null) }}>Rename</MenuItem>
          <MenuItem disabled chevron>Add to project</MenuItem>
          <MenuItem disabled chevron>Move to group</MenuItem>
          <div className="my-1 border-t c-border" />
          <MenuItem shortcut="D" danger onClick={() => { actions.deleteChat(menu.chat.id); setMenu(null) }}>Delete</MenuItem>
        </div>
      )}
    </aside>
  )
}

function MenuItem({ children, onClick, shortcut, danger, disabled, chevron }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      title={disabled ? 'Not in the local build yet' : undefined}
      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left ${disabled ? 'opacity-50 cursor-not-allowed' : 'c-hover'} ${danger ? 'text-[var(--danger)]' : ''}`}
    >
      <span>{children}</span>
      {shortcut && <span className="text-xs c-muted">{shortcut}</span>}
      {chevron && <span className="c-muted">›</span>}
    </button>
  )
}
