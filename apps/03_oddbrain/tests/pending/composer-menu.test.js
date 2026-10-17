import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * Moved here from tests/prompts.test.js: the slash-menu logic is tested there
 * without a browser, but the keyboard wiring lives in the Composer component,
 * which is not ported yet.
 *
 * When the Composer lands at src/renderer/src/components/, move this file back
 * into tests/ and fix the path below — it is deliberately written for the new
 * layout, so a copy that still reads src/components/ would fail loudly.
 */
const components = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'renderer', 'src', 'components')

test('the composer wires the menu to the keyboard', () => {
  const source = readFileSync(join(components, 'Composer.tsx'), 'utf8')
  assert.match(source, /slashOpen/, 'the composer must know when the menu is open')
  for (const key of ['ArrowDown', 'ArrowUp', 'Escape', 'Tab']) {
    assert.match(source, new RegExp(`'${key}'`), `the composer must handle ${key}`)
  }
})
