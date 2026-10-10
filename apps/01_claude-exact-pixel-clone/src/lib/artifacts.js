const DIRECT_CREATION = /\b(?:create|build|make|design|develop|generate|implement|prototype|code|write)\b(?:\s+(?!(?:for|about|of|to|on|with|that|which|where|because|as|into|from)\b)[\w'’-]+){0,8}\s+\b(?:website|web\s*page|web\s*app(?:lication)?|landing\s+page|html(?:\s+(?:app|application|page|file|document))?|game|puzzle|interactive(?:\s+(?:demo|app|application|visualization))?|dashboard|chart|visualization|simulator|calculator|mini\s+app|standalone\s+app|app(?:lication)?|pwa|artifact)\b/i
const CODE_FOR_TARGET = /\b(?:write|generate|code|implement)\b[\s\S]{0,24}\b(?:code|html|javascript|css)\b[\s\S]{0,32}\bfor\s+(?:(?:a|an|the|my|this|that|your)\s+)?(?:[\w'’-]+\s+){0,3}\b(?:website|web\s*page|web\s*app(?:lication)?|landing\s+page|html(?:\s+(?:app|application|page|file|document))?|game|puzzle|dashboard|chart|visualization|simulator|calculator|app(?:lication)?|pwa)\b/i
const NON_RUNNABLE_TARGET = /\b(?:website|web\s*page|web\s*app(?:lication)?|landing\s+page|html(?:\s+(?:app|application|page|file|document))?|game|puzzle|dashboard|chart|visualization|simulator|calculator|app(?:lication)?|artifact)\s+(?:concept|idea|review|story|description|summary|explanation|plan|guide|tutorial|outline|instructions?|spec(?:ification)?)\b/i
const EDUCATIONAL_OPENING = /^\s*(?:how|why|what|explain|teach|tutorial|guide|steps|plan|outline|ideas|list|compare)\b/i
const NON_BUILD_REQUEST = /\b(?:a|an|the)\s+(?:plan|guide|tutorial|outline|list|summary|explanation|instructions|specification|roadmap)\s+(?:for|to|about|on)\b/i
const PREVIEW_REQUEST = /\b(?:preview|render|run|open)\s+(?:me\s+)?(?:this|that|the|my)\s+(?:html|website|web\s*page|web\s*app|app|code|file|artifact|design)\b/i
const HTML_DOCUMENT_START = /(?:<!doctype\s+html\b|<html\b|<body\b)/i

/**
 * A generated preview is created only for an explicit request to build a runnable
 * visual artifact. Questions about how to build one stay ordinary chat responses.
 */
export function isExplicitArtifactRequest(prompt = '') {
  const text = String(prompt).trim()
  if (!text || EDUCATIONAL_OPENING.test(text)) return false
  if (/\b(?:show me how|explain how|teach me to|steps to|guide to)\b/i.test(text)) return false
  if (NON_BUILD_REQUEST.test(text)) return false
  if (PREVIEW_REQUEST.test(text)) return true
  return (DIRECT_CREATION.test(text) || CODE_FOR_TARGET.test(text)) && !NON_RUNNABLE_TARGET.test(text)
}

/**
 * Extract one HTML code block from a model response, but only when the user's
 * prompt explicitly asked for a runnable artifact. Everything outside the code
 * block is retained as the ordinary chat reply.
 */
export function extractExplicitHtmlArtifact(response = '', prompt = '') {
  if (!isExplicitArtifactRequest(prompt)) return null

  const text = String(response)
  const fencePattern = /```([^\r\n`]*)\r?\n([\s\S]*?)```/g
  let match
  while ((match = fencePattern.exec(text)) !== null) {
    const language = match[1].trim().toLowerCase()
    const source = match[2].trim()
    if (!source || !['html', 'htm', ''].includes(language)) continue
    if (language === '' && !HTML_DOCUMENT_START.test(source)) continue

    const remaining = `${text.slice(0, match.index)}${text.slice(match.index + match[0].length)}`.trim()
    return { html: source, remaining }
  }

  // Some small local models omit fences. Accept a complete HTML document only.
  const start = text.search(/<!doctype\s+html\b|<html\b/i)
  if (start !== -1) {
    const endTag = text.toLowerCase().lastIndexOf('</html>')
    const end = endTag === -1 ? text.length : endTag + '</html>'.length
    const html = text.slice(start, end).trim()
    if (html) {
      return {
        html,
        remaining: `${text.slice(0, start)}${text.slice(end)}`.trim(),
      }
    }
  }

  return null
}

export function getHtmlArtifactTitle(html = '') {
  const titleMatch = String(html).match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)
  const headingMatch = String(html).match(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i)
  const candidate = (titleMatch?.[1] || headingMatch?.[1] || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()

  return candidate.slice(0, 80) || 'HTML Application'
}

export function createHtmlArtifact(html, now = new Date()) {
  const id = globalThis.crypto?.randomUUID?.()
    || `artifact-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`
  return {
    id,
    title: getHtmlArtifactTitle(html),
    type: 'html',
    language: 'HTML',
    content: String(html).trim(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

const PREVIEW_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; navigate-to 'none'"

/**
 * Prepare user/model HTML for a sandboxed, network-isolated iframe preview.
 * Inline CSS/JS and data/blob assets work; network requests and external scripts
 * are blocked. The iframe is separately sandboxed by ArtifactPanel as well.
 */
export function buildSandboxedPreviewDocument(html = '', title = 'HTML Application') {
  const source = String(html).trim()
  const safeTitle = String(title).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
  const securityHead = `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">`

  if (/<head\b[^>]*>/i.test(source)) {
    return source.replace(/<head\b[^>]*>/i, openingTag => `${openingTag}${securityHead}`)
  }

  if (/<html\b[^>]*>/i.test(source)) {
    return source.replace(/<html\b[^>]*>/i, openingTag => `${openingTag}<head>${securityHead}<title>${safeTitle}</title></head>`)
  }

  return `<!doctype html><html lang="en"><head>${securityHead}<title>${safeTitle}</title></head><body>${source}</body></html>`
}
