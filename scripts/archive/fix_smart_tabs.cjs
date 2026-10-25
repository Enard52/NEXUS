const fs = require("fs");

let html = fs.readFileSync("stitch-smart.html", "utf8");

// 1. Update Tabs Navigation
const oldTabsRegex =
  /<nav class="flex border-b border-gray-200" data-purpose="tabs">[\s\S]*?<\/nav>/;
const newTabs = `<nav class="flex border-b border-gray-200" data-purpose="tabs">
      <button onclick="switchTab('tab-smart', this)" class="flex-1 py-3 text-sm font-bold text-gray-900 relative tab-active" id="btn-tab-smart">
        Akıllı Uygulama
      </button>
      <button onclick="switchTab('tab-clickrun', this)" class="flex-1 py-3 text-center text-sm font-semibold text-gray-500 block transition-colors" id="btn-tab-clickrun">Tıkla ve çalıştır</button>
      <button onclick="switchTab('tab-automation', this)" class="flex-1 py-3 text-center text-sm font-semibold text-gray-500 block transition-colors" id="btn-tab-automation">Otomasyon</button>
    </nav>`;

html = html.replace(oldTabsRegex, newTabs);

// 2. Wrap existing main content into tab-smart
// Find <main class="flex-grow px-5 pt-6 pb-28" data-purpose="main-content">
html = html.replace(
  '<main class="flex-grow px-5 pt-6 pb-28" data-purpose="main-content">',
  '<main class="flex-grow px-5 pt-6 pb-28" data-purpose="main-content">\n      <div id="tab-smart" class="block">',
);

// We need to find where the main content ends to close the div and add new tabs
// The main content ends right before <!-- Bottom Navigation -->
const beforeNavRegex = /<!-- Bottom Navigation -->/i;
const newTabsContent = `      </div> <!-- End tab-smart -->
      
      <!-- BEGIN: Tıkla ve çalıştır Tab -->
      <div id="tab-clickrun" class="hidden">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Senaryolarım</h3>
        <div class="grid grid-cols-2 gap-4">
          <!-- Card 1 -->
          <button class="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-3xl p-5 text-left shadow-sm active:scale-95 transition-transform">
            <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            </div>
            <h4 class="font-bold text-slate-800">İyi Geceler</h4>
            <p class="text-xs text-slate-500 mt-1">Işıkları kapat, alarmı kur</p>
          </button>
          <!-- Card 2 -->
          <button class="bg-gradient-to-br from-rose-50 to-orange-50 border border-orange-100 rounded-3xl p-5 text-left shadow-sm active:scale-95 transition-transform">
            <div class="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            <h4 class="font-bold text-slate-800">Günaydın</h4>
            <p class="text-xs text-slate-500 mt-1">Perdeleri aç, kahveyi yap</p>
          </button>
          <!-- Card 3 -->
          <button class="bg-gradient-to-br from-emerald-50 to-teal-50 border border-teal-100 rounded-3xl p-5 text-left shadow-sm active:scale-95 transition-transform">
            <div class="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mb-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </div>
            <h4 class="font-bold text-slate-800">Evden Çıkış</h4>
            <p class="text-xs text-slate-500 mt-1">Klima kapalı, kapı kilitli</p>
          </button>
          <!-- Card 4 -->
          <button class="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-3xl p-5 text-left shadow-sm active:scale-95 transition-transform">
            <div class="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
            <h4 class="font-bold text-slate-800">Sinema Modu</h4>
            <p class="text-xs text-slate-500 mt-1">Işıkları kıs, TV aç</p>
          </button>
        </div>
        <button class="mt-6 w-full flex items-center justify-center gap-2 bg-white border border-dashed border-gray-300 text-gray-600 py-3 rounded-2xl font-semibold active:bg-gray-50 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Yeni Senaryo Ekle
        </button>
      </div>
      <!-- END: Tıkla ve çalıştır Tab -->

      <!-- BEGIN: Otomasyon Tab -->
      <div id="tab-automation" class="hidden">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">Otomasyonlar</h3>
          <span class="bg-[#7C5CFF]/10 text-[#7C5CFF] text-xs font-bold px-2 py-1 rounded-lg">2 Aktif</span>
        </div>
        <div class="space-y-4">
          
          <div class="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              </div>
              <div>
                <h4 class="font-bold text-slate-800 text-sm">Gün batımında aydınlat</h4>
                <p class="text-xs text-slate-500 mt-0.5">Eğer saat gün batımı ise, salonu aç</p>
              </div>
            </div>
            <!-- Toggle Switch -->
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7C5CFF]"></div>
            </label>
          </div>

          <div class="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <div>
                <h4 class="font-bold text-slate-800 text-sm">Enerji Tasarrufu</h4>
                <p class="text-xs text-slate-500 mt-0.5">Evden çıkarsam her şeyi kapat</p>
              </div>
            </div>
            <!-- Toggle Switch -->
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7C5CFF]"></div>
            </label>
          </div>

        </div>
        <button class="mt-6 w-full flex items-center justify-center gap-2 bg-white border border-dashed border-gray-300 text-gray-600 py-3 rounded-2xl font-semibold active:bg-gray-50 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Yeni Otomasyon
        </button>
      </div>
      <!-- END: Otomasyon Tab -->

</main> <!-- Re-close the main block just to be safe but replace handles it -->
<!-- Bottom Navigation -->`;

html = html.replace(/<\/main>[\s\S]*?<!-- Bottom Navigation -->/, newTabsContent);

// Add the JS for tab switching
const jsCode = `
<script>
  function switchTab(tabId, btnElement) {
    // Hide all tabs
    document.getElementById('tab-smart').classList.add('hidden');
    document.getElementById('tab-smart').classList.remove('block');
    document.getElementById('tab-clickrun').classList.add('hidden');
    document.getElementById('tab-clickrun').classList.remove('block');
    document.getElementById('tab-automation').classList.add('hidden');
    document.getElementById('tab-automation').classList.remove('block');
    
    // Show active tab
    document.getElementById(tabId).classList.remove('hidden');
    document.getElementById(tabId).classList.add('block');
    
    // Update button styles
    const buttons = [document.getElementById('btn-tab-smart'), document.getElementById('btn-tab-clickrun'), document.getElementById('btn-tab-automation')];
    buttons.forEach(btn => {
      btn.classList.remove('font-bold', 'text-gray-900', 'tab-active');
      btn.classList.add('font-semibold', 'text-gray-500');
    });
    
    btnElement.classList.remove('font-semibold', 'text-gray-500');
    btnElement.classList.add('font-bold', 'text-gray-900', 'tab-active');
  }
</script>
</body>`;

html = html.replace("</body>", jsCode);

fs.writeFileSync("stitch-smart.html", html, "utf8");
console.log("Fixed tabs in stitch-smart.html");
