const fs = require("fs");

let dataJs = fs.readFileSync("data.js", "utf8");

const dynamicRenderLogic = `
window.deleteDynamicCard = function(id) {
    let hidden = JSON.parse(localStorage.getItem('nexusHiddenCards') || '[]');
    if (!hidden.includes(id)) {
        hidden.push(id);
        localStorage.setItem('nexusHiddenCards', JSON.stringify(hidden));
    }
    const el = document.getElementById('dyn-card-' + id);
    if (el) el.remove();
};

function renderDevices() {
    const data = window.NEXUS_DATA;
    if (!data) return;
    
    const devices = data.devices || [];
    
    const grids = document.querySelectorAll('[data-purpose="devices-grid"]');
    if (grids.length === 0) return;
    
    let html = '';
    
    if (devices.length === 0) {
        html = \`<div class="col-span-2 text-center py-8 opacity-70">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3 text-slate-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p class="text-sm font-medium text-slate-500">Henüz bu eve bir cihaz eklemediniz.</p>
        </div>\`;
    } else {
        // Filter out hidden cards
        let hidden = JSON.parse(localStorage.getItem('nexusHiddenCards') || '[]');
        
        devices.forEach(device => {
            if (hidden.includes(device.id)) return;
            
            // Icon logic
            let iconSvg = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>'; // Default power icon
            let color = 'text-slate-700';
            let bg = 'bg-slate-100';
            
            if (device.type === 'light' || device.type === 'lamp' || (device.name && device.name.toLowerCase().includes('ışık'))) {
                iconSvg = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>';
                color = 'text-amber-500';
                bg = 'bg-amber-50';
            } else if (device.type === 'ac' || device.type === 'thermostat' || (device.name && device.name.toLowerCase().includes('klima'))) {
                iconSvg = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>';
                color = 'text-blue-500';
                bg = 'bg-blue-50';
            } else if (device.type === 'tv' || (device.name && device.name.toLowerCase().includes('tv'))) {
                iconSvg = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>';
                color = 'text-purple-500';
                bg = 'bg-purple-50';
            }
            
            const isEditPage = window.location.pathname.includes('stitch-cards.html');
            
            let deleteBtn = '';
            if (isEditPage) {
                deleteBtn = \`<button aria-label="Kartı kaldır" class="absolute -top-2 -left-2 w-7 h-7 bg-slate-400 text-white rounded-full flex items-center justify-center shadow-md z-10" onclick="deleteDynamicCard('\${device.id}')">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 12h14" stroke-linecap="round"></path></svg>
                </button>\`;
            }
            
            html += \`
            <article class="relative bg-white rounded-3xl p-5 card-shadow flex flex-col justify-between h-40" id="dyn-card-\${device.id}">
                \${deleteBtn}
                <div>
                    <div class="w-10 h-10 rounded-full \${bg} \${color} flex items-center justify-center mb-3">
                        \${iconSvg}
                    </div>
                    <h3 class="font-bold text-base leading-tight truncate">\${device.name || 'Cihaz'}</h3>
                </div>
                <p class="text-slate-400 text-sm font-medium truncate">\${device.state || 'Kapalı'}</p>
                
                \${isEditPage ? \`<button aria-label="Kart boyutunu değiştir" class="absolute bottom-3 right-3 w-7 h-7 bg-slate-200/90 text-slate-500 rounded-full flex items-center justify-center" onclick="typeof toggleSize === 'function' ? toggleSize(this) : null">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                </button>\` : ''}
            </article>
            \`;
        });
    }
    
    grids.forEach(grid => {
        grid.innerHTML = html;
    });
}
`;

if (!dataJs.includes("function renderDevices(")) {
  // Append the function definition
  dataJs += "\n" + dynamicRenderLogic;

  // Call renderDevices() inside initNexusData, right after dispatching event or before
  dataJs = dataJs.replace(
    "document.dispatchEvent(new CustomEvent('nexusDataReady', { detail: data }));",
    "renderDevices();\n    document.dispatchEvent(new CustomEvent('nexusDataReady', { detail: data }));",
  );

  fs.writeFileSync("data.js", dataJs, "utf8");
}

console.log("data.js updated with renderDevices.");
