# CLAUDE-SETUP — the new way (no app build)

**Owner decision, 2026-10-15:** *"i don't need to make the app, i just need to set
the claude and claude code the way i want."* The AI ASSistant app is **parked** —
branch, handover, archives and TODOLIST intact, nothing deleted. **This file is
the active path.** One step per turn; he says "next" (or "skip").

## Phase 0 — choose the brain (free first)

- [ ] **0a. Free-forever default:** Claude Code ← Ollama — `ollama launch claude`
      (Ollama ≥0.14 speaks the Anthropic Messages format). Local coder model for the
      4 GB card (`qwen2.5-coder:3b` class) or free `:cloud` models (`kimi-k2.5:cloud`,
      `glm-5:cloud`) when online. $0 forever.
- [ ] **0b. Optional taste of real Claude:** a new `console.anthropic.com` account
      ships ≈ $5 starter credits, no card — a few days of genuine Claude, then it stops.
- [ ] **0c. Claude Desktop:** free chat plan (usage caps apply). Cowork/Chrome per Phase 1.

## Phase 1 — Claude in the browser (the Cowork question)

Facts (checked 2026-10-15): **"Claude for Chrome"** (the real extension, free to all
users since late 2025) **now runs full Cowork sessions** since 2026-08-12 — shared
history, skills and connectors between extension, desktop, web and mobile.
Rollout: Cowork-in-Chrome for **Max/Team now, Pro "in weeks"**; Enterprise off by
default; **Chrome only** (no other Chromium, no mobile). Separately, Cowork desktop
got its **own sandboxed built-in browser** (2026-08-26, Pro/Max/Team) that never
touches your real tabs.

- [ ] **1a.** Install "Claude for Chrome" from the Chrome Web Store. On a free plan
      expect the base extension; the Cowork sidebar appears only on paid tiers — check
      his account and note what actually shows.
- [ ] **1b.** Connect his notes: add a filesystem/Obsidian **MCP connector** in Claude
      Desktop settings so Claude can read the vault (AI-Brain folder) directly.
- [ ] **1b-alt.** If MCP connectors are paywalled on his plan, skip to Phase 2 — Claude
      Code gets the same access via `--mcp`/config and runs free.

## Phase 2 — Claude Code, his way

- [ ] **2a.** Install: `npm install -g @anthropic-ai/claude-code` (PowerShell 5.1:
      separate lines, no `&&`, `.\` for relative executables).
- [ ] **2b.** Point it at the free brain — either `ollama launch claude` or the env
      form:
      `$env:ANTHROPIC_BASE_URL = "http://localhost:11434"` ·
      `$env:ANTHROPIC_AUTH_TOKEN = "ollama"` · `$env:ANTHROPIC_API_KEY = ""` · `claude`.
      (Free cloud alt: OpenRouter `:free` models via `claude-code-router`.)
- [ ] **2c.** Skills: copy `refs/replica-skill/replica-*` → `%USERPROFILE%\.claude\skills\`.
      Then `/replica-recon` etc. work as plain commands.
- [ ] **2d.** Mods: inside Claude Code run `/plugin`, add marketplace
      `whyashthakker/awesome-claude-code-mods`, install only trusted/MIT mods. Ask
      Claude Code to write his own — that is the sanctioned way (it hot-reloads).
- [ ] **2e.** Vault access: point a filesystem MCP server (or CLAUDE.md context) at the
      notes folder so both Claude Desktop and Claude Code know where the brain-dump lives.

## Phase 3 — his eight "screens", rebuilt as skills and mods (the app replacement)

Each surface gets the cheapest vehicle that works — never an app screen:

- [ ] **3a.** `/today` skill → greeting, counts, worth-doing, recent sources, quick
      actions (Today 07): reads Chrome history + vault files, prints the dashboard.
- [ ] **3b.** `/vault-map` skill → browsing/vault summary (Browsing Maps 05).
- [ ] **3c.** Artifacts-as-files → Claude Code already writes real files to a folder;
      declare one folder the artifact home (Artifacts 03 without the app).
- [ ] **3d.** Always-on panels (status, CI, token weather) → **mods** (Claude Code panes).
- [ ] **3e.** Anything data-shaped (vault, sources, later artifact store) → **MCP server**
      so *any* Claude surface can read it (the bridge the app used to be).

## Phase 4 — memory & notes (optional, later)

- [ ] **4a.** Obsidian on the vault (he planned it anyway) — Claude connectors read it.
- [ ] **4b.** `claude-os` memory layer: genuine candidate, but Mac-first — evaluate a
      Windows path before installing; fallback = CLAUDE.md + skills (no install).
- [ ] **4c.** `CLAUDE.md` at the vault root = standing context for every Claude Code session.

## Free-tier edges to remember

- Free claude.ai plan = chat with caps; **no Claude Code agent** (Phase 2b is the free path).
- Cowork inside Chrome = Max/Team now, Pro soon; base extension = broadly available; Chrome only.
- All RPM/RPD numbers drift — verify on the pricing page at signup; treat Gemini's table as
  directionally right, not contractual.
