import test from 'node:test'
import assert from 'node:assert/strict'
import { deflateRawSync, inflateRawSync } from 'node:zlib'
import { branchChat } from '../src/lib/branching.js'
import { createZip, crc32 } from '../src/lib/zip.js'
import { artifactProjectFiles, safeFileName } from '../src/lib/exportProject.js'

let counter = 0
const newId = () => `id${++counter}`
const chat = () => ({
  id: 'orig', title: 'Plan the trip', date: 'Today', projectId: 'p1',
  messages: [
    { id: 'm1', role: 'user', content: 'hi', attachments: [{ id: 'att1', kind: 'image', name: 'a.png' }] },
    { id: 'm2', role: 'assistant', content: 'hello', status: 'complete', artifacts: [{ id: 'm2-artifact-0', chatId: 'orig', messageId: 'm2', type: 'html', title: 'App', versions: [{ content: '<p>x</p>' }] }] },
    { id: 'm3', role: 'user', content: 'later', status: undefined },
  ],
})

test('branching copies history up to the chosen message with new ids and leaves the original untouched', () => {
  const original = chat()
  const snapshot = JSON.stringify(original)
  const branch = branchChat(original, 'm2', { newId, now: () => '2026-10-12T00:00:00.000Z' })
  assert.equal(JSON.stringify(original), snapshot, 'original chat unchanged')
  assert.equal(branch.messages.length, 2, 'messages after the branch point are not copied')
  assert.notEqual(branch.id, original.id)
  assert.equal(branch.title, 'Branch: Plan the trip')
  assert.deepEqual(branch.branchOf, { chatId: 'orig', messageId: 'm2', createdAt: '2026-10-12T00:00:00.000Z' })
  assert.equal(branch.projectId, 'p1')
  const [user, assistant] = branch.messages
  assert.ok(!['m1', 'm2'].includes(user.id) && !['m1', 'm2'].includes(assistant.id), 'message ids are fresh')
  assert.equal(user.attachments[0].id, 'att1', 'attachment ids are kept so stored images still resolve')
  assert.equal(assistant.artifacts[0].chatId, branch.id)
  assert.equal(assistant.artifacts[0].messageId, assistant.id)
  assert.notEqual(assistant.artifacts[0].id, 'm2-artifact-0')
  assert.equal(assistant.artifacts[0].versions[0].content, '<p>x</p>')
})

test('branching refuses unknown messages and streaming replies', () => {
  assert.throws(() => branchChat(chat(), 'missing', { newId }), /no longer in this chat/)
  const streaming = chat()
  streaming.messages[1].status = 'streaming'
  assert.throws(() => branchChat(streaming, 'm2', { newId }), /Wait for the reply/)
})

test('ZIP export produces a valid archive whose entries round-trip byte-for-byte', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xCBF43926, 'standard CRC-32 check value')
  const files = [{ name: 'index.html', data: '<h1>Hi é</h1>' }, { name: 'sub/README.md', data: '# Notes\n' }]
  const zip = createZip(files)
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength)
  const eocd = zip.length - 22
  assert.equal(view.getUint32(eocd, true), 0x06054b50, 'end of central directory present')
  assert.equal(view.getUint16(eocd + 10, true), 2, 'entry count')
  const decoder = new TextDecoder()
  let offset = 0
  for (const file of files) {
    assert.equal(view.getUint32(offset, true), 0x04034b50, 'local header signature')
    const size = view.getUint32(offset + 18, true), nameLength = view.getUint16(offset + 26, true)
    const name = decoder.decode(zip.subarray(offset + 30, offset + 30 + nameLength))
    assert.equal(name, file.name)
    const body = zip.subarray(offset + 30 + nameLength, offset + 30 + nameLength + size)
    assert.equal(decoder.decode(body), file.data)
    assert.equal(view.getUint32(offset + 14, true), crc32(body), 'stored CRC matches the data')
    offset += 30 + nameLength + size
  }
  assert.equal(deflateRawSync(Buffer.from('ok')).length > 0 && inflateRawSync(deflateRawSync(Buffer.from('ok'))).toString(), 'ok')
})

test('artifact export bundles the exact source plus notes, and file names are safe', () => {
  const artifact = { title: 'Counter / App!', type: 'html', versions: [{ content: '<p>v1</p>' }, { content: '<p>v2</p>' }] }
  const files = artifactProjectFiles(artifact)
  assert.deepEqual(files.map(file => file.name), ['index.html', 'artifact.json', 'README.md'])
  assert.equal(files[0].data, '<p>v2</p>', 'defaults to the latest version')
  assert.equal(artifactProjectFiles(artifact, 0)[0].data, '<p>v1</p>')
  assert.match(files[2].data, /NOT sandboxed/)
  assert.equal(artifactProjectFiles({ title: 'Chart', type: 'svg', versions: [{ content: '<svg/>' }] })[0].name, 'image.svg')
  assert.equal(safeFileName('Counter / App!', 'zip'), 'Counter-App.zip')
  assert.equal(safeFileName('', 'zip'), 'artifact.zip')
})
