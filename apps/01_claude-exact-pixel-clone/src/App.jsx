import { useCallback, useEffect, useRef, useState } from 'react'
import { SettingsProvider, useSettings } from './context/SettingsContext.jsx'
import { KEYS, load, save, wipeAll } from './lib/storage.js'
import { chatStream, listModels, ping, splitThinking, modelSupportsImages } from './lib/ollama.js'
import { vault, setVaultUrl, capsuleToPromptText } from './lib/vault.js'
import {
  artifactsFromReply,
  artifactInstruction,
  explicitlyAsked,
  makeId,
} from './lib/artifacts.js'
import { demoStream } from './lib/demo.js'

import Sidebar from './components/Sidebar.jsx'
import Center from './components/Center.jsx'
import VaultPanel from './components/VaultPanel.jsx'
import ArtifactPanel from './components/ArtifactPanel.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import AppsExtensionsModal from './components/AppsExtensionsModal.jsx'
import UserMenu from './components/UserMenu.jsx'
import TitleBar from './components/TitleBar.jsx'

/* ────────────────────────────────────────────────────────────────
   Defaults — the chat titles come straight out of screenshot 191547.png
   so a fresh install looks like the spec on first run.
   ──────────────────────────────────────────────────────────────── */
const DAY = 86400000
function defaultChats() {
  const now = Date.now()
  const oct8 = new Date('2026-10-08T20:00:00').getTime()
  const mk = (title, group, ts, i) => ({
    id: `seed-${i}`,
    title,
    group,
    pinned: false,
    projectId: '',
    createdAt: ts,
    updatedAt: ts,
    messages: [],
    artifacts: [],
  })
  return [
    mk('Refining a 5-day workout cycle', 'Oct 8', oct8, 1),
    mk('Identifying charisma type', 'Older', now - 30 * DAY, 2),
    mk('Realme 6i - realme... fix', 'Older', now - 31 * DAY, 3),
    mk('Fix AI generated Facebook picture', 'Older', now - 32 * DAY, 4),
    mk('PSY 101-01W | Unit 1 | Quiz Review', 'Older', now - 33 * DAY, 5),
    mk('STA201 - Elements of Statistics', 'Older', now - 34 * DAY, 6),
    mk('PHY-112, Principles of Physics II', 'Older', now - 35 * DAY, 7),
    mk('CSE220 MID - Data Structure and Algorithms', 'Older', now - 36 * DAY, 8),
    mk('Function: Manage memories...', 'Older', now - 37 * DAY, 9),
  ]
}

const DEFAULT_PROJECTS = [
  { id: 'proj-personal', name: 'Personal' },
  { id: 'proj-uni', name: 'University' },
]

/**
 * Simple, boring system prompt on purpose.
 *
 * The old build seeded a Flappy-Bird example here and qwen2.5:3b latched onto
 * it — every single reply came back as a game (the "Tic Tac Toe loop").
 * No examples, no "you are an expert game developer", nothing to latch onto.
 */
function systemPrompt(userName) {
  return [
    'You are AI ASSistant, a helpful local assistant running on the user\u2019s own machine.',
    `The user's name is ${userName}.`,
    'Answer the question that was actually asked. Be direct and concrete.',
    'Use Markdown (short paragraphs, bullet lists, fenced code blocks with a language tag) when it helps.',
    'Only produce code or build an app when the user explicitly asks for it.',
    'If you do not know something, say so plainly instead of guessing.',
  ].join(' ')
}

/** Effort -> Ollama generation options. Keeps a 3B model on an 8GB box snappy. */
const EFFORT_OPTIONS = {
  Low: { num_predict: 512, temperature: 0.6 },
  Medium: { num_predict: 1024, temperature: 0.7 },
  High: { num_predict: 2048, temperature: 0.8 },
}

function titleFrom(text = '', attachments = []) {
  const t = String(text).replace(/\s+/g, ' ').trim()
  if (t) return t.length > 60 ? t.slice(0, 59).trimEnd() + '…' : t
  const a = attachments[0]
  return a ? `Attachment: ${a.name}` : 'New chat'
}

function friendlyError(err) {
  const msg = String(err?.message || err || '')
  if (/Failed to fetch|NetworkError|ERR_NETWORK|Load failed/i.test(msg)) {
    return 'Could not reach Ollama at 127.0.0.1:11434.'
  }
  if (/aborted/i.test(msg)) return 'Stopped.'
  return msg || 'Something went wrong.'
}

const CORS_HINT =
  'If Ollama is running and this still fails, it is the browser origin check. In a terminal run:  setx OLLAMA_ORIGINS "*"  then restart Ollama (taskkill /F /IM ollama.exe, then ollama serve). start-app.bat sets this for you.'

export default function App() {
  return (
    <SettingsProvider>
      <Shell />
    </SettingsProvider>
  )
}

function Shell() {
  const { settings, update, reset, transcriptClass, fontClass, widthClass } = useSettings()

  const [chats, setChats] = useState(() => load(KEYS.chats, defaultChats()))
  const [projects, setProjects] = useState(() => load(KEYS.projects, DEFAULT_PROJECTS))
  const [currentChatId, setCurrentChatId] = useState(null)

  const [models, setModels] = useState([])
  const [ollamaOk, setOllamaOk] = useState(null)
  const [vaultOk, setVaultOk] = useState(null)

  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState([])
  const [injected, setInjected] = useState([])
  const [vaultHits, setVaultHits] = useState([])
  const [artifactMode, setArtifactMode] = useState(false)
  const [cooking, setCooking] = useState(false)

  const [stream, setStream] = useState(null) // { chatId, messageId }
  const [activeArtifactId, setActiveArtifactId] = useState(null)
  const [ui, setUi] = useState({
    vault: false,
    settings: false,
    apps: false,
    userMenu: false,
    artifacts: false,
    sidebarCollapsed: false,
    settingsTab: 'general',
  })
  const [searchFocus, setSearchFocus] = useState(0)
  const [proxyBase, setProxyBase] = useState(null)
  const bootRef = useRef(false)

  /**
   * The Vite dev server proxies /ollama -> 127.0.0.1:11434 and
   * /vault -> 127.0.0.1:8765. When those are available we use them: the browser
   * then talks same-origin and Ollama's OLLAMA_ORIGINS/CORS check never applies.
   * Otherwise we fall back to a direct connection.
   */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch('/__ai_proxy_ping', { cache: 'no-store' })
        const j = await r.json()
        if (!cancelled && j?.proxy) setProxyBase('/ollama')
      } catch (e) {
        /* static build, or no dev server — direct URLs are used instead */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const ollamaBase = proxyBase ? '/ollama' : settings.ollamaUrl
  const vaultBase = proxyBase ? '/vault' : settings.vaultUrl

  // ?demo=1 switches the offline demo responder on once, for UI testing
  useEffect(() => {
    if (bootRef.current) return
    bootRef.current = true
    try {
      const p = new URLSearchParams(window.location.search)
      if (p.get('demo') === '1') update({ demoMode: true })
    } catch (e) {
      /* ignore */
    }
  }, [update])

  const abortRef = useRef(null)
  const projectRef = useRef('')
  const inputRef = useRef('')
  inputRef.current = input

  /* ── persistence ─────────────────────────────────────── */
  useEffect(() => save(KEYS.chats, chats), [chats])
  useEffect(() => save(KEYS.projects, projects), [projects])
  useEffect(() => setVaultUrl(vaultBase), [vaultBase])

  /* ── service discovery ───────────────────────────────── */
  const refreshServices = useCallback(async () => {
    const p = await ping(ollamaBase)
    setOllamaOk(Boolean(p.ok))
    if (p.ok) {
      try {
        const list = await listModels(ollamaBase)
        setModels(list)
      } catch (e) {
        /* keep whatever we had */
      }
    }
    const vs = await vault.status()
    setVaultOk(Boolean(vs))
  }, [ollamaBase])

  useEffect(() => {
    refreshServices()
  }, [refreshServices])

  // re-check every 20s so a service that comes up later is picked up
  useEffect(() => {
    const id = setInterval(refreshServices, 20000)
    return () => clearInterval(id)
  }, [refreshServices])

  /* ── chat helpers ────────────────────────────────────── */
  const chat = chats.find((c) => c.id === currentChatId) || null
  const messages = chat?.messages ?? []
  const artifacts = chat?.artifacts ?? []
  const artifactCount = chats.reduce((n, c) => n + (c.artifacts?.length || 0), 0)
  const isStreaming = Boolean(stream && stream.chatId === currentChatId)

  const patchMessage = useCallback((chatId, msgId, patch) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m)) }
          : c,
      ),
    )
  }, [])

  const updateChat = useCallback((chatId, mutator) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? mutator(c) : c)))
  }, [])

  /* ── sending ─────────────────────────────────────────── */
  const runSend = useCallback(
    async ({ chatId, history, text, atts, caps, modelOverride }) => {
      const model = modelOverride || settings.model
      const requested = artifactMode || explicitlyAsked(text)
      const assistantId = makeId()
      const userMsg = {
        id: makeId(),
        role: 'user',
        content: text,
        attachments: atts,
        createdAt: Date.now(),
      }
      const assistantMsg = {
        id: assistantId,
        role: 'assistant',
        content: '',
        thinking: '',
        model,
        streaming: true,
        createdAt: Date.now(),
      }

      // 1. optimistic transcript
      setChats((prev) => {
        const idx = prev.findIndex((c) => c.id === chatId)
        const nextMessages = [...history, userMsg, assistantMsg]
        if (idx === -1) {
          return [
            {
              id: chatId,
              title: titleFrom(text, atts),
              group: 'Today',
              pinned: false,
              projectId: projectRef.current || '',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              messages: nextMessages,
              artifacts: [],
            },
            ...prev,
          ]
        }
        const copy = [...prev]
        copy[idx] = {
          ...copy[idx],
          messages: nextMessages,
          updatedAt: Date.now(),
          title: copy[idx].title === 'New chat' ? titleFrom(text, atts) : copy[idx].title,
        }
        return copy
      })

      // 2. capture the turn into the vault (silent, fire-and-forget)
      vault.capture({
        type: 'conversation',
        provider: 'AI ASSistant',
        conversation_id: chatId,
        title: titleFrom(text, atts),
        url: '',
        captured_at: new Date().toISOString(),
        completeness: 'full',
        messages: [{ role: 'user', text, timestamp: new Date().toISOString() }],
      })

      // 3. build the request
      const sys =
        systemPrompt(settings.userName) + (requested ? artifactInstruction() : '')

      const historyMessages = []
      for (const m of history) {
        if (m.error) continue
        let content = m.content || ''
        for (const a of m.attachments || []) {
          if (a.kind !== 'image' && a.text) {
            content += `\n\n[Attached file: ${a.name}]\n${a.text.slice(0, 20000)}`
          }
        }
        if (content.trim()) historyMessages.push({ role: m.role, content })
      }

      let userContent = text
      if (caps?.length) {
        userContent =
          'Relevant memory from my vault:\n\n' +
          caps.map((c) => capsuleToPromptText(c)).join('\n\n---\n\n') +
          '\n\n---\n\n' +
          text
      }
      for (const a of atts) {
        if (a.kind !== 'image' && a.text) {
          userContent += `\n\n[Attached file: ${a.name}]\n${a.text.slice(0, 20000)}`
        }
      }

      const newUser = { role: 'user', content: userContent }
      const images = atts.filter((a) => a.kind === 'image' && a.data)
      let skippedImages = 0
      if (images.length) {
        if (modelSupportsImages(model)) {
          newUser.images = images.map((a) => String(a.data).replace(/^data:[^,]+,/, ''))
        } else {
          skippedImages = images.length
        }
      }

      const apiMessages = [{ role: 'system', content: sys }, ...historyMessages, newUser]

      // 4. stream (real model, or the offline demo responder)
      setStream({ chatId, messageId: assistantId })
      abortRef.current = new AbortController()
      let raw = ''

      const useDemo = settings.demoMode && !ollamaOk
      const streamer = useDemo
        ? ({ onToken, signal }) =>
            demoStream({ prompt: text, userName: settings.userName, onToken, signal })
        : ({ onToken, signal }) =>
            chatStream({
              baseUrl: ollamaBase,
              model,
              messages: apiMessages,
              options: EFFORT_OPTIONS[settings.effort] || EFFORT_OPTIONS.Medium,
              signal,
              onToken,
            })

      try {
        await streamer({
          signal: abortRef.current.signal,
          onToken: (t) => {
            raw += t
            const { thinking, answer } = splitThinking(raw)
            patchMessage(chatId, assistantId, {
              content: answer,
              thinking: settings.thinking === 'Off' ? '' : thinking,
            })
          },
        })

        const { thinking, answer } = splitThinking(raw)
        patchMessage(chatId, assistantId, {
          content: answer,
          thinking: settings.thinking === 'Off' ? '' : thinking,
          streaming: false,
          finishedAt: Date.now(),
        })

        if (skippedImages > 0) {
          patchMessage(chatId, assistantId, {
            content:
              answer +
              `\n\n_${skippedImages} image${skippedImages > 1 ? 's were' : ' was'} not sent: **${model}** does not accept images. Pick a vision model (for example \`qwen3-vl:4b\` or \`llava\`) in the composer._`,
          })
        }

        // 5. artifacts — ONLY when the user asked, or the reply is a complete document
        const found = artifactsFromReply(answer, requested)
        if (found.length) {
          setChats((prev) =>
            prev.map((c) =>
              c.id === chatId ? { ...c, artifacts: [...(c.artifacts || []), ...found] } : c,
            ),
          )
          setActiveArtifactId(found[found.length - 1].id)
          setUi((u) => ({ ...u, artifacts: true }))
        }
      } catch (e) {
        const { thinking, answer } = splitThinking(raw)
        if (e?.name === 'AbortError') {
          patchMessage(chatId, assistantId, {
            content: (answer || '') + (answer ? '\n\n' : '') + '_Stopped._',
            thinking: settings.thinking === 'Off' ? '' : thinking,
            streaming: false,
          })
        } else {
          patchMessage(chatId, assistantId, {
            content: friendlyError(e),
            hint: CORS_HINT,
            error: true,
            streaming: false,
          })
        }
      } finally {
        setStream(null)
        abortRef.current = null
      }
    },
    [
      artifactMode,
      ollamaBase,
      ollamaOk,
      patchMessage,
      settings.demoMode,
      settings.effort,
      settings.model,
      settings.thinking,
      settings.userName,
    ],
  )

  const send = useCallback(() => {
    const text = input.trim()
    if (isStreaming) return
    if (!text && attachments.length === 0) return

    const atts = attachments
    const caps = injected
    const chatId = currentChatId || makeId()
    const history = currentChatId ? (chats.find((c) => c.id === currentChatId)?.messages ?? []) : []

    if (!currentChatId) setCurrentChatId(chatId)

    setInput('')
    setAttachments([])
    setInjected([])
    setVaultHits([])
    setArtifactMode(false) // explicit-only: never let artifact mode leak into the next turn

    runSend({ chatId, history, text, atts, caps })
  }, [attachments, chats, currentChatId, injected, input, isStreaming, runSend])

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const regenerate = useCallback(() => {
    if (!chat || isStreaming) return
    const msgs = chat.messages
    const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant')
    const trimmed = lastAssistant ? msgs.filter((m) => m.id !== lastAssistant.id) : msgs
    const lastUser = [...trimmed].reverse().find((m) => m.role === 'user')
    if (!lastUser) return
    updateChat(chat.id, (c) => ({ ...c, messages: trimmed }))
    runSend({
      chatId: chat.id,
      // drop the old user turn from `history` — runSend re-adds it, so passing
      // it here would show the same message twice
      history: trimmed.filter((m) => m.id !== lastUser.id),
      text: lastUser.content,
      atts: lastUser.attachments || [],
      caps: [],
    })
  }, [chat, isStreaming, runSend, updateChat])

  /* ── attachments ─────────────────────────────────────── */
  const pickFiles = useCallback(async (files, kind) => {
    const out = []
    for (const f of files) {
      const isImage = kind === 'image' || /^image\//.test(f.type)
      const item = { name: f.name, size: f.size, kind: isImage ? 'image' : 'file' }
      try {
        if (isImage) {
          item.data = await readAsDataURL(f)
          item.preview = item.data
        } else {
          item.text = await readAsText(f)
          if (item.text == null) continue
        }
      } catch (e) {
        item.error = 'could not read file'
      }
      out.push(item)
    }
    setAttachments((prev) => [...prev, ...out])
  }, [])

  /* ── vault context suggestions (opt-in, never silent) ── */
  useEffect(() => {
    const text = input.trim()
    if (text.length < 4 || !vaultOk) {
      setVaultHits([])
      return
    }
    const t = setTimeout(async () => {
      const res = await vault.context(text.slice(0, 120), 4)
      setVaultHits(res?.capsules || [])
    }, 600)
    return () => clearTimeout(t)
  }, [input, vaultOk])

  const addHit = useCallback((capsule) => {
    setInjected((prev) => (prev.some((c) => c.id === capsule.id) ? prev : [...prev, capsule]))
    setVaultHits([])
  }, [])

  const dropCapsule = useCallback((capsule) => {
    setInjected((prev) => (prev.some((c) => c.id === capsule.id) ? prev : [...prev, capsule]))
  }, [])

  /* ── Cook This Prompt (Capsule Hub style) ────────────── */
  const cookPrompt = useCallback(async () => {
    const text = input.trim()
    if (!text || cooking) return
    setCooking(true)
    try {
      const ctx = await vault.context(text.slice(0, 160), 4)
      const blocks = (ctx?.capsules || []).map(capsuleToPromptText).join('\n\n---\n\n')
      let out = ''
      await chatStream({
        baseUrl: settings.ollamaUrl,
        model: settings.model,
        messages: [
          {
            role: 'system',
            content:
              'You are a prompt engineer. Rewrite the user\u2019s prompt so it is clearer, more specific and more likely to get a useful answer. Use the vault context only where it is relevant. Reply with the improved prompt ONLY — no preamble, no explanation, no quotes around it.',
          },
          {
            role: 'user',
            content: `Vault context:\n${blocks || '(none)'}\n\nPrompt to improve:\n${text}`,
          },
        ],
        options: { num_predict: 400, temperature: 0.5 },
        onToken: (t) => {
          out += t
        },
      })
      const cleaned = out.trim().replace(/^["'\u201c\u2018]|["'\u201d\u2019]$/g, '')
      if (cleaned) setInput(cleaned)
    } catch (e) {
      /* cooking is a nicety — failing quietly is fine */
    } finally {
      setCooking(false)
    }
  }, [cooking, input, settings.model, settings.ollamaUrl])

  /* ── chat list actions ───────────────────────────────── */
  const newChat = useCallback(() => {
    const id = makeId()
    setChats((prev) => [
      {
        id,
        title: 'New chat',
        group: 'Today',
        pinned: false,
        projectId: projectRef.current || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        artifacts: [],
      },
      ...prev,
    ])
    setCurrentChatId(id)
    setInput('')
    setAttachments([])
    setInjected([])
  }, [])

  const renameChat = useCallback((id, title) => updateChat(id, (c) => ({ ...c, title })), [updateChat])
  const deleteChat = useCallback(
    (id) => {
      setChats((prev) => prev.filter((c) => c.id !== id))
      if (currentChatId === id) setCurrentChatId(null)
    },
    [currentChatId],
  )
  const togglePin = useCallback((id) => updateChat(id, (c) => ({ ...c, pinned: !c.pinned })), [updateChat])
  const moveGroup = useCallback((id, group) => updateChat(id, (c) => ({ ...c, group })), [updateChat])
  const addToProject = useCallback(
    (id, name) => {
      let pid = projects.find((p) => p.name.toLowerCase() === name.toLowerCase())?.id
      if (!pid) {
        pid = makeId()
        setProjects((prev) => [...prev, { id: pid, name }])
      }
      updateChat(id, (c) => ({ ...c, projectId: pid }))
    },
    [projects, updateChat],
  )

  /* ── artifacts ───────────────────────────────────────── */
  const openArtifactFromCode = useCallback(
    (code, lang) => {
      if (!currentChatId) return
      const type = ['svg', 'xml'].includes(lang) ? 'svg' : ['react', 'jsx'].includes(lang) ? 'react' : 'html'
      const title =
        code.match(/<title>([^<]{1,120})<\/title>/i)?.[1]?.trim() ||
        (type === 'svg' ? 'SVG artifact' : 'HTML artifact')
      const art = {
        id: makeId(),
        title,
        type,
        lang,
        content: code,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      }
      setChats((prev) =>
        prev.map((c) => (c.id === currentChatId ? { ...c, artifacts: [...(c.artifacts || []), art] } : c)),
      )
      setActiveArtifactId(art.id)
      setUi((u) => ({ ...u, artifacts: true }))
    },
    [currentChatId],
  )

  const updateArtifact = useCallback(
    (id, content) => {
      if (!currentChatId) return
      updateChat(currentChatId, (c) => ({
        ...c,
        artifacts: (c.artifacts || []).map((a) =>
          a.id === id ? { ...a, content, version: (a.version || 1) + 1, updatedAt: new Date().toISOString() } : a,
        ),
      }))
    },
    [currentChatId, updateChat],
  )

  const deleteArtifact = useCallback(
    (id) => {
      if (!currentChatId) return
      updateChat(currentChatId, (c) => ({ ...c, artifacts: (c.artifacts || []).filter((a) => a.id !== id) }))
    },
    [currentChatId, updateChat],
  )

  /* ── title bar actions ───────────────────────────────── */
  const titleAction = useCallback(
    (id) => {
      switch (id) {
        case 'new-chat':
          newChat()
          break
        case 'new-project': {
          const name = window.prompt('New project name:')
          if (name?.trim()) setProjects((p) => [...p, { id: makeId(), name: name.trim() }])
          break
        }
        case 'clear-chat':
          if (currentChatId && window.confirm('Clear this chat?')) {
            updateChat(currentChatId, (c) => ({ ...c, messages: [], artifacts: [] }))
          }
          break
        case 'toggle-sidebar':
          setUi((u) => ({ ...u, sidebarCollapsed: !u.sidebarCollapsed }))
          break
        case 'toggle-vault':
          setUi((u) => ({ ...u, vault: !u.vault }))
          break
        case 'toggle-artifacts':
          setUi((u) => ({ ...u, artifacts: !u.artifacts }))
          break
        case 'reload':
          window.location.reload()
          break
        case 'search-chats':
          setUi((u) => ({ ...u, sidebarCollapsed: false }))
          setSearchFocus((n) => n + 1)
          break
        case 'latest':
          window.scrollTo({ top: document.body.scrollHeight })
          break
        case 'save-artifact': {
          const art = artifacts.find((a) => a.id === activeArtifactId) || artifacts[artifacts.length - 1]
          if (art) vault.saveArtifact(art).then((r) => window.alert(r?.ok ? 'Saved to vault.' : 'Vault API offline — cannot save.'))
          else window.alert('No artifact in this chat.')
          break
        }
        case 'open-vault':
          vault.status().then((s) => window.alert(s?.vault ? `Vault path:\n${s.vault}` : 'Vault API offline.'))
          break
        case 'ollama-status':
          window.alert(
            ollamaOk
              ? `Ollama reachable at ${settings.ollamaUrl}\nModels: ${models.map((m) => m.name).join(', ')}`
              : `Ollama not reachable at ${settings.ollamaUrl}.\nStart it with: ollama serve\n${CORS_HINT}`,
          )
          break
        case 'vault-status':
          window.alert(
            vaultOk
              ? `Vault API running at ${settings.vaultUrl}`
              : `Vault API offline. Start it with:\nnode server\\vault-api.cjs`,
          )
          break
        case 'docs':
          window.alert('Living docs: 00_LIVING_DOCS/ in the repo — REQUIREMENTS_LIVING.md, HANDOVER_LIVING.md, TODO_NEXT.md, CHANGELOG.md')
          break
        case 'about':
          window.alert(
            'AI ASSistant — local Claude-style desktop app.\nRuns qwen2.5:3b (or any Ollama model) on your own machine, uses an Obsidian vault as memory, no account, nothing leaves the computer.',
          )
          break
        default:
          break
      }
    },
    [activeArtifactId, artifacts, currentChatId, models, newChat, ollamaOk, settings.ollamaUrl, settings.vaultUrl, updateChat, vaultOk],
  )

  /* ── keyboard shortcuts ──────────────────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const k = e.key.toLowerCase()
      if (k === 'b') {
        e.preventDefault()
        setUi((u) => ({ ...u, sidebarCollapsed: !u.sidebarCollapsed }))
      } else if (k === 'j') {
        e.preventDefault()
        setUi((u) => ({ ...u, vault: !u.vault }))
      } else if (k === 'n') {
        e.preventDefault()
        newChat()
      } else if (k === 'a' && e.shiftKey) {
        e.preventDefault()
        setUi((u) => ({ ...u, artifacts: !u.artifacts }))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [newChat])

  /* ── reset ───────────────────────────────────────────── */
  const resetData = useCallback(() => {
    if (!window.confirm('Delete all local chats, artifacts and settings from this browser?')) return
    wipeAll()
    window.location.reload()
  }, [])

  const user = {
    name: settings.userName,
    email: settings.userEmail,
    initials: settings.userInitials,
    plan: settings.plan,
  }

  return (
    <div className="h-full w-full flex flex-col bg-[var(--bg-main)] text-[var(--ink)] overflow-hidden">
      {settings.showMenuBar ? (
        <TitleBar onAction={titleAction} ollamaOk={ollamaOk} vaultOk={vaultOk} />
      ) : null}

      <div className="flex-1 flex min-h-0">
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={setCurrentChatId}
          onNewChat={newChat}
          onRenameChat={renameChat}
          onDeleteChat={deleteChat}
          onTogglePin={togglePin}
          onMoveGroup={moveGroup}
          onAddToProject={addToProject}
          projects={projects}
          artifactCount={artifactCount}
          onOpenArtifacts={() => setUi((u) => ({ ...u, artifacts: !u.artifacts }))}
          onOpenProjects={() => setUi((u) => ({ ...u, settings: true, settingsTab: 'general' }))}
          onOpenCustomize={() => setUi((u) => ({ ...u, settings: true, settingsTab: 'general' }))}
          onOpenUserMenu={() => setUi((u) => ({ ...u, userMenu: !u.userMenu }))}
          userMenuOpen={ui.userMenu}
          collapsed={ui.sidebarCollapsed}
          onToggleCollapse={() => setUi((u) => ({ ...u, sidebarCollapsed: !u.sidebarCollapsed }))}
          user={user}
          searchFocusToken={searchFocus}
        />

        <Center
          chat={chat}
          messages={messages}
          isStreaming={isStreaming}
          streamingId={stream?.messageId}
          transcriptClass={transcriptClass}
          fontClass={fontClass}
          widthClass={widthClass}
          input={input}
          setInput={setInput}
          onSend={send}
          onStop={stop}
          attachments={attachments}
          onPickFiles={pickFiles}
          onRemoveAttachment={(i) => setAttachments((p) => p.filter((_, idx) => idx !== i))}
          injected={injected}
          onRemoveInjected={(id) => setInjected((p) => p.filter((c) => c.id !== id))}
          onDropCapsule={dropCapsule}
          onCookPrompt={cookPrompt}
          cooking={cooking}
          model={settings.model}
          models={models}
          onModelChange={(m) => update({ model: m })}
          effort={settings.effort}
          onEffortChange={(v) => update({ effort: v })}
          thinking={settings.thinking}
          onThinkingChange={(v) => update({ thinking: v })}
          project={chat?.projectId || ''}
          projects={projects}
          onProjectChange={(pid) =>
            currentChatId ? updateChat(currentChatId, (c) => ({ ...c, projectId: pid })) : (projectRef.current = pid)
          }
          onOpenVault={() => setUi((u) => ({ ...u, vault: !u.vault }))}
          onOpenArtifact={openArtifactFromCode}
          onRegenerate={regenerate}
          ollamaOk={ollamaOk}
          onOpenUpgrade={() => setUi((u) => ({ ...u, settings: true, settingsTab: 'account' }))}
          settings={settings}
          artifactMode={artifactMode}
          onToggleArtifactMode={setArtifactMode}
          vaultHits={vaultHits}
          onAddHit={addHit}
        />

        {ui.vault ? (
          <VaultPanel onClose={() => setUi((u) => ({ ...u, vault: false }))} onInsertCapsule={addHit} />
        ) : null}

        {ui.artifacts ? (
          <ArtifactPanel
            artifacts={artifacts}
            activeId={activeArtifactId}
            onSelect={setActiveArtifactId}
            onClose={() => setUi((u) => ({ ...u, artifacts: false }))}
            onUpdate={updateArtifact}
            onDelete={deleteArtifact}
          />
        ) : null}
      </div>

      {ui.userMenu ? (
        <UserMenu
          email={settings.userEmail}
          plan={settings.plan}
          onClose={() => setUi((u) => ({ ...u, userMenu: false }))}
          onNavigate={(id) => {
            if (id === 'settings') setUi((u) => ({ ...u, settings: true, settingsTab: 'general' }))
            else if (id === 'apps') setUi((u) => ({ ...u, apps: true }))
            else if (id === 'upgrade') setUi((u) => ({ ...u, settings: true, settingsTab: 'account' }))
            else if (id === 'language') setUi((u) => ({ ...u, settings: true, settingsTab: 'general' }))
            else if (id === 'keys')
              window.alert('No API keys in the local build — the app talks to your own Ollama server and keeps everything on the machine.')
            else if (id === 'learn')
              window.alert('Living docs: 00_LIVING_DOCS/REQUIREMENTS_LIVING.md and HANDOVER_LIVING.md in the repo.')
            else if (id === 'help')
              window.alert(
                'Ollama: ' +
                  (ollamaOk ? 'connected' : 'offline — run "ollama serve"') +
                  '\nVault API: ' +
                  (vaultOk ? 'connected' : 'offline — run node server\\vault-api.cjs'),
              )
            else if (id === 'logout') window.alert('Local build: there is no account to log out of.')
          }}
        />
      ) : null}

      {ui.settings ? (
        <SettingsModal
          initialTab={ui.settingsTab}
          onClose={() => setUi((u) => ({ ...u, settings: false }))}
          onOpenAppsExtensions={() => setUi((u) => ({ ...u, apps: true }))}
          onOpenVault={() => setUi((u) => ({ ...u, vault: true, settings: false }))}
          onResetData={resetData}
        />
      ) : null}

      {ui.apps ? <AppsExtensionsModal onClose={() => setUi((u) => ({ ...u, apps: false }))} /> : null}
    </div>
  )
}

/* ── file readers ───────────────────────────────────────── */
function readAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsText(file)
  })
}
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}
