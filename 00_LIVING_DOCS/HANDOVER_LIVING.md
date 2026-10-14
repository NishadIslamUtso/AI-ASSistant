# HANDOVER_LIVING.md — Current State + Gaps (Living)

**Last Updated:** 2026-10-14 (night) Asia/Dhaka
**Purpose:** everything a new AI or developer needs to continue, without trusting anybody's memory.

## 1. Executive Summary

The owner wants **AI ASSistant**: a local-first desktop assistant that looks and behaves like a serious app,
keeps everything in an Obsidian vault he can read and edit, runs local models through Ollama on a 4GB-VRAM
laptop, and collects from the browser through an extension — but only with his permission.

The app is `apps/03_ai_assistant`'s successor `apps/03_ai-assistant/` (Electron + React + TypeScript).
It is built and verified in the sandbox. It has **not** yet run on the owner's Windows machine, and that is
the first item on the list.

## 2. Where the code stands (2026-10-14)

**Branch:** `arena/3c06e1bf-ai-assistant-v3` → merged into `main`. Both pushed.
Last landed: `a52f2bf` (merge: Settings as the full window), on top of `4731756`, `5b371b4`, `110a80b`.

**Verified in the sandbox — this is evidence, not a plan:**

- [x] `npm test` → 22 files / 208 tests pass
- [x] `npm run typecheck` → clean
- [x] `npm run build:web` → clean; the browser preview on 4174 serves the fresh bundle
- [x] Browser check: 28 assertions true, **0 console problems** — includes the width token actually being
      painted, reload persistence, the rail's search, Reset, and "no false warning"
- [x] `npm run smoke` → `SMOKE OK title="AI ASSistant" size=1280x820 errors=0 warnings=0`
- [x] Desktop end-to-end: a typed message is answered, the conversation is found in the vault on disk,
      `09 Activity & Undo` is appended, the vault is moved from Settings, and the next conversation lands in
      the **new** vault while the old one is untouched — console clean throughout

## 3. What works, in the owner's terms

- **Chat**: streaming answers from Ollama, stop keeps the partial reply, regenerate, edit-and-resend, branches.
- **Artifacts**: extracted from replies, sandboxed preview, code view, version history, ZIP export.
- **Comment mode**: point at something in a preview, describe the change, one append-only rewrite at a time.
- **Memory**: every finished conversation becomes Markdown in the vault; nothing is invented; a failed write
  says so in one line instead of pretending.
- **Settings** (full window, rail on the left):
  - *System* — what is actually running: the app, the model Ollama reported, its endpoint, the folder.
  - *Appearance* — accent and conversation width, written into the theme tokens themselves, kept across reloads.
  - *Performance* — Ollama's options from profile presets or Custom values, measured against the chosen profile.
  - *Vault* — the folder, chosen through the main process; a folder that does not exist is refused and
    nothing is created in its place.

## 4. What is honestly missing

1. **It has not run on the owner's Windows machine.** No installer exists; `npm run dev` is the way in.
2. **Cloud providers** (Claude / GPT / Gemini APIs) — a required feature, not implemented.
3. **Settings > Agent access** — the permission surface; built when something real can be granted.
4. **The extension cannot reach the app.** The vault API is in-process; no loopback port is open. This blocks
   the whole browser-capture feature and is a deliberate deferral, not an oversight.
5. **No voice / wake word.** Parked by the owner until he has better hardware.

## 5. How to continue

1. Read `README.md` (the owner's own instructions), then `.ai/CONTEXT.json` and `.ai/STATE.json`.
2. `cd apps/03_ai-assistant && npm install && npm test` — get a green baseline before touching anything.
3. Work on `arena/3c06e1bf-ai-assistant-v3`. When a step is finished **and verified**, commit it (naming
   every file, untracked additions included), merge `--no-ff` into `main`, push both, then report.
4. Update the living docs in the same commit as the work.

## 6. History, in one paragraph each

- **2026-10-10 — the clone era.** `apps/01_claude-exact-pixel-clone/` was built to match six Claude desktop
  screenshots, with an Express vault API on port 8765 and bat files for Windows. It is history now: a source
  for porting *logic* (markdown, inference profiles, vault client behaviour), never for JSX.
- **2026-10-11 — the first real architecture.** The rebrand to AI ASSistant, `apps/03_ai-assistant/` as the
  line of work, hooks and a local API, artifacts, comment mode.
- **2026-10-14 — it became an app.** Vault writes through the main process; Settings with Appearance and
  Performance; the Vercel deployment files deleted at the owner's request; Settings rebuilt as the full
  window; and the memory warning fixed to measure against the profile the owner chose.
