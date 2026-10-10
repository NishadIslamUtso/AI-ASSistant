# TODO_NEXT.md — Immediate Next Actions (Living)

**Last Updated:** 2026-10-10 20:10 Asia/Dhaka
**Rule:** Update after each session, priority order, check off when done.

## Priority 1 — Test Exact Clone on Windows (User Action)

- [ ] User extracts apps/01_claude-exact-pixel-clone or archive_zips/AI_ASSistant_Exact_Claude_Clone.zip on TUF A15
- [ ] Runs start-app.bat (handles already-running Ollama, installs @rollup/rollup-win32-x64-msvc)
- [ ] Opens http://127.0.0.1:5173
- [ ] Tests qwen2.5:3b replies without Tic Tac Toe loop — if looped, clear localStorage: in browser console `localStorage.removeItem('claude_exact_chats')` + `localStorage.clear()` + refresh
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

**If CORS error:** App calls now use the same-origin `/ollama` Vite proxy, so check proxy/server logs first; don't broaden Ollama origins by default. Only configure `OLLAMA_ORIGINS` if testing a direct browser-to-Ollama call outside this proxy.

## Priority 2 — Add Missing Modals From Screenshots

**Checkout reconciliation:** The user's latest handover says SettingsModal, UserMenu and AppsExtensionsModal are done; they are absent from `apps/01_claude-exact-pixel-clone/src` in this checkout. Keep these tasks open until matching source files are added/verified here.

### 2.1 Settings Modal (191707.png) — High Priority
- [ ] Create src/components/SettingsModal.jsx
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
- [ ] Create src/components/UserMenu.jsx
- Content: nishadislamutso@gmail.com, Settings, Language, Get help, Upgrade plan, Get apps and extensions, Learn more, Get API keys, Log out
- Trigger: click avatar NU bottom left
- Position: above avatar, dark #2a2a2a rounded

### 2.3 Apps and Extensions Modal (191636.png)
- [ ] Create src/components/AppsExtensionsModal.jsx
- Content: Do more with Claude everywhere you work, Claude Code Terminal VSCode etc, Microsoft 365, Chrome extension
- Trigger: Settings -> Extensions or top bar?

### 2.4 File Menu (191558.png)
- [ ] Electron only: File Edit View Go Help menu bar — for Vite web version, hide or create custom top menu bar
- For exact clone web version, File menu not needed, but for Electron version add electron/main.js menu

### 2.5 Context Menu Already Done But Verify
- [x] Context menu Open in new window, Pin chat, Rename, Add to project, Move to group, Delete on CSE220 MID etc — implemented in Sidebar.jsx
- [ ] Add functionality: Pin, Rename, Delete actually work (currently UI only)

## Priority 3 — Port Features From Electron Clone

### 3.1 Artifact Runner — Source Complete, Windows Test Pending
- [x] Add Artifacts library, single-file HTML preview, Source view, editing + Apply & run, copy and download in app 01
- [x] Create artifacts only after an explicit user request; ordinary and how-to prompts remain chat responses (client-side gate + system prompt)
- [x] Sandbox preview with isolated iframe + CSP; no external network scripts or generated shell commands
- [x] Add unit coverage for intent detection/extraction; `npm test` 7/7 and `npm run build` pass in Linux sandbox
- [ ] On Windows/Ollama, verify ordinary questions do not create an artifact and an explicit HTML/game request creates a working preview
- **Scope note:** Did not port Electron's WebContainer terminal, shell command runner, npm/multi-file app support or publishing; keep those out of this lightweight local runner unless separately requested and reviewed.

### 3.2 P4 Model Selector
- [ ] Proxy Ollama `/api/tags`, list installed models only (no model downloads), default to qwen2.5:3b and persist selection
- [ ] Make Project / model / capability controls truthful to the selected local model; do not label qwen as Sonnet

### 3.3 P5 Thinking + File/Image Upload
- [ ] Port a lightweight ThinkingDisplay from the Electron reference
- [ ] Add file and image upload; only enable vision if a vision-capable model is already installed/verified (never auto-download qwen3-vl:4b)

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

1. If user reports exact clone doesn't work on Windows, fix Priority 1 first
2. Else if user wants Settings modal, do Priority 2.1
3. Else if extension not working, do Priority 4
4. Else continue with Priority 3,5,6,7 in order

Always update living docs after each task.

## Done Log

- [x] 2026-10-10 20:10 Added explicit-request-only standalone HTML Artifact Runner to app 01; 7/7 unit tests + Vite build pass in Linux; Windows/Ollama confirmation pending.
- [x] 2026-10-10 19:20 Created master repo structure with .ai/ + 00_LIVING_DOCS/ + apps/ + extension/ + vault/ + spec/ + archive_zips/
- [x] 2026-10-10 13:19 Built exact pixel-perfect clone from 6 screenshots, Vite+React+Tailwind, direct qwen2.5:3b streaming, vault driver, bat files, zipped 13K
- [x] 2026-10-10 13:00 Built Electron clone v6 with artifacts workbench etc (previous session)
- [x] 2026-10-10 12:00 Built Extension v1.2 starter with Capsule Hub + Quillbot spec (previous session)
- [x] 2026-10-10 11:00 Built Vault v4 Clean 61 files starter (previous session)
