import { useCallback, useMemo, useState } from 'react'
import { DEFAULT_MODEL } from '@shared/lib/storage'
import { DEFAULT_PROFILE, normalizeProfile } from '@shared/lib/profile'
import { DEFAULT_PROFILE_ID } from '@shared/lib/inference'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import ChatView from './components/ChatView'
import useChat from './hooks/useChat'
import useModels from './hooks/useModels'
import usePersistentState from './hooks/usePersistentState'
import { useChats } from './state/useChats'
import { isDemo } from './platform/bridge'

/**
 * The app.
 *
 * One screen so far: the conversation. Everything the interface shows comes from
 * the shared modules — the model list from Ollama's own metadata, search from the
 * library's search, the transcript from the chat hook — so there is no second
 * implementation of anything to drift out of step.
 */
export default function App() {
  // One line of text, not a dialog. A warning the person has to dismiss is a
  // warning they will learn to dismiss without reading.
  const [notice, setNotice] = useState('')

  const chats = useChats(setNotice)
  const [profile] = usePersistentState('ai-assistant.profile', DEFAULT_PROFILE, normalizeProfile, setNotice)
  const [model, setModel] = usePersistentState(
    'ai-assistant.model',
    DEFAULT_MODEL,
    value => (typeof value === 'string' && value.trim() ? value : DEFAULT_MODEL),
    setNotice
  )
  const models = useModels(model, setModel)
  const [draft, setDraft] = useState('')

  const chat = useMemo(
    () => chats.chats.find(entry => entry.id === chats.currentChat) || null,
    [chats.chats, chats.currentChat]
  )

  const navigate = useCallback((chatId: string) => chats.open(chatId), [chats])

  const chatApi = useChat({
    chats: chats.chats,
    setChats: chats.setChats,
    currentChat: chats.currentChat,
    navigate,
    models,
    // The vision bridge is chosen from models that reported vision support. That
    // choice lives in Settings, which is not built yet — so nothing is claimed
    // here, and attaching an image says plainly what is missing.
    vision: { bridgeModel: '' },
    notify: setNotice,
    // Settings > Performance will edit this. Until then the 4 GB profile is the
    // safe default: it is the one that cannot overflow a small card.
    inference: { profile: DEFAULT_PROFILE_ID },
  })

  const send = async (): Promise<void> => {
    const text = draft
    if (!text.trim()) return
    const accepted = await chatApi.send({ content: text })
    // The draft is cleared only when the send was accepted. A refused send keeps
    // the text and every attachment, so nothing has to be typed twice.
    if (accepted) {
      setDraft('')
      setNotice('')
    }
  }

  return (
    <div className="flex h-full flex-col bg-bg text-ink">
      <TitleBar model={models.model} ollamaStatus={models.status} preview={isDemo} />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          chats={chats.chats}
          currentChat={chats.currentChat}
          onOpen={chats.open}
          onNew={() => {
            chats.create()
            setNotice('')
          }}
          onDelete={chats.remove}
          profileName={profile.name}
        />
        <ChatView
          chat={chat}
          draft={draft}
          setDraft={setDraft}
          onSend={() => void send()}
          onStop={chatApi.stop}
          busy={Boolean(chatApi.busyChatId)}
          models={isDemo ? { ...models, error: '' } : models}
          notice={notice}
          preview={
            isDemo
              ? 'Browser preview — this window is the interface only. Models, files and your vault live on your own machine, in the desktop app.'
              : ''
          }
        />
      </div>
    </div>
  )
}
