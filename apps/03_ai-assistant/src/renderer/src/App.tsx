import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_MODEL } from '@shared/lib/storage'
import { DEFAULT_PROFILE, normalizeProfile } from '@shared/lib/profile'
import { DEFAULT_PROFILE_ID } from '@shared/lib/inference'
import TitleBar from './components/TitleBar'
import ArtifactsRail from './components/ArtifactsRail'
import { chatArtifacts } from './state/artifactView'
import { restoredInPlace, withNewVersion } from './state/artifactEdits'
import type { Artifact } from '@shared/types'
import type { ElementPick } from '@shared/lib/artifacts'
import Sidebar from './components/Sidebar'
import ChatView from './components/ChatView'
import useChat from './hooks/useChat'
import useArtifactRewrite from './hooks/useArtifactRewrite'
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
  // Set for a moment when the rail jumps to an artifact, so a click on something
  // already on screen still shows that it did something.
  const [highlight, setHighlight] = useState('')

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

  const artifacts = useMemo(
    () => chatArtifacts(chat?.messages || []),
    [chat?.messages]
  )

  useEffect(() => {
    if (!highlight) return
    const timer = setTimeout(() => setHighlight(''), 1600)
    return () => clearTimeout(timer)
  }, [highlight])

  const jumpToArtifact = (artifactId: string): void => {
    setHighlight(artifactId)
    document
      .getElementById(`artifact-${artifactId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const rewrite = useArtifactRewrite({
    model: models.model,
    available: models.available,
    inference: { profile: DEFAULT_PROFILE_ID },
  })

  /**
   * Replace an artifact on a message. Both the rewrite and the restore go through
   * here, so there is exactly one place in the app that edits a document — and it
   * can only ever append a version (see artifactEdits).
   */
  const replaceArtifact = (messageId: string, artifactId: string, next: Artifact): void => {
    chats.setChats(previous =>
      previous.map(entry =>
        entry.id !== chats.currentChat
          ? entry
          : {
              ...entry,
              messages: entry.messages.map(message =>
                message.id !== messageId
                  ? message
                  : {
                      ...message,
                      artifacts: (message.artifacts || []).map(artifact =>
                        artifact.id === artifactId ? next : artifact
                      ),
                    }
              ),
            }
      )
    )
  }

  /** Which message holds an artifact, so an edit can be written back to the right
   *  place even when the card is showing an older version of the same file. */
  const findArtifact = (artifactId: string): { messageId: string; artifact: Artifact } | null => {
    for (const message of chat?.messages || []) {
      const found = (message.artifacts || []).find(artifact => artifact.id === artifactId)
      if (found) return { messageId: message.id, artifact: found }
    }
    return null
  }

  const runRewrite = async ({
    artifact,
    source,
    pick,
    comment,
  }: {
    artifact: Artifact
    source: string
    pick: ElementPick
    comment: string
  }): Promise<boolean> => {
    const next = await rewrite.rewrite({ artifact, source, pick, comment })
    if (!next) return false
    const found = findArtifact(artifact.id)
    // A no-op rewrite comes back as the same artifact, and withNewVersion returns
    // it unchanged rather than inventing a version for it.
    if (found) replaceArtifact(found.messageId, artifact.id, withNewVersion(found.artifact, next, comment.trim().slice(0, 60)))
    setNotice('')
    return true
  }

  const restoreVersion = (artifactId: string, index: number): void => {
    const found = findArtifact(artifactId)
    if (!found) return
    try {
      replaceArtifact(found.messageId, artifactId, restoredInPlace(found.artifact, index))
    } catch (failure) {
      setNotice((failure as Error).message)
    }
  }

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
          live={chatApi.live}
          highlightId={highlight}
          notice={notice}
          onRewrite={runRewrite}
          onRestore={(artifact, index) => restoreVersion(artifact.id, index)}
          busyArtifactId={rewrite.busyId || ''}
          rewriteStage={rewrite.stage}
          rewriteError={rewrite.error}
          rewriteErrorFor={rewrite.errorFor}
          preview={
            isDemo
              ? 'Browser preview — this window is the interface only. Models, files and your vault live on your own machine, in the desktop app.'
              : ''
          }
        />
        {artifacts.length > 0 ? (
          <ArtifactsRail
            items={artifacts}
            onJump={item => jumpToArtifact(item.id)}
          />
        ) : null}
      </div>
    </div>
  )
}
