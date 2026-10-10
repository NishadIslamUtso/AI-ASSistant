# NEW SESSION HANDOVER — Start Here

**Canonical source:** https://github.com/NishadIslamUtso/AI-ASSistant
**Current task:** Claude app (apps/01_claude-exact-pixel-clone) — exact clone of the screenshots in spec/screenshots/ (191547-191707).
**Branch for this session:** arena/c4f75cce-ai-assistant

## Read in this order
1. .ai/AGENT_INSTRUCTIONS.md — mandatory
2. .ai/CONTEXT.json
3. .ai/STATE.json — current status (the source of truth for what is built)
4. 00_LIVING_DOCS/REQUIREMENTS_LIVING.md, HANDOVER_LIVING.md, TODO_NEXT.md
5. spec/CLAUDE_SPEC_FROM_SCREENSHOTS.md — "MEASURED VALUES" section first
6. spec/screenshots/ — the six key images

## Corrections to the old handover text (verified 2026-10-10)
- UserMenu.jsx, AppsExtensionsModal.jsx and SettingsModal.jsx did NOT exist. They were marked done by mistake. They now exist (session 2).
- Colours #1a1a1a / #202020 / #242424 were guesses. Measured: #151515 main, #111111 sidebar, #20201f composer.
- Browser calls to 127.0.0.1:11434 and :8765 were replaced by same-origin proxies (/api/ollama, /api/vault) in vite.config.js.

## Status (summary)
- Built in source: sidebar, centre, composer, model picker, user menu, apps modal, settings modal, menu bar, context menu (Pin/Rename/Delete), per-chat transcripts, streaming replies, settings persistence.
- Verified: vite build; proxy curl tests; jsdom smoke test 25/25 against mock Ollama.
- Not verified: visual comparison in a real browser; real qwen2.5:3b replies; Windows.
- Not built: artifact runner (P3), uploads and thinking (P5), capsule drag-drop, blacklist manager, Open Loops (P7), Today view (P8), installer (P9), Projects/Groups.

## How to run (Windows)
```
cd apps\01_claude-exact-pixel-clone
start-app.bat
```
Then open http://127.0.0.1:5173. Ollama must have qwen2.5:3b (or any model you pick in the composer).

## Rules that never change
- Dark default. Windows title bar and caption buttons visible. Exact layout, not loosely inspired.
- Vault (AI-Brain/) is canonical memory; app is the driver (8765); extension is the collector.
- Capture default: check everything after one-time permission; log "wasn't accessible - reason" without asking; never-check blacklist editable.
- No passwords, cookies, tokens, payment data, or unsent drafts are collected.
- Update 00_LIVING_DOCS, .ai/STATE.json (and ai/ mirror), and memory/sessions after every change.
