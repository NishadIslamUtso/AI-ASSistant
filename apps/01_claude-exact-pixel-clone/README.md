# AI ASSistant — local-first Claude-style desktop UI

This app follows the user's Claude desktop screenshots (`spec/screenshots/191547 … 191707.png`) while using an installed local Ollama model and the Obsidian AI-Brain vault. It reproduces the interface, not Claude's hosted model quality. The default stays `qwen2.5:3b`; the app never downloads a model or falls back to a cloud model automatically.

## Run on Windows 11 (TUF A15, 8 GB RAM / 4 GB VRAM)

1. Install Node.js 20+ and Ollama if they are not already installed.
2. In Command Prompt, open this folder and run:

   ```bat
   start-app.bat
   ```

3. If Ollama is stopped, the launcher starts `ollama serve`. It offers to pull `qwen2.5:3b` only if that model is missing; answer **N** to skip the download. Start the app anyway and select an already-installed model.
4. The app opens at `http://127.0.0.1:5173`. Keep the terminal window open while using it.

First run installs Node dependencies. No native compiler is assumed. The launcher does not write `OLLAMA_ORIGINS=*` into Windows and does not start a mock model. `check-ollama.bat` diagnoses Node, Ollama, installed models, and the vault API.

## Local API boundary

The browser calls only same-origin `/api/...` paths. The Vite server (and the optional built-app preview server) proxies to loopback Ollama and the local vault API. `server/proxy-policy.cjs` permits only the routes used by the UI. Model pull/delete, arbitrary vault paths, cross-origin writes, and browser-form writes are refused. Proxy destinations must be unauthenticated loopback URLs; cookies and authorization headers are not forwarded.

| Browser route | Local destination |
|---|---|
| `/api/ollama/tags` | `127.0.0.1:11434/api/tags` |
| `/api/ollama/show` | `127.0.0.1:11434/api/show` |
| `/api/ollama/chat` | `127.0.0.1:11434/api/chat` |
| `/api/vault/...` | `127.0.0.1:8765/...` |

Normal Windows use needs no CORS environment change. The built preview server binds to `127.0.0.1` by default. A trusted forwarded preview can opt in with `ALLOW_PREVIEW_ORIGINS=1`; do not set that for an ordinary local run.

## Features carried forward and added

- **Screenshot-led UI:** the palette the user chose (`#1a1a1a` main, `#202020` sidebar, `#242424` composer, `#d48264` accent), 260px sidebar, Settings, account/apps dialogs, Today view, projects, and local chat history. The UI adopts the requested `01199af1` lineage through the `arena/3c06e1bf-ai-assistant` branch; the title bar, Today view, and stated privacy requirements remain.
- **Local model picker:** verifies Ollama model metadata and rejects remote/cloud aliases. Model capabilities such as vision/thinking must come from local Ollama metadata, not a guessed model name. No model is silently installed or switched.
- **Vision bridge:** selected images (PNG/JPEG/WebP, max 2 MB) go only to an installed local model whose Ollama metadata verifies vision support. `qwen2.5:3b` is not assumed to support vision. Text-only models refuse images without sending them.
- **Inline visualizer and artifact workbench:** explicit HTML/SVG requests get a small inline preview and a larger preview/source panel. Both previews use an isolated `iframe sandbox="allow-scripts"` with a restrictive CSP, no network, no vault access, forms, popups, or parent DOM access. Ordinary answers never run code. Download exports the source file locally and warns that an exported file is no longer sandboxed.
- **Pin selection to edit:** select up to 4,000 characters in a message, add an optional note, and add the quoted excerpt to the composer draft. This is draft-only: nothing is sent until the user presses Send; existing unsent text is preserved.
- **Conversation branching:** “Branch here” creates a local conversation from the transcript prefix through that message, regenerates message/artifact IDs, keeps local attachment references, and leaves the original unchanged. The new branch is also captured to the Obsidian vault.
- **Local storage and capture safety:** corrupt browser storage is preserved for recovery; sent image blobs stay in browser IndexedDB; chat originals remain in local history when Ollama or vault capture fails. Manual vault context is previewed before adding to a prompt.
- **Never-check blacklist:** a revocable local deny-pattern list blocks matching page captures; no credentials, payment fields, hidden keystrokes, unsent drafts, or continuous screenshots are collected.

### Deliberately not enabled

Sub-agents are deferred because concurrent local inference is a poor fit for 8 GB RAM / 4 GB VRAM and would make replies slower. MCP servers, cloud fallback, and remote deployment are not connected: each would add a new trust boundary and external destination. There is no automatic upload. Artifact download is a local file export, not a hosted deployment.

## Layout and pixel spec

The palette above is user-stated and authoritative. Measured dimensions that the user did not state are documented in `spec/MEASURED_PIXELS.md` and can be re-derived with the dependency-free `tools/pngread.py`; measurements never override a user-specified color.

## Build a local static bundle

Run `build-windows.bat`, then start `node server\\preview-server.cjs` and open `http://127.0.0.1:4173`. This serves the built files and retains the policy-filtered local Ollama/vault proxies. Do not publish this server to a network or expose it beyond loopback for ordinary use.

## Tests

```sh
npm test
# 55 Node tests: artifact/storage, branching and edit-pin logic, Ollama streaming,
# preview proxy policy and path safety, and the Vault API.

# Optional UI smoke tests (extra test-only dependency; not required by the app):
npm install --no-save --package-lock=false jsdom@30.1.2
npm run test:ui
# 7 jsdom smoke tests, including artifact sandbox/save review, draft-only pinning, and branches.
```

`npm run test:e2e` contains optional Playwright browser tests; a Playwright runner and browser must be installed separately. The app itself does not require Playwright or jsdom.

## Files worth knowing

| File | Purpose |
|---|---|
| `src/App.jsx` | App shell, local state, dialogs, navigation, and branch creation |
| `src/hooks/useChat.js` | Local send/stream/stop, attachment handling, and vault capture |
| `src/hooks/useModels.js` | Installed-model list, local/cloud verification, and capability checks |
| `src/lib/ollama.js` | Same-origin Ollama client, NDJSON, thinking split, and system prompt |
| `src/lib/attachments.js` | Text/image intake, size guards, local IndexedDB image storage |
| `src/lib/chat-branches.js` | Prefix-only conversation branching with independent artifact IDs |
| `src/lib/edit-pin.js` | Safe size-limited excerpt-to-draft formatting |
| `src/lib/artifacts.js` | Explicit artifact gating and restrictive sandbox document builder |
| `src/components/ArtifactInlinePreview.jsx` | Isolated inline visualizer |
| `src/components/ArtifactPanel.jsx` | Sandboxed workbench, source editor, version history, and local download |
| `src/components/Center.jsx` | Transcript, message actions, pin-to-edit, preview, composer |
| `server/proxy-policy.cjs` | Shared browser API allowlist, origin/method/content-type boundary |
| `server/preview-server.cjs` | Loopback-only static server with the same filtered API proxies |
| `server/vault-api.cjs` | Local API; the only app process that writes to the Obsidian vault |
| `server/mock-ollama.cjs` | Explicit preview/test stub; never launched by the Windows app |
