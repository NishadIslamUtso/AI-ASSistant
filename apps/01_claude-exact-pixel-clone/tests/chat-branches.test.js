import test from 'node:test'
import assert from 'node:assert/strict'
import { forkConversation } from '../src/lib/chat-branches.js'
import { buildEditPrompt, MAX_PINNED_EXCERPT } from '../src/lib/edit-pin.js'

function ids() {
  let next = 0
  return () => `copy-${++next}`
}

test('branch copies only the prefix and gives messages/artifacts independent identities', () => {
  const source = {
    id: 'original', title: 'Study notes', date: 'Oct 8', pinned: true,
    vaultStatus: 'saved', vaultError: 'old error', projectId: 'project-1',
    messages: [
      { id: 'u1', role: 'user', content: 'First', attachments: [{ id: 'img-1', kind: 'image' }] },
      { id: 'a1', role: 'assistant', content: 'Answer', status: 'complete', artifacts: [{
        id: 'artifact-1', chatId: 'original', messageId: 'a1', type: 'html',
        versions: [{ content: '<h1>one</h1>', savedAt: '2026-10-12T00:00:00.000Z' }],
      }] },
      { id: 'u2', role: 'user', content: 'A later turn must not be copied' },
    ],
  }
  const branch = forkConversation(source, 'a1', { idFactory: ids(), now: new Date('2026-10-12T01:02:03.000Z') })
  assert.equal(branch.id, 'copy-1')
  assert.equal(branch.parentChatId, 'original')
  assert.equal(branch.parentMessageId, 'a1')
  assert.equal(branch.title, 'Branch: Study notes')
  assert.equal(branch.date, 'Today')
  assert.equal(branch.pinned, false)
  assert.equal(branch.projectId, 'project-1')
  assert.equal(branch.branchCreatedAt, '2026-10-12T01:02:03.000Z')
  assert.equal('vaultStatus' in branch, false)
  assert.equal('vaultError' in branch, false)
  assert.deepEqual(branch.messages.map(message => message.content), ['First', 'Answer'])
  assert.notEqual(branch.messages[0].id, source.messages[0].id)
  assert.equal(branch.messages[0].attachments[0].id, 'img-1', 'persisted local image remains available in the same browser')
  const copiedArtifact = branch.messages[1].artifacts[0]
  assert.notEqual(copiedArtifact.id, 'artifact-1')
  assert.equal(copiedArtifact.chatId, branch.id)
  assert.equal(copiedArtifact.messageId, branch.messages[1].id)
  assert.notEqual(copiedArtifact.versions[0], source.messages[1].artifacts[0].versions[0])
  assert.equal(source.messages.length, 3, 'the original chat is not mutated')
})

test('branching rejects missing messages and an in-flight assistant turn', () => {
  const chat = { id: 'c', title: 'Busy', messages: [{ id: 'm', role: 'assistant', status: 'streaming', content: 'partial' }] }
  assert.throws(() => forkConversation(chat, 'missing'), /no longer/)
  assert.throws(() => forkConversation(chat, 'm'), /finish/)
})

test('pin-to-edit creates a quoted draft prompt without sending or truncating the selection', () => {
  const excerpt = 'First line\nSecond line with > and <symbols>.'
  const prompt = buildEditPrompt(excerpt, 'Use a warmer tone; keep the facts.')
  assert.match(prompt, /^Use a warmer tone; keep the facts\./)
  assert.ok(prompt.includes('> First line\n> Second line with > and <symbols>.'))
  assert.ok(!prompt.includes('http://') && !prompt.includes('https://'))
  assert.equal(buildEditPrompt(excerpt, '').startsWith('Please revise this selected excerpt'), true)
})

test('pin-to-edit refuses an empty or oversized selection instead of silently trimming it', () => {
  assert.throws(() => buildEditPrompt('  '), /Select some text/)
  assert.throws(() => buildEditPrompt('x'.repeat(MAX_PINNED_EXCERPT + 1)), /Select no more than/)
})
