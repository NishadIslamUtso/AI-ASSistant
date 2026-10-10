import { useState } from 'react'
import { Blocks, Check, Code2, Grid2X2, Plug, Terminal, X } from 'lucide-react'

const APP_DETAILS = {
  terminal: { title: 'Terminal', detail: 'Claude Code is a separate product and is not connected to this local AI ASSistant build.' },
  vscode: { title: 'VS Code', detail: 'The reference shows a VS Code integration. This clone does not install or connect a VS Code extension.' },
  desktop: { title: 'Desktop app', detail: 'AI ASSistant currently runs locally in your browser through the Vite development app; a Windows installer is still planned.' },
  chrome: { title: 'AI ASSistant browser extension', detail: 'The local Manifest V3 extension source is in the repository at extension/. Load it as an unpacked extension after the local vault API is running.' },
  microsoft: { title: 'Microsoft 365', detail: 'No Microsoft account or cloud connector is configured in this local app.' },
  other: { title: 'Other integrations', detail: 'External integrations are not enabled. This app will not send your chat or vault data to another service.' },
}

function Pill({ children, icon: Icon }) {
  return <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-primary)]"><Icon size={14} />{children}</span>
}

export default function AppsExtensionsModal({ onClose }) {
  const [selected, setSelected] = useState(null)
  const detail = selected ? APP_DETAILS[selected] : null

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/65 p-3 backdrop-blur-[2px]" onMouseDown={event => { if (event.target === event.currentTarget) onClose?.() }}>
      <section role="dialog" aria-modal="true" aria-label="Apps and extensions" className="flex h-[min(88vh,850px)] w-[min(94vw,1440px)] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-main)] shadow-2xl">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
          <h2 className="text-sm font-semibold">Apps and extensions</h2>
          <button type="button" aria-label="Close apps and extensions" onClick={onClose} className="rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"><X size={18} /></button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-6 sm:px-10">
          <h1 className="mb-8 text-center font-serif text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-[32px]">Do more with Claude, everywhere you work</h1>
          <div className="mx-auto max-w-[1040px]">
            <article className="grid overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] lg:grid-cols-[1fr_1.04fr]">
              <div className="flex flex-col justify-center p-6 sm:p-8">
                <div className="flex items-center gap-2 text-sm font-semibold"><Code2 size={18} className="text-[#de8c67]" /> Claude Code</div>
                <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">Build, debug, and ship from your terminal or IDE. Claude Code is a separate product; it is not part of this local-only app.</p>
                <button type="button" onClick={() => setSelected('terminal')} className="mt-5 w-fit rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200">About Claude Code</button>
                <div className="mt-7 text-xs text-[var(--text-muted)]">Or explore local setup</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setSelected('terminal')}><Pill icon={Terminal}>Terminal</Pill></button>
                  <button type="button" onClick={() => setSelected('vscode')}><Pill icon={Code2}>VS Code</Pill></button>
                  <button type="button" onClick={() => setSelected('desktop')}><Pill icon={Grid2X2}>Desktop app</Pill></button>
                  <button type="button" onClick={() => setSelected('other')}><Pill icon={Blocks}>JetBrains</Pill></button>
                  <button type="button" onClick={() => setSelected('other')}><Pill icon={Blocks}>Slack</Pill></button>
                  <button type="button" onClick={() => setSelected('other')}><Pill icon={Plug}>Mobile</Pill></button>
                </div>
              </div>
              <div className="min-h-[270px] border-t border-[var(--border)] bg-[#171717] p-4 sm:p-6 lg:border-l lg:border-t-0">
                <div className="h-full min-h-[250px] overflow-hidden rounded-xl border border-[#343434] bg-[#1d1d1d] font-mono text-xs text-[#bcbcbc] shadow-xl">
                  <div className="flex h-8 items-center gap-1.5 border-b border-[#343434] px-3"><i className="h-2.5 w-2.5 rounded-full bg-[#f56d65]"/><i className="h-2.5 w-2.5 rounded-full bg-[#f4c050]"/><i className="h-2.5 w-2.5 rounded-full bg-[#4bbb72]"/><span className="ml-2 text-[10px] text-[#777]">local-workspace</span></div>
                  <div className="space-y-3 p-4 sm:p-5">
                    <div className="text-[#de8c67]">&gt; Inspecting your local project</div><div><span className="mr-2 text-[#87b37b]">✓</span>Reading src/Center.jsx</div><div><span className="mr-2 text-[#87b37b]">✓</span>Checking Ollama model availability</div><div><span className="mr-2 text-[#87b37b]">✓</span>Using vault context only when relevant</div>
                    <div className="mt-4 rounded-lg border border-[#353535] bg-[#222] p-3 text-[#9a9a9a]">AI ASSistant runs locally with your selected Ollama model.</div><div className="pt-1 text-[#de8c67]">✳ Ready when you are</div>
                  </div>
                </div>
              </div>
            </article>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <article className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
                <div className="flex items-center gap-2 text-sm font-semibold"><Blocks size={18} className="text-[#7396d8]" /> Microsoft 365</div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-[var(--text-secondary)]">Analyze data, build presentations, draft documents, and triage your inbox with Claude alongside you.</p>
                <button type="button" onClick={() => setSelected('microsoft')} className="mt-5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--surface-hover)]">Integration details</button>
              </article>
              <article className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
                <div className="flex items-center gap-2 text-sm font-semibold"><Grid2X2 size={18} className="text-[#8d80d2]" /> Chrome</div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-[var(--text-secondary)]">Use the included local AI ASSistant extension for capture and capsule tools. It does not connect to an external account.</p>
                <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={() => setSelected('chrome')} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--surface-hover)]">Setup details</button><span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]"><Check size={13} /> Source included</span></div>
              </article>
            </div>

            <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-[var(--text-muted)]">External Claude products, Microsoft 365, and third-party integrations are not installed or enabled by this screen. AI ASSistant chat and vault requests stay on your computer unless you explicitly configure another destination.</p>
          </div>
        </div>
        {detail && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null) }}><div role="dialog" aria-modal="true" aria-label={detail.title} className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-main)] p-5 shadow-2xl"><div className="flex items-start justify-between"><h3 className="text-base font-semibold">{detail.title}</h3><button type="button" onClick={() => setSelected(null)} aria-label="Close details" className="rounded-md p-1 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"><X size={16}/></button></div><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{detail.detail}</p><button type="button" onClick={() => setSelected(null)} className="mt-5 rounded-lg bg-[var(--surface-hover)] px-4 py-2 text-xs hover:bg-[var(--surface-selected)]">Got it</button></div></div>}
      </section>
    </div>
  )
}
