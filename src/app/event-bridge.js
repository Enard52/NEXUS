/**
 * NEXUS — Masaüstü olay köprüsü (yalnızca Electron uygulamasında çalışır).
 * nexusEvents'e yeni eklenen olayları ana sürece bildirir; ana süreç Windows
 * bildirimi olarak gösterir. Ayrıca tepsi ipucu için canlı durum gönderir
 * (cihaz sayısı, açık cihaz sayısı, okunmamış bildirim).
 * Depolama değişimi hem bu sekmeden hem diğer sekmelerden/telefon eşitlemesinden
 * gelebildiği için storage olayı + hafif polling birlikte kullanılır.
 */
(function () {
  if (!window.nexusDesktop || !window.nexusDesktop.notifyEvent) return;

  // Görülen olaylar sayfalar arası gezinmede korunur (sessionStorage); uygulama ilk açıldığında
  // mevcut olaylar "eski" sayılır, böylece her açılışta sel gibi bildirim çıkmaz.
  var SEEN_KEY = "nxEvSeen";
  var seen = null;
  function loadSeen() {
    try { var v = JSON.parse(sessionStorage.getItem(SEEN_KEY) || "null"); if (v && typeof v === "object") return v; } catch (e) { /* yok */ }
    return null;
  }
  function saveSeen() {
    try {
      var keys = Object.keys(seen);
      if (keys.length > 300) { keys.slice(0, keys.length - 300).forEach(function (k) { delete seen[k]; }); }
      sessionStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    } catch (e) { /* yok */ }
  }

  function readJson(key, fallback) {
    try {
      var v = JSON.parse(nexusGetItem(key) || "null");
      return Array.isArray(v) ? v : fallback;
    } catch (e) { return fallback; }
  }

  function checkEvents() {
    var events = readJson("nexusEvents", []);
    if (seen === null) seen = loadSeen();
    if (seen === null) {
      seen = {};
      events.forEach(function (e) { if (e && e.id) seen[e.id] = 1; });
      saveSeen();
      return;
    }
    var added = false;
    events.forEach(function (ev) {
      if (!ev || !ev.id || seen[ev.id]) return;
      seen[ev.id] = 1; added = true;
      window.nexusDesktop.notifyEvent({ id: String(ev.id), title: String(ev.title || "NEXUS"), detail: String(ev.detail || ""), ts: ev.ts || Date.now() });
    });
    if (added) saveSeen();
  }

  function pushStatus() {
    var devices = readJson("nexusPairedDevices", []);
    var on = 0;
    devices.forEach(function (d) { if (d && d.state && d.state.switch === true) on += 1; });
    var events = readJson("nexusEvents", []);
    var read = readJson("nexusReadNotifs", []);
    var unread = 0;
    events.forEach(function (ev) { if (ev && read.indexOf(ev.id) === -1) unread += 1; });
    window.nexusDesktop.updateStatus({ devices: devices.length, on: on, unread: unread });
  }

  // Bildirimlerin kendisi artık notify.js üzerinden gider (ana anahtar, kategori, sessiz saat,
  // rahatsız etmeyin ve "Sistem Bildirimleri" tercihlerine uyar); burada yalnızca tepsi durumu var.
  function tick() { try { pushStatus(); } catch (e) { /* arka plan görevi: sessiz */ } }

  window.addEventListener("storage", function (e) {
    if (e.key === "nexusEvents" || e.key === "nexusPairedDevices" || e.key === "nexusReadNotifs") tick();
  });
  window.addEventListener("focus", tick);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
  else tick();
  setInterval(tick, 3000);
})();
