
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

// theme.js
// NEXUS Global Theme & Profile Manager

(function() {
  // 1. Dark Mode Logic
  function applyTheme() {
    const isDark = localStorage.getItem('nexusDarkMode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Apply immediately to avoid flicker
  applyTheme();

  // Watch for changes across tabs/iframes
  window.addEventListener('storage', (e) => {
    if (e.key === 'nexusDarkMode') {
      applyTheme();
    }
  });
  
  // Custom event listener for same-page updates
  window.addEventListener('themeChanged', applyTheme);

  // Configure Tailwind for dark mode class.
  // ÖNEMLİ: Sayfanın kendi tailwind.config'ini EZME — birleştir.
  // (Aksi halde nexus-purple gibi sayfa renkleri kaybolur ve seçili öğeler görünmez olur.)
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

  // Global karanlık tema geçersiz kılmaları:
  // Sayfaların çoğunda dark: sınıfı olmadığından, ortak yardımcı sınıfları
  // html.dark altında tek merkezden koyulaştırarak tüm sayfalarda tutarlı karanlık tema sağlar.
  var darkCss = [
    /* Base Body - handle custom gradients properly */
    /* background-image: none => sayfa içi body{background: açık-gradyan} tanımlarını da söndürür (plus/radar/skills) */
    'html.dark body { background-color: #0f172a !important; background-image: none !important; color: #e2e8f0 !important; }',
    'html.dark body.bg-dashboard-gradient, html.dark body.bg-gradient-custom, html.dark body.bg-miniapp-gradient { background: linear-gradient(180deg, #020617 0%, #0f172a 100%) !important; }',
    'html.dark body.bg-smart-gradient { background: linear-gradient(180deg, #022c22 0%, #064e3b 100%) !important; }',
    
    /* General Backgrounds */
    'html.dark .bg-white { background-color: #1e293b !important; border-color: rgba(255,255,255,0.05) !important; }',
    'html.dark [class*="bg-white/"] { background-color: rgba(30,41,59,0.85) !important; border-color: rgba(255,255,255,0.05) !important; }',
    'html.dark .bg-slate-50, html.dark .bg-slate-100, html.dark .bg-gray-50, html.dark .bg-gray-100 { background-color: #334155 !important; }',
    'html.dark .bg-slate-200, html.dark .bg-slate-300 { background-color: #475569 !important; }',
    /* Yarı saydam açık zeminler (örn. bg-slate-50/50 üst başlıklar) */
    'html.dark [class*="bg-slate-50/"], html.dark [class*="bg-gray-50/"], html.dark [class*="bg-slate-100/"] { background-color: rgba(30,41,59,0.7) !important; }',
    /* Keyfî açık hex zeminler (sayfa içi bg-[#...] sınıfları) */
    'html.dark [class*="bg-[#F3F2F9]"], html.dark [class*="bg-[#F1F7FF]"], html.dark [class*="bg-[#f8fafc]"] { background-color: #1e293b !important; }',
    /* Sayfa özel renk tokenları (tailwind.config içinden gelen açık zeminler) */
    'html.dark .bg-bg-main, html.dark .bg-nexus-bg { background-color: #0f172a !important; }',
    'html.dark .bg-nexus-bg-light { background-color: #334155 !important; }',
    /* Sohbet ana alanı (bg-nexus-gradient) ve kullanıcı bilgisi zemini (bg-nexus-tint) */
    'html.dark .bg-nexus-gradient, html.dark .bg-nexus-tint { background-image: linear-gradient(180deg, #020617 0%, #0f172a 100%) !important; }',
    /* Cam paneller ve ana sayfa AI arama kutusu (inline açık arka planlı özel sınıflar) */
    'html.dark .glass-panel { background: rgba(30,41,59,0.8) !important; }',
    'html.dark .custom-gradient-border { background: #1e293b !important; background-clip: padding-box !important; }',
    /* Alt navigasyon cam efekti (sayfa içi .bottom-nav { background: beyaz } tanımları) */
    'html.dark .bottom-nav { background-color: rgba(15,23,42,0.92) !important; border-top-color: rgba(255,255,255,0.08) !important; }',
    /* Harita: Leaflet zemini ve beyaz üst başlık gradyanı */
    'html.dark .leaflet-container { background: #0f172a !important; }',
    'html.dark .leaflet-control-attribution { background: rgba(15,23,42,0.7) !important; color: #94a3b8 !important; }',
    'html.dark .bg-gradient-to-b.from-white { background-image: linear-gradient(to bottom, rgba(15,23,42,0.95), rgba(15,23,42,0.75), transparent) !important; }',
    
    /* Specific Sheets / Modals with inline light gradients that break text visibility */
    'html.dark .qa-sheet, html.dark #quick-create-sheet, html.dark #code-modal-content { background: #1e293b !important; border: 1px solid rgba(255,255,255,0.1) !important; }',

    /* Text Colors */
    'html.dark .text-black, html.dark .text-slate-900, html.dark .text-slate-800, html.dark .text-gray-900, html.dark .text-gray-800 { color: #f8fafc !important; }',
    'html.dark .text-slate-700, html.dark .text-slate-600, html.dark .text-gray-700, html.dark .text-gray-600 { color: #cbd5e1 !important; }',
    'html.dark .text-slate-500, html.dark .text-slate-400, html.dark .text-gray-500, html.dark .text-gray-400 { color: #94a3b8 !important; }',
    /* Sayfa özel metin tokenları (örn. menü: text-primary #111827) */
    'html.dark .text-text-primary { color: #f8fafc !important; }',
    'html.dark .text-text-secondary { color: #94a3b8 !important; }',

    /* Borders */
    'html.dark .border-slate-100, html.dark .border-slate-200, html.dark .border-gray-100, html.dark .border-gray-200, html.dark .border-nexus-border { border-color: #334155 !important; }',
    'html.dark .divide-slate-100 > *, html.dark .divide-gray-100 > * { border-color: #334155 !important; }',
    
    /* Form Elements */
    'html.dark .bg-transparent, html.dark input.bg-transparent, html.dark input:not([type=checkbox]):not([type=radio]).bg-transparent { background-color: transparent !important; }',
    'html.dark input:not([type=checkbox]):not([type=radio]), html.dark textarea, html.dark select { background-color: #0f172a !important; color: #e2e8f0 !important; border-color: #334155 !important; }',
    
    /* Settings Switches in Dark Mode */
    'html.dark .switch .slider { background-color: #475569 !important; }',
    'html.dark input:checked + .slider { background-color: #7C5CFF !important; }',
    'html.dark .switch .slider:before { background-color: #cbd5e1 !important; }',
    
    /* Shadows */
    'html.dark .shadow-sm, html.dark .shadow, html.dark .shadow-md, html.dark .shadow-lg, html.dark .shadow-xl { box-shadow: 0 4px 16px rgba(0,0,0,0.6) !important; }',
    
    /* Bottom Navigation / Top Header Borders */
    'html.dark nav, html.dark header { border-color: rgba(255,255,255,0.05) !important; }',
    
    /* Hover / Active States — imleçle üzerine gelince beyazlaşmayı önler */
    'html.dark .hover\\:bg-gray-50:hover, html.dark .hover\\:bg-slate-50:hover, html.dark .hover\\:bg-slate-100:hover { background-color: #334155 !important; }',
    'html.dark .active\\:bg-gray-50:active, html.dark .active\\:bg-slate-50:active, html.dark .active\\:bg-slate-100:active { background-color: #334155 !important; }',
    'html.dark .active\\:bg-slate-200:active, html.dark .active\\:bg-slate-300:active { background-color: #475569 !important; }'
  ].join('\n');
  var darkStyle = document.createElement('style');
  darkStyle.id = 'nexus-dark-overrides';
  darkStyle.textContent = darkCss;
  document.head.appendChild(darkStyle);

  // 2. Profile Data Loader — gerçek kullanıcı verisi (nexusUserName/nexusAvatar)
  window.addEventListener('DOMContentLoaded', () => {
    const userNameElement = document.getElementById('nexus-user-name');
    const userAvatarElement = document.getElementById('nexus-user-avatar');

    if (userNameElement || userAvatarElement) {
      const storedName = localStorage.getItem('nexusUserName') || 'Misafir';
      const storedAvatar = localStorage.getItem('nexusAvatar');

      if (userNameElement) {
        if (userNameElement.tagName === 'INPUT') {
          userNameElement.value = storedName;
        } else {
          userNameElement.textContent = storedName;
        }
      }

      if (userAvatarElement && storedAvatar) {
        userAvatarElement.src = storedAvatar;
      }
    }
  });
})();
