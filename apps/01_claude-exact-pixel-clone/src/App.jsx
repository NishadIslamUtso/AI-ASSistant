import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Center from './components/Center.jsx'
import VaultPanel from './components/VaultPanel.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import AppsExtensionsModal from './components/AppsExtensionsModal.jsx'
import ArtifactPanel from './components/ArtifactPanel.jsx'
import ArtifactLibrary from './components/ArtifactLibrary.jsx'

const DEFAULT_CHATS = [
  { id: '1', title: 'Refining a 5-day workout cycle', date: 'Oct 8', messages: [] },
  { id: '2', title: 'Identifying your charisma type', date: 'Older', messages: [] },
  { id: '3', title: 'Repurposing an old Realme 6i phone', date: 'Older', messages: [] },
  { id: '4', title: 'Fix AI-generated Facebook profile picture', date: 'Older', messages: [] },
  { id: '5', title: 'PSY 101 midterm exam preparation and practice', date: 'Older', messages: [] },
  { id: '6', title: 'STA201 - Elements of Statistics', date: 'Older', messages: [] },
  { id: '7', title: 'PHY-112, Principles of Physics II', date: 'Older', messages: [] },
  { id: '8', title: 'CSE220 MID - Data Structure and Algorithms', date: 'Older', messages: [] },
  { id: '9', title: 'Function: Manage memories of personal information', date: 'Older', messages: [] },
]

const DEFAULT_SETTINGS = {
  theme: 'dark',
  chatFont: 'Anthropic Serif',
  transcriptSize: 'medium',
  transcriptWidth: 'medium',
  motion: 'system',
  voiceLanguage: 'English',
  voiceStyle: 'Buttery',
  voiceSpeed: 'Normal',
}

function loadChats() {
  try {
    const stored = JSON.parse(localStorage.getItem('claude_exact_chats') || 'null')
    if (!Array.isArray(stored)) return DEFAULT_CHATS
    return stored.map(chat => ({ ...chat, id: String(chat.id), messages: Array.isArray(chat.messages) ? chat.messages : [], date: chat.date || 'Older' }))
  } catch {
    return DEFAULT_CHATS
  }
}

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem('claude_exact_settings') || '{}')
    return { ...DEFAULT_SETTINGS, ...stored }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function newId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function App() {
  const [chats, setChats] = useState(loadChats)
  const [currentChatId, setCurrentChatId] = useState(() => {
    try { return new URLSearchParams(window.location.hash.replace(/^#/, '')).get('chat') || null } catch { return null }
  })
  const currentChatRef = useRef(currentChatId)
  const [showVault, setShowVault] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [appsOpen, setAppsOpen] = useState(false)
  const [artifactLibraryOpen, setArtifactLibraryOpen] = useState(false)
  const [activeArtifact, setActiveArtifact] = useState(null)
  const [settings, setSettings] = useState(loadSettings)
  const [selectedModel, setSelectedModelState] = useState(() => localStorage.getItem('selected_model') || 'qwen2.5:3b')
  const [models, setModels] = useState([])
  const [modelStatus, setModelStatus] = useState('loading')
  const [modelError, setModelError] = useState('')
  const [notice, setNotice] = useState('')
  const [systemIsLight, setSystemIsLight] = useState(() => window.matchMedia?.('(prefers-color-scheme: light)').matches || false)

  useEffect(() => { currentChatRef.current = currentChatId }, [currentChatId])
  useEffect(() => {
    try { localStorage.setItem('claude_exact_chats', JSON.stringify(chats)) } catch (error) { console.warn('Could not persist local chat history:', error) }
  }, [chats])
  useEffect(() => {
    try { localStorage.setItem('claude_exact_settings', JSON.stringify(settings)) } catch (error) { console.warn('Could not persist settings:', error) }
  }, [settings])
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: light)')
    if (!query) return undefined
    const update = event => setSystemIsLight(event.matches)
    setSystemIsLight(query.matches)
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])
  useEffect(() => {
    const handleShortcut = event => {
      if ((event.ctrlKey || event.metaKey) && event.key === ',') { event.preventDefault(); setSettingsOpen(true) }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const refreshModels = useCallback(async () => {
    setModelStatus('loading')
    setModelError('')
    try {
      const response = await fetch('/ollama/tags', { cache: 'no-store' })
      if (!response.ok) throw new Error(`Ollama returned ${response.status}`)
      const data = await response.json()
      setModels(Array.isArray(data.models) ? data.models : [])
      setModelStatus('online')
    } catch (error) {
      setModelStatus('error')
      setModelError(`Can't reach Ollama through the local app proxy. ${error.message}`)
      setModels([])
    }
  }, [])

  useEffect(() => { refreshModels() }, [refreshModels])

  const chooseModel = useCallback(model => {
    if (!model) return
    setSelectedModelState(model)
    localStorage.setItem('selected_model', model)
  }, [])

  const selectChat = useCallback(id => {
    currentChatRef.current = String(id)
    setCurrentChatId(String(id))
    setActiveArtifact(null)
  }, [])

  const createChat = useCallback(() => {
    const id = newId()
    currentChatRef.current = id
    setCurrentChatId(id)
    setActiveArtifact(null)
    setChats(previous => [{ id, title: 'New chat', date: 'Today', messages: [], createdAt: new Date().toISOString() }, ...previous])
  }, [])

  const ensureActiveChat = useCallback(() => {
    const activeId = currentChatRef.current
    if (activeId) return activeId
    const id = newId()
    currentChatRef.current = id
    setCurrentChatId(id)
    setChats(previous => [{ id, title: 'New chat', date: 'Today', messages: [], createdAt: new Date().toISOString() }, ...previous])
    return id
  }, [])

  const updateMessages = useCallback((updater, targetChatId = null) => {
    let id = targetChatId || currentChatRef.current
    if (!id) {
      id = newId()
      currentChatRef.current = id
      setCurrentChatId(id)
    }
    setChats(previous => {
      const found = previous.some(chat => String(chat.id) === String(id))
      if (!found) {
        const initial = typeof updater === 'function' ? updater([]) : updater
        return [{ id, title: 'New chat', date: 'Today', messages: initial, createdAt: new Date().toISOString() }, ...previous]
      }
      return previous.map(chat => {
        if (String(chat.id) !== String(id)) return chat
        const current = Array.isArray(chat.messages) ? chat.messages : []
        const nextMessages = typeof updater === 'function' ? updater(current) : updater
        const firstUserMessage = nextMessages.find(message => message.role === 'user')
        const title = (chat.title === 'New chat' && firstUserMessage?.content)
          ? firstUserMessage.content.replace(/\s+/g, ' ').slice(0, 54)
          : chat.title
        return { ...chat, title, messages: nextMessages }
      })
    })
  }, [])

  const activeChat = chats.find(chat => String(chat.id) === String(currentChatId)) || null
  const messages = activeChat?.messages || []
  const allArtifacts = useMemo(() => chats.flatMap(chat => (chat.messages || []).filter(message => message.artifact).map(message => ({ artifact: message.artifact, chatTitle: chat.title }))), [chats])
  const effectiveTheme = settings.theme === 'system' ? (systemIsLight ? 'light' : 'dark') : settings.theme

  function showNotice(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(current => current === message ? '' : current), 4200)
  }

  function handleUserMenuAction(action) {
    const notices = {
      help: 'Help is not connected to a remote support service in this local build.',
      upgrade: 'AI ASSistant uses Ollama locally; no Claude subscription is connected.',
      learn: 'This is a local Claude-layout prototype. See the repository handover for implementation status.',
      keys: 'No provider API keys are stored or requested by this local Ollama build.',
      logout: 'This local-only app has no account session to log out of.',
    }
    showNotice(notices[action] || 'This local action is not connected yet.')
  }

  return (
    <div data-theme={effectiveTheme} className="app-shell flex h-screen w-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)]">
      <Sidebar
        chats={chats}
        currentChat={currentChatId}
        setCurrentChat={selectChat}
        setChats={setChats}
        onCreateChat={createChat}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenApps={() => setAppsOpen(true)}
        onMenuAction={handleUserMenuAction}
        artifactCount={allArtifacts.length}
        onShowArtifacts={() => setArtifactLibraryOpen(true)}
        onToggleVault={() => setShowVault(value => !value)}
      />
      <Center
        chats={chats}
        currentChat={activeChat}
        messages={messages}
        setMessages={updateMessages}
        setChats={setChats}
        showVault={showVault}
        setShowVault={setShowVault}
        model={selectedModel}
        models={models}
        modelStatus={modelStatus}
        modelError={modelError}
        ensureActiveChat={ensureActiveChat}
        onSelectModel={chooseModel}
        onRefreshModels={refreshModels}
        settings={{ ...settings, effectiveTheme }}
        onArtifactGenerated={artifact => setActiveArtifact(artifact)}
        onOpenArtifact={artifact => setActiveArtifact(artifact)}
        onNotice={showNotice}
      />
      {showVault && <VaultPanel setShowVault={setShowVault} />}
      {activeArtifact && <ArtifactPanel artifact={activeArtifact} onClose={() => setActiveArtifact(null)} />}
      {settingsOpen && <SettingsModal settings={settings} onChange={setSettings} onClose={() => setSettingsOpen(false)} onOpenApps={() => { setSettingsOpen(false); setAppsOpen(true) }} />}
      {appsOpen && <AppsExtensionsModal onClose={() => setAppsOpen(false)} />}
      {artifactLibraryOpen && <ArtifactLibrary artifacts={allArtifacts} onOpen={artifact => setActiveArtifact(artifact)} onClose={() => setArtifactLibraryOpen(false)} />}
      {notice && <div role="status" className="fixed bottom-4 right-4 z-[90] max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-xs leading-5 text-[var(--text-primary)] shadow-xl">{notice}</div>}
    </div>
  )
}
