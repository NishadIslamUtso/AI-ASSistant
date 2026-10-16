# JUDGE BRIEF — read me first (rewritten 2026-10-16 for the owner's external AI judges)

You are judging work done by an AI (Arena.ai Agent Mode) building **AI ASSistant**
for its owner, Nishad (Utso). This document tells you what the owner wanted, what
was built, where the evidence lives, and what is deliberately still open. Judge the
work against the owner's intent — not against items he declined or postponed.

## 1 · The owner's standing words (his rules; they outrank everything)

- **Free, except his own buy-button:** "the priority is to make it and use it for
  free… except the API cost if and only if I ever decide to purchase a
  subscription."
- **The app is the face; real engines do the work:** Claude Code CLI is engine #1,
  Google Antigravity ("agy") is engine #2, headless Ollama carries the free local
  brains. His words: "claude code will run on it normally, it's features will work
  in the app normally too." The app NEVER talks to model APIs itself for engine
  work — the engine's own binary does, on its own wire, in its own folder.
- **The two-layer rule (his, amended):** engine-native features surfaced where
  drivable (that usually beats forcing); app-built features work the same on
  every WIRED engine; never single-engine with no fallback; the engines are
  swappable from the UI. Wired today: claude-code (its stream-json wire) and
  agy (its own wire, verified against the real v1.4.0 binary — 2026-10-17, the
  plan's 6.3 gate passed: non-interactive stream-json confirmed and the
  adapter built on what was observed). Headless Ollama serves the free local
  brains to claude-code; the app can start/stop a staged Ollama it owns.
- **Zero mocking:** nothing in front of the owner that does not work — no
  placeholder screens, no invented data, no fake replies. A missing thing says so
  in plain words.
- **The mockups are the design authority;** AI-slop patterns are banned by name
  (15 + similar), his 189-gerund word list governs copy.
- **Plan first, code only after his explicit "go"** — every batch on this branch
  had one (GOs 1–9 on 2026-10-16, his literal "next" / "do as much as possible" /
  "can't you just do all of them in one go").
- **One landing = one commit;** tests + typecheck + build green, porcelain empty,
  push once, ls-remote confirms. Docs in sync at every landing.
- ENGLISH ONLY in the product.

## 2 · What the branch is

- **`v3` is the live branch. `main` is a frozen archive** — it moves only when the
  owner himself orders a merge. Judge the v3 tip (`a76f507` at this brief's
  writing; check `git log` for later).
- The 2026-10-16 chain, one batch per commit: downloader `c29f803` → battles
  `cc3c535` → recipes `48e4170` → compaction `b555d88` → repo map + hooks
  `7a2800d` → split `ad086db` → watch mode `e648dc0` + adversary reviewer
  `1fb7def` → the finale five `5ab8ac8` → auto memory `20b3e72` → the audit build
  `a76f507`.

## 3 · What is claimed (every line checkable in code)

The app: Electron + React + TypeScript + Tailwind 4, at `apps/03_ai-assistant/`.

1. **The engine spine** — `src/main/engine/`: availability, claudeCode (real
   stream-json wire), socket (agy), stream (shared parser), deploy, downloads,
   checkpoints, packs, pull, skillCatalogInstall, storeIndex, exportPack,
   vaultSkills, houseRulesDeploy. The composer's brain pickers read FROM the
   engines' own doors.
2. **Composer superpowers** — Split (engine writes steps, app runs them in order),
   Battles (blind A/B between two brains, local ledger, no Elo), Recipes
   (frontmatter-checked markdown work orders), Compaction (handoff brief + fresh
   session), repo map (bounded honest tree), pictures on the real wire as base64
   blocks, video decoded to frames, dictation + Listen (the window's own speech),
   Plan-first (the CLI's own `--permission-mode plan`).
3. **Turn tools** — Copy/Edit on the finished card, extended thinking (the
   engine's own documented env knob, set at launch), honest context totals ("N
   turns this window · X in · Y out · $Z" — accumulated from the engines' real
   usage lines, never pretending to read the engine's head), the work line (busy
   sends park and drain in order), checkpoints (the file's old self kept before an
   approved Write/Edit; one-press restore), the repetition guard, the adversary
   reviewer (REPORT-ONLY self-check), watch mode (folder quiet-debounce, gap,
   anti-tail-chase), the turn journal ("Earlier sessions on this machine").
4. **Auto memory (the owner's design, his three answers)** — auto-keep but show
   everything; the memory lives as real markdown (`06 Review/Memory/`) inside
   the engine's own working folder (his vault, unless he points the workspace
   elsewhere — the pane and the engine always read the same root)
   (`06 Review/Memory/engine-notes.md`); the ENGINE writes it through its own
   tools, so every line rides the app's permission cards. The rulebook section
   "What you keep" (`src/shared/lib/houseRules.ts`) deploys into each engine's own
   rules file so the engine can note things during NORMAL work; the Settings ›
   Memory pane shows the pass order before sending, lists what exists, and
   removes exactly one file after confirm. Path guard: `src/shared/lib/memory.ts`
   + `src/main/memoryFiles.ts` (memory folder only, no `..`, no hidden parts,
   markdown only).
5. **Store / mods** — pack folder + manifest, permissions in plain words before
   install, sha-256-pinned indexes, tamper refusal, export-as-pack, starter pack,
   four furnished packs; agents/connectors refused in plain words until their
   runtimes exist.
6. **The permission cards** — the approval path in the app's default throttle
   ("Ask me", the engine's own `manual` mode). The throttle also offers the
   engine's OWN faster gears (Plan first, Auto-edits, Full speed), labelled as
   what they are; in those, the engine acts without per-write cards by its own
   design. App features that act (recipes, watch, memory pass, splits) send
   ordinary turns through the ONE send path so the cards stay awake for
   everything in the default gear.

## 4 · How to verify

```bash
git clone -b v3 https://github.com/NishadIslamUtso/AI-ASSistant.git
cd AI-ASSistant/apps/03_ai-assistant
npm ci && npx vitest run      # 77 files / 621 tests (as of 2026-10-17, evening)
npx tsc --noEmit              # clean
npm run build                 # electron-vite build
```

- **Receipts:** `00_LIVING_DOCS/receipts/SCREENS-GALLERY.html` + `shots/` —
  live-drive figures g27–g73 captured from the running shipped build driving an
  engine-shaped wire. THE HONEST CAVEAT, stated here AND in the brief's claim
  list: in this sandbox the engine behind those drives was a scripted stand-in
  CLI (not shipped; no test depends on it). The receipts prove the app's half
  of every wire — cards, lines, journals, memory — not a real brain's answers.
  Since 2026-10-17 the sandbox ALSO holds the real CLIs: agy v1.4.0 ran through
  the app for real (g67), and an independent judge drove the real claude
  v2.1.300 binary through the app's exact launch line (control_request →
  control_response → a real file write; both permission flags proven
  load-bearing). The CHANGELOG cites figure ids per feature; spot-check a claim
  against its figure.
- **Installer:** `AI-ASSistant-Setup-0.9.0.exe`, 88,204,306 B, sha256
  `267a753011b0431d749b9b6c7bc26971664efc7bdaa9c8f802b61cbb54c58c07`. Rebuild
  recipe: `00_LIVING_DOCS/RELEASE-WINDOWS.md` (NSIS timestamps make per-build
  hashes differ; judge the recipe, not byte-equality).
- **Live engine turns** need the real CLIs/keys on the judging machine. Without
  them, the evidence base is: the tests, the wire-level parser/chunk tests (a
  byte-chop regression test chops the wire at a step of 37 and demands identical events), the code itself,
  and the receipts.

- **The OddBrain Motion Kit 3.0.1 (his concept, applied 2026-10-17).** 77 scene
  SVGs ship byte-exact (`scripts/extract-motion-kit.py` re-extracts from the kit
  gallery's own JSON); test-pinned: all 76 scenes reachable through real app
  states, all 304 status words paired with the animations the kit measured them
  for, the kit's loader on the permission card, the two one-shots saved for
  done. Calm slows 1.6×, Still and the OS reduced-motion preference stop
  everything; at most six scenes animate at once; off-screen pauses. g69–g71.
- **The app is OddBrain (his rename, 2026-10-17 evening).** Title bar,
  installer (`OddBrain-Setup-0.9.0.exe` next build), appId, every user-facing
  sentence; a test asserts NO source file claims the old name. CAVEAT: the
  acceptance exe below was cut BEFORE the rename — same features, older label.
- **Taken from the claudereverse study as clean code (patterns, never
  Anthropic bytes):** real shell PATH resolution (PowerShell registry truth /
  login shell, merged app-first, cached; every engine spawn uses it), the
  quick-ask window on Ctrl+Shift+O riding the ONE send path (g72), Ctrl+F
  find via the CSS Custom Highlight API with zero DOM mutation (g73),
  artifact pop-out + printToPDF into the vault, Electron fuses.

## 5 · Deliberately open (do not count these as failures)

- **The TUF A15 acceptance run** — on the owner's Windows machine. It is the
  one remaining gate, and it is HIS run, not the AI's.
- **agy sign-in** — a Google account flow that happens in HIS terminal/browser
  by his own rule; until he signs in, agy turns end with the exact next step
  (g67 shows that sentence live).
- **The owner will redo the UI/UX himself later** (his words, 2026-10-16); the
  animated-logo question he answered "don't worry about it".
- The browser extension stays a capture-side starter per the owner's locked scope
  (TODO_NEXT §C).

## 6 · What to give back (the verdict format)

Score 0–10 with one paragraph each:

1. **Claim-vs-code truthfulness** — spot-check at least five CHANGELOG claims
   against the actual code and receipts; call out ANY inflation by name.
2. **Test honesty** — do the tests assert real behavior, or tautologies? The
   suite's own policy: no mocking LIBRARY anywhere; process boundaries use
   injected fakes (the documented spawn seam), the rest is real filesystem and
   real HTTP. Judge the doubles by that standard.
3. **Architecture** — does the two-layer rule hold in the code (no engine
   lock-in; app features engine-agnostic; one send path)?
4. **Security & privacy** — permission cards as the only approval path; the
   memory path guard; local-only claims; keys sealed to the machine.
5. **Code quality & docs** — structure, naming, the plain-words rule; do the
   living docs match reality?
6. **The receipts** — do the cited figures support the specific claims they are
   cited for?

Then: a findings list (SEVERE / MODERATE / MINOR, each with file:line or a
quote), every claim you could NOT verify said out loud, and a final verdict: does
the work match what it claims — yes or no — and what would change your mind.

**English only. Be harsh; finding nothing is suspicious. Do not grade effort —
grade truth.**
