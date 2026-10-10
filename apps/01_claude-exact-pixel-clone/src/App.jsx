import { useEffect, useMemo, useState } from 'react'
import { Database } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import Center from './components/Center.jsx'
import VaultPanel from './components/VaultPanel.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import AppsExtensionsModal from './components/AppsExtensionsModal.jsx'
import ArtifactPanel from './components/ArtifactPanel.jsx'

const DEFAULT_CHATS = [
  { id: 'chat-workout', title: 'Refining a 5-day workout cycle', date: 'Oct 8' },
  { id: 'chat-charisma', title: 'Identifying your charisma type', date: 'Older' },
  { id: 'chat-realme', title: 'Repurposing an old Realme 6i phone', date: 'Older' },
  { id: 'chat-facebook', title: 'Fix AI-generated Facebook profile picture', date: 'Older' },
  { id: 'chat-psy-quiz', title: 'PSY 101 midterm exam preparation and practice', date: 'Older' },
  { id: 'chat-psy-review', title: 'PSY 101-01W | Unit 1 | Quiz Review', date: 'Older' },
  { id: 'chat-sta', title: 'STA201 - Elements of Statistics', date: 'Older' },
  { id: 'chat-phy', title: 'PHY-112, Principles of Physics II', date: 'Older' },
  { id: 'chat-cse', title: 'CSE220 MID - Data Structure and Algorithms', date: 'Older' },
  { id: 'chat-memories', title: 'Function: Manage memories of personal information', date: 'Older' },
]

const DEFAULT_SETTINGS = {
  theme: 'Dark',
  chatFont: 'Anthropic Serif',
  transcriptSize: 'Medium',
  transcriptWidth: 'Medium',
  motion: 'System',
  voiceLanguage: 'English',
  voiceStyle: 'Buttery',
  voiceSpeed: 'Normal',
}

function readLocal(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* keep the chat usable if browser storage is full */ }
}

function readStoredMessages() {
  const stored = readLocal('claude_exact_messages', {})
  if (!stored || Array.isArray(stored) || typeof stored !== 'object') return {}
  return Object.fromEntries(Object.entries(stored).map(([chatId, list]) => [
    chatId,
    (Array.isArray(list) ? list : []).map((message) => message.isStreaming
      ? { ...message, isStreaming: false, content: message.content || 'Generation stopped when the app was closed.' }
      : message),
  ]))
}

function makeId(prefix = 'chat') {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`
}

export default function App() {
  const [chats, setChats] = useState(() => readLocal('claude_exact_chats', DEFAULT_CHATS))
  const [currentChat, setCurrentChat] = useState(() => readLocal('claude_exact_current_chat', null))
  const [messagesByChat, setMessagesByChat] = useState(readStoredMessages)
  const [artifacts, setArtifacts] = useState(() => readLocal('claude_exact_artifacts', []))
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...readLocal('claude_exact_settings', {}) }))
  const [projects, setProjects] = useState(() => readLocal('claude_exact_projects', []))
  const [selectedModel, setSelectedModel] = useState(() => readLocal('claude_exact_model', 'qwen2.5:3b'))
  const [showVault, setShowVault] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState('General')
  const [appsOpen, setAppsOpen] = useState(false)
  const [artifactPanelOpen, setArtifactPanelOpen] = useState(false)
  const [selectedArtifactId, setSelectedArtifactId] = useState(null)
  const [notice, setNotice] = useState('')

  const activeChat = useMemo(() => chats.find((chat) => chat.id === currentChat) || null, [chats, currentChat])
  const messages = currentChat ? (messagesByChat[currentChat] || []) : []

  useEffect(() => { writeLocal('claude_exact_chats', chats) }, [chats])
  useEffect(() => { writeLocal('claude_exact_current_chat', currentChat) }, [currentChat])
  useEffect(() => { writeLocal('claude_exact_messages', messagesByChat) }, [messagesByChat])
  useEffect(() => { writeLocal('claude_exact_artifacts', artifacts) }, [artifacts])
  useEffect(() => { writeLocal('claude_exact_settings', settings) }, [settings])
  useEffect(() => { writeLocal('claude_exact_projects', projects) }, [projects])
  useEffect(() => { writeLocal('claude_exact_model', selectedModel) }, [selectedModel])

  useEffect(() => {
    const applyTheme = () => {
      const preference = settings.theme || 'Dark'
      const systemIsLight = window.matchMedia?.('(prefers-color-scheme: light)').matches
      document.documentElement.dataset.theme = preference === 'System' ? (systemIsLight ? 'light' : 'dark') : preference.toLowerCase()
      document.documentElement.dataset.motion = settings.motion === 'Reduced' ? 'reduced' : 'system'
    }
    applyTheme()
    const media = window.matchMedia?.('(prefers-color-scheme: light)')
    media?.addEventListener?.('change', applyTheme)
    return () => media?.removeEventListener?.('change', applyTheme)
  }, [settings.theme, settings.motion])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 3600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const createChat = (title = 'New chat') => {
    const id = makeId()
    const nextChat = { id, title: title.slice(0, 72) || 'New chat', date: 'Today', createdAt: new Date().toISOString() }
    setChats((previous) => [nextChat, ...previous])
    setCurrentChat(id)
    setMessagesByChat((previous) => ({ ...previous, [id]: [] }))
    return id
  }

  const updateMessages = (chatId, updater) => {
    setMessagesByChat((previous) => {
      const existing = previous[chatId] || []
      const next = typeof updater === 'function' ? updater(existing) : updater
      return { ...previous, [chatId]: next }
    })
  }

  const openSettings = (section = 'General') => {
    setSettingsSection(section)
    setSettingsOpen(true)
  }

  const openArtifacts = () => {
    setArtifactPanelOpen(true)
    if (!selectedArtifactId && artifacts[0]) setSelectedArtifactId(artifacts[0].id)
  }

  const openArtifact = (artifactId) => {
    setSelectedArtifactId(artifactId)
    setArtifactPanelOpen(true)
  }

  const appStyle = {
    '--transcript-width': settings.transcriptWidth === 'Narrow' ? '640px' : settings.transcriptWidth === 'Wide' ? '960px' : '760px',
    '--transcript-font-size': settings.transcriptSize === 'Small' ? '14px' : settings.transcriptSize === 'Large' ? '18px' : '16px',
    '--chat-font-family': settings.chatFont === 'Anthropic Serif' ? 'Georgia, "Times New Roman", serif' : settings.chatFont === 'Monospace' ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'Inter, "Segoe UI", sans-serif',
  }

  return (
    <div className="app-shell" style={appStyle}>
      <Sidebar
        chats={chats}
        currentChat={currentChat}
        setCurrentChat={setCurrentChat}
        setChats={setChats}
        onNewChat={() => createChat()}
        onDeleteChat={(chatId) => {
          setChats((previous) => previous.filter((item) => item.id !== chatId))
          setMessagesByChat((previous) => {
            const next = { ...previous }
            delete next[chatId]
            return next
          })
          if (currentChat === chatId) setCurrentChat(null)
        }}
        artifactCount={artifacts.length}
        onArtifacts={openArtifacts}
        onProjects={() => setNotice('Project organization is available from the composer and chat menu.')}
        onCustomize={() => openSettings('General')}
        onSettings={() => openSettings('General')}
        onApps={() => setAppsOpen(true)}
        onNotice={setNotice}
      />

      <main className="app-workspace">
        <Center
          chat={activeChat}
          currentChat={currentChat}
          messages={messages}
          updateMessages={updateMessages}
          createChat={createChat}
          chats={chats}
          setChats={setChats}
          projects={projects}
          setProjects={setProjects}
          settings={settings}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          artifacts={artifacts}
          setArtifacts={setArtifacts}
          onOpenArtifact={openArtifact}
          onToggleVault={() => setShowVault((visible) => !visible)}
          onNotice={setNotice}
        />
        {showVault ? <VaultPanel setShowVault={setShowVault} /> : null}
        <ArtifactPanel
          isOpen={artifactPanelOpen}
          artifacts={artifacts}
          selectedArtifactId={selectedArtifactId}
          onSelectArtifact={setSelectedArtifactId}
          onClose={() => setArtifactPanelOpen(false)}
        />
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
        initialSection={settingsSection}
      />
      <AppsExtensionsModal isOpen={appsOpen} onClose={() => setAppsOpen(false)} onNotice={setNotice} />
      {notice ? <div className="app-toast" role="status"><Database size={15} />{notice}</div> : null}
    </div>
  )
}
