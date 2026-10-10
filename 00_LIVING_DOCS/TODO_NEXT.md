# TODO_NEXT.md — Immediate Next Actions (Living)

**Last Updated:** 2026-10-10 20:10 Asia/Dhaka
**Rule:** Update after each session, keep the order current, and distinguish source work from runtime-tested work.

## Current exact-clone status

P3-P5 were implemented in source in this session and `npm run build` passes in the Linux sandbox. None of the new Ollama, upload, artifact, or vault behavior has been runtime-tested on Windows. Do not treat the build as user acceptance.

## Priority 1 — Windows smoke test (User PC required)

On the ASUS TUF A15, give **one simple action only**, then wait for the user's result before sending another. Start with this action:

1. Open `apps/01_claude-exact-pixel-clone/start-app.bat` and report exactly what appears.

After that succeeds, continue one action at a time: confirm `http://127.0.0.1:5173` loads and `qwen2.5:3b` is listed; ask one ordinary text question and confirm it streams without creating an artifact; visually compare the User Menu/Settings/Apps dialogs to screenshots; test an already-installed vision model only if available; explicitly request a small HTML app; and finally verify vault connection and one-time append behavior. Never download a model.

If any action fails, stop, capture the exact UI message/console error, and resolve it before moving on. The Linux sandbox cannot substitute for this PC test.

## Priority 2 — Finish current P3-P5 validation / fixes

- [x] **P3 Artifact runner — in source / Linux build passed:** explicit-request HTML only, preview/source/download, sandbox and restrictive CSP. Runtime test pending.
- [x] **P4 Model selector — in source / Linux build passed:** lists installed Ollama models via same-origin `/api/ollama/tags`, persists choice; runtime test pending.
- [x] **P5 File/image upload + thinking — in source / Linux build passed:** supported text formats up to 180 KB, images up to 4 MB, vision-model gate, image data session-only, thinking deltas/tags shown when available. Runtime test pending.
- [ ] If a selected installed model does not stream, inspect proxy/server logs and fix without downloading another model.
- [ ] Verify chat turns append idempotently to the user's real vault, not only to the repository starter vault.

## Priority 3 — P6 Extension -> Vault API -> Obsidian files

- [ ] Load unpacked `extension/` in Chrome and inspect requested permissions.
- [ ] Test history listener, submitted AI-chat capture, generic readable page capture, and explicit “Collect this page now”.
- [ ] Test inaccessible logging into both `09 Activity & Undo/` and `01 Inbox/Processing Errors/` without popups.
- [ ] Test never-check blacklist patterns (for example `bank.com/*`) and confirm excluded pages are skipped.
- [ ] Stop the vault API, verify offline queue behavior, restart it, and verify safe/idempotent flush.
- [ ] Test that original conversation sources are not overwritten and that capture completeness is honest.

## Priority 4 — P7 VaultPanel / Capsule Hub / Quillbot

- [ ] Capsule library populated from local vault, searchable and grouped by project.
- [ ] Drag/drop capsule into composer with a reviewable insertion preview; never auto-send.
- [ ] Add/edit/revoke never-check patterns from the app and sync to Privacy & Access / Source Scope.
- [ ] Surface Current Snapshot and Open Loops.
- [ ] Make “Cook This Prompt” use matching local context and show what it added.
- [ ] Wire inline extension suggestions/highlight toolbar across supported AI text fields; report unsupported pages honestly.

## Priority 5 — P8 Today view

- [ ] Show Current Snapshot, today's Asia/Dhaka journal draft, due user-approved follow-ups, and one useful next action.
- [ ] Preserve event time separately from capture time and link source notes.
- [ ] Never invent offline events/feelings; no sensitive recurring prompt without user-chosen cadence.

## Priority 6 — P9 Native Windows wrapper / installer

- [ ] After the browser target is accepted, add an Electron/Tauri wrapper while keeping the real Windows titlebar/close controls visible.
- [ ] Add native File/Edit/View/Go/Help menus only in the desktop wrapper.
- [ ] Build and test on the 8 GB RAM TUF A15; keep Ollama separate and do not download models automatically.
- [ ] Keep app and local APIs loopback-only on Windows.

## Priority 7 — Integration/acceptance tests

- [ ] Synthetic chat: full transcript, multiple turns, duplicate turn idempotency, failed API does not claim success.
- [ ] Model switching: only installed models listed; vision disabled for qwen2.5:3b and enabled only for verified vision model.
- [ ] Artifact safety: scripts cannot read app data or make network requests; no artifact for a normal question.
- [ ] Privacy/capture: no passwords, cookies, auth tokens, payment fields, or unsent drafts collected.
- [ ] Vault read/write, permissions, actual path, conflict behavior, and recovery verified against the user's Obsidian vault.

## Session Done Log

- [x] 2026-10-10 20:10 — Restored missing screenshot modals in the actual checkout; implemented P3-P5 source paths, local API proxies, append-only vault chat turns, and dependency-preserving batch scripts. Linux production build and static checks passed; Windows/Ollama not tested.
- [x] 2026-10-10 19:20 — Created master repo structure with `.ai/` + `00_LIVING_DOCS/`.
- [x] 2026-10-10 13:19 — Built initial screenshot-based Vite/React clone, direct qwen2.5:3b call, vault API, and batch launchers.

## How to Pick Next Task

1. If the user reports a Windows test issue, resolve it before adding more features.
2. Otherwise continue with P6 extension/vault verification, then P7, P8, and P9.
3. Update the living docs, state, AI mirror, and session log for every code change.
