const fs = require('fs');

let smartHtml = fs.readFileSync('stitch-smart.html', 'utf8');

// 1. Remove dummy cards from tab-clickrun
smartHtml = smartHtml.replace(
  /<div class="grid grid-cols-2 gap-4" id="custom-clickrun-container">[\s\S]*?<\/div>\s*<a href="stitch-skills\.html\?type=clickrun"/,
  `<div class="grid grid-cols-2 gap-4" id="custom-clickrun-container">
          <!-- Dinamik Tıkla ve Çalıştır kartları buraya eklenecek -->
        </div>
        <div id="empty-clickrun" class="text-center py-10">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          </div>
          <h4 class="text-gray-500 font-medium">Henüz senaryo eklenmedi</h4>
          <p class="text-xs text-gray-400 mt-1">Aşağıdaki butondan yeni bir tane oluşturun.</p>
        </div>
        <a href="stitch-skills.html?type=clickrun"`
);

// 2. Remove dummy cards from tab-automation
smartHtml = smartHtml.replace(
  /<div class="space-y-4" id="custom-automations-container">[\s\S]*?<\/div>\s*<a href="stitch-skills\.html\?type=automation"/,
  `<div class="space-y-4" id="custom-automations-container">
          <!-- Dinamik Otomasyon kartları buraya eklenecek -->
        </div>
        <div id="empty-automation" class="text-center py-10">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h4 class="text-gray-500 font-medium">Henüz otomasyon eklenmedi</h4>
          <p class="text-xs text-gray-400 mt-1">Aşağıdaki butondan yeni bir tane oluşturun.</p>
        </div>
        <a href="stitch-skills.html?type=automation"`
);

// 3. Update renderCustomAutomations to hide/show empty states
const renderScriptUpdate = `
      // Show/hide empty states
      const emptyAuto = document.getElementById('empty-automation');
      if (emptyAuto) emptyAuto.style.display = (autos.length > 0) ? 'none' : 'block';
      
      const emptyClick = document.getElementById('empty-clickrun');
      if (emptyClick) emptyClick.style.display = (clickruns.length > 0) ? 'none' : 'block';
`;

smartHtml = smartHtml.replace(
  /if \(typeof lucide !== 'undefined'\) \{/,
  renderScriptUpdate + '\n      if (typeof lucide !== \'undefined\') {'
);

fs.writeFileSync('stitch-smart.html', smartHtml, 'utf8');
console.log('Removed hardcoded cards and added empty states to stitch-smart.html');
