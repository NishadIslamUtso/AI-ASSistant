# Tests waiting for the code they test

These test files are ported and kept here on purpose, but they are **not in
the run yet**, because the thing each one tests does not exist in this app so
far. They are not deleted and they are not passing-by-accident; they are parked
where nobody can mistake them for coverage.

| file | waits for |
| --- | --- |
| `props.test.js` | the renderer components — checks every prop a component destructures is actually passed where it renders. Needs `src/renderer/src/components/*.tsx`. |
| `wiring.test.js` | the same: every relative import resolves, every identifier called is defined. |
| ~~`proxy-policy.test.cjs`~~ | **Done** — its subject landed in `src/main/api/guard.ts`, so the test moved back up to `tests/proxy-policy.test.ts` and passes. |
| `vault-api.test.cjs` | the vault API — currently `server/vault-api.cjs` in the old app. Its new home is the main process, so this test is rewritten for that, not copied blindly. |
| `blacklist-parity.test.cjs` | the vault's excluded-site list and the extension's copy of it, which must agree. Needs both the vault service and the extension ported. |
| `vault-capture.test.cjs` | the vault's capture/append logic as it lives in `server/`, which becomes a service in the main process. Renamed on the way in, so nobody confuses it with `tests/vault.test.js` (the capsule parsing that *is* ported and green). |
| `server-zip.test.cjs` | the server's own ZIP writer. The renderer's writer is ported and tested (`tests/zip*` is not a typo — the browser copy is covered by `best-of-all.test.js`); this one is the server route's, and moves with it. |

When each one's subject lands, move the file back up into `tests/` and make it
pass. A file left here after the code exists is a bug, not a resting place.
