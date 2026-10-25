/**
 * NEXUS — Evrensel Olay & Native Bildirim Köprüsü
 * - Masaüstü (Electron): Windows / macOS / Linux sistem tepsisi & yerel bildirimler
 * - Mobil (Capacitor / Android): Sistem bildirim çekmecesi & kilit ekranı
 * - Web / PWA: Tarayıcı Notification API
 *
 * nexusEvents'e yeni eklenen olayları işletim sisteminin yerel bildirim tepsisine iletir.
 * Masaüstünde ayrıca sistem tepsisi ipucu için canlı durum güncellemesi gönderir.
 */
(function () {
  var isDesktop = !!(window.nexusDesktop && window.nexusDesktop.notifyEvent);
  var isCapacitor = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  var isWebNotif = typeof Notification !== "undefined";

  // Eğer hiçbir bildirim altyapısı yoksa çalıştırma
  if (!isDesktop && !isCapacitor && !isWebNotif) return;

  function hashCode(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  function dispatchNativeNotification(ev) {
    var title = String(ev.title || "NEXUS");
    var body = String(ev.detail || "");

    // 1. Masaüstü (Electron)
    if (isDesktop) {
      window.nexusDesktop.notifyEvent({
        id: String(ev.id),
        title: title,
        detail: body,
        ts: ev.ts || Date.now()
      });
      return;
    }

    // 2. Mobil (Capacitor / Android Yerel Bildirim)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
      try {
        var numId = Math.abs(hashCode(String(ev.id || Date.now()))) % 2147483647;
        window.Capacitor.Plugins.LocalNotifications.schedule({
          notifications: [{
            title: title,
            body: body,
            id: numId || Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 50) },
            channelId: "nexus_home",
            smallIcon: "ic_stat_nexus"
          }]
        });
      } catch (e) {
        // Sessiz hata yakalama
      }
      return;
    }

    // 3. Tarayıcı / Web / PWA Notification API
    if (isWebNotif && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body: body,
          icon: "/icon.svg",
          tag: String(ev.id || Date.now())
        });
      } catch (e) {
        // Sessiz hata yakalama
      }
    }
  }

  // Görülen olaylar sayfalar arası gezinmede korunur (sessionStorage); uygulama ilk açıldığında
  // mevcut olaylar "eski" sayılır, böylece her açılışta sel gibi bildirim çıkmaz.
  var SEEN_KEY = "nxEvSeen";
  var seen = null;
  function loadSeen() {
    try {
      var v = JSON.parse(sessionStorage.getItem(SEEN_KEY) || "null");
      if (v && typeof v === "object") return v;
    } catch (e) {}
    return null;
  }
  function saveSeen() {
    try {
      var keys = Object.keys(seen);
      if (keys.length > 300) {
        keys.slice(0, keys.length - 300).forEach(function (k) { delete seen[k]; });
      }
      sessionStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    } catch (e) {}
  }

  function readJson(key, fallback) {
    try {
      var v = JSON.parse(nexusGetItem(key) || "null");
      return Array.isArray(v) ? v : fallback;
    } catch (e) {
      return fallback;
    }
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
      seen[ev.id] = 1;
      added = true;
      dispatchNativeNotification(ev);
    });
    if (added) saveSeen();
  }

  function pushStatus() {
    if (!isDesktop || !window.nexusDesktop.updateStatus) return;
    var devices = readJson("nexusPairedDevices", []);
    var on = 0;
    devices.forEach(function (d) { if (d && d.state && d.state.switch === true) on += 1; });
    var readMap = {};
    try { readMap = JSON.parse(nexusGetItem("nexusReadNotifs") || "{}") || {}; } catch (e) {}
    var events = readJson("nexusEvents", []);
    var unread = events.filter(function (e) { return e && e.id && !readMap[e.id]; }).length;
    window.nexusDesktop.updateStatus({ devices: devices.length, on: on, unread: unread });
  }

  function tick() {
    try {
      checkEvents();
      pushStatus();
    } catch (e) {}
  }

  // İlk bildirim izin isteği (Web / PWA)
  if (isWebNotif && Notification.permission === "default") {
    window.nexusRequestNotificationPermission = function () {
      Notification.requestPermission();
    };
  }

  window.addEventListener("storage", function (e) {
    if (e.key === "nexusEvents" || e.key === "nexusPairedDevices" || e.key === "nexusReadNotifs") tick();
  });

  setTimeout(tick, 200);
  setInterval(tick, 2000);
})();
