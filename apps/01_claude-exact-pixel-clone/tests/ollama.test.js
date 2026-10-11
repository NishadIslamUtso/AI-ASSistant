import test from 'node:test'
import assert from 'node:assert/strict'
import {
  splitThinking,
  modelSupportsImages,
  modelSizeLabel,
  shortModelName,
  DEFAULT_OLLAMA_URL,
} from '../src/lib/ollama.js'

test('default endpoint is the local Ollama, nothing remote', () => {
  assert.match(DEFAULT_OLLAMA_URL, /^http:\/\/127\.0\.0\.1:\d+$/)
})

test('<think> blocks are split out of the visible answer', () => {
  const { thinking, answer } = splitThinking('<think>reasoning here</think>The answer')
  assert.equal(thinking, 'reasoning here')
  assert.equal(answer, 'The answer')
})

test('plain answers have no thinking block', () => {
  const { thinking, answer } = splitThinking('Just an answer')
  assert.equal(thinking, '')
  assert.equal(answer, 'Just an answer')
})

test('an unclosed <think> still hides the reasoning from the answer', () => {
  const { thinking, answer } = splitThinking('<think>still thinking')
  assert.equal(thinking, 'still thinking')
  assert.equal(answer, '')
})

test('vision support is detected from the model name', () => {
  assert.equal(modelSupportsImages('qwen2.5:3b'), false)
  assert.equal(modelSupportsImages('qwen3-vl:4b'), true)
  assert.equal(modelSupportsImages('llava:latest'), true)
  assert.equal(modelSupportsImages('llama3.1:8b'), false)
})

test('model helpers format labels sanely', () => {
  assert.equal(modelSizeLabel('qwen2.5:3b'), '3B')
  assert.equal(modelSizeLabel('llama3.1:8b-instruct-q4_0'), '8B')
  assert.equal(shortModelName('qwen2.5:3b'), 'qwen2.5')
})
