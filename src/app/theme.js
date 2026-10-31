// Dil: Türkçe cihaz veya Türkçe bölge etiketi Türkçe açılır ve dil seçebilir.
// Bunun dışındaki herkes sabit İngilizce görür; dil listesi ve Türkçe seçeneği yoktur.
(function () {
  var KEY = 'nexusLanguage';
  var TURKIC_LANGS = /^(tr|az|kk|uz|ky|tk|tt|ba|crh|gag)$/i;
  var TURKIC_REGIONS = /^(TR|AZ|KZ|UZ|KG|TM)$/i;
  function detect() {
    var list = [];
    try { list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]).filter(Boolean); } catch (e) {}
    for (var i = 0; i < list.length; i++) {
      var parts = String(list[i]).replace('_', '-').split('-');
      if (i === 0 && TURKIC_LANGS.test(parts[0])) return 'tr';
      for (var j = 1; j < parts.length; j++) if (TURKIC_REGIONS.test(parts[j])) return 'tr';
    }
    for (var k = 1; k < list.length; k++) if (TURKIC_LANGS.test(String(list[k]).split(/[-_]/)[0])) return 'tr';
    return 'en';
  }
  window.nexusDetectLanguage = detect;
  var home = detect();
  window.nexusHomeLang = home;
  var lang = null;
  try { lang = localStorage.getItem(KEY); } catch (e) {}
  if (lang !== 'tr' && lang !== 'en') {
    // İlk ziyaret: Türkçe bölge Türkçe başlar, diğerleri İngilizce.
    // Dil seçeneği tüm kullanıcılara açık; seçim saklanır ve sonraki açılışta korunur.
    lang = home === 'tr' ? 'tr' : 'en';
  }
  window.nexusLang = lang;
  window.nexusLocale = lang === 'en' ? 'en-US' : 'tr-TR';
  window.nexusT = function (tr, en) { return lang === 'en' ? en : tr; };
  window.nexusTr = function (s) { return s; }; // İngilizcede i18n.js bunu çeviriciyle değiştirir
  window.nexusSrcText = function (el) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; };
  window.NEXUS_SUPPORT_EMAIL = 'nexus.smarthome.app@gmail.com'; // geri bildirim e-postalarının gideceği adres
  // NEXUS AI puanı: ücretsizde günde 30, NEXUS+ aboneliğinde ayda 2000 (abonelik sunucudan gelir).
  window.nexusPoints = (function () {
    var KEY = 'nexusAiPoints';
    function plus() { try { return !!window.nexusGetItem('nexusPlusPlan'); } catch (e) { return false; } }
    function limit() { return plus() ? 2000 : 30; }
    function stamp() {
      var iso = new Date().toISOString();
      return plus() ? iso.slice(0, 7) : iso.slice(0, 10); // abonelikte ay, değilse gün
    }
    function read() {
      var raw = null;
      try { raw = JSON.parse(window.nexusGetItem(KEY) || 'null'); } catch (e) {}
      if (!raw || raw.date !== stamp()) raw = { date: stamp(), used: 0 };
      return raw;
    }
    return {
      limit: limit,
      isPlus: plus,
      used: function () { return read().used; },
      left: function () { return Math.max(0, limit() - read().used); },
      use: function () {
        var p = read();
        p.used = Math.min(limit(), p.used + 1);
        try { window.nexusSetItem(KEY, JSON.stringify(p)); } catch (e) {}
      },
      resetNote: function () { return plus() ? window.nexusT('Aylık sıfırlama', 'Monthly reset') : window.nexusT('Günlük sıfırlama', 'Daily reset'); },
      exhaustedText: function () { return plus() ? window.nexusT('Aylık hakkın doldu, ay başında sıfırlanır', 'Monthly allowance used up; resets next month') : window.nexusT('Günlük hakkın doldu, yarın sıfırlanır', 'Daily allowance used up; resets tomorrow'); },
    };
  })();
  window.nexusSetLanguage = function (next) {
    // Dil seçimi tüm kullanıcılara açık: EN kullanıcısı TR'ye, TR kullanıcısı EN'ye geçebilir.
    if (next !== 'tr' && next !== 'en') return;
    try { localStorage.setItem(KEY, next); } catch (e) {}
    location.reload();
  };
  document.documentElement.setAttribute('lang', lang);
  try { if (window.nexusDesktop && typeof nexusDesktop.setLanguage === 'function') nexusDesktop.setLanguage(lang); } catch (e) {}
  if (lang === 'en' && document.readyState === 'loading' && !window.__nexusI18n) {
    document.write('<script src="lang-en.js"><\/script><script src="i18n.js"><\/script>');
  }
  var previewShell = false;
  try { previewShell = !!window.nexusPreview || window.self !== window.top || /[?&](preview|demo)=1/.test(location.search) || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('nexusPreviewMode') === '1'); } catch (e) { previewShell = true; }
  // Hesap senkronu her sayfada çalışsın (giriş yapılmışsa): cloud-sync.js kendini iki kez kurmaz.
  // Site önizlemesinde bulut ve bildirim kanalları açılmaz — özellik kilitlidir.
  if (!previewShell && document.readyState === 'loading' && !window.nexusCloud && !window.__nexusCloudLoading) {
    window.__nexusCloudLoading = true;
    document.write('<script src="cloud-config.js"><\/script><script src="cloud-sync.js"><\/script>');
  }
  // Dışa dönük bildirim kanalları (ntfy / webhook / Telegram) her sayfada dinlesin.
  if (!previewShell && document.readyState === 'loading' && !window.nexusNotify && !window.__nexusNotifyLoading) {
    window.__nexusNotifyLoading = true;
    document.write('<script src="notify.js"><\/script>');
  }
  // Push (FCM): uygulama kapalıyken aile olayı/sohbet bildirimi. Config yoksa
  // push.js kendini kapatır (no-op) — yalnızca dosya yüklenir.
  if (!previewShell && document.readyState === 'loading' && !window.nexusPush && !window.__nexusPushLoading) {
    window.__nexusPushLoading = true;
    document.write('<script src="push.js"><\/script>');
  }
  // Aile (çok kullanıcılı ev, izinler, sohbet bildirimi): oturum yoksa kendini devre dışı bırakır.
  if (!previewShell && document.readyState === 'loading' && !window.nexusHouseholdCloud && !window.__nexusHouseholdLoading) {
    window.__nexusHouseholdLoading = true;
    document.write('<script src="household-cloud.js"><\/script>');
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
  // Global Haptic Feedback (Vibration); tap sesi nexus-feedback.js nav() ile
  // aynı yakalayıcıdan yönlendirilir (aşağıdaki click dinleyicisine bakınız).
  function triggerHaptic(style) {
    // Ayarlar → "Ses ve Hareket": Titreşim kapatıldıysa hiçbir yolla titreşme.
    try {
      var hKey = typeof nexusGetItem === 'function' ? nexusGetItem('nexusHapticsEnabled') : localStorage.getItem('nexusHapticsEnabled');
      if (hKey === 'false') return;
    } catch (e2) {}
    try {
      var cap = window.Capacitor;
      if (cap && cap.Plugins && cap.Plugins.Haptics && typeof cap.Plugins.Haptics.impact === 'function') {
        cap.Plugins.Haptics.impact({ style: style === 'medium' ? 'MEDIUM' : 'LIGHT' });
        return;
      }
    } catch (e) {}
    if (navigator.vibrate) {
      navigator.vibrate(style === 'medium' ? 25 : 12); // Hafif ve premium titreşim
    }
  }
  window.nexusHaptic = triggerHaptic;

  window.addEventListener('click', function(e) {
    var isInteractive = e.target.closest('button, a, input[type="range"], .cat-btn, .product-tile, input[type="checkbox"]');
    if (isInteractive) {
      triggerHaptic();
      // Dokunma sesi: nexusFeedback.nav kendi anahtarını (nexusTapSoundsEnabled)
      // ve aynı jestteki sonuç sesiyle çakışmayı denetler; burada sadece köprü kurarız.
      if (window.nexusFeedback && typeof window.nexusFeedback.nav === 'function') {
        try { window.nexusFeedback.nav(); } catch (e3) {}
      }
    }
  }, { capture: true, passive: true });

  // Android Donanım Geri Tuşu ve Escape tuşu yönetimi
  function setupBackButton() {
    function handleBack() {
      // 0. Ortak katmanlar (nexus-dialog, komut paleti) açıkken genel geri davranışı
      // devreye girmez: onlar kendi kapanışlarını yapar. Kapalı olmayan balonlu
      // gönderim kullanılır ki theme.js'in kendi Escape dinleyicisi çift tetiklenmesin.
      if (document.querySelector('.nx-dlg-back')) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: false, cancelable: true }));
        return;
      }
      var palette = document.getElementById('nx-palette');
      if (palette && palette.classList.contains('open')) {
        var palInput = palette.querySelector('.nx-pal-input');
        if (palInput) palInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: false, cancelable: true }));
        return;
      }

      // 1. Açık olan alt çekmece, modal veya dialogları kapat
      var openOverlay = document.querySelector(
        '.dialog-overlay:not(.hidden), .sheet.open, .qa-sheet.open, #loading-overlay[style*="flex"], .modal:not(.hidden)'
      );
      if (openOverlay) {
        var closeBtn = openOverlay.querySelector('[onclick*="close"], [onclick*="hide"], [onclick*="toggle"], button');
        if (closeBtn) {
          closeBtn.click();
          return;
        }
        openOverlay.classList.add('hidden');
        if (openOverlay.classList.contains('open')) openOverlay.classList.remove('open');
        return;
      }

      // 2. Alt sayfadaysak tarayıcı geçmişinde geri git
      var isHome = window.location.pathname.indexOf('nexus-home.html') !== -1 || window.location.pathname === '/' || window.location.pathname.endsWith('/index.html');
      if (!isHome && window.history.length > 1) {
        window.history.back();
        return;
      }

      // 3. Ana sayfadaysak çift basışla çıkış
      var now = Date.now();
      if (window._nexusLastBack && (now - window._nexusLastBack < 2000)) {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
          window.Capacitor.Plugins.App.exitApp();
        }
      } else {
        window._nexusLastBack = now;
      }
    }

    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('backButton', handleBack);
      }
    } catch (e) {}

    window.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') handleBack();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupBackButton);
  else setupBackButton();

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
    // Masaüstü: pencere düğmelerinin simge rengi temaya uysun
    try { if (window.nexusDesktop && typeof nexusDesktop.setTitleTheme === 'function') nexusDesktop.setTitleTheme(!!isDark); } catch (e) {}
  }

  // Masaüstü uygulaması: sistem başlık çubuğu gizli olduğundan pencereyi sürüklemek için üstte ince bir tutamaç.
  // Sağdaki 150px küçült/büyüt/kapat düğmelerine bırakılır; çift tıklama pencereyi büyütür/küçültür (sistem davranışı).
  function addDesktopDragStrip() {
    try {
      if (!window.nexusDesktop || document.getElementById('nx-drag-strip')) return;
      document.documentElement.classList.add('nx-electron');
      var mac = /Mac/i.test(navigator.platform || '');
      var strip = document.createElement('div');
      strip.id = 'nx-drag-strip';
      strip.setAttribute('aria-hidden', 'true');
      strip.style.cssText = 'position:fixed;top:0;left:0;right:' + (mac ? '0' : '150px') + ';height:14px;z-index:2147483000;-webkit-app-region:drag;';
      document.body.appendChild(strip);
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addDesktopDragStrip);
  else addDesktopDragStrip();

  // Alt sayfaların tutamaçla sürüklenip kapatılması her sayfada çalışsın: ortak jest dosyası yoksa yüklenir
  // (kendi sayfasında zaten yükleyenlerde dosya iki kez çalışmaz; kendini korur).
  if (!window.NexusSheetGestures && !document.querySelector('script[src$="sheet-gestures.js"]')) {
    var sg = document.createElement('script');
    sg.src = 'sheet-gestures.js';
    document.head.appendChild(sg);
  }
  // Alt çekmecelerde odak yönetimi (içeri taşı, Tab'ı tut, kapanınca geri ver).
  if (!window.NexusSheetFocus) {
    var sf = document.createElement('script');
    sf.src = 'sheet-focus.js';
    document.head.appendChild(sf);
  }

  // Hareket efektleri anahtarı (Ayarlar → Ses ve Hareket → Animasyonlar):
  // kapalıysa html.nx-no-anim eklenir; css/nexus-ui.css'teki ortak kural tüm
  // dekoratif hareketi durdurur. İşletim sistemi "hareketi azalt" istiyorsa
  // anahtar ne olursa olsun kapanır. Boyamadan önce uygulanır (kayma olmasın).
  function applyMotion() {
    var off = false;
    try {
      var mKey = typeof nexusGetItem === 'function' ? nexusGetItem('nexusAnimationsEnabled') : localStorage.getItem('nexusAnimationsEnabled');
      off = mKey === 'false';
    } catch (e) {}
    if (!off && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) off = true;
    document.documentElement.classList.toggle('nx-no-anim', off);
  }
  applyMotion();

  // Erişilebilirlik Modu anahtarı (Ayarlar → Erişilebilirlik Modu): açıksa html.nx-a11y
  // eklenir; css/nexus-ui.css'teki ortak kural seti metin ölçeğini büyütür, odak
  // halkalarını belirginleştirir ve dekoratif hareketi kısar. Boyamadan önce uygulanır.
  function applyAccessibility() {
    var on = false;
    try {
      var aKey = typeof nexusGetItem === 'function' ? nexusGetItem('nexusAccessibilityMode') : localStorage.getItem('nexusAccessibilityMode');
      on = aKey === 'true';
    } catch (e) {}
    document.documentElement.classList.toggle('nx-a11y', on);
  }
  applyAccessibility();

  // Yazı boyutu (Ayarlar → Görünüm ve Genel): small | normal | large. Kök yazı boyutunu
  // yüzdeyle ölçekler (rem kullanan her şey birlikte büyür). Erişilebilirlik Modu açıksa
  // onun kendi %112,5 ölçeği geçerli kalır.
  function applyFontScale() {
    var v = 'normal';
    try { v = (typeof nexusGetItem === 'function' ? nexusGetItem('nexusFontScale') : localStorage.getItem('nexusFontScale')) || 'normal'; } catch (e) {}
    var pct = v === 'small' ? '93.75%' : v === 'large' ? '106.25%' : '';
    document.documentElement.style.fontSize = pct;
  }
  applyFontScale();
  window.addEventListener('nexusFontScaleChanged', applyFontScale);

  // Vurgu rengi (Ayarlar → Görünüm ve Genel → Vurgu Rengi): hazır, beyaz yazıyla okunur renklerden biri.
  // css/nexus-ui.css'teki örtü katmanı ve var(--nx-accent) kullanan kurallar bu değişkenleri okur;
  // varsayılan (mavi) seçiliyken hiçbir şey eklenmez.
  var NX_ACCENTS = { blue: '#4C7DFF', purple: '#7C5CFC', green: '#12906B', orange: '#D9531E', pink: '#D6336C', teal: '#0E8A9A' };
  window.NEXUS_ACCENTS = NX_ACCENTS;
  function applyAccent() {
    var key = 'blue';
    try { key = (typeof nexusGetItem === 'function' ? nexusGetItem('nexusAccent') : localStorage.getItem('nexusAccent')) || 'blue'; } catch (e) {}
    var st = document.documentElement.style;
    var hex = NX_ACCENTS[key];
    // Serbest renk: "#rrggbb". Beyaz yazı okunur kalsın diye çok açık renkler koyulaştırılır.
    if (!hex && /^#[0-9a-fA-F]{6}$/.test(key)) {
      var cn = parseInt(key.slice(1), 16), cr = cn >> 16, cg = (cn >> 8) & 255, cb = cn & 255;
      var lum = function () {
        var f = function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(cr) + 0.7152 * f(cg) + 0.0722 * f(cb);
      };
      // Beyazla kontrast >= 3 için luminans <= 0.30
      for (var i = 0; i < 20 && lum() > 0.30; i++) { cr = Math.round(cr * 0.92); cg = Math.round(cg * 0.92); cb = Math.round(cb * 0.92); }
      hex = '#' + ((1 << 24) | (cr << 16) | (cg << 8) | cb).toString(16).slice(1);
    }
    if (!hex || key === 'blue') {
      ['--nx-accent', '--nx-accent-rgb', '--nx-accent-rgbc', '--nx-accent-press'].forEach(function (p) { st.removeProperty(p); });
      return;
    }
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var dark = function (c) { return Math.round(c * 0.88); };
    st.setProperty('--nx-accent', hex);
    st.setProperty('--nx-accent-rgb', r + ' ' + g + ' ' + b);
    st.setProperty('--nx-accent-rgbc', r + ',' + g + ',' + b);
    st.setProperty('--nx-accent-press', 'rgb(' + dark(r) + ',' + dark(g) + ',' + dark(b) + ')');
  }
  applyAccent();
  window.addEventListener('nexusAccentChanged', applyAccent);
  window.addEventListener('storage', function (e) { if (e.key === 'nexusAccent') applyAccent(); });

  // Sahibin kararı (30 Eki 2026): uygulama her yerde varsayılan OLARAK AÇIK temayla
  // açılır. Kodda varsayılan zaten açıktı; kullanıcılarında kalmış eski "koyu"
  // tercihi de bir kez aydınlatılır (isteyen Ayarlar'dan yeniden koyuya dönebilir).
  // Tek seferlik göç: işaret bırakılır, sonraki tercihler dokunulmaz.
  try {
    const resetKey = 'nexusLightDefault20261030';
    const store = typeof nexusGetItem === 'function' ? {
      get: nexusGetItem, set: nexusSetItem,
    } : {
      get: (k) => localStorage.getItem(k), set: (k, v) => localStorage.setItem(k, v),
    };
    if (store.get(resetKey) !== '1') {
      if (store.get('nexusDarkMode') === 'true' || store.get('nexusThemeSystem') === 'true') {
        store.set('nexusDarkMode', 'false');
        store.set('nexusThemeSystem', 'false');
      }
      store.set(resetKey, '1');
    }
  } catch (resetErr) { /* depolama kapalıysa varsayılan açık tema zaten geçerli */ }

  // Apply immediately to avoid flicker
  applyTheme();

  // Watch for changes across tabs/iframes
  window.addEventListener('storage', (e) => {
    if (e.key === 'nexusDarkMode') {
      applyTheme();
    }
    if (e.key === 'nexusAnimationsEnabled') {
      applyMotion();
    }
    if (e.key === 'nexusAccessibilityMode') {
      applyAccessibility();
    }
  });
  // Aynı sekmedeki Ayarlar değişikliği (Ayarlar sayfası olayı gönderir)
  window.addEventListener('nexusMotionChanged', applyMotion);
  window.addEventListener('nexusAccessibilityChanged', applyAccessibility);
  
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
    /* #a8b4c6: #334155 yüzeyinde bile >= 4.5:1 (eski #94a3b8 orada 4.04 idi) */
    'html.dark .text-slate-500, html.dark .text-slate-400, html.dark .text-gray-500, html.dark .text-gray-400 { color: #a8b4c6 !important; }',
    /* Sayfa özel metin tokenları (örn. menü: text-primary #111827) */
    'html.dark .text-text-primary { color: #f8fafc !important; }',
    'html.dark .text-text-secondary { color: #a8b4c6 !important; }',
    /* Vurgu renkli METİN koyu yüzeylerde 2.8-3.9:1 kalıyordu; vurguyu beyazla açarak >= 4.5:1 */
    'html.dark [class*="text-[#4C7DFF]"], html.dark .text-nexus-purple { color: #9db8ff !important; color: color-mix(in srgb, var(--nx-accent,#4C7DFF) 55%, #fff) !important; }',
    /* Açık amber uyarı kutusu koyu modda açık kalıp metni (açık renk) görünmez yapıyordu */
    'html.dark .bg-amber-50 { background-color: rgba(245,158,11,0.14) !important; }',
    'html.dark .border-amber-200 { border-color: rgba(245,158,11,0.35) !important; }',

    /* Borders */
    'html.dark .border-slate-50, html.dark .border-slate-100, html.dark .border-slate-200, html.dark .border-gray-50, html.dark .border-gray-100, html.dark .border-gray-200, html.dark .border-nexus-border { border-color: #334155 !important; }',
    'html.dark .divide-slate-100 > *, html.dark .divide-gray-100 > * { border-color: #334155 !important; }',
    
    /* Form Elements */
    'html.dark .bg-transparent, html.dark input.bg-transparent, html.dark input:not([type=checkbox]):not([type=radio]).bg-transparent { background-color: transparent !important; }',
    'html.dark input:not([type=checkbox]):not([type=radio]), html.dark textarea, html.dark select { background-color: #0f172a !important; color: #e2e8f0 !important; border-color: #334155 !important; }',
    
    /* Settings Switches in Dark Mode */
    'html.dark .switch .slider { background-color: #475569 !important; }',
    'html.dark input:checked + .slider { background-color: var(--nx-accent,#4C7DFF) !important; }',
    'html.dark .switch .slider:before { background-color: #cbd5e1 !important; }',
    
    /* Shadows */
    'html.dark .shadow-sm, html.dark .shadow, html.dark .shadow-md, html.dark .shadow-lg, html.dark .shadow-xl { box-shadow: 0 4px 16px rgba(0,0,0,0.6) !important; }',
    
    /* Bottom Navigation / Top Header Borders */
    'html.dark nav, html.dark header { border-color: rgba(255,255,255,0.05) !important; }',
    
    /* Hover / Active States — imleçle üzerine gelince beyazlaşmayı önler */
    'html.dark .hover\\:bg-gray-50:hover, html.dark .hover\\:bg-slate-50:hover, html.dark .hover\\:bg-slate-100:hover { background-color: #334155 !important; }',
    'html.dark .active\\:bg-gray-50:active, html.dark .active\\:bg-slate-50:active, html.dark .active\\:bg-slate-100:active { background-color: #334155 !important; }',
    'html.dark .active\\:bg-slate-200:active, html.dark .active\\:bg-slate-300:active { background-color: #475569 !important; }',
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
    'nav[data-purpose="bottom-nav"] a:active, nav[data-purpose="bottom-nav"] a:active i, nav[data-purpose="bottom-nav"] a:active span { color: var(--nx-accent,#4C7DFF) !important; }',
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
    var links = document.querySelectorAll('a[href="nexus-messages.html"]');
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

  // 2. Profile Data Loader & Nav Avatar Sync — gerçek kullanıcı verisi (nexusUserName/nexusAvatar)
  function syncNavAvatar() {
    try {
      // Menüdeki Profil düğmesi her zaman kendi ikonunu gösterir (profil fotoğrafı ile değiştirilmez).
      document.querySelectorAll('a[href="nexus-profile.html"]').forEach(function (link) {
        var existingImg = link.querySelector('.nav-user-avatar');
        var icon = link.querySelector('i[data-lucide="user"], svg.lucide-user, svg[data-lucide="user"]');
        if (existingImg) existingImg.style.display = 'none';
        if (icon) icon.style.display = '';
      });
    } catch (e) {}
  }

  function loadProfileData() {
    const userNameElement = document.getElementById('nexus-user-name');
    const userAvatarElement = document.getElementById('nexus-user-avatar');

    if (userNameElement || userAvatarElement) {
      const storedName = (typeof nexusGetItem === 'function' ? nexusGetItem('nexusUserName') : '') || 'Misafir';
      const storedAvatar = typeof nexusGetItem === 'function' ? nexusGetItem('nexusAvatar') : '';

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
    syncNavAvatar();
  }

  window.addEventListener('DOMContentLoaded', loadProfileData);
  window.addEventListener('nexusAvatarChanged', syncNavAvatar);
  window.addEventListener('storage', function (e) {
    if (e.key && e.key.includes('nexusAvatar')) syncNavAvatar();
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
      (a.primary ? 'background:var(--nx-accent,#4C7DFF);color:#fff;' : (dark ? 'background:#1e293b;color:#e2e8f0;' : 'background:#f1f5f9;color:#334155;')) + '">' + esc(a.label) + '</button>';
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
// Başarıda kısa "kopyalandı" tık sesi (nexus-feedback.js varsa); anahtar kapalıysa sessiz.
window.nexusCopy = function (text) {
  function announce(ok) {
    if (ok && window.nexusFeedback && typeof nexusFeedback.play === 'function') nexusFeedback.play('copy');
    return ok;
  }
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
    return navigator.clipboard.writeText(text).then(function () { return announce(true); }, function () { return announce(legacy()); });
  }
  return Promise.resolve(announce(legacy()));
};

// Komut paleti: artık yalnızca masaüstü değil — telefonda da yüklenir (dokunmatik
// giriş düğmesi paletin kendi içinde). Giriş/şifre akışları paletin kendisinde
// elenir; auth sayfalarında hiç kurulmaz.
(function () {
  var page = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  var AUTH = ['index', 'nexus-login', 'nexus-register', 'nexus-forgot-password', 'nexus-onboarding', ''];
  if (AUTH.indexOf(page) !== -1) return;
  if (document.querySelector('script[src="command-palette.js"]')) return;
  var s = document.createElement('script');
  s.src = 'command-palette.js';
  s.defer = true;
  (document.head || document.documentElement).appendChild(s);
})();

// Seçim kutuları: işletim sisteminin gri listesi yerine uygulamanın kendi açılır listesi (tüm sayfalarda).
(function () {
  if (document.querySelector('script[src="nexus-select.js"]')) return;
  var s = document.createElement('script');
  s.src = 'nexus-select.js';
  s.defer = true;
  (document.head || document.documentElement).appendChild(s);
})();

// Geri alma katmanı: yanlışlıkla silinen cihaz/olay/kart için 6 saniyelik "Geri al".
// Depo yazımlarını gözlemler; yüklemesi yan etkisizdir, auth akışlarında gerekmez.
(function () {
  var page = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  var AUTH = ['index', 'nexus-login', 'nexus-register', 'nexus-forgot-password', 'nexus-onboarding', ''];
  if (AUTH.indexOf(page) !== -1) return;
  if (document.querySelector('script[src="nexus-undo.js"]')) return;
  var s = document.createElement('script');
  s.src = 'nexus-undo.js';
  s.defer = true;
  (document.head || document.documentElement).appendChild(s);
})();

// Otomasyon motoru (issue #24): zaman tetikleyicilerini değerlendirir.
// Tüm sayfalara eklenir; sahiplik kalp atışı ile tek pencerede toplanır.
// Giriş yapmamış (auth) sayfalarda çalışmasına gerek yok.
(function () {
  if (document.querySelector('script[src="automation-engine.js"]')) return;
  var page = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  var AUTH = ['index', 'nexus-login', 'nexus-register', 'nexus-forgot-password', 'nexus-onboarding'];
  if (AUTH.indexOf(page) !== -1) return;
  var s = document.createElement('script');
  s.src = 'automation-engine.js';
  s.defer = true;
  (document.head || document.documentElement).appendChild(s);
})();

// Ses / titreşim / hareket geri bildirim merkezi: tüm sayfalarda (auth dahil —
// kopyalama sesi gibi ortak kanallar kullanıyor). Yüklenmesi yan etkisizdir.
(function () {
  if (document.querySelector('script[src="nexus-feedback.js"]')) return;
  var s = document.createElement('script');
  s.src = 'nexus-feedback.js';
  s.defer = true;
  (document.head || document.documentElement).appendChild(s);
})();

// Ortak uyarı penceresi: bazı ekranlar kendi ekliyordu, bazıları alert'e düşüyordu.
// Tüm sayfalarda hazır olsun; tanımı yan etkisizdir (window.nexusDialog) ve
// ekleyen sayfalarda kendi etiketi kazanmaya devam eder.
(function () {
  if (document.querySelector('script[src="nexus-dialog.js"]')) return;
  var s = document.createElement('script');
  s.src = 'nexus-dialog.js';
  s.defer = true;
  (document.head || document.documentElement).appendChild(s);
})();

// Masaüstü olay köprüsü: Electron ana sürecine olay bildirimi + tepsi durumu.
// Dosya kendi içinde korumalı (yalnızca nexusDesktop.notifyEvent varsa çalışır);
// daha önce hiç yüklenmediği için masaüstü bildirimleri ölü duruyordu.
(function () {
  if (document.querySelector('script[src="event-bridge.js"]')) return;
  var s = document.createElement('script');
  s.src = 'event-bridge.js';
  s.defer = true;
  (document.head || document.documentElement).appendChild(s);
})();

// PWA (issue #17): kurulum (ana ekrana/masaüstüne ekle) + temel çevrimdışı
// kabuk. Manifest head'e statik eklenmez (sayfalar çok); runtime eklenir.
// Service worker yalnızca gerçek http(s) üzerinde kayıtlı olur (file:// hariç).
(function () {
  if (!document.querySelector('link[rel="manifest"]')) {
    var m = document.createElement('link');
    m.rel = 'manifest';
    m.href = 'manifest.webmanifest';
    document.head.appendChild(m);
  }
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* kurulum başarısızsa uygulama normal çalışır */ });
    });
  }
})();

// Enter ile gönderme: <form> kullanmayan ekranlarda metin girişinde Enter,
// girdinin data-enter ile işaretlediği eylemi çalıştırır ("fnAdı" global işlev
// ya da "#düğme-id"). data-field'lı otomatik kaydeden alanlarda Enter, değişikliği
// blur ile kesinleştirir. İşaretsiz girdilerde davranış hiç değişmez (sıfır risk).
(function () {
  if (window.__nexusEnterSubmit) return;
  window.__nexusEnterSubmit = true;
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.isComposing || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
    var t = e.target;
    if (!t || t.tagName !== 'INPUT') return;
    var ty = t.type;
    if (ty === 'hidden' || ty === 'checkbox' || ty === 'radio' || ty === 'file' || ty === 'button' || ty === 'submit') return;
    if (t.closest('form') || t.closest('[data-no-enter]')) return; // form zaten yerel gönderir
    var act = t.getAttribute('data-enter');
    if (!act) {
      if (t.hasAttribute('data-field')) { e.preventDefault(); t.blur(); } // change → kaydet
      return;
    }
    e.preventDefault();
    if (act.charAt(0) === '#') {
      var btn = document.querySelector(act);
      if (btn && !btn.disabled && (btn.offsetWidth || btn.offsetHeight)) btn.click();
      return;
    }
    if (typeof window[act] === 'function') window[act]();
  });
})();

// Android arka plan servisi: kullanıcı Ayarlar'dan "Arka Plan Otomasyonu"nu
// açtıysa uygulama her açılışta servisi çalıştırır (NexusKeepAlivePlugin →
// NexusKeepAliveService). Varsayılan kapalı; kapatınca servis durdurulur.
(function () {
  if (window.__nexusKeepAliveHook) return;
  window.__nexusKeepAliveHook = true;
  function androidNative() {
    try {
      return !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android');
    } catch (e) { return false; }
  }
  if (!androidNative()) return;
  function sync() {
    var p = null;
    try { p = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.NexusKeepAlive; } catch (e) {}
    if (!p || typeof window.nexusGetItem !== 'function') return;
    var on = false;
    try { on = window.nexusGetItem('nexusKeepAlive') === 'true'; } catch (e2) {}
    try {
      if (on) p.start({ lang: window.nexusLang === 'en' ? 'en' : 'tr' }).catch(function () {});
      else p.stop().catch(function () {});
    } catch (e3) { /* köprü yoksa sessizce geç */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync);
  else sync();
  window.addEventListener('nexusKeepAliveChanged', sync);
})();

// Anonim hata raporlama (issue #15): window.onerror → client-error Edge
// Function. Kişisel veri yok (sayfa, sürüm, platform, mesaj). Ayarlardan
// kapatılabilir: nexusSetItem('nexusErrorReporting', 'off').
(function () {
  if (window.__nexusErrorHook) return;
  window.__nexusErrorHook = true;
  var sent = 0;
  window.addEventListener('error', function (e) {
    try {
      if (nexusGetItem('nexusErrorReporting') === 'off') return;
      if (!window.NEXUS_CLOUD || !NEXUS_CLOUD.url || sent >= 5) return; // oturum başına en fazla 5
      sent++;
      fetch(NEXUS_CLOUD.url.replace(/\/$/, '') + '/functions/v1/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: location.pathname.split('/').pop(),
          version: window.NEXUS_APP_VERSION || '',
          platform: document.documentElement.classList.contains('nx-desk') ? 'desktop'
            : (window.Capacitor && Capacitor.isNativePlatform ? 'android' : 'web'),
          message: String(e.message || '').slice(0, 400) + ' @' + String((e.filename || '')).split('/').pop() + ':' + (e.lineno || 0)
        })
      }).catch(function () { /* sessiz: raporlama hatası kullanıcıyı rahatsız etmez */ });
    } catch (err2) { /* asla ikincil hata üretme */ }
  });
})();

// ---------- Ortak bildirim şeridi (toast) ----------
// Tüm ekranlar aynı yerde ve aynı görünümde gösterir: üst orta (alt gezinme ve eylem çubuklarıyla çakışmaz),
// masaüstünde içerik alanının ortası, hata kırmızı / başarı yeşil simge / bilgi mavi simge, ekran okuyucuya duyurulur.
// nexusToast(metin, { type: 'success' | 'error' | 'info', duration: ms, key: 'aynı-anahtarlı-öncekini-değiştir' })
(function () {
  if (window.nexusToast) return;
  var HOST_ID = 'nx-toast-host';
  var ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></svg>'
  };
  function ensureStyle() {
    if (document.getElementById('nx-toast-style')) return;
    var s = document.createElement('style');
    s.id = 'nx-toast-style';
    s.textContent =
      '#nx-toast-host{position:fixed;top:calc(env(safe-area-inset-top,0px) + 16px);left:50%;transform:translateX(-50%);z-index:2147482000;display:flex;flex-direction:column;align-items:center;gap:8px;width:min(92vw,420px);pointer-events:none}' +
      'html.nx-desk #nx-toast-host{left:calc(var(--side,0px) + (100vw - var(--side,0px)) / 2)}' +
      '.nx-toast-item{display:flex;align-items:center;gap:10px;max-width:100%;box-sizing:border-box;padding:11px 16px;border-radius:16px;background:rgba(15,23,42,.95);color:#fff;font:600 14px/1.35 Inter,system-ui,sans-serif;text-align:left;box-shadow:0 14px 30px -12px rgba(2,6,23,.5);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);animation:nx-toast-in .22s ease both;overflow-wrap:anywhere}' +
      '.nx-toast-item.is-out{animation:nx-toast-out .2s ease both}' +
      '.nx-toast-item svg{width:18px;height:18px;flex:none}' +
      '.nx-toast-item.is-success svg{color:#34d399}.nx-toast-item.is-info svg{color:#93b4ff}' +
      '.nx-toast-item.is-error{background:rgba(190,18,60,.96)}.nx-toast-item.is-error svg{color:#fff}' +
      'html.dark .nx-toast-item{background:rgba(30,41,59,.96);box-shadow:0 14px 30px -12px rgba(0,0,0,.65),0 0 0 1px rgba(148,163,184,.28)}' +
      'html.dark .nx-toast-item.is-error{background:rgba(159,18,57,.97)}' +
      '@keyframes nx-toast-in{from{opacity:0;transform:translateY(-10px) scale(.98)}to{opacity:1;transform:none}}' +
      '@keyframes nx-toast-out{from{opacity:1;transform:none}to{opacity:0;transform:translateY(-8px) scale(.98)}}' +
      '@media (prefers-reduced-motion:reduce){.nx-toast-item,.nx-toast-item.is-out{animation:none}}';
    document.head.appendChild(s);
  }
  function host() {
    var h = document.getElementById(HOST_ID);
    if (!h) {
      h = document.createElement('div');
      h.id = HOST_ID;
      document.body.appendChild(h);
    }
    return h;
  }
  function dismiss(el) {
    if (!el || el.__nxGone) return;
    el.__nxGone = true;
    clearTimeout(el.__nxTimer);
    el.classList.add('is-out');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
  }
  window.nexusToast = function (message, opts) {
    try {
      opts = opts || {};
      var text = String(message == null ? '' : message);
      if (!text || !document.body) return null;
      ensureStyle();
      var type = opts.type === 'error' ? 'error' : opts.type === 'success' ? 'success' : 'info';
      var h = host();
      if (opts.key) {
        var old = h.querySelector('[data-key="' + String(opts.key).replace(/"/g, '') + '"]');
        if (old) dismiss(old);
      }
      var el = document.createElement('div');
      el.className = 'nx-toast-item is-' + type;
      el.setAttribute('role', type === 'error' ? 'alert' : 'status');
      if (opts.key) el.setAttribute('data-key', String(opts.key));
      el.innerHTML = ICONS[type] + '<span></span>';
      el.lastChild.textContent = text;
      h.appendChild(el);
      // En çok 3 şerit birikir: en eskisi kalkar
      var items = h.querySelectorAll('.nx-toast-item:not(.is-out)');
      for (var i = 0; i < items.length - 3; i++) dismiss(items[i]);
      el.__nxTimer = setTimeout(function () { dismiss(el); }, opts.duration || (type === 'error' ? 4200 : 2600));
      return el;
    } catch (e) { return null; }
  };
  // Olay bildirimi sistem bildirimi gösterilemediğinde (notify.js) uygulama içi şerit olarak çıkar
  window.nexusShowNotice = window.nexusShowNotice || function (event) {
    var title = event && event.title ? String(event.title) : '';
    var detail = event && event.detail ? String(event.detail) : '';
    return window.nexusToast([title, detail].filter(Boolean).join(' — '), { type: 'info', duration: 4200 });
  };
})();
