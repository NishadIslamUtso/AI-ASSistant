import { readFileSync } from 'node:fs'
import test from 'node:test'
import assert from 'node:assert/strict'

/**
 * The brain as a first-class view — the "Claude OS" idea: the vault's
 * connections are one sidebar click away, drawn by the same honest engine the
 * Settings embed uses, never a second implementation.
 */

const read = (relative: string): string => readFileSync(new URL(relative, import.meta.url), 'utf8')

test('the brain is a first-class view: nav entry, menu entry, full-height canvas', () => {
  const nav = read('../src/renderer/src/components/AppNav.tsx')
  assert.match(nav, /'brain'/)
  assert.match(nav, /label: 'Brain'/)

  const app = read('../src/renderer/src/App.tsx')
  assert.match(app, /BrainView/)
  assert.match(app, /'brain'/)

  const menu = read('../src/main/index.ts')
  assert.match(menu, /menu:view:brain/)

  // One graph engine, two sizes: the view asks for 'full', settings keeps 'card'.
  const view = read('../src/renderer/src/components/BrainView.tsx')
  assert.match(view, /variant="full"/)
  const graph = read('../src/renderer/src/components/ConnectionGraph.tsx')
  assert.match(graph, /variant = 'card'/)
  assert.match(graph, /MAX_NODES/)

  // Settings stays compressed and gains only a door into the view.
  const section = read('../src/renderer/src/components/BrainStructureSection.tsx')
  assert.match(section, /Open the 3D brain/)
})

test('the brain view tells the truth about dead links instead of drawing them', () => {
  const view = read('../src/renderer/src/components/BrainView.tsx')
  assert.match(view, /dead/)
  assert.match(view, /never drawn as if they connected/)
})
