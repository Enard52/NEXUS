const fs = require('fs');

const localAssets = {
  bulb: 'assets/products/smart_bulb.jpg',
  tv: 'assets/products/smart_tv.jpg',
  speaker: 'assets/products/smart_speaker.jpg',
  vacuum: 'assets/products/robot_vacuum.jpg',
  plug: 'assets/products/smart_plug.jpg',
  camera: 'assets/products/security_camera.jpg',
  appliance: 'assets/products/air_purifier.jpg',
  thermostat: 'assets/products/thermostat.jpg',
  door_lock: 'assets/products/door_lock.jpg',
  fridge: 'assets/products/refrigerator.jpg',
  washing: 'assets/products/washing_machine.jpg',
  router: 'assets/products/router.jpg',
  soundbar: 'assets/products/soundbar.jpg'
};

const products = [
  // Philips Hue
  { brand: 'Philips Hue', icon: 'lightbulb', color: 'text-yellow-500 bg-yellow-50', cat: 'lighting', items: [
    { name: 'Color Ambiance', img: localAssets.bulb },
    { name: 'Hue Bridge', img: localAssets.router },
    { name: 'Lightstrip', img: localAssets.bulb },
    { name: 'Hue Go', img: localAssets.bulb },
    { name: 'Play Bar', img: localAssets.bulb },
    { name: 'Dimmer Switch', img: localAssets.thermostat }
  ]},
  // Xiaomi
  { brand: 'Xiaomi Mi', icon: 'smartphone', color: 'text-orange-500 bg-orange-50', cat: 'sensors security plugs climate', items: [
    { name: 'Robot Vacuum', img: localAssets.vacuum },
    { name: 'Smart Plug', img: localAssets.plug },
    { name: '360° Camera', img: localAssets.camera },
    { name: 'Air Purifier', img: localAssets.appliance },
    { name: 'Temp Sensor', img: localAssets.thermostat },
    { name: 'Mi Router', img: localAssets.router }
  ]},
  // LG ThinQ
  { brand: 'LG ThinQ', icon: 'monitor', color: 'text-rose-600 bg-rose-50', cat: 'entertainment climate', items: [
    { name: 'OLED TV', img: localAssets.tv },
    { name: 'WashTower', img: localAssets.washing },
    { name: 'InstaView', img: localAssets.fridge },
    { name: 'Dual Inverter', img: localAssets.appliance },
    { name: 'Soundbar', img: localAssets.soundbar }
  ]},
  // Apple Home
  { brand: 'Apple Home', icon: 'apple', color: 'text-slate-800 bg-slate-100', cat: 'entertainment security', items: [
    { name: 'HomePod mini', img: localAssets.speaker },
    { name: 'Apple TV 4K', img: localAssets.tv },
    { name: 'HomePod', img: localAssets.speaker },
    { name: 'Secure Lock', img: localAssets.door_lock }
  ]},
  // Samsung SmartThings
  { brand: 'SmartThings', icon: 'cpu', color: 'text-blue-600 bg-blue-50', cat: 'entertainment climate sensors', items: [
    { name: 'Hub v3', img: localAssets.router },
    { name: 'Neo QLED', img: localAssets.tv },
    { name: 'Bespoke Fridge', img: localAssets.fridge },
    { name: 'Wash Machine', img: localAssets.washing },
    { name: 'Multi Sensor', img: localAssets.thermostat }
  ]},
  // TP-Link Tapo
  { brand: 'TP-Link Tapo', icon: 'wifi', color: 'text-cyan-500 bg-cyan-50', cat: 'plugs security lighting', items: [
    { name: 'P100 Plug', img: localAssets.plug },
    { name: 'C200 Camera', img: localAssets.camera },
    { name: 'L530 Bulb', img: localAssets.bulb },
    { name: 'Light Strip', img: localAssets.bulb }
  ]},
  // Dyson
  { brand: 'Dyson', icon: 'wind', color: 'text-slate-700 bg-slate-100', cat: 'climate', items: [
    { name: 'Purifier Cool', img: localAssets.appliance },
    { name: 'V15 Detect', img: localAssets.vacuum },
    { name: 'Hot+Cool', img: localAssets.appliance }
  ]},
  // Sonos
  { brand: 'Sonos', icon: 'speaker', color: 'text-slate-900 bg-slate-100', cat: 'entertainment', items: [
    { name: 'Sonos Arc', img: localAssets.soundbar },
    { name: 'Sonos One', img: localAssets.speaker },
    { name: 'Sonos Beam', img: localAssets.soundbar },
    { name: 'Sonos Move', img: localAssets.speaker }
  ]},
  // Ring
  { brand: 'Ring', icon: 'bell', color: 'text-sky-500 bg-sky-50', cat: 'security', items: [
    { name: 'Video Doorbell', img: localAssets.camera },
    { name: 'Stick Up Cam', img: localAssets.camera },
    { name: 'Alarm System', img: localAssets.router }
  ]},
  // Nest
  { brand: 'Google Nest', icon: 'home', color: 'text-emerald-500 bg-emerald-50', cat: 'climate security', items: [
    { name: 'Learning Thermostat', img: localAssets.thermostat },
    { name: 'Nest Cam', img: localAssets.camera },
    { name: 'Nest Hub', img: localAssets.tv },
    { name: 'Protect', img: localAssets.thermostat }
  ]},
  // Yale
  { brand: 'Yale', icon: 'lock', color: 'text-yellow-600 bg-yellow-50', cat: 'security', items: [
    { name: 'Linus Smart Lock', img: localAssets.door_lock },
    { name: 'Assure Lock', img: localAssets.door_lock },
    { name: 'Smart Cabinet', img: localAssets.door_lock }
  ]},
  // Bosch
  { brand: 'Bosch', icon: 'box', color: 'text-red-600 bg-red-50', cat: 'climate', items: [
    { name: 'Smart Fridge', img: localAssets.fridge },
    { name: 'Smart Washer', img: localAssets.washing },
    { name: 'Home Connect AC', img: localAssets.appliance }
  ]},
  // iRobot
  { brand: 'iRobot', icon: 'disc', color: 'text-green-600 bg-green-50', cat: 'climate', items: [
    { name: 'Roomba j7+', img: localAssets.vacuum },
    { name: 'Braava jet', img: localAssets.vacuum }
  ]},
  // Belkin Wemo
  { brand: 'Wemo', icon: 'toggle-right', color: 'text-lime-600 bg-lime-50', cat: 'plugs', items: [
    { name: 'Smart Plug', img: localAssets.plug },
    { name: 'Light Switch', img: localAssets.thermostat },
    { name: 'Dimmer', img: localAssets.thermostat }
  ]}
];

let rightContent = '';
products.forEach(brand => {
  rightContent += `
      <div class="mb-10 catalog-section" data-category="${brand.cat}">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${brand.color}">
            <i class="w-5 h-5" data-lucide="${brand.icon}"></i>
          </div>
          <h3 class="font-extrabold text-lg text-slate-800 tracking-tight">${brand.brand}</h3>
        </div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-6">`;
  
  brand.items.forEach(item => {
    rightContent += `
          <div class="text-center active:scale-95 transition-transform cursor-pointer flex flex-col items-center group" onclick="simulateConnection(this, '${item.name}')">
            <div class="w-full aspect-square rounded-3xl overflow-hidden mb-3 shadow-sm bg-slate-50 border border-slate-100/50 relative">
              <img src="${item.img}" alt="${item.name}" class="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-700" loading="lazy" />
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
            </div>
            <p class="text-xs font-bold text-slate-800 leading-tight truncate w-full px-1">${item.name}</p>
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
    
    .cat-btn {
      position: relative;
    }
    
    /* Modern Category Button States */
    .cat-active .cat-icon-bg {
      background-color: #7C5CFF;
      color: white;
      box-shadow: 0 4px 14px 0 rgba(124, 92, 255, 0.39);
      transform: scale(1.05);
    }
    .cat-active .cat-text {
      color: #7C5CFF;
      font-weight: 800;
    }
    
    .cat-inactive .cat-icon-bg {
      background-color: #f1f5f9; /* slate-100 */
      color: #64748b; /* slate-500 */
    }
    .cat-inactive .cat-text {
      color: #64748b;
      font-weight: 600;
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
      <h1 class="text-xl font-extrabold tracking-tight text-slate-800">Cihaz Ekle</h1>
    </div>
  </header>

  <!-- Search Bar -->
  <div class="px-4 py-3 bg-white border-b border-slate-100 z-40 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] relative">
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <i class="w-5 h-5 text-slate-400" data-lucide="search"></i>
      </div>
      <input type="text" class="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#7C5CFF] transition-shadow" placeholder="Marka veya cihaz ara..." />
    </div>
  </div>

  <!-- Split Content Area -->
  <main class="flex-grow flex overflow-hidden">
    
    <!-- Left Sidebar (Categories with elegant icons) -->
    <aside class="w-[28%] bg-[#f8fafc] border-r border-slate-100 overflow-y-auto flex flex-col pb-10 shadow-[inset_-2px_0_10px_rgba(0,0,0,0.02)]" id="sidebar-categories">
      
      <button onclick="filterCategory('all', this)" class="cat-btn cat-active flex flex-col items-center justify-center py-5 border-b border-slate-100/50 transition-all">
        <div class="cat-icon-bg w-12 h-12 rounded-[1rem] flex items-center justify-center mb-2 transition-all duration-300">
          <i class="w-5 h-5" data-lucide="layout-grid"></i>
        </div>
        <span class="cat-text text-[10px] uppercase tracking-wider text-center transition-colors duration-300">Tümü</span>
      </button>

      <button onclick="filterCategory('lighting', this)" class="cat-btn cat-inactive flex flex-col items-center justify-center py-5 border-b border-slate-100/50 transition-all">
        <div class="cat-icon-bg w-12 h-12 rounded-[1rem] flex items-center justify-center mb-2 transition-all duration-300">
          <i class="w-5 h-5" data-lucide="lightbulb"></i>
        </div>
        <span class="cat-text text-[10px] uppercase tracking-wider text-center transition-colors duration-300">Aydınlatma</span>
      </button>

      <button onclick="filterCategory('plugs', this)" class="cat-btn cat-inactive flex flex-col items-center justify-center py-5 border-b border-slate-100/50 transition-all">
        <div class="cat-icon-bg w-12 h-12 rounded-[1rem] flex items-center justify-center mb-2 transition-all duration-300">
          <i class="w-5 h-5" data-lucide="plug-zap"></i>
        </div>
        <span class="cat-text text-[10px] uppercase tracking-wider text-center transition-colors duration-300">Prizler</span>
      </button>

      <button onclick="filterCategory('security', this)" class="cat-btn cat-inactive flex flex-col items-center justify-center py-5 border-b border-slate-100/50 transition-all">
        <div class="cat-icon-bg w-12 h-12 rounded-[1rem] flex items-center justify-center mb-2 transition-all duration-300">
          <i class="w-5 h-5" data-lucide="shield-check"></i>
        </div>
        <span class="cat-text text-[10px] uppercase tracking-wider text-center transition-colors duration-300">Güvenlik</span>
      </button>

      <button onclick="filterCategory('climate', this)" class="cat-btn cat-inactive flex flex-col items-center justify-center py-5 border-b border-slate-100/50 transition-all">
        <div class="cat-icon-bg w-12 h-12 rounded-[1rem] flex items-center justify-center mb-2 transition-all duration-300">
          <i class="w-5 h-5" data-lucide="thermometer"></i>
        </div>
        <span class="cat-text text-[10px] uppercase tracking-wider text-center transition-colors duration-300">İklim</span>
      </button>

      <button onclick="filterCategory('sensors', this)" class="cat-btn cat-inactive flex flex-col items-center justify-center py-5 border-b border-slate-100/50 transition-all">
        <div class="cat-icon-bg w-12 h-12 rounded-[1rem] flex items-center justify-center mb-2 transition-all duration-300">
          <i class="w-5 h-5" data-lucide="activity"></i>
        </div>
        <span class="cat-text text-[10px] uppercase tracking-wider text-center transition-colors duration-300">Sensörler</span>
      </button>

      <button onclick="filterCategory('entertainment', this)" class="cat-btn cat-inactive flex flex-col items-center justify-center py-5 border-b border-slate-100/50 transition-all">
        <div class="cat-icon-bg w-12 h-12 rounded-[1rem] flex items-center justify-center mb-2 transition-all duration-300">
          <i class="w-5 h-5" data-lucide="tv"></i>
        </div>
        <span class="cat-text text-[10px] uppercase tracking-wider text-center transition-colors duration-300">Eğlence</span>
      </button>
      
    </aside>

    <!-- Right Content (Catalogs & Products) -->
    <div class="w-[72%] overflow-y-auto px-5 pt-6 pb-12 bg-white" id="main-content">
      
      <!-- Action Card for Manual Setup Code -->
      <article class="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[1.5rem] p-5 flex items-center justify-between gap-3 active:scale-[0.98] transition-transform mb-10 shadow-lg" onclick="openCodeModal()">
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-white border border-white/10">
            <i class="w-6 h-6" data-lucide="scan-line"></i>
          </div>
          <div class="min-w-0">
            <h2 class="font-extrabold text-sm text-white leading-tight">Kurulum Kodu</h2>
            <p class="text-[11px] text-slate-300 mt-1 truncate font-medium">Matter / HomeKit Bağla</p>
          </div>
        </div>
        <i class="w-5 h-5 text-white/50" data-lucide="chevron-right"></i>
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
        <p class="text-sm text-slate-500 mt-2">Cihazınızın üzerindeki 8 haneli kodu girin.</p>
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
console.log('Updated stitch-integrations.html with massive catalog, elegant icons, and rich UI.');
