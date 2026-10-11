# TODO_NEXT.md — Immediate Next Actions

**Last Updated:** 2026-10-12 Asia/Dhaka
**Rule:** Update after each session; separate user-side confirmation from sandbox verification.

## Priority 1 — User-side Windows smoke test (still required)

The app is compiled and tested in Linux sandbox only. Do not claim the TUF A15/Ollama path is confirmed until the user runs it.

1. In Windows Command Prompt, `cd apps\01_claude-exact-pixel-clone` and run `start-app.bat`.
2. If Ollama is stopped, the launcher starts it. If the `qwen2.5:3b` pull prompt appears, skip it unless the user chooses to download; no automatic pull or cloud fallback.
3. Confirm `http://127.0.0.1:5173` loads and the screenshot-led UI looks right.
4. Send a normal question and confirm a local reply appears without an artifact.
5. Ask for a small HTML game, confirm the inline preview and workbench run locally in the sandbox.
6. Select a response excerpt, add a comment, confirm it becomes only an unsent draft; create a branch and confirm the original remains unchanged.
7. If Obsidian is online, review exact artifact paths/content and explicitly save a test artifact to the local vault.
8. Report any Ollama/vault errors or visual mismatches before doing broader feature work.

Do not set `OLLAMA_ORIGINS=*`. If Ollama is unavailable, diagnose with `check-ollama.bat`; do not download anything without user choice.

## Priority 2 — Finish validation after code changes

- [ ] Optional Playwright browser suite (`tests/app.spec.js`) updated for inline preview, draft-only pin, branching, and explicit vault artifact save; install runner/browser only if a real E2E pass is needed.
- [ ] Validate on Windows Node/Ollama/Obsidian; actual vision behavior requires an already-installed local model with verified `vision` metadata.
- [x] Re-checked `git status`, `git diff`, and PR #4; commit `3cae481` is pushed and PR #4 remains open. Work only on `arena/b485c0f2-ai-assistant`.

## Priority 3 — Keep app + Obsidian behavior honest

- [ ] Consider finishing Today journal-draft generation with source/time provenance and explicit user approval.
- [ ] Build a real capability audit against `vault/AI-Brain/00 System/Claude Feature Audit.md`; do not promise full Claude parity.
- [ ] Populate Model Registry from tested local model metadata; don't assume an installed model supports vision/tools.
- [ ] Do not add remote deployment or MCP without exact destination/content preview and explicit per-use approval.
- [ ] Sub-agents remain deferred until measured memory/latency on the 8 GB / 4 GB VRAM device shows they are viable.

## Priority 4 — Browser extension-to-vault end-to-end

- [ ] Load `extension/` unpacked in Chrome and test only the explicitly authorized local path.
- [ ] Verify visit metadata is not treated as proof of reading/agreement.
- [ ] Verify inaccessible captures log the required reason without prompting, blacklist matching blocks collection, and offline queue behavior is reliable.
- [ ] Preserve constraints: no passwords/cookies/tokens/payment fields/unsent drafts/hidden keystrokes/continuous screenshots; incognito off unless separately enabled.

## Priority 5 — Native packaging (later)

- [ ] Choose Electron or Tauri only after the browser app is confirmed on Windows and resource impact is measured.
- [ ] Keep Ollama separately installed; do not bundle models or force downloads.
- [ ] Bind user-local APIs to loopback and preserve same-origin proxy policy.

## Completed this session

- [x] Reconciled the restored local checkout to PR #4's remote head without losing its app changes.
- [x] Read-only fetch/review of the user's `arena/3c06e1bf-ai-assistant` branch; no checkout/merge, no vault fixture data copied.
- [x] Ported its UI/server/docs improvements to the fixed PR branch.
- [x] Implemented inline artifact visualization, pin-to-edit draft flow, local prefix branching, and preview-before-save to the canonical vault.
- [x] Applied the same proxy security boundary to the built preview; removed persistent wildcard Ollama-origin setting.
- [x] Node tests/build and optional jsdom smoke tests passed in sandbox (see HANDOVER and STATE).

## Continue safely

1. Read `.ai/AGENT_INSTRUCTIONS.md`, `.ai/STATE.json`, and `00_LIVING_DOCS/HANDOVER_LIVING.md`.
2. Inspect the worktree and branch before editing or committing.
3. Work only on `arena/b485c0f2-ai-assistant`.
4. Update requirements, changelog, handover, state, and session memory for further work.
