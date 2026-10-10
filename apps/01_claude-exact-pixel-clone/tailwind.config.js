export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        main: 'var(--bg-main)',
        side: 'var(--bg-side)',
        elev: 'var(--bg-elev)',
        hover: 'var(--bg-hover)',
        line: 'var(--border)',
        lineStrong: 'var(--border-strong)',
        ink: 'var(--text)',
        ink2: 'var(--text-2)',
        ink3: 'var(--text-3)',
        accent: 'var(--accent)',
      },
      boxShadow: {
        pop: 'var(--shadow)',
      },
    },
  },
  plugins: [],
}
