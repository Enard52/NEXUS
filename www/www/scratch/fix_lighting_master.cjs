const fs = require('fs');

let html = fs.readFileSync('stitch-lighting-master.html', 'utf8');

// 1. Replace the fake thumb with a real range input
const oldWarmthHtml = `<div class="relative h-2 w-full rounded-lg bg-gradient-to-r from-blue-200 via-orange-100 to-orange-400">
            <div id="warmth-thumb" class="absolute top-1/2 left-[70%] h-6 w-6 -translate-y-1/2 rounded-full border-4 border-[#4C7DFF] bg-white shadow-md"></div>
          </div>`;
          
const newWarmthHtml = `<div class="relative h-2 w-full rounded-lg bg-gradient-to-r from-blue-200 via-orange-100 to-orange-400">
            <input id="warmth-slider" type="range" min="2000" max="6500" value="4000" class="slider-thumb absolute top-0 left-0 h-2 w-full cursor-pointer appearance-none bg-transparent"/>
          </div>`;

html = html.replace(oldWarmthHtml, newWarmthHtml);

// 2. Wrap the dynamic sections in a div with id="lighting-controls" and add empty state
const oldMainStart = `<section class="space-y-3">
        <h3 class="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-300">Oda Seçimi</h3>`;
        
const newMainStart = `<div id="empty-state" class="hidden flex-col items-center justify-center py-20 text-center">
        <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <iconify-icon icon="lucide:lightbulb-off" class="text-4xl text-slate-400"></iconify-icon>
        </div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">Aydınlatma Cihazı Yok</h2>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto">Sistemde ekli hiçbir aydınlatma cihazı bulunamadı. Lütfen cihaz ekleyip tekrar deneyin.</p>
        <button onclick="window.location.href='stitch-home.html'" class="mt-8 rounded-full bg-[#4C7DFF] px-6 py-3 font-bold text-white shadow-lg active:scale-95 transition-transform">Ana Sayfaya Dön</button>
      </div>

      <div id="lighting-controls">
      <section class="space-y-3">
        <h3 class="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-300">Oda Seçimi</h3>`;

html = html.replace(oldMainStart, newMainStart);

// Close the lighting-controls div just before the closing </main>
html = html.replace('</main>', '</div>\n    </main>');

// 3. Inject JS for warmth slider and empty state toggle
const oldJsEnd = `    document.getElementById("brightness-slider").addEventListener("input", function (event) {
      brightness = Number(event.target.value || 80);
      updateControls();
    });
    document.getElementById("save-scene-btn").addEventListener("click", saveScene);`;

const newJsEnd = `    var warmthLabel = document.getElementById("warmth-label");
    document.getElementById("brightness-slider").addEventListener("input", function (event) {
      brightness = Number(event.target.value || 80);
      updateControls();
    });
    document.getElementById("warmth-slider").addEventListener("input", function (event) {
      var val = Number(event.target.value);
      if(val < 3000) warmthLabel.textContent = "Çok Sıcak";
      else if(val < 4500) warmthLabel.textContent = "Sıcak";
      else if(val < 5500) warmthLabel.textContent = "Nötr";
      else warmthLabel.textContent = "Soğuk";
    });
    document.getElementById("save-scene-btn").addEventListener("click", saveScene);`;

html = html.replace(oldJsEnd, newJsEnd);

// Wrap init logic in a checker
const oldInit = `    renderHero();
    renderRooms();
    renderColors();
    renderScenes();
    updateControls();`;

const newInit = `    if(getLightingDevices().length === 0) {
      document.getElementById("lighting-controls").classList.add("hidden");
      document.getElementById("empty-state").classList.remove("hidden");
      document.getElementById("empty-state").classList.add("flex");
      document.querySelector("footer").classList.add("hidden");
    } else {
      renderHero();
      renderRooms();
      renderColors();
      renderScenes();
      updateControls();
    }`;

html = html.replace(oldInit, newInit);

fs.writeFileSync('stitch-lighting-master.html', html, 'utf8');
console.log('Fixed stitch-lighting-master.html');
