import { useEffect, useRef, useState } from 'react'
import { MenuItem, MenuSep, MENU_SURFACE } from './menu.jsx'

// Web build of the File / Edit / View / Go / Help menu from screenshot 191558.
// Opens from the ≡ button. Submenus open on hover.
export default function AppMenu({ onClose, actions }) {
  const [open, setOpen] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [onClose])

  const run = (fn) => () => { onClose(); fn() }
  const exec = (cmd) => () => { onClose(); document.execCommand(cmd) }

  const menus = {
    File: [
      { label: 'New chat', shortcut: 'Ctrl+N', onClick: run(actions.newChat) },
      { label: 'Settings', shortcut: 'Ctrl+,', onClick: run(actions.openSettings) },
      'sep',
      { label: 'Close', onClick: run(() => actions.toast('Close this browser tab, or use the window close button')) },
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z', onClick: exec('undo') },
      { label: 'Redo', shortcut: 'Ctrl+Y', onClick: exec('redo') },
      'sep',
      { label: 'Cut', shortcut: 'Ctrl+X', onClick: exec('cut') },
      { label: 'Copy', shortcut: 'Ctrl+C', onClick: exec('copy') },
      { label: 'Paste', shortcut: 'Ctrl+V', onClick: exec('paste') },
      { label: 'Select all', shortcut: 'Ctrl+A', onClick: exec('selectAll') },
    ],
    View: [
      { label: 'Toggle sidebar', shortcut: 'Ctrl+B', onClick: run(actions.toggleSidebar) },
      { label: 'Toggle AI-Brain panel', onClick: run(actions.toggleVault) },
      'sep',
      { label: 'Reload', onClick: run(() => location.reload()) },
      { label: 'Full screen', onClick: run(() => document.documentElement.requestFullscreen?.()) },
    ],
    Go: [
      { label: 'Back', onClick: run(actions.goBack) },
      { label: 'Forward', onClick: run(actions.goForward) },
    ],
    Help: [
      { label: 'Get help', onClick: run(() => actions.toast('Help: see README.md and 00_LIVING_DOCS/ in the repo')) },
      { label: 'About AI ASSistant', onClick: run(() => actions.toast('AI ASSistant local build · qwen2.5:3b via Ollama · AI-Brain vault')) },
    ],
  }

  return (
    <div ref={ref} role="menu" className={`absolute left-0 top-9 z-50 w-[150px] ${MENU_SURFACE} !p-1`}>
      {Object.keys(menus).map((name) => (
        <div key={name} className="relative" onMouseEnter={() => setOpen(name)}>
          <MenuItem label={name} submenu active={open === name} onClick={() => setOpen(name)} className="!py-1.5" />
          {open === name && (
            <div className={`absolute left-full top-0 z-50 ml-1 w-[230px] ${MENU_SURFACE} !p-1`}>
              {menus[name].map((item, i) => (item === 'sep'
                ? <MenuSep key={`s${i}`} />
                : <MenuItem key={item.label} label={item.label} shortcut={item.shortcut} onClick={item.onClick} className="!py-1.5" />))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
