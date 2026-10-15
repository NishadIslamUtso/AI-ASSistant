# TODO_NEXT.md — Immediate Next Actions (Living)

**Last Updated:** 2026-10-15 (late) Asia/Dhaka

## 2026-10-15 state (engine era)

- [x] 6.2 + 6.2b landed (engine back room + face) — then HARDENED after six
  judge reviews: permission flags pinned (cards really fire), multi-turn,
  Stop-wedge fixed, Bangla-safe decoding, flush, denials/retries surfaced,
  model validation, agy honesty, warnings-fail smoke, CI workflow. **298/298.**
- [ ] **Owner round-trip** — installer → he opens the app → Engine on → one
  file edit with a card. This is the ✅ the judges demanded. NEXT.
- [ ] Then: the six screens (one landing each), undo card, session insights,
  MCP server, agy Windows check, prompt-library + regenerate UI wiring.
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

## Priority 2 — The screens, in order (the owner's verdict was "this is a plain chatbot"; screens first)

The mockups have eight screens. Chat, Settings and now **Artifacts** exist. Each step below is one landing:
built, verified, merged, reported. The rule: **a nav item appears only when its screen works.**

- [x] **Artifacts** — done 2026-10-14 (late evening): a real library on disk (append-only versions, remove moves
      to `.trash`, damaged index repaired from the files), the grid with real thumbnails, version chips,
      rename/duplicate/copy-out/remove, the folder named in a footer, adoption of what was already in
      conversations, and the sidebar search filtering the library. 14 new tests; a new desktop check that reads
      the files off disk before it trusts the screen. **Step 1b is Import and Tweaks** (the mockup's file picker
      and the accent/radius sliders) — deferred by ordering, not dropped
- [ ] **Today** (mockup 07) — the landing screen: conversations today, vault notes touched, artifacts made
      today (the library now makes this number honest), worth-doing-next from the vault's open loops, recent
      sources, quick actions — **next**
- [ ] **Vault** (mockup 05) — the real file tree, search, preview, reindex, add-to-composer
- [ ] **Projects** (mockup 04) — projects with chats, instructions, context and memory
- [ ] **Code** (mockup 06) — read the mockup when this step starts
- [ ] **First-run** (mockup 08) and the composer chips (project · model · effort · local/online)
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
- [x] **The Artifacts screen** — the library on disk, the grid, versions, and the nav entry (see Priority 2)
- [x] **The sidebar collapses and resizes** — a 56px rail and a drag handle, both remembered; the chat's
      artifacts rail hides and returns
- [x] **The logo's id namespacing hardened** — `useId()` punctuation is stripped before it goes into
      `url(#…)` references, and the window icon is wired for the development build
- [x] **The Windows installer** — `AI-ASSistant-Setup-0.1.0.exe` (NSIS, assisted, per-user, unsigned) built
      from `electron-builder.yml`, icon from the app's own BrainMark; payload listed and the same config's
      Linux bundle boots clean. Installing it on Windows is the owner's own test (Priority 1)
