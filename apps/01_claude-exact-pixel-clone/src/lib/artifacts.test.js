import test from 'node:test'
import assert from 'node:assert/strict'
import { extractHtmlArtifact, isExplicitArtifactRequest, makeSandboxDocument } from './artifacts.js'

test('detects explicit runnable artifact requests', () => {
  assert.equal(isExplicitArtifactRequest('Build me an offline budget calculator'), true)
  assert.equal(isExplicitArtifactRequest('Can you make a small browser game?'), true)
})

test('does not turn explanatory questions into artifacts', () => {
  assert.equal(isExplicitArtifactRequest('How do I build a browser game?'), false)
  assert.equal(isExplicitArtifactRequest('Explain what HTML is'), false)
  assert.equal(isExplicitArtifactRequest('Help me understand this calculator formula'), false)
})

test('extracts only a complete artifact HTML fence', () => {
  const result = extractHtmlArtifact('Ready.\n```artifact-html\n<!doctype html><title>Counter</title><h1>Counter</h1>\n```')
  assert.equal(result.title, 'Counter')
  assert.equal(result.type, 'html')
  assert.match(result.content, /<h1>Counter<\/h1>/)
  assert.equal(extractHtmlArtifact('```html\n\n```'), null)
})

test('adds a restrictive content policy to sandbox documents', () => {
  const result = makeSandboxDocument('<!doctype html><html><head><title>Demo</title></head><body>Hi</body></html>')
  assert.match(result, /Content-Security-Policy/)
  assert.match(result, /connect-src &#x27;none&#x27;|connect-src 'none'/)
  assert.match(result, /<body>Hi<\/body>/)
})
