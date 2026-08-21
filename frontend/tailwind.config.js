/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
      },
      colors: {
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
      },
    },
  },
  plugins: [],
}
