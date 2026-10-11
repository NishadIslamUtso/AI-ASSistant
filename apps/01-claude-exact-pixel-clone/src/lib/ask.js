import { splitThinking, streamChat } from './ollama.js'

/**
 * ask.js — one isolated local model call.
 *
 * The chat transcript, the vision bridge, sub-agents and the artifact
 * region-rewriter all need the same thing: send a message list that has nothing
 * to do with the open chat and collect the answer. Keeping it in one place means
 * the context budget is checked once, in the same way, for every caller.
 */
export const CHAR_BUDGET = 12_000

/** Conservative character guard — this is not a token counter. */
export function budgetOf(messages) {
  return messages.reduce((size, message) => size + String(message.content || '').length + (message.images?.length || 0) * 400, 0)
}

export function assertBudget(messages, label = 'This request') {
  const size = budgetOf(messages)
  if (size > CHAR_BUDGET) {
    throw new Error(`${label} is about ${size.toLocaleString()} characters, over the conservative ${CHAR_BUDGET.toLocaleString()}-character budget for the 4,096-token local context. Shorten it or split the work.`)
  }
  return size
}

/**
 * Stream one completion and resolve with the final text.
 *
 * `onChunk` receives { content, thinking } as they grow, so a caller can show
 * progress; nothing reaches the chat transcript unless the caller puts it there.
 * The caller's `signal` is chained to an internal one so a five-minute timeout
 * stops a stuck generation without the caller having to manage it.
 */
export async function askLocal({ model, messages, think = false, signal, onChunk, timeoutMs = 300_000, budgetLabel }) {
  assertBudget(messages, budgetLabel)
  const controller = new AbortController()
  const abort = () => controller.abort(signal?.reason || 'stopped')
  if (signal) {
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
  }
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs)
  let raw = ''
  let nativeThinking = ''
  try {
    await streamChat({ model, messages, ...(think ? { think: true } : {}) }, controller.signal, record => {
      raw += record.message?.content || ''
      nativeThinking += record.message?.thinking || ''
      if (onChunk) onChunk(splitThinking(raw, nativeThinking))
    })
    const result = splitThinking(raw, nativeThinking)
    if (!result.content.trim() && !result.thinking.trim()) throw new Error('The local model returned nothing. Try again, or pick a different installed model.')
    return { content: result.content.trim(), thinking: result.thinking.trim() }
  } catch (error) {
    if (controller.signal.aborted && controller.signal.reason === 'timeout') throw new Error(`The model did not finish within ${Math.round(timeoutMs / 1000)} seconds and was stopped.`)
    throw error
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener?.('abort', abort)
  }
}

/** A model that opens with a refusal did not do the job. */
export function looksLikeRefusal(text = '') {
  return /^(?:i (?:cannot|can't|can not|am unable to)|sorry,? i)/i.test(String(text).trim())
}
