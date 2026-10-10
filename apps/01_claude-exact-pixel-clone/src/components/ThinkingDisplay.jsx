import React, { useState } from 'react'
import { C } from '../theme.js'
import { Icon, P } from './Icons.jsx'

export default function ThinkingDisplay({ text, streaming }) {
  const [open, setOpen] = useState(false)
  if (!text) return null
  return (
    <div className="mb-[8px]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-[7px] text-[12.5px] hover:opacity-80"
        style={{ color: C.text3 }}
      >
        <Icon d={P.brain} size={13} />
        <span>{streaming ? 'Thinking…' : 'Thought for a moment'}</span>
        <Icon d={P.chevronDown} size={11} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <div
          className="mt-[6px] rounded-[8px] p-[10px] text-[12.5px] leading-[19px] whitespace-pre-wrap"
          style={{ background: '#171716', border: '1px solid #232322', color: C.text3 }}
        >
          {text}
        </div>
      )}
    </div>
  )
}
