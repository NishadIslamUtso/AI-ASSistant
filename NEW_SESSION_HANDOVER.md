# NEW_SESSION_HANDOVER — start here

**Updated:** 2026-10-10, Asia/Dhaka. **Repo:** NishadIslamUtso/AI-ASSistant. **Session branch:** `arena/01199af1-ai-assistant`; starting commit `547b4d81401a9e56232234fb96649386e89f362a`.

This file was absent when this continuation began. It now points to the actual living handover, not to a separate app or historical ZIP.

1. Read `.ai/AGENT_INSTRUCTIONS.md` and `.ai/STATE.json` (visible `ai/` is synchronized).
2. Read `00_LIVING_DOCS/REQUIREMENTS_LIVING.md`, `HANDOVER_LIVING.md`, and `TODO_NEXT.md`.
3. Work in **`apps/01_claude-exact-pixel-clone/`**, version 0.2.0. `apps/02_electron-claude-clone-v6/` is reference only.
4. The six reference PNGs 191547–191707 are **1920×1020**. Viewer previews resize them. Compare at 1280×680 CSS / DPR1.5, but do not claim this is the user's confirmed laptop DPI or that the current web app is a native installer.

## Current evidence

Screenshot dialogs, per-chat persistence/streaming, installed-local model discovery, verified uploads/thinking, isolated HTML/SVG artifacts, canonical vault writes, capsule preview/drop/Cook and the vault blacklist are in source. Sandbox build and automated results are recorded in `TESTING_CHECKLIST.md`; Ollama browser tests are mocked, not a real qwen2.5:3b run. UI has been visually recaptured/reviewed, not user-confirmed pixel-perfect.

## Must not regress

Use the user's already-installed Ollama and already-pulled **qwen2.5:3b**. No downloads/reinstall/model auto-switch/wildcard origins. Relative browser APIs, loopback-only targets; Ollama cloud entries are blocked. Preserve originals. No remote Markdown image loads, raw HTML in chat DOM, unsafe same-origin/CDN artifact runner, arbitrary shell commands, fake thinking, or automatic external sends.

Native menus/title bar/installer, Chrome-extension end-to-end and never-check synchronization **before DOM reads**, complete Capsule branches/rollback/attachment transfer, Open Loops/Current Snapshot, Today/journals/follow-ups and monthly-audit execution remain unfinished. Do not mark P3–P9 or all Claude features complete.

## Git/data boundary

Local commits are permitted; remote push is external send and requires destination/content approval. **No push or merge has been performed in this continuation.** Do all Arena work on `arena/01199af1-ai-assistant`.

The final review found uncommitted canonical-vault blacklist edits and local activity/revision files from while the preview was running; their initiating action was not confirmed. Leave them intact and outside source staging/packaging. Do not attribute them to the user, restore them, revoke exclusions, delete originals, or upload them automatically. New runtime vault data is ignored by default, but existing tracked templates can still be modified: selective staging remains essential.

A source ZIP must contain the entire runnable repository structure before merging. It is not a backup of private runtime vault data. See `BRANCH_TESTING.md` and the safe `scripts/package-source.cjs` flow. Give the Windows beginner **one step at a time**; next step is extracting into a new folder without overwriting an existing vault.
