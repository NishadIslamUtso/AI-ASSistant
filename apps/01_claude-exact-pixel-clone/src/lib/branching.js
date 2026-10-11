// Branch a conversation at a message. The branch is a NEW chat with fresh message
// and artifact ids; the original chat is never modified. Attachments keep their
// ids so the already-stored local images remain available to the branch.
export function branchChat(chat, messageId, { newId, now = () => new Date().toISOString() } = {}) {
  const index = chat.messages.findIndex(message => message.id === messageId)
  if (index < 0) throw new Error('That message is no longer in this chat, so nothing was branched.')
  if (chat.messages.slice(0, index + 1).some(message => message.status === 'streaming')) throw new Error('Wait for the reply to finish before branching this conversation.')
  const chatId = newId()
  const messages = chat.messages.slice(0, index + 1).map(message => {
    const messageNewId = newId()
    return {
      ...message,
      id: messageNewId,
      artifacts: message.artifacts?.map((artifact, number) => ({
        ...artifact,
        id: `${messageNewId}-artifact-${number}`,
        chatId,
        messageId: messageNewId,
        versions: artifact.versions.map(version => ({ ...version })),
      })),
    }
  })
  return {
    id: chatId,
    title: `Branch: ${chat.title}`.slice(0, 60),
    date: 'Today',
    projectId: chat.projectId ?? null,
    branchOf: { chatId: chat.id, messageId, createdAt: now() },
    messages,
  }
}
