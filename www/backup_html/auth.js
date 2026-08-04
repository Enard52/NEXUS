// auth.js
// NEXUS Global Authentication and Data Persistence Guard

(function() {
  const CURRENT_USER_KEY = 'nexusCurrentUser';

  // Yönlendirme (Auth Guard) Mantığı
  function enforceAuth() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    // Yalnızca public sayfalara herkes erişebilir
    const isPublicPage = ['stitch-login.html', 'stitch-onboarding.html', 'stitch-forgot-password.html', 'stitch-register.html'].includes(page);
    const user = localStorage.getItem(CURRENT_USER_KEY);
    
    if (!user) {
      if (!isPublicPage) {
        // Giriş yapmamışsa her zaman onboarding sayfasına yönlendir (index.html dahil)
        window.location.replace('stitch-onboarding.html');
      }
    } else {
      if (isPublicPage || page === 'index.html' || page === '') {
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
  
  window.nexusRemoveItem = function(key) {
    if (key === CURRENT_USER_KEY) {
      localStorage.removeItem(key);
      return;
    }
    const user = localStorage.getItem(CURRENT_USER_KEY) || 'guest';
    localStorage.removeItem(`${user}_${key}`);
  };

  window.nexusLogout = function() {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.replace('index.html');
  };
})();
