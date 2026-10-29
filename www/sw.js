/**
 * NEXUS PWA service worker (issue #17)
 * ------------------------------------
 * Amaç: kurulum (install) + temel çevrimdışı kabuk. Politikalar:
 *  - statik varlıklar (css/js/font/ikon): cache-first (stale-while-revalidate)
 *  - uygulama sayfaları (nexus-*.html): network-first, çevrimdışinda son kopya
 *  - API/lambilgi (supabase, open-meteo, whop, workers): asla önbelleklenmez
 * Cihaz kontrolü yerel ağa gider; SW bu isteklere dokunmaz (aynı-origin değil).
 */
var CACHE = 'nexus-shell-v10'; // v10: 1.0.32 — bildirim kanalları yüzeyi, a11y modu, ayarlar düzeni
var SHELL = [
  'css/tailwind.css', 'css/nexus-ui.css', 'css/nexus-controls.css', 'css/nexus-desktop.css',
  'fonts/inter/inter.css',
  'js/lucide.js',
  'theme.js', 'auth.js', 'data.js', 'device-controls.js', 'supported-devices.js',
  'lan-connectors.js', 'automation-engine.js', 'i18n.js', 'lang-en.js',
  'ai-fab.js', 'sheet-gestures.js', 'nexus-dialog.js', 'nexus-undo.js', 'nexus-assistant.js', 'nexus-feedback.js',
  'icons/icon-192.webp', 'icons/icon-512.webp',
  'nexus-home.html', 'nexus-login.html', 'nexus-onboarding.html'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // Kabuk tek tek eklenir; bir öğe yoksa kurulum patlamasın
    return Promise.allSettled(SHELL.map(function (f) { return c.add(f); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

var NEVER = /supabase|open-meteo|whop|workers\.dev|api\.github|geocoding/;

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return; // yerel ağ/API trafiğine dokunma
  if (NEVER.test(url.pathname)) return;

  var isAsset = /\.(css|js|webp|png|svg|woff2?|ttf)$/i.test(url.pathname) || url.pathname.indexOf('/fonts/') === 0 || url.pathname.indexOf('/icons/') === 0;

  if (isAsset) {
    // stale-while-revalidate
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) { if (res && res.ok) c.put(req, res.clone()); return res; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
    return;
  }

  // sayfalar: network-first
  if (req.mode === 'navigate' || /\.html$/i.test(url.pathname)) {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match('nexus-home.html').then(function (h) { return h || Response.error(); });
      });
    }));
  }
});
