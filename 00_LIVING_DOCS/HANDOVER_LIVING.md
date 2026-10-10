# HANDOVER_LIVING.md — Current State + Gaps (Living)

**Last Updated:** 2026-10-10 20:10 Asia/Dhaka
**Purpose:** Give any AI/developer enough context to continue without relying on previous AI memory. Update every session.

## 1. Executive Summary

User Utso wants AI ASSistant native Windows app that looks exactly like Claude desktop from 6 screenshots (191547-191707), uses real Obsidian vault AI-Brain/ as canonical memory, extension collects from every site + every AI by default (log wasn't accessible if fails, no popup), never-check blacklist for privacy, Capsule Hub + Quillbot UX for context injection, local-first qwen2.5:3b via Ollama, driver/vault/extension architecture.

**Current status:**
- The user-supplied NEW SESSION handover listed SettingsModal, UserMenu, and AppsExtensionsModal as done, but those files were absent from this actual checkout at `547b4d8`. They have now been added on the current Arena branch, alongside the next P3-P5 app work.
- `apps/01_claude-exact-pixel-clone/` now contains the screenshot settings/user/apps overlays, local Ollama model selector, project picker, explicit-request HTML artifact runner, bounded text/image upload, optional thinking disclosure, chat persistence/actions, and same-origin API proxies.
- `npm run build`, `node --check server/vault-api.cjs`, `git diff --check`, and a proxied-preview Host/Origin probe passed in the Linux sandbox. No Ollama service or Windows runtime was available, so neither model streaming nor the batch files are Windows-tested or user-confirmed.
- Artifact previews are HTML-only and sandboxed; no artifact is made unless the user explicitly asks to build one. Image uploads are sent only to a selected model identified as vision-capable and are not persisted after the browser session.
- The previous Electron clone in `apps/02_electron-claude-clone-v6/` remains a feature reference, not the current exact-screenshot target.
- The browser extension remains an untested starter; extension-to-vault, Capsule drag/drop, Quillbot suggestions, Today view, journals/follow-ups, and a native Windows wrapper remain open work.
- `vault/AI-Brain/` is still only the repo's starter vault; the app's real-vault path selection and capture must be tested on the user's Windows setup before calling Obsidian integration verified.

## 2. What Works (Sandbox Evidence)

- [x] Vite production build succeeds in the Linux sandbox (Vite 5.4.21).
- [x] Browser preview starts on port 5173 and returns HTTP 200 for a `*.e2b.app` Host/Origin.
- [x] `node --check server/vault-api.cjs` and `git diff --check` pass.
- [x] Browser-facing source has no direct `localhost`/`127.0.0.1` `fetch()` calls; Vite proxies Ollama and vault requests from same-origin routes.
- [x] Source now includes the screenshot-based sidebar, context menu/chat operations, Settings Appearance controls, User menu, and Apps/Extensions modal.
- [x] Source now includes model listing from Ollama tags, project selection, explicit-only HTML artifact capture/preview, text and image upload controls, thinking disclosure, and local chat persistence.
- [x] Vault conversation writes append idempotent turns by conversation ID/turn marker rather than overwriting an existing conversation note.
- [ ] Ollama API behavior, qwen2.5:3b streaming, vision, and vault writes were not exercised because the sandbox has no Ollama service / user's Obsidian vault.
- [ ] Windows batch files, Windows titlebar/native behavior, pixel-level screenshot comparison, and user acceptance remain untested.

## 3. What Doesn't Work / Gaps

### Exact Clone Gaps (apps/01_claude-exact-pixel-clone)
- [ ] Native Windows/Electron wrapper and native File/Edit/View/Go/Help menu; current app target is Vite in a browser.
- [ ] Windows/TUF A15 test of `start-app.bat`, installed-model listing, qwen2.5:3b replies, and the Ollama proxy.
- [ ] Pixel-level user visual confirmation against screenshots 191547-191707.
- [ ] Account/Privacy/Billing/Memory/Connectors settings behavior; non-Appearance sections currently disclose that they are not connected.
- [ ] Voice input/output, PDF/Office parsing, React/JSX artifacts, and complete model capability metadata.
- [ ] Capsule drag-drop, blacklist manager, Open Loops/Current Snapshot, and Quillbot inline wiring.
- [ ] Today view, journal draft/generation, follow-ups, and monthly audit.
- [ ] Extension -> app API -> actual Obsidian vault end-to-end test.

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
- [x] Frontend Ollama/vault CORS is routed through same-origin Vite proxies; direct browser Ollama CORS configuration is no longer required for the app. Extension direct API behavior remains untested.
- [x] Tic Tac Toe loop prompt cause removed from exact clone: no game example; app says no games/artifacts unless explicitly requested. Runtime still needs user testing.
- [x] New exact clone uses direct Ollama streaming through Vite proxy; the old Electron `ChatMode` bug is separate.
- [ ] Windows test remains pending; sandbox is Linux.

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
   - Previous direct browser fetch required permissive Ollama CORS.
   - Current exact clone uses Vite same-origin proxies for `/api/ollama/*`, so browser CORS is avoided.
   - Status: Proxy compiled and preview-host checked; Ollama runtime is not available in this sandbox, so verify on Windows.

4. **Vite Rollup Win32**
   - Package declares `@rollup/rollup-win32-x64-msvc` as an optional dependency and the launcher no longer clears the dependency cache.
   - Status: Windows dependency installation/build still needs verification on the target PC.

## 5. User Constraints & Corrections (Never Violate)

- Default capture = check everything by default across all sites + all AIs after one-time permission; if inaccessible, log "wasn't accessible - reason" in 09 Activity & Undo + 01 Inbox/Processing Errors, no popup/ask; explicit collect only when user instructs (right-click "Collect this page now" or paste URL to force).
- Never-check blacklist: user can paste URL/domain/pattern (e.g., bank.com/*) into Privacy & Access / Source Scope excluded_patterns to never check any data from that URL ever again; editable, revocable; default allow, explicit deny; stored in 00 System/Privacy & Access.md and 00 System/Connectors scope files.
- Extension UX = provide contexts like Capsule Hub by Tilantra (capture once as reusable Capsule with goals/constraints/background/decisions/attachments, library, drag-drop inject into any AI chat box, version/branch/rollback, transfer attachments, prompt enhancer "Cook This Prompt") and Quillbot (works in background ready when needed, works in any text field across web, highlight text or open toolbar for instant suggestions, real-time suggestions as you type, inline dropdown, no tab switching), local-only no external account required.
- Use qwen2.5:3b directly no download, bat commands work on Windows TUF A15 8GB RAM 4GB VRAM, app is driver of vault (127.0.0.1:8765), dark default, uses Ollama at 11434 handling already-running, no native build tools.
- Dark default #1a1a1a, Windows title bar visible, Claude exact layout from screenshots, not loosely inspired.
- Never infer user name from Windows path. Arena.ai chats not auto-imported. No passwords/cookies/tokens/payment/unsent drafts collection.

## 6. Immediate Next Steps (Priority Order)

1. **Windows smoke test (one user action per turn):** First ask the user only to open `apps/01_claude-exact-pixel-clone/start-app.bat` and report exactly what appears. Wait for the result before giving the next Windows step. On later turns, verify the existing Ollama instance, model list, one streamed text response, and no unrequested artifact loop.
2. **Verify P3-P5 with the local model:** after launch succeeds, explicitly request a small HTML app and test the sandbox; try a text file; if an installed vision model is already present, test image attach. Do not download qwen3-vl automatically.
3. **Fix issues from Windows results:** check console, vault API status, image capability gating, and capture file append/idempotency. Do not ask user to reinstall models.
4. **P6 extension wiring:** load `extension/` unpacked in Chrome; test history, AI conversation capture, generic page content, inaccessible logging, blacklist, offline queue, and resulting Obsidian files.
5. **P7 VaultPanel / Capsule Hub:** capsule library, drag-drop injection, blacklist manager, Current Snapshot/Open Loops, and Cook This Prompt.
6. **P8 Today view:** Current Snapshot, journal draft, due approved follow-ups, and one next action; avoid inventing offline events.
7. **P9 native Windows wrapper:** add Electron/Tauri only after the browser target is verified; preserve titlebar/close controls and local-only loopback binding.
8. Keep `REQUIREMENTS_LIVING.md`, `CHANGELOG.md`, `HANDOVER_LIVING.md`, `.ai/STATE.json`, `memory/sessions/`, and `.ai/INDEX.json` accurate with every change.

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

- This checkout does not contain an `archive_zips/` directory or zip deliverable; filenames in old changelog/session history are unverified historical references.
- No zip was requested or created in this session. The build output `apps/01_claude-exact-pixel-clone/dist/` is ignored and should not be committed.

## 9. Honest Status Marking

- Written: requirement/template/docs exist
- In source: code path exists
- Built: Vite production build succeeded in the Linux sandbox
- Runtime-tested: behavior exercised with a clear result against the stated local services
- Windows-tested: behavior exercised on the TUF A15/Windows
- User-confirmed: user saw it running and accepts it

Current status: source + Linux build checks pass; local Ollama/vault runtime, Windows test, pixel-level comparison, and user confirmation are still pending.

Don't claim feature implemented because it appears in plan/README/checklist/ZIP. Mark accurately.

## 10. Latest Session Log

**2026-10-10 current continuation:** User provided a clean-start handover prioritizing apps/01. Actual checkout `547b4d8` was older than the supplied status and lacked SettingsModal/UserMenu/AppsExtensionsModal, so those were implemented rather than assumed present. Also implemented dynamic local Ollama model selection, projects, chat actions/persistence, explicitly requested HTML artifacts in an isolated sandbox, text/image attachment with limits and vision gating, optional thinking display, same-origin API proxies, and idempotent non-overwriting vault turn append. Production build and static checks pass; Ollama/Windows behavior remains untested.
