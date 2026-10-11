# apps/01_claude-exact-pixel-clone

Exact Claude-desktop clone, driven by a local Ollama model and an Obsidian vault.
Target screenshots: `spec/screenshots/191547 … 191707.png`.

## Run on Windows (TUF A15, 8 GB RAM, 4 GB VRAM)

```
start-app.bat
```

It: detects a **running** Ollama and only starts `ollama serve` when needed, sets
`OLLAMA_ORIGINS=*`, offers to pull `qwen2.5:3b` only if missing, installs deps (plus the
Windows rollup binary Vite wants), starts the vault API on 8765 if it is not already up,
opens `http://127.0.0.1:5173`.

`check-ollama.bat` prints the state of Ollama / models / vault API / node.

## What it can do

| | |
|---|---|
| **Chat** | Streaming replies from an installed Ollama model, thinking output, stop, retry, vault capture of every turn |
| **Artifacts** | The model's HTML/SVG becomes a real app in a sandboxed preview: versions, source editing, library, import |
| **Live preview** | A document that is still being written renders in the panel *while it streams* — the panel opens itself, the reply needs no click |
| **Inline visualizer** | `<canvas data-chart='{"type":"bar","labels":[…],"data":[…]}` renders in the preview with no CDN and no network: bar, line, pie, doughnut |
| **Comment mode** | Pin any element in the preview, type "make this blue", and only that element is rewritten — as a new version you can diff |
| **Vision bridge** | With a vision model installed (`qwen3-vl:4b`), attach an image to a text-only model: the vision model describes it locally first, and the transcript says so |
| **Sub agents** | Six roles, own message list, AI-Brain lookup, one job at a time; results reach the composer only when you insert them |
| **Branching** | Fork any reply into a new chat; the original keeps its copy |
| **Export** | One click → a ZIP (`index.html` + host config) that any static host serves with no build step |
| **AI-Brain** | Capsules drag-and-drop into the composer, never-check blacklist, Today view (`Alt+T`) |
| **Windows shell** | Title bar File/Edit/View/Go/Help, model picker, settings, user menu, apps & extensions with live service status |

## Why there is no CORS problem

`vite.config.js` proxies every local call, so the browser is always same-origin and
`OLLAMA_ORIGINS` no longer matters:

| Browser call | Forwarded to |
|---|---|
| `/api/ollama/tags`  | `http://127.0.0.1:11434/api/tags` |
| `/api/ollama/show`  | `http://127.0.0.1:11434/api/show` |
| `/api/ollama/chat`  | `http://127.0.0.1:11434/api/chat` |
| `/api/vault/...`    | `http://127.0.0.1:8765/...` |

`server/proxy-policy.cjs` sits in front of those routes and allows **only** the
endpoints this UI needs. Model pull/delete, arbitrary vault paths, cross-origin
requests and browser-form writes are refused with 403/415. The proxy target is
validated to be an unauthenticated loopback service, so no remote AI or vault
destination can be substituted.

**On your own machine nothing extra is needed** — the browser origin is
`127.0.0.1` or `localhost`, which is allowed by default.

If you serve the dev server through a forwarded/preview hostname, both layers
need to be told:

```
ALLOW_PREVIEW_ORIGINS=1 node server/vault-api.cjs
ALLOW_PREVIEW_ORIGINS=1 npx vite --host 0.0.0.0 --port 5173
```

That permits `*.e2b.app` origins only. **Do not set it for a normal local run** —
it exists solely so the app can be previewed from another host.

## UI lineage

The interface was adopted wholesale from the `arena/01199af1-ai-assistant` branch
at the user's request ("take this branch for the ui/ux"). That branch's palette is
the one the user specified — `#1a1a1a` main, `#202020` sidebar, `#242424`
composer, 260px sidebar — so the earlier measured-pixel conflict does not apply
here. See `spec/MEASURED_PIXELS.md` for the geometry it still governs.

Two things from this branch were kept on top of it, because they are stated
requirements that branch did not have:

| Kept | Why |
|---|---|
| `src/components/TitleBar.jsx` | File/Edit/View/Go/Help **Windows title bar** — required, and the adopted UI had none |
| `src/components/TodayView.jsx` (`Alt+T`) | P8 Today view; also reachable from the sidebar |

## Layout (from 191547.png)

```
┌ TitleBar  File Edit View Go Help              ✳ AI ASSistant   ● Ollama ● Vault ┐
│ Sidebar 260px #202020      │ Center #1a1a1a          │ AI-Brain │ Artifacts     │
│  Search                    │  Free plan · Upgrade    │ (Ctrl+J) │ (Ctrl+Shift+A)│
│  + New chat                │  "Evening, Utso." ✳     │          │  Sub agents   │
│  Projects / Artifacts (n)  │  composer #242424       │ capsules │ (Ctrl+Shift+G)│
│  Sub agents / Today        │  Project · model ·      │ blacklist│               │
│  Oct 8 / Older / Pinned    │  Medium · Manual ·  ↑   │ today    │               │
│  [NU] Utso · Free          │                         │          │               │
└────────────────────────────┴─────────────────────────┴──────────┴───────────────┘
```

## What each file does

| File | Purpose |
|---|---|
| `src/App.jsx` | Shell state, views (chat / artifacts / projects), panels, dialogs, shortcuts |
| `src/hooks/useChat.js` | Send, stream, vision bridge, live artifacts, branch, retry, vault capture |
| `src/hooks/useModels.js` | Model list + verification; refuses remote/cloud models |
| `src/hooks/useVisionBridge.js` | Which installed models can see; probes `/api/show`, cached per model+size |
| `src/hooks/useSubAgents.js` | Isolated-context jobs: roles, budget, one at a time |
| `src/hooks/usePersistentState.js` | localStorage with recovery — never silently overwrites an unreadable value |
| `src/lib/ollama.js` | Ollama client: tags/show/chat, NDJSON reader, `<think>` split, capabilities |
| `src/lib/ask.js` | One isolated model call with the shared character budget |
| `src/lib/vision.js` | Bridge prompt, description cap, the labelled `vision_bridge` block |
| `src/lib/artifacts.js` | Artifact extraction (incl. half-written), preview template, chart renderer, pick mode, region rewrite |
| `src/lib/zip.js` | ZIP writer + deployable-site layout + download |
| `src/lib/attachments.js` | File/image intake, size guards, `seenBy`, bridged message building |
| `src/lib/vault.js` | Vault API client + the `vault` facade TodayView reads |
| `src/lib/storage.js` | Defaults + normalisers for chats, settings, projects |
| `src/components/Sidebar.jsx` | 260px sidebar: chat groups, Projects, Artifacts, Sub agents, Today |
| `src/components/Center.jsx` | Greeting, transcript, live artifact cards, branch/copy, composer |
| `src/components/Composer.jsx` | `#242424` input, model/effort/thinking/project, uploads, capsules, bridge notice |
| `src/components/ArtifactPanel.jsx` | Live + versioned preview, comment mode, region rewrite, export, source editor |
| `src/components/SubAgentPanel.jsx` | Sub-agent list, editor, result, insert |
| `src/components/ArtifactsLibrary.jsx` | All artifacts across chats, import |
| `src/components/VaultPanel.jsx` | Capsules, never-check blacklist |
| `src/components/SettingsModal.jsx` | Appearance / Vision / Voice / This computer / Customize |
| `src/components/AppsExtensionsModal.jsx` | Apps + extensions, with **live** service status |
| `src/server/vault-api.cjs` | The only thing that writes to the vault |
| `server/proxy-policy.cjs` | Allows only the endpoints this UI needs; blocks the rest |
| `server/mock-ollama.cjs` | Ollama-compatible stub for previews only — never started by `start-app.bat` |

## Keys

`Alt+T` Today view · `Ctrl+J` AI-Brain · `Ctrl+Shift+A` artifacts view ·
`Ctrl+Shift+G` sub agents · `Ctrl+,` settings · `Ctrl+B` collapse sidebar ·
`Enter` send · `Shift+Enter` newline.

## Tests

```
npm test            # 69 tests: artifacts + storage, streaming artifacts, the ZIP
                    #           writer, the vision bridge, region rewriting,
                    #           the budget guard, ollama, proxy policy, vault API
npm i -D jsdom      # jsdom ships in dependencies here; only needed for the UI test
npm run test:ui     # 9 jsdom tests: shell, artifact gating, live auto-open,
                    #               sub-agent isolation, vision bridge end-to-end,
                    #               branching, settings/theme, Today, chat menu
npm run test:live   # 7 tests against a running dev server + mock/real Ollama:
                    #   real NDJSON stream → live artifact, bridge round-trip,
                    #   region rewriter, and the proxy still refusing pull/traversal
```

`test:live` skips cleanly when nothing is listening on 5173, so the offline suite
stays offline. Start the stack first:

```
npm run dev:mock &        # or a real Ollama on 11434
npm run dev:server &      # vault API on 8765
npm run dev &             # Vite on 5173
npm run test:live
```

## Preview without a GPU

This sandbox has no Ollama, so previews run `server/mock-ollama.cjs`. It speaks
enough of the Ollama API (`/api/tags`, `/api/show`, `/api/chat`) to exercise model
verification, streaming, artifacts, the live renderer, the vision bridge, the
region rewriter and sub agents, and **labels every reply as a mock**.
`start-app.bat` never starts it — the real build always talks to the real Ollama
on `127.0.0.1:11434`.

## What is deliberately not implemented

- **MCP / one-click tools.** Every other feature here is local and provable; MCP
  means spawning servers and opening sockets from a UI whose whole security story
  is "the proxy allows three endpoints". It needs a design pass first — see
  `00_LIVING_DOCS/BEST_OF_CLONES.md` §3. There is no fake button for it.
- **Voice**, **Claude plans/billing**, **cloud models**, **PDF/Word parsing**:
  shown as unavailable rather than silently doing nothing.
- **An Electron wrapper**: the title bar is drawn in-page; a real native menu bar
  is still pending.
