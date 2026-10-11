import { useRef, useState } from 'react'
import { newId } from '../lib/storage.js'
import { loadImage, persistAttachments, toOllamaMessages } from '../lib/attachments.js'
import { splitThinking, streamChat, systemPrompt } from '../lib/ollama.js'
import { extractArtifacts, extractLiveSource, wantsArtifact } from '../lib/artifacts.js'
import { vaultPost } from '../lib/vault.js'

export default function useChat({ chats, setChats, currentChat, navigate, models, notify }) {
  const [busyChatId, setBusyChatId] = useState(null)
  const jobRef = useRef(null)
  const chatsRef = useRef(chats)
  const captures = useRef(new Map())
  chatsRef.current = chats
  const patch = (chatId, messageId, update) => setChats(previous => previous.map(chat => chat.id !== chatId ? chat : {
    ...chat, messages: chat.messages.map(message => message.id === messageId ? { ...message, ...update } : message),
  }))
  async function capture(chat) {
    const token = newId()
    captures.current.set(chat.id, token)
    setChats(previous => previous.map(item => item.id === chat.id ? { ...item, vaultStatus: 'saving' } : item))
    try {
      await vaultPost('/capture', {
        type: 'conversation', provider: 'AI ASSistant', conversation_id: chat.id,
        title: chat.title, captured_at: new Date().toISOString(), completeness: chat.messages.at(-1)?.status === 'complete' ? 'full' : 'partial',
        messages: await Promise.all(chat.messages.filter(message => message.content || message.attachments?.length).map(async message => ({
          id: message.id, role: message.role, text: message.content, timestamp: message.timestamp,
          status: message.status, thinking: message.thinking || '', context: message.context || '',
          attachments: await Promise.all((message.attachments || []).map(async file => file.kind === 'image' ? { ...file, data: await loadImage(file) } : file)),
        }))),
      })
      if (captures.current.get(chat.id) === token) setChats(previous => previous.map(item => item.id === chat.id ? { ...item, vaultStatus: 'saved' } : item))
    } catch (error) {
      if (captures.current.get(chat.id) === token) setChats(previous => previous.map(item => item.id === chat.id ? { ...item, vaultStatus: 'error', vaultError: error.message } : item))
    }
  }
  async function send({ content, attachments = [], context = '', artifactMode = false, thinking = false, projectId = null }) {
    if ((!content.trim() && !attachments.length) || jobRef.current) return false
    if (!models.available) { notify(models.error || `The selected model ${models.model} is not installed or Ollama is offline. Open the model selector and refresh.`); return false }
    const existing = chatsRef.current.find(chat => chat.id === currentChat)
    const chatId = existing?.id || newId()
    const controller = new AbortController()
    jobRef.current = { controller, chatId }
    setBusyChatId(chatId)
    try {
      const userMessage = { id: newId(), role: 'user', content: content.trim() || 'Please look at the attached file.', attachments, context, timestamp: new Date().toISOString() }
      const history = [...(existing?.messages || []), userMessage]
      const requested = wantsArtifact(userMessage.content, artifactMode)
      const prompt = systemPrompt(requested)
      const requestMessages = [{ role: 'system', content: prompt }, ...await toOllamaMessages(history, models.capabilities)]
      // Conservative character guard, NOT an exact token counter. Refuse instead
      // of silently dropping old turns from a small 4,096-token local context.
      if (requestMessages.reduce((size, message) => size + message.content.length, 0) > 12_000) {
        throw new Error('This chat and its files/context exceed the conservative 12,000-character budget for the 4,096-token local context. Start a new chat with a smaller capsule. The original transcript is kept.')
      }
      userMessage.attachments = await persistAttachments(attachments)
      const assistant = { id: newId(), role: 'assistant', content: '', thinking: '', status: 'streaming', timestamp: new Date().toISOString(), model: models.model }
      const chat = { ...(existing || { id: chatId, title: userMessage.content.slice(0, 55), date: 'Today', projectId }), messages: [...(existing?.messages || []), userMessage, assistant] }
      setChats(previous => existing ? previous.map(item => item.id === chatId ? chat : item) : [chat, ...previous])
      if (!existing) navigate(chatId)
      // Preserve the submitted source even if the model runs for a long time.
      // Empty streaming placeholders are filtered out by capture().
      void capture(chat)
      // Return once the send is accepted so the composer clears immediately.
      void run(chat, assistant, requestMessages, requested, thinking, controller)
      return true
    } catch (error) {
      jobRef.current = null; setBusyChatId(null); notify(error.message)
      return false // Keep the unsent draft and files available for correction.
    }
  }
  async function run(chat, assistant, requestMessages, requested, thinking, controller) {
    let raw = '', nativeThinking = ''
    let final = { ...assistant }
    const timer = setTimeout(() => controller.abort('timeout'), 300_000)
    try {
      await streamChat({ model: assistant.model, messages: requestMessages,
        ...(models.capabilities.thinking ? { think: Boolean(thinking) } : {}) }, controller.signal, record => {
        raw += record.message?.content || ''
        nativeThinking += record.message?.thinking || ''
        final = { ...final, ...splitThinking(raw, nativeThinking) }
        if (requested) {
          const live = extractLiveSource(raw)
          if (live) final.live = live; else delete final.live
        }
        patch(chat.id, assistant.id, final)
      })
      final.status = 'complete'
      delete final.live
      final.artifacts = extractArtifacts(final.content, { requested, messageId: assistant.id, chatId: chat.id, title: chat.messages.at(-2).content })
    } catch (error) {
      if (controller.signal.aborted) {
        final.status = 'stopped'
        final.error = controller.signal.reason === 'timeout' ? 'Stopped after five minutes. Partial text is kept.' : 'Response stopped. Partial text is kept.'
      } else { final.status = 'error'; final.error = error.message }
    } finally {
      clearTimeout(timer)
      patch(chat.id, assistant.id, final)
      jobRef.current = null; setBusyChatId(null)
      const latest = chatsRef.current.find(item => item.id === chat.id) || chat
      void capture({ ...latest, messages: chat.messages.map(message => message.id === assistant.id ? final : message) })
    }
  }
  return { send, busyChatId, stop: () => jobRef.current?.controller.abort(),
    retryCapture: chat => capture(chat) }
}
