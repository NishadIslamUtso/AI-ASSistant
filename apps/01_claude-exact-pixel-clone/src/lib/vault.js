import { apiJson } from './ollama.js'
export const vaultGet = (path, signal) => apiJson(`/api/vault${path}`, { signal })
export const vaultPost = (path, payload) => apiJson(`/api/vault${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
})
export function capsuleText(capsule) {
  return capsule.content || [
    `# ${capsule.title}`, capsule.goals?.length ? `## Goals\n${capsule.goals.map(goal => `- ${goal}`).join('\n')}` : '',
    capsule.constraints?.length ? `## Constraints\n${capsule.constraints.map(item => `- ${item}`).join('\n')}` : '',
    capsule.background || '', capsule.decisions?.length ? `## Decisions\n${capsule.decisions.map(item => `- ${item}`).join('\n')}` : '',
  ].filter(Boolean).join('\n\n')
}
export const CAPSULE_DRAG_TYPE = 'application/x-ai-assistant-capsule'
export function parseCapsuleDrop(transfer) {
  const raw = transfer.getData(CAPSULE_DRAG_TYPE)
  if (!raw) return null
  try {
    const capsule = JSON.parse(raw)
    if (typeof capsule.title !== 'string' || typeof capsule.content !== 'string' || capsule.content.length > 12_000) throw new Error()
    return capsule
  } catch { throw new Error('Invalid or oversized capsule. Maximum context bundle is 12,000 characters.') }
}
