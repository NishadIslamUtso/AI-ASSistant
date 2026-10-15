import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PanelRightOpen } from 'lucide-react'
import { DEFAULT_MODEL } from '@shared/lib/storage'
import { DEFAULT_PROFILE, normalizeProfile } from '@shared/lib/profile'
import TitleBar from './components/TitleBar'
import ArtifactsRail from './components/ArtifactsRail'
import { chatArtifacts } from './state/artifactView'
import { restoredInPlace, withNewVersion } from './state/artifactEdits'
import type { Artifact } from '@shared/types'
import type { ElementPick } from '@shared/lib/artifacts'
import Sidebar from './components/Sidebar'
import { type View } from './components/AppNav'
import ChatView from './components/ChatView'
import { engineStore } from '@/state/engine'
import ArtifactsView from './components/ArtifactsView'
import TodayView from './components/TodayView'
import ProjectsView from './components/ProjectsView'
import FirstRunView from './components/FirstRunView'
import VaultView from './components/VaultView'
import CodeView from './components/CodeView'
import useArtifactLibrary, { adoptionRecords } from './state/artifactLibrary'
import type { ArtifactSummary } from '../../main/artifacts/store'
import useChat from './hooks/useChat'
import useArtifactRewrite from './hooks/useArtifactRewrite'
import useModels from './hooks/useModels'
import usePersistentState from './hooks/usePersistentState'
import useVault from './hooks/useVault'
import SettingsView from './components/SettingsView'
import MemoryMap from './components/MemoryMap'
import {
  APPEARANCE_KEY,
  DEFAULT_APPEARANCE,
  applyAppearance,
  normalizeAppearance,
} from './state/appearance'
import { DEFAULT_INFERENCE, INFERENCE_KEY, normalizeInference } from './state/performance'
import { useChats } from './state/useChats'
import { bridge, isDemo } from './platform/bridge'
import { DEFAULT_PERMISSIONS, normalizePermissions, type Permissions } from '@shared/lib/permissions'
import { vaultPost } from '@shared/lib/vault'
import { conversationCapture } from '@shared/lib/capture'

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
  const [profile, setProfile] = usePersistentState('ai-assistant.profile', DEFAULT_PROFILE, normalizeProfile, setNotice)
  const [welcomed, setWelcomed] = usePersistentState('ai-assistant.welcomed', false, (value) => value === true, setNotice)
  const [model, setModel] = usePersistentState(
    'ai-assistant.model',
    DEFAULT_MODEL,
    value => (typeof value === 'string' && value.trim() ? value : DEFAULT_MODEL),
    setNotice
  )
  /**
   * What each agent may do, as the main process holds it. Read when the window
   * opens and re-read after Settings writes, because the main process is what
   * enforces them: this is a copy of the record, never the record itself.
   */
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS)
  const [permissionsRevision, setPermissionsRevision] = useState(0)
  const models = useModels(model, setModel, permissions)
  const [draft, setDraft] = useState('')
  const [engineOn, setEngineOn] = useState(false)
  // Set for a moment when the rail jumps to an artifact, so a click on something
  // already on screen still shows that it did something.
  const [highlight, setHighlight] = useState('')

  const chat = useMemo(
    () => chats.chats.find(entry => entry.id === chats.currentChat) || null,
    [chats.chats, chats.currentChat]
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [memoryOpen, setMemoryOpen] = useState(false)
  /** The project a brand-new chat will belong to, chosen before its first word. */
  const [pendingProject, setPendingProject] = useState<string | null>(null)
  // Which screen is showing, remembered so the app opens where it was left.
  const [view, setView] = usePersistentState<View>(
    'ai-assistant.view',
    'chat',
    value => (value === 'artifacts' ? 'artifacts' : 'chat')
  )
  const [artifactQuery, setArtifactQuery] = useState('')
  const [libraryNote, setLibraryNote] = useState('')
  // The right-hand rail of this conversation's artifacts collapses, like the sidebar.
  const [railOpen, setRailOpen] = usePersistentState('ai-assistant.artifact-rail', true, value => value !== false)
  // Bumped when Settings moves the vault, so the chip and the dialog both re-read it.
  const [vaultRevision, setVaultRevision] = useState(0)
  // Re-checked whenever the current conversation is kept or the vault moves: a
  // vault that has gone missing shows as a chip rather than as a save that
  // quietly did not happen.
  const vault = useVault(`${chat?.vaultStatus || ''}:${vaultRevision}`)

  // Interface preferences live in this window's storage, not the machine's
  // settings file: they are about how the app reads rather than where your
  // work is, so they also work in the browser preview.
  const [appearance, setAppearance] = usePersistentState(
    APPEARANCE_KEY,
    DEFAULT_APPEARANCE,
    normalizeAppearance,
    setNotice
  )
  const [inference, setInference] = usePersistentState(
    INFERENCE_KEY,
    DEFAULT_INFERENCE,
    normalizeInference,
    setNotice
  )

  useEffect(() => {
    applyAppearance(appearance)
  }, [appearance])

  useEffect(() => {
    let cancelled = false
    bridge.settings
      .read()
      .then(settings => {
        if (!cancelled) setPermissions(normalizePermissions(settings?.permissions))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [permissionsRevision])

  const navigate = useCallback(
    (chatId: string) => {
      setPendingProject(null)
      chats.open(chatId)
    },
    [chats],
  )

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
    // What Settings > Performance chose. Left alone it is the 4 GB profile:
    // the one that cannot overflow a small card.
    inference,
    // Where finished conversations are kept. In the browser preview there is no
    // vault behind the interface, so nothing is attempted and no failed request
    // appears in the console — the preview stays quiet, as it must.
    // Nothing is attempted when keeping conversations is switched off, so nothing
    // fails and no request appears anywhere: the switch is the whole behaviour.
    capture: isDemo
      ? undefined
      : chat => {
          // The library is the app's own record, and it is fed every time a turn
          // ends. `save` reports `unchanged` for a document that has not moved,
          // so a chat that produced nothing new writes nothing.
          for (const record of adoptionRecords(chat.messages, chat.id)) {
            void bridge.artifacts.save({
              id: record.id,
              title: record.title,
              type: record.type,
              content: record.content,
              chatId: record.chatId,
              messageId: record.messageId,
            })
          }
          if (!permissions.keepConversations) return Promise.resolve(undefined)
          return vaultPost('/capture', conversationCapture(chat)).then(() => undefined)
        },
  })

  const artifacts = useMemo(
    () => chatArtifacts(chat?.messages || []),
    [chat?.messages]
  )

  /** The library, loaded when the Artifacts screen is showing. */
  const library = useArtifactLibrary(view === 'artifacts' || view === 'today')

  /**
   * Artifacts already sitting in saved conversations are written into the
   * library once, the first time the screen opens — so it starts with what this
   * app has actually made rather than empty, without asking and without changing
   * a single conversation.
   */
  const adopted = useRef(false)
  useEffect(() => {
    if (view !== 'artifacts' || adopted.current || library.loading || library.error) return
    adopted.current = true
    const records = chats.chats.flatMap(entry => adoptionRecords(entry.messages, entry.id))
    if (!records.length) {
      setLibraryNote('')
      return
    }
    void library.adopt(records).then(count => {
      if (count) setLibraryNote(`${count} artifact${count === 1 ? '' : 's'} already in your conversations were added to the library.`)
    })
  }, [view, library, chats.chats])

  useEffect(() => {
    if (!highlight) return
    const timer = setTimeout(() => setHighlight(''), 1600)
    return () => clearTimeout(timer)
  }, [highlight])

  /** From the library back to the conversation and the message that made it. */
  const openArtifactInChat = (item: ArtifactSummary): void => {
    if (!item.chatId) {
      setNotice('That artifact was not made in a chat, so there is no conversation to open.')
      return
    }
    if (!chats.chats.some(entry => entry.id === item.chatId)) {
      setNotice('The conversation that made this artifact is no longer in the list.')
      return
    }
    setView('chat')
    chats.open(item.chatId)
    setNotice('')
    // The card is scrolled to once the chat has had a frame to render.
    setTimeout(() => jumpToArtifact(item.id), 120)
  }

  const jumpToArtifact = (artifactId: string): void => {
    setHighlight(artifactId)
    document
      .getElementById(`artifact-${artifactId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const rewrite = useArtifactRewrite({
    model: models.model,
    available: models.available,
    inference,
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
    // Engine mode: the text is a work order, not a chat message. The same
    // keep-the-draft-on-refusal rule applies, so nothing is ever typed twice.
    if (engineOn) {
      const answer = await engineStore().send(text)
      if (answer.ok) {
        setDraft('')
        setNotice('')
      } else {
        setNotice(answer.answer)
      }
      return
    }
    const accepted = await chatApi.send({ content: text, projectId: pendingProject })
    if (accepted) setPendingProject(null)
    // The draft is cleared only when the send was accepted. A refused send keeps
    // the text and every attachment, so nothing has to be typed twice.
    if (accepted) {
      setDraft('')
      setNotice('')
    }
  }

  if (!welcomed) {
    return <FirstRunView onFinish={() => setWelcomed(true)} onName={(name) => setProfile({ ...profile, name })} />
  }

  return (
    <div className="flex h-full flex-col bg-bg text-ink">
      <TitleBar
        model={models.model}
        ollamaStatus={models.status}
        preview={isDemo}
        // Re-checked when a conversation is kept, so a vault that went missing
        // shows up as a chip rather than as a save that silently did not happen.
        // With keeping switched off the chip says so, because a green "Vault"
        // while nothing is written would be the one kind of lie this app forbids.
        vault={permissions.keepConversations ? vault : { ...vault, state: 'off' }}
      />
      {/* Settings fills this row rather than the whole window, so the app keeps
          its own header and the operating system keeps the window frame. */}
      <div className="relative flex min-h-0 flex-1">
        <Sidebar
          view={view}
          onView={setView}
          artifactQuery={artifactQuery}
          onArtifactQuery={setArtifactQuery}
          artifactCount={library.items.length}
          chats={chats.chats}
          currentChat={chats.currentChat}
          onOpen={chats.open}
          onNew={() => {
            chats.create()
            setNotice('')
          }}
          onDelete={chats.remove}
          onOpenSettings={() => {
            setMemoryOpen(false)
            setSettingsOpen(true)
          }}
          onOpenMemory={() => setMemoryOpen(true)}
          profileName={profile.name}
        />
        {view === 'code' ? <CodeView /> : view === 'vault' ? (
          <VaultView
            onAddToComposer={(path, content) => {
              // A note becomes context: quoted, capped, and named — never a
              // silent paste of a whole file into the draft.
              const quoted = content.length > 4000 ? `${content.slice(0, 4000)}\n… (the rest stays in ${path})` : content
              setDraft(previous => (previous ? `${previous}\n\nFrom the vault (${path}):\n${quoted}\n` : `From the vault (${path}):\n${quoted}\n`))
              setView('chat')
              setNotice(`${path} added to the composer`)
            }}
          />
        ) : view === 'projects' ? (
          <ProjectsView
            chats={chats.chats}
            onOpenChat={chats.open}
            onNewChatInProject={(projectId) => {
              setPendingProject(projectId)
              chats.create()
              setView('chat')
              setNotice('')
            }}
            onWorkHere={(folder) => {
              void bridge.engine.setWorkspace(folder).then((answer) => {
                setNotice(answer.ok ? `The engine now works in ${folder}` : answer.answer)
              })
            }}
          />
        ) : view === 'today' ? (
          <TodayView
            chats={chats.chats}
            artifacts={library.items}
            artifactsLoading={library.loading}
            onOpenChat={chats.open}
            onNew={() => {
              chats.create()
              setView('chat')
              setNotice('')
            }}
            onView={setView}
          />
        ) : view === 'artifacts' ? (
          <ArtifactsView
            items={library.items}
            loading={library.loading}
            error={library.error}
            where={library.where}
            query={artifactQuery}
            note={libraryNote}
            onRename={library.rename}
            onDuplicate={library.duplicate}
            onRemove={library.remove}
            onRestore={library.restore}
            onImport={library.importFile}
            onOpenInChat={openArtifactInChat}
          />
        ) : (
        <ChatView
          chat={chat}
          draft={draft}
          setDraft={setDraft}
          onSend={() => void send()}
          engineOn={engineOn}
          onEngineToggle={() => setEngineOn(value => !value)}
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
        )}
        {view === 'chat' && artifacts.length > 0 && railOpen ? (
          <ArtifactsRail
            items={artifacts}
            onJump={item => jumpToArtifact(item.id)}
            onClose={() => setRailOpen(false)}
          />
        ) : null}
        {view === 'chat' && artifacts.length > 0 && !railOpen ? (
          <button
            type="button"
            onClick={() => setRailOpen(true)}
            aria-label="Show the artifacts panel"
            title="Show this conversation's artifacts"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-card text-muted transition-colors hover:text-ink"
          >
            <PanelRightOpen size={14} />
          </button>
        ) : null}

        {/* What was read and when, from the vault. One surface at a time: opening
            the map closes Settings, so the window is never two overlays deep. */}
        <MemoryMap
          open={memoryOpen && !settingsOpen}
          onClose={() => setMemoryOpen(false)}
        />

        <SettingsView
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          permissions={permissions}
          onPermissionsChange={(next: Permissions) => {
            setPermissions(next)
            // Re-read from the main process, so what the window shows is what the
            // machine recorded rather than what this component hoped for.
            setPermissionsRevision(revision => revision + 1)
          }}
          vault={vault}
          onChanged={() => setVaultRevision(revision => revision + 1)}
          appearance={appearance}
          onAppearanceChange={setAppearance}
          inference={inference}
          onInferenceChange={setInference}
          models={models}
        />
      </div>
    </div>
  )
}
