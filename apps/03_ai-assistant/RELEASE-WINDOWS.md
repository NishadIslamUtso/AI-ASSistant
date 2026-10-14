# Release notes — `AI-ASSistant-Setup-0.1.0.exe` (Windows)

**What this is:** the first installer this app has had. Everything below is what a person actually needs to
know before double-clicking it — including the warning Windows will show and why.

---

## The file

| | |
|---|---|
| Name | `AI-ASSistant-Setup-0.1.0.exe` |
| Size | 87,748,105 bytes (~84 MB) |
| Target | Windows x64 |
| Built by | `electron-builder` 26.15.3, from `electron-builder.yml` at this folder's root |
| Type | NSIS, **assisted** install (not one-click) — you choose the folder |
| Signed | **No.** There is no code-signing certificate. |

---

## Windows will warn you. Here is why, and what to do.

**What you will see:** a blue box — *"Windows protected your PC — Microsoft Defender SmartScreen prevented an
unrecognized app from starting"* — naming an **unknown publisher**.

**Why:** SmartScreen trusts apps whose publisher has paid for a code-signing certificate and proven their
identity to a certificate authority. This build has no certificate, so Windows cannot tell who made it and
says so. That is what "unknown publisher" means — **not** that something was found inside it.

**What to do:** click **More info** → **Run anyway**.

**The honest caveat, stated plainly:** an unsigned installer is indistinguishable from a malicious one by
Windows alone. If you did not build this file yourself or download it from a source you trust, do not run it.
This one came from this repository, built by these exact commands, from this exact source — the recipe is at
the bottom of this page so it can be reproduced and compared.

---

## Installing

1. Double-click, click through SmartScreen as above.
2. **Choose the folder** (the default is fine: `%LOCALAPPDATA%\Programs\AI ASSistant`).
3. Finish. A **desktop shortcut** and a **Start-menu entry** appear.

- **No admin rights** are required: it is a per-user install (`perMachine: false`), so Windows will not ask to
  elevate.
- **Uninstalling keeps your data** (`deleteAppDataOnUninstall: false`). Settings, keys and any vault the app
  kept live on after the app is removed — deliberately. Memory that vanishes with an app is not memory.

### Where things live afterwards

| | |
|---|---|
| The app | the folder you chose, with an `Uninstall AI ASSistant.exe` inside it |
| Your vault | your own Obsidian folder (chosen in **Settings > Vault**) — the app never owns it |
| Settings and sealed keys | `%APPDATA%\ai-assistant\` |

---

## What it needs to work

- **Nothing to run it.** No Node, no npm, no build tools, no admin rights.
- **For the local model:** Ollama running at `127.0.0.1:11434` with a model pulled. The app talks to Ollama;
  it does not install or manage it. With no Ollama running, the app still opens and says so in one line —
  it does not hang and does not pretend.
- **For a cloud model (optional):** an API key pasted in **Settings > Models**. Nothing leaves the machine
  until a key is saved, and a reply is always labelled `local` or `online · <provider>`.

### First run, in order

1. Start Ollama (if you want the local model).
2. Open **AI ASSistant**.
3. **Settings > Vault** → point it at your vault folder.
4. **Settings > Models** → the models Ollama reports; add a key only if you want a cloud model.
5. Ask something ordinary. It should answer; the conversation should land in the vault as Markdown.

---

## What was verified before this file was offered

- **The payload inside the installer** was extracted and listed: `AI ASSistant.exe`,
  `resources/app.asar` (31.9 MB), `Uninstall AI ASSistant.exe`, `elevate.exe`, and exactly one locale file
  (`en-US.pak`) — 21 entries in all.
- **The same configuration packaged for Linux boots clean**:
  `SMOKE OK title="AI ASSistant" size=1280x820 errors=0 warnings=0` — so the packaged asar is complete and
  the app really starts from a package, not only from source.
- The full test suite, typecheck and both builds pass in the sandbox (255 tests, 27 files).

**What was *not* verified — say it plainly:** an actual install on Windows. There is no Windows machine in the
sandbox this was built in. A Wine "silent install" was attempted and is **not** evidence: unpacking the
payload under Wine outruns any sane timeout, so an empty folder afterwards would say nothing either way. The
install on a real Windows machine is the owner's own test, and it is the first item on the list.

---

## Building it yourself (reproducible recipe)

```bash
cd apps/03_ai-assistant
npm install
npm run dist:win         # → dist/AI-ASSistant-Setup-0.1.0.exe   (installer)
npm run dist:win:dir     # → dist/win-unpacked/                 (unpacked folder, much faster, no NSIS)
npm run dist:linux       # → dist/linux-unpacked/                (for a smoke test off Windows)
```

- On **Windows**, `npm run dist:win` needs nothing extra.
- On **Linux**, NSIS needs 32-bit Wine: `dpkg --add-architecture i386`, then install `wine` **and**
  `wine32:i386`, and point `WINEPREFIX` at a folder **outside** the repo (`export WINEPREFIX=/var/tmp/wineprefix`).
  64-bit Wine alone fails with `could not exec the wine loader`.

### The two size decisions, stated on purpose

| Decision | Why |
|---|---|
| `electronLanguages: [en-US]` | The app is written in English. The other 54 Chromium locale files were 46 MB unpacked for text nobody would see — and a person who needs another language is better served by a real translation than by Chromium's menus. |
| `compression: maximum` | An installer is downloaded, often on a slow connection. Slower to build, smaller to ship: the first build was 95,963,305 bytes, this one is 87,748,105. |

### Icon

The app icon is the app's own **BrainMark**, rendered from the existing `BrainMark.tsx` component by
`shot-tools/render-mark.cjs` into `build/icon.png` (512×512). No new logo was drawn for packaging.

---

## Known gaps in this release

- **Unsigned** → the SmartScreen warning above.
- **No auto-update.** Installing a newer build means running a newer installer over it.
- **Windows x64 is the only target configured.** macOS targets are not set up; Linux builds work
  (`dist:linux`) but are not the owner's platform.
