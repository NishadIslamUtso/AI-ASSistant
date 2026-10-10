import { useMemo, useState } from 'react'
import {
  Menu,
  PanelLeft,
  ArrowLeft,
  ArrowRight,
  Search,
  Plus,
  Folder,
  Package,
  Palette,
  SlidersHorizontal,
  MoreHorizontal,
  Pin,
  Pencil,
  FolderPlus,
  MoveRight,
  Trash2,
  ExternalLink,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react'
import UserMenu from './UserMenu.jsx'

export default function Sidebar({
  chats,
  currentChat,
  setCurrentChat,
  setChats,
  onNewChat,
  onDeleteChat,
  artifactCount = 0,
  onArtifacts,
  onProjects,
  onCustomize,
  onSettings,
  onApps,
  onNotice,
}) {
  const [search, setSearch] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase()
    const visible = chats.filter((chat) => !term || chat.title.toLowerCase().includes(term))
    return {
      pinned: visible.filter((chat) => chat.pinned),
      today: visible.filter((chat) => !chat.pinned && chat.date === 'Today'),
      oct8: visible.filter((chat) => !chat.pinned && chat.date === 'Oct 8'),
      older: visible.filter((chat) => !chat.pinned && chat.date !== 'Today' && chat.date !== 'Oct 8'),
    }
  }, [chats, search])

  const updateChat = (chatId, update) => {
    setChats((previous) => previous.map((chat) => chat.id === chatId ? { ...chat, ...update } : chat))
  }

  const startRename = (chat) => {
    setContextMenu(null)
    setRenamingId(chat.id)
    setRenameValue(chat.title)
  }

  const finishRename = (chatId) => {
    const title = renameValue.trim()
    if (title) updateChat(chatId, { title })
    setRenamingId(null)
  }

  const handleContextAction = (action, chat) => {
    setContextMenu(null)
    if (action === 'open') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer')
    } else if (action === 'pin') {
      updateChat(chat.id, { pinned: !chat.pinned })
    } else if (action === 'rename') {
      startRename(chat)
    } else if (action === 'project') {
      const project = window.prompt('Project name for this chat:', chat.project || '')
      if (project !== null) updateChat(chat.id, { project: project.trim() || null })
    } else if (action === 'group') {
      updateChat(chat.id, { date: chat.date === 'Oct 8' ? 'Older' : 'Oct 8' })
    } else if (action === 'delete') {
      if (window.confirm(`Remove “${chat.title}” from chat history on this device? Any vault copy is kept.`)) {
        if (onDeleteChat) onDeleteChat(chat.id)
        else {
          setChats((previous) => previous.filter((item) => item.id !== chat.id))
          if (currentChat === chat.id) setCurrentChat(null)
        }
      }
    }
  }

  const renderChat = (chat) => (
    <div
      key={chat.id}
      className={`chat-list-item ${currentChat === chat.id ? 'is-active' : ''}`}
      onClick={() => setCurrentChat(chat.id)}
      onContextMenu={(event) => {
        event.preventDefault()
        setContextMenu({ x: event.clientX, y: event.clientY, chat })
      }}
      title={chat.title}
    >
      {renamingId === chat.id ? (
        <input
          autoFocus
          value={renameValue}
          onChange={(event) => setRenameValue(event.target.value)}
          onClick={(event) => event.stopPropagation()}
          onBlur={() => finishRename(chat.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') finishRename(chat.id)
            if (event.key === 'Escape') setRenamingId(null)
          }}
          className="chat-rename-input"
          aria-label="Rename chat"
        />
      ) : (
        <>
          {chat.pinned ? <Pin size={12} className="chat-pin" aria-label="Pinned" /> : null}
          <span className="chat-list-title">{chat.title}</span>
          {chat.project ? <span className="chat-project-indicator">{chat.project}</span> : null}
          <button
            type="button"
            className="chat-more-button"
            title="Chat options"
            aria-label={`Options for ${chat.title}`}
            onClick={(event) => {
              event.stopPropagation()
              const rect = event.currentTarget.getBoundingClientRect()
              setContextMenu({ x: rect.right - 8, y: rect.bottom - 4, chat })
            }}
          ><MoreHorizontal size={15} /></button>
        </>
      )}
    </div>
  )

  const menuLeft = contextMenu ? Math.max(8, Math.min(contextMenu.x, window.innerWidth - 216)) : 0
  const menuTop = contextMenu ? Math.max(8, Math.min(contextMenu.y, window.innerHeight - 280)) : 0

  return (
    <aside className="app-sidebar">
      <div className="sidebar-top-controls">
        <button type="button" aria-label="Open menu" title="Menu" onClick={() => onNotice?.('The native File, Edit, View, Go, Help menu is available in the future desktop wrapper.')}><Menu size={18} /></button>
        <button type="button" aria-label="Sidebar controls" title="Sidebar" onClick={() => onNotice?.('The sidebar is shown at its reference width.')}><PanelLeft size={17} /></button>
        <button type="button" aria-label="Back" title="Back" onClick={() => window.history.back()}><ArrowLeft size={17} /></button>
        <button type="button" aria-label="Forward" title="Forward" onClick={() => window.history.forward()}><ArrowRight size={17} /></button>
        <span className="sidebar-top-spacer" />
        <button type="button" className="sidebar-top-mode" aria-label="Chat mode" title="Chat mode"><Sparkles size={16} /></button>
        <button type="button" className="sidebar-top-mode code-mode" aria-label="Code mode" title="Code mode" onClick={() => onNotice?.('Code mode is not connected yet.')}>&lt;/&gt;</button>
      </div>

      <div className="sidebar-primary">
        <label className="sidebar-search">
          <Search size={16} aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" aria-label="Search chats" />
          {search ? <button type="button" aria-label="Clear search" onClick={() => setSearch('')}><X size={14} /></button> : null}
        </label>
        <button type="button" className="new-chat-button" onClick={onNewChat}><Plus size={18} /><span>New</span></button>
        <nav className="sidebar-shortcuts" aria-label="Main navigation">
          <button type="button" onClick={onProjects}><Folder size={16} /><span>Projects</span></button>
          <button type="button" onClick={onArtifacts}><Package size={16} /><span>Artifacts</span>{artifactCount > 0 ? <span className="shortcut-count">{artifactCount}</span> : null}</button>
          <button type="button" onClick={onCustomize}><Palette size={16} /><span>Customize</span></button>
        </nav>
      </div>

      <div className="sidebar-chat-scroll">
        {groups.pinned.length > 0 ? <section className="chat-group"><div className="chat-group-heading">Pinned</div>{groups.pinned.map(renderChat)}</section> : null}
        {groups.today.length > 0 ? <section className="chat-group"><div className="chat-group-heading"><span>Today</span><SlidersHorizontal size={13} /></div>{groups.today.map(renderChat)}</section> : null}
        {groups.oct8.length > 0 ? <section className="chat-group"><div className="chat-group-heading"><span>Oct 8</span><SlidersHorizontal size={13} /></div>{groups.oct8.map(renderChat)}</section> : null}
        {groups.older.length > 0 ? <section className="chat-group"><div className="chat-group-heading"><span>Older</span><ChevronRight size={13} className="older-chevron" /></div>{groups.older.map(renderChat)}</section> : null}
        {groups.pinned.length + groups.today.length + groups.oct8.length + groups.older.length === 0 ? <div className="sidebar-empty">No matching chats</div> : null}
      </div>

      <div className="sidebar-footer">
        <button type="button" className="account-button" aria-expanded={userMenuOpen} onClick={() => setUserMenuOpen((open) => !open)}>
          <span className="account-avatar">NU</span>
          <span className="account-label"><strong>Utso</strong><span>Free</span></span>
          <ChevronRight size={14} className={`account-chevron ${userMenuOpen ? 'is-open' : ''}`} />
        </button>
        <button type="button" className="sidebar-extension-button" aria-label="Apps and extensions" title="Get apps and extensions" onClick={onApps}><BlocksIcon /></button>
        {userMenuOpen ? <UserMenu onClose={() => setUserMenuOpen(false)} onSettings={onSettings} onApps={onApps} onNotice={onNotice} /> : null}
      </div>

      {contextMenu ? (
        <div className="context-menu-scrim" onMouseDown={() => setContextMenu(null)}>
          <div
            role="menu"
            className="chat-context-menu"
            style={{ left: `${menuLeft}px`, top: `${menuTop}px` }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button role="menuitem" type="button" onClick={() => handleContextAction('open', contextMenu.chat)}><ExternalLink size={15} /><span>Open in new window</span></button>
            <button role="menuitem" type="button" onClick={() => handleContextAction('pin', contextMenu.chat)}><Pin size={15} /><span>{contextMenu.chat.pinned ? 'Unpin chat' : 'Pin chat'}</span><kbd>P</kbd></button>
            <button role="menuitem" type="button" onClick={() => handleContextAction('rename', contextMenu.chat)}><Pencil size={15} /><span>Rename</span><kbd>R</kbd></button>
            <button role="menuitem" type="button" onClick={() => handleContextAction('project', contextMenu.chat)}><FolderPlus size={15} /><span>Add to project</span><ChevronRight size={14} /></button>
            <button role="menuitem" type="button" onClick={() => handleContextAction('group', contextMenu.chat)}><MoveRight size={15} /><span>Move to group</span><ChevronRight size={14} /></button>
            <div className="context-menu-divider" />
            <button role="menuitem" type="button" className="delete-context-action" onClick={() => handleContextAction('delete', contextMenu.chat)}><Trash2 size={15} /><span>Delete</span><kbd>D</kbd></button>
          </div>
        </div>
      ) : null}
    </aside>
  )
}

function BlocksIcon() {
  return <span className="blocks-icon" aria-hidden="true"><span /><span /><span /><span /></span>
}
