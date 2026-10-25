const fs = require("fs");

let html = fs.readFileSync("stitch-smart.html", "utf8");

// 1. Replace the hardcoded "2 Aktif" span with an empty span with an ID
html = html.replace(
  /<span class="bg-\[#7C5CFF\]\/10 text-\[#7C5CFF\] text-xs font-bold px-2 py-1 rounded-lg">2 Aktif<\/span>/,
  '<span id="automation-active-count" class="hidden bg-[#7C5CFF]/10 text-[#7C5CFF] text-xs font-bold px-2 py-1 rounded-lg"></span>',
);

// 2. Update renderCustomAutomations logic
const newRenderLogic = `
    function renderCustomAutomations() {
        // Automations
        const autoContainer = document.getElementById('custom-automations-container');
        const activeBadge = document.getElementById('automation-active-count');
        
        if (autoContainer) {
          autoContainer.innerHTML = ''; // Clear previous items to prevent duplicates
          
          let autos = [];
          try { autos = JSON.parse(localStorage.getItem('nexusCustomAutomations') || '[]'); } catch (e) {}
          
          // Update active count badge
          if (activeBadge) {
            if (autos.length > 0) {
              activeBadge.textContent = autos.length + ' Aktif';
              activeBadge.classList.remove('hidden');
            } else {
              activeBadge.classList.add('hidden');
            }
          }

          autos.forEach((auto) => {
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
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7C5CFF]"></div>
                </label>
            \`;
            autoContainer.appendChild(div);
          });
          
          const emptyState = document.getElementById('empty-automation');
          if (emptyState) {
             if (autos.length > 0) {
                 emptyState.classList.add('hidden');
             } else {
                 emptyState.classList.remove('hidden');
             }
          }
        }
`;

html = html.replace(
  /function renderCustomAutomations\(\) \{[\s\S]*?const clickContainer = document.getElementById\('custom-clickrun-container'\);/,
  newRenderLogic.trim() +
    "\n\n        // Click and Run\n        const clickContainer = document.getElementById('custom-clickrun-container');",
);

// We should also run renderCustomAutomations on pageshow so it updates when coming back from stitch-skills.html
const pageShowScript = `
      window.addEventListener('pageshow', function(e) {
        if (e.persisted || true) {
          renderCustomAutomations();
          lucide.createIcons();
        }
      });
`;
html = html.replace(
  /renderCustomAutomations\(\);\s*\}\);\s*<\/script>/,
  "renderCustomAutomations();\n      });\n" + pageShowScript + "    </script>",
);

fs.writeFileSync("stitch-smart.html", html, "utf8");
console.log(
  "Fixed hardcoded active badge and added page refresh logic for automations in stitch-smart.html",
);
