import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * The Connectors pane: three brains, three cards, each stating what the
 * machine actually answered and the one action that improves it. The owner's
 * call: leave the downloader alone — the Ollama card's primary route is the
 * official install (winget / ollama.com), the staged copy stays secondary,
 * and the card answers his real question in-product: the zip IS the
 * CLI-only build, the app never needs to carry it.
 */

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8')

test('all three connectors exist as real cards', () => {
  const section = read('../src/renderer/src/components/ConnectorsSection.tsx')
  assert.match(section, /aria-label="Claude Code connector"/)
  assert.match(section, /aria-label="agy connector"/)
  assert.match(section, /aria-label="Ollama connector"/)
})

test('statuses are WORDS from the machine, never coloured dots', () => {
  const section = read('../src/renderer/src/components/ConnectorsSection.tsx')
  assert.ok(!section.includes('bg-ok'), 'no fake green dot — that lie is banned here')
  assert.match(section, /installed · /)
  assert.match(section, /answering at /)
  assert.match(section, /nothing answering at /)
})

test('each engine card has its real action: use, install command, official page', () => {
  const section = read('../src/renderer/src/components/ConnectorsSection.tsx')
  assert.match(section, /Use this engine/)
  assert.match(section, /npm install -g @anthropic-ai\/claude-code/)
  assert.match(section, /https:\/\/antigravity\.google/)
  assert.match(section, /Check all/)
})

test('the Ollama card recommends the official install and answers the CLI question in-product', () => {
  const section = read('../src/renderer/src/components/ConnectorsSection.tsx')
  assert.match(section, /winget install Ollama\.Ollama/)
  assert.match(section, /https:\/\/ollama\.com\/download/)
  assert.match(section, /CLI-only build/)
  // no downloader promises: the staged copy is mentioned, not the hero
  assert.ok(!section.includes('Download from the official endpoint'))
})

test('the Connectors pane renders the section for all three', () => {
  const settings = read('../src/renderer/src/components/SettingsView.tsx')
  assert.match(settings, /body: <ConnectorsSection \/>/)
  assert.match(settings, /The three brains/)
})
