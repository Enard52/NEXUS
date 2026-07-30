const fs = require('fs');

let smartHtml = fs.readFileSync('stitch-smart.html', 'utf8');

// Find the space-y-4 container in tab-automation and give it an ID if it doesn't have one
smartHtml = smartHtml.replace(
  /<div class="space-y-4">([\s\S]*?)<a href="stitch-skills\.html"/,
  '<div class="space-y-4" id="custom-automations-container">$1</div>\n        <a href="stitch-skills.html"'
);

// Inject a script at the bottom of stitch-smart.html to render custom automations
const scriptHtml = `
  <script>
    function renderCustomAutomations() {
      const container = document.getElementById('custom-automations-container');
      if (!container) return;
      
      let autos = [];
      try {
        autos = JSON.parse(localStorage.getItem('nexusCustomAutomations') || '[]');
      } catch (e) {}
      
      // If there are custom automations, append them
      autos.forEach((auto, idx) => {
        const div = document.createElement('div');
        div.className = "bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 flex items-center justify-between mt-4";
        div.innerHTML = \`
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl \${auto.bgClass} \${auto.colorClass} flex items-center justify-center shrink-0">
                <i class="w-6 h-6" data-lucide="\${auto.icon}"></i>
              </div>
              <div>
                <h4 class="font-bold text-slate-800 text-sm">\${auto.title}</h4>
                <p class="text-xs text-slate-500 mt-0.5">\${auto.desc}</p>
              </div>
            </div>
            <!-- Toggle Switch -->
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7C5CFF]"></div>
            </label>
        \`;
        container.appendChild(div);
      });
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
    
    // Switch to automation tab if URL has ?tab=automation
    window.addEventListener('DOMContentLoaded', () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('tab') === 'automation') {
        const btn = document.getElementById('btn-tab-automation');
        if (btn) switchTab('tab-automation', btn);
      }
      renderCustomAutomations();
    });
  </script>
</body>
`;

smartHtml = smartHtml.replace(/<\/body>/i, scriptHtml);

fs.writeFileSync('stitch-smart.html', smartHtml, 'utf8');
console.log('Modified stitch-smart.html to load and render custom automations');
