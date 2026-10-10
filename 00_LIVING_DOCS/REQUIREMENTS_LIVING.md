# REQUIREMENTS_LIVING.md — Single Source of Truth (Living)

**Last Updated:** 2026-10-10 (continued) Asia/Dhaka
**Version:** 1.1.0-master / active app 0.2.0
**Rule:** UPDATE THIS FILE EVERY TIME SOMETHING CHANGES. This repo is memory for AIs. If you don't update, next session loses context.

## Current evidence notice (2026-10-10 continuation)

The accepted product requirements below remain in force. Old checkmarks in sections2–12 describe the earlier requirement/UI inventory, **not proof of shipped or user-confirmed behavior**. Section13 is now the honest implementation/evidence checklist. Active target is apps/01_claude-exact-pixel-clone v0.2.0, not the native Electron reference. Source/build, 42 Node tests and 22 mocked-browser tests pass; real Windows/Ollama/extension and exact-pixel confirmation remain open.

References are native **1920×1020**. Our comparison uses1280×680CSS/DPR1.5; actual laptop DPI/fonts are unknown. Fresh width is **Narrow588**, not older approximate Medium; Medium768/Wide960. Dark main#1a1a1a/sidebar260px#202020/composer#242424 remains mandatory. Actual local model name is shown, not a fake Sonnet label; screenshot titles are empty UI placeholders, not imported evidence.

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
- [x] Context menu on chat item (191646.png): Open in new window, Pin chat, Rename, Add to project, Move to group, Delete — position absolute, dark #2a2a2a, rounded
- [x] Center #1a1a1a: greeting "Evening, Utso." serif 3xl with orange asterisk *, sub "How can I help you today?" composer #242424 rounded-xl, placeholder "How can I help you today?"
- [x] Composer: textarea auto-grow, bottom row Project dropdown + screenshot-shaped model controls showing the actual installed local model, Medium/Manual, send button white circle with arrow
- [x] Top bar: "Free plan • Upgrade" right side
- [x] Bottom left: avatar NU + "Utso" + "Free"
- [x] Settings modal UI (source/build/mocked browser; voice engine unavailable) (191707.png): Left nav General Account Privacy Billing Capabilities Memory Reflect Time and focus Claude Code System Extensions Developer Skills Connectors, right Appearance Theme options system/sun/moon, Chat font Anthropic Serif, Transcript size Small/Medium/Large, Width Narrow/Medium/Wide, Motion System/Reduced, Voice Language English, Style Buttery, Speed Normal
- [ ] Menu bar (191558.png): File Edit View Go Help — Electron menu
- [x] User menu UI (source/build/mocked browser; official-service actions honestly unavailable) (191608.png): nishadislamutso@gmail.com, Settings, Language, Get help, Upgrade plan, Get apps and extensions, Learn more, Get API keys, Log out
- [x] Apps and extensions modal UI (source/build/mocked browser, not connected official integrations) (191636.png): Do more with Claude everywhere you work, Claude Code Terminal VSCode etc, Microsoft 365, Chrome extension

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

## 13. Acceptance Checklist — actual implementation evidence

`[x]` = evidenced only within the scope written here; `[ ]` = unfinished/unverified, even if a template or earlier plan exists.

- [x] Active app named AI ASSistant, mandated dark palette/sidebar/composer, screenshot-led web layout and menus/dialogs. **Not confirmed exact Windows pixels.**
- [ ] Native Windows title bar/window controls, File/Edit/View/Go/Help and installer; current build BAT is web dist.
- [x] Bounded feature inventory/status in target README and handover; no all-Claude parity claim.
- [ ] Exhaustive official-Claude feature audit/parity and user confirmation.
- [x] Per-chat history/reload/Stop/error/partial persistence, storage recovery/legacy IDs, originals not wiped; verified with mocked browser, not real model quality.
- [x] Existing local Ollama tags/show model discovery and selected metadata verification; no download/auto-switch/cloud alias/wildcard origins. Unsupported options disabled honestly; no fake thinking.
- [x] UTF8 byte-safe NDJSON with done/errors; conservative12k-character request guard/4096context. Not an exact tokenizer or unlimited cognition.
- [x] Explicit-request/mode-only HTML/SVG artifact Preview/Code/local versions/import/download/library; opaque sandbox + CSP, tested parent/fetch/external and same-origin API navigation denial. No shell/React/CDN/publish runner; downloaded originals unsandboxed.
- [x] Actual text/verified-vision payloads and original attachments in IndexedDB/vault; 4max,64KB/12ktext,2MBimages; PDF/Word unsupported. Real vision/VRAM performance remains open.
- [x] Canonical repository Obsidian-vault API, immutable originals/revisions/dedup/paths/realpath/Dhaka dates, temporary-vault tests; no authoritative SQLite added.
- [x] Visit metadata distinct from readable content; no reading/agreement inference; inaccessible logs in both required locations.
- [x] Initial capsule/entity keyword library, typed drag/drop/exact-content preview, explicit send, local Cook preview/cancel; not full memory graph or Capsule Hub.
- [x] Vault blacklist editor stores editable/revocable domain/URL/globs in Privacy/Source Scope, archives previous documents, tests capture skips. **Browser never-check synchronization before observations remains open.**
- [x] Local appearance/transcript/motion/project/chat controls wired; billing/voice/official integrations unavailable, not fake services.
- [x] Model-authored remote Markdown images blocked; external links show exact URL/path/query and require navigation approval. No cloud AI provider enabled.
- [x] Windows scripts in source with existing-service/readiness/dependency probes and no model downloads/native compiler/wildcard settings. **Not cmd.exe/laptop tested.**
- [x] 42 Node/API tests and22 mocked-browser tests pass; production build and final DPR-aware visuals reviewed.
- [ ] User's real qwen2.5:3b tags/show/replies/speed/RAM and Windows BAT execution confirmed.
- [ ] Extension default check-all/all-AIs after one-time permission verified; never-check scope enforced before URL/history/DOM access, offline queue reliable on non-2xx/malformed responses.
- [ ] Extension→app API→real Obsidian E2E capture, original attachments and inaccessible logging; no universal access claim.
- [ ] Complete Capsule project library/editor/goals/constraints/decisions, branches/rollback/files transfer; Quillbot assistance in real third-party fields.
- [ ] Laptop folder/app access explicitly scoped/visible/revocable and tested.
- [ ] Automated evidence-aware entities/events/claims/decisions/relationships, ambiguity/review workflow, Current Snapshot/Open Loops implemented; templates alone are not implementation.
- [ ] Source-linked Today/Dhaka journals/follow-ups and sensitive opt-in cadence/skip/snooze/stop; never invent offline events/feelings or resolve by silence.
- [ ] User-triggered monthly last60days+linked older dry-run audit with approval and distinct archive/expire/forget-derived/delete-source controls.
- [ ] Comprehensive secret/draft/token/sensitive-URL/incognito collection audit for all extension/import adapters; policy accepted, not universally verified.
- [x] Local-only default, source originals preserved on local-chat delete, no unsupported personal facts/name-from-path/automatic Arena import.
- [x] Local commits allowed; source pushed only after the explicit user request for PR #9 (open against main, not merged). Runtime vault edits kept intact/unshared. New runtime notes ignored by default, tracked-template edits still reviewed selectively.
- [ ] Full external-send receipt/approval workflow across future providers/extension/backup integrations; no blanket approval.
- [x] Beginner next step is one action: extract into a new folder; no reinstall/pull or entire checklist at once.

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

### [2026-10-10 continuation] Added implementation/evidence boundaries and repaired target
- Restore screenshot account/settings/apps UI; actual local model selector/capabilities, per-chat streaming/history/Stop, real upload/thinking, explicit isolated HTML/SVG runner.
- Canonical source API/path/date/originals/retry/deny fixes, initial capsule library/drop/Cook, stored blacklist/revocation; labels distinguish API deny from browser never-check.
- New safety requirements exercised: no model-authored remote image fetch; exact HTTP(S) link approval; cloud models/remote proxy targets blocked; whitelisted same-origin JSON proxy; parent CSP blocks same-origin API frame navigation too.
- Correct fresh Narrow width and native1920×1020 reference dimensions/DPR comparison assumption; system font fallbacks and native/user parity unverified.
- Correct old checkbox overclaims: native installer, extension E2E, full Capsule/Quillbot, Today/journals/follow-ups/monthly audit and comprehensive capture-safety audit are unfinished.
- New source tests/build/visual evidence; source ZIP exporter refuses private committed vault changes, does not overwrite archives or send externally. Windows runtime and real model checks pending.
- Found local canonical-vault blacklist/activity/revision edits during preview (initiating action unconfirmed); retained, not reverted/staged/exported/pushed.

### [2026-10-10 final safety review] Approval and save acknowledgement edges
- Markdown exposes no external href before approval; middle-click/context-menu/new-tab cannot bypass exact destination preview. Normal/middle activation tested with no outbound request.
- Vault HTTP200 is not automatically success: require genuine ok/source or valid blacklist acknowledgement; skipped/failed/malformed writes show failure and keep the local original with retry. Current-driver proof added, extension failed-response queue remains pending.
- Final source build398.63kB JS/gzip123.06,34.20kB CSS/gzip7.73;42 Node/API +22 browser cases. ZIP preflight earlier62 checks superseded by latest64-check validation.

### [2026-10-10 final packaging] Verified runnable branch source
- Complete251file source ZIP, unchanged61file starter vault, no private runtime/caches/builds/credentials; CRC/all source hashes verified.
- Clean extraction with fresh npm ci, production build,42/42 Node+22/22 mocked-browser tests passes after final safety fixes. Final evidence-only documentation update leaves runtime source identical.
- No push/merge/native installer/real model/Windows confirmation; next beginner action remains extraction into a new folder.

## 2026-10-10 — user-requested pull request #9

The user explicitly requested opening a pull request for this branch. Reviewed committed source/docs were pushed to `origin arena/01199af1-ai-assistant`; [PR #9](https://github.com/NishadIslamUtso/AI-ASSistant/pull/9) is **OPEN**, targeting `main`, not merged. No committed `vault/AI-Brain/` changes are included. Uncommitted local vault policy/activity/revision edits remain intact and excluded. The build/42 Node+22 browser checks and validated runtime code are unchanged; this publication records workflow metadata only. The existing verified source ZIP remains a pre-PR documentation snapshot with identical runnable code. This approval is for this source PR, not a blanket authorization for private vault uploads or merging.
