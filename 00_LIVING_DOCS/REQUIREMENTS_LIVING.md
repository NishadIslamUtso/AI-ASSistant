# REQUIREMENTS_LIVING.md — Single Source of Truth (Living)

**Last Updated:** 2026-10-14 (night) Asia/Dhaka
**Version:** 2.0.0-ai-assistant
**Current app:** `apps/03_ai-assistant/` — read section 0.5 before anything else
**Rule:** UPDATE THIS FILE EVERY TIME SOMETHING CHANGES. This repo is memory for AIs. If you don't update, next session loses context.

## 0. Meta

- Owner: Utso (NU Utso, nishadislamutso@gmail.com)
- Device: ASUS TUF A15, Ryzen 7, 8GB RAM, 4GB VRAM RTX 3050, 500GB, Windows 11, slow downloads
- Timezone: Asia/Dhaka
- App name: `AI ASSistant` (preserve double S casing)
- Current model: qwen2.5:3b via Ollama http://127.0.0.1:11434, already downloaded, use directly no download
- Vault API: **in-process** (`apps/03_ai-assistant/src/main/vault/`). No port is open; the old 8765 server belonged to the historical clone.
- Dev: `npm run dev` (desktop) or `npm run build:web && npm run preview:web` (browser preview on 4174)

## 0.5 Where the app actually is — 2026-10-14 (supersedes older sections below)

- **The app is `apps/03_ai-assistant/`** — Electron + React + TypeScript. `apps/01_claude-exact-pixel-clone/`
  is history (the first screenshot-matched clone; a source for porting *logic* only, never JSX) and
  `apps/02_electron-claude-clone-v6/` is history too.
- **The design authority is the owner's approved mockups** — the chat shell, the appearance pane, and the
  **full-window settings rail**. Section 2 below describes the old Claude clone and is kept for history.
- **Settings is one full-window surface**: a rail (System, Appearance, Performance, Vault) with one section
  at a time on the right, a search box that finds settings by name, and a per-section Reset. Terse rows:
  a label and the control, no descriptions underneath.
- **The vault API is in-process.** The old `server/vault-api.cjs` on 127.0.0.1:8765 is not part of this app,
  and no port is open for the extension yet — that is a known gap, not a feature.
- **Memory is measured against the profile the owner chose**, never against a hardcoded 4 GB. Choosing a
  profile IS the answer to "how much video memory is there". CPU-only and Custom claim nothing and are
  never warned about; when a preset really cannot hold the loaded model, one sentence names the numbers and
  one button fixes it.
- **No Vercel deployment files** (removed at the owner's request on 2026-10-14; they are not coming back).
- **Verified on 2026-10-14:** 22 test files / 208 tests, clean typecheck, clean web build, desktop smoke
  `errors=0 warnings=0`, browser check 28/28 with 0 console problems, and the desktop end-to-end check
  (message → answer → Markdown in the vault → vault moved from Settings) green.

## 1. Product Goal (One Sentence)

A native Windows app named AI ASSistant that looks exactly like Claude desktop from screenshots, uses real Obsidian vault AI-Brain/ as permanent + working memory, gets data from every site + every AI via browser extension, and is single brain for every AI you use — without sacrificing reasoning to get bigger context window.

## 2. Claude Exact Layout — From 6 Screenshots (Spec)

**Source:** spec/screenshots/ 191547.png to 191707.png — these ARE spec, not inspiration.

### 2.1 Main Window (191547.png)
- [x] Sidebar left 260px #202020: top Search field + "+ New chat" button, sections Projects, Artifacts (2), Customize, Oct 8 group, Older group
- [x] Sidebar chat list: "Refining a 5-day workout cycle..." (Oct 8), "Identifying charisma type", "Realme 6i - realme... fix", "Fix AI generated Facebook picture", "PSY 101-01W | Unit 1 | Quiz Review", "STA201 - Elements of Statistics", "PHY-112, Principles of Physics II", "CSE220 MID - Data Structure and Algorithms", "Function: Manage memories of personal information" etc — from screenshots, use as default history
- [x] Context menu on chat item (191646.png): Open in new window, Pin chat, Rename, Add to project, Move to group, Delete — position absolute, dark #2a2a2a, rounded
- [x] Center #1a1a1a: greeting "Evening, Utso." serif 3xl with orange asterisk *, sub "How can I help you today?" composer #242424 rounded-xl, placeholder "How can I help you today?"
- [x] Composer: textarea auto-grow, bottom row Project dropdown + "Sonnet 5.5 Medium Manual" model selector, send button white circle with arrow
- [x] Top bar: "Free plan • Upgrade" right side
- [x] Bottom left: avatar NU + "Utso" + "Free"
- [ ] Settings modal (191707.png): Left nav General Account Privacy Billing Capabilities Memory Reflect Time and focus Claude Code System Extensions Developer Skills Connectors, right Appearance Theme options system/sun/moon, Chat font Anthropic Serif, Transcript size Small/Medium/Large, Width Narrow/Medium/Wide, Motion System/Reduced, Voice Language English, Style Buttery, Speed Normal
- [ ] Menu bar (191558.png): File Edit View Go Help — Electron menu
- [ ] User menu (191608.png): nishadislamutso@gmail.com, Settings, Language, Get help, Upgrade plan, Get apps and extensions, Learn more, Get API keys, Log out
- [ ] Apps and extensions modal (191636.png): Do more with Claude everywhere you work, Claude Code Terminal VSCode etc, Microsoft 365, Chrome extension

### 2.2 Colors (Extracted)
- Sidebar: #202020
- Main: #1a1a1a
- Composer: #242424
- Border: #2a2a2a / #333
- Text: #e0e0e0 primary, #888 secondary
- Accent: white send button, orange asterisk

### 2.3 Behavior
- Dark by default, visible persistent light/dark switch, remembers choice
- Fully on-screen, Windows title bar + close controls visible
- Polished, legible, simple — user should NOT manage databases/folders/backend

## 3. Architecture — Driver / Vault / Extension

```
You browsing any site + chatting any AI (ChatGPT, Claude, Gemini, DeepSeek, Grok, Other, Perplexity, Copilot)
  ↕
[Browser Extension] — sensor + context suggester, MV3, local-only, no external account
  - Default check everything after one-time permission
  - If inaccessible -> log "wasn't accessible - reason" in 09 Activity & Undo + 01 Inbox/Processing Errors, no popup
  - Never-check blacklist: user pastes URL/domain/pattern, never collect ever again, stored in 00 System/Privacy & Access.md + storage.sync excluded_patterns
  - Captures submitted AI chats + readable page text + visit trail URL/title/time
  ↕ local loopback, not internet
[AI ASSistant Windows App] — THE DRIVER, Claude exact UI, at 127.0.0.1:8765
  - Controls permissions, privacy, action-log, undo
  - Context builder & retriever, review queue, journals, follow-ups
  - Uses qwen2.5:3b directly via 11434/api/chat streaming
  ↕
[Obsidian Vault AI-Brain/] — CANONICAL MEMORY, readable Markdown, 61 files starter
  + .brain/index.sqlite — rebuildable index only, NOT source of truth
  ↕
When you chat in AI ASSistant OR on claude.ai/chatgpt.com via extension:
  Vault finds relevant memories → shows exact bundle → injects into that AI's finite context
  AI sees only bundle, not whole vault. Full vault stays local.
```

### 3.1 Six Layers (Authoritative)
1. Authorized sources: AI websites, browser pages, laptop folders/apps, imports, user input
2. Visible permission, privacy, action-log, undo layer — separates local capture from external send
3. Context builder and retriever — finds only relevant, current, source-linked passages for selected model
4. Temporal personal memory graph — claims, events, people, projects, routines, preferences, evidence, time
5. Review, follow-up, maintenance — questions only when needed, dry-run audits, archive/forget/delete controls
6. Obsidian Markdown source vault + rebuildable local search index

## 4. Vault Map — Final (Canonical)

```
AI-Brain/
├── 00 System/
│   ├── START HERE.md
│   ├── AI ASSistant Blueprint.md
│   ├── User Setup Defaults.md
│   ├── Memory Schema.md
│   ├── Privacy & Access.md          <- blacklist excluded_patterns stored here
│   ├── Source Capture Map.md
│   ├── Model Registry.md
│   ├── Claude Feature Audit.md
│   ├── Git, Backup & Recovery.md
│   ├── Templates/
│   │   ├── Conversation Source.md
│   │   ├── Browser Visit.json.md
│   │   ├── Laptop File Reference.md
│   │   ├── Entity.md
│   │   ├── Event.md
│   │   ├── Memory Claim.md
│   │   ├── Daily Journal.md
│   │   ├── Follow-up.md
│   │   ├── Sharing Receipt.md
│   │   ├── Source Scope.md
│   │   ├── Capsule.md
│   │   └── Monthly Audit.md
│   └── Connectors/
├── 01 Inbox/
│   ├── New Imports/
│   └── Processing Errors/           <- wasn't accessible logs here
├── 02 Sources/                      # ORIGINALS, never silently rewrite
│   ├── Conversations/<provider>/<year>/<source-id>.md
│   ├── Browser Activity/<year>/<month>.jsonl
│   ├── Web Pages/<year>/<source-id>.md
│   ├── Laptop Files/<source-id>.md
│   ├── Imports/
│   └── Attachments/
├── 03 Memory/
│   ├── Entities/<stable-id>.md
│   ├── Events/<date>-<stable-id>.md
│   └── Connections/
├── 04 Working Memory/
│   ├── Current Snapshot.md
│   ├── Open Loops.md
│   └── Active/<entity-id>.md
├── 05 Knowledge/
├── 06 Review/
│   ├── Questions.md
│   ├── Conflicts.md
│   ├── Keep-or-Forget.md
│   ├── Cleanup.md
│   └── Monthly Audits/
├── 07 Sharing Receipts/
├── 08 Journal/<year>/<date>.md      # Asia/Dhaka
├── 09 Activity & Undo/<year>/<month>.md  # wasn't accessible logs here too
├── 90 Archive/
│   └── Design History/
└── .brain/                          # rebuildable index.sqlite + cache, not source of truth
```

## 5. Default Capture Policy — Latest User Rule (2026-10-10)

- **Default = check everything** by default across all sites + all AIs after one-time permission
- **If inaccessible:** Don't popup/ask. Just log in `09 Activity & Undo/` and `01 Inbox/Processing Errors/` as `wasn't accessible - [reason: permission blocked / layout changed / private window / paywall]`, with URL/title/time. Continue silently.
- **No need to ask** unless user explicitly gives instruction to collect something special (right-click "Collect this page now" or paste URL to force)
- **Never-Check Blacklist:** User setting where you paste URL / domain / pattern and it will never check any data from that URL ever again. Example: `bank.com/*`, `https://private.example.com/page`. Stored in `00 System/Privacy & Access.md` + `00 System/Connectors/Source Scope.md` as `excluded_patterns: []`. Revocable, editable list. Opposite of allowlist — default allow, explicit deny.
- **Explicit collect instruction:** Option where you can right-click / use command palette "Collect this page now" or paste URL to force capture even if previously failed.

### 5.1 Never Collect (Even With Broad Access)
passwords, cookies, auth tokens, payment fields, unsent composer contents, hidden keystrokes, continuous screenshot, incognito unless separately enabled

## 6. Extension UX — Capsule Hub + Quillbot

### 6.1 Capsule Hub by Tilantra Pattern
- Capture your context — in any supported AI chat, click Capture to save core details into a Capsule (goals, decisions, constraints, attachments)
- Organise — file Capsules into folders (project-based)
- Drag and drop to inject — drag Capsule from library into any AI chat box
- Keep context updated — add new version to existing Capsule, rollback/branch from any version
- Transfer attachments — carry files you uploaded/generated across tools, not just text
- Supported tools: ChatGPT, Claude, Gemini, DeepSeek, Perplexity, Grok, Copilot, plus any site via generic readable capture
- Prompt enhancer: "Cook This Prompt" — enhance current prompt with relevant vault context

### 6.2 Quillbot Pattern
- Works in background, ready when needed
- Write in any text field across web, then highlight text or open toolbar to get instant suggestions
- Real-time suggestions as you type in any text field using vault memories
- Inline dropdown list of suggestions — e.g., typing in Claude chat shows "Use capsule: Website project - blue-white design" or "Add memory: You prefer step-by-step"
- Fix, rephrase, humanize, generate new text using vault context
- Works directly where you write, no copy/paste/switch tabs

### 6.3 Combined Requirement
Extension provides contexts like Capsule Hub (capsule library + drag-drop inject + versioning) AND like Quillbot (inline toolbar, highlight to get suggestions, real-time writing assistance using vault memories). No external account required — everything local.

## 7. Model-Aware & Local-First

- Ollama separately installed, not bundled. Local by default.
- qwen2.5:3b baseline, small model limits acknowledged: misreads slow as Solow, generic answers, claims amnesia. Don't promise equals Claude. UI parity != intelligence.
- Model Registry tracks per-model capabilities: tool calls, vision, files, audio, structured output, search, context limits, tested limitations
- When model changes, refresh UI to show every verified supported option and clearly disable unsupported
- Don't silently switch to remote if chosen local can't do something. No cloud model without explicit approval + exact-content/destination preview
- If sensitive context ever sent externally, preview exact text + destination + require approval for that send
- App must not say cannot remember messages present in current conversation. If personal fact absent from both current chat + authorized memory, say unknown; don't infer name from Windows account/path. Arena.ai chats not auto-imported.

## 8. Memory Schema & Evidence

Each claim small enough to correct independently. Lives as section on entity/event note by default.

```yaml
id: stable-unique-id
entity: "[[entity-id]]"
type: fact | preference | event | decision | goal | routine | task | observation | hypothesis
status: candidate | confirmed | disputed | superseded | expired | archived
evidence: user-stated | user-confirmed | assistant-suggestion | observed-pattern | hypothesis
source: "[[provider-conversation-id]]"
source_message: message-id-or-passage
captured_at: 2026-10-10T12:00:00+06:00
occurred_at: optional-date
time_valid_from: optional-date
time_valid_to: optional-date
importance: low | normal | high | pinned
sensitivity: ordinary | sensitive | local-only
retention: current | time-limited | keep-until-user-deletes
confidence: high|normal|low
related: ["[[other-entity]]"]
```

- user-stated: directly stated by you
- observed: fact captured from authorized source
- hypothesis: interpretation, never fact until confirmed
- user-confirmed: you explicitly adopted/corrected

Every important claim/link carries source + dates. Link does not imply causation. Newer fact may supersede current state while older history remains. Change across dates is not conflict.

## 9. Automatic Capture & Organization

- After source/scope authorized once, automatically preserve original and process ordinary directly supported material using templates
- Automatically create/update source-linked entities, dated events, claims, decisions, goals, tasks, preferences, routines, open loops, journal drafts when evidence supports
- Do not interrupt for every note. Use review queue for real uncertainty: unclear meaning, important inferred relationship, same-time conflict, high-impact ambiguity, decision that changes your data/commitments
- Sensitive info may be retained locally from authorized source, clearly marked sensitive. Must not be sent externally without exact-content/destination preview + one-send approval
- Routine vault writes logged, source-linked, non-destructive, versioned, undoable. Never silently rewrite originals, delete source material, run arbitrary commands, post/send messages, make irreversible changes
- Failure must be shown as failure, not saved note. Provide retry/import/share fallback

## 10. Journals, Open Loops, Check-ins, Monthly Audit

### Journals
- Create dated journal at `08 Journal/<year>/<Asia-Dhaka-date>.md` from captured/authorized sources + answers you give
- Preserve event time separately from capture time. Link sources. Distinguish direct user statement, source observation, summary, hypothesis. Never invent offline events/feelings
- Today view surfaces Current Snapshot, today's journal draft, due user-approved follow-ups, one useful next action

### Follow-ups
- Follow-up record: topic, last_update, next_check, cadence, sensitivity, status
- Example: "Yesterday you mentioned fever. Would you like to update how you are today?" Options: better/same/worse/add detail/skip/snooze/don't ask about this. If skipped, leaves unresolved, not decided recovered
- End-of-day reminder opt-in. If enabled, show answer/skip/snooze/stop. Skipping leaves thread unresolved; silence is not resolution
- User chooses cadence for sensitive topics. For trauma/heartbreak/health, ask before recurring check-ins and obey pause/stop

### Monthly Audit
- User-triggered only, not background. Show reminder "Run 2-month memory review?" Reminder is not permission
- When explicitly started: examines last 60 days new/changed memories + only older memories linked to those items. Checks newer info that may correct/supersede old claims, apparent conflicts against dates, revisits proposed connections without turning correlation into causation, flags duplicates, unsupported interpretations, stale summaries, temporary items no longer current
- Produces concise source-linked report with suggested actions + open questions. Dry run. Can propose correct, supersede, merge, confirm connection, keep as hypothesis, archive, keep temporarily, forget derived memory, delete source too. Nothing applied until you approve individual proposals or explicitly approve batch. Sensitive memories stay local during review

### Four Distinct Retention Actions
- Archive: remove derived note from active view, keep locally searchable on request
- Expire currentness: stop treating temporary state as current, preserve dated history + source
- Forget derived memory: remove extracted item from active retrieval + indexes, retain original transcript
- Delete source too: after separate confirmation, remove transcript + attachments/index entries under backup-retention policy

Old or rarely retrieved transcripts are not automatic deletion candidates.

## 11. Privacy, Git, Backups

- Local processing/storage default; SQLite only rebuildable index. Markdown + source files canonical
- Local Git commit = local version history OK. Remote Git push/cloud sync = external send. Review + approve destination/content first. Never upload private vault data automatically
- No full-disk encryption assumed. Protect Windows account/device and back up only to destination user trusts
- Keep local activity/undo history: what was captured, created, changed, skipped, failed, externally sent. In `09 Activity & Undo/<year>/<month>.md`
- Keep sharing receipts in `07 Sharing Receipts/` — what was approved and sent, to which provider, when
- Sensitive info local by default: health, mental health, relationships, trauma, sexuality, finances, identifying details marked sensitive/local-only

## 12. Hardware & Beginner Guidance

- Windows 11, ASUS TUF A15, 8GB RAM, 4GB VRAM, 500GB, slow downloads concern
- Explain Windows tasks one simple step at a time, wait for result. Beginner-friendly
- Don't call third-party installer safe without verification
- Don't promise larger model will run well on 8GB RAM / 4GB VRAM without checking
- Bat files must work with existing Ollama, handle already-running, no native build tools

## 13. Acceptance Checklist — Are We Doing It Right?

- [x] App named AI ASSistant, native Windows desktop, title bar visible, dark default #1a1a1a
- [x] Claude's chat layout copied from screenshots 191547-191707, sidebar 260px #202020 Search +New Projects Artifacts Customize Oct8 Older, center Evening Utso greeting, composer #242424 How can I help you today?, Free plan Upgrade top, NU Utso Free bottom
- [~] Feature inventory exists for "all Claude features" — PARTIAL: Settings > Capabilities reports what the selected local model can actually do (text / vision / artifacts / streaming); the full audit against 00 System/Claude Feature Audit.md is still pending, no parity claim is made.
- [x] Settings modal from 191707.png: left nav (General, Account, Privacy, Billing, Capabilities, Memory, Reflect, Time and focus, Claude Code, System, Extensions, Developer, Skills, Connectors) + Appearance (Theme System/Light/Dark, Chat font, Transcript size Small/Medium/Large, Width, Motion, Voice Language/Style/Speed), persisted to localStorage
- [x] User menu from 191608.png: email, Settings, Language, Get help, Upgrade plan, Get apps and extensions, Learn more, Get API keys, Log out
- [x] Apps and extensions modal from 191636.png: Claude Code, Microsoft 365, AI ASSistant Chrome extension, Capsule Hub, inline suggestions — Anthropic cloud entries are labelled "Not available locally" instead of faked
- [x] File / Edit / View / Go / Help menu bar (191558.png) rendered in the browser build with working entries; Electron will swap in a native menu
- [x] Model selector is functional: lists every model from Ollama /api/tags, remembers the choice, marks vision models, effort (Low/Medium/High) and thinking (Manual/Auto/Off) are live
- [x] Artifact runner: HTML/SVG run in a sandboxed preview panel with Code/Preview tabs, copy, download, save-to-vault, version bump on edit. Artifacts are created ONLY when the user explicitly asks (or flips artifact mode) — this is the Tic Tac Toe loop fix
- [x] File + image upload in the composer; images are only sent to models that accept them, otherwise the model-aware warning is shown and the turn still runs
- [x] Thinking/reasoning panel: <think> blocks from qwen3/deepseek-r1 style models are split out into a collapsible panel instead of leaking into the transcript
- [x] Capsule drag-and-drop: drag a capsule from the AI-Brain panel onto the composer to inject goals/constraints/background/decisions
- [x] Never-check blacklist manager in the app (AI-Brain panel > Never-check), writes 00 System/Privacy & Access.md + 00 System/Connectors/Source Scope.md, logged to 09 Activity & Undo
- [x] Sidebar context menu (191646.png) is functional: open in new window, pin/unpin, inline rename, add to project, move to group, delete
- [x] Ollama CORS solved at the source: the Vite dev server proxies /ollama and /vault, so the browser stays same-origin and OLLAMA_ORIGINS no longer matters (the app auto-detects the proxy and falls back to direct URLs)
- [x] (2026-10-11) **Palette is the user's, and is authoritative:** main `#1a1a1a`, sidebar `#202020` (260px), composer `#242424`, hover `#2a2a2a`, active `#303030`, text `#e0e0e0`, accent `#ff8c00` (Claude orange). Geometry the user did NOT specify still follows the measured screenshots: toolbar 48px, composer radius 18px, greeting 44px, transcript widths, grouped settings nav. **Rule: a measurement never silently overrides a value the user stated.** See spec/MEASURED_PIXELS.md.
- [x] (2026-10-11) Artifact preview is sandboxed with a strict CSP (no network, forms, frames, external scripts) and the CSP is emitted before untrusted content
- [x] (2026-10-11) Artifact intent detection also matches NEGATIVE intent — "explain how to build an HTML app" and "don't create" do not produce artifacts
- [x] (2026-10-11) Modals are accessible: portal, focus trap, Escape, inert background
- [x] (2026-10-11) The browser can reach **only** the local endpoints the UI needs — proxy policy refuses model pull/delete, arbitrary vault paths, cross-origin calls and browser-form writes
- [x] (2026-10-11) Captures refuse path traversal and symlink escape; never-check patterns match by host (`bank.com.evil.org` does not match `bank.com/*`)
- [x] (2026-10-11) Vault writes acknowledge honestly — no success is reported unless the write landed; previous system documents are archived before a blacklist change
- [x] (2026-10-11) Regression tests exist: 20 unit + vault-integration tests on node --test, 4 jsdom UI smoke tests, no new runtime dependencies
- [ ] Obsidian genuinely integrated as canonical vault, SQLite only rebuildable index under .brain/
- [x] App is driver of vault + extension, vault organizes, extension collects + suggests contexts/prompts/files
- [x] Browser extension default = check everything, if inaccessible log "wasn't accessible" without asking
- [x] Never-check blacklist exists: user can paste URL/domain pattern to never collect from ever again, editable in Privacy & Access
- [x] Extension provides contexts like Capsule Hub: capture as Capsule, organize, drag-drop inject, version/branch, transfer attachments, prompt enhancer
- [x] Extension provides contexts like Quillbot: real-time suggestions in any text field, highlight for suggestions, inline toolbar, works where you write
- [x] Browser extension captures from any site you allow + all AI models you use, after one-time permission
- [ ] Visit metadata distinguished from readable content, visit not proof of reading/agreement — need implementation in vault writes
- [ ] Laptop file access explicitly scoped, visible, revocable, honest about actual coverage, originals stay in place
- [x] Assistant automatically uses your template for authorized routine capture/organization, does not ask save every item
- [x] Routine local changes inspectable and reversible with activity log + undo/version history
- [x] Uncertainty, inferred relationships, same-time conflicts, high-impact ambiguity routed to review queue, not guessed
- [x] Current-chat context not confused with long-term memory, no unsupported personal facts guessed, no name inferred
- [x] Sensitive external sharing requires exact-content/destination preview + per-send approval, no blanket approval
- [x] Original sources preserved until you choose deletion; archive, expire, forget-derived, delete-source remain distinct
- [x] Journals dated Asia/Dhaka, event time vs capture time separated, source-linked, never invents offline events/feelings
- [~] Today view surfaces Current Snapshot, today's journal draft, due follow-ups, one next action — MOSTLY DONE 2026-10-11: full TodayView modal (Alt+T, View menu, Help menu) with Current Snapshot, Open Loops, parsed due follow-ups with answer/skip/snooze/stop, and today's journal read from 08 Journal/. Still missing: journal draft *generation*.
- [x] End-of-day prompts opt-in, offer answer/skip/snooze/stop, silence not resolution, user chooses cadence for sensitive topics
- [x] Monthly cross-check user-triggered only, last 60 days + relevant linked older, dry-run, apply nothing until approved
- [x] Cleanup never deletes original transcript because old or rarely retrieved; shows counts, sizes, reasons, links, batch decide
- [x] Model-dependent options change when you switch models, unsupported disabled honestly, capability detection separate from model choice
- [x] No claim local model equals Claude, quality/speed/hardware trade-offs explained plainly, qwen2.5:3b limits acknowledged
- [x] No passwords/cookies/tokens/payment fields/unsent drafts/hidden keystrokes collected, no keylogger/screenshot recorder, incognito off unless separately configured
- [x] Local processing/storage default, Git local commit OK, remote push is external upload with approval, backup only to trusted destination
- [x] Guidance delivered one simple step at a time, beginner-friendly, wait for result
- [x] Full transcript survives summaries unchanged, duplicate handling works, failed adapter never reports false success
- [x] Index and context rebuildable after cache deletion
- [x] Bat commands work on Windows TUF A15 8GB RAM 4GB VRAM, app is driver of vault (127.0.0.1:8765), dark default, uses Ollama at 11434 handling already-running, no native build tools

## 14. Changelog of Requirements

### [2026-10-10 19:20] Initial living version created
- Consolidated from REQUIREMENTS.md, HANDOVER.md, Master Plan, Blueprint, Extension Spec, 6 screenshots
- Added exact pixel spec from screenshots 191547-191707
- Added default capture policy: check everything, log wasn't accessible, no popup
- Added never-check blacklist: default allow explicit deny, editable revocable, stored in Privacy & Access + Source Scope
- Added Capsule Hub + Quillbot UX requirements
- Added hardware constraints TUF A15 8GB RAM 4GB VRAM
- Added qwen2.5:3b direct use, no download, bat handling already-running Ollama
- Created AI-optimized repo structure .ai/ + 00_LIVING_DOCS/

### [2026-10-10 22:40] Exact clone brought up to the screenshots (P2-P5, P7)
- **Added:** Settings modal (191707), User menu (191608), Apps & extensions modal (191636), File/Edit/View/Go/Help menu bar (191558) — all four modals/bars that were listed as missing
- **Added:** functional model selector from Ollama /api/tags + effort + thinking controls, replacing the static "Sonnet 5.5 Medium Manual" text
- **Added:** artifact runner (HTML/SVG preview panel) with the STRICT rule that artifacts are only produced when the user explicitly asks — requested by user as the fix for the Tic Tac Toe loop
- **Added:** file + image upload, model-aware vision handling, thinking display, capsule drag-and-drop injection, blacklist manager, Today tab (Current Snapshot + Open Loops)
- **Added:** /ollama and /vault dev proxies, which remove the Ollama CORS requirement entirely
- **Changed:** system prompt reduced to a plain instruction with no code example; it is what stops a 3B model from building a game on every reply
- **Changed:** vault API extended with /status, /capsules, /today, GET+POST /blacklist, artifact + journal capture types
- **Why:** user instruction "task is making Claude app exact clone"; the handover listed these as the open P2-P7 items
- **Verified:** production build clean; 4 headless jsdom smoke suites (render, artifact gating, model selector, sidebar context menu) all pass with zero console errors. NOT yet run on the user's Windows machine.

### [2026-10-11 21:50] Palette restored to the user's spec — measurements demoted to reference
- **Changed:** measured colours reverted. Shipped for a few hours, then the user
  ruled: "didn't make it look like how I said … take the looks like I said. don't
  argue. but keep the functions." Main #1a1a1a, sidebar #202020 260px, composer
  #242424, hover #2a2a2a, active #303030, text #e0e0e0, accent #ff8c00.
- **Kept:** every function from the cherry-picks — Spark, TodayView, Dialog focus
  trap, artifact CSP, negative intent, grouped nav, 24 tests. Spark inherits
  var(--accent) so it is orange now.
- **Kept from measurement:** geometry the user never specified — toolbar 48px,
  composer radius 18px, greeting 44px, transcript widths, settings-nav grouping.
- **Why:** the user asked for pixel-exactness to the screenshots AND gave their own
  palette. Those two conflict. The user's stated values win; measurements stay as
  reference and still govern anything they did not specify.
- **Verified:** clean build, palette confirmed in the shipped CSS, 20/20 + 4/4.

### [2026-10-11 21:20] Best-of cherry-picks applied; measurements recorded
- **Recorded:** values measured from the screenshots (sidebar 384px #111111, main
  #151515, composer #20201f, accent #d97757). Verified with tools/pngread.py,
  recorded in spec/MEASURED_PIXELS.md — then **reverted, see 21:50 above**.
- **Changed:** the settings left nav is grouped ("Settings", "This computer",
  "Customize") as it appears in 191707; the flat 14-item list was a guess.
- **Added:** TodayView (P8) — snapshot, open loops, due follow-ups with
  answer/skip/snooze/stop, journal.
- **Added:** artifact preview CSP, negative-intent detection, accessible Dialog,
  Claude Spark mark, mock Ollama server for previews (never used by start-app.bat).
- **Added:** tests — 20 on node --test, 4 jsdom UI smoke.
- **Why:** advisor deep-judge recommended taking the best parts of the other
  branches; user asked for best parts + preview + docs, and no merging.
- **Verified:** clean build, 24 automated checks, measurements re-derived.

### [2026-10-11 22:10] UI/UX adopted wholesale from the 01199af1 branch
- **Changed:** at the user's request the entire UI layer was replaced with the
  01199af1 implementation — components, hooks, 38 KB stylesheet, vite proxy
  config and proxy policy. Their palette is the user's own spec
  (`#1a1a1a` / `#202020` 260px / `#242424` / `#d48264`), so no conflict.
- **Kept:** the Windows title bar and the Today view, which that branch lacked.
- **Changed:** the vault API was adopted from that branch as well. It adds path
  traversal and symlink refusal, host-correct never-check matching, Asia/Dhaka
  dates, revision archiving, and no-false-success write acknowledgements.
  `/today`, `/status`, `artifact` and `journal` captures were ported back in.
- **Why:** the user compared the branches and preferred that one's look and feel.
- **Verified:** 48 unit/integration tests, 5 jsdom UI tests, clean build, all
  endpoints checked live through the preview proxy.

### [2026-10-14 night] Vault writes, Settings, and the full-window Settings surface
- **Added:** the vault service in the app's main process — conversations become Markdown in
  `02 Sources/Conversations/AI ASSistant/<year>/`, activity is appended to `09 Activity & Undo/`, and the
  folder is chosen from Settings through the main process.
- **Added:** Settings as a **full window**: rail (System, Appearance, Performance, Vault), search, per-section
  Reset, and a Vault pane that refuses a folder that does not exist without creating anything in its place.
- **Changed (the owner's correction):** the Performance warning is now measured against **the profile that
  was chosen**. It used to be computed against a hardcoded 4 GB, so answering "6 GB VRAM" produced a warning
  about a 4 GB card. That is gone, with tests that pin it.
- **Changed:** the written-out descriptions under each option were removed. A label and the control.
- **Changed:** the app is `apps/03_ai-assistant/`; the old clone is history (section 0.5).
- **Removed:** the Vercel deployment files, at the owner's request.
- **Verified:** 208 tests, typecheck, web build, desktop smoke, browser check, desktop end-to-end.
- **Where:** branch `arena/3c06e1bf-ai-assistant-v3`, merged into `main`.

### [NEXT] Add when changed:
- Use format: ### [YYYY-MM-DD HH:MM] Added/Changed/Fixed: description + why + who requested

## 15. How to Update This File (For AIs)

1. Edit this file directly, don't create new requirement files
2. Add entry to section 14 Changelog of Requirements with date
3. Update Acceptance Checklist checkboxes [ ] -> [x] when done
4. Update section 2 if UI spec changes (new screenshots)
5. Update section 5 if capture policy changes
6. Commit with message "req: <what changed>"

This file IS the memory. Keep it updated.
