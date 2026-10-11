import { useEffect } from 'react'
import { Terminal, Code2, Chrome, LayoutGrid, Puzzle, BookOpen, Check } from 'lucide-react'
import Dialog from './Dialog.jsx'

/**
 * AppsExtensionsModal — screenshot 191636.png
 *   "Do more with Claude everywhere you work"
 *   Claude Code (Terminal / VS Code), Microsoft 365, Chrome extension
 *
 * Honest labelling: entries that are Anthropic cloud products are marked
 * "Not available locally"; the Chrome extension entry points at the real
 * extension/ folder in this repo.
 */

const GROUPS = [
  {
    title: 'Claude Code',
    items: [
      {
        id: 'terminal',
        icon: Terminal,
        name: 'Terminal',
        desc: 'Run Claude Code in your shell. Anthropic product — not bundled in this local build.',
        action: 'Not available locally',
        disabled: true,
      },
      {
        id: 'vscode',
        icon: Code2,
        name: 'VS Code',
        desc: 'Claude Code inside the editor. Anthropic product — not bundled in this local build.',
        action: 'Not available locally',
        disabled: true,
      },
    ],
  },
  {
    title: 'Productivity',
    items: [
      {
        id: 'm365',
        icon: LayoutGrid,
        name: 'Microsoft 365',
        desc: 'Claude for Word, Excel and PowerPoint. Anthropic connector — not in the local build.',
        action: 'Not available locally',
        disabled: true,
      },
    ],
  },
  {
    title: 'Browser',
    items: [
      {
        id: 'chrome',
        icon: Chrome,
        name: 'AI ASSistant extension',
        desc: 'Capture pages and AI chats into the vault, inject saved Capsules into any chat box, Quillbot-style inline suggestions. Local-only, no account.',
        action: 'Install (unpacked)',
        primary: true,
        href: '#extension',
      },
      {
        id: 'capsule',
        icon: Puzzle,
        name: 'Capsule Hub',
        desc: 'Capture a context once, reuse it everywhere. Goals, constraints, background, decisions, attachments. Version and roll back.',
        action: 'Included',
        done: true,
      },
      {
        id: 'quillbot',
        icon: BookOpen,
        name: 'Inline suggestions',
        desc: 'Works in any text field: highlight text or open the toolbar, get suggestions inline without switching tabs.',
        action: 'Included',
        done: true,
      },
    ],
  },
]

export default function AppsExtensionsModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <Dialog
      title="Do more with Claude everywhere you work"
      onClose={onClose}
      className="w-[640px] max-w-[calc(100vw-32px)] max-h-[80vh]"
    >
      <div className="flex-1 overflow-y-auto px-5 py-4">
          {GROUPS.map((g) => (
            <div key={g.title} className="mb-5">
              <div className="text-[11px] uppercase tracking-wide text-[var(--ink3)] mb-2 px-1">
                {g.title}
              </div>
              <div className="space-y-2">
                {g.items.map((it) => {
                  const Icon = it.icon
                  return (
                    <div
                      key={it.id}
                      className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center shrink-0">
                        <Icon size={17} className="text-[var(--ink)]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] text-[var(--ink)]">{it.name}</div>
                        <div className="text-[12px] text-[var(--ink2)] leading-5 mt-0.5">
                          {it.desc}
                        </div>
                      </div>
                      <button
                        disabled={it.disabled || it.done}
                        onClick={() => {
                          if (it.href === '#extension') {
                            window.alert(
                              'Load it in Chrome:\n\n1. Open chrome://extensions\n2. Turn on Developer mode\n3. Choose "Load unpacked"\n4. Pick the extension/ folder in this repo\n\nThe vault API (127.0.0.1:8765) must be running — start-app.bat starts it.',
                            )
                          }
                        }}
                        className={`shrink-0 text-[12px] px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                          it.done
                            ? 'border-[var(--border)] text-[var(--ink3)]'
                            : it.disabled
                              ? 'border-[var(--border)] text-[var(--ink3)] cursor-default'
                              : 'border-[var(--border-strong)] text-[var(--ink)] hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        {it.done ? <Check size={13} /> : null}
                        {it.action}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
      </div>
    </Dialog>
  )
}
