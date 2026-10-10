import { useRef, useState } from 'react'
import { Menu, ChevronRight } from 'lucide-react'
import { useDismiss } from '../lib/hooks.js'

// File / Edit / View / Go / Help, opened from the hamburger (screenshot 191558.png).
// Web build: the Windows menu bar is drawn here. The Electron wrapper will use the native one.
export default function MenuBar({ actions }) {
  const [open, setOpen] = useState(false)
  const [sub, setSub] = useState(null)
  const ref = useRef(null)
  const close = () => { setOpen(false); setSub(null) }
  useDismiss(ref, close, open)

  const soon = (label) => () => { actions.toast(`${label}: not in the local build yet`); close() }
  const run = (fn) => () => { fn(); close() }

  const menus = {
    File: [
      { label: 'New chat', shortcut: 'Ctrl+Shift+O', onClick: run(actions.newChat) },
      { label: 'Settings', shortcut: 'Ctrl+,', onClick: run(actions.openSettings) },
      { label: 'Close window', onClick: soon('Close window (use the browser tab)') },
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z', onClick: run(() => actions.copy('undo')) },
      { label: 'Redo', shortcut: 'Ctrl+Y', onClick: run(() => actions.copy('redo')) },
      { label: 'Cut', shortcut: 'Ctrl+X', onClick: run(() => actions.copy('cut')) },
      { label: 'Copy', shortcut: 'Ctrl+C', onClick: run(() => actions.copy('copy')) },
      { label: 'Select all', shortcut: 'Ctrl+A', onClick: run(() => actions.copy('selectAll')) },
    ],
    View: [
      { label: 'Toggle sidebar', onClick: run(actions.toggleSidebar) },
      { label: 'Toggle AI-Brain vault panel', onClick: run(actions.toggleVault) },
    ],
    Go: [
      { label: 'Chats', onClick: run(actions.newChat) },
      { label: 'Projects', onClick: soon('Projects') },
      { label: 'Artifacts', onClick: soon('Artifacts') },
      { label: 'Customize', onClick: soon('Customize') },
    ],
    Help: [
      { label: 'Apps and extensions', onClick: run(actions.openApps) },
      { label: 'Get help', onClick: soon('Get help') },
      { label: 'About AI ASSistant', onClick: soon('About (local build v0.1.0)') },
    ],
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="c-hover rounded-md p-1.5 c-muted-2"
      >
        <Menu size={16} />
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-[60] w-40 rounded-lg c-menu py-1 text-sm">
          {Object.keys(menus).map((name) => (
            <div key={name} className="relative" onMouseEnter={() => setSub(name)}>
              <button
                type="button"
                onClick={() => setSub(sub === name ? null : name)}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left c-hover ${sub === name ? 'c-active' : ''}`}
              >
                <span>{name}</span>
                <ChevronRight size={14} className="c-muted" />
              </button>
              {sub === name && (
                <div className="absolute left-full top-0 ml-1 w-64 rounded-lg c-menu py-1">
                  {menus[name].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left c-hover"
                    >
                      <span>{item.label}</span>
                      {item.shortcut && <span className="c-muted text-xs">{item.shortcut}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
