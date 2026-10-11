import test from 'node:test'
import assert from 'node:assert/strict'
import { extractLiveSource, buildPreviewHtml } from '../src/lib/artifacts.js'

test('extractLiveSource surfaces an unclosed html fence while streaming', () => {
  const partial = 'Sure, here it is:\n```html\n<!doctype html><html><body><h1>Hi</h1>' + '<p>x</p>'.repeat(40)
  const live = extractLiveSource(partial)
  assert.ok(live)
  assert.equal(live.type, 'html')
  assert.equal(live.complete, false)
  assert.ok(live.source.startsWith('<!doctype html>'))
})

test('extractLiveSource reports complete for closed fences and picks the last fence', () => {
  const content = '```html\n<div>old</div>\n```\nthen\n```svg\n' + '<circle cx="1" cy="1" r="1"/>'.repeat(20) + '\n```'
  const live = extractLiveSource(content)
  assert.ok(live)
  assert.equal(live.type, 'svg')
  assert.equal(live.complete, true)
})

test('extractLiveSource ignores tiny fragments and text without fences', () => {
  assert.equal(extractLiveSource('```html\n<h1>x</h1>'), null)
  assert.equal(extractLiveSource('no fences here, just an answer about html artifacts'), null)
  assert.equal(extractLiveSource(''), null)
})

test('buildPreviewHtml keeps the strict CSP and ships the comment-mode pin bridge', () => {
  const html = buildPreviewHtml('<p>hello</p>', 'chan-1')
  assert.match(html, /default-src 'none'/)
  assert.match(html, /ai-assistant-pin-mode/)
  assert.match(html, /ai-assistant-artifact-pin/)
  assert.match(html, /body\.pin-mode/)
  assert.match(html, /"chan-1"/)
  // pin clicks must not escape the channel guard
  assert.match(html, /data\.channel !== channel/)
})
