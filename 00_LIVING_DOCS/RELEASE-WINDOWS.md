# RELEASE-WINDOWS.md — the installer recipe (verified 2026-10-16, v0.8.0)

Everything needed to rebuild the installer on the build sandbox. Wine/NSIS
vanish on every sandbox restart; this is the whole ritual, start to finish.

## The recipe (executed in this order)

1. **Deps survive?** `ls apps/03_ai-assistant/node_modules` — if gone:
   `npm install` in `apps/03_ai-assistant/`.
2. **Sanity build:** `npm run build` (typecheck + electron-vite → `out/`).
3. **Wine (it is always gone):**
   `dpkg --add-architecture i386 && apt-get update -qq && apt-get install -y -qq wine wine64 wine32`
   (~65 s on the sandbox; wine 10.0 verified).
4. **Build:** in `apps/03_ai-assistant/`:
   `npx electron-builder --win`
   (downloads Electron + NSIS + winCodeSign into `~/.cache`, then builds with
   `electron-builder.yml`: NSIS, oneClick, runAfterFinish, per-user, maximum
   compression, icon.ico from `resources/`).
5. **IMMEDIATELY copy the exe out** — `dist/` is a snapshot-excluded folder
   name and dies at the message boundary:
   `cp dist/AI-ASSistant-Setup-<version>.exe /home/user/`
6. **Record:** size + sha256sum here and in the CHANGELOG.

## Builds

| Version | File | Size (B) | SHA-256 | When |
| --- | --- | --- | --- | --- |
| 0.4.0 | AI-ASSistant-Setup-0.4.0.exe | 88,049,746 | 0c19f17a… | 2026-10-15 |
| 0.6.0 | AI-ASSistant-Setup-0.6.0.exe | 88,062,356 | c0c9c0861873b7b2db69c0d5d924563aa04b9cd53b015c44a8c4a640835ea38c | 2026-10-16 (rebuild; 1st build's copy was lost to the workspace size cap — two 88 MB exes at once exceed it. The 0.4.0 exe was deleted to make room; NSIS timestamps make each build's hash differ) |
| 0.8.0 | AI-ASSistant-Setup-0.8.0.exe | 88,129,252 | aa10fb3d3bd9e2a5f50452743e7196134f483ec9d7b3db5550fee08518275a8c | 2026-10-16 (ships: keys ride the engine, monthly audits, marketplace dissolved, Brain first-class; copy kept at /home/user/AI-ASSistant-Setup-0.8.0.exe) |

## What the person installing will see

Unsigned, so SmartScreen says "Windows protected your PC" — More info → Run
anyway, once. One click, no questions, app opens when done. Uninstall leaves
the vault and settings alone.
