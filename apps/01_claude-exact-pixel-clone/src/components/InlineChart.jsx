import { chartGeometry } from '../lib/chart.js'

// Renders a validated chart spec as inline SVG. No external libraries.
export default function InlineChart({ spec }) {
  const geo = chartGeometry(spec)
  const label = `${spec.type === 'line' ? 'Line' : 'Bar'} chart${spec.title ? `: ${spec.title}` : ''} with ${spec.values.length} values`
  const path = geo.points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
  return <figure className="inline-chart">
    {spec.title && <figcaption>{spec.title}</figcaption>}
    <svg viewBox={`0 0 ${geo.width} ${geo.height}`} role="img" aria-label={label}>
      <line x1={geo.pad} x2={geo.width - geo.pad} y1={geo.zeroY} y2={geo.zeroY} className="inline-chart-axis" />
      {spec.type === 'bar' && geo.points.map(point => <rect key={point.label + point.x} x={point.barX} y={point.barTop} width={point.barW} height={Math.max(point.barH, 1)} rx="3" className="inline-chart-bar"><title>{`${point.label}: ${point.value}`}</title></rect>)}
      {spec.type === 'line' && <>
        <path d={path} className="inline-chart-line" fill="none" />
        {geo.points.map(point => <circle key={point.label + point.x} cx={point.x} cy={point.y} r="3.5" className="inline-chart-dot"><title>{`${point.label}: ${point.value}`}</title></circle>)}
      </>}
      {geo.points.map(point => <text key={'t' + point.label + point.x} x={point.x} y={geo.height - 10} textAnchor="middle" className="inline-chart-label">{point.label}</text>)}
      {geo.points.map(point => <text key={'v' + point.label + point.x} x={point.x} y={Math.max(point.y - 6, 12)} textAnchor="middle" className="inline-chart-value">{point.value}</text>)}
    </svg>
  </figure>
}
