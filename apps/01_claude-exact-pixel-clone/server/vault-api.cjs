/**
 * vault-api.cjs — local vault API for AI ASSistant (127.0.0.1:8765)
 *
 * The APP is the driver. This tiny Express server is the only thing that
 * touches the Obsidian vault on disk:
 *
 *   GET  /status                  health, vault path, file + entity counts
 *   GET  /context?q=...           keyword search across entities/capsules
 *   GET  /capsules                capsule/entity library for the side panel
 *   GET  /today                   Current Snapshot + Open Loops + journal path
 *   GET  /blacklist               never-check patterns (default allow)
 *   POST /blacklist               replace never-check patterns
 *   POST /capture                 generic write sink (app + browser extension)
 *
 * Local only. Binds 127.0.0.1, no auth, no external calls.
 */

const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const os = require('os')

const app = express()
const PORT = Number(process.env.AI_ASSISTANT_VAULT_PORT || 8765)

/* ── locate the vault ─────────────────────────────────────────── */
const here = __dirname // <repo>/apps/01_claude-exact-pixel-clone/server
const candidates = [
  process.env.AI_BRAIN_PATH,
  path.resolve(here, '../../../vault/AI-Brain'), // repo copy (default)
  path.resolve(here, '../../../AI-Brain'),
  path.resolve(here, '../../AI-Brain'),
  path.resolve(here, '../AI-Brain'),
  path.join(os.homedir(), 'Documents', 'AI-Brain'),
  path.join(os.homedir(), 'Obsidian', 'AI-Brain'),
  path.join(os.homedir(), 'AI-Brain'),
].filter(Boolean)

let VAULT_PATH = candidates.find((p) => fs.existsSync(p) && fs.statSync(p).isDirectory()) || null

if (!VAULT_PATH) {
  VAULT_PATH = path.resolve(here, '../../../vault/AI-Brain')
  console.log('[vault-api] No existing vault found — will create at:', VAULT_PATH)
}

app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '50mb' }))

/* ── helpers ──────────────────────────────────────────────────── */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function writeFile(relFile, content) {
  const full = path.join(VAULT_PATH, relFile)
  ensureDir(path.dirname(full))
  fs.writeFileSync(full, content, 'utf-8')
  return full
}

function appendFile(relFile, text) {
  const full = path.join(VAULT_PATH, relFile)
  ensureDir(path.dirname(full))
  fs.appendFileSync(full, text, 'utf-8')
  return full
}

function readFileSafe(relFile) {
  try {
    const full = path.join(VAULT_PATH, relFile)
    if (!fs.existsSync(full)) return null
    return fs.readFileSync(full, 'utf-8')
  } catch (e) {
    return null
  }
}

/** Markdown files in a vault folder, minus the folder README stubs. */
function listMarkdown(dirRel, { skipReadme = true } = {}) {
  const dir = path.join(VAULT_PATH, dirRel)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => !(skipReadme && /^readme(\.\w+)?\.md$/i.test(f)))
    .map((f) => path.join(dir, f))
}

/** Very small YAML-frontmatter reader (flat key: value + JSON-ish arrays). */
function parseFrontmatter(content = '') {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  const data = {}
  let body = content
  if (m) {
    body = content.slice(m[0].length)
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z0-9_\- ]+):\s*(.*)$/)
      if (!kv) continue
      const key = kv[1].trim()
      let val = kv[2].trim()
      if (val.startsWith('[') && val.endsWith(']')) {
        try {
          val = JSON.parse(val.replace(/'/g, '"'))
        } catch (e) {
          val = val.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean)
        }
      }
      data[key] = val
    }
  }
  return { data, body }
}

function stripMarkdown(md = '', max = 240) {
  const text = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/[*_]{1,3}/g, '')
    .replace(/\[\[|\]\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

function sectionList(body, heading) {
  const re = new RegExp(`^#{1,6}\\s*${heading}\\s*$`, 'im')
  const m = body.match(re)
  if (!m) return []
  const start = m.index + m[0].length
  const rest = body.slice(start)
  const nextHeading = rest.search(/^#{1,6}\s+/m)
  const block = nextHeading === -1 ? rest : rest.slice(0, nextHeading)
  return block
    .split(/\r?\n/)
    .map((l) => l.match(/^\s*[-*+]\s+(.*)$/))
    .filter(Boolean)
    .map((m) => m[1].trim())
    .filter((l) => !/^_?\(?none\)?_?$/i.test(l))
}

/** Replace the bullet list under `heading`, creating the section if needed. */
function upsertSectionList(filePath, heading, items) {
  let content = readFileSafe(filePath)
  if (content == null) content = `# ${path.basename(filePath, '.md')}\n\n## ${heading}\n`
  const re = new RegExp(`^#{1,6}\\s*${heading}\\s*$`, 'im')
  const block = [`## ${heading}`, '', ...items.map((i) => `- ${i}`), ''].join('\n')
  if (re.test(content)) {
    const m = content.match(re)
    const start = m.index
    const rest = content.slice(start + m[0].length)
    const nextIdx = rest.search(/^#{1,6}\s+/m)
    const end = nextIdx === -1 ? content.length : start + m[0].length + nextIdx
    content = content.slice(0, start) + block + content.slice(end)
  } else {
    content = content.replace(/\s*$/, '\n\n') + block
  }
  writeFile(filePath, content)
}

function nowParts() {
  const d = new Date()
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    day: String(d.getDate()).padStart(2, '0'),
    iso: d.toISOString().split('T')[0],
    full: d.toISOString(),
  }
}

/* ── health ───────────────────────────────────────────────────── */
app.get('/', (req, res) =>
  res.json({ ok: true, vault: VAULT_PATH, message: 'AI ASSistant Vault API' }),
)

app.get('/status', (req, res) => {
  let files = 0
  try {
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name.startsWith('.')) continue
        const p = path.join(dir, e.name)
        if (e.isDirectory()) walk(p)
        else files++
      }
    }
    walk(VAULT_PATH)
  } catch (e) {
    /* vault missing */
  }
  res.json({
    ok: true,
    vault: VAULT_PATH,
    counts: { files, entities: listMarkdown('03 Memory/Entities').length },
    time: new Date().toISOString(),
  })
})

/* ── context search ───────────────────────────────────────────── */
app.get('/context', (req, res) => {
  const q = String(req.query.q || '').toLowerCase().trim()
  const limit = Math.min(Number(req.query.limit) || 6, 20)
  if (!q) return res.json({ capsules: [], entities: [] })

  const words = q.split(/\s+/).filter((w) => w.length > 2)
  const out = []
  for (const file of listMarkdown('03 Memory/Entities')) {
    const content = fs.readFileSync(file, 'utf-8')
    const lower = content.toLowerCase()
    let score = 0
    if (lower.includes(q)) score += 5
    for (const w of words) if (lower.includes(w)) score += 1
    if (score <= 0) continue
    const { data, body } = parseFrontmatter(content)
    out.push({
      id: data.id || path.basename(file, '.md'),
      title: data.title || (body.match(/^#\s+(.+)$/m)?.[1] || path.basename(file, '.md')),
      type: data.type || 'entity',
      updated: data.updated || '',
      importance: data.importance || '',
      summary: stripMarkdown(body, 240),
      background: stripMarkdown(body, 900),
      path: path.relative(VAULT_PATH, file).replace(/\\/g, '/'),
      score,
    })
  }
  out.sort((a, b) => b.score - a.score)
  res.json({ capsules: out.slice(0, limit), entities: out.slice(0, limit) })
})

/* ── capsule / entity library ─────────────────────────────────── */
app.get('/capsules', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500)
  const items = listMarkdown('03 Memory/Entities')
    .map((file) => {
      const content = fs.readFileSync(file, 'utf-8')
      const { data, body } = parseFrontmatter(content)
      const goals = sectionList(body, 'Goals')
      const constraints = sectionList(body, 'Constraints')
      const decisions = sectionList(body, 'Decisions')
      const overview =
        body.match(/##\s*Overview\s*\n([\s\S]*?)(?=\n##\s|$)/i)?.[1]?.trim() || ''
      return {
        id: data.id || path.basename(file, '.md'),
        title:
          data.title ||
          body.match(/^#\s+Capsule:\s*(.+)$/m)?.[1] ||
          body.match(/^#\s+(.+)$/m)?.[1] ||
          path.basename(file, '.md'),
        type: data.type || 'entity',
        updated: data.updated || '',
        goals,
        constraints,
        decisions,
        summary: stripMarkdown(overview || body, 240),
        background: stripMarkdown(overview || body, 1200),
        path: path.relative(VAULT_PATH, file).replace(/\\/g, '/'),
      }
    })
    .sort((a, b) => String(b.updated || '').localeCompare(String(a.updated || '')))
  res.json({ items: items.slice(0, limit), total: items.length })
})

/* ── today: snapshot, open loops, journal ─────────────────────── */
app.get('/today', (req, res) => {
  const { year, iso } = nowParts()
  const read = (rel) => {
    const raw = readFileSafe(rel)
    if (raw == null) return null
    return parseFrontmatter(raw).body.trim()
  }
  res.json({
    date: iso,
    snapshot: read('04 Working Memory/Current Snapshot.md'),
    openLoops: read('04 Working Memory/Open Loops.md'),
    journalPath: `08 Journal/${year}/${iso}.md`,
  })
})

/* ── never-check blacklist ────────────────────────────────────── */
const PRIVACY_FILE = '00 System/Privacy & Access.md'
const SCOPE_FILE = '00 System/Connectors/Source Scope.md'

app.get('/blacklist', (req, res) => {
  const raw = readFileSafe(PRIVACY_FILE) || ''
  const { body } = parseFrontmatter(raw)
  const patterns = sectionList(body, 'Excluded patterns')
  res.json({ patterns, file: PRIVACY_FILE })
})

app.post('/blacklist', (req, res) => {
  const patterns = Array.isArray(req.body?.patterns) ? req.body.patterns : []
  const clean = patterns.map((p) => String(p).trim()).filter(Boolean)
  const { iso, full } = nowParts()

  upsertSectionList(PRIVACY_FILE, 'Excluded patterns', clean.length ? clean : ['(none)'])
  if (readFileSafe(SCOPE_FILE) != null) {
    upsertSectionList(SCOPE_FILE, 'excluded_patterns', clean.length ? clean : ['(none)'])
  }

  appendFile(
    `09 Activity & Undo/${iso.slice(0, 4)}/${iso.slice(5, 7)}.md`,
    `- [${full}] blacklist updated (${clean.length} pattern${clean.length === 1 ? '' : 's'}): ${clean.join(', ') || '(cleared)'}\n`,
  )

  res.json({ ok: true, patterns: clean })
})

/* ── capture sink ─────────────────────────────────────────────── */
app.post('/capture', (req, res) => {
  const data = req.body || {}
  const { year, month, iso, full } = nowParts()

  const activity = (line) =>
    appendFile(`09 Activity & Undo/${year}/${month}.md`, `- [${full}] ${line}\n`)

  try {
    switch (data.type) {
      case 'browser_visit': {
        const rel = `02 Sources/Browser Activity/${year}/${month}.jsonl`
        appendFile(
          rel,
          JSON.stringify({
            url: data.url,
            title: data.title,
            visited_at: data.visited_at || data.captured_at,
            capture_status: data.capture_status || 'visit-only',
            source: data.source || 'history-api',
          }) + '\n',
        )
        activity(`visit ${data.url} - ${data.capture_status || 'visit-only'}`)
        break
      }

      case 'web_page': {
        if (!data.url) return res.status(400).json({ error: 'url required' })
        const id = data.id || Date.now()
        const rel = `02 Sources/Web Pages/${year}/${id}.md`
        writeFile(
          rel,
          [
            '---',
            `id: web-${id}`,
            `url: ${data.url}`,
            `title: ${(data.title || '').replace(/\n/g, ' ')}`,
            `captured_at: ${data.captured_at || full}`,
            'provider: web',
            '---',
            '',
            `# ${data.title || data.url}`,
            '',
            `Source: ${data.url}`,
            '',
            '## Content',
            String(data.content || '').slice(0, 20000),
            '',
          ].join('\n'),
        )
        appendFile(
          `02 Sources/Browser Activity/${year}/${month}.jsonl`,
          JSON.stringify({
            url: data.url,
            title: data.title,
            visited_at: data.captured_at || full,
            capture_status: 'content-captured',
            source_id: rel,
          }) + '\n',
        )
        activity(`content-captured ${data.url}`)
        break
      }

      case 'conversation': {
        const provider = data.provider || 'Other'
        const id = data.conversation_id || data.id || Date.now()
        const rel = `02 Sources/Conversations/${provider}/${year}/${id}.md`
        const transcript = (data.messages || [])
          .map(
            (m) =>
              `### [${m.role}] ${m.timestamp || ''}\n${String(m.text || '').replace(/\n{3,}/g, '\n\n')}\n`,
          )
          .join('\n')
        writeFile(
          rel,
          [
            '---',
            `id: ${id}`,
            `provider: ${provider}`,
            `url: ${data.url || ''}`,
            `title: ${String(data.title || '').replace(/\n/g, ' ')}`,
            `captured_at: ${data.captured_at || full}`,
            `completeness: ${data.completeness || 'full'}`,
            '---',
            '',
            `# ${data.title || 'Conversation ' + id}`,
            '',
            `Provider: ${provider}`,
            data.url ? `URL: ${data.url}` : '',
            '',
            '## Transcript',
            transcript,
            '',
          ]
            .filter(Boolean)
            .join('\n'),
        )
        activity(`conversation ${provider} ${data.title || id}`)
        break
      }

      case 'capsule': {
        const c = data.capsule || {}
        const id = c.id || Date.now()
        const rel = `03 Memory/Entities/capsule-${id}.md`
        writeFile(
          rel,
          [
            '---',
            `id: ${id}`,
            'type: capsule',
            `title: ${String(c.title || 'Untitled capsule').replace(/\n/g, ' ')}`,
            `created: ${c.created || full}`,
            `updated: ${full}`,
            `version: ${c.version || 1}`,
            `status: ${c.status || 'active'}`,
            `importance: ${c.importance || 'normal'}`,
            `sources: ${JSON.stringify(c.sources || [])}`,
            `related_entities: ${JSON.stringify(c.related_entities || [])}`,
            '---',
            '',
            `# Capsule: ${c.title || 'Untitled capsule'}`,
            '',
            '## Goals',
            (c.goals || []).map((g) => `- ${g}`).join('\n') || '- (none)',
            '',
            '## Constraints',
            (c.constraints || []).map((g) => `- ${g}`).join('\n') || '- (none)',
            '',
            '## Background',
            c.background || '',
            '',
            '## Decisions',
            (c.decisions || []).map((d) => `- ${d}`).join('\n') || '- (none)',
            '',
            '## Sources',
            (c.sources || []).map((s) => `- ${s}`).join('\n') || '- (none)',
            '',
          ].join('\n'),
        )
        activity(`capsule saved ${c.title || id}`)
        break
      }

      case 'artifact': {
        const a = data.artifact || {}
        const id = a.id || Date.now()
        const ext = a.type === 'svg' ? 'svg' : a.type === 'react' ? 'jsx' : 'html'
        const rel = `02 Sources/Attachments/artifacts/${id}.${ext}`
        writeFile(rel, a.content || '')
        writeFile(
          `02 Sources/Attachments/artifacts/${id}.md`,
          [
            '---',
            `id: artifact-${id}`,
            'type: artifact',
            `title: ${String(a.title || 'Artifact').replace(/\n/g, ' ')}`,
            `artifact_type: ${a.type || 'html'}`,
            `file: ${id}.${ext}`,
            `created: ${a.createdAt || full}`,
            `updated: ${a.updatedAt || full}`,
            `version: ${a.version || 1}`,
            '---',
            '',
            `# ${a.title || 'Artifact'}`,
            '',
            `File: [[${id}.${ext}]]`,
            '',
          ].join('\n'),
        )
        activity(`artifact saved ${a.title || id}`)
        break
      }

      case 'journal': {
        const rel = `08 Journal/${year}/${data.date || iso}.md`
        writeFile(rel, data.content || '')
        activity(`journal written ${rel}`)
        break
      }

      case 'wasnt_accessible': {
        // Silent by policy: recorded, never surfaced as a popup.
        appendFile(
          `01 Inbox/Processing Errors/${iso.slice(0, 4)}-${iso.slice(5, 7)}.md`,
          `- ${data.captured_at || full} wasn't accessible: ${data.url} - reason: ${data.reason} - provider: ${data.provider || 'web'}\n`,
        )
        activity(`wasn't accessible ${data.url} - ${data.reason}`)
        break
      }

      case 'blacklist_update': {
        activity(`blacklist updated: ${JSON.stringify(data.excluded_patterns || [])}`)
        break
      }

      default:
        return res.status(400).json({ error: `unknown capture type: ${data.type}` })
    }

    res.json({ ok: true, vault: VAULT_PATH })
  } catch (e) {
    console.error('[vault-api] capture error:', e)
    res.status(500).json({ error: e.message })
  }
})

/* ── start ────────────────────────────────────────────────────── */
ensureDir(VAULT_PATH)
app.listen(PORT, '127.0.0.1', () => {
  console.log('AI ASSistant Vault API  ->  http://127.0.0.1:' + PORT)
  console.log('Vault                   ->  ' + VAULT_PATH)
})
