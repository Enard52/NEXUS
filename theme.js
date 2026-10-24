// Dil (Türkçe / English): önce kullanıcının kendi seçimi; seçim yoksa otomatik tespit.
// Türk dünyası (Türkiye, KKTC, Azerbaycan, Kazakistan, Özbekistan, Kırgızistan, Türkmenistan)
// → Türkçe; diğer tüm ülkeler → İngilizce. Tespit: cihaz dilleri, dil etiketindeki ülke ve saat dilimi.
(function () {
  var KEY = 'nexusLanguage';
  var TURKIC_LANGS = /^(tr|az|kk|uz|ky|tk|tt|ba|crh|gag)$/i;
  var TURKIC_REGIONS = /^(TR|AZ|KZ|UZ|KG|TM)$/i;
  var TURKIC_ZONES = /^(Europe\/Istanbul|Asia\/Istanbul|Asia\/Famagusta|Asia\/Baku|Asia\/(Almaty|Qyzylorda|Aqtobe|Aqtau|Atyrau|Oral|Qostanay)|Asia\/(Tashkent|Samarkand)|Asia\/Bishkek|Asia\/(Ashgabat|Ashkhabad)|Turkey)$/;
  function detect() {
    var list = [];
    try { list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]).filter(Boolean); } catch (e) {}
    for (var i = 0; i < list.length; i++) {
      var parts = String(list[i]).replace('_', '-').split('-');
      if (i === 0 && TURKIC_LANGS.test(parts[0])) return 'tr';
      for (var j = 1; j < parts.length; j++) if (TURKIC_REGIONS.test(parts[j])) return 'tr';
    }
    try { if (TURKIC_ZONES.test(Intl.DateTimeFormat().resolvedOptions().timeZone || '')) return 'tr'; } catch (e) {}
    for (var k = 1; k < list.length; k++) if (/^tr$/i.test(String(list[k]).split(/[-_]/)[0])) return 'tr';
    return 'en';
  }
  window.nexusDetectLanguage = detect;
  var lang = null;
  try { lang = localStorage.getItem(KEY); } catch (e) {}
  if (lang !== 'tr' && lang !== 'en') lang = detect();
  window.nexusLang = lang;
  window.nexusLocale = lang === 'en' ? 'en-US' : 'tr-TR';
  window.nexusT = function (tr, en) { return lang === 'en' ? en : tr; };
  window.nexusTr = function (s) { return s; }; // İngilizcede i18n.js bunu çeviriciyle değiştirir
  window.nexusSrcText = function (el) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; };
  window.NEXUS_SUPPORT_EMAIL = 'destek@nexus-ai.app'; // geri bildirim e-postalarının gideceği adres
  window.nexusSetLanguage = function (next) {
    if (next !== 'tr' && next !== 'en') return;
    try { localStorage.setItem(KEY, next); } catch (e) {}
    location.reload();
  };
  document.documentElement.setAttribute('lang', lang);
  try { if (window.nexusDesktop && typeof nexusDesktop.setLanguage === 'function') nexusDesktop.setLanguage(lang); } catch (e) {}
  if (lang === 'en' && document.readyState === 'loading' && !window.__nexusI18n) {
    document.write('<script src="lang-en.js"><\/script><script src="i18n.js"><\/script>');
  }
})();


// Global Unbreakable Image Handler
window.addEventListener('error', function(e) {
  if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
    // Yerel fotoğraf (assets/photos) yoksa önce internetteki aynı fotoğrafı dene, o da olmazsa yedek yüzeye düş
    var localPhoto = e.target.src && e.target.src.match(/assets\/photos\/(photo-[\w-]+)\.jpg/);
    if (localPhoto && !e.target.dataset.remoteTried) {
      e.target.dataset.remoteTried = 'true';
      e.target.src = 'https://images.unsplash.com/' + localPhoto[1] + '?auto=format&fit=crop&w=800&q=80';
      return;
    }
    if (e.target.dataset.fallbackApplied) return;
    e.target.dataset.fallbackApplied = 'true';
    
    const isAvatar = e.target.id.includes('avatar') || e.target.src.includes('randomuser');
    
    if (isAvatar) {
      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
    } else {
      // Çevrimdışıyken (yerel öncelikli kullanım) uzak görseller yüklenemezse
      // gri "Görsel Yüklenemedi" yazısı yerine marka renginde sakin bir yüzey göster.
      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' preserveAspectRatio='xMidYMid slice'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%234C7DFF'/%3E%3Cstop offset='1' stop-color='%2322D3EE'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='300' fill='url(%23g)'/%3E%3Ccircle cx='330' cy='55' r='95' fill='%23ffffff' fill-opacity='0.14'/%3E%3Ccircle cx='55' cy='260' r='120' fill='%23ffffff' fill-opacity='0.10'/%3E%3C/svg%3E";
      e.target.classList.add('nx-img-fallback');
      e.target.removeAttribute('srcset');
    }
  }
}, true);

// theme.js
// NEXUS Global Theme, Profile & Experience Manager

(function() {
  // Global Haptic Feedback (Vibration) & Click Sound fallback
  function triggerHaptic() {
    if (navigator.vibrate) {
      navigator.vibrate(15); // Hafif ve premium titreşim
    }
  }

  window.addEventListener('click', function(e) {
    var isInteractive = e.target.closest('button, a, input[type="range"], .cat-btn, .product-tile');
    if (isInteractive) {
      triggerHaptic();
    }
  }, { capture: true, passive: true });

  // Erişilebilirlik: role="button" verilen öğeler klavyeyle (Enter/Boşluk) de çalışsın.
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target;
    if (!el || !el.getAttribute || el.getAttribute('role') !== 'button') return;
    if (/^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    e.preventDefault();
    el.click();
  });

  // Erişilebilirlik: yalnızca ikon içeren geri butonlarına/bağlantılarına ekran okuyucu etiketi.
  function labelIconOnlyControls() {
    var nodes = document.querySelectorAll('header a, header button, nav a, nav button');
    Array.prototype.forEach.call(nodes, function(el) {
      if (el.getAttribute('aria-label') || (el.textContent || '').trim()) return;
      var icon = el.querySelector('[data-lucide], svg');
      var name = icon && icon.getAttribute ? (icon.getAttribute('data-lucide') || '') : '';
      var onclick = el.getAttribute('onclick') || '';
      var label = /chevron-left|arrow-left/.test(name) || /history\.back/.test(onclick) || el.id === 'back-button' || /back/i.test(el.id) ? 'Geri'
        : /settings/.test(name) ? 'Ayarlar'
        : /info/.test(name) ? 'Bilgi'
        : /x$|close/.test(name) ? 'Kapat'
        : /plus/.test(name) ? 'Ekle'
        : /sliders|filter/.test(name) ? 'Seçenekler'
        : /search/.test(name) ? 'Ara'
        : /menu/.test(name) ? 'Menü'
        : /bell/.test(name) ? 'Bildirimler'
        : '';
      if (label) el.setAttribute('aria-label', label);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', labelIconOnlyControls);
  else labelIconOnlyControls();

  // Global Offline Indicator
  function updateOnlineStatus() {
    var existing = document.getElementById('nexus-offline-badge');
    if (!navigator.onLine) {
      if (!existing) {
        var badge = document.createElement('div');
        badge.id = 'nexus-offline-badge';
        badge.className = 'fixed top-2 left-1/2 -translate-x-1/2 z-[999] bg-red-500/90 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur flex items-center gap-1';
        badge.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg> Çevrimdışı (Yerel Mod)';
        document.body.appendChild(badge);
      }
    } else if (existing) {
      existing.remove();
    }
  }
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  window.addEventListener('load', updateOnlineStatus);
  // 1. Dark Mode Logic
  function applyTheme() {
    const get = function (k) { return typeof nexusGetItem === 'function' ? nexusGetItem(k) : localStorage.getItem(k); };
    const useSystem = get('nexusThemeSystem') === 'true' && window.matchMedia;
    const isDark = useSystem ? window.matchMedia('(prefers-color-scheme: dark)').matches : get('nexusDarkMode') === 'true';
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
  // Sistem temasıyla eşleştirme açıkken işletim sistemi teması değişince hemen uygula
  if (window.matchMedia) {
    var nxMq = window.matchMedia('(prefers-color-scheme: dark)');
    if (nxMq.addEventListener) nxMq.addEventListener('change', applyTheme);
  }

  // Configure Tailwind for dark mode class.
  // ÖNEMLİ: Sayfanın kendi tailwind.config'ini EZME — birleştir.
  // (Aksi halde nexus-purple gibi sayfa renkleri kaybolur ve seçili öğeler görünmez olur.)
  if (typeof tailwind !== 'undefined') {
    var cfg = tailwind.config || {};
    cfg.darkMode = 'class';
    cfg.theme = cfg.theme || {};
    cfg.theme.extend = cfg.theme.extend || {};
    cfg.theme.extend.colors = Object.assign({}, cfg.theme.extend.colors, {
      nexusPurple: '#4C7DFF',
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
    /* Tam sayfa paneller (ör. Ev Yönetimi detay paneli #home-detail) bg-gradient-custom'u body'de değil div'de kullanır; koyu temada da koyulaştır */
    'html.dark .bg-gradient-custom { background: linear-gradient(180deg, #020617 0%, #0f172a 100%) !important; }',
    'html.dark body.bg-smart-gradient { background: linear-gradient(180deg, #020617 0%, #0f172a 100%) !important; }',
    
    /* General Backgrounds */
    'html.dark .bg-white { background-color: #1e293b !important; border-color: rgba(255,255,255,0.05) !important; }',
    'html.dark [class*="bg-white/"] { background-color: rgba(30,41,59,0.85) !important; border-color: rgba(255,255,255,0.05) !important; }',
    'html.dark .bg-slate-50, html.dark .bg-slate-100, html.dark .bg-gray-50, html.dark .bg-gray-100 { background-color: #334155 !important; }',
    'html.dark .bg-slate-200, html.dark .bg-slate-300 { background-color: #475569 !important; }',
    /* Yarı saydam açık zeminler (örn. bg-slate-50/50 üst başlıklar) */
    'html.dark [class*="bg-slate-50/"], html.dark [class*="bg-gray-50/"], html.dark [class*="bg-slate-100/"] { background-color: rgba(30,41,59,0.7) !important; }',
    /* Yarı saydam koyu-gri zeminler (ör. hızlı aksiyon kapat butonu bg-slate-200/60) — koyu temada görünür olsun */
    'html.dark [class*="bg-slate-200/"], html.dark [class*="bg-slate-300/"] { background-color: #475569 !important; }',
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
    'html.dark .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9); }',
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
    'html.dark .border-slate-50, html.dark .border-slate-100, html.dark .border-slate-200, html.dark .border-gray-50, html.dark .border-gray-100, html.dark .border-gray-200, html.dark .border-nexus-border { border-color: #334155 !important; }',
    'html.dark .divide-slate-100 > *, html.dark .divide-gray-100 > * { border-color: #334155 !important; }',
    
    /* Form Elements */
    'html.dark .bg-transparent, html.dark input.bg-transparent, html.dark input:not([type=checkbox]):not([type=radio]).bg-transparent { background-color: transparent !important; }',
    'html.dark input:not([type=checkbox]):not([type=radio]), html.dark textarea, html.dark select { background-color: #0f172a !important; color: #e2e8f0 !important; border-color: #334155 !important; }',
    
    /* Settings Switches in Dark Mode */
    'html.dark .switch .slider { background-color: #475569 !important; }',
    'html.dark input:checked + .slider { background-color: #4C7DFF !important; }',
    'html.dark .switch .slider:before { background-color: #cbd5e1 !important; }',
    
    /* Shadows */
    'html.dark .shadow-sm, html.dark .shadow, html.dark .shadow-md, html.dark .shadow-lg, html.dark .shadow-xl { box-shadow: 0 4px 16px rgba(0,0,0,0.6) !important; }',
    
    /* Bottom Navigation / Top Header Borders */
    'html.dark nav, html.dark header { border-color: rgba(255,255,255,0.05) !important; }',
    
    /* Hover / Active States — imleçle üzerine gelince beyazlaşmayı önler */
    'html.dark .hover\\:bg-gray-50:hover, html.dark .hover\\:bg-slate-50:hover, html.dark .hover\\:bg-slate-100:hover { background-color: #334155 !important; }',
    'html.dark .active\\:bg-gray-50:active, html.dark .active\\:bg-slate-50:active, html.dark .active\\:bg-slate-100:active { background-color: #334155 !important; }',
    'html.dark .active\:bg-slate-200:active, html.dark .active\:bg-slate-300:active { background-color: #475569 !important; }',
    'html.dark .bg-dashboard-gradient { background: linear-gradient(180deg, #020617 0%, #0f172a 100%) !important; }',
    'html.dark .divide-slate-50 > * + * { border-color: #334155 !important; }'
  ].join('\n');
  var darkStyle = document.createElement('style');
  darkStyle.id = 'nexus-dark-overrides';
  darkStyle.textContent = darkCss;
  document.head.appendChild(darkStyle);

  // Temel düzen kuralları (tema bağımsız):
  // scrollbar-gutter, kaydırma çubuğu belirip kaybolurken sayfa genişliğinin
  // sekme geçişlerinde oynamasını engeller (masaüstü/geniş ekran).
  var baseStyle = document.createElement('style');
  baseStyle.id = 'nexus-base-layout';
  baseStyle.textContent = [
    'html { scrollbar-gutter: stable; }',
    /* Alt gezinme sekmeleri: geçiş/animasyon yok; yalnızca dokununca (aktifken) mor renk */
    'nav[data-purpose="bottom-nav"] a { transition: none !important; }',
    'nav[data-purpose="bottom-nav"] a:active, nav[data-purpose="bottom-nav"] a:active i, nav[data-purpose="bottom-nav"] a:active span { color: #4C7DFF !important; }',
    /* Tarayıcıların varsayılan şifre gösterme göz ikonunu gizle (Çift göz çıkmasını engeller) */
    'input[type="password"]::-ms-reveal, input[type="password"]::-ms-clear { display: none !important; }',
    'input[type="password"]::-webkit-contacts-auto-fill-button, input[type="password"]::-webkit-credentials-auto-fill-button { visibility: hidden !important; display: none !important; pointer-events: none !important; }'
  ].join('\n');
  document.head.appendChild(baseStyle);

  // 1.5 Gerçek Bildirim Rozeti — Mesaj Merkezi'ne giden her bağlantıda (zil, liste satırı vb.)
  // okunmamış bildirim varsa kırmızı nokta gösterir. Veri tamamen gerçek:
  // nexusEvents (olay akışı) + nexusReadNotifs (okunan bildirim id'leri).
  var badgeStyle = document.createElement('style');
  badgeStyle.id = 'nexus-badge-style';
  badgeStyle.textContent = [
    '.nexus-badge-host { position: relative; display: inline-flex; }',
    '.nav-badge {',
    '  position: absolute; top: -2px; right: -2px;',
    '  width: 10px; height: 10px; border-radius: 9999px;',
    '  background: #FF3B5C; border: 2px solid #ffffff;',
    '  z-index: 10; transform: scale(0); animation: nexusBadgePop 0.3s forwards;',
    '}',
    'html.dark .nav-badge { border-color: #0f172a; }',
    '@keyframes nexusBadgePop { to { transform: scale(1); } }'
  ].join('\n');
  document.head.appendChild(badgeStyle);

  function updateNavBadge() {
    var links = document.querySelectorAll('a[href="stitch-messages.html"]');
    if (!links.length) return;

    var readSet = [];
    try { readSet = JSON.parse(nexusGetItem('nexusReadNotifs') || '[]'); } catch (e) {}
    if (!Array.isArray(readSet)) readSet = [];

    var events = [];
    try { events = JSON.parse(nexusGetItem('nexusEvents') || '[]'); } catch (e) {}
    if (!Array.isArray(events)) events = [];
    var hasUnread = events.some(function (ev) { return readSet.indexOf(ev.id) === -1; });

    Array.prototype.forEach.call(links, function (link) {
      var badge = link.querySelector('.nav-badge');
      if (hasUnread) {
        if (badge) return;
        // Rozeti bağlantının ikonuna sabitle (ikon yoksa bağlantının kendisine)
        var host = link.querySelector('.nexus-badge-host');
        if (!host) {
          var icon = link.querySelector('svg, i[data-lucide]');
          host = document.createElement('span');
          host.className = 'nexus-badge-host';
          if (icon && icon.parentNode) {
            icon.parentNode.insertBefore(host, icon);
            host.appendChild(icon);
          } else {
            link.appendChild(host);
          }
        }
        host.insertAdjacentHTML('beforeend', '<span class="nav-badge"></span>');
      } else if (badge) {
        badge.remove();
      }
    });
  }
  // Sayfa içi güncelleme için dışarı aç (örn. mesajlar sayfası okundu işaretleyince)
  window.nexusUpdateNavBadge = updateNavBadge;

  function startBadgeWatch() {
    updateNavBadge();
    // Aynı sekmede yeni olay eklenirse yakalamak için hafif polling
    setInterval(updateNavBadge, 2000);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startBadgeWatch);
  } else {
    startBadgeWatch();
  }
  // Başka sekmede okundu/eklendi ise anında yansıt
  window.addEventListener('storage', function (e) {
    if (e.key === 'nexusEvents' || e.key === 'nexusReadNotifs') updateNavBadge();
  });

  // 2. Profile Data Loader — gerçek kullanıcı verisi (nexusUserName/nexusAvatar)
  window.addEventListener('DOMContentLoaded', () => {
    const userNameElement = document.getElementById('nexus-user-name');
    const userAvatarElement = document.getElementById('nexus-user-avatar');

    if (userNameElement || userAvatarElement) {
      const storedName = nexusGetItem('nexusUserName') || 'Misafir';
      const storedAvatar = nexusGetItem('nexusAvatar');

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


// Masaüstü düzeni (≥1024px): ortak stil + sol menü. Telefon görünümünü etkilemez.
// Stil ve betik head ayrıştırılırken (document.write) eklenir: çözülmeleri boyamayı
// engeller. Geç yüklenen dinamik eklemede masaüstü düzeni ilk boyamadan sonra
// uygulanıp içeriği bir kez daha kaydırıyordu; sayfalar arası geçişler sabit kalsın.
(function () {
  if (document.getElementById('nexus-desktop-css')) return;
  if (window.matchMedia && window.matchMedia('(min-width: 1024px)').matches) document.documentElement.classList.add('nx-desk');
  if (document.readyState === 'loading') {
    document.write('<link id="nexus-desktop-css" rel="stylesheet" href="css/nexus-desktop.css"><script src="desktop.js"><\/script>');
  } else {
    var link = document.createElement('link');
    link.id = 'nexus-desktop-css';
    link.rel = 'stylesheet';
    link.href = 'css/nexus-desktop.css';
    document.head.appendChild(link);
    var s = document.createElement('script');
    s.src = 'desktop.js';
    document.head.appendChild(s);
  }
})();

// Marka uyumlu bilgi paneli (tarayıcının alert() kutusu yerine). Kullanım: nexusInfo(başlık, metin, [düğmeler])
// düğmeler: [{ label, href?, onClick?, primary? }]
window.nexusInfo = function (title, text, actions) {
  var old = document.getElementById('nx-info');
  if (old) old.remove();
  var dark = document.documentElement.classList.contains('dark');
  var wrap = document.createElement('div');
  wrap.id = 'nx-info';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:10050;display:flex;align-items:flex-end;justify-content:center;background:rgba(15,23,42,.45);padding:16px;';
  var card = document.createElement('div');
  card.style.cssText = 'width:100%;max-width:440px;border-radius:28px;padding:22px 20px 18px;font-family:Inter,sans-serif;box-shadow:0 20px 50px rgba(15,23,42,.25);' +
    (dark ? 'background:#0f172a;color:#f8fafc;border:1px solid rgba(148,163,184,.18);' : 'background:#fff;color:#0f172a;');
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var btns = (actions && actions.length ? actions : [{ label: 'Tamam', primary: true }]).map(function (a, i) {
    return '<button type="button" data-i="' + i + '" style="flex:1;min-height:46px;border-radius:9999px;font-weight:700;font-size:14px;' +
      (a.primary ? 'background:#4C7DFF;color:#fff;' : (dark ? 'background:#1e293b;color:#e2e8f0;' : 'background:#f1f5f9;color:#334155;')) + '">' + esc(a.label) + '</button>';
  }).join('');
  card.innerHTML = '<p style="font-size:17px;font-weight:800;margin:0 0 8px">' + esc(title) + '</p>' +
    '<p style="font-size:14px;line-height:1.55;margin:0 0 18px;opacity:.82">' + esc(text) + '</p>' +
    '<div style="display:flex;gap:10px">' + btns + '</div>';
  wrap.appendChild(card);
  var close = function () { wrap.remove(); };
  wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
  card.querySelectorAll('button').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = (actions && actions[+b.getAttribute('data-i')]) || {};
      close();
      if (a.onClick) a.onClick();
      if (a.href) location.href = a.href;
    });
  });
  document.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } });
  document.body.appendChild(wrap);
  var first = card.querySelector('button[data-i]');
  if (first) first.focus();
};

// Panoya kopyalama: izin yoksa eski yönteme düşer; sonucu Promise<boolean> olarak döner.
window.nexusCopy = function (text) {
  function legacy() {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
      document.body.appendChild(ta); ta.select();
      var ok = document.execCommand('copy'); ta.remove();
      return ok;
    } catch (e) { return false; }
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacy(); });
  }
  return Promise.resolve(legacy());
};

// Giriş / kayıt / tanıtım ekranlarında dil seçimi (Ayarlar'a ulaşmadan önce gerekir)
(function () {
  var page = (location.pathname.split('/').pop() || '').toLowerCase();
  var AUTH = ['stitch-login.html', 'stitch-register.html', 'stitch-forgot-password.html', 'stitch-onboarding.html'];
  if (AUTH.indexOf(page) === -1) return;
  function add() {
    if (document.getElementById('nx-lang-switch')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'nx-lang-switch';
    b.setAttribute('data-no-i18n', '');
    b.setAttribute('aria-label', window.nexusLang === 'en' ? 'Türkçe\'ye geç' : 'Switch to English');
    b.innerHTML = '<span' + (window.nexusLang === 'tr' ? ' class="on"' : '') + '>TR</span><span' + (window.nexusLang === 'en' ? ' class="on"' : '') + '>EN</span>';
    b.addEventListener('click', function () { nexusSetLanguage(window.nexusLang === 'en' ? 'tr' : 'en'); });
    document.body.appendChild(b);
  }
  var css = document.createElement('style');
  css.textContent = '#nx-lang-switch{position:fixed;top:calc(env(safe-area-inset-top,0px) + 14px);right:14px;z-index:60;display:flex;gap:2px;padding:3px;border-radius:999px;border:1px solid rgba(148,163,184,.35);background:rgba(255,255,255,.78);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font:600 12px/1 Inter,system-ui,sans-serif;color:#64748b;cursor:pointer}' +
    '#nx-lang-switch span{padding:6px 9px;border-radius:999px}#nx-lang-switch span.on{background:#4C7DFF;color:#fff}' +
    'html.dark #nx-lang-switch{background:rgba(15,23,42,.72);border-color:rgba(148,163,184,.25);color:#94a3b8}';
  document.head.appendChild(css);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
})();

// Masaüstü uygulamasında Ctrl+K komut paleti (yalnızca Electron + geniş ekran)
(function () {
  if (!window.nexusDesktop || !window.matchMedia || !window.matchMedia('(min-width: 1024px)').matches) return;
  var s = document.createElement('script');
  s.src = 'command-palette.js';
  s.defer = true;
  (document.head || document.documentElement).appendChild(s);
})();
