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
//   • e-posta → hesabın KENDİ adresine; gönderimi notify-email Edge Function yapar,
//               istemcide saklanacak anahtar yok (gönderici anahtarı sunucudadır).
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
    email: { enabled: false },
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
    if (type === "emergency") return "notif-emergency";
    return "notif-security";
  }

  // Kritik olay: yazarın açıkça işaretlediği (level:'critical') ya da türü güvenlik/acil/alarm
  // olan olay. Bugünkü olay yazarları (otomasyon, sahne, enerji) bu türleri üretmez; gerçek bir
  // sensör/alarm olayı yazıldığında bu kural onu kendiliğinden kritik sayar.
  function isCritical(event) {
    if (!event) return false;
    if (String(event.level) === "critical") return true;
    return /^(security|emergency|alarm)$/.test(String(event.type || ""));
  }

  // Kategori başına ses/titreşim tercihi (sayfadaki "Ses ve Titreşim" satırları). Varsayılan
  // ikisi de açık; kritik olay tercihe bakmaz, her zaman sesli ve titreşimli gider.
  function alertPrefs(event) {
    var cat = categoryOf(event).replace("notif-", "");
    var critical = isCritical(event);
    return {
      cat: cat,
      critical: critical,
      sound: critical || pageFlag("sound-" + cat, true),
      vibrate: critical || pageFlag("vib-" + cat, true),
    };
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
  // Kritik olaylar (isCritical) sessiz saatleri aşar; kullanıcı sayfadaki
  // "Kritik uyarılar sessiz saatleri aşsın" anahtarını kapatarak bunu iptal edebilir.
  // Ana anahtar ve kategori anahtarı kritik olay için de geçerlidir.
  function suppressReason(event) {
    if (!pageFlag("master", true)) return "master";
    if (!pageFlag(categoryOf(event), true)) return "category";
    if (quietHoursActive() && !(isCritical(event) && pageFlag("critical-override", true)))
      return "quiet-hours";
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
        Priority: String(event.priority || (isCritical(event) ? "urgent" : "high")),
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

  // E-posta kanalı: hedef adres bizim seçmediğimiz — hesabın kendi adresi.
  // Gönderim bulut oturumu ister; oturum yoksa dürüstçe hata verir, sessizce
  // "gitti" denmez. (Supabase tarafı kapalıysa kullanıcıya net gerekçe düşer.)
  function sendEmail(cfg, event) {
    var cloud = window.nexusCloud;
    if (!cloud || typeof cloud.sendNotifyEmail !== "function")
      return Promise.reject(new Error("e-posta kanalı için bulut oturumu gerekli"));
    return cloud
      .sendNotifyEmail({
        title: String(event.title || alertWord()).slice(0, 120),
        detail: String(event.detail || "").slice(0, 800),
        level: String(event.level || "info"),
      })
      .then(function (res) {
        if (!res || !res.ok) throw new Error(String((res && res.error) || "e-posta gönderilemedi").slice(0, 120));
        return res;
      });
  }

  // Android kanal ayarları (ses/titreşim/önem) oluşturulduktan sonra uygulamadan değiştirilemez;
  // bu yüzden her ses+titreşim bileşimi kendi kanalına yazılır ve tercih değişince ilgili kanal
  // seçilir. Kanallar ihtiyaç anında bir kez oluşturulur.
  var channelsMade = {};
  var CAT_NAMES = {
    security: ["Güvenlik", "Security"],
    emergency: ["Acil Durumlar", "Emergencies"],
    energy: ["Enerji", "Energy"],
    ai: ["AI Önerileri", "AI Suggestions"],
  };

  function localChannelSpec(prefs) {
    var p = prefs || { cat: "security", critical: false, sound: true, vibrate: true };
    var names = p.critical ? ["Kritik Uyarılar", "Critical Alerts"] : CAT_NAMES[p.cat] || CAT_NAMES.security;
    var suffix = p.critical ? "" : (p.sound ? "" : " - sessiz") + (p.vibrate ? "" : " - titreşimsiz");
    var suffixEn = p.critical ? "" : (p.sound ? "" : " - silent") + (p.vibrate ? "" : " - no vibration");
    return {
      id: p.critical ? "nexus-critical" : "nexus-" + p.cat + "-" + (p.sound ? "s" : "q") + (p.vibrate ? "v" : "n"),
      name: window.nexusT
        ? nexusT("NEXUS " + names[0] + suffix, "NEXUS " + names[1] + suffixEn)
        : "NEXUS " + names[0] + suffix,
      description: window.nexusT
        ? nexusT("Akıllı ev olayları ve uyarıları", "Smart home events and alerts")
        : "Akıllı ev olayları ve uyarıları",
      // Android'de sesi kapatmak için kanal önemi düşürülür (2 = sessiz); sesli kanal 5.
      importance: p.sound ? 5 : 2,
      visibility: 1, // Kilit ekranında tam içerik gösterimi (NotificationCompat.VISIBILITY_PUBLIC)
      sound: p.sound ? "default" : undefined,
      vibration: !!p.vibrate,
      lights: true,
      lightColor: "#4C7DFF",
    };
  }

  // Bildirim eylem düğmeleri (Android; Capacitor registerActionTypes). Masaüstü Windows
  // bildirimi eylem düğmesi taşımıyor (Electron'da yalnız macOS'ta var): orada bildirime
  // tıklamak ilgili sayfayı açar. "1 saat sustur" Rahatsız Etmeyin süresini 1 saat uzatır.
  var ACTION_TYPE = "NEXUS_ALERT";
  var actionTypesMade = false;
  function ensureActionTypes(ln) {
    if (actionTypesMade || !ln || typeof ln.registerActionTypes !== "function") return Promise.resolve();
    actionTypesMade = true;
    var T = function (a, b) {
      return window.nexusT ? nexusT(a, b) : a;
    };
    return Promise.resolve(
      ln.registerActionTypes({
        types: [
          {
            id: ACTION_TYPE,
            actions: [
              { id: "open", title: T("Aç", "Open") },
              { id: "mute1h", title: T("1 saat sustur", "Mute 1 hour") },
            ],
          },
        ],
      }),
    ).catch(function () {});
  }

  function ensureLocalChannel(ln, prefs) {
    if (!ln || typeof ln.createChannel !== "function") return Promise.resolve("nexus-alerts");
    var spec = localChannelSpec(prefs);
    if (channelsMade[spec.id]) return Promise.resolve(spec.id);
    channelsMade[spec.id] = true;
    return ln
      .createChannel(spec)
      .catch(function () {})
      .then(function () {
        return spec.id;
      });
  }

  function sendSystem(event) {
    // 0) Masaüstü: işletim sisteminin yerel bildirimi (ana süreç, uygulama simgesiyle). Web
    //    Notification ile ikisi birden çıkıp çift bildirim vermesin diye tek yol bu.
    var desk = window.nexusDesktop;
    var prefs = alertPrefs(event);
    if (desk && typeof desk.notifyEvent === "function") {
      desk.notifyEvent({
        id: String(event.id || ""),
        title: String(event.title || alertWord()),
        detail: String(event.detail || ""),
        page: event.page,
        force: /^notify-test-/.test(String(event.id || "")),
        silent: !prefs.sound,
      });
      return Promise.resolve({ native: true });
    }
    // 1) Telefonda (Android & gelecekte iOS) Capacitor yerel bildirim eklentisi (Kilit ekranı dahil)
    var cap = window.Capacitor;
    var ln = cap && cap.Plugins && cap.Plugins.LocalNotifications;
    if (ln && typeof ln.schedule === "function") {
      var notifTitle = String(
        event.title || (window.nexusT ? nexusT("NEXUS Uyarısı", "NEXUS Alert") : "NEXUS Uyarısı"),
      );
      var channelId = "nexus-alerts";
      return ensureLocalChannel(ln, prefs)
        .then(function (id) {
          channelId = id || channelId;
          return ensureActionTypes(ln);
        })
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
          if (perm && perm.display === "denied") {
            // İzin yokken uyarı sessizce kaybolmasın: uygulama içi şerit göster, sonucu
            // da hata olarak kaydet (istatistikte "hatalı" görünür, kullanıcı sebebi görür).
            if (typeof window.nexusShowNotice === "function") {
              try {
                window.nexusShowNotice(event);
              } catch (e) {}
            }
            throw new Error("sistem bildirim izni kapalı");
          }
          return ln.schedule({
            notifications: [
              {
                id: hashId(event),
                title: notifTitle,
                body: String(event.detail || ""),
                channelId: channelId,
                // Aynı kategorideki bildirimler Android'de tek grupta toplanır.
                group: "nexus-" + prefs.cat,
                actionTypeId: ACTION_TYPE,
                smallIcon: "ic_stat_nexus",
                iconColor: "#4C7DFF",
                sound: prefs.sound ? "default" : undefined,
                extra: { id: event.id, page: event.page || "nexus-messages.html" },
              },
            ],
          });
        });
    }
    // 2) Web: Notification API izni varsa gerçek sistem bildirimi.
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        // Simge ve rozet verilmezse tarayıcı/WebView varsayılan simgesini gösterir
        var iconUrl = new URL("icons/icon-192.webp", location.href).href;
        var n = new Notification("NEXUS: " + (event.title || alertWord()), {
          body: event.detail || "",
          tag: "nexus-" + hashId(event),
          icon: iconUrl,
          badge: iconUrl,
          silent: !prefs.sound,
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
    if (cfg.email && cfg.email.enabled)
      jobs.push([
        "email",
        function () {
          return sendEmail(cfg.email, event);
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
    // Gerçek olaydaki gibi uygulama zili de çalar (Ayarlar → Ses kapalıysa sessiz); kullanıcı
    // "ses geliyor mu" sorusunu bu düğmeyle sınar.
    try {
      if (window.nexusFeedback && typeof window.nexusFeedback.play === "function")
        window.nexusFeedback.play("notify");
    } catch (e) {
      /* ses asıl işi engellemesin */
    }
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
    // Masaüstü programda bildirimi ana süreç gösterir; Windows'ta ayrıca izin penceresi yoktur.
    if (window.nexusDesktop && typeof window.nexusDesktop.notifyEvent === "function")
      return Promise.resolve({ permission: "granted", asked: false });
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

  /* Sistem izninin şu anki hâli, SORMADAN: "granted" | "denied" | "prompt" | "unsupported".
     Ayarlar sayfası anahtarları bununla gerçek izne göre gösterir. */
  function permissionState() {
    if (window.nexusDesktop && typeof window.nexusDesktop.notifyEvent === "function")
      return Promise.resolve("granted");
    var cap = window.Capacitor;
    var ln = cap && cap.Plugins && cap.Plugins.LocalNotifications;
    if (ln && typeof ln.checkPermissions === "function") {
      return Promise.resolve()
        .then(function () {
          return ln.checkPermissions();
        })
        .then(
          function (r) {
            var d = r && r.display;
            return d === "granted" ? "granted" : d === "denied" ? "denied" : "prompt";
          },
          function () {
            return "denied";
          },
        );
    }
    if (typeof Notification === "undefined") return Promise.resolve("unsupported");
    var p = Notification.permission;
    return Promise.resolve(p === "default" ? "prompt" : p);
  }

  function setPageFlag(key, on) {
    try {
      if (window.nexusSetItem) window.nexusSetItem(PAGE_PREFIX + key, on ? "true" : "false");
      else localStorage.setItem(PAGE_PREFIX + key, on ? "true" : "false");
    } catch (e) {
      /* kota dolu / özel mod */
    }
  }

  /* İki grup: "anlık" (enerji, plan, AI önerileri) ve "kritik" (güvenlik, acil durum, alarm;
     sessiz saatleri de aşar). Ana anahtar ikisinden biri açıksa açık kalır. */
  function applyChoices(instant, critical) {
    var any = !!(instant || critical);
    setPageFlag("master", any);
    setPageFlag("notif-energy", !!instant);
    setPageFlag("notif-ai", !!instant);
    setPageFlag("notif-security", !!critical);
    setPageFlag("notif-emergency", !!critical);
    setPageFlag("critical-override", !!critical);
    if (any) saveChannels({ system: { enabled: true } });
  }

  var SETUP_KEY = "nexusNotifSetupDone";

  function setupToast(text, isError) {
    if (typeof window.nexusToast === "function")
      window.nexusToast(text, { type: isError ? "error" : "success" });
  }

  // Seçimi uygular: önce gerçek sistem izni istenir; izin yoksa anahtarlar KAPALI kalır
  // (açık görünüp bildirim gelmemesi dürüst olmazdı).
  function finishSetup(instant, critical) {
    var T = function (a, b) {
      return window.nexusT ? nexusT(a, b) : a;
    };
    if (!instant && !critical) {
      applyChoices(false, false);
      setupToast(T("Bildirimler kapalı. Ayarlar → Anlık Bildirimler'den açabilirsin.", "Notifications are off. You can turn them on in Settings → Instant Notifications."));
      return Promise.resolve({ granted: false });
    }
    return requestSystemPermission().then(function (res) {
      var perm = res && res.permission;
      if (perm === "granted") {
        applyChoices(instant, critical);
        setupToast(T("Bildirimler açıldı.", "Notifications turned on."));
        return { granted: true };
      }
      if (perm === "unsupported") {
        applyChoices(instant, critical);
        setupToast(T("Bu cihaz sistem bildirimi göstermiyor; uyarılar uygulama içinde görünecek.", "This device cannot show system notifications; alerts will appear inside the app."));
        return { granted: false, inApp: true };
      }
      applyChoices(false, false);
      setupToast(
        T("Bildirim izni verilmedi, bildirimler kapalı. Cihaz ayarlarından izin verip Ayarlar'dan açabilirsin.", "Notification permission was not granted, so notifications are off. Allow it in device settings, then turn it on in Settings."),
        true,
      );
      return { granted: false };
    });
  }

  function showSetup() {
    if (typeof window.nexusDialog !== "function" || typeof document === "undefined") return null;
    var T = function (a, b) {
      return window.nexusT ? nexusT(a, b) : a;
    };
    var state = { instant: true, critical: true };
    var decided = false;
    var back = window.nexusDialog({
      title: T("Bildirimleri açalım mı?", "Turn on notifications?"),
      icon: "info",
      message: T(
        "Seçtiklerin için cihazdan izin istenecek. İzin vermezsen bildirimler kapalı kalır; Ayarlar → Anlık Bildirimler'den istediğin zaman değiştirebilirsin. Telefonun kendi Rahatsız Etmeyin modu kritik uyarıları da engelleyebilir.",
        "Your device will ask for permission for what you pick. If you decline, notifications stay off; change it anytime in Settings → Instant Notifications. Your phone's own Do Not Disturb can still block critical alerts.",
      ),
      primary: {
        label: T("Devam", "Continue"),
        onClick: function () {
          decided = true;
          finishSetup(state.instant, state.critical);
        },
      },
      secondary: {
        label: T("Şimdi değil", "Not now"),
        onClick: function () {
          decided = true;
          finishSetup(false, false);
        },
      },
    });
    if (!back) return null;
    var rows = [
      { key: "instant", title: T("Anlık bildirimler", "Instant notifications"), sub: T("Otomasyon, enerji ve AI önerileri", "Automations, energy and AI suggestions") },
      { key: "critical", title: T("Kritik uyarılar", "Critical alerts"), sub: T("Güvenlik, acil durum ve alarm; sessiz saatlerde de gelir", "Security, emergencies and alarms; also during quiet hours") },
    ];
    var list = document.createElement("div");
    list.className = "nx-dlg-list";
    rows.forEach(function (r) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "nx-dlg-opt is-selected";
      b.setAttribute("role", "switch");
      b.setAttribute("aria-checked", "true");
      b.innerHTML = '<span style="display:flex;flex-direction:column;align-items:flex-start;gap:2px"><span></span><small style="font-weight:500;opacity:.7;font-size:12px;text-align:left"></small></span><i aria-hidden="true">✓</i>';
      b.firstChild.firstChild.textContent = r.title;
      b.firstChild.lastChild.textContent = r.sub;
      b.style.height = "auto";
      b.style.padding = "10px 16px";
      b.addEventListener("click", function () {
        state[r.key] = !state[r.key];
        b.classList.toggle("is-selected", state[r.key]);
        b.setAttribute("aria-checked", state[r.key] ? "true" : "false");
        b.lastChild.textContent = state[r.key] ? "✓" : "";
      });
      list.appendChild(b);
    });
    var actions = back.querySelector(".nx-dlg-actions");
    if (actions && actions.parentNode) actions.parentNode.insertBefore(list, actions);
    // Pencere seçim yapmadan kapatılırsa (dışına dokunma, Esc) "şimdi değil" sayılır.
    if (typeof MutationObserver === "function") {
      var obs = new MutationObserver(function () {
        if (document.body.contains(back)) return;
        obs.disconnect();
        if (!decided) finishSetup(false, false);
      });
      obs.observe(document.body, { childList: true });
    }
    return back;
  }

  // Giriş yapmış kullanıcıya ana ekranda bir kez sorulur (hesap başına).
  function maybeSetup() {
    try {
      if (typeof location === "undefined" || !/nexus-home\.html$/.test(location.pathname || "")) return;
      if (rawGet(SETUP_KEY)) return;
      if (!rawGet("nexusUserEmail")) return;
      setTimeout(function () {
        if (rawGet(SETUP_KEY)) return;
        if (window.nexusSetItem) window.nexusSetItem(SETUP_KEY, "1");
        else localStorage.setItem(SETUP_KEY, "1");
        showSetup();
      }, 1500);
    } catch (e) {
      /* soru sorulamazsa uygulama yine çalışır */
    }
  }

  function start() {
    if (started || typeof window === "undefined") return;
    started = true;
    try {
      var cap = window.Capacitor;
      var ln = cap && cap.Plugins && cap.Plugins.LocalNotifications;
      if (ln && typeof ln.addListener === "function") {
        ln.addListener("localNotificationActionPerformed", function (action) {
          if (action && action.actionId === "mute1h") {
            try {
              var until = String(Date.now() + 60 * 60 * 1000);
              if (window.nexusSetItem) window.nexusSetItem("nexusDndEndTime", until);
              else localStorage.setItem("nexusDndEndTime", until);
            } catch (e) {}
            return;
          }
          var extra = action && action.notification && action.notification.extra;
          var targetPage = extra && extra.page ? extra.page : "nexus-messages.html";
          if (window.location.href.indexOf(targetPage) === -1) {
            window.location.href = targetPage;
          }
        });
      }
    } catch (e) {}
    maybeSetup();
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
    permission: permissionState,
    applyChoices: applyChoices,
    finishSetup: finishSetup,
    showSetup: showSetup,
    start: start,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
