import BrainMark from './BrainMark'

/**
 * The bar across the top. The window frame is the operating system's, so this is
 * not a substitute title bar — it is the app's own header: what this is, and
 * whether the two local services it depends on are up.
 */
export default function TitleBar({
  model,
  ollamaStatus,
  preview = false,
}: {
  model: string
  ollamaStatus: 'loading' | 'online' | 'offline'
  /** In the browser there is no Ollama to find, so the chip says what this is
   *  instead of reporting a service on the person's machine as missing. */
  preview?: boolean
}) {
  const state = preview
    ? 'Preview'
    : ollamaStatus === 'online'
      ? 'Ollama'
      : ollamaStatus === 'loading'
        ? 'Looking for Ollama…'
        : 'Ollama is not running'

  return (
    <header className="flex h-11 shrink-0 items-center gap-2.5 border-b border-line px-3.5">
      <BrainMark size={20} />
      <span className="text-[13px] font-medium tracking-tight">AI ASSistant</span>

      <div className="ml-auto flex items-center gap-2">
        <span
          className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] text-muted"
          title={
            preview
              ? 'This is the interface, running in a browser. Your models and files are on your machine, in the desktop app.'
              : ollamaStatus === 'online'
              ? `Ollama is running on this machine, serving ${model}.`
              : 'Ollama is not reachable on this machine. The app works without it; replies need it.'
          }
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              preview
                ? 'bg-muted'
                : ollamaStatus === 'online'
                  ? 'bg-ok'
                  : ollamaStatus === 'loading'
                    ? 'bg-warn'
                    : 'bg-muted'
            }`}
          />
          {state}
        </span>
      </div>
    </header>
  )
}
