import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Center from './components/Center.jsx'
import VaultPanel from './components/VaultPanel.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import AppsExtensionsModal from './components/AppsExtensionsModal.jsx'
import { DEFAULT_MODEL, STORAGE, SYSTEM_PROMPT } from './lib/constants.js'
import { loadJSON, saveJSON } from './lib/storage.js'
import { applySettings, loadSettings, saveSettings } from './lib/settings.js'
import { loadChats, uid } from './lib/chats.js'
import { listModels, streamChat } from './lib/ollama.js'
import { vaultCapture } from './lib/vault.js'

function friendlyError(e) {
  const detail = e?.message || String(e)
  return `Could not get a reply from Ollama (${detail}). Check that Ollama is running and that ${DEFAULT_MODEL} or your chosen model is pulled.`
}

export default function App() {
  const [chats, setChats] = useState(() => loadChats())
  const [messagesByChat, setMessagesByChat] = useState(() => loadJSON(STORAGE.messages, {}))
  // activeId = null means the blank "New" screen. A chat is created on the first message.
  const [activeId, setActiveId] = useState(() => new URLSearchParams(window.location.search).get('chat'))
  const [settings, setSettings] = useState(() => loadSettings())
  const [model, setModel] = useState(() => localStorage.getItem(STORAGE.model) || DEFAULT_MODEL)
  const [models, setModels] = useState([DEFAULT_MODEL])
  const [modelsError, setModelsError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showVault, setShowVault] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [appsOpen, setAppsOpen] = useState(false)
  const abortRef = useRef(null)

  const activeChat = chats.find((c) => c.id === activeId) || null
  const messages = activeChat ? messagesByChat[activeChat.id] || [] : []

  useEffect(() => saveJSON(STORAGE.chats, chats), [chats])
  // Save transcripts only when a reply is not streaming, to avoid writing localStorage on every token.
  useEffect(() => {
    if (!isLoading) saveJSON(STORAGE.messages, messagesByChat)
  }, [messagesByChat, isLoading])
  useEffect(() => {
    applySettings(settings)
    saveSettings(settings)
  }, [settings])
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: light)')
    const onChange = () => applySettings(settings)
    mq?.addEventListener?.('change', onChange)
    return () => mq?.removeEventListener?.('change', onChange)
  }, [settings])
  useEffect(() => localStorage.setItem(STORAGE.model, model), [model])

  const refreshModels = useCallback(async () => {
    try {
      const list = await listModels()
      setModels(list.length ? list : [DEFAULT_MODEL])
      setModelsError(list.length ? '' : 'Ollama is running but has no models yet. Run: ollama pull qwen2.5:3b')
    } catch {
      setModels([DEFAULT_MODEL])
      setModelsError('Ollama is not reachable. Start it with start-app.bat or run "ollama serve".')
    }
  }, [])

  useEffect(() => {
    refreshModels()
  }, [refreshModels])

  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key === ',') {
        e.preventDefault()
        setSettingsOpen(true)
      } else if (mod && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault()
        setActiveId(null)
      } else if (e.key === 'Escape') {
        setSettingsOpen(false)
        setAppsOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const patchMessages = (chatId, fn) => setMessagesByChat((prev) => ({ ...prev, [chatId]: fn(prev[chatId] || []) }))
  const patchChat = (id, patch) => setChats((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  async function sendMessage(text, vaultHits) {
    if (isLoading) return
    const now = Date.now()
    let chatId = activeChat?.id
    if (!chatId) {
      chatId = uid('chat')
      setChats((prev) => [{ id: chatId, title: text.slice(0, 60), updatedAt: now, pinned: false }, ...prev])
      setActiveId(chatId)
    } else {
      patchChat(chatId, { updatedAt: now })
    }

    const history = messagesByChat[chatId] || []
    const asstId = uid('m')
    patchMessages(chatId, (list) => [...list, { id: uid('m'), role: 'user', content: text }, { id: asstId, role: 'assistant', content: '' }])
    setIsLoading(true)

    // Same vault "capture" as before: one conversation note per message, via the vault API.
    vaultCapture({
      type: 'conversation',
      provider: 'AI ASSistant',
      title: text.slice(0, 50),
      messages: [{ role: 'user', text, timestamp: new Date().toISOString() }],
      completeness: 'full',
      captured_at: new Date().toISOString(),
    })

    const injection = vaultHits?.length
      ? `\n\nRelevant vault memory (use only if relevant):\n${vaultHits.map((c) => `- ${c.title}: ${String(c.background || '').slice(0, 200)}`).join('\n')}`
      : ''

    const controller = new AbortController()
    abortRef.current = controller
    try {
      const payload = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.filter((m) => !m.error && m.content).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: text + injection },
      ]
      await streamChat({
        model,
        messages: payload,
        signal: controller.signal,
        onToken: (tok) => patchMessages(chatId, (list) => list.map((m) => (m.id === asstId ? { ...m, content: m.content + tok } : m))),
      })
      patchMessages(chatId, (list) =>
        list.map((m) => (m.id === asstId && !m.content ? { ...m, content: '(No reply from the model.)', error: true } : m)),
      )
    } catch (e) {
      if (e?.name === 'AbortError') {
        // Stopped by the user: keep partial text, drop an empty placeholder.
        patchMessages(chatId, (list) => list.filter((m) => !(m.id === asstId && !m.content)))
      } else {
        patchMessages(chatId, (list) =>
          list.map((m) => (m.id === asstId ? { ...m, content: friendlyError(e), error: true } : m)),
        )
      }
    } finally {
      abortRef.current = null
      setIsLoading(false)
    }
  }

  const stopGeneration = () => abortRef.current?.abort()

  const renameChat = (id, title) => {
    const t = title.trim()
    if (t) patchChat(id, { title: t })
  }
  const togglePin = (id) => setChats((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)))
  const deleteChat = (id) => {
    setChats((prev) => prev.filter((c) => c.id !== id))
    setMessagesByChat((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (activeId === id) setActiveId(null)
  }
  const openInNewWindow = (id) => window.open(`${window.location.pathname}?chat=${encodeURIComponent(id)}`, '_blank', 'noopener')
  const updateSettings = (patch) => setSettings((s) => ({ ...s, ...patch }))

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ui-main text-ui-text">
      {sidebarOpen && (
        <Sidebar
          chats={chats}
          activeId={activeChat?.id ?? null}
          onSelect={setActiveId}
          onNew={() => setActiveId(null)}
          onRename={renameChat}
          onTogglePin={togglePin}
          onDelete={deleteChat}
          onOpenInWindow={openInNewWindow}
          onToggleSidebar={() => setSidebarOpen(false)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenApps={() => setAppsOpen(true)}
          onToggleVault={() => setShowVault((v) => !v)}
        />
      )}
      <Center
        messages={messages}
        isLoading={isLoading}
        onSend={sendMessage}
        onStop={stopGeneration}
        model={model}
        models={models}
        modelsError={modelsError}
        onModelChange={setModel}
        onRefreshModels={refreshModels}
        sidebarOpen={sidebarOpen}
        onExpandSidebar={() => setSidebarOpen(true)}
      />
      {showVault && <VaultPanel setShowVault={setShowVault} />}
      {settingsOpen && <SettingsModal settings={settings} onChange={updateSettings} onClose={() => setSettingsOpen(false)} />}
      {appsOpen && <AppsExtensionsModal onClose={() => setAppsOpen(false)} />}
    </div>
  )
}
