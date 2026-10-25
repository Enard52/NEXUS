const fs = require("fs");

// --- 1. Modify stitch-skills.html ---
let skillsHtml = fs.readFileSync("stitch-skills.html", "utf8");

// Replace the addAutomation script
const newScriptAddAutomation = `
  <script>
    function addAutomation(title, desc, icon, colorClass, bgClass) {
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type') || 'automation'; // default to automation
      
      const storageKey = type === 'clickrun' ? 'nexusCustomClickRun' : 'nexusCustomAutomations';
      const targetTab = type === 'clickrun' ? 'tab-clickrun' : 'tab-automation';
      
      let autos = [];
      try {
        autos = JSON.parse(localStorage.getItem(storageKey) || '[]');
      } catch (e) {}
      autos.push({ title: title, desc: desc, icon: icon, colorClass: colorClass, bgClass: bgClass });
      localStorage.setItem(storageKey, JSON.stringify(autos));
      
      // Navigate back to smart with a query param to open correct tab
      window.location.href = 'stitch-smart.html?tab=' + targetTab;
    }
  </script>
</body>
`;

skillsHtml = skillsHtml.replace(
  /<script>\s*function addAutomation[\s\S]*?<\/body>/i,
  newScriptAddAutomation.trim() + "\n",
);
fs.writeFileSync("stitch-skills.html", skillsHtml, "utf8");
console.log("Updated stitch-skills.html");

// --- 2. Modify stitch-smart.html ---
let smartHtml = fs.readFileSync("stitch-smart.html", "utf8");

// Update links
smartHtml = smartHtml.replace(
  /<a href="stitch-skills\.html"([^>]*)>\s*<svg([^>]*)>([\s\S]*?)<\/svg>\s*Yeni Otomasyon\s*<\/a>/,
  '<a href="stitch-skills.html?type=automation"$1>\n          <svg$2>$3</svg>\n          Yeni Otomasyon\n        </a>',
);

smartHtml = smartHtml.replace(
  /<button class="mt-6 w-full([^>]*)>\s*<svg([^>]*)>([\s\S]*?)<\/svg>\s*Yeni Senaryo Ekle\s*<\/button>/,
  '<a href="stitch-skills.html?type=clickrun" class="mt-6 w-full$1 block text-center">\n          <svg$2>$3</svg>\n          Yeni Senaryo Ekle\n        </a>',
);

// Add an ID to the clickrun grid if not present
smartHtml = smartHtml.replace(
  /<div class="grid grid-cols-2 gap-4">/,
  '<div class="grid grid-cols-2 gap-4" id="custom-clickrun-container">',
);

// Update render script
const renderScript = `
  <script>
    function renderCustomAutomations() {
      // Automations
      const autoContainer = document.getElementById('custom-automations-container');
      if (autoContainer) {
        let autos = [];
        try { autos = JSON.parse(localStorage.getItem('nexusCustomAutomations') || '[]'); } catch (e) {}
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
      }

      // Click and Run
      const clickContainer = document.getElementById('custom-clickrun-container');
      if (clickContainer) {
        let clickruns = [];
        try { clickruns = JSON.parse(localStorage.getItem('nexusCustomClickRun') || '[]'); } catch (e) {}
        clickruns.forEach((run) => {
          const btn = document.createElement('button');
          btn.className = "bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-100 rounded-3xl p-5 text-left shadow-sm active:scale-95 transition-transform";
          btn.innerHTML = \`
            <div class="w-10 h-10 rounded-full \${autoBgToLight(run.bgClass)} \${run.colorClass} flex items-center justify-center mb-3">
              <i class="w-5 h-5" data-lucide="\${run.icon}"></i>
            </div>
            <h4 class="font-bold text-slate-800">\${run.title}</h4>
            <p class="text-xs text-slate-500 mt-1">\${run.desc}</p>
          \`;
          clickContainer.appendChild(btn);
        });
      }
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }

    function autoBgToLight(bgClass) {
       // Convert bg-red-500/10 to bg-red-100 for the button style, just a simple fallback
       if(bgClass.includes('emerald')) return 'bg-emerald-100';
       if(bgClass.includes('blue')) return 'bg-blue-100';
       if(bgClass.includes('amber')) return 'bg-orange-100';
       if(bgClass.includes('cyan')) return 'bg-cyan-100';
       if(bgClass.includes('red')) return 'bg-red-100';
       if(bgClass.includes('7C5CFF')) return 'bg-purple-100';
       return 'bg-gray-100';
    }
    
    // Switch to tab if URL has ?tab=...
    window.addEventListener('DOMContentLoaded', () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab === 'tab-automation') {
        const btn = document.getElementById('btn-tab-automation');
        if (btn) switchTab('tab-automation', btn);
      } else if (tab === 'tab-clickrun') {
        const btn = document.getElementById('btn-tab-clickrun');
        if (btn) switchTab('tab-clickrun', btn);
      }
      renderCustomAutomations();
    });
  </script>
</body>
`;

smartHtml = smartHtml.replace(
  /<script>\s*function renderCustomAutomations[\s\S]*?<\/body>/i,
  renderScript.trim() + "\n",
);
fs.writeFileSync("stitch-smart.html", smartHtml, "utf8");
console.log("Updated stitch-smart.html");
