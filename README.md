# AI ASSistant — Master Github Repo (AI-Optimized)

**THIS REPO IS MEMORY FOR AIS, NOT FOR HUMANS.** Human polish is secondary. Structure is optimized for LLM handover, continuity, and RAG.

**Owner:** Utso (nishadislamutso@gmail.com) — Dhaka, BD — TUF A15 — 8GB RAM / 4GB VRAM / 500GB storage
**Date:** 2026-10-14 Asia/Dhaka
**App Name:** `AI ASSistant` (preserve the double S). It is its own application, not a Claude clone.
**Goal:** a local-first desktop assistant that drives an Obsidian vault (the vault is the memory that outlives
the app), runs local models through Ollama at 127.0.0.1:11434, and reaches the network only when the user
grants it, from Settings.

## Where the app actually is

| Path | What it is | State |
|---|---|---|
| `apps/03_ai-assistant/` | **THE APP.** Electron + React + TypeScript + Tailwind 4. Real chat, artifacts, comment mode, vault writes, online providers, an extension port, agent permissions, Browsing Maps, Settings. | Active. 269 tests, typecheck, both builds, desktop smoke and all six end-to-end checks (vault, cloud, extension port, agent access, browsing maps, artifacts library) green in the sandbox. Chat, Settings and **Artifacts** exist; Today, Vault, Projects, Code and first-run are next. A Windows installer exists (`AI-ASSistant-Setup-0.1.0.exe`, unsigned → SmartScreen warning; notes in `apps/03_ai-assistant/RELEASE-WINDOWS.md`). **Installing it on the user's Windows machine is the open item.** |
| `apps/01_claude-exact-pixel-clone/` | The first clone, built to match six Claude screenshots. | Historical. Kept as the port source for libs/hooks/server logic. Not the app. |
| `apps/02_electron-claude-clone-v6/` | An older Electron fork with more features. | Historical reference. |
| `extension/` | MV3 browser extension: collector + context suggester. | Starter + spec. **The app now has the port it needs** (127.0.0.1:8765, capture side only), but the extension itself has not been loaded or run against it yet. |
| `vault/AI-Brain/` | The canonical Obsidian vault (63 tracked files). | Canonical memory. Read/edited by a person as easily as by the app. |
| `spec/`, `docs/` | The old clone's specs and the original requirement files. | Historical. |

## Repo Map for AI Agents — Read This First

```
.ai/                          <- MACHINE READABLE - START HERE
  AGENT_INSTRUCTIONS.md       <- How to continue work, how to update living docs
  STATE.json                  <- Current build state, what works / what is missing
  CONTEXT.json                <- Who the user is, hardware, capture policy, UX rules
  INDEX.json                  <- File index with purpose per file
00_LIVING_DOCS/               <- LIVING SOURCE OF TRUTH - UPDATE EVERY CHANGE
  REQUIREMENTS_LIVING.md      <- Living requirements + acceptance checklist
  HANDOVER_LIVING.md          <- Current state, gaps, next steps
  ARCHITECTURE_LIVING.md      <- How the app, vault and extension fit together
  DECISIONS_LOG.md            <- Decisions with dates and reasons
  CHANGELOG.md                <- What changed each session
  TODO_NEXT.md                <- Immediate next actions
apps/03_ai-assistant/         <- THE APP (src/main, src/preload, src/renderer, src/shared, tests)
extension/                    <- MV3 extension + spec
vault/AI-Brain/               <- Obsidian vault, canonical memory
memory/sessions/              <- Session logs, chronological
docs/originals/               <- The original requirement files (historical)
```

## Quick Start

**Tests** (no machine required, this is what CI would run):
```bash
cd apps/03_ai-assistant && npm install && npm test        # 269 tests, 28 files
```

**Desktop app** (needs Ollama running with a model pulled):
```bash
cd apps/03_ai-assistant && npm install
npm run dev          # Electron window
npm run smoke        # builds, opens, closes, prints SMOKE OK / errors=0 warnings=0
```

**Windows installer** (no Node, no build tools, no admin rights on the machine that installs it):
```bash
cd apps/03_ai-assistant && npm install
npm run dist:win     # -> dist/AI-ASSistant-Setup-<version>.exe  (~84 MB, NSIS, per-user)
```
It is **not code-signed**, so Windows shows SmartScreen's *"unknown publisher"* — `More info` → `Run anyway`.
What that warning means, what gets installed where, and what was verified before shipping:
`apps/03_ai-assistant/RELEASE-WINDOWS.md`. Ollama must be running for the local model; the app never installs it.

**Browser preview** (the interface only — no models, no vault, and it says so):
```bash
cd apps/03_ai-assistant
npm run build:web && npm run preview:web   # http://localhost:4174
```

## What the user has asked for (standing instructions)

These are the owner's own words and corrections. They outrank anything a later AI prefers.

- Build the frontend as the approved mockups show, **but where a mockup would produce a broken or dishonest
  UI, infer the intent and fix it** — nothing fake in front of the user, ever ("existing without working" is
  forbidden).
- Settings is **one full-window surface** — a rail of sections on the left, one section at a time on the right
  (the owner's words: "the one with full screen settings, like Windows settings"). Not a modal.
- Do not warn about memory *after* asking which GPU the machine has: the chosen profile **is** the answer.
  Measure against it, stay quiet when it fits.
- Settings are terse: a label and the control. No written-out descriptions under options.
- "Leave vercel delete all vercel files. It isn't helping like i thought." — the deployment files are gone and
  must not come back. (The Vercel *design theme* and the `vercel.json` inside exported site ZIPs are separate
  things and stay.)
- Online APIs (Claude and the rest) are a feature, not an afterthought — but nothing is sent anywhere until a
  key is saved by hand. Keys belong to the machine, not to the interface.
- Permissions belong in one place — "put everything in settings, so i can give access to the cloud agent or the
  local agent of something when I want to" — and every switch must govern something real, or it is not shown.
- App name is **AI ASSistant**; no Claude branding in user-facing copy.
- Do not look at other branches for design. From other branches take only finished logic, never JSX.
- Open-source ready for anyone's machine: no hardcoded names, emails, paths or model tags.
- As customizable as possible; smooth and seamless.
- Work lands on `arena/3c06e1bf-ai-assistant-v3` and is merged into `main`, verified, then reported.
- Do not rush a step and break it: one thing at a time, verified, then stop.

## Living Docs Rule

**UPDATE `00_LIVING_DOCS/REQUIREMENTS_LIVING.md` EVERY TIME SOMETHING CHANGES.** This repo is memory.
If it is not updated, the next session loses context.

- Add new requirements as `### [DATE] Added: ...`
- Mark completed work as `[x]` in the acceptance checklist
- Log decisions in `DECISIONS_LOG.md`, changes in `CHANGELOG.md`
- Update `.ai/STATE.json` and `memory/sessions/<date>-session.md`

## GitHub Push

```bash
git remote add origin https://github.com/NishadIslamUtso/AI-ASSistant.git
git push -u origin main
```

No secrets in the repo. Ollama is local, the vault is local, no API keys are committed.

## Hardware Truth

- ASUS TUF A15: 8GB RAM, 4GB VRAM (RTX 3050), 500GB, slow downloads, Windows 11.
- `qwen2.5:3b` is the baseline and it is small: it misreads words, gives generic answers and claims amnesia.
  Never promise Claude-level intelligence — the goal is a better interface, better memory and real control.
- Everything must run without native build tools, and must not fight an already-running Ollama.
