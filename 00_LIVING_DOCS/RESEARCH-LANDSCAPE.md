# RESEARCH-LANDSCAPE.md — what similar repos are doing, and what's worth taking

**Written 2026-10-16**, after his order: "check all the GitHub repos similar
to this and tell me what's worth taking." Live-researched; license noted on
every row because we take IDEAS from MIT/Apache repos and nothing from AGPL
or proprietary ones.

## The Claude-Code-app landscape

| Repo / app | License | What it is | Verdict for us |
|---|---|---|---|
| **Nimbalyst** (github.com/nimbalyst/nimbalyst, ex-Crystal) | MIT | Visual workspace: session kanban, parallel agents in git worktrees, red/green diff review with accept/reject per change, WYSIWYG editors (markdown/Mermaid/Excalidraw/CSV/Monaco), task tracker agents read+write, session↔file links, iOS companion | **The one to study.** Take the ideas below; our engine bay + house rules + free brains are already things it does NOT have |
| **Pane** (runpane.com) | AGPL 3.0 | Runs ANY terminal agent (Claude Code, Codex, Aider, Goose), one worktree per agent | Validates our adapter/socket design (engine registry ↔ our `EngineId`). Ideas only — AGPL code never enters this repo |
| **Claudette** (utensils/claudette) | MIT | Tauri app: per-branch worktree+session+terminal, Monaco, hunk staging, **tray icon + sound on agent events** | Take the notification idea: an engine that needs you should be able to reach the tray (respecting his capture-zero-annoyance rule) |
| CodeAgentSwarm, AigoPilot, Conductor | proprietary/paid | Multi-session parallel agents + notifications | Confirms multi-session is the feature people pay for — ours stays free |
| opcode (ex-Claudia) | MIT but **unmaintained** | Old chat-shell wrapper | Avoid; also Vibe Kanban shut down — never couple the app to a hosted service |

## Worth taking — mapped to our queue

1. **Per-hunk accept/reject on approval cards** (Nimbalyst, Claudette): our
   cards already show a before/after; the upgrade is accept PART of an edit.
   Queued as the diff-card upgrade when Code 06 lands.
2. **Session kanban + session↔file links** (Nimbalyst): we already persist
   resumable session ids per workspace; the board that shows them belongs to
   Projects 04 / Code 06. Linked files feed the per-turn context pane.
3. **Worktree isolation per parallel task** (Nimbalyst/Pane/Claudette):
   "run three tasks without them stepping on each other" — optional, per
   task, later; it must stay invisible until asked for.
4. **Needs-you notifications** (Claudette): tray/title-bar pulse when a
   permission card waits. Small, free, queued after Track C's card-queue fix.
5. **Plain files, no proprietary store** (Nimbalyst's stated principle):
   already our religion — vault + artifacts + rules are all on-disk text.
   Recorded here because it validates the direction.
6. **Extension SDK / EditorHost contract** (Nimbalyst): our artifact
   previewers could later accept third-party viewers through one contract —
   parked with the Community Store plan.

## The extension landscape (browser side)

| Repo | License | Worth taking |
|---|---|---|
| open-claude-in-chrome (noemica-io) | MIT | Native-messaging-host architecture (more robust than our localhost POST; keep the port for now — it works and stays local-only); clean-room discipline |
| Prophet | open source | **Accessibility-tree capture over screenshots** — faster, cheaper, more private; the better default if we ever capture structure beyond text |
| onUI (onllm-dev) | open source | **Annotations → local MCP server** so the ENGINE can query what you marked up in the browser — the natural next power for our capture: not just saving to the vault, but letting Claude Code/agy ask for it |
| BrowserKing | MIT | Side-panel agent pattern; not our shape (we are not a browser agent) |

## What they all lack (our standing differences — keep in JUDGE-BRIEF)

Free Ollama/cloud brains behind one door · house rules projected into every
engine · the engine bay as first-class UI · no account, no key, no telemetry
· artifacts library with versions · the vault that remembers what was read.
None of the surveyed apps unify engines + free brains + a vault + captures;
that union is the product.

---

## 2026-10-16 (day) — the ones HE found: ContextFlow, capsule-hub-skills

### Tilantra/capsule-hub-skills — the cloud product's Claude Code pack
Capsule Hub is a COMMERCIAL service (capsulehub.tilantra.com, accounts,
teams, backend.tilantra.com): save conversations as "capsules" in their
cloud. This repo is its Claude Code skills: /capsule-login, -search, -read,
-save, -version, -team. Requires their account + API base; MCP-based auth.
**Why it matters to us:** our own extension's spec literally says
"Capsule Hub + Quillbot style" — this is the product our capture was
designed against. It validates the niche is real and people PAY for it.
**The one idea worth taking (better than the MCP plan):** they teach Claude
Code to operate capsules via SKILLS — markdown instructions — explicitly to
avoid loading tool schemas into context every turn. Our queued
"extension→engine MCP" becomes: **vault skills + our local vault HTTP API**
(already running, already local) — same capability as their paid cloud flow,
zero account, zero cloud, zero schema bloat. Upgrade to the queued idea.

### jeshiomurmu/ContextFlow — the "free local alternative", with red flags
Chrome extension: capture conversations as capsules, inject into any AI
site, chrome.storage.local, JSON export/import, MIT license claimed.
**Red flags (the pattern to learn):** entire history is 2 commits on ONE day
(3 Jul 2026); the latest commit is "Change copyright to Jeshio Murmu"; its
own README's bug/contribute/clone links point to a DIFFERENT account
(github.com/contextflow/extension); no tags, no tests, no releases. Classic
rebrand/clone profile — treat as unverified provenance; do not install, do
not take code. **Worth taking as IDEAS only:** keyboard shortcuts
(Ctrl+Shift+S capture, Ctrl+Shift+K panel), pins in the popup, and the
universal clipboard-fallback inject for sites without an adapter.

### The triage rubric (for the "way many like this" problem)
Every repo in this space gets five questions, in order:
1. **Provenance** — one-day history? copyright-swap commit? links pointing
   to another account? Then it is a rebrand: ideas maybe, code never.
2. **Cloud or local** — needs an account/backend? Then it is against the
   product's religion; at most study its API shape.
3. **Liveness** — commits, issues answered, releases? Dead = read, don't rely.
4. **Genuinely new or wrapper?** — most are thin wrappers around the same
   three ideas: capture, inject, store. The wrapper layer is not the moat.
5. **License** — MIT/Apache ideas free; code only with license review; AGPL
   never enters the repo.

### Standing conclusion
A paid cloud Capsule Hub + free clones + skills packs all prove the
capture/capsule niche pays. Our position is the strongest slot in it:
local + free + versioned vault + THE ENGINE can use what was captured
(nobody else wires capture to an agent). The niche being crowded is
validation, not threat.
