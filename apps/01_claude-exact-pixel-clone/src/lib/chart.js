// Inline chart support. The model may answer a chart request with a fenced
// ```chart block whose body is JSON:
//   {"type":"bar"|"line","title":"optional","labels":["A","B"],"values":[4,9]}
// Anything that does not validate is shown as plain code, never rendered.

export const CHART_LANGUAGE = 'chart'
const MAX_POINTS = 30
const MAX_LABEL = 40

export function parseChartSpec(source = '') {
  let data
  try {
    data = JSON.parse(String(source))
  } catch {
    return null
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const type = data.type === 'line' ? 'line' : data.type === 'bar' ? 'bar' : null
  if (!type) return null
  if (!Array.isArray(data.labels) || !Array.isArray(data.values)) return null
  if (data.labels.length === 0 || data.labels.length !== data.values.length || data.labels.length > MAX_POINTS) return null
  if (!data.values.every(value => typeof value === 'number' && Number.isFinite(value))) return null
  const labels = data.labels.map(label => String(label).slice(0, MAX_LABEL))
  const title = typeof data.title === 'string' ? data.title.slice(0, 80) : ''
  return { type, title, labels, values: data.values.slice() }
}

// Pure geometry so the SVG renderer stays a thin layer and can be tested.
export function chartGeometry(spec, { width = 520, height = 240, pad = 36 } = {}) {
  const innerW = width - pad * 2
  const innerH = height - pad * 2
  const max = Math.max(0, ...spec.values)
  const min = Math.min(0, ...spec.values)
  const span = max - min || 1
  const step = innerW / spec.labels.length
  const y = value => pad + innerH - ((value - min) / span) * innerH
  const points = spec.values.map((value, index) => ({
    label: spec.labels[index],
    value,
    x: pad + step * index + step / 2,
    y: y(value),
    barX: pad + step * index + step * 0.18,
    barW: step * 0.64,
    barTop: Math.min(y(value), y(0)),
    barH: Math.abs(y(0) - y(value)),
  }))
  return { width, height, pad, zeroY: y(0), points }
}
