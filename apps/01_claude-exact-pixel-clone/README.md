# AI ASSistant — active screenshot clone

**Version:** 0.2.0 · **Target:** the six Claude desktop references 191547–191707 in `../../spec/screenshots/`.

This is the active React/Vite implementation, not the older Electron reference. The app is the **driver**, Obsidian Markdown in `../../vault/AI-Brain/` is canonical memory, and `../../extension/` remains the collector/suggester starter. UI similarity is not Claude-level intelligence or official Claude integration.

## Windows: existing Ollama, no model downloads

For beginner help, give one step and wait. The next step is to extract the source ZIP into a **new folder**, not over an existing vault.

After extraction, open this app folder and double-click `start-app.bat` when ready. It checks Node (18+; a supported Node 22/24 LTS is preferred), installs the pinned JavaScript dependencies if needed, probes the already-running Ollama service, and starts the existing Ollama installation only if necessary. It checks that **qwen2.5:3b is already installed**. It never pulls a model, reinstalls Ollama, kills an existing Ollama process, sets wildcard Ollama origins, or asks for native compiler tools. Windows runtime verification is still pending.

The launcher checks/reuses a healthy vault API at **8765**, reports its root, and starts Vite at **5173**. Open `http://127.0.0.1:5173`. `build-windows.bat` builds **web dist**, not an Electron app or an installer.

A hosted Arena preview runs on the sandbox machine; it cannot reach your laptop's Ollama. An offline model notice there is expected and is not a Windows test.

## Developer setup

```sh
npm ci
npm run dev:server        # terminal 1: canonical vault API, loopback 8765
npm run dev               # terminal 2: Vite 5173
npm test
npm run build
```

No model install command is part of setup. Model selection reads real `/api/tags` and selected `/api/show` metadata. Installed cloud tags/remote aliases are disabled. Selection is never switched automatically. Vision/thinking require verified capabilities; no fake thought process is generated.

### Local services and overrides

Browser code calls relative URLs only:

- `/api/ollama` → `http://127.0.0.1:11434/api`
- `/api/vault` → `http://127.0.0.1:8765`

`OLLAMA_API_URL` and `VAULT_API_URL` may change **loopback service ports**, not point to remote services or include credentials. The proxy exposes only the driver endpoints, checks same-origin JSON writes, and strips browser cookies/authorization. Ollama receives a local server-to-server request without a browser Origin; no wildcard CORS configuration is needed.

The server defaults to the repository's **canonical** `vault/AI-Brain/`, not an app-local duplicate. `AI_BRAIN_VAULT` can explicitly select an existing vault directory. Missing directories are refused rather than silently created. `PORT` and `HOST` configure the API; its default bind is `127.0.0.1:8765`. Binding `0.0.0.0` with `ALLOW_PREVIEW_ORIGINS=1` is sandbox-preview configuration, not the private Windows default.

Actual API: `GET /health`, `/context?q=…`, `/capsules`, `/blacklist`; `POST /capture`, `/blacklist`. Capture types include conversations, capsules, pages, visit metadata and inaccessible-source errors. There is no arbitrary file-read, shell, model-pull, remote publish or delete API.

## Implemented scope

- Screenshot-shaped sidebar, user menu, Settings/Appearance and Apps/Extensions dialogs. Appearance, transcript, motion and chat/project controls persist locally; unsupported official services and local voice are clearly unavailable.
- Real streamed local chat, per-conversation messages, history/reload, Stop, partial/error labeling, Markdown, and explicit-only HTML/SVG artifacts.
- Artifact Preview/Code, edits, preserved local versions, downloads, manual imports and library. Previews have an opaque `sandbox="allow-scripts"` frame and restrictive CSP. Parent `frame-src 'none'` permits inline srcdoc but denies all frame navigations, including local API and external URLs. **Downloaded original HTML is not sandboxed.** React/npm/CDN bundling and shell execution are not provided.
- Up to 4 text/code files (64 KB and 12,000 characters per file), or PNG/JPEG/WebP (2 MB each) only with verified vision. Text content enters the actual request; image base64 enters a vision request. Images use IndexedDB; submitted originals are also captured in vault source attachments. PDF/Word are not parsed.
- A conservative **12,000-character** request guard for a **4,096-token** context. This is not an exact tokenizer, especially for Bengali; real model/context behavior remains to be verified. Requests over the guard are refused, not silently pruned. Originals are retained.
- Submitted originals are captured immediately and final/partial replies as immutable snapshots; retries deduplicate identical captures. Latest capture-status tokens prevent an older save result hiding a newer failure. Browser drafts are UI cache only, not captured before submission.
- Capsule library reading, typed drag/drop, exact-content preview before insertion, local keyword `Cook This Prompt` with a preview, and an editable vault blacklist. These are **not** a complete Capsule Hub (branch/rollback/attachment transfer remain pending).
- Model-authored Markdown images are never fetched. HTTP(S) links require an exact destination/path/query preview and one navigation approval; no extra chat/vault data is attached by the app.

Artifact imports/source-edit versions and project grouping are currently browser-local; a complete canonical artifact/project index is not implemented. Keyword capsule/entity retrieval is not a general personal-memory graph or vector search.

## Visual evidence and limits

All six reference PNGs are **1920×1020**. They are resized by the image viewer. Comparable captures use **1280×680 CSS pixels at DPR 1.5**, producing native 1920×1020 files. This is a comparison assumption, **not a confirmed Windows DPI setting**.

Required palette: main `#1a1a1a`, sidebar `#202020`, composer `#242424`; desktop sidebar **260 CSS px**. Fresh transcript width is **Narrow (588 px)**, Medium 768, Wide 960; the reference actually selects Narrow. Older text saying Medium was approximate. Typography uses system/Georgia fallbacks, not a bundled licensed Anthropic font. Native title bar, File/Edit/View/Go/Help, Windows fonts/DPI and final user-confirmed pixel parity remain pending in the native wrapper phase.

The screenshot starter chat titles are empty UI placeholders, not evidence imported from past chats. Artifact counts reflect real local artifacts, and the selector displays the actual local model rather than falsely claiming Sonnet.

## Automated tests

```sh
npm test                       # isolated Node/API tests, temporary vaults
npx playwright install chromium # optional test-browser download, NOT needed to run the app
npm run test:e2e                # mocked Ollama + disposable API18765/Vite5174
```

Alternatively set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an existing Chromium executable. `PLAYWRIGHT_CHROMIUM_ARGS` is a JSON array for sandbox-only launch options. **Never disable web security or site isolation in artifact isolation tests.** The suite does not contact a real model or write synthetic chats to the canonical vault.

See `../../TESTING_CHECKLIST.md` for final results, Windows checks and remaining extension work. Ignore dependency/build/test/cache artifacts. Never blindly stage or push private vault edits.
