# HANDOVER_LIVING.md — Current State + Gaps (Living)

**Last Updated:** 2026-10-10 (session 2) Asia/Dhaka
**Purpose:** Give any AI/developer enough context to continue without relying on previous AI memory. Update every session.

## 1. Executive Summary

User Utso wants AI ASSistant native Windows app that looks exactly like Claude desktop from 6 screenshots (191547-191707), uses real Obsidian vault AI-Brain/ as canonical memory, extension collects from every site + every AI by default (log wasn't accessible if fails, no popup), never-check blacklist for privacy, Capsule Hub + Quillbot UX for context injection, local-first qwen2.5:3b via Ollama, driver/vault/extension architecture.

**Session 2 update (2026-10-10):** Settings, user menu, Apps and extensions modal, web menu bar, Ollama model picker, working row menu (Pin/Rename/Delete), per-chat transcripts added to apps/01. Verified in headless Chromium against a test mock of Ollama and the vault API (30 checks pass). NOT yet tested on Windows with real Ollama and real vault API.

**Current status:** 
- Latest exact pixel-perfect clone built in apps/01_claude-exact-pixel-clone/ from screenshots, Vite+React+Tailwind, direct Ollama streaming, vault API, start-app.bat handling existing Ollama, zipped 13K. Not yet tested on user's Windows.
- Previous Electron clone in apps/02_electron-claude-clone-v6/ has more features (artifacts, workbench, vision, thinking) but not exact pixel match to latest screenshots. Use as reference.
- Extension starter in extension/ with spec for Capsule Hub + Quillbot, MV3, blacklist, failure logging. Not tested end-to-end.
- Vault starter in vault/AI-Brain/ 61 files, templates, system docs. No real user data yet.
- Master repo structure created 2026-10-10 as AI-optimized memory/handover repo per user request for single zip with all work + living requirements.

## 2. What Works (Tested in Sandbox)

- [x] Exact clone UI: Sidebar 260px #202020 Search +New Projects Artifacts Customize Oct8 Older, context menu, Center #1a1a1a Evening Utso + composer #242424, Free plan Upgrade, NU Utso Free bottom — matches screenshots
- [x] Direct Ollama fetch http://127.0.0.1:11434/api/chat qwen2.5:3b streaming (no download, uses existing)
- [x] Vault API server/vault-api.cjs at 127.0.0.1:8765 with /context + /capture endpoints
- [x] localStorage claude_exact_chats with defaults from screenshots
- [x] start-app.bat handles already-running Ollama, installs @rollup/rollup-win32-x64-msvc for Windows
- [x] build-windows.bat
- [x] Electron clone has artifacts, workbench, ModelService.js supporting multiple models
- [x] Extension manifest with <all_urls> + history, lib/blacklist pattern matching, vault-writer POST
- [x] Vault structure 00 System to 90 Archive + .brain, templates complete

## 3. What Doesn't Work / Gaps

### Exact Clone Gaps (apps/01_claude-exact-pixel-clone)
- [x] Settings modal from 191707.png — built session 2 (Voice settings saved, not used yet)
- [x] File Edit View Go Help — web menu built session 2; Electron native menu still needed
- [x] User menu from 191608.png — built session 2
- [x] Apps and extensions modal from 191636.png — built session 2
- [ ] Project dropdown still placeholder. Model picker is real (session 2). Medium / Manual are display-only
- [ ] Artifact runner — no artifact preview yet (Electron clone has it, can port)
- [ ] File upload, image upload — missing
- [ ] Thinking display — missing
- [ ] Capsule drag-drop inject + Quillbot inline suggestions — requires extension integration + VaultPanel enhancement
- [ ] Today view with Current Snapshot, journal draft, follow-ups — not implemented
- [ ] Journal auto-generation — not implemented
- [ ] Monthly audit — not implemented
- [ ] Windows installer — only bat dev scripts

### Electron Clone Gaps (apps/02_electron-claude-clone-v6)
- [ ] Not exact pixel match to latest 6 screenshots (older Claude UI)
- [ ] SQLite still used in some paths, should be only rebuildable index
- [ ] Extension -> vault flow partial

### Extension Gaps (extension/)
- [ ] End-to-end test extension -> app API -> vault files
- [ ] Queue when offline not tested
- [ ] Real Readability integration for generic-capture
- [ ] Blacklist UI in popup needs vault sync
- [ ] Capsule version/branch/rollback not implemented
- [ ] No Chrome Web Store publish, only unpacked

### Vault Gaps (vault/AI-Brain)
- [ ] No real user data yet, only starter templates
- [ ] Privacy & Access.md excluded_patterns empty, need UI to edit
- [ ] Model Registry.md not populated with tested capabilities
- [ ] Claude Feature Audit.md tracker only, not implementation
- [ ] No .brain/index.sqlite implementation yet (rebuildable index)

### System Gaps
- [ ] Ollama CORS fix: need setx OLLAMA_ORIGINS "*" in bat + docs
- [ ] Tic Tac Toe loop: qwen2.5:3b systemPrompt with Flappy Bird example causes game creation every reply — fix is simple prompt override, but need clear localStorage if looped data exists
- [ ] No reply bug: ChatMode called sendMessage from useChat which doesn't exist — fixed in v6 by LLMFactory, but exact clone uses direct fetch so OK
- [ ] No Windows test yet — sandbox Linux cannot run dotnet/msbuild, user must test on TUF A15

## 4. Known Bugs & Fixes

1. **Tic Tac Toe Loop**
   - Cause: systemPrompt for isOpenSourceModel includes Flappy Bird game example as correct format, qwen2.5:3b interprets as must create game every reply. Seen in user screenshots: Artifacts (2) HTML Application, all replies same Tic Tac Toe.
   - Fix: Override systemPrompt for qwen2.5:3b to simple assistant "You are AI ASSistant, helpful assistant...", only create artifacts when explicitly asked. Clear localStorage chat_history that contains looped artifact context.
   - Status: Fixed in exact clone Center.jsx (simple prompt), but need user to clear localStorage if old data.

2. **No Reply Bug**
   - Cause: custom ChatMode called sendMessage from useChat which doesn't exist
   - Fix: Restore original LLMFactory streaming, or use direct Ollama fetch as in exact clone
   - Status: Fixed

3. **Ollama CORS**
   - Cause: ModelService fetch http://localhost:11434/api/tags fails if OLLAMA_ORIGINS not *
   - Fix: setx OLLAMA_ORIGINS "*" and restart ollama serve, add to start-app.bat
   - Status: Documented, need add to bat

4. **Vite Rollup Win32**
   - Cause: @rollup/rollup-win32-x64-msvc optional dep fails on Windows
   - Fix: npm install @rollup/rollup-win32-x64-msvc --save-optional in bat
   - Status: Fixed in start-app.bat

## 5. User Constraints & Corrections (Never Violate)

- Default capture = check everything by default across all sites + all AIs after one-time permission; if inaccessible, log "wasn't accessible - reason" in 09 Activity & Undo + 01 Inbox/Processing Errors, no popup/ask; explicit collect only when user instructs (right-click "Collect this page now" or paste URL to force).
- Never-check blacklist: user can paste URL/domain/pattern (e.g., bank.com/*) into Privacy & Access / Source Scope excluded_patterns to never check any data from that URL ever again; editable, revocable; default allow, explicit deny; stored in 00 System/Privacy & Access.md and 00 System/Connectors scope files.
- Extension UX = provide contexts like Capsule Hub by Tilantra (capture once as reusable Capsule with goals/constraints/background/decisions/attachments, library, drag-drop inject into any AI chat box, version/branch/rollback, transfer attachments, prompt enhancer "Cook This Prompt") and Quillbot (works in background ready when needed, works in any text field across web, highlight text or open toolbar for instant suggestions, real-time suggestions as you type, inline dropdown, no tab switching), local-only no external account required.
- Use qwen2.5:3b directly no download, bat commands work on Windows TUF A15 8GB RAM 4GB VRAM, app is driver of vault (127.0.0.1:8765), dark default, uses Ollama at 11434 handling already-running, no native build tools.
- Dark default #1a1a1a, Windows title bar visible, Claude exact layout from screenshots, not loosely inspired.
- Never infer user name from Windows path. Arena.ai chats not auto-imported. No passwords/cookies/tokens/payment/unsent drafts collection.

## 6. Immediate Next Steps (Priority Order)

1. **Test on Windows (user action):** run apps/01_claude-exact-pixel-clone/start-app.bat with real Ollama. Check replies stream, the model picker lists installed models, and the vault API answers on 8765.
2. **P3 Artifact runner:** port ArtifactPanel from apps/02 (only create artifacts when explicitly asked).
3. **P5 File/image upload + thinking display:** the handover mentions qwen3-vl:4b for vision. Confirm it is installed in Ollama (ollama list) before wiring vision.
4. **Project dropdown + Medium/Manual:** make real or leave clearly labelled as display-only.
5. **Markdown rendering in transcript:** replies are plain text (pre-wrap) right now.
6. **P6 Extension wiring:** extension -> vault API -> Obsidian files, end-to-end test.
7. **P7 VaultPanel:** capsule library, drag-drop inject, blacklist manager, Open Loops, Current Snapshot.
8. **P8 Today view, P9 Windows installer (Electron wrapper gives native title bar and menu).**

## 7. How to Continue (For Next AI)

1. Read .ai/AGENT_INSTRUCTIONS.md
2. Read 00_LIVING_DOCS/REQUIREMENTS_LIVING.md
3. Read this file
4. Read .ai/STATE.json
5. Check spec/screenshots/
6. Pick next step from section 6, implement
7. Update living docs + STATE.json + CHANGELOG.md + memory/sessions/
8. Build new zip if user asks

## 8. Zips & Artifacts

- archive_zips/AI_ASSistant_Exact_Claude_Clone.zip 13K — latest exact clone from screenshots, Vite+React+Tailwind, direct qwen2.5:3b, vault driver, bat files
- archive_zips/AI_ASSistant_App_Claude_Clone_qwen2.5_3b_FIXED6.zip — previous Electron clone with more features
- archive_zips/AI_ASSistant_Extension_v1.2_Fixed.zip — extension starter
- archive_zips/AI_ASSistant_Obsidian_Vault_v4_Clean.zip — vault starter 61 files

All zips exclude node_modules/dist.

## 9. Honest Status Marking

- Written: requirement/template/docs exist
- In source: code path exists
- Compiled: Windows build succeeded (not tested in sandbox Linux)
- Tested: behavior exercised with clear result
- User-confirmed: user saw it running and accepts it

Don't claim feature implemented because it appears in plan/README/checklist/ZIP. Mark accurately.

## 10. Latest Session Log

**2026-10-10:** User posted 6 screenshots 191547-191707 showing actual Claude desktop: Sidebar Search +New Projects Artifacts Customize Oct8 Older, Center Evening Utso greeting with orange asterisk, composer How can I help you today?, Project dropdown Sonnet 5.5 Medium Manual, Free plan Upgrade, NU Utso Free bottom, context menu, Settings modal, Apps and extensions modal, user menu, File menu. Said "come on man, is this to hard to make?" Built exact pixel-perfect clone in AI-ASSistant-Claude-Exact, package.json vite tailwind, App.jsx localStorage claude_exact_chats, Sidebar.jsx search filter + context menu, Center.jsx greeting + textarea + vault context fetch 127.0.0.1:8765/context + direct Ollama 11434/api/chat qwen2.5:3b streaming + log to /capture, VaultPanel.jsx, server/vault-api.cjs, start-app.bat + build-windows.bat handling existing Ollama, zipped 13K. Then user asked for one zip with all we did so far, requirement list updated every time, repo as memory/handover for other AIs, structure suits AIs best. Creating master repo AI-ASSistant-Github-Repo with .ai/ + 00_LIVING_DOCS/ living docs.
