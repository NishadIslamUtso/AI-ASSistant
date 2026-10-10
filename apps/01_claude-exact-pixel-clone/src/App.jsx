import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Center from './components/Center.jsx'
import VaultPanel from './components/VaultPanel.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import AppsExtensionsModal from './components/AppsExtensionsModal.jsx'
import { DEFAULT_CHATS, DEFAULT_MODEL, DEFAULT_SETTINGS, KEYS, VAULT_URL, WIDTH_PX, TEXT_PX, useStored } from './lib/store.js'
import { fetchVaultContext, streamChat } from './lib/ollama.js'

const SYSTEM_PROMPT =
  'You are AI ASSistant, a helpful local assistant running on the user\'s own computer. ' +
  'Answer the user\'s latest message directly and simply. Do not write code, games, or apps unless the user explicitly asks for them. ' +
  'Use the AI-Brain vault context only when it is given to you.'

export default function App() {
  const [chats, setChats] = useStored(KEYS.chats, DEFAULT_CHATS)
  const [messagesByChat, setMessagesByChat] = useStored(KEYS.messages, {})
  const [settings, setSettings] = useStored(KEYS.settings, DEFAULT_SETTINGS)
  const [model, setModel] = useState(() => localStorage.getItem(KEYS.model) || DEFAULT_MODEL)
  const [currentChatId, setCurrentChatId] = useState(() => new URLSearchParams(window.location.search).get('chat'))
  const [showVault, setShowVault] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [modal, setModal] = useState(null) // null | 'settings' | 'apps'
  const [settingsSection, setSettingsSection] = useState('General')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const abortRef = useRef(null)
  const toastTimer = useRef(null)

  // Save the selected model as a plain string (main.jsx also reads it this way).
  useEffect(() => { localStorage.setItem(KEYS.model, model) }, [model])

  // Apply appearance settings to the document.
  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const applyTheme = () => {
      const t = settings.theme === 'system' ? (mq.matches ? 'light' : 'dark') : settings.theme
      root.dataset.theme = t
    }
    applyTheme()
    if (settings.theme === 'system') {
      mq.addEventListener('change', applyTheme)
      return () => mq.removeEventListener('change', applyTheme)
    }
  }, [settings.theme])

  useEffect(() => {
    const root = document.documentElement
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    root.dataset.motion = settings.motion === 'reduced' || (settings.motion === 'system' && reduce) ? 'reduced' : 'normal'
    root.style.setProperty('--transcript-size', `${TEXT_PX[settings.transcriptSize] || 16}px`)
    root.style.setProperty('--transcript-width', `${WIDTH_PX[settings.transcriptWidth] || 720}px`)
    root.style.setProperty('--chat-font', settings.chatFont === 'sans'
      ? 'Inter, system-ui, "Segoe UI", sans-serif'
      : 'Georgia, "Times New Roman", serif')
  }, [settings])

  // A ?chat= link (or a deleted chat) that no longer exists falls back to the new-chat screen.
  useEffect(() => {
    if (currentChatId && !chats.some((c) => c.id === currentChatId)) setCurrentChatId(null)
  }, [chats, currentChatId])

  // Keyboard: Ctrl+, opens Settings (as in screenshot 191608.png).
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') { e.preventDefault(); setSettingsSection('General'); setModal('settings') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const showToast = useCallback((message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const setChatMessages = useCallback((chatId, updater) => {
    setMessagesByChat((prev) => ({ ...prev, [chatId]: updater(prev[chatId] || []) }))
  }, [setMessagesByChat])

  const newChat = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    setCurrentChatId(null)
  }, [])

  const selectChat = useCallback((id) => setCurrentChatId(id), [])

  const togglePin = useCallback((id) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)))
  }, [setChats])

  const renameChat = useCallback((id, title) => {
    const clean = title.trim()
    if (!clean) return
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title: clean } : c)))
  }, [setChats])

  const deleteChat = useCallback((id) => {
    setChats((prev) => prev.filter((c) => c.id !== id))
    setMessagesByChat((prev) => { const next = { ...prev }; delete next[id]; return next })
    setCurrentChatId((cur) => (cur === id ? null : cur))
  }, [setChats, setMessagesByChat])

  const openInNewWindow = useCallback((id) => {
    window.open(`${window.location.pathname}?chat=${encodeURIComponent(id)}`, '_blank')
  }, [])

  const stop = useCallback(() => { if (abortRef.current) abortRef.current.abort() }, [])

  const sendMessage = useCallback(async (text) => {
    const content = text.trim()
    if (!content || busy) return

    let chatId = currentChatId
    if (!chatId) {
      chatId = `c-${Date.now()}`
      const title = content.slice(0, 50)
      setChats((prev) => [{ id: chatId, title, group: 'Today', pinned: false }, ...prev])
      setCurrentChatId(chatId)
    }

    const history = messagesByChat[chatId] || []
    const stamp = Date.now()
    const assistantId = `m-${stamp + 1}`
    setChatMessages(chatId, (m) => [
      ...m,
      { id: `m-${stamp}`, role: 'user', content },
      { id: assistantId, role: 'assistant', content: '' },
    ])
    setBusy(true)

    // Vault driver: record the user message (best effort, never blocks chat).
    fetch(`${VAULT_URL}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'conversation',
        provider: 'AI ASSistant',
        title: content.slice(0, 50),
        messages: [{ role: 'user', text: content, timestamp: new Date().toISOString() }],
        completeness: 'full',
        captured_at: new Date().toISOString(),
      }),
    }).catch(() => {})

    const controller = new AbortController()
    abortRef.current = controller
    try {
      const capsules = await fetchVaultContext(content)
      const injection = capsules.length
        ? `\n\nRelevant vault memory:\n${capsules.map((c) => `[${c.title}: ${(c.background || '').slice(0, 200)}]`).join('\n')}`
        : ''
      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: content + injection },
      ]
      await streamChat({
        model,
        messages: apiMessages,
        signal: controller.signal,
        onToken: (t) => setChatMessages(chatId, (m) => m.map((x) => (x.id === assistantId ? { ...x, content: x.content + t } : x))),
      })
    } catch (e) {
      if (e.name !== 'AbortError') {
        setChatMessages(chatId, (m) => m.map((x) => (x.id === assistantId
          ? { ...x, content: x.content || `Error: ${e.message}. Check that Ollama is running at 127.0.0.1:11434 and OLLAMA_ORIGINS is set to *.`, error: true }
          : x)))
      }
    } finally {
      abortRef.current = null
      setBusy(false)
    }
  }, [busy, currentChatId, messagesByChat, model, setChatMessages, setChats])

  const actions = {
    newChat, selectChat, togglePin, renameChat, deleteChat, openInNewWindow,
    openSettings: () => { setSettingsSection('General'); setModal('settings') },
    openApps: () => setModal('apps'),
    toggleSidebar: () => setShowSidebar((s) => !s),
    toggleVault: () => setShowVault((s) => !s),
    toast: showToast,
    copy: (cmd) => { try { document.execCommand(cmd) } catch (e) { /* not supported */ } },
  }

  const currentChat = chats.find((c) => c.id === currentChatId) || null
  const messages = currentChatId ? (messagesByChat[currentChatId] || []) : []

  return (
    <div className="flex h-screen w-screen c-main overflow-hidden">
      {showSidebar && (
        <Sidebar chats={chats} currentChatId={currentChatId} actions={actions} />
      )}
      <Center
        currentChat={currentChat}
        messages={messages}
        busy={busy}
        onSend={sendMessage}
        onStop={stop}
        model={model}
        onModelChange={(m) => { setModel(m); showToast(`Model set to ${m}`) }}
        settings={settings}
        actions={actions}
        showSidebar={showSidebar}
      />
      {showVault && <VaultPanel setShowVault={setShowVault} />}

      {modal === 'settings' && (
        <SettingsModal
          settings={settings}
          setSettings={setSettings}
          section={settingsSection}
          setSection={setSettingsSection}
          onClose={() => setModal(null)}
          onOpenApps={() => setModal('apps')}
        />
      )}
      {modal === 'apps' && <AppsExtensionsModal onClose={() => setModal(null)} toast={showToast} />}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] c-menu rounded-lg px-4 py-2 text-sm">
          {toast}
        </div>
      )}
    </div>
  )
}
