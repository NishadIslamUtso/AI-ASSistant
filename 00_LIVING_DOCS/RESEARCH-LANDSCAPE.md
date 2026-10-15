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
