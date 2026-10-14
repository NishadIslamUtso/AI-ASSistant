import { useMemo, useState } from 'react'
import { MessageSquare, Plus, Search, Trash2, X } from 'lucide-react'
import type { Chat } from '@shared/types'
import { searchChats } from '@shared/lib/search'
import { initials } from '@shared/lib/profile'
import { groupChats } from '@/state/useChats'

/**
 * The list of conversations.
 *
 * Search is the search from the shared library: it looks inside message text, not
 * just titles, so a conversation you remember the contents of is reachable even
 * when you do not remember what you called it.
 */
export default function Sidebar({
  chats,
  currentChat,
  onOpen,
  onNew,
  onDelete,
  onOpenSettings,
  profileName,
}: {
  chats: Chat[]
  currentChat: string
  onOpen: (chatId: string) => void
  onNew: () => void
  onDelete: (chatId: string) => void
  /** The profile row at the bottom is the way in to Settings, as in the mockup. */
  onOpenSettings: () => void
  profileName: string
}) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchChats(chats, query), [chats, query])
  const groups = useMemo(() => groupChats(chats), [chats])
  const searching = query.trim().length > 0

  return (
    <aside className="flex w-[264px] shrink-0 flex-col border-r border-line bg-panel">
      <div className="flex flex-col gap-2 p-3">
        <label className="relative block">
          <Search
            size={14}
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search conversations"
            className="h-9 w-full rounded-lg border border-line bg-card pl-8 pr-8 text-[13px] text-ink outline-none placeholder:text-muted focus:border-accent/60"
          />
          {searching && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-ink"
            >
              <X size={13} />
            </button>
          )}
        </label>

        <button
          type="button"
          onClick={onNew}
          className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-accent text-[13px] font-medium text-white transition-colors hover:bg-accent/90"
        >
          <Plus size={15} />
          New chat
        </button>

        <div className="mt-1 flex h-9 items-center gap-2 rounded-lg bg-card px-2.5 text-[13px] text-ink">
          <MessageSquare size={14} className="text-muted" />
          Chat
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {searching ? (
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
