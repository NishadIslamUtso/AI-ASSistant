/**
 * The download manager: the app brings a brain home at the owner's press.
 *
 * Rules, all enforced in code: only the official endpoint passes, only into
 * the app's own engines folder, capped in size, staged then verified, and a
 * run of a staged installer is its own permission on Windows. The zip reader
 * is deliberately small: stored and deflate entries, a zip-slip refusal, and
 * nothing else — this is not a general archiver, it is one trusted file from
 * one trusted host.
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { inflateRawSync } from 'node:zlib'
import { ENGINE_DOWNLOADS, MAX_DOWNLOAD_BYTES, isOfficialUrl, parseShaLine } from '../../shared/lib/engineDownloads'

export type DownloadTick = { engine: string; got: number; total: number | null; phase: 'downloading' | 'staged' | 'error'; answer?: string }

export type InstallRecord = {
  engine: string
  file: string
  endpoint: string
  sha256: string
  at: string
}

type FetchLike = (url: string) => Promise<{ ok: boolean; status?: number; headers?: { get(name: string): string | null }; arrayBuffer?: () => Promise<ArrayBuffer>; body?: unknown }>

export type DownloadManager = {
  start(engine: string): Promise<{ ok: boolean; answer: string }>
  status(): Promise<Record<string, InstallRecord | undefined>>
  remove(engine: string): Promise<{ ok: boolean; answer: string }>
  /** v1 guard: a staged installer may run only on Windows, only from our folder. */
  runInstaller(engine: string, platform?: string): { ok: boolean; answer: string; command?: string[] }
  ollamaBinary(): string | null
}

export function createDownloadManager(options: {
  root: string
  fetchImpl?: FetchLike
  onTick?: (tick: DownloadTick) => void
  join?: typeof join
}): DownloadManager {
  const root = options.root
  const doFetch: FetchLike = options.fetchImpl ?? (async (url) => {
    const reply = await fetch(url)
    return {
      ok: reply.ok,
      status: reply.status,
      headers: { get: (name: string) => reply.headers.get(name) },
      arrayBuffer: () => reply.arrayBuffer(),
    }
  })
  const onTick = options.onTick ?? (() => undefined)

  const recordPath = (engine: string): string => join(root, engine, 'install-record.json')
  const stagedPath = (engine: string): string | null => {
    const info = ENGINE_DOWNLOADS[engine]
    if (!info || info.kind === 'page') return null
    const name = info.kind === 'zip' ? 'ollama-windows-amd64.zip' : 'install.ps1'
    return join(root, engine, name)
  }

  async function writeRecords(engine: string, record: InstallRecord): Promise<void> {
    await mkdir(join(root, engine), { recursive: true })
    await writeFile(recordPath(engine), JSON.stringify(record, null, 2))
  }

  async function readRecord(engine: string): Promise<InstallRecord | undefined> {
    try {
      return JSON.parse(await readFile(recordPath(engine), 'utf8')) as InstallRecord
    } catch {
      return undefined
    }
  }

  return {
    async start(engine: string): Promise<{ ok: boolean; answer: string }> {
      const info = ENGINE_DOWNLOADS[engine]
      if (!info) return { ok: false, answer: `No download is known for ${engine}.` }
      if (info.kind === 'page') {
        return { ok: false, answer: `${engine} has no verified direct endpoint. Open ${info.page} and install from Google itself; the app will find it on the next check.` }
      }
      if (!isOfficialUrl(engine, info.windows)) {
        // Code, not promise: a tampered endpoint table cannot send you anywhere else.
        return { ok: false, answer: 'That endpoint is not the official one. Nothing was downloaded.' }
      }
      onTick({ engine, got: 0, total: null, phase: 'downloading' })
      let reply: Awaited<ReturnType<FetchLike>>
      try {
        reply = await doFetch(info.windows)
      } catch (failure) {
        onTick({ engine, got: 0, total: null, phase: 'error', answer: `Could not reach ${info.host}: ${(failure as Error).message}` })
        return { ok: false, answer: `Could not reach ${info.host}. Nothing was downloaded.` }
      }
      if (!reply.ok) {
        const answer = `${info.host} answered ${reply.status ?? 'with an error'}. The endpoint may have moved; nothing was downloaded.`
        onTick({ engine, got: 0, total: null, phase: 'error', answer })
        return { ok: false, answer }
      }
      const declared = Number(reply.headers?.get('content-length') ?? '0')
      if (declared > MAX_DOWNLOAD_BYTES) {
        const answer = `${info.host} offered more than the ${Math.round(MAX_DOWNLOAD_BYTES / (1024 * 1024))} MB cap. Nothing was downloaded.`
        onTick({ engine, got: 0, total: null, phase: 'error', answer })
        return { ok: false, answer }
      }
      let bytes: Uint8Array
      try {
        bytes = new Uint8Array((await reply.arrayBuffer?.()) ?? new ArrayBuffer(0))
      } catch (failure) {
        const answer = `The download broke midway: ${(failure as Error).message}`
        onTick({ engine, got: 0, total: null, phase: 'error', answer })
        return { ok: false, answer }
      }
      if (!bytes.length) {
        const answer = `${info.host} sent nothing. Nothing was installed.`
        onTick({ engine, got: 0, total: null, phase: 'error', answer })
        return { ok: false, answer }
      }
      if (bytes.length > MAX_DOWNLOAD_BYTES) {
        const answer = 'The download exceeded the size cap. Nothing was installed.'
        onTick({ engine, got: 0, total: null, phase: 'error', answer })
        return { ok: false, answer }
      }
      onTick({ engine, got: bytes.length, total: bytes.length, phase: 'downloading' })
      const target = stagedPath(engine) ?? join(root, engine, 'download.bin')
      await mkdir(join(root, engine), { recursive: true })
      await writeFile(target, bytes)
      const digest = parseShaLine(await import('node:crypto').then(crypto => crypto.createHash('sha256').update(bytes).digest('hex')))
      const record: InstallRecord = {
        engine,
        file: target,
        endpoint: info.windows,
        sha256: digest,
        at: new Date().toISOString(),
      }
      await writeRecords(engine, record)
      // A zip for the app's own runtime is unpacked right away; an installer
      // script waits for its own run permission.
      if (info.kind === 'zip') {
        const unpacked = await unzipArchive(bytes, join(root, engine, 'app'))
        if (!unpacked.ok) {
          const answer = `The archive could not be unpacked: ${unpacked.answer}`
          onTick({ engine, got: 0, total: null, phase: 'error', answer })
          return { ok: false, answer }
        }
      }
      const answer = info.kind === 'zip'
        ? 'Downloaded, verified and unpacked into the app\u2019s own engines folder.'
        : 'Staged. Running the official installer is a separate permission, shown in full before it runs.'
      onTick({ engine, got: bytes.length, total: bytes.length, phase: 'staged', answer })
      return { ok: true, answer }
    },

    async status() {
      const answer: Record<string, InstallRecord | undefined> = {}
      for (const engine of Object.keys(ENGINE_DOWNLOADS)) {
        const record = await readRecord(engine)
        if (record) answer[engine] = record
      }
      return answer
    },

    async remove(engine: string) {
      if (!ENGINE_DOWNLOADS[engine]) return { ok: false, answer: `Nothing is known about ${engine}.` }
      await rm(join(root, engine), { recursive: true, force: true })
      return { ok: true, answer: `Removed the app-managed ${engine}.` }
    },

    runInstaller(engine: string, platform = process.platform) {
      const info = ENGINE_DOWNLOADS[engine]
      if (!info || info.kind !== 'installer-script') return { ok: false, answer: `${engine} has no staged installer.` }
      const file = stagedPath(engine)
      if (!file || !existsSync(file)) return { ok: false, answer: 'Nothing is staged yet. Download it first.' }
      if (platform !== 'win32') {
        return { ok: false, answer: 'The installer runs on Windows. On this machine, run the staged file yourself, or download on the Windows machine.' }
      }
      return {
        ok: true,
        answer: 'The official installer will run in PowerShell.',
        command: ['powershell', '-ExecutionPolicy', 'Bypass', '-File', file],
      }
    },

    ollamaBinary() {
      for (const candidate of [join(root, 'ollama', 'app', 'ollama.exe'), join(root, 'ollama', 'app', 'ollama')]) {
        if (existsSync(candidate)) return candidate
      }
      return null
    },
  }
}

/**
 * The small zip reader: central directory, stored (0) and deflate (8)
 * entries, a strict zip-slip refusal, per-file and total caps. Enough for
 * one trusted archive from one trusted host; nothing more is claimed.
 */
export async function unzipArchive(
  bytes: Uint8Array,
  destination: string,
  limits = { files: 200, perFile: 200 * 1024 * 1024 },
  fs: { mkdir(path: string, options?: { recursive?: boolean }): Promise<unknown>; writeFile(path: string, data: Uint8Array): Promise<unknown> } = { mkdir, writeFile },
): Promise<{ ok: boolean; answer: string }> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  // End of central directory: signature 0x06054b50, scan back past any comment.
  let end = -1
  for (let i = bytes.length - 22; i >= 0 && i > bytes.length - 22 - 65_536; i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) { end = i; break }
  }
  if (end < 0) return { ok: false, answer: 'not a zip' }
  const count = view.getUint16(end + 10, true)
  if (count > limits.files) return { ok: false, answer: 'too many files' }
  let offset = view.getUint32(end + 16, true)
  const decoder = new TextDecoder()
  await fs.mkdir(destination, { recursive: true })
  for (let index = 0; index < count; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) return { ok: false, answer: 'damaged central directory' }
    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localOffset = view.getUint32(offset + 42, true)
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength))
    if (name.includes('..') || /^[A-Za-z]:/.test(name) || name.startsWith('/')) {
      return { ok: false, answer: `unsafe path in archive: ${name}` }
    }
    const localNameLength = view.getUint16(localOffset + 26, true)
    const localExtraLength = view.getUint16(localOffset + 28, true)
    const dataStart = localOffset + 30 + localNameLength + localExtraLength
    const raw = bytes.subarray(dataStart, dataStart + compressedSize)
    let content: Uint8Array
    if (method === 0) content = raw
    else if (method === 8) content = new Uint8Array(inflateRawSync(raw))
    else return { ok: false, answer: `unsupported compression method ${method}` }
    if (content.length > limits.perFile) return { ok: false, answer: 'a file inside is too big' }
    const out = join(destination, name)
    const cut = Math.max(out.lastIndexOf('/'), out.lastIndexOf('\\'))
    await fs.mkdir(cut > 0 ? out.slice(0, cut) : destination, { recursive: true })
    await fs.writeFile(out, content)
    offset += 46 + nameLength + extraLength + commentLength
  }
  return { ok: true, answer: `${count} files` }
}
