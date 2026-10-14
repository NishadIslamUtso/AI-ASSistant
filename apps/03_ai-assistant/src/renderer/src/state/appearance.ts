/**
 * Settings > Appearance.
 *
 * The theme is tokens (see globals.css) and nothing in the app hardcodes a
 * colour, so appearance here is not a skin laid over the top: it rewrites the
 * tokens the interface actually reads, and everything drawn from them follows.
 *
 * It is kept in this window's storage rather than the machine's settings file
 * on purpose. An accent colour is a preference about reading, not a fact about
 * the computer — which also means it works in the browser preview, where there
 * is no machine to write anything down.
 */

import { readStored } from '@shared/lib/storage'

export type AccentName = 'violet' | 'blue' | 'teal' | 'amber' | 'rose'
export type WidthName = 'focused' | 'comfortable' | 'wide'

export type Appearance = {
  accent: AccentName
  width: WidthName
}

export const APPEARANCE_KEY = 'ai-assistant.appearance'

/** Violet is the theme's own accent, so the default changes nothing. */
export const ACCENTS: readonly { name: AccentName; label: string; hex: string }[] = Object.freeze([
  { name: 'violet', label: 'Violet', hex: '#7c5cff' },
  { name: 'blue', label: 'Blue', hex: '#4f8bf5' },
  { name: 'teal', label: 'Teal', hex: '#2fb3a2' },
  { name: 'amber', label: 'Amber', hex: '#e0a44a' },
  { name: 'rose', label: 'Rose', hex: '#e0688b' },
])

/** Comfortable is the width the conversation already used. */
export const WIDTHS: readonly { name: WidthName; label: string; px: number }[] = Object.freeze([
  { name: 'focused', label: 'Focused', px: 640 },
  { name: 'comfortable', label: 'Comfortable', px: 760 },
  { name: 'wide', label: 'Wide', px: 1040 },
])

export const DEFAULT_APPEARANCE: Appearance = Object.freeze({
  accent: 'violet',
  width: 'comfortable',
})

export function accentHex(name: AccentName): string {
  return (ACCENTS.find(accent => accent.name === name) || ACCENTS[0]).hex
}

export function chatWidthPx(name: WidthName): number {
  return (WIDTHS.find(width => width.name === name) || WIDTHS[1]).px
}

/** Half-written or hand-edited values degrade to the default, field by field. */
export function normalizeAppearance(value: unknown): Appearance {
  const input = (value && typeof value === 'object' ? value : {}) as Partial<Appearance>
  return {
    accent: ACCENTS.some(accent => accent.name === input.accent)
      ? (input.accent as AccentName)
      : DEFAULT_APPEARANCE.accent,
    width: WIDTHS.some(width => width.name === input.width)
      ? (input.width as WidthName)
      : DEFAULT_APPEARANCE.width,
  }
}

/**
 * The two tokens an appearance rewrites. `--color-accent` is Tailwind's, so
 * every `bg-accent`/`border-accent`/`text-accent` in the app follows without a
 * component knowing this exists; `--chat-width` is read by the conversation
 * column through an arbitrary utility.
 */
export function appearanceVariables(appearance: Appearance): Record<string, string> {
  return {
    '--color-accent': accentHex(appearance.accent),
    '--chat-width': `${chatWidthPx(appearance.width)}px`,
  }
}

type StyledRoot = { style: { setProperty(name: string, value: string): void } }

export function applyAppearance(
  appearance: Appearance,
  root: StyledRoot = document.documentElement
): void {
  const variables = appearanceVariables(appearance)
  for (const [name, value] of Object.entries(variables)) root.style.setProperty(name, value)
}

/**
 * The same thing, read straight from storage, so the first paint is already the
 * chosen colour rather than the default flashing for a frame.
 */
export function applyStoredAppearance(): void {
  const stored = readStored(APPEARANCE_KEY, DEFAULT_APPEARANCE, normalizeAppearance)
  applyAppearance(stored.value)
}
