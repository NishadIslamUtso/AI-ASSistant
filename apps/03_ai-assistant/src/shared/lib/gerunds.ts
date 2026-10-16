/**
 * The working words.
 *
 * While the engine is mid-turn the header used to say the same word every
 * time ("working"), which reads as a machine waiting. Claude Code's little
 * theatre — a different "-ing" word each turn — reads as a worker at work,
 * so the app keeps that manner of speaking, with its own list. Pure and
 * deterministic under an injected random source, so tests can pin it.
 */

export const GERUNDS: readonly string[] = [
  'Pondering',
  'Brewing',
  'Simmering',
  'Reasoning',
  'Percolating',
  'Contemplating',
  'Mulling',
  'Weighing',
  'Sketching',
  'Drafting',
  'Tracing',
  'Untangling',
  'Connecting',
  'Composing',
  'Structuring',
  'Rummaging',
  'Correlating',
  'Synthesizing',
  'Distilling',
  'Arranging',
  'Deciphering',
  'Wandering',
  'Cogitating',
  'Thinking',
]

/** One working word, at random (or from the injected source, in tests). */
export function pickGerund(random: () => number = Math.random): string {
  return GERUNDS[Math.floor(random() * GERUNDS.length)] ?? GERUNDS[0]
}
