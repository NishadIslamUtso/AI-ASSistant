# TESTING_CHECKLIST — evidence, not plans

**Updated:** 2026-10-10 · Active app0.2.0 · Linux sandbox results, Windows/user checks separate.

## Verified in this sandbox

- [x] `npm ci` dependencies installed; production `npm run build` passes (Vite5.4.21,1752modules; JS397.87kB/gzip122.80, CSS34.20kB/gzip7.73).
- [x] **41/41 Node tests pass**: arbitrary NDJSON/UTF8/CRLF/errors/oversized records; metadata capability/cloud detection; requested-only HTML/SVG/CSP; storage migration/recovery; attachments/context; local proxy endpoints/origin/JSON/loopback gates; vault paths/Dhaka rollover/symlink/traversal refusal; originals/dedup/revisions; long sources; visit distinction; two-location inaccessible logs; patterns/revocation/YAML/frontmatter/archive; capsules/latest archived version; attachment originals and browser origins.
- [x] **21/21 Playwright tests pass** with mocked local Ollama and disposable API18765/Vite5174: geometry/dialogs/focus/preferences; per-chat send/history/reload; all chat actions/projects; requested interactive HTML and source versions; unsolicited-game rejection; text/vision payload and reload; thinking separation; text-only refusal; Stop; capsule preview/drop/send and Cook cancellation; DOM/fetch/foreign-frame and same-origin API navigation isolation; offline and oversized drafts preserved; background navigation; Markdown outbound gate; cloud-alias block; blacklist UI/capture skip/revocation.
- [x] Complete post-fix browser suite, not just the old13/14+targeted result.
- [x] Final Home/User menu/Settings/Apps screenshots recaptured/reviewed, **zero page errors**; native1920×1020 output at1280×680CSS/DPR1.5. All six reference PNG dimensions independently checked. **This is not an automated exact-pixel diff or laptop DPI confirmation.**
- [x] Server/helper syntax checked; exact source ZIP/fresh-extraction results in `BRANCH_TESTING.md`.

### Reproduce

From `apps/01_claude-exact-pixel-clone/`:

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The Playwright browser installation is for developers/tests only; app launch does not need it or any model download. Use an existing Chromium via `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if desired.

Sandbox used Chromium153 via `/tmp/chromium`, NSS/NSPR in `/tmp/al2023/lib`, `LD_LIBRARY_PATH=/tmp/al2023/lib`, and:

```sh
PLAYWRIGHT_CHROMIUM_ARGS='["--no-sandbox","--no-zygote","--disable-dev-shm-usage","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]'
```

Do **not** use Sparticuz defaults that disable web security/site isolation for artifact security tests. Browser caches/traces/reports/builds are excluded from Git.

## User Windows 11 TUF A15 — NOT verified

Give one step and wait; do not have the beginner execute this entire list at once.

- [ ] Extract source ZIP into a new folder, without overwriting existing vault data; app and root vault/extension/spec/docs all present.
- [ ] Node available; `start-app.bat` syntax actually works under cmd.exe, including paths with spaces and Node version expression.
- [ ] Existing Ollama reused; no reinstallation/download/kill/wildcard origin changes; existing qwen2.5:3b found.
- [ ] Real `/tags` and `/show` metadata, ready/error/refresh/select state. No automatic switch or cloud call.
- [ ] API8765 ready or healthy existing instance reused and actual vault root reported; no app-local duplicate vault.
- [ ] Real reply/Stop/reload/chat switching/history, partial/error labels and vault originals; source failures shown/retryable.
- [ ] Requested HTML/SVG counter/game interactive; ordinary chat never creates unsolicited artifacts. Code/edit/local versions/download warnings work.
- [ ] Text attachment actually affects real answer; PDF/Word oversized/unknown honest rejection. Images require already-installed verified vision; qwen2.5:3b remains text-only. No larger-model performance promise.
- [ ] Thinking shows only actual model output; no fake stream. Memory/RAM/VRAM/speed acceptable; no frontier-intelligence claim.
- [ ] Dark default main#1a1a1a/sidebar260px#202020/composer#242424; default Narrow588; sidebar/modals/greeting/fonts measured at actual Windows DPI.
- [ ] Native title bar/windows controls and File/Edit/View/Go/Help in future wrapper; current target is web, buildBAT is not installer.

## Extension/cognitive features — NOT verified/shipped end-to-end

- [ ] Unpacked Chrome loads; one-time authorized sources; deny before any URL/history/DOM observation, synced with canonical vault (server deny alone insufficient).
- [ ] Default check-all scope honest on accessible/inaccessible pages/all actual AI adapters; no secrets/unsent drafts/hidden keystrokes/screenshots/incognito capture.
- [ ] Offline queue survives failed/non-2xx/malformed API response and deduplicates retry; no false save.
- [ ] Submitted messages/pages/visit-only metadata and attachments reach real Obsidian source files; inaccessible errors quietly in both folders.
- [ ] Complete Capsule library/editor/project versions/branch/rollback/attachment transfer; exactly approved external injections.
- [ ] Open Loops/Current Snapshot; source-linked Today/Dhaka journals; approved follow-up cadence/skip/snooze/stop.
- [ ] User-triggered monthly-audit dry-run and distinct archive/expire/forget-derived/delete-source actions.
- [ ] Native installer tested; source ZIP verified before any merge; external push content/destination approved separately.

## Data boundary

Tests use temporary vaults; mocked model replies do not establish real quality. Canonical local blacklist/activity/revision edits found while preview ran have an unconfirmed initiating action, were retained, and are **not staged or exported**. Do not revert/delete/upload them automatically. Existing tracked vault files can still change despite ignore rules; use selective source staging.
