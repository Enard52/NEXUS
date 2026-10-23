const fs = require('fs');

let smartHtml = fs.readFileSync('stitch-smart.html', 'utf8');

// 1. Replace onclick on the Hızlı ekle button
smartHtml = smartHtml.replace(
  /onclick="window\.location\.href='stitch-plus\.html'"/g,
  'onclick="toggleQuickAdd()"'
);

// 2. The Quick Add menu HTML to inject
const quickAddMenuHtml = `
<!-- BEGIN: QuickAddMenu (buzlu cam alt sayfa) -->
<div class="fixed inset-0 z-40 hidden bg-black/20" id="quick-add-backdrop" onclick="toggleQuickAdd()" style="backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);"></div>
<div class="qa-sheet fixed inset-x-0 bottom-0 z-50 rounded-t-[3rem] pt-6 pb-12 px-6 flex flex-col items-center translate-y-full transition-transform duration-300" data-purpose="quick-add-menu" id="quick-add-menu" style="background: linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(240,236,255,0.88) 100%); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 -10px 40px rgba(0,0,0,0.1);">
  <!-- Kapat butonu -->
  <div class="w-full flex justify-end mb-2">
    <button aria-label="Kapat" class="bg-slate-200/60 p-2 rounded-full text-slate-500 active:bg-slate-300 transition-colors" onclick="toggleQuickAdd()">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
      </svg>
    </button>
  </div>
  <!-- NEXUS N monogram (marka gradyanı) -->
  <div class="mb-4">
    <svg class="w-20 h-20" fill="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="n-grad-smart" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#7C5CFF"></stop>
          <stop offset="100%" stop-color="#22D3EE"></stop>
        </linearGradient>
        <filter id="n-glow-smart">
          <feGaussianBlur result="coloredBlur" stdDeviation="4"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="coloredBlur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
      </defs>
      <path d="M25 80 V20 L75 80 V20" fill="none" filter="url(#n-glow-smart)" stroke="url(#n-grad-smart)" stroke-linecap="round" stroke-linejoin="round" stroke-width="12"></path>
    </svg>
  </div>
  <h2 class="text-[26px] font-extrabold text-black mb-8 tracking-tight">Hızlı Aksiyonlar</h2>
  
  <!-- Aksiyon listesi -->
  <div class="w-full max-w-xl bg-white rounded-[2rem] p-4 space-y-1 shadow-sm">
    <a class="flex items-center space-x-4 p-3 rounded-2xl active:bg-slate-50 transition-colors" href="stitch-pair.html">
      <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
        <i class="w-6 h-6 text-slate-800 stroke-[1.5]" data-lucide="smartphone"></i>
      </div>
      <span class="text-xl font-semibold text-slate-800">Cihaz Ekle</span>
    </a>
    <a class="flex items-center space-x-4 p-3 rounded-2xl active:bg-slate-50 transition-colors" href="stitch-smart.html">
      <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
        <i class="w-6 h-6 text-slate-800 stroke-[1.5]" data-lucide="list-plus"></i>
      </div>
      <span class="text-xl font-semibold text-slate-800">Senaryo Oluştur</span>
    </a>
    <a class="flex items-center space-x-4 p-3 rounded-2xl active:bg-slate-50 transition-colors" href="stitch-scan.html">
      <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
        <i class="w-6 h-6 text-slate-800 stroke-[1.5]" data-lucide="scan-line"></i>
      </div>
      <span class="text-xl font-semibold text-slate-800">Tara</span>
    </a>
  </div>
</div>
<!-- END: QuickAddMenu -->
`;

// Inject after </header>
smartHtml = smartHtml.replace(/(<\/header>\s*<!-- END: App Header -->)/, `$1\n${quickAddMenuHtml}`);

// 3. Add toggleQuickAdd function to the bottom script if it doesn't exist
const toggleScript = `
    function toggleQuickAdd() {
      const menu = document.getElementById('quick-add-menu');
      const backdrop = document.getElementById('quick-add-backdrop');
      if (!menu || !backdrop) return;
      
      if (menu.classList.contains('translate-y-full')) {
        menu.classList.remove('translate-y-full');
        backdrop.classList.remove('hidden');
      } else {
        menu.classList.add('translate-y-full');
        backdrop.classList.add('hidden');
      }
    }
`;

if (!smartHtml.includes('function toggleQuickAdd')) {
  // Inject before </body>
  smartHtml = smartHtml.replace(/(<\/body>)/i, `<script>\n${toggleScript}\n</script>\n$1`);
}

fs.writeFileSync('stitch-smart.html', smartHtml, 'utf8');
console.log('Updated stitch-smart.html Quick Add Menu');
