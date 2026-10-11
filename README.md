# AI ASSistant — Master Github Repo (AI-Optimized)

**THIS REPO IS MEMORY FOR AIS, NOT FOR HUMANS.** Human polish is secondary. Structure is optimized for LLM handover, continuity, and RAG.

**Owner:** Utso (nishadislamutso@gmail.com) — Dhaka, BD — TUF A15 — 8GB RAM / 4GB VRAM / 500GB storage
**Date:** 2026-10-12 Asia/Dhaka
**App Name:** `AI ASSistant` (preserve casing double S)
**Goal:** Local-first Claude-style Windows app that drives the Obsidian vault (vault is canonical Markdown memory; extension is collector+suggester). The current implementation is a local Vite/browser app, not yet a native Windows wrapper. Default model: qwen2.5:3b via local Ollama at 127.0.0.1:11434; local vault API at 127.0.0.1:8765.

## Repo Map for AI Agents — Read This First

```
.ai/                          <- MACHINE READABLE - START HERE
  AGENT_INSTRUCTIONS.md       <- How to continue work, how to update living docs
  STATE.json                  <- Current build state, what works/broken
  CONTEXT.json                <- Who user is, hardware, constraints
  INDEX.json                  <- Full file index with purpose per file
00_LIVING_DOCS/               <- LIVING SOURCE OF TRUTH - UPDATE EVERY CHANGE
  REQUIREMENTS_LIVING.md      <- Living requirements, updated on every change (YOU MUST UPDATE)
  HANDOVER_LIVING.md          <- Current state + gaps + next steps
  ARCHITECTURE_LIVING.md      <- Driver/Vault/Extension architecture
  DECISIONS_LOG.md            <- All decisions with dates
  CHANGELOG.md                <- What changed each session
  TODO_NEXT.md                <- Immediate next actions
apps/
  01_claude-exact-pixel-clone/ <- CURRENT: screenshot-led Claude-style UI, same-origin local Ollama proxy, Obsidian driver, sandboxed artifacts, local branching and pin-to-edit. THIS IS CURRENT TARGET.
  02_electron-claude-clone-v6/ <- PREVIOUS: Electron+React Open-claude fork, more features (artifacts, vision, workbench). Use as reference for features.
extension/                    <- Browser extension MV3: default check everything, Capsule Hub + Quillbot UX
vault/AI-Brain/               <- Obsidian vault canonical memory - 00 System, 01 Inbox, 02 Sources, 03 Memory, 04 Working Memory, 05 Knowledge, 06 Review, 07 Sharing Receipts, 08 Journal, 09 Activity & Undo, 90 Archive, .brain
spec/
  screenshots/                <- 6 Claude desktop screenshots that ARE the spec for exact clone
  CLAUDE_SPEC_FROM_SCREENSHOTS.md <- Extracted spec from screenshots
docs/originals/               <- Original requirement files, master plan, blueprint (historical)
archive_zips/                 <- Previous zips for reference
memory/sessions/              <- Session logs for handover
```

## Quick Start for AI (not human)

1. Read `.ai/AGENT_INSTRUCTIONS.md`
2. Read `00_LIVING_DOCS/REQUIREMENTS_LIVING.md` (living)
3. Read `00_LIVING_DOCS/HANDOVER_LIVING.md` (current gaps)
4. Read `.ai/STATE.json`
5. Check `spec/screenshots/` — those 6 images ARE the UI spec for apps/01_claude-exact-pixel-clone
6. Continue work, then UPDATE living docs

## Quick Start for Human (Windows)

### Latest Exact Clone (Recommended)
```bat
cd apps\01_claude-exact-pixel-clone
.\start-app.bat
```
Requires: Node.js 20+ and a local Ollama install. qwen2.5:3b is the default; if it is absent, the launcher asks before any optional pull.
- `start-app.bat` starts Ollama only if needed, asks before any optional `qwen2.5:3b` download, installs Node dependencies, starts the vault API at 8765, and opens the Vite app at 5173.
- Open `http://127.0.0.1:5173`; browser requests stay same-origin and are proxied to loopback Ollama (`/api/ollama/*`) and the vault API (`/api/vault/*`). No broad `OLLAMA_ORIGINS` setting is written.
- A local static bundle is built with `build-windows.bat` and served through `server\\preview-server.cjs`, which keeps the same filtered proxies; it defaults to `127.0.0.1`.
- See `apps/01_claude-exact-pixel-clone/README.md` for safety boundaries, supported local features, and test commands.

### Electron Clone (More Features)
```bat
cd apps\02_electron-claude-clone-v6
npm install
npm run dev:server
npm run dev
```

### Extension
Load `extension/` as unpacked in chrome://extensions, ensure vault API running at 8765.

## Living Docs Rule

**YOU MUST UPDATE `00_LIVING_DOCS/REQUIREMENTS_LIVING.md` EVERY TIME SOMETHING CHANGES.** This repo is memory. If you don't update it, next AI session loses context.

- Add new requirements as `### [DATE] Added: ...`
- Mark completed as `[x]` in acceptance checklist
- Log decisions in `DECISIONS_LOG.md`
- Log changes in `CHANGELOG.md`

## GitHub Push

```bat
git init
git add .
git commit -m "AI ASSistant master repo - 2026-10-10 - exact clone + extension + vault"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/AI-ASSistant.git
git push -u origin main
```

No secrets in repo. Ollama local, vault local. No API keys committed.

## Hardware Truth

- ASUS TUF A15, 8GB RAM, 4GB VRAM RTX 3050, 500GB, slow downloads
- qwen2.5:3b is baseline, small model limits: misreads "slow" as "Solow", generic answers, claims amnesia. Don't promise Claude parity in intelligence, only UI.
- Bat files must handle existing Ollama process, no native build tools needed, Windows-friendly.

## Latest User Instruction

> "give me one zip file with all we did so far. also that zip file will have the requirement list which will be updated by you every time something changes. basically the repo will also work as a memory and a handover file for other AI/agents/sessions too, i will be one seeing it, s n need to make it lok like human made, make the structure that suits you and ais best for the purpose"

This repo IS that zip's source.
