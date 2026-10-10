import React from 'react'
import { C, M } from '../theme.js'

/**
 * TitleBar — overlay drawn on top of the app (32 px, measured).
 *
 * In the real Electron build these are replaced by the native Windows caption
 * buttons (191558.png shows the native File/Edit/View/Go/Help menu). In the
 * browser build they are drawn so the layout matches the screenshots; hovering
 * shows a tooltip explaining they are desktop-only.
 */
export default function TitleBar({ onMin, onMax, onClose }) {
  const btn = 'h-full flex items-center justify-center hover:bg-white/10'
  return (
    <div
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-end pointer-events-none"
      style={{ height: M.titleBar }}
    >
      <div className="h-full flex items-center pointer-events-auto">
        <button className={btn} style={{ width: 42 }} onClick={onMin} title="Minimise (desktop build)">
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10" stroke={C.text2} strokeWidth="1" /></svg>
        </button>
        <button className={btn} style={{ width: 42 }} onClick={onMax} title="Maximise (desktop build)">
          <svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" stroke={C.text2} fill="none" strokeWidth="1" /></svg>
        </button>
        <button className={`${btn} hover:bg-[#c42b1c]`} style={{ width: 42 }} onClick={onClose} title="Close (desktop build)">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M0 0l10 10M10 0L0 10" stroke={C.text2} strokeWidth="1" />
          </svg>
        </button>
      </div>
    </div>
  )
}
