/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Palette measured from spec/screenshots (191547-191707). Values are CSS variables
      // so the Settings > Appearance theme can switch dark / light at runtime.
      colors: {
        main: 'var(--bg-main)',
        side: 'var(--bg-side)',
        elev: 'var(--bg-elev)',
        modal: 'var(--bg-modal)',
        input: 'var(--bg-input)',
        hover: 'var(--bg-hover)',
        active: 'var(--bg-active)',
        line: 'var(--border)',
        soft: 'var(--border-soft)',
        fg: 'var(--text)',
        fg2: 'var(--text-2)',
        fg3: 'var(--text-3)',
        accent: 'var(--accent)',
        bubble: 'var(--user-bubble)',
        primary: 'var(--btn-primary)',
        'primary-fg': 'var(--btn-primary-text)',
        link: 'var(--link)',
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Inter', 'system-ui', '-apple-system', 'Roboto', 'sans-serif'],
        serif: ['"Anthropic Serif"', '"Iowan Old Style"', 'Georgia', '"Times New Roman"', 'serif'],
      },
    },
  },
  plugins: [],
}
