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

- [ ] **His run on the TUF A15** with the v0.4.0 installer (built below):
- [ ] **His run on the TUF A15:** install → Engine on → pick a brain in the
  bay (cloud badge = leaves machine; local = offline) → pick a folder →
  set the throttle → give real work → approve via the card → see artifacts
  land. This is the ✅ the judges demanded (6.2/6.5 tick on 👍).
- [ ] On any defect: same-day fix, rebuild, he retries.

## TRACK A — the spine (engine parity — HIS #1 RULING: LANDED 2026-10-15, five landings, 343 tests)

- [x] **Per-engine model routing** (landing 2): `engine:models` asks the
  CHOSEN engine's own source; agy's answer is honest in both states.
- [x] **Pull-models + delete in the bay** (landing 3): real progress bar,
  names validated, claude-code only (no fake downloads for cloud engines).
- [x] **agy Windows check is now self-serve** (landing 2): `engine:detect`
  runs each engine's `--version` on HIS machine; the bay shows "not
  installed" with the fix (scam repos named) or lights agy up by itself.
  REMAINING: the agy ADAPTER (`main/engine/agy.ts`) once agy exists on his
  machine — the check tells us which input mode it offers.
- [x] **Session resume across app restarts** (landing 1): session id per
  workspace persisted; fresh launches continue the old conversation via
  `--resume`; a living engine is never resumed from file (tested).
- [x] **Skills: one vault → every engine** (landing 4): doors + exact-format
  deploys (CC `SKILL.md` frontmatter; agy filename-as-slash-command); his 11
  CC skills import cleanly (scanner tested). REMAINING: the Skills pane UI
  (nav item lands with its screen, per the standing rule).
- [x] **MCP: one list → every engine** (landing 4): `.mcp.json` +
  `.agents/mcp_config.json` written from one canonical list; remote-field
  translation confirmed at the agy check.
- [x] **File diffs on approval cards** (landing 1): before/after preview,
  clipped to a decision size.
- [x] **Usage display** (landing 1): tokens/time/cost from the engine's own
  result sentence, on the work card.
- [ ] **Plugin packs (level 2)** — still honestly blocked on agy's formats.
- [ ] **Per-hunk accept/reject on approval cards** (from the landscape study:
  Nimbalyst/Claudette) — upgrade the before/after card to accept part of an
  edit; lands with Code 06.
- [ ] **Needs-you notification** (Claudette): tray/title pulse when a
  permission card waits — after the card-queue defect fix.
- [ ] **Session board** (Nimbalyst): the resumable sessions get a kanban in
  Projects 04 / Code 06, with session-to-file links feeding the context pane.
- [ ] **Extension → engine, via SKILLS not MCP** (upgraded after studying
  capsule-hub-skills 2026-10-16): ship vault skills (save/search/read) that
  teach Claude Code/agy to call the LOCAL vault HTTP API — their paid cloud
  flow, ours local and free, and no tool schemas riding every turn (their
  own design note, verified). Captured/annotated pages become queryable by
  the engine, not just saved.
- [ ] **Accessibility-tree capture** (Prophet): the better capture default if
  we go beyond text, replacing screenshots.
- [x] **House-rules edit screen** (landing 5): Settings → House rules — five
  fields, save-and-deliver; every send deploys the rules + brain footnote to
  each engine's own global file as a marker-bounded block (his words in
  those files are never touched — tested).
- [ ] **"About the owner" block — ON HIS WORD** (offered 2026-10-15): ten
  lines max, he writes/edits it, rides every engine's context. Not built
  until he says so.
- [ ] **Per-turn context pane** — tool/file activity is already on the card;
  the full pane (exactly which memory/skills loaded) lands with Code 06.

## TRACK B — the face (the six designed screens; mockups are authority)

- [x] **Today 07** — LANDED: the landing screen counts real records only
  (chats, artifacts, the vault's reading record), worth-doing-next comes
  from those records and never invents a task, honest empty/missing states,
  third nav section (the muted "being built" line shrank accordingly).
- [x] **Projects 04** — LANDED v0.5.0
- [x] **Vault 05** — LANDED v0.5.0
- [x] **Code 06** — LANDED v0.5.0 (workspace, throttle quick-set, real resumable threads)
- [x] **First-run 08** — LANDED v0.5.0 (name, brain from the engine's door, vault folder; all skippable)
- [x] **Appearance 09** — verified built (tokens, sidebar/rail remembered)
- [ ] Carried UI debts: undo card, session insights, prompt-library +
  regenerate wiring, sidebar collapse/resize already remembered (done).

## TRACK C — open defects (judge list) — **COMPLETE 2026-10-16: all nine resolved, each pinned by test (v0.5.1)**

- [x] free-gate: empty `baseUrl` still passes machine env through — FIXED: `sanitizeEnvironment` strips ANTHROPIC_* from the inherited env on every launch; the chosen brain is applied on top, none borrowed
- [x] cloud/local badge classification — FIXED: one function (`isCloudModelName`) classifies for every list; the composer's trigger badges the chosen brain too, and the list speaks the one canonical word ("cloud")
- [x] stdin EPIPE guard — FIXED: guarded `writeLine` + stdin error swallow; a dead pipe is "not delivered", never a crash
- [x] deliberate kill is quiet — FIXED: `deliberate` flag; a stop's close carries no error card, a real crash still says why
- [x] Windows stop = `taskkill /pid <pid> /T /F` — FIXED: tree-kill through the shell's pid (pinned by test); plain signal elsewhere
- [x] parser scan-offset — FIXED: `scanned` offset; a chunk-chopped line is rescanned only in its new tail (linear, pinned at every split point)
- [x] `engine:read` history hydrate-or-drop — FIXED: a window opened mid-turn replays the remembered events; replayed-as-live then reconciled (a dead engine's leftover question is dropped, a cut-off run closes as "engine stopped", empty history shows nothing)
- [x] token streaming — FIXED: `--include-partial-messages`; `stream_event` text deltas become `delta` events, the renderer grows one line instead of stacking words, the finished message is shown once, and deltas never crowd the remembered history
- [x] >1 pending card queue — FIXED: `permissions` queue in arrival order; the first is answered first, the rest counted ("+N more waiting"); nothing lost under the card being looked at
- [x] ~~settings.permissions → engine flags~~ RESOLVED BY DECISION
  (2026-10-15): the app imposes no rules of its own — owner-favor, documented
  in ARCHITECTURE-ENGINE.md.

## TRACK D — hygiene (continuous)

- [ ] **Landscape sweep — STANDING DUTY (his correction, 2026-10-16):** every
  working session includes a proactive scan of the four spaces (CC GUIs,
  capture extensions, skills indexes, Ollama tools); anything genuinely new
  goes into RESEARCH-LANDSCAPE.md with the five-question rubric. He found
  two repos before I found any — that never happens again.
- [x] **Caveman-style token hint** — LANDED: `isSmallLocalBrain` (size tags ≤14b, phi/tiny families) adds a two-sentence bare-facts hint to the quirk table, riding the deployed rules. Researched: the caveman skill claims 65% output cuts but its own rule block costs ~1,160 input tokens — ours is two sentences, only for the brains that need it.
- [x] **Handoff button** — LANDED: a finished turn becomes one vault document (`handoffs/<date>-<task>.md`) shaped after the three handoff repos studied 2026-10-16 — instructions to the receiving assistant, the task, the real tool calls as evidence, the resumable session id — also copied to the clipboard. Built from the turn in memory; nothing parsed post-hoc, nothing invented.
- [x] **Obsidian export** — LANDED as Vault > "Export copy": a timestamped snapshot of every markdown file, structure intact, into the app's exports folder. Researched the export tools first — they all produce a folder of markdown, which the vault already is, so nothing is converted.
- [x] **Skills sourcing** — LANDED: Settings > Skills lists a curated catalog (verified live against anthropics/skills' real folder list: docx/pptx/xlsx/pdf, mcp-builder, skill-creator, webapp-testing, frontend-design, web-artifacts-builder, doc-coauthoring, internal-comms); one click fetches the raw SKILL.md (catalog names only — the door fetches nothing else) and deploys to both engines through Track A's deploy. The Skills pane UI debt is hereby settled by this section.

- [ ] Real-CLI harness (settle `-p/--print` and `initialize` disputes) — honestly blocked: no claude binary in the build sandbox; runs on his TUF A15 (the detect door self-serves).
- [ ] JUDGE-BRIEF.md refresh: engine spine, throttle, house rules, freedom
  matrix, memory guards (branch must stay judgeable)
- [ ] `/home/user/` doc mirrors re-sync (CLAUDE-SETUP/ARCHITECTURE/FEATURE-AUDIT)
- [ ] RELEASE-WINDOWS.md stays current per installer build

**Standing rules:** ✅ only after a real turn with the real engine on his
machine; every item individually checkable; docs in sync each landing; no
quiet descope — "everything, done correctly."
