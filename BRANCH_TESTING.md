# BRANCH_TESTING — source ZIP before merge

**Branch:** `arena/01199af1-ai-assistant` · **Date:** 2026-10-10 · **No push/merge performed.**

## Included runnable source

The source ZIP contains the full committed repository, not only a changed-file patch: active `apps/01_claude-exact-pixel-clone` (including new components/helpers/tests/package lock/API/BAT files), Electron reference, `extension`, **committed starter** `vault/AI-Brain`, all screenshot/spec files, living/testing/requirements docs, `.ai` + visible `ai`, original requirement history, scripts and session memory.

It excludes `.git`/credentials, node_modules, build outputs, caches, test reports/traces, nested historical ZIPs and **uncommitted runtime/private vault data**. This is **source**, not a Windows installer or private-data backup. Preserve your existing vault; extract into a new folder.

## Safe developer source export

Local commits are allowed. Review and stage code/docs selectively; never `git add .` when vault data has changed. In this Arena session do all work on the fixed branch above; do not create/switch/push another branch.

```sh
node scripts/package-source.cjs
# optional new output path; existing output is never overwritten:
node scripts/package-source.cjs --output deliverables/another-source.zip
```

`build-master-zip.sh/.bat` delegate to this exporter. Unlike the old scripts, they do not assume a renamed master directory, blindly copy private runtime data, delete temp directories or mask archive failures. Packaging requires a Git checkout, Node and a reviewed local HEAD. A downloaded app ZIP does **not** require Git to launch.

The exporter refuses uncommitted source, excludes uncommitted runtime files through Git-tree export, and refuses HEAD vault changes relative to the approved61-file starting templates. This prevents a later local private-memory commit being silently included in a shareable source ZIP. It does not upload anything.

## Current evidence

- [x] Active production build passes.
- [x] **42 Node/API tests + 22 mocked-browser tests pass.** Browser isolation tests run with web security intact.
- [x] Home/menu/settings/apps visually reviewed at native1920×1020 via1280×680CSS/DPR1.5, zero page errors. Actual Windows font/DPI and exact-pixel approval remain unverified.
- [x] Source ZIP integrity/file completeness and clean-extraction `npm ci`/build/42Node+22browser tests — verified, details below.
- [ ] Real Windows BAT/existing Ollama/real replies/capability/Obsidian/extension E2E/user screenshot confirmation.
- [ ] Thin native wrapper/title bar/menu/installer.

## Remote boundary

A GitHub push is external send. Preview the **exact reviewed source diff and destination branch**, get approval, and only then push `origin arena/01199af1-ai-assistant`. Never push private vault data automatically. No PR merge until the branch ZIP contains all runnable source and laptop checks are honestly recorded. Do not confuse a passing Linux/mock test with native Windows or real model confirmation.

For the Windows beginner, the **next single action** is extracting the supplied ZIP into a new folder. Wait for the result before giving the launcher step. Do not ask to pull/reinstall Ollama/qwen2.5:3b.

## Final clean-source ZIP verification — 2026-10-10

- **Verified code commit:** `c512e5a9d3369c18c761e6c19205ce7d44b4c254` on the fixed Arena branch (local-only).
- Source ZIP CRC and **all251 committed file blob hashes match**; full target source/lock/tests/API/BAT plus reference/extension/61starter-vault/spec/docs/ai mirrors present. Native reference dimensions checked; caches/builds/credentials/runtime vault scope/activity/revisions excluded.
- Clean extraction into a new sandbox directory; fresh `npm ci` installed306 pinned packages in3s. **42/42 Node/API tests, production build, and22/22 Playwright tests passed from the extracted source**. Build assets match the main checkout: `index-Zkdxa3Sr.js`, `index-F6Hb5vAH.css`.
- Source64 checks include final middle/context-link approval and malformed-HTTP200 save-acknowledgement guards. Earlier b2700dc/62check preflight is superseded.
- Final delivered archive adds documentation-only evidence updates; application/lock/server/test/scripts/source bytes remain identical to this verified code snapshot, with final archive CRC/all-tree hashes checked again. No private working-tree files included, no push/merge, no installer/real-model/Windows claim.

Delivered path: `deliverables/AI-ASSistant-branch-source.zip` (~3.03MB). Next user step: extract into a **new** Windows folder without overwriting a real vault.
