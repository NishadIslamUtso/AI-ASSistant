import React from 'react'
import { C, M } from '../theme.js'
import { Icon, P } from './Icons.jsx'

/** File / Edit / View / Go / Help — native menu bar in the Electron build (191558.png) */
const MENUS = {
  File: ['New chat', 'New project', 'Open…', 'Import conversations', '—', 'Share', 'Export', '—', 'Settings', 'Close window'],
  Edit: ['Undo', 'Redo', '—', 'Cut', 'Copy', 'Paste', 'Select all', '—', 'Find'],
  View: ['Toggle sidebar', 'Toggle vault panel', 'Toggle artifacts', '—', 'Zoom in', 'Zoom out', 'Actual size', '—', 'Reload'],
  Go: ['Back', 'Forward', '—', 'All chats', 'Projects', 'Artifacts', '—', 'Today'],
  Help: ['Documentation', 'Keyboard shortcuts', 'Check for updates', '—', 'Report an issue', 'About AI ASSistant'],
}

export default function FileMenu({ onClose, onAction }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 rounded-[8px] py-[4px] shadow-2xl"
        style={{ left: 33, top: M.titleBar, width: 190, background: '#2a2a29', border: '1px solid #3a3a39' }}
      >
        {Object.keys(MENUS).map((name, rowIdx) => (
          <div key={name} className="relative group">
            <div
              className="flex items-center justify-between rounded-[6px] group-hover:bg-[#383837]"
              style={{ height: 32, paddingLeft: 11, paddingRight: 8, color: C.text }}
            >
              <span className="text-[13px]">{name}</span>
              <Icon d={P.chevron} size={11} className="opacity-50" />
            </div>
            <div
              className="absolute left-[186px] top-0 hidden group-hover:block rounded-[8px] py-[4px] shadow-2xl z-50"
              style={{ width: 200, background: '#2a2a29', border: '1px solid #3a3a39' }}
            >
              {MENUS[name].map((it, i) =>
                it === '—' ? (
                  <div key={i} className="my-[4px]" style={{ height: 1, background: '#3a3a39' }} />
                ) : (
                  <button
                    key={i}
                    onClick={() => { onAction?.(name, it); onClose() }}
                    className="flex items-center w-full rounded-[6px] hover:bg-[#383837] text-left"
                    style={{ height: 30, paddingLeft: 11, color: C.text2 }}
                  >
                    <span className="text-[12.5px]">{it}</span>
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
