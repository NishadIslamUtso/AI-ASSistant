# AGENT INSTRUCTIONS — For Any AI Continuing This Repo

**You are an AI taking over this repo. Read this before doing anything.**

## 1. What This Repo Is

This is NOT a normal human GitHub repo. It is **memory + handover + living requirements** for project AI ASSistant. Owner is Utso, single user, wants structure optimized for AIs, not human aesthetics. Human-readable polish secondary.

- **App = driver** (Claude exact UI, controls everything)
- **Vault = organizer** (Obsidian Markdown canonical memory, AI-Brain/)
- **Extension = collector + suggester** (browser, default check everything, Capsule Hub + Quillbot UX)

## 2. Mandatory Read Order

1. `.ai/CONTEXT.json` — who user is, hardware, constraints
2. `.ai/STATE.json` — what is built, what is broken, current bugs
3. `00_LIVING_DOCS/REQUIREMENTS_LIVING.md` — living truth, acceptance checklist
4. `00_LIVING_DOCS/HANDOVER_LIVING.md` — gaps, next steps
5. `00_LIVING_DOCS/ARCHITECTURE_LIVING.md` — driver/vault/extension flow
6. `spec/CLAUDE_SPEC_FROM_SCREENSHOTS.md` — pixel-perfect UI spec from 6 screenshots
7. `spec/screenshots/` — view the 6 actual screenshots (191547 to 191707)

## 3. Rules You MUST Follow

### Living Docs Update Rule (CRITICAL)
- **EVERY TIME you change code, requirements, architecture, or fix bug, you MUST update:**
  - `00_LIVING_DOCS/REQUIREMENTS_LIVING.md` — add dated entry, update checklist
  - `00_LIVING_DOCS/CHANGELOG.md` — log what you changed
  - `00_LIVING_DOCS/HANDOVER_LIVING.md` — update current state + gaps
  - `.ai/STATE.json` — update build status
  - `memory/sessions/<date>-session.md` — log session

If you don't update living docs, next AI loses memory. This is the whole purpose of repo.

### Constraints From User (Never Violate)
- Default capture = check everything by default across all sites + all AIs after one-time permission; if inaccessible, log "wasn't accessible - reason" in 09 Activity & Undo + 01 Inbox/Processing Errors, no popup/ask; explicit collect only when user instructs (right-click "Collect this page now" or paste URL to force).
- Never-check blacklist: user can paste URL/domain/pattern (e.g., bank.com/*) into Privacy & Access / Source Scope excluded_patterns to never check any data from that URL ever again; editable, revocable; default allow, explicit deny; stored in 00 System/Privacy & Access.md and 00 System/Connectors scope files.
- Extension UX = provide contexts like Capsule Hub by Tilantra (capture once as reusable Capsule with goals/constraints/background/decisions/attachments, library, drag-drop inject into any AI chat box, version/branch/rollback, transfer attachments, prompt enhancer "Cook This Prompt") and Quillbot (works in background ready when needed, works in any text field across web, highlight text or open toolbar for instant suggestions, real-time suggestions as you type, inline dropdown, no tab switching), local-only no external account required.
- Use already downloaded qwen2.5:3b directly, no download. Bat files must work on Windows TUF A15 8GB RAM 4GB VRAM, handle already-running Ollama, no native build tools.
- Dark default #1a1a1a, Windows title bar visible, Claude exact layout from screenshots, not loosely inspired.
- Never infer user name from Windows path. Arena.ai chats not auto-imported. No passwords/cookies/tokens/payment/unsent drafts collection.

### Code Rules
- Don't ask user to repeat requirements already in REQUIREMENTS_LIVING.md
- Give Windows instructions one step at a time, beginner-friendly
- Don't claim feature implemented because it appears in plan — mark planned/in source/compiled/tested/user-confirmed
- Keep original conversations/sources until user deletes, never auto-delete
- Local-first: no external upload without exact-content/destination preview + approval

## 4. Repo Structure Logic (Why AI-Optimized)

- `.ai/` = machine-readable JSON for fast context injection (RAG-friendly)
- `00_LIVING_DOCS/` = prefix 00 ensures it sorts first, living docs are single source of truth
- `apps/01_...` = numbered for priority, 01 is latest target
- `vault/` = full Obsidian vault copy, canonical memory
- `spec/screenshots/` = visual spec, ground truth for UI
- `memory/sessions/` = chronological logs for temporal memory

This is NOT human portfolio structure. It's for AI continuity.

## 5. How to Build/Test

Latest exact clone:
```
cd apps/01_claude-exact-pixel-clone
start-app.bat  # handles Ollama already running, installs rollup win32, starts vault API 8765 + Vite 5173
```
Open http://127.0.0.1:5173
Ollama at http://127.0.0.1:11434/api/chat qwen2.5:3b streaming
Vault API at http://127.0.0.1:8765/context + /capture

Electron clone:
```
cd apps/02_electron-claude-clone-v6
npm install
npm run dev:server
npm run dev
```

Extension: load unpacked extension/ in Chrome, needs vault API running.

## 6. Current Known Bugs (From STATE.json)

- No reply bug: custom ChatMode called sendMessage from useChat which doesn't exist — fixed by restoring original LLMFactory streaming in v6, but exact clone uses direct Ollama fetch which works.
- Tic Tac Toe loop: systemPrompt for isOpenSourceModel includes Flappy Bird game example, qwen2.5:3b interprets as must create game every reply. Fix: override systemPrompt for qwen2.5:3b to simple assistant, only create artifacts when explicitly asked. Also clear localStorage chat_history that contains looped artifact context.
- Ollama CORS: fetch http://localhost:11434/api/tags may fail if OLLAMA_ORIGINS not * — requires setx OLLAMA_ORIGINS "*" and restart ollama serve.

## 7. What To Do Next (From TODO_NEXT.md)

Read TODO_NEXT.md for immediate next steps. Typically:
- Test exact clone on Windows
- Add Settings modal from screenshot 191707 (Appearance Theme Chat font Transcript size Width Motion Voice Language Style Speed)
- Implement VaultPanel drag-drop capsules
- Wire extension -> vault API -> Obsidian files
- Add blacklist UI

## 8. When User Says "Update Zip"

When user asks for zip again, run:
```
cd /home/user
zip -r AI-ASSistant-Master-Github-Repo.zip AI-ASSistant-Github-Repo -x "*node_modules/*" "*dist/*" "*.git/*" "*archive_zips/*"
```
But keep archive_zips excluded from inner to avoid recursion? Actually include archive_zips as reference but exclude node_modules.

Better: use script in repo root `scripts/build-master-zip.bat` and `.sh`

## 9. Handover Format

When you finish session, write:
- memory/sessions/YYYY-MM-DD-session.md with what you did, what broke, what next
- Update CHANGELOG.md
- Update HANDOVER_LIVING.md
- Update STATE.json
- Update REQUIREMENTS_LIVING.md if requirements changed

This ensures next AI can continue without asking user to repeat.

## 10. Don'ts

- Don't make it look human-made, keep AI-optimized structure
- Don't ask user to reinstall Ollama/qwen2.5:3b unless necessary — use existing
- Don't create separate SQLite as authoritative memory — Obsidian vault is canonical
- Don't claim universal access without honest scope
- Don't silently retrain model or assume preferences
- Don't invent personal facts, offline events, feelings
