export function isExplicitArtifactRequest(prompt = '') {
  const text = String(prompt).trim().toLowerCase()
  if (!text) return false
  if (/^(how|why|what|when|where)\b/.test(text) && !/\b(build|create|make|code|write|generate)\s+(?:it|this|that|me)\b/.test(text)) return false
  const action = /\b(?:create|build|make|generate|implement|code|write|produce|prototype|turn\s+.+?\s+into|make\s+me|build\s+me)\b/.test(text)
  const target = /\b(?:website|web\s?page|html|javascript|interactive|runnable|game|calculator|dashboard|widget|prototype|app|application|visuali[sz]ation|editor|tool|form|artifact)\b/.test(text)
  return action && target
}

export function extractHtmlArtifact(response = '') {
  const source = String(response)
  const match = source.match(/```(?:artifact-html|html)\s*\r?\n([\s\S]*?)```/i)
  if (!match || !match[1].trim()) return null
  const html = match[1].trim()
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim()
    || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    || 'HTML Application'
  return { title: title.slice(0, 80), type: 'html', language: 'html', content: html }
}

const ARTIFACT_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'"

export function makeSandboxDocument(content = '') {
  const csp = `<meta http-equiv="Content-Security-Policy" content="${ARTIFACT_CSP}">`
  const html = String(content)
  if (/<head\b[^>]*>/i.test(html)) return html.replace(/<head\b[^>]*>/i, match => `${match}${csp}`)
  if (/<html\b/i.test(html)) return html.replace(/<html\b[^>]*>/i, match => `${match}<head>${csp}</head>`)
  return `<!doctype html><html><head><meta charset="utf-8">${csp}<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${html}</body></html>`
}
