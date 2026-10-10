import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Center from './components/Center.jsx'
import VaultPanel from './components/VaultPanel.jsx'

export default function App() {
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('claude_exact_chats')
    return saved ? JSON.parse(saved) : [
      {id:'1', title:'Refining a 5-day workout cycle', date:'Oct 8'},
      {id:'2', title:'Identifying your charisma type', date:'Older'},
      {id:'3', title:'Repurposing an old Realme 6i phone', date:'Older'},
      {id:'4', title:'Fix AI-generated Facebook profile picture', date:'Older'},
      {id:'5', title:'PSY 101 midterm exam preparation and pr', date:'Older'},
      {id:'10', title:'CSE220 MID', date:'Older'},
    ]
  })
  const [currentChat, setCurrentChat] = useState(null)
  const [showVault, setShowVault] = useState(false)
  const [messages, setMessages] = useState([])

  useEffect(() => { localStorage.setItem('claude_exact_chats', JSON.stringify(chats)) }, [chats])

  return (
    <div className="flex h-screen w-screen bg-[#1a1a1a] text-white overflow-hidden">
      <Sidebar chats={chats} currentChat={currentChat} setCurrentChat={setCurrentChat} setChats={setChats} />
      <Center chats={chats} currentChat={currentChat} messages={messages} setMessages={setMessages} setChats={setChats} showVault={showVault} setShowVault={setShowVault} />
      {showVault && <VaultPanel setShowVault={setShowVault} />}
    </div>
  )
}
