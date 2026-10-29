// NEXUS — dışa dönük bildirim kanalları (ntfy / webhook / Telegram / sistem bildirimi).
//
// Uygulamanın olay akışı zaten tek kaynakta: nexusEvents (otomasyon motoru, sahneler ve
// enerji stratejisi buraya yazıyor; rozet, "Mesajlar" ekranı ve masaüstü köprüsü de buradan
// okuyor). Bu modül o akışa YENİ bir olay eklendiğinde, kullanıcının kurduğu kanallara
// haberi dağıtır — böylece telefon elde değilken, sekme kapalıyken ya da kendi sunucunda
// NEXUS'u izlemek istediğinde bildirim ulaşır.
//
// Kayıt/dış hizmet ZORUNLU DEĞİL:
//   • ntfy    → https://ntfy.sh/<topic> — topic seçmek yeterli, hesap açmadan çalışır.
//   • webhook → kendi HTTPS ucun (JSON POST).
//   • telegram→ kendi bot anahtarı + sohbet id (yalnızca bu cihazda saklanır).
//   • sistem  → telefonda Capacitor yerel bildirim eklentisi varsa, web'de Notification API;
//               yoksa uygulama içi uyarı şeridiyle görünür kalır.
// Rahatsız etmeyin (DND) süresi açıkken dış kanallara hiçbir şey gönderilmez; olay yine
// uygulama içinde birikir. Telegram anahtarı hiçbir yere loglanmaz ve BULUTA GİTMEZ
// (cloud-sync.js STATE_EXCLUDE içinde).
(function () {
  "use strict";

  if (window.nexusNotify) return;

  var CHANNELS_KEY = "nexusNotifyChannels";
  var SEEN_KEY = "nexusNotifySeen";
  var STATS_KEY = "nexusNotifyStats";
  var EVENTS_KEY = "nexusEvents";
  var MAX_SEEN = 400;

  var DEFAULTS = {
    ntfy: { enabled: false, topic: "" },
    webhook: { enabled: false, url: "" },
    telegram: { enabled: false, token: "", chat: "" },
    system: { enabled: true },
  };

  function get(key, fallback) {
    try {
      var raw = window.nexusGetItem ? window.nexusGetItem(key) : localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function put(key, value) {
    try {
      if (window.nexusSetItem) window.nexusSetItem(key, JSON.stringify(value));
      else localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* kota dolu / özel mod */
    }
  }

  function channels() {
    var saved = get(CHANNELS_KEY, null) || {};
    var out = {};
    Object.keys(DEFAULTS).forEach(function (name) {
      out[name] = Object.assign({}, DEFAULTS[name], saved[name] || {});
    });
    return out;
  }

  function saveChannels(next) {
    var merged = channels();
    Object.keys(next || {}).forEach(function (name) {
      if (merged[name]) merged[name] = Object.assign({}, merged[name], next[name]);
    });
    put(CHANNELS_KEY, merged);
    return merged;
  }

  // DND: süre damgası gelecekteyse ya da açıkça işaretliyse dışarıya sessiz kal.
  function dndActive() {
    var until = 0;
    try {
      until =
        parseInt(
          (window.nexusGetItem
            ? window.nexusGetItem("nexusDndEndTime")
            : localStorage.getItem("nexusDndEndTime")) || "0",
          10,
        ) || 0;
    } catch (e) {
      until = 0;
    }
    if (until && Date.now() < until) return true;
    try {
      return (
        (window.nexusGetItem
          ? window.nexusGetItem("nexusDndActive")
          : localStorage.getItem("nexusDndActive")) === "true"
      );
    } catch (e) {
      return false;
    }
  }

  function stats() {
    return get(STATS_KEY, { sent: 0, failed: 0, lastError: "", lastAt: 0, byChannel: {} });
  }

  function record(name, ok, error) {
    var s = stats();
    if (ok) s.sent++;
    else s.failed++;
    s.byChannel = s.byChannel || {};
    s.byChannel[name] = {
      ok: ok
        ? ((s.byChannel[name] && s.byChannel[name].ok) || 0) + 1
        : (s.byChannel[name] && s.byChannel[name].ok) || 0,
      failed: ok
        ? (s.byChannel[name] && s.byChannel[name].failed) || 0
        : ((s.byChannel[name] && s.byChannel[name].failed) || 0) + 1,
    };
    if (!ok) s.lastError = String((error && error.message) || error || "bilinmeyen").slice(0, 160);
    s.lastAt = Date.now();
    put(STATS_KEY, s);
    return s;
  }

  function post(url, body, headers) {
    return fetch(url, {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, headers || {}),
      body: JSON.stringify(body),
    }).then(function (res) {
      if (!res.ok) throw new Error("http " + res.status);
      return res;
    });
  }

  // Olay yazarlarının hepsi (automation-engine, smart-scene-page, enerji stratejisi)
  // ts'i SAYI olarak yazıyor: ts: Date.now(). Date.parse(sayı) geçersiz tarih döndürür,
  // yani tek taze olay sanılıp hepsi çöpe gidiyordu — hiçbir kanal hiç tetiklenmezdi.
  function tsMs(event) {
    var raw = event && event.ts;
    if (typeof raw === "number" && isFinite(raw)) return raw > 1e11 ? raw : raw * 1000;
    var parsed = Date.parse(String(raw == null ? "" : raw));
    return isNaN(parsed) ? 0 : parsed;
  }

  function isoTs(event) {
    var t = tsMs(event);
    return new Date(t || Date.now()).toISOString();
  }

  // --- Ayarlar sayfasının anahtarları (nexus-instant-notifications.html) ----------
  // Bu sayfadaki toggle'lar eskiden hiçbir yere okunmuyordu: "Bildirimlere İzin Ver"
  // kapalıyken bile Telegram'a haber gidebiliyordu. Artık dağıtım gerçekten bu
  // anahtarlardan geçer. Varsayılan hepsi AÇIK — kimse dokunmazsa davranış değişmez.
  var PAGE_PREFIX = "nexusInstantNotif:";

  function rawGet(key) {
    try {
      return window.nexusGetItem ? window.nexusGetItem(key) : localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function pageFlag(key, dflt) {
    var raw = rawGet(PAGE_PREFIX + key);
    if (raw === null || raw === "") return dflt;
    return raw !== "false";
  }

  // Sayfadaki dört satır gerçek olay türleriyle eşlenir; bilinmeyen tür "Kritik
  // Uyarılar" grubuna düşer (satır kapalıysa kullanıcı hiçbir uyarı istemiyor demektir).
  function categoryOf(event) {
    var type = String((event && event.type) || "");
    if (type === "energy" || type === "plan") return "notif-energy";
    if (type === "ai") return "notif-ai";
    return "notif-security";
  }

  function minutesOf(value) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
    if (!m) return null;
    var h = parseInt(m[1], 10);
    var min = parseInt(m[2], 10);
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
  }

  // Gece yarısını aşan aralık (23:00 → 07:30) normal durum: o yüzden ayrı hesaplanır.
  function quietHoursActive() {
    if (!pageFlag("quietEnabled", false)) return false;
    var start = minutesOf(rawGet(PAGE_PREFIX + "quietStart") || "23:00");
    var end = minutesOf(rawGet(PAGE_PREFIX + "quietEnd") || "07:30");
    if (start === null || end === null) return false;
    var now = new Date();
    var cur = now.getHours() * 60 + now.getMinutes();
    if (start === end) return true;
    return start < end ? cur >= start && cur < end : cur >= start || cur < end;
  }

  // Sessiz saatler dışa dönük kanalları durdurur; olay listesi yine dolmaya devam eder.
  // level:'critical' işareti gelecekteki güvenlik entegratörleri için ayrılmış aşım
  // kapısıdır — bugün hiçbir yazar o işareti koymuyor, yani kural bilinçli olarak
  // tembel: yanlış sınıflandırma ile gürültü üretmektense sessiz kalmayı seçiyoruz.
  function suppressReason(event) {
    if (!pageFlag("master", true)) return "master";
    if (!pageFlag(categoryOf(event), true)) return "category";
    if (quietHoursActive() && String(event && event.level) !== "critical") return "quiet-hours";
    return "";
  }

  // http:// düz metin gider: Telegram anahtarı ve webhook içeriği dinlenebilir olur.
  function isHttps(url) {
    return /^https:\/\//i.test(String(url || ""));
  }

  // ntfy başlığı HTTP başlığına yazıyor. Başlıklar yalnızca ISO-8859-1 taşır:
  // "Kapı algılandı" gibi Türkçe bir başlık fetch'i tamamen patlatıyordu
  // ("String contains non ISO-8859-1 code point") — yani ntfy kanalı hiçbir gerçek
  // olayda çalışmıyordu. Başlık sadeleştirilir; tam Türkçe metin gövdede kalır.
  var ASCII_MAP = { ğ: "g", ü: "u", ş: "s", ı: "i", ö: "o", ç: "c", â: "a", î: "i", û: "u" };
  var ASCII_MAP_U = { Ğ: "G", Ü: "U", Ş: "S", İ: "I", Ö: "O", Ç: "C", Â: "A", Î: "I", Û: "U" };

  function asciiText(value, limit) {
    var raw = String(value == null ? "" : value);
    raw = raw.replace(/[ğüşıöçâîû]/g, function (c) {
      return ASCII_MAP[c] || c;
    });
    raw = raw.replace(/[ĞÜŞİÖÇÂÎÛ]/g, function (c) {
      return ASCII_MAP_U[c] || c;
    });
    raw = raw
      .replace(/[—–·•]/g, "-")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"');
    raw = raw.normalize("NFD").replace(/[̀-ͯ]/g, ""); // kalan tüm aksanları düşür
    raw = raw
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    var max = limit || 120;
    return raw.length > max ? raw.slice(0, max - 1).trim() + "..." : raw;
  }

  // Başlıksız olayların düşer metni: dil İngilizceyse İngilizce olsun (gövde/Telegram/bildirim).
  function alertWord() {
    return window.nexusT ? nexusT("Uyarı", "Alert") : "Uyarı";
  }

  function sendNtfy(cfg, event) {
    var topic = String(cfg.topic || "").trim();
    if (!topic) return Promise.reject(new Error("ntfy topic boş"));
    // Okunabilirlik: Türkçe başlık gövdenin ilk satırında durur, başlıkta sade hâli.
    var body = [String(event.title || alertWord()), event.detail || ""].filter(Boolean).join("\n");
    return fetch("https://ntfy.sh/" + encodeURIComponent(topic), {
      method: "POST",
      headers: {
        Title: asciiText("NEXUS " + (event.title || "Uyari"), 100) || "NEXUS",
        Priority: String(event.priority || "high"),
        Tags: "house",
      },
      body: body,
    }).then(function (res) {
      if (!res.ok) throw new Error("http " + res.status);
      return res;
    });
  }

  function sendWebhook(cfg, event) {
    if (!isHttps(cfg.url)) return Promise.reject(new Error("webhook https olmalı"));
    return post(cfg.url, {
      source: "NEXUS",
      id: String(event.id || ""),
      title: event.title || "",
      detail: event.detail || "",
      ts: isoTs(event),
    });
  }

  function sendTelegram(cfg, event) {
    var token = String(cfg.token || "").trim();
    var chat = String(cfg.chat || "").trim();
    if (!token || !chat)
      return Promise.reject(new Error("telegram bot anahtarı veya sohbet id eksik"));
    return post("https://api.telegram.org/bot" + token + "/sendMessage", {
      chat_id: chat,
      text: "NEXUS · " + (event.title || alertWord()) + (event.detail ? "\n" + event.detail : ""),
      disable_web_page_preview: true,
    });
  }

  var channelCreated = false;
  function ensureLocalChannel(ln) {
    if (channelCreated || !ln || typeof ln.createChannel !== "function") return Promise.resolve();
    channelCreated = true;
    return ln
      .createChannel({
        id: "nexus-alerts",
        name: window.nexusT
          ? nexusT("NEXUS Ev Uyarıları", "NEXUS Home Alerts")
          : "NEXUS Ev Uyarıları",
        description: window.nexusT
          ? nexusT(
              "Akıllı ev olayları ve güvenlik bildirimleri",
              "Smart home events and security alerts",
            )
          : "Akıllı ev olayları ve güvenlik bildirimleri",
        importance: 5,
        visibility: 1, // Kilit ekranında tam içerik gösterimi (NotificationCompat.VISIBILITY_PUBLIC)
        sound: "default",
        vibration: true,
        lights: true,
        lightColor: "#4C7DFF",
      })
      .catch(function () {});
  }

  function sendSystem(event) {
    // 1) Telefonda (Android & gelecekte iOS) Capacitor yerel bildirim eklentisi (Kilit ekranı dahil)
    var cap = window.Capacitor;
    var ln = cap && cap.Plugins && cap.Plugins.LocalNotifications;
    if (ln && typeof ln.schedule === "function") {
      var notifTitle = String(
        event.title || (window.nexusT ? nexusT("NEXUS Uyarısı", "NEXUS Alert") : "NEXUS Uyarısı"),
      );
      return ensureLocalChannel(ln)
        .then(function () {
          return ln.checkPermissions
            ? ln.checkPermissions()
            : Promise.resolve({ display: "granted" });
        })
        .then(function (perm) {
          if (perm && perm.display === "prompt") return ln.requestPermissions();
          return perm;
        })
        .then(function (perm) {
          if (perm && perm.display === "denied") return { denied: true };
          return ln.schedule({
            notifications: [
              {
                id: hashId(event),
                title: notifTitle,
                body: String(event.detail || ""),
                channelId: "nexus-alerts",
                smallIcon: "ic_launcher",
                sound: "default",
                extra: { id: event.id, page: event.page || "nexus-messages.html" },
              },
            ],
          });
        });
    }
    // 2) Web: Notification API izni varsa gerçek sistem bildirimi.
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        var n = new Notification("NEXUS: " + (event.title || alertWord()), {
          body: event.detail || "",
          tag: "nexus-" + hashId(event),
        });
        setTimeout(function () {
          try {
            n.close();
          } catch (e) {}
        }, 12000);
        return Promise.resolve(n);
      } catch (e) {
        /* bazı WebView'lar kurucu izin vermez */
      }
    }
    // 3) Yedeği yok: uygulama içi şerit (sayfa açıksa görünür, olay zaten listede durur).
    if (typeof window.nexusShowNotice === "function") {
      try {
        window.nexusShowNotice(event);
        return Promise.resolve({ inApp: true });
      } catch (e) {
        /* düşerse sessiz: olay listesi zaten güncel */
      }
    }
    return Promise.resolve({ skipped: true });
  }

  function hashId(event) {
    var raw = String((event && (event.id || event.title + "|" + (event.ts || ""))) || Date.now());
    var h = 2166136261;
    for (var i = 0; i < raw.length; i++) {
      h ^= raw.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % 100000000;
  }

  // Olayı dağıtmadan önce "ben bu olayı gördüm" diye işaretleyip sahiplenir.
  // Depolama kullanıcı önekiyle paylaşıldığı için aynı hesapta birden çok sekme/
  // uygulama açık olsa bile haber BİR KEZ gider.
  function claim(id) {
    var key = String(id || "");
    if (!key) return false;
    var seen = get(SEEN_KEY, []);
    if (!Array.isArray(seen)) seen = [];
    if (seen.indexOf(key) !== -1) return false;
    seen.push(key);
    if (seen.length > MAX_SEEN) seen = seen.slice(-MAX_SEEN);
    put(SEEN_KEY, seen);
    return true;
  }

  function fanout(cfg, event) {
    var jobs = [];
    if (cfg.system.enabled)
      jobs.push([
        "system",
        function () {
          return sendSystem(event);
        },
      ]);
    if (cfg.ntfy.enabled)
      jobs.push([
        "ntfy",
        function () {
          return sendNtfy(cfg.ntfy, event);
        },
      ]);
    if (cfg.webhook.enabled)
      jobs.push([
        "webhook",
        function () {
          return sendWebhook(cfg.webhook, event);
        },
      ]);
    if (cfg.telegram.enabled)
      jobs.push([
        "telegram",
        function () {
          return sendTelegram(cfg.telegram, event);
        },
      ]);
    var results = [];
    return jobs
      .reduce(function (chain, job) {
        return chain.then(function () {
          return Promise.resolve()
            .then(job[1])
            .then(
              function () {
                results.push({ channel: job[0], ok: true });
                record(job[0], true);
              },
              function (error) {
                results.push({
                  channel: job[0],
                  ok: false,
                  error: String((error && error.message) || error).slice(0, 160),
                });
                record(job[0], false, error);
              },
            );
        });
      }, Promise.resolve())
      .then(function () {
        return results;
      });
  }

  function deliver(event) {
    if (!event || !event.id) return Promise.resolve({ sent: [] });
    if (!claim(event.id)) return Promise.resolve({ sent: [], duplicate: true });
    var reason = dndActive() ? "dnd" : suppressReason(event);
    if (reason) return Promise.resolve({ sent: [], dnd: reason === "dnd", suppressed: reason });
    // Yeni gerçek olay: uygulama içinde nazik zil (Ayarlar → Ses kapalıysa sessiz;
    // DND/sessiz saat zaten yukarıda kesildiği için buraya yalnızca aktarılan olay gelir).
    try {
      if (window.nexusFeedback && typeof window.nexusFeedback.play === "function")
        window.nexusFeedback.play("notify");
    } catch (e) {
      /* ses asıl işi engellemesin */
    }
    return fanout(channels(), event).then(function (results) {
      return { sent: results };
    });
  }

  function events() {
    var list = get(EVENTS_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  var started = false;
  var MAX_PER_RUN = 8; // biriken olaylar sırayla dağıtılır, tek seferde spam olmaz

  function checkNew(options) {
    var opts = options || {};
    var list = events();
    if (opts.markOnly) {
      // İlk kurulum: eski olayları sahiplen, hiçbir yere gönderme.
      list.forEach(function (e) {
        if (e && e.id) claim(e.id);
      });
      return Promise.resolve({ marked: list.length });
    }
    // "Taze" filtresi yerine sahiplenme (claim) kullanılıyor: uygulama kapalıyken
    // biriken haber de gider, ama hiçbir olay iki kez gitmez.
    var pending = list
      .filter(function (e) {
        return !!(e && e.id);
      })
      .slice(-MAX_PER_RUN);
    return pending.reduce(function (chain, event) {
      return chain.then(function () {
        return deliver(event);
      });
    }, Promise.resolve());
  }

  /* Tek kanallık denemeye izin verir: `only` verilmemişse açık tüm kanallara gider
     (eskiden olduğu gibi), verilmişse yalnızca sayılan kanallar bırakılır. Sistem
     izni düğmesi bu sayede Telegram'a sormadan sadece kendi bildirimi düşürebiliyor. */
  function restrict(cfg, only) {
    if (!Array.isArray(only)) return cfg;
    var out = {};
    Object.keys(cfg).forEach(function (name) {
      out[name] = Object.assign({}, cfg[name], {
        enabled: only.indexOf(name) !== -1 && cfg[name].enabled,
      });
    });
    return out;
  }

  // "Test gönder" kullanıcı komutudur: sessiz saatler / kategori anahtarı testi
  // engellememeli, aksi halde kanal bozukmuş gibi görünür. DND asıl söz hakkı değil,
  // yine de test engellenmez — ama olay akışına YAZILMAZ (listede kirlilik olmaz).
  function test(only) {
    return fanout(restrict(channels(), only), {
      id: "notify-test-" + Date.now(),
      title: "Test bildirimi",
      detail: "NEXUS kanal denemesi — bunu görüyorsan kanal çalışıyor.",
      ts: new Date().toISOString(),
      priority: "default",
    }).then(function (results) {
      return { sent: results };
    });
  }

  /* Sistem izni — DÜRÜST sonuç döner: { permission, asked }.
     "asked" neden gerekli: Chromium bir kaynağa yalnızca KEZ sorar. İzin zaten
     "granted" ya da "denied" ise requestPermission() hiçbir pencere açmaz ve eski
     kararı geri döndürür. Masaüstü programda (desktop/main.cjs) izin istemcisi
     notifications:1 ile otomatik onaylandığı için orada hiç pencere çıkmaz.
     Çağıran "az önce sordum" ile "zaten biliniyordu"yu ayıramazsa, kullanıcı
     "tıkladım, hiçbir şey sorulmadan verildi diyor" diye haklı olarak yanıltılır. */
  function requestSystemPermission() {
    var cap = window.Capacitor;
    var ln = cap && cap.Plugins && cap.Plugins.LocalNotifications;
    if (ln && typeof ln.requestPermissions === "function") {
      return ensureLocalChannel(ln)
        .then(function () {
          // Android/iOS da aynı: "prompt" değilse sistem sormaz, kararı olduğu gibi verir.
          return ln.checkPermissions ? ln.checkPermissions() : { display: "prompt" };
        })
        .then(function (cur) {
          if (cur && cur.display && cur.display !== "prompt")
            return { permission: cur.display, asked: false };
          return ln.requestPermissions().then(function (res) {
            return { permission: (res && res.display) || "denied", asked: true };
          });
        })
        .catch(function () {
          return { permission: "denied", asked: true };
        });
    }
    if (typeof Notification === "undefined")
      return Promise.resolve({ permission: "unsupported", asked: false });
    if (Notification.permission !== "default")
      return Promise.resolve({ permission: Notification.permission, asked: false });
    return Promise.resolve(Notification.requestPermission())
      .then(function (p) {
        return { permission: p, asked: true };
      })
      .catch(function () {
        return { permission: "denied", asked: true };
      });
  }

  function start() {
    if (started || typeof window === "undefined") return;
    started = true;
    try {
      var cap = window.Capacitor;
      var ln = cap && cap.Plugins && cap.Plugins.LocalNotifications;
      if (ln && typeof ln.addListener === "function") {
        ln.addListener("localNotificationActionPerformed", function (action) {
          var extra = action && action.notification && action.notification.extra;
          var targetPage = extra && extra.page ? extra.page : "nexus-messages.html";
          if (window.location.href.indexOf(targetPage) === -1) {
            window.location.href = targetPage;
          }
        });
      }
    } catch (e) {}
    // Kurulum anında biriken eski olaylar dağıtılmaz; yalnızca sonrakiler.
    if (!get(SEEN_KEY, null)) checkNew({ markOnly: true });
    checkNew();
    window.addEventListener("storage", function (e) {
      if (e && e.key === EVENTS_KEY) checkNew();
    });
    // Sayfa arka plandayken zamanlayıcı kısılır; görünüre dönünce birikeni hemen dağıt.
    window.addEventListener("visibilitychange", function () {
      if (!document.hidden) checkNew();
    });
    // Aynı sekmede yazılanlar depolama olayı fırlatmaz: hafif yoklama.
    setInterval(function () {
      checkNew();
    }, 5000);
  }

  window.nexusNotify = {
    channels: channels,
    save: saveChannels,
    test: test,
    deliver: deliver,
    checkNew: checkNew,
    stats: stats,
    dndActive: dndActive,
    mutedBy: suppressReason,
    quietHoursActive: quietHoursActive,
    requestSystemPermission: requestSystemPermission,
    start: start,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
