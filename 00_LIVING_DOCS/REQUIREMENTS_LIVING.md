# REQUIREMENTS_LIVING.md — Single Source of Truth (Living)

**Last Updated:** 2026-10-10 19:20 Asia/Dhaka
**Version:** 1.0.0-master
**Rule:** UPDATE THIS FILE EVERY TIME SOMETHING CHANGES. This repo is memory for AIs. If you don't update, next session loses context.

## 0. Meta

- Owner: Utso (NU Utso, nishadislamutso@gmail.com)
- Device: ASUS TUF A15, Ryzen 7, 8GB RAM, 4GB VRAM RTX 3050, 500GB, Windows 11, slow downloads
- Timezone: Asia/Dhaka
- App name: `AI ASSistant` (preserve double S casing)
- Current model: qwen2.5:3b via Ollama http://127.0.0.1:11434, already downloaded, use directly no download
- Vault API: http://127.0.0.1:8765
- Dev server: http://127.0.0.1:5173

## 1. Product Goal (One Sentence)

A native Windows app named AI ASSistant that looks exactly like Claude desktop from screenshots, uses real Obsidian vault AI-Brain/ as permanent + working memory, gets data from every site + every AI via browser extension, and is single brain for every AI you use — without sacrificing reasoning to get bigger context window.

## 2. Claude Exact Layout — From 6 Screenshots (Spec)

**Source:** spec/screenshots/ 191547.png to 191707.png — these ARE spec, not inspiration.

### 2.1 Main Window (191547.png)
- [x] Sidebar left 260px #202020: top Search field + "+ New chat" button, sections Projects, Artifacts (2), Customize, Oct 8 group, Older group
- [x] Sidebar chat list: "Refining a 5-day workout cycle..." (Oct 8), "Identifying charisma type", "Realme 6i - realme... fix", "Fix AI generated Facebook picture", "PSY 101-01W | Unit 1 | Quiz Review", "STA201 - Elements of Statistics", "PHY-112, Principles of Physics II", "CSE220 MID - Data Structure and Algorithms", "Function: Manage memories of personal information" etc — from screenshots, use as default history
- [x] Context menu on chat item (191646.png): Open in new window, Pin, Rename, Delete work (keys P/R/D); Add to project and Move to group shown disabled — position absolute, dark #2a2a2a, rounded
- [x] Center #1a1a1a: greeting "Evening, Utso." serif 3xl with orange asterisk *, sub "How can I help you today?" composer #242424 rounded-xl, placeholder "How can I help you today?"
- [x] Composer: textarea auto-grow, send button white circle. Model slot is now a real Ollama model picker (shows qwen2.5:3b). "Medium" and "Manual" are display-only. Project dropdown is a placeholder.
- [x] Top bar: "Free plan • Upgrade" right side
- [x] Bottom left: avatar NU + "Utso" + "Free"
- [x] Settings modal (191707.png) — built + checked in headless Chromium (not yet on Windows): Left nav General Account Privacy Billing Capabilities Memory Reflect Time and focus Claude Code System Extensions Developer Skills Connectors, right Appearance Theme options system/sun/moon, Chat font Anthropic Serif, Transcript size Small/Medium/Large, Width Narrow/Medium/Wide, Motion System/Reduced, Voice Language English, Style Buttery, Speed Normal
- [x] Menu bar (191558.png): File Edit View Go Help — drawn in web build from hamburger (Electron native menu later)
- [x] User menu (191608.png): nishadislamutso@gmail.com, Settings, Language, Get help, Upgrade plan, Get apps and extensions, Learn more, Get API keys, Log out
- [x] Apps and extensions modal (191636.png): Do more with Claude everywhere you work, Claude Code Terminal VSCode etc, Microsoft 365, Chrome extension

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
- [ ] Feature inventory exists for "all Claude features" — need audit via 00 System/Claude Feature Audit.md, no parity claim without verification
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
- [ ] Today view surfaces Current Snapshot, today's journal draft, due follow-ups, one next action — need Today view implementation
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

### [2026-10-10 (session 2)] Added/Changed: Claude clone modals, model picker, per-chat history
- **Added:** UserMenu (191608), AppsExtensionsModal (191636), SettingsModal with left nav + Appearance/Voice (191707), MenuBar File/Edit/View/Go/Help (191558), ModelPicker reading Ollama /api/tags, working row menu (Pin, Rename, Delete), Pinned section, Light/Dark/System theme.
- **Changed:** Each chat now keeps its own transcript (localStorage claude_exact_messages_v2). Sidebar defaults use the chat titles visible in 191547. Storage keys moved to *_v2 (old claude_exact_chats is ignored).
- **Why:** Handover P2 (modals) and P4 (model selector) plus the context-menu actions. User asked for an exact clone, not loose inspiration.
- **Requested by:** Utso, via NEW_SESSION handover.
- **Verified:** Headless Chromium + mock Ollama/vault (test-only, not in repo). 30/30 checks pass. Not yet tested on Windows.
- **Deviations from spec:** Theme shows System highlighted in 191707, but app default stays Dark (user rule). Accent colour set to #d97757 from screenshot look, not #ff8c00 from the earlier spec. Voice settings saved but not used yet.

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
