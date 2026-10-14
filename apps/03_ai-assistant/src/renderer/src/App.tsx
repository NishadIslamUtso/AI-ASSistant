import BrainMark from './components/BrainMark'

/**
 * Phase 0: the shell itself.
 *
 * This is deliberately not a screen. Its only job is to prove the stack is wired:
 * Electron opens a window, the preload bridge is present, Tailwind compiles, and
 * the theme tokens resolve. The real screens replace this file next.
 */
export default function App() {
  const swatches: Array<[string, string]> = [
    ['bg', 'var(--color-bg)'],
    ['panel', 'var(--color-panel)'],
    ['card', 'var(--color-card)'],
    ['line', 'var(--color-line)'],
    ['muted', 'var(--color-muted)'],
    ['ink', 'var(--color-ink)'],
    ['accent', 'var(--color-accent)'],
    ['brand', 'var(--color-brand)'],
  ]

  return (
    <div className="flex h-full flex-col items-center justify-center gap-7 bg-bg text-ink">
      <BrainMark size={72} />

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">AI ASSistant</h1>
        <p className="text-sm text-muted">Phase 0 — the shell runs. Your files stay on this machine.</p>
      </div>

      <div className="flex items-center gap-2">
        {swatches.map(([name, value]) => (
          <div key={name} className="flex flex-col items-center gap-1.5">
            <span
              className="h-6 w-6 rounded-md border border-line"
              style={{ background: value }}
              title={`${name} ${value}`}
            />
            <span className="font-mono text-[10px] text-muted">{name}</span>
          </div>
        ))}
      </div>

      <p className="font-mono text-[11px] text-muted">
        electron · vite · react · typescript · tailwind · shadcn ready
      </p>
    </div>
  )
}
