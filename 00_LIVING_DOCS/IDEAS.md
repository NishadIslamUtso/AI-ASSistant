# IDEAS.md — The Ideas Ledger (what we take, what we took, what we can't)

*His rule, 2026-10-16: ideas land here after research AND talking. Nothing on this page is built without his explicit yes. Status is one of: TAKEN (with the commit), OFFERED (awaiting his word), CAN'T (with the reason).*

---

## THE DISCUSSION — everything we talked about (2026-10-16)

| Topic | Where it landed |
|---|---|
| **Permanent engine roster** | FIXED TRIO: claude-code (cloud-agentic primary) + Ollama (unlimited local/offline) + agy (free Google fallback, ~20 req/day honest). Harnesses are NOT engines — the app IS the harness. |
| **The paste's quota claim** | CORRECTED: "1,000 free Google requests/day" died 2026-06-18 with the Gemini CLI free tier; agy reality ≈ ~20/day community-reported. |
| **Shipping engines in the installer** | REJECTED bundling (claude-code proprietary → redistribution risk; engines self-update → drift; Ollama ≈ triples 88 MB). Recommendation: Option B — each engine's official installer behind a permission card (exact command → approve → run → re-detect). **HIS 2 ANSWERS STILL OWED: (1) all three engines or claude-code first? (2) first-run, Connectors, or both?** Nothing built until he answers. |
| **"Is the thinking + working words possible?"** | YES — possible and SHIPPED in `5926d5e`, but shipped AHEAD of the discussion (he asked "is it possible", agent built it — acknowledged overreach). Marked for revert on his word; stands unless he says otherwise. |
| **Replit-style checkpoints** | His favourite direction in the research ("before attempting fixes for critical issues" + one-click rollback). OFFERED, not built. |
| **Manus scheduled tasks** | Candidate ONLY with his explicit yes — contradicts "opening the app IS the schedule". Wide Research PARKED (subagent queue). Manus anti-lesson: usage printed on every card, numbers never invented. |
| **Engine downloads, IN the app (his decision #1, 2026-10-16)** | THE TRIO GETS AN IN-APP DOWNLOADER: the app ships with the option to download agy, claude-code and Ollama, into locations UNDER THE APP'S CONTROL, so connecting offline and cloud brains is one place. He does not want the Ollama desktop app — only the functions it gives (headless runtime the app owns). Logins redirect to the terminal or the browser. Home: the Engine page or the Models page — his wish. Design next; his go before build. |
| **Cross-engine features (his rule #2, 2026-10-16)** | THE PRINCIPLE: anything good in one engine's CLI must be usable in the app NO MATTER which engine is chosen — built into the app once, not delegated to one CLI's TUI. The store is OURS (own index.json + added index URLs); it is NOT connected to Claude's or Google's stores and nothing auto-syncs with them. The ranked list below is the roadmap source for this principle. |
| **Installer 0.8.0 rebuild 4** | Shipped (`0d04c4a`); his TUF A15 run = the acceptance (install → Engine on → brain → folder → throttle → real work → approve via card → artifacts land). |

## TAKEN — already in the app (each discussed/receipted at the time)

| Idea | Taken from | Where it lives |
|---|---|---|
| Session kanban (Continuing / Done, resume-or-forget) | Nimbalyst | Code view board (A.5) |
| Link check — resolve every `[[link]]` by exact vault path, count dead/ambiguous, never silently rewrite | claude-obsidian | Settings › Vault › Check links |
| Rulebook refresh — newer wording replaces only on the owner's press; fix-history lessons in the rules | COG-second-brain | Settings › Vault |
| The working word + the thinking, shown | Claude Code's manner (not code) | Engine card — `5926d5e`, shipped ahead of the discussion; reverts on his word |

## BETTER OR UNIQUE — what the harnesses have that we don't (researched 2026-10-16, ALL OFFERED, ranked)

1. **Checkpoints + rewind** — Claude Code AND Replit (two independent confirmations): auto-snapshot before each engine change, one-click "rollback to here", choose to restore code / conversation / both. CC's honest caveat: bash commands are NOT tracked — version control still recommended. Our gap: Stop keeps partial answers, but nothing rolls code back. **Strongest candidate; pairs with our diff cards.**
2. **Plan mode** — Claude Code (also OpenCode plan/build, Aider architect): the engine investigates and writes a PLAN — what it will change, in what order, why — and touches NOTHING until approved. Ours asks permission per tool; we never ask "approve the approach first". The CLI's `--permission-mode` already carries plan — our Agent-access modes could add "Plan first" cheaply.
3. **Recipes / saved work orders** — Goose's underrated feature (Block: "let goose learn from doing"): bake a workflow that worked into a YAML file — prompt, parameters, required extensions, retry logic — shareable and version-controlled, runnable in one press. We have static prompt starters; recipes are parameterized workflows. Fits our packs story (a recipe pack kind) naturally.
4. **Session compaction** — OpenCode (and CC `/compact`): long sessions summarized instead of growing forever. Our engine threads just grow. Best chat-experience candidate.
5. **Repo map** — Aider (tree-sitter): a structural map of the project (files + symbols) fed as context before edits. Feeds Code-in-Projects when a folder is big. (Aider itself is in maintenance mode — take the idea, not the dependency.)
6. **Hooks — rules enforced, not requested** — Claude Code: deterministic shell commands at lifecycle points (after every edit → run the linter; before commit → run tests). Our house rules are advisory prose; hooks are 100%. Bigger build; our house-rules deploy is the natural home.
7. **Subagents with scoped tools + a cheap Explore model** — Claude Code: read-only Explore on Haiku, summaries return to the parent, context stays clean; Goose same. Our parked subagent queue gets its design lesson: scope tools per worker, run research on the cheapest brain.
8. **Architect/worker model split** — Aider's architect/editor and Goose's lead/worker: a strong model plans, a cheap model executes. Cost control without quality loss on the plan.
9. **Watch mode** — Aider: write `// AI: fix this` in any editor; the agent watching the folder picks it up as a work order. Unique bridge between human editing and agent work; ours needs the composer for everything.
10. **Adversary reviewer** — Goose: a second model that watches the worker for unsafe actions and injected instructions. Born from Block's own red-team (a poisoned recipe — "Operation Palefire"). Pairs with Browser-via-MCP later. Their lesson becomes ours: never auto-approve an untrusted recipe/pack.
11. **Repetition inspector** — Goose: guards against runaway loops. We have a 5-minute timeout; a repetition guard is smarter. Small.
12. **Background tasks** — Claude Code: dev servers keep running without blocking the turn; long agents run in background and notify. Medium build, maps to our engine process model.
13. **Auto memory with consolidation** — Claude Code: the engine keeps per-project MEMORY.md + topic files and a between-session "AutoDream" pass prunes/merges them. Our vault is human-curated with a monthly audit; an engine-notes layer would be a careful hybrid. Needs discussion before anything.
14. **Context visibility** — CC `/context` grid + effort levels for cost: see what the context is made of before you send. Small UI candidate.

## CAN'T BE TAKEN — and the honest reason

| Idea / thing | Why not |
|---|---|
| Claude Code's **source** (as code to reuse or bundle) | Proprietary. Manners yes, code never — same reason bundling was rejected. |
| Manus / Replit as **engines** | Harnesses/platforms; the app IS the harness. Wiring one in makes our app a launcher for another app's interface. |
| OpenCode / Aider / Pi / Kilo / Goose as **engines** | Same harness logic. As idea sources they live in the section above instead. |
| Replit checkpoints as **literal code** | Their snapshots live on Replit's cloud (packages, DB state, env). We take the behavior, not the implementation. |
| Manus's **credit system** | Their worst reviews: unpredictable credit burn on looping/failing tasks. Anti-lesson: usage on every card, numbers never invented. |
| docx / pdf / pptx / xlsx skills (Anthropic) | Source-available license, repack forbidden. Named as excluded; fetchable from Skills. |
| "1,000 free requests/day Google tokens" | Dead 2026-06-18; agy ≈ ~20/day. |
| Kilo's cross-surface sync | Needs hosted infra we don't want and he never asked for. (Kilo's parallel-via-git-worktrees idea, though, is queued with subagents above.) |
| Pi as a "minimal core" takeaway | Nothing to take — mods already are our minimal-core story. |
| Goose recipe **auto-approve** | Block's red team proved a poisoned recipe compromises a machine. Recipes, if ever taken, always show what they'll do and ask. |

---

*Sources: docs.replit.com + axonbuild + uxmagic (checkpoints); anthropic.com + ampliflow + dev.to (plan mode, hooks, subagents, checkpoints, auto memory); andrew.ooo + effloow + guard0 + Block CTO interview (recipes, lead/worker, adversary reviewer, repetition inspector, Operation Palefire); toolbrain + pristren + 1devtool + morphllm (watch mode, git-native commits, architect split, maintenance-mode note); nxcode + kingy.ai + sanj.dev (OpenCode compaction, plan/build); vpsmac + codemyspec + tembo (agy quota). Full notes: RESEARCH-LANDSCAPE.md.*
