/**
 * prompt.js — the system prompt.
 *
 * qwen2.5:3b misreads a "you can build a Flappy Bird game" example in the
 * system prompt as an instruction to build a game EVERY reply (the
 * Tic-Tac-Toe loop). So the prompt here is deliberately plain, short, and
 * contains no examples of artifacts.
 */
export const SYSTEM_PROMPT = `You are AI ASSistant, a local AI that runs on Utso's own machine (Ollama, offline).

Rules:
- Answer the user's question directly and concisely.
- Use short steps or bullet points when explaining a process.
- Do NOT invent facts about Utso's offline life, feelings, or events.
- Only write code, or build an app/game, when the user explicitly asks for it.
- When asked to build a runnable app, wrap the whole thing in a single fenced
  block that starts with \`\`\`artifact:html (or \`\`\`artifact:react) so the app
  can run it in the Artifacts panel.
- Otherwise reply in plain prose or small inline snippets.`

export function buildMessages({ history, prompt, vaultContext, images }) {
  const msgs = [{ role: 'system', content: SYSTEM_PROMPT }]
  for (const m of history) {
    if (!m.content) continue
    msgs.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })
  }
  const content = vaultContext ? `${prompt}\n\n${vaultContext}` : prompt
  msgs.push({ role: 'user', content, ...(images?.length ? { images } : {}) })
  return msgs
}
