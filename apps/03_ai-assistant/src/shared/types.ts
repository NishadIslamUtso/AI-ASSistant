/**
 * The domain types, in one place.
 *
 * These are the shapes that cross every boundary in the app: a message the model
 * produced, an artifact the user kept, a chat in the sidebar, the profile in
 * Settings. The main process, the renderer and the tests all import from here,
 * so there is exactly one definition of what a Message is and no place for two
 * of them to drift apart.
 */

export type Role = 'user' | 'assistant'

/** HTML or SVG. Nothing else is renderable in a sandboxed preview. */
export type ArtifactType = 'html' | 'svg'

export type ArtifactVersion = {
  content: string
  /** ISO timestamp of when this version was written. */
  savedAt?: string
  /** True while the model is still writing this version. */
  draft?: boolean
  note?: string
}

export type Artifact = {
  id: string
  title: string
  type: ArtifactType
  chatId?: string
  messageId?: string
  createdAt?: string
  updatedAt?: string
  /** True while the closing fence has not arrived yet. Never saved to history. */
  partial?: boolean
  versions: ArtifactVersion[]
}

export type AttachmentKind = 'image' | 'text'

export type Attachment = {
  id: string
  name: string
  size?: number
  /** MIME type as the browser reported it. */
  mime?: string
  kind?: AttachmentKind
  /** Base64 image bytes, with no `data:` prefix. Images only, and not kept in
   *  the transcript — it lives in IndexedDB and is loaded when it is needed. */
  data?: string
  /** What will actually read this picture: 'direct', or the bridge model's name. */
  seenBy?: string
  /** Plain text of a text/code attachment, already read. */
  text?: string
}

/** An attachment as it is kept in a message: the bytes are stored separately. */
export type StoredAttachment = Omit<Attachment, 'data'>

/** The bridge's description of an image, kept so follow-up turns still work. */
export type BridgeRecord = { description: string; model: string; truncated?: boolean }

export type Message = {
  id: string
  role: Role
  content: string
  model?: string
  /** Reasoning text, when the model reports one separately. */
  thinking?: string
  artifacts?: Artifact[]
  attachments?: Attachment[]
  /** Vault excerpts attached to this turn, given to the model as source data. */
  context?: string
  /** Set when the reply came from the vision bridge rather than the model itself. */
  bridge?: BridgeRecord
  /** 'error' marked turns are never sent back to the model. */
  status?: 'ok' | 'error'
  /** Imported turns are shown but not sent. */
  origin?: 'chat' | 'import'
  /** Set when the user edited a question and it was answered again. */
  editedAt?: string
  at?: string
  /** An error string when the turn failed. Never a silent empty reply. */
  error?: string
}

export type Chat = {
  id: string
  title: string
  /** Group heading in the sidebar: 'Today', 'Oct 8', 'Older'. */
  date?: string
  pinned?: boolean
  projectId?: string
  /** The chat this one was branched from, if any. */
  branchOf?: string
  /** Epoch milliseconds, used for ordering search results. */
  updatedAt?: number
  messages: Message[]
}

export type Profile = {
  name: string
  email: string
  tagline: string
  avatar: string
}

export type ThemeChoice = 'dark' | 'light' | 'system'
export type TranscriptSize = 'Small' | 'Medium' | 'Large'
export type TranscriptWidth = 'Narrow' | 'Medium' | 'Wide'
export type MotionChoice = 'System' | 'Reduced'

export type Settings = {
  theme: ThemeChoice
  chatFont: string
  transcriptSize: TranscriptSize
  transcriptWidth: TranscriptWidth
  motion: MotionChoice
  voiceLanguage: string
  voiceStyle: string
  voiceSpeed: string
}

/** Ollama's per-request options, clamped by inference.ts before they are sent. */
export type InferenceOptions = {
  num_ctx?: number
  num_batch?: number
  num_predict?: number
  num_gpu?: number
}

export type InferenceProfile = {
  id: string
  label: string
  hint: string
  options: InferenceOptions
  keepAlive: string
}

export type InferenceState = {
  profile: string
  options: InferenceOptions
  keepAlive: string
  /** Only present while the profile is 'custom'. */
  customOptions?: Record<string, string | number>
}

/** What Ollama reports about an installed model. */
export type ModelInfo = {
  name: string
  size?: number
  details?: { parameter_size?: string; quantization_level?: string; family?: string }
  capabilities?: string[]
}

/**
 * What Ollama's /api/show reports. `verified` is false when the model has no
 * capability list at all — in that case vision and thinking are assumed absent,
 * because a name is never treated as proof of what a model can do.
 */
export type ModelCapabilities = {
  verified: boolean
  vision: boolean
  thinking: boolean
}

/** One turn as the model API expects it. */
export type OllamaMessage = { role: string; content: string; images?: string[] }

/** One record from Ollama's NDJSON stream. */
export type OllamaRecord = {
  message?: { content?: string; thinking?: string }
  done?: boolean
  error?: string
}

export type ChartSpec = {
  type: 'bar' | 'line' | 'pie'
  title?: string
  labels: string[]
  values: number[]
  unit?: string
}

export type SearchHit = {
  chat: Chat
  message: Message
  /** The message text with the match in context. */
  snippet: string
  score: number
}

export type Capsule = {
  id?: string
  title: string
  content: string
  goals?: string[]
  constraints?: string[]
  background?: string
  decisions?: string[]
}

export type PromptTemplate = {
  id: string
  name: string
  hint: string
  body: string
  builtin?: boolean
}

export type Skill = {
  id: string
  name: string
  hint: string
  system: string
  builtin?: boolean
}

/** A bundled visual language: the label shown in the picker, plus two colours
 *  used for its swatch in the list. The full token set loads separately. */
export type DesignSystem = {
  id: string
  label: string
  accent: string
  bg: string
}

export type ZipEntry = { name: string; content: string | Uint8Array }
