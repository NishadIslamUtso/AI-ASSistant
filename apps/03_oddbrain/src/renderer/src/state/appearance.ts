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
export type TextSizeName = 'small' | 'medium' | 'large'
export type FontName = 'sans' | 'serif' | 'anthropic-serif'
export type ThemeName = 'system' | 'light' | 'dark'

/** How the kit's scenes move: System follows the OS, Calm slows them,
 *  Balanced is the kit's own speed, Playful hurries them, Still stops them. */
export type MotionName = 'system' | 'calm' | 'balanced' | 'playful' | 'still'

export type Appearance = {
  /** Which palette the neutrals come from: the OS's choice, or one of ours. */
  theme: ThemeName
  accent: AccentName
  width: WidthName
  /** The transcript's text size, as the approved settings mockup offers it. */
  textSize: TextSizeName
  /** The reading font for the transcript: the app's sans, or a reading serif. */
  font: FontName
  /** The motion modes of the OddBrain kit; a stored 'reduced' reads as 'still'. */
  motion: MotionName
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
  { name: 'focused', label: 'Narrow', px: 640 },
  { name: 'comfortable', label: 'Medium', px: 760 },
  { name: 'wide', label: 'Wide', px: 1040 },
])

export const TEXT_SIZES: readonly { name: TextSizeName; label: string; px: number }[] = Object.freeze([
  { name: 'small', label: 'Small', px: 13 },
  { name: 'medium', label: 'Medium', px: 14.5 },
  { name: 'large', label: 'Large', px: 16.5 },
])

export const FONTS: readonly { name: FontName; label: string; stack: string }[] = Object.freeze([
  { name: 'sans', label: 'App sans', stack: "system-ui, 'Segoe UI', sans-serif" },
  { name: 'serif', label: 'Reading serif', stack: "Georgia, 'Times New Roman', serif" },
  /** Anthropic Serif when the machine has it; otherwise the same reading
   *  serif renders - an honest fallback, never a missing-font box. */
  { name: 'anthropic-serif', label: 'Anthropic Serif', stack: "'Anthropic Serif', Georgia, 'Times New Roman', serif" },
])

/** The dark palette is the app's own; System follows the OS either way. */
export const THEMES: readonly { name: ThemeName; label: string }[] = Object.freeze([
  { name: 'system', label: 'System' },
  { name: 'light', label: 'Light' },
  { name: 'dark', label: 'Dark' },
])

export const MOTIONS: readonly { name: MotionName; label: string }[] = Object.freeze([
  { name: 'system', label: 'System' },
  { name: 'calm', label: 'Calm' },
  { name: 'balanced', label: 'Balanced' },
  { name: 'playful', label: 'Playful' },
  { name: 'still', label: 'Still' },
])

export const DEFAULT_APPEARANCE: Appearance = Object.freeze({
  theme: 'system',
  accent: 'violet',
  width: 'comfortable',
  textSize: 'medium',
  font: 'sans',
  motion: 'system',
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
    theme: THEMES.some(theme => theme.name === input.theme)
      ? (input.theme as ThemeName)
      : DEFAULT_APPEARANCE.theme,
    accent: ACCENTS.some(accent => accent.name === input.accent)
      ? (input.accent as AccentName)
      : DEFAULT_APPEARANCE.accent,
    width: WIDTHS.some(width => width.name === input.width)
      ? (input.width as WidthName)
      : DEFAULT_APPEARANCE.width,
    textSize: TEXT_SIZES.some(size => size.name === input.textSize)
      ? (input.textSize as TextSizeName)
      : DEFAULT_APPEARANCE.textSize,
    font: FONTS.some(font => font.name === input.font) ? (input.font as FontName) : DEFAULT_APPEARANCE.font,
    // A stored 'reduced' (the old two-value control) reads as Still — the same
    // promise, everything stopped.
    motion: MOTIONS.some(mode => mode.name === input.motion)
      ? (input.motion as MotionName)
      : (input as { motion?: unknown }).motion === 'reduced'
        ? 'still'
        : DEFAULT_APPEARANCE.motion,
  }
}

/**
 * The two tokens an appearance rewrites. `--color-accent` is Tailwind's, so
 * every `bg-accent`/`border-accent`/`text-accent` in the app follows without a
 * component knowing this exists; `--chat-width` is read by the conversation
 * column through an arbitrary utility.
 */
export function textSizePx(name: TextSizeName): number {
  return (TEXT_SIZES.find(size => size.name === name) || TEXT_SIZES[1]).px
}

export function fontStack(name: FontName): string {
  return (FONTS.find(font => font.name === name) || FONTS[0]).stack
}

export function appearanceVariables(appearance: Appearance): Record<string, string> {
  return {
    '--color-accent': accentHex(appearance.accent),
    '--chat-width': `${chatWidthPx(appearance.width)}px`,
    '--transcript-size': `${textSizePx(appearance.textSize)}px`,
    '--transcript-font': fontStack(appearance.font),
    '--motion': appearance.motion === 'still' ? '0' : '1',
  }
}

type StyledRoot = {
  style: { setProperty(name: string, value: string): void }
  setAttribute?(name: string, value: string): void
  removeAttribute?(name: string, value?: string): void
}

export function applyAppearance(
  appearance: Appearance,
  root: StyledRoot = document.documentElement
): void {
  const variables = appearanceVariables(appearance)
  for (const [name, value] of Object.entries(variables)) root.style.setProperty(name, value)
  // The theme is a palette swap, not a variable: it lives in the stylesheet as
  // `[data-theme='light']`, so `System` is the attribute's absence and the OS's
  // preference answers. The accent stays inline — it is chosen separately and
  // works on both palettes.
  if (appearance.theme === 'light' || appearance.theme === 'dark') {
    if (typeof root.setAttribute === 'function') root.setAttribute('data-theme', appearance.theme)
  } else if (typeof root.removeAttribute === 'function') {
    root.removeAttribute('data-theme')
  }
}

/**
 * The same thing, read straight from storage, so the first paint is already the
 * chosen colour rather than the default flashing for a frame.
 */
export function applyStoredAppearance(): void {
  const stored = readStored(APPEARANCE_KEY, DEFAULT_APPEARANCE, normalizeAppearance)
  applyAppearance(stored.value)
}
