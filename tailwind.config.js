/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./stitch-*.html",
    "./www/stitch-*.html",
    "./www/index.html",
    "./**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        'nexus-purple': '#4C7DFF',
        'nexus-cyan': '#22D3EE',
        'nexus-brand': '#6D28D9',
        'nexus-bg': '#F8F7FC',
        'nexus-border': '#F1F1F4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('tailwindcss/plugin')
  ],
}
