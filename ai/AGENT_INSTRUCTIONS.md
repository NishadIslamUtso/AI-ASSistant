# AGENT INSTRUCTIONS — continuing AI ASSistant

**Updated:** 2026-10-10. This repository is Utso's memory/handover/living requirements, not a portfolio. Read before changing code.

## Mandatory read order

1. `NEW_SESSION_HANDOVER.md`.
2. `.ai/CONTEXT.json`, `.ai/STATE.json` (visible `ai/` is a synchronized mirror).
3. `00_LIVING_DOCS/REQUIREMENTS_LIVING.md`, `HANDOVER_LIVING.md`, `TODO_NEXT.md`.
4. `00_LIVING_DOCS/ARCHITECTURE_LIVING.md`, `TESTING_CHECKLIST.md`, `BRANCH_TESTING.md`.
5. `spec/CLAUDE_SPEC_FROM_SCREENSHOTS.md` and the six actual191547–191707 references (native1920×1020, viewer scales them).

## Target and roles

Work in **apps/01_claude-exact-pixel-clone/**, app0.2.0, React/Vite + canonical API. Electron v6 is reference only, not the active implementation or proof of native parity.

**App = driver. Vault = canonical Obsidian Markdown organizer/memory. Extension = collector/context suggester.** SQLite, if introduced, is rebuildable only. Do not silently create a competing app-local vault.

This Arena session is fixed to **arena/01199af1-ai-assistant**; never switch/create/push another branch. Local commits are allowed. Remote Git push/cloud sync is external send: review exact destination/content and get approval. No private vault push automatically. No push/merge occurred in this continuation.

## Living memory rule — every change

Update REQUIREMENTS_LIVING, CHANGELOG, HANDOVER_LIVING, `.ai/STATE.json`, `memory/sessions/<date>-session.md`, and relevant testing/architecture/todo/spec docs. Copy `.ai/{AGENT_INSTRUCTIONS.md,CONTEXT.json,STATE.json,INDEX.json}` to visible `ai/` after any update. Source/build/tested/user-confirmed are different statuses; templates/plans are not shipped functionality.

## Standing user constraints

- Claude exact layout from six screenshots, not loosely inspired. Dark default main#1a1a1a, sidebar260CSSpx#202020, composer#242424. Native Windows title bar/controls/File/Edit/View/Go/Help ultimately required; web may hide native menu. No native/user-confirmed pixel claim yet. Font fallbacks and assumed1280×680CSS/DPR1.5 comparison are not verified Windows fonts/DPI. Fresh widthNarrow588 is selected in the actual reference; Medium768/Wide960.
- Use **already-installed Ollama + already-pulled qwen2.5:3b**. No model downloads/reinstallation/auto-switch by default. Handle already-running Ollama. BAT must work without native compiler tools on Windows11/TUF A15/Ryzen7/8GB RAM/RTX3050 4GB/500GB/slow downloads. Do not promise larger models/frontier intelligence.
- No wildcard `OLLAMA_ORIGINS` advice for this app: relative browser APIs + local proxy remove that need. Proxy targets are loopback-only, remote/cloud models disabled, selected metadata verified before chat. Capabilities come from metadata, not model names; never fake thinking.
- Default authorized capture: check all accessible sites/all AIs after one-time permission, default allow/explicit deny. Inaccessible: quietly log **wasn't accessible - reason** in both09 Activity & Undo and01 Inbox/Processing Errors; no popup/permission request per inaccessible source. Explicit collect only when instructed (context menu/pasted URL).
- Editable/revocable never-check URL/domain/glob blacklist in Privacy & Access and connector Source Scope excluded_patterns; denied sources must never be checked. API deny alone does not prove extension never-check; synchronize browser scope **before URL/history/DOM observation**.
- Never collect passwords/cookies/tokens/payment fields, unsent third-party composer/form drafts, hidden keystrokes or continuous screenshots. Incognito off unless separately authorized. Comprehensive extension/import/URL-secret audit is pending; do not claim universal safe capture.
- Extension combines Capsule Hub (project library, goals/constraints/background/decisions/files, drop/inject/versions/branches/rollback/attachment transfer/Cook) and Quillbot (background-ready text-field/highlight/toolbar/inline assistance, no tab switching), local-only/no external account. Current preview/drop/Cook is only an initial subset.
- Keep originals until user deletes. No silent destructive rewrites/deletion, arbitrary commands/posts/irreversible actions. Source-linked, evidence-aware memory. Journal drafts never invent offline events/feelings; silence does not resolve follow-ups. Sensitive cadence opt-in; monthly review user-triggered dry-run with approval.
- External uploads/injections need exact-content/destination preview and per-send approval. Model-authored remote Markdown images blocked; links require explicit URL preview/approval. Artifact preview stays opaque/CSP-bound; no same-origin/CDN/raw SVG/shell runner or fake publish. Downloaded original HTML is not sandboxed.
- Name is **Utso**, provided by user. Do not infer it from Windows paths. Arena chats are not automatically imported.
- Give Windows beginner **one step at a time**, wait for result; do not ask them to repeat documented requirements or run a full checklist at once.

## What is actually tested / next

Latest build + **41 Node/API tests + 21 mocked-browser tests pass**. Real laptop Ollama/Windows/BAT/vision/performance, extension E2E, user exact-pixel approval, full Capsule/working memory, Today/journals/follow-ups/monthly audit, and native installer remain pending. Read TODO_NEXT, not old checked boxes or v6 feature lists.

Do not clear localStorage/chat_history/vault to fix an old game loop. Simple no-game prompt + explicit-current-request artifact gate is implemented. Start a new chat if old context is unhelpful while retaining originals. Storage recovery copies exist; latest capture-status guard prevents older responses overriding newer status.

## Source packaging and data boundary

Use `node scripts/package-source.cjs` (or safe .sh/.bat wrappers) after a selective reviewed **local source commit**. It packages committed HEAD, requires the unchanged approved starter vault, refuses dirty source/private committed vault changes, and never overwrites an existing ZIP or sends externally. Source ZIP must contain all runnable source before merge. A downloaded source ZIP requires Node for the app, not Git to launch, and is not an installer/private-data backup.

During final review, uncommitted canonical-vault blacklist/activity/revision edits were found from while preview ran; initiating action unconfirmed. Leave them intact, outside staging/packaging; do not attribute, revert, delete or auto-upload them. New runtime vault data is ignored by default, but existing tracked templates can still be modified: never blanket-stage/push.

For dev: target README has commands. API defaults canonical repository vault and loopback8765, refuses missing root; Vite5173 proxies localhost services. Tests use disposable vaults/API18765/Vite5174 with mocked models. A hosted preview cannot reach the user's laptop Ollama. Never disable browser web security/site isolation to make artifact tests pass.
