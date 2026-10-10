import { useState, useRef, useEffect } from 'react'
import {
  Menu, PanelLeft, ArrowLeft, ArrowRight, Search, Code2, Plus, Folder, Package,
  Briefcase, SlidersHorizontal, MoreVertical, ChevronRight, ChevronDown,
  ExternalLink, Pin, Pencil, FolderPlus, FolderInput, Trash2,
} from 'lucide-react'
import UserMenu from './UserMenu.jsx'

// Top-level so the inline rename input keeps focus across re-renders.
function ChatRow({ c, currentChat, setCurrentChat, editingId, editTitle, setEditTitle, openMenu, commitRename, cancelRename }) {
  return (
    <div
      onClick={() => setCurrentChat(c.id)}
      onContextMenu={(e) => openMenu(e, c)}
      className={`group relative px-2 py-[7px] rounded-lg text-[15px] truncate cursor-pointer ${
        currentChat === c.id ? 'bg-[var(--bg-hover)] text-[var(--tx)]' : 'text-[var(--tx)] hover:bg-[var(--bg-hover)]'
      }`}
    >
      {editingId === c.id ? (
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') cancelRename() }}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-[var(--bg-neu)] border border-[var(--bd2)] rounded px-1 py-0.5 text-[14px] outline-none text-[var(--tx)]"
        />
      ) : (
        <>
          {c.title}
          <button
            onClick={(e) => { e.stopPropagation(); openMenu(e, c) }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center justify-center w-6 h-6 rounded-md hover:bg-[var(--bg-neu)] text-[var(--tx2)]"
            title="Chat options"
          >
            <MoreVertical size={14} />
          </button>
        </>
      )}
    </div>
  )
}

function MenuItem({ icon, label, kbd, chevron, danger, checked, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-[7px] text-left hover:bg-[var(--bg-hover)] ${danger ? 'text-[#f0554d]' : 'text-[var(--tx)]'}`}
    >
      {icon && <span className={danger ? 'text-[#f0554d]' : 'text-[var(--tx2)]'}>{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
      {checked && <span className="text-[var(--tx2)]">✓</span>}
      {kbd && <span className="text-[12px] text-[var(--tx3)]">{kbd}</span>}
      {chevron && <ChevronRight size={14} className="text-[var(--tx2)]" />}
    </button>
  )
}

export default function Sidebar({ chats, setChats, currentChat, setCurrentChat, artifactCount, onOpenSettings, onOpenApps, onOpenVault }) {
  const [search, setSearch] = useState('')
  const [menu, setMenu] = useState(null)          // {x,y,chat,submenu:null|'project'|'group'}
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [userMenu, setUserMenu] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const close = () => setMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  const filtered = chats.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
  const pinned = filtered.filter(c => c.pinned)
  const groups = []
  for (const c of filtered) {
    if (c.pinned) continue
    const g = groups.find(x => x.date === c.date)
    if (g) g.items.push(c)
    else groups.push({ date: c.date, items: [c] })
  }

  function openMenu(e, chat) {
    e.preventDefault()
    e.stopPropagation()
    const x = Math.min(e.clientX, window.innerWidth - 250)
    const y = Math.min(e.clientY, window.innerHeight - 310)
    setMenu({ x, y, chat, submenu: null })
  }

  function patchChat(id, patch) {
    setChats(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }

  function doDelete(chat) {
    setChats(prev => prev.filter(c => c.id !== chat.id))
    if (currentChat === chat.id) setCurrentChat(null)
    setMenu(null)
  }

  function startRename(chat) {
    setEditingId(chat.id)
    setEditTitle(chat.title)
    setMenu(null)
  }

  function commitRename() {
    if (editingId && editTitle && editTitle.trim()) patchChat(editingId, { title: editTitle.trim() })
    setEditingId(null)
  }

  const groupOptions = ['Oct 8', 'Older', ...new Set(chats.map(c => c.date).filter(d => d !== 'Oct 8' && d !== 'Older'))]
  const projectOptions = ['No project', 'Study', 'Personal']

  const rowProps = { currentChat, setCurrentChat, editingId, editTitle, setEditTitle, openMenu, commitRename, cancelRename: () => setEditingId(null) }

  return (
    <div className="w-[260px] shrink-0 h-screen flex flex-col bg-[var(--bg-side)] border-r border-[var(--bd)]">
      {/* top window-control strip (left half, matches screenshots) */}
      <div className="h-12 shrink-0 flex items-center gap-1 px-3">
        <button className="p-1.5 rounded-md text-[var(--tx2)] hover:text-[var(--tx)] hover:bg-[var(--bg-hover)]" title="Menu"><Menu size={17} /></button>
        <button onClick={onOpenVault} className="p-1.5 rounded-md text-[var(--tx2)] hover:text-[var(--tx)] hover:bg-[var(--bg-hover)]" title="Toggle vault panel"><PanelLeft size={17} /></button>
        <button className="p-1.5 rounded-md text-[var(--tx3)] hover:text-[var(--tx)]" title="Back"><ArrowLeft size={17} /></button>
        <button className="p-1.5 rounded-md text-[var(--tx3)] hover:text-[var(--tx)]" title="Forward"><ArrowRight size={17} /></button>
        <div className="flex-1" />
        <button onClick={() => searchRef.current?.focus()} className="p-1.5 rounded-md bg-[var(--bg-hover)] text-[var(--tx)]" title="Search chats"><Search size={16} /></button>
        <button onClick={onOpenVault} className="p-1.5 rounded-md bg-[var(--bg-hover)] text-[var(--tx2)]" title="Code"><Code2 size={16} /></button>
      </div>

      <div className="px-3 pb-2">
        <div className="relative mb-2">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tx3)]" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full h-9 bg-[var(--bg-hover)] border border-[var(--bd)] rounded-lg pl-9 pr-3 text-[14px] text-[var(--tx)] placeholder-[var(--tx3)] outline-none focus:border-[var(--bd2)]"
          />
        </div>
        <button
          onClick={() => { const id = 'c' + Date.now(); setChats(p => [{ id, title: 'New chat', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }, ...p]); setCurrentChat(id) }}
          className="w-full h-9 mb-3 rounded-lg bg-[var(--bg-neu)] hover:bg-[var(--bg-sel)] text-[15px] text-[var(--tx)] flex items-center gap-2 px-3"
        >
          <Plus size={16} /> New
        </button>
        <div className="space-y-0.5 text-[15px] text-[var(--tx)]">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer"><Folder size={16} className="text-[var(--tx2)]" /> Projects</div>
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer">
            <Package size={16} className="text-[var(--tx2)]" /> Artifacts
            {artifactCount > 0 && <span className="ml-auto text-[12px] text-[var(--tx2)]">({artifactCount})</span>}
          </div>
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer"><Briefcase size={16} className="text-[var(--tx2)]" /> Customize</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-1">
        {pinned.length > 0 && (
          <>
            <div className="px-2 pt-3 pb-1.5 text-[13px] text-[var(--tx2)]">Pinned</div>
            <div className="space-y-0.5 mb-2">{pinned.map(c => <ChatRow key={c.id} c={c} {...rowProps} />)}</div>
          </>
        )}
        {groups.map(g => (
          <div key={g.date}>
            <div className="flex items-center justify-between px-2 pt-4 pb-1.5 text-[13px] text-[var(--tx2)]">
              <span>{g.date}</span>
              <SlidersHorizontal size={13} className="text-[var(--tx3)]" />
            </div>
            <div className="space-y-0.5">{g.items.map(c => <ChatRow key={c.id} c={c} {...rowProps} />)}</div>
          </div>
        ))}
      </div>

      <div className="relative h-12 shrink-0 border-t border-[var(--bd)] px-2 flex items-center justify-between">
        <button onClick={() => setUserMenu(v => !v)} className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-[var(--bg-hover)]">
          <div className="w-6 h-6 rounded-full bg-[#4a4a4a] text-white flex items-center justify-center text-[11px] font-semibold">NU</div>
          <span className="text-[14px] text-[var(--tx)]">Utso</span>
          <span className="text-[13px] text-[var(--tx2)]">· Free</span>
          <ChevronDown size={14} className="text-[var(--tx2)]" />
        </button>
        <button onClick={onOpenSettings} className="p-1.5 rounded-md text-[var(--tx2)] hover:text-[var(--tx)] hover:bg-[var(--bg-hover)]" title="Settings"><SlidersHorizontal size={16} /></button>
        {userMenu && (
          <UserMenu
            onClose={() => setUserMenu(false)}
            onOpenSettings={() => { setUserMenu(false); onOpenSettings() }}
            onOpenApps={() => { setUserMenu(false); onOpenApps && onOpenApps() }}
          />
        )}
      </div>

      {menu && (
        <div className="fixed inset-0 z-50" onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null) }}>
          <div
            style={{ left: menu.x, top: menu.y }}
            className="absolute w-60 rounded-xl bg-[var(--bg-elup)] border border-[var(--bd2)] shadow-2xl py-1.5 text-[14px] text-[var(--tx)]"
            onClick={(e) => e.stopPropagation()}
          >
            {!menu.submenu && (
              <>
                <MenuItem icon={<ExternalLink size={15} />} label="Open in new window" onClick={() => { window.open(window.location.pathname + '#chat=' + menu.chat.id, '_blank'); setMenu(null) }} />
                <div className="my-1 border-t border-[var(--bd2)]" />
                <MenuItem icon={<Pin size={15} />} label={menu.chat.pinned ? 'Unpin' : 'Pin'} kbd="P" onClick={() => { patchChat(menu.chat.id, { pinned: !menu.chat.pinned }); setMenu(null) }} />
                <MenuItem icon={<Pencil size={15} />} label="Rename" kbd="R" onClick={() => startRename(menu.chat)} />
                <MenuItem icon={<FolderPlus size={15} />} label="Add to project" chevron onClick={() => setMenu(m => ({ ...m, submenu: 'project' }))} />
                <MenuItem icon={<FolderInput size={15} />} label="Move to group" chevron onClick={() => setMenu(m => ({ ...m, submenu: 'group' }))} />
                <div className="my-1 border-t border-[var(--bd2)]" />
                <MenuItem icon={<Trash2 size={15} />} label="Delete" kbd="D" danger onClick={() => doDelete(menu.chat)} />
              </>
            )}
            {menu.submenu === 'project' && (
              <>
                <div className="px-3 py-1.5 text-[12px] text-[var(--tx2)]">Add to project</div>
                {projectOptions.map(p => (
                  <MenuItem key={p} label={p} checked={menu.chat.project === p || (p === 'No project' && !menu.chat.project)} onClick={() => { patchChat(menu.chat.id, { project: p === 'No project' ? undefined : p }); setMenu(null) }} />
                ))}
              </>
            )}
            {menu.submenu === 'group' && (
              <>
                <div className="px-3 py-1.5 text-[12px] text-[var(--tx2)]">Move to group</div>
                {groupOptions.map(g => (
                  <MenuItem key={g} label={g} checked={menu.chat.date === g} onClick={() => { patchChat(menu.chat.id, { date: g }); setMenu(null) }} />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
