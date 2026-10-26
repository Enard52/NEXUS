// auth.js
// NEXUS Global Authentication and Data Persistence Guard

(function() {
  const CURRENT_USER_KEY = 'nexusCurrentUser';

  // Canlı Telefon Ön İzlemesi / Demo Kontrolü
  // Sitedeki telefon çerçevesinde (iframe) ve demo modunda onboarding/giriş duvarı yerine
  // doğrudan Ana Sayfa deneyimi sunulur.
  const isPreviewMode = (function() {
    try {
      return window.self !== window.top || /[?&](preview|demo)=1/.test(window.location.search);
    } catch {
      return false;
    }
  })();

  if (isPreviewMode && !localStorage.getItem(CURRENT_USER_KEY)) {
    localStorage.setItem(CURRENT_USER_KEY, 'demo_user');
  }

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

    // Canlı önizleme çerçevesinde onboarding/giriş duvarı engellenir; doğrudan ana sayfaya yönlendirilir
    if (isPreviewMode) {
      if (!user) {
        localStorage.setItem(CURRENT_USER_KEY, 'demo_user');
      }
      if (isPublicPage || page === 'index.html' || page === 'index' || page === '') {
        window.location.replace('stitch-home.html');
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
    if (key === CURRENT_USER_KEY) return localStorage.getItem(key);
    
    const user = localStorage.getItem(CURRENT_USER_KEY) || 'guest';
    return localStorage.getItem(`${user}_${key}`);
  };

  window.nexusSetItem = function(key, value) {
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
    if (key === CURRENT_USER_KEY) {
      localStorage.removeItem(key);
      return;
    }
    const user = localStorage.getItem(CURRENT_USER_KEY) || 'guest';
    localStorage.removeItem(`${user}_${key}`);
  };

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
