# IDEAS.md — The Ideas Ledger (what we take, what we took, what we can't)

*His rule, 2026-10-16: ideas land here after research AND talking. Nothing on this page is built without his explicit yes. Status is one of: TAKEN (with the commit), OFFERED (awaiting his word), CAN'T (with the reason).*

---

## TAKEN — already in the app (historical, each was discussed/receipted at the time)

| Idea | Taken from | Where it lives |
|---|---|---|
| Session kanban (Continuing / Done, resume-or-forget) | Nimbalyst | Code view board (A.5) |
| Link check — resolve every `[[link]]` by exact vault path, count dead/ambiguous, never silently rewrite | claude-obsidian (282-commit repo, mined per the deep-research rule) | Settings › Vault › Check links |
| Rulebook refresh — app's newer CLAUDE.md/AGENTS.md wording replaces only on the owner's press; fix-history lessons in the rules | COG-second-brain | Settings › Vault |
| The working word (random "-ing" while the engine works) | Claude Code's manner, our own 24 words | Engine card — **shipped `5926d5e` AHEAD OF THIS DISCUSSION — say the word and it reverts** |
| The thinking, shown (streamed, folded, never mixed into the answer) | Claude Code's manner | Engine card — **shipped `5926d5e` AHEAD OF THIS DISCUSSION — say the word and it reverts** |

## OFFERED — researched, waiting on his yes (NOT built)

1. **Checkpoints (the strongest candidate)** — from Replit Agent: a full snapshot auto-created before risky moments, especially *before attempting fixes for critical issues*, with one-click "Rollback to here". For us: snapshot the workspace before risky engine writes; the diff card gains a way back. Their DB-doesn't-revert caveat becomes our rule: files roll back, nothing else pretends to.
2. **Session compaction** — from OpenCode: long sessions get summarized instead of growing forever. Our engine threads and chats just grow today.
3. **Repo map** — from Aider: a structural map of the codebase (files, symbols) fed as context before edits. Feeds Code-in-Projects when a project folder is big.
4. **Scheduled tasks** — from Manus: daily/weekly/monthly agent runs. **Contradicts our "opening the app IS the schedule" rule — needs his explicit yes, never a quiet add.** If ever taken: usage printed per run, his worst-review lesson honored.
5. **Wide Research** — from Manus: hundreds of parallel agents merged into one table/report. Parked; maps to a future subagent queue.
6. **Later skill packs** — from anthropics/skills (all Apache-2.0 per folder, license rides inside): theme-factory, mcp-builder, canvas-design. Store candidates, zero code from our side.
7. **Free-token doors** — OpenRouter rotating free models + Groq free tier are OpenAI-compatible and already power the Models pane via keys. Engine routing for them is NOT built — a future door decision.

## CAN'T BE TAKEN — and the honest reason

| Idea / thing | Why not |
|---|---|
| Claude Code's **source** (as code to reuse or bundle) | Proprietary. We take its manners (working words, visible thinking, permission flow), never its code — same reason bundling was rejected. |
| Manus / Replit as **engines** | They are harnesses/platforms, and the app IS the harness. Wiring one in makes our app a launcher for another app's interface. |
| OpenCode / Aider / Pi / Kilo / Goose as **engines** | Same harness logic. As ideas-only sources they stay on the OFFERED list instead. |
| Replit checkpoints as **literal code** | Their snapshots live on Replit's cloud (files, packages, DB state, env — their infra). We take the behavior (snapshot before risky fixes), not the implementation. |
| Manus's **credit system** | Their worst reviews are unpredictable credit burn on looping/failing tasks. Anti-lesson: usage stays printed on every card, numbers never invented. |
| docx / pdf / pptx / xlsx skills (Anthropic) | Source-available license, repack forbidden. Named as excluded; fetchable from Skills. |
| "1,000 free requests/day Google tokens" | Dead 2026-06-18 with the Gemini CLI free tier; Antigravity (`agy`) reality ≈ ~20 req/day community-reported. The paste's route no longer exists. |
| Kilo's cross-surface sync | Needs hosted infra we don't want and he never asked for. |
| Pi as a "minimal core" takeaway | Nothing to take — mods already are our minimal-core story. |

---

*Sources: docs.replit.com (checkpoints), nocode.mba / betterclaw.io / usecarly (Manus 2026), nxcode / kingy.ai / sanj.dev (OpenCode vs Aider 2026), vpsmac / codemyspec / tembo (Antigravity quota), anthropics/skills LICENSE fetches. Full notes: RESEARCH-LANDSCAPE.md.*
