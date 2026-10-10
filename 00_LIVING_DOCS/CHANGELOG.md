# CHANGELOG — dated implementation and verification

## 2026-10-10 continuation — active app0.2.0 / repo1.1.0-master

### Added/repaired
- Replaced target chat foundation with per-conversation messages/history/model labels/status, stop/timeout/error/partials and reload; schema/corrupt-state recovery preserves originals and legacy IDs/titles. Screenshot history remains empty UI placeholders, not imported evidence.
- Restored screenshot account menu, Settings/Appearance and Apps/Extensions dialogs, keyboard/focus handling, local appearance/transcript/motion/projects/chat context actions; official services/voice unavailable honestly. Supported Lucide exports and Pin accessible name fixed.
- Installed model selector via real Ollama tags/show, verified capabilities, abort-safe metadata, loopback-only proxy targets and cloud-entry refusal. No model downloads/reinstall/auto-switch/name guesses/wildcard origins/fake thinking.
- Byte-safe NDJSON (split UTF8/JSON/CRLF, errors/done/oversized records); no game example prompt, conservative12k-character refusal/4096context rather than silently pruning client history.
- Explicit-current-request/mode HTML/SVG artifact runner, Preview/Code/local versions/edits/download/import/library. Opaque sandbox + child CSP, validated errors, no CDN/shell/raw same-origin runner. Parent HTML/header CSP `frame-src 'none'` tested to keep inline srcdoc interactive while denying external and same-origin API navigation. Downloads are original, unsandboxed outside app.
- Real text/code and verified PNG/JPEG/WebP uploads,4max/64KB+12ktext/2MBimages; IndexedDB/base64 and canonical original attachments; no PDF/Word parsing or bigger-model performance claim.
- Immediate submitted-source and final/partial immutable vault captures, latest-status token prevents out-of-order old save overwrites; originals persist on local chat delete.
- Canonical API8765 repaired to use repository vault or explicit existing root, no missing-root creation; schema/path/realpath/source/title/URL/origin validation, immutable digest IDs/dedup/revisions/Dhaka dates, visit-only distinction, two-location inaccessible logs, local keyword capsules/entities. Latest archived capsule no longer resurrects old active version.
- Initial capsule library/typed drop/exact preview/local Cook and revocable vault deny editor; synchronized YAML/frontmatter/all blocks and revision archives, best-effort rollback. Not full Capsule Hub or browser pre-check enforcement.
- Prevent automatic model-authored Markdown image fetches; explicit exact HTTP(S) destination/path/query preview and navigation approval.
- Whitelisted local frontend APIs; foreign-origin/non-JSON writes rejected; browser cookies/authorization stripped, only local Ollama Origin removed. No download/delete/command/cloud endpoints exposed.
- Windows launch/build replaced with existing-service/readiness/dependency/lock probes, optional prebuilt Rollup repair, no native tool/model/kill/wildcard commands. Quoted Node version comparison corrected; real Windows run pending.
- Source-safe ZIP exporter/wrappers replace hardcoded-folder/blind-data-copy/destructive-temp/false-success archive scripts; reviewed local HEAD only, unchanged starter vault required, no overwrites/uploads.

### Visual corrections
- All six references verified native1920×1020; viewer1568×833 was a resize, not native dimensions. Comparable captures1280×680CSS/DPR1.5, not laptop-confirmed DPI.
- Sidebar260CSSpx and mandated palette retained. Retuned sidebar density, greeting30/mark28/composer spacing, modal insets/nav/control spacing, Apps card/terminal/chip typography and local inline brand illustrations.
- Fresh width **Narrow588** (actual selected reference), Medium768/Wide960. Older approximate Medium assumption corrected. Georgia/system font fallback and native title/menu/user exact pixels remain unconfirmed.

### Verification
- **42/42 Node/API tests and22/22 Playwright tests pass**, Vite production build1752modules (JS398.63kB/gzip123.06; CSS34.20kB/gzip7.73).
- Final four screenshot captures reviewed, zero page errors. Chromium153 ran with web security/site isolation intact; mocked Ollama + disposable API18765/Vite5174/temporary vaults.
- Clean source ZIP/extraction results recorded in BRANCH_TESTING when completed; not an installer/real-model/Windows claim.

### Continuity and unfinished work
- Added missing NEW_SESSION_HANDOVER and target README; corrected living requirement checkbox overclaims/status/architecture/testing/todo/agent/state/index/context and visible ai mirror. Session history retained.
- Local canonical blacklist/activity/revision edits found during preview, initiating action unconfirmed; retained outside source staging/export. New runtime vault data ignored; tracked template edits still need selective staging. No remote push/merge.
- Extension Chrome E2E/deny-before-observation/non-2xx queue, full Capsule branches/rollback/attachments/working memory, Today/journals/follow-ups/monthly audit and native Windows menus/title/installer remain open. Electron reference/extension code not changed.

### Final safety edges
- External anchors have a local-only href until approved; normal/middle-click open destination preview, native context-menu/new-tab cannot auto-send the URL.
- HTTP200 alone is not a saved source: validated ok/source and blacklist acknowledgements, explicit skipped/malformed failure, local original retained/retry. Added unit/browser coverage; test-helper saved-success expectation and failure-label mismatch corrected.
- Latest42 Node +22 browser cases/build supersede prior41+21; clean ZIP verification repeated after these source changes.

## Earlier timeline (preserved historical snapshot, superseded status)

# CHANGELOG.md — What Changed Each Session (Living)

**Last Updated:** 2026-10-10 19:20 Asia/Dhaka
**Rule:** Log every change with date, what, why. This is memory for next AI.

## 2026-10-10

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

- Preview API restarted on current hardened source; read-only localhost and HTTPS e2b-shaped Host/Origin health/proxy probes verified. Correct sandbox-only flag is `ALLOW_PREVIEW_ORIGINS=1`; Windows defaults remain loopback with no preview-origin opt-in. Foreign writes/model pull denied403; absent sandbox Ollama returns503.
