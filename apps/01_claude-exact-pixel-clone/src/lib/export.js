// Conversation export. Only visible turns are exported: thinking traces and
// the vault context that was sent with a prompt are internal and are left out.

export function chatToMarkdown(chat) {
  const title = (chat?.title || 'Conversation').replace(/\s+/g, ' ').trim() || 'Conversation'
  const lines = [`# ${title}`, '']
  for (const message of chat?.messages || []) {
    const who = message.role === 'user' ? 'You' : 'AI ASSistant'
    lines.push(`## ${who}`, '', String(message.content || '').trim(), '')
  }
  return lines.join('\n')
}

export function exportFileName(chat) {
  const base = String(chat?.title || 'conversation')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${base || 'conversation'}.md`
}

export function downloadText(fileName, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
