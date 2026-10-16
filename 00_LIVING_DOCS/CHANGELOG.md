# CHANGELOG.md — What Changed Each Session (Living)

## Unreleased (v3)

- **Second-brain structure, research pass shipped** (his correction accepted — the convo's sources were mine to read, not summarize): fetched the actual repos in his discussion. **claude-obsidian** (282 commits, v2.2.0) contributed the **link check** — `Check links` in Settings > Vault walks every `[[link]]` in every note, resolves by exact vault-relative path (the discipline its own scaffold pins Obsidian to, because shortest-path links "become genuinely wrong the moment two files share a basename"), and reports dead links and ambiguous bare names counted and named — never silently rewritten (templates exempt: placeholder links are not claims). **COG-second-brain** contributed the **rulebook refresh** — inspect now reports when the app's wording of `CLAUDE.md`/`AGENTS.md`/`index.md` is newer than the vault's, and Replace happens only on the owner's press (framework/content separation: rulebooks follow the app, notes stay the owner's) — plus its own fix-history lessons written into the rules ("a behavioral trigger cannot live in a lazily loaded file" → always-apply rules live at the root; short rules only). The rulebooks gained: link **by path** not bare name, start from `00 System/Templates/Person.md` / `Knowledge Note.md` (both now generated for app-shaped vaults, style-matched to Entity.md), append under `## Evolution [date]` instead of silent rewrites, treat status as an audited lifecycle, and the **`#manual` owner-lockout**. The leaked-prompt mythology from the same convo is filed as REJECTED with the real event named (npm package briefly shipped unminified TS — readable, not "hacked"; prompts are runtime text, not weights). Live-verified: link check counted the real vault (28 links / 54 notes / 15 dead — real ones, in the seeded entity stubs, for the engine to fix), refresh flow replaced both rulebooks on press with templates landing as the missing files, and a live bug was caught and fixed by the evidence (refresh looked up new wording in the writes plan — which only holds missing files — so it replaced nothing; now it reads the library). 9 new tests; 424 total.
- **Second-brain structure shipped** (his 2026-10-16 order, from the Obsidian/LLM-wiki discussion): the architecture is now IN the app as a choice — Settings > Vault > "Second-brain structure" > Set up structure… asks **generate a new structure here, or use a folder that already has its own**. The default is this discussion's structure adapted to the app's own taxonomy: `05 Knowledge` (the engine's synthesized, always-source-linked layer), `10 People`, `index.md` (the maintained map), and `CLAUDE.md` + `AGENTS.md` rulebooks at the vault root that the engines read by themselves. The rules carry the wall (02 Sources is write-once, never edited), the privacy list as absolute, link honesty (never link a file that does not exist), the Contradiction section instead of silent overwrites, and freedom to grow the structure as the user's situation changes — recorded in index.md, core folders never renamed. Adoption **adds, never overwrites**: the folder is classified first (app vault / Obsidian / raw-wiki / empty / other), the plan names exactly what would be added, existing files are skipped (`wx` writes), re-apply is a no-op. Kind-aware rules: a raw/wiki vault is governed in its own names. 6 new tests; 418 total. Live-verified: generated into the real vault (existing 05 Knowledge/README left untouched — "Added 4 files… Nothing existing was touched"), and the adopt flow drove the real door against a foreign raw/wiki folder (classified, 5 added, own files untouched, second apply added nothing, bad path refused).
- **A.6 — the engine queries the browser, honestly** (his locked queue): the engines get one built-in skill of our own — `browser-page`, deployed to both engines' skill folders on every launch (only where an engine already lives; never invented). It teaches the local capture port's read side: `GET /onui` answers with the page the user last had captured — url, title, `captured_at` (Asia/Dhaka), the extracted text capped at 12,000 characters (`content_truncated` when cut) — and a **visit-only** line is answered as exactly that: metadata plus "nothing about reading it is claimed", never pretended content. Newest activity line wins; a damaged line is reported, not repaired; nothing captured means "ask the user normally". The same port gained read-only `/grep` (whole-vault search); the extension-port route table test locks the whole surface. Settings > System says what the engine can now do in one sentence. Live-verified: fresh state answers "No browser capture yet", a real capture through the door answers with the real page, a later visit flips it to visit-only, the Origin rule refuses headerless callers. 9 new tests; 412 total. (Engine CLIs do not exist in the build sandbox — the deployed skill file is on disk and its exact command was proven against the running app; first real engine run happens on the TUF A15.)

- **A.5 — session board shipped** (his locked queue; Nimbalyst's idea, our honesty): Code 06's flat thread list became a two-column kanban — **Continuing** (the engine's real resumable threads per folder, live from the engine door) and **Done** (the owner ends a thread; the resume id is genuinely forgotten and the card stays as history that cannot come back). Per-thread file links are the owner's own notes: Link files → multi-select → paths ride the card; click copies a path for the composer. Board file is plain JSON (`sessions-board.json`) through its own doors, rebuilt strictly — garbage in, empty board out. Projects 04 shows a real `N threads` chip per project folder (counted live, one click jumps to the board, setting the engine's workspace first). 7 tests; 403 total.

- **Mods, Phase 1 shipped** (his locked queue A.9): Settings > Extensions — a mod is a folder with a `manifest.json`; Install-from-folder validates the manifest (unknown fields/permissions refused outright, never installed with a warning), reads every contribution from inside the folder, copies the pack to a readable place (`<userData>/extensions/<id>/`), deploys skills to both engines' own folders, hands prompts to the prompt library, and applies a theme through the Appearance door. Every pack shows `unverified` + its real path + "What it may do" in plain words; Remove undoes exactly the files the install record names (records pointing outside the skill folders are ignored). 8 new tests; 396 total. Landed with live-drive evidence (real GTK folder pick, install shot, disk checks).
- **Batch B — browser control:** Settings > Skills > "Browser control" switch writes the chosen MCP server (chrome-devtools / playwright) into both engines' configs through the existing `mcp:read`/`mcp:write` doors; foreign servers preserved; verified live on/off. Permission-card details that are diffs now render red/green (diff-AWARE cards; the engine's door allows/denies a whole edit).
- **Batch A — needs-you pulse + extension 0.1.3:** title-bar amber "Needs you · N" chip pulses only while a permission card waits, click opens the engine; extension capsule-inject tracks the last focused field (capture-phase focusin), honest "No active text field found" instead of a wrong guess, and the 0.1.2 literal-`\n` syntax error that killed the content script is repaired (node --check clean on all four files).
- **Installer 0.6.0 built** (2026-10-16, his go): `AI-ASSistant-Setup-0.6.0.exe`, 88,062,356 B, SHA-256 `c0c9c0861873b7b2db69c0d5d924563aa04b9cd53b015c44a8c4a640835ea38c` (rebuilt after the first copy was lost to the workspace size cap) — one-click, runs after finish, per-user. The full recipe now lives in RELEASE-WINDOWS.md so it can never be lost again.


## 0.7.0 — his corrections, applied: the sidebar belongs to the chats, the engine is the only way

- **Sidebar rebuilt:** the EngineBay is OUT (it lived above the chat list and squeezed it out — his exact complaint). Sections + conversations now share ONE scroll, the list is always reachable. Compact rows (28px), chat rows 30px, default width 260px as the approved mockup. Collapse now means CHATS ONLY — every other option hides.
- **The engine is the only way to talk:** the Engine toggle is deleted — it was never supposed to be a mode. Every send goes to the engine; the app adds nothing of its own.
- **The composer's two small chips (his spec):** the ENGINE chip opens a box with the engines this machine really has (checked live) and the engine's own three modes (Ask me / Auto-edits / Full speed); the MODELS chip beside it lists what THAT engine can really use, from the engine's own door, cloud brains labelled, searchable when long (pattern adopted from nexu-io's model search and backchat's shared picker).
- **Marketplace** (the approved "Get apps and extensions" screen): engines with honest install lines, the Chrome extension's real door status, and the skill catalog with working installs — one screen.
- Engine bay lives in Settings > Engine. 388 tests.

- **Installer 0.6.0 built** (2026-10-16, his go): `AI-ASSistant-Setup-0.6.0.exe`, 88,062,356 B, SHA-256 `c0c9c0861873b7b2db69c0d5d924563aa04b9cd53b015c44a8c4a640835ea38c` (rebuilt after the first copy was lost to the workspace size cap) — one-click, runs after finish, per-user. The full recipe now lives in RELEASE-WINDOWS.md so it can never be lost again.


## 0.6.0 — Track D: the practice — research first, then each feature

- **Handoff:** a finished engine turn becomes one vault document (`handoffs/…`) shaped after three studied repos — instructions to the receiving assistant, the task, the real tool calls, the resumable session id — also copied to the clipboard.
- **Skills catalog:** Settings > Skills, curated from anthropics/skills (verified live); one click installs into both engines' own folders through the existing deploy. The deferred Skills pane is settled by this section.
- **Vault export copy:** a timestamped, portable snapshot of every markdown file — Obsidian takes it as it is.
- **Caveman hint:** small local brains (≤14b tags, phi/tiny) get a two-sentence bare-facts rule riding the deployed house rules — the token-cut idea without the original's ~1,160-token bloat.
- Research sweeps #3 recorded; JUDGE-BRIEF refreshed; doc mirrors re-synced. 387 tests.


## 0.5.1 — Track C: every open defect closed, each pinned by test

- **Free gate held honest:** machine Anthropic credentials are stripped from the engine's environment on every launch; the chosen brain or nothing, never a silent machine account.
- **Quiet deliberate stop:** pressing Stop no longer produces an error card; real crashes still say why.
- **Windows stop:** `taskkill /pid <pid> /T /F` through the shell's pid — the whole engine tree dies, not just the shell.
- **Dead pipes:** a send into a closing engine is "not delivered", never a crash.
- **Parser scan-offset:** chunk-chopped lines rescan only their new tail (linear at chunk boundaries).
- **Card queue:** permission questions queue in arrival order — the first answered first, "+N more waiting" counted, nothing lost.
- **Hydrate-or-drop:** a window opened mid-turn replays the remembered events; a dead engine's leftover question is dropped, a cut-off run closes honestly.
- **Token streaming:** the engine's words arrive as they form (`--include-partial-messages`), grow one line in place, and are never printed twice.
- **One badge:** `isCloudModelName` classifies for every list; the composer trigger badges the chosen brain. 375 tests.


## 0.5.0 — Track B: the whole designed surface, real

- **Projects (04):** the engine can live inside a project — instruction it always wears, a folder it truly works in, per-project conversations, "Work here" (real workspace door), all validated and damage-tolerant.
- **Vault (05):** the folder on screen — real file tree grouped by folder, name filter, content search naming file and line, capped preview, add-to-composer as quoted named context, Open folder door.
- **Code (06):** the engine's workspace wearing its face — folder (choose / back to the vault / open), throttle quick-set, and the real resumable threads per folder with forget.
- **First run (08):** the welcome — three real skippable choices (name, brain from the engine's own door, vault folder via the real picker), remembered once.
- **Appearance (09):** verified as built — accent/width tokens, sidebar and rail remembered.
- Nav complete: six sections, every one a working screen. 361 tests.


**Last Updated:** 2026-10-14 (late evening) Asia/Dhaka
**Rule:** Log every change with date, what, why. This is memory for next AI.

## 2026-10-14 (evening) — the Windows installer

Until now, "install it" meant `npm install && npm run dev` on a machine with Node, a terminal and a tolerance
for terminals. The app now ships as **one file a person can double-click**: `AI-ASSistant-Setup-0.1.1.exe`.

### What it is
- **NSIS, assisted** (not one-click): the install folder can be changed, desktop + Start-menu shortcuts are
  created, and it is **per-user**, so Windows never asks to elevate.
- **`deleteAppDataOnUninstall: false`** — uninstalling the app leaves the vault, the settings and the sealed
  keys alone. Memory that disappears with an app is not memory.
- **Unsigned.** There is no certificate, so Windows shows SmartScreen's *"unknown publisher"* box. The release
  notes (`apps/03_ai-assistant/RELEASE-WINDOWS.md`) say so *before* it appears, explain what it does and does
  not mean, and say the one thing that is true: an unsigned installer is indistinguishable from a malicious one
  by Windows alone — so only run the one you built or downloaded from a source you trust.
- The whole packaging config is `electron-builder.yml` at the app root, commented; `npm run dist:win`,
  `dist:win:dir` and `dist:linux` are the scripts.
- **CORRECTED 2026-10-15 (judge finding):** this entry described an older arrangement that no longer
  exists — `build/icon.png` is not tracked (that folder is excluded from snapshots), `shot-tools/render-mark.cjs`
  was never committed, and the `.gitignore` negation is gone. The icon's real home is `resources/`
  (`icon.svg/png/ico`), which `electron-builder.yml` points at. Original (superseded) wording: the icon is the
  app's **own BrainMark**, rendered from `BrainMark.tsx` by `shot-tools/render-mark.cjs` into
  `build/icon.png` (512×512). No new mark was drawn, and `.gitignore` got a precise negation so the icon is
  source while the rest of `build/` stays ignored.

### Size, honestly
First build: **95,963,305 bytes**. Shipped build: **87,748,105 bytes**, from two decisions that are argued in
the release notes — `electronLanguages: [en-US]` (54 unused Chromium locale files = 46 MB unpacked, for text
nobody would see) and `compression: maximum` (slower to build, smaller to download). Verified by listing the
installer's payload, not by trusting the number: `AI ASSistant.exe`, `resources/app.asar` (31.9 MB),
`Uninstall AI ASSistant.exe`, `elevate.exe`, `en-US.pak` only — 21 entries.

### Verified before offering it
- The payload was extracted from the installer's own `$PLUGINSDIR/app-64.7z` and listed (75 files before the
  locale trim, 21 entries after; `app.asar` present both times).
- **The same configuration packaged for Linux boots clean**:
  `SMOKE OK title="AI ASSistant" size=1280x820 errors=0 warnings=0` — proof that the packaged asar is complete
  and the app starts from a package, not only from source.
- The full suite and both builds ran first: 27 files / 255 tests, typecheck clean, desktop + web builds clean.

### What is **not** verified — and one dead end worth writing down
An actual install **on Windows**. There is no Windows machine here. A Wine silent install was attempted and is
**not** evidence: unpacking the payload under Wine outruns any sane timeout, so the empty folder it left said
nothing either way. (Wine itself is only needed because NSIS runs on Linux *builders*; on Windows
`npm run dist:win` needs nothing. On Linux it needs 32-bit Wine too, with `WINEPREFIX` outside the repo.)
The install on a real Windows machine is the owner's own test, and it is Priority 1.

### Files
| File | What |
|---|---|
| `apps/03_ai-assistant/electron-builder.yml` | the whole packaging config, commented (NSIS, per-user, icon, locales, compression) |
| `apps/03_ai-assistant/build/icon.png` | the app icon — the BrainMark, 512×512 |
| `apps/03_ai-assistant/package.json` / `package-lock.json` | electron-builder 26.15.3 as a devDependency; `dist:win`, `dist:win:dir`, `dist:linux` |
| `apps/03_ai-assistant/RELEASE-WINDOWS.md` | release notes: the SmartScreen text in advance, what installs where, first run, the reproducible build recipe, known gaps |
| `.gitignore` | `build/` stays ignored except the app icon |

### Landing
This commit on `arena/3c06e1bf-ai-assistant-v3`, merged into `main`.

## 2026-10-14 (after midnight) — purge: nothing of the previous mark remains

The owner's order: "the new one is very different than the previous one, don't you dare keep the old one
anywhere." Swept the whole workspace for logo-class files and dealt with every one:

- **Deleted:** `icon-check-256.png` (the old outline-only ghost render, viewed before deletion),
  `screenshots/95-icon-sizes.png` (my interim tiled sheet), and every logo scratch file under `/var/tmp`.
- **Rebuilt:** the browser extension's `icon16/48/128.png` were 68-byte empty stubs — now rendered from
  `resources/icon.svg`.
- **Rebuilt:** the stale `dist-web/` web bundle still carried the old cropped favicon; `npm run build:web`
  regenerates it from the current `favicon.svg`.
- **Verified equal to the owner's file, not assumed:** `resources/icon.svg` and `favicon.svg` are byte-equal
  to his export (`cmp`); `BrainMark.tsx` and the reference app's `BrainMark.jsx` match it path-for-path
  (32/32 `d`, 22/22 colours); every mark-like SVG in the tree matches; the PNG/ICO renders pass the pixel
  audit against it. A signature scan of every SVG in the repo returns **zero** different-artwork files.
- **Kept, and why they are not "the old one":** `claude-logo.svg` inside the two archived Claude-clone apps
  (Claude's own brand in clone apps, not our mark), the mockups (design authority), and his own uploaded
  bug-report screenshot (evidence of his report). Git history still holds the old intermediate renders —
  rewriting pushed history is available on request, not done unilaterally.

## 2026-10-14 (near midnight) — the owner's own artwork, everywhere

### The logo is now the owner's file, verbatim
He sent the SVG himself and said to use it everywhere, as SVG. `resources/icon.svg` and
`src/renderer/public/favicon.svg` are that file, byte-identical. A path-by-path diff against the app's
`BrainMark` component showed the artwork was already the same mark (32/32 paths, 22/22 colours) — what
changes is which file is *canonical* and what happens to the interim **tile** I had put behind the icon:
removed, because his export says transparent background.

- **The renderer's source is now `resources/icon.svg`** — no more JSX extraction for the icon path — and it
  keeps a **sync guard**: the file's paths, colours and circles must equal the component's, or no icon is
  written. The UI, the favicon and the desktop icon are allowed to be different *formats* of one mark, never
  different marks.
- Both audits stay: every `url(#…)` must resolve, and the pixels are read back — brain as one centred pink
  blob, lavender lenses, white shine, purple sneakers, and now **transparent corners**.
- The component gained his `<desc>` for screen readers.
- The favicon was previously a crop of the same artwork framed on the head+glasses, because the full figure
  turns to mush at 16 px; it is now the full mark as instructed (a one-file revert if tabs read worse).

**Installer 0.1.2** replaces 0.1.1 (which had the fixed brain but my tile). Verification: 269 tests,
typecheck, smoke with zero console noise, the 22-assertion artifact-library check, and the icon read back out
of the built executables.

## 2026-10-14 (late night) — the logo, and a store worth having

### The logo, fixed for real
The owner's screenshot said it exactly: *"it only showed the glasses where icon was supposed to be … and on
top of app too."* He was right, and both the shipped installer and the app icon had it.

- **What was actually wrong.** The mark's brain is defined once inside `<defs>` and painted **through a
  reference**. The icon renderer resolved the component's JSX expressions, but that reference did not survive
  intact, so the body painted **nothing** while the glasses, hands and sneakers — drawn directly — still did.
  The result looked like a faded ghost of the logo, not like a broken file, which is why it survived two
  rounds of "looks fine to me".
- **The fix is in the renderer, not in the artwork.** It now audits the drawing before photographing it: every
  `url(#…)` must point at an id that exists, and the run **fails** if one does not. No new logo was drawn.
- **Pixels, not previews.** The render is then read back with a pixel check: the pink body must be a large
  blob in the middle, lenses grey with white shine, sneakers purple, tile clean where the drawing stops. A
  transparent PNG looks complete in any viewer that paints white behind it — that is exactly how a hollow logo
  passed inspection once already.
- **A tile, because a white mark on transparency is invisible.** The mark now sits on a rounded dark tile and
  the `.ico` carries **seven sizes** (16–256) rather than one PNG Windows scales badly. Verified by reading
  the icon back **out of the built executables** with `wrestool`: all seven sizes in both the app exe and the
  installer, with the body present at 64 px.
- **Where it lives now:** `resources/icon.png` + `resources/icon.ico`, wired through `electron-builder.yml`
  (`win.icon`, `nsis.installerIcon`, `nsis.uninstallerIcon`, `buildResources`) and `windowIcon()`. Not
  `build/`: that directory name is excluded from this project's workspace snapshots, which silently deleted
  the icon twice.

### Installer 0.1.1
`AI-ASSistant-Setup-0.1.1.exe` (87,869,296 bytes, SHA-256 `f56828ef96a08de4327221768bad648fa777e95a8bdec966a6e43768a261ad5f`) replaces 0.1.0, which shipped the broken
icon. Same app-plus: the **Artifacts** screen, the sidebar's collapse and resize, the rail fix. Per-user,
unsigned → SmartScreen warning; notes and the build recipe in `apps/03_ai-assistant/RELEASE-WINDOWS.md`.

### Community, stores, plugins — answered, not deferred
The owner asked why this had never come up. It is now written out in `COMMUNITY-STORE-PLAN.md`: a **pack** is
a folder with a `manifest.json` (skills, prompts, agents, themes, connectors, capture recipes); a **store** is
an **index file at a URL**, not a service, so nothing needs an account or a server; installing shows the
permissions in plain words first and enforces them through the agent-access switches that already exist; and
sharing is a folder you send someone or a repo you add. It lands after Projects (04) and Vault (05), in five
additive steps — file install first, then the index client, then publish/export and a first-party starter
pack, then connectors with the agents step, then the community index.

## 2026-10-14 (late evening) — one fix on top: the chat's artifacts rail belongs to the chat

Seen in a screenshot of the finished screen at 1280 wide: the conversation's **artifacts rail** and its toggle
were still drawn on the Artifacts screen, next to the library's own panel. The rail lists one conversation's
artifacts and jumps within the transcript — on the library screen it duplicated the panel and squeezed the grid
to a single column. Both are now gated to the Chat view.

Verified after the fix on the same build: 28 files / 269 tests, typecheck clean, and **all six desktop
end-to-end checks green** — including the artifact library check, re-driven against this implementation from
the outside (`shot-tools/check-artifact-library.cjs`, 22 assertions): an empty library says so, a turn builds
an artifact that lands on disk as `v1.html`, the card draws the document itself with scripts off, the panel
shows the scripted preview and `v1`, a **two-version** artifact seeded with the store's own `save()` shows
`v2 v1`, **"Save v1 again" appended a third version** with the note `Restored from version 1` rather than
truncating, rename reached `index.json`, duplicate made `"… copy"`, search narrowed to one row, one remove
took one artifact and the last brought the empty state back — console clean throughout.

## 2026-10-14 (late evening) — the Artifacts screen, and two things the owner saw

The owner's verdict on the app as it stood was blunt and correct: "this is not what was promised. even on the
pics you showed there were alot of features, where are those? this is a plain chatbot". The mockups have eight
screens; two existed (Chat and Settings). The fix starts here, and the order is now screens-first with one
rule: **a nav item appears only when its screen actually works.**

### The Artifacts screen (mockup 03)
An artifact used to live only inside the conversation that made it — no record, nothing on disk, gone once the
chat scrolled away — while the Today mockup promises a count of "artifacts made today". So the library came
first: `src/main/artifacts/store.ts` keeps every artifact as a folder of version files (`v1.html`, `v2.html`,
…) plus one row in an atomic `index.json`, and `src/renderer/src/components/ArtifactsView.tsx` is the screen.

- **Versions are the rule already used in the renderer**: append-only. Putting an old version back **saves it
  as a new version** and says so; nothing is ever truncated. Saving identical content reports `unchanged`
  rather than filling the history with versions that say nothing.
- **Remove moves, never deletes.** The files go to the library's own `.trash/` and the message names where.
- **A damaged index is repaired from the files**, because the files are the truth; documents copied into the
  folder by hand appear rather than vanish; an id that could walk out of the folder is refused before it is a
  path.
- **Thumbnails are pictures, not pages**: a script-less sandbox at 640×440 scaled to the card, loaded only when
  the card is nearly on screen. Twenty cards are twenty still images, never twenty Chromium documents on a
  4 GB machine — and the right-hand pane is where the real, working document runs.
- **Artifacts already in saved conversations are adopted once**, silently, on the first open of the screen —
  nothing in a conversation is changed, and the line says how many were brought in.
- Search in the sidebar now filters whichever screen is showing; the nav has **Chat and Artifacts** and says in
  one muted line that Code, Projects, Vault and Today are being built. No dead nav entries.
- **Import and Tweaks are step 1b**, stated in the plan so they cannot quietly vanish: Import is the file
  picker in the main process (a file that is not a page or a drawing is refused with a sentence), Tweaks are
  the mockup's design-token sliders over the `withDesignTokens` machinery that already exists.

### The two things the owner reported
- **The logo.** The BrainMark namespaces its internal ids with React's `useId()` and points at them with
  `url(#…)`. React 19 returns ids wrapped in punctuation, which is legal in an id attribute but **not** safe
  inside a `url()` reference — and if those references miss, the mark renders in pieces. The ids are now
  stripped to letters and digits, and the desktop check counts every clip-path/use reference and fails if any
  one of them does not resolve (12 checked, 0 broken). **The window icon is also wired up** for the development
  build, so the taskbar shows the mark rather than Electron's default.
- **The chat side panel had no collapse.** Now: a one-click collapse to a 56px rail (expand, new chat, the
  sections, Browsing Maps, profile), and the full sidebar can be dragged to any width between 200 and 420px
  — double-click the edge to reset. Both are remembered across launches. The artifacts rail in a chat has its
  own hide button and a small button that brings it back. Preferences live in the window's own storage, which
  is the same place the appearance settings live.

### Found while proving it — worth writing down
Every desktop checker had been running the app through `puppeteer.connect()` **with puppeteer's default
800×600 viewport applied to a window it did not create**, so every screenshot for weeks showed a cramped
window nobody has ever seen. `defaultViewport: null` fixed all six checkers, and the Xvfb screen is now pinned
to 1280×1024 so the app gets the size it is designed for. That is why the layouts in the new screenshots look
right and the old ones looked squeezed — the app was fine, the camera was wrong.

### Verified
- `npm test` → **28 files / 269 tests** (14 new: version append, restore-as-append, identical-save, rename
  refusal, duplicate independence, remove-moves-not-deletes, adopt-by-id idempotence, adopt refuses junk,
  path traversal refused, damaged-index repair, hand-copied folders, empty library, newest-first ordering,
  empty/oversized refusals).
- typecheck clean, desktop and web builds clean, `SMOKE OK … errors=0 warnings=0`.
- **New desktop end-to-end** (`shot-tools/check-artifact-library.cjs`, 7.5 s, green): the app starts with an
  empty app-data folder; a message is sent; the mock model answers with a real HTML document; then — before the
  screen is trusted — `index.json` and `items/<id>/v1.html` are read **off disk** and must contain the document.
  The screen then shows one card with the real title, date and `v1`; the thumbnail's own `srcdoc` carries the
  document and its sandbox is empty (no scripts); rename changes the name **on disk**; remove empties the grid,
  shows the empty state, and the files are found in `.trash/` while the item folder is gone. The same run also
  counts the logo's `url(#…)` references (0 broken) and collapses/expands the sidebar (rail measures 56px).
  Console clean throughout.
- The other five desktop checks and the browser check (40 assertions, 0 console problems) all still green on
  the same build.

### Landing
This commit on `arena/3c06e1bf-ai-assistant-v3`, merged into `main`.

## 2026-10-15 (early) — Browsing Maps: what was read and when

The vault has been holding the record for a while — conversations the app kept, pages
the extension captured, visits it logged — and nothing in the app could *see* it. Now
there is a surface for it: **Browsing Maps**, opened from the sidebar.

### What it is
A timeline of days on the right, the controls and the sites on the left: search by
title, site or provider; kind filters (conversations / pages / visits) that carry
their own counts; a 7-day / 30-day / everything window; and the sites that appear
most, with a bar whose length is the count against the busiest site. Clicking a site
filters to it. Clicking an entry opens it in place — where it is on disk, when it
happened, how much was kept, and whether it is a capture or only a visit.

### The rules it was built to
- **The map is the vault.** `src/main/vault/sources.ts` reads the three shapes the
  vault already writes (conversation and page frontmatter, monthly activity jsonl) and
  invents nothing. A capture that has no `captured_at` is not on the map; a half-written
  jsonl line is not a visit; a jsonl line with a `source_id` is the *record of a page
  that already has a file*, so a capture is one entry instead of two.
- **The numbers describe the list.** Filtering happens in the app's process, so the
  count in the header is the count of the rows on screen. A total that disagreed with
  its own list would be worse than no total.
- **A visit is not reading.** The vault writes "visit metadata is not proof of reading
  or agreement" beside every visit; the row is badged `visit` and the opened entry says
  a visit means the page was opened, not that it was read. No claim is upgraded.
- **Reading is bounded.** Up to 4,000 files are walked and only the head of each is
  read (8 KB), so a huge vault produces a capped map that says so rather than a spinner.
- **Nothing is retried at the person.** No vault: one sentence and a pointer at
  Settings. Unreadable: one sentence, nothing changed.

### Verified
- `npm test` → 27 files / 255 tests. `tests/sources-map.test.ts` (10): the three kinds
  newest-first, one entry per captured page, a visit that keeps the vault's own
  sentence, Dhaka days, hosts grouped without `www`, search by title/site/provider, the
  summary following its filter, an empty vault as an empty map, a missing vault
  reported and never created, a truncated line excluded until it is completed, and the
  route over the real API including the 503 for a missing vault.
- **Desktop end-to-end** (`shot-tools/check-memory-map.cjs`, 9.4 s, green): a vault
  seeded the way a week would leave it — two conversations from different providers,
  two pages, three visits across three Dhaka days, plus a deliberately half-written
  line — then in the real app: **7 entries** (not 8: the broken line is not a visit),
  the four titles on screen, `docs.example 2` as the busiest site and no `half.example`
  anywhere, the site click narrowing to 2 with the header count following, the search
  narrowing to 1, Visits 3, a visit's own entry saying it is not reading, and the map
  saying "Point the app at a vault in Settings" when the vault is moved away underneath
  the running app. **0 console problems**
- Browser check now 40/40, console 0 (the preview opens the map, says there is no
  vault behind the window, and offers no filter that could not answer)
- Vault (6.1 s), cloud (3.9 s), extension port (1.4 s) and agent access (8 s) checks
  all still green on the same build

## 2026-10-14 (late night) — Agent access: switches that actually govern something

The owner asked for one permission surface — "put everything in settings, so i can
give access to the cloud agent or the local agent of something when I want to".
That surface now exists, and every switch on it is enforced where the thing happens.

### The section
Settings > **Agent access**: `Local model`, `Browser extension`, `Keep conversations`,
and one row per provider that has a key (`Allow Claude (Anthropic)`, and so on).
Capabilities that do not exist — Files, Shell, Web, MCP — are stated as not built
rather than offered as switches, because a switch governing nothing is a lie with a
nice colour. In the browser preview the whole section says there is no machine
behind the window instead.

### Enforced, not decorative
`src/shared/lib/permissions.ts` is the one shape; the main process is the one that
acts on it, and each permission lands on something real:

- **A switched-off provider is unreachable** — no model list, no Test request, no
  reply: three refusals, in the main process, before anything leaves the machine.
  The key stays saved; switching off is not deleting. Read fresh per call, so the
  switch takes effect immediately, without a restart.
- **Browser captures off** → the extension port answers `403 { skipped: true,
  reason: 'captures-off' }` with the reason and where to change it, nothing is
  written, and `/health` tells the extension `captures: false` so it can say why
  instead of retrying. Reading the never-check list is still allowed: that list is
  what keeps a site private.
- **Keeping conversations off** → nothing is attempted at all, so nothing fails, and
  the title bar says **Vault off**. A green "Vault" chip while nothing is written
  would be the one kind of lie this app forbids.
- **Local model off** → the composer refuses the send and says why.

The window never decides: it asks, the main process sanitises (`normalizePermissions`),
writes, and hands back what it recorded — so the switch shows the machine's answer.

### Also here
Every reply now carries where it came from: a small `local` or `online · Claude
(Anthropic)` label beside the model name and time. The model menu already marked online
models; this is the same fact on the answer itself.

### Verified
- `npm test` → 26 files / 245 tests: permissions round-trip and every unreadable shape
  falling back to the default (never to a yes nobody chose), a switched-off provider
  that is never contacted while its key survives, and the extension port refusing
  captures while still serving the never-check list
- **Desktop end-to-end** (`shot-tools/check-agent-access.cjs`, 8 s, green): a capture
  through the extension port lands in the vault → Settings > Agent access opens with
  three real switches → **Browser extension off in the window** → the settings file
  records it, the next capture is 403 with the reason, nothing new is written, the
  port reports `captures: false` → **on again in the same pane** → the same capture is
  accepted → **Keep conversations off** → the chip says `Vault off` and a message
  typed into the app is answered but written nowhere → **on again** → the next
  conversation is kept. **0 console problems**
- Browser check now 37/37, console 0 (the preview names the section, offers no switch
  it cannot honour, and the search finds it)
- Extension port (1.4 s), vault (6.1 s) and cloud (3.9 s) checks all still green
- One check-harness bug was found and fixed on the way, worth recording: the check
  was clicking the sidebar's Settings button while the pane already covered the
  window, so the click landed on `Reset section` and silently switched everything
  back on. A test can pass or fail for reasons that have nothing to do with the app;
  the fix was to drive the pane it had open. The app was right both times.

## 2026-10-14 (night) — the port the browser extension posts to

The blocker for every browser-capture feature was this: the extension is a
separate program, and the app's own API answers only its own window, on purpose.
So the app now opens a socket for it — narrow, fixed, and visible.

### What it is
`src/main/extension/server.ts`, on **127.0.0.1:8765** (`AI_ASSISTANT_EXTENSION_PORT`
moves it). Fixed, because an extension cannot discover a moving port.

### Why opening a port is acceptable here
Not because of who asks, but because of what the port can do. The route table is
the whole surface (`EXTENSION_ROUTES`), and the tests keep it that way:

- `/`, `/health` — is the app there, and which vault is it keeping
- `/status`, `/context`, `/capsules` — reading, for the popup and for injection
- `/blacklist` (GET, POST) and `/capture` (POST) — the never-check list and captures

Nothing else exists on it: no chat route (an extension must never be able to spend
a saved key), no settings, no export, no model routes. Each is asserted as a 404.

### Who it answers
A browser extension's id does not exist until somebody installs it, so any
`chrome-extension://` origin is answered, plus this machine's own loopback on this
port for development. A web page can never pass: script cannot set its own `Origin`
header, and a page sending one gets a 403 with no CORS headers — the browser is not
even told the port is there. A local program could forge the header, and a local
program on this machine can already read the vault's files directly.

Also kept: JSON writes only (a browser form is refused even when it parses), the
same 20 MB ceiling as the app, loopback-only binding, and a refusal the caller can
read. A busy port is reported in the log and in Settings, never fatal: the app
keeps running and says the extension cannot reach it.

### Verified
- `npm test` → 26 files / 242 tests. `tests/extension-port.test.ts` (14): the origin
  rule as a pure function, the narrow surface as a 404 per route, the refusals, the
  preflight, the 20 MB ceiling, a non-existent vault reported and never created, and
  a busy port answered instead of thrown
- **Desktop end-to-end** (`shot-tools/check-extension-port.cjs`, 1.6 s, green): the
  real app with a throwaway vault, and this script playing the extension — `/health`
  names the app and the vault, a captured conversation lands on disk as Markdown,
  `/blacklist` reads, the extension's own writer shape (`type: 'blacklist_update'`)
  is accepted and stored, `/context` answers, a page origin and a request with no
  origin are both 403, `/chat` on that port is 404, and Settings > System says
  `Listening at 127.0.0.1:<port>`. **0 console problems**
- The other three checks still green on the same build: browser 33/33 console 0,
  vault end-to-end 6.3 s, cloud end-to-end 4.1 s
- `src/main/api/body.ts` — the body reader both local servers use, so "too big" is
  one behaviour instead of two

## 2026-10-14 (late) — online providers, off until a key is saved

The gap the owner flagged twice: Claude and the other online APIs were missing. They are in,
and they change nothing for anybody who does not want them.

### One address, Whoever answers
The interface asks for a reply at `/api/ollama/chat` and nowhere else. What decides who
answers is the model's name: `provider/model` for a provider whose key is saved, everything
else to Ollama, byte for byte as before. Server-sent events from Anthropic and from
OpenAI-compatible endpoints are translated in the main process into the same NDJSON records
Ollama produces, so the interface kept exactly one streaming path, one parser and one
error-shaped failure — no new fetch, no provider branch anywhere in the UI.

Claude (Anthropic), GPT (OpenAI), Gemini, OpenRouter, Groq, DeepSeek, Grok (xAI) and a
custom OpenAI-compatible endpoint (a gateway, llama.cpp, vLLM, LM Studio). The list of models
is never a hardcoded catalogue: it is whatever the key can actually reach, asked for at that
moment, and a provider that fails reports its own problem in its own words.

### The key never leaves the main process
`src/main/cloud/keys.ts` seals a key with the machine's own facility — Electron's safeStorage,
which is the keychain on macOS and Windows and the desktop's secret store on Linux — writes
only the sealed form, mode 0600. When a machine gives the app nothing to seal with, the key is
held for that run and the pane says exactly that, out loud, rather than writing a plaintext key
to disk to keep a checkbox green. A key sealed by another machine is dropped, never kept as a
key that fails later. The renderer can ask which providers have keys and what they can reach;
it is never handed a key, and there is no code path that reaches a provider without one.

### Settings > Models
A fifth section: one row per provider — no key, key saved, or key saved for this run only —
with Add key (a form, so the browser stays silent), Save, Test, Remove, and where to get a key.
The custom endpoint's address and model are typed in right there. Saving a key refreshes the
composer's model list, so the models it reaches appear immediately; they are marked `online`,
and a model that is online does not need Ollama to be running.

### Verified
- `npm test` → 25 files / 228 tests: provider shapes and both wire translations, SSE split one
  character at a time, the key store with and without something to seal with, and the four
  routing rules (cloud model → provider; local model → Ollama; no key → refused before anything
  is sent; a name that only looks like a provider → Ollama's business, never a provider's)
- Desktop end-to-end (`shot-tools/check-cloud.cjs`, 4 s, green): a provider-shaped server on a
  loopback port, then in the real window — Settings > Models, endpoint typed, key saved, Test
  pressed ("answered: 1 model"), the model picked from the composer's menu, a question sent, the
  provider's own text answered. The provider was asked exactly once, with `Bearer <key>` and the
  model name; nothing plaintext was written to disk; **0 console problems**
- Browser check now 33/33 with 0 console problems (the Models pane in the preview names the
  providers, explains that keys live in the keychain, and offers no field it cannot honour)
- Desktop vault check still green (6.3 s), smoke `errors=0 warnings=0`, typecheck and both builds clean
- One check was made hermetic while proving this: the desktop checks now run with their own
  app-data directory, because a chosen vault folder from a previous run is remembered — and a
  folder that has gone missing is reported, not replaced, which is exactly what made a
  second run start out saying "No vault".

## 2026-10-14 (night) — Settings becomes the full window; memory stops nagging

The owner's corrections, all four of them, in one commit.

### Settings is now the whole window
A rail on the left — `This computer: System`; `This app: Appearance, Performance, Vault` — one section at a
time on the right, a search box that finds a setting by name and opens its section, and a per-section Reset
that puts a section back to the app's own defaults. `SettingsDialog.tsx` was deleted; `SettingsView.tsx`
replaced it, and the surface fills the content row so the app keeps its own header.

Only sections that work are listed. The mockup's rail has fifteen entries; the rest are not built, so they
are not shown.

### The memory warning was measuring the wrong thing
`vramWarning()` compared every choice against a hardcoded 4 GB. So a person who answered "6 GB VRAM" was
warned about a 4 GB card — the exact complaint. Now `fitCheck()` measures against **the chosen profile's own
budget** (`PROFILE_BUDGET_GB`: 4 GB → 3.6, 6 GB → 5.4, 8 GB → 7.2), stays silent whenever it fits, and makes
no claim at all for CPU-only and Custom. When a profile genuinely cannot hold the loaded model, one sentence
names the real numbers and one button fixes it: `fitToProfile()` (the context snapping to a recognisable
size) or CPU-only when nothing fits.

The estimate itself was wrong too: it charged 0.5 MB per token of context, three times too much for these
models, which made the app's own default profile warn at itself. It is now 0.08 MB/token, documented as a
deliberate over-estimate.

### The verbosity went
No more written-out descriptions under each option. A label, the control, and Ollama's own option values on
one line (`num_ctx=4096 · num_batch=256 · num_predict=1024`).

### Verified
- `npm test` → 22 files / 208 tests (9 new ones pin the memory behaviour, including "6 GB is never answered
  with 4")
- `npm run typecheck` clean; `npm run build:web` clean
- Browser check: 28 assertions (rail, search, accent, width token actually painted, reload persistence,
  reset, no false warning) and **0 console problems**
- Desktop smoke: `SMOKE OK ... errors=0 warnings=0`
- Desktop end-to-end: message → answer → conversation in the vault → vault moved from Settings → second
  conversation in the chosen vault, console clean

### Documentation
Every doc that still described `apps/01` as the app, or the vault API on 127.0.0.1:8765, was brought to the
current state: `README.md`, `BRANCH_TESTING.md`, `TESTING_CHECKLIST.md`, `.ai/*` (and the `ai/` mirror),
`00_LIVING_DOCS/*`, and the extension docs (which now say plainly that it cannot reach the app yet).

## 2026-10-14 — Rebrand to AI ASSistant, plus four features from other apps

The app is no longer a Claude clone. It is **AI ASSistant**.

### Rebrand

- **Logo**: the supplied cheeky-brain SVG, in `src/components/BrainMark.jsx`,
  replacing `ClaudeMark` in the title bar, the assistant avatar and the
  greeting. Every element id inside the artwork is namespaced per instance with
  `useId` — the mark is built from `<use>` and `clipPath` references, so two
  copies on one page would otherwise steal each other's shapes and the sidebar
  logo would silently clip the one in settings.
- **All Claude references removed** from user-facing copy: extensions dialog,
  model selector footnote, billing text, user menu, capabilities panel. The
  settings entry "Claude Code" is now "AI ASSistant Code".

### Customizable profile

Name, email and an optional tagline are editable under **Settings > Account**
and stored locally (`src/lib/profile.js`). Defaults are neutral ("Friend", no
email) **because this is going open source** — a fresh clone says something
sensible to whoever opens it instead of greeting them as the author. The
greeting uses it and it never travels anywhere.

### Features taken from other apps

Following `spec/PARTIAL_FEATURES_AUDIT.md`'s "what is genuinely worth taking":

1. **Memory profile (from Atomic Chat)** — `num_ctx` was hardcoded to 4096 with
   no way to change it. Five profiles (4 GB / 6 GB / 8 GB / CPU-only / custom)
   under **Settings > Performance**, each a plain set of Ollama options. On a
   4 GB RTX 3050 a 3B model is ~1.9 GB of weights, and a large context on top
   spills to shared memory so every token crawls. Threaded from one piece of
   App state through every caller: main chat, vision bridge, sub-agents,
   artifact rewrites. Warns in plain language when the context probably won't
   fit.
2. **Full-text chat search** — sidebar search matched chat *titles* only, so a
   conversation you remembered the contents of was unreachable unless you also
   remembered what you called it. Now scans message bodies, with up to three
   highlighted snippets per chat and title matches ranked first.
3. **Regenerate and edit-and-resend** — two things every chat app has. Editing
   replaces a question and re-answers it, keeping the thread.
4. **Slash menu with a prompt library (from open-design)** — typing "/" opens
   eight built-in prompts, the behaviour written down in
   `docs/claude-exact-pixel-clone-APP-DESIGN.md` and never built. Chosen for a
   3B model: instructions about *form*, which is what a small model cannot
   infer alone. Placeholders stay as `{{braces}}` for the person to fill in.

### New guard: tests/props.test.js

Checks that every prop a component declares is actually passed where it is
rendered. A missing prop is invisible — Vite builds it without complaint and a
stubbed test with hand-written props passes happily — so the failure only ever
appears as "undefined is not a function" on the one click nobody tried. It
immediately caught a real bug: an `inference={inference}` meant for
ArtifactPanel had landed on SubAgentPanel, and nothing had failed. Resolves
props passed through a spread one level up, so `{...composerProps}` is not
reported broken.

### Sandbox data loss (recurring)

The sandbox was again silently reset to an old base while the remote branch had
18 commits the sandbox could not see; a commit was built on the wrong history.
Recovered by saving new files, `reset --hard origin/<branch>`, then diffing each
touched file before reapplying so prior work on those files was not clobbered.
**Always check `git log HEAD...origin/<branch>` divergence before committing.**

214 tests pass; `build:preview` clean.


## 2026-10-14 — Design systems and reusable skills (from open-design)

The user pointed at <https://github.com/nexu-io/open-design> and said to take
every feature the app does not already have. Two were worth porting; both ship
in commit `624bc69` on `arena/3c06e1bf-ai-assistant`.

**Design systems (16 token sets).** open-design keeps 152 systems as plain
`tokens.css` files. We bundle 16 of the most useful as lazy-loaded ES modules
in `src/design-systems/`. A picker in the artifact panel applies one; the tokens
are injected into the live preview *and* into the exported ZIP, so a deployed
site looks like what you previewed. The token `<style>` is inserted **after**
the CSP meta tag, so sandboxing is never loosened. Apache-2.0, attributed in
`apps/01_claude-exact-pixel-clone/THIRD_PARTY_NOTICES.md`.

**Skills (reusable instructions).** open-design's skills mechanism — a
capability is data you can add, edit and delete, not code you have to ship —
ported onto sub-agents. Any instruction can be saved under a name and reused on
any sub-agent afterwards (`src/lib/skills.js`). The six built-in roles stay in
code because they are tuned for a 3B model on 4 GB of VRAM.

**Two north-star docs added** (`docs/claude-exact-pixel-clone-PRD.md`,
`docs/claude-exact-pixel-clone-APP-DESIGN.md`) covering the pixel target, the
user's authoritative hex values, and behavioural notes in the user's own words.

171 tests pass; `build:preview` is clean.

### Sandbox data loss, and the fix

The sandbox was reset to the old base commit `547b4d8` mid-session, so a first
commit (`8e79f7d`) was built on the wrong history while the remote branch
carried 18 commits the sandbox could not see. Resolved by saving the new files,
`git reset --hard origin/arena/3c06e1bf-ai-assistant`, then reapplying the six
source patches — verified first by diffing, so that 18 commits of prior work on
those same files were not clobbered. **Lesson: check `git log` divergence before
committing, not after.** Several files an earlier handover claimed existed did
not survive; verify file existence before trusting any status list.


## 2026-10-11 (22:55) — Fix: preview host was blocked by the origin allowlists

The user reported "preview isn't working". Both layers adopted from 01199af1
refuse requests whose `Origin` is not a loopback host:

- `server/vault-api.cjs` → "Origin is not authorized for this local vault API."
- `server/proxy-policy.cjs` → "Cross-origin API requests are not authorized."

On the user's own machine this is correct and needs nothing. Behind a forwarded
preview hostname the browser's origin is the public host, so every vault and
Ollama call returned 403 while the page itself still loaded — which is exactly
what "isn't working" looked like.

Fixes:

- The vault API already had an `ALLOW_PREVIEW_ORIGINS=1` escape hatch for
  `*.e2b.app`; it simply was not set. It is now.
- `server/proxy-policy.cjs` had no such hatch, and its strict
  `origin.host === host` check also fails when the proxy does not forward the
  public host. It now accepts `*.e2b.app` origins under the same env var,
  defaulting to the strict same-origin comparison.

Both are off by default; a non-preview origin is still refused.

**Why I missed it:** I verified the endpoints with `curl` and no `Origin`
header. A browser always sends one on these calls, so my checks passed while
the real thing failed. Testing without the header the client actually sends is
not a test of the policy.

Verified: all endpoints through the preview proxy, with **and** without
`X-Forwarded-Host`; `https://evil.example.com` still denied; 48 + 5 tests pass.

## 2026-10-11 (session 4 — 22:10) — UI/UX adopted from the 01199af1 branch

The user looked at the branches and said: *"tbh
[arena/01199af1-ai-assistant] looks better and like i want it to be … take this
branch for the ui/ux"*.

**Their palette is the one already specified** — main `#1a1a1a`, sidebar
`#202020` (260px), composer `#242424`, accent `#d48264` — so the
measured-pixel conflict from earlier in the day does not come up. The app now
uses it, and the previous round of measured colours stays reverted.

### What was adopted

The whole UI layer: `App.jsx` (15 KB vs 34 KB before — far better factored),
`Sidebar`, `Center`, `Composer`, `SettingsModal`, `UserMenu`, `VaultPanel`,
`ArtifactPanel`, `Dialog`, `ThinkingDisplay`, plus components this branch never
had — `ArtifactsLibrary`, `BlacklistManager`, `ModelSelector`, `ClaudeMark`,
`IntegrationIcons`, `Markdown` — and the hooks `useChat`, `useModels`,
`useDismiss`, `usePersistentState`. Also `vite.config.js` (proxies moved to
`/api/ollama` + `/api/vault`) and `server/proxy-policy.cjs`.

### What was kept, because they are stated requirements that branch lacked

| Kept | Why |
|---|---|
| `TitleBar.jsx` | File/Edit/View/Go/Help **Windows title bar**; the adopted UI had none |
| `TodayView.jsx` (`Alt+T`) | P8 Today view; also added to the sidebar nav |

Both are pointed at the adopted palette through a short compatibility block in
`index.css`, so they follow the theme rather than carrying their own colours.

### The server was adopted too, and gained real security properties

`server/vault-api.cjs` from 01199af1 refuses path traversal and symlink escape,
matches never-check patterns by host (so `bank.com.evil.org` no longer matches
`bank.com/*`), writes Asia/Dhaka dates, archives the previous system document
before changing the blacklist, and never reports success it did not achieve.
It did **not** have `/today` or `/status`, and it did **not** accept `artifact`
or `journal` captures — all four were ported back in.

### Tests

`npm test` **48/48**; `npm run test:ui` **5/5**. New: proxy-policy (5),
vault behaviour (in-process, ~20), artifacts+storage, ollama. Our old
vault-API test was rewritten against the new contract — files are located from
the API's own `source` response, because immutable sources carry a content hash.

### Also fixed for the preview

`server/mock-ollama.cjs` now answers `/api/show`. Without it the app refuses to
send, because it verifies the model is local first.

**No branch merged. PR #8 still open.**

## 2026-10-11 (session 3 — later) — Palette Restored To The User's Spec

**The user overruled the measurements.** I had shipped the measured palette
(`#151515` / `#111111` / `#20201f`, 384px sidebar) and flagged the conflict with
the values they had specified. Their answer: *"didn't make it look like how I
said … take the looks like I said. don't argue. but keep the functions."*

So the palette is theirs again, and **every function added earlier stays**:

| Role | Measured (reverted) | **Now shipped** |
|---|---|---|
| Main | `#151515` | **`#1a1a1a`** |
| Sidebar | `#111111` 384px | **`#202020` 260px** |
| Composer | `#20201f` | **`#242424`** |
| Hover / active | `#1d1d1d` / `#343434` | **`#2a2a2a` / `#303030`** |
| Text | `#f0efec` | **`#e0e0e0`** |
| Accent | `#d97757` | **`#ff8c00`** |
| Button / code bg | `#f0efec` / `#1d1d1d` | **`#ffffff` / `#141414`** |

Kept: Spark starburst (inherits `var(--accent)`, so it is orange now),
TodayView, Dialog focus trap, artifact CSP, negative-intent detection,
grouped settings nav, measured geometry (toolbar 48px, composer radius 18px,
greeting 44px, transcript widths), all 24 tests, mock Ollama.

The rule is now written into `src/index.css` and `spec/MEASURED_PIXELS.md`:
**where a measurement disagrees with a value the user stated, the user's value
wins and gets flagged — never silently overridden.**

Verified: clean build, palette confirmed present in the shipped CSS,
20/20 unit tests, 4/4 UI smoke tests.

## 2026-10-11 (session 3 — 21:20 Asia/Dhaka) — Best-Of Cherry-Picks Applied

**Context:** the user's advisor AI ran a "deep judge" pass over every branch and
scored this one 68/70, then recommended a 6-step cherry-pick plan. The user asked
for the best parts, a preview, full doc updates, and **no merging**.

### The finding that mattered most: the pixel spec was wrong

The old `CLAUDE_SPEC_FROM_SCREENSHOTS.md` listed estimates — sidebar 260px
`#202020`, main `#1a1a1a`, composer `#242424`. The `c4f75cce` branch had sampled
the real PNGs and got different numbers. **I re-verified them independently** by
writing `tools/pngread.py`, a dependency-free PNG decoder, and sampling
191547.png myself. They are right and the old values are wrong:

| Role | Old estimate | Measured |
|---|---|---|
| Sidebar | 260px `#202020` | **384px `#111111`** |
| Main | `#1a1a1a` | **`#151515`** |
| Composer | `#242424` | **`#20201f`** |
| Active row | `#2a2a2a` | **`#343434`** |
| Text | `#e0e0e0` | **`#f0efec`** |
| Accent | `#ff8c00` | **`#d97757`** |
| Composer radius | 12px | **≈18px** |
| Transcript width default | Medium | **Narrow** (the composer measures 878px) |

Also read off 191707: the settings nav is **grouped** ("Settings",
"This computer", "Customize") — the flat 14-item list was a guess.

The app now uses the measured values. Recorded in the new
`spec/MEASURED_PIXELS.md`, with `tools/pngread.py` checked in so anyone can
re-verify.

### Cherry-picks adopted

| From | What | Why |
|---|---|---|
| `c4f75cce` + `cb0eb781` | measured colours/geometry | corrects the spec; re-verified by me |
| `abc0197f` | `Spark.jsx` — real Claude starburst SVG | pixel accuracy; replaces a `✳` text glyph |
| `01199af1` | `Dialog.jsx` (focus trap, inert root, portal) | accessible modals; the hand-rolled ones had none of this |
| `01199af1` | `buildPreviewHtml` — strict CSP on artifact preview | blocks network/forms/frames/external scripts; CSP is emitted before untrusted content |
| `01199af1` | `wantsArtifact` — negative intent checks | "explain how to build an HTML app" and "don't create" no longer count as build requests |
| `01199af1` | the *idea* of real regression tests | see below |
| `brain01` | `TodayView.jsx` | the only branch that built the P8 Today view; fills a real gap |
| `brain01` | `server/mock-ollama.cjs` | makes the sandbox preview actually chat; never started by `start-app.bat`, labels every reply as a mock |

**Not adopted, and why:** `00aa9faf`'s context-menu submenus + hash deep-links
(needs a router; the six items already work), and `1e3d04e4`'s vite host fix
(this branch already set `host: 0.0.0.0` + `allowedHosts: true`).

### Tests added (zero new runtime dependencies)

- `npm test` → **20/20 pass**, using `node --test`:
  - `tests/artifacts.test.js` — intent gating both ways, extraction, CSP contents
  - `tests/ollama.test.js` — `<think>` splitting, vision detection, label helpers
  - `tests/vault-api.test.cjs` — spins the real server against a temp vault and
    asserts captures, blacklist round-trip, follow-up parsing and
    "wasn't accessible" logging actually land on disk
- `npm run test:ui` → **4/4 pass** in jsdom (render, artifact gating,
  settings/user menu, sidebar context menu). jsdom is deliberately **not** a
  declared dependency — the target machine has a slow connection — so the file
  skips cleanly unless you run `npm i -D jsdom`.

### Also

- `/today` now returns parsed follow-ups, today's journal and the vault path.
- `Alt+T` opens the Today view; also under View and Help, and from the AI-Brain
  panel's Today tab.
- **No branch was merged. PR #8 remains open.**

**Verified:** clean `vite build`, 20 unit tests, 4 UI smoke tests, measurements
re-derived from the PNGs. **Still not run on the user's Windows machine.**

## 2026-10-10 (session 2 — 22:40 Asia/Dhaka) — Exact Clone Completed To The Screenshots

**Context:** New session started from the GitHub repo. The handover claimed UserMenu /
SettingsModal / AppsExtensionsModal were done — they were **not in the repo**. The repo,
not the handover, is the source of truth, so all of it was built this session.

### What was added to apps/01_claude-exact-pixel-clone/

**UI that was missing (from the 6 screenshots)**
- `src/components/SettingsModal.jsx` (191707) — full left nav + Appearance: Theme
  System/Light/Dark, Chat font (Default / Anthropic Serif / Monospace), Transcript size
  Small/Medium/Large, Width Narrow/Medium/Wide, Motion System/Reduced, Voice
  Language/Style/Speed. Account, Privacy, Capabilities, Memory, System and Extensions do
  real work; the Claude-cloud only tabs say "Not in the local build" instead of faking it.
- `src/components/UserMenu.jsx` (191608) — email header + Settings, Language, Get help,
  Upgrade plan, Get apps and extensions, Learn more, Get API keys, Log out.
- `src/components/AppsExtensionsModal.jsx` (191636) — "Do more with Claude everywhere you
  work": Claude Code (Terminal / VS Code), Microsoft 365, AI ASSistant Chrome extension
  with unpacked-load instructions, Capsule Hub, inline suggestions.
- `src/components/TitleBar.jsx` (191558) — File / Edit / View / Go / Help with working
  entries + Ollama and Vault status dots.

**Functionality**
- `src/context/SettingsContext.jsx` — every setting persisted to `claude_exact_settings`,
  theme/motion/transcript-size/width applied to `<html>` as CSS variables, so light mode
  and reduced motion are real, not decorative.
- `src/lib/ollama.js` — ping, `listModels` from `/api/tags`, streaming `/api/chat` with
  abort, vision detection, `<think>` splitting.
- Model selector in the composer now lists every local Ollama model and remembers the
  choice; effort (Low/Medium/High) maps to generation options; thinking (Manual/Auto/Off)
  drives the reasoning panel.
- `src/lib/artifacts.js` + `src/components/ArtifactPanel.jsx` — artifact runner.
  **Strict rule: an artifact is only created when the user explicitly asks** (or flips
  artifact mode in the composer). Any code block can still be promoted by hand with
  "Open in artifacts". This is the structural fix for the Tic Tac Toe loop.
- File + image upload. Images are only attached when the selected model supports vision;
  otherwise the turn still runs and the reply explains which model to pick.
- `src/components/ThinkingDisplay.jsx` — collapsible reasoning panel.
- `src/components/VaultPanel.jsx` rewritten: Capsules (drag onto the composer to inject),
  Never-check blacklist (add/remove, writes the vault), Today (Current Snapshot,
  Open Loops, journal path).
- `src/lib/markdown.jsx` — dependency-free markdown renderer (no new npm packages, which
  matters on a slow connection).
- `src/lib/demo.js` — offline demo responder, OFF unless `?demo=1`.

**System prompt**
- Replaced with a plain instruction containing **no code example**. The old prompt seeded a
  Flappy Bird example and qwen2.5:3b built a game on every reply.

**CORS solved at the source**
- `vite.config.js` now proxies `/ollama` -> 127.0.0.1:11434 and `/vault` -> 127.0.0.1:8765,
  plus a `/__ai_proxy_ping` marker. The browser stays same-origin, so `OLLAMA_ORIGINS` is
  no longer required. The app detects the proxy and falls back to direct URLs.

**Vault API (`server/vault-api.cjs`)**
- Now finds the repo vault (`../../../vault/AI-Brain`) and adds `GET /status`,
  `GET /capsules`, `GET /today`, `GET /blacklist`, `POST /blacklist`, and `artifact` +
  `journal` capture types. Blacklist is written into `00 System/Privacy & Access.md` and
  `00 System/Connectors/Source Scope.md`, and every change is logged to 09 Activity & Undo.

**Bats**
- `start-app.bat` rewritten: sets `OLLAMA_ORIGINS`, starts Ollama **only if 11434 is not
  already listening**, offers to pull qwen2.5:3b only if missing, starts the vault API only
  if 8765 is free, opens the browser. Added `check-ollama.bat`.

**Verified**
- `npx vite build` clean (269 kB JS / 81 kB gzip).
- 4 headless jsdom suites: full render (0 console errors), artifact gating (a normal
  question produces NO artifact, an explicit build request produces one), model selector +
  attach menu, sidebar context menu (pin / rename / delete). All pass.
- **Not yet run on the user's Windows machine** — that is still the open item.

**Why:** user instruction "task is making Claude app exact clone", TODO_NEXT P2-P7.
**Next:** user runs `start-app.bat` on the TUF A15 and reports; then P6 (Today view /
journal / follow-ups) and P9 (installer).

## 2026-10-10

### 19:20 — Created Master Github Repo as AI Memory (Current Session)
- **What:** Created AI-ASSistant-Github-Repo with AI-optimized structure: .ai/ (AGENT_INSTRUCTIONS, CONTEXT.json, STATE.json, INDEX.json), 00_LIVING_DOCS/ (REQUIREMENTS_LIVING, HANDOVER_LIVING, ARCHITECTURE_LIVING, DECISIONS_LOG, CHANGELOG, TODO_NEXT), apps/01_claude-exact-pixel-clone + 02_electron-claude-clone-v6, extension/, vault/AI-Brain/, spec/screenshots/, archive_zips/, docs/originals/, memory/sessions/
- **Why:** User requested "give me one zip file with all we did so far. also that zip file will have the requirement list which will be updated by you every time something changes. basically the repo will also work as a memory and a handover file for other AI/agents/sessions too, i will be one seeing it, s n need to make it lok like human made, make the structure that suits you and ais best for the purpose i'm making it"
- **Files Created:**
  - README.md — root map, quick start for AI and human, GitHub push instructions
  - .ai/AGENT_INSTRUCTIONS.md — mandatory read order, rules, how to update living docs
  - .ai/CONTEXT.json — user, hardware, capture policy, extension UX, model constraints, screenshot spec
  - .ai/STATE.json — current build status per app, features implemented/missing, known bugs, last session
  - .ai/INDEX.json — full file index with purpose per file, search hints
  - 00_LIVING_DOCS/REQUIREMENTS_LIVING.md — living source of truth, acceptance checklist, changelog, update rules
  - 00_LIVING_DOCS/HANDOVER_LIVING.md — current state, gaps, next steps, honest status marking
  - 00_LIVING_DOCS/ARCHITECTURE_LIVING.md — driver/vault/extension diagram, data flows, API spec, tech stack
  - 00_LIVING_DOCS/DECISIONS_LOG.md — all decisions with dates, why, who, alternatives
  - This file CHANGELOG.md
  - 00_LIVING_DOCS/TODO_NEXT.md — immediate next actions (next)
- **Copied:**
  - apps/01_claude-exact-pixel-clone from AI-ASSistant-Claude-Exact (latest exact clone 13K zip source)
  - apps/02_electron-claude-clone-v6 from AI-ASSistant-App (Electron clone with more features)
  - extension/ from AI-ASSistant-Extension (MV3, Capsule Hub + Quillbot spec)
  - vault/AI-Brain/ from AI-Brain (61 files starter)
  - spec/screenshots/ from uploads/*.png (6 Claude screenshots)
  - docs/originals/ from uploads/*.md + Master Plan
  - archive_zips/ from /*.zip (previous zips)
- **Next:** Create TODO_NEXT.md, spec/CLAUDE_SPEC_FROM_SCREENSHOTS.md, memory/sessions log, build master zip, present to user

### 13:19 — Built Exact Pixel-Perfect Claude Clone From Screenshots
- **What:** Built AI-ASSistant-Claude-Exact folder: package.json, vite.config.js, tailwind.config.js, index.html, src/main.jsx, src/App.jsx with localStorage claude_exact_chats defaults Refining 5-day workout cycle etc from screenshots, src/components/Sidebar.jsx with search filter Oct8/Older groups + context menu Open in new window Pin Rename Add to project Move to group Delete, src/components/Center.jsx with getGreeting Evening Utso + textarea + vault context fetch 127.0.0.1:8765/context + direct Ollama 11434/api/chat qwen2.5:3b streaming + log to /capture, src/components/VaultPanel.jsx toggleable, server/vault-api.cjs copied from previous, start-app.bat + build-windows.bat handling existing Ollama + @rollup/rollup-win32-x64-msvc fix
- **Why:** User posted 6 screenshots 191547.png to 191707.png showing actual Claude desktop and said "come on man, is this to hard to make?" Previous clones not exact pixel match, user frustrated. Screenshots now authoritative spec.
- **Tech:** Vite 5 + React 18 + Tailwind, direct Ollama fetch, no client lib, uses existing qwen2.5:3b no download
- **Zip:** AI_ASSistant_Exact_Claude_Clone.zip 13K (excluding node_modules/dist)
- **Bugs Fixed:** Vite rollup win32 optional dep, Ollama already-running handling, Tic Tac Toe loop avoidance via simple systemPrompt

### 13:00 — Previous Session Summary (From Memory)
- Built Electron clone v6 (apps/02_electron-claude-clone-v6) from https://github.com/Damienchakma/Open-claude MIT fork, customized for vault driver, features artifacts workbench thinking citation image upload, ModelService.js supports multiple models, server/vault-api.cjs, start-app.bat + build-windows.bat, zipped to FIXED6
- Built Extension v1.2 (extension/) MV3 with background.js history listener + blacklist, lib/blacklist.js pattern matching, lib/capsule.js, lib/vault-writer.js POST to 8765, content-scripts ai-capture generic-capture capsule-inject quillbot-suggestions, popup Capsule library blacklist manager, README + EXTENSION_SPEC, zipped
- Built Vault v4 Clean (vault/AI-Brain/) 61 files starter, 00 System templates, 01 Inbox, 02 Sources, 03 Memory, 04 Working Memory, 05 Knowledge, 06 Review, 07 Sharing Receipts, 08 Journal, 09 Activity & Undo, 90 Archive, .brain, zipped
- Created Master Plan AI_ASSistant_Master_Plan.md consolidating all requirements, architecture driver/vault/extension, default capture policy, Capsule Hub + Quillbot UX, hardware constraints, acceptance checklist
- Encountered bugs: No reply bug (sendMessage from useChat doesn't exist) fixed by LLMFactory streaming, Tic Tac Toe loop for qwen2.5:3b due to Flappy Bird example in systemPrompt fixed by simple prompt override, Ollama CORS needs OLLAMA_ORIGINS "*"

## Template for Next Entry

### YYYY-MM-DD HH:MM — Title
- **What:** ...
- **Why:** ...
- **Files Changed:** ...
- **Tested:** ...
- **Next:** ...

### 2026-10-10 13:33 — Added Branch Testing Guide + Complete Testable Zips (User Correction)
- **What:** User said "only upload the 3 md files in repo and that's it? instead make containing everything. it should be like if i create a branch i should be able to download and test from there before merging"
- **Why:** Previous master zip already contained everything testable (apps/01 18 files, apps/02 87 files, extension 22 files, vault 99 files, spec 32 screenshots) but user thought only 3 md files. Added BRANCH_TESTING.md + TESTING_CHECKLIST.md explaining branch -> download ZIP -> test workflow.
- **New Zips Built:**
  - AI-ASSistant-Github-Complete-Testable.zip 2.8M — GitHub-ready, excludes node_modules/dist/archive_zips per .gitignore, contains everything needed to test: apps/01 exact clone + apps/02 electron + extension + vault + spec + 00_LIVING_DOCS + .ai + README + BRANCH_TESTING.md
  - AI-ASSistant-Github-EVERYTHING.zip 3.8M — Same + archive_zips/ with old zips (Exact 13K, Electron FIXED6, Extension v1.2, Vault v4) for full local history
- **Verified:** apps/01 18 files, apps/02 87 files, extension 22 files, vault 99 files, screenshots 32 files in zip — fully testable from any branch
- **Branch Workflow Added:** git checkout -b feature/xxx -> push -> GitHub Download ZIP -> extract -> cd apps/01_claude-exact-pixel-clone -> start-app.bat -> test -> merge

### 2026-10-10 13:45 — Fixed .ai and .gitignore Not Uploading (User Correction)
- **What:** User said ".ai and gitignore file didn't get uploaded."
- **Why:** .ai is dotfolder and .gitignore is dotfile, GitHub web UI Upload files drag-drop hides dotfiles because OS hides them. Zip DID include them (verified via unzip -l), but web upload may skip them. Git status shows they ARE untracked and would be included via git add . command line.
- **Fix:** Created visible mirrors for GitHub web upload:
  - ai/ — visible copy of .ai/ with same files + README_VISIBLE_MIRROR.md
  - gitignore.txt + GITIGNORE.txt — visible copies of .gitignore
  - DOTFILES_INFO.md — explains dotfiles hiding issue and that both dot and visible versions exist
  - Kept original .ai/ and .gitignore as real files
- **Verified:** unzip -l shows .ai/ 5 files, ai/ 6 files, .gitignore, gitignore.txt, GITIGNORE.txt all in zip. git status shows .ai/ and .gitignore untracked and not ignored.
- **New Zips:** Rebuilt AI-ASSistant-Github-Complete-Testable.zip 2.8M and AI-ASSistant-Github-EVERYTHING.zip 3.8M with both dot and visible copies
- **Recommendation:** Use git push via command line (git add . includes dotfiles) not web UI upload, or upload both dot and visible versions via web UI

## 2026-10-15 — the engine lands (6.2 + 6.2b) and survives six judges

- **Engine inside the app, free:** socket + wire parser + Claude Code adapter
  (`src/main/engine/`), settings.engine (default `gemma4:cloud` via the local
  Ollama door), five IPC doors, preload `engineApi`; face: composer **Engine**
  toggle, work-order panel with the brain's name on every turn, Allow/Deny
  permission cards, Stop.
- **Six independent judge reviews ran the REAL CLI (v2.1.300) and found real
  defects; all fixed with the test that would have caught each:** permission
  launch flags pinned (`--permission-mode manual`, `--permission-prompt-tool
  stdio`) so the cards actually fire; deny replies carry the CLI-required
  `message`; one engine process serves many tasks (a finished task no longer
  refuses the next one); Stop closes the turn immediately (no wedged panel);
  Bangla text survives stdout chunk splits (StringDecoder); a final line
  without its newline is flushed on close; self-denials, brain retries and
  failed tools are shown instead of swallowed; model names are validated
  against shell tricks; the goodbye is shown once; agy refuses honestly
  (`ok:false`); the working folder is the app's decision (the vault).
- **Rules made real:** the smoke run now FAILS on console warnings (the
  owner's console-clean rule, whole sentence), and
  `.github/workflows/checks.yml` runs types + tests + build on every push.
- **298 tests green, typecheck clean, build clean.** Owner round-trip on his
  machine = the final ✅ the judges asked for.
## 2026-10-15 (evening) — v0.2.1: the owner's mark everywhere + the engine can finally see `claude`

His first real run found two things; both fixed, both carried by tests:

- **The old logo was still alive** — `BrainMark.tsx` (sidebar, title bar,
  messages, empty state), the favicon AND the desktop icon all showed the
  previous smiling brain. PURGED: every surface now renders his canonical
  artwork (`resources/icon.svg`, his own export, byte-for-byte). New committed
  script `scripts/render-icons.mjs` renders icon.png (512) + icon.ico
  (16–256) from that one file and refuses to run without it — the drift that
  caused this can never quietly happen again. 299 tests green.
- **`'claude' is not recognized`** inside the installed app: a packaged app
  gets a slim PATH that does not include the user's npm folder, unlike his
  PowerShell. The engine now prepends `%APPDATA%\npm` and
  `%USERPROFILE%\.local\bin` to the engine process PATH itself (tested), and
  the not-found message tells him exactly what to install and to fully quit +
  reopen the app afterwards.
- Installer rebuilt: `AI-ASSistant-Setup-0.2.1.exe`, SHA-256
  `78b9b40f221b5fb0f0657c0994b50ba9c5b2d7c4c2477cef03040c56d65de14f`.
  Note: Windows caches shortcut icons — if the desktop shortcut still shows
  the old brain after upgrading, unpin/repin or sign out and in; the file
  inside is the new mark.
## 2026-10-15 (night) — v0.3.0: the engine becomes the spine

His ruling after 0.2.1: the engine must not look bolted on — the app is a
shell FOR Claude Code and agy, "as if Anthropic themselves made it." This
landing rebuilds the shell around the engine:

- **The Engine bay** (top of the sidebar, rail button when collapsed): the
  engine selection system (Claude Code / agy — agy honestly marked "soon"
  until its Windows check), the brain picker, the workplace row.
- **Model list comes FROM the engine's own door** (`engine:models` asks the
  brain door): what Claude Code can really use — cloud brains flagged with a
  cloud badge (work leaves the machine), local brains with their size. Real
  data only; a silent door says so in a sentence.
- **"Open a folder"** (`engine:pick-workspace`): the engine's workplace, via
  the native folder picker, remembered, and actually used by `engine:send`
  (vault stays the default). The renderer still cannot pick a folder behind
  the app's back.
- **Brain choice persists** (`engine:model`, strict-pattern validated); the
  composer in engine mode shows the engine's brain and defers to the bay;
  the work-order card names engine, brain, workplace.
- **The alive light is tracked truthfully** — set from the machine's report,
  cleared on close even with no task running (a test-caught bug).
- 302 tests green, typecheck clean. `AI-ASSistant-Setup-0.3.0.exe` (~84 MB),
  SHA-256 `87e2867b7b8caf5c8a4e99fe918efa7d793a1fdcd111ef3f9b179d295bd441c6`.
- Parity program next: session history/resume, skills + plugins panes, file
  diffs, usage display — then the six designed screens.

## 2026-10-15 (late night) — the throttle: fewer restrictions, the engine's own way

His ask: as few restrictions as possible. Landed: the EngineBay carries a
three-step throttle — Ask me (`manual`, unchanged default), Auto-edits
(`acceptEdits`), Full speed (`bypassPermissions`) — persisted, wired through
the shared contract (`ApprovalMode`, `PERMISSION_MODE`), the door
(`engine:approval`), and the launch line. Honest notes in the UI: engine
deny rules and guarded deletions still hold at full speed (its nature, not
our gate); the app itself writes no restrictions. 313 tests, tsc clean.
ARCHITECTURE-ENGINE: the freedom matrix (engine x models, the honest
version) and the offline-models explanation added.

## 2026-10-15 (late night II) — memory discipline + his standing instructions, into every engine

His clarifications: restrictions meant "things it wasn't supposed to say"
(answered in ARCHITECTURE-ENGINE: restrictions live in model weights and
provider filters — the app adds none; local open brains via his door are the
no-filter path), and the memory problem ("it may look up everything for an
unrelated ask"). Landed in the house rules, projected to every engine:
memory discipline (answer from the conversation first, search only what the
question needs, never sweep) and his standing instruction (ask when unsure,
do nothing unnecessary). 11 house-rules tests. Throttle stands as built,
Ask-me default.

## 2026-10-16 (early) — Track A landed: the spine, five landings, 343 tests

He could not test, so the spine got built — no compromises, every landing
tested and pushed:

1. **Resumable sessions, honest usage, before/after cards.** The engine's
   init sentence carries its session id; the app remembers one per workspace
   and resumes with `--resume` after a restart (a living engine is never
   resumed from file — tested). Result sentences carry tokens/time/cost; the
   work card shows them. Permission cards carry a clipped before/after
   (Edit/Write/Bash) so an allow is an informed allow.
2. **Per-engine model routing + real detection.** `engine:models` asks the
   CHOSEN engine's own source (claude-code → his door; agy → its honest
   answer in both installed/not-installed states, scam repos named).
   `engine:detect` runs each engine's `--version` — the agy "Windows check"
   is now self-serve: the bay shows "not installed" with the fix, or lights
   agy up by itself the day he installs it.
3. **Pull-models in the bay.** Real progress bar from the brain door's own
   stream, delete buttons on local brains, names validated, claude-code
   only (cloud-only engines get no fake download box).
4. **One vault → every engine.** Skills deploy to Claude Code's exact shape
   (`~/.claude/skills/<n>/SKILL.md`) and agy's exact shape
   (`.agents/skills/<n>.md`, filename = slash command); his existing eleven
   import cleanly. One MCP list writes `.mcp.json` +
   `.agents/mcp_config.json`.
5. **The rulebook, editable and delivered on every send.** Settings → House
   rules: five fields, save-and-deliver. `engine:send` deploys the rules +
   the current brain's footnote to each engine's own global file as a
   marker-bounded block — the owner's own words in those files are never
   touched (re-deploy tested).

**v0.4.0:** everything above in one installer. Remaining in Track A: the agy
ADAPTER (needs agy on his machine), the Skills pane UI (lands with its
screen), plugin packs (blocked on agy formats).

## 2026-10-16 (morning) — Today (07) landed + the extension gets the canonical mark

- **The extension logo drift, found and killed:** the standalone `extension/`
  folder still carried the OLD smiling brain (the 0.2.1 purge covered the app
  but missed it). All three icons re-rendered from the canonical SVG, and
  `render-icons.mjs` now emits the extension icons in the same run — one
  mark, one source, drift impossible.
- **Today (07), the landing screen:** third nav section (Sun icon). Stats
  counted from real records only — conversations kept today, artifacts in
  the library made today, the vault's reading record for today. Worth-doing-
  next built from those records (continue the latest conversation, open what
  was made today, or one honest "start something") — never an invented task.
  Conversations/Made/Read lists with honest empty and missing states. 348
  tests.

## 2026-10-16 (morning II) — the landscape study

He asked what similar repos are worth taking from. RESEARCH-LANDSCAPE.md
written: Nimbalyst/Pane/Claudette/CodeAgentSwarm on the app side, Prophet/
open-claude-in-chrome/onUI/BrowserKing on the extension side — each with
license and a verdict. Six ideas queued (per-hunk diffs, needs-you pulse,
session board, extension→engine MCP, a11y-tree capture, SDK contract),
all ideas-only (AGPL never enters). Also recorded what none of them have:
our union of engines + free brains + house rules + vault + captures.

## 2026-10-16 (day) — his two repos studied: capsule-hub-skills, ContextFlow

Capsule Hub's Claude Code pack (cloud, paid) validates the capture niche AND
upgrades our engine-bridge plan: teach the engines to use the local vault
through SKILLS + the existing vault HTTP API — no MCP schemas, no account.
ContextFlow profiled as a one-day rebrand (badge/link mismatches, copyright-
swap commit): ideas only, code never. Triage rubric for the whole "way many
like this" class written into RESEARCH-LANDSCAPE.md.

## 2026-10-16 (day III) — sweep #1, mine this time

Proactive scan of all four spaces. Findings: the claude-code-desktop topic
is polluted with keyword-farm fake-download repos (same class as the fake
agy repos — clean provenance is a differentiator); agent-memory validates
our capture design; anthropics/skills + awesome lists = install sources for
our vault deploy; Caveman/Context Mode/Handoff = house-rule and session
ideas queued; ollama-model-manager's name-based rebuild (vision projector
preserved) noted for the bay. Landscape sweep made a STANDING duty in
TODO_NEXT Track D — he should never have to find repos for me again.
