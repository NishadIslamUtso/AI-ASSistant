# AI ASSistant — Project Repository

**Purpose:** Source code, requirements, and handover context for a local-first AI desktop-style assistant. The layout follows Claude desktop screenshots; it is not a native Windows app yet. Obsidian Markdown is intended to remain canonical memory, with the extension as a local collector/context suggester.

**Target PC:** ASUS TUF A15, Windows 11, Ryzen 7, 8 GB RAM, RTX 3050 / 4 GB VRAM. Ollama and `qwen2.5:3b` are already installed. Do not download models unless the user explicitly changes that instruction.

## Current Status (2026-10-10)

- `apps/01_claude-exact-pixel-clone/` contains the screenshot-based Vite/React app and the current implementation work.
- Linux production build and static checks pass. Windows launch, Ollama streaming, writes to the user's actual Obsidian vault, and screenshot-level visual acceptance remain **untested**.
- The browser uses same-origin `/api/ollama/*` and `/api/vault/*` routes; Vite proxies them to loopback services. No global Ollama CORS change is required by the app source.
- HTML artifacts are created only on explicit request and rendered in a restrictive sandbox. Image data is session-only.
- `extension/` is still awaiting Chrome-to-vault end-to-end testing. Capsule/Quillbot wiring, full Today view, and a native Windows wrapper remain open.
- The repo starter `vault/AI-Brain/` is not the user's actual Windows vault.
- No `archive_zips/` directory or zip artifact is present in this checkout. Zip names in older logs are historical, unverified references.

## Repository Map

```text
.ai/                          Machine-readable state, context, and agent instructions
00_LIVING_DOCS/               Living requirements, architecture, handover, changelog, TODO
apps/01_claude-exact-pixel-clone/  Current screenshot-based Vite/React target
apps/02_electron-claude-clone-v6/  Older feature reference; not current target
extension/                    MV3 extension starter; runtime tests pending
vault/AI-Brain/               Starter Obsidian vault structure/templates
spec/screenshots/             Six Claude desktop reference screenshots
spec/CLAUDE_SPEC_FROM_SCREENSHOTS.md  Measurements and implementation status
memory/sessions/              Chronological session/handover notes
docs/originals/               Historical requirements and planning documents
```

## AI Handover Read Order

1. `.ai/AGENT_INSTRUCTIONS.md`
2. `.ai/CONTEXT.json` and `.ai/STATE.json`
3. `00_LIVING_DOCS/REQUIREMENTS_LIVING.md`
4. `00_LIVING_DOCS/HANDOVER_LIVING.md`
5. `00_LIVING_DOCS/TODO_NEXT.md`
6. `spec/CLAUDE_SPEC_FROM_SCREENSHOTS.md` and `spec/screenshots/`

## Windows Smoke Test

The next user-side action is **only** to open `apps/01_claude-exact-pixel-clone/start-app.bat` and report what appears. Continue with one simple Windows action per turn and wait for the user's result before providing another.

The launcher checks for the existing `qwen2.5:3b`, does not download a model, starts Ollama only if its local API is not responding, and starts the vault API only if needed. It then runs Vite at `http://127.0.0.1:5173`. Node/npm are required; npm dependencies are installed by the batch file only if absent. These behaviors are not yet verified on Windows.

## Local API Routing

- Browser `/api/ollama/*` -> Vite proxy -> `127.0.0.1:11434`
- Browser `/api/vault/*` -> Vite proxy -> `127.0.0.1:8765`
- Keep services loopback-only on Windows. Do not add browser code that calls `localhost` directly, and do not ask the user to set `OLLAMA_ORIGINS=*` for this proxy-based app.

## Living-Documentation Rule

After code, requirement, architecture, or bug changes, update:

- `00_LIVING_DOCS/REQUIREMENTS_LIVING.md`
- `00_LIVING_DOCS/CHANGELOG.md`
- `00_LIVING_DOCS/HANDOVER_LIVING.md`
- `.ai/STATE.json` and `.ai/INDEX.json`
- The visible `ai/` mirrors: `AGENT_INSTRUCTIONS.md`, `CONTEXT.json`, `STATE.json`, and `INDEX.json`
- `memory/sessions/`

Record whether a feature is planned, in source, built, runtime-tested, Windows-tested, or user-confirmed. Do not convert “in source” into “tested” based only on a successful build.

## Branch Safety

This Arena session is pinned to `arena/a7dde6b8-ai-assistant`. Do not initialize a new repository, rename/switch branches, or push to `main`. If the user explicitly requests a push, first review `git status` and the diff; only use `git push origin arena/a7dde6b8-ai-assistant`.

## Privacy / Product Constraints

- Never infer the user's name from a Windows path.
- Never collect passwords, cookies, authentication tokens, payment fields, unsent drafts, or hidden keystrokes.
- Extension policy is default-allow after one-time permission with an editable/revocable never-check blacklist; inaccessible capture should log a reason without a popup.
- Preserve existing Obsidian source notes; chat turn capture is intended to append idempotently.
- Keep local-first behavior and do not claim untested model, vault, extension, Windows, or visual behavior as complete.
