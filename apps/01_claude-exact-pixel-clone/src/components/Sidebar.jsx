import { useEffect, useState } from 'react'
import {
  ArrowLeft, ArrowRight, ChevronDown, Code2, Folder, Grid2X2, Menu,
  PanelLeft, Plus, Search, SlidersHorizontal, Sparkles,
} from 'lucide-react'
import UserMenu from './UserMenu.jsx'

function ChatContextMenu({ menu, chats, setChats, onClose }) {
  const chat = chats.find(item => String(item.id) === String(menu.chatId))
  if (!chat) return null

  function updateChat(patch) {
    setChats(current => current.map(item => String(item.id) === String(chat.id) ? { ...item, ...patch } : item))
    onClose()
  }

  function rename() {
    const nextTitle = window.prompt('Rename chat', chat.title)
    if (nextTitle?.trim()) updateChat({ title: nextTitle.trim() })
    else onClose()
  }

  function remove() {
    if (!window.confirm(`Delete “${chat.title}” from this device?`)) { onClose(); return }
    setChats(current => current.filter(item => String(item.id) !== String(chat.id)))
    onClose()
  }

  function openWindow() {
    const url = new URL(window.location.href)
    url.hash = `chat=${encodeURIComponent(chat.id)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    onClose()
  }

  const items = [
    { label: 'Open in new window', icon: '↗', run: openWindow },
    { label: chat.pinned ? 'Unpin chat' : 'Pin chat', icon: '⌖', run: () => updateChat({ pinned: !chat.pinned }) },
    { label: 'Rename', icon: '✎', run: rename },
    { label: 'Add to project', icon: '▱', run: () => { const project = window.prompt('Project name (saved locally)', chat.project || ''); if (project?.trim()) updateChat({ project: project.trim() }); else onClose() } },
    { label: 'Move to group', icon: '⇢', run: () => updateChat({ date: chat.date === 'Older' ? 'Oct 8' : 'Older' }) },
    { label: 'Delete', icon: '⌫', run: remove, danger: true, separator: true },
  ]

  return <div className="fixed inset-0 z-[55]" onMouseDown={onClose}>
    <div role="menu" aria-label={`Actions for ${chat.title}`} style={{ left: Math.min(menu.x, window.innerWidth - 225), top: Math.min(menu.y, window.innerHeight - 250) }} className="absolute w-[212px] rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-1 shadow-[0_8px_28px_rgba(0,0,0,.5)]" onMouseDown={event => event.stopPropagation()}>
      {items.map(item => <button key={item.label} type="button" role="menuitem" onClick={item.run} className={`flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] hover:bg-[var(--surface-hover)] ${item.separator ? 'mt-1 border-t border-[var(--border)] pt-1' : ''} ${item.danger ? 'text-red-300 hover:text-red-200' : 'text-[var(--text-primary)]'}`}><span className="w-4 text-center text-[var(--text-muted)]">{item.icon}</span>{item.label}</button>)}
    </div>
  </div>
}

export default function Sidebar({ chats, currentChat, setCurrentChat, setChats, onCreateChat, onOpenSettings, onOpenApps, onMenuAction, artifactCount, onShowArtifacts, onToggleVault }) {
  const [search, setSearch] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const filtered = chats.filter(chat => (chat.title || '').toLowerCase().includes(search.toLowerCase()))
  const pinned = filtered.filter(chat => chat.pinned)
  const today = filtered.filter(chat => chat.date === 'Today' && !chat.pinned)
  const oct8 = filtered.filter(chat => chat.date === 'Oct 8' && !chat.pinned)
  const older = filtered.filter(chat => !['Today', 'Oct 8'].includes(chat.date) && !chat.pinned)

  useEffect(() => {
    const close = event => { if (event.key === 'Escape') { setUserMenuOpen(false); setContextMenu(null) } }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  function renderChat(chat) {
    return <button key={chat.id} type="button" onClick={() => setCurrentChat(chat.id)} onContextMenu={event => { event.preventDefault(); setContextMenu({ x: event.clientX, y: event.clientY, chatId: chat.id }) }} className={`group flex w-full items-center gap-2 rounded-md px-2 py-[7px] text-left text-[13px] transition-colors hover:bg-[var(--surface-hover)] ${String(currentChat) === String(chat.id) ? 'bg-[var(--surface-selected)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}><span className="min-w-0 flex-1 truncate">{chat.title || 'New chat'}</span>{chat.pinned && <span className="text-[10px] text-[var(--text-muted)]">Pinned</span>}</button>
  }

  function renderGroup(label, items, extra = null) {
    if (!items.length) return null
    return <section className="mb-3" key={label}><div className="flex items-center justify-between px-2 pb-1 pt-3 text-xs text-[var(--text-muted)]"><span>{label}</span>{extra}</div><div className="space-y-0.5">{items.map(renderChat)}</div></section>
  }

  return (
    <aside className="relative z-10 flex h-screen w-[260px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-sidebar)]" aria-label="Chat sidebar">
      <div className="flex h-11 shrink-0 items-center justify-between px-3">
        <div className="flex items-center gap-3 text-[var(--text-muted)]"><button type="button" title="Sidebar menu" className="rounded-md p-1 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"><Menu size={17}/></button><button type="button" title="Collapse sidebar" className="rounded-md p-1 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"><PanelLeft size={16}/></button><button type="button" title="Back" onClick={() => window.history.back()} className="rounded-md p-1 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"><ArrowLeft size={16}/></button><button type="button" title="Forward" onClick={() => window.history.forward()} className="rounded-md p-1 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"><ArrowRight size={16}/></button></div>
        <button type="button" title="Toggle vault panel" onClick={onToggleVault} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"><Code2 size={16}/></button>
      </div>
      <div className="px-2.5 pb-2 pt-1">
        <label className="flex h-8 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5"><Search size={14} className="shrink-0 text-[var(--text-muted)]"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search" aria-label="Search chats" className="min-w-0 flex-1 bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"/>{search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')} className="text-[var(--text-muted)]">×</button>}</label>
        <button type="button" onClick={onCreateChat} className="mt-2 flex h-8 w-full items-center gap-2 rounded-lg bg-[var(--surface-hover)] px-3 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-selected)]"><Plus size={15}/>New</button>
        <div className="mt-2 space-y-0.5">
          <button type="button" onClick={() => onMenuAction?.('projects')} className="flex h-7 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"><Folder size={15}/>Projects</button>
          <button type="button" onClick={onShowArtifacts} className="flex h-7 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"><Grid2X2 size={15}/>Artifacts{artifactCount > 0 && <span className="text-[11px] text-[var(--text-muted)]">({artifactCount})</span>}</button>
          <button type="button" onClick={onOpenApps} className="flex h-7 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"><Sparkles size={15}/>Customize</button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
        {renderGroup('Pinned', pinned)}
        {renderGroup('Today', today)}
        {renderGroup('Oct 8', oct8, <SlidersHorizontal size={13}/>)}
        {renderGroup('Older', older, <ChevronDown size={13}/>)}
        {filtered.length === 0 && <p className="px-2 py-4 text-xs leading-5 text-[var(--text-muted)]">No chats match “{search}”.</p>}
      </div>
      <div className="relative flex h-[50px] shrink-0 items-center justify-between border-t border-[var(--border)] px-2.5">
        {userMenuOpen && <UserMenu onSettings={onOpenSettings} onApps={onOpenApps} onAction={onMenuAction} onClose={() => setUserMenuOpen(false)}/>}
        <button type="button" aria-haspopup="menu" aria-expanded={userMenuOpen} onClick={() => setUserMenuOpen(value => !value)} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1.5 text-left hover:bg-[var(--surface-hover)]"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#c4a484] text-[10px] font-semibold text-neutral-900">NU</span><span className="min-w-0 truncate text-[13px]">Utso <span className="text-[var(--text-muted)]">· Free</span></span><ChevronDown size={13} className="shrink-0 text-[var(--text-muted)]"/></button>
        <button type="button" aria-label="Open apps and extensions" onClick={onOpenApps} className="ml-1 rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"><Grid2X2 size={16}/></button>
      </div>
      {contextMenu && <ChatContextMenu menu={contextMenu} chats={chats} setChats={setChats} onClose={() => setContextMenu(null)}/>}
    </aside>
  )
}
