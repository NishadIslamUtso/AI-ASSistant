// Claude-style starburst used for the greeting and assistant avatar.
export default function Spark({ size = 32, color = 'var(--accent)', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g stroke={color} strokeWidth="2.6" strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line key={a} x1="12" y1="3.5" x2="12" y2="20.5" transform={`rotate(${a} 12 12)`} />
        ))}
      </g>
    </svg>
  )
}
