import test from 'node:test'
import assert from 'node:assert/strict'
import {
  wantsArtifact,
  artifactsFromReply,
  artifactFromCode,
  buildPreviewHtml,
  extractCodeBlocks,
} from '../src/lib/artifacts.js'

const HTML = '```html\n<!doctype html><html><title>Counter</title><body>Hello</body></html>\n```'

test('artifacts are only created on current explicit intent', () => {
  // the guard that stops the old "Tic Tac Toe on every reply" behaviour
  assert.equal(wantsArtifact('Hello, how are you?'), false)
  assert.equal(wantsArtifact('Explain how to build an HTML app'), false)
  assert.equal(wantsArtifact('Do not create an artifact'), false)
  assert.equal(wantsArtifact('What is a closure?'), false)
  assert.equal(wantsArtifact('Review this code'), false)
})

test('explicit build requests are recognised', () => {
  assert.equal(wantsArtifact('Build an interactive counter web app'), true)
  assert.equal(wantsArtifact('make me a tic tac toe game'), true)
  assert.equal(wantsArtifact('create an html page for my CV'), true)
  assert.equal(wantsArtifact('write a calculator'), true)
  // artifact mode switch always wins
  assert.equal(wantsArtifact('a blue counter', true), true)
})

test('a reply only becomes artifacts when the turn was requested', () => {
  assert.deepEqual(artifactsFromReply(HTML, false), [])
  assert.equal(artifactsFromReply(HTML, true).length, 1)
})

test('complete documents are extracted, fragments are not run', () => {
  const one = artifactsFromReply(HTML, true)
  assert.equal(one.length, 1)
  assert.equal(one[0].title, 'Counter')
  assert.equal(one[0].type, 'html')
  assert.match(one[0].content, /Hello/)

  // an unclosed fence is never treated as a runnable artifact
  assert.equal(artifactsFromReply('```html\n<body>Hello', true).length, 0)
  // svg works
  assert.equal(
    artifactsFromReply('```svg\n<svg xmlns="http://www.w3.org/2000/svg"></svg>\n```', true)[0].type,
    'svg',
  )
  // react cannot be run here, so it is not extracted silently
  assert.equal(artifactsFromReply('```jsx\nexport default App\n```', true).length, 0)
})

test('duplicate blocks inside one reply collapse to one artifact', () => {
  const dup = `${HTML}\n\n${HTML}`
  assert.equal(artifactsFromReply(dup, true).length, 1)
})

test('hand-promoted code blocks keep their <title> as the artifact name', () => {
  const art = artifactFromCode('<!doctype html><html><title>My Page</title></html>', 'html')
  assert.equal(art.title, 'My Page')
  assert.equal(art.type, 'html')
  const svg = artifactFromCode('<svg></svg>', 'svg', 'Fallback')
  assert.equal(svg.type, 'svg')
  assert.equal(svg.title, 'Fallback')
})

test('preview CSP precedes untrusted content and blocks network, forms and frames', () => {
  const result = buildPreviewHtml('<script src="https://example.com/a.js"></script>', '</script>')
  assert.ok(result.indexOf('Content-Security-Policy') < result.indexOf('https://example.com'))
  for (const policy of [
    "connect-src 'none'",
    "form-action 'none'",
    "frame-src 'none'",
    "base-uri 'none'",
    "object-src 'none'",
  ]) {
    assert.ok(result.includes(policy), `missing ${policy}`)
  }
  // the closing script tag inside the injected channel is escaped
  assert.ok(result.includes('\\u003c/script>'))
  assert.doesNotMatch(result, /allow-same-origin|cdn\.jsdelivr|unpkg/)
})

test('code block extraction reports language and content', () => {
  const blocks = extractCodeBlocks('a\n```js\nlet x=1\n```\nb')
  assert.equal(blocks.length, 1)
  assert.equal(blocks[0].lang, 'js')
  assert.equal(blocks[0].code.trim(), 'let x=1')
})
