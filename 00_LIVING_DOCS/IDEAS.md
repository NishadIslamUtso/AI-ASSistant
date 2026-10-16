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
| **Cross-engine features (his rule #2, amended by his challenge 2026-10-16)** | THE TWO-LAYER RULE. **Layer 1 — engine-native, surfaced:** a feature the chosen engine has built in usually works BEST (it lives inside the engine's own loop — model behavior, context, tools), so when it is drivable through the engine's real flags/modes, we use THEIRS: claude-code's `--permission-mode plan`, agy's parallel fleets and 1M context, Ollama's raw local serving. **Layer 2 — app-built, the promise keeper:** the app keeps every promised feature working even when the engine lacks it — workspace snapshots before risky edits (all three engines), plan-first prompt pattern where no plan flag exists, app-side compaction. NEVER a feature only one engine has with no fallback. What we never do is rebuild, from outside, something the engine already does natively AND we can drive. The store is OURS (own index.json + added index URLs); NOT connected to Claude's or Google's stores, nothing auto-syncs. Each OFFERED item below is tagged native / app-built / hybrid at design time. |
| **Media + the rest, BUILT (his go, 2026-10-16)** | "complete everything on the list": pictures (front door + real wire image blocks, proven), video (app-side frame extraction), voice (dictation via the window's own listener + Listen (TTS) on replies — honest about machines with no mic), plan-first (native flag, Layer 1), checkpoints (app-side, Layer 2), repetition guard. Receipts g46–g50; 475 tests. Dictation needs a real microphone: first true listen happens on the TUF A15. |
| **The rule in HIS words (2026-10-16, confirmed)** | "Claude Code's commands work as they normally take them, only the option now lives in the app UI instead of typed lines. Switch to agy and it works on a different rule: if agy has its own version, THAT gets triggered as it was meant to; if not, the app handles it. Same for features agy has that claude-code doesn't. Options in neither engine: the app forces them." → The app UI must carry the FULL control surface (extended thinking, edit chat, copy chat, …) mapping each option to the chosen engine's command; Plugins/Connectors/Skills panes SHOW what is really in the engine; engines become fully swappable. This is the two-layer rule's UI contract. |
| **Media capability report (his question, 2026-10-16)** | PICTURES: half-built — the pipeline exists (Attachment type, IndexedDB store, vision bridge that describes an image with a seeing brain when the chosen one cannot, per-model vision detection) but the composer has NO attach button, so it is unreachable today. Wiring the front door is a small build; works across the trio (claude-code reads images natively, Gemini is vision-native, Ollama runs llava/gemma3/qwen-vl). VOICE: nothing in the app. Layer-1 candidate: agy's own mic-serve when agy is the engine. Layer-2 candidate: app-side dictation (hold-to-talk → speech-to-text → composer) and read-aloud TTS. Needs design + his go. VIDEO: nothing anywhere — the biggest lift (frames→image pipeline or capture); a design discussion before anything. |
| **Installer 0.8.0 rebuild 4** | Shipped (`0d04c4a`); his TUF A15 run = the acceptance (install → Engine on → brain → folder → throttle → real work → approve via card → artifacts land). |

## TAKEN — already in the app (each discussed/receipted at the time)

| Idea | Taken from | Where it lives |
|---|---|---|
| Session kanban (Continuing / Done, resume-or-forget) | Nimbalyst | Code view board (A.5) |
| Link check — resolve every `[[link]]` by exact vault path, count dead/ambiguous, never silently rewrite | claude-obsidian | Settings › Vault › Check links |
| Rulebook refresh — newer wording replaces only on the owner's press; fix-history lessons in the rules | COG-second-brain | Settings › Vault |
| The working word + the thinking, shown | Claude Code's manner (not code) | Engine card — `5926d5e`, shipped ahead of the discussion; reverts on his word |

## BETTER OR UNIQUE — what the harnesses have that we don't (researched 2026-10-16, ALL OFFERED, ranked)

1. **TAKEN `his go, 2026-10-16` — Checkpoints (file half)** — app-side: the file's old self kept the instant an Allow would change it; Restore on the finished card; proven live. Bash is honestly never snapshotted, and code/conversation-both restore is v2. Still OFFERED: conversation restore.
2. **TAKEN `his go, 2026-10-16` — Plan mode (native, Layer 1)** — the CLI's own `--permission-mode plan` behind "Plan first" as the throttle's 4th gear; proven on the wire (argv log). App-side prompt fallback for engines without a plan mode: still OFFERED.
3. **Recipes / saved work orders** — Goose's underrated feature (Block: "let goose learn from doing"): bake a workflow that worked into a YAML file — prompt, parameters, required extensions, retry logic — shareable and version-controlled, runnable in one press. We have static prompt starters; recipes are parameterized workflows. Fits our packs story (a recipe pack kind) naturally.
4. **Session compaction** — OpenCode (and CC `/compact`): long sessions summarized instead of growing forever. Our engine threads just grow. Best chat-experience candidate.
5. **Repo map** — Aider (tree-sitter): a structural map of the project (files + symbols) fed as context before edits. Feeds Code-in-Projects when a folder is big. (Aider itself is in maintenance mode — take the idea, not the dependency.)
6. **Hooks — rules enforced, not requested** — Claude Code: deterministic shell commands at lifecycle points (after every edit → run the linter; before commit → run tests). Our house rules are advisory prose; hooks are 100%. Bigger build; our house-rules deploy is the natural home.
7. **Subagents with scoped tools + a cheap Explore model** — Claude Code: read-only Explore on Haiku, summaries return to the parent, context stays clean; Goose same. Our parked subagent queue gets its design lesson: scope tools per worker, run research on the cheapest brain.
8. **Architect/worker model split** — Aider's architect/editor and Goose's lead/worker: a strong model plans, a cheap model executes. Cost control without quality loss on the plan.
9. **Watch mode** — Aider: write `// AI: fix this` in any editor; the agent watching the folder picks it up as a work order. Unique bridge between human editing and agent work; ours needs the composer for everything.
10. **Adversary reviewer** — Goose: a second model that watches the worker for unsafe actions and injected instructions. Born from Block's own red-team (a poisoned recipe — "Operation Palefire"). Pairs with Browser-via-MCP later. Their lesson becomes ours: never auto-approve an untrusted recipe/pack.
11. **TAKEN `his go, 2026-10-16` — Repetition inspector** — app-side in the store: three identical steps in a row earn one honest line; different step resets; never spammed.
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
