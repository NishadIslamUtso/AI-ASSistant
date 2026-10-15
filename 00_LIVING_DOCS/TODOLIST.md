# AI ASSistant — TODOLIST (light-shell reframe)

**Written 2026-10-15**, after the "I do everything in Claude anyway" conversation.
This is the **active checklist**. `BUILD-TODO.md` keeps its job as the reference
(mockup table, feature sections, community-plan pointer). Where the two disagree
on ORDER, this file wins.

The frame, in the owner's words:

- *"It doesn't need to be a heavy app, or anything that is already available in
  the Claude app."*
- *"I want [the eight screens] so I can just make … an app that connects to
  Claude and gives me exactly that."*

---

## 1 · What the app is (requirements)

- [ ] **R1 — Light shell.** Every screen must be something Claude's app does NOT
  have: Today, Browsing Maps, vault-as-files, artifacts-as-files, permission
  switches. Nothing gets added just because assistants have it.
- [ ] **R2 — Connect, don't compete.** The shell calls a brain: Claude API key
  (Settings → Providers → Anthropic, already shipped), the free cloud providers,
  or Ollama. Chat stays as it is — no new chat-heavy investment.
- [ ] **R3 — Real data only.** Counts and lists read the vault, the chats, the
  artifact files. Nothing invented; console stays clean (CI fails on warnings).
- [ ] **R4 — Mockups stay the design authority** for every screen; fix what is
  wrong in them, as before.
- [ ] **R5 — 4 GB card = first user.** Nothing local-first is allowed to become
  a cloud requirement.

## 2 · Screens (one landing per turn, after your "go")

- [ ] **Today (07)** — next in line; mockup already fetched and read this session.
- [ ] Remaining screens in BUILD-TODO's order (04 Projects, 05 Vault, 06 Code,
  08 first-run, 09 appearance, 10 agent-access polish) — reorder here if you want.
- [ ] **Drop-candidates (yours to strike):** if you decide the Claude app already
  covers a screen for you, tick it here before it gets built — e.g. "Projects if
  Claude Projects suffices". Nothing is built the day before you decide against it.

## 3 · Connect to Claude (the sanctioned "add-on" path)

- [ ] **MCP bridge (proposal — needs your go):** expose vault + artifacts +
  browsing sources as an MCP server so **Claude Desktop and Claude Code can use
  our data directly**. MCP is the standard both Claude apps already speak — this
  is literally the "add-on that connects to Claude" you described, built the way
  Claude supports it.
- [ ] Keep the extension port `127.0.0.1:8765` as the capture endpoint and
  document the loop: extension → vault → Today / Browsing Maps.
- [ ] Keep the Anthropic provider prominent: paste a key → Claude's brain inside
  the shell (works today).

## 4 · The extension (port after the screens, per standing order)

- [ ] Port the capsule-style extension to this app: new-mark icons (already in
  `repo-check/extension/icons/`), manifest → port 8765, capture → vault.
- [ ] End-to-end check: a page captured in the browser shows up as a vault
  source and appears in Today's "Recent sources" / Browsing Maps.
- [ ] Zero-annoyance: silent capture; captures switched off ⇒ main process
  answers 403 (already enforced — never regress it).
- [ ] Install recipe for your machine (load-unpacked steps for Chrome/Edge).

## 5 · Claude Code — can it be used without paying? (answered)

- [x] **With Anthropic's own service: no.** An API key bills per token; Pro/Max
  is a monthly plan (Pro $20 / Max $100 — the paid tier that also unlocks
  Cowork/Dispatch on macOS only anyway). Free accounts get crumbs, not a path.
- [ ] **Free path that works today: Claude Code + your Ollama.** Claude Code
  accepts an Anthropic-compatible base URL, and Ollama serves one:
  `ANTHROPIC_BASE_URL=http://localhost:11434` · `ANTHROPIC_AUTH_TOKEN=ollama` ·
  `claude --model <a coder model your 4 GB card fits>` — documented in practice
  ([guide](https://jonathansblog.co.uk/using-claude-code-with-local-llm-models-the-complete-guide),
  [local-Claude roundups](https://www.shawnmayzes.com/ai-engineering/using-claude-locally-2026/)).
  Quality = the local model's quality; test tool-calling first — that is where
  small models wobble.
- [ ] **Free path #2: third-party free endpoints** through the same base-URL
  override (OpenRouter free models etc. — rate-limited, keys are free; also the
  `qwen3.5:cloud`-class Ollama cloud models are free with limits).
- [ ] Optional — set it up on your machine: say the word and I write the exact
  PowerShell steps (5.1 rules: no `&&`, `.\` for relative executables).
- Note: Claude Code is a **separate tool for code in repos** — it belongs in the
  "don't duplicate" column, not in our app.

## 6 · Take-from-the-Claude-OS list (what's actually reusable)

- [ ] **Skills library + knowledge lifecycle** —
  [brobertsaz/claude-os](https://github.com/brobertsaz/claude-os) (MIT): one-click
  community skills, and the dedup → consolidate → archive → health-report cycle.
  → feeds **COMMUNITY-STORE-PLAN packs** and a future vault "health" view. Code
  usable with its license kept.
- [ ] **Session-insight extraction** (same repo): the mechanism behind
  auto-extracted follow-ups — the honest seed for **Today's "Worth doing next"**
  once real extraction beats raw checkboxes.
- [ ] **Approval card + one-click undo** —
  [open-ClaudeOS](https://github.com/DimeDataCloud/open-ClaudeOS) (Apache-2.0):
  "see what will happen before it happens; undo puts it back". → the model for
  risky actions in Agent access (we already use plain words; this adds the
  confirm-and-reverse loop).
- [ ] **Mods as small plain files** (same repo): widgets/themes/commands are
  files you own, each declaring in plain words what it may read, approved by
  you — exactly our pack manifest + permission wording; keep it as the
  customization backbone ("as much customizable as possible").
- [ ] **"Fast things never touch a model"** (same repo): trivial actions answered
  locally in milliseconds — adopt as a stated performance rule (we already hold
  it; make it written).
- [ ] Reference shelf only: [towardsai's ecosystem catalog](https://pub.towardsai.net/i-built-claude-os-a-system-that-turns-claude-into-an-execution-engine-2193d43603b7)
  (MCP/plugin link list) for future extension ideas;
  [ssochi/ClaudeOS](https://github.com/ssochi/ClaudeOS) = a toy desktop, nothing to take.
- [ ] **Not taking:** claude-os's Mac-first installer (our machine is Windows);
  open-ClaudeOS's C# code (designs only — different stack);
  [the "agentic work OS" itself](https://anthemcreation.com/en/artificial-intelligence/claude-march-2026-computer-use-dispatch-anthropic-updates/)
  (Cowork/Dispatch/Computer Use are macOS-only — nothing to port from them).

## 7 · Not building (the duplication guard)

- [ ] No rich-chat product features (Claude's chat is your chat).
- [ ] No Cowork-style desktop automation, Agent Teams, or Dispatch clones.
- [ ] No voice/wake-word (Jarvis parked). No Vercel. No old-mark anywhere.

## 8 · Standing rules (unchanged)

- [ ] A nav item appears only when its screen works — no placeholders, no dead buttons.
- [ ] Plan → your "go" → one screen per turn → verify (tests, typecheck,
  checkers, **imgdiff parity vs the mockup**) → merge to main → push.
- [ ] Docs stay in sync per landing; handover docs live in `00_LIVING_DOCS/`.
- [ ] Plan first; code only after you say go.

## 9 · Parked, one click of yours

- [ ] The two empty repos (`AI-ASSistant-App`, `AI-ASSistant-workspace`): grant
  the token to them, or delete them — the archives already live as branches.
- [ ] Repository → private? (the archive branches are public until then.)
- [ ] Rebuild the installer (`npm run dist:win`) whenever you want it back.
