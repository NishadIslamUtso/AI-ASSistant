# CHANGELOG.md — What Changed Each Session (Living)

**Last Updated:** 2026-10-10 20:45 Asia/Dhaka
**Rule:** Log every change with date, what, why. This is memory for next AI.

## 2026-10-10

### 20:45 — Arena Session: Built the Missing Modals + Artifact Runner + Model Selector (Exact Clone)
- **What:** Handover claimed SettingsModal/UserMenu/AppsExtensionsModal existed in apps/01 — they did NOT (repo had only App/Sidebar/Center/VaultPanel). Implemented them for real from screenshots, plus P3/P4 from TODO_NEXT:
  - `src/components/SettingsModal.jsx` — 191707.png: left nav (General…Connectors, This computer, Customize), live Appearance (Theme system/light/dark segmented, Chat font Anthropic Serif/Sans, Transcript text size, Transcript width, Motion, Voice Language/Style/Speed). Persisted to `claude_exact_settings`; theme + sizes actually apply via CSS vars.
  - `src/components/UserMenu.jsx` — 191608.png: nishadislamutso@gmail.com, Settings, Language, Get help, Upgrade plan, Get apps and extensions, Learn more, Get API keys, Log out.
  - `src/components/AppsExtensionsModal.jsx` — 191636.png: "Do more with Claude, everywhere you work", Claude Code hero card w/ terminal mock + invader, Microsoft 365 + Chrome cards.
  - `src/components/ArtifactPanel.jsx` — P3 artifact runner: sandboxed iframe Preview + Code tabs; artifacts extracted only from full-HTML code fences in assistant replies (system prompt still says create code only when explicitly asked → Tic Tac Toe loop stays fixed). Sidebar Artifacts shows live count.
  - `src/components/ModelSelector.jsx` — P4: lists Ollama models from 127.0.0.1:11434/api/tags (15s poll), falls back to saved qwen2.5:3b when offline, selection stored in `selected_model`.
  - Sidebar rewritten to lucide icons + working context menu: Pin (Pinned group), inline Rename, Delete, Add to project / Move to group submenus, Open in new window (#chat= hash deep-link, App reads hash on load).
  - Per-chat message persistence `claude_exact_messages` (chat switch no longer loses history); new chats auto-created on first send with today's group label.
  - Light theme tokens (CSS vars) for all components; dark default kept.
  - `server/vault-api.cjs`: added repo path `../../../vault/AI-Brain` so the driver uses the canonical vault.
  - `vite.config.js`: host 0.0.0.0 + allowedHosts for Arena preview (start-app.bat still forces --host 127.0.0.1 on Windows).
  - Fixed focus-loss bug (Composer/ChatRow were defined inside parents → remount each keystroke); extracted to top-level.
- **Why:** Handover doc overstated done state; repo ground truth lacked the modals. TODO_NEXT P2+P3+P4 are the agreed next steps.
- **Tested:** `npm install` + `npm run build` clean (1480 modules); Vite dev serves all 12 modules HTTP 200; vault API `/` + `/context` + `/capture` verified (synthetic capture written then deleted, vault left pristine); live preview host accepted after allowedHosts fix.
- **Not tested:** Ollama streaming (no Ollama in sandbox — selector falls back gracefully), Windows start-app.bat run (user action), Chrome extension end-to-end.
- **Files Changed:** apps/01_claude-exact-pixel-clone: src/App.jsx, src/index.css, src/components/{Sidebar,Center,VaultPanel}.jsx rewritten; new {UserMenu,SettingsModal,AppsExtensionsModal,ArtifactPanel,ModelSelector}.jsx, src/lib/{defaults,artifacts}.js; vite.config.js, package.json, server/vault-api.cjs; package-lock.json committed for reproducible Windows installs.
- **Next:** P5 file/image upload + thinking display, P6 extension end-to-end, P7 VaultPanel capsule drag-drop + blacklist UI, P8 Today view.

### 19:20 — Created Master Github Repo as AI Memory (Previous Session)

### 19:20 — Created Master Github Repo as AI Memory (Current Session)
- **What:** Created AI-ASSistant-Github-Repo with AI-optimized structure: .ai/ (AGENT_INSTRUCTIONS, CONTEXT.json, STATE.json, INDEX.json), 00_LIVING_DOCS/ (REQUIREMENTS_LIVING, HANDOVER_LIVING, ARCHITECTURE_LIVING, DECISIONS_LOG, CHANGELOG, TODO_NEXT), apps/01_claude-exact-pixel-clone + 02_electron-claude-clone-v6, extension/, vault/AI-Brain/, spec/screenshots/, archive_zips/, docs/originals/, memory/sessions/
- **Why:** User requested "give me one zip file with all we did so far. also that zip file will have the requirement list which will be updated by you every time something changes. basically the repo will also work as a memory and a handover file for other AI/agents/sessions too, i will be one seeing it, s n need to make it lok like human made, make the structure that suits you and ais best for the purpose i'm making it"
- **Files Created:**
  - README.md — root map, quick start for AI and human, GitHub push instructions
  - .ai/AGENT_INSTRUCTIONS.md — mandatory read order, rules, how to update living docs
  - .ai/CONTEXT.json — user, hardware, capture policy, extension UX, model constraints, screenshot spec
  - .ai/STATE.json — current build status per app, features implemented/missing, known bugs, last session
  - .ai/INDEX.json — full file index with purpose per file, search hints
  - 00_LIVING_DOCS/REQUIREMENTS_LIVING.md — living source of truth, acceptance checklist, changelog, update rules
  - 00_LIVING_DOCS/HANDOVER_LIVING.md — current state, gaps, next steps, honest status marking
  - 00_LIVING_DOCS/ARCHITECTURE_LIVING.md — driver/vault/extension diagram, data flows, API spec, tech stack
  - 00_LIVING_DOCS/DECISIONS_LOG.md — all decisions with dates, why, who, alternatives
  - This file CHANGELOG.md
  - 00_LIVING_DOCS/TODO_NEXT.md — immediate next actions (next)
- **Copied:**
  - apps/01_claude-exact-pixel-clone from AI-ASSistant-Claude-Exact (latest exact clone 13K zip source)
  - apps/02_electron-claude-clone-v6 from AI-ASSistant-App (Electron clone with more features)
  - extension/ from AI-ASSistant-Extension (MV3, Capsule Hub + Quillbot spec)
  - vault/AI-Brain/ from AI-Brain (61 files starter)
  - spec/screenshots/ from uploads/*.png (6 Claude screenshots)
  - docs/originals/ from uploads/*.md + Master Plan
  - archive_zips/ from /*.zip (previous zips)
- **Next:** Create TODO_NEXT.md, spec/CLAUDE_SPEC_FROM_SCREENSHOTS.md, memory/sessions log, build master zip, present to user

### 13:19 — Built Exact Pixel-Perfect Claude Clone From Screenshots
- **What:** Built AI-ASSistant-Claude-Exact folder: package.json, vite.config.js, tailwind.config.js, index.html, src/main.jsx, src/App.jsx with localStorage claude_exact_chats defaults Refining 5-day workout cycle etc from screenshots, src/components/Sidebar.jsx with search filter Oct8/Older groups + context menu Open in new window Pin Rename Add to project Move to group Delete, src/components/Center.jsx with getGreeting Evening Utso + textarea + vault context fetch 127.0.0.1:8765/context + direct Ollama 11434/api/chat qwen2.5:3b streaming + log to /capture, src/components/VaultPanel.jsx toggleable, server/vault-api.cjs copied from previous, start-app.bat + build-windows.bat handling existing Ollama + @rollup/rollup-win32-x64-msvc fix
- **Why:** User posted 6 screenshots 191547.png to 191707.png showing actual Claude desktop and said "come on man, is this to hard to make?" Previous clones not exact pixel match, user frustrated. Screenshots now authoritative spec.
- **Tech:** Vite 5 + React 18 + Tailwind, direct Ollama fetch, no client lib, uses existing qwen2.5:3b no download
- **Zip:** AI_ASSistant_Exact_Claude_Clone.zip 13K (excluding node_modules/dist)
- **Bugs Fixed:** Vite rollup win32 optional dep, Ollama already-running handling, Tic Tac Toe loop avoidance via simple systemPrompt

### 13:00 — Previous Session Summary (From Memory)
- Built Electron clone v6 (apps/02_electron-claude-clone-v6) from https://github.com/Damienchakma/Open-claude MIT fork, customized for vault driver, features artifacts workbench thinking citation image upload, ModelService.js supports multiple models, server/vault-api.cjs, start-app.bat + build-windows.bat, zipped to FIXED6
- Built Extension v1.2 (extension/) MV3 with background.js history listener + blacklist, lib/blacklist.js pattern matching, lib/capsule.js, lib/vault-writer.js POST to 8765, content-scripts ai-capture generic-capture capsule-inject quillbot-suggestions, popup Capsule library blacklist manager, README + EXTENSION_SPEC, zipped
- Built Vault v4 Clean (vault/AI-Brain/) 61 files starter, 00 System templates, 01 Inbox, 02 Sources, 03 Memory, 04 Working Memory, 05 Knowledge, 06 Review, 07 Sharing Receipts, 08 Journal, 09 Activity & Undo, 90 Archive, .brain, zipped
- Created Master Plan AI_ASSistant_Master_Plan.md consolidating all requirements, architecture driver/vault/extension, default capture policy, Capsule Hub + Quillbot UX, hardware constraints, acceptance checklist
- Encountered bugs: No reply bug (sendMessage from useChat doesn't exist) fixed by LLMFactory streaming, Tic Tac Toe loop for qwen2.5:3b due to Flappy Bird example in systemPrompt fixed by simple prompt override, Ollama CORS needs OLLAMA_ORIGINS "*"

## Template for Next Entry

### YYYY-MM-DD HH:MM — Title
- **What:** ...
- **Why:** ...
- **Files Changed:** ...
- **Tested:** ...
- **Next:** ...

### 2026-10-10 13:33 — Added Branch Testing Guide + Complete Testable Zips (User Correction)
- **What:** User said "only upload the 3 md files in repo and that's it? instead make containing everything. it should be like if i create a branch i should be able to download and test from there before merging"
- **Why:** Previous master zip already contained everything testable (apps/01 18 files, apps/02 87 files, extension 22 files, vault 99 files, spec 32 screenshots) but user thought only 3 md files. Added BRANCH_TESTING.md + TESTING_CHECKLIST.md explaining branch -> download ZIP -> test workflow.
- **New Zips Built:**
  - AI-ASSistant-Github-Complete-Testable.zip 2.8M — GitHub-ready, excludes node_modules/dist/archive_zips per .gitignore, contains everything needed to test: apps/01 exact clone + apps/02 electron + extension + vault + spec + 00_LIVING_DOCS + .ai + README + BRANCH_TESTING.md
  - AI-ASSistant-Github-EVERYTHING.zip 3.8M — Same + archive_zips/ with old zips (Exact 13K, Electron FIXED6, Extension v1.2, Vault v4) for full local history
- **Verified:** apps/01 18 files, apps/02 87 files, extension 22 files, vault 99 files, screenshots 32 files in zip — fully testable from any branch
- **Branch Workflow Added:** git checkout -b feature/xxx -> push -> GitHub Download ZIP -> extract -> cd apps/01_claude-exact-pixel-clone -> start-app.bat -> test -> merge

### 2026-10-10 13:45 — Fixed .ai and .gitignore Not Uploading (User Correction)
- **What:** User said ".ai and gitignore file didn't get uploaded."
- **Why:** .ai is dotfolder and .gitignore is dotfile, GitHub web UI Upload files drag-drop hides dotfiles because OS hides them. Zip DID include them (verified via unzip -l), but web upload may skip them. Git status shows they ARE untracked and would be included via git add . command line.
- **Fix:** Created visible mirrors for GitHub web upload:
  - ai/ — visible copy of .ai/ with same files + README_VISIBLE_MIRROR.md
  - gitignore.txt + GITIGNORE.txt — visible copies of .gitignore
  - DOTFILES_INFO.md — explains dotfiles hiding issue and that both dot and visible versions exist
  - Kept original .ai/ and .gitignore as real files
- **Verified:** unzip -l shows .ai/ 5 files, ai/ 6 files, .gitignore, gitignore.txt, GITIGNORE.txt all in zip. git status shows .ai/ and .gitignore untracked and not ignored.
- **New Zips:** Rebuilt AI-ASSistant-Github-Complete-Testable.zip 2.8M and AI-ASSistant-Github-EVERYTHING.zip 3.8M with both dot and visible copies
- **Recommendation:** Use git push via command line (git add . includes dotfiles) not web UI upload, or upload both dot and visible versions via web UI
