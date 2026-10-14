# Testing Checklist — Before Merging Any Branch

Run it in this order; each line is a thing you can see with your own eyes.

## 1. Automated (no machine required)

- [ ] `cd apps/03_ai-assistant && npm install` completes
- [ ] `npm test` → **208 tests, 22 files, all passing**
- [ ] `npm run typecheck` → no output
- [ ] `npm run build:web` → clean, writes `dist-web/`
- [ ] `npm run preview:web` → the preview opens on http://localhost:4174

## 2. The browser preview (interface only — it says so)

- [ ] Header shows `AI ASSistant`, a `Preview` chip, and the preview line above the composer
- [ ] Sending a message explains that models run in the desktop app (no invented answers)
- [ ] Settings opens as the full window with a rail: System, Appearance, Performance, Vault
- [ ] The search box narrows the rail, and clearing it brings everything back
- [ ] Accent + conversation width apply immediately and survive a reload
- [ ] `Vault` explains there is no folder to choose in this window
- [ ] **Zero console errors and zero warnings** (open DevTools and look)

## 3. Desktop app (Ollama running)

- [ ] `npm run smoke` → `SMOKE OK ... errors=0 warnings=0`
- [ ] `npm run dev` opens the window; header shows green `Ollama` and green `Vault`
- [ ] A question answers and streams; the stop button keeps the partial reply
- [ ] The conversation is in the vault as Markdown; `09 Activity & Undo/<year>/<month>.md` is appended
- [ ] Settings → System shows the running model and the folder conversations are kept in
- [ ] Settings → Performance: choosing `6 GB VRAM` shows `num_ctx=8192 · num_batch=512 · num_predict=2048`
      and **no warning**; the options line follows the profile
- [ ] Settings → Performance → Custom opens four real number fields (Context window, Prompt batch,
      Longest reply, Layers on the GPU) with no written-out descriptions under them
- [ ] Settings → Vault: a folder that exists is accepted and reported back by the vault itself
- [ ] Settings → Vault: a folder that does not exist is refused and nothing is created
- [ ] Settings closes with the X and with Escape, and the app is exactly as it was
- [ ] **Zero console errors and zero warnings** in the desktop window too

## 4. Extension (not wired to the app yet)

- [ ] `chrome://extensions` → load unpacked → `extension/`
- [ ] The blacklist matches hosts the way `tests/blacklist-parity.test.ts` says it does
- [ ] It does **not** claim to have captured anything: no port is open for it yet

## 5. Before merging

- [ ] `00_LIVING_DOCS/REQUIREMENTS_LIVING.md`, `CHANGELOG.md`, `HANDOVER_LIVING.md` updated
- [ ] `.ai/STATE.json` updated
- [ ] `memory/sessions/<date>-session.md` written
- [ ] The commit names every file it touched (untracked additions included)
