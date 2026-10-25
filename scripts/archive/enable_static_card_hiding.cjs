const fs = require("fs");

// --- 1. Modify stitch-cards.html ---
let cardsHtml = fs.readFileSync("stitch-cards.html", "utf8");

const staticEditCards = `
<!-- Favoriler -->
<div class="flex items-center justify-between mb-6 mt-6">
<h2 class="text-xl font-medium text-slate-500">Favoriler (Varsayılan)</h2>
</div>
<div class="grid grid-cols-2 gap-4 mb-8" id="favorites-grid">
  <!-- Card 1: Weather -->
  <article class="relative bg-white rounded-3xl p-5 card-shadow flex flex-col justify-between h-40" id="dyn-card-weather">
    <button aria-label="Kartı kaldır" class="absolute -top-2 -left-2 w-7 h-7 bg-slate-400 text-white rounded-full flex items-center justify-center shadow-md z-10" onclick="deleteDynamicCard('weather')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 12h14" stroke-linecap="round"></path></svg>
    </button>
    <div>
      <svg class="mb-2 w-8 h-8 text-amber-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="4" stroke-linecap="round" stroke-linejoin="round"></circle><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke-linecap="round" stroke-linejoin="round"></path></svg>
      <h3 class="font-bold text-base leading-tight">Hava Durumu</h3>
    </div>
    <p class="text-slate-400 text-sm font-medium truncate">Aktif</p>
  </article>

  <!-- Card 2: DND -->
  <article class="relative bg-white rounded-3xl p-5 card-shadow flex flex-col justify-between h-40" id="dyn-card-dnd">
    <button aria-label="Kartı kaldır" class="absolute -top-2 -left-2 w-7 h-7 bg-slate-400 text-white rounded-full flex items-center justify-center shadow-md z-10" onclick="deleteDynamicCard('dnd')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 12h14" stroke-linecap="round"></path></svg>
    </button>
    <div>
      <svg class="mb-2 w-8 h-8 text-[#FF3B5C]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13.73 21a2 2 0 0 1-3.46 0M18.63 13A17.89 17.89 0 0 1 18 8M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14M18 8a6 6 0 0 0-9.33-5M1 1l22 22" stroke-linecap="round" stroke-linejoin="round"></path></svg>
      <h3 class="font-bold text-base leading-tight">Rahatsız Etme</h3>
    </div>
    <p class="text-slate-400 text-sm font-medium truncate">Aktif</p>
  </article>

  <!-- Card 3: Energy -->
  <article class="relative bg-white rounded-3xl p-5 card-shadow flex flex-col justify-between h-40" id="dyn-card-energy">
    <button aria-label="Kartı kaldır" class="absolute -top-2 -left-2 w-7 h-7 bg-slate-400 text-white rounded-full flex items-center justify-center shadow-md z-10" onclick="deleteDynamicCard('energy')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 12h14" stroke-linecap="round"></path></svg>
    </button>
    <div>
      <svg class="mb-2 w-8 h-8 text-[#7C5CFF]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round"></path></svg>
      <h3 class="font-bold text-base leading-tight">Bugünkü Enerji</h3>
    </div>
    <p class="text-slate-400 text-sm font-medium truncate">Aktif</p>
  </article>
</div>
`;

// Inject before Cihaz Kartları
cardsHtml = cardsHtml.replace(
  /<div class="flex items-center justify-between mb-6" data-purpose="section-title">\s*<h2 class="text-xl font-medium text-slate-500">Cihaz Kartları<\/h2>/,
  `${staticEditCards}\n<div class="flex items-center justify-between mb-6" data-purpose="section-title">\n<h2 class="text-xl font-medium text-slate-500">Cihaz Kartları</h2>`,
);

// Add script to hide them if they are in nexusHiddenCards
const scriptToHideStaticCards = `
<script>
  window.addEventListener('DOMContentLoaded', () => {
    let hidden = JSON.parse(localStorage.getItem('nexusHiddenCards') || '[]');
    ['weather', 'dnd', 'energy'].forEach(id => {
      if (hidden.includes(id)) {
        const el = document.getElementById('dyn-card-' + id);
        if (el) el.remove();
      }
    });
  });
</script>
`;
cardsHtml = cardsHtml.replace(/<\/body>/i, scriptToHideStaticCards + "\n</body>");

fs.writeFileSync("stitch-cards.html", cardsHtml, "utf8");
console.log("Modified stitch-cards.html to include static cards in edit view");

// --- 2. Modify stitch-home.html ---
let homeHtml = fs.readFileSync("stitch-home.html", "utf8");

// The cards in stitch-home.html don't have IDs like 'card-weather', so we need to add IDs to them so they can be hidden.
homeHtml = homeHtml.replace(
  /<!-- Card 1: Weather[\s\S]*?<a class="bg-white rounded-3xl p-5 card-shadow flex flex-col justify-between h-40" href="stitch-map.html">/,
  '<!-- Card 1: Weather (opens location picker for weather) -->\n<a id="card-weather" class="bg-white rounded-3xl p-5 card-shadow flex flex-col justify-between h-40" href="stitch-map.html">',
);

homeHtml = homeHtml.replace(
  /<!-- Card 2: DND[\s\S]*?<a class="bg-white rounded-3xl p-5 card-shadow flex flex-col justify-between h-40" href="stitch-dnd.html">/,
  '<!-- Card 2: DND (opens Rahatsız Etme page) -->\n<a id="card-dnd" class="bg-white rounded-3xl p-5 card-shadow flex flex-col justify-between h-40" href="stitch-dnd.html">',
);

homeHtml = homeHtml.replace(
  /<!-- Card 3: Energy Today[\s\S]*?<a class="bg-white rounded-3xl p-5 card-shadow flex flex-col justify-between h-40" href="stitch-energy.html">/,
  '<!-- Card 3: Energy Today (AI Enerji Tasarrufu mini uygulamasına gider) -->\n<a id="card-energy" class="bg-white rounded-3xl p-5 card-shadow flex flex-col justify-between h-40" href="stitch-energy.html">',
);

// We need a script in stitch-home.html to hide them. Oh wait, data.js ALREADY does this!
// data.js has:
// if (window.location.pathname.includes('stitch-home.html')) {
//    let hidden = JSON.parse(localStorage.getItem('nexusHiddenCards') || '[]');
//    hidden.forEach(id => {
//        const el = document.getElementById('card-' + id);
//        if (el) el.remove();
//    });
// }
// Since we added ID 'card-weather', 'card-dnd', and 'card-energy', data.js will automatically hide them if their id is in nexusHiddenCards!
fs.writeFileSync("stitch-home.html", homeHtml, "utf8");
console.log(
  "Modified stitch-home.html to assign IDs to static cards so data.js hides them correctly",
);
