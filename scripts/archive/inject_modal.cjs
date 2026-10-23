const fs = require('fs');

const modalHtml = `
<!-- Home Selector Modal -->
<div id="home-selector-backdrop" class="fixed inset-0 z-[60] hidden bg-slate-900/20 backdrop-blur-sm transition-opacity" onclick="toggleHomeSelector()"></div>
<div id="home-selector-modal" class="fixed top-24 left-5 z-[70] hidden w-64 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden transform transition-all origin-top-left flex flex-col">
  <div class="p-4 border-b border-slate-50 bg-slate-50/50">
    <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ev Filtresi</h3>
  </div>
  <div class="p-2 flex flex-col gap-1">
    <!-- Active Home -->
    <button onclick="toggleHomeSelector()" class="flex items-center gap-3 p-3 rounded-2xl bg-[#7C5CFF]/10 text-[#7C5CFF] text-left w-full transition-colors active:scale-95">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
      <span class="font-bold text-sm flex-grow" data-bind="householdName">Benim Evim</span>
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
    </button>
    <!-- Other Home (Demo) -->
    <button onclick="toggleHomeSelector()" class="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-slate-600 text-left w-full transition-colors active:scale-95">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
      <span class="font-bold text-sm flex-grow">Ofis</span>
    </button>
  </div>
  <div class="p-2 border-t border-slate-100">
    <a href="stitch-household.html" class="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors border border-slate-200 active:scale-95">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
      Ev Yönetimi
    </a>
  </div>
</div>

<script>
function toggleHomeSelector() {
  const modal = document.getElementById('home-selector-modal');
  const backdrop = document.getElementById('home-selector-backdrop');
  if (modal.classList.contains('hidden')) {
    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
    backdrop.classList.add('hidden');
  }
}
</script>
`;

const files = ['stitch-home.html', 'stitch-discover.html', 'stitch-smart.html'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Change the <a href="stitch-household.html" ...> to <button onclick="toggleHomeSelector()" ...>
  content = content.replace('<a href="stitch-household.html" class="flex items-center gap-2.5 bg-white/60 backdrop-blur-md border border-slate-200/60 pl-2 pr-4 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform" data-purpose="home-selector">', '<button onclick="toggleHomeSelector()" class="flex items-center gap-2.5 bg-white/60 backdrop-blur-md border border-slate-200/60 pl-2 pr-4 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform" data-purpose="home-selector">');
  
  // Close the button correctly (need to replace the exact closing tag of this specific block)
  // Since we know the SVG inside it, we can replace the closing </a> after the SVG.
  // We can do this with a precise replace:
  content = content.replace('<svg class="w-4 h-4 text-slate-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>\n</a>', '<svg class="w-4 h-4 text-slate-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>\n</button>');
  
  // 2. Inject modalHtml right before </body>
  if (!content.includes('home-selector-modal')) {
    content = content.replace('</body>', modalHtml + '\n</body>');
  }
  
  fs.writeFileSync(file, content, 'utf8');
}

console.log("Modals injected.");
