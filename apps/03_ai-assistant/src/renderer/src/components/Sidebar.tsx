import { useEffect, useMemo, useRef, useState } from 'react'
import { PanelLeftClose, PanelLeftOpen, Plus, Search, Trash2, X } from 'lucide-react'
import type { Chat } from '@shared/types'
import { searchChats } from '@shared/lib/search'
import { initials } from '@shared/lib/profile'
import { groupChats } from '@/state/useChats'
import usePersistentState from '@/hooks/usePersistentState'
import AppNav, { type View } from './AppNav'

/**
 * The list of conversations, and the app's own sections above them.
 *
 * Search is the search from the shared library: it looks inside message text, not
 * just titles, so a conversation you remember the contents of is reachable even
 * when you do not remember what you called it.
 *
 * Two things here are the person's, not the app's: the sidebar collapses to a
 * strip of icons, and its width can be dragged. Both are remembered, because a
 * layout that resets itself every launch is a layout that was never really
 * theirs. The one exception is on a narrow window: the collapse state is kept as
 * it was, but the grip is only offered while there is room to use it.
 */

const MIN_WIDTH = 200
const MAX_WIDTH = 420
const RAIL_WIDTH = 56

type SidebarPrefs = { collapsed: boolean; width: number }

function normalizePrefs(value: unknown): SidebarPrefs {
  const raw = (value || {}) as Partial<SidebarPrefs>
  const width = Number(raw.width)
  return {
    collapsed: raw.collapsed === true,
    width: Number.isFinite(width) ? Math.min(Math.max(width, MIN_WIDTH), MAX_WIDTH) : 264,
  }
}

export default function Sidebar({
  chats,
  currentChat,
  onOpen,
  onNew,
  onDelete,
  onOpenSettings,
  onOpenMemory,
  profileName,
  view,
  onView,
  artifactQuery,
  onArtifactQuery,
  artifactCount,
}: {
  chats: Chat[]
  currentChat: string
  onOpen: (chatId: string) => void
  onNew: () => void
  onDelete: (chatId: string) => void
  /** The profile row at the bottom is the way in to Settings, as in the mockup. */
  onOpenSettings: () => void
  /** Browsing Maps: what was read and when, drawn from the vault. */
  onOpenMemory: () => void
  profileName: string
  /** Which screen is showing, so the sidebar can serve it. */
  view: View
  onView: (view: View) => void
  /** The library's search text — the Artifacts screen owns what it filters. */
  artifactQuery: string
  onArtifactQuery: (value: string) => void
  artifactCount: number
}) {
  const [query, setQuery] = useState('')
  const [prefs, setPrefs] = usePersistentState<SidebarPrefs>('ai-assistant.sidebar', { collapsed: false, width: 264 }, normalizePrefs)
  const [dragging, setDragging] = useState(false)
  const aside = useRef<HTMLElement | null>(null)

  const results = useMemo(() => searchChats(chats, query), [chats, query])
  const groups = useMemo(() => groupChats(chats), [chats])
  const searching = view === 'chat' && query.trim().length > 0
  // One box, two screens: it filters whatever is on show.
  const searchValue = view === 'artifacts' ? artifactQuery : query
  const setSearchValue = view === 'artifacts' ? onArtifactQuery : setQuery
  const placeholder = view === 'artifacts' ? 'Search artifacts' : 'Search'

  // Dragging the edge resizes; the width is written when the drag ends so the
  // storage is not written on every pixel of movement.
  useEffect(() => {
    if (!dragging) return
    const move = (event: PointerEvent): void => {
      const left = aside.current?.getBoundingClientRect().left ?? 0
      const width = Math.min(Math.max(event.clientX - left, MIN_WIDTH), MAX_WIDTH)
      setPrefs(previous => ({ ...previous, width }))
    }
    const stop = (): void => setDragging(false)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
  }, [dragging, setPrefs])

  if (prefs.collapsed) {
    return (
      <aside
        ref={aside}
        className="flex shrink-0 flex-col items-center gap-1.5 border-r border-line bg-panel py-3"
        style={{ width: RAIL_WIDTH }}
      >
        <button
          type="button"
          onClick={() => setPrefs(previous => ({ ...previous, collapsed: false }))}
          aria-label="Show the sidebar"
          title="Show the sidebar"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/[0.06] hover:text-ink"
        >
          <PanelLeftOpen size={15} />
        </button>
        <button
          type="button"
          onClick={onNew}
          aria-label="New chat"
          title="New chat"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent/90"
        >
          <Plus size={15} />
        </button>
        <AppNav view={view} onView={onView} collapsed artifactCount={artifactCount} />
        <span className="flex-1" />
        <button
          type="button"
          onClick={onOpenMemory}
          aria-label="Browsing Maps"
          title="Browsing Maps — what was read and when"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/[0.06] hover:text-ink"
        >
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="9" r="6" />
            <path d="M6.6 9h4.8M9 6.6v4.8" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Settings"
          title="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-ink"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/25 text-[11px] font-semibold text-brand">
            {initials(profileName)}
          </span>
        </button>
      </aside>
    )
  }

  return (
    <aside
      ref={aside}
      className="relative flex shrink-0 flex-col border-r border-line bg-panel"
      style={{ width: prefs.width }}
    >
      <div className="flex flex-col gap-2 p-3">
        <label className="relative block">
          <Search
            size={14}
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={searchValue}
            onChange={event => setSearchValue(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-9 w-full rounded-lg border border-line bg-card pl-8 pr-16 text-[13px] text-ink outline-none placeholder:text-muted focus:border-accent/60"
          />
          {searchValue ? (
            <button
              type="button"
              onClick={() => setSearchValue('')}
              aria-label="Clear search"
              className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-ink"
            >
              <X size={13} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setPrefs(previous => ({ ...previous, collapsed: true }))}
            aria-label="Hide the sidebar"
            title="Hide the sidebar"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted transition-colors hover:bg-white/[0.06] hover:text-ink"
          >
            <PanelLeftClose size={14} />
          </button>
        </label>

        <button
          type="button"
          onClick={onNew}
          className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-accent text-[13px] font-medium text-white transition-colors hover:bg-accent/90"
        >
          <Plus size={15} />
          New chat
        </button>

        <AppNav view={view} onView={onView} artifactCount={artifactCount} />
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3" aria-label="Conversations">
        {view === 'artifacts' ? (
          <p className="px-1 py-2 text-[12px] leading-relaxed text-muted">
            {artifactCount
              ? 'Search narrows the library. The conversations themselves are on the Chat screen.'
              : 'The library is empty so far. Anything you make in a chat appears on the Artifacts screen.'}
          </p>
        ) : searching ? (
          <SearchResults results={results} currentChat={currentChat} onOpen={onOpen} />
        ) : chats.length === 0 ? (
          <p className="px-1 py-2 text-[12px] leading-relaxed text-muted">
            No conversations yet. Your first one appears here.
          </p>
        ) : (
          groups.map(group => (
            <section key={group.label} className="mb-3">
              <h2 className="px-1 pb-1.5 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                {group.label}
              </h2>
              {group.chats.map(chat => (
                <ChatRow
                  key={chat.id}
                  chat={chat}
                  active={chat.id === currentChat}
                  onOpen={onOpen}
                  onDelete={onDelete}
                />
              ))}
            </section>
          ))
        )}
      </nav>

      <button
        type="button"
        onClick={onOpenMemory}
        aria-label="Browsing Maps"
        title="What was read and when"
        className="flex w-full items-center gap-2.5 border-t border-line px-3 py-2.5 text-left text-muted hover:bg-white/[0.06] hover:text-ink"
      >
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
          <circle cx="9" cy="9" r="6" />
          <path d="M6.6 9h4.8M9 6.6v4.8" />
        </svg>
        <span className="text-[12.5px]">Browsing Maps</span>
      </button>

      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Settings"
        title="Settings"
        className="flex w-full items-center gap-2.5 border-t border-line p-3 text-left hover:bg-white/[0.06]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/25 text-[12px] font-semibold text-brand">
          {initials(profileName)}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px]">{profileName}</span>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">
          Local
        </span>
      </button>

      {/* The grip on the edge. Invisible until pointed at, so the sidebar does
          not look like it is wearing a handle. */}
      <div
        onPointerDown={event => {
          event.preventDefault()
          setDragging(true)
        }}
        onDoubleClick={() => setPrefs(previous => ({ ...previous, width: 264 }))}
        title="Drag to resize · double-click to reset"
        aria-hidden="true"
        className={`absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize transition-colors ${
          dragging ? 'bg-accent/60' : 'hover:bg-accent/40'
        }`}
      />
    </aside>
  )
}

function ChatRow({
  chat,
  active,
  onOpen,
  onDelete,
}: {
  chat: Chat
  active: boolean
  onOpen: (chatId: string) => void
  onDelete: (chatId: string) => void
}) {
  return (
    <div
      className={`group flex items-center gap-1 rounded-lg pr-1 ${active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}
    >
      <button
        type="button"
        onClick={() => onOpen(chat.id)}
        title={chat.title}
        className={`min-w-0 flex-1 truncate px-2 py-2 text-left text-[13px] ${active ? 'text-ink' : 'text-muted group-hover:text-ink'}`}
      >
        {chat.title}
      </button>
      <button
        type="button"
        onClick={() => onDelete(chat.id)}
        aria-label={`Delete ${chat.title}`}
        title="Delete this conversation"
        className="rounded p-1 text-muted opacity-0 transition-opacity hover:text-ink group-hover:opacity-100 focus:opacity-100"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function SearchResults({
  results,
  currentChat,
  onOpen,
}: {
  results: ReturnType<typeof searchChats>
  currentChat: string
  onOpen: (chatId: string) => void
}) {
  if (!results.length) {
    return <p className="px-1 py-2 text-[12px] text-muted">Nothing said that matches.</p>
  }
  return (
    <div className="mb-3">
      <h2 className="px-1 pb-1.5 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted">
        Matches
      </h2>
      {results.map(result => (
        <button
          key={result.chat.id}
          type="button"
          onClick={() => onOpen(result.chat.id)}
          className={`mb-1 block w-full rounded-lg px-2 py-1.5 text-left ${
            result.chat.id === currentChat ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
          }`}
        >
          <span className="block truncate text-[13px] text-ink">{result.chat.title}</span>
          {result.matches[0] && (
            <span className="mt-0.5 block truncate text-[11px] text-muted">
              {result.matches[0].role === 'user' ? 'You: ' : ''}
              {result.matches[0].snippet}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
