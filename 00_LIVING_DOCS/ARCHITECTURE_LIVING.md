# ARCHITECTURE_LIVING — driver / vault / extension

**Updated:** 2026-10-10 · **Active target:** `apps/01_claude-exact-pixel-clone/` v0.2.0.

## Current implemented path

```text
Browser / future native renderer
  React: sidebar + screenshot dialogs + composer + per-chat transcript
  useModels → installed /tags and selected /show; local verification, no cloud
  useChat → NDJSON /chat; history, Stop, bounded context, original/final capture
  localStorage → rebuildable UI cache (chats, settings, grouping, artifacts)
  IndexedDB → local image originals pending/submitted
    |
    | relative same-origin /api/ollama and /api/vault
    v
Vite driver proxy (5173)
  loopback-only targets, endpoint allowlist, JSON + same-origin writes
  strips cookies/authorization; removes Origin only for local Ollama calls
    |                             |
    v                             v
Existing Ollama11434         canonical vault API8765 (Express)
  existing qwen2.5:3b          default root: repository vault/AI-Brain
  capabilities verified       explicit AI_BRAIN_VAULT → existing root only
  no downloads/auto-switch    realpath containment, no arbitrary read/shell/delete
    |                             |
    | streamed response           | immutable originals + revision/activity records
    v                             v
Chat/HTML-SVG artifact        Obsidian Markdown/source attachments (canonical)
  opaque allow-scripts frame  02 Sources, 03 Memory capsules/entities, 09 Activity
  restrictive child CSP       Dhaka dates, source IDs/digests, retry dedup
  parent frame-src 'none'      visit metadata ≠ reading/agreement
  no network/parent/API       inaccessible → Activity + Processing Errors
```

A hosted preview runs on the sandbox, not the user's laptop. The API defaults to loopback on Windows; `0.0.0.0`/preview origins are sandbox-only opt-in.

## Active source map

- `src/App.jsx`: orchestration, persisted appearance/model/projects, views, dialogs, approved context, external-link preview.
- `src/hooks/useModels.js`: abort-safe tags/show refresh, installed-local verification, capability controls.
- `src/hooks/useChat.js`: per-chat generation, immutable submitted-source capture, partial/final capture, latest-status tokens; one concurrent generation.
- `src/hooks/usePersistentState.js` / `src/lib/storage.js`: schema normalization, legacy title-only migration, corrupt-state recovery without clearing originals.
- `src/lib/ollama.js`: byte-safe NDJSON, selected-model request, capability/remote metadata, simple no-game prompt, actual thinking separation.
- `src/lib/artifacts.js`: explicit-current-request gate, HTML/SVG extraction and isolated preview document.
- `src/lib/attachments.js`: size/type validation, original text, vision gate, IndexedDB/base64; PDF/Word unsupported.
- `src/components`: screenshot menus/dialogs, model selector/composer/transcript, isolated artifact workbench/library, capsule/vault and blacklist panels.
- `server/vault-api.cjs`: canonical reader/writer, validation/containment, immutable IDs, latest-version index, patterns/revisions/logging.
- `server/proxy-policy.cjs`: loopback destination validation and frontend API boundary. Browser model-pull/delete/shell routes are not exposed.
- `server/check-{deps,service}.cjs` and BAT launch/build: existing-service/readiness/dependency probes, web build only.

## Actual vault API

| Method/path | Implemented responsibility |
|---|---|
| GET `/`, `/health` | Health and actual root |
| GET `/context?q=…` | Local keyword-ranked current capsules/entities, source paths; not vector/general-graph search |
| GET `/capsules` | Latest active versions; archived/expired/superseded latest versions excluded without resurrecting old versions |
| GET `/blacklist` | Union of Privacy & Access / Source Scope excluded patterns |
| POST `/blacklist` | Set/add/remove, synchronized YAML/frontmatter, immutable old-document revisions; best-effort rollback on write failure |
| POST `/capture` | Validated conversation/page/visit/error/capsule sources, original attachments; denied URL skips capture |

There is no implemented `/today`, `/command`, `/capsule` mutation route, arbitrary-path reader, source deletion, model install, shell execution, cloud publish, semantic graph promoter or SQLite service. Do not use older architecture proposals as evidence of implemented endpoints.

## Source versus caches

Markdown and original attachment files are canonical. SQLite would be a **rebuildable index only**; none is added here. Capture keeps full original text, timestamps, actual thinking and explicitly approved context; identical retries deduplicate, revisions coexist, local chat deletion does not delete source files.

Browser draft state is local UI cache, not vaulted before submission. Artifact imports/source-edit versions and project grouping are currently browser-local; complete canonical artifact/project indexing remains future work. A finite-context bundle is not the full vault or unlimited model cognition. The 12k-character guard is conservative, not an exact tokenizer.

## Privacy/action boundaries

- All AI execution is local; cloud Ollama entries are disabled and remote proxy targets refused.
- Model-authored Markdown images are blocked, raw chat HTML is not executed, links require exact destination/path/query approval.
- Artifact srcdoc can run JS/CSS only inside its opaque sandbox. Child CSP denies network/forms/nested frames; parent CSP denies **all frame navigations**, including same-origin API endpoints. Saved original downloads are not sandboxed outside this app.
- Capsule/drop/Cook shows exact content/source paths before insertion, and insertion does not send. External extension injections still need per-destination/send approval in the future full flow.
- API deny does not prove extension **never checked** a source. Browser history/DOM checks must enforce canonical deny before observation, with synchronization and offline/error handling still pending.
- Never collect passwords/cookies/tokens/payment fields, unsent third-party drafts, keystrokes/continuous screenshots; incognito off unless separately authorized. Journals may not invent events or feelings.
- Remote Git push is external send. Source packaging exports reviewed local committed code plus unchanged committed starter templates; live/runtime vault changes are excluded/refused, not auto-uploaded.

## Planned architecture (not shipped)

Extension→canonical-scope synchronization and verified capture queue; full project Capsule Hub/editor/branches/rollback/files; evidence-aware temporal graph/review; Current Snapshot/Open Loops; Today/Dhaka journal/follow-ups; user-started monthly audit dry-run; native wrapper/preload/menu/title bar/installer. Refer to living requirements for accepted behavior, not claims that these are done.
