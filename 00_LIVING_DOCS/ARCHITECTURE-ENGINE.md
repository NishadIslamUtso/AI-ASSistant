# ARCHITECTURE — your app is the FACE, Claude Code is the ENGINE

**Written 2026-10-15 for the owner. Plain words on purpose.**
One sentence: the app you already have (v0.1.2) becomes the window, and the
Claude Code you installed today becomes the muscle inside it — plus `agy` as a
second muscle you can switch to. Everything stays free.

---

## 0 · The cast (read this first)

| Name | What it is | Already on your machine? |
|---|---|---|
| **The face** | Your app's windows, screens, buttons. Yours. Change any time. | ✅ v0.1.2 |
| **The engine** | Claude Code — the worker that reads files, edits, runs commands, uses skills | ✅ installed today (v2.1.300) |
| **Brain (cloud)** | `gemma4:cloud` — the big free online brain | ✅ |
| **Brain (local)** | `qwen2.5-coder:3b` — the small unlimited offline brain (your seatbelt — keeping it) | ✅ |
| **Engine #2** | `agy` (Google's free agent CLI) — same job as Claude Code, different brand | ◻ pending a Windows check |
| **The socket** | One plug inside the app where ANY engine connects | 🔨 we build this |

Analogy for the whole doc: **your app is a car you designed. Claude Code and
agy are two engines that bolt into the same engine bay. Ollama is the fuel
pump. You drive; the engines do the lifting.**

---

## 1 · The picture

```
 ┌──────────────────────────────────────────────────────┐
 │  THE FACE  (your app — Electron window, your layout) │
 │                                                      │
 │  Chat · Today · Vault · Artifacts · Projects · Code  │
 │  Browsing Maps · Settings · approval cards           │
 └───────────────▲──────────────────────▲───────────────┘
                 │ events up            │ commands down
        ┌────────┴──────────────────────┴────────┐
        │  THE SOCKET  (new, inside the app)     │
        │  • picks the engine (CC or agy)        │
        │  • turns engine chatter into app events│
        │  • asks YOU for permission when needed │
        └───────┬───────────────────┬────────────┘
                │                   │
      ┌─────────┴────────┐  ┌───────┴─────────┐
      │ ENGINE #1        │  │ ENGINE #2       │
      │ Claude Code      │  │ agy (Google)    │
      │ (Agent SDK)      │  │ (added after    │
      │                  │  │  Windows check) │
      └─────────┬────────┘  └───────┬─────────┘
                └─────────┬─────────┘
                  ┌───────┴────────┐
                  │  FUEL: Ollama  │
                  │ gemma4:cloud   │  ← default (big, free slice)
                  │ qwen2.5:3b     │  ← fallback (small, unlimited, offline)
                  │ (9Router door  │  ← later: hundreds more free brains)
                  └────────────────┘
```

---

## 2 · What already exists and stays untouched

Your app was built in layers (this is *good* news today):

| Layer | Where it lives | Fate |
|---|---|---|
| Window + screens (React) | `src/renderer/` | **Stays. This is the face.** |
| Bridge (the only door between screen and machine) | `src/preload/` | Stays; grows a new `engine` door |
| Machine-side services (vault, artifacts, settings, keys, extension port) | `src/main/*` | Stays as-is |
| Provider system (talks to Ollama + cloud brains) | `src/main/cloud/` + `shared/lib/providers` | Stays; the engine reuses it |
| Your 11 skills, house rules, env wiring | `~/.claude/` | **Auto-loaded by the engine. Zero re-doing.** |

The old rule stands too: the screen never talks to the internet directly —
everything goes through the app's back room (`src/main`). The engine lives in
the back room. Safer, and it keeps the console clean.

---

## 3 · The Socket — what we build (the heart of this doc)

A new back-room module: `src/main/engine/`. It has three jobs:

### Job 1 — pick the engine (Settings gets an "Engine" switch)
- `claude-code` (default) · `agy` (when it lands) · later: 9Router door.
- Choice saved in the app's existing Settings file — no new config universe.

### Job 2 — adapter #1: Claude Code via the Agent SDK
The **Agent SDK** is Anthropic's official package (TypeScript, publicly
released, free) whose entire purpose is "run Claude Code inside YOUR app."
Confirmed from their docs (2026-10): same tools, same agent loop, sessions,
permissions — and **it automatically loads skills, commands and memory from
`~/.claude/`, same as Claude Code.** Your 11 skills and today's wiring walk
straight in.

How a message flows, plainly:
1. You type in your app's chat.
2. The socket calls the SDK: *"here's the prompt, here's the working folder,
   here's the allowed tools."*
3. The engine works. The SDK **streams events back**: thinking…, reading file…,
   editing file…, wants to run a command…
4. The face draws all of it — your chat bubbles, your progress, your cards.
5. When the engine wants permission, the socket raises an event → **your app
   shows an approve/deny card in YOUR style** → the answer streams back down.
   (This plugs into the permission settings you already shipped.)

Wiring: the SDK picks up the same env instructions you already set
(Ollama address, model). Default brain `gemma4:cloud`; automatic fallback to
the local model when the cloud slice runs dry or you're offline.

**Honest limits (no sugar):** the SDK drives the CLI under the hood, so a task
has CLI-style startup lag; and how *well* it works depends on the brain — the
free cloud brain is good, the tiny local one will be clumsy at heavy tool work.
Also: the SDK ships its own copy of the CLI engine — the `claude` you installed
today stays for terminal use; the app doesn't depend on it.

### Job 3 — adapter #2: agy (engine #2, same plug)
- **Gate first:** agy is Google's free agent CLI but its Windows support is
  unproven — I run that check before anything else (my job, not yours).
- If it passes: same socket, adapter translates its output into the same
  events. You switch engines in Settings like switching input sources.
- If it fails: recorded, parked, nothing else changes.

### The stretch goal (later, not now): raw-stream mode
Claude Code can also be driven raw (`--output-format stream-json`), which can
even mirror **mod panels** (the little screens mods draw) inside your window.
That's a bonus mode we revisit after the SDK path works. Noted so we don't
lose it; not in the first build.

---

## 4 · What happens to your eight screens

| Screen | Fate under the new architecture |
|---|---|
| **Chat** | Becomes the engine's face (streaming, approval cards live here) |
| **Today (07)** | Unchanged plan — but now reads REAL engine activity (real "what happened today") |
| **Projects (04)** | Unchanged — a project = a folder you open sessions in |
| **Vault (05)** | Unchanged — and the engine can finally *use* the vault (it reads local files!) |
| **Code (06)** | Gets real: actual engine edits with your before/after cards |
| **First-run (08)** | Reborn as the **init screen**: checks Ollama awake ✓, brains ✓, skills ✓, agy ◻ with install buttons — the "everything you want, initialized" screen, zero terminal |
| **Appearance (09)** | Unchanged — your layout freedom was the whole point |
| **Agent access / permissions** | Plugs directly into the socket's permission events |

Old TODOLIST items that **dissolve** (the engine replaces them): the MCP
bridge proposal (Claude no longer needs an outside door — it lives inside),
the "Claude Mods = the other half of the bridge" item. Items that **stay**:
everything about the vault, artifacts-as-files, Browsing Maps, real-data rule.

---

## 5 · Safety & the Free Gate

- **Permissions stay king:** nothing the engine does runs without your
  settings allowing it. Auto mode = low-risk actions only; anything spicy
  raises a card. You can flip the whole engine to ask-everything.
- **Mods warning carried over:** mods run with full machine access — only
  install ones you've eyeballed (that rule is already in the plan).
- **Costs, the whole architecture:**

| Piece | Cost |
|---|---|
| Agent SDK, Claude Code engine, agy | $0 |
| gemma4:cloud (free starter slice) | $0 |
| local brain + Ollama | $0, unlimited |
| Skills, mods, the app itself | $0 |
| The ONLY paid thing, ever | an Anthropic subscription **if you someday say "buy"** — and then the official Desktop app's Code tab lights up too, as a bonus |

---

## 6 · Build order (one landing per turn, code only after your "go")

- [ ] **6.2 — Engine spike.** Socket + SDK adapter in the back room; one chat
      round-trip through YOUR app on gemma4:cloud; approval card works once.
      *Done when:* you watch the engine edit a file from your app's chat.
- [ ] **6.3 — agy check + adapter.** Windows check first; then same plug.
      *Done when:* Settings switches engines and both answer.
- [ ] **6.4 — Face pass.** First-run init screen (08 reborn) + wire Today/Code
      to real engine events; mockups stay the design authority.
- [ ] **6.5 — Installer.** You run ONE file; app + checks + brains land.
      *Done when:* AI ASSistant icon on your desktop, engine inside, $0 spent.

---

## 7 · What I cannot promise (the honest corner)

- The **free cloud brain's quota** is Ollama's to change — if it shrinks, we
  re-plan (that's the Free Gate rule), never pay quietly.
- **agy on Windows** is still a maybe until I run the check.
- Small local brain + heavy agent work = clumsy. It's the seatbelt, not the
  sports car.
- The Agent SDK is young software; if it fights us, the raw-stream fallback
  exists (section 3).

**Your only jobs in this whole plan: read this, say "go", run installers I
hand you, and keep being the person who says when something looks wrong.**
