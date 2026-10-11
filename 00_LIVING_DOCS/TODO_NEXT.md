# TODO_NEXT.md — Immediate Next Actions (Living)

**Last Updated:** 2026-10-10 (session 2) Asia/Dhaka
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

**If CORS error:** Run `setx OLLAMA_ORIGINS "*"` in cmd, restart Ollama: `taskkill /F /IM ollama.exe` then `ollama serve`

## Priority 2 — Add Missing Modals From Screenshots

### 2.1 Settings Modal (191707.png) — DONE session 2
- [x] Create src/components/SettingsModal.jsx
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

### 2.2 User Menu (191608.png) — DONE session 2
- [x] Create src/components/UserMenu.jsx
- Content: nishadislamutso@gmail.com, Settings, Language, Get help, Upgrade plan, Get apps and extensions, Learn more, Get API keys, Log out
- Trigger: click avatar NU bottom left
- Position: above avatar, dark #2a2a2a rounded

### 2.3 Apps and Extensions Modal (191636.png) — DONE session 2
- [x] Create src/components/AppsExtensionsModal.jsx
- Content: Do more with Claude everywhere you work, Claude Code Terminal VSCode etc, Microsoft 365, Chrome extension
- Trigger: Settings -> Extensions or top bar?

### 2.4 File Menu (191558.png) — web menu DONE session 2, Electron native still open
- [x] Web: hamburger MenuBar.jsx with File Edit View Go Help
- [ ] Electron only: File Edit View Go Help menu bar — for Vite web version, hide or create custom top menu bar
- For exact clone web version, File menu not needed, but for Electron version add electron/main.js menu

### 2.5 Context Menu Already Done But Verify
- [x] Context menu Open in new window, Pin chat, Rename, Add to project, Move to group, Delete on CSE220 MID etc — implemented in Sidebar.jsx
- [x] Pin, Rename, Delete work (session 2). Add to project + Move to group still disabled

## Priority 3 — Port Features From Electron Clone

### 3.1 Artifact Runner
- [ ] Port from apps/02_electron-claude-clone-v6/src/components/ArtifactPanel.jsx + Workbench
- Artifacts (2) HTML Application from user screenshots shows Tic Tac Toe loop but should be generic artifact runner
- Only create artifacts when explicitly asked (fix Tic Tac Toe loop)

### 3.2 Thinking Display
- [ ] Port ThinkingDisplay.jsx

### 3.3 File Upload + Image Upload
- [ ] Port ImageUpload.jsx, handle qwen3-vl:4b vision model

### 3.4 Project Dropdown + Model Selector — model part DONE session 2
- [ ] Project dropdown still placeholder
- [ ] Medium / Manual still display-only
- [x] Model selector lists Ollama models from http://127.0.0.1:11434/api/tags, qwen2.5:3b default
- [x] Store selected model in localStorage (selected_model)

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

## Session 3 status (2026-10-12 Asia/Dhaka) — merge + new features
- [x] Merged 3c06e1bf "best of" branch into abc0197f (65def82). Build ✔, 48 unit ✔, 5 UI ✔.
- [x] Inline chart visualizer — source ✔ compiled ✔ tested ✔ (unit + browser). User-confirmed: ✘
- [x] Branching conversations — source ✔ compiled ✔ tested ✔. User-confirmed: ✘
- [x] Artifact export as project .zip — source ✔ compiled ✔ tested ✔. User-confirmed: ✘
- [x] Vision bridge (qwen2.5:3b → qwen3-vl:4b) — source ✔ compiled ✔ tested ✔ (mock). Real qwen3-vl:4b on the user's RTX 3050 still needs a check. User-confirmed: ✘
- [ ] Comment/pin on artifact — NOT built.
- [ ] MCP and sub-agents — out of scope for now (need a permission model for external tools).
- [ ] Next: run `start-app.bat` on Windows with the real Ollama: send one chart request, branch one chat, attach one image to qwen2.5:3b, export one artifact .zip.
- [ ] Open the P3–P9 backlog below (artifact runner, dropdowns, uploads, extension wiring, VaultPanel, Today view, installer). Check each against the winner's code before rebuilding.

## How to Pick Next Task

1. If user reports exact clone doesn't work on Windows, fix Priority 1 first
2. Else if user wants Settings modal, do Priority 2.1
3. Else if extension not working, do Priority 4
4. Else continue with Priority 3,5,6,7 in order

Always update living docs after each task.

## Done Log

- [x] 2026-10-10 (session 2) Settings modal, user menu, Apps and extensions modal, web menu bar, model picker, row menu actions, per-chat history. Verified headless only, not on Windows.
- [x] 2026-10-10 19:20 Created master repo structure with .ai/ + 00_LIVING_DOCS/ + apps/ + extension/ + vault/ + spec/ + archive_zips/
- [x] 2026-10-10 13:19 Built exact pixel-perfect clone from 6 screenshots, Vite+React+Tailwind, direct qwen2.5:3b streaming, vault driver, bat files, zipped 13K
- [x] 2026-10-10 13:00 Built Electron clone v6 with artifacts workbench etc (previous session)
- [x] 2026-10-10 12:00 Built Extension v1.2 starter with Capsule Hub + Quillbot spec (previous session)
- [x] 2026-10-10 11:00 Built Vault v4 Clean 61 files starter (previous session)
**Last Updated:** 2026-10-11 22:10 Asia/Dhaka
**Rule:** Update after each session, priority order, check off when done.

---

## Priority 1 — Test On The User's Windows Machine (User Action) ⬅ DO THIS FIRST

Nothing below matters until the app has actually run on the TUF A15.

- [ ] `git pull` / download the branch ZIP for `arena/3c06e1bf-ai-assistant`
- [ ] `cd apps\01_claude-exact-pixel-clone` → `start-app.bat`
- [ ] Opens `http://127.0.0.1:5173` — confirm the window looks like screenshot 191547.png
- [ ] Ask a normal question (e.g. "explain RAM vs VRAM") — must answer, must **not** open an artifact
- [ ] Ask "make me a tic tac toe game" — must open the artifact panel with a playable game
- [ ] Click the bottom-left **NU Utso Free** avatar → user menu (191608) → **Settings** → Appearance (191707) → flip Theme to Light and back
- [ ] Composer bottom-right model selector → must list the local Ollama models
- [ ] `Ctrl+J` → AI-Brain panel → Capsules / Never-check / Today
- [ ] `check-ollama.bat` if anything is red
- [ ] Report back: what works, what looks off, any red text in the terminal

**If Ollama is unreachable:** `ollama serve`. The app now proxies `/ollama` through Vite, so
`OLLAMA_ORIGINS` should no longer be needed — `start-app.bat` still sets it as a belt-and-braces.

**If replies are stuck in a loop:** Settings → System → **Reset local data**.

## Priority 2 — Closed 2026-10-11 22:10 (UI/UX adopted from 01199af1)

- [x] Whole UI layer replaced with the 01199af1 implementation, at the user's request
- [x] Their palette is the user's own spec — no measured-vs-stated conflict
- [x] Kept the Windows title bar (File/Edit/View/Go/Help) — that branch had none
- [x] Kept the Today view (`Alt+T`) and added it to the sidebar nav
- [x] Adopted their vault API and ported back `/today`, `/status`, `artifact`, `journal`
- [x] 48 + 5 tests passing; mock Ollama now answers `/api/show` so previews can send
- [x] **No branch merged. PR #8 open.**

## Priority 2a — Closed 2026-10-11 21:20 (advisor best-of cherry-picks, nothing merged)

- [x] **Palette is the user's spec (authoritative)** — main `#1a1a1a`, sidebar `#202020` 260px,
      composer `#242424`, hover `#2a2a2a`, active `#303030`, text `#e0e0e0`, accent `#ff8c00`.
      Measured colours were tried and **reverted on the user's instruction**; measurements stay
      as reference in `spec/MEASURED_PIXELS.md` and still govern geometry the user did not
      specify (toolbar 48px, composer radius 18px, greeting 44px, transcript widths).
- [x] Geometry the user did NOT specify follows the measured screenshots — toolbar 48px,
      top bar 52px, composer radius 18px, greeting 44px, grouped settings nav
- [x] Settings nav grouped (Settings / This computer / Customize) as in 191707
- [x] `Spark.jsx` Claude starburst (from `abc0197f`)
- [x] `Dialog.jsx` accessible modal: portal, focus trap, inert background, Escape (from `01199af1`)
- [x] Artifact preview locked down with a CSP emitted before untrusted content (from `01199af1`)
- [x] `wantsArtifact` negative-intent checks: "explain how to build…", "don't create…" (from `01199af1`)
- [x] `TodayView` — snapshot, open loops, due follow-ups with answer/skip/snooze/stop,
      journal draft, `Alt+T` (from `brain01`)
- [x] `server/mock-ollama.cjs` — labelled stub so previews can chat; never started by
      `start-app.bat` (from `brain01`)
- [x] Tests: `npm test` 20/20, `npm run test:ui` 4/4 (jsdom, optional dependency)
- [x] Docs: `spec/MEASURED_PIXELS.md`, `tools/pngread.py`, all living docs updated
- [x] **No branch merged.** PR #8 open, unmerged, as instructed.

## Priority 2b — Closed 2026-10-10 22:40

- [x] Settings modal (191707) — Appearance: Theme, Chat font, Transcript size, Width, Motion, Voice
- [x] User menu (191608) — email, Settings … Log out
- [x] Apps and extensions modal (191636)
- [x] File / Edit / View / Go / Help menu bar (191558) in the web build
- [x] Model selector from Ollama `/api/tags` + effort (Low/Medium/High) + thinking (Manual/Auto/Off)
- [x] Artifact runner — HTML/SVG preview panel, strict "only when explicitly asked"
- [x] File + image upload with model-aware vision handling
- [x] Thinking / reasoning display for `<think>` blocks
- [x] AI-Brain panel: capsule drag-drop injection, blacklist manager, Today tab
- [x] Ollama CORS removed by the `/ollama` + `/vault` Vite proxies
- [x] Vault API: `/status`, `/capsules`, `/today`, `GET`/`POST /blacklist`, artifact + journal captures
- [x] `start-app.bat` handles an already-running Ollama / vault API, offers the model pull only if missing
- [x] `check-ollama.bat`
- [x] Headless verification: clean build + 4 jsdom smoke suites, 0 console errors

## Priority 3 — Finish Today View + Journal (P8)

- [x] Today view modal: Current Snapshot, Open Loops, journal draft (`Alt+T`, View menu, Help menu)
- [x] Due follow-ups parsed out of `04 Working Memory/Open Loops.md` with
      answer / skip / snooze / stop
- [ ] Journal auto-generation from captured/authorised sources, event time vs capture time separated, source-linked, never invents offline events or feelings
- [ ] One "next action" on the Today view
- [ ] End-of-day prompts, opt-in

## Priority 4 — Extension End-To-End (P6)

- [ ] Load `extension/` unpacked in Chrome with the vault API running
- [ ] Visit a site → `02 Sources/Browser Activity/<year>/<month>.jsonl` appears
- [ ] Chat on ChatGPT/Claude → `02 Sources/Conversations/<provider>/<year>/<id>.md` appears
- [ ] Force a failure → `01 Inbox/Processing Errors/` logs "wasn't accessible - reason", no popup
- [ ] Add `bank.com/*` to the blacklist → visiting it is skipped and logged, never captured
- [ ] Stop the vault API, browse, restart it → queued items flush
- [ ] `GET /context?q=…` returns the right capsules

## Priority 5 — Windows Installer (P9)

- [ ] Electron wrapper (native File/Edit/View/Go/Help menu, real Windows title bar) or Tauri (lighter on 8 GB RAM)
- [ ] Bundle the vault API so it auto-starts with the app
- [ ] Ollama detection + a model manager UI inside the app
- [ ] Installer remembers the theme choice

## Priority 6 — Docs & Testing

- [ ] Fill in `vault/AI-Brain/00 System/Claude Feature Audit.md` with a real parity audit
- [ ] Synthetic conversation test: full transcript survives summaries, duplicate handling, a failed adapter never reports false success
- [ ] Populate `vault/AI-Brain/00 System/Model Registry.md` with tested capabilities per local model

---

## How To Pick The Next Task

1. Has the user run it on Windows yet? → No: Priority 1. Yes: continue.
2. Did the user report a bug? → Fix it before anything else.
3. Otherwise work down: P3 → P4 → P5 → P6.

Always update the living docs after each task (REQUIREMENTS_LIVING, CHANGELOG, HANDOVER,
TODO_NEXT, `.ai/STATE.json`, `memory/sessions/`).

## Done Log

- [x] 2026-10-10 22:40 — Exact clone completed to the screenshots: Settings, User menu, Apps & extensions, menu bar, model selector, artifact runner, uploads, thinking, capsule drag-drop, blacklist, Today tab, CORS-free Ollama proxy. Clean build + 4 headless smoke suites.
- [x] 2026-10-10 19:20 — Created master repo structure with .ai/ + 00_LIVING_DOCS/ + apps/ + extension/ + vault/ + spec/
- [x] 2026-10-10 13:19 — Built the first exact pixel-perfect clone from the 6 screenshots
- [x] 2026-10-10 13:00 — Electron clone v6 (previous session)
- [x] 2026-10-10 12:00 — Extension v1.2 starter (previous session)
- [x] 2026-10-10 11:00 — Vault v4 Clean starter (previous session)
