# AI ASSistant — canonical source and AI handover

**Owner:** Utso · **Updated:** 2026-10-10 · **Goal:** an exact Claude-desktop local driver for real Obsidian memory plus a browser collector/suggester. Preserve the app name's double S.

## Start here (AI/developer)

Read `NEW_SESSION_HANDOVER.md`, `.ai/AGENT_INSTRUCTIONS.md`, `.ai/STATE.json`, and the living requirements/handover/todo. Visible `ai/` mirrors `.ai/`. This repo is optimized for continuity, not a portfolio.

| Path | Role/status |
|---|---|
| `apps/01_claude-exact-pixel-clone/` | **Active target**, v0.2.0 React/Vite + canonical vault API. Screenshot dialogs, local chat/artifacts/models/uploads/thinking and initial capsule/vault controls in source/build/tests. |
| `apps/02_electron-claude-clone-v6/` | Older Electron feature reference, unchanged; not current pixel/native verification. |
| `extension/` | MV3 collector/suggester starter. Real Chrome E2E, pre-observation blacklist sync and reliable failed-response queue still pending. |
| `vault/AI-Brain/` | Canonical Obsidian Markdown/source memory.61 committed starter files; runtime notes/policy edits are private, not auto-pushed/exported. |
| `spec/screenshots/` |22 images total; six191547–191707 are authoritative current UI references, each1920×1020. |
| `00_LIVING_DOCS/` | Requirements, current evidence/gaps, architecture, decisions, changelog and next work; update every change. |
| `.ai/` / `ai/` | Machine-readable context/state/index/instructions, synchronized. |
| `docs/originals/`, `memory/sessions/` | Historical requirements and dated continuity logs. |
| `scripts/` | Safe local committed-source ZIP exporter and Windows/bash wrappers; no upload/private-vault backup. |

## Current evidence

**Production build, 42 Node/API tests and 22 mocked-browser tests pass.** Final home/account/settings/apps visuals reviewed at1280×680CSS/DPR1.5 →1920×1020, zero page errors. This does **not** establish real Ollama quality, cmd.exe behavior, user-confirmed exact Windows fonts/DPI, universal extension capture or an installer. See `TESTING_CHECKLIST.md` and `BRANCH_TESTING.md`.

Implemented: per-chat streamed history/reload/Stop; installed-local tags/show model selection (cloud disabled), verified file/image/thinking controls; explicit isolated HTML/SVG Preview/Code/local versions; immutable canonical original capture/deny/retrieval; capsule exact preview/drop/local Cook; stored appearance/transcript/projects. Actual model name replaces fake Sonnet claims. Screenshot titles are empty UI placeholders, not imported private history.

Unfinished: native title bar/menu/installer, real laptop confirmation, extension E2E and never-check synchronization, full Capsule branches/rollback/file transfer, Open Loops/Current Snapshot, Today/journals/follow-ups and monthly-audit execution. UI similarity is not Claude-level local intelligence or official Claude services.

## Windows beginner — next single step

**Extract the supplied source ZIP into a new folder**, not over an existing vault. Wait for the result before giving the next launcher step.

The target README explains `apps/01_claude-exact-pixel-clone/start-app.bat`. It uses existing Ollama/qwen2.5:3b, probes/reuses healthy services, installs only pinned app JavaScript dependencies when needed and opens Vite5173 with vault API8765. No model pull/reinstall/kill/wildcard CORS/native compilers. Node18+ required (supported22/24LTS preferred); real Windows verification is pending. `build-windows.bat` builds web dist, **not installer**.

A hosted Arena preview runs in the sandbox and cannot access laptop Ollama; an offline notice there is expected. Browser-facing code uses relative `/api/ollama` and `/api/vault`; targets remain loopback-only.

## Source/data/Git rules

This Arena session stays on **`arena/01199af1-ai-assistant`**. Local source commits are allowed. Source was pushed after the user explicitly requested [PR #9](https://github.com/NishadIslamUtso/AI-ASSistant/pull/9), which is open against main and not merged; further external sends still require exact-content/destination approval. Never blindly `git add .` or auto-push private vault data. New runtime vault files are ignored; already tracked starter-file edits still require selective review.

Local blacklist/activity/revision changes found during preview are retained, initiating action unconfirmed, and excluded from source staging/export. Source packaging uses reviewed committed HEAD + unchanged committed starter templates; it is not a private-memory backup. `node scripts/package-source.cjs` refuses dirty source/private committed vault changes and existing ZIP overwrites. See `BRANCH_TESTING.md` before merging.

Hardware truth: Windows11/TUF A15/Ryzen7/8GB RAM/RTX3050 4GB/500GB/slow downloads. Use existing qwen2.5:3b; do not promise frontier answers or that a larger vision model will run well.
