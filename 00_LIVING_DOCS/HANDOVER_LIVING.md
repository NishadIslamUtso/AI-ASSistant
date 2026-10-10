# HANDOVER_LIVING.md — Current State + Gaps (Living)

**Last Updated:** 2026-10-10 20:10 Asia/Dhaka
**Purpose:** Give any AI/developer enough context to continue without relying on previous AI memory. Update every session.

## 1. Executive Summary

User Utso wants AI ASSistant native Windows app that looks exactly like Claude desktop from 6 screenshots (191547-191707), uses real Obsidian vault AI-Brain/ as canonical memory, extension collects from every site + every AI by default (log wasn't accessible if fails, no popup), never-check blacklist for privacy, Capsule Hub + Quillbot UX for context injection, local-first qwen2.5:3b via Ollama, driver/vault/extension architecture.

**Current status (2026-10-10 20:10 Asia/Dhaka):**
- The exact-clone source was behind the newly supplied handover: the checkout contained only the original 14-file Vite shell, not the claimed Settings/UserMenu/Apps components. This session added those components and advanced the next functional step rather than assuming the handover claims were already in Git.
- `apps/01_claude-exact-pixel-clone/` now has screenshot-driven User menu, Settings Appearance controls (stored locally), Apps/extensions modal, installed Ollama model selector, same-origin API proxy, local text/image attachment path, model-name-gated thinking output, and an explicit-only sandboxed HTML artifact runner.
- Verified in Linux sandbox: 4/4 artifact unit tests, Vite production build, Node syntax check, and synthetic vault API capture to isolated `/tmp/ai-assistant-preview-vault`. Vite preview is available; Ollama is not installed in the sandbox.
- **Not verified:** Windows `start-app.bat`, model discovery/chat streaming against Utso's Ollama, image/thinking capabilities, generated artifact behavior against qwen2.5:3b, pixel comparison at the target Windows resolution, and personal Obsidian vault configuration.
- The current app is still Vite/web, not a native Windows installer. `AI_BRAIN_PATH` can select the real personal vault; otherwise the repository starter vault is the fallback.
- Previous Electron clone in `apps/02_electron-claude-clone-v6/` remains a feature reference; extension and vault remain starters and are not end-to-end verified.
- Master repo structure is the memory/handover source requested by the user.

## 2. What Is in Source and What Was Verified

### Source present in the exact clone (not Windows-confirmed)
- [x] Screenshot-driven shell: 260px sidebar, search/groups, greeting, composer, account row, and functional chat context-menu actions
- [x] User menu, local Settings Appearance controls, and Apps/extensions modal based on supplied screenshots
- [x] Installed Ollama model selector through `/api/tags` via same-origin Vite proxy; selected model persists locally
- [x] Streaming path sends to selected local Ollama model; no cloud fallback or model download
- [x] Text file attachments and a model-name-gated image path (vision support is not model-verified)
- [x] Optional thinking output path for model IDs detected by name (not a tested capability registry)
- [x] Explicit-only HTML artifact parser/library and preview/source panel; sandbox iframe CSP blocks network requests
- [x] Vault API path override `AI_BRAIN_PATH`, repository-starter fallback, safe path segments, `/context` and `/capture`
- [x] Windows startup script source handles existing Ollama, the optional Rollup dependency, and local Vite/vault startup

### Verified in this Linux sandbox
- [x] `npm test`: 4 unit tests pass for artifact intent, parsing, and sandbox policy
- [x] `npm run build`: Vite production build succeeds
- [x] `node --check server/vault-api.cjs`: syntax check succeeds
- [x] Synthetic POST `/vault/capture` saved a test conversation only under `/tmp/ai-assistant-preview-vault`
- [x] Vite page and `/vault/context` same-origin proxy responded; `/ollama/tags` failed as expected because Ollama is not installed in this sandbox

### Not tested / not user-confirmed
- [ ] Windows TUF A15 startup, pixel comparison, Ollama model listing/chat streaming, attachments, model capability behavior, and generated artifact interaction
- [ ] Extension -> API -> personal Obsidian vault flow; Chrome extension behavior
- [ ] Personal Obsidian vault path; `AI_BRAIN_PATH` must be explicitly configured before relying on a personal vault

## 3. What Doesn't Work / Gaps

### Exact Clone Gaps (`apps/01_claude-exact-pixel-clone`)
- [ ] File/Edit/View/Go/Help native menu and native Windows wrapper; current target is still Vite/web
- [ ] Full feature-by-feature Claude audit; the visual shell is not proof of complete Claude parity
- [ ] Vault capture currently records submitted user prompts only, not the full user + assistant transcript; source capture needs completion and deduplication tests
- [ ] Verified model capability registry; current vision/thinking gates use model-name heuristics
- [ ] PDF/DOCX uploads, camera input, voice chat, audio, and richer document handling
- [ ] Full Claude Projects behavior (project selector currently keeps only local names)
- [ ] Capsule drag/drop, blacklist manager, Open Loops, Current Snapshot, Today/Journal/follow-ups
- [ ] User's Windows validation and eventual Windows installer

### Electron Clone Gaps (`apps/02_electron-claude-clone-v6`)
- [ ] Not exact pixel match to latest 6 screenshots (older Claude UI)
- [ ] SQLite still used in some paths, should be only rebuildable index
- [ ] Extension -> vault flow partial

### Extension Gaps (`extension/`)
- [ ] End-to-end test extension -> app API -> vault files
- [ ] Queue when offline not tested
- [ ] Real Readability integration for generic-capture
- [ ] Blacklist UI in popup needs vault sync
- [ ] Capsule version/branch/rollback not implemented
- [ ] No Chrome Web Store publish, only unpacked

### Vault Gaps (`vault/AI-Brain`)
- [ ] No real user data yet, only starter templates
- [ ] Privacy & Access.md excluded_patterns empty, need UI to edit
- [ ] Model Registry.md not populated with tested capabilities
- [ ] Claude Feature Audit.md tracker only, not implementation
- [ ] No `.brain/index.sqlite` implementation yet (rebuildable index)
- [ ] Personal vault is not yet selected/configured; repo starter is only a fallback

### System Gaps
- [ ] No Ollama runtime in sandbox, so selected-model streaming is not exercised here
- [ ] No Windows test yet — user must run the updated bat on TUF A15
- [ ] `npm audit` reports 9 development-tool advisories (3 moderate, 6 high); production dependency audit is clean. Fix requires major toolchain upgrades and was deferred.
- [ ] Artifact panel relies on the model returning a complete fenced `artifact-html`/`html` response after explicit artifact requests

## 4. Known Bugs & Fixes

1. **Tic Tac Toe / unsolicited artifact loop**
   - The earlier Electron prompt included a game example that qwen2.5:3b sometimes repeated.
   - Exact-clone prompt now says not to create artifacts unless explicitly asked; HTML preview parsing is also gated on an explicit request.
   - If a saved old conversation already contains repeated game context, start a new chat or delete that specific chat only after user confirmation; do not clear all local history automatically.
   - Status: prevention logic is in source and artifact intent parsing is unit-tested; qwen2.5:3b response behavior still needs Windows verification.

2. **Ollama CORS / browser proxy**
   - Exact clone now uses relative `/ollama/*` paths; Vite rewrites and proxies them to `http://127.0.0.1:11434/api/*` with `changeOrigin`.
   - Status: Vite proxy config is in source. Ollama was unavailable in this sandbox, so the live endpoint still needs local validation. This removes the app's need for direct browser-to-Ollama CORS access.

3. **Vite Rollup Win32**
   - `start-app.bat` checks for `@rollup/rollup-win32-x64-msvc` and installs it if missing.
   - Status: in source; not yet exercised on Windows in this session.

4. **Model capabilities**
   - UI checks model names for likely vision/thinking support. Names are not proof of a capability and no model is downloaded automatically.
   - Status: deliberately marked unverified until actual model tests and Model Registry entries exist.

5. **Development dependency advisories**
   - Full `npm audit` reports 9 development-tool advisories; `npm audit --omit=dev` reports 0.
   - Status: major Vite/Tailwind upgrade deferred to avoid an untested toolchain change before Windows testing.

## 5. User Constraints & Corrections (Never Violate)

- Default capture = check everything by default across all sites + all AIs after one-time permission; if inaccessible, log "wasn't accessible - reason" in 09 Activity & Undo + 01 Inbox/Processing Errors, no popup/ask; explicit collect only when user instructs (right-click "Collect this page now" or paste URL to force).
- Never-check blacklist: user can paste URL/domain/pattern (e.g., bank.com/*) into Privacy & Access / Source Scope excluded_patterns to never check any data from that URL ever again; editable, revocable; default allow, explicit deny; stored in 00 System/Privacy & Access.md and 00 System/Connectors scope files.
- Extension UX = provide contexts like Capsule Hub by Tilantra (capture once as reusable Capsule with goals/constraints/background/decisions/attachments, library, drag-drop inject into any AI chat box, version/branch/rollback, transfer attachments, prompt enhancer "Cook This Prompt") and Quillbot (works in background ready when needed, works in any text field across web, highlight text or open toolbar for instant suggestions, real-time suggestions as you type, inline dropdown, no tab switching), local-only no external account required.
- Use qwen2.5:3b directly no download, bat commands work on Windows TUF A15 8GB RAM 4GB VRAM, app is driver of vault (127.0.0.1:8765), dark default, uses Ollama at 11434 handling already-running, no native build tools.
- Dark default #1a1a1a, Windows title bar visible, Claude exact layout from screenshots, not loosely inspired.
- Never infer user name from Windows path. Arena.ai chats not auto-imported. No passwords/cookies/tokens/payment/unsent drafts collection.

## 6. Immediate Next Steps (Priority Order)

1. **User validates the exact clone on Windows:** in `apps/01_claude-exact-pixel-clone`, run `start-app.bat`, open `http://127.0.0.1:5173`, check model list/chat response and screenshot parity. Do not clear all localStorage; preserve existing chats.
2. **Verify local models and capabilities:** confirm qwen2.5:3b is listed and replies; test image/thinking only with models that are already installed. Update `00 System/Model Registry.md` with tested evidence; never auto-download qwen3-vl:4b.
3. **Configure and verify the personal vault path:** only after the user identifies it, set `AI_BRAIN_PATH`; test reads/writes against a disposable copy first.
4. **Wire extension -> Vault API -> Obsidian files:** test submitted-chat capture, visit-only metadata, inaccessible failure logging, blacklist, and offline queue.
5. **Implement VaultPanel enhancements:** Capsule library/drag-drop, blacklist manager, Open Loops, Current Snapshot, Cook This Prompt.
6. **Implement Today/Journal/follow-ups** with source links, Asia/Dhaka dates, skip/snooze/stop, and no invented offline events.
7. **Add native menu/window wrapper and installer** after web behavior is stable and Windows baseline is tested.
8. **Run synthetic safety tests:** model capabilities, capture privacy, provenance, conflict safety, retention, external-send approvals, artifact sandbox, and no unsolicited artifact loops.

**Already added in source this session:** Settings/UserMenu/Apps modal, model selector, file/image upload path, thinking path, artifact runner, same-origin proxies. Do not redo these without reading the code and test notes.

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

- `archive_zips/AI_ASSistant_Exact_Claude_Clone.zip` 13K — historical earlier exact-clone snapshot; it does not include this session's new components. Use the current repository branch source for testing.
- archive_zips/AI_ASSistant_App_Claude_Clone_qwen2.5_3b_FIXED6.zip — previous Electron clone with more features
- archive_zips/AI_ASSistant_Extension_v1.2_Fixed.zip — extension starter
- archive_zips/AI_ASSistant_Obsidian_Vault_v4_Clean.zip — vault starter 61 files

All zips exclude node_modules/dist.

## 9. Honest Status Marking

- Written: requirement/template/docs exist
- In source: code path exists
- Compiled: `npm run build` succeeds in this Linux sandbox; this is not a Windows build or native installer
- Tested: behavior exercised with clear result
- User-confirmed: user saw it running and accepts it

Don't claim feature implemented because it appears in plan/README/checklist/ZIP. Mark accurately.

## 10. Latest Session Log

**2026-10-10 20:10 Asia/Dhaka:** User asked to continue from the GitHub repo, read `NEW_SESSION_HANDOVER.md` and `.ai/AGENT_INSTRUCTIONS.md`, and make the Claude app exact. `NEW_SESSION_HANDOVER.md` was not present in this checkout; the current `.ai/` and living docs plus supplied user handover were read. Actual source was the original 14-file shell and did not contain the Settings/UserMenu/Apps components claimed in the supplied handover. Added those interfaces, installed Ollama model selector via Vite proxy, local text/image attachment handling, optional model-name-gated thinking output, explicit-only HTML artifact parsing/library/sandbox panel, local project selector, safer vault path selection and markdown activity append. Added artifact unit tests. `npm test` (4/4), `npm run build`, `node --check`, and synthetic vault API smoke test to `/tmp/ai-assistant-preview-vault` passed. Vite preview launched; Ollama/Windows were not tested. Updated requirements, state, handover, architecture, changelog, README and session log. Next: user tests start-app.bat on Windows; then extension-vault integration, explicit personal vault configuration, capability verification, Capsule/Today workflows, native wrapper.
