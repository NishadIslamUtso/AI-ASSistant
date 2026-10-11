/**
 * artifacts.js — decide when to build, extract safely, and preview safely.
 *
 * DESIGN RULE (fixes the "Tic Tac Toe loop"):
 *   qwen2.5:3b latched onto a Flappy-Bird example in an old system prompt and
 *   built a game in every single reply. So now:
 *     1. The system prompt is a plain assistant prompt with NO code example.
 *     2. An artifact is only produced when the USER explicitly asks for one
 *        (see wantsArtifact) or flips artifact mode on in the composer.
 *     3. Any code block can still be promoted by hand with "Open in artifacts".
 *
 * `wantsArtifact` and the CSP-bearing `buildPreviewHtml` were ported from the
 * 01199af1 branch — they are strictly better than what this file had before:
 * the intent check also matches NEGATIVE intent ("explain how to build...",
 * "don't create..."), and the preview document is locked down with a CSP that
 * blocks network, forms, frames and external scripts.
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

const MAX_SOURCE = 200_000

/**
 * Did the user ask for something buildable?
 *
 * Ported from 01199af1. The negative checks matter: a 3B model (and a user)
 * will phrase "explain how to build an HTML app" almost identically to
 * "build me an HTML app", and the old check could not tell them apart.
 */
export function wantsArtifact(prompt, explicitlyEnabled = false) {
  if (explicitlyEnabled) return true
  const p = String(prompt || '')
  if (/\b(?:don't|do not|never)\s+(?:create|make|build|generate|write)\b/i.test(p)) return false
  if (/\b(?:explain|how (?:do|can|to)|what is|review|debug|compare|summari[sz]e)\b/i.test(p)) {
    // ...unless they also clearly asked for something runnable
    if (!/\b(?:as an? (?:artifact|app|html file)|runnable|self-contained|i can (?:open|run|play))\b/i.test(p))
      return false
  }
  return /\b(?:create|build|make|generate|write|design|implement|cook up|whip up)\b[\s\S]{0,100}\b(?:artifact|html|website|web\s*(?:page|app)|application|interactive|game|dashboard|calculator|timer|stopwatch|to-?do|chart|snake|tetris|tic[\s-]?tac[\s-]?toe|flappy|pong)\b/i.test(
    p,
  )
}

/** Backwards-compatible alias used by the demo responder. */
export const explicitlyAsked = (text) => wantsArtifact(text, false)

/** Pull fenced code blocks out of markdown-ish text. */
export function extractCodeBlocks(text = '') {
  const blocks = []
  const re = /```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g
  let m
  while ((m = re.exec(text)) !== null) {
    blocks.push({ lang: (m[1] || '').toLowerCase(), code: m[2], index: m.index })
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

function guessTitle(code = '', lang = '') {
  const title = code.match(/<title>([^<]{1,100})<\/title>/i)
  if (title) return title[1].trim()
  const h1 = code.match(/<h1[^>]*>([^<]{1,100})<\/h1>/i)
  if (h1) return h1[1].trim().replace(/<[^>]+>/g, '')
  const comment = code.match(/<!--\s*(.{1,100}?)\s*-->/)
  if (comment) return comment[1]
  return ARTIFACT_LANGS[lang] ? `${ARTIFACT_LANGS[lang]} artifact` : 'Artifact'
}

export function makeId() {
  return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

/**
 * Decide whether a finished assistant message should become artifacts.
 *
 * STRICT: only when the user asked. A model dumping a full HTML document into
 * an unrelated answer is not a reason to open an artifact panel — that is
 * exactly how the old build ended up showing Tic Tac Toe after every question.
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
    const source = b.code.trim()
    if (!source || source.length > MAX_SOURCE) continue
    out.push({
      id: makeId(),
      title: guessTitle(source, lang),
      type: lang === 'svg' || lang === 'xml' ? 'svg' : lang === 'react' || lang === 'jsx' ? 'react' : 'html',
      lang,
      content: source,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    })
  }
  const seen = new Set()
  return out.filter((a) => {
    const k = a.content.trim()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/** Build one artifact from a code block the user promoted by hand. */
export function artifactFromCode(code = '', lang = 'html', fallbackTitle = '') {
  const l = String(lang || '').toLowerCase()
  const type = ['svg', 'xml'].includes(l) ? 'svg' : ['react', 'jsx'].includes(l) ? 'react' : 'html'
  const source = String(code).trim()
  const fromDoc = source.match(/<title>([^<]{1,100})<\/title>/i)?.[1]?.trim()
  return {
    id: makeId(),
    title: fromDoc || fallbackTitle || (type === 'svg' ? 'SVG artifact' : 'HTML artifact'),
    type,
    lang: l,
    content: source,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  }
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

/**
 * Wrap untrusted artifact source in a locked-down preview document.
 * Ported from 01199af1 — this is the important one.
 *
 * The CSP meta tag is emitted BEFORE any untrusted content, and a document can
 * only ever tighten a CSP, never loosen it, so a second CSP inside the artifact
 * cannot re-open network access. Script errors are reported back to the parent
 * through postMessage instead of failing silently.
 */
export function buildPreviewHtml(source, channel = 'artifact-preview') {
  const policy =
    "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; " +
    "media-src data: blob:; connect-src 'none'; font-src 'none'; frame-src 'none'; object-src 'none'; " +
    "base-uri 'none'; form-action 'none'"
  const channelJson = JSON.stringify(channel).replace(/</g, '\\u003c')
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;font-family:system-ui,sans-serif;background:white;color:#171717}*{box-sizing:border-box}</style><script>
const channel = ${channelJson};
const report = message => parent.postMessage({type:'ai-assistant-artifact-error',channel,message:String(message).slice(0,500)}, '*');
addEventListener('error', event => report(event.message));
addEventListener('unhandledrejection', event => report(event.reason?.message || event.reason));
addEventListener('click', event => {const link=event.target.closest?.('a');if(link && !link.getAttribute('href')?.startsWith('#')) event.preventDefault();},true);
</script></head><body>${source}</body></html>`
}

/** Backwards-compatible name used by ArtifactPanel. */
export const toPreviewDoc = (artifact) => buildPreviewHtml(artifact.content || '')
