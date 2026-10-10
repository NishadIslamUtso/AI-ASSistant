# TODO_NEXT.md — Immediate Next Actions (Living)

**Last Updated:** 2026-10-10 20:10 Asia/Dhaka
**Rule:** Update after each session, priority order, check off when done.

## Priority 1 — Test Exact Clone on Windows (User Action)

- [ ] **Still next: user extracts/runs the app on TUF A15.** Do not use old archive ZIP; the current branch has the latest source.
- [ ] Runs start-app.bat (handles already-running Ollama, installs @rollup/rollup-win32-x64-msvc)
- [ ] Opens http://127.0.0.1:5173
- [ ] Tests the selected installed model replies without an unsolicited artifact loop. If an old thread is looped, start a new chat first; do not clear all localStorage or delete chat history.
- [ ] Confirms vault API at http://127.0.0.1:8765/context returns empty or capsules
- [ ] Reports result: does it reply? Does it match screenshots? Any errors in console?

**Why:** Exact clone built but not tested on Windows (sandbox Linux cannot run). Need user confirmation.

**Bat handles:**
```bat
- checks netstat 11434 if Ollama running, if not starts ollama serve
- npm install
- npm install @rollup/rollup-win32-x64-msvc --save-optional (fixes Vite on Windows)
- starts node server/vault-api.cjs (vault API 8765) in background
- starts npm run dev (Vite 5173)
```

**If the model list/chat fails:** First confirm Ollama is running at `http://127.0.0.1:11434/api/tags`. The exact clone uses a same-origin Vite proxy, so do not change `OLLAMA_ORIGINS` or terminate Ollama unless the browser console gives a specific CORS error.

## Priority 2 — Add Missing Modals From Screenshots

### 2.1 Settings Modal (191707.png) — High Priority
- [x] `src/components/SettingsModal.jsx` is in source; Vite build passes; Windows behavior still needs testing
- Left nav: General, Account, Privacy, Billing, Capabilities, Memory, Reflect, Time and focus, Claude Code, System, Extensions, Developer, Skills, Connectors
- Right Appearance:
  - Theme: system/sun/moon icons, options System, Light, Dark (currently dark default)
  - Chat font: Anthropic Serif
  - Transcript size: Small/Medium/Large
  - Width: Narrow/Medium/Wide
  - Motion: System/Reduced
  - Voice: Language English, Style Buttery, Speed Normal
- Trigger: click avatar NU Utso Free bottom left -> user menu -> Settings -> opens modal
- Store settings in localStorage claude_exact_settings

### 2.2 User Menu (191608.png)
- [x] `src/components/UserMenu.jsx` is in source; local-only account actions explain that remote actions are not connected
- Content: nishadislamutso@gmail.com, Settings, Language, Get help, Upgrade plan, Get apps and extensions, Learn more, Get API keys, Log out
- Trigger: click avatar NU bottom left
- Position: above avatar, dark #2a2a2a rounded

### 2.3 Apps and Extensions Modal (191636.png)
- [x] `src/components/AppsExtensionsModal.jsx` is in source; local extension setup is distinguished from external Claude/Microsoft apps
- Content: Do more with Claude everywhere you work, Claude Code Terminal VSCode etc, Microsoft 365, Chrome extension
- Trigger: Settings -> Extensions or top bar?

### 2.4 File Menu (191558.png)
- [ ] Electron only: File Edit View Go Help menu bar — for Vite web version, hide or create custom top menu bar
- For exact clone web version, File menu not needed, but for Electron version add electron/main.js menu

### 2.5 Context Menu Already Done But Verify
- [x] Context menu Open in new window, Pin chat, Rename, Add to project, Move to group, Delete on CSE220 MID etc — implemented in Sidebar.jsx
- [x] Pin/unpin, Rename, Add to project, Move to group, Delete (with confirmation), and Open in new window actions are in source; validate on Windows.

## Priority 3 — Port Features From Electron Clone

### 3.1 Artifact Runner
- [x] Added a smaller HTML-only artifact runner in the exact clone (not a direct port of Electron Workbench)
- [x] Artifacts open in an HTML-only Preview/Source panel; explicit request gate prevents unrelated replies from creating artifacts
- [x] Artifact HTML preview is sandboxed with network requests blocked; model response format still needs qwen-on-Windows verification

### 3.2 Thinking Display
- [x] Optional thinking output display is in the chat; exposed only for model IDs that match known patterns, not capability-verified

### 3.3 File Upload + Image Upload
- [x] Text attachments and image upload path added; images are blocked unless selected model name matches vision patterns. Do not download qwen3-vl:4b; test only if already installed

### 3.4 Project Dropdown + Model Selector
- [x] Project dropdown can create/select local project labels; it is not full Claude Projects functionality
- [x] Model selector lists installed models from `/api/tags` via Vite proxy and defaults to qwen2.5:3b when unset; do not download missing models
- [x] Selected model persists in localStorage; capabilities are not yet verified and must not be inferred from UI alone

## Priority 4 — Wire Extension -> Vault API -> Obsidian Files

- [ ] Test extension/ loaded as unpacked in Chrome
- [ ] Ensure vault API running at 8765
- [ ] Test background.js history listener: visit site, check 02 Sources/Browser Activity/<year>/<month>.jsonl created
- [ ] Test ai-capture.js: chat on ChatGPT/Claude, submit message, check 02 Sources/Conversations/<provider>/<year>/<id>.md created
- [ ] Test generic-capture.js: visit any site, check 02 Sources/Web Pages/<year>/<id>.md created
- [ ] Test wasn't accessible logging: block permission or visit private window, check 09 Activity & Undo + 01 Inbox/Processing Errors logged "wasn't accessible - reason"
- [ ] Test blacklist: add bank.com/* in popup Never-Check tab, visit bank.com, confirm skipped and logged "skipped - blacklist", never collected
- [ ] Test queue: stop vault API, visit sites, check chrome.storage.local.queue has items, start API, confirm flush
- [ ] Test GET /context?q=... returns relevant capsules/entities

## Priority 5 — VaultPanel Enhancements (Capsule Hub + Quillbot)

- [ ] Enhance VaultPanel.jsx to show Capsule library: list capsules from GET /context, search, drag-drop
- [ ] Add drag-drop inject: drag capsule from VaultPanel into Center.jsx composer textarea, inject content with preview
- [ ] Add blacklist manager in VaultPanel: show excluded_patterns, add/remove pattern, sync to 00 System/Privacy & Access.md via POST /blacklist
- [ ] Add Open Loops display: from 04 Working Memory/Open Loops.md
- [ ] Add Current Snapshot display: from 04 Working Memory/Current Snapshot.md
- [ ] Add Cook This Prompt button: enhance current prompt with relevant vault context via GET /context

## Priority 6 — Today View + Journal + Follow-ups

- [ ] Create Today view: surfaces Current Snapshot.md, today's journal draft 08 Journal/<year>/<date>.md, due user-approved follow-ups, one useful next action
- [ ] Journal auto-generation: from captured/authorized sources, event time vs capture time, source-linked, never invent offline events/feelings
- [ ] Follow-ups: topic, last_update, next_check, cadence, sensitivity, status, answer/skip/snooze/stop controls, user chooses cadence for sensitive topics
- [ ] End-of-day prompts opt-in: show answer/skip/snooze/stop, silence not resolution

## Priority 7 — Build Windows Installer

- [ ] For exact clone: add Electron wrapper (electron/main.js, preload.js) similar to 02_electron-clone-v6, or Tauri lighter for 8GB RAM
- [ ] Build installer: npm run electron:build creates dist/ installer
- [ ] Test installer on TUF A15, dark default, Windows title bar visible, remembers theme choice
- [ ] Include vault API auto-start, Ollama detection, model manager UI

## Priority 8 — Documentation & Testing

- [ ] Update 00_LIVING_DOCS/REQUIREMENTS_LIVING.md acceptance checklist as features done
- [ ] Test with synthetic data: vault read/write, conflict safety, model capabilities, Claude UI inventory, authorized capture, journal/provenance, retention controls, model switch, external-send approval
- [ ] Create synthetic conversation test: full transcript survives summaries unchanged, duplicate handling, failed adapter never reports false success
- [ ] Update .ai/STATE.json after each feature

## Priority 9 — Master Zip & GitHub Push

- [x] Create master repo structure — DONE 2026-10-10 19:20
- [ ] Build master zip excluding node_modules/dist/.git: AI-ASSistant-Master-Github-Repo.zip
- [ ] User pushes to GitHub: git init, add, commit, remote add origin, push
- [ ] Verify GitHub repo has living docs + apps + extension + vault + spec + archive_zips

## How to Pick Next Task

1. Windows validation is the next user action; do not claim tested until result is reported.
2. For coding after that, work on Priority 4 extension-to-vault validation, then Priority 5 Capsule/VaultPanel, then Priority 6 Today/Journal.
3. Model capability claims remain blocked until the model is actually tested; do not pull/download models automatically.

Always update living docs after each task.

## Done Log

- [x] 2026-10-10 20:10 Added exact-clone dialogs, local Ollama model selector, attachment path, thinking display path, sandboxed explicit-only HTML artifact runner, relative Vite proxies and vault API path/logging fixes; tests/build pass in Linux sandbox, Windows/Ollama untested
- [x] 2026-10-10 19:20 Created master repo structure with .ai/ + 00_LIVING_DOCS/ + apps/ + extension/ + vault/ + spec/ + archive_zips/
- [x] 2026-10-10 13:19 Built exact pixel-perfect clone from 6 screenshots, Vite+React+Tailwind, direct qwen2.5:3b streaming, vault driver, bat files, zipped 13K
- [x] 2026-10-10 13:00 Built Electron clone v6 with artifacts workbench etc (previous session)
- [x] 2026-10-10 12:00 Built Extension v1.2 starter with Capsule Hub + Quillbot spec (previous session)
- [x] 2026-10-10 11:00 Built Vault v4 Clean 61 files starter (previous session)
