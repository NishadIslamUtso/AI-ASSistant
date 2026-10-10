import { useState, useEffect, useMemo } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Center from './components/Center.jsx'
import VaultPanel from './components/VaultPanel.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import AppsExtensionsModal from './components/AppsExtensionsModal.jsx'
import ArtifactPanel from './components/ArtifactPanel.jsx'
import {
  DEFAULT_CHATS, loadSettings, saveSettings, resolveTheme, themeVars,
} from './lib/defaults.js'
import { artifactsInMessages } from './lib/artifacts.js'

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem('claude_exact_chats')
      return saved ? JSON.parse(saved) : DEFAULT_CHATS
    } catch { return DEFAULT_CHATS }
  })
  const [messagesByChat, setMessagesByChat] = useState(() => {
    try {
      const saved = localStorage.getItem('claude_exact_messages')
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })
  const [currentChat, setCurrentChat] = useState(() => {
    const m = window.location.hash.match(/chat=([\w-]+)/)
    return m ? m[1] : null
  })
  const [showVault, setShowVault] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showApps, setShowApps] = useState(false)
  const [openArtifact, setOpenArtifact] = useState(null) // {title,type,content}

  useEffect(() => { localStorage.setItem('claude_exact_chats', JSON.stringify(chats)) }, [chats])
  useEffect(() => {
    try { localStorage.setItem('claude_exact_messages', JSON.stringify(messagesByChat)) } catch {}
  }, [messagesByChat])
  useEffect(() => { saveSettings(settings) }, [settings])

  const mode = resolveTheme(settings.theme)
  const vars = useMemo(() => themeVars(mode), [mode])

  const currentMessages = currentChat ? (messagesByChat[currentChat] || []) : []
  const chatArtifacts = useMemo(() => artifactsInMessages(currentMessages), [currentMessages])

  // If the open artifact belongs to the current chat list keep it live, else keep last snapshot
  const artifactCount = chatArtifacts.length

  function updateMessages(chatId, updater) {
    setMessagesByChat(prev => ({ ...prev, [chatId]: updater(prev[chatId] || []) }))
  }

  return (
    <div style={vars} className="flex h-screen w-screen overflow-hidden bg-[var(--bg-main)] text-[var(--tx)]">
      <Sidebar
        chats={chats}
        setChats={setChats}
        currentChat={currentChat}
        setCurrentChat={(id) => { setCurrentChat(id); setOpenArtifact(null) }}
        artifactCount={artifactCount}
        onOpenSettings={() => setShowSettings(true)}
        onOpenApps={() => setShowApps(true)}
        onOpenVault={() => setShowVault(v => !v)}
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <Center
          settings={settings}
          chats={chats}
          setChats={setChats}
          currentChat={currentChat}
          setCurrentChat={setCurrentChat}
          messages={currentMessages}
          updateMessages={updateMessages}
          onOpenArtifact={setOpenArtifact}
          artifacts={chatArtifacts}
        />
      </div>
      {openArtifact && (
        <ArtifactPanel artifact={openArtifact} onClose={() => setOpenArtifact(null)} />
      )}
      {showVault && <VaultPanel onClose={() => setShowVault(false)} />}
      {showSettings && (
        <SettingsModal
          settings={settings}
          setSettings={setSettings}
          onClose={() => setShowSettings(false)}
          onOpenApps={() => setShowApps(true)}
        />
      )}
      {showApps && <AppsExtensionsModal onClose={() => setShowApps(false)} />}
    </div>
  )
}
