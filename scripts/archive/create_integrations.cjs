const fs = require('fs');

const servicesContent = fs.readFileSync('stitch-services.html', 'utf8');

const integrationsHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="theme-color" content="#ffffff">
  <title>NEXUS - Manuel Cihaz ve Entegrasyonlar</title>
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
    .bg-gradient-custom { background: linear-gradient(to bottom, #ECE9FD 0%, #F5F3FF 40%, #ffffff 100%); }
    .menu-container-shadow { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); }
    /* Loading overlay */
    #loading-overlay { display: none; }
  </style>
  <script src="theme.js"></script>
</head>
<body class="bg-gradient-custom text-slate-900 min-h-screen flex flex-col">

  <!-- Header -->
  <header class="pt-14 pb-4 px-5 flex items-center justify-between sticky top-0 z-50 bg-gradient-custom" data-purpose="page-header">
    <div class="flex items-center gap-3">
      <a aria-label="Geri" class="p-1 -ml-1" href="javascript:void(0)" onclick="window.history.length > 1 ? history.back() : window.location.href='stitch-home.html'">
        <i class="w-7 h-7 text-slate-700" data-lucide="chevron-left"></i>
      </a>
      <h1 class="text-xl font-bold tracking-tight text-slate-800">Cihaz Ekle</h1>
    </div>
  </header>

  <main class="flex-grow px-5 pb-10 flex flex-col">
    <div class="mb-6">
      <p class="text-sm text-slate-500 font-medium">QR kod bulunamadıysa cihazınızı markasına göre listeden seçerek ağınıza dahil edebilirsiniz.</p>
    </div>

    <!-- Search Bar -->
    <div class="relative mb-6">
      <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <i class="w-5 h-5 text-slate-400" data-lucide="search"></i>
      </div>
      <input type="text" class="w-full bg-white border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#7C5CFF] focus:border-transparent soft-shadow transition-shadow" placeholder="Marka veya model arayın..." />
    </div>

    <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Popüler Markalar</h2>

    <div class="space-y-3">
      
      <!-- Philips Hue -->
      <article class="bg-white rounded-2xl menu-container-shadow p-4 flex items-center justify-between gap-3 border border-slate-50 active:bg-slate-50 transition-colors" onclick="simulateConnection(this)">
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" class="w-7 h-7 text-blue-600" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          </div>
          <div class="min-w-0">
            <h2 class="font-bold leading-tight text-slate-800">Philips Hue</h2>
            <p class="text-xs text-slate-400 mt-0.5 truncate">Aydınlatma, Led, Lamba</p>
          </div>
        </div>
        <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400">
          <i class="w-4 h-4" data-lucide="plus"></i>
        </div>
      </article>

      <!-- Xiaomi -->
      <article class="bg-white rounded-2xl menu-container-shadow p-4 flex items-center justify-between gap-3 border border-slate-50 active:bg-slate-50 transition-colors" onclick="simulateConnection(this)">
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" class="w-7 h-7 text-orange-500" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
          </div>
          <div class="min-w-0">
            <h2 class="font-bold leading-tight text-slate-800">Xiaomi Mi Home</h2>
            <p class="text-xs text-slate-400 mt-0.5 truncate">Robot Süpürge, Sensörler</p>
          </div>
        </div>
        <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400">
          <i class="w-4 h-4" data-lucide="plus"></i>
        </div>
      </article>

      <!-- LG ThinQ -->
      <article class="bg-white rounded-2xl menu-container-shadow p-4 flex items-center justify-between gap-3 border border-slate-50 active:bg-slate-50 transition-colors" onclick="simulateConnection(this)">
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" class="w-7 h-7 text-rose-600" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Z"/></svg>
          </div>
          <div class="min-w-0">
            <h2 class="font-bold leading-tight text-slate-800">LG ThinQ</h2>
            <p class="text-xs text-slate-400 mt-0.5 truncate">TV, Beyaz Eşya, Klima</p>
          </div>
        </div>
        <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400">
          <i class="w-4 h-4" data-lucide="plus"></i>
        </div>
      </article>

      <!-- Samsung SmartThings -->
      <article class="bg-white rounded-2xl menu-container-shadow p-4 flex items-center justify-between gap-3 border border-slate-50 active:bg-slate-50 transition-colors" onclick="simulateConnection(this)">
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" class="w-7 h-7 text-blue-500" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
          </div>
          <div class="min-w-0">
            <h2 class="font-bold leading-tight text-slate-800">SmartThings</h2>
            <p class="text-xs text-slate-400 mt-0.5 truncate">Tüm Samsung Ekosistemi</p>
          </div>
        </div>
        <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400">
          <i class="w-4 h-4" data-lucide="plus"></i>
        </div>
      </article>
      
      <!-- Apple HomeKit -->
      <article class="bg-white rounded-2xl menu-container-shadow p-4 flex items-center justify-between gap-3 border border-slate-50 active:bg-slate-50 transition-colors" onclick="simulateConnection(this)">
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" class="w-7 h-7 text-slate-800" fill="currentColor"><path d="M12 2L2 12h3v8h14v-8h3L12 2zm0 2.8l5 5V18H7v-8.2l5-5z"/></svg>
          </div>
          <div class="min-w-0">
            <h2 class="font-bold leading-tight text-slate-800">Apple HomeKit</h2>
            <p class="text-xs text-slate-400 mt-0.5 truncate">Köprü Cihazları ve Aksesuarlar</p>
          </div>
        </div>
        <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400">
          <i class="w-4 h-4" data-lucide="plus"></i>
        </div>
      </article>

    </div>

    <!-- Custom Code section -->
    <div class="mt-8 pt-6 border-t border-slate-200">
      <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Diğer Seçenekler</h2>
      <article class="bg-white rounded-2xl menu-container-shadow p-4 flex items-center justify-between gap-3 border border-slate-50 active:bg-slate-50 transition-colors">
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">
            <i class="w-6 h-6" data-lucide="hash"></i>
          </div>
          <div class="min-w-0">
            <h2 class="font-bold leading-tight text-slate-800">Kurulum Kodu Gir</h2>
            <p class="text-xs text-slate-400 mt-0.5 truncate">Cihaz altındaki 8 haneli kod</p>
          </div>
        </div>
      </article>
    </div>

  </main>

  <!-- Loading Overlay -->
  <div id="loading-overlay" class="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
    <div class="w-16 h-16 rounded-full border-4 border-slate-100 border-t-[#7C5CFF] animate-spin mb-4"></div>
    <p class="text-slate-800 font-bold text-lg">Cihaz Aranıyor...</p>
    <p class="text-slate-500 text-sm mt-1">Lütfen cihazın eşleştirme modunda olduğundan emin olun.</p>
  </div>

  <script>
    lucide.createIcons();

    function simulateConnection(el) {
      const overlay = document.getElementById('loading-overlay');
      overlay.style.display = 'flex';
      
      // Fake a 3 second search process, then redirect to home
      setTimeout(() => {
        // Cihaz bulunamadı senaryosu vs eklenebilir, şimdilik ana sayfaya dönelim.
        window.location.href = 'stitch-home.html';
      }, 3000);
    }
  </script>
</body>
</html>
`;
fs.writeFileSync('stitch-integrations.html', integrationsHtml, 'utf8');
console.log('Created stitch-integrations.html');
