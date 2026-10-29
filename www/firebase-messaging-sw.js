/**
 * NEXUS — FCM arka plan push service worker
 * ------------------------------------------
 * Uygulama kapalıyken/arka plandayken gelen push'u işletim sisteminin uyarı
 * merkezine düşürür. Sayfa tarafı push.js'te; bu dosya yalnızca arka plan.
 *
 * Firebase yapılandırması dosyaya GÖMÜLMEZ: push.js worker'ı sorgu dizgisiyle
 * kaydeder (?cfg=<base64 JSON>) ve aşağıda scriptURL'den çözer. Böylece
 * anahtarlar tek kaynaktan (cloud-config.js / ortam) gelir, dosya statiktir.
 *
 * Kuyruk tekniği (notificationclick: windowClient yoksa tıklama push'taki
 * data.url'e gider — derin bağlantı).
 */
/* eslint-env serviceworker */
importScripts("/js/firebase-app-compat.js");
importScripts("/js/firebase-messaging-compat.js");

var CFG = null;
try {
  var qs = (self.serviceWorker.scriptURL.split("?")[1] || "");
  var m = qs.match(/cfg=([A-Za-z0-9\-_]+)/);
  if (m) CFG = JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g, "+").replace(/_/g, "/")))));
} catch (e) { CFG = null; }

if (CFG && CFG.apiKey && CFG.projectId) {
  firebase.initializeApp(CFG);
  try {
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage(function (payload) {
      var data = payload.data || {};
      var n = payload.notification || {};
      var title = n.title || data.title || "NEXUS";
      var body = n.body || data.body || "";
      var url = data.url || "nexus-home.html";
      var tag = data.nexus_event_id ? "nexus-" + data.nexus_event_id : "nexus";
      self.registration.showNotification(title, {
        body: body,
        icon: "/icons/icon-192.webp",
        badge: "/icons/icon-192.webp",
        tag: tag,
        renotify: false,
        data: { url: url },
      });
    });
  } catch (e) { /* SDK kurulum başarısızsa push sessizce düşmez — hata konsola */ }
} else {
  // Yapılandırma yok: worker var ama hiçbir şeye abone değil (yerel mod).
}

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || "nexus-home.html";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        try { if (c.url.indexOf(self.location.origin) === 0) { c.focus(); return c.navigate(url); } } catch (e) {}
      }
      return self.clients.openWindow(url);
    }),
  );
});
