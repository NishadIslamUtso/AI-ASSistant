export const APP_NAME = 'AI ASSistant'
export const USER_NAME = 'Utso'
export const USER_EMAIL = 'nishadislamutso@gmail.com'
export const USER_INITIALS = 'NU'
export const DEFAULT_MODEL = 'qwen2.5:3b'

// Same-origin proxy paths. vite.config.js forwards them to Ollama (11434) and the vault API (8765).
export const OLLAMA_PROXY = '/api/ollama'
export const VAULT_PROXY = '/api/vault'

export const STORAGE = {
  chats: 'claude_exact_chats',
  messages: 'claude_exact_messages',
  settings: 'claude_exact_settings',
  model: 'claude_exact_model',
}

// Short on purpose. The old long prompt with a game example made qwen2.5:3b build a Tic Tac Toe game every reply.
export const SYSTEM_PROMPT =
  "You are AI ASSistant, a helpful assistant running locally on the user's own computer. " +
  "Answer the user's latest message directly. Use short step-by-step answers only when the question needs steps. " +
  'Do not write code, games, HTML pages, or artifacts unless the user explicitly asks for them. ' +
  'If vault memory is provided, use it only when it is relevant to the question.'
