/** @type {import('tailwindcss').Config} */
module.exports = {
  // Uygulama koyu temayı <html class="dark"> ile açıp kapatır (theme.js).
  // 'media' (varsayılan) kalırsa dark: sınıfları uygulama ayarını değil
  // işletim sistemi temasını izler ve iki tema birbirine karışır.
  darkMode: 'class',
  content: [
    "./src/app/stitch-*.html",
    "./www/stitch-*.html",
    "./www/index.html",
    "./**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        // Birincil marka rengi #4C7DFF (mavi). 'purple' adları tarihsel; değerleri değiştirmeyin,
        // tüm ekranlar bu adlarla yazılmış. Yeni kodda nexus-primary kullanın.
        'nexus-primary': '#4C7DFF',
        'nexus-primary-press': '#3F6FFF',
        'nexus-purple': '#4C7DFF',
        'nexus-cyan': '#22D3EE',
        'nexus-brand': '#4C7DFF',
        'nexus-bg': '#ECE9FD',
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
