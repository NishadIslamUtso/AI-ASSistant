# Testing Checklist — Before Merging Any Branch

Use this checklist when testing a branch ZIP downloaded from GitHub.

## Exact Clone (apps/01_claude-exact-pixel-clone) — updated 2026-10-10 session 2

- [ ] start-app.bat runs; if Ollama is already running it says so and does not start a second one
- [ ] A missing qwen2.5:3b is a warning only (app still starts)
- [ ] npm install succeeds (optional dep @rollup/rollup-win32-x64-msvc is in package.json)
- [ ] Vault API starts (http://127.0.0.1:8765)
- [ ] Vite starts at http://127.0.0.1:5173
- [ ] Side by side with spec/screenshots 191547-191707: sidebar 384px #111111, centre #151515, composer #20201f, greeting "Evening, Utso" with orange asterisk, Free plan · Upgrade pill
- [ ] Search filters the chat list; New shows the blank screen
- [ ] Right-click a chat: P pins (Pinned group), R renames inline, D deletes (after confirm), Esc closes
- [ ] Hamburger opens File / Edit / View / Go / Help flyouts
- [ ] Click NU Utso · Free: user menu with your email; "Get apps and extensions" opens the modal; Esc closes
- [ ] Ctrl+, opens Settings; Theme Light/Dark switches live and survives a reload; Transcript size and width change the chat
- [ ] Model picker (qwen2.5:3b) lists your Ollama models
- [ ] Send a message: reply streams, no Tic Tac Toe game unless you asked for one. If it still loops, clear localStorage key claude_exact_messages
- [ ] Switching chats shows each chat's own messages
- [ ] Stop button stops a reply
- [ ] Vault match line appears under the composer when a vault capsule matches (needs AI-Brain notes)
- [ ] No CORS error in the browser console (browser calls go through /api/ollama and /api/vault)

## Electron Clone (apps/02_electron-claude-clone-v6) — Optional

- [ ] npm install succeeds
- [ ] dev:server starts vault API
- [ ] dev starts Vite
- [ ] electron:dev starts Electron with title bar visible
- [ ] Artifacts panel works
- [ ] Thinking display works

## Extension (extension/)

- [ ] Loads as unpacked in chrome://extensions without errors
- [ ] manifest host_permissions <all_urls> + history
- [ ] Popup shows Capsule library + blacklist manager
- [ ] background.js history listener logs to 02 Sources/Browser Activity/
- [ ] ai-capture.js captures ChatGPT/Claude chats to 02 Sources/Conversations/
- [ ] generic-capture.js captures readable text to 02 Sources/Web Pages/
- [ ] wasn't accessible logs to 09 Activity & Undo + 01 Inbox/Processing Errors
- [ ] Blacklist bank.com/* skips collection and logs skipped - blacklist

## Vault (vault/AI-Brain/)

- [ ] Obsidian opens AI-Brain folder as vault without errors
- [ ] 00 System/ templates exist
- [ ] 02 Sources/ writes work from app and extension
- [ ] 09 Activity & Undo/ logs created

## Living Docs

- [ ] 00_LIVING_DOCS/REQUIREMENTS_LIVING.md updated with this branch changes
- [ ] 00_LIVING_DOCS/CHANGELOG.md updated
- [ ] 00_LIVING_DOCS/HANDOVER_LIVING.md updated with current state + gaps
- [ ] .ai/STATE.json updated
- [ ] memory/sessions/ new session log created

If all checked, safe to merge.
