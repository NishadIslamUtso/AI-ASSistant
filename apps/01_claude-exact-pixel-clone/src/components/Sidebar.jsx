import { useRef, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { PanelLeft, ArrowLeft, ArrowRight, MessagesSquare, Code2, Search, Plus, FolderClosed, Shapes, Briefcase, ChevronDown, SlidersHorizontal, ArrowUpRight, Blocks, MoreVertical, Pin, Pencil, Trash2, PanelsTopLeft, ChevronRight } from 'lucide-react'
import UserMenu from './UserMenu.jsx'
import useDismiss from '../hooks/useDismiss.js'
import { initials } from '../lib/profile.js'

function ChatMenu({ menu, close, action, busy }) {
  const ref = useRef(null)
  useDismiss(ref, close)
  const left = Math.min(menu.x, window.innerWidth - 218)
  const top = Math.min(menu.y, window.innerHeight - 210)
  const items = [
    [PanelsTopLeft, 'Open in new window', 'open'], [Pin, menu.chat.pinned ? 'Unpin' : 'Pin', 'pin', 'P'],
    [Pencil, 'Rename', 'rename', 'R'], [FolderClosed, 'Add to project', 'project', '›'],
    [FolderClosed, 'Move to group', 'group', '›'], [Trash2, 'Delete', 'delete', 'D'],
  ]
  return <div className="popup chat-menu" ref={ref} role="menu" aria-label="Chat actions" style={{ left: Math.max(8, left), top: Math.max(8, top) }}>
    {items.map(([Icon, label, key, shortcut], index) => <div key={key}>
      {(index === 1 || index === 5) && <div className="menu-separator" />}
      <button role="menuitem" aria-label={label} autoFocus={index === 0} disabled={key === 'delete' && busy} className={key === 'delete' ? 'danger' : ''} onClick={() => { close(); action(key, menu.chat) }}><Icon size={15} /><span>{label}</span>{shortcut && <kbd>{shortcut}</kbd>}</button>
    </div>)}
  </div>
}
export default function Sidebar({ chats, currentChat, navigate, view, onView, onNew, onAction, onSettings, onApps, onVault, collapsed, onCollapse, busyChatId, notify, artifactCount, onToday, profile }) {
  const [search, setSearch] = useState('')
  const [menu, setMenu] = useState(null)
  const [userMenu, setUserMenu] = useState(false)
  const [olderOpen, setOlderOpen] = useState(true)
  const accountRef = useRef(null)
  const filtered = chats.filter(chat => chat.title.toLowerCase().includes(search.toLowerCase()))
  const groups = [...new Set(filtered.filter(chat => !chat.pinned).map(chat => chat.date))]
  if (filtered.some(chat => chat.pinned)) groups.unshift('Pinned')
  const openMenu = (event, chat) => { event.preventDefault(); event.stopPropagation(); setUserMenu(false); setMenu({ x: event.clientX || event.currentTarget.getBoundingClientRect().right - 200, y: event.clientY || event.currentTarget.getBoundingClientRect().bottom, chat }) }
  if (collapsed) return <button className="sidebar-reopen icon-button" onClick={onCollapse} aria-label="Show sidebar"><PanelLeft size={18} /></button>
  return <aside className="sidebar" aria-label="Chat sidebar">
    <div className="sidebar-toolbar">
      {/* Native File/Edit/View/Go/Help remains an Electron-only task. */}
      <button className="icon-button" aria-label="Hide sidebar" onClick={onCollapse}><PanelLeft size={16} /></button>
      <button className="icon-button" aria-label="Go back" onClick={() => window.history.back()}><ArrowLeft size={17} /></button>
      <button className="icon-button" aria-label="Go forward" onClick={() => window.history.forward()}><ArrowRight size={17} /></button>
      <div className="toolbar-modes"><button className={view === 'chat' ? 'selected' : ''} aria-label="Chat view" onClick={() => onView('chat')}><MessagesSquare size={17} /></button><button className={view === 'artifacts' ? 'selected' : ''} aria-label="Artifacts view" onClick={() => onView('artifacts')}><Code2 size={16} /></button></div>
    </div>
    <div className="sidebar-search"><Search size={15} /><input aria-label="Search chats" placeholder="Search" value={search} onChange={event => setSearch(event.target.value)} /></div>
    <button className="new-chat" onClick={onNew}><Plus size={16} />New</button>
    <div className="sidebar-scroll">
      <nav className="sidebar-nav" aria-label="Library">
        <button onClick={() => onView('projects')} className={view === 'projects' ? 'active' : ''}><FolderClosed size={15} />Projects</button>
        <button onClick={() => onView('artifacts')} className={view === 'artifacts' ? 'active' : ''}><Shapes size={15} />Artifacts{artifactCount > 0 && <span className="nav-count">{artifactCount}</span>}</button>
        <button onClick={onToday} title="Today view (Alt+T)"><CalendarDays size={15} />Today</button>
        <button onClick={onSettings}><Briefcase size={15} />Customize</button>
      </nav>
      <div className="chat-groups">
        {groups.map(group => {
          const items = filtered.filter(chat => group === 'Pinned' ? chat.pinned : !chat.pinned && chat.date === group)
          return <section key={group} aria-label={`${group} chats`} className="chat-group">
            <div className="group-heading">
              {group === 'Older' ? <button onClick={() => setOlderOpen(!olderOpen)} aria-expanded={olderOpen}>Older<ChevronDown size={12} className={olderOpen ? '' : 'rotate-left'} /></button> : <span>{group}</span>}
              {group === 'Oct 8' ? <SlidersHorizontal size={13} /> : group === 'Older' ? <ArrowUpRight size={14} /> : null}
            </div>
            {(group !== 'Older' || olderOpen || search) && items.map(chat => <div key={chat.id} className={`chat-item ${currentChat === chat.id && view === 'chat' ? 'active' : ''}`} onContextMenu={event => openMenu(event, chat)}>
              <button className="chat-title" onClick={() => { navigate(chat.id); onView('chat') }} title={chat.title}>{chat.pinned && <Pin size={11} />}{chat.title}</button>
              <button className="chat-more icon-button" aria-label={`Actions for ${chat.title}`} onClick={event => openMenu(event, chat)}><MoreVertical size={15} /></button>
            </div>)}
          </section>
        })}
        {!filtered.length && <p className="empty-search">No matching chats</p>}
      </div>
    </div>
    <footer className="sidebar-footer">
      <button ref={accountRef} className="account-button" aria-label={`${profile.name} account menu`} aria-expanded={userMenu} onPointerDown={event => event.stopPropagation()} onClick={() => { setMenu(null); setUserMenu(!userMenu) }}>
        {profile.avatar
          ? <img className="avatar avatar-image" src={profile.avatar} alt="" width="18" height="18" />
          : <span className="avatar">{initials(profile.name)}</span>}
        <span>{profile.name} <small>· Local</small></span><ChevronDown size={12} />
      </button>
      <button className="icon-button" aria-label="Open AI-Brain vault" title="AI-Brain vault" onClick={onVault}><Blocks size={16} /></button>
    </footer>
    {userMenu && <UserMenu onClose={() => { setUserMenu(false); accountRef.current?.focus() }} onSettings={onSettings} onApps={onApps} notify={notify} profile={profile} />}
    {menu && <ChatMenu menu={menu} close={() => setMenu(null)} action={onAction} busy={busyChatId === menu.chat.id} />}
  </aside>
}
