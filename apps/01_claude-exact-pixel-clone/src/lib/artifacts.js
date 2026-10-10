/**
 * artifacts.js — extract runnable artifacts from a model reply.
 *
 * DESIGN RULE (fixes the "Tic Tac Toe loop"):
 *   qwen2.5:3b latched onto a Flappy-Bird example in an old system prompt and
 *   built a game in every single reply. So now:
 *     1. The system prompt is a plain assistant prompt with NO code example.
 *     2. An artifact is only produced when the USER explicitly asks for one
 *        (see explicitlyAsked()) or the user flips the "Artifact" switch in the
 *        composer, or a reply happens to contain a complete self-contained
 *        HTML/SVG document (then we offer it, we never force it).
 */

export const ARTIFACT_LANGS = {
  html: 'HTML',
  htm: 'HTML',
  svg: 'SVG',
  xml: 'SVG',
  react: 'React',
  jsx: 'React',
  tsx: 'React',
  javascript: 'JavaScript',
  js: 'JavaScript',
  python: 'Python',
  py: 'Python',
  css: 'CSS',
  json: 'JSON',
  markdown: 'Markdown',
  md: 'Markdown',
}

/** User clearly asked for something buildable. */
export function explicitlyAsked(text = '') {
  const t = String(text).toLowerCase()
  const asks =
    /\b(make|create|build|write|generate|code|draw|design|give me|whip up|put together)\b/.test(t)
  if (!asks) return false
  const buildable =
    /\b(html|html5|web\s?page|webpage|website|landing page|app|web app|game|calculator|timer|stopwatch|clock|todo|to-?do list|chart|graph|diagram|svg|animation|simulation|snake|tetris|tic[\s-]?tac[\s-]?toe|flappy|pong|breakout|memory game|quiz|form|dashboard|component|widget|react|prototype|mockup|visuali[sz]er|editor|converter|generator|player|canvas)\b/.test(
      t,
    )
  if (buildable) return true
  // "... as a single HTML file" / "self-contained" / "runnable"
  if (/\b(self[- ]contained|single (html|file)|runnable|standalone|open in (the )?(artifact|preview|browser))\b/.test(t))
    return true
  return false
}

/** Pull fenced code blocks out of markdown-ish text. */
export function extractCodeBlocks(text = '') {
  const blocks = []
  const re = /```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g
  let m
  while ((m = re.exec(text)) !== null) {
    blocks.push({
      lang: (m[1] || '').toLowerCase(),
      code: m[2],
      index: m.index,
    })
  }
  return blocks
}

function isRunnableDocument(code = '') {
  const c = code.toLowerCase()
  return (
    c.includes('<!doctype html') ||
    (c.includes('<html') && c.includes('</html>')) ||
    (c.trimStart().startsWith('<svg') && c.includes('</svg>'))
  )
}

/** Best title guess for an artifact. */
function guessTitle(code = '', lang = '') {
  const title = code.match(/<title>([^<]{1,120})<\/title>/i)
  if (title) return title[1].trim()
  const h1 = code.match(/<h1[^>]*>([^<]{1,120})<\/h1>/i)
  if (h1) return h1[1].trim().replace(/<[^>]+>/g, '')
  const comment = code.match(/<!--\s*(.{1,120}?)\s*-->/)
  if (comment) return comment[1]
  return ARTIFACT_LANGS[lang] ? `${ARTIFACT_LANGS[lang]} artifact` : 'Artifact'
}

export function makeId() {
  return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

/**
 * Decide whether a finished assistant message should become artifacts.
 *
 * STRICT RULE: only when the user asked for it (or flipped artifact mode on).
 * A model that dumps a full HTML document into an unrelated answer is not a
 * reason to open an artifact panel — that is exactly how the old build ended up
 * showing Tic Tac Toe after every single question. Any code block can still be
 * promoted to an artifact by hand with "Open in artifacts".
 *
 * @param {string} content   full assistant reply
 * @param {boolean} requested true when the user asked / flipped the artifact switch
 */
export function artifactsFromReply(content = '', requested = false) {
  if (!requested) return []
  const blocks = extractCodeBlocks(content)
  const out = []
  for (const b of blocks) {
    const lang = b.lang || 'text'
    const runnable =
      (lang === 'html' || lang === 'htm' || lang === 'svg' || lang === 'xml' || lang === 'react' || lang === 'jsx') &&
      isRunnableDocument(b.code)
    if (!runnable) continue
    out.push({
      id: makeId(),
      title: guessTitle(b.code, lang),
      type: lang === 'svg' || lang === 'xml' ? 'svg' : lang === 'react' || lang === 'jsx' ? 'react' : 'html',
      lang,
      content: b.code,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    })
  }
  // de-duplicate identical content within one reply
  const seen = new Set()
  return out.filter((a) => {
    const k = a.content.trim()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/**
 * The ONLY extra instruction appended when the user explicitly wants an artifact.
 * Deliberately short so a 3B model can follow it.
 */
export function artifactInstruction(kind = 'html') {
  if (kind === 'svg') {
    return (
      '\n\nReply with one short sentence, then ONE fenced ```svg code block containing a complete, ' +
      'self-contained <svg> document with xmlns="http://www.w3.org/2000/svg". No commentary after the block.'
    )
  }
  return (
    '\n\nReply with one short sentence, then ONE fenced ```html code block containing the complete, ' +
    'self-contained HTML document (include <style> and <script> inside it). It must run by just opening ' +
    'the file. No external files. No commentary after the code block.'
  )
}

/** Wrap raw html for sandboxed preview inside an iframe (srcdoc). */
export function toPreviewDoc(artifact) {
  if (artifact.type === 'svg') {
    const svg = artifact.content.trim()
    return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:#fff}svg{max-width:100%;max-height:100%}</style></head><body>${svg}</body></html>`
  }
  const c = artifact.content.trim()
  if (isRunnableDocument(c)) {
    // inject a base so relative links don't explode inside srcdoc
    return c.replace(/<head([^>]*)>/i, '<head$1><base target="_blank">')
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:system-ui;padding:16px;background:#fff;color:#111}</style></head><body><pre>${escapeHtml(
    c,
  )}</pre></body></html>`
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
