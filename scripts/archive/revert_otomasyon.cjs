const fs = require("fs");

let smartHtml = fs.readFileSync("stitch-smart.html", "utf8");

const oldOtomasyonHtml = `
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
        <a href="stitch-skills.html" class="mt-6 w-full flex items-center justify-center gap-2 bg-white border border-dashed border-gray-300 text-gray-600 py-3 rounded-2xl font-semibold active:bg-gray-50 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Yeni Otomasyon
        </a>
      </div>
      <!-- END: Otomasyon Tab -->
`;

smartHtml = smartHtml.replace(
  /<div id="tab-automation" class="hidden">[\s\S]*?<!-- END: Otomasyon Tab -->/,
  oldOtomasyonHtml.trim(),
);

fs.writeFileSync("stitch-smart.html", smartHtml, "utf8");
console.log("Restored old Otomasyon tab with button in stitch-smart.html");
