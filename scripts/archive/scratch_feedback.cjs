const fs = require("fs");

const file = "c:/Users/ensar/Desktop/NEXUS-main/stitch-feedback.html";
let content = fs.readFileSync(file, "utf8");

// Find the start of the section
const startStr =
  '<section class="bg-white rounded-3xl menu-container-shadow p-5 mb-8" data-purpose="support-assistant">';
const startIdx = content.indexOf(startStr);
if (startIdx === -1) {
  console.log("Start string not found");
  process.exit(1);
}

// Find the end of the section (the first </section> after startIdx)
const endStr = "</section>";
const endIdx = content.indexOf(endStr, startIdx);
if (endIdx === -1) {
  console.log("End string not found");
  process.exit(1);
}

const replacement = `<a href="stitch-chat.html" class="block bg-white rounded-3xl menu-container-shadow p-5 mb-8 active:scale-[0.98] transition-transform" data-purpose="support-assistant-link">
<div class="flex items-center justify-between">
<div class="flex items-center gap-3">
<div class="w-11 h-11 flex-shrink-0"><svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="NEXUS logo" role="img" class="w-full h-full"><defs><linearGradient id="nxlogo" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse"><stop stop-color="#6f9bff"/><stop offset="0.55" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b7bff"/></linearGradient><linearGradient id="nxsheen" x1="16" y1="1" x2="16" y2="17" gradientUnits="userSpaceOnUse"><stop stop-color="#ffffff" stop-opacity="0.30"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs><rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxlogo)"/><rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxsheen)"/><rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="#ffffff" stroke-opacity="0.22"/><path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
<div>
<h3 class="font-bold leading-tight text-slate-800">NEXUS AI Destek Asistanı</h3>
<p class="text-xs text-emerald-500 font-semibold flex items-center gap-1 mt-0.5"><span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Çevrimiçi</p>
</div>
</div>
<div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
<i class="w-5 h-5 text-slate-400" data-lucide="chevron-right"></i>
</div>
</div>
<p class="text-sm text-slate-500 mt-4 font-medium leading-relaxed">Sorularını doğrudan NEXUS AI asistanına sorabilir, cihazların hakkında anında yardım alabilirsin.</p>
</a>`;

const newContent =
  content.substring(0, startIdx) + replacement + content.substring(endIdx + endStr.length);
fs.writeFileSync(file, newContent, "utf8");
console.log("Successfully replaced the support assistant section.");
