// The orange spark used in the greeting and in "Thinking". Eight spokes, drawn as SVG so it scales cleanly.
export default function Asterisk({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        {[0, 45, 90, 135].map((a) => (
          <line key={a} x1="12" y1="3" x2="12" y2="21" transform={`rotate(${a} 12 12)`} />
        ))}
      </g>
    </svg>
  )
}
