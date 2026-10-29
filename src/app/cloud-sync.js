// NEXUS — bulut hesap ve cihaz senkronu (Supabase).
//
// Neden SDK yok, REST var: Capacitor WebView'a 250 KB'lik bir SDK sokmak yerine
// Supabase'in açık REST uçları (GoTrue auth + PostgREST) kullanılıyor. Böylece
// bağımlılık eklenmiyor, tarayıcıda da telefonda da aynı kod koşuyor ve testlerde
// fetch'i taklit etmek yeterli oluyor.
//
// Anahtarlar repoda DURMAZ: cloud-config.js yerel dosyadan okunur (gitignore'da),
// örnek şablon cloud-config.example.js. Yapılandırma yoksa uygulama tamamen yerel
// çalışmaya devam eder — bulut, çekirdek deneyimin önünde koşul olmaz.

(function () {
  "use strict";

  // theme.js bu dosyayı her sayfaya ekler; sayfa ayrıca eklediyse ikinci çalışma yok sayılır.
  if (window.nexusCloud) return;

  var SESSION_KEY = "nexusCloudSession";
  var QUEUE_KEY = "nexusCloudPendingOps";
  var DEVICE_KEY = "nexusPairedDevices";

  function cfg() {
    var c = window.NEXUS_CLOUD;
    return c && c.url && c.anonKey ? c : null;
  }

  function enabled() {
    return !!cfg();
  }

  // --- oturum ---------------------------------------------------------------
  //
  // Sahip yazımı tek kurala bağlı: KÜÇÜK HARF. Supabase e-postayı küçülterek döndürür,
  // uygulama ise kullanıcının yazdığını ("Ensar@Gmail.com") olduğu gibi saklar. Eskiden
  // oturum küçük haliyle yazılıyor, nexusGetItem ile "yazıldığı haliyle" okunuyordu;
  // anahtar bölününce oturum bulunamıyor ve senkron HİÇBİR UYARI VERMEDEN duruyordu
  // (regresyon testi: packages/web/src/cloud-sync.test.ts).

  var OWNER_POINTER = "nexusCloudSessionOwner";

  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function activeUser() {
    var u = String(safeGet("nexusCurrentUser") || "").trim();
    // currentUserKey() ile aynı kural: "guest" bir hesap değil, oturum Açığı için önektir.
    return u === "guest" ? "" : u;
  }

  function canonicalOwner(email) {
    var raw = String(email || activeUser() || "").trim();
    return raw ? raw.toLowerCase() : "";
  }

  // Aktif kullanıcının olası yazımları: yazıldığı hali + kanonik (küçük) hali.
  function ownerSpellings(canonical) {
    var names = [];
    var active = activeUser();
    if (active && active.toLowerCase() === canonical) names.push(active);
    if (names.indexOf(canonical) === -1) names.push(canonical);
    return names;
  }

  function readSession() {
    var canonical = canonicalOwner("");
    var keys = ownerSpellings(canonical).map(function (n) { return n + "_" + SESSION_KEY; });
    // Girişin hemen sonrasında (aktif kullanıcı henüz güncellenmemiş) ya da tek başına
    // açılan sayfalarda: en son yazılan oturumun sahibi işaretten bulunur.
    var pointer = String(safeGet(OWNER_POINTER) || "");
    if (pointer && (!canonical || pointer.toLowerCase() === canonical)) {
      var pointed = pointer + "_" + SESSION_KEY;
      if (keys.indexOf(pointed) === -1) keys.push(pointed);
    }
    for (var i = 0; i < keys.length; i++) {
      var raw = safeGet(keys[i]);
      if (!raw) continue;
      try {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.accessToken) return parsed;
      } catch (e) { /* bozuk kayıt: sonraki yazım denenir */ }
    }
    return null;
  }

  // Aktif kullanıcı yazımı ile kanonik yazım YALNIZCA büyük/küçük harften farklıysa o
  // önek altındaki kayıtlar kanoniğe taşınır; cihazların ve ayarların görünmez kalması
  // veri kaybı gibi görünüyordu. Farklı bir adrese taşımaya asla kalkışmaz.
  function adoptSpelling(canonical) {
    var active = activeUser();
    if (!active || active === canonical || active.toLowerCase() !== canonical) return 0;
    var from = active + "_";
    var to = canonical + "_";
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var full = localStorage.key(i);
        if (full && full.indexOf(from) === 0) keys.push(full);
      }
    } catch (e) {
      return 0;
    }
    var moved = 0;
    keys.forEach(function (full) {
      var target = to + full.slice(from.length);
      try {
        if (safeGet(target) === null) {
          localStorage.setItem(target, safeGet(full));
          moved++;
        }
        localStorage.removeItem(full);
      } catch (e) { /* kota dolu: kalan kayıt eski önekinde durur, sonraki girişte yeniden denenir */ }
    });
    try {
      localStorage.setItem("nexusCurrentUser", canonical);
    } catch (e) { /* özel mod */ }
    return moved;
  }

  // Oturum, sahibinin e-postasıyla anahtarlanır. Giriş sırasında aktif kullanıcı henüz
  // ayarlanmamış olabilir; eskiden bu yüzden oturum "guest_" altına düşüp senkron hiç
  // çalışmıyordu.
  function writeSession(session) {
    var canonical = canonicalOwner(session && session.email ? session.email : activeUser()) || "guest";
    var canonicalKey = canonical + "_" + SESSION_KEY;
    try {
      if (session) {
        adoptSpelling(canonical);
        localStorage.setItem(canonicalKey, JSON.stringify(session));
        localStorage.setItem(OWNER_POINTER, canonical);
      } else {
        localStorage.removeItem(canonicalKey);
        localStorage.removeItem(OWNER_POINTER);
      }
      // Aynı sahibin diğer yazımlarında kalmış oturum kayıtları temizlenir: yarım kalan
      // girişler ikinci bir hesap gibi davranmasın.
      ownerSpellings(canonical).forEach(function (name) {
        var key = name + "_" + SESSION_KEY;
        if (key !== canonicalKey) localStorage.removeItem(key);
      });
      localStorage.removeItem(SESSION_KEY); // en eski şema: öneksiz tek kayıt
      noteAssurance(session);
    } catch (e) { /* kota dolu / özel mod */ }
  }

  // Oturum belirtecindeki güvence düzeyi (aal). İkinci adım açıksa aal1 oturum
  // uygulamaya alınmaz; kod doğrulanınca Supabase aal2 belirteç verir.
  function jwtClaims(token) {
    try {
      var part = String(token || "").split(".")[1] || "";
      if (!part) return {};
      var pad = part.length % 4 === 0 ? "" : "====".slice(part.length % 4);
      var json = atob(part.replace(/-/g, "+").replace(/_/g, "/") + pad);
      return JSON.parse(json) || {};
    } catch (e) {
      return {};
    }
  }

  function noteAssurance(session) {
    try {
      if (!session || !session.accessToken) {
        localStorage.removeItem("nexusSessionAal");
        localStorage.removeItem("nexusMfaPending");
        return;
      }
      var aal = jwtClaims(session.accessToken).aal || "aal1";
      localStorage.setItem("nexusSessionAal", aal);
      if (aal === "aal2") localStorage.removeItem("nexusMfaPending");
      else if (localStorage.getItem("nexusMfaEnrolled") === "1") localStorage.setItem("nexusMfaPending", "1");
    } catch (e) { /* özel mod */ }
  }

  function authHeader(current) {
    return { Authorization: "Bearer " + current.accessToken };
  }

  function expiryFrom(data) {
    var now = Date.now();
    return now + (data.expires_in || 3600) * 1000 - 60 * 1000; // 60 sn pay
  }

  function api(path, options) {
    var config = cfg();
    if (!config) return Promise.reject(new Error("bulut yapılandırması yok"));
    return fetch(config.url.replace(/\/+$/, "") + path,
      Object.assign({}, options, {
        headers: Object.assign(
          { apikey: config.anonKey, "Content-Type": "application/json" },
          options && options.headers ? options.headers : {},
        ),
      }),
    ).then(function (res) {
      return res.text().then(function (text) {
        var body = text ? JSON.parse(text) : {};
        if (!res.ok) {
          var error = new Error((body && (body.error_description || body.msg || body.error)) || ("http " + res.status));
          error.status = res.status;
          // Sunucunun makine okunur hata kodu (ör. email_exists, same_email): arayüz gerçek nedeni ayırt edebilsin.
          error.code = String((body && (body.error_code || body.code)) || "");
          throw error;
        }
        return body;
      });
    });
  }

  // Web adresi: e-posta bağlantıları (doğrulama, şifre sıfırlama) ve Google girişi buraya döner.
  // Masaüstü (nexus://) ve Android (https://localhost) kendi adreslerine dönemez; site
  // belirteci yakalar ve oturumu açar. Eski web uygulaması adresi (nexus-web-jre.pages.dev)
  // kapatıldı; canlı site kullanılır.
  var WEB_URL = "https://nexus-smarthome.pages.dev";

  function isNativeApp() {
    try {
      if (typeof window === "undefined") return false;
      if (window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform()) return true;
    } catch (e) {}
    return false;
  }

  function isWebOrigin() {
    if (typeof location === "undefined") return false;
    if (isNativeApp()) return false;
    return /^https?:$/.test(location.protocol);
  }

  function webBase() {
    var c = cfg();
    return isWebOrigin() ? location.origin : ((c && c.webUrl) || WEB_URL).replace(/\/+$/, "");
  }

  function isDesktopApp() {
    return typeof window !== "undefined" && !!(window.nexusDesktop || (typeof location !== "undefined" && location.protocol === "nexus:"));
  }

  // Mobil uygulamada Google dönüşü: sistem tarayıcısı siteye döner, site
  // /app-auth.html üzerinden belirteçleri nexus://auth adresine taşır.
  // Supabase yalnız site alan adına (ve loopback'e) yönlendirmeye izin verir;
  // bu yüzden doğrudan özel şema yerine site aktarımı kullanılır.
  var NATIVE_AUTH_REDIRECT = WEB_URL + "/app-auth.html";

  function nativeBrowser() {
    try {
      return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser) || null;
    } catch (e) { return null; }
  }

  // Google ile giriş web adresinde, masaüstü uygulamasında ve mobil uygulamada sunulur.
  // Mobilde eklenti yoksa düğme gösterilmez; basıldığında hiçbir şey olmayan düğme bırakılmaz.
  function googleAvailable() {
    if (!enabled()) return false;
    if (isWebOrigin() || isDesktopApp()) return true;
    return isNativeApp() && !!nativeBrowser();
  }

  function sessionFrom(data, fallbackEmail) {
    var user = data.user || {};
    var meta = user.user_metadata || {};
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: expiryFrom(data),
      userId: user.id || null,
      email: user.email || fallbackEmail || "",
      name: meta.full_name || meta.name || "",
      avatar: meta.avatar_url || meta.picture || "",
    };
  }

  function grant(idToken, refresh) {
    return api("/auth/v1/token?grant_type=" + (refresh ? "refresh_token" : "password"), {
      method: "POST",
      body: JSON.stringify(refresh ? { refresh_token: idToken } : { email: idToken.email, password: idToken.password }),
    }).then(function (data) {
      var previous = refresh ? readSession() : null;
      var session = sessionFrom(data, (idToken && idToken.email) || (previous && previous.email) || "");
      if (!session.name && previous && previous.name) session.name = previous.name;
      if (!session.avatar && previous && previous.avatar) session.avatar = previous.avatar;
      writeSession(session);
      return session;
    });
  }

  function accountLang() {
    var lang = (typeof window !== "undefined" && window.nexusLang) || "tr";
    return lang === "en" ? "en" : "tr";
  }

  // Hesaba dili yazar. Supabase mektup şablonu bu alana bakıp yalnız o dili gönderir.
  // Oturum yokken (şifre sıfırlama ekranı) yazılamaz; son girişte kaydedilen dil kullanılır.
  function rememberMailLang(current) {
    if (!current || !current.accessToken || !enabled()) return Promise.resolve();
    var lang = accountLang();
    try {
      if (window.sessionStorage && window.sessionStorage.getItem("nexusMailLang") === lang) return Promise.resolve();
    } catch (e) { /* özel mod */ }
    return api("/auth/v1/user", {
      method: "PUT",
      headers: { Authorization: "Bearer " + current.accessToken },
      body: JSON.stringify({ data: { lang: lang } }),
    }).then(function () {
      try { if (window.sessionStorage) window.sessionStorage.setItem("nexusMailLang", lang); } catch (e) { /* özel mod */ }
    }, function () { /* mektup dili yazılamadı; şablon İngilizceye düşer */ });
  }

  function signIn(email, password) {
    return grant({ email: email, password: password });
  }

  // İki adımlı doğrulama: Supabase Auth TOTP (kimlik uygulaması). Yerel parola
  // özeti ikinci adım sayılmaz; faktör yoksa "açık" denmez.
  function listFactors() {
    var current = readSession();
    if (!current) return Promise.resolve([]);
    // Supabase Auth (GoTrue) faktörleri ayrı bir GET ucundan vermez: /auth/v1/factors yalnızca kayıt (POST) ile
    // challenge/verify/silme içindir. Faktör listesi kullanıcı kaydında gelir (supabase-js mfa.listFactors da böyle okur).
    return api("/auth/v1/user", { headers: authHeader(current) }).then(function (body) {
      if (body && Array.isArray(body.factors)) return body.factors;
      if (Array.isArray(body)) return body;
      if (body && Array.isArray(body.all)) return body.all;
      if (body && Array.isArray(body.totp)) return body.totp.concat(body.phone || []);
      return [];
    });
  }

  function verifiedTotp(factors) {
    return (factors || []).filter(function (factor) {
      var type = factor.factor_type || factor.factorType;
      return type === "totp" && factor.status === "verified";
    });
  }

  function needsSecondFactor() {
    var current = readSession();
    if (!current || !current.accessToken) return Promise.resolve(false);
    if ((jwtClaims(current.accessToken).aal || "aal1") === "aal2") {
      try { localStorage.removeItem("nexusMfaPending"); } catch (e) { /* özel mod */ }
      return Promise.resolve(false);
    }
    return listFactors().then(function (factors) {
      var on = verifiedTotp(factors).length > 0;
      try {
        if (on) {
          localStorage.setItem("nexusMfaEnrolled", "1");
          localStorage.setItem("nexusMfaPending", "1");
        } else {
          localStorage.removeItem("nexusMfaEnrolled");
          localStorage.removeItem("nexusMfaPending");
        }
      } catch (e) { /* özel mod */ }
      return on;
    });
  }

  function enrollTotp() {
    var current = readSession();
    if (!current) return Promise.reject(new Error("bulut oturumu yok"));
    return listFactors().then(function (factors) {
      var stale = factors.filter(function (factor) {
        return (factor.factor_type || factor.factorType) === "totp" && factor.status !== "verified";
      });
      return stale.reduce(function (chain, factor) {
        return chain.then(function () { return unenrollFactor(factor.id); });
      }, Promise.resolve()).then(function () {
        return api("/auth/v1/factors", {
          method: "POST",
          headers: authHeader(current),
          body: JSON.stringify({ factor_type: "totp", friendly_name: "NEXUS", issuer: "NEXUS" }),
        });
      });
    });
  }

  function verifyTotp(code, factorId) {
    var current = readSession();
    if (!current) return Promise.reject(new Error("bulut oturumu yok"));
    var digits = String(code || "").replace(/\s/g, "");
    var pick = factorId ? Promise.resolve(factorId) : listFactors().then(function (factors) {
      var chosen = verifiedTotp(factors)[0] || factors.filter(function (factor) {
        return (factor.factor_type || factor.factorType) === "totp";
      })[0];
      if (!chosen) throw new Error("doğrulama ayarı yok");
      return chosen.id;
    });
    return pick.then(function (id) {
      return api("/auth/v1/factors/" + encodeURIComponent(id) + "/challenge", {
        method: "POST",
        headers: authHeader(readSession() || current),
        body: "{}",
      }).then(function (challenge) {
        return api("/auth/v1/factors/" + encodeURIComponent(id) + "/verify", {
          method: "POST",
          headers: authHeader(readSession() || current),
          body: JSON.stringify({ challenge_id: challenge.id, code: digits }),
        });
      });
    }).then(function (data) {
      if (!data || !data.access_token) throw new Error("kod doğrulanamadı");
      var previous = readSession();
      try { localStorage.setItem("nexusMfaEnrolled", "1"); } catch (e) { /* özel mod */ }
      var session = sessionFrom(data, (previous && previous.email) || "");
      if (!session.name && previous && previous.name) session.name = previous.name;
      writeSession(session);
      return session;
    });
  }

  function unenrollFactor(factorId) {
    var current = readSession();
    if (!current || !factorId) return Promise.resolve(null);
    return api("/auth/v1/factors/" + encodeURIComponent(factorId), {
      method: "DELETE",
      headers: authHeader(current),
    });
  }

  function unenrollTotp(onlyId) {
    return listFactors().then(function (factors) {
      var totp = factors.filter(function (factor) {
        if ((factor.factor_type || factor.factorType) !== "totp") return false;
        // onlyId verilince durum fark etmeksizin o faktörü sil (AAL2 sonrası doğrulanmış
        // faktör kapatılırken "verified" filtresi silmeyi engelliyordu — düzeltildi).
        if (onlyId) return factor.id === onlyId;
        return true;
      });
      return totp.reduce(function (chain, factor) {
        return chain.then(function () { return unenrollFactor(factor.id); });
      }, Promise.resolve());
    }).then(function () {
      // onlyId ile de olsa tüm faktörler kaldırılıyorsa localStorage'ı temizle.
      // (kapatma akışında onlyId ile çağrılır ve MFA kayıt durumu sıfırlanmalıdır.)
      try {
        localStorage.removeItem("nexusMfaEnrolled");
        localStorage.removeItem("nexusMfaPending");
      } catch (e) { /* özel mod */ }
      if (onlyId) return readSession();
      var current = readSession();
      if (current && current.refreshToken) return grant(current.refreshToken, true).catch(function () { return current; });
      return current;
    });
  }

  // Dönüş: { session, needsConfirmation }. E-posta doğrulaması açıksa oturum gelmez;
  // doğrulama bağlantısı site köküne döner (site kökü #type=signup belirtecini işler).
  function signUp(email, password, name) {
    var back = encodeURIComponent(webBase() + "/");
    var meta = { lang: accountLang() };
    if (name) meta.name = name;
    return api("/auth/v1/signup?redirect_to=" + back, {
      method: "POST",
      body: JSON.stringify({ email: email, password: password, data: meta }),
    }).then(function (created) {
      if (created && created.access_token) {
        return grant({ email: email, password: password }).then(
          function (session) { return { session: session, needsConfirmation: false }; },
          function () { return { session: null, needsConfirmation: true }; },
        );
      }
      return { session: null, needsConfirmation: true };
    });
  }

  // Şifre sıfırlama e-postası gönderir (Supabase gönderir; bağlantı site köküne döner,
  // site kökü #type=recovery belirtecini yeni şifre formuna çevirir).
  function recover(email) {
    var back = encodeURIComponent(webBase() + "/");
    return api("/auth/v1/recover?redirect_to=" + back, { method: "POST", body: JSON.stringify({ email: email }) });
  }

  // Sıfırlama bağlantısından gelen geçici belirteçle yeni şifre belirler.
  function setPasswordWithToken(accessToken, password) {
    return api("/auth/v1/user", {
      method: "PUT",
      headers: { Authorization: "Bearer " + accessToken },
      body: JSON.stringify({ password: password }),
    });
  }

  // Oturum açıkken şifre değiştirir: önce mevcut şifre doğrulanır.
  function changePassword(currentPassword, nextPassword) {
    var current = readSession();
    if (!current || !current.email) return Promise.reject(new Error("oturum yok"));
    return grant({ email: current.email, password: currentPassword }).then(function (fresh) {
      return setPasswordWithToken(fresh.accessToken, nextPassword);
    });
  }

  // Google ile açılan Supabase hesabında şifre HİÇBİR ZAMAN yoktu; changePassword bu
  // yüzden o hesapta aşılamaz bir duvardır (mevcut şifre sorulur, doğrulanamaz).
  // Durum kullanıcının identities listesinden okunur: e-posta kimliği varsa şifre
  // vardır; yalnızca google/apple gibi dış sağlayıcılar varsa yoktur. Eski GoTrue
  // yanıtlarında identities alanı hiç gelmez — tahmin edilmez, "unknown" döner ve
  // arayüz eski (şifre soran) akışta kalır.
  function passwordStatus() {
    return session().then(function (current) {
      if (!current || !current.accessToken) return "unknown";
      return api("/auth/v1/user", { headers: authHeader(current) }).then(function (user) {
        var ids = user && Array.isArray(user.identities) ? user.identities : null;
        var providers = (ids || []).map(function (identity) {
          return String((identity && identity.provider) || identity || "").toLowerCase();
        });
        if (providers.indexOf("email") >= 0 || providers.indexOf("password") >= 0) return "password";
        if (providers.length) return "oauth";
        var metaProvider = String(((user || {}).app_metadata || {}).provider || "").toLowerCase();
        if (metaProvider === "email") return "password";
        if (metaProvider) return "oauth";
        return "unknown";
      }, function () {
        return "unknown";
      });
    });
  }

  // Şifresi olmayan hesapta ilk şifre, mevcut şifre sorulmadan belirlenir: yetki
  // zaten elde edilen oturum belirtecinden gelir (PUT /auth/v1/user { password }).
  // Supabase bu alanı hassas sayıp AAL2 isterse 401/403 döner; çağır taraf o zaman
  // kurtarma mektubuna yönlendirir.
  function setPasswordWithSession(nextPassword) {
    return session().then(function (current) {
      if (!current || !current.accessToken) throw new Error("oturum yok");
      return setPasswordWithToken(current.accessToken, nextPassword);
    });
  }

  // Hesap e-postası değişir: Supabase yeni adrese doğrulama bağlantısı gönderir;
  // bağlantı onaylanana kadar girişte eski adres geçerli kalır. Şifre istenmez,
  // işlem oturum belirteciyle yetkilendirilir (süresi dolduysa önce tazelenir).
  function changeEmail(email) {
    return session().then(function (current) {
      if (!current || !current.accessToken) throw new Error("oturum yok");
      return api("/auth/v1/user", {
        method: "PUT",
        headers: { Authorization: "Bearer " + current.accessToken },
        body: JSON.stringify({ email: email }),
      });
    });
  }

  function session() {
    var current = readSession();
    if (!current) return Promise.resolve(null);
    if (Date.now() < current.expiresAt) return Promise.resolve(current);
    return grant(current.refreshToken, true).catch(function (error) {
      if (error.status === 400 || error.status === 401 || error.status === 403) writeSession(null);
      return null;
    });
  }

  function signOut() {
    var current = readSession();
    writeSession(null);
    rtStop();
    // Bu cihazın push token'ını bu hesaptan düşür: aynı tarayıcıda başka hesaba
    // geçilirse eski hesaba giden push bu cihazı uyandırmasın.
    try {
      var saved = JSON.parse(localStorage.getItem("nexusPushToken") || "null");
      if (current && current.accessToken && saved && saved.token) {
        api("/rest/v1/nexus_push_tokens?token=eq." + encodeURIComponent(saved.token), {
          method: "DELETE",
          headers: authHeader(current),
        }).catch(function () { /* best-effort */ });
      }
      localStorage.removeItem("nexusPushToken");
    } catch (e) { /* özel mod */ }
    if (!current || !cfg()) return Promise.resolve(null);
    return api("/auth/v1/logout", { method: "POST", headers: { Authorization: "Bearer " + current.accessToken } }).catch(function () {
      return null;
    });
  }

  // --- cihaz kayıtları -------------------------------------------------------

  // Türkce karakterler id'den düşüp okunamaz kayıtlar üretmesin.
  var TR_SLUG = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

  function deviceIdFor(device, index) {
    if (device.id) return device.id;
    var slug = String(device.name || "device-" + index)
      .toLowerCase()
      .replace(/[çğıöşüâîû]/g, function (ch) {
        return TR_SLUG[ch];
      })
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return slug + "-" + index;
  }

  // Eski kayıtlarda id yok; push/pull sırasında stabil bir id kazandırılır.
  function ensureDeviceIds(devices) {
    var changed = false;
    var withIds = devices.map(function (device, index) {
      if (device && device.id) return device;
      changed = true;
      return Object.assign({}, device, { id: deviceIdFor(device, index) });
    });
    return { devices: withIds, changed: changed };
  }

  function toRows(userId, devices) {
    return devices.map(function (device) {
      return {
        user_id: userId,
        device_id: device.id,
        name: device.name || "",
        room: device.room || "",
        protocol: device.protocol || "unknown",
        caps: device.caps || [],
        img: device.img || "",
        host: device.host || "",
        state: device.state || {},
        updated_at: new Date().toISOString(),
      };
    });
  }

  function fromRows(rows) {
    return (rows || []).map(function (row) {
      return {
        id: row.device_id,
        name: row.name,
        room: row.room,
        protocol: row.protocol,
        caps: row.caps || [],
        img: row.img,
        host: row.host,
        state: row.state || {},
        updatedAt: row.updated_at,
      };
    });
  }

  // Birleştime: aynı id varsa daha yeni olan kazanır; uzaktaki cihazlar silinmez.
  function mergeDevices(local, remote) {
    var byId = {};
    (local || []).forEach(function (d) {
      if (d && d.id) byId[d.id] = d;
    });
    (remote || []).forEach(function (d) {
      if (!d || !d.id) return;
      var existing = byId[d.id];
      if (!existing) {
        byId[d.id] = d;
        return;
      }
      var mine = Date.parse(existing.updatedAt || "") || 0;
      var theirs = Date.parse(d.updatedAt || "") || 0;
      byId[d.id] = theirs >= mine ? d : existing;
    });
    return Object.keys(byId).map(function (id) {
      return byId[id];
    });
  }

  // Oturum tazeleyip başlık üreten asenkron yardımıcı. Adı bilerek authHeader DEĞİL:
  // yukarıdaki senkron authHeader(current) ile aynı adı taşıması, tek kapsamdaki son
  // bildirimin kazanmasına yol açıyordu — faktör ve şifre çağrılarına başlık yerine
  // Promise gidiyor, Authorization hiç gönderilmiyordu (Supabase 401). Cihaz senkronu
  // kendi adıyla çağrılır ki iki davranış birbirini ezmesin.
  function sessionAuthHeader() {
    return session().then(function (current) {
      if (!current) throw new Error("oturum yok");
      return { Authorization: "Bearer " + current.accessToken, "Content-Type": "application/json" };
    });
  }

  function pullDevices() {
    if (!enabled()) return Promise.resolve([]);
    return session().then(function (current) {
      if (!current) return [];
      return api("/rest/v1/nexus_devices?select=*&user_id=eq." + encodeURIComponent(current.userId), {
        headers: { Authorization: "Bearer " + current.accessToken },
      }).then(fromRows);
    });
  }

  function pushDevices(devices) {
    if (!enabled()) return Promise.resolve({ pushed: 0 });
    return session()
      .then(function (current) {
        if (!current) return { pushed: 0 };
        return sessionAuthHeader().then(function (headers) {
          var rows = toRows(current.userId, devices);
          if (!rows.length) return { pushed: 0 };
          // PostgREST upsert: dizi govde + Prefer: resolution=merge-duplicates
          return api("/rest/v1/nexus_devices", {
            method: "POST",
            headers: Object.assign({}, headers, { Prefer: "resolution=merge-duplicates" }),
            body: JSON.stringify(rows),
          })
            .then(function () {
              return { pushed: rows.length };
            })
            .catch(function (error) {
              enqueue({ kind: "push", at: Date.now() });
              throw error;
            });
        });
      })
      .catch(function (error) {
        if (error && error.message === "oturum yok") return { pushed: 0 };
        throw error;
      });
  }

  // Bağlanmamış katalog cihazı (ağda bağlanmadı, host yok) eklenmiş cihaz sayılmaz; senkronize edilmez.
  function isUnconnected(d) {
    return !!d && !d.host && /^catalog-/.test(String(d.id || ""));
  }

  // Upsert yalnızca yazar; bu yüzden bulutta kalmış bağlanmamış kayıtları ayrıca siler.
  function removeRemoteDevices(ids) {
    if (!ids.length || !enabled()) return Promise.resolve();
    return session().then(function (current) {
      if (!current) return;
      return sessionAuthHeader().then(function (headers) {
        var list = ids.map(function (id) { return encodeURIComponent(id); }).join(",");
        return api("/rest/v1/nexus_devices?user_id=eq." + encodeURIComponent(current.userId) + "&device_id=in.(" + list + ")", {
          method: "DELETE",
          headers: headers,
        });
      });
    });
  }

  function syncNow() {
    var store = window.nexusGetItem ? window.nexusGetItem(DEVICE_KEY) : localStorage.getItem(DEVICE_KEY);
    var local = [];
    try {
      local = JSON.parse(store || "[]");
    } catch (e) {
      local = [];
    }
    var ensured = ensureDeviceIds(local);
    var localConnected = ensured.devices.filter(function (d) { return !isUnconnected(d); });
    if ((ensured.changed || localConnected.length !== ensured.devices.length) && window.nexusSetItem) {
      window.nexusSetItem(DEVICE_KEY, JSON.stringify(localConnected));
    }

    return pullDevices().then(function (remote) {
      var staleIds = remote.filter(isUnconnected).map(function (d) { return d.id; });
      var remoteConnected = remote.filter(function (d) { return !isUnconnected(d); });
      var merged = mergeDevices(localConnected, remoteConnected);
      var changed = JSON.stringify(merged) !== JSON.stringify(localConnected);
      if (window.nexusSetItem) window.nexusSetItem(DEVICE_KEY, JSON.stringify(merged));
      return removeRemoteDevices(staleIds).then(function () {
        return pushDevices(merged);
      }).then(function (result) {
        return { count: merged.length, pushed: result.pushed, remoteCount: remote.length, changed: changed };
      });
    });
  }

  // --- çevrimdışı kuyruk -----------------------------------------------------

  function queue() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function enqueue(op) {
    var list = queue();
    list.push(op);
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(list.slice(-50)));
    } catch (e) {
      /* kota dolu: kuyruk en fazla 50 islem taser */
    }
    return list.length;
  }

  // Başarılı bir senkron turu, bekleyen işaretleri uygular: kuyrukta "yeniden dene"
  // notundan başka bir şey yok (verinin kendisi zaten yerelde duruyor).
  function clearQueue() {
    try {
      localStorage.removeItem(QUEUE_KEY);
    } catch (e) { /* özel mod */ }
  }

  function flushQueue() {
    var pending = queue();
    if (!pending.length || !enabled()) return Promise.resolve({ flushed: pending.length });
    return syncNow().then(function () {
      clearQueue();
      return { flushed: pending.length };
    });
  }

  // Yerel bir kayıt değiştiğinde (cihaz ekleme/çıkarma/kontrol) kısa bir gecikmeyle
  // senkron eder; art arda gelen yazmalarda tek istek gider.
  var syncTimer = null;
  function notifyLocalChange() {
    if (!enabled()) return Promise.resolve({ pushed: 0 });
    return new Promise(function (resolvePromise) {
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(function () {
        syncTimer = null;
        syncAll().then(function (result) {
          clearQueue();
          resolvePromise(result);
        }).catch(function () {
          enqueue({ kind: "sync", at: Date.now() });
          resolvePromise({ pushed: 0, queued: true });
        });
      }, 800);
    });
  }

  // --- hesap durumu (profil, ayarlar, sahneler, aile ...) --------------------
  //
  // Yerel depoda "<e-posta>_<anahtar>" olarak duran her kayıt, gizli olanlar hariç, hesabın
  // altında satır olarak saklanır. Böylece uygulamayı silip yeniden kuran ya da başka cihazda
  // giren kullanıcı kaldığı yerden devam eder. Çakışmada: yerelde değişen ve uzakta değişmeyen
  // yazılır; ikisi de değiştiyse yeni olan kazanır; bu cihazda ilk senkronda hesap kazanır.

  var META_PREFIX = "nexusCloudMeta:";
  // Hesap başına, bu cihazda son senkronun yapıldığı e-posta öneki. E-posta adresi
  // değişip doğrulama bağlantısı onaylanınca yerel durum bu işaretten yeni adrese taşınır.
  var OWNER_ALIAS_PREFIX = "nexusOwnerAlias:";
  var MAX_VALUE = 600000;
  // Cihaz listesi ayrı tabloda; oturum/şifre/kurtarma bilgileri buluta HİÇ gitmez.
  var STATE_EXCLUDE = {
    nexusCloudSession: 1,
    nexusCloudMeta: 1,
    nexusUserPassword: 1,
    nexusLastRecoveryValue: 1,
    nexusLastRecoveryMethod: 1,
    nexusPairedDevices: 1,
    // Tapo hesap bilgisi / Tuya yerel anahtarı: yalnızca bu cihazda kalır.
    nexusLanSecrets: 1,
    // Abonelik durumu yalnızca sunucudan (Whop webhook'u) gelir; istemci durumu hesaba geri yazılmaz.
    nexusPlusPlan: 1,
    nexusPlusSince: 1,
    nexusPlusEnd: 1,
    nexusPlusCancel: 1,
    nexusPlusCurrency: 1,
    // Bildirim kanal kurulumu bu CİHAZA özeldir: Telegram bot anahtarı ve webhook
    // adresi buluta asla taşınmaz (kullanıcının kendi sırrı).
    nexusNotifyChannels: 1,
    nexusNotifySeen: 1,
    nexusNotifyStats: 1,
  };

  function currentUserKey() {
    return activeUser();
  }

  function hashOf(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36) + ":" + s.length;
  }

  function loadMeta(userId) {
    try { return JSON.parse(localStorage.getItem(META_PREFIX + userId) || "{}") || {}; } catch (e) { return {}; }
  }

  function saveMeta(userId, meta) {
    try { localStorage.setItem(META_PREFIX + userId, JSON.stringify(meta)); } catch (e) { /* kota dolu: sonraki turda yeniden hesaplanır */ }
  }

  function snapshotState(user) {
    var prefix = user + "_";
    var out = {};
    for (var i = 0; i < localStorage.length; i++) {
      var full = localStorage.key(i);
      if (!full || full.indexOf(prefix) !== 0) continue;
      var key = full.slice(prefix.length);
      if (!key || STATE_EXCLUDE[key] || key.length > 120) continue;
      var value = localStorage.getItem(full);
      if (value == null || value.length > MAX_VALUE) continue;
      out[key] = value;
    }
    return out;
  }

  // Hesap e-postası değişip doğrulama bağlantısı onaylanınca, yerel depodaki
  // "<eski adres>_" önekli durum kayıtları "<yeni adres>_" önekine taşınır.
  // Yeni önek boş kalırsa senkron "kullanıcı her şeyi sildi" sanıp buluttaki
  // sahneleri/ayarları silerdi. Oturum belirteci sunucudan gelmiş ve yeni adresi
  // doğrulamıştır; başka hesabın öneki bu yüzden asla taşınmaz. Eski oturum kaydı
  // da düşer: okuma her seferinde eski belirteci bulup yeniden tazelemesin.
  function migrateOwner(oldOwner, newOwner) {
    if (!oldOwner || !newOwner || oldOwner === newOwner) return 0;
    var from = oldOwner + "_";
    var to = newOwner + "_";
    var staleSession = from + SESSION_KEY;
    var newSession = to + SESSION_KEY;
    var moved = 0;
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var full = localStorage.key(i);
      if (!full || full.indexOf(from) !== 0 || full === staleSession) continue;
      var target = to + full.slice(from.length);
      try {
        if (safeGet(target) === null) {
          localStorage.setItem(target, safeGet(full));
          moved++;
        }
        localStorage.removeItem(full);
      } catch (e) { /* kota dolu: kalan kayıtlar sonraki senkron turunda taşınır */ }
    }
    try {
      if (safeGet(newSession)) localStorage.removeItem(staleSession);
    } catch (e) { /* özel mod */ }
    return moved;
  }

  function chunk(list, size) {
    var parts = [];
    for (var i = 0; i < list.length; i += size) parts.push(list.slice(i, i + size));
    return parts;
  }

  var stateRunning = null;

  function syncState() {
    if (!enabled()) return Promise.resolve({ pulled: 0, pushed: 0, removed: 0 });
    if (stateRunning) return stateRunning;
    var user = currentUserKey();
    if (!user) return Promise.resolve({ pulled: 0, pushed: 0, removed: 0 });
    stateRunning = session().then(function (current) {
      if (!current) return { pulled: 0, pushed: 0, removed: 0 };
      // Hesap e-postası değişmişse (doğrulama bağlantısı onaylandı) yerel durum yeni
      // adrese taşınır. İki yol vardır: (1) bu cihazda oturum hâlâ eski adreste durur,
      // belirteç yenilenince sunucu yeni adresi bildirir; (2) kullanıcı yeni adresle
      // yeniden giriş yapmıştır, eski önek "nexusOwnerAlias" işaretinden bulunur.
      var fresh = canonicalOwner(current.email || "");
      var activeCanonical = canonicalOwner(user);
      var alias = "";
      try { alias = String(safeGet(OWNER_ALIAS_PREFIX + current.userId) || ""); } catch (e) {}
      if (fresh && fresh !== activeCanonical) {
        migrateOwner(activeCanonical, fresh);
        try { localStorage.setItem("nexusCurrentUser", current.email); } catch (e) { /* özel mod */ }
        user = fresh;
      } else if (fresh && alias && alias !== fresh) {
        migrateOwner(alias, fresh);
      }
      var headers = { Authorization: "Bearer " + current.accessToken };
      return api("/rest/v1/nexus_user_state?select=key,value,updated_at&user_id=eq." + encodeURIComponent(current.userId) + "&limit=5000", { headers: headers }).then(function (rows) {
        try { localStorage.setItem(OWNER_ALIAS_PREFIX + current.userId, canonicalOwner(user)); } catch (e) { /* özel mod */ }
        var prefix = user + "_";
        var local = snapshotState(user);
        var meta = loadMeta(current.userId);
        var remote = {};
        (rows || []).forEach(function (r) { if (!STATE_EXCLUDE[r.key]) remote[r.key] = r; });
        var nowIso = new Date().toISOString();
        var upserts = [];
        var deletes = [];
        var pulledKeys = [];
        var removedKeys = [];

        Object.keys(remote).forEach(function (key) {
          var r = remote[key];
          var m = meta[key];
          var lv = local[key];
          if (lv === undefined) {
            if (m) { deletes.push(key); return; } // daha önce senkrondu, yerelde silindi
            localStorage.setItem(prefix + key, r.value); // yeni cihaz / geri yükleme
            meta[key] = { h: hashOf(r.value), t: r.updated_at };
            pulledKeys.push(key);
            return;
          }
          if (lv === r.value) { meta[key] = { h: hashOf(lv), t: r.updated_at }; return; }
          var localChanged = !!m && hashOf(lv) !== m.h;
          var remoteChanged = !m || m.t !== r.updated_at;
          var takeRemote;
          if (!m) takeRemote = true; // bu cihazda ilk senkron: hesaptaki veri kazanır
          else if (localChanged && remoteChanged) takeRemote = Date.parse(r.updated_at) > Date.parse((m && m.c) || nowIso);
          else takeRemote = remoteChanged && !localChanged;
          if (takeRemote) {
            localStorage.setItem(prefix + key, r.value);
            meta[key] = { h: hashOf(r.value), t: r.updated_at };
            pulledKeys.push(key);
          } else {
            upserts.push(key);
          }
        });

        Object.keys(local).forEach(function (key) {
          if (remote[key]) return;
          var m = meta[key];
          if (m && hashOf(local[key]) === m.h) {
            // uzaktan silinmiş ve yerelde değişmemiş: bu cihazdan da kaldır
            localStorage.removeItem(prefix + key);
            delete meta[key];
            removedKeys.push(key);
            return;
          }
          upserts.push(key);
        });

        var work = Promise.resolve();
        if (deletes.length) {
          chunk(deletes, 50).forEach(function (part) {
            var list = part.map(function (k) { return '"' + k.replace(/"/g, "") + '"'; }).join(",");
            work = work.then(function () {
              return api("/rest/v1/nexus_user_state?user_id=eq." + encodeURIComponent(current.userId) + "&key=in.(" + encodeURIComponent(list) + ")", { method: "DELETE", headers: headers });
            });
          });
          work = work.then(function () { deletes.forEach(function (k) { delete meta[k]; }); });
        }
        if (upserts.length) {
          chunk(upserts, 40).forEach(function (part) {
            var body = part.map(function (k) {
              return { user_id: current.userId, key: k, value: local[k], updated_at: nowIso };
            });
            work = work.then(function () {
              return api("/rest/v1/nexus_user_state", {
                method: "POST",
                headers: Object.assign({}, headers, { Prefer: "resolution=merge-duplicates" }),
                body: JSON.stringify(body),
              });
            }).then(function () {
              part.forEach(function (k) { meta[k] = { h: hashOf(local[k]), t: nowIso }; });
            });
          });
        }
        return work.then(function () {
          // Yerelde değişip henüz gönderilemeyenlerin değişim zamanını ilk görüldüğü an olarak tut.
          Object.keys(local).forEach(function (k) {
            if (meta[k] && hashOf(local[k]) !== meta[k].h && !meta[k].c) meta[k].c = nowIso;
          });
          saveMeta(current.userId, meta);
          var result = { pulled: pulledKeys.length, pushed: upserts.length, removed: removedKeys.length + deletes.length, keys: pulledKeys };
          if (pulledKeys.length || removedKeys.length) {
            try { window.dispatchEvent(new CustomEvent("nexusCloudStatePulled", { detail: result })); } catch (e) { /* eski WebView */ }
          }
          return result;
        });
      });
    }).then(function (r) { stateRunning = null; return r; }, function (e) { stateRunning = null; throw e; });
    return stateRunning;
  }

  // --- anlık senkron (Supabase Realtime) ---------------------------------------
  //
  // Başka cihazdaki bir değişiklik eskiden yalnızca 45 saniyede bir yoklamada
  // görülüyordu. Supabase Realtime bir Phoenix kanalıdır ve ham WebSocket ile de
  // konuşulur: telefona 250 KB'lik SDK sokmak yerine yalnızca phx_join /
  // postgres_changes / heartbeat çerçevesi kurulur. Bu bir HIZ iyileştirmesidir:
  // bağlanamazsa (ağ yok, WebView'de WebSocket yok, tablo yayın kapsamında değil)
  // yoklama olduğu gibi sürer, senkron Realtime'a bağlı değildir.
  //
  // GEREK (bir seferlik, sunucu tarafı): supabase/migrations/20261025_realtime_publication.sql
  // — nexus_user_state, nexus_devices ve nexus_entitlements supabase_realtime
  // yayınına eklenmezse abone olunur ama hiçbir değişiklik ulaşmaz.

  var rt = { socket: null, topic: "realtime:nexus-hesap", ref: 0, tries: 0, heartbeat: null, reconnect: null };

  function tenantFromUrl() {
    var c = cfg();
    var m = c && /https?:\/\/([a-z0-9-]+)\./i.exec(c.url);
    return m ? m[1] : "supabase";
  }

  function realtimeUrl() {
    var c = cfg();
    if (!c) return "";
    // https -> wss, http -> ws
    return c.url.replace(/^http/i, "ws").replace(/\/+$/, "") +
      "/realtime/v1/websocket?apikey=" + encodeURIComponent(c.anonKey) + "&vsn=1.0.0";
  }

  function rtSend(event, payload) {
    var s = rt.socket;
    if (!s || s.readyState !== 1) return false;
    rt.ref++;
    try {
      s.send(JSON.stringify({ topic: rt.topic, event: event, payload: payload || {}, ref: String(rt.ref), tenant: tenantFromUrl() }));
      return true;
    } catch (e) {
      return false;
    }
  }

  function rtStop() {
    if (rt.heartbeat) { clearInterval(rt.heartbeat); rt.heartbeat = null; }
    if (rt.reconnect) { clearTimeout(rt.reconnect); rt.reconnect = null; }
    var s = rt.socket;
    rt.socket = null;
    if (s) { try { s.onopen = s.onmessage = s.onerror = s.onclose = null; s.close(); } catch (e) { /* zaten kapalı */ } }
  }

  // Uzakta değişen bir hesap durumu anahtarını yerelde uygular.
  // Kendi yazmamız geri dönebilir (postgres_changes kendine de gider): değer aynıysa
  // hiçbir şey yapmayız, böylece kendi yankımız ekranı titretmez.
  function applyRemoteState(row) {
    var user = currentUserKey();
    if (!user || !row || !row.key || STATE_EXCLUDE[row.key]) return false;
    var full = user + "_" + row.key;
    if (localStorage.getItem(full) === row.value) return false;
    try {
      localStorage.setItem(full, row.value);
      var uid = row.user_id || "";
      var meta = loadMeta(uid);
      meta[row.key] = { h: hashOf(String(row.value || "")), t: row.updated_at || new Date().toISOString() };
      if (uid) saveMeta(uid, meta);
    } catch (e) {
      return false;
    }
    announceRemoteChange({ key: row.key, table: "nexus_user_state" });
    return true;
  }

  function applyRemoteDevice(row, removed) {
    var store = window.nexusGetItem ? window.nexusGetItem(DEVICE_KEY) : localStorage.getItem(DEVICE_KEY);
    var local = [];
    try { local = JSON.parse(store || "[]"); } catch (e) { local = []; }
    if (!Array.isArray(local)) local = [];
    var id = (row && (row.device_id || row.id)) || "";
    if (!id) return false;
    var out = local.filter(function (d) { return d && d.id !== id; });
    if (removed) {
      if (out.length === local.length) return false;
    } else {
      var incoming = fromRows([row])[0];
      if (!incoming) return false;
      var same = local.filter(function (d) { return d && d.id === id; })[0];
      if (same && JSON.stringify(same) === JSON.stringify(incoming)) return false;
      out.push(incoming);
    }
    if (window.nexusSetItem) window.nexusSetItem(DEVICE_KEY, JSON.stringify(out));
    else localStorage.setItem(DEVICE_KEY, JSON.stringify(out));
    announceRemoteChange({ key: DEVICE_KEY, table: "nexus_devices" });
    return true;
  }

  // Değişiklik sayfaya duyurulur; eski sayfalar yenileme beklediği için korunan
  // yerinde-yenileme kuralı yine uygulanır (yazarken bölme, art arda yenileme yapma).
  function announceRemoteChange(detail) {
    try {
      window.dispatchEvent(new CustomEvent("nexusCloudRemoteChange", { detail: detail }));
    } catch (e) { /* eski WebView */ }
    // theme.js ve event-bridge.js depolama olayını dinliyor (tema, zil rozeti);
    // sekmeler arası olay aynı sekmede fırlatılmaz — buradan elle veriyoruz, böylece
    // bu tür değişiklikler SAYFA YENİLEMEDEN yansır.
    try {
      if (typeof StorageEvent === "function" && detail && detail.key) {
        var value = window.nexusGetItem ? window.nexusGetItem(detail.key) : localStorage.getItem(detail.key);
        window.dispatchEvent(new StorageEvent("storage", { key: detail.key, newValue: value, storageArea: localStorage }));
      }
    } catch (e) { /* eski WebView */ }
    scheduleRemoteRefresh();
  }

  var refreshTimer = null;
  function scheduleRemoteRefresh() {
    if (refreshTimer) return;
    refreshTimer = setTimeout(function () {
      refreshTimer = null;
      if (typeof document === "undefined" || typeof location === "undefined") return;
      var typing = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      var last = 0;
      try { last = parseInt(sessionStorage.getItem("nexusCloudReloadAt") || "0", 10) || 0; } catch (e) { last = 0; }
      if (!typing && Date.now() - last > 20000) {
        try { sessionStorage.setItem("nexusCloudReloadAt", String(Date.now())); } catch (e) { /* özel mod */ }
        location.reload();
      }
    }, 400);
  }

  function handleRealtimeMessage(raw) {
    var msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }
    if (!msg || msg.topic !== rt.topic) return;
    if (msg.event !== "postgres_changes") return;
    var data = (msg.payload && msg.payload.data) || {};
    var table = data.table || "";
    if (table === "nexus_user_state") { applyRemoteState(data.record || data.old_record); return; }
    if (table === "nexus_devices") { applyRemoteDevice(data.record || data.old_record, data.event_type === "DELETE"); return; }
    if (table === "nexus_entitlements") { pullEntitlement().catch(function () {}); return; }
  }

  function startRealtime() {
    if (!enabled() || !currentUserKey()) return;
    var WS = typeof window === "undefined" ? null : window.WebSocket;
    if (!WS || rt.socket) return;
    session().then(function (current) {
      if (!current || rt.socket) return;
      var socket;
      try { socket = new WS(realtimeUrl()); } catch (e) { return; }
      rt.socket = socket;
      socket.onopen = function () {
        rt.tries = 0;
        rtSend("phx_join", {
          config: {
            broadcast: { ack: false, self: false },
            postgres_changes: [
              { event: "*", schema: "public", table: "nexus_user_state", filter: "user_id=eq." + current.userId },
              { event: "*", schema: "public", table: "nexus_devices", filter: "user_id=eq." + current.userId },
              { event: "*", schema: "public", table: "nexus_entitlements", filter: "email=eq." + String(current.email || "").toLowerCase() },
            ],
          },
          access_token: current.accessToken,
        });
        if (rt.heartbeat) clearInterval(rt.heartbeat);
        rt.heartbeat = setInterval(function () {
          if (!rtSend("heartbeat", { presence: {}, user_profile: {} })) {
            clearInterval(rt.heartbeat);
            rt.heartbeat = null;
          }
        }, 25000);
      };
      socket.onmessage = function (ev) { handleRealtimeMessage(ev && ev.data); };
      socket.onerror = function () { /* kapanışta yeniden bağlanma planlanır */ };
      socket.onclose = function () {
        if (rt.socket === socket) rt.socket = null;
        if (rt.heartbeat) { clearInterval(rt.heartbeat); rt.heartbeat = null; }
        var wait = Math.min(30000, 1000 * Math.pow(2, Math.min(rt.tries, 5)));
        rt.tries++;
        if (rt.reconnect) clearTimeout(rt.reconnect);
        rt.reconnect = setTimeout(function () { rt.reconnect = null; startRealtime(); }, wait);
      };
    }).catch(function () { /* oturum yoksa Realtime da yok */ });
  }

  // --- NEXUS+ abonelik (Whop) --------------------------------------------------
  // Satın alma Whop'ta yapılır; webhook, planı e-postaya bağlı olarak nexus_entitlements'a yazar.
  // Burada yalnızca okunur ve yerel görünüm anahtarlarına yansıtılır.
  var CHECKOUT = {
    TRY: {
      "Yıllık": "https://whop.com/checkout/plan_UEXO1F5mjIgWB",
      "Aylık": "https://whop.com/checkout/plan_fAMBHwTVE0hR2",
    },
    USD: {
      "Yıllık": "https://whop.com/checkout/plan_XlA3SacShoiJU",
      "Aylık": "https://whop.com/checkout/plan_HIySYESquBqlg",
    },
  };
  var PRICES = {
    TRY: { "Yıllık": "₺3.999,99", "Aylık": "₺499,99", perYear: "/yıl", perMonth: "/ay", perMonthOfYear: "₺333,33" },
    USD: { "Yıllık": "$89.99", "Aylık": "$11.99", perYear: "/year", perMonth: "/month", perMonthOfYear: "$7.50" },
  };
  var MANAGE_URL = "https://whop.com/@me/settings/memberships/";

  // Türkçe arayüz TL, diğer diller USD planını gösterir; ödeme sayfası da aynı para biriminde açılır.
  function currencyForLang() {
    var lang = (typeof window !== "undefined" && window.nexusLang) || "tr";
    return lang === "tr" ? "TRY" : "USD";
  }

  function checkoutUrl(plan, email, currency) {
    var group = CHECKOUT[currency || "TRY"] || CHECKOUT.TRY;
    var base = group[plan];
    if (!base) return "";
    return email ? base + "?email=" + encodeURIComponent(email) : base;
  }

  function checkoutPlanId(plan, currency) {
    var url = checkoutUrl(plan, "", currency);
    if (!url) return "";
    var parts = url.split("?")[0].split("/");
    return parts[parts.length - 1] || "";
  }

  // Aile davet e-postası: household-invite Edge Function, davetliye Auth "Invite"
  // mektubunu gönderir — şablon .Data.lang'e bakıp yalnızca davetlinin dilinde yazar
  // ve .Data.home_invite_code ile ev kodunu gösterir. Bulut kapalıysa çağıran taraf
  // mailto akışına döner; buradan hata dönmesi davetin engellenmez.
  function sendHouseholdInvite(invite) {
    return session().then(function (current) {
      if (!current || !current.accessToken) return { ok: false };
      return api("/functions/v1/household-invite", {
        method: "POST",
        headers: { Authorization: "Bearer " + current.accessToken },
        body: JSON.stringify({
          email: String((invite && invite.email) || ""),
          homeName: String((invite && invite.homeName) || ""),
          code: String((invite && invite.code) || ""),
          role: String((invite && invite.role) || ""),
          lang: accountLang(),
        }),
      }).then(
        function (d) { return { ok: !!(d && d.ok), sent: !!(d && d.sent), alreadyAccount: !!(d && d.alreadyAccount) }; },
        function () { return { ok: false }; }
      );
    }, function () { return { ok: false }; });
  }

  // Dışa dönük bildirim e-postası: notify-email Edge Function, maili SADECE
  // çağıran oturumun kendi adresine gönderir (gövdede "to" yok, sunucu da kabul
  // etmez) — oturumlu kullanıcı kendinden başkasına mail attıramaz ve istemcide
  // saklanacak bir gönderim anahtarı gerekmez.
  function sendNotifyEmail(payload) {
    if (!enabled()) return Promise.reject(new Error("bulut yapılandırması yok"));
    return session().then(function (current) {
      if (!current || !current.accessToken) return Promise.reject(new Error("oturum yok"));
      return api("/functions/v1/notify-email", {
        method: "POST",
        headers: authHeader(current),
        body: JSON.stringify({
          title: String((payload && payload.title) || "").slice(0, 120),
          detail: String((payload && payload.detail) || "").slice(0, 800),
          level: String((payload && payload.level) || "info").slice(0, 20),
          lang: accountLang(),
        }),
      });
    });
  }

  // Push token kaydı: cihazın FCM token'ını nexus_push_tokens'a yazar (RLS ile
  // yalnızca kendi satırları). Token birincil anahtarın parçası olduğundan
  // upsert = merge-deduplicate; cihaz değişirse eski hesabın satırı logout'ta silinir.
  function pushRegisterToken(token, platform) {
    if (!enabled()) return Promise.reject(new Error("bulut yapılandırması yok"));
    return session().then(function (current) {
      if (!current || !current.accessToken) return Promise.reject(new Error("oturum yok"));
      return api("/rest/v1/nexus_push_tokens", {
        method: "POST",
        headers: Object.assign(authHeader(current), {
          Prefer: "resolution=merge-deduplicate",
        }),
        body: JSON.stringify([
          {
            user_id: current.userId,
            token: String(token).slice(0, 512),
            platform: String(platform || "web").slice(0, 20),
          },
        ]),
      }).then(function () { return true; });
    });
  }

  // Push gönderim çağrısı: push-send Edge Function (FCM HTTP v1). notify.js ve
  // push.js kullanır; hedef e-postalar sunucuda auth kullanıcılarına çözülür.
  function pushSend(payload) {
    if (!enabled()) return Promise.reject(new Error("bulut yapılandırması yok"));
    return session().then(function (current) {
      if (!current || !current.accessToken) return Promise.reject(new Error("oturum yok"));
      return api("/functions/v1/push-send", {
        method: "POST",
        headers: authHeader(current),
        body: JSON.stringify({
          action: String((payload && payload.action) || "event").slice(0, 10),
          emails: Array.isArray(payload && payload.emails) ? payload.emails.slice(0, 12) : [],
          title: String((payload && payload.title) || "").slice(0, 120),
          body: String((payload && payload.body) || "").slice(0, 400),
          level: String((payload && payload.level) || "info").slice(0, 20),
          eventId: String((payload && payload.eventId) || "").slice(0, 64),
        }),
      });
    });
  }

  function billingAccount(action) {
    if (!enabled()) return Promise.reject(new Error("bulut yapılandırması yok"));
    return session().then(function (current) {
      if (!current) return Promise.reject(new Error("oturum yok"));
      return api("/functions/v1/whop-account", {
        method: "POST",
        headers: { Authorization: "Bearer " + current.accessToken },
        body: JSON.stringify({ action: action === "cancel" ? "cancel" : "status" }),
      }).then(function (d) {
        var m = d && d.membership;
        if (m && (m.plan === "Aylık" || m.plan === "Yıllık")) {
          applyEntitlement({
            status: "active",
            plan: m.plan,
            currency: m.currency,
            period_end: m.periodEnd || null,
            cancel_at_period_end: !!m.cancelAtPeriodEnd,
          });
        } else {
          applyEntitlement(null);
        }
        return d || { membership: null, payments: [] };
      });
    });
  }

  function applyEntitlement(row) {
    var set = function (k, v) { if (window.nexusSetItem) window.nexusSetItem(k, v); };
    var del = function (k) { if (window.nexusRemoveItem) window.nexusRemoveItem(k); else set(k, ""); };
    if (row && row.status === "active" && (row.plan === "Aylık" || row.plan === "Yıllık")) {
      set("nexusPlusPlan", row.plan);
      set("nexusPlusCurrency", row.currency === "USD" ? "USD" : "TRY");
      if (row.period_end) set("nexusPlusEnd", row.period_end); else del("nexusPlusEnd");
      if (row.cancel_at_period_end) set("nexusPlusCancel", "1"); else del("nexusPlusCancel");
      return { active: true, plan: row.plan, periodEnd: row.period_end || null, cancelAtPeriodEnd: !!row.cancel_at_period_end };
    }
    del("nexusPlusPlan"); del("nexusPlusEnd"); del("nexusPlusCancel"); del("nexusPlusCurrency");
    return { active: false, plan: "none" };
  }

  function pullEntitlement() {
    if (!enabled()) return Promise.resolve({ active: false, plan: "none", skipped: true });
    return session().then(function (current) {
      if (!current) return { active: false, plan: "none", skipped: true };
      return api("/rest/v1/nexus_entitlements?select=plan,status,currency,cancel_at_period_end,period_end&limit=1", {
        headers: { Authorization: "Bearer " + current.accessToken },
      }).then(function (rows) { return applyEntitlement(rows && rows[0]); });
    });
  }

  // Cihaz listesi + hesap durumu + abonelik birlikte.
  function syncAll() {
    return syncNow().catch(function () { return { changed: false }; }).then(function (devices) {
      return syncState().then(function (state) {
        return pullEntitlement().catch(function () { return null; }).then(function (plan) {
          return { devices: devices, state: state, plan: plan, changed: !!(devices && devices.changed) || state.pulled > 0 || state.removed > 0 };
        });
      });
    });
  }

  // Giriş yapılmış oturumda arka planda eşitler: açılışta, düzenli aralıkla, görünür olunca, çevrimiçi olunca.
  function mfaBlocking() {
    try { return localStorage.getItem("nexusMfaPending") === "1"; } catch (e) { return false; }
  }

  function startAutoSync() {
    if (typeof document === "undefined" || !enabled() || !currentUserKey() || mfaBlocking()) return;
    var busy = false;
    function run(initial) {
      if (busy) return;
      busy = true;
      syncAll().then(function (r) {
        clearQueue(); // bu tur başarılı: çevrimdışıyken biriken "yeniden dene" işaretleri uygulandı
        if (!r || !r.changed) return;
        // Başka cihazdan gelen veri sayfada görünsün: yazarken bölme, art arda yenileme yapma.
        var typing = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
        var last = 0;
        try { last = parseInt(sessionStorage.getItem("nexusCloudReloadAt") || "0", 10) || 0; } catch (e) { last = 0; }
        if (!typing && Date.now() - last > 20000) {
          try { sessionStorage.setItem("nexusCloudReloadAt", String(Date.now())); } catch (e) { /* özel mod */ }
          location.reload();
        }
      }, function () {
        // çevrimdışı / erişilemedi: kuyrukta dursun, çevrimiçi olunca yeniden denenir.
        enqueue({ kind: "sync", at: Date.now() });
      }).then(function () { busy = false; });
    }
    setTimeout(function () { run(true); startRealtime(); session().then(rememberMailLang); }, 1200);
    setInterval(run, 45000);
    document.addEventListener("visibilitychange", function () { run(false); startRealtime(); });
    window.addEventListener("online", function () {
      // bağlantıya geçince bekleyen işleri bekleme; hemen dene, sonra tam senkron.
      if (queue().length) flushQueue().catch(function () { /* sonraki tur dener */ });
      startRealtime();
      run(false);
    });
    window.addEventListener("pagehide", function () { try { syncState(); } catch (e) { /* kapanırken en iyi çaba */ } });
  }

  // Google ile giriş: Supabase yetkilendirme adresine yönlendirir, dönüşte oturum URL'den alınır.
  function signInWithGoogle() {
    var c = cfg();
    if (!c || !googleAvailable()) return;
    var back = isWebOrigin()
      ? location.href.split("#")[0]
      : (isNativeApp() ? NATIVE_AUTH_REDIRECT : (webBase() + "/"));
    var authUrl = c.url + "/auth/v1/authorize?provider=google&redirect_to=" + encodeURIComponent(back);
    // Masaüstü penceresi siteye gitmez. Google, uygulamanın kendi penceresinde açılır.
    if (isDesktopApp()) {
      if (window.nexusDesktop && typeof window.nexusDesktop.googleLogin === "function") window.nexusDesktop.googleLogin(authUrl);
      return;
    }
    // Mobil WebView'de Google oturum açmaya izin vermez; sistem tarayıcısı (Custom Tab) açılır.
    if (isNativeApp()) {
      var Browser = nativeBrowser();
      if (!Browser) return;
      try {
        Browser.open({ url: authUrl }).catch(function () {
          // Tarayıcı açılamadı: çağıran ekran hatayı kullanıcıya gösterebilir.
        });
      } catch (e) {}
      return;
    }
    location.href = authUrl;
  }

  function hashParams() {
    var h = location.hash || "";
    return h.length > 1 ? new URLSearchParams(h.slice(1)) : null;
  }

  // Bağlantıdaki hata (süresi dolmuş şifre sıfırlama bağlantısı gibi); varsa metin döner.
  function hashError() {
    var p = hashParams();
    if (!p || !p.get("error")) return "";
    var text = p.get("error_description") || p.get("error") || "";
    history.replaceState(null, "", location.pathname + location.search);
    return text.replace(/\+/g, " ");
  }

  // Şifre sıfırlama bağlantısından dönüldüyse geçici belirteci verir (oturum AÇMAZ).
  function recoveryTokenFromHash() {
    var p = hashParams();
    if (!p || p.get("type") !== "recovery" || !p.get("access_token")) return null;
    var token = p.get("access_token");
    history.replaceState(null, "", location.pathname + location.search);
    return token;
  }

  // Google / e-posta doğrulama bağlantısı dönüşü: belirteçlerden oturum kurar.
  function completeOAuthFromHash(explicitHash) {
    var p = explicitHash ? new URLSearchParams(explicitHash.replace(/^#/, "")) : hashParams();
    if (!p || !p.get("access_token") || p.get("type") === "recovery") return Promise.resolve(null);
    var access = p.get("access_token");
    var refresh = p.get("refresh_token") || "";
    var expires = parseInt(p.get("expires_in") || "3600", 10);
    if (!explicitHash && typeof history !== "undefined" && history.replaceState) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    return api("/auth/v1/user", { headers: { Authorization: "Bearer " + access } }).then(function (user) {
      var meta = user.user_metadata || {};
      var avatar = meta.avatar_url || meta.picture || "";
      var s = {
        accessToken: access,
        refreshToken: refresh,
        expiresAt: Date.now() + expires * 1000 - 60 * 1000,
        userId: user.id,
        email: user.email || "",
        name: meta.full_name || meta.name || "",
        avatar: avatar,
      };
      // Oturum, kullanıcının kendi anahtar önekiyle yazılsın diye önce aktif kullanıcı ayarlanır.
      if (user.email) localStorage.setItem("nexusCurrentUser", user.email);
      writeSession(s);
      if (avatar && typeof nexusGetItem === "function" && typeof nexusSetItem === "function") {
        try {
          if (!nexusGetItem("nexusGoogleAvatar")) nexusSetItem("nexusGoogleAvatar", avatar);
          if (!nexusGetItem("nexusAvatar")) nexusSetItem("nexusAvatar", avatar);
        } catch (e) {}
      }
      return s;
    });
  }

  // Mobil uygulamada Google dönüşü: /app-auth.html belirteçleri nexus://auth#...
  // adresine taşır. Belirteçler doğrudan oturuma çevrilmez; giriş ekranına aktarılır.
  // Böylece iki adımlı doğrulama, hesap geri yükleme ve yönlendirme aynı yoldan geçer.
  function nativeAuthHash(url) {
    if (!url || typeof url !== "string") return "";
    if (!/^nexus:\/\/auth(?:[/?#]|$)/i.test(url)) return "";
    var hashIdx = url.indexOf("#");
    var hash = hashIdx !== -1 ? url.slice(hashIdx) : "";
    if (!hash) {
      var qIdx = url.indexOf("?");
      if (qIdx !== -1) hash = "#" + url.slice(qIdx + 1);
    }
    return /(access_token|error)=/.test(hash) ? hash : "";
  }

  function initNativeAuth() {
    if (!isNativeApp() || window.__nexusNativeAuthBound) return;
    var App = null;
    try {
      App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    } catch (e) { App = null; }
    if (!App || typeof App.addListener !== "function") return;
    window.__nexusNativeAuthBound = true;

    function forward(url) {
      var hash = nativeAuthHash(url);
      if (!hash || window.__nexusNativeAuthForwarded) return;
      window.__nexusNativeAuthForwarded = true;
      // Aynı giriş sayfasındaysak yalnız hash değişimi sayfayı yeniden çalıştırmaz.
      // ?oauth=1 sorgusu tam yüklemeyi garanti eder; hash'i giriş ekranı işler.
      location.replace("nexus-login.html?oauth=1" + hash);
    }

    try {
      App.addListener("appUrlOpen", function (event) { forward(event && event.url); });
      if (typeof App.getLaunchUrl === "function") {
        App.getLaunchUrl().then(function (event) { forward(event && event.url); }).catch(function () {});
      }
    } catch (e) {
      window.__nexusNativeAuthBound = false;
    }
  }

  initNativeAuth();

  // --- yerel yedek: dışa / içe aktarma (bulut gerekmez) ---------------------
  // Yedek: hesabın ayar/senaryo/otomasyon kayıtları (snapshotState: oturum, parola ve
  // bildirim kanal anahtarları hariç) + eşli cihaz listesi. Cihaz kayıtlarından sır gibi görünen
  // her alan (anahtar, parola, belirteç, kullanıcı adı) ayrıca ayıklanır; Tapo hesabı / Tuya yerel
  // anahtarı zaten ayrı depoda (nexusLanSecrets) durur ve yedeğe HİÇ girmez: geri yükledikten
  // sonra bu cihazlar için sır yeniden girilir (ekran bunu söyler, başarı sahte gösterilmez).
  var BACKUP_APP = "nexus-backup";
  var BACKUP_VERSION = 1;
  var SECRETISH = /(secret|token|passw|apikey|api_key|localkey|local_key|username|credential)/i;

  function stripSecrets(value) {
    if (Array.isArray(value)) return value.map(stripSecrets);
    if (value && typeof value === "object") {
      var out = {};
      Object.keys(value).forEach(function (k) {
        if (!SECRETISH.test(k)) out[k] = stripSecrets(value[k]);
      });
      return out;
    }
    return value;
  }

  function readDeviceList(user) {
    try {
      var list = JSON.parse(safeGet(user + "_nexusPairedDevices") || "[]");
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function exportBackup() {
    var user = currentUserKey();
    if (!user) return null;
    return {
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      keys: snapshotState(user),
      devices: stripSecrets(readDeviceList(user)),
    };
  }

  function importBackup(data) {
    var user = currentUserKey();
    if (!user) return { ok: false, error: "Önce hesabınla giriş yap." };
    if (!data || data.app !== BACKUP_APP || data.version !== BACKUP_VERSION || !data.keys || typeof data.keys !== "object")
      return { ok: false, error: "Bu dosya bir NEXUS yedeği değil ya da sürümü desteklenmiyor." };
    var keys = 0;
    // Kimlik ve çalışma anı kayıtları geri yüklenmez: yedek başka bir hesaptan gelmiş olabilir.
    var IMPORT_SKIP = { nexusUserEmail: 1, nexusEngineBeat: 1, nexusCloudSessionOwner: 1 };
    Object.keys(data.keys).forEach(function (k) {
      var v = data.keys[k];
      if (!k || k.length > 120 || STATE_EXCLUDE[k] || IMPORT_SKIP[k] || typeof v !== "string" || v.length > MAX_VALUE) return;
      try {
        localStorage.setItem(user + "_" + k, v);
        keys++;
      } catch (e) {
        /* kota dolu: kalanlar atlanır, sonuçta sayı dürüstçe bildirilir */
      }
    });
    var devices = 0;
    if (Array.isArray(data.devices) && data.devices.length) {
      var current = readDeviceList(user);
      data.devices.forEach(function (d) {
        if (!d || typeof d !== "object" || !d.name) return;
        var clean = stripSecrets(d);
        var exists = current.some(function (c) {
          return c && c.name === clean.name && (c.host || "") === (clean.host || "");
        });
        if (!exists) {
          current.push(clean);
          devices++;
        }
      });
      try {
        localStorage.setItem(user + "_nexusPairedDevices", JSON.stringify(current));
      } catch (e) {
        devices = 0;
      }
    }
    try {
      notifyLocalChange();
    } catch (e) {
      /* bulut kapalıysa yalnızca yerelde kalır */
    }
    return { ok: true, keys: keys, devices: devices };
  }

  window.nexusCloud = {
    exportBackup: exportBackup,
    importBackup: importBackup,
    signInWithGoogle: signInWithGoogle,
    googleAvailable: googleAvailable,
    initNativeAuth: initNativeAuth,
    completeOAuthFromHash: completeOAuthFromHash,
    recoveryTokenFromHash: recoveryTokenFromHash,
    hashError: hashError,
    recover: recover,
    setPasswordWithToken: setPasswordWithToken,
    changePassword: changePassword,
    passwordStatus: passwordStatus,
    setPasswordWithSession: setPasswordWithSession,
    changeEmail: changeEmail,
    enabled: enabled,
    notifyLocalChange: notifyLocalChange,
    signIn: signIn,
    listFactors: listFactors,
    needsSecondFactor: needsSecondFactor,
    enrollTotp: enrollTotp,
    verifyTotp: verifyTotp,
    unenrollTotp: unenrollTotp,
    signUp: signUp,
    signOut: signOut,
    session: session,
    syncAll: syncAll,
    syncState: syncState,
    pullEntitlement: pullEntitlement,
    checkoutUrl: checkoutUrl,
    sendHouseholdInvite: sendHouseholdInvite,
    sendNotifyEmail: sendNotifyEmail,
    pushRegisterToken: pushRegisterToken,
    pushSend: pushSend,
    checkoutPlanId: checkoutPlanId,
    billingAccount: billingAccount,
    currencyForLang: currencyForLang,
    prices: function (currency) { return PRICES[currency || currencyForLang()] || PRICES.TRY; },
    manageUrl: function () { return MANAGE_URL; },
    syncNow: syncNow,
    pullDevices: pullDevices,
    pushDevices: pushDevices,
    ensureDeviceIds: ensureDeviceIds,
    mergeDevices: mergeDevices,
    flushQueue: flushQueue,
    startRealtime: startRealtime,
    stopRealtime: rtStop,
    realtimeActive: function () { return !!rt.socket && rt.socket.readyState === 1; },
    // test penetrasyonu: saf yardimcilara erisim
    _internal: { toRows: toRows, fromRows: fromRows, deviceIdFor: deviceIdFor, hashOf: hashOf, snapshotState: snapshotState },
  };

  startAutoSync();
})();
