import React, { useState, useRef, useEffect } from 'react'
import { C, M } from '../theme.js'
import { Icon, P } from './Icons.jsx'

/* ---- measured from 191547.png (device px / 1.5) ---- */
const S = {
  w: M.sidebar,
  search: { top: M.search.y, left: M.search.x, w: M.search.w, h: M.search.h },
  newChat: { top: M.newChat.y, left: M.newChat.x, w: M.newChat.w, h: M.newChat.h },
  navTop: M.nav.y,
  navPitch: M.nav.pitch,
}

export default function Sidebar({
  chats,
  currentChatId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onTogglePin,
  onOpenWindow,
  onMoveToGroup,
  onOpenUserMenu,
  onOpenFileMenu,
  onToggleVault,
  showVault,
  artifactsCount,
  onOpenArtifacts,
}) {
  const [q, setQ] = useState('')
  const [menu, setMenu] = useState(null) // {x,y,chat}
  const [renaming, setRenaming] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const renameRef = useRef(null)

  useEffect(() => { if (renaming && renameRef.current) renameRef.current.select() }, [renaming])
  useEffect(() => { if (!menu) return; const c = () => setMenu(null); window.addEventListener('click', c); return () => window.removeEventListener('click', c) }, [menu])

  const list = chats.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()))
  const groups = [
    { key: 'Oct 8', label: 'Oct 8' },
    { key: 'Older', label: 'Older' },
    ...[...new Set(chats.map((c) => c.group))]
      .filter((g) => g && g !== 'Oct 8' && g !== 'Older')
      .map((g) => ({ key: g, label: g })),
  ]

  return (
    <div
      className="relative shrink-0 flex flex-col h-full select-none"
      style={{ width: S.w, background: C.sidebarBg, borderRight: `1px solid ${C.border}` }}
    >
      {/* ---------- top bar (32px, inside the custom title bar) ---------- */}
      <div className="flex items-center justify-between px-[10px] shrink-0" style={{ height: M.titleBar }}>
        <div className="flex items-center gap-[14px]">
          <button onClick={onOpenFileMenu} title="File  Edit  View  Go  Help"
            className="opacity-80 hover:opacity-100" style={{ color: C.text3 }}>
            <Icon d={P.panelLeft} size={15} />
          </button>
          <button onClick={onCreate} title="New chat" className="opacity-80 hover:opacity-100" style={{ color: C.text3 }}>
            <Icon d={P.pencil} size={15} />
          </button>
          <button title="Back" className="opacity-60 hover:opacity-100" style={{ color: C.text3 }}>
            <Icon d={P.arrowLeft} size={15} />
          </button>
          <button title="Forward" className="opacity-60 hover:opacity-100" style={{ color: C.text3 }}>
            <Icon d={P.arrowRight} size={15} />
          </button>
        </div>
        <button
          className="flex items-center gap-[5px] rounded-full px-[7px] py-[3px]"
          style={{ background: C.inputBg, color: C.text3 }}
          title="AI ASSistant"
        >
          <Icon d={P.sparkle} size={11} />
        </button>
      </div>

      {/* ---------- search + new chat ---------- */}
      <div className="relative">
        <div
          className="absolute flex items-center rounded-[6px]"
          style={{
            top: S.search.top - M.titleBar, left: S.search.left, width: S.search.w, height: S.search.h,
            background: C.inputBg, border: `1px solid ${C.borderBtn}`,
          }}
        >
          <Icon d={P.search} size={13} className="ml-[7px]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent outline-none px-[7px] text-[12px] placeholder-[#898781]"
            style={{ color: C.text2 }}
          />
        </div>

        <button
          onClick={onCreate}
          className="absolute flex items-center rounded-[6px] hover:brightness-110"
          style={{
            top: S.newChat.top - M.titleBar, left: S.newChat.left, width: S.newChat.w, height: S.newChat.h,
            background: C.btnBg, color: C.text,
          }}
        >
          <Icon d={P.plus} size={14} className="ml-[9px]" />
          <span className="ml-[8px] text-[12.5px]">New</span>
        </button>
      </div>

      {/* ---------- scroll region: nav (sticky) + chat list. Starts y=99 so the
             scrollbar spans device y148..960 exactly like 191547 ---------- */}
      <div className="flex-1 overflow-y-auto scroll-thin" style={{ marginTop: 67 }}>
      <div className="sticky top-0" style={{ background: C.sidebarBg }}>

      {/* ---------- nav (Projects / Artifacts / Customize) ---------- */}
      <div>
        {[
          { icon: P.folder, label: 'Projects', onClick: () => {} },
          { icon: P.box, label: 'Artifacts', onClick: onOpenArtifacts,
            badge: artifactsCount ? String(artifactsCount) : null },
          { icon: P.sliders, label: 'Customize', onClick: () => {} },
        ].map((it, i) => (
          <button
            key={it.label}
            onClick={it.onClick}
            className="flex items-center w-full rounded-[6px] hover:bg-[#1a1a19] pr-2"
            style={{ height: 24, paddingLeft: 17, color: C.text2 }}
          >
            <Icon d={it.icon} size={14} />
            <span className="ml-[7px] text-[13px]">{it.label}</span>
            {it.badge && <span className="ml-auto text-[11px]" style={{ color: C.text3 }}>({it.badge})</span>}
          </button>
        ))}
      </div>

      </div>

      {/* ---------- chat list ---------- */}
      <div className="mt-[17px] pb-[6px]">
        {groups.map((g) => {
          const items = list.filter((c) => (c.group || 'Older') === g.key)
          if (!items.length) return null
          return (
            <div key={g.key} className="mb-[17px]">
              <div
                className="flex items-center justify-between pr-[16px] text-[11px]"
                style={{ paddingLeft: M.groupHeader.x, height: 23.3, color: C.text3 }}
              >
                <span>{g.label}</span>
                <Icon d={P.chevronDown} size={11} />
              </div>
              {items.map((c) => (
                <div key={c.id}>
                  {renaming === c.id ? (
                    <input
                      ref={renameRef}
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onBlur={() => { onRename(c.id, renameVal); setRenaming(null) }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { onRename(c.id, renameVal); setRenaming(null) }
                        if (e.key === 'Escape') setRenaming(null)
                      }}
                      className="w-[calc(100%-20px)] mx-[10px] bg-[#1d1d1d] rounded-[6px] px-[7px] py-[2px] text-[13px] outline-none"
                      style={{ color: C.text2 }}
                    />
                  ) : (
                    <button
                      onClick={() => onSelect(c.id)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        // keep the menu inside the chat-list area (measured from 191646)
                        const limit = window.innerHeight - 40 - 173
                        setMenu({ x: e.clientX, y: Math.max(8, Math.min(e.clientY, limit)), chat: c })
                      }}
                      className="flex items-center w-full text-left truncate rounded-[6px] pr-[10px]"
                      style={{
                        height: 25.3, paddingLeft: M.chat.x,
                        background: currentChatId === c.id ? C.selectedBg : 'transparent',
                        color: currentChatId === c.id ? C.text : C.text2,
                      }}
                      title={c.title}
                    >
                      {c.pinned && <Icon d={P.pin} size={11} className="mr-[6px] opacity-70" />}
                      <span className="truncate text-[12px]">{c.title}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        })}
        {!list.length && (
          <div className="px-[16px] py-[8px] text-[12px]" style={{ color: C.text3 }}>No chats found</div>
        )}
      </div>

      </div>

      {/* ---------- bottom bar (Utso · Free) ---------- */}
      <div className="shrink-0 flex items-center gap-[8px] px-[13px]" style={{ height: 40 }}>
        <button
          onClick={onOpenUserMenu}
          className="shrink-0 rounded-full flex items-center justify-center text-[9px] font-semibold"
          style={{ width: 18, height: 18, background: C.avatarBg, color: C.text }}
          title="nishadislamutso@gmail.com"
        >
          NU
        </button>
        <button onClick={onOpenUserMenu} className="text-[13px] truncate" style={{ color: C.text2 }}>
          Utso
        </button>
        <span className="text-[11px]" style={{ color: C.text3 }}>Free</span>
        <button onClick={onToggleVault} className="ml-auto opacity-70 hover:opacity-100"
          style={{ color: showVault ? C.text : C.text3 }} title="AI-Brain vault">
          <Icon d={P.brain} size={14} />
        </button>
      </div>

      {/* ---------- context menu (191646.png) ---------- */}
      {menu && (
        <div
          className="fixed rounded-[8px] py-[4px] shadow-2xl z-50"
          style={{ left: menu.x, top: menu.y, width: M.contextMenu.w, background: '#20201f', border: `1px solid #373736` }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <CtxItem icon={P.external} label="Open in new window"
            onClick={() => { onOpenWindow(menu.chat); setMenu(null) }} />
          <CtxItem icon={P.pin} label={menu.chat.pinned ? 'Unpin chat' : 'Pin chat'}
            onClick={() => { onTogglePin(menu.chat.id); setMenu(null) }} />
          <CtxItem icon={P.pencil} label="Rename"
            onClick={() => { setRenaming(menu.chat.id); setRenameVal(menu.chat.title); setMenu(null) }} />
          <CtxItem icon={P.folderPlus} label="Add to project" chevron
            onClick={() => { const p = window.prompt('Project name:'); if (p) onMoveToGroup(menu.chat.id, p); setMenu(null) }} />
          <CtxItem icon={P.move} label="Move to group" chevron
            onClick={() => { const g = window.prompt('Move to group:', menu.chat.group || 'Older'); if (g) onMoveToGroup(menu.chat.id, g); setMenu(null) }} />
          <div className="my-[4px]" style={{ height: 1, background: '#3a3a39' }} />
          <CtxItem icon={P.trash} label="Delete" danger
            onClick={() => { onDelete(menu.chat.id); setMenu(null) }} />
        </div>
      )}
    </div>
  )
}

function CtxItem({ icon, label, onClick, danger, chevron }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full rounded-[6px] hover:bg-[#383837]"
      style={{ height: 32, paddingLeft: 11, paddingRight: 10, color: danger ? C.danger : C.text }}
    >
      <Icon d={icon} size={15} />
      <span className="ml-[10px] text-[13px] flex-1 text-left">{label}</span>
      {chevron && <Icon d={P.chevron} size={12} className="opacity-60" />}
    </button>
  )
}
