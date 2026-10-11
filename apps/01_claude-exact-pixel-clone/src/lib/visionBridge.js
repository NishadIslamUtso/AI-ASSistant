// Vision bridge: a text-only chat model delegates images to a local vision model.
// The vision model is named explicitly and its vision capability is VERIFIED with
// /api/show before use (never guessed from the name). Nothing is downloaded.
import { chatOnce, getCapabilities, showModel } from './ollama.js'
import { loadImage } from './attachments.js'
export const VISION_BRIDGE_MODEL = 'qwen3-vl:4b'
export const DESCRIBE_PROMPT = 'Describe this image factually for a text-only assistant. Transcribe any visible text exactly. Mention objects, layout, colours, and numbers. Say clearly when something is unclear. Keep it under 250 words.'
const verified = new Set()
const described = new Map() // attachment id -> description, reused for this browser session

export function imageNeedsBridge(messages, capabilities) {
  return !capabilities.vision && messages.some(message => (message.attachments || []).some(file => file.kind === 'image' && !file.description))
}

export async function resolveVisionBridge(installedNames, signal, show = showModel) {
  if (!installedNames.includes(VISION_BRIDGE_MODEL)) {
    throw new Error(`This text model cannot read images. Install ${VISION_BRIDGE_MODEL} in Ollama (nothing is downloaded automatically), or switch to a model with verified vision support.`)
  }
  if (!verified.has(VISION_BRIDGE_MODEL)) {
    const capabilities = getCapabilities(await show(VISION_BRIDGE_MODEL, signal))
    if (!capabilities.vision) throw new Error(`${VISION_BRIDGE_MODEL} did not report vision support in Ollama, so it cannot describe images.`)
    verified.add(VISION_BRIDGE_MODEL)
  }
  return VISION_BRIDGE_MODEL
}

export async function describeImage({ model, data, signal }) {
  const text = await chatOnce({ model, think: false, messages: [{ role: 'user', content: DESCRIBE_PROMPT, images: [data] }] }, signal)
  const description = text.trim().slice(0, 2000)
  if (!description) throw new Error(`${model} returned an empty image description. Try again or use a different image.`)
  return description
}

// Returns copies of the messages where every image has a `description`.
// `load` and `describe` are injectable so this can be tested without Ollama.
export async function describeImages(messages, { model, signal, load = loadImage, describe = describeImage }) {
  const result = []
  for (const message of messages) {
    if (!(message.attachments || []).some(file => file.kind === 'image' && !file.description)) { result.push(message); continue }
    const attachments = []
    for (const file of message.attachments) {
      if (file.kind !== 'image' || file.description) { attachments.push(file); continue }
      let description = described.get(file.id)
      if (!description) {
        const data = file.data || await load(file)
        description = await describe({ model, data, signal })
        described.set(file.id, description)
      }
      attachments.push({ ...file, description })
    }
    result.push({ ...message, attachments })
  }
  return result
}
