import { inflateRawSync } from 'node:zlib'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createZip, crc32, safeEntryName } from '../src/main/vault/zip'

/**
 * The hand-rolled ZIP writer used by the deployable export.
 *
 * The archive is read back rather than handed to `unzip`, so it runs anywhere
 * node runs — and reading it back is the stronger check anyway: it proves the
 * container is well formed, not just that some tool tolerated it.
 */

const LOCAL = 0x04034b50

/** Parse an archive back into [{ name, content }]. */
function readZip(buffer: Buffer): Array<{ name: string; content: string; uncompressedSize: number }> {
  const entries: Array<{ name: string; content: string; uncompressedSize: number }> = []
  let index = 0
  while (index < buffer.length && buffer.readUInt32LE(index) === LOCAL) {
    const method = buffer.readUInt16LE(index + 8)
    const compressedSize = buffer.readUInt32LE(index + 18)
    const uncompressedSize = buffer.readUInt32LE(index + 22)
    const nameLength = buffer.readUInt16LE(index + 26)
    const name = buffer.subarray(index + 30, index + 30 + nameLength).toString('utf8')
    const payload = buffer.subarray(index + 30 + nameLength, index + 30 + nameLength + compressedSize)
    entries.push({
      name,
      content: (method === 8 ? inflateRawSync(payload) : payload).toString('utf8'),
      uncompressedSize,
    })
    index += 30 + nameLength + compressedSize
  }
  return entries
}

test('a zip round-trips: names, contents and sizes all survive', () => {
  const files = [
    { name: 'index.html', content: '<!doctype html><html><body>hi</body></html>' },
    { name: 'src/app.js', content: 'console.log("hello")' },
    { name: 'README.md', content: '# Artifact\n\nRun: npx serve .' },
  ]
  const entries = readZip(createZip(files))
  assert.deepEqual(
    entries.map(entry => entry.name),
    ['index.html', 'src/app.js', 'README.md']
  )
  for (const file of files) {
    const entry = entries.find(item => item.name === file.name)
    assert.equal(entry?.content, file.content)
    assert.equal(entry?.uncompressedSize, Buffer.byteLength(file.content, 'utf8'))
  }
})

test('compressible content is deflated, and the file is smaller for it', () => {
  const content = 'the same line over and over\n'.repeat(200)
  const archive = createZip([{ name: 'big.txt', content }])
  assert.equal(archive.readUInt16LE(8), 8, 'deflate, the method that compresses')
  assert.ok(archive.length < content.length, 'a compressible file gets smaller')
  assert.equal(readZip(archive)[0].content, content)
})

test('content that does not compress is stored instead of inflated', () => {
  // 200 random-ish bytes: deflating them would make the entry larger.
  const content = Array.from({ length: 200 }, (_, i) => String.fromCharCode(33 + ((i * 37) % 90))).join('')
  const archive = createZip([{ name: 'noise.txt', content }])
  assert.equal(readZip(archive)[0].content, content)
})

test('crc32 is the standard one', () => {
  // The check value every CRC-32 implementation is measured against.
  assert.equal(crc32(Buffer.from('123456789', 'utf8')), 0xcbf43926)
})

test('an entry name that could leave the archive is refused, never rewritten', () => {
  for (const name of ['../escape.txt', '/etc/passwd', 'a/../../b.txt', 'back\\slash.txt', 'C:drive.txt', 'dir//file.txt', './file.txt', 'x'.repeat(241), '']) {
    assert.throws(() => safeEntryName(name), /archive entry name/i, JSON.stringify(name))
  }
})

test('an empty archive and an oversized one are both refused', () => {
  assert.throws(() => createZip([]), /Nothing to archive/)
  const many = Array.from({ length: 201 }, (_, i) => ({ name: `file-${i}.txt`, content: 'x' }))
  assert.throws(() => createZip(many), /maximum of 200 files/i)
})

test('a name with an unusual but safe character survives unchanged', () => {
  // Non-ASCII names are the user's names; they are kept as written.
  assert.equal(safeEntryName('notes/Ünicode and spaces.md'), 'notes/Ünicode and spaces.md')
  const archive = createZip([{ name: 'notes/Ünicode and spaces.md', content: 'ok' }])
  assert.equal(readZip(archive)[0].name, 'notes/Ünicode and spaces.md')
  assert.equal(readZip(archive)[0].content, 'ok')
})
