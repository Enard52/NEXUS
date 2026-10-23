const fs = require('fs');

let smartHtml = fs.readFileSync('stitch-smart.html', 'utf8');

const oldRecommendations = `<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-4">
<div class="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
<!-- Living Room Image -->
<img alt="Oturma Odası" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/128x80?text=Oda'" src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&amp;fit=crop&amp;w=256&amp;q=80"/>
</div>
<div>
<h4 class="font-bold text-gray-900 leading-tight">Tüm Ev Aydınlatma Kontrolü</h4>
<p class="text-xs text-gray-500 mt-1 leading-snug">Evindeki tüm aydınlatma cihazlarını kontrol et</p>
</div>
</div>`;

const newRecommendations = `<div class="space-y-4">
  <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer active:scale-[0.98] transition-transform">
    <div class="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
      <img alt="Oturma Odası" class="w-full h-full object-cover" src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=256&q=80"/>
      <div class="absolute inset-0 bg-black/10"></div>
    </div>
    <div>
      <h4 class="font-bold text-gray-900 leading-tight">Tüm Ev Aydınlatma Kontrolü</h4>
      <p class="text-xs text-gray-500 mt-1 leading-snug">Evindeki tüm aydınlatma cihazlarını kontrol et</p>
    </div>
  </div>

  <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer active:scale-[0.98] transition-transform">
    <div class="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
      <img alt="Güvenlik Modu" class="w-full h-full object-cover" src="https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=256&q=80"/>
      <div class="absolute inset-0 bg-black/10"></div>
    </div>
    <div>
      <h4 class="font-bold text-gray-900 leading-tight">Tatil Güvenlik Modu</h4>
      <p class="text-xs text-gray-500 mt-1 leading-snug">Uzaktayken evi korumak için kameraları etkinleştir</p>
    </div>
  </div>

  <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer active:scale-[0.98] transition-transform">
    <div class="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
      <img alt="Sinema Modu" class="w-full h-full object-cover" src="https://images.unsplash.com/photo-1585675101077-d6b0db6b26fb?auto=format&fit=crop&w=256&q=80"/>
      <div class="absolute inset-0 bg-black/10"></div>
    </div>
    <div>
      <h4 class="font-bold text-gray-900 leading-tight">Sinema Modu</h4>
      <p class="text-xs text-gray-500 mt-1 leading-snug">Film izlerken perdeleri kapat, ışıkları kıs</p>
    </div>
  </div>
</div>`;

// Since there could be encoding issues with PowerShell output, let's replace by looking for the section tag
smartHtml = smartHtml.replace(
  /<section data-purpose="recommendations">\s*<h3 class="text-xl font-bold text-gray-900 mb-4">Önerilen<\/h3>[\s\S]*?<\/section>/i,
  `<section data-purpose="recommendations">
<h3 class="text-xl font-bold text-gray-900 mb-4">Önerilen</h3>
${newRecommendations}
</section>`
);

fs.writeFileSync('stitch-smart.html', smartHtml, 'utf8');
console.log('Added more recommendation cards to stitch-smart.html');
