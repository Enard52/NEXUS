// auth.js
// NEXUS Global Authentication and Data Persistence Guard

(function() {
  const CURRENT_USER_KEY = 'nexusCurrentUser';

  // Site telefon çerçevesi: gerçek arayüzde gezilir, özellik çalışmaz.
  // sessionStorage kullanılır ki aynı kökteki gerçek web uygulaması oturumu bozulmasın.
  const isPreviewMode = (function() {
    try {
      return window.self !== window.top || /[?&](preview|demo)=1/.test(window.location.search);
    } catch {
      return true;
    }
  })();
  window.nexusPreview = isPreviewMode;

  // Yönlendirme (Auth Guard) Mantığı
  function enforceAuth() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    // Yalnızca public sayfalara herkes erişebilir
    const isPublicPage = [
      'stitch-login.html', 'stitch-onboarding.html', 'stitch-forgot-password.html', 'stitch-register.html',
      'stitch-login', 'stitch-onboarding', 'stitch-forgot-password', 'stitch-register'
    ].includes(page);
    const user = localStorage.getItem(CURRENT_USER_KEY);

    if (isPreviewMode) {
      if (isPublicPage || page === 'index.html' || page === 'index' || page === '') {
        window.location.replace('stitch-home.html?preview=1');
        return;
      }
      return;
    }

    // E-posta bağlantısından (doğrulama / şifre sıfırlama / Google) dönülürken belirteçler adres çubuğundadır;
    // oturum açık olsa bile sayfa bunları işleyebilsin diye eve yönlendirilmez.
    if (user && isPublicPage && /[#&]access_token=/.test(window.location.hash || '')) return;

    if (!user) {
      if (!isPublicPage) {
        // Giriş yapmamışsa her zaman onboarding sayfasına yönlendir (index.html dahil)
        window.location.replace('stitch-onboarding.html');
      }
    } else {
      if (isPublicPage || page === 'index.html' || page === 'index' || page === '') {
        // Giriş yapmışsa ve public sayfaya girmeye çalışıyorsa eve yönlendir
        window.location.replace('stitch-home.html');
      }
    }
  }

  // Hemen çalıştır
  enforceAuth();

  // Site telefonu yenilenince aynı ekranda kalsın. Yalnızca sayfa adı gider.
  if (isPreviewMode && window.parent && window.parent !== window) {
    var previewPage = page;
    var previewIndex = '';
    try {
      var previewQuery = new URLSearchParams(window.location.search);
      if (/^\d+$/.test(previewQuery.get('i') || '')) previewIndex = previewQuery.get('i');
    } catch (e) {}
    if (/^stitch-[a-z0-9-]+\.html$/.test(previewPage) && !isPublicPage) {
      try {
        window.parent.postMessage({ source: 'nexus-preview', page: previewPage, index: previewIndex }, '*');
      } catch (e) {}
    }
  }

  // Veri İzolasyon (Ön-ek / Prefix) Fonksiyonları
  window.nexusGetItem = function(key) {
    if (isPreviewMode) {
      if (key === CURRENT_USER_KEY) return 'preview';
      try { return sessionStorage.getItem('nxp_' + key); } catch (e) { return null; }
    }
    if (key === CURRENT_USER_KEY) return localStorage.getItem(key);
    
    const user = localStorage.getItem(CURRENT_USER_KEY) || 'guest';
    return localStorage.getItem(`${user}_${key}`);
  };

  window.nexusSetItem = function(key, value) {
    if (isPreviewMode) {
      if (key === CURRENT_USER_KEY) return;
      try {
        if (value === '' || value == null) sessionStorage.removeItem('nxp_' + key);
        else sessionStorage.setItem('nxp_' + key, String(value));
      } catch (e) {}
      return;
    }
    if (key === CURRENT_USER_KEY) {
      localStorage.setItem(key, value);
      return;
    }
    const user = localStorage.getItem(CURRENT_USER_KEY) || 'guest';
    localStorage.setItem(`${user}_${key}`, value);
  };
  
  // Yerel (bulutsuz) hesap şifresi: düz metin değil, tuzlu SHA-256 özeti saklanır.
  // Eski sürümün düz metin kaydı (nexus_mock_pw_) ilk doğru girişte özete çevrilip silinir.
  var PW_PREFIX = 'nexus_pw_';
  var LEGACY_PREFIX = 'nexus_mock_pw_';
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function sha256(text) {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(hex);
    }
    return Promise.reject(new Error('Bu ortamda güvenli şifreleme yok'));
  }
  function randomSalt() {
    var a = new Uint8Array(16);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.floor(Math.random() * 256); });
    return hex(a.buffer);
  }
  window.nexusLocalPassword = {
    exists: function (email) {
      email = String(email || '');
      return !!(localStorage.getItem(PW_PREFIX + email.trim().toLowerCase()) || localStorage.getItem(LEGACY_PREFIX + email.trim()) || localStorage.getItem(LEGACY_PREFIX + email.trim().toLowerCase()));
    },
    set: function (email, password) {
      email = String(email || '').trim().toLowerCase();
      var salt = randomSalt();
      return sha256(salt + ':' + password).then(function (h) {
        localStorage.setItem(PW_PREFIX + email, salt + ':' + h);
        localStorage.removeItem(LEGACY_PREFIX + email);
        return true;
      });
    },
    // true: doğru, false: yanlış, null: bu e-postayla yerel hesap yok
    verify: function (email, password) {
      var raw = String(email || '').trim();
      email = raw.toLowerCase();
      var stored = localStorage.getItem(PW_PREFIX + email);
      if (stored) {
        var parts = stored.split(':');
        return sha256(parts[0] + ':' + password).then(function (h) { return h === parts[1]; });
      }
      var legacy = localStorage.getItem(LEGACY_PREFIX + raw);
      if (legacy == null) legacy = localStorage.getItem(LEGACY_PREFIX + email);
      if (legacy == null) return Promise.resolve(null);
      if (legacy !== password) return Promise.resolve(false);
      localStorage.removeItem(LEGACY_PREFIX + raw);
      return window.nexusLocalPassword.set(email, password).then(function () { return true; });
    }
  };

  window.nexusRemoveItem = function(key) {
    if (isPreviewMode) {
      if (key === CURRENT_USER_KEY) return;
      try { sessionStorage.removeItem('nxp_' + key); } catch (e) {}
      return;
    }
    if (key === CURRENT_USER_KEY) {
      localStorage.removeItem(key);
      return;
    }
    const user = localStorage.getItem(CURRENT_USER_KEY) || 'guest';
    localStorage.removeItem(`${user}_${key}`);
  };

  if (isPreviewMode) {
    document.documentElement.classList.add('nexus-preview');
    if (!document.getElementById('nexus-preview-scroll')) {
      var hideBar = document.createElement('style');
      hideBar.id = 'nexus-preview-scroll';
      hideBar.textContent = 'html.nexus-preview,html.nexus-preview body,html.nexus-preview *{scrollbar-width:none!important;-ms-overflow-style:none!important;scrollbar-gutter:auto!important}' +
        'html.nexus-preview::-webkit-scrollbar,html.nexus-preview body::-webkit-scrollbar,html.nexus-preview *::-webkit-scrollbar{width:0!important;height:0!important;background:transparent!important;display:none!important}' +
        '#nexus-preview-toast{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:36px 22px;background:rgba(15,23,42,.48);font-family:Inter,system-ui,sans-serif}' +
        '#nexus-preview-toast .nx-preview-card{width:min(340px,100%);background:#fff;color:#0f172a;border-radius:28px;padding:32px 26px 28px;text-align:center;box-shadow:0 24px 60px rgba(15,23,42,.35)}' +
        '#nexus-preview-toast .nx-preview-kicker{margin:0 0 12px;font-size:15px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#4C7DFF}' +
        '#nexus-preview-toast .nx-preview-title{margin:0;font-size:32px;font-weight:760;line-height:1.15;letter-spacing:-.03em}' +
        '#nexus-preview-toast .nx-preview-text{margin:14px 0 0;font-size:20px;font-weight:560;line-height:1.4;color:#475569}' +
        'html.dark #nexus-preview-toast .nx-preview-card{background:#0f172a;color:#f8fafc;border:1px solid rgba(255,255,255,.1)}' +
        'html.dark #nexus-preview-toast .nx-preview-text{color:#cbd5e1}';
      (document.head || document.documentElement).appendChild(hideBar);
    }
    function previewToast() {
      var old = document.getElementById('nexus-preview-toast');
      if (old) old.remove();
      var t = window.nexusT || function (tr) { return tr; };
      var box = document.createElement('div');
      box.id = 'nexus-preview-toast';
      box.setAttribute('role', 'status');
      var card = document.createElement('div');
      card.className = 'nx-preview-card';
      var kicker = document.createElement('p');
      kicker.className = 'nx-preview-kicker';
      kicker.textContent = t('Önizleme', 'Preview');
      var title = document.createElement('p');
      title.className = 'nx-preview-title';
      title.textContent = t('Bu bir önizleme', 'This is a preview');
      var text = document.createElement('p');
      text.className = 'nx-preview-text';
      text.textContent = t('Cihaz ekleme, ödeme ve hesap burada çalışmaz. Bunlar uygulamada yapılır.', 'Adding devices, billing and account actions do not run here. They run in the app.');
      card.appendChild(kicker);
      card.appendChild(title);
      card.appendChild(text);
      box.appendChild(card);
      box.addEventListener('click', function () { box.remove(); });
      document.body.appendChild(box);
      setTimeout(function () { if (box.parentNode) box.remove(); }, 4600);
    }
    function previewAllowed(el) {
      if (!el || !el.closest) return false;
      var a = el.closest('a[href]');
      if (a) {
        var h = String(a.getAttribute('href') || '').trim();
        if (/history\.(back|go)/i.test(h)) return true;
        if (h.charAt(0) === '#') return true;
        if (/^https?:\/\//i.test(h) && h.indexOf(location.host) === -1) return false;
        return true;
      }
      if (el.closest('[aria-label="Geri"], [data-purpose="bottom-nav"], [data-purpose="top-navigation"], header, nav')) return true;
      if (el.closest('[data-tab], [role="tab"]')) return true;
      return false;
    }
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('a, button, [onclick], input, select, textarea, [role="button"]') : null;
      if (!t) return;
      if (previewAllowed(t)) return;
      if (t.matches && t.matches('input, textarea, select') && t.type !== 'submit' && t.type !== 'button' && t.type !== 'range' && t.type !== 'checkbox') return;
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      previewToast();
    }, true);
  }

  window.nexusLogout = function() {
    function finish() {
      localStorage.removeItem(CURRENT_USER_KEY);
      window.location.replace('index.html');
    }
    var cloud = window.nexusCloud;
    if (!cloud || !cloud.enabled || !cloud.enabled()) { finish(); return; }
    // Çıkıştan önce son değişiklikleri hesaba yaz (en çok 3 sn bekler), sonra oturumu kapat.
    var done = false;
    function closeSession() {
      if (done) return;
      done = true;
      Promise.resolve().then(function () { return cloud.signOut(); }).catch(function () {}).then(finish);
    }
    setTimeout(closeSession, 3000);
    Promise.resolve().then(function () { return cloud.syncAll(); }).catch(function () {}).then(closeSession);
  };
})();
