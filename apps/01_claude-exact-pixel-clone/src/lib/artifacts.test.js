import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildSandboxedPreviewDocument,
  createHtmlArtifact,
  extractExplicitHtmlArtifact,
  getHtmlArtifactTitle,
  isExplicitArtifactRequest,
} from './artifacts.js'

test('artifact intent requires a direct creation request', () => {
  assert.equal(isExplicitArtifactRequest('Build a Tic Tac Toe game'), true)
  assert.equal(isExplicitArtifactRequest('Please create a simple HTML application'), true)
  assert.equal(isExplicitArtifactRequest('Make a responsive landing page for my portfolio'), true)
  assert.equal(isExplicitArtifactRequest('Write code for a small website'), true)
  assert.equal(isExplicitArtifactRequest('Preview this HTML file'), true)
})

test('questions and educational requests do not create artifacts', () => {
  assert.equal(isExplicitArtifactRequest('How do I build a website?'), false)
  assert.equal(isExplicitArtifactRequest('Explain how to create a dashboard'), false)
  assert.equal(isExplicitArtifactRequest('What makes Tic Tac Toe fun?'), false)
  assert.equal(isExplicitArtifactRequest('Create a plan for a website'), false)
  assert.equal(isExplicitArtifactRequest('Write a description for a game'), false)
  assert.equal(isExplicitArtifactRequest('Create a game concept'), false)
  assert.equal(isExplicitArtifactRequest('Can you help me think about a game idea?'), false)
})

test('HTML is extracted only after explicit artifact intent', () => {
  const response = 'Here is the finished page.\n```html\n<!doctype html><html><head><title>Mini board</title></head><body>Ready</body></html>\n```\nOpen it in the preview.'
  const artifact = extractExplicitHtmlArtifact(response, 'Build a small web app')

  assert.ok(artifact)
  assert.match(artifact.html, /<title>Mini board<\/title>/)
  assert.equal(artifact.remaining, 'Here is the finished page.\n\nOpen it in the preview.')
  assert.equal(extractExplicitHtmlArtifact(response, 'Explain how web apps work'), null)
})

test('complete unfenced HTML is accepted as a fallback', () => {
  const response = 'Done:\n<!doctype html><html><head><title>Standalone</title></head><body>Hi</body></html>'
  const artifact = extractExplicitHtmlArtifact(response, 'Create an HTML app')

  assert.ok(artifact)
  assert.match(artifact.html, /^<!doctype html>/i)
  assert.equal(artifact.remaining, 'Done:')
})

test('artifact records get a useful title and retain source', () => {
  const html = '<!doctype html><html><head><title>  Quick &amp; Clear  </title></head><body></body></html>'
  const artifact = createHtmlArtifact(html, new Date('2026-10-10T12:00:00.000Z'))

  assert.equal(getHtmlArtifactTitle(html), 'Quick & Clear')
  assert.equal(artifact.title, 'Quick & Clear')
  assert.equal(artifact.type, 'html')
  assert.equal(artifact.content, html)
  assert.equal(artifact.createdAt, '2026-10-10T12:00:00.000Z')
  assert.ok(artifact.id)
})

test('preview preparation allows local inline UI but blocks network access', () => {
  const preview = buildSandboxedPreviewDocument('<html><head><title>Game</title></head><body><script>document.body.textContent = "ready"</script></body></html>', 'Game')

  assert.match(preview, /Content-Security-Policy/)
  assert.match(preview, /connect-src &#39;none&#39;|connect-src 'none'/)
  assert.match(preview, /navigate-to 'none'/)
  assert.match(preview, /<script>document\.body/)
  assert.match(preview, /<meta name="referrer" content="no-referrer">/)
})

test('HTML snippets are wrapped in a complete preview document', () => {
  const preview = buildSandboxedPreviewDocument('<main>Hello</main>', 'A & B')

  assert.match(preview, /<!doctype html>/)
  assert.match(preview, /<title>A &amp; B<\/title>/)
  assert.match(preview, /<body><main>Hello<\/main><\/body>/)
})
