/**
 * profile.js — who is using this copy of AI ASSistant.
 *
 * Nothing here is tied to one person. A fresh clone greets whoever opens it, and
 * everything is local: there is no account, no sign-in and no server copy.
 */

export const PROFILE_KEY = 'ai_assistant_profile'

/** A neutral default so an untouched install still reads naturally. */
export const DEFAULT_PROFILE = {
  name: 'Friend',
  email: '',
  avatar: '', // data URL, or '' to fall back to the app logo / initials
}

export const MAX_AVATAR_BYTES = 512 * 1024
export const MAX_NAME_LENGTH = 60
export const MAX_EMAIL_LENGTH = 120

/**
 * Two letters for the round account button.
 * "Nishad Islam Utso" -> "NU" (first and last word), "Friend" -> "FR".
 */
export function initials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/** The single word used after a greeting, so "Good evening, Nishad" not the full name. */
export function firstName(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean)
  return words[0] || ''
}

export function normalizeProfile(value) {
  const source = value && typeof value === 'object' ? value : {}
  const name = typeof source.name === 'string' ? source.name.slice(0, MAX_NAME_LENGTH) : DEFAULT_PROFILE.name
  const email = typeof source.email === 'string' ? source.email.slice(0, MAX_EMAIL_LENGTH) : DEFAULT_PROFILE.email
  const avatar = typeof source.avatar === 'string' && source.avatar.startsWith('data:image/') ? source.avatar : ''
  return { name: name.trim() || DEFAULT_PROFILE.name, email, avatar }
}

/**
 * Shrink an uploaded image before it is stored.
 *
 * localStorage is a few megabytes for the whole app, so a 4 MB photo straight off
 * a phone would eat the budget for chats and artifacts. This draws to a 128px
 * square and re-encodes as JPEG/PNG, which lands around 5-20 KB.
 */
export function shrinkImage(file, { size = 128, type = 'image/png' } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !String(file.type || '').startsWith('image/')) {
      reject(new Error('Choose an image file (PNG, JPEG, WebP or GIF).'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('That file could not be read.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('That image could not be decoded.'))
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const context = canvas.getContext('2d')
        context.imageSmoothingQuality = 'high'
        // Cover-fit so non-square photos are not stretched.
        const scale = Math.max(size / image.width, size / image.height)
        const width = image.width * scale
        const height = image.height * scale
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height)
        resolve(canvas.toDataURL(type))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
