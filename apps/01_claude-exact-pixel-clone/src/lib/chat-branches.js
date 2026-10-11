import { newId } from './storage.js'

/**
 * Create an independent, local fork containing the transcript through one
 * message. IDs are regenerated so each fork's artifacts remain independently
 * editable; attachment blobs stay in the same browser IndexedDB by reference.
 */
export function forkConversation(chat, messageId, { idFactory = newId, now = new Date() } = {}) {
  if (!chat || typeof chat.id !== 'string' || !Array.isArray(chat.messages)) throw new Error('Choose a valid conversation to branch.')
  const end = chat.messages.findIndex(message => message.id === messageId)
  if (end < 0) throw new Error('That message is no longer in this conversation.')
  if (chat.messages[end].status === 'streaming') throw new Error('Wait for the current response to finish before branching.')

  const branchId = idFactory()
  const messages = chat.messages.slice(0, end + 1).map(message => {
    const copiedId = idFactory()
    return {
      ...message,
      id: copiedId,
      ...(Array.isArray(message.attachments) ? { attachments: message.attachments.map(file => ({ ...file })) } : {}),
      ...(Array.isArray(message.artifacts) ? {
        artifacts: message.artifacts.map(artifact => ({
          ...artifact,
          id: idFactory(),
          chatId: branchId,
          messageId: copiedId,
          versions: artifact.versions.map(version => ({ ...version })),
        })),
      } : {}),
    }
  })
  const { vaultStatus: _vaultStatus, vaultError: _vaultError, ...metadata } = chat
  return {
    ...metadata,
    id: branchId,
    title: `Branch: ${chat.title}`.slice(0, 100),
    date: 'Today',
    pinned: false,
    parentChatId: chat.id,
    parentChatTitle: chat.title,
    parentMessageId: messageId,
    parentMessageNumber: end + 1,
    branchCreatedAt: now.toISOString(),
    messages,
  }
}
