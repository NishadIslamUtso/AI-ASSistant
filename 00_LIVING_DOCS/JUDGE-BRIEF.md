# JUDGE BRIEF — read me first (written for the owner's reviewing agent, 2026-10-15)

You are reviewing the work of an AI building **AI ASSistant** for its owner,
Nishad. This document tells you what the OWNER wanted, what was actually done,
where the evidence lives, and what is deliberately still open. Judge the work
against the owner's intent — not against items that were never scheduled yet.

## 1 · What the owner wanted (his words, his rules — standing)

- **Free, except his own buy-button:** "the priority is to make it and use it
  for free… except the API cost if and only if I ever decide to purchase a
  subscription. Other than that, everything must be free." (2026-10-15)
- **His app is the face; Claude Code is the engine inside it; agy CLI is
  engine #2:** "gonna implement that, and agy cli too, and make my the way i
  want it to be, basically claude code will run on it normally, it's features
  will work in the app normally too." (2026-10-15)
- **Total layout freedom was the point** — he rejected VS Code's fixed UI:
  "it destroys the entire purpose of freely changing app layout."
- **The mockups are the design authority**; a nav item appears only when its
  screen works (no dead buttons, no placeholders, zero mocking).
- **Console-clean CI** (a warning fails the build), real data only (nothing
  invented in the UI), PowerShell 5.1 rules on his machine (no `&&`), no
  Vercel, no Claude branding in user-facing copy (the app is AI ASSistant;
  his SVG is the only mark), docs stay in sync at every landing.
- **Plain-words rule:** he reads everything — explain like he knows no tech.
- **Plan first, code only after his "go"** — every landing on this branch had
  his explicit go/next.

## 2 · What was done (all merged into `main`; working branch
`arena/3c06e1bf-ai-assistant-v3`)

Free setup on his machine (verified by his own runs): Ollama auto-start
(hidden, context 16384), Claude Code CLI v2.1.300 wired to free brains
(`gemma4:cloud` default, local `qwen2.5-coder:3b` seatbelt), 11 skills live,
mod marketplace connected. Paywalls hit and refused per the Free Gate:
Claude in Chrome (paid-only), Desktop app Code tab (paid-only), VS Code
fallback (owner veto).

In this repo (the app), latest landings with commits to inspect:

| Commit | What it is |
|---|---|
| `bfda13a` | Architecture doc: face/engine/socket, SDK-vs-stream decision, 6-phase plan |
| `78e0eb1` | **Engine back room:** `src/main/engine/{stream,claudeCode,socket}.ts`, settings.engine, 5 IPC doors, preload API; wire parser with 12 tests (split/broken lines, permission control requests, failures) |
| `2261704` | **Engine face:** composer Engine toggle, work-order panel (`EnginePanel.tsx`), Allow/Deny permission cards wired to the control wire, honest demo refusals in browser preview |
| `d8788c7` | **Feature audit** (`FEATURE-AUDIT.md`): every take-item from BUILD-TODO / app-feature-matrix / redesign plan / Claude-OS list, status verified against code |

Evidence you can run (in `apps/03_ai-assistant`):

```
npx vitest run          # 287 tests, all passing (12 engine wire + 6 face)
npx tsc --noEmit -p tsconfig.json   # clean
```

Deliberate engineering decision to scrutinize: the engine drives the **real
installed CLI in stream-json mode** rather than the Agent SDK — reasons in
`ARCHITECTURE-ENGINE.md` §Job 2 (sandbox could not install the SDK; the CLI
was already owner-verified; fully testable; keeps the mods door open). The
SDK remains the documented fallback.

## 3 · Honestly open (planned, NOT done — do not credit or penalize as done)

1. Windows **installer** for the current build (next landing; he has run none of
   the engine work yet).
2. Six designed screens: Today (07), Projects (04), Vault (05), Code (06),
   first-run init (08), appearance polish (09).
3. One-click **undo** after an approved engine action (approval cards exist).
4. **Session-insight extraction** feeding Today.
5. **MCP server** exposing vault + artifacts.
6. **agy** adapter (socket exists; Windows support check not yet run).
7. Chat-shell luxuries per BUILD-TODO (branching, split chats, regenerate,
   mermaid, exports beyond HTML, prompt library…).
8. Claude-OS knowledge-lifecycle takes.

## 4 · Repo map for you

- `00_LIVING_DOCS/` — CLAUDE-SETUP (active plan), TODOLIST (feature record),
  BUILD-TODO (full take-list), FEATURE-AUDIT (what's in vs open, verified),
  ARCHITECTURE-ENGINE (the design), HANDOVER (reading order), CHANGELOG,
  DECISIONS_LOG, this brief.
- `memory/sessions/` — the running session log, including mistakes and their
  fixes (the builder keeps an honest ledger).
- `apps/03_ai-assistant/` — the app (Electron + Vite + React + TS).
- Branch hygiene (2026-10-15): 12 stale session branches deleted; every tip
  preserved as a `keep/*` tag (feature-source branches included — BUILD-TODO
  still cites them). Remaining: `main`, the working branch, `brain01`
  (owner's), `archive/workspace` + `archive/ai-assistant-app` (owner's
  archives, public by his choice).

## 5 · How to judge

1. **Fidelity to §1** — does every change serve the owner's stated intent?
2. **Truthfulness** — pick any "done" claim in the docs and verify it in code.
   The builder's standard is zero claimed-but-absent work.
3. **Engineering quality** — the engine module: contract typing, parser
   robustness tests, permission wire, refusal-as-answer (never exceptions at
   the UI), house style kept (narrow typed doors, plain-words comments).
4. **Safety & cost** — nothing paid was purchased or risked; permissions
   gate the engine; secrets never cross to the renderer.
5. Say clearly what you would do differently, with reasons — the owner will
   relay it and the builder continues from it.
