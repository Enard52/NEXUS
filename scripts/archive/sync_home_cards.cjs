const fs = require('fs');

let homeHtml = fs.readFileSync('stitch-home.html', 'utf8');

// Update DND sync logic in stitch-home.html
const oldDndLogic = `    // Rahatsız Etme sayfasındaki seçimle senkron
    (function () {
      var state = localStorage.getItem('nexusDndState');
      if (state && state !== 'Kapalı') {
        var el = document.getElementById('dnd-state');
        if (el) {
          el.textContent = state;
          el.classList.remove('text-slate-400');
          el.classList.add('text-white');
          el.parentElement.classList.remove('bg-white');
          el.parentElement.classList.add('bg-[#FF3B5C]');
          var title = el.parentElement.querySelector('h3');
          if (title) title.classList.add('text-white');
          var svg = el.parentElement.querySelector('svg');
          if (svg) svg.classList.replace('text-[#FF3B5C]', 'text-white');
        }
      }
    })();`;

const newDndLogic = `    // Rahatsız Etme (DND) Senkronizasyonu
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
            isActive = true; // Gösterim için aktif varsayıyoruz, rengini değiştirelim.
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
    })();`;

homeHtml = homeHtml.replace(oldDndLogic, newDndLogic);

// Update Energy sync logic in stitch-home.html
const oldEnergyLogic = `    // Bugünkü Enerji: eşleşmiş cihaz yoksa dürüst "Veri yok", varsa 0.00'dan başlar
    (function () {
      var count = 0;
      try {
        count = JSON.parse(localStorage.getItem('nexusHousehold') || '[]')[0].devices.length;
      } catch (e) {}
      
      var el = document.getElementById('energy-today');
      if (el) {
        if (count === 0) {
          el.textContent = 'Veri yok';
        } else {
          el.textContent = (count * 1.5).toFixed(2) + ' kWh';
          el.classList.remove('text-slate-400');
          el.classList.add('text-slate-900', 'font-bold');
        }
      }
    })();`;

const newEnergyLogic = `    // Bugünkü Enerji Senkronizasyonu (Tasarruf ve Kullanım)
    (function () {
      var count = 0;
      try {
        count = JSON.parse(localStorage.getItem('nexusHousehold') || '[]')[0].devices.length;
      } catch (e) {}
      
      // Tasarruf modu aktif mi kontrol et
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
          el.textContent = (count * 1.5).toFixed(2) + ' kWh';
          el.classList.remove('text-slate-400');
          el.classList.add('text-slate-900', 'font-bold');
        }
      }
    })();`;

homeHtml = homeHtml.replace(oldEnergyLogic, newEnergyLogic);

fs.writeFileSync('stitch-home.html', homeHtml, 'utf8');
console.log('Updated stitch-home.html sync logic');
