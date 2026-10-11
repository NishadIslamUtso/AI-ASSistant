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

## Why there is no CORS problem

`vite.config.js` proxies:

| Browser call | Forwarded to |
|---|---|
| `/ollama/api/chat` | `http://127.0.0.1:11434/api/chat` |
| `/vault/...`       | `http://127.0.0.1:8765/...` |

The browser stays same-origin, so `OLLAMA_ORIGINS` no longer matters. On startup the app
hits `/__ai_proxy_ping`; if that answers `{proxy:true}` it uses the proxies, otherwise it
falls back to the direct URLs in Settings → System.

## Layout (from 191547.png)

```
┌ TitleBar  File Edit View Go Help              ✳ AI ASSistant   ● Ollama ● Vault ┐
│ Sidebar 260px #202020      │ Center #1a1a1a          │ AI-Brain │ Artifacts     │
│  Search                    │  Free plan · Upgrade    │ (Ctrl+J) │ (Ctrl+Shift+A)│
│  + New chat                │  "Evening, Utso." ✳     │          │               │
│  Projects / Artifacts (n)  │  composer #242424       │ capsules │ preview|code  │
│  Customize                 │  Project · model ·      │ blacklist│               │
│  Oct 8 / Older / Pinned    │  Medium · Manual ·  ↑   │ today    │               │
│  [NU] Utso · Free          │                         │          │               │
└────────────────────────────┴─────────────────────────┴──────────┴───────────────┘
```

## What each file does

| File | Purpose |
|---|---|
|---|---|
| `src/App.jsx` | State, sending, streaming, artifacts, shortcuts |
| `src/context/SettingsContext.jsx` | Settings (191707) + theme/motion/font applied to `<html>` |
| `src/lib/ollama.js` | Ollama client: ping, list models, streaming chat, `<think>` split |
| `src/lib/vault.js` | Vault API client, fails soft |
| `src/lib/artifacts.js` | Artifact extraction + "did the user actually ask?" check |
| `src/lib/markdown.jsx` | Dependency-free markdown renderer |
| `src/lib/demo.js` | Offline demo responder (off unless `?demo=1`) |
| `src/components/Sidebar.jsx` | 260px sidebar + working context menu (191646) |
| `src/components/Center.jsx` | Greeting, transcript, composer placement |
| `src/components/Composer.jsx` | `#242424` input, model/effort/thinking/project, uploads |
| `src/components/SettingsModal.jsx` | 191707 settings |
| `src/components/AppsExtensionsModal.jsx` | 191636 apps + extensions |
| `src/components/UserMenu.jsx` | 191608 user menu |
| `src/components/ArtifactPanel.jsx` | Artifact preview / code / save to vault |
| `src/components/VaultPanel.jsx` | Capsules, never-check blacklist, Today |
| `src/components/TitleBar.jsx` | File Edit View Go Help (191558) |
| `server/vault-api.cjs` | The only thing that writes to the vault |
| `server/mock-ollama.cjs` | Ollama-compatible stub for previews only — never started by `start-app.bat` |
| `tools/pngread.py` | Dependency-free PNG decoder used to verify the pixel spec (repo root) |

## Pixel spec

The layout is built from **measured** values, not estimates. `spec/MEASURED_PIXELS.md`
records them; `tools/pngread.py` (repo root) can re-derive them from the PNGs with
no third-party libraries:

```python
import pngread
img = pngread.read_png('spec/screenshots/Screenshot 2026-10-10 191547.png')
pngread.hexof(img['px'](200, 600))   # '#111111' — the sidebar
```

The earlier spec's estimates (sidebar 260px `#202020`, main `#1a1a1a`,
composer `#242424`) were wrong.

## Tests

```
npm test           # 20 unit + vault-integration tests, node --test, no new deps
npm i -D jsdom     # only needed for the UI smoke test
npm run test:ui    # 4 jsdom tests: render, artifact gating, settings, context menu
```

jsdom is deliberately **not** a declared dependency — the target machine has a
slow connection — so `test:ui` skips cleanly when jsdom is absent.

## Keys

`Ctrl+B` sidebar · `Ctrl+J` AI-Brain panel · `Ctrl+Shift+A` artifacts · `Ctrl+N` new chat ·
`Alt+T` Today view · `Enter` send · `Shift+Enter` newline.

## Preview without a GPU

This sandbox has no Ollama, so previews run `server/mock-ollama.cjs`. It speaks
enough of the Ollama API to exercise streaming and artifacts, and **labels every
reply as a mock**. `start-app.bat` never starts it — the real build always talks
to the real Ollama on `127.0.0.1:11434`.
