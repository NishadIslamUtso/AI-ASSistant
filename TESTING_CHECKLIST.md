# Testing Checklist — Before Merging Any Branch

Use this checklist when testing a branch ZIP downloaded from GitHub.

## Exact Clone (apps/01_claude-exact-pixel-clone)

- [ ] start-app.bat runs without error
- [ ] Handles already-running Ollama (doesn't try to start second)
- [ ] npm install succeeds (including @rollup/rollup-win32-x64-msvc)
- [ ] Vault API starts at http://127.0.0.1:8765/context
- [ ] Vite starts at http://127.0.0.1:5173
- [ ] UI matches screenshots: Sidebar 260px #202020 Search +New Projects Artifacts Customize Oct8 Older, Center #1a1a1a Evening Utso + orange *, composer #242424 How can I help you today?, Free plan Upgrade top, NU Utso Free bottom
- [ ] Search filters chat list
- [ ] Context menu Open in new window Pin Rename Add to project Move to group Delete appears on right-click
- [ ] Chat sends and qwen2.5:3b replies streaming without Tic Tac Toe loop
- [ ] If loop, localStorage.clear() fixes it
- [ ] Vault context fetch works (no CORS error)
- [ ] If CORS error, setx OLLAMA_ORIGINS "*" and restart ollama serve

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
