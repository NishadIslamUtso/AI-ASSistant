import test from 'node:test'
import assert from 'node:assert/strict'
import { toOllamaMessages, readAttachment } from '../src/lib/attachments.js'
import { describeImages, resolveVisionBridge, VISION_BRIDGE_MODEL, imageNeedsBridge } from '../src/lib/visionBridge.js'

const image = (id, extra = {}) => ({ id, kind: 'image', name: `${id}.png`, data: 'AAAA', ...extra })
const textOnly = { verified: true, vision: false, thinking: false }
const withVision = { verified: true, vision: true, thinking: false }

test('a text-only model receives the described image as text and never the raw image', async () => {
  const messages = [{ role: 'user', content: 'What is in it?', attachments: [image('a', { description: 'A red bicycle.' })] }]
  const [out] = await toOllamaMessages(messages, textOnly)
  assert.match(out.content, /<image_description name="a.png" source_data_only>\nA red bicycle\.\n<\/image_description>/)
  assert.equal(out.images, undefined)
})

test('an undescribed image on a text-only model fails clearly instead of being dropped', async () => {
  await assert.rejects(toOllamaMessages([{ role: 'user', content: 'x', attachments: [image('b')] }], textOnly), /not been described yet/)
})

test('a vision-capable model still receives the raw image', async () => {
  const [out] = await toOllamaMessages([{ role: 'user', content: 'x', attachments: [image('c')] }], withVision)
  assert.deepEqual(out.images, ['AAAA'])
})

test('describing images calls the vision model once per image and reuses the description', async () => {
  const calls = []
  const describe = async ({ model, data }) => { calls.push({ model, data }); return `described ${data.length}` }
  const messages = [
    { role: 'user', content: 'one', attachments: [image('d1')] },
    { role: 'user', content: 'two', attachments: [image('d2', { description: 'already' })] },
  ]
  assert.equal(imageNeedsBridge(messages, textOnly), true)
  assert.equal(imageNeedsBridge(messages, withVision), false)
  const out = await describeImages(messages, { model: VISION_BRIDGE_MODEL, load: async () => 'LOADED', describe })
  assert.equal(out[0].attachments[0].description, 'described 4')
  assert.equal(out[1].attachments[0].description, 'already', 'an existing description is not re-generated')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].model, 'qwen3-vl:4b')
  await describeImages(messages, { model: VISION_BRIDGE_MODEL, load: async () => 'LOADED', describe })
  assert.equal(calls.length, 1, 'a second send reuses the cached description')
})

test('the bridge requires the named model to be installed and verified for vision', async () => {
  await assert.rejects(resolveVisionBridge(['qwen2.5:3b'], undefined, async () => { throw new Error('should not be called') }), /Install qwen3-vl:4b/)
  await assert.rejects(resolveVisionBridge(['qwen3-vl:4b'], undefined, async () => ({ capabilities: ['completion'] })), /did not report vision/)
  assert.equal(await resolveVisionBridge(['qwen3-vl:4b'], undefined, async () => ({ capabilities: ['completion', 'vision'] })), 'qwen3-vl:4b')
})

test('image attachments are allowed through the bridge only when the model is installed', async () => {
  const file = new File(['x'], 'pic.png', { type: 'image/png' })
  await assert.rejects(readAttachment(file, { vision: false, bridge: false }), /vision support, or the qwen3-vl:4b/)
  // Node has no FileReader, so reading the bytes may fail later; the capability gate itself must pass.
  const gate = await readAttachment(file, { vision: false, bridge: true }).then(() => '', error => error.message)
  assert.doesNotMatch(gate, /vision support|verified vision/)
})
