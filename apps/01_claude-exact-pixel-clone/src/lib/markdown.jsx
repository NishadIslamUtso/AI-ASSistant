import React from 'react'

/**
 * markdown.jsx — small, dependency-free Markdown renderer.
 *
 * Why not react-markdown: the target machine (TUF A15, slow connection) already
 * has Ollama + a model pulled; adding ~30 more npm packages buys little for
 * chat rendering. This covers what a local 3B model actually emits:
 * headings, lists, tables-lite, blockquotes, fenced + inline code, bold,
 * italic, links, images-as-text, horizontal rules.
 *
 * Rendered as React elements (never dangerouslySetInnerHTML) so model output
 * can't inject markup.
 */

const INLINE_RE =
  /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|(\*[^*\n]+\*)|(_[^_\n]+_)|(\[[^\]\n]+\]\([^)\s]+\))|(https?:\/\/[^\s<)]+)/g

function renderInline(text, keyPrefix = 'i') {
  const nodes = []
  let last = 0
  let m
  INLINE_RE.lastIndex = 0
  let n = 0
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const tok = m[0]
    const k = `${keyPrefix}-${n++}`
    if (tok.startsWith('`')) {
      nodes.push(
        <code
          key={k}
          className="px-1 py-[1px] rounded bg-[var(--code-bg)] border border-[var(--border)] font-mono text-[0.86em]"
        >
          {tok.slice(1, -1)}
        </code>,
      )
    } else if (tok.startsWith('**') || tok.startsWith('__')) {
      nodes.push(
        <strong key={k} className="font-semibold">
          {tok.slice(2, -2)}
        </strong>,
      )
    } else if (tok.startsWith('*') || tok.startsWith('_')) {
      nodes.push(<em key={k}>{tok.slice(1, -1)}</em>)
    } else if (tok.startsWith('[')) {
      const mm = tok.match(/\[([^\]]+)\]\(([^)\s]+)\)/)
      nodes.push(
        <a
          key={k}
          href={mm[2]}
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-2 hover:opacity-80"
        >
          {mm[1]}
        </a>,
      )
    } else {
      nodes.push(
        <a
          key={k}
          href={tok}
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-2 hover:opacity-80"
        >
          {tok}
        </a>,
      )
    }
    last = m.index + tok.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function CodeBlock({ lang, code }) {
  return (
    <div className="my-3 rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--code-bg)]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)] text-[11px] text-[var(--text-3)]">
        <span className="font-mono">{lang || 'code'}</span>
      </div>
      <pre className="overflow-x-auto p-3 text-[12.5px] leading-5 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  )
}

/**
 * @param {string} source markdown text
 * @param {(code:string, lang:string)=>React.ReactNode} [renderCode] optional override
 *        so the transcript can offer "Open artifact" under HTML/SVG blocks.
 */
export function renderMarkdown(source = '', renderCode) {
  const lines = String(source).replace(/\r\n/g, '\n').split('\n')
  const out = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // fenced code
    const fence = line.match(/^\s*```([a-zA-Z0-9_+-]*)\s*$/)
    if (fence) {
      const lang = fence[1] || ''
      const buf = []
      i++
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        buf.push(lines[i])
        i++
      }
      i++ // closing fence
      const code = buf.join('\n')
      out.push(
        renderCode ? (
          renderCode(code, lang, `c${key++}`)
        ) : (
          <CodeBlock key={`c${key++}`} lang={lang} code={code} />
        ),
      )
      continue
    }

    // blank
    if (!line.trim()) {
      i++
      continue
    }

    // horizontal rule
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      out.push(<hr key={`h${key++}`} className="my-4 border-[var(--border)]" />)
      i++
      continue
    }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      const cls =
        level === 1
          ? 'text-[22px] font-semibold mt-5 mb-2'
          : level === 2
            ? 'text-[19px] font-semibold mt-4 mb-2'
            : level === 3
              ? 'text-[16px] font-semibold mt-3 mb-1.5'
              : 'text-[14px] font-semibold mt-3 mb-1'
      const Tag = `h${Math.min(level, 6)}`
      out.push(
        <Tag key={`h${key++}`} className={cls}>
          {renderInline(h[2], `h${key}`)}
        </Tag>,
      )
      i++
      continue
    }

    // unordered list (incl. "- [ ] task")
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        let t = lines[i].replace(/^\s*[-*+]\s+/, '')
        const task = t.match(/^\[( |x|X)\]\s*(.*)$/)
        if (task) {
          items.push(
            <li key={`l${key++}`} className="flex gap-2">
              <input type="checkbox" checked={task[1] !== ' '} readOnly className="mt-1 accent-[var(--accent)]" />
              <span>{renderInline(task[2], `t${key}`)}</span>
            </li>,
          )
        } else {
          items.push(<li key={`l${key++}`}>{renderInline(t, `t${key}`)}</li>)
        }
        i++
      }
      out.push(
        <ul key={`u${key++}`} className="list-disc pl-5 my-2 space-y-1">
          {items}
        </ul>,
      )
      continue
    }

    // ordered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(
          <li key={`o${key++}`}>{renderInline(lines[i].replace(/^\s*\d+[.)]\s+/, ''), `oi${key}`)}</li>,
        )
        i++
      }
      out.push(
        <ol key={`ol${key++}`} className="list-decimal pl-5 my-2 space-y-1">
          {items}
        </ol>,
      )
      continue
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      const buf = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      out.push(
        <blockquote
          key={`q${key++}`}
          className="my-3 pl-3 border-l-2 border-[var(--border-strong)] text-[var(--text-2)]"
        >
          {renderInline(buf.join(' '), `q${key}`)}
        </blockquote>,
      )
      continue
    }

    // table
    if (/\|/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:-]*-{3,}/.test(lines[i + 1] || '')) {
      const header = splitRow(line)
      i += 2
      const rows = []
      while (i < lines.length && /\|/.test(lines[i])) {
        rows.push(splitRow(lines[i]))
        i++
      }
      out.push(
        <div key={`tb${key++}`} className="my-3 overflow-x-auto">
          <table className="text-[13px] border-collapse w-full">
            <thead>
              <tr>
                {header.map((c, ci) => (
                  <th
                    key={ci}
                    className="text-left px-2 py-1.5 border-b border-[var(--border-strong)] font-semibold"
                  >
                    {renderInline(c, `th${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} className="px-2 py-1.5 border-b border-[var(--border)] align-top">
                      {renderInline(c, `td${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    // paragraph: gather until blank / structural line
    const buf = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*```/.test(lines[i]) &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*([-*_])\1{2,}\s*$/.test(lines[i])
    ) {
      buf.push(lines[i])
      i++
    }
    out.push(
      <p key={`p${key++}`} className="my-2">
        {renderInline(buf.join(' '), `p${key}`)}
      </p>,
    )
  }

  return out
}

function splitRow(line = '') {
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim())
}
