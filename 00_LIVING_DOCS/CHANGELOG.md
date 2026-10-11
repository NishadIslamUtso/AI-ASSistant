# CHANGELOG.md — What Changed Each Session (Living)

**Last Updated:** 2026-10-11 23:40 Asia/Dhaka
**Rule:** Log every change with date, what, why. This is memory for next AI.

## 2026-10-11 (23:40) — "take the best from all of them and make my app functional"

The curated list (Claude clones, Ollama frontends, plugin stores, features to
steal) was turned into working code inside `apps/01_claude-exact-pixel-clone/`.
Nothing was copied and no dependency was added. Full item-by-item mapping lives
in `00_LIVING_DOCS/BEST_OF_CLONES.md`.

**New modules**

| File | Purpose |
|---|---|
| `src/lib/zip.js` | Dependency-free ZIP writer (stored entries, own CRC32) + `staticSiteEntries` for a deployable export |
| `src/lib/vision.js` | Vision bridge: bridge prompt, description cleaning/capping, the labelled `vision_bridge` block |
| `src/lib/ask.js` | One isolated local model call with the shared 12,000-character budget |
| `src/hooks/useVisionBridge.js` | Probes `/api/show` per installed model (cached), decides direct / bridge / none |
| `src/hooks/useSubAgents.js` | Isolated-context jobs, six roles, one at a time |
| `src/components/SubAgentPanel.jsx` | The sub-agent panel (list, editor, result, insert-to-composer) |

**Rewritten**

- `src/lib/artifacts.js` — `artifactsIn`/`extractStreamingArtifacts` (a half-written
  document is openable but never saved), the inline chart renderer, pick mode,
  `parseElementPick`, `rewritePrompt`, `applyElementRewrite`, `sourceSignature`.
- `src/components/ArtifactPanel.jsx` — live preview with a `Live` badge,
  comment-mode pin card, region rewrite, "Export deployable site".
- `src/components/Center.jsx` — live artifact cards, the bridge stage line,
  `Copy` / `Branch from here`, the image-description disclosure.
- `src/hooks/useChat.js` — vision bridge before the answering model, throttled
  live-artifact sweep, `branch()`.

**Wired**

- `App.jsx`: `visionModel` preference, bridge + sub-agent hooks, live artifacts
  merged into the library, auto-open of the panel, `Ctrl+Shift+G` (sub agents),
  `Ctrl+Shift+A` (artifacts view), branch + insert handlers.
- `Sidebar` (Sub agents entry), `TitleBar` (View ▸ sub agents), `SettingsModal`
  (new Vision section), `Composer` (bridge notice + labelled chip),
  `AppsExtensionsModal` (live service status).
- `src/index.css` — styles for the new panels; no new colours, existing tokens only.
- `server/mock-ollama.cjs` — routes for the bridge, the region rewriter, the chart
  dashboard, and sub-agent tasks, so every new flow is demonstrable in a preview.

**Tests:** `npm test` 48 → 69, `npm run test:ui` 5 → 9, plus a new
`npm run test:live` (7 tests) that drives the real libs through the real proxy.

**Honest gaps:** MCP one-click was **not** implemented (see BEST_OF_CLONES.md §3).
No real-model run yet: everything here is proven against the mock and jsdom.

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
