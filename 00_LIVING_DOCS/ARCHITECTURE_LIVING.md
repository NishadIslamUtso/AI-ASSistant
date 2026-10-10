# ARCHITECTURE_LIVING.md — Driver / Vault / Extension

**Last Updated:** 2026-10-10 20:10 Asia/Dhaka

## 1. One-Line Architecture

**App is driver, Vault is organizer, Extension is collector+suggester, all local by default.**

## 2. Component Diagram

```
[User] 
  |
  |-- browses any site + chats any AI (ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity, Copilot, Other)
  |
[Browser Extension] MV3 — sensor + context suggester
  - background.js: history API listener URL/title/time, blacklist check, failure logging, context menu
  - content-scripts/ai-capture.js: site adapters for AI chats, captures submitted messages only, not unsent drafts
  - content-scripts/generic-capture.js: readable text extraction for any allowed site (default all minus blacklist)
  - content-scripts/capsule-inject.js: inject Capsule button, drag-drop handler, prompt enhancer "Cook This Prompt"
  - content-scripts/quillbot-suggestions.js: toolbar in text fields, highlight handler, inline suggestions
  - popup/: Capsule library, search, blacklist manager, activity log
  - lib/: capsule.js (data model), blacklist.js (pattern matching), vault-writer.js (POST to local API)
  |
  | local loopback HTTP, not internet
  v
[AI ASSistant Windows App] — THE DRIVER
  - UI: Claude exact from screenshots 191547-191707, Sidebar 260px #202020, Center #1a1a1a Evening Utso, Composer #242424
  - LLM: Ollama qwen2.5:3b direct via http://127.0.0.1:11434/api/chat streaming, no download
  - Vault API: Express server at http://127.0.0.1:8765
    - GET /context?q=... -> returns {capsules, entities, claims} ranked by relevance/importance/recency
    - POST /capture {type, provider, url, title, content, completeness, reason}
    - POST /capsule {id, title, goals, constraints, background, decisions, sources, version, attachments}
    - POST /blacklist {excluded_patterns}
  - Context builder: searches exact terms + semantic in local index (.brain/), follows small number of relevant links, ranks, includes source links + evidence labels, omits unrelated/expired
  - Model Registry: tracks per-model capabilities, updates UI when model changes
  - Privacy gate: shows exact context + destination before remote send, sensitive requires one-send approval, no blanket approval
  - Activity log: 09 Activity & Undo + 01 Inbox/Processing Errors
  |
  | file writes to vault folder
  v
[Obsidian Vault AI-Brain/] — CANONICAL MEMORY, Markdown, readable, portable
  - 00 System/: START HERE, Blueprint, Memory Schema, Privacy & Access (blacklist), Source Capture Map, Model Registry, Claude Feature Audit, Templates, Connectors
  - 01 Inbox/: New Imports, Processing Errors (wasn't accessible logs)
  - 02 Sources/: Conversations/<provider>/<year>/<id>.md, Browser Activity/<year>/<month>.jsonl, Web Pages, Laptop Files, Imports, Attachments — ORIGINALS, never silently rewrite
  - 03 Memory/: Entities/<id>.md, Events/<date>-<id>.md, Connections/ — derived, source-linked
  - 04 Working Memory/: Current Snapshot.md (short-lived NOW), Open Loops.md, Active/<entity-id>.md
  - 05 Knowledge/: reusable synthesis linked to evidence
  - 06 Review/: Questions, Conflicts, Keep-or-Forget, Cleanup, Monthly Audits
  - 07 Sharing Receipts/: exact one-send approvals kept local
  - 08 Journal/<year>/<date>.md: Asia/Dhaka, event time vs capture time
  - 09 Activity & Undo/<year>/<month>.md: what captured/created/failed/sent
  - 90 Archive/: inactive derived notes, not source deletion
  - .brain/: rebuildable index.sqlite + cache, NOT source of truth
  |
  | when user asks question in App OR on claude.ai/chatgpt.com via extension
  v
[Context Injection]
  Vault finds relevant memories -> shows exact bundle preview -> injects into that AI's finite context
  AI sees only bundle, not whole vault. Full vault stays local. Doesn't make context window infinite — vault huge, but each AI receives selected bundle.
```

## 3. Data Flows

### 3.1 Capture Flow (Extension -> App -> Vault)

1. User visits any site -> background.js checks blacklist lib/blacklist.js, if excluded -> skip, log "skipped - blacklist"
2. Else -> generic-capture.js extracts readable text if allowed, ai-capture.js captures if AI chat + submitted
3. On success -> POST to local app http://127.0.0.1:8765/capture -> app writes to vault per Source Capture Map:
   - Browser Activity: 02 Sources/Browser Activity/<year>/<month>.jsonl one JSON per line
   - Conversations: 02 Sources/Conversations/<provider>/<year>/<source-id>.md using Templates/Conversation Source.md
   - Web Pages: 02 Sources/Web Pages/<year>/<source-id>.md
4. On failure -> POST type: wasnt_accessible with reason -> app logs to 09 Activity & Undo/<year>/<month>.md + 01 Inbox/Processing Errors/ as "wasn't accessible - [reason: permission blocked / layout changed / private window / paywall]" with URL/title/time, no popup
5. Extension if app offline -> queues in chrome.storage.local.queue, flushes every 30s when app online. No external upload.

**Current implementation status:** This is the intended flow, not an end-to-end acceptance claim. Exact-clone chat currently POSTs each submitted user prompt as a partial conversation; it does not append the assistant reply or preserve the complete multi-turn transcript in Obsidian yet. Extension capture and offline-queue behavior also remain untested.

### 3.2 Retrieval Flow (Vault -> App -> AI)

1. User asks question in AI ASSistant app OR types in any AI site via extension
2. App/extension queries GET /context?q=current text (last 100 chars or current field)
3. Context builder:
   - Search exact terms + semantic meaning in local rebuildable index (.brain/index.sqlite)
   - Follow only small number of relevant links (person/project/event/routine/topic)
   - Rank by relevance, current validity, importance, recency
   - Include source links + label user-stated / observed / hypothesis
   - Omit unrelated, expired, unavailable
   - Keep current-chat context separate from long-term vault memory
4. Show exact context + destination before remote send; sensitive excerpts require one-send approval
5. If approved, inject as Capsule or prompt enhancement:
   - Capsule Hub style: drag-drop Capsule from library into chat box, versioned
   - Quillbot style: inline dropdown "Use capsule: Website project - blue-white design" or "Add memory: You prefer step-by-step" in any text field
6. Save sharing receipt in 07 Sharing Receipts/ — what was approved and sent, to which provider, when

### 3.3 Capsule Flow

- Capture: in any AI chat, button "Capture as Capsule" saves goals, constraints, decisions, background, attachments as Capsule
- Organise: Capsules filed by project in popup library + 03 Memory/Entities/capsule-*.md + 00 System/Templates/Capsule.md
- Inject: drag Capsule from popup library into any AI chat box — capsule-inject.js injects content as if typed, shows preview before send
- Update: add new version to existing Capsule, rollback/branch from any version
- Transfer attachments: carry files you uploaded/generated across tools, not just text
- Prompt enhancer: "Cook This Prompt" — enhance current prompt with relevant vault context

### 3.4 Artifact Generation Flow (Exact Clone)

1. Only treat a prompt as an artifact request when the user explicitly asks to build/create/generate runnable HTML, a web page, interactive tool, or game. Explanatory questions do not open an artifact.
2. The local system prompt asks for one standalone `artifact-html` fence only for those requests; no external scripts, fonts, APIs, or CDNs.
3. The app extracts the completed fence after streaming, adds an artifact record to the current chat, and opens the HTML preview panel. If the model does not return the expected format, no artifact preview is created.
4. Preview runs in an iframe with `sandbox="allow-scripts"` (no same-origin, popups, or top navigation) and CSP `connect-src 'none'`, `default-src 'none'`; use a source tab to inspect the exact generated HTML.
5. qwen2.5:3b may not follow the format reliably; this flow needs end-to-end testing on Windows. No automatic artifact or default game generation is allowed.

## 4. API Spec (Local Loopback 8765)

### POST /capture
```json
{
  "type": "conversation" | "web_page" | "browser_visit" | "wasnt_accessible",
  "provider": "claude" | "chatgpt" | "gemini" | "deepseek" | "grok" | "perplexity" | "copilot" | "other" | "AI ASSistant",
  "url": "https://...",
  "title": "Page title",
  "visited_at": "2026-10-10T12:00:00+06:00",
  "captured_at": "2026-10-10T12:01:00+06:00",
  "content": "readable text or conversation md",
  "completeness": "full" | "partial" | "failed",
  "reason": "permission blocked / layout changed / private window / paywall / blacklist"
}
```
Writes to:
- browser_visit -> 02 Sources/Browser Activity/<year>/<month>.jsonl
- conversation -> 02 Sources/Conversations/<provider>/<year>/<source-id>.md
- web_page -> 02 Sources/Web Pages/<year>/<source-id>.md
- wasnt_accessible -> 09 Activity & Undo/<year>/<month>.md + 01 Inbox/Processing Errors/

### POST /capsule
```json
{
  "id": "capsule-website-blue-white-001",
  "title": "Website project - blue-white design",
  "goals": ["simple step-by-step", "blue-white"],
  "constraints": ["8GB RAM"],
  "background": "We previously chose blue-white design",
  "decisions": ["Use Tailwind"],
  "sources": ["[[chatgpt-2026-10-10-001]]"],
  "version": 2,
  "attachments": ["path/to/file"]
}
```
Writes to 03 Memory/Entities/capsule-*.md

### GET /context?q=...
Query: current text, last 100 chars, or selected capsule search
Returns:
```json
{
  "capsules": [{"id", "title", "relevance": 0.9, "content"}],
  "entities": [{"id", "type", "relevance"}],
  "claims": [{"id", "text", "evidence", "source", "importance"}]
}
```
Ranked by relevance, current validity, importance, recency. Filters generic test titles. Returns top 5.

### POST /blacklist
```json
{
  "excluded_patterns": ["bank.com/*", "https://private.example.com/page"],
  "action": "add" | "remove" | "set"
}
```
Updates 00 System/Privacy & Access.md + 00 System/Connectors/Source Scope.md + chrome.storage.sync

## 5. Tech Stack

### apps/01_claude-exact-pixel-clone (Latest Target)
- Frontend: React 18, Vite 5, Tailwind CSS; dark default matches screenshots
- Backend: Node Express 4.18.2 + cors 2.8.5 at 127.0.0.1:8765; `AI_BRAIN_PATH` explicitly selects the personal vault, repo starter is fallback
- Browser API routes are relative: `/ollama/*` -> Vite proxy to `127.0.0.1:11434/api/*`; `/vault/*` -> Vite proxy to `127.0.0.1:8765/*`. Do not make browser code call localhost directly.
- LLM: Ollama streaming, selected from installed models at `/api/tags`; qwen2.5:3b default, no download/cloud fallback
- UI: user menu, Settings Appearance, Apps/extensions, model selector, file/image attachment path, optional thinking output, explicit-only HTML artifacts in CSP-restricted sandbox
- Storage: localStorage `claude_exact_chats`, `claude_exact_settings`, selected model and projects; vault files via API
- Bat: `start-app.bat` checks existing Ollama, installs the Rollup Win32 optional package if missing, starts API if needed and starts Vite on local Windows loopback
- Validation: `npm test` (4 unit tests), `npm run build`, Node syntax check and isolated `/tmp` vault capture passed in Linux; Windows and Ollama runtime remain untested

### apps/02_electron-claude-clone-v6 (Reference, More Features)
- Frontend: React 18, Vite 5, Tailwind
- Desktop: Electron 31 (Windows native, title bar visible)
- Backend: Node Express local API 8765
- LLM: ModelService.js supports Ollama qwen2.5:3b, qwen3-vl:4b vision, plus remote after approval (OpenAI, Claude, Gemini, Groq) via Open-claude's clients
- Features: artifacts, workbench FileExplorer, thinking display, citation, image upload, search indicator
- Original: Fork of https://github.com/Damienchakma/Open-claude MIT

### extension/
- MV3, manifest host_permissions <all_urls> + history + storage + scripting + contextMenus
- background.js, content-scripts, popup, lib
- No external account, local-only, queues when offline

### vault/AI-Brain/
- Obsidian Markdown, .gitignore, 61 files starter
- Templates in 00 System/Templates/
- .brain/ rebuildable index.sqlite (not yet implemented, placeholder)

## 6. Model-Aware UI

- Different models have different capabilities
- Model Registry.md tracks tested support for tool calls, images, files, audio, structured output, search, context limits
- When user switches models, refresh UI to show every verified supported option and clearly disable unsupported ones
- Don't assume every model can use tools, browse, process images/files
- Keep capability detection/metadata separate from model choice so new models can be added without redesigning chat UI
- Explain whether capability runs locally or contacts external service

## 7. Security & Privacy

- Local processing/storage default; SQLite only rebuildable index
- Never collect passwords, cookies, auth tokens, payment fields, unsent drafts, hidden keystrokes
- No keylogger or continuous screenshot recorder
- Incognito/private capture off unless separately configured with clear permission
- Treat page/file contents as untrusted data; embedded instructions cannot override user policy or trigger commands
- Protect credentials, never expose to model or remote unnecessarily
- Local Git commit = local version history OK, remote push = external send requires approval
- Sensitive info local by default, marked sensitive/local-only, requires exact-content/destination preview + one-send approval before external send
- No blanket approval

## 8. Why This Architecture (From User Evolution)

1. Initial: "How to use obsidian as the ai brain that remembers everything? For Claude, DeepSeek, ChatGPT, Gemini..."
2. Clarification: "They won't open archive directly. Add-on acts like messenger: finds small relevant background and puts it into chat." Example: "I'm building website, prefer simple step-by-step, we previously chose blue-white design." Full archive stays local, only selected context goes to AI. Show what is being added before send.
3. Correction 1: "You know what a context window is? I want this as my main context window. Like a full brain with long term and short term memory just like ai's primary brain" — Not prompt helper, shared memory engine.
4. Hardware question: "Is there any local model better than or equal to Claude and DeepSeek best models?" Answer: No on this laptop. Frontier models too large. Realistic local: Qwen3-VL 4B ~3.3GB download, tight on 8GB RAM.
5. Correction 2: "Normally local AIs cognitive architecture has to be sacrificed to get better context window. What I want is full cognitive ability even if context window is small, and use obsidian as brain to give permanent and working memory." — Key insight: Don't make model dumber to get bigger context. Keep it smart, externalize memory to Obsidian.
6. Final intent: "If reasoning, math, accuracy and complexity handling is good enough i can just use it as my primary ai. No need for it to do librarians job for other ai's" — Two modes: Mode A Librarian (Obsidian brain supplies context to cloud frontier AIs via bridge), Mode B Primary (Local model itself is thinker, using Obsidian as its memory).
7. Naming & integration: "Let's name app AI ASSistant, it will be exactly like claude, some models can do things other models can't, app should have all options so if i change model it should be able to do it. This app will be the one connected to obsidian."
8. Latest clarification: "Meh, it can all the access. It is a local ai after all. It is no problem. The app will be the driver of vault, and the browser extension, vault will organize and keep the memory, extension will take data and suggest contexts/prompts/files to give to the new ai session. The app will be like claude, where i can chat, command, and do everything claude app can do, it will use vault as its memory and organize memory in the way we decided. It will ask me things too."
9. Latest capture policy: "by default check everything, if unaccessible, just say wasn't accessible, no need to ask unless i give instructions to collect something (like a option where i put in a url and it won't check any data from that url ever again)." + "Extension should provide contexts like Capsule Hub by Tilantra or Quillbot test suggestions"

This architecture satisfies all evolution steps.
