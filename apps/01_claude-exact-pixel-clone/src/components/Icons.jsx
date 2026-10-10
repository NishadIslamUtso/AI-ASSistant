import React from 'react'

/** Claude's asterisk / sunburst mark — brand orange #d97757 (sampled from screenshot) */
export function Asterisk({ size = 31, className = '' }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="#d97757">
        {[0, 60, 120].map((a) => (
          <rect
            key={a}
            x="44"
            y="6"
            width="12"
            height="88"
            rx="6"
            transform={`rotate(${a} 50 50)`}
          />
        ))}
      </g>
    </svg>
  )
}

export function Icon({ d, size = 14, className = '', strokeWidth = 1.6, fill = 'none' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {typeof d === 'string' ? <path d={d} /> : d}
    </svg>
  )
}

/* small set of stroke paths so we don't depend on an icon font */
export const P = {
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  plus: 'M12 5v14M5 12h14',
  folder: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  box: 'M12 2l9 5v10l-9 5-9-5V7l9-5zM3 7l9 5 9-5M12 12v10',
  sliders: 'M4 6h16M4 12h16M4 18h16',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-2.9 1.2V21a2 2 0 11-4 0v-.1A1.7 1.7 0 007 19.4a1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.7 1.7 0 003 15a2 2 0 010-4 1.7 1.7 0 001.2-2.9l-.1-.1a2 2 0 112.8-2.8l.1.1A1.7 1.7 0 0010 4.6V4a2 2 0 114 0v.6a1.7 1.7 0 002.9 1.2l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 001.2 2.9 2 2 0 010 4z',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18',
  help: 'M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9.5a2.5 2.5 0 114 2c-.8.6-1.5 1.2-1.5 2.5M12 17.5v.01',
  star: 'M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8L12 3z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5M12 8v.01',
  key: 'M21 2l-2 2m-7.6 7.6a5.5 5.5 0 11-7.8 7.8 5.5 5.5 0 017.8-7.8zm0 0L15 7m0 0l3 3m-3-3l2-2',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  external: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
  pin: 'M12 17v5M8 3h8l-1 6 3 3v2H6v-2l3-3-1-6z',
  pencil: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z',
  folderPlus: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM12 11v5M9.5 13.5h5',
  move: 'M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20',
  trash: 'M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6',
  chevron: 'M9 6l6 6-6 6',
  chevronDown: 'M6 9l6 6 6-6',
  monitor: 'M3 4h18v12H3zM8 20h8M12 16v4',
  sun: 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z',
  panelLeft: 'M3 4h18v16H3zM9 4v16',
  panelLeftClose: 'M3 4h18v16H3zM9 4v16M16 8l-3 4 3 4',
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  sparkle: 'M12 3l1.8 4.9L18.7 9.7l-4.9 1.8L12 16.4l-1.8-4.9L5.3 9.7l4.9-1.8L12 3z',
  paperclip: 'M21 11.5l-9 9a5.5 5.5 0 01-7.8-7.8l9-9a3.7 3.7 0 015.2 5.2l-9 9a1.8 1.8 0 01-2.6-2.6l8.5-8.5',
  mic: 'M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM19 11a7 7 0 01-14 0M12 19v3',
  send: 'M12 19V5M5 12l7-7 7 7',
  stop: 'M6 6h12v12H6z',
  refresh: 'M21 12a9 9 0 11-3-6.7M21 3v6h-6',
  copy: 'M9 9h11v11H9zM5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1',
  code: 'M8 6l-5 6 5 6M16 6l5 6-5 6',
  brain: 'M12 5a3 3 0 00-6 0 3 3 0 00-1 5.8V14a3 3 0 003 3h1v-4M12 5a3 3 0 016 0 3 3 0 011 5.8V14a3 3 0 01-3 3h-1v-4M12 5v14',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  card: 'M2 6h20v12H2zM2 10h20',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  zap: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  puzzle: 'M10 3h4v2a2 2 0 104 0h2v4a2 2 0 100 4 2 2 0 000 4v2h-4a2 2 0 10-4 0H8a2 2 0 100-4 2 2 0 000-4V5a2 2 0 102 0V3z',
  plug: 'M9 2v6M15 2v6M6 8h12v3a6 6 0 01-12 0V8zM12 17v5',
  x: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  history: 'M3 12a9 9 0 109-9 9 9 0 00-7.5 4M3 3v5h5M12 7v5l3 2',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6',
  capsule: 'M8 4h8a4 4 0 014 4v8a4 4 0 01-4 4H8a4 4 0 01-4-4V8a4 4 0 014-4zM12 4v16',
  target: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 12v.01',
  journal: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h5',
}
