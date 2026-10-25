const fs = require("fs");

// 1. Fix stitch-profile.html text wrapping
let profile = fs.readFileSync("stitch-profile.html", "utf8");
profile = profile.replace(
  '<span class="text-lg font-medium">SSS &amp; Geribildirim</span>',
  '<span class="text-lg font-medium whitespace-nowrap truncate">SSS &amp; Geribildirim</span>',
);
// Just in case it's slightly different:
profile = profile.replace(
  /<span class="text-lg font-medium">(SSS\s*&amp;\s*Geribildirim)<\/span>/,
  '<span class="text-lg font-medium whitespace-nowrap">$1</span>',
);
fs.writeFileSync("stitch-profile.html", profile, "utf8");

// 2. Fix stitch-smart.html
let smart = fs.readFileSync("stitch-smart.html", "utf8");

// 2a. Replace top-left profile avatar with home-selector button
const topLeftRegex =
  /<div class="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">[\s\S]*?<\/div>/;
const homeSelectorButton = `<button onclick="toggleHomeSelector()" class="flex items-center gap-2 bg-white/60 backdrop-blur-md border border-slate-200/60 pl-2 pr-3 py-1 rounded-full shadow-sm active:scale-95 transition-transform" data-purpose="home-selector">
  <div class="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#6344E6] flex items-center justify-center text-white shadow-inner flex-shrink-0">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
  </div>
  <div class="flex flex-col justify-center">
    <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-0.5">Mevcut Ev</span>
    <span class="text-xs font-bold text-slate-800 leading-none" data-bind="householdName">Benim Evim</span>
  </div>
  <svg class="w-3.5 h-3.5 text-slate-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
</button>`;

if (topLeftRegex.test(smart)) {
  smart = smart.replace(topLeftRegex, homeSelectorButton);
}

// 2b. Remove NEXUS logo/name above the AI input (lines ~59-63)
const logoRegex =
  /<div class="flex items-center space-x-2">\s*<!-- NEXUS N monogram -->\s*<div class="h-7 w-7 rounded-lg bg-gradient-to-br from-\[#7C5CFF\] to-\[#22D3EE\] flex items-center justify-center text-white font-bold text-sm">N<\/div>\s*<span class="text-xl font-bold text-gray-900 tracking-tight">NEXUS<\/span>\s*<\/div>/;
smart = smart.replace(logoRegex, '<div class="flex items-center space-x-2"></div>');

// 2c. Add Routines icon to the left of the + button
const plusButtonRegex =
  /<button aria-label="Hızlı ekle" class="text-\[#7C5CFF\] p-1 active:scale-95 transition-transform" onclick="window\.location\.href='stitch-plus\.html'">[\s\S]*?<\/button>/;
const newButtons = `<div class="flex items-center space-x-2">
  <button aria-label="Günlükler" class="text-slate-600 p-1.5 active:scale-95 transition-transform hover:text-slate-900" onclick="window.location.href='stitch-routines.html'">
    <i class="w-7 h-7" data-lucide="list-checks"></i>
  </button>
  <button aria-label="Hızlı ekle" class="text-[#7C5CFF] p-1 active:scale-95 transition-transform" onclick="window.location.href='stitch-plus.html'">
    <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
    </svg>
  </button>
</div>`;
if (plusButtonRegex.test(smart)) {
  smart = smart.replace(plusButtonRegex, newButtons);
}

// 2d. Fix Tıkla ve Çalıştır and Otomasyon links
const tapRegex =
  /<button class="flex-1 py-3 text-sm font-semibold text-gray-500">\s*Tıkla ve Çalıştır\s*<\/button>/;
smart = smart.replace(
  tapRegex,
  `<a href="stitch-program.html" class="flex-1 py-3 text-center text-sm font-semibold text-gray-500 block">Tıkla ve Çalıştır</a>`,
);

const autoRegex =
  /<button class="flex-1 py-3 text-sm font-semibold text-gray-500">\s*Otomasyon\s*<\/button>/;
smart = smart.replace(
  autoRegex,
  `<a href="stitch-skills.html" class="flex-1 py-3 text-center text-sm font-semibold text-gray-500 block">Otomasyon</a>`,
);

fs.writeFileSync("stitch-smart.html", smart, "utf8");

console.log("All UI fixes applied.");
