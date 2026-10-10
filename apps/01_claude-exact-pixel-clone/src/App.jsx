import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Code2, Ghost, Menu, Minus, MessageSquare, PanelLeft, Square, X } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import Center from './components/Center.jsx'
import VaultPanel from './components/VaultPanel.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import AppsExtensionsModal from './components/AppsExtensionsModal.jsx'
import AppMenu from './components/AppMenu.jsx'
import { loadChats, saveChats, loadSettings, saveSettings } from './lib/storage.js'
import { listOllamaModels } from './lib/api.js'

const SIDEBAR_W = 320 // CSS px (screenshot 191547: 384 px at 1920 wide, ÷1.2 display scale)

function systemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [chats, setChats] = useState(loadChats)
  // Chat id from the URL (?chat=...) lets "Open in new window" reopen a chat.
  const [currentChatId, setCurrentChatId] = useState(() => new URLSearchParams(location.search).get('chat'))
  const [nav, setNav] = useState({ stack: [currentChatId], index: 0 })
  const [appMenuOpen, setAppMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState('General')
  const [appsOpen, setAppsOpen] = useState(false)
  const [showVault, setShowVault] = useState(false)
  const [models, setModels] = useState({ list: [], error: null })
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  // Persist
  useEffect(() => { saveChats(chats) }, [chats])
  useEffect(() => { saveSettings(settings) }, [settings])

  // Apply theme + motion to <html>
  useEffect(() => {
    const apply = () => {
      const resolved = settings.theme === 'system' ? systemTheme() : settings.theme
      document.documentElement.dataset.theme = resolved
    }
    apply()
    if (settings.theme !== 'system') return undefined
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [settings.theme])
  useEffect(() => {
    const reduce = settings.motion === 'reduced' || (settings.motion === 'system' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    document.documentElement.dataset.motion = reduce ? 'reduced' : 'normal'
  }, [settings.motion])

  // Models from Ollama (refresh on load and whenever the model menu asks)
  const refreshModels = useCallback(async () => {
    const { models: list, error } = await listOllamaModels()
    setModels({ list, error })
  }, [])
  useEffect(() => { refreshModels() }, [refreshModels])

  const showToast = useCallback((message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const patchSettings = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), [])

  // Navigation (back/forward between chats, like the desktop app's arrows)
  const selectChat = useCallback((id) => {
    setCurrentChatId(id)
    setNav((n) => {
      if (n.stack[n.index] === id) return n
      const stack = [...n.stack.slice(0, n.index + 1), id]
      return { stack, index: stack.length - 1 }
    })
  }, [])
  const goBack = () => setNav((n) => { if (n.index === 0) return n; setCurrentChatId(n.stack[n.index - 1]); return { ...n, index: n.index - 1 } })
  const goForward = () => setNav((n) => { if (n.index >= n.stack.length - 1) return n; setCurrentChatId(n.stack[n.index + 1]); return { ...n, index: n.index + 1 } })

  const newChat = useCallback(() => {
    setCurrentChatId(null)
    setNav((n) => {
      if (n.stack[n.index] === null) return n
      const stack = [...n.stack.slice(0, n.index + 1), null]
      return { stack, index: stack.length - 1 }
    })
  }, [])

  // Keyboard shortcuts shown in the menus
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key === ',') { e.preventDefault(); setSettingsOpen(true) }
      else if (mod && (e.key === 'n' || e.key === 'N') && !e.shiftKey) { e.preventDefault(); newChat() }
      else if (mod && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); patchSettings({ sidebarOpen: !settings.sidebarOpen }) }
      else if (e.key === 'Escape') { if (settingsOpen) setSettingsOpen(false); else if (appsOpen) setAppsOpen(false); else if (appMenuOpen) setAppMenuOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [newChat, patchSettings, settings.sidebarOpen, settingsOpen, appsOpen, appMenuOpen])

  const canBack = nav.index > 0
  const canForward = nav.index < nav.stack.length - 1
  const sidebarOpen = settings.sidebarOpen

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-main text-fg">
      {/* Top strip: left = app toolbar over sidebar, right = Windows-style window controls */}
      <div className="flex h-10 shrink-0 select-none">
        <div
          className="flex items-center gap-[9px] border-r border-soft bg-side px-4 transition-[width] duration-150"
          style={{ width: sidebarOpen ? SIDEBAR_W : 'auto' }}
        >
          <div className="relative">
            <IconBtn label="Menu" onClick={() => setAppMenuOpen((o) => !o)} active={appMenuOpen}><Menu size={17} /></IconBtn>
            {appMenuOpen && <AppMenu onClose={() => setAppMenuOpen(false)} actions={{
              newChat, openSettings: () => setSettingsOpen(true), toggleSidebar: () => patchSettings({ sidebarOpen: !sidebarOpen }),
              toggleVault: () => setShowVault((v) => !v), goBack, goForward, toast: showToast,
            }} />}
          </div>
          <IconBtn label="Toggle sidebar" onClick={() => patchSettings({ sidebarOpen: !sidebarOpen })}><PanelLeft size={17} /></IconBtn>
          <IconBtn label="Back" onClick={goBack} disabled={!canBack}><ArrowLeft size={17} /></IconBtn>
          <IconBtn label="Forward" onClick={goForward} disabled={!canForward}><ArrowRight size={17} /></IconBtn>
          {sidebarOpen && (
            <div className="ml-[69px] flex items-center rounded-lg bg-elev p-0.5">
              <span className="flex h-7 w-8 items-center justify-center rounded-md bg-active text-fg" title="Chat"><MessageSquare size={15} /></span>
              <span className="flex h-7 w-8 items-center justify-center rounded-md text-fg3" title="Code (not available yet)"><Code2 size={15} /></span>
            </div>
          )}
        </div>
        <div className="flex flex-1 items-center justify-end gap-1 pr-1">
          <div className="mr-4"><IconBtn label="Ghost" onClick={() => showToast('AI ASSistant runs fully local. No account needed.')}><Ghost size={16} /></IconBtn></div>
          <div className="flex">
            <WinBtn label="Minimize"><Minus size={14} /></WinBtn>
            <WinBtn label="Maximize"><Square size={11} /></WinBtn>
            <WinBtn label="Close" danger><X size={15} /></WinBtn>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {sidebarOpen && (
          <Sidebar
            width={SIDEBAR_W}
            chats={chats}
            setChats={setChats}
            currentChatId={currentChatId}
            onSelect={selectChat}
            onNew={newChat}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenApps={() => setAppsOpen(true)}
            toast={showToast}
          />
        )}
        <Center
          chatId={currentChatId}
          chats={chats}
          setChats={setChats}
          onCreateChat={(firstTitle) => {
            const id = `c${Date.now().toString(36)}`
            setChats((prev) => [{ id, title: firstTitle, group: 'Today', pinned: false, messages: [] }, ...prev])
            selectChat(id)
            return id
          }}
          settings={settings}
          patchSettings={patchSettings}
          models={models}
          onRefreshModels={refreshModels}
          showVault={showVault}
          setShowVault={setShowVault}
          toast={showToast}
        />
        {showVault && <VaultPanel onClose={() => setShowVault(false)} />}
      </div>

      {settingsOpen && (
        <SettingsModal
          tab={settingsTab}
          setTab={setSettingsTab}
          settings={settings}
          patchSettings={patchSettings}
          models={models}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {appsOpen && <AppsExtensionsModal onClose={() => setAppsOpen(false)} toast={showToast} />}

      {toast && (
        <div role="status" className="pointer-events-none fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-xl border border-line bg-elev px-4 py-2.5 text-sm text-fg shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  )
}

function IconBtn({ label, onClick, active, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 w-7 items-center justify-center rounded-md text-fg2 hover:bg-hover disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent ${active ? 'bg-hover text-fg' : ''}`}
    >
      {children}
    </button>
  )
}

// Window controls: visual in the browser build. The Electron wrapper (roadmap P9) makes them real.
function WinBtn({ label, danger, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex h-10 w-[52px] items-center justify-center text-fg2 ${danger ? 'hover:bg-[#c42b1c] hover:text-white' : 'hover:bg-hover'}`}
    >
      {children}
    </button>
  )
}
