import React, { useEffect, useRef, useState, useCallback } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Center from './components/Center.jsx'
import TitleBar from './components/TitleBar.jsx'
import FileMenu from './components/FileMenu.jsx'
import UserMenu from './components/UserMenu.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import AppsExtensionsModal from './components/AppsExtensionsModal.jsx'
import ArtifactPanel from './components/ArtifactPanel.jsx'
import VaultPanel from './components/VaultPanel.jsx'
import TodayView from './components/TodayView.jsx'
import { C } from './theme.js'
import { settings, applySettings } from './lib/settings.js'
import { listModels, streamChat } from './lib/ollama.js'
import { vault, captureTurn, cookPrompt } from './lib/vault.js'
import { buildMessages } from './lib/prompt.js'
import { extractArtifacts, userAskedForArtifact } from './lib/artifacts.js'
import { extractThinkingContent } from './lib/thinking-parser.js'

const KEY = 'claude_exact_chats_v2'

/* chat list copied from the user's own sidebar (191547.png) */
const DEFAULT_CHATS = [
  ['Refining a 5-day workout cycle', 'Oct 8'],
  ['Identifying your charisma type', 'Older'],
  ['Repurposing an old Realme 6i phone', 'Older'],
  ['Fix AI-generated Facebook profile picture', 'Older'],
  ['Psychiatric prescription for multiple disorders', 'Older'],
  ['PSY 101 midterm exam preparation and practice', 'Older'],
  ['PSY 101 midterm exam practice set (2)', 'Older'],
  ['STA201 MID', 'Older'],
  ['Creating a new skill', 'Older'],
  ['PHY-112 electrostatics study notes converted', 'Older'],
  ['Hash table search and function implementation', 'Older'],
  ['CSE220 MID', 'Older'],
  ['PSY 101 midterm review round two', 'Older'],
  ['Student-style problem solving approach', 'Older'],
  ['Comprehensive notes from slides', 'Older'],
  ['Constitutional Law overview', 'Older'],
].map(([title, group], i) => ({ id: String(i + 1), title, group, pinned: false, messages: [] }))

export default function App() {
  const [chats, setChats] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
      if (Array.isArray(saved) && saved.length) return saved
    } catch {}
    return DEFAULT_CHATS
  })
  const [currentId, setCurrentId] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [attachments, setAttachments] = useState([]) // {type:'file'|'image', name, text?, b64?}
  const [artifacts, setArtifacts] = useState([])
  const [activeArtifact, setActiveArtifact] = useState(null)

  const [models, setModels] = useState([])
  const [ollamaUp, setOllamaUp] = useState(false)
  const [, force] = useState(0)
  const s = settings.get()

  const [ui, setUi] = useState({
    settings: false, apps: false, userMenu: false, fileMenu: false,
    today: false, vault: false, artifact: false, settingsSection: 'General',
  })
  const open = (k, v = true) => setUi((u) => ({ ...u, [k]: v }))
  const close = (k) => setUi((u) => ({ ...u, [k]: false }))

  const abortRef = useRef(null)
  const fileRef = useRef(null)
  const imgRef = useRef(null)

  const chat = chats.find((c) => c.id === currentId) || null
  const messages = chat?.messages || []

  /* ---------- persistence ---------- */
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(chats)) } catch {} }, [chats])
  useEffect(() => { applySettings(); window.addEventListener('settings-changed', () => { applySettings(); force((n) => n + 1) }); }, [])

  /* ---------- Ollama model list ---------- */
  const refreshModels = useCallback(async () => {
    const r = await listModels()
    setModels(r.models)
    setOllamaUp(r.ok)
    if (r.ok && r.models.length && !r.models.some((m) => m.name === settings.get().model)) {
      const hasDefault = r.models.some((m) => m.name.startsWith('qwen2.5:3b'))
      if (hasDefault) settings.set({ model: 'qwen2.5:3b' })
    }
  }, [])
  useEffect(() => { refreshModels(); const t = setInterval(refreshModels, 30000); return () => clearInterval(t) }, [refreshModels])

  /* ---------- chat helpers ---------- */
  const patchChat = (id, fn) => setChats((prev) => prev.map((c) => (c.id === id ? fn(c) : c)))

  const newChat = () => {
    const id = Date.now().toString()
    setChats((prev) => [{ id, title: 'New chat', group: 'Oct 8', pinned: false, messages: [] }, ...prev])
    setCurrentId(id)
    setInput('')
    setArtifacts([]); setActiveArtifact(null)
  }
  const selectChat = (id) => {
    setCurrentId(id)
    const c = chats.find((x) => x.id === id)
    setArtifacts(c?.artifacts || [])
    setActiveArtifact(null)
    close('artifact')
  }
  const renameChat = (id, title) => title?.trim() && patchChat(id, (c) => ({ ...c, title: title.trim() }))
  const deleteChat = (id) => {
    setChats((prev) => prev.filter((c) => c.id !== id))
    if (currentId === id) setCurrentId(null)
  }
  const togglePin = (id) => patchChat(id, (c) => ({ ...c, pinned: !c.pinned }))
  const moveToGroup = (id, group) => patchChat(id, (c) => ({ ...c, group }))
  const openInNewWindow = (c) => {
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    const body = (c.messages || []).map((m) => `<p><b>${m.role}</b><br>${String(m.content || '').replace(/</g, '&lt;')}</p>`).join('')
    w.document.write(`<html><body style="background:#1a1a1a;color:#e8e6e3;font:14px system-ui;padding:24px">
      <h2>${c.title}</h2>${body || '<i>No messages yet.</i>'}</body></html>`)
    w.document.close()
  }

  /* ---------- attachments ---------- */
  const onFiles = async (e, kind) => {
    const files = [...e.target.files]
    for (const f of files) {
      if (kind === 'image') {
        const b64 = await new Promise((res) => {
          const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.readAsDataURL(f)
        })
        setAttachments((a) => [...a, { type: 'image', name: f.name, b64 }])
      } else {
        const text = await f.text().catch(() => '')
        setAttachments((a) => [...a, { type: 'file', name: f.name, text: text.slice(0, 8000) }])
      }
    }
    e.target.value = ''
  }

  /* ---------- Cook This Prompt ---------- */
  const cook = async () => {
    const r = await cookPrompt(input || messages[messages.length - 1]?.content || '')
    setInput(r.prompt)
    window.dispatchEvent(new CustomEvent('toast', { detail: r.note }))
  }

  /* ---------- send ---------- */
  const send = async () => {
    const prompt = input.trim()
    if (!prompt || loading) return
    if (!ollamaUp) {
      setInput('')
      pushMsg(null, { role: 'assistant', content: `Ollama is not reachable at ${settings.get().ollamaUrl || '127.0.0.1:11434'}.\nStart Ollama (start-app.bat does this for you) and check Settings → General → Ollama URL.`, id: Date.now().toString() })
      return
    }

    let id = currentId
    if (!id) {
      id = Date.now().toString()
      const title = prompt.slice(0, 48)
      setChats((prev) => [{ id, title, group: 'Oct 8', pinned: false, messages: [] }, ...prev])
      setCurrentId(id)
    }
    const chatId = id

    const images = attachments.filter((a) => a.type === 'image').map((a) => a.b64)
    const files = attachments.filter((a) => a.type === 'file')
    let text = prompt
    if (files.length) {
      text += '\n\n' + files.map((f) => `--- ${f.name} ---\n${f.text}`).join('\n\n')
    }

    const userMsg = { role: 'user', content: prompt, id: Date.now().toString(), ts: new Date().toISOString(), images }
    const assistantId = (Date.now() + 1).toString()
    const history = chats.find((c) => c.id === chatId)?.messages || []

    patchChat(chatId, (c) => ({
      ...c,
      title: c.messages.length === 0 ? prompt.slice(0, 48) : c.title,
      messages: [...(c.messages || []), userMsg, { role: 'assistant', content: '', id: assistantId, streaming: true }],
    }))
    setInput(''); setAttachments([])
    setLoading(true)

    const askArtifact = userAskedForArtifact(text)
    const ctx = await vault.context(text.slice(0, 160)).catch(() => null)
    let vaultInjection = ''
    if (ctx?.capsules?.length) {
      vaultInjection = '\n\nRelevant memory from my AI-Brain vault:\n' +
        ctx.capsules.slice(0, 3).map((c) => `- ${c.title}: ${String(c.background || '').replace(/\s+/g, ' ').slice(0, 200)}`).join('\n')
    }

    const controller = new AbortController()
    abortRef.current = controller
    let raw = ''
    let finalThinking = ''
    let finalContent = ''
    let finalArtifacts = []

    try {
      await streamChat({
        model: settings.get().model,
        messages: buildMessages({ history, prompt: text + vaultInjection, images }),
        signal: controller.signal,
        onToken: (_tok, full) => {
          raw = full
          const t = extractThinkingContent(full)
          const visible = t.thinking && !/<think>\s*$/.test(full)
            ? t.response
            : (full.includes('<think>') ? '' : full)
          finalThinking = t.thinking || ''
          patchChat(chatId, (c) => ({
            ...c,
            messages: (c.messages || []).map((m) =>
              m.id === assistantId ? { ...m, content: visible, thinking: t.thinking || undefined, streaming: true } : m),
          }))
        },
      })

      const t = extractThinkingContent(raw)
      finalThinking = t.thinking || ''
      const { artifacts: arts, clean } = extractArtifacts(t.response, askArtifact)
      finalContent = clean || t.response
      finalArtifacts = arts

      patchChat(chatId, (c) => ({
        ...c,
        messages: (c.messages || []).map((m) =>
          m.id === assistantId ? { ...m, content: finalContent, thinking: finalThinking || undefined, streaming: false, artifacts: arts.map((a) => a.id) } : m),
        artifacts: [...(c.artifacts || []), ...arts],
      }))
      if (arts.length) {
        setArtifacts((prev) => [...prev, ...arts])
        setActiveArtifact(arts[0]); open('artifact')
      }
      captureTurn(chats.find((c) => c.id === chatId)?.title || prompt, [...history, userMsg, { role: 'assistant', content: finalContent }])
    } catch (e) {
      if (e.name !== 'AbortError') {
        patchChat(chatId, (c) => ({
          ...c,
          messages: (c.messages || []).map((m) =>
            m.id === assistantId ? { ...m, content: `Error talking to Ollama: ${e.message}`, streaming: false } : m),
        }))
      }
    } finally {
      setLoading(false); abortRef.current = null
    }
  }

  function pushMsg(id, msg) {
    const target = id || currentId
    if (!target) { newChat(); return }
    patchChat(target, (c) => ({ ...c, messages: [...(c.messages || []), msg] }))
  }

  const stop = () => abortRef.current?.abort()

  /* ---------- drop a capsule into the composer ---------- */
  const onDrop = (e) => {
    e.preventDefault()
    const t = e.dataTransfer.getData('text/plain')
    if (t) setInput((v) => (v ? v + '\n\n' + t : t))
  }

  const modelLabel = s.model === 'qwen2.5:3b' ? 'Sonnet 5.5' : s.model
  const eff = ['Low', 'Medium', 'High']
  const mem = ['Manual', 'Auto']

  return (
    <div
      className="relative h-screen w-screen flex overflow-hidden"
      style={{ background: C.appBg, color: C.text, fontFamily: 'Inter, system-ui, sans-serif' }}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <Sidebar
        chats={chats}
        currentChatId={currentId}
        onSelect={selectChat}
        onCreate={newChat}
        onRename={renameChat}
        onDelete={deleteChat}
        onTogglePin={togglePin}
        onOpenWindow={openInNewWindow}
        onMoveToGroup={moveToGroup}
        onOpenUserMenu={() => open('userMenu')}
        onOpenFileMenu={() => open('fileMenu')}
        onToggleVault={() => setUi((u) => ({ ...u, vault: !u.vault }))}
        showVault={ui.vault}
        artifactsCount={artifacts.length}
        onOpenArtifacts={() => { if (artifacts.length) { setActiveArtifact(artifacts[0]); open('artifact') } }}
      />

      <Center
        messages={messages}
        input={input} setInput={setInput}
        onSend={send} onStop={stop} loading={loading}
        models={models} model={s.model} onModel={(m) => { settings.set({ model: m }); force((n) => n + 1) }}
        effort={s.effort} onEffort={() => settings.set({ effort: eff[(eff.indexOf(s.effort) + 1) % eff.length] })}
        memory={s.memory} onMemory={() => settings.set({ memory: mem[(mem.indexOf(s.memory) + 1) % mem.length] })}
        onAttach={() => fileRef.current?.click()}
        onImage={() => imgRef.current?.click()}
        onCook={cook}
        attachments={attachments}
        artifacts={artifacts}
        onOpenArtifact={(a) => { setActiveArtifact(a); open('artifact') }}
        onUpgrade={() => open('apps')}
        modelLabel={modelLabel}
      />

      {ui.artifact && activeArtifact && (
        <ArtifactPanel
          artifact={activeArtifact}
          artifacts={artifacts}
          onSelect={setActiveArtifact}
          onClose={() => close('artifact')}
        />
      )}

      {ui.vault && (
        <VaultPanel
          onClose={() => close('vault')}
          onInject={(t) => setInput((v) => (v ? v + '\n\n' + t : t))}
          onOpenToday={() => open('today')}
        />
      )}

      <TitleBar />

      {ui.fileMenu && <FileMenu onClose={() => close('fileMenu')} onAction={(m, i) => {
        if (i === 'Settings') open('settings')
        if (i === 'New chat') newChat()
        if (i === 'Toggle sidebar') window.dispatchEvent(new CustomEvent('toast', { detail: 'Sidebar toggle: not in web build' }))
        if (i === 'Toggle vault panel') setUi((u) => ({ ...u, vault: !u.vault }))
        if (i === 'Today') open('today')
      }} />}

      {ui.userMenu && (
        <UserMenu
          onClose={() => close('userMenu')}
          onSettings={() => { close('userMenu'); open('settings') }}
          onApps={() => { close('userMenu'); open('apps') }}
          onLogout={() => { close('userMenu'); window.dispatchEvent(new CustomEvent('toast', { detail: 'Local-only app — there is no account to log out of.' })) }}
        />
      )}

      {ui.settings && (
        <SettingsModal
          section={ui.settingsSection}
          onSection={(sec) => setUi((u) => ({ ...u, settingsSection: sec }))}
          onClose={() => close('settings')}
          models={models}
          model={s.model}
          onModel={(m) => { settings.set({ model: m }); force((n) => n + 1) }}
          onOpenApps={() => { close('settings'); open('apps') }}
        />
      )}

      {ui.apps && <AppsExtensionsModal onClose={() => close('apps')} />}
      {ui.today && (
        <TodayView
          onClose={() => close('today')}
          onAsk={(q) => { close('today'); setInput(q); if (!currentId) newChat(); }}
        />
      )}

      <input ref={fileRef} type="file" multiple hidden onChange={(e) => onFiles(e, 'file')} />
      <input ref={imgRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e, 'image')} />

      <StatusBar ollamaUp={ollamaUp} model={s.model} />
    </div>
  )
}

function StatusBar({ ollamaUp, model }) {
  const [toast, setToast] = useState('')
  useEffect(() => {
    const h = (e) => { setToast(e.detail || ''); setTimeout(() => setToast(''), 3200) }
    window.addEventListener('toast', h)
    return () => window.removeEventListener('toast', h)
  }, [])
  return (
    <>
      <div
        className="absolute bottom-[6px] right-[10px] text-[10.5px] flex items-center gap-[6px] pointer-events-none"
        style={{ color: C.text3 }}
      >
        <span className="rounded-full" style={{
          width: 6, height: 6, background: ollamaUp ? '#5ac37d' : '#c46a5a', display: 'inline-block',
        }} />
        Ollama {ollamaUp ? 'connected' : 'offline'} · {model}
      </div>
      {toast && (
        <div className="absolute bottom-[26px] left-1/2 -translate-x-1/2 rounded-[8px] px-[12px] py-[7px] text-[12px] shadow-2xl"
          style={{ background: '#2a2a29', border: '1px solid #3a3a39', color: C.text2 }}>
          {toast}
        </div>
      )}
    </>
  )
}
