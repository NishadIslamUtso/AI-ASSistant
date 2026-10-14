# TODO_NEXT.md — Immediate Next Actions (Living)

**Last Updated:** 2026-10-14 (night) Asia/Dhaka
**Rule:** Priority order. Update after each session, check off when done.

---

## Priority 1 — The owner's own Windows test ⬅ DO THIS FIRST

Nothing below matters until the app has run on the TUF A15.

- [ ] Get the branch (`arena/3c06e1bf-ai-assistant-v3`) or `main` onto the Windows machine
- [ ] `cd apps\03_ai-assistant` → `npm install` → `npm run dev` (Ollama must be running)
- [ ] Ask something ordinary: it must answer, and must not open an artifact
- [ ] Confirm the conversation appeared in the vault as Markdown
- [ ] Open Settings (bottom left) and walk the four sections; report anything that looks off
- [ ] Report back: what worked, what looked wrong, any red text in the terminal

## Priority 2 — What the owner has already asked for

- [ ] **Cloud providers** — Claude, GPT and Gemini APIs as real options, keys in the OS keychain
- [ ] **Settings > Agent access** — the single permission surface (Local / Cloud × Vault, Files, Shell, Web,
      MCP). Built when something real can be granted; cloud off by default
- [ ] **Open a loopback port for the extension** — the app's vault API is in-process today, so the extension
      has nothing to POST to. This is the blocker for the whole browser-capture feature
- [ ] **Browsing Maps** — the memory map of what was read and when
- [ ] A Windows installer (nothing exists yet; `npm run dev` is the way in)

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
