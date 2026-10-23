const fs = require('fs');

const products = [
  // Philips Hue
  { brand: 'Philips Hue', cat: 'lighting', items: [
    { name: 'Color Ambiance E27', img: '1550989460-0adf9ea622e2' },
    { name: 'Hue Bridge', img: '1558002038-1055907df827' },
    { name: 'Lightstrip Plus', img: '1626301614741-698f12d5d85f' },
    { name: 'Hue Play Bar', img: '1513694203237-09fc22dd1817' },
    { name: 'Hue Go', img: '1527814050087-379369506644' },
    { name: 'Dimmer Switch', img: '1584345636043-41c618645ea9' }
  ]},
  // Xiaomi
  { brand: 'Xiaomi Mi', cat: 'sensors security plugs climate', items: [
    { name: 'Robot Vacuum', img: '1589824781478-f86a60db6202' },
    { name: 'Mi Smart Plug', img: '1603351154351-5e2d0600bb77' },
    { name: '360° Camera', img: '1557322984-7a62e402f741' },
    { name: 'Temp Sensor', img: '1593359677879-a4bb92f829d1' },
    { name: 'Air Purifier', img: '1584622650111-993a426fbf0a' },
    { name: 'Yeelight Bulb', img: '1550989460-0adf9ea622e2' },
    { name: 'Door Sensor', img: '1558002038-1055907df827' },
    { name: 'Smart Fan', img: '1632757279375-92759f21f1c7' }
  ]},
  // LG ThinQ
  { brand: 'LG ThinQ', cat: 'entertainment climate', items: [
    { name: 'OLED Smart TV', img: '1593784991095-a205069470b6' },
    { name: 'Dual Inverter AC', img: '1632757279375-92759f21f1c7' },
    { name: 'WashTower', img: '1613038411933-2ba8472f85fa' },
    { name: 'InstaView Fridge', img: '1584622650111-993a426fbf0a' },
    { name: 'LG Soundbar', img: '1543512214-318c7553f230' }
  ]},
  // Apple Home
  { brand: 'Apple Home', cat: 'entertainment', items: [
    { name: 'HomePod mini', img: '1585659722983-38ca40d421dc' },
    { name: 'Apple TV 4K', img: '1593359677879-a4bb92f829d1' },
    { name: 'HomePod (2. Nesil)', img: '1543512214-318c7553f230' }
  ]},
  // Samsung SmartThings
  { brand: 'SmartThings', cat: 'entertainment climate sensors', items: [
    { name: 'SmartThings Hub', img: '1558002038-1055907df827' },
    { name: 'Neo QLED TV', img: '1593784991095-a205069470b6' },
    { name: 'Bespoke Fridge', img: '1584622650111-993a426fbf0a' },
    { name: 'Multipurpose Sensor', img: '1584345636043-41c618645ea9' }
  ]},
  // TP-Link Tapo
  { brand: 'TP-Link Tapo', cat: 'plugs security lighting', items: [
    { name: 'P100 Smart Plug', img: '1603351154351-5e2d0600bb77' },
    { name: 'C200 Camera', img: '1557322984-7a62e402f741' },
    { name: 'L530 Bulb', img: '1550989460-0adf9ea622e2' },
    { name: 'Light Strip', img: '1626301614741-698f12d5d85f' }
  ]},
  // Dyson
  { brand: 'Dyson', cat: 'climate', items: [
    { name: 'Purifier Cool', img: '1584622650111-993a426fbf0a' },
    { name: 'V15 Detect', img: '1589824781478-f86a60db6202' },
    { name: 'Humidify+Cool', img: '1603351154351-5e2d0600bb77' }
  ]}
];

let rightContent = '';
products.forEach(brand => {
  rightContent += `
      <div class="mb-8 catalog-section" data-category="${brand.cat}">
        <div class="flex items-center gap-2 mb-3">
          <h3 class="font-bold text-sm text-slate-800 uppercase tracking-wide">${brand.brand}</h3>
          <div class="flex-grow h-px bg-slate-100"></div>
        </div>
        <div class="grid grid-cols-2 gap-3">`;
  
  brand.items.forEach(item => {
    // Generate an image URL from the Unsplash ID
    const imgUrl = `https://images.unsplash.com/photo-${item.img}?auto=format&fit=crop&w=128&q=80`;
    
    rightContent += `
          <div class="border border-slate-100 rounded-2xl p-2 text-center active:scale-[0.97] transition-transform overflow-hidden relative cursor-pointer" onclick="simulateConnection(this, '${item.name}')">
            <div class="w-full aspect-square bg-slate-50 rounded-xl mb-2 overflow-hidden">
              <img src="${imgUrl}" alt="${item.name}" class="w-full h-full object-cover mix-blend-multiply" loading="lazy" />
            </div>
            <p class="text-[11px] font-bold text-slate-800 leading-tight mb-1 truncate px-1">${item.name}</p>
          </div>`;
  });

  rightContent += `
        </div>
      </div>`;
});


const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="theme-color" content="#ffffff">
  <title>NEXUS - Cihaz Ekle</title>
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
    ::-webkit-scrollbar { width: 0px; background: transparent; }
    #loading-overlay { display: none; }
    
    /* Plain text category buttons */
    .cat-active {
      background-color: #ffffff;
      border-left: 4px solid #7C5CFF;
      color: #7C5CFF;
      font-weight: 800;
    }
    .cat-inactive {
      background-color: transparent;
      border-left: 4px solid transparent;
      color: #64748b;
      font-weight: 500;
    }
  </style>
  <script src="theme.js"></script>
</head>
<body class="bg-white text-slate-900 h-screen flex flex-col overflow-hidden">

  <!-- Header -->
  <header class="pt-14 pb-3 px-4 flex items-center justify-between bg-white z-50 shadow-sm relative">
    <div class="flex items-center gap-3">
      <a aria-label="Geri" class="p-1 -ml-1 text-slate-700 active:bg-slate-100 rounded-full transition-colors" href="javascript:void(0)" onclick="window.history.length > 1 ? history.back() : window.location.href='stitch-home.html'">
        <i class="w-7 h-7" data-lucide="chevron-left"></i>
      </a>
      <h1 class="text-xl font-bold tracking-tight text-slate-800">Cihaz Ekle</h1>
    </div>
  </header>

  <!-- Search Bar -->
  <div class="px-4 py-3 bg-white border-b border-slate-100 z-40">
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <i class="w-5 h-5 text-slate-400" data-lucide="search"></i>
      </div>
      <input type="text" class="w-full bg-slate-50 border-none rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#7C5CFF]" placeholder="Marka veya cihaz arayın..." />
    </div>
  </div>

  <!-- Split Content Area -->
  <main class="flex-grow flex overflow-hidden">
    
    <!-- Left Sidebar (Categories, text only) -->
    <aside class="w-[28%] bg-slate-50 border-r border-slate-100 overflow-y-auto flex flex-col pb-10" id="sidebar-categories">
      
      <button onclick="filterCategory('all', this)" class="cat-btn cat-active p-4 border-b border-slate-100 text-left text-xs uppercase tracking-wide transition-colors">
        Tümü
      </button>

      <button onclick="filterCategory('lighting', this)" class="cat-btn cat-inactive p-4 border-b border-slate-100 text-left text-xs uppercase tracking-wide transition-colors">
        Aydınlatma
      </button>

      <button onclick="filterCategory('plugs', this)" class="cat-btn cat-inactive p-4 border-b border-slate-100 text-left text-xs uppercase tracking-wide transition-colors">
        Prizler
      </button>

      <button onclick="filterCategory('security', this)" class="cat-btn cat-inactive p-4 border-b border-slate-100 text-left text-xs uppercase tracking-wide transition-colors">
        Güvenlik
      </button>

      <button onclick="filterCategory('climate', this)" class="cat-btn cat-inactive p-4 border-b border-slate-100 text-left text-xs uppercase tracking-wide transition-colors">
        İklimlendirme
      </button>

      <button onclick="filterCategory('sensors', this)" class="cat-btn cat-inactive p-4 border-b border-slate-100 text-left text-xs uppercase tracking-wide transition-colors">
        Sensörler
      </button>

      <button onclick="filterCategory('entertainment', this)" class="cat-btn cat-inactive p-4 border-b border-slate-100 text-left text-xs uppercase tracking-wide transition-colors">
        Eğlence & TV
      </button>
      
    </aside>

    <!-- Right Content (Catalogs & Products) -->
    <div class="w-[72%] overflow-y-auto px-4 pt-4 pb-12 bg-white" id="main-content">
      
      <!-- Action Card for Manual Setup Code -->
      <article class="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-3 active:scale-[0.98] transition-transform mb-6" onclick="openCodeModal()">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center flex-shrink-0 text-[#7C5CFF]">
            <i class="w-5 h-5" data-lucide="hash"></i>
          </div>
          <div class="min-w-0">
            <h2 class="font-bold text-sm text-slate-800 leading-tight">Kurulum Kodu</h2>
            <p class="text-[10px] text-slate-500 mt-0.5 truncate">Matter/HomeKit cihaz ekle</p>
          </div>
        </div>
        <i class="w-4 h-4 text-slate-300" data-lucide="chevron-right"></i>
      </article>

      ${rightContent}

    </div>
  </main>

  <!-- Code Entry Modal -->
  <div id="code-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] hidden flex flex-col items-center justify-center px-6">
    <div class="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl relative overflow-hidden transform scale-95 transition-transform" id="code-modal-content">
      <div class="text-center mb-6 mt-2">
        <div class="w-16 h-16 bg-slate-50 text-[#7C5CFF] rounded-full mx-auto flex items-center justify-center mb-4">
          <i class="w-8 h-8" data-lucide="hash"></i>
        </div>
        <h2 class="text-2xl font-bold text-slate-800">Kurulum Kodu</h2>
        <p class="text-sm text-slate-500 mt-2">Cihazınızın üzerindeki 8 haneli Matter/HomeKit kodunu girin.</p>
      </div>
      <div class="mb-6">
        <input type="text" id="setup-code-input" class="w-full text-center text-3xl tracking-[0.2em] font-bold text-slate-800 border-none bg-slate-50 rounded-2xl py-4 focus:ring-2 focus:ring-[#7C5CFF]" placeholder="00000000" maxlength="8" autocomplete="off" />
      </div>
      <div class="flex gap-3">
        <button class="flex-1 py-3.5 rounded-2xl font-bold text-slate-600 bg-slate-100 active:bg-slate-200 transition-colors" onclick="closeCodeModal()">İptal</button>
        <button class="flex-1 py-3.5 rounded-2xl font-bold text-white bg-[#7C5CFF] active:bg-[#6b4ae8] transition-colors shadow-md shadow-[#7C5CFF]/30" onclick="submitCode()">Bağlan</button>
      </div>
    </div>
  </div>

  <!-- Loading Overlay -->
  <div id="loading-overlay" class="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex-col items-center justify-center">
    <div id="loading-spinner" class="flex flex-col items-center">
      <div class="w-16 h-16 rounded-full border-4 border-slate-100 border-t-[#7C5CFF] animate-spin mb-4"></div>
      <p class="text-slate-800 font-bold text-lg">Cihaz Aranıyor...</p>
      <p class="text-slate-500 text-sm mt-1 text-center px-6">Lütfen cihazın eşleştirme modunda olduğundan emin olun.</p>
    </div>
    <div id="loading-notfound" class="hidden flex-col items-center px-8 w-full max-w-sm">
      <div class="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-3">
        <i class="w-7 h-7" data-lucide="alert-triangle"></i>
      </div>
      <p class="text-slate-800 font-bold text-lg">Cihaz Bulunamadı</p>
      <p class="text-slate-500 text-sm mt-1 mb-5 text-center">Çevrede eşleştirilmeye hazır cihaz bulunamadı.</p>
      <button class="w-full bg-[#7C5CFF] text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition-transform" onclick="hideOverlay(); openCodeModal();">Kurulum koduyla ekle</button>
      <button class="w-full text-slate-500 font-medium py-3 mt-1" onclick="hideOverlay()">Vazgeç</button>
    </div>
  </div>

  <script>
    lucide.createIcons();

    function filterCategory(catName, btnElement) {
      const allBtns = document.querySelectorAll('.cat-btn');
      allBtns.forEach(btn => {
        btn.classList.remove('cat-active');
        btn.classList.add('cat-inactive');
      });
      btnElement.classList.remove('cat-inactive');
      btnElement.classList.add('cat-active');

      const sections = document.querySelectorAll('.catalog-section');
      sections.forEach(sec => {
        const cats = sec.getAttribute('data-category');
        if (catName === 'all' || cats.includes(catName)) {
          sec.style.display = 'block';
        } else {
          sec.style.display = 'none';
        }
      });
      
      document.getElementById('main-content').scrollTop = 0;
    }
    
    function openCodeModal() {
      const modal = document.getElementById('code-modal');
      const content = document.getElementById('code-modal-content');
      modal.classList.remove('hidden');
      setTimeout(() => {
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
        document.getElementById('setup-code-input').focus();
      }, 10);
    }
    
    function closeCodeModal() {
      const modal = document.getElementById('code-modal');
      const content = document.getElementById('code-modal-content');
      content.classList.remove('scale-100');
      content.classList.add('scale-95');
      setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('setup-code-input').value = '';
      }, 200);
    }

    function submitCode() {
      const input = document.getElementById('setup-code-input').value;
      if (input.length < 4) {
        alert('Lütfen geçerli bir kod girin.');
        return;
      }
      closeCodeModal();
      setTimeout(() => {
        simulateConnection(null, input);
      }, 300);
    }

    function simulateConnection(el, deviceName) {
      const overlay = document.getElementById('loading-overlay');
      overlay.style.display = 'flex';
      document.getElementById('loading-spinner').classList.remove('hidden');
      document.getElementById('loading-notfound').classList.add('hidden');
      document.getElementById('loading-notfound').classList.remove('flex');

      clearTimeout(simulateConnection._t);
      simulateConnection._t = setTimeout(() => {
        document.getElementById('loading-spinner').classList.add('hidden');
        const nf = document.getElementById('loading-notfound');
        nf.classList.remove('hidden');
        nf.classList.add('flex');
      }, 2500);
    }

    function hideOverlay() {
      clearTimeout(simulateConnection._t);
      document.getElementById('loading-overlay').style.display = 'none';
    }
  </script>
</body>
</html>`;

fs.writeFileSync('stitch-integrations.html', html, 'utf8');
console.log('Updated stitch-integrations.html with massive device list and real images');
