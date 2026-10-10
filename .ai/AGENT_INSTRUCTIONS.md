# AGENT INSTRUCTIONS — AI ASSistant Repository

Read this before changing code. This repository is the project's requirements and handover memory as well as source code. The active target is `apps/01_claude-exact-pixel-clone/`.

## Read Order

1. `.ai/CONTEXT.json` — hardware, local model, privacy/capture constraints.
2. `.ai/STATE.json` — implementation and verification status.
3. `00_LIVING_DOCS/REQUIREMENTS_LIVING.md` — source of truth and acceptance criteria.
4. `00_LIVING_DOCS/HANDOVER_LIVING.md` and `TODO_NEXT.md` — gaps and next action.
5. `00_LIVING_DOCS/ARCHITECTURE_LIVING.md` — data flow and API boundaries.
6. `spec/CLAUDE_SPEC_FROM_SCREENSHOTS.md` and `spec/screenshots/` — UI ground truth.

## Mandatory Handover Updates

After any code, requirement, architecture, or bug change, update:

- `00_LIVING_DOCS/REQUIREMENTS_LIVING.md`
- `00_LIVING_DOCS/CHANGELOG.md`
- `00_LIVING_DOCS/HANDOVER_LIVING.md`
- `.ai/STATE.json` and the `ai/STATE.json` mirror
- `memory/sessions/`

Keep `ai/`'s visible mirrors of `.ai/` synchronized: `AGENT_INSTRUCTIONS.md`, `CONTEXT.json`, `STATE.json`, and `INDEX.json`. Update both index files when inventory/purpose changes and keep each mirror byte-identical. Distinguish **planned**, **in source**, **built**, **runtime-tested**, **Windows-tested**, and **user-confirmed**. A Linux build is not Windows/runtime acceptance.

## User Constraints — Do Not Violate

- Exact Claude desktop arrangement from the screenshots, not a loose imitation. Dark default: main `#1a1a1a`, sidebar `#202020`, composer `#242424`. Keep the Windows title bar visible.
- Target is the user's Windows 11 ASUS TUF A15 (Ryzen 7, 8 GB RAM, RTX 3050 / 4 GB VRAM). Ollama and `qwen2.5:3b` are already installed. Do not download models or assume native build tools.
- Handle an already-running Ollama at `127.0.0.1:11434`; vault API is `127.0.0.1:8765`. Obsidian Markdown is canonical; the repo vault is only a starter.
- Never infer a name from a Windows path. Do not collect passwords, cookies, auth tokens, payment fields, unsent drafts, or hidden keystrokes.
- Extension capture defaults to checking everything after one-time permission; inaccessible capture logs `wasn't accessible - reason` without a popup. Maintain an editable/revocable never-check blacklist (default allow, explicit deny).
- Extension UX should combine Capsule Hub (reusable/versioned capsules, reviewable drag/drop context injection) and Quillbot (in-field suggestions), local-only without an external account.
- Give Windows instructions **one simple step at a time**; wait for the result before giving the next step.
- Never report a feature tested/finished because it is only planned or in source.

## Current Target Status (2026-10-10)

- Screenshot settings/user/apps surfaces, local model/project selectors, chat actions and persistence, explicit-request HTML artifacts, bounded text/image attachments, optional thinking display, same-origin Vite proxies, and append/idempotent vault chat capture are in source.
- `npm run build`, `node --check server/vault-api.cjs`, `git diff --check`, and a preview Host/Origin probe passed in Linux.
- Ollama streaming, image/model behavior, the actual Obsidian vault, Windows batch files, and pixel-level visual acceptance remain untested.
- Artifact output is HTML-only and sandboxed. Image bytes are session-only. Do not claim automatic model capability detection; vision gating uses a heuristic.
- Extension/vault E2E, Capsule/Quillbot wiring, full Today view, and native Windows wrapper remain pending.
- No `archive_zips/` or current zip artifact is present. Old filenames in session/changelog history are historical and unverified.

## Build and Runtime Notes

From `apps/01_claude-exact-pixel-clone/`:

- Linux build check: `npm run build`
- API syntax check: `node --check server/vault-api.cjs`
- Windows launch target: `start-app.bat` (not yet Windows-tested)
- Vite browser routes `/api/ollama/*` and `/api/vault/*` are proxied to local Ollama/vault APIs. Browser code should use same-origin paths, never hard-code a loopback fetch.
- Do not instruct the user to set `OLLAMA_ORIGINS=*`; this app uses the Vite proxy. Do not ask the user to run `ollama pull`.

## Immediate Next Action

Ask the user only to open `apps/01_claude-exact-pixel-clone/start-app.bat` and report exactly what appears. Wait. Continue the Windows smoke test one small action per turn. If launch fails, stop and diagnose the reported message before moving on.

After Windows validation, follow `00_LIVING_DOCS/TODO_NEXT.md`: P3-P5 runtime checks, P6 extension-to-vault tests, P7 Capsule/Quillbot/VaultPanel, P8 Today view, then P9 native wrapper.

## Git and Archive Safety

Work only on `arena/a7dde6b8-ai-assistant`. Never switch/create another branch. If a push is explicitly requested, push only `origin arena/a7dde6b8-ai-assistant`. Do not create a zip unless explicitly requested; if requested, create it from the current checkout and report exactly what it contains. Never assume historical zip names refer to files that exist now.
