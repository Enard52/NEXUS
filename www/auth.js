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
    function previewToast() {
      var old = document.getElementById('nexus-preview-toast');
      if (old) old.remove();
      var box = document.createElement('div');
      box.id = 'nexus-preview-toast';
      box.setAttribute('role', 'status');
      box.style.cssText = 'position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:2147483647;max-width:88vw;padding:10px 14px;border-radius:14px;background:rgba(15,23,42,.92);color:#fff;font:650 13px/1.35 Inter,system-ui,sans-serif;text-align:center;box-shadow:0 10px 28px rgba(0,0,0,.28)';
      box.textContent = (window.nexusT ? window.nexusT('Bu bir önizleme. Cihaz, ödeme ve hesap işlemleri uygulamada çalışır.', 'This is a preview. Device, billing and account actions run in the app.') : 'Bu bir önizleme. Cihaz, ödeme ve hesap işlemleri uygulamada çalışır.');
      document.body.appendChild(box);
      setTimeout(function () { if (box.parentNode) box.remove(); }, 2600);
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
