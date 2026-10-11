import test from 'node:test'
import assert from 'node:assert/strict'
import { chatToMarkdown, exportFileName } from '../src/lib/export.js'

const chat = {
  title: '  Sales   chart  ',
  messages: [
    { id: '1', role: 'user', content: 'Make a chart', context: 'vault secret excerpt', thinking: 'hidden reasoning' },
    { id: '2', role: 'assistant', content: '```chart\n{"type":"bar"}\n```\n', thinking: 'more hidden' },
  ],
}

test('markdown export keeps visible turns and drops thinking and vault context', () => {
  const text = chatToMarkdown(chat)
  assert.match(text, /^# Sales chart/)
  assert.match(text, /## You\n\nMake a chart/)
  assert.match(text, /## AI ASSistant\n\n```chart/)
  assert.doesNotMatch(text, /hidden|vault secret/)
})

test('file names are safe, lowercase, and never empty', () => {
  assert.equal(exportFileName(chat), 'sales-chart.md')
  assert.equal(exportFileName({ title: '../../etc/passwd!!' }), 'etc-passwd.md')
  assert.equal(exportFileName({ title: '!!!' }), 'conversation.md')
  assert.equal(exportFileName(undefined), 'conversation.md')
})
