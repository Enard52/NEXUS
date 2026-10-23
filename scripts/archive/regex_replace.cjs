const fs = require('fs');
let c = fs.readFileSync('stitch-smart.html', 'utf8');

const regex = /<!-- AI Search Bar -->[\s\S]*?<\/div>\s*<\/div>/;
const newBlock = <!-- AI Search Bar -->
    <section class="mb-6" data-purpose="ai-search-container">
      <a href="stitch-chat.html" class="block">
        <div class="custom-gradient-border px-4 py-3 flex items-center shadow-sm" style="position: relative; background: white; background-clip: padding-box; border: 2px solid transparent; border-radius: 9999px;">
          <div style="content: ''; position: absolute; inset: -2px; border-radius: 9999px; background: linear-gradient(90deg, #FF3B5C, #7C5CFF, #22D3EE); z-index: -1; opacity: 0.8;"></div>
          <!-- NEXUS N leading mark -->
          <div class="h-8 w-8 rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#22D3EE] flex items-center justify-center text-white font-bold text-sm shrink-0 mr-3">N</div>
          <input class="flex-grow border-none focus:ring-0 text-sm font-medium text-gray-700 bg-transparent placeholder-gray-500" placeholder="Nasıl yardımcı olabilirim?" type="text" readonly style="pointer-events:none; outline:none;"/>
          <div class="flex items-center space-x-4 pr-1">
            <!-- Mic Icon -->
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
            <!-- Filter Icon -->
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
          </div>
        </div>
      </a>
    </section>;

c = c.replace(regex, newBlock);
fs.writeFileSync('stitch-smart.html', c, 'utf8');
