/**
 * NEXUS AI Floating Action Button
 * Her ana sayfaya dahil edilir: <script src="ai-fab.js"></script>
 * Chat, login, onboarding ve tarama sayfalarinda gosterilmez.
 */
(function () {
  // Ana sayfa ve Akıllı sekmesinde üstte zaten "Nasıl yardımcı olabilirim?" giriş çubuğu var;
  // ikinci bir AI giriş noktası (yüzen N) kafa karıştırıyor ve içerikle çakışıyordu.
  var EXCLUDE_PAGES = ['nexus-chat.html', 'nexus-login.html', 'nexus-onboarding.html', 'nexus-scan.html', 'nexus-map.html', 'nexus-home.html', 'nexus-smart.html', 'nexus-register.html', 'nexus-forgot-password.html', 'nexus-device.html'];
  if (EXCLUDE_PAGES.some(function (page) { return location.href.includes(page); })) return;
  // Kullanıcı Ayarlar'dan yüzen AI düğmesini kapatabilir.
  try {
    var fabPref = typeof nexusGetItem === 'function' ? nexusGetItem('nexusFabAi') : localStorage.getItem('nexusFabAi');
    if (fabPref === 'false') return;
  } catch (error) {}

  var style = document.createElement('style');
  style.textContent = [
    '.nexus-ai-fab {',
    '  position: fixed;',
    '  right: max(0px, env(safe-area-inset-right));',
    '  bottom: max(88px, calc(env(safe-area-inset-bottom) + 72px));',
    '  width: 48px;',
    '  height: 46px;',
    '  border: none;',
    '  outline: none;',
    '  border-radius: 18px 0 0 18px;',
    '  overflow: hidden;',
    '  background: rgba(255,255,255,0.84);',
    '  backdrop-filter: blur(14px);',
    '  box-shadow: 0 12px 30px rgba(15,23,42,0.14), 0 4px 14px rgba(91,141,255,0.18);',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  z-index: 9999;',
    '  cursor: pointer;',
    '  opacity: 0.96;',
    '  -webkit-tap-highlight-color: transparent;',
    '  transition: transform 0.28s ease, opacity 0.28s ease, box-shadow 0.18s ease, background 0.2s ease;',
    '}',
    'html.dark .nexus-ai-fab {',
    '  background: rgba(15,23,42,0.84);',
    '  border: 1px solid rgba(148,163,184,0.18);',
    '  box-shadow: 0 14px 30px rgba(2,6,23,0.42), 0 4px 16px rgba(96,165,250,0.16);',
    '}',
    '.nexus-ai-fab:hover, .nexus-ai-fab:focus-visible {',
    '  opacity: 1;',
    '  transform: translateX(0) scale(1.02);',
    '}',
    '.nexus-ai-fab:active {',
    '  transform: translateX(0) scale(0.94);',
    '  box-shadow: 0 6px 16px rgba(91,141,255,0.22);',
    '}',
    '.nexus-ai-fab.docked {',
    '  transform: translateX(calc(100% - 14px));',
    '  opacity: 0.34;',
    '  box-shadow: 0 6px 16px rgba(15,23,42,0.10);',
    '}',
    '.nexus-ai-fab.docked:hover, .nexus-ai-fab.docked:focus-visible {',
    '  transform: translateX(0);',
    '  opacity: 1;',
    '}',
    '.nexus-ai-fab .fab-label {',
    '  position: absolute;',
    '  right: 56px;',
    '  background: rgba(15,23,42,0.85);',
    '  backdrop-filter: blur(8px);',
    '  color: #fff;',
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
    '.nexus-ai-fab .fab-logo-wrap {',
    '  width: 24px;',
    '  height: 24px;',
    '  flex: 0 0 auto;',
    '}',
    '.nexus-ai-fab:hover .fab-label, .nexus-ai-fab.show-label .fab-label { opacity: 1; }',
    '@keyframes nexusFabPulse {',
    '  0% { box-shadow: 0 12px 30px rgba(15,23,42,0.14), 0 0 0 0 rgba(91,141,255,0.28); }',
    '  70% { box-shadow: 0 12px 30px rgba(15,23,42,0.14), 0 0 0 10px rgba(91,141,255,0); }',
    '  100% { box-shadow: 0 12px 30px rgba(15,23,42,0.14), 0 0 0 0 rgba(91,141,255,0); }',
    '}',
    '.nexus-ai-fab.pulse { animation: nexusFabPulse 2s ease-out; }',
    '.nexus-ai-fab.no-nav { bottom: max(18px, calc(env(safe-area-inset-bottom) + 18px)); }'
  ].join('\n');
  document.head.appendChild(style);

  var fab = document.createElement('button');
  fab.className = 'nexus-ai-fab';
  fab.setAttribute('aria-label', 'NEXUS AI Asistan');
  fab.setAttribute('title', 'NEXUS AI Asistan');
  fab.innerHTML = [
    '<div class="fab-logo-wrap">',
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

  function checkNav() {
    var nav = document.querySelector('nav[data-purpose="bottom-nav"], nav.fixed.bottom-0, nav.fixed');
    if (!nav) fab.classList.add('no-nav');
  }

  fab.addEventListener('click', function () {
    if (fab.classList.contains('docked')) {
      undock();
      return;
    }
    var pageName = window.location.pathname.split('/').pop() || 'nexus-home.html';
    window.location.href = 'nexus-chat.html?from=' + encodeURIComponent(pageName);
  });

  var dockTimer = null;
  function scheduleDock() {
    clearTimeout(dockTimer);
    dockTimer = setTimeout(function () {
      fab.classList.add('docked');
    }, 2600);
  }

  function undock() {
    fab.classList.remove('docked');
    scheduleDock();
  }

  window.addEventListener('scroll', undock, { passive: true });
  document.addEventListener('touchstart', function (event) {
    if (event.target !== fab && !fab.contains(event.target)) undock();
  }, { passive: true });

  // Sayfanın altında sabit duran bir aksiyon butonu/alt bar varsa FAB onun üstüne çıkar;
  // listelerin son satırı da FAB'ın altında kalmasın diye içeriğin sonuna boşluk bırakılır.
  function avoidOverlap() {
    var maxH = 0;
    Array.prototype.forEach.call(document.body.querySelectorAll('footer, div, section, nav'), function (el) {
      if (el === fab || fab.contains(el)) return;
      var cs = window.getComputedStyle(el);
      if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return;
      var r = el.getBoundingClientRect();
      if (r.height <= 0 || r.height > window.innerHeight * 0.5) return;
      if (Math.abs(window.innerHeight - r.bottom) > 2) return; // yalnızca alta yapışık öğeler
      if (r.width < window.innerWidth * 0.6) return;
      maxH = Math.max(maxH, r.height);
    });
    if (maxH > 0) fab.style.bottom = Math.round(maxH + 16) + 'px';
    var main = document.querySelector('main');
    if (main) {
      var pb = parseFloat(window.getComputedStyle(main).paddingBottom) || 0;
      var need = (maxH > 0 ? maxH : 0) + 64;
      if (pb < need) main.style.paddingBottom = need + 'px';
    }
  }

  function addToPage() {
    document.body.appendChild(fab);
    checkNav();
    avoidOverlap();
    setTimeout(avoidOverlap, 600);

    var pulsed = false;
    try {
      pulsed = sessionStorage.getItem('nexusFabPulsed') === '1';
    } catch (error) {}

    if (!pulsed) {
      try {
        sessionStorage.setItem('nexusFabPulsed', '1');
      } catch (error) {}

      setTimeout(function () {
        fab.classList.add('pulse');
        fab.classList.add('show-label');
        setTimeout(function () {
          fab.classList.remove('pulse');
          fab.classList.remove('show-label');
        }, 2500);
      }, 1500);
    }

    scheduleDock();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addToPage);
  } else {
    addToPage();
  }
})();
