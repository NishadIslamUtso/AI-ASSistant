import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Center from './components/Center.jsx'
import VaultPanel from './components/VaultPanel.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import AppsExtensionsModal from './components/AppsExtensionsModal.jsx'
import { loadSettings, saveSettings } from './lib/settings.js'

const USER_EMAIL = 'nishadislamutso@gmail.com'

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
  const [settings, setSettings] = useState(loadSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [showApps, setShowApps] = useState(false)

  useEffect(() => { localStorage.setItem('claude_exact_chats', JSON.stringify(chats)) }, [chats])
  useEffect(() => { saveSettings(settings) }, [settings])
  useEffect(() => {
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === ',') { e.preventDefault(); setShowSettings(true) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-screen w-screen bg-[#1a1a1a] text-white overflow-hidden">
      <Sidebar chats={chats} currentChat={currentChat} setCurrentChat={setCurrentChat} setChats={setChats} userEmail={USER_EMAIL} onOpenSettings={() => setShowSettings(true)} onOpenApps={() => setShowApps(true)} />
      <Center chats={chats} currentChat={currentChat} messages={messages} setMessages={setMessages} setChats={setChats} showVault={showVault} setShowVault={setShowVault} />
      {showVault && <VaultPanel setShowVault={setShowVault} />}
      {showSettings && <SettingsModal settings={settings} setSettings={setSettings} onClose={() => setShowSettings(false)} />}
      {showApps && <AppsExtensionsModal onClose={() => setShowApps(false)} />}
    </div>
  )
}
