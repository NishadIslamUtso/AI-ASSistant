# TODO_NEXT.md — Immediate Next Actions (Living)

**Last Updated:** 2026-10-15 (late night) Asia/Dhaka — rewritten after the
engine-spine session (Engine bay, house rules, throttle, freedom matrix,
memory guards). Where this and TODOLIST.md disagree on ORDER, this file wins.

## What changed this session (already DONE, for the record)

- [x] **v0.3.0 shipped:** the engine is the spine — EngineBay (engine
  selection system, brains FROM the engine's door, workplace folder picker),
  composer defers in engine mode, truthful alive tracking.
- [x] **House rules compiler** (`shared/lib/houseRules.ts`): one rulebook →
  CLAUDE.md (Claude Code) / AGENTS.md (agy); includes his standing
  instructions (ask when unsure, do nothing unnecessary) and memory
  discipline (answer from the conversation first, never sweep).
- [x] **The throttle:** Ask me (`manual`) / Auto-edits (`acceptEdits`) /
  Full speed (`bypassPermissions`) — the engine's own official modes, the
  app adds none of its own.
- [x] **Freedom matrix + five boundaries + memory problem** documented in
  ARCHITECTURE-ENGINE.md; both engine repos verified (agy has NO custom
  endpoint — Ollama brains can never plug into it; fake
  `gemini-antigravity-cli` repos = scams, warned).
- 315/315 tests, tsc clean, pushed (main = v3).

## NOW — the acceptance round-trip (everything hangs on this)

- [ ] **Rebuild installer as v0.4.0** — 0.3.0 predates the throttle + house
  rules; he must get ONE installer with everything (`npm run dist:win`,
  wine note in RELEASE-WINDOWS.md).
- [ ] **His run on the TUF A15:** install → Engine on → pick a brain in the
  bay (cloud badge = leaves machine; local = offline) → pick a folder →
  set the throttle → give real work → approve via the card → see artifacts
  land. This is the ✅ the judges demanded (6.2/6.5 tick on 👍).
- [ ] On any defect: same-day fix, rebuild, he retries.

## TRACK A — the spine (engine parity — his #1 ruling, in order)

- [ ] **Per-engine model routing** — `engine:models` becomes per-engine:
  claude-code → brain door `/api/tags`; agy → its own selector (read from
  his machine once installed); the bay shows each engine's REAL freedom,
  never a pickable lie.
- [ ] **Pull-models button in the bay** (`POST /api/pull` to the door) —
  "whichever models I want" with zero terminal.
- [ ] **agy Windows check (6.3)** on his machine → `main/engine/agy.ts`
  adapter (native input mode vs PTY, decided by the check) → throttle mapped
  to agy's approval rules → bay flips "soon" to live.
- [ ] **Session history / resume** — engine sessions listed and resumable
  (the `--resume` class of ability), in-app.
- [ ] **Skills, one vault → every engine:** import his existing 11 CC skills
  into the app vault (markdown + frontmatter, already the format) → deploy
  to `~/.claude/skills/` AND `.agents/skills/` → a Skills pane in the app.
- [ ] **MCP, one list → every engine:** app keeps the server list, projects
  to Claude Code's config and agy's `.agents/mcp_config.json` (field names
  translated per engine).
- [ ] **File diffs on approval cards** — see exactly what an edit changes
  before allowing it.
- [ ] **Usage display** — what each session/turn cost in time and tokens
  (cloud brains: the free-slice caps visible).
- [ ] **Plugin packs (level 2)** — per-engine plugin packaging, after the
  agy check confirms formats. Level 1 = skills + rules + MCP (above).
- [ ] **House-rules edit screen** — the canonical rulebook editable in
  Settings; re-deploys to every engine on save.
- [ ] **"About the owner" block — ON HIS WORD** (offered 2026-10-15): ten
  lines max, he writes/edits it, rides every engine's context. Not built
  until he says so.
- [ ] **Per-turn context pane** — exactly which files/memory/skills were
  loaded this turn (the visibility guard for the memory problem).

## TRACK B — the face (the six designed screens; mockups are authority)

- [ ] **Today 07** (first screen to land)
- [ ] **Projects 04**
- [ ] **Vault 05**
- [ ] **Code 06**
- [ ] **First-run 08** (folds in engine setup: brain, folder, throttle)
- [ ] **Appearance 09**
- [ ] Carried UI debts: undo card, session insights, prompt-library +
  regenerate wiring, sidebar collapse/resize already remembered (done).

## TRACK C — open defects (judge list; fix as encountered, all before 1.0)

- [ ] free-gate: empty `baseUrl` still passes machine env through
- [ ] cloud/local badge classification in the chat model list
- [ ] stdin EPIPE guard on engine stdin
- [ ] deliberate kill still emits an error card (should be quiet)
- [ ] Windows stop via `taskkill /pid <pid> /T /F`
- [ ] parser scan-offset (chunk-boundary scan)
- [ ] `engine:read` history hydrate-or-drop
- [ ] token streaming (incremental text, not end-of-turn)
- [ ] >1 pending card queue
- [x] ~~settings.permissions → engine flags~~ RESOLVED BY DECISION
  (2026-10-15): the app imposes no rules of its own — owner-favor, documented
  in ARCHITECTURE-ENGINE.md.

## TRACK D — hygiene (continuous)

- [ ] Real-CLI harness (settle `-p/--print` and `initialize` disputes)
- [ ] JUDGE-BRIEF.md refresh: engine spine, throttle, house rules, freedom
  matrix, memory guards (branch must stay judgeable)
- [ ] `/home/user/` doc mirrors re-sync (CLAUDE-SETUP/ARCHITECTURE/FEATURE-AUDIT)
- [ ] RELEASE-WINDOWS.md stays current per installer build

**Standing rules:** ✅ only after a real turn with the real engine on his
machine; every item individually checkable; docs in sync each landing; no
quiet descope — "everything, done correctly."
