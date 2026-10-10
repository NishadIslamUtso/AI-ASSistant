import React from 'react'

/** Tiny, dependency-free markdown renderer (code fences, inline code, bold, lists, headings) */
export function renderMarkdown(text) {
  const src = String(text || '')
  const blocks = []
  const re = /```(\w*)\n?([\s\S]*?)```/g
  let last = 0
  let m
  while ((m = re.exec(src))) {
    if (m.index > last) blocks.push({ t: 'text', v: src.slice(last, m.index) })
    blocks.push({ t: 'code', lang: m[1] || '', v: m[2] })
    last = re.lastIndex
  }
  if (last < src.length) blocks.push({ t: 'text', v: src.slice(last) })
  return blocks
}

export function Inline({ text }) {
  const parts = []
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let m
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const tok = m[1]
    if (tok.startsWith('`')) parts.push(<code key={m.index} className="px-[4px] py-[1px] rounded-[4px] text-[12.5px]" style={{ background: 'rgba(255,255,255,.08)' }}>{tok.slice(1, -1)}</code>)
    else if (tok.startsWith('**')) parts.push(<strong key={m.index}>{tok.slice(2, -2)}</strong>)
    else parts.push(<em key={m.index}>{tok.slice(1, -1)}</em>)
    last = re.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

export default function Markdown({ text, onRunCode }) {
  const blocks = renderMarkdown(text)
  return (
    <div className="space-y-[10px]">
      {blocks.map((b, i) =>
        b.t === 'code' ? (
          <div key={i} className="rounded-[8px] overflow-hidden" style={{ border: '1px solid #2a2a29' }}>
            <div className="flex items-center justify-between px-[10px] py-[5px] text-[11px]"
              style={{ background: '#1d1d1c', color: '#898781' }}>
              <span>{b.lang || 'code'}</span>
              <div className="flex items-center gap-[8px]">
                <button onClick={() => navigator.clipboard?.writeText(b.v)} className="hover:opacity-80">Copy</button>
                {onRunCode && /^(html|jsx|tsx|javascript|js|svg)$/i.test(b.lang || '') && (
                  <button onClick={() => onRunCode(b.v, b.lang)} className="hover:opacity-80">Run ▸</button>
                )}
              </div>
            </div>
            <pre className="p-[10px] overflow-x-auto text-[12.5px] leading-[19px]"
              style={{ background: '#171716', fontFamily: 'ui-monospace, Menlo, Consolas, monospace' }}>
              {b.v}
            </pre>
          </div>
        ) : (
          <Lines key={i} text={b.v} />
        )
      )}
    </div>
  )
}

function Lines({ text }) {
  const lines = text.split('\n')
  const out = []
  let list = null
  const flush = (key) => {
    if (list) { out.push(<ul key={key} className="list-disc pl-[22px] space-y-[3px]">{list}</ul>); list = null }
  }
  lines.forEach((ln, i) => {
    const h = ln.match(/^(#{1,4})\s+(.*)/)
    const li = ln.match(/^\s*[-*]\s+(.*)/)
    const num = ln.match(/^\s*\d+\.\s+(.*)/)
    if (h) { flush('l' + i); out.push(<div key={i} className="font-semibold mt-[4px]" style={{ fontSize: h[1].length <= 2 ? 17 : 15 }}><Inline text={h[2]} /></div>) }
    else if (li) { (list ||= []).push(<li key={i}><Inline text={li[1]} /></li>) }
    else if (num) { (list ||= []).push(<li key={i}><Inline text={num[1]} /></li>) }
    else if (ln.trim() === '') { flush('l' + i) }
    else { flush('l' + i); out.push(<div key={i}><Inline text={ln} /></div>) }
  })
  flush('end')
  return <>{out}</>
}
