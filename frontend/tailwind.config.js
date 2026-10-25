/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'Inter', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          bg: '#FBFCF7',
          dark: '#1D1C17',
          forest: '#394C25',
          'forest-border': '#4B5A3D',
          olive: '#334425',
          green: '#243F26',
          yellow: '#FBEF6F',
          gray: '#44483F',
          border: '#C5C8BC',
          'card-border': '#E5E1D9',
          'subtle-bg': '#FFFEE5',
          sage: '#D5DBB0',
          'sage-border': '#B8CDA3',
          mint: '#C4EAB6',
        },
        leaf: {
          50: '#fffef8',
          100: '#eef2cf',
          200: '#d7deac',
          700: '#49683c',
          800: '#385729',
          900: '#2d4820',
        },
        soil: '#907b00',
        sun: '#ffe55b',
      },
      boxShadow: {
        soft: '0 18px 48px rgba(45, 72, 32, 0.16)',
        card: '0 8px 30px rgba(74, 92, 58, 0.12)',
      },
    },
  },
  plugins: [],
}
