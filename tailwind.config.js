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
        // stitch ekranlari developerce camelCase token kullaniyor (text-nexusPurple);
        // Play CDN kaldirildigi icin bu aliaslar statik CSS uretiminde de tanimli olmali.
        nexusPurple: '#4C7DFF',
        nexusCyan: '#22D3EE',
      },
      backgroundImage: {
        'nexus-gradient': 'linear-gradient(180deg, #ECE9FD 0%, #DDD8FB 100%)',
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
