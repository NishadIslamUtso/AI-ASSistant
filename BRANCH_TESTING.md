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
- [x] **41 Node/API tests + 21 mocked-browser tests pass.** Browser isolation tests run with web security intact.
- [x] Home/menu/settings/apps visually reviewed at native1920×1020 via1280×680CSS/DPR1.5, zero page errors. Actual Windows font/DPI and exact-pixel approval remain unverified.
- [ ] Source ZIP integrity/file completeness and clean-extraction `npm ci`/build/tests — verification result appended below when complete.
- [ ] Real Windows BAT/existing Ollama/real replies/capability/Obsidian/extension E2E/user screenshot confirmation.
- [ ] Thin native wrapper/title bar/menu/installer.

## Remote boundary

A GitHub push is external send. Preview the **exact reviewed source diff and destination branch**, get approval, and only then push `origin arena/01199af1-ai-assistant`. Never push private vault data automatically. No PR merge until the branch ZIP contains all runnable source and laptop checks are honestly recorded. Do not confuse a passing Linux/mock test with native Windows or real model confirmation.

For the Windows beginner, the **next single action** is extracting the supplied ZIP into a new folder. Wait for the result before giving the launcher step. Do not ask to pull/reinstall Ollama/qwen2.5:3b.
