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
  drivable (that usually beats forcing); app-built features keep every promised
  capability working on EVERY engine; never single-engine with no fallback; the
  engines are fully swappable from the UI.
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
   everything; the memory lives in his vault structure as real markdown
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
6. **The permission cards** — the ONLY approval path. Engine-native approval
   requests surface as cards; app features that act (recipes, watch, memory pass,
   splits) send ordinary turns through the ONE send path so the cards stay awake
   for everything.

## 4 · How to verify

```bash
git clone -b v3 https://github.com/NishadIslamUtso/AI-ASSistant.git
cd AI-ASSistant/apps/03_ai-assistant
npm ci && npx vitest run      # 73 files / 589 tests
npx tsc --noEmit              # clean
npm run build                 # electron-vite build
```

- **Receipts:** `00_LIVING_DOCS/receipts/SCREENS-GALLERY.html` — 74 figures
  (g27–g64), every one captured from a live drive of the shipped build driving a
  real stream-json wire (a scripted stand-in CLI stands in for the real one in the
  sandbox; it is NOT shipped, and no test depends on it — the zero-mocking rule
  covers tests too). The CHANGELOG cites figure ids per feature; spot-check a
  claim against its figure.
- **Installer:** `AI-ASSistant-Setup-0.9.0.exe`, 88,204,306 B, sha256
  `267a753011b0431d749b9b6c7bc26971664efc7bdaa9c8f802b61cbb54c58c07`. Rebuild
  recipe: `00_LIVING_DOCS/RELEASE-WINDOWS.md` (NSIS timestamps make per-build
  hashes differ; judge the recipe, not byte-equality).
- **Live engine turns** need the real CLIs/keys on the judging machine. Without
  them, the evidence base is: the tests, the wire-level parser/chunk tests (a
  44-cut byte-chop regression test demands identical events), the code itself,
  and the receipts.

## 5 · Deliberately open (do not count these as failures)

- **The TUF A15 acceptance run** — on the owner's Windows machine, on the 0.9.0
  exe. It is the one remaining gate, and it is HIS run, not the AI's.
- **The owner will redo the UI/UX himself later** (his words, 2026-10-16); the
  animated-logo question he answered "don't worry about it".
- The browser extension stays a capture-side starter per the owner's locked scope
  (TODO_NEXT §C).

## 6 · What to give back (the verdict format)

Score 0–10 with one paragraph each:

1. **Claim-vs-code truthfulness** — spot-check at least five CHANGELOG claims
   against the actual code and receipts; call out ANY inflation by name.
2. **Test honesty** — do the 589 assert real behavior, or tautologies? Any mocking
   that violates the zero-mocking rule?
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
