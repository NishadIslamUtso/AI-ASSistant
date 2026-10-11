// Minimal ZIP writer (STORE method, no compression, no dependencies).
// Used to export an artifact as a small project folder the user can unzip.
const encoder = new TextEncoder()
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()
export function crc32(bytes) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}
// entries: [{ name: 'folder/file.txt', data: string | Uint8Array }]
export function createZip(entries) {
  const parts = [], central = []
  let offset = 0
  for (const entry of entries) {
    const name = encoder.encode(entry.name.replace(/\\/g, '/'))
    const data = typeof entry.data === 'string' ? encoder.encode(entry.data) : entry.data
    const crc = crc32(data)
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true) // UTF-8 names
    local.setUint16(8, 0, true); local.setUint16(10, 0, true); local.setUint16(12, 0x21, true) // stored, fixed 1980-01-01 date
    local.setUint32(14, crc, true); local.setUint32(18, data.length, true); local.setUint32(22, data.length, true)
    local.setUint16(26, name.length, true); local.setUint16(28, 0, true)
    parts.push(new Uint8Array(local.buffer), name, data)
    const record = new DataView(new ArrayBuffer(46))
    record.setUint32(0, 0x02014b50, true); record.setUint16(4, 20, true); record.setUint16(6, 20, true); record.setUint16(8, 0x0800, true)
    record.setUint16(10, 0, true); record.setUint16(12, 0, true); record.setUint16(14, 0x21, true)
    record.setUint32(16, crc, true); record.setUint32(20, data.length, true); record.setUint32(24, data.length, true)
    record.setUint16(28, name.length, true); record.setUint32(42, offset, true)
    central.push(new Uint8Array(record.buffer), name)
    offset += 30 + name.length + data.length
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true)
  end.setUint32(12, centralSize, true); end.setUint32(16, offset, true)
  const all = [...parts, ...central, new Uint8Array(end.buffer)]
  const out = new Uint8Array(all.reduce((sum, part) => sum + part.length, 0))
  let position = 0
  for (const part of all) { out.set(part, position); position += part.length }
  return out
}
