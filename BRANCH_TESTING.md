# Branch Testing Guide — How to Test Before Merging

This repo is designed so any branch is fully testable.

## What This Repo Contains (Everything)

- `apps/01_claude-exact-pixel-clone/` — Latest exact pixel-perfect Claude clone from 6 screenshots, Vite+React+Tailwind, direct Ollama qwen2.5:3b, vault driver 8765, start-app.bat
- `apps/02_electron-claude-clone-v6/` — Previous Electron clone with more features (artifacts, workbench, thinking, vision), reference
- `extension/` — MV3 extension, default check everything, Capsule Hub + Quillbot UX, blacklist, failure logging
- `vault/AI-Brain/` — Obsidian vault canonical memory 61 files starter
- `spec/screenshots/` — 6 Claude desktop screenshots that ARE spec + CLAUDE_SPEC_FROM_SCREENSHOTS.md
- `00_LIVING_DOCS/` — Living requirements, handover, architecture, decisions, changelog, todo (UPDATED EVERY CHANGE)
- `.ai/` — Machine-readable context for any AI agent (CONTEXT.json, STATE.json, INDEX.json, AGENT_INSTRUCTIONS.md)
- `docs/originals/` — Original requirement files historical
- `archive_zips/` — Previous zips for reference (optional, excluded from GitHub push by .gitignore but included in FULL zip)
- `scripts/` — build-master-zip.sh/.bat
- `memory/sessions/` — Session logs

## How to Test From a Branch (Your Workflow)

1. Create branch on GitHub:
   ```
   git checkout -b feature/settings-modal
   # make changes
   git add .
   git commit -m "feat: add Settings modal from 191707.png"
   git push -u origin feature/settings-modal
   ```

2. On GitHub, go to your repo -> Branch dropdown -> select `feature/settings-modal` -> Code -> Download ZIP

3. Extract ZIP on your TUF A15 Windows machine

4. Test exact clone:
   ```
   cd apps\01_claude-exact-pixel-clone
   .\start-app.bat
   ```
   - Handles already-running Ollama
   - Installs @rollup/rollup-win32-x64-msvc
   - Starts vault API 8765 + Vite 5173
   - Open http://127.0.0.1:5173
   - If Tic Tac Toe loop, clear localStorage: F12 console -> localStorage.clear() -> refresh

5. Test Electron clone:
   ```
   cd apps\02_electron-claude-clone-v6
   npm install
   npm run dev:server
   npm run dev
   ```

6. Test extension:
   - Chrome -> chrome://extensions -> Load unpacked -> select `extension/` folder
   - Ensure vault API running at 8765
   - Visit any site, check `vault/AI-Brain/02 Sources/Browser Activity/`

7. If works, merge:
   ```
   git checkout main
   git merge feature/settings-modal
   git push
   ```

## Why This Works

- No node_modules in repo (installed via npm install on test machine)
- No dist/build in repo (built via npm run build)
- Bat files handle Windows TUF A15 8GB RAM 4GB VRAM, existing Ollama, no native build tools
- All source included, not just md files
- Living docs updated every change so next AI knows state

## What .gitignore Excludes

- node_modules/, dist/, build/, .git/, logs, .cache, etc. (heavy, rebuildable)
- archive_zips/ (nested zips, optional history) — excluded from GitHub push but included in FULL zip for local backup

If you WANT archive_zips on GitHub too, remove `archive_zips/` line from .gitignore
