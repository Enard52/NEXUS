const fs = require('fs');

// --- Modify stitch-dnd.html ---
let dndHtml = fs.readFileSync('stitch-dnd.html', 'utf8');

const newSelectDnd = `
    function selectDnd(item) {
      document.querySelectorAll('#dnd-options .dnd-check').forEach(function (c) {
        c.classList.add('hidden');
      });
      item.querySelector('.dnd-check').classList.remove('hidden');
      
      var label = item.querySelector('span.text-\\\\[17px\\\\]').textContent;
      var stateLabel = label.indexOf('Kapat') !== -1 ? 'Kapalı' : label.replace(' Rahatsız Etme', '');
      localStorage.setItem('nexusDndState', stateLabel);

      if (stateLabel === 'Kapalı') {
        localStorage.removeItem('nexusDndEndTime');
      } else {
        var hoursMatch = stateLabel.match(/(\\d+)/);
        if (hoursMatch) {
          var hours = parseInt(hoursMatch[1]);
          var endTime = Date.now() + (hours * 60 * 60 * 1000);
          localStorage.setItem('nexusDndEndTime', endTime);
        }
      }
    }
`;

dndHtml = dndHtml.replace(
    /function selectDnd\(item\) \{[\s\S]*?localStorage\.setItem\('nexusDndState'.*?\);\s*\}/,
    newSelectDnd.trim()
);

fs.writeFileSync('stitch-dnd.html', dndHtml, 'utf8');
console.log('Updated stitch-dnd.html to save nexusDndEndTime');


// --- Modify stitch-home.html ---
let homeHtml = fs.readFileSync('stitch-home.html', 'utf8');

// The original syncCards has:
// var state = localStorage.getItem('nexusDndState');
// var scheduleRaw = localStorage.getItem('nexusDndSchedule');
// var dndEl = document.getElementById('dnd-state');
// if (dndEl) {
//   if (state && state !== 'Kapalı') {
//     dndEl.textContent = state;
//     dndEl.classList.add('text-[#FF3B5C]');

const newDndSyncLogic = `
        // Rahatsız Etme (DND) Senkronizasyonu (Geri Sayım)
        var dndEndTime = localStorage.getItem('nexusDndEndTime');
        var scheduleRaw = localStorage.getItem('nexusDndSchedule');
        var dndEl = document.getElementById('dnd-state');
        
        if (dndEl) {
          if (dndEndTime) {
            var updateDndTimer = function() {
              var now = Date.now();
              var end = parseInt(dndEndTime);
              if (now >= end) {
                localStorage.setItem('nexusDndState', 'Kapalı');
                localStorage.removeItem('nexusDndEndTime');
                dndEl.textContent = 'Kapalı';
                dndEl.classList.remove('text-[#FF3B5C]');
                dndEl.classList.add('text-slate-400');
                if (window.dndInterval) clearInterval(window.dndInterval);
              } else {
                var diff = end - now;
                var totalMinutes = Math.floor(diff / 60000);
                var hours = Math.floor(totalMinutes / 60);
                var minutes = totalMinutes % 60;
                dndEl.textContent = hours + ':' + (minutes < 10 ? '0' : '') + minutes + ' kaldı';
                dndEl.classList.add('text-[#FF3B5C]');
                dndEl.classList.remove('text-slate-400');
              }
            };
            updateDndTimer();
            if (window.dndInterval) clearInterval(window.dndInterval);
            window.dndInterval = setInterval(updateDndTimer, 60000);
          } else if (scheduleRaw) {
            dndEl.textContent = 'Programlı';
            dndEl.classList.remove('text-[#FF3B5C]');
            dndEl.classList.add('text-slate-400');
          } else {
            dndEl.textContent = 'Kapalı';
            dndEl.classList.remove('text-[#FF3B5C]');
            dndEl.classList.add('text-slate-400');
            if (window.dndInterval) clearInterval(window.dndInterval);
          }
        }
`;

homeHtml = homeHtml.replace(
    /\/\/ Rahatsız Etme \(DND\) Senkronizasyonu[\s\S]*?if \(dndEl\) \{[\s\S]*?\}\s*\} else \{[\s\S]*?\}\s*\}/,
    newDndSyncLogic.trim()
);

fs.writeFileSync('stitch-home.html', homeHtml, 'utf8');
console.log('Updated stitch-home.html to display live countdown for DND');

