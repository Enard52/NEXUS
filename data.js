const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:4181' 
    : (window.location.protocol === 'file:' ? 'http://10.0.2.2:4181' : ''); // 10.0.2.2 is for Android emulator loopback

async function fetchNexusData() {
    try {
        let res = await fetch(`${API_BASE}/api/data`, {credentials: 'include'});
        let json = await res.json();
        
        if (json.error === 'Not signed in') {
            // Login as guest automatically if no session
            await fetch(`${API_BASE}/api/guest`, {method: 'POST', credentials: 'include'});
            res = await fetch(`${API_BASE}/api/data`, {credentials: 'include'});
            json = await res.json();
        }
        
        return json.data;
    } catch(e) {
        console.error("Nexus API Error:", e);
        return null;
    }
}

async function initNexusData() {
    const data = await fetchNexusData();
    if (!data) {
        // Backend yok (mobil): kullanıcının gerçek yerel cihazlarıyla render et
        renderDevices();
        document.dispatchEvent(new CustomEvent('nexusDataReady', { detail: null }));
        return;
    }
    
    window.NEXUS_DATA = data;
    
    // Simple 1-way text binding
    document.querySelectorAll('[data-bind]').forEach(el => {
        const keyPath = el.getAttribute('data-bind').split('.');
        let val = data;
        for (const k of keyPath) {
            if (val === undefined || val === null) break;
            val = val[k];
        }
        if (val !== undefined && val !== null) {
            // Check if it's an input or standard element
            if (el.tagName === 'INPUT') {
                el.value = val;
            } else {
                el.textContent = val;
            }
        }
    });
    
    // Let individual pages handle complex rendering (lists, states, etc)
    const userNameElement = document.getElementById('nexus-user-name');
    if (userNameElement) {
        if (userNameElement.tagName === 'INPUT') {
            userNameElement.value = data.displayName || 'Kullanıcı';
        } else {
            userNameElement.textContent = data.displayName || 'Kullanıcı';
        }
    }
    
    
    // Hide deleted cards on Home
    if (window.location.pathname.includes('stitch-home.html') || window.location.pathname.endsWith('/')) {
        let hidden = JSON.parse(localStorage.getItem('nexusHiddenCards') || '[]');
        hidden.forEach(id => {
            const el = document.getElementById('card-' + id);
            if (el) el.remove();
        });
    }

    // Realistic Notification Badge Logic
    const discoverBadge = document.getElementById('discover-badge');
    if (discoverBadge) {
        if (window.location.pathname.includes('stitch-discover.html')) {
            localStorage.setItem('nexusNotificationsRead', 'true');
        }
        
        // Let's pretend the server returns unread suggestions if we haven't clicked it
        const isRead = localStorage.getItem('nexusNotificationsRead') === 'true';
        if (!isRead) {
            discoverBadge.classList.remove('hidden');
        } else {
            discoverBadge.classList.add('hidden');
        }
    }

    renderDevices();
    document.dispatchEvent(new CustomEvent('nexusDataReady', { detail: data }));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNexusData);
} else {
    initNexusData();
}


window.deleteDynamicCard = function(id) {
    let hidden = JSON.parse(localStorage.getItem('nexusHiddenCards') || '[]');
    if (!hidden.includes(id)) {
        hidden.push(id);
        localStorage.setItem('nexusHiddenCards', JSON.stringify(hidden));
    }
    const el = document.getElementById('dyn-card-' + id);
    if (el) el.remove();
};

// Backend yokken tek gerçek kaynak: kullanıcının yerel eşleştirdiği cihazlar
// (nexusDashboardCards + nexusPairedDevices aynı akışta birleşir)
function getLocalDevices() {
    const list = [];
    let cards = [];
    try { cards = JSON.parse(localStorage.getItem('nexusDashboardCards') || '[]'); } catch(e){}
    if (Array.isArray(cards)) {
        cards.forEach(c => {
            if (!c || c.visible === false || !c.title) return;
            list.push({ id: c.id, name: c.title, state: c.valDefault || 'Bağlı' });
        });
    }
    let paired = [];
    try { paired = JSON.parse(localStorage.getItem('nexusPairedDevices') || '[]'); } catch(e){}
    if (Array.isArray(paired)) {
        paired.forEach((d, i) => {
            if (!d || !d.name) return;
            if (list.some(x => x.name === d.name)) return; // aynı cihaz iki kaynakta sayılmasın
            list.push({ id: 'paired-' + i, name: d.name, state: 'Bağlı', type: d.icon === 'lightbulb' ? 'light' : '' });
        });
    }
    return list;
}

function renderDevices() {
    const data = window.NEXUS_DATA;
    // Backend verisi varsa o kullanılır; yoksa yerel gerçek cihazlar
    const devices = (data && Array.isArray(data.devices)) ? data.devices : getLocalDevices();
    
    const grids = document.querySelectorAll('[data-purpose="devices-grid"]');
    if (grids.length === 0) return;
    
    let html = '';
    
    if (devices.length === 0) {
        html = `<div class="col-span-2 text-center pt-8 pb-2 opacity-70">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3 text-slate-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p class="text-sm font-medium text-slate-500">Henüz bu eve bir cihaz eklemediniz.</p>
        </div>`;
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
                deleteBtn = `<button aria-label="Kartı kaldır" class="absolute -top-2 -left-2 w-7 h-7 bg-slate-400 text-white rounded-full flex items-center justify-center shadow-md z-10" onclick="deleteDynamicCard('${device.id}')">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 12h14" stroke-linecap="round"></path></svg>
                </button>`;
            }
            
            html += `
            <article class="relative bg-white rounded-3xl p-5 card-shadow flex flex-col justify-between h-40" id="dyn-card-${device.id}">
                ${deleteBtn}
                <div>
                    <div class="w-10 h-10 rounded-full ${bg} ${color} flex items-center justify-center mb-3">
                        ${iconSvg}
                    </div>
                    <h3 class="font-bold text-base leading-tight truncate">${device.name || 'Cihaz'}</h3>
                </div>
                <p class="text-slate-400 text-sm font-medium truncate">${device.state || 'Kapalı'}</p>
                
                ${isEditPage ? `<button aria-label="Kart boyutunu değiştir" class="absolute bottom-3 right-3 w-7 h-7 bg-slate-200/90 text-slate-500 rounded-full flex items-center justify-center" onclick="typeof toggleSize === 'function' ? toggleSize(this) : null">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                </button>` : ''}
            </article>
            `;
        });
    }
    
    grids.forEach(grid => {
        grid.innerHTML = html;
    });
}
