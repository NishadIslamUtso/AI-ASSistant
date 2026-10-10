# HANDOVER_LIVING — current state and gaps

**Updated:** 2026-10-10, Asia/Dhaka · **Repo:** NishadIslamUtso/AI-ASSistant · **Arena branch:** `arena/01199af1-ai-assistant` · **App:** 0.2.0.

## 1. Scope and truth

Utso wants an exact Claude-desktop layout from six screenshots, a local Ollama driver, real Obsidian `AI-Brain` as canonical memory, and a browser collector/suggester with Capsule Hub + Quillbot behavior. Use existing qwen2.5:3b on the Windows 11 TUF A15 (8 GB RAM / RTX3050 4 GB). No model download or frontier-model intelligence claim.

Active work is **`apps/01_claude-exact-pixel-clone/`**. The Electron v6 app is **reference only**, unchanged. This turn repaired foundations, restored screenshot dialogs, added a gated artifact runner/model selection/uploads/thinking, and implemented initial capsule/vault controls. It did **not** complete the whole product or all Claude features.

## 2. Verification actually performed

| Layer | Evidence | Not implied |
|---|---|---|
| Source/build | Vite production build passes; 1752 modules; JS398.63kB (gzip123.06), CSS34.20kB (gzip7.73) | Windows BAT execution, installer, real model performance |
| Unit/API | **42/42 Node tests pass** | Universal extension access or real user's source capture |
| Browser | **22/22 Playwright tests pass**, Chromium153, mocked Ollama, disposable API18765/Vite5174 | Real qwen2.5:3b/vision/thinking behavior |
| Visual | Final Home/User menu/Settings/Apps captures reviewed; zero page errors | User-confirmed exact pixels or confirmed laptop DPI/fonts |
| ZIP | Source packaging/fresh-extraction checks are recorded in `BRANCH_TESTING.md` | A Windows installer or a private-data backup |
| User/laptop | **Not verified** | Do not mark user-confirmed/native parity |

Earlier 13/14 run and targeted Pin fix are superseded by the complete passing 22-test run. Browser security/site isolation was not disabled. Tests use temporary vaults and synthetic fixtures. Canonical vault policy edits found during preview are separate, initiating action unconfirmed, and are retained/uncommitted/unshared.

## 3. Current implemented behavior

- Sidebar/search/chat context actions, account menu, screenshot-shaped Settings and Apps dialogs, focus trap/Escape/restore, persisted appearance/transcript/motion, local projects. Official Claude billing/integrations/voice remain visibly unavailable; native File/Edit/View/Go/Help is deferred.
- Reference files are **1920×1020**, not the viewer's 1568×833 previews. Compare at **1280×680 CSS / DPR1.5** (assumption only). Dark palette remains mandated #1a1a1a/#202020/#242424, sidebar260CSSpx. Fresh width **Narrow588**, Medium768, Wide960; greeting30/mark28. Fonts are OS/Georgia fallbacks; no licensed Anthropic font supplied.
- `/api/tags` discovers installed local models, `/api/show` verifies selected metadata before send. No name-based vision/thinking guesses, model auto-switch, downloads, wildcard origins, or cloud aliases. Unknown/offline models preserve the draft and give an error.
- Per-chat streamed messages/history, Stop and five-minute timeout, actual thinking field/tags separated from final reply; no fabricated thinking. Context4096, conservative12k-character refusal rather than client-side history trimming (not an exact tokenizer).
- Explicit-current-request/mode HTML/SVG artifacts only: Preview/Code, local versions, edits, download/import/library. Opaque sandbox + child CSP; parent `frame-src 'none'` also blocks external **and same-origin API** navigation. No shell/CDN/React bundler/fake publish. Downloaded originals are not sandboxed; edited/imported artifact versions are currently browser-local.
- Text/code≤64KB/12k chars; PNG/JPEG/WebP≤2MB only verified vision; 4 uploads max. Actual content/base64 in request, IndexedDB image originals, submitted files also captured in immutable vault source attachments. PDF/Word unsupported.
- Originals captured immediately, final/partial/error snapshots preserved, deduplicated retries, latest capture-status guard. Legacy title-only chats migrate without wiping; malformed JSON/schema has recovery backups. Screenshot titles are empty UI placeholders, not imported evidence. Local delete preserves vault originals.
- Canonical API8765: immutable source IDs/digests, validated paths/realpath containment, Dhaka dates, visit-only distinction, inaccessible logs in both required folders, keyword capsule/entity retrieval. Latest archived capsule versions no longer resurrect old active versions.
- Capsule reading/search, typed drag/drop, exact context preview before insertion; explicit Send only. `Cook This Prompt` retrieves local keyword matches and previews without replacing the draft. Vault deny editor synchronizes Privacy/Source Scope and revision backups, including removal from frontmatter/all YAML blocks.
- Markdown images never fetch model-controlled URLs. HTTP(S) links show exact URL/path/query and require approval before external navigation.
- Windows scripts use existing Ollama/model/API readiness probes, dependency/lock checks and optional prebuilt Rollup repair. They do not install models, kill Ollama or need native compilers. Quoted Node version expression corrected. **Real cmd.exe run remains pending.** Build BAT is web dist only.

## 4. Local runtime and test commands

See the target README and `TESTING_CHECKLIST.md`. Browser APIs are relative. Vite proxies only whitelisted driver endpoints to loopback11434/8765, rejects foreign-origin/non-JSON writes, strips cookies/authorization, and strips Origin only on local Ollama server-to-server calls. Overrides are loopback-only. Never suggest `setx OLLAMA_ORIGINS "*"` for this target.

Server vault defaults to repository **`vault/AI-Brain`**, or explicit existing `AI_BRAIN_VAULT`. It refuses a missing vault. Windows API default bind is127.0.0.1. Sandbox preview alone uses0.0.0.0/preview origins; it cannot access the user's laptop model.

## 5. Next work — unfinished, preserve order

1. **Laptop verification / final pixel pass:** one beginner step at a time. Check existing model, startup/ports, reply/reload/Stop and all screenshots at actual Windows DPI/fonts. Do not reinstall or wipe localStorage/vault.
2. **P6 extension→vault:** real unpacked Chrome E2E. Replace substring deny matching and synchronize canonical scope **before history/DOM checks**. Offline queue must retain records on non-2xx/malformed responses. Check never-collect fields/drafts/incognito, two-location silent failures, original attachments and exactly-approved external injections. Backend deny is NOT browser-side never-check proof.
3. **P7 full Capsule Hub:** project library/editor/goals/constraints/decisions/files, source-linked branches/rollback/attachment transfer, blacklist sync, Open Loops, Current Snapshot. Initial preview/drop/Cook alone is not completion.
4. **P8 Today/journals/follow-ups:** actual sourced Dhaka drafts; no offline-event/feeling invention. Sensitive cadence opt-in, skip/snooze/stop; silence unresolved. Monthly audit remains user-triggered dry-run work.
5. **P9 native Windows:** thin safe wrapper, native title bar/menus and installer; keep source ZIP testable before merge. No native compiler assumptions or automatic large installer/model downloads.

Do not enable dangerous same-origin raw SVG/HTML, remote image fetching, shell runners, CDNs, unapproved external model calls, destructive source cleanup, or public vault pushes to speed up parity.

## 6. Source/data/Git continuity

`NEW_SESSION_HANDOVER.md` now exists. Living requirements/status/log/testing docs and `.ai`/visible `ai` must stay synchronized every change. Local source commits are allowed. **No push/merge** without destination/content approval; stay on the fixed Arena branch.

Current canonical vault contains local blacklist/activity/revision edits found while preview ran. Origin of the edits was not confirmed. They are intentionally **not reverted, staged, packaged or uploaded**. New runtime vault files are ignored by default; existing tracked templates still require selective staging. Source exporter packages a reviewed local HEAD only and refuses a HEAD that differs from approved starter vault. Its ZIP is runnable source plus committed starter templates, not a private-vault backup.

### Final-review edge fixes
Middle-click/context-menu/new-tab cannot bypass external-link preview because no external href is exposed before approval. HTTP200 lacking a genuine saved-source acknowledgement is a capture failure, not Saved; the local original/retry remains.42 Node/API and22 browser cases include these checks. Cross-window live state synchronization is not implemented/tested; do not claim live multi-window merge parity.

### Final source ZIP evidence
Verified c512e5a code snapshot:251files,CRC/all blob hashes, clean npm ci/build/42Node+22browser tests. Final delivered ZIP adds only documentation evidence, runtime/source bytes match; private canonical changes excluded. Source path deliverables/AI-ASSistant-branch-source.zip (~3.03MB), not installer. Local source commits only, no remote push/merge.
