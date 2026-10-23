const fs = require('fs');

let skillsHtml = fs.readFileSync('stitch-skills.html', 'utf8');

// Replace the static items with a script that handles clicking
const replacementScript = `
    <!-- Trigger List Card -->
    <section class="bg-white rounded-3xl card-shadow overflow-hidden border border-slate-50" data-purpose="trigger-list">
      
      <!-- Item 1 -->
      <div onclick="addAutomation('Cihaz Durumu', 'Bir cihaz açıldığında veya kapandığında', 'lightbulb', 'text-[#7C5CFF]', 'bg-[#7C5CFF]/10')" class="flex items-center p-5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer border-b border-slate-100 last:border-0">
        <div class="w-12 h-12 rounded-2xl bg-[#7C5CFF]/10 text-[#7C5CFF] flex items-center justify-center flex-shrink-0">
          <i class="w-6 h-6" data-lucide="lightbulb"></i>
        </div>
        <div class="flex-1 ml-4">
          <h3 class="font-bold text-base text-slate-800">Cihaz Durumu</h3>
          <p class="text-[13px] text-slate-400 mt-0.5">Bir cihaz açıldığında veya kapandığında</p>
        </div>
        <i class="w-5 h-5 text-slate-300" data-lucide="chevron-right"></i>
      </div>
      
      <!-- Item 2 -->
      <div onclick="addAutomation('Zamanlayıcı', 'Belirli bir saatte veya günde', 'clock', 'text-blue-500', 'bg-blue-500/10')" class="flex items-center p-5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer border-b border-slate-100 last:border-0">
        <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
          <i class="w-6 h-6" data-lucide="clock"></i>
        </div>
        <div class="flex-1 ml-4">
          <h3 class="font-bold text-base text-slate-800">Zamanlayıcı</h3>
          <p class="text-[13px] text-slate-400 mt-0.5">Belirli bir saatte veya günde</p>
        </div>
        <i class="w-5 h-5 text-slate-300" data-lucide="chevron-right"></i>
      </div>
      
      <!-- Item 3 -->
      <div onclick="addAutomation('Hava Durumu', 'Sıcaklık, nem veya rüzgar değiştiğinde', 'sun', 'text-amber-500', 'bg-amber-500/10')" class="flex items-center p-5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer border-b border-slate-100 last:border-0">
        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
          <i class="w-6 h-6" data-lucide="sun"></i>
        </div>
        <div class="flex-1 ml-4">
          <h3 class="font-bold text-base text-slate-800">Hava Durumu</h3>
          <p class="text-[13px] text-slate-400 mt-0.5">Sıcaklık, nem veya rüzgar değiştiğinde</p>
        </div>
        <i class="w-5 h-5 text-slate-300" data-lucide="chevron-right"></i>
      </div>
      
      <!-- Item 4 -->
      <div onclick="addAutomation('Konum (Geofencing)', 'Eve vardığında veya evden ayrıldığında', 'map-pin', 'text-emerald-500', 'bg-emerald-500/10')" class="flex items-center p-5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer border-b border-slate-100 last:border-0">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
          <i class="w-6 h-6" data-lucide="map-pin"></i>
        </div>
        <div class="flex-1 ml-4">
          <h3 class="font-bold text-base text-slate-800">Konum (Geofencing)</h3>
          <p class="text-[13px] text-slate-400 mt-0.5">Eve vardığında veya evden ayrıldığında</p>
        </div>
        <i class="w-5 h-5 text-slate-300" data-lucide="chevron-right"></i>
      </div>

      <!-- Item 5 -->
      <div onclick="addAutomation('Güvenlik Modu', 'Alarm sistemi durumu değiştiğinde', 'shield-check', 'text-cyan-500', 'bg-cyan-500/10')" class="flex items-center p-5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer border-b border-slate-100 last:border-0">
        <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center flex-shrink-0">
          <i class="w-6 h-6" data-lucide="shield-check"></i>
        </div>
        <div class="flex-1 ml-4">
          <h3 class="font-bold text-base text-slate-800">Güvenlik Modu</h3>
          <p class="text-[13px] text-slate-400 mt-0.5">Alarm sistemi durumu değiştiğinde</p>
        </div>
        <i class="w-5 h-5 text-slate-300" data-lucide="chevron-right"></i>
      </div>

      <!-- Item 6 -->
      <div onclick="addAutomation('Alarm Tetiklendiğinde', 'Sensörler bir tehlike algıladığında', 'bell-ring', 'text-red-500', 'bg-red-500/10')" class="flex items-center p-5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer border-b border-slate-100 last:border-0">
        <div class="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
          <i class="w-6 h-6" data-lucide="bell-ring"></i>
        </div>
        <div class="flex-1 ml-4">
          <h3 class="font-bold text-base text-slate-800">Alarm Tetiklendiğinde</h3>
          <p class="text-[13px] text-slate-400 mt-0.5">Sensörler bir tehlike algıladığında</p>
        </div>
        <i class="w-5 h-5 text-slate-300" data-lucide="chevron-right"></i>
      </div>
    </section>
`;

skillsHtml = skillsHtml.replace(/<!-- Trigger List Card -->[\s\S]*?<\/section>/, replacementScript);

// Add script at the bottom
const scriptAddAutomation = `
  <script>
    function addAutomation(title, desc, icon, colorClass, bgClass) {
      let autos = [];
      try {
        autos = JSON.parse(localStorage.getItem('nexusCustomAutomations') || '[]');
      } catch (e) {}
      autos.push({ title: title, desc: desc, icon: icon, colorClass: colorClass, bgClass: bgClass });
      localStorage.setItem('nexusCustomAutomations', JSON.stringify(autos));
      
      // Navigate back to smart with a query param to open automation tab directly
      window.location.href = 'stitch-smart.html?tab=automation';
    }
  </script>
</body>
`;

skillsHtml = skillsHtml.replace(/<\/body>/i, scriptAddAutomation);

fs.writeFileSync('stitch-skills.html', skillsHtml, 'utf8');
console.log('Modified stitch-skills.html to save selected automations to localStorage');
