# CHANGELOG.md — What Changed Each Session (Living)

**Last Updated:** 2026-10-10 22:55 Asia/Dhaka
**Rule:** Log every change with date, what, why. This is memory for next AI.

## 2026-10-10

### 2026-10-10 22:55 — Pixel-Parity Pass on apps/01 (measured, not guessed) — Current Session
- **What:** Turned apps/01_claude-exact-pixel-clone into a *measured* clone. Built a screenshot + pixel-diff toolchain and drove the mean absolute pixel difference against all 6 spec screenshots down:
  | spec screenshot | state | before | after |
  |---|---|---|---|
  | 191547 | main / new chat | 5.35 | **3.77** |
  | 191558 | File menu | — | **4.46** |
  | 191608 | user menu | 4.28 | **3.39** |
  | 191636 | Apps & extensions | 9.32 | **7.31** |
  | 191646 | chat context menu | 5.44 | **4.52** |
  | 191707 | Settings modal | — | **4.90** |
  (median diff 0.0 on every shot — i.e. most pixels match exactly; the residual is almost entirely font glyphs, because Claude's Anthropic Serif/Sans is not installed anywhere but Claude.)
- **Geometry fixed (all measured in device px @1.5 DPR, CSS = device/1.5):**
  - Sidebar nav rows: `mt-[67px]`, each row **24 CSS**, icon pad-left 17, label `ml-[7px]` → nav ink now lands at device y 154/190/226 exactly like 191547.
  - Sidebar chat rows: row height **25.3 CSS** (was 24), group header **23.3 CSS**, group `mb-[17px]`, list `mt-[17px]` → all 15 visible chat titles now start at device y 327, 425, 463, 501 … 918 (identical to the screenshot, ±0.3 px).
  - Sidebar scroll region restructured: nav is `sticky top-0` **inside** the `flex-1 overflow-y-auto` container so the scrollbar track spans device y 148–960 exactly as in the spec (was 282–960).
  - Greeting is now **centred** as a block (`justify-center`), `mb-[20px]`, block padding `pb-[35px]` → greeting ink at device y 439 and composer box at y 514–658 / x 712–1591 (spec: 516–657 / 713–1592).
  - "Free plan · Upgrade" pill: `marginTop 56`, background fixed to **#111111** (was #1d1d1d).
  - Transcript/composer width: Medium **586 CSS** (measured 713–1592 device), Narrow 480, Wide 800.
  - Composer box: textarea made `display:block` (killed a 7 px phantom gap), padding `15px 14px 7px`, bottom row `mt-[18px]`, + / mic icons 18 → icons now sit at device y 615–633 like the spec.
  - User menu (191608): **left 7, bottom 35, width 249**, background **#20201f**, border **#373736**, no divider under the e-mail row, "Get API keys" and "Log out" each in their own group → every row now lands within ~1 px of the spec.
  - Context menu (191646): background **#20201f**, border **#373736**, and now clamps inside the chat-list area so it flips up like the spec.
  - Apps & extensions modal (191636): panel body **#151515** with a **#1a1a19** header (45 CSS) + `#484847` divider; content column centred at **max-width 853**; heading `mt-[30px]`, featured card `mt-[47px]`.
  - Window caption buttons: 42 CSS each (was 46) → glyph centres now at device x 1763/1827/1890 (spec 1763.5/1827/1890).
- **Tooling added (sandbox-only, not shipped to the user):**
  - `apps/01_claude-exact-pixel-clone/scripts/shot.mjs` — Playwright screenshot driver, `node scripts/shot.mjs <name> <actions>` (settings/user/apps/file/ctx/vault/today/chat/artifact).
  - `tools/compare.py` — grid pixel diff, `python3 tools/compare.py <ref.png> <rendered.png> [cols] [rows]` (+ `compare.heatmap()`).
  - `tools/region.py`, `tools/cropdiff.py`, `tools/geom.py` — crop diff, ink-box diff, standard geometry probe.
- **Why:** User's acceptance criterion is "exact clone, not loosely inspired". Guessing was producing a 5.35 mean diff; measuring every box against the PNG removed ~30 % of the remaining error and, more importantly, made the diff *explainable* (fonts only).
- **Files changed:** src/components/Sidebar.jsx, Center.jsx, Composer.jsx, UserMenu.jsx, AppsExtensionsModal.jsx, TitleBar.jsx, theme.js, index.css, scripts/shot.mjs
- **Known, accepted residuals (documented, not bugs):** Claude's Anthropic Serif/Sans are unavailable → greeting + chat-title glyph widths differ ~10–20 %; headless Chromium paints no scrollbars so the 7 px sidebar scrollbar (thumb #3a3a39 / #5a5957 hover) is correct in CSS but invisible in sandbox screenshots; app shows "qwen2.5:3b" where Claude shows "Sonnet 4.5" (intentional — it is the user's real model); "Cook This Prompt" chip is an extra feature not in Claude.


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
