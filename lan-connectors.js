// NEXUS — yerel ağ (LAN) connector katmanı. Bulut yok, ücret yok: komutlar telefondan /
// bilgisayardan doğrudan cihaza gider.
//
// Taşıma (transport) sırası:
//   1. Masaüstü uygulaması (Electron): preload'un verdiği window.nexusDesktop.http — CORS yok.
//   2. Telefon (Capacitor 6+): çekirdekteki CapacitorHttp — WebView'ın mixed-content / CORS
//      kısıtına takılmaz. (Android'de yerel http için network_security_config gerekir.)
//   3. Tarayıcı: fetch (yalnızca CORS izni veren cihazlarda çalışır; geliştirme içindir).
//
// TCP isteyen protokoller (Kasa, Yeelight) yalnızca TCP köprüsü olan ortamda (masaüstü
// uygulaması) etkinleşir; olmayan ortamda "desteklenmiyor" der, asla sahte başarı göstermez.

(function () {
  "use strict";

  var DEFAULT_TIMEOUT_MS = 2500;
  // Ağ taraması sırasında cevap vermeyen adresler hızlı elensin diye kısaltılır (tarama bitince sıfırlanır).
  var scanTimeoutMs = 0;
  var transport = null;

  function setTransport(fn) {
    transport = typeof fn === "function" ? fn : null;
  }

  function desktopBridge() {
    return window.nexusDesktop && typeof window.nexusDesktop.http === "function" ? window.nexusDesktop : null;
  }

  function nativeHttpPlugin() {
    var capi = window.Capacitor;
    if (!capi || typeof capi.isNativePlatform !== "function" || !capi.isNativePlatform()) return null;
    var plugins = capi.Plugins || {};
    var plugin = plugins.CapacitorHttp || plugins.Http;
    return plugin && typeof plugin.request === "function" ? plugin : null;
  }

  function tcpBridge() {
    var d = desktopBridge();
    return d && typeof d.tcp === "function" ? d.tcp : null;
  }

  function request(opts) {
    if (transport) return transport(opts);
    var timeout = opts.timeoutMs || scanTimeoutMs || DEFAULT_TIMEOUT_MS;
    var headers = opts.headers || (opts.body ? { "Content-Type": "application/json" } : {});
    var desk = desktopBridge();
    if (desk) {
      return desk.http({ url: opts.url, method: opts.method || "GET", headers: headers, body: opts.body, timeoutMs: timeout });
    }
    var plugin = nativeHttpPlugin();
    if (plugin) {
      var data = opts.body;
      if (typeof data === "string" && /json/i.test(headers["Content-Type"] || "")) {
        try { data = JSON.parse(data); } catch (e) { /* düz metin olarak gönder */ }
      }
      return plugin.request({
        method: opts.method || "GET",
        url: opts.url,
        headers: headers,
        data: data,
        connectTimeout: timeout,
        readTimeout: timeout,
        responseType: "text",
      }).then(function (res) {
        var text = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
        return { status: res.status, text: text };
      });
    }
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, timeout) : null;
    return fetch(opts.url, {
      method: opts.method || "GET",
      body: opts.body,
      headers: opts.body || opts.headers ? headers : undefined,
      signal: controller ? controller.signal : undefined,
      cache: "no-store",
    }).then(function (res) {
      return res.text().then(function (text) { return { status: res.status, text: text }; });
    }).finally(function () { if (timer) clearTimeout(timer); });
  }

  function getJson(url, timeoutMs) {
    return request({ url: url, timeoutMs: timeoutMs }).then(function (res) {
      if (res.status < 200 || res.status >= 300) throw new Error("http " + res.status);
      return JSON.parse(res.text);
    });
  }

  function sendJson(url, method, body) {
    return request({ url: url, method: method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }).then(function (res) {
      if (res.status < 200 || res.status >= 300) throw new Error("http " + res.status);
      try { return JSON.parse(res.text); } catch (e) { return res.text; }
    });
  }

  function baseUrl(device) {
    var host = /^https?:\/\//.test(device.host || "") ? device.host : "http://" + (device.host || device.ip);
    return host.replace(/\/+$/, "");
  }

  function hostOnly(device) {
    return baseUrl(device).replace(/^https?:\/\//, "").split(":")[0];
  }

  function hexToRgb(hex) {
    var n = parseInt(String(hex || "#ffffff").replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function unsupported(id, capability) {
    return Promise.reject(new Error(id + ": desteklenmeyen işlev " + capability));
  }

  // --- Shelly Gen1 (REST) ---------------------------------------------------
  var shelly = {
    id: "shelly",
    label: "Shelly",
    caps: ["switch", "brightness"],
    probe: function (device) {
      return getJson(baseUrl(device) + "/settings").then(function (info) {
        if (!info || !info.device || !info.device.type) throw new Error("shelly: kimlik yok");
        return {
          protocol: "shelly",
          model: info.device.type,
          name: info.name || info.device.hostname || device.name,
          kind: /SHCB|SHBLB|SHRGBW|SHDM|LTAH|dimmer|bulb/i.test(info.device.type) ? "light" : /SHPLG|SHPRO/i.test(info.device.type) ? "plug" : "switch",
        };
      });
    },
    read: function (device) {
      return getJson(baseUrl(device) + "/status").then(function (status) {
        var light = status.lights && status.lights[0] ? status.lights[0] : null;
        var relay = status.relays && status.relays[0] ? status.relays[0] : null;
        var meter = status.meters && status.meters[0] ? status.meters[0] : null;
        return {
          switch: light ? !!light.ison : relay ? !!relay.ison : null,
          brightness: light && typeof light.brightness === "number" ? light.brightness : null,
          power: meter && typeof meter.power === "number" ? meter.power : null,
        };
      });
    },
    firmware: function (device) {
      return getJson(baseUrl(device) + "/ota").then(function (o) {
        return { current: o.old_version || null, latest: o.has_update ? o.new_version : (o.old_version || null), hasUpdate: !!o.has_update };
      });
    },
    write: function (device, capability, value) {
      var id = device.endpointId == null ? 0 : device.endpointId;
      if (capability === "brightness") return request({ url: baseUrl(device) + "/light/" + id + "?brightness=" + Math.round(value) });
      if (capability === "switch") {
        var path = device.kind === "light" ? "/light/" : "/relay/";
        return request({ url: baseUrl(device) + path + id + "?turn=" + (value ? "on" : "off") });
      }
      return unsupported("shelly", capability);
    },
  };

  // --- Shelly Gen2 / Plus / Pro (JSON-RPC over HTTP) -------------------------
  var shellyRpc = {
    id: "shelly-rpc",
    label: "Shelly Plus / Pro",
    caps: ["switch", "brightness"],
    probe: function (device) {
      return getJson(baseUrl(device) + "/rpc/Shelly.GetDeviceInfo").then(function (info) {
        if (!info || !info.id || !info.gen) throw new Error("shelly-rpc: kimlik yok");
        var app = String(info.app || info.model || "");
        return {
          protocol: "shelly-rpc",
          model: info.model || app,
          name: info.name || info.id,
          kind: /dimmer|rgbw|bulb|light/i.test(app) ? "light" : /plug/i.test(app) ? "plug" : "switch",
        };
      });
    },
    read: function (device) {
      var id = device.endpointId == null ? 0 : device.endpointId;
      var comp = device.kind === "light" ? "Light" : "Switch";
      return getJson(baseUrl(device) + "/rpc/" + comp + ".GetStatus?id=" + id).then(function (s) {
        return {
          switch: typeof s.output === "boolean" ? s.output : null,
          brightness: typeof s.brightness === "number" ? s.brightness : null,
          power: typeof s.apower === "number" ? s.apower : null,
        };
      });
    },
    firmware: function (device) {
      return Promise.all([
        getJson(baseUrl(device) + "/rpc/Shelly.GetDeviceInfo"),
        getJson(baseUrl(device) + "/rpc/Shelly.CheckForUpdate").catch(function () { return {}; }),
      ]).then(function (r) {
        var latest = r[1] && r[1].stable && r[1].stable.version;
        return { current: r[0].ver || r[0].fw_id || null, latest: latest || r[0].ver || null, hasUpdate: !!latest };
      });
    },
    write: function (device, capability, value) {
      var id = device.endpointId == null ? 0 : device.endpointId;
      var comp = device.kind === "light" ? "Light" : "Switch";
      if (capability === "switch") return getJson(baseUrl(device) + "/rpc/" + comp + ".Set?id=" + id + "&on=" + (value ? "true" : "false"));
      if (capability === "brightness" && comp === "Light") return getJson(baseUrl(device) + "/rpc/Light.Set?id=" + id + "&brightness=" + Math.round(value));
      return unsupported("shelly-rpc", capability);
    },
  };

  // --- Tasmota (HTTP komut arayüzü) -----------------------------------------
  var tasmota = {
    id: "tasmota",
    label: "Tasmota",
    caps: ["switch", "brightness", "color"],
    cmd: function (device, command) {
      return getJson(baseUrl(device) + "/cm?cmnd=" + encodeURIComponent(command));
    },
    probe: function (device) {
      return tasmota.cmd(device, "Status 0").then(function (s) {
        if (!s || !s.Status || !s.StatusFWR) throw new Error("tasmota: kimlik yok");
        var name = (s.Status.DeviceName || (s.Status.FriendlyName && s.Status.FriendlyName[0]) || "Tasmota").trim();
        var light = s.StatusSTS && typeof s.StatusSTS.Dimmer === "number";
        return { protocol: "tasmota", model: "Tasmota " + s.StatusFWR.Version, name: name, kind: light ? "light" : "switch" };
      });
    },
    read: function (device) {
      return tasmota.cmd(device, "Status 11").then(function (s) {
        var sts = s.StatusSTS || {};
        var p = sts.POWER || sts.POWER1;
        return { switch: p == null ? null : p === "ON", brightness: typeof sts.Dimmer === "number" ? sts.Dimmer : null };
      });
    },
    firmware: function (device) {
      return tasmota.cmd(device, "Status 2").then(function (s) {
        return { current: s.StatusFWR && s.StatusFWR.Version || null, latest: null, hasUpdate: null };
      });
    },
    write: function (device, capability, value) {
      if (capability === "switch") return tasmota.cmd(device, "Power " + (value ? "On" : "Off"));
      if (capability === "brightness") return tasmota.cmd(device, "Dimmer " + Math.round(value));
      if (capability === "color") return tasmota.cmd(device, "Color " + String(value).replace("#", ""));
      return unsupported("tasmota", capability);
    },
  };

  // --- WLED (JSON API) --------------------------------------------------------
  var wled = {
    id: "wled",
    label: "WLED",
    caps: ["switch", "brightness", "color"],
    probe: function (device) {
      return getJson(baseUrl(device) + "/json/info").then(function (info) {
        if (!info || !info.ver || !info.leds) throw new Error("wled: sürüm alanı yok");
        return { protocol: "wled", model: "WLED " + info.ver, name: info.name || device.name || "WLED", kind: "light" };
      });
    },
    read: function (device) {
      return getJson(baseUrl(device) + "/json/state").then(function (state) {
        var col = state.seg && state.seg[0] && state.seg[0].col && state.seg[0].col[0];
        return {
          switch: !!state.on,
          brightness: typeof state.bri === "number" ? Math.round((state.bri / 255) * 100) : null,
          color: col ? "#" + col.slice(0, 3).map(function (v) { return ("0" + Number(v).toString(16)).slice(-2); }).join("").toUpperCase() : null,
        };
      });
    },
    firmware: function (device) {
      return getJson(baseUrl(device) + "/json/info").then(function (i) { return { current: i.ver || null, latest: null, hasUpdate: null }; });
    },
    write: function (device, capability, value) {
      var body = capability === "switch" ? { on: !!value }
        : capability === "brightness" ? { on: Number(value) > 0, bri: Math.max(1, Math.round((Number(value) / 100) * 255)) }
        : capability === "color" ? { seg: [{ col: [hexToRgb(value)] }] }
        : null;
      if (!body) return unsupported("wled", capability);
      return sendJson(baseUrl(device) + "/json/state", "POST", body);
    },
  };

  // --- ESPHome (web_server bileşeni, REST) ----------------------------------
  // Uç noktalar: /<domain>/<id>  ve  POST /<domain>/<id>/turn_on|turn_off|toggle
  var esphome = {
    id: "esphome",
    label: "ESPHome",
    caps: ["switch", "brightness"],
    probe: function (device) {
      // web_server v1/v2 kök sayfası "ESPHome" içerir; bileşen kimliği kayıtta tutulur
      return request({ url: baseUrl(device) + "/" }).then(function (res) {
        if (res.status !== 200 || !/esphome/i.test(res.text)) throw new Error("esphome: imza yok");
        var title = (res.text.match(/<title>([^<]+)<\/title>/i) || [])[1] || "ESPHome";
        var light = /light-|\/light\//i.test(res.text);
        var idMatch = res.text.match(/(?:light|switch)[-/]([a-z0-9_]+)/i);
        return {
          protocol: "esphome", model: "ESPHome", name: title.trim(), kind: light ? "light" : "switch",
          entity: idMatch ? idMatch[1] : null,
        };
      });
    },
    path: function (device) {
      return "/" + (device.kind === "light" ? "light" : "switch") + "/" + (device.entity || (device.kind === "light" ? "light" : "relay"));
    },
    read: function (device) {
      return getJson(baseUrl(device) + esphome.path(device)).then(function (s) {
        return {
          switch: s.state == null ? null : String(s.state).toUpperCase() === "ON",
          brightness: typeof s.brightness === "number" ? Math.round((s.brightness / 255) * 100) : null,
        };
      });
    },
    write: function (device, capability, value) {
      var p = esphome.path(device);
      if (capability === "switch") return request({ url: baseUrl(device) + p + (value ? "/turn_on" : "/turn_off"), method: "POST" });
      if (capability === "brightness" && device.kind === "light") {
        return request({ url: baseUrl(device) + p + "/turn_on?brightness=" + Math.round((Number(value) / 100) * 255), method: "POST" });
      }
      return unsupported("esphome", capability);
    },
  };

  // --- Philips Hue (yerel köprü API v1) --------------------------------------
  // Köprü bir kez eşleştirilir (köprüdeki düğmeye basılır), sonra her lamba ayrı cihaz olur.
  var hue = {
    id: "hue",
    label: "Philips Hue",
    caps: ["switch", "brightness", "color"],
    probe: function (device) {
      return getJson(baseUrl(device) + "/api/config").then(function (c) {
        if (!c || !c.bridgeid) throw new Error("hue: köprü değil");
        return { protocol: "hue", model: c.modelid || "Hue Bridge", name: c.name || "Hue Köprüsü", kind: "bridge", bridgeid: c.bridgeid };
      });
    },
    // Köprü düğmesine basıldıktan sonra 30 sn içinde çağrılır; kullanıcı adını döner.
    pair: function (host) {
      var device = { host: host };
      return sendJson(baseUrl(device) + "/api", "POST", { devicetype: "nexus#app" }).then(function (r) {
        var item = Array.isArray(r) ? r[0] : r;
        if (item && item.success && item.success.username) return item.success.username;
        if (item && item.error && item.error.type === 101) {
          var e = new Error("Köprüdeki yuvarlak düğmeye bas, sonra tekrar dene."); e.code = "link-button"; throw e;
        }
        throw new Error("hue: eşleştirme başarısız");
      });
    },
    lights: function (host, user) {
      return getJson(baseUrl({ host: host }) + "/api/" + encodeURIComponent(user) + "/lights").then(function (all) {
        if (Array.isArray(all) && all[0] && all[0].error) throw new Error("hue: yetki yok");
        return Object.keys(all || {}).map(function (id) {
          var l = all[id] || {};
          var type = String(l.type || "");
          var caps = ["switch"];
          if (/dimmable|color|temperature/i.test(type)) caps.push("brightness");
          if (/color light/i.test(type)) caps.push("color");
          if (/temperature/i.test(type)) caps.push("colorTemp");
          return { id: id, name: l.name || ("Hue " + id), type: type, caps: caps, model: l.modelid || "Hue" };
        });
      });
    },
    url: function (device) {
      return baseUrl(device) + "/api/" + encodeURIComponent(device.hueUser || "") + "/lights/" + encodeURIComponent(device.endpointId);
    },
    firmware: function (device) {
      return getJson(hue.url(device)).then(function (l) {
        var sw = l.swupdate || {};
        return { current: l.swversion || null, latest: null, hasUpdate: sw.state ? sw.state !== "noupdates" : null };
      });
    },
    read: function (device) {
      return getJson(hue.url(device)).then(function (l) {
        if (Array.isArray(l) && l[0] && l[0].error) throw new Error("hue: yetki yok");
        var s = l.state || {};
        return { switch: typeof s.on === "boolean" ? s.on : null, brightness: typeof s.bri === "number" ? Math.round((s.bri / 254) * 100) : null, reachable: s.reachable !== false };
      });
    },
    write: function (device, capability, value) {
      var body = null;
      if (capability === "switch") body = { on: !!value };
      if (capability === "brightness") body = { on: Number(value) > 0, bri: Math.max(1, Math.round((Number(value) / 100) * 254)) };
      if (capability === "color") body = { on: true, xy: rgbToXy(hexToRgb(value)) };
      if (!body) return unsupported("hue", capability);
      return sendJson(hue.url(device) + "/state", "PUT", body).then(function (r) {
        if (Array.isArray(r) && r[0] && r[0].error) throw new Error("hue: " + r[0].error.description);
        return r;
      });
    },
  };

  function rgbToXy(rgb) {
    var c = rgb.map(function (v) { v = v / 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; });
    var X = c[0] * 0.664511 + c[1] * 0.154324 + c[2] * 0.162028;
    var Y = c[0] * 0.283881 + c[1] * 0.668433 + c[2] * 0.047685;
    var Z = c[0] * 0.000088 + c[1] * 0.07231 + c[2] * 0.986039;
    var sum = X + Y + Z;
    if (!sum) return [0.3227, 0.329];
    return [Math.round((X / sum) * 10000) / 10000, Math.round((Y / sum) * 10000) / 10000];
  }

  // --- Home Assistant (yerel REST API, ücretsiz) ------------------------------
  // Kullanıcının kendi Home Assistant sunucusu (ör. Raspberry Pi) üzerinden HA'nın
  // desteklediği binlerce cihaz (Tuya, Xiaomi, Sonoff, Zigbee, Z-Wave, Matter…) NEXUS'tan
  // kontrol edilir. Yetki: HA profilinde oluşturulan "uzun ömürlü erişim jetonu".
  var HA_DOMAINS = {
    light: { kind: "light", caps: ["switch"] },
    "switch": { kind: "switch", caps: ["switch"] },
    input_boolean: { kind: "switch", caps: ["switch"] },
    fan: { kind: "switch", caps: ["switch"] },
    cover: { kind: "cover", caps: ["cover"] },
    climate: { kind: "ac", caps: ["switch", "temperature"] },
    lock: { kind: "lock", caps: ["lock"] },
    vacuum: { kind: "vacuum", caps: ["vacuum"] },
    media_player: { kind: "media", caps: ["switch", "media"] },
  };
  function haBase(device) {
    var b = baseUrl(device);
    return /:\d+$/.test(b.replace(/^https?:\/\//, "")) ? b : b + ":8123";
  }
  function haCall(device, method, path, body, token) {
    return request({
      url: haBase(device) + path,
      method: method,
      body: body ? JSON.stringify(body) : undefined,
      headers: { Authorization: "Bearer " + (token || device.haToken || ""), "Content-Type": "application/json" },
      timeoutMs: 6000,
    }).then(function (res) {
      if (res.status === 401 || res.status === 403) { var e = new Error("Jeton geçersiz ya da süresi dolmuş."); e.code = "auth"; throw e; }
      if (res.status < 200 || res.status >= 300) throw new Error("homeassistant: http " + res.status);
      try { return JSON.parse(res.text); } catch (x) { return res.text; }
    });
  }
  function haEntityCaps(st) {
    var domain = String(st.entity_id || "").split(".")[0];
    var def = HA_DOMAINS[domain];
    if (!def) return null;
    var caps = def.caps.slice();
    var a = st.attributes || {};
    if (domain === "light") {
      var modes = a.supported_color_modes || [];
      if (modes.some(function (m) { return m !== "onoff"; }) || typeof a.brightness === "number") caps.push("brightness");
      if (modes.some(function (m) { return /^(hs|xy|rgb|rgbw|rgbww)$/.test(m); })) caps.push("color");
    }
    return { kind: def.kind, caps: caps };
  }
  var homeassistant = {
    id: "homeassistant",
    label: "Home Assistant",
    caps: ["switch", "brightness", "color", "cover", "position", "target", "lock", "vacuum"],
    probe: function (device) {
      var d = { host: haBase(device) };
      return getJson(d.host + "/manifest.json").then(function (m) {
        if (!m || !/home assistant/i.test(String(m.name || ""))) throw new Error("homeassistant: değil");
        return { protocol: "homeassistant", model: "Home Assistant", name: "Home Assistant", kind: "bridge", host: d.host };
      });
    },
    // Jetonu doğrular ve NEXUS'un kontrol edebildiği varlıkları (entity) listeler.
    entities: function (host, token) {
      var device = { host: host };
      return haCall(device, "GET", "/api/states", null, token).then(function (all) {
        if (!Array.isArray(all)) throw new Error("homeassistant: beklenmeyen yanıt");
        return all.map(function (st) {
          var info = haEntityCaps(st);
          if (!info) return null;
          return { entity: st.entity_id, name: (st.attributes && st.attributes.friendly_name) || st.entity_id, kind: info.kind, caps: info.caps, model: "Home Assistant · " + st.entity_id.split(".")[0] };
        }).filter(Boolean);
      });
    },
    read: function (device) {
      return haCall(device, "GET", "/api/states/" + encodeURIComponent(device.entity)).then(function (st) {
        var a = st.attributes || {}, s = String(st.state || "");
        var out = { reachable: s !== "unavailable" };
        var domain = String(device.entity || "").split(".")[0];
        if (domain === "cover") { out.position = typeof a.current_position === "number" ? a.current_position : (s === "open" ? 100 : s === "closed" ? 0 : null); out.switch = s === "open" || s === "opening"; }
        else if (domain === "lock") out.locked = s === "locked";
        else if (domain === "vacuum") out.mode = s === "cleaning" ? "cleaning" : "docked";
        else if (domain === "climate") { out.switch = s !== "off"; if (typeof a.temperature === "number") out.target = a.temperature; }
        else out.switch = s === "on" || s === "playing";
        if (typeof a.brightness === "number") out.brightness = Math.round((a.brightness / 255) * 100);
        return out;
      });
    },
    write: function (device, capability, value) {
      var id = device.entity, domain = String(id || "").split(".")[0];
      function svc(d, name, extra) {
        var body = { entity_id: id };
        Object.keys(extra || {}).forEach(function (k) { body[k] = extra[k]; });
        return haCall(device, "POST", "/api/services/" + d + "/" + name, body);
      }
      if (capability === "switch") {
        if (domain === "cover") return svc("cover", value ? "open_cover" : "close_cover");
        if (domain === "lock" || domain === "vacuum") return unsupported("homeassistant", capability);
        return svc(domain === "input_boolean" ? "input_boolean" : domain, value ? "turn_on" : "turn_off");
      }
      if (capability === "brightness") return Number(value) > 0 ? svc("light", "turn_on", { brightness_pct: Math.round(Number(value)) }) : svc("light", "turn_off");
      if (capability === "color") return svc("light", "turn_on", { rgb_color: hexToRgb(value) });
      if (capability === "position" && domain === "cover") {
        var pos = Math.round(Number(value));
        if (pos >= 100) return svc("cover", "open_cover");
        if (pos <= 0) return svc("cover", "close_cover");
        return svc("cover", "set_cover_position", { position: pos });
      }
      if (capability === "target" && domain === "climate") return svc("climate", "set_temperature", { temperature: Number(value) });
      if (capability === "lock" && domain === "lock") return svc("lock", value ? "lock" : "unlock");
      if (capability === "vacuum" && domain === "vacuum") return svc("vacuum", value === "cleaning" ? "start" : "return_to_base");
      return unsupported("homeassistant", capability);
    },
  };

  // --- TP-Link Kasa (TCP 9999, XOR) — yalnızca masaüstü uygulamasında ----------
  // Kasa protokolü UTF-8 baytları üzerinde XOR "otomatik anahtar" şifrelemesi kullanır
  function utf8Bytes(str) {
    if (typeof TextEncoder !== "undefined") return Array.from(new TextEncoder().encode(str));
    return unescape(encodeURIComponent(str)).split("").map(function (c) { return c.charCodeAt(0); });
  }
  function utf8String(bytes) {
    if (typeof TextDecoder !== "undefined") return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
    return decodeURIComponent(escape(String.fromCharCode.apply(null, bytes)));
  }
  function kasaEncrypt(str) {
    var key = 171, out = [], bytes = utf8Bytes(str);
    for (var i = 0; i < bytes.length; i++) { var c = bytes[i] ^ key; key = c; out.push(c); }
    return out;
  }
  function kasaDecrypt(bytes) {
    var key = 171, out = [];
    for (var i = 0; i < bytes.length; i++) { out.push(bytes[i] ^ key); key = bytes[i]; }
    return utf8String(out);
  }
  var kasa = {
    id: "kasa",
    label: "TP-Link Kasa",
    caps: ["switch", "brightness"],
    needsTcp: true,
    send: function (device, obj) {
      var tcp = tcpBridge();
      if (!tcp) return Promise.reject(new Error("kasa: TCP yalnızca masaüstü uygulamasında"));
      var payload = kasaEncrypt(JSON.stringify(obj));
      var framed = [(payload.length >>> 24) & 255, (payload.length >>> 16) & 255, (payload.length >>> 8) & 255, payload.length & 255].concat(payload);
      return tcp({ host: hostOnly(device), port: 9999, bytes: framed, timeoutMs: scanTimeoutMs || DEFAULT_TIMEOUT_MS, lengthPrefixed: true }).then(function (resp) {
        return JSON.parse(kasaDecrypt(resp.slice(4)));
      });
    },
    firmware: function (device) {
      return kasa.send(device, { system: { get_sysinfo: {} } }).then(function (r) {
        return { current: r.system.get_sysinfo.sw_ver || null, latest: null, hasUpdate: null };
      });
    },
    probe: function (device) {
      return kasa.send(device, { system: { get_sysinfo: {} } }).then(function (r) {
        var s = r && r.system && r.system.get_sysinfo;
        if (!s) throw new Error("kasa: yanıt yok");
        return { protocol: "kasa", model: s.model, name: s.alias || s.model, kind: s.brightness != null || /bulb|light/i.test(s.mic_type || s.type || "") ? "light" : "plug" };
      });
    },
    read: function (device) {
      return kasa.send(device, { system: { get_sysinfo: {} } }).then(function (r) {
        var s = r.system.get_sysinfo;
        var ls = s.light_state || {};
        return { switch: s.relay_state != null ? s.relay_state === 1 : ls.on_off === 1, brightness: s.brightness != null ? s.brightness : (ls.brightness != null ? ls.brightness : null) };
      });
    },
    write: function (device, capability, value) {
      if (capability === "switch") {
        if (device.kind === "light") return kasa.send(device, { "smartlife.iot.smartbulb.lightingservice": { transition_light_state: { on_off: value ? 1 : 0 } } });
        return kasa.send(device, { system: { set_relay_state: { state: value ? 1 : 0 } } });
      }
      if (capability === "brightness") {
        if (device.kind === "light") return kasa.send(device, { "smartlife.iot.smartbulb.lightingservice": { transition_light_state: { on_off: 1, brightness: Math.round(value) } } });
        return kasa.send(device, { "smartlife.iot.dimmer": { set_brightness: { brightness: Math.round(value) } } });
      }
      return unsupported("kasa", capability);
    },
  };

  // --- Yeelight (TCP 55443, JSON satırları; "LAN Control" açık olmalı) — masaüstü ---
  var yeelight = {
    id: "yeelight",
    label: "Yeelight",
    caps: ["switch", "brightness", "color"],
    needsTcp: true,
    send: function (device, method, params) {
      var tcp = tcpBridge();
      if (!tcp) return Promise.reject(new Error("yeelight: TCP yalnızca masaüstü uygulamasında"));
      var line = JSON.stringify({ id: 1, method: method, params: params }) + "\r\n";
      return tcp({ host: hostOnly(device), port: 55443, text: line, timeoutMs: scanTimeoutMs || DEFAULT_TIMEOUT_MS, untilNewline: true }).then(function (resp) {
        var first = String(resp).split(/\r?\n/).filter(Boolean)[0] || "{}";
        var r = JSON.parse(first);
        if (r.error) throw new Error("yeelight: " + r.error.message);
        return r.result;
      });
    },
    probe: function (device) {
      return yeelight.send(device, "get_prop", ["power", "bright", "name", "model"]).then(function (r) {
        if (!Array.isArray(r)) throw new Error("yeelight: yanıt yok");
        return { protocol: "yeelight", model: "Yeelight " + (r[3] || ""), name: r[2] || "Yeelight", kind: "light" };
      });
    },
    read: function (device) {
      return yeelight.send(device, "get_prop", ["power", "bright"]).then(function (r) {
        return { switch: r[0] === "on", brightness: Number(r[1]) || null };
      });
    },
    write: function (device, capability, value) {
      if (capability === "switch") return yeelight.send(device, "set_power", [value ? "on" : "off", "smooth", 300]);
      if (capability === "brightness") return yeelight.send(device, "set_bright", [Math.max(1, Math.round(value)), "smooth", 300]);
      if (capability === "color") return yeelight.send(device, "set_rgb", [parseInt(String(value).replace("#", ""), 16), "smooth", 300]);
      return unsupported("yeelight", capability);
    },
  };

  var protocols = [shelly, shellyRpc, tasmota, wled, esphome, hue, homeassistant, kasa, yeelight];

  function available(p) { return !p.needsTcp || !!tcpBridge(); }

  // Manuel IP ile ekleme: cihazın hangi protokolü konuştuğunu sırayla dener.
  function identify(host) {
    var device = { host: host };
    var lastError = null;
    return protocols.filter(available).reduce(function (chain, protocol) {
      return chain.then(function (found) {
        if (found) return found;
        return protocol.probe(device).then(function (info) {
          var out = { host: host };
          Object.keys(info).forEach(function (k) { out[k] = info[k]; });
          return out;
        }).catch(function (error) { lastError = error; return null; });
      });
    }, Promise.resolve(null)).then(function (found) {
      if (found) return found;
      throw lastError || new Error("bilinen protokol bulunamadı");
    });
  }

  function protocolFor(name) {
    for (var i = 0; i < protocols.length; i++) if (protocols[i].id === name) return protocols[i];
    return null;
  }

  // Bu cihaz bu işlevi gerçekten (yerel ağdan) yazabiliyor mu?
  function supports(device, capability) {
    if (!device || !device.host || !device.protocol) return false;
    var p = protocolFor(device.protocol);
    return !!p && available(p) && p.caps.indexOf(capability) !== -1;
  }

  function normalizeSubnetBase(input) {
    var value = String(input || "").trim().replace(/\.+$/, "");
    if (!/^\d{1,3}(\.\d{1,3}){2,3}$/.test(value)) return null;
    var parts = value.split(".");
    if (parts.length === 4) parts.pop();
    if (parts.length !== 3) return null;
    var ok = parts.every(function (p) { return Number(p) >= 0 && Number(p) <= 255; });
    return ok ? parts.join(".") : null;
  }

  // Masaüstü uygulaması bilgisayarın alt ağını bilir; telefonda kullanıcı girer.
  function guessSubnet() {
    var d = desktopBridge();
    if (d && typeof d.subnets === "function") {
      return Promise.resolve(d.subnets()).then(function (list) { return (list && list[0]) || null; });
    }
    return Promise.resolve(null);
  }

  // Tarama için hızlı tanıma: tüm protokoller aynı anda yoklanır, sıradaki ilk başarılı olan seçilir.
  function identifyFast(host) {
    var device = { host: host };
    return Promise.all(protocols.filter(available).map(function (protocol) {
      return protocol.probe(device).then(function (info) {
        var out = { host: host };
        Object.keys(info).forEach(function (k) { out[k] = info[k]; });
        return out;
      }).catch(function () { return null; });
    })).then(function (all) {
      for (var i = 0; i < all.length; i++) if (all[i]) return all[i];
      throw new Error("bilinen protokol bulunamadı");
    });
  }

  // mDNS native eklentisi olmadan "kendiliğinden bulma" için alt ağ taraması (1-254).
  // options: onFound(info,count), onProgress(host), shouldStop() → true olursa tarama durur, concurrency.
  function scanSubnet(base, options) {
    var opts = options || {};
    var prefix = normalizeSubnetBase(base);
    if (!prefix) return Promise.reject(new Error("geçersiz alt ağ"));
    var concurrency = opts.concurrency || 16;
    var found = [];
    var nextHost = 1;
    var active = 0;
    scanTimeoutMs = opts.timeoutMs || 900;
    return new Promise(function (resolvePromise) {
      var settled = false;
      function finishIfDone() {
        if (settled) return;
        if (nextHost > 254 && active === 0) { settled = true; scanTimeoutMs = 0; resolvePromise(found); }
      }
      function pump() {
        while (active < concurrency && nextHost <= 254) {
          if (opts.shouldStop && opts.shouldStop()) { nextHost = 255; break; }
          (function (host) {
            active += 1;
            identifyFast(host)
              .then(function (info) { found.push(info); if (opts.onFound) opts.onFound(info, found.length); })
              .catch(function () { /* cevap vermeyen adres normal */ })
              .then(function () { active -= 1; if (opts.onProgress) opts.onProgress(host); finishIfDone(); pump(); });
          })(prefix + "." + nextHost);
          nextHost += 1;
        }
      }
      pump();
      finishIfDone();
    });
  }

  // Tarayıcının kendi yerel IP'sinden alt ağı tahmin eder (WebRTC); bilinmiyorsa null.
  function rtcPrefix() {
    return new Promise(function (resolve) {
      try {
        if (typeof RTCPeerConnection === "undefined") return resolve(null);
        var pc = new RTCPeerConnection({ iceServers: [] });
        var done = false;
        var finish = function (v) { if (done) return; done = true; try { pc.close(); } catch (e) {} resolve(v); };
        pc.createDataChannel("nx");
        pc.onicecandidate = function (e) {
          if (!e || !e.candidate) return finish(null);
          var m = /(\b(?:192\.168|10\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3})\.\d{1,3}\b/.exec(e.candidate.candidate);
          if (m) finish(normalizeSubnetBase(m[1] + ".0"));
        };
        pc.createOffer().then(function (o) { return pc.setLocalDescription(o); }).catch(function () { finish(null); });
        setTimeout(function () { finish(null); }, 1500);
      } catch (e) { resolve(null); }
    });
  }

  var COMMON_PREFIXES = ["192.168.1", "192.168.0", "192.168.2", "192.168.10", "192.168.100", "192.168.178", "10.0.0", "10.0.1", "10.1.1", "172.16.0"];

  // Kullanıcıdan hiçbir şey istemeden ağı tarar: önce cihazın kendi alt ağı (masaüstü / WebRTC),
  // sonra yaygın modem aralıkları. İlk cihaz bulunan alt ağda durur.
  // options: onPrefix(prefix,index,total), onFound, shouldStop, prefixes (ek öncelikli ön ekler)
  function autoScan(options) {
    var opts = options || {};
    return Promise.all([guessSubnet().catch(function () { return null; }), rtcPrefix()]).then(function (known) {
      var list = [];
      function add(p) { p = p && normalizeSubnetBase(p); if (p && list.indexOf(p) === -1) list.push(p); }
      (opts.prefixes || []).forEach(add);
      known.forEach(add);
      COMMON_PREFIXES.forEach(add);
      var all = [];
      var i = 0;
      function next() {
        if (i >= list.length || (opts.shouldStop && opts.shouldStop())) return Promise.resolve(all);
        var prefix = list[i++];
        if (opts.onPrefix) opts.onPrefix(prefix, i, list.length);
        return scanSubnet(prefix, { onFound: function (info, n) { all.push(info); if (opts.onFound) opts.onFound(info, all.length); }, shouldStop: opts.shouldStop, onProgress: opts.onProgress })
          .then(function () { return all.length ? all : next(); });
      }
      return next();
    });
  }

  window.nexusLan = {
    setTransport: setTransport,
    request: request,
    usingNativeTransport: function () { return !!transport || !!desktopBridge() || !!nativeHttpPlugin(); },
    hasTcp: function () { return !!tcpBridge(); },
    protocols: protocols,
    protocolFor: protocolFor,
    supports: supports,
    identify: identify,
    scanSubnet: scanSubnet,
    autoScan: autoScan,
    guessSubnet: guessSubnet,
    normalizeSubnetBase: normalizeSubnetBase,
    hue: { pair: hue.pair, lights: hue.lights },
    homeassistant: { entities: homeassistant.entities },
    read: function (device) {
      var p = protocolFor(device.protocol);
      return p && available(p) ? p.read(device) : Promise.reject(new Error("bu ortamda desteklenmeyen protokol"));
    },
    // Yazılım sürümü: { current, latest, hasUpdate } — bilinmeyen alanlar null
    firmware: function (device) {
      var p = protocolFor(device.protocol);
      if (!p || !available(p)) return Promise.reject(new Error("bu ortamda desteklenmeyen protokol"));
      if (typeof p.firmware !== "function") return Promise.reject(new Error("bu cihaz sürüm bilgisi vermiyor"));
      return p.firmware(device);
    },
    write: function (device, capability, value) {
      var p = protocolFor(device.protocol);
      return p && available(p) ? p.write(device, capability, value) : Promise.reject(new Error("bu ortamda desteklenmeyen protokol"));
    },
  };
})();
