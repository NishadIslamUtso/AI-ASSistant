/**
 * theme.js — MEASURED pixel spec
 *
 * Every number in this file was extracted from the user's own screenshots
 * (spec/screenshots/Screenshot 2026-10-10 1915xx.png / 1916xx.png / 191707.png)
 * by pixel analysis + OCR, NOT guessed.
 *
 * Screenshots are 1920x1020 DEVICE px on a 150% Windows-scaled display.
 * All layout values below are CSS px = device / 1.5.
 *
 * Reference: spec/PIXEL_SPEC_MEASURED.md
 */

export const SCALE = 1.5

/* ---------- colours (sampled from the screenshots) ---------- */
export const C = {
  appBg: '#151515',      // main conversation area
  sidebarBg: '#111111',  // left sidebar
  composerBg: '#20201f', // composer box
  inputBg: '#1d1d1d',    // sidebar search field
  btnBg: '#343434',      // "New" button fill
  hoverBg: '#1a1a19',
  selectedBg: '#262625',
  border: '#292929',     // sidebar|main divider, composer border
  borderBtn: '#2b2b2b',
  modalBg: '#1a1a19',
  modalNavBg: '#151515',
  modalBorder: '#262625',
  modalDivider: '#2d2d2d',
  scrollbar: '#5a5957',
  avatarBg: '#282828',

  text: '#f0efec',       // primary (greeting, headings)
  text2: '#c3c2b7',      // secondary (chat titles, nav items)
  text3: '#898781',      // muted (group headers, placeholders)
  link: '#2c7fec',       // "Upgrade"
  accent: '#d97757',     // Claude orange asterisk
  danger: '#e06c5b',
}

/* ---------- measured layout (CSS px) ---------- */
export const M = {
  viewport: { w: 1280, h: 680 }, // window client area at 150% (1920x1020 device)
  titleBar: 32,
  sidebar: 256,

  // sidebar internals
  search: { x: 9, y: 41, w: 239, h: 23, iconX: 17, textX: 38 },
  newChat: { x: 7, y: 71, w: 242, h: 24, iconX: 23, textX: 39 },
  nav: { y: 100, pitch: 25, iconX: 17, textX: 37, h: 16 },
  chat: { x: 16, h: 16, pitch: 25, firstY: 216 },
  groupHeader: { x: 16, h: 11, y1: 191, y2: 259 },
  bottomBar: { y: 640, h: 40, avatar: 18, avatarX: 13, nameX: 36 },

  // main area
  planPill: { y: 91, h: 23, w: 137 },
  greeting: { y: 290, size: 30, gap: 11, asterisk: 31 },
  composer: { x: 475, y: 344, w: 587, h: 95, radius: 8, padX: 14, padY: 15 },
  composerRow: { y: 408 },       // inside-composer bottom row
  footerRow: { y: 449 },         // "Project" + model row, below the composer box

  // overlays
  modal: { w: 1173, h: 615, nav: 176, padX: 21 },
  userMenu: { w: 249 },
  contextMenu: { w: 143, itemH: 24 },
}

/* ---------- settings rows, measured from 191707.png ---------- */
// y = distance from modal top (device/1.5), control = right aligned x offset
export const APPEARANCE_ROWS = [
  { label: 'Theme', kind: 'theme', y: 106, value: 'system' },
  { label: 'Chat font', kind: 'select', y: 158, value: 'Anthropic Serif',
    options: ['Anthropic Serif', 'System Sans', 'Monospace'] },
  { label: 'Transcript text size', kind: 'seg', y: 205, value: 'Medium',
    desc: 'Size of the conversation transcript text.', options: ['Small', 'Medium', 'Large'] },
  { label: 'Transcript width', kind: 'seg', y: 268, value: 'Medium',
    desc: 'Maximum width of the transcript and composer columns.', options: ['Narrow', 'Medium', 'Wide'] },
  { label: 'Motion', kind: 'seg', y: 331, value: 'System',
    desc: 'Reduce animation in streaming responses and other interface elements.',
    options: ['System', 'Reduced'] },
]

export const VOICE_ROWS = [
  { label: 'Language', kind: 'select', y: 469, value: 'English', options: ['English', 'Bengali'] },
  { label: 'Style', kind: 'select', y: 520, value: 'Buttery', options: ['Buttery', 'Crisp', 'Smooth'] },
  { label: 'Speed', kind: 'select', y: 572, value: 'Normal', options: ['Slow', 'Normal', 'Fast'] },
]

export const SETTINGS_NAV = [
  { label: 'General', y: 131 },
  { label: 'Account', y: 163 },
  { label: 'Privacy', y: 192 },
  { label: 'Billing', y: 222 },
  { label: 'Capabilities', y: 253 },
  { label: 'Memory', y: 283 },
  { label: 'Reflect', y: 313 },
  { label: 'Time and focus', y: 344 },
  { label: 'Claude Code', y: 374 },
  { label: 'System', y: 452 },
  { label: 'Extensions', y: 482 },
  { label: 'Developer', y: 512 },
  { label: 'Skills', y: 590 },
  { label: 'Connectors', y: 620 },
]

/* ---------- fonts ---------- */
export const FONT = {
  sans: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
  serif: '"Anthropic Serif", Copernicus, Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
}
