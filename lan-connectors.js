// NEXUS — yerel ağ (LAN) connector katmanı.
//
// Mobil uygulama stitch HTML sayfalarıyla WebView'de çalıştığı için buradaki tüm
// istekler tek bir transport arayüzü üzerinden geçer:
//   - Tarayıcıda geliştirmede: fetch (bu dosyanın varsayılanı)
//   - Telefonda: native HTTP adaptörü takılır (bkz. spec §"Taşıma katmanı kısıtı").
//     androidScheme "https" + allowMixedContent false iken WebView'dan http://192.168.x.x
//     isteği mixed-content sayılıp engellenir; native adaptör olmadan connector'lar
//     telefonda sessizce çalışmaz.
//
// TCP isteyen protokoller (Yeelight 55443, Kasa/Tapo yerel API, Tuya localKey) bu
// dosyada DEĞİLDİR: native TCP köprüsü olmadan yazılırsa çalışmaz ve sahte sonuç
// üretmek proje kuralına (gerçek olmayanı "başarılı" gösterme) aykırıdır.

(function () {
  "use strict";

  var DEFAULT_TIMEOUT_MS = 2500;
  var transport = null; // native adaptör buradan takılır

  function setTransport(fn) {
    transport = typeof fn === "function" ? fn : null;
  }

  function request(opts) {
    if (transport) return transport(opts);
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = controller
      ? setTimeout(function () { controller.abort(); }, opts.timeoutMs || DEFAULT_TIMEOUT_MS)
      : null;
    return fetch(opts.url, {
      method: opts.method || "GET",
      body: opts.body,
      headers: opts.body ? { "Content-Type": "application/json" } : undefined,
      signal: controller ? controller.signal : undefined,
      cache: "no-store",
    }).then(function (res) {
      return res.text().then(function (text) {
        return { status: res.status, text: text };
      });
    }).finally(function () {
      if (timer) clearTimeout(timer);
    });
  }

  function getJson(url) {
    return request({ url: url }).then(function (res) {
      if (res.status < 200 || res.status >= 300) throw new Error("http " + res.status);
      return JSON.parse(res.text);
    });
  }

  function baseUrl(device) {
    var host = /^https?:\/\//.test(device.host || "")
      ? device.host
      : "http://" + (device.host || device.ip);
    return host.replace(/\/+$/, "");
  }

  function pick(output, kind) {
    return output == null ? null : (kind === "brightness" ? output.brightness : output.turn === "on");
  }

  // --- Shelly (Gen1 REST API) ------------------------------------------------
  var shelly = {
    id: "shelly",
    label: "Shelly",
    probe: function (device) {
      return getJson(baseUrl(device) + "/settings").then(function (info) {
        if (!info || !info.device || !info.device.type) throw new Error("shelly: kimlik yok");
        return {
          protocol: "shelly",
          model: info.device.type,
          name: info.device.hostname || device.name,
          kind: /SHCB|SHBLB|LTAH|SHSW-25|dimmer/i.test(info.device.type) ? "light" :
            /SHPLG|SHPRO/i.test(info.device.type) ? "plug" : "switch",
        };
      });
    },
    read: function (device) {
      return getJson(baseUrl(device) + "/status").then(function (status) {
        var out = (status.power && status.power[0]) || status.relays && status.relays[0] || null;
        var light = status.light && status.light[0] ? status.light[0] : null;
        return {
          switch: light ? light.turn === "on" : pick(out, "switch"),
          brightness: light ? light.brightness : null,
        };
      });
    },
    write: function (device, capability, value) {
      var id = device.endpointId == null ? 0 : device.endpointId;
      if (capability === "brightness") {
        return request({ url: baseUrl(device) + "/light/" + id + "?brightness=" + Math.round(value) });
      }
      if (capability === "switch") {
        var path = device.kind === "light" ? "/light/" : "/relay/";
        return request({ url: baseUrl(device) + path + id + "?turn=" + (value ? "on" : "off") });
      }
      throw new Error("shelly: desteklenmeyen işlev " + capability);
    },
  };

  // --- WLED (açık JSON API) -------------------------------------------------
  var wled = {
    id: "wled",
    label: "WLED",
    probe: function (device) {
      return getJson(baseUrl(device) + "/json/info").then(function (info) {
        if (!info || !info.ver) throw new Error("wled: sürüm alanı yok");
        return { protocol: "wled", model: "WLED " + info.ver, name: info.name || device.name, kind: "light" };
      });
    },
    read: function (device) {
      return getJson(baseUrl(device) + "/json/state").then(function (state) {
        return {
          switch: !!state.on,
          brightness: typeof state.bri === "number" ? Math.round((state.bri / 255) * 100) : null,
          color: state.ps && state.ps[0] && state.ps[0].col ? state.ps[0].col[0] : null,
        };
      });
    },
    write: function (device, capability, value) {
      var body = capability === "switch"
        ? { on: !!value }
        : capability === "brightness"
          ? { bri: Math.round((Number(value) / 100) * 255) }
          : null;
      if (!body) throw new Error("wled: desteklenmeyen işlev " + capability);
      return request({
        url: baseUrl(device) + "/json/state",
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  };

  // --- ESPHome (opsiyonel web sunucusu) -------------------------------------
  var esphome = {
    id: "esphome",
    label: "ESPHome",
    probe: function (device) {
      return getJson(baseUrl(device) + "/edit?json=1").then(function (conf) {
        if (!conf || (!conf.switch && !conf.light)) throw new Error("esphome: yapılandırma yok");
        var kinds = Object.keys(conf).filter(function (k) { return conf[k] && conf[k].length; });
        return {
          protocol: "esphome",
          model: "ESPHome",
          name: device.name,
          kind: conf.light ? "light" : "switch",
          endpoints: kinds,
        };
      });
    },
    read: function (device) {
      return getJson(baseUrl(device) + "/edit?json=1").then(function (conf) {
        var first = (conf.light && conf.light[0]) || (conf.switch && conf.switch[0]) || null;
        if (!first) return { switch: null };
        return { switch: first.state === "ON" || first.state === "true", brightness: first.brightness || null };
      });
    },
    write: function (device, capability, value) {
      var base = device.kind === "light" ? "/light/0" : "/switch/0";
      if (capability === "switch") {
        return request({ url: baseUrl(device) + base + (value ? "/on" : "/off") });
      }
      if (capability === "brightness") {
        return request({ url: baseUrl(device) + base + "?brightness=" + Math.round(value) });
      }
      throw new Error("esphome: desteklenmeyen işlev " + capability);
    },
  };

  var protocols = [shelly, wled, esphome];

  // Manuel IP ile ekleme yolu: cihazın hangi protokolü konuştuğunu sırayla dener.
  function identify(host) {
    var device = { host: host };
    var lastError = null;
    return protocols.reduce(function (chain, protocol) {
      return chain.then(function (found) {
        if (found) return found;
        return protocol.probe(device).then(function (info) {
          return { host: host, protocol: info.protocol, model: info.model, name: info.name, kind: info.kind };
        }).catch(function (error) {
          lastError = error;
          return null;
        });
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

  window.nexusLan = {
    setTransport: setTransport,
    request: request,
    protocols: protocols,
    protocolFor: protocolFor,
    identify: identify,
    read: function (device) {
      var p = protocolFor(device.protocol);
      return p ? p.read(device) : Promise.reject(new Error("bilinmeyen protokol"));
    },
    write: function (device, capability, value) {
      var p = protocolFor(device.protocol);
      return p ? p.write(device, capability, value) : Promise.reject(new Error("bilinmeyen protokol"));
    },
  };
})();
