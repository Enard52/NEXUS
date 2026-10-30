// NEXUS — Push bildirim kaydı (FCM) ve cihazlar-arası iletim
// -----------------------------------------------------------
// Amaç: uygulama KAPALIYKEN bile aile üyesinin kritik olayı ve (yakında) aile
// sohbeti bildirimine ulaşsın. Üç parça:
//   1. firebase-messaging-sw.js  → arka plan push'u OS uyarı merkezine düşürür
//   2. push.js (bu dosya)        → token kaydı + ön planda olayı uygulamaya verme
//   3. push-send Edge Function   → sunucudan FCM'e gerçek gönderim
//
// Yapılandırma cloud-config.js'teki window.NEXUS_FIREBASE'ten gelir (gitignore'da;
// CI'da ensure-cloud-config üretir). Değer yoksa modül KENDİNİ KAPATIR — hiçbir
// ağ çağrısı yapılmaz ve arayüzde "yapılandırma yok" bilinciyle görünmez olur.
// Alıcı tarafı opt-in'dir: token'ı kaydettiren cihaz alır; kaydettirmeyen almaz.
//
// Sunucu tarafı hedefleme e-postayla çözülür (aile üyeleri yerel verisinde
// e-posta taşır; sunucuda ev tablosu yok). DND / sessiz saatler / kategori
// filtreleri notify.js tarafında gönderim öncesi zaten uygulanır.
(function () {
  "use strict";

  if (window.nexusPush) return;

  var STATE = {
    config: null,
    messaging: null,
    token: null,
    registering: null,
    disabledReason: "",
  };

  function cfg() {
    if (STATE.config) return STATE.config;
    var f = window.NEXUS_FIREBASE;
    if (f && f.apiKey && f.projectId && f.appId && f.messagingSenderId) {
      STATE.config = f;
      return f;
    }
    return null;
  }

  function authed() {
    return !!(window.nexusCloud && typeof nexusCloud.session === "function");
  }

  function put(key, value) {
    try { window.nexusSetItem(key, JSON.stringify(value)); } catch (e) { /* kota */ }
  }

  function get(key, fallback) {
    try {
      var raw = window.nexusGetItem ? window.nexusGetItem(key) : localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  // --- Token kaydı -----------------------------------------------------------
  // Web'de FCM compat SDK; yerel Android kabuğunda (Capacitor) PushNotifications
  // eklentisi varsa onun token'ı kullanılır (aynı tabloya yazılır, platform farklı).
  function platformName() {
    try {
      if (window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
        return Capacitor.getPlatform() || "native";
      }
    } catch (e) {}
    return "web";
  }

  function saveTokenToServer(token) {
    if (!authed()) return Promise.resolve(false);
    // NOT: cloud-sync.pushSend yerine doğrudan REST upsert (tek satır kaydı);
    // auth header session'dan gelir.
    return window.nexusCloud.pushRegisterToken(token, platformName()).then(function () {
      put("nexusPushToken", { token: token, at: Date.now() });
      return true;
    });
  }

  function registerWeb() {
    var f = cfg();
    if (!f) return Promise.reject(new Error("sunucu bildirimi yapılandırılmamış"));
    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
      return Promise.reject(new Error("bu cihaz sunucu bildirimini desteklemiyor"));
    }
    // Compat SDK vendor'dan (script-src 'self' CSP'siyle uyumlu).
    function loadSdk() {
      if (window.firebase && firebase.messaging) return Promise.resolve();
      var a = document.createElement("script");
      a.src = "js/firebase-app-compat.js";
      var b = document.createElement("script");
      b.src = "js/firebase-messaging-compat.js";
      return new Promise(function (resolve, reject) {
        b.onerror = function () { reject(new Error("sdk yüklenemedi")); };
        a.onerror = function () { reject(new Error("sdk yüklenemedi")); };
        b.onload = resolve;
        a.onload = function () { document.head.appendChild(b); };
        document.head.appendChild(a);
      });
    }
    return loadSdk().then(function () {
      firebase.initializeApp(f);
      STATE.messaging = firebase.messaging();
      // Arka plan SW: yapılandırma sorgu dizgisinde (dosyaya gömülmez).
      var cfgParam = btoa(unescape(encodeURIComponent(JSON.stringify(f))))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      return navigator.serviceWorker.register(
        "firebase-messaging-sw.js?cfg=" + cfgParam,
        { scope: "/" }
      );
    }).then(function () {
      if (Notification.permission === "granted") return true;
      return STATE.messaging.requestPermission().then(function () { return true; });
    }).then(function () {
      return STATE.messaging.getToken({
        vapidKey: f.vapidKey,
        serviceWorkerRegistration: navigator.serviceWorker.getRegistration("/"),
      });
    }).then(function (token) {
      if (!token) throw new Error("token boş");
      STATE.token = token;
      return saveTokenToServer(token);
    }).then(function () {
      // Token yenilendiğinde sunucuyu güncel tut.
      STATE.messaging.onTokenRefresh(function () {
        STATE.messaging.getToken({ vapidKey: cfg().vapidKey }).then(function (t) {
          if (t) { STATE.token = t; saveTokenToServer(t); }
        }).catch(function () {});
      });
      // Ön planda gelen push: OS bildirimi yerine uygulama içi akış.
      STATE.messaging.onMessage(function (payload) {
        try {
          var d = payload.data || {};
          var n = payload.notification || {};
          if (window.nexusNotify && typeof window.nexusNotify.ingestRemoteEvent === "function" && d.nexus_event_id) {
            window.nexusNotify.ingestRemoteEvent({
              id: d.nexus_event_id,
              title: n.title || d.title || "",
              detail: n.body || d.body || "",
              level: d.nexus_level || "info",
              ts: Date.now(),
            });
          } else if (window.nexusFeedback) {
            window.nexusFeedback.play("notify");
          }
        } catch (e) {}
      });
      return token;
    });
  }

  function register() {
    if (STATE.registering) return STATE.registering;
    var f = cfg();
    if (!f) {
      STATE.disabledReason = "sunucu bildirimi yapılandırılmamış";
      return Promise.resolve(null);
    }
    if (!authed()) {
      STATE.disabledReason = "oturum-yok";
      return Promise.resolve(null);
    }
    STATE.registering = registerWeb().catch(function (err) {
      STATE.disabledReason = String((err && err.message) || err).slice(0, 60);
      STATE.registering = null;
      return null;
    });
    return STATE.registering;
  }

  // --- Gönderim (sunucuya) ----------------------------------------------------
  // Kritik olayı aile üyelerine ilet: hedefler üye e-postalarından gelir.
  function sendEventTo(emails, event) {
    if (!cfg()) return Promise.reject(new Error("sunucu bildirimi yapılandırılmamış"));
    if (!authed()) return Promise.reject(new Error("oturum-yok"));
    var list = (Array.isArray(emails) ? emails : [])
      .map(function (e) { return String(e || "").trim(); })
      .filter(Boolean);
    if (!list.length) return Promise.resolve({ ok: true, sent: 0 });
    return window.nexusCloud.pushSend({
      action: "event",
      emails: list,
      title: String(event && event.title || "").slice(0, 120),
      body: String(event && event.detail || "").slice(0, 400),
      level: String(event && event.level || "info").slice(0, 20),
      eventId: String(event && event.id || "").slice(0, 64),
    });
  }

  function sendTest() {
    return register().then(function () {
      return window.nexusCloud.pushSend({
        action: "test",
        title: window.nexusT ? nexusT("NEXUS test bildirimi", "NEXUS test notification") : "NEXUS test bildirimi",
        body: window.nexusT ? nexusT("Bu bir test bildirimi — uygulama kapalıyken de böyle düşer.", "This is a test notification — it also arrives while the app is closed.") : "Test",
      });
    });
  }

  // Oturum açılınca kaydol (her sayfa yüklenişinde hafif: config/oturum yoksa no-op).
  function autoRegister() {
    // Token'ı son kayıttan bu yana 12 gün geçtiyse yenile (FCM süresiz ama
    // tarayıcı/SW temizliğinde bayatlayabilir).
    var saved = get("nexusPushToken", null);
    var stale = !saved || Date.now() - (saved.at || 0) > 12 * 86400000;
    if (stale) register();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoRegister);
  } else {
    setTimeout(autoRegister, 1500);
  }
  // Oturum senkronu sonrası tekrar dene (giriş sayfadan yapılıyorsa).
  window.addEventListener("nexusCloudStatePulled", autoRegister);

  window.nexusPush = {
    register: register,
    sendEventTo: sendEventTo,
    sendTest: sendTest,
    status: function () {
      return {
        configured: !!cfg(),
        authed: authed(),
        token: !!STATE.token,
        disabledReason: STATE.disabledReason,
        platform: platformName(),
      };
    },
  };
})();
