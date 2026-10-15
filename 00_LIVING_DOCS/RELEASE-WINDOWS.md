# RELEASE-WINDOWS.md — the installer recipe (verified 2026-10-16, v0.6.0)

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
| 0.6.0 | AI-ASSistant-Setup-0.6.0.exe | 88,062,358 | 561b93d945dd7916a5fce12c62f75828c13013dcad0624fc6bd2f10ae39e16fe | 2026-10-16 |

## What the person installing will see

Unsigned, so SmartScreen says "Windows protected your PC" — More info → Run
anyway, once. One click, no questions, app opens when done. Uninstall leaves
the vault and settings alone.
