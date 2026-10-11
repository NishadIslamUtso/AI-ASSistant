export default function ClaudeMark({ size = 32, className = '' }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 40 40" className={`claude-mark ${className}`} fill="none">
    <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      {Array.from({ length: 12 }, (_, index) => <path key={index} d={`M20 ${index % 3 === 0 ? 2 : 5}V15`} transform={`rotate(${index * 30} 20 20)`} />)}
    </g><circle cx="20" cy="20" r="2" fill="currentColor" />
  </svg>
}
