const fs = require("fs");

const homeSelectorHtml = `<!-- Home Selector -->
<a href="stitch-household.html" class="flex items-center gap-2.5 bg-white/60 backdrop-blur-md border border-slate-200/60 pl-2 pr-4 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform" data-purpose="home-selector">
  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#6344E6] flex items-center justify-center text-white shadow-inner flex-shrink-0">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
  </div>
  <div class="flex flex-col justify-center">
    <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-0.5">Mevcut Ev</span>
    <span class="text-sm font-bold text-slate-800 leading-none" data-bind="householdName">Benim Evim</span>
  </div>
  <svg class="w-4 h-4 text-slate-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
</a>`;

// stitch-home.html
let home = fs.readFileSync("stitch-home.html", "utf8");
home = home.replace(/<!-- Profile Picture[\s\S]*?<\/a>/, homeSelectorHtml);
fs.writeFileSync("stitch-home.html", home, "utf8");

// stitch-discover.html
let discover = fs.readFileSync("stitch-discover.html", "utf8");
discover = discover.replace(
  /<a href="stitch-profile\.html" class="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">[\s\S]*?<\/a>/,
  homeSelectorHtml,
);
fs.writeFileSync("stitch-discover.html", discover, "utf8");

// stitch-smart.html
let smart = fs.readFileSync("stitch-smart.html", "utf8");
smart = smart.replace(
  /<!-- Profil -->[\s\S]*?<a href="stitch-profile\.html" class="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">[\s\S]*?<\/a>/,
  homeSelectorHtml,
);
fs.writeFileSync("stitch-smart.html", smart, "utf8");

console.log("Done");
