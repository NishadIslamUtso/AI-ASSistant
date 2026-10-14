# TODO_NEXT.md — Immediate Next Actions (Living)

**Last Updated:** 2026-10-14 (evening) Asia/Dhaka
**Rule:** Priority order. Update after each session, check off when done.

---

## Priority 1 — The owner's own Windows test ⬅ DO THIS FIRST

Nothing below matters until the app has run on the TUF A15.

**The short way — the installer** (no Node, no build tools, no admin rights):

- [ ] Copy `AI-ASSistant-Setup-0.1.0.exe` (87,748,105 bytes, ~84 MB) to the Windows machine and double-click it
- [ ] Windows shows SmartScreen: *"Windows protected your PC"* / unknown publisher. It is **unsigned** — no
      certificate exists — so click **More info** → **Run anyway**. It is your own build from your own repo
- [ ] Choose the folder (the default is fine) and finish; a desktop and Start-menu shortcut appear
- [ ] Start Ollama (it must be running at `127.0.0.1:11434` with a model pulled; the app talks to it, it does
      not install it), then open **AI ASSistant**
- [ ] Ask something ordinary: it must answer, and must not open an artifact
- [ ] Confirm the conversation appeared in the vault as Markdown
- [ ] Open Settings (bottom left) and walk the sections; report anything that looks off
- [ ] If you have an API key you are willing to paste: Settings > Models > Add key, press Test, then pick that
      model in the composer and ask it something. Nothing is sent anywhere until a key is saved.
- [ ] Report back: what worked, what looked wrong, any red text in the terminal

**The developer way** (running from source, if you would rather): branch `arena/3c06e1bf-ai-assistant-v3` or
`main` → `cd apps\03_ai-assistant` → `npm install` → `npm run dev`.

Honest details about the installer (including the SmartScreen text, in advance): `apps/03_ai-assistant/RELEASE-WINDOWS.md`.

## Priority 2 — The next build step (one step per turn, verified, then reported)

- [ ] **Port the extension itself.** The app has carried the port it needs since `8e589a0`
      (`127.0.0.1:8765`, capture side only); the extension is still the starter it was. Load it in a real
      browser, wire the collector + context suggester + popup, and prove a real page capture lands in the
      vault — until then Browsing Maps is mostly the app's own conversations
- [ ] The preview/export chain (after the extension)
- [ ] The topic list / branch tree
- [ ] Projects + chat memory
- [ ] Cloud follow-ups: per-provider default model, audit log, token/cost meter, cloud → local-only failover
- [ ] Code signing, **only if** the SmartScreen warning gets in the way (a certificate costs money and
      requires proving identity; until then the warning is expected behaviour, not a bug)

## Priority 3 — Parked by the owner

- [ ] Voice, wake word, always-listening (Jarvis) — "leave jarvis idea for now; i will do it when I have a
      better computer"

## Done recently (do not redo)

- [x] Vault writes end to end (conversations, activity log, folder moved from Settings)
- [x] Settings: Appearance (accent + conversation width, tokenised) and Performance (profiles + custom values)
- [x] Settings as the full-window surface with a rail, search and Reset
- [x] Memory warning measured against the chosen profile; no more "6 GB answered with 4 GB"
- [x] Vercel deployment files removed
- [x] Every living doc, `.ai/` file and the extension docs brought to the current state
- [x] **Browsing Maps** — the timeline of what the vault holds (conversations, captured pages, visits) with
      site grouping, kind filters, search and a time window; a visit stays a visit
- [x] **Settings > Agent access** — the local model, browser captures, keeping conversations and each keyed
      provider, each one enforced in the main process; Files, Shell, Web and MCP are stated as not built rather
      than offered. Every reply is labelled `local` or `online · <provider>`
- [x] **The extension port** — 127.0.0.1:8765, loopback only, `chrome-extension://` origins only, carrying the
      capture side of the vault (health, status, context, capsules, blacklist, capture) and nothing that could
      spend a key, change a setting or export the vault
- [x] **Online providers** — Claude (Anthropic), GPT, Gemini, OpenRouter, Groq, DeepSeek, Grok and any
      OpenAI-compatible endpoint. Keys pasted in Settings > Models, sealed by the machine's own keychain,
      never handed to the interface; a cloud model is `provider/model` and answers through the same
      address as a local one. Off by default: no key, no request
- [x] **The Windows installer** — `AI-ASSistant-Setup-0.1.0.exe` (NSIS, assisted, per-user, unsigned) built
      from `electron-builder.yml`, icon from the app's own BrainMark; payload listed and the same config's
      Linux bundle boots clean. Installing it on Windows is the owner's own test (Priority 1)
