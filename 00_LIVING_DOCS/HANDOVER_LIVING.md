# HANDOVER_LIVING.md — Current State + Gaps (Living)

**Last Updated:** 2026-10-14 (evening) Asia/Dhaka
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
Last landed: `2b46b46` (merge: Browsing Maps, on top of `e453dd4`), after `93f2e5c` (merge: Agent access,
on top of `b1a84a4`) and `7a5e8f4` (merge: online providers).

**Verified in the sandbox — this is evidence, not a plan:**

- [x] `npm test` → 27 files / 255 tests pass
- [x] `npm run typecheck` → clean
- [x] `npm run build` (desktop) and `npm run build:web` → clean
- [x] `npm run smoke` → `SMOKE OK title="AI ASSistant" size=1280x820 errors=0 warnings=0`
- [x] Browser check: 40 assertions, **0 console problems**
- [x] Desktop end-to-end — five checks, all green: the vault (a typed message is answered, the conversation is
      found in the vault on disk, `09 Activity & Undo` is appended, the vault is moved from Settings and the
      next conversation lands in the **new** vault), the cloud path (key pasted → Test → model in the composer
      → the provider's own answer, asked exactly once), the extension port (a capture lands in the vault, the
      never-check list round-trips, no-origin and page-origin refused), agent access (a switch off → `403`
      with the reason and nothing written; `Keep conversations` off → the chip says `Vault off` and nothing is
      kept), and Browsing Maps (a seeded week → exactly 7 entries, a torn line is not an 8th, counts follow
      the filter) — console clean throughout
- [x] **The Windows installer**: built, its payload listed out of the installer itself (`app.asar`, the exe, the
      uninstaller, `en-US.pak` only), and the same configuration packaged for Linux boots clean —
      `SMOKE OK … errors=0 warnings=0`
- [ ] **It has still not run on the owner's Windows machine** — the installer exists now, and installing it
      there is Priority 1

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
  - *Models* — the models Ollama reports, plus a key per online provider (Anthropic, OpenAI, Gemini,
    OpenRouter, Groq, DeepSeek, xAI, or any OpenAI-compatible endpoint), sealed by the machine and never
    handed to the interface.
  - *Agent access* — the local model, browser captures, keeping conversations, and one switch per keyed
    provider; each enforced in the main process *before* anything is sent or written. Files, Shell, Web and
    MCP are stated as not built rather than offered as switches.
- **Where an answer came from** is on every reply: `local`, or `online · <provider>`.
- **Browser capture has a socket**: `127.0.0.1:8765`, loopback and `chrome-extension://` origins only,
  carrying the capture side of the vault (health, status, context, capsules, blacklist, capture) and nothing
  that could spend a key, change a setting or export the vault.
- **Browsing Maps**: the vault's own record — conversations, captured pages and visits — as a timeline with
  site grouping, kind filters, search and a time window. A visit stays a visit; nothing is invented and no
  count disagrees with the rows on screen.
- **A Windows installer** (`AI-ASSistant-Setup-0.1.0.exe`, ~84 MB, NSIS, per-user, unsigned → SmartScreen
  warning): notes, first run and the reproducible build recipe in `apps/03_ai-assistant/RELEASE-WINDOWS.md`.

## 4. What is honestly missing

1. **It has not run on the owner's Windows machine.** The installer exists now
   (`AI-ASSistant-Setup-0.1.0.exe`); installing it and using it is the owner's own test, and the first item on
   the list.
2. **The browser extension itself is still a starter.** The app has carried the port it needs since `8e589a0`,
   but the extension has not been loaded or run against it — nothing is captured from a browser yet, so
   Browsing Maps is mostly the app's own conversations.
3. **The preview/export chain, the topic list / branch tree, and projects + chat memory** — asked for, not
   built.
4. **Cloud follow-ups:** per-provider default model, an audit log, a token/cost meter, cloud → local-only
   failover.
5. **No code signing.** Windows will warn about an unknown publisher until a certificate exists; the release
   notes say so plainly rather than letting it look like a mistake.
6. **No voice / wake word.** Parked by the owner until he has better hardware.

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
- **2026-10-14 (evening) — it became shippable.** Online providers behind Settings > Agent access, the loopback
  port for the browser extension, Browsing Maps over the vault's own record, and finally a Windows installer
  (`AI-ASSistant-Setup-0.1.0.exe`) — the first file a person can double-click.
