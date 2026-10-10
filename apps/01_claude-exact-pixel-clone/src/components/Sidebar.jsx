import { useState } from 'react'
import UserMenu from './UserMenu.jsx'
export default function Sidebar({ chats, currentChat, setCurrentChat, setChats, userEmail, onOpenSettings, onOpenApps }) {
  const [search, setSearch] = useState("")
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const filtered = chats.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
  const oct8 = filtered.filter(c => c.date === 'Oct 8')
  const older = filtered.filter(c => c.date === 'Older')
  return (
    <div className="w-[260px] bg-[#202020] border-r border-[#2a2a2a] flex flex-col h-screen shrink-0">
      <div className="h-11 flex items-center px-3 gap-2 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-1 text-[#666] text-xs">☰ ◫ ← →</div>
        <div className="ml-2 flex items-center gap-1 bg-[#2a2a2a] rounded-full px-2 py-1 text-[10px]">◍ &lt;/&gt;</div>
      </div>
      <div className="p-3">
        <div className="relative mb-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search" className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg pl-3 pr-3 py-1.5 text-sm text-white placeholder-[#666] outline-none" />
        </div>
        <button onClick={()=>{const id=Date.now().toString(); const nc={id, title:'New chat', date:'Oct 8'}; setChats(p=>[nc, ...p]); setCurrentChat(id)}} className="w-full bg-[#2a2a2a] hover:bg-[#333] text-sm py-2 px-3 rounded-lg flex items-center gap-2 text-[#ccc] mb-3">+ New</button>
        <div className="space-y-1 text-sm text-[#aaa]">
          <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#2a2a2a] rounded cursor-pointer">📁 Projects</div>
          <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#2a2a2a] rounded cursor-pointer">📦 Artifacts</div>
          <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#2a2a2a] rounded cursor-pointer">🎨 Customize</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {oct8.length>0 && <><div className="flex justify-between px-2 py-2 text-xs text-[#666]"><span>Oct 8</span><span>⇅</span></div><div className="space-y-0.5 mb-4">{oct8.map(c=><div key={c.id} onClick={()=>setCurrentChat(c.id)} onContextMenu={e=>{e.preventDefault(); setContextMenu({x:e.clientX, y:e.clientY, chat:c})}} className={`px-2 py-2 rounded-lg text-sm truncate cursor-pointer hover:bg-[#2a2a2a] ${currentChat===c.id?'bg-[#2a2a2a] text-white':'text-[#aaa]'}`}>{c.title}</div>)}</div></>}
        <div className="flex justify-between px-2 py-2 text-xs text-[#666]"><span>Older ⌄</span><span>↗</span></div>
        <div className="space-y-0.5">{older.map(c=><div key={c.id} onClick={()=>setCurrentChat(c.id)} onContextMenu={e=>{e.preventDefault(); setContextMenu({x:e.clientX, y:e.clientY, chat:c})}} className={`px-2 py-2 rounded-lg text-sm truncate cursor-pointer hover:bg-[#2a2a2a] ${currentChat===c.id?'bg-[#2a2a2a] text-white':'text-[#aaa]'}`}>{c.title}</div>)}</div>
      </div>
      <div className="relative border-t border-[#2a2a2a] p-3 flex items-center justify-between">
        {userMenuOpen && <UserMenu email={userEmail} onClose={()=>setUserMenuOpen(false)} onOpenSettings={()=>onOpenSettings && onOpenSettings()} onOpenApps={()=>onOpenApps && onOpenApps()} />}
        <button onClick={()=>setUserMenuOpen(o=>!o)} aria-label="Account menu" className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-[#2a2a2a]"><div className="w-6 h-6 rounded-full bg-[#c4a484] flex items-center justify-center text-xs text-black font-bold">NU</div><div className="text-sm">Utso · Free</div><span className="text-[10px]">⌄</span></button>
        <div className="text-[#666]">◫◫</div>
      </div>
      {contextMenu && <div className="fixed inset-0 z-50" onClick={()=>setContextMenu(null)}><div style={{left:contextMenu.x, top:contextMenu.y}} className="absolute bg-[#2a2a2a] border border-[#333] rounded-lg py-1 w-52 text-sm shadow-xl"><div className="px-3 py-2 hover:bg-[#333]">↗ Open in new window</div><div className="px-3 py-2 hover:bg-[#333]">📌 Pin</div><div className="px-3 py-2 hover:bg-[#333]">✎ Rename</div><div className="px-3 py-2 hover:bg-[#333] flex justify-between"><span>📁 Add to project</span><span>›</span></div><div className="px-3 py-2 hover:bg-[#333] flex justify-between"><span>👥 Move to group</span><span>›</span></div><div className="px-3 py-2 hover:bg-[#333] text-red-400">🗑 Delete</div></div></div>}
    </div>
  )
}
