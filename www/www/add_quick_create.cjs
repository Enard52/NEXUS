const fs = require('fs');

let skillsHtml = fs.readFileSync('stitch-skills.html', 'utf8');

// 1. Replace sparkles with zap in Duruma Göre Başlat card
// This is exactly the one inside bg-emerald-500/10
skillsHtml = skillsHtml.replace(
  /<div class="w-14 h-14 rounded-2xl bg-emerald-500\/10 text-emerald-600 flex items-center justify-center flex-shrink-0">\s*<i class="w-7 h-7" data-lucide="sparkles"><\/i>\s*<\/div>/,
  `<div class="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
        <i class="w-7 h-7" data-lucide="zap"></i>
      </div>`
);

// 2. Append Quick Create Button at the bottom of <main>
const quickCreateBtn = `
    <!-- Quick Create Button -->
    <button onclick="toggleQuickCreate()" class="mt-8 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C5CFF] to-[#22D3EE] text-white py-4 rounded-2xl font-bold active:opacity-90 transition-opacity shadow-lg shadow-[#7C5CFF]/30">
      <i class="w-5 h-5" data-lucide="zap"></i>
      Hızlı Oluştur
    </button>
  </main>
`;
skillsHtml = skillsHtml.replace(/<\/main>/i, quickCreateBtn);

// 3. Append Bottom Sheet and Logic before </body>
const bottomSheetCode = `
  <!-- BEGIN: Quick Create Bottom Sheet -->
  <div id="quick-create-backdrop" onclick="toggleQuickCreate()" class="fixed inset-0 bg-black/40 z-40 hidden transition-opacity opacity-0 duration-300"></div>
  <div id="quick-create-sheet" class="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[2.5rem] p-6 pb-12 translate-y-full transition-transform duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col max-h-[80vh]">
    <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
    <h3 class="text-2xl font-bold text-slate-800 mb-2">Hızlı Öneriler</h3>
    <p class="text-sm text-slate-500 mb-6">Mevcut cihazlarınıza göre size özel senaryo önerileri.</p>
    
    <div id="quick-create-list" class="space-y-3 overflow-y-auto">
      <!-- Generated suggestions go here -->
    </div>
  </div>

  <script>
    function toggleQuickCreate() {
      const sheet = document.getElementById('quick-create-sheet');
      const backdrop = document.getElementById('quick-create-backdrop');
      
      if (sheet.classList.contains('translate-y-full')) {
        // Open
        backdrop.classList.remove('hidden');
        setTimeout(function() { backdrop.classList.remove('opacity-0'); }, 10);
        sheet.classList.remove('translate-y-full');
        
        populateQuickCreate();
      } else {
        // Close
        sheet.classList.add('translate-y-full');
        backdrop.classList.add('opacity-0');
        setTimeout(function() { backdrop.classList.add('hidden'); }, 300);
      }
    }

    function populateQuickCreate() {
      const container = document.getElementById('quick-create-list');
      container.innerHTML = '';
      
      let devices = [];
      try {
        devices = JSON.parse(localStorage.getItem('nexusPairedDevices') || '[]');
      } catch (e) {}

      if (devices.length === 0) {
        container.innerHTML = '<div class="text-center p-6 text-slate-400 bg-slate-50 rounded-2xl">Öneri oluşturulacak cihaz bulunamadı. Önce bir cihaz ekleyin.</div>';
        return;
      }

      // Generate suggestions based on devices
      devices.forEach(function(device) {
        let suggestionTitle = "";
        let suggestionDesc = "";
        let icon = "zap";
        let color = "text-[#7C5CFF]";
        let bg = "bg-[#7C5CFF]/10";
        
        const dName = (device.name || '').toLowerCase();
        
        if (dName.indexOf('lamba') !== -1 || device.icon === 'lightbulb') {
          suggestionTitle = "Akşam Aydınlatması (" + device.name + ")";
          suggestionDesc = "Gün batımında ışığı otomatik aç";
          icon = "lightbulb";
          color = "text-amber-500";
          bg = "bg-amber-500/10";
        } else if (dName.indexOf('klima') !== -1 || device.icon === 'thermometer' || dName.indexOf('ısıt') !== -1) {
          suggestionTitle = "Sıcaklık Kontrolü (" + device.name + ")";
          suggestionDesc = "Oda sıcaklığı 25°C üstüne çıkarsa çalıştır";
          icon = "thermometer";
          color = "text-blue-500";
          bg = "bg-blue-500/10";
        } else if (dName.indexOf('priz') !== -1 || device.icon === 'plug') {
          suggestionTitle = "Tasarruf Modu (" + device.name + ")";
          suggestionDesc = "Evden çıkıldığında prizi kapat";
          icon = "plug";
          color = "text-emerald-500";
          bg = "bg-emerald-500/10";
        } else if (dName.indexOf('kapı') !== -1 || device.icon === 'door-open' || dName.indexOf('kilit') !== -1) {
          suggestionTitle = "Güvenlik Uyarısı (" + device.name + ")";
          suggestionDesc = "Gece kapı açılırsa bildirim gönder";
          icon = "shield-alert";
          color = "text-red-500";
          bg = "bg-red-500/10";
        } else {
          suggestionTitle = device.name + " Otomasyonu";
          suggestionDesc = device.name + " cihazı için akıllı kural";
          icon = device.icon || "cpu";
          color = "text-indigo-500";
          bg = "bg-indigo-500/10";
        }

        const btn = document.createElement('div');
        btn.onclick = function() {
          addAutomation(suggestionTitle, suggestionDesc, icon, color, bg);
        };
        btn.className = "flex items-center p-4 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 rounded-2xl cursor-pointer transition-colors";
        btn.innerHTML = \`
          <div class="w-12 h-12 rounded-xl \${bg} \${color} flex items-center justify-center shrink-0">
            <i class="w-6 h-6" data-lucide="\${icon}"></i>
          </div>
          <div class="ml-4 flex-1">
            <h4 class="font-bold text-slate-800 text-[15px]">\${suggestionTitle}</h4>
            <p class="text-[13px] text-slate-500 mt-0.5">\${suggestionDesc}</p>
          </div>
          <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
            <i class="w-4 h-4 text-slate-400" data-lucide="plus"></i>
          </div>
        \`;
        container.appendChild(btn);
      });
      
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  </script>
</body>
`;

skillsHtml = skillsHtml.replace(/<\/body>/i, bottomSheetCode);
fs.writeFileSync('stitch-skills.html', skillsHtml, 'utf8');
console.log('Added quick create feature and changed sparkle to zap');
