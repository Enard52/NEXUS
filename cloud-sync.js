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

  function writeSession(session) {
    var value = session ? JSON.stringify(session) : "";
    if (window.nexusSetItem) window.nexusSetItem(SESSION_KEY, value);
    else if (session) localStorage.setItem(SESSION_KEY, value);
    else localStorage.removeItem(SESSION_KEY);
  }

  function expiryFrom(data) {
    var now = Date.now();
    return now + (data.expires_in || 3600) * 1000 - 60 * 1000; // 60 sn pay
  }

  function api(path, options) {
    var config = cfg();
    if (!config) return Promise.reject(new Error("bulut yapilandirmasi yok"));
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

  function grant(idToken, refresh) {
    return api("/auth/v1/token?grant_type=" + (refresh ? "refresh_token" : "password"), {
      method: "POST",
      body: JSON.stringify(refresh ? { refresh_token: idToken } : { email: idToken.email, password: idToken.password }),
    }).then(function (data) {
      var session = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: expiryFrom(data),
        userId: data.user ? data.user.id : null,
        email: data.user ? data.user.email : (idToken && idToken.email) || "",
      };
      writeSession(session);
      return session;
    });
  }

  function signIn(email, password) {
    return grant({ email: email, password: password });
  }

  function signUp(email, password) {
    return api("/auth/v1/signup", { method: "POST", body: JSON.stringify({ email: email, password: password }) }).then(
      function (created) {
        // E-posta doğrulama kapalıysa signup doğrudan oturum döndürür; açıksa
        // kullanıcı doğrulamadan oturum açamaz — iki durumda da yeri kontrol edilir.
        if (created && created.access_token) return grant({ email: email, password: password }).catch(function () {
          return null;
        });
        return null;
      },
    );
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

  function syncNow() {
    var store = window.nexusGetItem ? window.nexusGetItem(DEVICE_KEY) : localStorage.getItem(DEVICE_KEY);
    var local = [];
    try {
      local = JSON.parse(store || "[]");
    } catch (e) {
      local = [];
    }
    var ensured = ensureDeviceIds(local);
    if (ensured.changed && window.nexusSetItem) window.nexusSetItem(DEVICE_KEY, JSON.stringify(ensured.devices));

    return pullDevices().then(function (remote) {
      var merged = mergeDevices(ensured.devices, remote);
      if (window.nexusSetItem) window.nexusSetItem(DEVICE_KEY, JSON.stringify(merged));
      return pushDevices(merged).then(function (result) {
        return { count: merged.length, pushed: result.pushed, remoteCount: remote.length };
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
        syncNow().then(function (result) {
          resolvePromise(result);
        }).catch(function () {
          enqueue({ kind: "sync", at: Date.now() });
          resolvePromise({ pushed: 0, queued: true });
        });
      }, 800);
    });
  }

  window.nexusCloud = {
    enabled: enabled,
    notifyLocalChange: notifyLocalChange,
    signIn: signIn,
    signUp: signUp,
    signOut: signOut,
    session: session,
    syncNow: syncNow,
    pullDevices: pullDevices,
    pushDevices: pushDevices,
    ensureDeviceIds: ensureDeviceIds,
    mergeDevices: mergeDevices,
    flushQueue: flushQueue,
    // test penetrasyonu: saf yardimcilara erisim
    _internal: { toRows: toRows, fromRows: fromRows, deviceIdFor: deviceIdFor },
  };
})();
