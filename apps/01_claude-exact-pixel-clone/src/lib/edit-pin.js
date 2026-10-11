export const MAX_PINNED_EXCERPT = 4_000

/** Build a draft-only edit prompt; calling this never sends it to the model. */
export function buildEditPrompt(excerpt, note = '') {
  const selected = String(excerpt || '').trim()
  if (!selected) throw new Error('Select some text before pinning it to edit.')
  if (selected.length > MAX_PINNED_EXCERPT) throw new Error(`Select no more than ${MAX_PINNED_EXCERPT.toLocaleString()} characters at a time.`)
  const instruction = String(note || '').trim() || 'Please revise this selected excerpt while preserving its intended meaning.'
  const quoted = selected.split('\n').map(line => `> ${line}`).join('\n')
  return `${instruction}\n\nSelected excerpt (quoted for editing):\n${quoted}`
}
