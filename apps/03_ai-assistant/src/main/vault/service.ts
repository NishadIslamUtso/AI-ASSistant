/**
 * The vault service.
 *
 * This is the old companion server's `vault-api.cjs` moved into the main
 * process: same folders, same file names, same wording in the documents it
 * writes, because those are the user's files and they outlive any interface.
 * What changed is where it runs and how it is reached. Before, a second Node
 * process had to be started by hand and the renderer spoke HTTP to port 8765.
 * Now it lives in the app: no second process, no port, nothing to start.
 *
 * It takes a vault path and a clock and returns operations. It does not import
 * Electron, open a socket or write to the console, so every rule below is
 * testable directly.
 */
import { existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { InputError, VaultMissingError } from './errors'
import { createVaultFiles, type VaultFiles } from './files'
import { PRIVACY_FILE, SCOPE_FILE, excluded, readPatterns, replacePatterns } from './blacklist'
import { digest, dhakaParts, parseFollowups, safeSegment, section, splitDocument, timestamp, yamlDocument } from './text'
import { createZip, safeEntryName } from './zip'

export type Payload = Record<string, any>

export type VaultStatus = {
  ok: boolean
  available: boolean
  vault: string
  counts: { files: number; entities: number }
  time: string
  error?: string
}

export type VaultService = ReturnType<typeof createVaultService>

/**
 * Where the vault is, in order of who wins:
 *
 * 1. a path the app was told to use (later: Settings; today: an environment
 *    variable, which is also how the tests and the browser preview point at a
 *    throwaway vault)
 * 2. `vault/AI-Brain` in the checkout, so a fresh clone works with no setup
 * 3. `<userData>/vault`, for a packaged build
 *
 * The first path that exists wins; if none exists the first candidate is
 * reported, so the message can name the folder the user was expected to have.
 */
export function resolveVaultRoot(candidates: string[]): { root: string; available: boolean } {
  const cleaned = candidates.filter((candidate): candidate is string => Boolean(candidate))
  const found = cleaned.find(candidate => existsSync(candidate))
  const root = resolve(found || cleaned[0] || 'vault')
  return { root, available: existsSync(root) }
}

const noVaultMessage = (root: string): string =>
  `No vault at ${root}. Point the app at an existing Markdown vault, or create that folder and try again — an empty replacement vault is never created for you.`

export function createVaultService({
  vaultPath,
  clock = () => new Date(),
}: {
  vaultPath: string
  clock?: () => Date
}) {
  const root = resolve(vaultPath)
  const available = (): boolean => existsSync(root)

  // Built on first use, so the service can exist while the vault folder does
  // not: the app opens, says what is missing, and picks the vault up the moment
  // it appears without a restart.
  let files: VaultFiles | null = null
  function vault(): VaultFiles {
    if (!files) {
      if (!existsSync(root)) throw new VaultMissingError(noVaultMessage(root))
      files = createVaultFiles(root, clock)
    }
    return files
  }

  function status(): VaultStatus {
    if (!available()) {
      return {
        ok: false,
        available: false,
        vault: root,
        counts: { files: 0, entities: 0 },
        time: clock().toISOString(),
        error: noVaultMessage(root),
      }
    }
    const store = vault()
    return {
      ok: true,
      available: true,
      vault: root,
      counts: { files: store.countFiles(), entities: listEntries().filter(entry => entry.type !== 'capsule').length },
      time: clock().toISOString(),
    }
  }

  /** Snapshot, open loops, parsed follow-ups and today's journal path. */
  function today() {
    const store = vault()
    const { year, date } = dhakaParts(clock())
    const bodyOf = (relative: string): string => splitDocument(store.read(relative)).body.trim()
    const loops = bodyOf('04 Working Memory/Open Loops.md')
    const journalPath = `08 Journal/${year}/${date}.md`
    return {
      date,
      snapshot: bodyOf('04 Working Memory/Current Snapshot.md'),
      openLoops: loops,
      followups: parseFollowups(loops),
      journal: bodyOf(journalPath),
      journalPath,
      vault: root,
    }
  }

  /** Every pattern either canonical document declares, without duplicates. */
  function blacklist(): string[] {
    const store = vault()
    return [...new Set([...readPatterns(store.read(PRIVACY_FILE)), ...readPatterns(store.read(SCOPE_FILE))])]
  }

  /**
   * Add to, remove from, or replace the never-check list.
   *
   * Both documents are updated, their previous text is archived first under
   * "90 Archive/System Revisions", and a failed write puts the old text back —
   * so the two files are never left disagreeing about what is excluded.
   */
  function updateBlacklist(data: Payload) {
    const store = vault()
    const incomingRaw = data?.excluded_patterns
    if (
      !Array.isArray(incomingRaw) ||
      incomingRaw.length > 500 ||
      incomingRaw.some(
        pattern =>
          typeof pattern !== 'string' || !pattern.trim() || pattern.length > 500 || /[\r\n]/.test(pattern)
      )
    ) {
      throw new InputError('Use up to 500 non-empty URL/domain patterns, one per entry.')
    }
    const incoming = incomingRaw.map((pattern: string) => pattern.trim())
    const action = data?.action || 'set'
    if (!['add', 'remove', 'set'].includes(action)) throw new InputError('Invalid blacklist action.')
    const previous = blacklist()
    const next = [
      ...new Set(
        action === 'add'
          ? [...previous, ...incoming]
          : action === 'remove'
            ? previous.filter(pattern => !incoming.includes(pattern))
            : incoming
      ),
    ]
    const stamp = `${clock().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`
    const changes = [PRIVACY_FILE, SCOPE_FILE]
      .map(relative => {
        const before = store.read(relative) || '# Source Scope\n\nGlobal default allow, explicit deny.\n'
        const after = replacePatterns(before, next)
        return { relative, before, after }
      })
      .filter(change => change.before !== change.after)
    for (const { relative, before } of changes) {
      store.writeOnce(`90 Archive/System Revisions/${stamp}-${basename(relative)}`, before)
    }
    try {
      for (const { relative, after } of changes) store.write(relative, after)
    } catch (error) {
      // Best-effort rollback; the immutable revisions above are also kept.
      for (const { relative, before } of changes) {
        try {
          store.write(relative, before)
        } catch {
          /* The API reports failure, never success. */
        }
      }
      throw error
    }
    store.activity(
      `blacklist updated; ${next.length} excluded patterns; previous system documents kept in 90 Archive/System Revisions/`
    )
    return { ok: true, excluded_patterns: next }
  }

  /** Attachments are copied into the vault beside the capture that referenced them. */
  function prepareAttachments(messages: Payload[]): Payload[] {
    return messages.map(message => ({
      ...message,
      attachments: (message.attachments || []).map((file: Payload) => {
        const id = safeSegment(file.id, 'attachment id')
        if (typeof file.name !== 'string' || file.name.length > 300) throw new InputError('Invalid attachment name.')
        if (file.kind === 'image') {
          const extensions: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }
          const extension = extensions[file.mime]
          if (
            !extension ||
            typeof file.data !== 'string' ||
            !/^[A-Za-z0-9+/]*={0,2}$/.test(file.data) ||
            file.data.length > 2_800_000
          ) {
            throw new InputError('Invalid image attachment.')
          }
          const bytes = Buffer.from(file.data, 'base64')
          if (!bytes.length || bytes.length > 2 * 1024 * 1024) throw new InputError('Image must be between 1 byte and 2 MB.')
          return { id, name: file.name, mime: file.mime, kind: file.kind, relative: `02 Sources/Attachments/${id}-${digest(bytes)}.${extension}`, bytes }
        }
        if (file.kind !== 'text' || typeof file.text !== 'string' || file.text.length > 12_000) {
          throw new InputError('Invalid text attachment.')
        }
        const bytes = Buffer.from(file.text, 'utf8')
        return { id, name: file.name, kind: 'text', mime: 'text/plain', relative: `02 Sources/Attachments/${id}-${digest(bytes)}.txt`, bytes }
      }),
    }))
  }

  function capture(data: Payload) {
    const store = vault()
    const types = ['conversation', 'web_page', 'browser_visit', 'capsule', 'artifact', 'journal', 'wasnt_accessible', 'blacklist_update']
    if (!data || !types.includes(data.type)) throw new InputError('Unsupported capture type.')
    if (data.url) {
      let url: URL
      try {
        url = new URL(data.url)
      } catch {
        throw new InputError('Invalid capture URL.')
      }
      if (typeof data.url !== 'string' || !['http:', 'https:'].includes(url.protocol)) {
        throw new InputError('Capture URL must be HTTP or HTTPS.')
      }
    }
    if (data.title !== undefined && typeof data.title !== 'string') throw new InputError('Capture title must be text.')
    // The never-check list is checked before anything else is read or written,
    // and a skipped capture is logged rather than silently dropped.
    if (data.url && excluded(data.url, blacklist())) {
      store.activity(`skipped - blacklist: ${data.url}; content was not written`)
      return { ok: true, skipped: true, reason: 'blacklist' }
    }
    if (data.type === 'blacklist_update') return updateBlacklist(data)

    const now = clock()
    const captured = timestamp(data.captured_at, now.toISOString())
    const { year, month } = dhakaParts(now)
    let relative = ''
    let duplicate = false

    if (data.type === 'conversation') {
      const provider = safeSegment(data.provider || 'Other', 'provider')
      const id = safeSegment(data.conversation_id || randomUUID(), 'conversation id')
      if (!Array.isArray(data.messages) || !data.messages.length || data.messages.length > 2000) {
        throw new InputError('Conversation messages are required (maximum 2,000).')
      }
      const messages = data.messages.map((message: Payload) => {
        if (
          !['user', 'assistant', 'system', 'tool', 'unknown'].includes(message.role) ||
          typeof (message.text ?? message.content) !== 'string'
        ) {
          throw new InputError('Invalid conversation message.')
        }
        if (message.attachments && (!Array.isArray(message.attachments) || message.attachments.length > 4)) {
          throw new InputError('Maximum four attachments per message.')
        }
        return { ...message, text: message.text ?? message.content, timestamp: timestamp(message.timestamp, captured) }
      })
      const prepared = prepareAttachments(messages)
      // The file is named after the content, so the same conversation captured
      // twice is one file, and an edited conversation is a new one beside it.
      const hash = digest(JSON.stringify({ provider, title: data.title, messages }))
      relative = `02 Sources/Conversations/${provider}/${year}/${id}-${hash}.md`
      const metadata = {
        id: `${id}-${hash}`,
        conversation_id: id,
        provider,
        url: data.url || '',
        title: data.title || 'Conversation',
        captured_at: captured,
        completeness: data.completeness || 'full',
      }
      const transcript = prepared
        .map((message: Payload) => {
          const attachments = message.attachments.map((file: Payload) => `- ${file.name}: [[${file.relative}]]`).join('\n')
          return `### [${message.role}] ${message.timestamp}\n\n${message.text}${
            message.thinking ? `\n\n#### Model thinking output\n${message.thinking}` : ''
          }${message.context ? `\n\n#### Included vault context (source data)\n${message.context}` : ''}${
            attachments ? `\n\n#### Attachments\n${attachments}` : ''
          }${message.status ? `\n\nResponse status: ${message.status}` : ''}`
        })
        .join('\n\n')
      for (const message of prepared) {
        for (const file of message.attachments) store.writeOnce(file.relative, file.bytes)
      }
      duplicate = store.writeOnce(
        relative,
        yamlDocument(metadata, `# ${metadata.title}\n\nProvider: ${provider}\nURL: ${metadata.url}\n\n## Transcript\n\n${transcript}`)
      )
      // Source snapshots are immutable. Capturing a conversation title is NOT
      // confirmation of a personal fact, so no entity is created here.
    } else if (data.type === 'web_page') {
      if (!data.url || typeof data.content !== 'string') throw new InputError('Web page URL and readable content are required.')
      const id = `web-${digest(`${data.url}\n${data.content}`)}`
      relative = `02 Sources/Web Pages/${year}/${id}.md`
      duplicate = store.writeOnce(
        relative,
        yamlDocument(
          {
            id,
            url: data.url,
            title: data.title || '',
            captured_at: captured,
            completeness: data.completeness || 'partial',
            provider: 'web',
          },
          `# ${data.title || data.url}\n\nSource: ${data.url}\n\n## Content\n\n${data.content}`
        )
      )
      if (!duplicate) {
        store.append(
          `02 Sources/Browser Activity/${year}/${month}.jsonl`,
          `${JSON.stringify({
            url: data.url,
            title: data.title,
            captured_at: captured,
            visited_at: data.visited_at || null,
            capture_status: 'content-captured',
            source_id: relative,
          })}\n`
        )
      }
    } else if (data.type === 'browser_visit') {
      if (!data.url) throw new InputError('Visit URL is required.')
      relative = `02 Sources/Browser Activity/${year}/${month}.jsonl`
      store.append(
        relative,
        `${JSON.stringify({
          url: data.url,
          title: data.title || '',
          visited_at: timestamp(data.visited_at, captured),
          captured_at: captured,
          capture_status: data.capture_status || 'visit-only',
          source: data.source || 'history-api',
          interpretation: 'Visit metadata is not proof of reading or agreement.',
        })}\n`
      )
    } else if (data.type === 'wasnt_accessible') {
      if (typeof data.reason !== 'string' || !data.reason.trim()) throw new InputError('Failure reason is required.')
      relative = `01 Inbox/Processing Errors/${year}-${month}.md`
      const message = `wasn't accessible - ${data.reason}; URL: ${data.url || '(unavailable)'}; title: ${data.title || ''}; provider: ${data.provider || 'web'}`
      store.append(relative, `- [${captured}] ${message.replace(/\r?\n/g, ' ')}\n`)
      store.activity(message)
      return { ok: true, source: relative }
    } else if (data.type === 'capsule') {
      const capsule = data.capsule
      if (!capsule || typeof capsule.title !== 'string' || !capsule.title.trim()) throw new InputError('Capsule title is required.')
      const id = safeSegment(capsule.id, 'capsule id')
      for (const key of ['goals', 'constraints', 'decisions', 'sources', 'attachments']) {
        if (capsule[key] && (!Array.isArray(capsule[key]) || capsule[key].some((item: unknown) => typeof item !== 'string'))) {
          throw new InputError(`Capsule ${key} must be a list of strings.`)
        }
      }
      if (capsule.background && typeof capsule.background !== 'string') throw new InputError('Capsule background must be text.')
      const version = Number(capsule.version || 1)
      if (!Number.isSafeInteger(version) || version < 1) throw new InputError('Invalid capsule version.')
      const fileId = id.startsWith('capsule-') ? id : `capsule-${id}`
      relative = `03 Memory/Entities/${fileId}-v${version}-${digest(JSON.stringify(capsule))}.md`
      const metadata = { ...capsule, id, version, type: 'capsule', status: capsule.status || 'active', captured_at: captured }
      const body = `# Capsule: ${capsule.title}\n\n## Goals\n${(capsule.goals || []).map((item: string) => `- ${item}`).join('\n')}\n\n## Constraints\n${(capsule.constraints || [])
        .map((item: string) => `- ${item}`)
        .join('\n')}\n\n## Background\n${capsule.background || ''}\n\n## Decisions\n${(capsule.decisions || [])
        .map((item: string) => `- ${item}`)
        .join('\n')}\n\n## Sources\n${(capsule.sources || []).map((item: string) => `- ${item}`).join('\n')}`
      duplicate = store.writeOnce(relative, yamlDocument(metadata, body))
    } else if (data.type === 'artifact') {
      // The runnable file is stored beside a linked note, so the artifact is
      // usable from the vault alone and a later version never overwrites it.
      const artifact = data.artifact || {}
      const id = safeSegment(String(artifact.id || randomUUID()), 'artifact id')
      const kind = ['svg', 'react', 'javascript', 'python'].includes(artifact.type) ? artifact.type : 'html'
      const extension = { svg: 'svg', react: 'jsx', javascript: 'js', python: 'py', html: 'html' }[kind as string]
      if (typeof artifact.content !== 'string' || !artifact.content.trim()) throw new InputError('Artifact content is required.')
      if (artifact.content.length > 1_000_000) throw new InputError('Artifact must be under 1,000,000 characters.')
      const version = Number(artifact.version || 1)
      if (!Number.isSafeInteger(version) || version < 1) throw new InputError('Invalid artifact version.')
      const title = String(artifact.title || 'Artifact').replace(/\r?\n/g, ' ').slice(0, 200)
      const hash = digest(artifact.content)
      const fileName = `${id}-v${version}-${hash}.${extension}`
      relative = `02 Sources/Attachments/artifacts/${id}-v${version}-${hash}.md`
      duplicate = store.writeOnce(`02 Sources/Attachments/artifacts/${fileName}`, Buffer.from(artifact.content, 'utf8'))
      store.writeOnce(
        relative,
        yamlDocument(
          {
            id: `artifact-${id}`,
            type: 'artifact',
            title,
            artifact_type: kind,
            file: fileName,
            version,
            captured_at: captured,
            source_url: data.url || '',
          },
          `# ${title}\n\nFile: [[${fileName}]]\n\nVersion ${version}. The runnable file is stored beside this note and is never overwritten by a later version.`
        )
      )
    } else if (data.type === 'journal') {
      if (typeof data.content !== 'string' || !data.content.trim()) throw new InputError('Journal content is required.')
      const day = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(data.date || '') ? data.date : dhakaParts(now).date
      relative = `08 Journal/${day.slice(0, 4)}/${day}.md`
      duplicate = store.writeOnce(relative, yamlDocument({ id: `journal-${day}`, type: 'journal', date: day, captured_at: captured }, data.content))
    }

    store.activity(`${duplicate ? 'duplicate kept' : 'captured'}: ${data.type}; source: [[${relative}]]`)
    return { ok: true, source: relative, duplicate }
  }

  /** Everything in "03 Memory/Entities", newest version of each id only. */
  function listEntries(): Payload[] {
    const store = vault()
    const entries: Payload[] = []
    for (const file of store.listMarkdown('03 Memory/Entities')) {
      const source = `03 Memory/Entities/${file}`
      const { metadata, body } = splitDocument(store.read(source))
      if (!metadata.id) continue
      const title = metadata.title || body.match(/^# (?:Capsule: )?(.+)$/m)?.[1] || file.replace(/\.md$/, '')
      if (typeof title !== 'string') continue
      entries.push({
        ...metadata,
        title,
        content: body,
        source,
        background: metadata.background || section(body, 'Background'),
        version: Number(metadata.version) || 1,
        type: metadata.type || (file.startsWith('capsule-') ? 'capsule' : 'entity'),
      })
    }
    // Immutable captures can hold several versions of the same id: the library
    // shows the latest while every older Markdown source stays intact.
    const latest = new Map<string, Payload>()
    for (const entry of entries) {
      const previous = latest.get(entry.id)
      if (
        !previous ||
        entry.version > previous.version ||
        (entry.version === previous.version && (entry.updated || entry.captured_at || '') > (previous.updated || previous.captured_at || ''))
      ) {
        latest.set(entry.id, entry)
      }
    }
    return [...latest.values()].filter(entry => !['archived', 'expired', 'superseded'].includes(entry.status))
  }

  /** Keyword ranking, no embeddings and no network: the vault searches itself. */
  function search(entries: Payload[], query: string): Payload[] {
    const q = String(query || '').trim().toLowerCase()
    if (!q) return entries
    const words = q.split(/\s+/).filter(word => word.length > 2)
    return entries
      .map(entry => {
        const title = String(entry.title).toLowerCase()
        const body = String(entry.content).toLowerCase()
        let score = title.includes(q) ? 10 : 0
        for (const word of words) score += title.includes(word) ? 3 : body.includes(word) ? 1 : 0
        return { ...entry, score }
      })
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
  }

  function capsules(query = ''): Payload[] {
    return search(listEntries().filter(entry => entry.type === 'capsule'), query).slice(0, 100)
  }

  function context(query: string) {
    const entries = query ? search(listEntries(), query).slice(0, 5) : []
    return {
      capsules: entries.filter(entry => entry.type === 'capsule'),
      entities: entries.filter(entry => entry.type !== 'capsule'),
      claims: [],
      retrieval: 'local-keyword-search',
    }
  }

  /**
   * A deployable export: a ZIP built in memory from caller-supplied text files.
   * Nothing is written to the vault and no path is taken from the request —
   * entry names are normalised and refused if they try to escape.
   */
  function exportZip(payload: Payload) {
    const list = payload?.files
    if (!Array.isArray(list) || !list.length) throw new InputError('Nothing to export: no files were provided.')
    if (list.length > 200) throw new InputError('Too many files: a deployable export is limited to 200 files.')
    let zip: Buffer
    try {
      const entries = list.map((file: Payload) => {
        if (typeof file?.content !== 'string') throw new InputError('Every exported file needs text content.')
        if (file.content.length > 2_000_000) throw new InputError('Each exported file is limited to 2 MB.')
        return { name: safeEntryName(file.name), content: file.content as string }
      })
      zip = createZip(entries)
    } catch (error) {
      // The writer refuses names that try to leave the archive. That is the
      // caller's mistake, so it is answered as one rather than as a failure.
      throw error instanceof InputError ? error : new InputError((error as Error).message)
    }
    return {
      ok: true,
      filename: `ai-assistant-artifact-${dhakaParts(clock()).date}.zip`,
      zip: zip.toString('base64'),
      bytes: zip.length,
    }
  }

  return {
    root,
    available,
    /** The message a caller shows when there is no vault to work with. */
    missingMessage: () => noVaultMessage(root),
    status,
    today,
    blacklist,
    updateBlacklist,
    capture,
    listEntries,
    capsules,
    context,
    exportZip,
  }
}

