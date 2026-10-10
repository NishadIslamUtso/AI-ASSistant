/** @type {import('tailwindcss').Config} */
// Colours are CSS variables (see src/index.css) so the Settings > Theme choice can switch palettes.
// Values in index.css were sampled from the six spec screenshots in spec/screenshots/.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ui: {
          side: 'var(--c-side)',
          main: 'var(--c-main)',
          panel: 'var(--c-panel)',
          composer: 'var(--c-composer)',
          menu: 'var(--c-menu)',
          search: 'var(--c-search)',
          seg: 'var(--c-seg)',
          hover: 'var(--c-hover)',
          active: 'var(--c-active)',
          line: 'var(--c-line)',
          text: 'var(--c-text)',
          body: 'var(--c-body)',
          muted: 'var(--c-muted)',
          faint: 'var(--c-faint)',
          accent: 'var(--c-accent)',
          link: 'var(--c-link)',
          avatar: 'var(--c-avatar)',
          pill: 'var(--c-pill)',
          overlay: 'var(--c-overlay)',
          danger: 'var(--c-danger)',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)'],
        sans: ['var(--font-ui)'],
      },
    },
  },
  plugins: [],
}
