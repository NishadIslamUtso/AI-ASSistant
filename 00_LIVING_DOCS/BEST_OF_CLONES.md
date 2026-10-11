# BEST_OF_CLONES.md — What Was Taken From The Curated List

**Created:** 2026-10-11 (Asia/Dhaka)
**Trigger:** *"now, you take the best from all of them and make my app functional"*
**Where the code lives:** `apps/01_claude-exact-pixel-clone/`

This file exists so the next session can see, item by item, what the curated
lists of Claude clones / local runners / Ollama frontends / plugin stores were
actually used for, and what was deliberately not used.

**Rule applied throughout:** nothing was copied and no dependency was added. The
target machine is a TUF A15 (8 GB RAM, 4 GB VRAM, slow connection), so every
feature was re-implemented inside this app's own modules on top of what it
already had — a local Ollama, the sandboxed artifact preview, and the AI-Brain
vault. Where a project's *idea* was adopted, the row says so; where only its
*existence* confirmed our direction, the row says that instead.

---

## 1. What was built this session

| # | Feature | Source idea | Where it lives now | Notes |
|---|---------|-------------|--------------------|-------|
| 1 | **Inline visualizer — live while streaming** | `Classic298/open-webui-plugins` (charts drawn while the reply streams) | `src/lib/artifacts.js` (`previewScript`, `artifactsIn`), `src/components/ArtifactPanel.jsx`, `src/components/Center.jsx` | The panel opens itself the moment a document starts, renders through `LIVE_INTERVAL = 700 ms`, and shows a `Live` badge. Charts need no CDN: a canvas carries inline JSON (`data-chart`) and ~120 lines of the preview script draw bar/line/pie/doughnut. |
| 2 | **Comment mode / pin an element** | `OpenCoworkAI/open-codesign` (comment mode pins a region to rewrite) | `previewScript` (pick mode), `parseElementPick`, `rewritePrompt`, `applyElementRewrite` | Click an element in the sandboxed preview → pin card → "Rewrite this region". The model returns **one element**, the app replaces exactly that node and offers it as a new version. Nothing else in the document is touched. |
| 3 | **Sub agents with isolated context** | `Skyzi000/open-webui-extensions` (sub-agent tool, 20k+ downloads) | `src/hooks/useSubAgents.js`, `src/components/SubAgentPanel.jsx` | Six roles (researcher, critic, summarizer, coder, extractor, custom), optional AI-Brain lookup, one job at a time so two runs never share the GPU. Results land in the panel; nothing reaches the chat until "insert" is pressed. |
| 4 | **Branching conversations** | `lobehub/lobe-chat` (fork from any message) | `useChat.branch`, `Center.jsx` message actions, sidebar | "Branch from here" forks the transcript up to that message into a new chat; the original keeps its own copy. |
| 5 | **Deployable export** | `claudio-silva/claude-artifact-runner` (artifact → deployable app) | `src/lib/zip.js`, `staticSiteEntries`, the export button in `ArtifactPanel` | A dependency-free ZIP writer (stored entries, real CRC32) producing `index.html`, `README.md`, `vercel.json`, `netlify.toml`, `.gitignore`. No bundler, no `vite build`, no 200 MB `node_modules` — a single-file HTML app *is* deployable. |
| 6 | **Vision bridge** | `Damienchakma/Open-claude` (webcam/multimodal intake) + the P8 hardware limit | `src/lib/vision.js`, `src/hooks/useVisionBridge.js`, `useChat.describeImages`, `Composer`, `Settings → Vision` | qwen2.5:3b cannot see. With qwen3-vl:4b installed, the image is described locally first and the *description* is what the answering model receives — labelled in the transcript, in the vault capture, and on the attachment chip. Capabilities come from `/api/show`, never from a model's name. |
| 7 | **Live service status** | `open-webui` connection panels | `src/components/AppsExtensionsModal.jsx` | Replaces "this is a screenshot-matched placeholder" where the truth is now known: Ollama, vault API, vision bridge and sub-agent counts are checked live instead of described. |

## 2. Ideas taken as guidance, not as code

| Source | What was taken |
|--------|----------------|
| `13point5/open-artifacts` | Artifacts are a first-class surface, not a code block: library, versions, preview/source split. Kept the existing implementation and made it *live*. |
| `lobehub/lobe-chat` plugin store + `lobehub.com/mcp` | The plugin-marketplace shape informed the sub-agent role picker and the service-status grid. No network marketplace is called: everything is local and offline. |
| `open-webui` community tool pages | Roles and one-line hints in `AGENT_PRESETS` are written the way that store describes its tools. |
| `Mintplex-Labs/anything-llm`, `danny-avila/LibreChat` | Confirmed that "no-code agent builder" = a form plus a result pane; that is what `SubAgentPanel` is. |
| `ollama/ollama`, `janhq/jan`, `mudler/LocalAI` | Confirmed the local-first posture already in place: one loopback endpoint, no cloud fallback. `LocalAI`'s OpenAI-compatible surface was **not** adopted — the app speaks Ollama's API directly. |
| `open-codesign` demos | Its comment-mode UX (pin → note → rewrite region) is the model for feature 2. |

## 3. Deliberately not adopted

| Item | Why not |
|------|---------|
| **MCP one-click (#7 in the curated list)** | Written and reading MCP servers means spawning child processes and opening sockets from a UI whose entire security story is "the proxy allows exactly three endpoints". It needs its own design pass (which server, which permission, who audits it) before a button exists. Left as an explicit TODO, not a fake button. |
| CDN chart libraries (Chart.js / D3 / ECharts / Plotly) | The preview CSP is `default-src 'none'; connect-src 'none'`. Fetching a library would either break the sandbox or require loosening it. A canvas renderer was written instead. |
| React/Vite artifact runner inside the panel | Running `vite build` per artifact needs a toolchain, a network install and minutes of CPU on a 4 GB machine. The export path covers the real goal (something publishable) with none of that. |
| Multi-user/RBAC, cloud sync, telemetry | Single-user local app; the vault is the record of truth. |
| Anything that talks to a hosted model | Out of scope by requirement. The picker still filters cloud entries returned by Ollama. |

## 4. How each adopted feature is proven

| Feature | Proof |
|---------|-------|
| Live artifact while streaming | `tests/best-of-all.test.js` (partial vs saved, stable id), `tests/ui.smoke.cjs` "opens the live preview by itself", `tests/live-stack.check.js` "a real stream is turned into a live artifact before it finishes" (against the real proxy + real NDJSON stream) |
| Comment mode | `parseElementPick` validation, `rewritePrompt` contents, `applyElementRewrite` replaces only the picked node, refuses an unusable answer, and preserves fragment-vs-document shape |
| Sub agents | unit budget checks + UI test proving the result never enters the transcript and only reaches the composer on insert |
| Branching | UI test: header shows `Branch ·`, the sidebar gains `(branch)`, the original transcript is unchanged |
| Export | ZIP round-trip with an independent reader (signatures, entry names, CRC32 recomputed), site layout, traversal-safe entry names |
| Vision bridge | unit tests (bridge only when needed, never the answering model, capped description, labelled block) + UI test (attach → chip names the describer → transcript reports the hop) + live test against the real vision route |
| Policy unchanged | live test asserts `POST /api/ollama/pull` → 403 and an encoded vault traversal → 403 |

**Totals (offline):** `npm test` 69 pass, `npm run test:ui` 9 pass.
**Live (needs the dev server up):** `npm run test:live` 7 pass.
