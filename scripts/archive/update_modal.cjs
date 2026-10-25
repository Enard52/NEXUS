const fs = require("fs");

const modalHtml = `
<!-- Home Selector Modal -->
<div id="home-selector-backdrop" class="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 opacity-0 pointer-events-none" onclick="toggleHomeSelector()"></div>
<div id="home-selector-modal" class="fixed inset-x-0 top-0 z-[70] bg-white rounded-b-[2rem] shadow-2xl border-b border-slate-100 flex flex-col transform transition-transform duration-300 -translate-y-full">
  <div class="px-5 pt-12 pb-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
    <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ev Seçimi</h3>
    <button onclick="toggleHomeSelector()" class="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
  </div>
  <div class="p-4 flex flex-col gap-2">
    <!-- Active Home -->
    <button onclick="toggleHomeSelector()" class="flex items-center gap-3 p-4 rounded-2xl bg-[#7C5CFF]/10 text-[#7C5CFF] text-left w-full transition-transform active:scale-[0.98]">
      <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
      <span class="font-bold text-base flex-grow" data-bind="householdName">Benim Evim</span>
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
    </button>
  </div>
  <div class="p-4 pt-2 border-t border-slate-100 bg-slate-50 rounded-b-[2rem]">
    <a href="stitch-household.html" class="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white text-slate-700 font-bold text-sm transition-transform active:scale-[0.98] border border-slate-200 shadow-sm">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
      Ev Yönetimi
    </a>
  </div>
</div>

<script>
function toggleHomeSelector() {
  const modal = document.getElementById('home-selector-modal');
  const backdrop = document.getElementById('home-selector-backdrop');
  
  // If it's currently hidden (-translate-y-full)
  if (modal.classList.contains('-translate-y-full')) {
    // Show it
    modal.classList.remove('-translate-y-full');
    modal.classList.add('translate-y-0');
    
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100', 'pointer-events-auto');
  } else {
    // Hide it
    modal.classList.remove('translate-y-0');
    modal.classList.add('-translate-y-full');
    
    backdrop.classList.remove('opacity-100', 'pointer-events-auto');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
  }
}
</script>
`;

const files = ["stitch-home.html", "stitch-discover.html", "stitch-smart.html"];

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");

  // Replace old modal
  const regex = /<!-- Home Selector Modal -->[\s\S]*?<\/script>/;
  if (regex.test(content)) {
    content = content.replace(regex, modalHtml);
    fs.writeFileSync(file, content, "utf8");
  }
}

console.log("Modal updated.");
