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

  function readSession() {
    try {
      var raw = window.nexusGetItem ? window.nexusGetItem(SESSION_KEY) : localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // Oturum, sahibinin e-postasıyla anahtarlanır. Giriş sırasında aktif kullanıcı henüz ayarlanmamış olabilir;
  // eskiden bu yüzden oturum "guest_" altına düşüp senkron hiç çalışmıyordu.
  function writeSession(session) {
    var owner = (session && session.email) || localStorage.getItem("nexusCurrentUser") || "guest";
    var key = owner + "_" + SESSION_KEY;
    try {
      if (session) localStorage.setItem(key, JSON.stringify(session));
      else localStorage.removeItem(key);
    } catch (e) { /* kota dolu / özel mod */ }
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
          throw error;
        }
        return body;
      });
    });
  }

  // Web adresi: e-posta bağlantıları (doğrulama, şifre sıfırlama) ve Google girişi buraya döner.
  // Masaüstü (nexus://) ve Android (https://localhost) kendi adreslerine dönemez; web uygulamasını kullanır.
  var WEB_URL = "https://nexus-web-jre.pages.dev";

  function isWebOrigin() {
    if (typeof location === "undefined") return false;
    return /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  }

  function webBase() {
    var c = cfg();
    return isWebOrigin() ? location.origin : ((c && c.webUrl) || WEB_URL).replace(/\/+$/, "");
  }

  // Google ile giriş yalnızca web adresinde güvenle geri dönebilir.
  function googleAvailable() {
    return enabled() && isWebOrigin();
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
      writeSession(session);
      return session;
    });
  }

  function signIn(email, password) {
    return grant({ email: email, password: password });
  }

  // Dönüş: { session, needsConfirmation }. E-posta doğrulaması açıksa oturum gelmez;
  // kullanıcı e-postadaki bağlantıya tıklayınca web girişine döner ve oturum oradan alınır.
  function signUp(email, password, name) {
    var back = encodeURIComponent(webBase() + "/stitch-login.html");
    return api("/auth/v1/signup?redirect_to=" + back, {
      method: "POST",
      body: JSON.stringify({ email: email, password: password, data: name ? { name: name } : {} }),
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

  // Şifre sıfırlama e-postası gönderir (Supabase gönderir; bağlantı web uygulamasına döner).
  function recover(email) {
    var back = encodeURIComponent(webBase() + "/stitch-forgot-password.html");
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

  function authHeader() {
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
        return authHeader().then(function (headers) {
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
      return authHeader().then(function (headers) {
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

  function flushQueue() {
    var pending = queue();
    if (!pending.length || !enabled()) return Promise.resolve({ flushed: pending.length });
    return syncNow().then(function () {
      localStorage.removeItem(QUEUE_KEY);
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
  var MAX_VALUE = 600000;
  // Cihaz listesi ayrı tabloda; oturum/şifre/kurtarma bilgileri buluta HİÇ gitmez.
  var STATE_EXCLUDE = {
    nexusCloudSession: 1,
    nexusCloudMeta: 1,
    nexusUserPassword: 1,
    nexusLastRecoveryValue: 1,
    nexusLastRecoveryMethod: 1,
    nexusPairedDevices: 1,
    // Abonelik durumu yalnızca sunucudan (Whop webhook'u) gelir; istemci durumu hesaba geri yazılmaz.
    nexusPlusPlan: 1,
    nexusPlusSince: 1,
    nexusPlusEnd: 1,
    nexusPlusCancel: 1,
  };

  function currentUserKey() {
    var u = "";
    try { u = localStorage.getItem("nexusCurrentUser") || ""; } catch (e) { u = ""; }
    return u && u !== "guest" ? u : "";
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
      var headers = { Authorization: "Bearer " + current.accessToken };
      return api("/rest/v1/nexus_user_state?select=key,value,updated_at&user_id=eq." + encodeURIComponent(current.userId) + "&limit=5000", { headers: headers }).then(function (rows) {
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

  // --- NEXUS+ abonelik (Whop) --------------------------------------------------
  // Satın alma Whop'ta yapılır; webhook, planı e-postaya bağlı olarak nexus_entitlements'a yazar.
  // Burada yalnızca okunur ve yerel görünüm anahtarlarına yansıtılır.
  var CHECKOUT = {
    "Yıllık": "https://whop.com/checkout/plan_UEXO1F5mjIgWB",
    "Aylık": "https://whop.com/checkout/plan_fAMBHwTVE0hR2",
  };
  var MANAGE_URL = "https://whop.com/@me/settings/memberships/";

  function checkoutUrl(plan, email) {
    var base = CHECKOUT[plan];
    if (!base) return "";
    return email ? base + "?email=" + encodeURIComponent(email) : base;
  }

  function applyEntitlement(row) {
    var set = function (k, v) { if (window.nexusSetItem) window.nexusSetItem(k, v); };
    var del = function (k) { if (window.nexusRemoveItem) window.nexusRemoveItem(k); else set(k, ""); };
    if (row && row.status === "active" && (row.plan === "Aylık" || row.plan === "Yıllık")) {
      set("nexusPlusPlan", row.plan);
      if (row.period_end) set("nexusPlusEnd", row.period_end); else del("nexusPlusEnd");
      if (row.cancel_at_period_end) set("nexusPlusCancel", "1"); else del("nexusPlusCancel");
      return { active: true, plan: row.plan, periodEnd: row.period_end || null, cancelAtPeriodEnd: !!row.cancel_at_period_end };
    }
    del("nexusPlusPlan"); del("nexusPlusEnd"); del("nexusPlusCancel");
    return { active: false, plan: "none" };
  }

  function pullEntitlement() {
    if (!enabled()) return Promise.resolve({ active: false, plan: "none", skipped: true });
    return session().then(function (current) {
      if (!current) return { active: false, plan: "none", skipped: true };
      return api("/rest/v1/nexus_entitlements?select=plan,status,cancel_at_period_end,period_end&limit=1", {
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
  function startAutoSync() {
    if (typeof document === "undefined" || !enabled() || !currentUserKey()) return;
    var busy = false;
    function run(initial) {
      if (busy) return;
      busy = true;
      syncAll().then(function (r) {
        if (!r || !r.changed) return;
        // Başka cihazdan gelen veri sayfada görünsün: yazarken bölme, art arda yenileme yapma.
        var typing = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
        var last = 0;
        try { last = parseInt(sessionStorage.getItem("nexusCloudReloadAt") || "0", 10) || 0; } catch (e) { last = 0; }
        if (!typing && Date.now() - last > 20000) {
          try { sessionStorage.setItem("nexusCloudReloadAt", String(Date.now())); } catch (e) { /* özel mod */ }
          location.reload();
        }
      }).catch(function () { /* çevrimdışı: bir sonraki turda yeniden denenir */ }).then(function () { busy = false; });
    }
    setTimeout(function () { run(true); }, 1200);
    setInterval(run, 45000);
    document.addEventListener("visibilitychange", function () { run(false); });
    window.addEventListener("online", function () { run(false); });
    window.addEventListener("pagehide", function () { try { syncState(); } catch (e) { /* kapanırken en iyi çaba */ } });
  }

  // Google ile giriş: Supabase yetkilendirme adresine yönlendirir, dönüşte oturum URL'den alınır.
  function signInWithGoogle() {
    var c = cfg();
    if (!c || !isWebOrigin()) return;
    var back = location.href.split("#")[0];
    location.href = c.url + "/auth/v1/authorize?provider=google&redirect_to=" + encodeURIComponent(back);
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
  function completeOAuthFromHash() {
    var p = hashParams();
    if (!p || !p.get("access_token") || p.get("type") === "recovery") return Promise.resolve(null);
    var access = p.get("access_token");
    var refresh = p.get("refresh_token") || "";
    var expires = parseInt(p.get("expires_in") || "3600", 10);
    history.replaceState(null, "", location.pathname + location.search);
    return api("/auth/v1/user", { headers: { Authorization: "Bearer " + access } }).then(function (user) {
      var meta = user.user_metadata || {};
      var s = {
        accessToken: access,
        refreshToken: refresh,
        expiresAt: Date.now() + expires * 1000 - 60 * 1000,
        userId: user.id,
        email: user.email || "",
        name: meta.full_name || meta.name || "",
      };
      // Oturum, kullanıcının kendi anahtar önekiyle yazılsın diye önce aktif kullanıcı ayarlanır.
      if (user.email) localStorage.setItem("nexusCurrentUser", user.email);
      writeSession(s);
      return s;
    });
  }

  window.nexusCloud = {
    signInWithGoogle: signInWithGoogle,
    googleAvailable: googleAvailable,
    completeOAuthFromHash: completeOAuthFromHash,
    recoveryTokenFromHash: recoveryTokenFromHash,
    hashError: hashError,
    recover: recover,
    setPasswordWithToken: setPasswordWithToken,
    changePassword: changePassword,
    enabled: enabled,
    notifyLocalChange: notifyLocalChange,
    signIn: signIn,
    signUp: signUp,
    signOut: signOut,
    session: session,
    syncAll: syncAll,
    syncState: syncState,
    pullEntitlement: pullEntitlement,
    checkoutUrl: checkoutUrl,
    manageUrl: function () { return MANAGE_URL; },
    syncNow: syncNow,
    pullDevices: pullDevices,
    pushDevices: pushDevices,
    ensureDeviceIds: ensureDeviceIds,
    mergeDevices: mergeDevices,
    flushQueue: flushQueue,
    // test penetrasyonu: saf yardimcilara erisim
    _internal: { toRows: toRows, fromRows: fromRows, deviceIdFor: deviceIdFor, hashOf: hashOf, snapshotState: snapshotState },
  };

  startAutoSync();
})();
