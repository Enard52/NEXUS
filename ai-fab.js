/**
 * NEXUS AI Floating Action Button
 * Her ana sayfaya dahil edilir: <script src="ai-fab.js"></script>
 * Chat sayfasında, login/onboarding/scan sayfalarında gösterilmez.
 */
(function () {
  var EXCLUDE_PAGES = ['stitch-chat.html', 'stitch-login.html', 'stitch-onboarding.html', 'stitch-scan.html', 'stitch-map.html'];
  if (EXCLUDE_PAGES.some(function(p){ return location.href.includes(p); })) return;

  // Stil enjekte et
  var style = document.createElement('style');
  style.textContent = [
    '.nexus-ai-fab {',
    '  position: fixed;',
    '  right: 20px;',
    '  bottom: 96px;', // Bottom nav üzeri (80px nav + 16px boşluk)
    '  width: 52px;',
    '  height: 52px;',
    '  border-radius: 50%;',
    '  background: rgba(255,255,255,0.9); backdrop-filter: blur(10px);',
    '  box-shadow: 0 4px 20px rgba(124,92,255,0.45), 0 2px 8px rgba(0,0,0,0.15);',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  z-index: 9999;',
    '  cursor: pointer;',
    '  border: none;',
    '  outline: none;',
    '  -webkit-tap-highlight-color: transparent;',
    '  transition: transform 0.3s ease, opacity 0.3s ease, box-shadow 0.15s ease, background 0.2s ease;',
    '}',
    'html.dark .nexus-ai-fab { background: rgba(30,41,59,0.9); border: 1px solid rgba(255,255,255,0.1); }',
    '.nexus-ai-fab:active { transform: scale(0.92); box-shadow: 0 2px 10px rgba(124,92,255,0.3); }',
    /* Boşta kalınca kenara yarı gömül: dikkat dağıtmaz ama erişilebilir kalır */
    '.nexus-ai-fab.docked { transform: translateX(58%); opacity: 0.45; box-shadow: 0 2px 10px rgba(124,92,255,0.25); }',
    '.nexus-ai-fab.docked:hover, .nexus-ai-fab.docked:focus-visible { transform: none; opacity: 1; }',
    '.nexus-ai-fab .fab-label {',
    '  position: absolute;',
    '  right: 60px;',
    '  background: rgba(15,23,42,0.85);',
    '  backdrop-filter: blur(8px);',
    '  color: white;',
    '  font-size: 12px;',
    '  font-weight: 600;',
    '  padding: 6px 12px;',
    '  border-radius: 12px;',
    '  white-space: nowrap;',
    '  opacity: 0;',
    '  pointer-events: none;',
    '  transition: opacity 0.2s ease;',
    '  font-family: Inter, sans-serif;',
    '}',
    '.nexus-ai-fab:hover .fab-label, .nexus-ai-fab.show-label .fab-label { opacity: 1; }',
    '@keyframes nexusFabPulse {',
    '  0% { box-shadow: 0 4px 20px rgba(124,92,255,0.45), 0 0 0 0 rgba(124,92,255,0.4); }',
    '  70% { box-shadow: 0 4px 20px rgba(124,92,255,0.45), 0 0 0 10px rgba(124,92,255,0); }',
    '  100% { box-shadow: 0 4px 20px rgba(124,92,255,0.45), 0 0 0 0 rgba(124,92,255,0); }',
    '}',
    '.nexus-ai-fab.pulse { animation: nexusFabPulse 2s ease-out; }',
    // Sayfalarda bottom nav yoksa daha aşağıda tut
    '.nexus-ai-fab.no-nav { bottom: 32px; }',
  ].join('\n');
  document.head.appendChild(style);

  // FAB elementi oluştur
  var fab = document.createElement('button');
  fab.className = 'nexus-ai-fab';
  fab.setAttribute('aria-label', 'NEXUS AI Asistan');
  fab.setAttribute('title', 'NEXUS AI Asistan');
  fab.innerHTML = [
    // Resmi NEXUS marka logosu (favicon ile aynı; ID'ler sayfadaki logolarla çakışmasın diye -fab ekli)
    '<div style="width: 28px; height: 28px;">',
    '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="NEXUS logo" role="img" style="width:100%;height:100%;display:block;">',
    '<defs>',
    '<linearGradient id="nxlogo-fab" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">',
    '<stop stop-color="#6f9bff"/><stop offset="0.55" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b7bff"/>',
    '</linearGradient>',
    '<linearGradient id="nxsheen-fab" x1="16" y1="1" x2="16" y2="17" gradientUnits="userSpaceOnUse">',
    '<stop stop-color="#ffffff" stop-opacity="0.30"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>',
    '</linearGradient>',
    '</defs>',
    '<rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxlogo-fab)"/>',
    '<rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxsheen-fab)"/>',
    '<rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="#ffffff" stroke-opacity="0.22"/>',
    '<path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    '</svg>',
    '</div>',
    '<span class="fab-label">NEXUS AI</span>'
  ].join('');

  // Bottom nav var mı kontrol et
  function checkNav() {
    var nav = document.querySelector('nav[data-purpose="bottom-nav"], nav.fixed.bottom-0, nav.fixed');
    if (!nav) fab.classList.add('no-nav');
  }

  // Tıklama: chat sayfasına aç (kenara gömülüyken ilk dokunuş sadece geri çıkarır)
  fab.addEventListener('click', function () {
    if (fab.classList.contains('docked')) { undock(); return; }
    // Mevcut sayfayı referer olarak geçir
    var pageName = (window.location.pathname.split('/').pop() || 'stitch-home.html');
    var returnTo = encodeURIComponent(pageName);
    window.location.href = 'stitch-chat.html?from=' + returnTo;
  });

  // Boşta kenara gömülme mantığı: 4 sn hareketsizlikte yarı gizlenir,
  // kaydırma/dokunma olunca geri belirir (dikkat dağıtmayı azaltır).
  var dockTimer = null;
  function scheduleDock() {
    clearTimeout(dockTimer);
    dockTimer = setTimeout(function () { fab.classList.add('docked'); }, 4000);
  }
  function undock() {
    fab.classList.remove('docked');
    scheduleDock();
  }
  window.addEventListener('scroll', undock, { passive: true });
  document.addEventListener('touchstart', function (e) {
    if (e.target !== fab && !fab.contains(e.target)) undock();
  }, { passive: true });

  // Bildirim rozeti artık theme.js tarafından yönetiliyor (tüm sayfalarda yüklü).

  // İlk gösterimde kısa puls animasyonu
  function addToPage() {
    document.body.appendChild(fab);
    checkNav();

    // Sayfa ilk açıldığında pulse: oturum başına yalnızca bir kez (dikkat dağıtmayı azalt)
    var pulsed = false;
    try { pulsed = sessionStorage.getItem('nexusFabPulsed') === '1'; } catch (e) {}
    if (!pulsed) {
      try { sessionStorage.setItem('nexusFabPulsed', '1'); } catch (e) {}
      setTimeout(function () {
        fab.classList.add('pulse');
        fab.classList.add('show-label');
        setTimeout(function () {
          fab.classList.remove('pulse');
          fab.classList.remove('show-label');
        }, 2500);
      }, 1500);
    }

    // Boşta kenara gömülme sayacını başlat
    scheduleDock();
  }

  // DOM hazır olunca ekle
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addToPage);
  } else {
    addToPage();
  }
})();
