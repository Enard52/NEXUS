# NEXUS Shared Components

Bu proje React bileşen ağacı yerine büyük ölçüde statik HTML ekranları ve ortak istemci yardımcı scriptleri kullanıyor. Ortak, tekrar kullanılan UI davranışları aşağıdaki dosyalarda toplanıyor.

## `theme.js`
- Tür: ortak tema, rozet ve profil senkron scripti
- Kullanım: neredeyse tüm ekranlarda `script src="theme.js"`

```js
// Global Unbreakable Image Handler
window.addEventListener('error', function(e) {
  if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
    if (e.target.dataset.fallbackApplied) return;
    e.target.dataset.fallbackApplied = 'true';
    
    const isAvatar = e.target.id.includes('avatar') || e.target.src.includes('randomuser');
    
    if (isAvatar) {
      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
    } else {
      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23f8fafc'%3E%3Crect width='400' height='300' rx='24'/%3E%3Cpath d='M120 220l40-50 50 60 60-80 40 70H120z' fill='%23e2e8f0'/%3E%3Ccircle cx='270' cy='110' r='24' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='bold' font-size='24' fill='%2394a3b8'%3EG%C3%B6rsel Y%C3%BCklenemedi%3C/text%3E%3C/svg%3E";
    }
  }
}, true);

(function() {
  function applyTheme() {
    const isDark = localStorage.getItem('nexusDarkMode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  applyTheme();

  window.addEventListener('storage', (e) => {
    if (e.key === 'nexusDarkMode') {
      applyTheme();
    }
  });
  
  window.addEventListener('themeChanged', applyTheme);

  if (typeof tailwind !== 'undefined') {
    var cfg = tailwind.config || {};
    cfg.darkMode = 'class';
    cfg.theme = cfg.theme || {};
    cfg.theme.extend = cfg.theme.extend || {};
    cfg.theme.extend.colors = Object.assign({}, cfg.theme.extend.colors, {
      nexusPurple: '#7C5CFF',
      nexusCyan: '#22D3EE'
    });
    tailwind.config = cfg;
  }
})();
```

## `sheet-gestures.js`
- Tür: alt sayfa / top sheet sürükleme kapatma yardımcıları
- Kullanım: `stitch-home.html`, `stitch-smart.html`, `stitch-discover.html` ve modal kullanan ekranlar

```js
(function () {
  function bindBottomSheet(options) {
    var sheet = document.getElementById(options.sheetId);
    var handle = document.getElementById(options.handleId);
    var backdrop = options.backdropId ? document.getElementById(options.backdropId) : null;
    if (!sheet || !handle) return;

    var startY = 0;
    var currentY = 0;
    var dragging = false;

    function onStart(event) {
      if (typeof options.isOpen === 'function' && !options.isOpen()) return;
      dragging = true;
      startY = event.touches ? event.touches[0].clientY : event.clientY;
      currentY = 0;
      sheet.style.transition = 'none';
    }

    function onMove(event) {
      if (!dragging) return;
      var y = event.touches ? event.touches[0].clientY : event.clientY;
      currentY = Math.max(0, y - startY);
      sheet.style.transform = 'translateY(' + currentY + 'px)';
      if (backdrop) backdrop.style.opacity = String(Math.max(0, 1 - currentY / 320));
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      sheet.style.transition = '';
      if (currentY > 120) {
        options.close();
      } else {
        sheet.style.transform = '';
        if (backdrop) backdrop.style.opacity = '';
      }
    }

    handle.addEventListener('touchstart', onStart, { passive: true });
    handle.addEventListener('touchmove', onMove, { passive: true });
    handle.addEventListener('touchend', onEnd);
  }

  window.NexusSheetGestures = {
    bindBottomSheet: bindBottomSheet,
    bindTopSheet: bindBottomSheet
  };
})();
```

## `ai-fab.js`
- Tür: global yapay zeka kısa yol düğmesi
- Kullanım: çoğu mobil ekranda sağ alt sabit kısa yol

```js
(function () {
  if (document.querySelector('[data-nexus-ai-fab]')) return;

  var fab = document.createElement('button');
  fab.setAttribute('data-nexus-ai-fab', 'true');
  fab.setAttribute('aria-label', 'NEXUS AI');
  fab.style.cssText = [
    'position:fixed',
    'right:12px',
    'bottom:98px',
    'width:46px',
    'height:46px',
    'border:none',
    'border-radius:9999px',
    'background:linear-gradient(135deg,#7C5CFF 0%,#22D3EE 100%)',
    'box-shadow:0 12px 24px rgba(124,92,255,.28)',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'z-index:45',
    'cursor:pointer'
  ].join(';');
  fab.innerHTML = '<span style="color:white;font-weight:800;font-family:Inter,system-ui,sans-serif">N</span>';
  fab.addEventListener('click', function () {
    window.location.href = 'stitch-chat.html';
  });
  document.addEventListener('DOMContentLoaded', function () {
    document.body.appendChild(fab);
  });
})();
```
