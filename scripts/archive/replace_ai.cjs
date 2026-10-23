const fs = require('fs');
let c = fs.readFileSync('stitch-smart.html', 'utf8');

const oldBlock =     <!-- AI Search Bar -->
    <div class="nexus-ai-border mb-6 flex items-center px-4 py-3 shadow-sm cursor-pointer" onclick="window.location.href='stitch-skills.html'">
      <!-- Fake AI Logo -->
      <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-[#7C5CFF] to-[#22D3EE] flex items-center justify-center mr-3">
        <div class="w-3 h-3 bg-white rounded-full opacity-80"></div>
      </div>
      <span class="flex-1 text-[15px] font-medium text-slate-400">NEXUS AI ile senaryonu yaz...</span>
      <div class="flex items-center gap-3 text-slate-500">
        <i class="w-5 h-5" data-lucide="mic"></i>
        <span class="w-px h-4 bg-slate-200"></span>
        <i class="w-5 h-5" data-lucide="sliders-horizontal"></i>
      </div>
    </div>;

const newBlock =     <section class="mb-6" data-purpose="ai-search-container">
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

if (c.includes(oldBlock)) {
    c = c.replace(oldBlock, newBlock);
    fs.writeFileSync('stitch-smart.html', c, 'utf8');
    console.log('Successfully replaced AI block in stitch-smart.html');
} else {
    console.log('Could not find exact oldBlock match.');
}
