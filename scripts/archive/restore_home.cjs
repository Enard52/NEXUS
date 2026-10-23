const fs = require('fs');

let html = fs.readFileSync('stitch-home.html', 'utf8');

// The multi_replace tool deleted everything after lucide.createIcons(); up to toggleQuickAdd.
// Let's restore the whole script block.

const newScript = `    lucide.createIcons();
    // Harita sayfasında kaydedilen hava durumu konumuyla senkron
    (function () {
      var loc = localStorage.getItem('nexusWeatherLocation');
      if (loc) {
        var el = document.getElementById('weather-location');
        if (el) el.textContent = loc;
      }
    })();
    // Rahatsız Etme (DND) Senkronizasyonu
    (function () {
      var state = localStorage.getItem('nexusDndState');
      var scheduleRaw = localStorage.getItem('nexusDndSchedule');
      
      var el = document.getElementById('dnd-state');
      if (!el) return;
      
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
      
      if (isActive) {
        el.textContent = displayText;
        el.classList.remove('text-slate-400');
        el.classList.add('text-white');
        el.parentElement.classList.remove('bg-white');
        el.parentElement.classList.add('bg-[#FF3B5C]');
        var title = el.parentElement.querySelector('h3');
        if (title) title.classList.add('text-white');
        var svg = el.parentElement.querySelector('svg');
        if (svg) svg.classList.replace('text-[#FF3B5C]', 'text-white');
      }
    })();
    // Gerçek hane adıyla senkron (nexusHousehold); backend varsa sonradan üzerine yazar
    (function () {
      var name = 'Evim';
      try {
        var homes = JSON.parse(localStorage.getItem('nexusHousehold') || 'null');
        if (Array.isArray(homes) && homes.length && homes[0].name) name = homes[0].name;
      } catch (e) {}
      document.querySelectorAll('[data-bind="householdName"]').forEach(function (el) { el.textContent = name; });
    })();
    // Bugünkü Enerji Senkronizasyonu (Tasarruf ve Kullanım)
    (function () {
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
      
      var el = document.getElementById('energy-today');
      if (el) {
        if (activeStrategies > 0) {
          el.textContent = activeStrategies + ' Tasarruf Aktif';
          el.classList.remove('text-slate-400');
          el.classList.add('text-white');
          el.parentElement.classList.remove('bg-white');
          el.parentElement.classList.add('bg-[#7C5CFF]');
          var title = el.parentElement.querySelector('h3');
          if (title) title.classList.add('text-white');
          var svg = el.parentElement.querySelector('svg');
          if (svg) svg.classList.replace('text-[#7C5CFF]', 'text-white');
        } else if (count === 0) {
          el.textContent = 'Veri yok';
        } else {
          el.textContent = '0.00 kWh';
          el.classList.remove('text-slate-400');
          el.classList.add('text-slate-900', 'font-bold');
        }
      }
    })();
    // Kullanıcı Bilgileri sayfasında değiştirilen fotoğrafla senkron
    (function () {
      var avatar = localStorage.getItem('nexusAvatar');
      if (avatar) {
        var el = document.getElementById('home-avatar');
        if (el) el.src = avatar;
      }
    })();
    // Quick add menu open/close`;

html = html.replace(/lucide\.createIcons\(\);\s*\/\/\s*Quick add menu open\/close/, newScript);

fs.writeFileSync('stitch-home.html', html, 'utf8');
console.log('Restored and updated stitch-home.html');
