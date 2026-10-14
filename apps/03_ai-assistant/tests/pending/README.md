# Tests waiting for the code they test

These test files are ported and kept here on purpose, but they are **not in
the run yet**, because the thing each one tests does not exist in this app so
far. They are not deleted and they are not passing-by-accident; they are parked
where nobody can mistake them for coverage.

| file | waits for |
| --- | --- |
| `props.test.js` | the renderer components — checks every prop a component destructures is actually passed where it renders. Needs the rest of the Shell's components to settle. |
| `wiring.test.js` | the same: every relative import resolves, every identifier called is defined. |
| `composer-menu.test.js` | the composer's `+` menu (attach, projects, tools) — the menu itself is not built yet. |

## Unparked — the vault service landed

| was | now | why it moved |
| --- | --- | --- |
| `vault-api.test.cjs` | `tests/vault-service.test.ts` | The vault API became a service in the main process, so the test asserts the same rules against the service rather than against a companion HTTP server. Same file names, same wording in the documents written, same refusals. |
| `vault-capture.test.cjs` | `tests/vault-service.test.ts` | Every capture type, plus the edge cases: Asia/Dhaka dates, symlink escape, path traversal, un-truncated long sources, visit-only metadata, capsule versions, archived capsules, attachments. |
| `vault-api.test.cjs` (routes) | `tests/vault-http.test.ts` | The vault over real HTTP through the real boundary: same-origin rule, JSON-writes-only, 400/403/413/503 replies, and a vault that disappears underneath a running app. |
| `blacklist-parity.test.cjs` | `tests/blacklist-parity.test.ts` | The never-check list is enforced in the vault *and* in the browser extension. This asserts the two implementations answer identically, importing the extension's real module from `extension/lib/blacklist.js`. |
| `server-zip.test.cjs` | `tests/server-zip.test.ts` | The export writer moved into the main process with the vault; the archive is still read back rather than shelled out to `unzip`. |

Three things worth writing down, because they are the reasons the old tests were
not copied verbatim:

1. **The old tests spun up a second Node process** (`server/vault-api.cjs`) and
   posted to port 8765. That process does not exist now — the vault lives in the
   app's main process — so posting to it would have tested a server the app no
   longer runs. The tests call the service directly, and `vault-http.test.ts`
   covers the wire.
2. **The old test asserted the API refused untrusted origins with 403 and
   *accepted* a `chrome-extension://` origin.** The boundary in this app is
   strictly same-origin, so an extension origin is refused today. That is
   correct for now (no extension is ported into this app yet); when the
   extension is ported, allowing `chrome-extension://<32 hex>` for the vault
   routes is a change to `src/main/api/guard.ts`, and BUILD-TODO tracks it.
3. **A missing vault used to throw at startup.** Now the app must still open and
   explain itself, so a missing vault is a 503 with a sentence and a status
   reply of `available: false` — and the test asserts that nothing is ever
   created to stand in for it.

When each one's subject lands, move the file back up into `tests/` and make it
pass. A file left here after the code exists is a bug, not a resting place.
