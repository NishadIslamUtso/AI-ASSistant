// Artifact extraction: find HTML applications inside assistant code fences.
// Artifacts are only created when the model actually emits a full HTML document
// in a code fence — the system prompt tells qwen2.5:3b to only write code/games
// when explicitly asked, which fixes the Tic Tac Toe loop.

export function extractArtifacts(content) {
  if (!content) return []
  const arts = []
  const re = /```([a-zA-Z]*)\n([\s\S]*?)```/g
  let m
  let i = 0
  while ((m = re.exec(content)) !== null) {
    const lang = (m[1] || '').toLowerCase()
    const code = m[2] || ''
    const looksHtml =
      lang === 'html' ||
      /<!DOCTYPE html/i.test(code) ||
      /<html[\s>]/i.test(code) ||
      (/<canvas[\s>]/i.test(code) && /<script[\s>]/i.test(code))
    if (looksHtml && code.length > 150) {
      const t = code.match(/<title>\s*([^<]+?)\s*<\/title>/i)
      arts.push({
        id: 'art-' + i + '-' + code.length,
        title: t ? t[1] : 'HTML Application',
        type: 'text/html',
        content: code,
      })
      i += 1
    }
  }
  return arts
}

export function artifactsInMessages(messages) {
  const out = []
  for (const msg of messages || []) {
    if (msg.role !== 'assistant') continue
    for (const a of extractArtifacts(msg.content)) out.push({ ...a, messageId: msg.id })
  }
  return out
}
