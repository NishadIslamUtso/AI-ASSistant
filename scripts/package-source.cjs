#!/usr/bin/env node
// Source export only: no filesystem-wide ZIP, runtime notes, credentials,
// dependency caches, builds, remote sends or destructive temp-directory cleanup.
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync, spawnSync } = require('node:child_process')
const root = path.resolve(__dirname, '..')
const starter = '547b4d81401a9e56232234fb96649386e89f362a'
function git(args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 4_000_000 }).trim() }
try {
  if (path.resolve(git(['rev-parse', '--show-toplevel'])) !== root) throw new Error('Run this from the real repository checkout. A downloaded source ZIP does not need Git to launch the app.')
  const changed = git(['diff', '--name-only', 'HEAD', '-z']).split('\0').filter(Boolean)
  const untracked = git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean)
  if ([...changed, ...untracked].some(file => !file.startsWith('vault/AI-Brain/'))) throw new Error('There are uncommitted/untracked source edits. Review and commit source selectively first; never blindly stage private vault data. This exporter packages HEAD only.')
  const vault = spawnSync('git', ['diff', '--quiet', starter, 'HEAD', '--', 'vault/AI-Brain'], { cwd: root })
  if (vault.status !== 0) throw new Error('HEAD differs from the approved starter vault. Source export refused to avoid bundling private committed vault data. Review the vault changes explicitly before any sharing.')
  const option = process.argv.indexOf('--output')
  const output = path.resolve(root, option >= 0 ? process.argv[option + 1] || '' : 'deliverables/AI-ASSistant-branch-source.zip')
  if (!output.endsWith('.zip')) throw new Error('Output must be a .zip path.')
  if (fs.existsSync(output)) throw new Error('Output already exists; choose a new filename. Existing files will not be deleted or overwritten.')
  fs.mkdirSync(path.dirname(output), { recursive: true })
  execFileSync('git', ['archive', '--format=zip', '--prefix=AI-ASSistant/', `--output=${output}`, 'HEAD'], { cwd: root, stdio: 'inherit' })
  console.log(JSON.stringify({ source_zip: output, branch: git(['branch', '--show-current']), commit: git(['rev-parse', 'HEAD']), bytes: fs.statSync(output).size, runtime_vault_data: 'excluded; unchanged committed starter only', external_send: false }, null, 2))
} catch (error) {
  console.error(`Source ZIP not created: ${error.message}`)
  process.exitCode = 1
}
