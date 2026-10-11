# ARCHITECTURE_LIVING.md — Implemented App + Planned Vault/Extension System

**Last Updated:** 2026-10-12 Asia/Dhaka
**Status rule:** This file separates code that exists from intended architecture. A diagram or plan is not proof of implementation.

## 1. Current app architecture (implemented in source)

```text
Browser UI: Vite + React, same-origin URLs only
    │
    ├── /api/ollama/{tags,show,chat}
    │        └── Vite or built preview server
    │                └── loopback Ollama, normally 127.0.0.1:11434
    │                    selected installed local model only
    │
    └── /api/vault/{status,today,capsules,context,blacklist,capture}
             └── Vite or built preview server
                     └── loopback Express Vault API, normally 127.0.0.1:8765
                             └── Obsidian AI-Brain Markdown files
```

The browser never calls Ollama or the vault by hard-coded `localhost` URLs. The proxy routes and methods are allowlisted in `server/proxy-policy.cjs`. Proxy destinations are restricted to unauthenticated loopback URLs. The static preview server uses the same policy rather than exposing a permissive raw proxy.

### Windows run modes

- `start-app.bat`: Vite dev server at `127.0.0.1:5173`; starts local Ollama/vault API only as needed; no wildcard `OLLAMA_ORIGINS` write; asks before a model pull if the default model is missing.
- `build-windows.bat` + `node server/preview-server.cjs`: built static app with the same same-origin local API proxy, loopback-only by default at port 4173.
- The app is not yet a native Electron/Tauri installer. The title/menu bar is rendered in the browser UI.

## 2. App features and data flows

### Chat + model

1. The app verifies local Ollama model metadata; remote/cloud aliases are blocked.
2. The selected model receives only the active conversation plus explicitly attached text/images and manually approved vault context.
3. Streamed messages are kept in browser localStorage and captured to the local vault. Failures leave the local original intact and are shown as failures.
4. Images are accepted only when local model metadata verifies vision capability. Image blobs are kept in browser IndexedDB; the app does not assume the default `qwen2.5:3b` model supports vision.
5. There is no cloud fallback, automatic model pull, hidden-key capture, or MCP server connection.

### Vault context

- `VaultPanel` reads local capsules, status, Today data, and never-check patterns from the API.
- Context retrieved from the vault is shown in a preview before it is added to the composer; retrieval is local keyword ranking, not the planned semantic index.
- Obsidian Markdown is the canonical local source. A rebuildable `.brain/index.sqlite` is a future requirement, not implemented here.

### Artifacts

1. A current explicit request (or the explicit artifact-mode toggle) is required; ordinary code blocks are not executed.
2. Inline visualizer and workbench preview use CSP plus `iframe sandbox="allow-scripts"` without `allow-same-origin`; no network, vault access, forms, popups, or parent DOM access.
3. Editing creates local immutable versions. Download exports source and warns that a downloaded file is outside the app sandbox.
4. Saving an artifact to Obsidian is a separate user action. The app previews the vault root, deterministic artifact/note paths, version, and complete content before POSTing to the local API. The API writes immutable content and a linked Markdown note.

### Message actions

- **Pin selection to edit:** selection up to 4,000 characters plus an optional note is quoted into a local unsent draft; existing draft is appended to, not overwritten. User presses Send separately.
- **Branch here:** creates an independent local conversation prefix through one selected message; message and artifact IDs are regenerated, same-browser attachments remain referenced, and the original conversation is unchanged. Branch creation triggers a local vault capture.

## 3. Proxy/security boundary

Shared policy only allows the UI endpoints: Ollama `GET /tags`, `POST /show`, `POST /chat`; vault read routes for status/today/capsules/context/blacklist; and JSON-only `POST /blacklist` or `/capture`. Pull/delete and arbitrary vault paths are denied. Writes require same-origin or explicit forwarded-preview opt-in, JSON content type, and no broad browser-form access. Cookies and Authorization are not forwarded upstream.

Artifact frames have restrictive CSP and no same-origin permission. External Markdown links are previewed with their exact URL and require a click-through. Images in Markdown are not fetched automatically. Artifact source download is local file export only, never remote deployment.

The static preview server binds to `127.0.0.1` by default; the Arena forwarded preview is started with explicit `HOST=0.0.0.0` and preview-origin configuration. Never enable this for normal Windows use.

## 4. Obsidian vault

`server/vault-api.cjs` is the app's only writer. It validates paths, rejects traversal/symlink escape, uses Asia/Dhaka dates, keeps immutable source captures, maintains never-check blacklist files, and reports success only after an acknowledged write. The API has conversation, artifact, journal, capsule, browser-visit, web-page, blacklist and status/today/context operations.

The app currently writes conversation and explicitly approved artifact captures. Extension capture, broad routine memory extraction, event/claim inference, durable journal generation, undo proposals, and a rebuildable search index are not proven complete. See `HANDOVER_LIVING.md` and `TODO_NEXT.md`.

## 5. Browser extension (separate, not yet end-to-end verified)

The repository contains a Manifest V3 extension starter with page/AI capture, capsule and Quillbot-style suggestions, blacklist checks, and a local vault writer. The browser extension → local API → Obsidian file path still needs a real browser end-to-end test. Do not treat the planned broad capture policy as verified browser coverage.

Standing policy: never capture passwords, cookies, tokens, payment fields, unsent drafts, hidden keystrokes, or continuous screenshots. Incognito stays off unless separately enabled. Failures log `wasn't accessible - reason` without prompting; blacklist patterns are explicit deny rules.

## 6. Model/resource decisions

- Default model is the user's existing Ollama `qwen2.5:3b`; no automatic download or silent fallback.
- Model capabilities are read from local metadata; no guessing by model name.
- Concurrent sub-agents are deferred for the 8 GB RAM / 4 GB VRAM TUF A15 because of memory and latency cost.
- MCP and remote hosting are not connected. They would introduce new trust/destination boundaries; obtain explicit user approval and per-use destination/content review before adding.
- No promise of Claude-equivalent reasoning or speed. Screenshot/UI parity is not model-quality parity.

## 7. Relevant files

| Path | Responsibility |
|---|---|
| `apps/01_claude-exact-pixel-clone/src/App.jsx` | Shell, local state, dialogs, branching, artifact approval |
| `src/hooks/useChat.js` | Local Ollama streaming, stop/retry, conversation vault capture |
| `src/hooks/useModels.js` | Installed-model list and capability/cloud verification |
| `src/lib/ollama.js` | Same-origin Ollama API client, NDJSON, thinking split |
| `src/lib/vault.js` | Same-origin vault API client and explicit write acknowledgement |
| `src/lib/chat-branches.js` | Prefix-only fork, regenerated IDs |
| `src/lib/edit-pin.js` | Bounded excerpt-to-draft formatting |
| `src/lib/artifacts.js` | Explicit artifact gate, sandbox HTML, deterministic Obsidian paths |
| `src/components/ArtifactInlinePreview.jsx` | Inline isolated preview |
| `src/components/ArtifactPanel.jsx` | Isolated workbench, source edit, versions, download, request save |
| `src/components/Center.jsx` | Transcript actions, pin editor, inline previews, composer |
| `server/proxy-policy.cjs` | Shared local API route and request policy |
| `server/preview-server.cjs` | Built SPA host, static path guard, same filtered proxies |
| `server/vault-api.cjs` | Local filesystem access to Obsidian Markdown |
