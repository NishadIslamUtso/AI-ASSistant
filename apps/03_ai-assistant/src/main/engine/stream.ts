/**
 * The Claude Code wire protocol, parsed.
 *
 * Claude Code streams its life as one JSON sentence per line ("stream-json",
 * an official output mode). This parser turns those sentences into the app's
 * own engine events, and it is deliberately boring about everything it does
 * not recognise: a newer CLI adding new sentence types must never crash the
 * app — the unknown just passes by.
 *
 * Lines can arrive split across data chunks (the operating system chops TCP
 * and pipes wherever it likes), so unfinished text is kept for the next feed.
 */
import type { EngineEvent } from '../../shared/lib/engine'
import { toolSummary } from '../../shared/lib/engine'

export type EngineParser = {
  /** Feed raw output; returns every complete event found in it. */
  feed(chunk: string): EngineEvent[]
  /**
   * Call once when the engine closes: returns the event in a final line that
   * arrived without its newline, so a last "done" is never lost.
   */
  flush(): EngineEvent[]
}

type LooseRecord = Record<string, unknown>

const asRecord = (value: unknown): LooseRecord => (value && typeof value === 'object' ? (value as LooseRecord) : {})

export function createEngineParser(): EngineParser {
  let buffer = ''

  const parseLine = (line: string): EngineEvent[] => {
    const text = line.trim()
    if (!text) return []
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      // Not JSON — probably a stray console line. Ignored, never fatal.
      return []
    }
    const message = asRecord(parsed)

    if (message.type === 'system') {
      const subtype = typeof message.subtype === 'string' ? message.subtype : ''
      if (subtype === 'init') return [{ kind: 'status', text: 'engine ready' }]
      // A denial the engine decided itself: shown, never swallowed — a person
      // must be able to see WHY nothing happened.
      if (subtype === 'permission_denied')
        return [{ kind: 'status', text: 'a tool use was denied by the engine\'s safe mode' }]
      // The brain not answering yet: say so, or the window looks frozen.
      if (subtype === 'api_retry') {
        const attempt = typeof message.attempt === 'number' ? message.attempt : null
        return [{ kind: 'status', text: attempt ? `the brain is not answering — retry ${attempt}` : 'the brain is not answering — retrying' }]
      }
      return []
    }

    if (message.type === 'user') {
      // Tool RESULTS travel back as user-role messages. A failed one is news:
      // without this, a broken command looks like the engine going quiet.
      const content = asRecord(message.message).content
      if (!Array.isArray(content)) return []
      const events: EngineEvent[] = []
      for (const block of content) {
        const entry = asRecord(block)
        if (entry.type === 'tool_result' && entry.is_error === true) {
          const text = typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content) ?? ''
          events.push({ kind: 'status', text: `a tool call failed: ${text.slice(0, 160)}` })
        }
      }
      return events
    }

    if (message.type === 'assistant') {
      // The engine's turn: text pieces and the tools it decided to use.
      const content = asRecord(message.message).content
      if (!Array.isArray(content)) return []
      const events: EngineEvent[] = []
      for (const block of content) {
        const entry = asRecord(block)
        if (entry.type === 'text' && typeof entry.text === 'string' && entry.text.trim()) {
          events.push({ kind: 'text', text: entry.text })
        } else if (entry.type === 'tool_use' && typeof entry.name === 'string') {
          events.push({ kind: 'tool', name: entry.name, summary: toolSummary(entry.name, entry.input) })
        }
        // thinking blocks are the engine's private scratchwork — not shown.
      }
      return events
    }

    if (message.type === 'control_request') {
      // The engine asking permission to use a tool (the bidirectional wire).
      const request = asRecord(message.request)
      if (request.subtype !== 'can_use_tool' || typeof request.tool_name !== 'string') return []
      const requestId = typeof message.request_id === 'string' ? message.request_id : ''
      if (!requestId) return []
      return [
        {
          kind: 'permission',
          requestId,
          tool: request.tool_name,
          summary: toolSummary(request.tool_name, request.input),
        },
      ]
    }

    if (message.type === 'result') {
      const text = typeof message.result === 'string' ? message.result : ''
      const isError = message.is_error === true || message.subtype === 'error_during_execution'
      return [isError ? { kind: 'error', text: text || 'the engine hit an error' } : { kind: 'done', text }]
    }

    // Everything else (user echoes, control responses to our own answers,
    // future types) is the wire's business, not the window's.
    return []
  }

  return {
    feed(chunk: string): EngineEvent[] {
      buffer += chunk
      // A single line longer than this is not a sentence, it is a runaway —
      // drop the oldest half rather than grow without limit.
      if (buffer.length > 2_000_000) buffer = buffer.slice(-1_000_000)
      const events: EngineEvent[] = []
      let index = buffer.indexOf('\n')
      while (index !== -1) {
        events.push(...parseLine(buffer.slice(0, index)))
        buffer = buffer.slice(index + 1)
        index = buffer.indexOf('\n')
      }
      return events
    },
    flush(): EngineEvent[] {
      const rest = buffer
      buffer = ''
      return parseLine(rest)
    },
  }
}
