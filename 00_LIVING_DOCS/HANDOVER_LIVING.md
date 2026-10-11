# HANDOVER_LIVING.md — Current State + Gaps

**Last Updated:** 2026-10-12 Asia/Dhaka
**Purpose:** Continue accurately from the repository. This file distinguishes source-written, compiled, tested, and user-confirmed behavior.

## 1. Current app and Git state

- Current working branch: `arena/b485c0f2-ai-assistant` (fixed for this Arena session). Do not switch branches.
- Open PR #4: `https://github.com/NishadIslamUtso/AI-Assistant/pull/4`, `main` ← `arena/b485c0f2-ai-assistant`. Implementation commit `3cae481` is pushed; a follow-up docs-only commit synchronized the handoff/state. PR #4 remains OPEN.
- Reconciled the local checkout against the fetched PR head after a session restore made PR files appear as untracked/missing. Verified the worktree copies matched PR #4, then fast-forwarded the same named session branch to `e770526`; no prior PR work was discarded.
- Fetched `arena/3c06e1bf-ai-assistant` as a read-only reference. Its head is `871e857`; history includes `959cc3b` UI adoption and `01199af1` lineage. No branch switch, merge, PR-base change, or user vault fixture copy was performed. Selected app/docs were ported onto the fixed current branch.
- Current-turn implementation and docs are committed and pushed as `3cae481` on the fixed branch; PR #4 remains OPEN. Do not switch branches or alter the PR base.

## 2. Verified current app status

**`apps/01_claude-exact-pixel-clone/`** adopts the user's preferred screenshot-led UI and adds/retains local-first operation. It is a Vite/React browser app with local Node services, not yet a native Windows installer.

Implemented this turn:
- Inline visualizer for explicit HTML/SVG artifacts; inline and full workbench previews both use a restrictive CSP and `iframe sandbox="allow-scripts"` without same-origin access.
- “Pin selection to edit”: select up to 4,000 characters, optionally add a note, then add a quoted edit request to the composer. Nothing is sent until Send. Existing draft text is preserved.
- “Branch here”: local prefix-only transcript copy, regenerated message/artifact IDs, preserved same-browser image attachment references, original conversation untouched, and branch capture to the vault.
- Explicit artifact-to-Obsidian save: the app calculates immutable artifact/note paths, shows the exact local vault root, both paths, and full source content; only a second explicit save confirmation writes it. Downloaded source warns that it is no longer sandboxed.
- Static built preview server now shares the dev-server proxy allowlist and same-origin/write checks, strips cookies and authorization, rejects encoded static traversal, sends safety headers, and binds to loopback by default. `start-app.bat` no longer writes persistent `OLLAMA_ORIGINS=*`.
- Product scope remains local-only: default `qwen2.5:3b`; no automatic model pulls, no cloud fallback, no remote MCP/server, no hosted deployment. Image support requires verified local Ollama `vision` metadata; the default model is not assumed to support it.

### Validation (sandbox only)

- `npm ci --no-audit --no-fund`: completed.
- `npm test`: 55/55 Node tests pass (artifact/storage and local vault paths, branch/pin logic, Ollama streaming, proxy policy, preview server/path safety, Vault API).
- `npm run test:ui`: 7/7 jsdom smoke tests pass after optional test-only jsdom installation. jsdom is not an app dependency.
- `npm run build` and `npm run build:preview`: clean.
- `npm audit --omit=dev --audit-level=moderate`: 0 production vulnerabilities.
- The live Arena preview serves the built app through `server/preview-server.cjs`; synthetic-origin smoke returned 200 for the app, mock model list, and disposable-vault status, while model-pull and hostile-origin requests returned 403. It uses `server/mock-ollama.cjs` plus a temporary `/tmp` vault, **not** the user's Ollama or Obsidian vault.
- `node --check`/preview integration covered by the Node test suite.
- Playwright `tests/app.spec.js` was updated for new behaviors but not run: runner/browser are not installed.
- **Not verified:** user's Windows 11 TUF A15, Ollama process/model, real vision model, native behavior, and a real Obsidian vault. Sandbox Ollama was unavailable. No behavior is user-confirmed yet.

## 3. Windows quick start

From `apps\01_claude-exact-pixel-clone`, run `start-app.bat`. It uses the existing local Ollama install, offers (does not force) a `qwen2.5:3b` pull if absent, starts the local vault API, and opens `http://127.0.0.1:5173`. Keep the terminal open. Do not set `OLLAMA_ORIGINS=*`.

For a built local bundle: run `build-windows.bat`, then `node server\preview-server.cjs`; open `http://127.0.0.1:4173`. Static preview binds to `127.0.0.1` unless the operator explicitly overrides HOST.

## 4. User constraints — preserve

- App name casing is exactly `AI ASSistant`; screenshots `191547`–`191707` are visual ground truth.
- Local-first, existing Ollama `qwen2.5:3b`; no default download, cloud fallback, or Claude-equivalent quality claim. Hardware: Windows 11 ASUS TUF A15, 8 GB RAM / 4 GB VRAM, slow downloads, no native compiler assumed.
- Obsidian Markdown remains canonical; SQLite, if later added, is only a rebuildable index. Never infer a user name from a Windows path.
- Sensitive external sends require an exact destination/content preview and one-send approval. Do not enable remote integrations without explicit user approval.
- Never collect passwords, cookies, auth tokens, payment fields, unsent drafts, hidden keystrokes, continuous screenshots; incognito/private capture stays off unless separately enabled.
- Preserve extension capture policy and never-check blacklist, Capsule Hub and Quillbot UX direction, and one-step beginner-friendly Windows guidance. Do not claim extension coverage without end-to-end tests.
- Update living docs and AI state each turn. Mark behavior source-written / compiled / tested / user-confirmed separately.

## 5. Gaps / next steps

1. Rerun tests/build after any follow-up; check `git diff` and commit/push only to `arena/b485c0f2-ai-assistant` if appropriate. PR #4 is the current change vehicle.
2. Optionally run Playwright E2E after installing a compatible Playwright runner and browser; no large browser download is required for normal app use.
3. User-side Windows smoke test is still required before claiming machine-confirmed Ollama/Obsidian behavior.
4. Test with an actually installed local vision-capable model; the default `qwen2.5:3b` is text-only unless metadata says otherwise.
5. Native Windows wrapper/installer, full Claude capability audit, Today-view journal generation/monthly audit, and browser extension→vault end-to-end test remain incomplete.
6. Do not implement multi-agent orchestration or MCP until the user explicitly requests it and the memory/privacy trade-offs are reviewed; no remote hosting/deployment by default.
