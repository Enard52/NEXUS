const fs = require('fs');

let html = fs.readFileSync('stitch-home.html', 'utf8');

const replacementScript = `    lucide.createIcons();

    function syncCards() {
      // Harita sayfasında kaydedilen hava durumu konumuyla senkron
      var loc = localStorage.getItem('nexusWeatherLocation');
      if (loc) {
        var el = document.getElementById('weather-location');
        if (el) el.textContent = loc;
      }

      // Rahatsız Etme (DND) Senkronizasyonu
      var state = localStorage.getItem('nexusDndState');
      var scheduleRaw = localStorage.getItem('nexusDndSchedule');
      var dndEl = document.getElementById('dnd-state');
      if (dndEl) {
        let displayText = 'Kapalı';
        let isActive = false;
        
        if (state && state !== 'Kapalı') {
          displayText = state;
          isActive = true;
        } else if (scheduleRaw) {
          try {
            var s = JSON.parse(scheduleRaw);
            if (s.start && s.end) {
              displayText = s.start + ' - ' + s.end + ' Planlı';
              isActive = true;
            }
          } catch(e){}
        }
        
        dndEl.textContent = displayText;
        if (isActive) {
          dndEl.classList.remove('text-slate-400');
          dndEl.classList.add('text-[#FF3B5C]', 'font-semibold');
        } else {
          dndEl.classList.remove('text-[#FF3B5C]', 'font-semibold');
          dndEl.classList.add('text-slate-400');
        }
      }

      // Gerçek hane adıyla senkron (nexusHousehold)
      var name = 'Evim';
      try {
        var homes = JSON.parse(localStorage.getItem('nexusHousehold') || 'null');
        if (Array.isArray(homes) && homes.length && homes[0].name) name = homes[0].name;
      } catch (e) {}
      document.querySelectorAll('[data-bind="householdName"]').forEach(function (el) { el.textContent = name; });

      // Bugünkü Enerji Senkronizasyonu
      var count = 0;
      try {
        var cards = JSON.parse(localStorage.getItem('nexusDashboardCards') || '[]');
        if (Array.isArray(cards)) count += cards.filter(function (c) { return c && c.visible !== false; }).length;
        var paired = JSON.parse(localStorage.getItem('nexusPairedDevices') || '[]');
        if (Array.isArray(paired)) count += paired.length;
      } catch (e) {}
      
      var map = {};
      try { map = JSON.parse(localStorage.getItem('nexusEnergyEnabledMap') || '{}'); } catch(e){}
      var activeStrategies = Object.keys(map).filter(k => map[k]).length;
      
      var energyEl = document.getElementById('energy-today');
      if (energyEl) {
        if (activeStrategies > 0) {
          energyEl.textContent = activeStrategies + ' Tasarruf Aktif';
          energyEl.classList.remove('text-slate-400', 'text-slate-900', 'font-bold');
          energyEl.classList.add('text-[#7C5CFF]', 'font-semibold');
        } else if (count === 0) {
          energyEl.textContent = 'Veri yok';
          energyEl.classList.remove('text-[#7C5CFF]', 'font-semibold', 'text-slate-900', 'font-bold');
          energyEl.classList.add('text-slate-400');
        } else {
          energyEl.textContent = '0.00 kWh';
          energyEl.classList.remove('text-slate-400', 'text-[#7C5CFF]', 'font-semibold');
          energyEl.classList.add('text-slate-900', 'font-bold');
        }
      }

      // Kullanıcı Bilgileri sayfasında değiştirilen fotoğrafla senkron
      var avatar = localStorage.getItem('nexusAvatar');
      if (avatar) {
        var avatarEl = document.getElementById('home-avatar');
        if (avatarEl) avatarEl.src = avatar;
      }
    }

    // Call on load
    syncCards();

    // Call when page is restored from bfcache
    window.addEventListener('pageshow', function(event) {
      if (event.persisted) {
        syncCards();
      }
    });

    // Also call on visibilitychange just to be absolutely sure for mobile web views
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        syncCards();
      }
    });

    // Quick add menu open/close`;

html = html.replace(/lucide\.createIcons\(\);[\s\S]*?\/\/ Quick add menu open\/close/, replacementScript);

fs.writeFileSync('stitch-home.html', html, 'utf8');
console.log('Fixed instant sync in stitch-home.html');
