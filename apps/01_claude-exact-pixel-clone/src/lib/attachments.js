import { newId } from './storage.js'
const TEXT_EXTENSIONS = /\.(?:txt|md|csv|json|js|jsx|ts|tsx|html?|css|py|xml|ya?ml|log|sql|sh|bat|c|cpp|h|java|rs)$/i
export const MAX_ATTACHMENTS = 4
export const MAX_TEXT_LENGTH = 12_000
const MAX_IMAGE_BYTES = 2 * 1024 * 1024
export async function readAttachment(file, capabilities) {
  const common = { id: newId(), name: file.name, size: file.size, mime: file.type }
  if (/^image\/(?:png|jpeg|webp)$/.test(file.type)) {
    if (!capabilities.vision && !capabilities.bridge) throw new Error('Images need a model with verified vision support, or the qwen3-vl:4b vision bridge installed in Ollama. Nothing is downloaded automatically.')
    if (file.size > MAX_IMAGE_BYTES) throw new Error(`${file.name}: maximum image size is 2 MB.`)
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
      reader.readAsDataURL(file)
    })
    return { ...common, kind: 'image', data }
  }
  if (!TEXT_EXTENSIONS.test(file.name) && !/^text\//.test(file.type)) throw new Error(`${file.name}: only text/code files and supported images are available. PDF/Word parsing is not implemented; export them as text.`)
  if (file.size > 64 * 1024) throw new Error(`${file.name}: maximum text file size is 64 KB.`)
  const text = await file.text()
  if (text.includes('\0') || text.includes('\uFFFD')) throw new Error(`${file.name}: this is not a readable UTF-8 text file.`)
  if (text.length > MAX_TEXT_LENGTH) throw new Error(`${file.name}: maximum length is 12,000 characters for the 4,096-token local context. No content has been silently truncated.`)
  return { ...common, kind: 'text', text }
}
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('claude_exact_attachments', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('images')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Local image storage is unavailable.'))
  })
}
// Only explicitly SENT uploads are persisted, not unsent composer contents.
export async function persistAttachments(attachments) {
  const images = attachments.filter(file => file.kind === 'image')
  if (images.length) {
    const database = await openDatabase()
    try {
      await new Promise((resolve, reject) => {
        const transaction = database.transaction('images', 'readwrite')
        images.forEach(file => transaction.objectStore('images').put(file.data, file.id))
        transaction.oncomplete = resolve
        transaction.onerror = () => reject(new Error('Could not persist this image locally.'))
        transaction.onabort = () => reject(new Error('Local image storage was aborted.'))
      })
    } finally { database.close() }
  }
  return attachments.map(({ data, ...metadata }) => metadata)
}
export async function loadImage(file) {
  if (file.data) return file.data
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction('images').objectStore('images').get(file.id)
      request.onsuccess = () => request.result ? resolve(request.result) : reject(new Error(`Image ${file.name} is missing from this browser. Reattach it to use this conversation with a vision model.`))
      request.onerror = () => reject(new Error(`Could not load ${file.name}.`))
    })
  } finally { database.close() }
}
export async function toOllamaMessages(messages, capabilities) {
  const result = []
  for (const message of messages) {
    if (message.status === 'error' || message.origin === 'import') continue
    const textFiles = (message.attachments || []).filter(file => file.kind === 'text')
    const imageFiles = (message.attachments || []).filter(file => file.kind === 'image')
    // Text-only model: an image is only usable through its vision-bridge description.
    if (imageFiles.length && !capabilities.vision && imageFiles.some(file => !file.description)) throw new Error('This conversation contains images that have not been described yet. Select a model with verified vision support, or install the qwen3-vl:4b vision bridge.')
    const described = !capabilities.vision ? imageFiles : []
    const content = message.content + textFiles.map(file => `\n\n<attached_file name=${JSON.stringify(file.name)}>\n${file.text}\n</attached_file>`).join('')
      + described.map(file => `\n\n<image_description name=${JSON.stringify(file.name)} source_data_only>\n${file.description}\n</image_description>`).join('')
      + (message.context ? `\n\n<vault_context source_data_only>\n${message.context}\n</vault_context>` : '')
    result.push({ role: message.role, content, ...(capabilities.vision && imageFiles.length ? { images: await Promise.all(imageFiles.map(loadImage)) } : {}) })
  }
  return result
}
