/**
 * profile.js — who is using the app.
 *
 * This is deliberately not hardcoded to any one person. The app reads a name
 * and an email from local storage and uses them in the greeting and the
 * account panel. The defaults are neutral ("Friend", no email) so that a fresh
 * clone of this repository says something sensible to whoever opens it.
 *
 * Nothing here is sent anywhere. This is a local preference, like a nickname,
 * and it is stored in this browser next to everything else.
 */

export const DEFAULT_PROFILE = Object.freeze({
  name: 'Friend',
  email: '',
  // Shown under the greeting. Empty means "don't show a line", which keeps the
  // home view as quiet as the screenshot it is matched to.
  tagline: '',
})

const MAX_NAME = 40
const MAX_EMAIL = 120
const MAX_TAGLINE = 80

const clean = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

/** Never let the name go empty — the greeting would read "Good evening, ." */
export function normalizeProfile(value) {
  const input = value && typeof value === 'object' ? value : {}
  const name = clean(input.name, MAX_NAME)
  return {
    name: name || DEFAULT_PROFILE.name,
    email: clean(input.email, MAX_EMAIL),
    tagline: clean(input.tagline, MAX_TAGLINE),
  }
}

/** First name only, for "Good evening, Utso" rather than the full string. */
export function firstName(profile) {
  const name = normalizeProfile(profile).name
  return name.split(/\s+/)[0] || DEFAULT_PROFILE.name
}

/**
 * A best-effort starting point from the operating system account. Used only to
 * pre-fill a first-run prompt — it is a guess, so it is always shown and
 * always editable, never silently applied.
 */
export function guessProfileName() {
  try {
    const guess = (typeof process !== 'undefined' && process.env?.USER)
      || (typeof process !== 'undefined' && process.env?.USERNAME)
      || ''
    const name = String(guess).trim()
    if (!name) return ''
    // "nishad.islam" or "nishad_islam" reads better as "Nishad Islam".
    return name.replace(/[._-]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase()).slice(0, MAX_NAME)
  } catch {
    return ''
  }
}
