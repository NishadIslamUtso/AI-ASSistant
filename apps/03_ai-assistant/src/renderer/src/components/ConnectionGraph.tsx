import { useEffect, useRef } from 'react'
import { bridge } from '../platform/bridge'

/**
 * ConnectionGraph — the vault's [[links]] as a 3D graph, drawn on a plain
 * canvas with a hand-rolled force layout. No library, no network: the data is
 * the app's own link check (edges = unambiguously resolved links only), the
 * physics is ~40 lines, and drag/wheel are the whole interface. A node you
 * cannot reach by a link is not pretended into an edge.
 *
 * Honest caps: above 400 nodes the most-connected 400 are drawn and the rest
 * are counted in words, not hidden.
 */

type Links = {
  files: number
  checked: number
  dead: Array<{ from: string; target: string }>
  ambiguous: Array<{ from: string; target: string; matches: string[] }>
  edges: Array<{ from: string; to: string }>
  error?: string
}

const MAX_NODES = 400

export default function ConnectionGraph({ path, isDemo }: { path: string; isDemo: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<{ yaw: number; pitch: number; zoom: number; dragging: boolean }>({ yaw: 0.6, pitch: 0.35, zoom: 1, dragging: false })

  useEffect(() => {
    if (isDemo || !path) return
    const canvas = canvasRef.current
    if (!canvas) return
    let live = true
    let stop = () => {}
    bridge.structure
      .linkCheck()
      .then(links => {
        if (!live) return
        stop = startGraph(canvas, links, stateRef)
      })
      .catch(() => {})
    return () => {
      live = false
      stop()
    }
  }, [path, isDemo])

  if (isDemo || !path) {
    return (
      <div className="rounded-lg border border-line bg-card p-3 text-[12px] text-muted">
        The connections graph draws from the real vault, in the desktop app.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-card">
      <canvas
        ref={canvasRef}
        className="block h-[240px] w-full cursor-grab active:cursor-grabbing"
        aria-label="3D graph of vault connections"
      />
      <p className="border-t border-line px-2.5 py-1.5 text-[10.5px] text-muted">
        Connections — drag to rotate, scroll to zoom. Edges are resolved [[links]]; dead and ambiguous ones are counted
        in Structure details.
      </p>
    </div>
  )
}

/** Build the simulation + renderer. Returns a stop function for cleanup. */
function startGraph(
  canvas: HTMLCanvasElement,
  links: Links,
  view: React.RefObject<{ yaw: number; pitch: number; zoom: number; dragging: boolean }>
): () => void {
  const context = canvas.getContext('2d')
  if (!context) return () => {}

  // Nodes: every endpoint, plus degree; above the cap keep the most connected.
  const degree = new Map<string, number>()
  for (const edge of links.edges) {
    degree.set(edge.from, (degree.get(edge.from) ?? 0) + 1)
    degree.set(edge.to, (degree.get(edge.to) ?? 0) + 1)
  }
  let names = [...degree.keys()]
  const total = names.length
  if (total > MAX_NODES) names = [...names].sort((a, b) => (degree.get(b) ?? 0) - (degree.get(a) ?? 0)).slice(0, MAX_NODES)
  const index = new Map(names.map((name, i) => [name, i]))

  // State: positions in a unit sphere, velocities, per-node radius by degree.
  const n = names.length
  const pos = new Float32Array(n * 3)
  const vel = new Float32Array(n * 3)
  const radius = new Float32Array(n)
  const maxDegree = Math.max(1, ...names.map(name => degree.get(name) ?? 0))
  for (let i = 0; i < n; i++) {
    // Deterministic-ish spread: golden-angle spiral on a sphere.
    const t = i / Math.max(1, n)
    const y = 1 - 2 * t
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const phi = i * 2.399963
    pos[i * 3] = Math.cos(phi) * r
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = Math.sin(phi) * r
    radius[i] = 1.5 + ((degree.get(names[i]) ?? 0) / maxDegree) * 3.5
  }
  const edges = links.edges
    .map(edge => [index.get(edge.from), index.get(edge.to)] as [number | undefined, number | undefined])
    .filter((pair): pair is [number, number] => pair[0] !== undefined && pair[1] !== undefined)

  // Sizing with device pixel ratio.
  const resize = (): void => {
    const ratio = window.devicePixelRatio || 1
    canvas.width = Math.max(1, canvas.clientWidth * ratio)
    canvas.height = Math.max(1, canvas.clientHeight * ratio)
  }
  resize()
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)

  // Drag to rotate, wheel to zoom.
  let last: { x: number; y: number } | null = null
  const down = (event: PointerEvent): void => {
    view.current.dragging = true
    last = { x: event.clientX, y: event.clientY }
    canvas.setPointerCapture(event.pointerId)
  }
  const move = (event: PointerEvent): void => {
    if (!view.current.dragging || !last) return
    view.current.yaw += (event.clientX - last.x) * 0.008
    view.current.pitch = Math.max(-1.4, Math.min(1.4, view.current.pitch + (event.clientY - last.y) * 0.008))
    last = { x: event.clientX, y: event.clientY }
  }
  const up = (): void => {
    view.current.dragging = false
    last = null
  }
  const wheel = (event: WheelEvent): void => {
    event.preventDefault()
    view.current.zoom = Math.max(0.5, Math.min(3, view.current.zoom * (event.deltaY < 0 ? 1.1 : 0.9)))
  }
  canvas.addEventListener('pointerdown', down)
  canvas.addEventListener('pointermove', move)
  canvas.addEventListener('pointerup', up)
  canvas.addEventListener('pointercancel', up)
  canvas.addEventListener('wheel', wheel, { passive: false })

  // Labels: only the most-connected few, or the picture drowns in text.
  const labelSet = new Set([...names].sort((a, b) => (degree.get(b) ?? 0) - (degree.get(a) ?? 0)).slice(0, 10))

  let raf = 0
  let frame = 0

  const step = (): void => {
    // Physics: pair repulsion + edge springs + centering, in 3D.
    const repulsion = 0.0016
    const spring = 0.02
    const rest = 0.28
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[j * 3] - pos[i * 3]
        const dy = pos[j * 3 + 1] - pos[i * 3 + 1]
        const dz = pos[j * 3 + 2] - pos[i * 3 + 2]
        const d2 = dx * dx + dy * dy + dz * dz + 0.0025
        const f = repulsion / d2
        const d = Math.sqrt(d2)
        const fx = (dx / d) * f
        const fy = (dy / d) * f
        const fz = (dz / d) * f
        vel[i * 3] -= fx
        vel[i * 3 + 1] -= fy
        vel[i * 3 + 2] -= fz
        vel[j * 3] += fx
        vel[j * 3 + 1] += fy
        vel[j * 3 + 2] += fz
      }
    }
    for (const [a, b] of edges) {
      const dx = pos[b * 3] - pos[a * 3]
      const dy = pos[b * 3 + 1] - pos[a * 3 + 1]
      const dz = pos[b * 3 + 2] - pos[a * 3 + 2]
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001
      const f = (spring * (d - rest)) / d
      vel[a * 3] += dx * f
      vel[a * 3 + 1] += dy * f
      vel[a * 3 + 2] += dz * f
      vel[b * 3] -= dx * f
      vel[b * 3 + 1] -= dy * f
      vel[b * 3 + 2] -= dz * f
    }
    for (let i = 0; i < n * 3; i++) {
      vel[i] = vel[i] * 0.86 - pos[i] * 0.0015
      pos[i] += vel[i]
    }
  }

  const draw = (): void => {
    const ratio = canvas.width / Math.max(1, canvas.clientWidth)
    const w = canvas.width
    const h = canvas.height
    context.clearRect(0, 0, w, h)
    const scale = (Math.min(w, h) / 2.4) * view.current.zoom
    const cx = w / 2
    const cy = h / 2
    const { yaw, pitch } = view.current
    const cosY = Math.cos(yaw)
    const sinY = Math.sin(yaw)
    const cosP = Math.cos(pitch)
    const sinP = Math.sin(pitch)
    const project = (i: number): { x: number; y: number; depth: number } => {
      const x = pos[i * 3]
      const y = pos[i * 3 + 1]
      const z = pos[i * 3 + 2]
      const x1 = x * cosY - z * sinY
      const z1 = x * sinY + z * cosY
      const y1 = y * cosP - z1 * sinP
      const z2 = y * sinP + z1 * cosP
      const depth = z2
      return { x: cx + x1 * scale, y: cy + y1 * scale, depth }
    }
    // Edges first, dimmer with depth.
    const projected = new Array(n)
    for (let i = 0; i < n; i++) projected[i] = project(i)
    context.lineWidth = 1 * ratio
    for (const [a, b] of edges) {
      const pa = projected[a]
      const pb = projected[b]
      const depth = (pa.depth + pb.depth) / 2
      const alpha = 0.5 - depth * 0.32
      context.strokeStyle = `rgba(176, 74, 106, ${Math.max(0.08, alpha)})`
      context.beginPath()
      context.moveTo(pa.x, pa.y)
      context.lineTo(pb.x, pb.y)
      context.stroke()
    }
    // Nodes far to near.
    const order = [...projected.keys()].sort((a, b) => projected[a].depth - projected[b].depth)
    for (const i of order) {
      const p = projected[i]
      const alpha = 0.9 - p.depth * 0.4
      context.fillStyle = `rgba(59, 67, 84, ${Math.max(0.25, alpha)})`
      context.beginPath()
      context.arc(p.x, p.y, radius[i] * ratio, 0, Math.PI * 2)
      context.fill()
    }
    // Labels for the hubs only.
    context.font = `${10 * ratio}px system-ui, sans-serif`
    context.fillStyle = 'rgba(59, 67, 84, 0.75)'
    for (let i = 0; i < n; i++) {
      if (!labelSet.has(names[i])) continue
      const p = projected[i]
      const short = names[i].split('/').slice(-1)[0].replace(/\.md$/, '')
      context.fillText(short, p.x + radius[i] * ratio + 2, p.y + 3)
    }
  }

  const loop = (): void => {
    frame++
    if (n <= 300 || frame < 220) step()
    if (!view.current.dragging) view.current.yaw += 0.0016
    draw()
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)

  return () => {
    cancelAnimationFrame(raf)
    observer.disconnect()
    canvas.removeEventListener('pointerdown', down)
    canvas.removeEventListener('pointermove', move)
    canvas.removeEventListener('pointerup', up)
    canvas.removeEventListener('pointercancel', up)
    canvas.removeEventListener('wheel', wheel)
  }
}
