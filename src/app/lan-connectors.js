// NEXUS — yerel ağ (LAN) connector katmanı. Bulut yok, ücret yok: komutlar telefondan /
// bilgisayardan doğrudan cihaza gider.
//
// Taşıma (transport) sırası:
//   1. Masaüstü uygulaması (Electron): preload'un verdiği window.nexusDesktop.http — CORS yok.
//   2. Telefon (Capacitor 6+): çekirdekteki CapacitorHttp — WebView'ın mixed-content / CORS
//      kısıtına takılmaz. (Android'de yerel http için network_security_config gerekir.)
//   3. Tarayıcı: fetch (yalnızca CORS izni veren cihazlarda çalışır; geliştirme içindir).
//
// UDP isteyen protokoller (WiZ, LIFX, Govee) ve TCP isteyenler (Kasa, Yeelight) yalnızca köprüsü olan ortamda (masaüstü
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
    return window.nexusDesktop && typeof window.nexusDesktop.http === "function"
      ? window.nexusDesktop
      : null;
  }

  function nativeHttpPlugin() {
    var capi = window.Capacitor;
    if (!capi || typeof capi.isNativePlatform !== "function" || !capi.isNativePlatform())
      return null;
    var plugins = capi.Plugins || {};
    var plugin = plugins.CapacitorHttp || plugins.Http;
    return plugin && typeof plugin.request === "function" ? plugin : null;
  }

  function tcpBridge() {
    var d = desktopBridge();
    return d && typeof d.tcp === "function" ? d.tcp : null;
  }

  function request(opts) {
    if (window.nexusPreview) return Promise.reject(new Error("önizleme"));
    var blocked = lanAddressError(opts.url);
    if (blocked) return Promise.reject(blocked);
    if (transport) return transport(opts);
    var timeout = opts.timeoutMs || scanTimeoutMs || DEFAULT_TIMEOUT_MS;
    var headers = opts.headers || (opts.body ? { "Content-Type": "application/json" } : {});
    var desk = desktopBridge();
    if (desk) {
      return desk.http({
        url: opts.url,
        method: opts.method || "GET",
        headers: headers,
        body: opts.body,
        timeoutMs: timeout,
      });
    }
    var plugin = nativeHttpPlugin();
    if (plugin) {
      var data = opts.body;
      if (typeof data === "string" && /json/i.test(headers["Content-Type"] || "")) {
        try {
          data = JSON.parse(data);
        } catch (e) {
          /* düz metin olarak gönder */
        }
      }
      return plugin
        .request({
          method: opts.method || "GET",
          url: opts.url,
          headers: headers,
          data: data,
          connectTimeout: timeout,
          readTimeout: timeout,
          responseType: "text",
        })
        .then(function (res) {
          var text = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
          return { status: res.status, text: text };
        });
    }
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = controller
      ? setTimeout(function () {
          controller.abort();
        }, timeout)
      : null;
    return fetch(opts.url, {
      method: opts.method || "GET",
      body: opts.body,
      headers: opts.body || opts.headers ? headers : undefined,
      signal: controller ? controller.signal : undefined,
      cache: "no-store",
    })
      .then(function (res) {
        return res.text().then(function (text) {
          return { status: res.status, text: text };
        });
      })
      .finally(function () {
        if (timer) clearTimeout(timer);
      });
  }

  function getJson(url, timeoutMs) {
    return request({ url: url, timeoutMs: timeoutMs }).then(function (res) {
      if (res.status < 200 || res.status >= 300) throw new Error("http " + res.status);
      return JSON.parse(res.text);
    });
  }

  function sendJson(url, method, body) {
    return request({
      url: url,
      method: method,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }).then(function (res) {
      if (res.status < 200 || res.status >= 300) throw new Error("http " + res.status);
      try {
        return JSON.parse(res.text);
      } catch (e) {
        return res.text;
      }
    });
  }

  function baseUrl(device) {
    var host = /^https?:\/\//.test(device.host || "")
      ? device.host
      : "http://" + (device.host || device.ip);
    return host.replace(/\/+$/, "");
  }

  function hostOnly(device) {
    return baseUrl(device)
      .replace(/^https?:\/\//, "")
      .split(":")[0];
  }

  // Yerel ağ allowlist'i: komutlar yalnızca kullanıcının kendi ağına gider. Genel bir
  // adrese (ör. içe aktarılmış bozuk bir kayda) istek atılmaz; masaüstündeki LAN proxy
  // aynı kuralı sunucu tarafında da uygular (main.cjs isPrivateHost).
  function isPrivateHost(host) {
    host = String(host || "")
      .replace(/^\[|\]$/g, "")
      .toLowerCase();
    if (!host) return false;
    if (host === "localhost" || host === "::1") return true;
    if (/\.(local|lan|home|internal|home\.arpa)$/.test(host)) return true; // mDNS / yerel çözümleyici adları
    var v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (v4) {
      var a = +v4[1],
        b = +v4[2];
      return (
        a === 10 ||
        a === 127 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 169 && b === 254)
      );
    }
    if (/^[0-9a-f:]+$/.test(host) && host.indexOf(":") !== -1)
      return /^f[cd]/.test(host) || /^fe[89ab]/.test(host);
    return false;
  }

  // URL/adres yerel ağa gitmiyorsa açıklayıcı bir hata döner, yoksa null.
  function lanAddressError(urlOrHost) {
    var host = urlOrHost;
    if (/^[a-z]+:\/\//i.test(urlOrHost)) {
      try {
        host = new URL(urlOrHost).hostname;
      } catch (e) {
        return new Error("geçersiz adres");
      }
    } else {
      host = String(urlOrHost)
        .replace(/^https?:\/\//i, "")
        .split("/")[0]
        .split(":")[0];
    }
    if (isPrivateHost(host)) return null;
    var err = new Error(
      "Yalnızca yerel ağ adreslerine komut gönderilir (" + host + " yerel değil).",
    );
    err.code = "not-lan";
    return err;
  }

  function hexToRgb(hex) {
    var n = parseInt(String(hex || "#ffffff").replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function unsupported(id, capability) {
    return Promise.reject(new Error(id + ": desteklenmeyen işlev " + capability));
  }

  // --- Shelly Gen1 (REST) ---------------------------------------------------
  // Gen1 sensör modelleri (Shelly belgesindeki kodlar): H&T, Motion, Door/Window, Flood, Smoke
  function shellySensorKind(type) {
    var t = String(type || "");
    if (/^SHHT/i.test(t)) return { kind: "climatesensor", caps: ["temperature", "humidity"] };
    if (/^SH(MOS|BMO)/i.test(t)) return { kind: "motion", caps: ["motion"] };
    if (/^SHDW/i.test(t)) return { kind: "contact", caps: ["contact"] };
    if (/^SH(WT|SM)/i.test(t)) return { kind: "alarm", caps: ["alarm"] };
    return null;
  }
  // /status: tmp{value,units,is_valid}, hum{value}, bat{value}, sensor{state|motion}, flood, smoke
  function shellySensorRead(device, status) {
    var out = {};
    var num = function (o) {
      return o && typeof o.value === "number" && o.is_valid !== false ? o.value : null;
    };
    if (device.kind === "climatesensor") {
      var t = num(status.tmp);
      if (t != null && status.tmp && status.tmp.units === "F")
        t = Math.round((((t - 32) * 5) / 9) * 10) / 10;
      out.temperature = t;
      out.humidity = num(status.hum);
    } else if (device.kind === "motion") {
      var s = status.sensor || {};
      out.active = typeof s.motion === "boolean" && s.is_valid !== false ? s.motion : null;
    } else if (device.kind === "contact") {
      var d = status.sensor || {};
      out.active = d.state === "open" ? true : d.state === "close" ? false : null;
    } else if (device.kind === "alarm") {
      var flag =
        typeof status.flood === "boolean"
          ? status.flood
          : typeof status.smoke === "boolean"
            ? status.smoke
            : null;
      out.active = flag;
    }
    var bat = num(status.bat);
    if (bat != null) out.battery = bat;
    return out;
  }

  var shelly = {
    id: "shelly",
    label: "Shelly",
    caps: ["switch", "brightness", "color", "colorTemp", "position", "coverStop", "powerOn"],
    probe: function (device) {
      return getJson(baseUrl(device) + "/settings").then(function (info) {
        if (!info || !info.device || !info.device.type) throw new Error("shelly: kimlik yok");
        // Gen1 pil sensörleri (H&T, Motion, Door/Window, Flood, Smoke): salt okunur. Uyku modundaki cihaz yalnızca
        // uyanık olduğu kısa sürede HTTP'ye yanıt verir; yanıt vermezse arayüz "Ulaşılamıyor" der, değer uydurulmaz.
        var sensor = shellySensorKind(info.device.type);
        return {
          protocol: "shelly",
          model: info.device.type,
          name: info.name || info.device.hostname || device.name,
          kind: sensor
            ? sensor.kind
            : info.mode === "roller"
              ? "cover"
              : /SHCB|SHBLB|SHRGBW|SHDM|LTAH|dimmer|bulb/i.test(info.device.type)
                ? "light"
                : /SHPLG|SHPRO/i.test(info.device.type)
                  ? "plug"
                  : "switch",
          caps: sensor
            ? sensor.caps
            : info.mode === "roller"
              ? ["cover", "position"]
              : /SHRGBW|SHBLB/i.test(info.device.type)
                ? ["switch", "brightness", "color", "colorTemp"]
                : null,
        };
      });
    },
    read: function (device) {
      return getJson(baseUrl(device) + "/status").then(function (status) {
        var light = status.lights && status.lights[0] ? status.lights[0] : null;
        var relay = status.relays && status.relays[0] ? status.relays[0] : null;
        var meter = status.meters && status.meters[0] ? status.meters[0] : null;
        var roller = status.rollers && status.rollers[0] ? status.rollers[0] : null;
        if (/^(climatesensor|motion|contact|alarm)$/.test(device.kind || "") && !light && !relay) {
          return shellySensorRead(device, status);
        }
        if (roller && device.kind === "cover") {
          var rp = typeof roller.current_pos === "number" ? roller.current_pos : null;
          return {
            position: rp,
            switch: rp == null ? null : rp > 0,
            power: meter && typeof meter.power === "number" ? meter.power : null,
          };
        }
        return {
          switch: light ? !!light.ison : relay ? !!relay.ison : null,
          brightness: light && typeof light.brightness === "number" ? light.brightness : null,
          power: meter && typeof meter.power === "number" ? meter.power : null,
        };
      });
    },
    firmware: function (device) {
      return getJson(baseUrl(device) + "/ota").then(function (o) {
        return {
          current: o.old_version || null,
          latest: o.has_update ? o.new_version : o.old_version || null,
          hasUpdate: !!o.has_update,
        };
      });
    },
    write: function (device, capability, value) {
      var id = device.endpointId == null ? 0 : device.endpointId;
      // Shelly Gen1: /settings/relay/<id>?default_state=off|on|last (elektrik gelince başlangıç durumu)
      if (capability === "powerOn")
        return request({
          url:
            baseUrl(device) +
            "/settings/relay/" +
            id +
            "?default_state=" +
            (value === "on" ? "on" : value === "off" ? "off" : "last"),
        });
      if (capability === "brightness")
        return request({
          url: baseUrl(device) + "/light/" + id + "?brightness=" + Math.round(value),
        });
      if (capability === "coverStop")
        return request({ url: baseUrl(device) + "/roller/" + id + "?go=stop" });
      // Shelly Gen1 REST: roller → go=open|close|to_pos&roller_pos; RGBW/Bulb → red/green/blue ve temp (Kelvin)
      if (capability === "position") {
        var pos = Math.max(0, Math.min(100, Math.round(Number(value))));
        return request({
          url:
            baseUrl(device) +
            "/roller/" +
            id +
            (pos >= 100 ? "?go=open" : pos <= 0 ? "?go=close" : "?go=to_pos&roller_pos=" + pos),
        });
      }
      if (capability === "color") {
        var c = hexToRgb(value);
        return request({
          url:
            baseUrl(device) +
            "/light/" +
            id +
            "?turn=on&mode=color&red=" +
            c[0] +
            "&green=" +
            c[1] +
            "&blue=" +
            c[2],
        });
      }
      if (capability === "colorTemp")
        return request({
          url: baseUrl(device) + "/light/" + id + "?turn=on&mode=white&temp=" + toneKelvin(value),
        });
      if (capability === "switch") {
        if (device.kind === "cover")
          return request({
            url: baseUrl(device) + "/roller/" + id + "?go=" + (value ? "open" : "close"),
          });
        var path = device.kind === "light" ? "/light/" : "/relay/";
        return request({ url: baseUrl(device) + path + id + "?turn=" + (value ? "on" : "off") });
      }
      return unsupported("shelly", capability);
    },
  };

  // --- Shelly Gen2 / Plus / Pro (JSON-RPC over HTTP) -------------------------
  function rpcComp(device) {
    if (device.kind === "cover") return "Cover";
    if (device.kind === "light") return (device.options && device.options.rgbComp) || "Light";
    return "Switch";
  }
  var shellyRpc = {
    id: "shelly-rpc",
    label: "Shelly Plus / Pro",
    caps: ["switch", "brightness", "color", "position", "coverStop", "powerOn"],
    probe: function (device) {
      return getJson(baseUrl(device) + "/rpc/Shelly.GetDeviceInfo").then(function (info) {
        if (!info || !info.id || !info.gen) throw new Error("shelly-rpc: kimlik yok");
        var app = String(info.app || info.model || "");
        return {
          protocol: "shelly-rpc",
          model: info.model || app,
          name: info.name || info.id,
          kind:
            info.profile === "cover"
              ? "cover"
              : /dimmer|rgbw|bulb|light/i.test(app)
                ? "light"
                : /plug/i.test(app)
                  ? "plug"
                  : "switch",
          caps:
            info.profile === "cover"
              ? ["cover", "position"]
              : info.profile === "rgb" || info.profile === "rgbw"
                ? ["switch", "brightness", "color"]
                : null,
          options:
            info.profile === "rgb" || info.profile === "rgbw"
              ? { rgbComp: info.profile.toUpperCase() }
              : null,
        };
      });
    },
    read: function (device) {
      var id = device.endpointId == null ? 0 : device.endpointId;
      var comp = rpcComp(device);
      return getJson(baseUrl(device) + "/rpc/" + comp + ".GetStatus?id=" + id).then(function (s) {
        if (comp === "Cover") {
          return {
            position: typeof s.current_pos === "number" ? s.current_pos : null,
            switch: typeof s.current_pos === "number" ? s.current_pos > 0 : null,
            power: typeof s.apower === "number" ? s.apower : null,
          };
        }
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
        getJson(baseUrl(device) + "/rpc/Shelly.CheckForUpdate").catch(function () {
          return {};
        }),
      ]).then(function (r) {
        var latest = r[1] && r[1].stable && r[1].stable.version;
        return {
          current: r[0].ver || r[0].fw_id || null,
          latest: latest || r[0].ver || null,
          hasUpdate: !!latest,
        };
      });
    },
    write: function (device, capability, value) {
      var id = device.endpointId == null ? 0 : device.endpointId;
      var comp = rpcComp(device);
      // Gen2+: Switch.SetConfig initial_state = off | on | restore_last
      if (capability === "powerOn" && comp === "Switch")
        return getJson(
          baseUrl(device) +
            "/rpc/Switch.SetConfig?id=" +
            id +
            "&config=" +
            encodeURIComponent(
              JSON.stringify({
                initial_state: value === "on" ? "on" : value === "off" ? "off" : "restore_last",
              }),
            ),
        );
      // Gen2+ Cover bileşeni: Cover.Open / Cover.Close / Cover.GoToPosition (pos 0–100)
      if (device.kind === "cover") {
        if (capability === "coverStop")
          return getJson(baseUrl(device) + "/rpc/Cover.Stop?id=" + id);
        if (capability === "switch")
          return getJson(
            baseUrl(device) + "/rpc/Cover." + (value ? "Open" : "Close") + "?id=" + id,
          );
        if (capability === "position")
          return getJson(
            baseUrl(device) +
              "/rpc/Cover.GoToPosition?id=" +
              id +
              "&pos=" +
              Math.max(0, Math.min(100, Math.round(Number(value)))),
          );
        return unsupported("shelly-rpc", capability);
      }
      if (capability === "switch")
        return getJson(
          baseUrl(device) + "/rpc/" + comp + ".Set?id=" + id + "&on=" + (value ? "true" : "false"),
        );
      if (capability === "brightness" && comp !== "Switch")
        return getJson(
          baseUrl(device) + "/rpc/" + comp + ".Set?id=" + id + "&brightness=" + Math.round(value),
        );
      // RGB / RGBW bileşeni: RGB.Set rgb=[r,g,b]
      if (capability === "color" && (comp === "RGB" || comp === "RGBW"))
        return getJson(
          baseUrl(device) +
            "/rpc/" +
            comp +
            ".Set?id=" +
            id +
            "&on=true&rgb=" +
            encodeURIComponent(JSON.stringify(hexToRgb(value))),
        );
      return unsupported("shelly-rpc", capability);
    },
  };

  // --- Tasmota (HTTP komut arayüzü) -----------------------------------------
  var tasmota = {
    id: "tasmota",
    label: "Tasmota",
    caps: ["switch", "brightness", "color", "colorTemp", "position", "coverStop", "powerOn"],
    cmd: function (device, command) {
      return getJson(baseUrl(device) + "/cm?cmnd=" + encodeURIComponent(command));
    },
    probe: function (device) {
      return tasmota.cmd(device, "Status 0").then(function (s) {
        if (!s || !s.Status || !s.StatusFWR) throw new Error("tasmota: kimlik yok");
        var name = (
          s.Status.DeviceName ||
          (s.Status.FriendlyName && s.Status.FriendlyName[0]) ||
          "Tasmota"
        ).trim();
        var sts0 = s.StatusSTS || {};
        var light = typeof sts0.Dimmer === "number";
        var shutter = sts0.Shutter1 && typeof sts0.Shutter1.Position === "number";
        var res = {
          protocol: "tasmota",
          model: "Tasmota " + s.StatusFWR.Version,
          name: name,
          kind: shutter ? "cover" : light ? "light" : "switch",
        };
        if (shutter) res.caps = ["cover", "position"];
        else if (light && typeof sts0.CT === "number")
          res.caps = ["switch", "brightness", "colorTemp"]; // CT kanalı varsa ton ayarlanabilir (renk desteği varsayılmaz)
        return res;
      });
    },
    read: function (device) {
      return tasmota.cmd(device, "Status 11").then(function (s) {
        var sts = s.StatusSTS || {};
        var p = sts.POWER || sts.POWER1;
        if (sts.Shutter1 && typeof sts.Shutter1.Position === "number")
          return { position: sts.Shutter1.Position, switch: sts.Shutter1.Position > 0 };
        return {
          switch: p == null ? null : p === "ON",
          brightness: typeof sts.Dimmer === "number" ? sts.Dimmer : null,
        };
      });
    },
    firmware: function (device) {
      return tasmota.cmd(device, "Status 2").then(function (s) {
        return {
          current: (s.StatusFWR && s.StatusFWR.Version) || null,
          latest: null,
          hasUpdate: null,
        };
      });
    },
    write: function (device, capability, value) {
      // Tasmota komutları: ShutterPosition1 0–100, CT 153–500 (mired), ShutterOpen1 / ShutterClose1,
      // PowerOnState 0 = kapalı, 1 = açık, 3 = son durum
      if (capability === "powerOn")
        return tasmota.cmd(
          device,
          "PowerOnState " + (value === "on" ? 1 : value === "off" ? 0 : 3),
        );
      if (capability === "coverStop") return tasmota.cmd(device, "ShutterStop1");
      if (capability === "position")
        return tasmota.cmd(
          device,
          "ShutterPosition1 " + Math.max(0, Math.min(100, Math.round(Number(value)))),
        );
      if (capability === "colorTemp")
        return tasmota.cmd(
          device,
          "CT " + Math.max(153, Math.min(500, Math.round(1000000 / toneKelvin(value)))),
        );
      if (capability === "switch" && device.kind === "cover")
        return tasmota.cmd(device, value ? "ShutterOpen1" : "ShutterClose1");
      if (capability === "switch") return tasmota.cmd(device, "Power " + (value ? "On" : "Off"));
      if (capability === "brightness") return tasmota.cmd(device, "Dimmer " + Math.round(value));
      if (capability === "color")
        return tasmota.cmd(device, "Color " + String(value).replace("#", ""));
      return unsupported("tasmota", capability);
    },
  };

  // --- WLED (JSON API) --------------------------------------------------------
  var wled = {
    id: "wled",
    label: "WLED",
    caps: ["switch", "brightness", "color", "colorTemp", "effect", "lightScene"],
    probe: function (device) {
      return getJson(baseUrl(device) + "/json/info").then(function (info) {
        if (!info || !info.ver || !info.leds) throw new Error("wled: sürüm alanı yok");
        var found = {
          protocol: "wled",
          model: "WLED " + info.ver,
          name: info.name || device.name || "WLED",
          kind: "light",
        };
        // Efekt adları (/json/effects, dizin = fx numarası) ve kayıtlı hazır ayarlar (/presets.json)
        return Promise.all([
          getJson(baseUrl(device) + "/json/effects").catch(function () {
            return [];
          }),
          getJson(baseUrl(device) + "/presets.json").catch(function () {
            return {};
          }),
        ]).then(function (r) {
          var options = {};
          if (Array.isArray(r[0]) && r[0].length) options.effects = r[0].slice(0, 256).map(String);
          var presets = r[1] && typeof r[1] === "object" ? r[1] : {};
          var scenes = Object.keys(presets)
            .filter(function (k) {
              return k !== "0" && presets[k] && presets[k].n;
            })
            .slice(0, 64)
            .map(function (k) {
              return [k, String(presets[k].n)];
            });
          if (scenes.length) options.scenes = scenes;
          if (options.effects || options.scenes) found.options = options;
          return found;
        });
      });
    },
    read: function (device) {
      return getJson(baseUrl(device) + "/json/state").then(function (state) {
        var col = state.seg && state.seg[0] && state.seg[0].col && state.seg[0].col[0];
        return {
          switch: !!state.on,
          brightness: typeof state.bri === "number" ? Math.round((state.bri / 255) * 100) : null,
          color: col
            ? "#" +
              col
                .slice(0, 3)
                .map(function (v) {
                  return ("0" + Number(v).toString(16)).slice(-2);
                })
                .join("")
                .toUpperCase()
            : null,
        };
      });
    },
    firmware: function (device) {
      return getJson(baseUrl(device) + "/json/info").then(function (i) {
        return { current: i.ver || null, latest: null, hasUpdate: null };
      });
    },
    write: function (device, capability, value) {
      var wopts = device.options || {};
      if (capability === "effect") {
        var fx = (wopts.effects || []).indexOf(value);
        if (fx === -1) return unsupported("wled", capability);
        return sendJson(baseUrl(device) + "/json/state", "POST", { on: true, seg: [{ fx: fx }] });
      }
      if (capability === "lightScene") {
        var known = (wopts.scenes || []).some(function (s) {
          return String(s[0]) === String(value);
        });
        if (!known) return unsupported("wled", capability);
        return sendJson(baseUrl(device) + "/json/state", "POST", { on: true, ps: Number(value) });
      }
      var body =
        capability === "switch"
          ? { on: !!value }
          : capability === "brightness"
            ? { on: Number(value) > 0, bri: Math.max(1, Math.round((Number(value) / 100) * 255)) }
            : capability === "color"
              ? { seg: [{ col: [hexToRgb(value)] }] }
              : capability === "colorTemp"
                ? { seg: [{ cct: toneKelvin(value) }] } // WLED 0.13+: 1900–10091 değeri Kelvin olarak okunur
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
    caps: ["switch", "brightness", "color", "colorTemp", "position", "coverStop"],
    probe: function (device) {
      // web_server v1/v2 kök sayfası "ESPHome" içerir; bileşen kimliği kayıtta tutulur
      return request({ url: baseUrl(device) + "/" }).then(function (res) {
        if (res.status !== 200 || !/esphome/i.test(res.text)) throw new Error("esphome: imza yok");
        var title = (res.text.match(/<title>([^<]+)<\/title>/i) || [])[1] || "ESPHome";
        var light = /light-|\/light\//i.test(res.text);
        var cover = !light && /cover-|\/cover\//i.test(res.text);
        var idMatch = res.text.match(/(?:light|switch|cover)[-/]([a-z0-9_]+)/i);
        return {
          protocol: "esphome",
          model: "ESPHome",
          name: title.trim(),
          kind: cover ? "cover" : light ? "light" : "switch",
          caps: cover ? ["cover", "position"] : null,
          entity: idMatch ? idMatch[1] : null,
        };
      });
    },
    path: function (device) {
      var dom = device.kind === "light" ? "light" : device.kind === "cover" ? "cover" : "switch";
      return (
        "/" +
        dom +
        "/" +
        (device.entity || (dom === "light" ? "light" : dom === "cover" ? "cover" : "relay"))
      );
    },
    read: function (device) {
      return getJson(baseUrl(device) + esphome.path(device)).then(function (s) {
        if (device.kind === "cover") {
          return {
            position: typeof s.position === "number" ? Math.round(s.position * 100) : null,
            switch: typeof s.position === "number" ? s.position > 0 : null,
          };
        }
        return {
          switch: s.state == null ? null : String(s.state).toUpperCase() === "ON",
          brightness:
            typeof s.brightness === "number" ? Math.round((s.brightness / 255) * 100) : null,
        };
      });
    },
    write: function (device, capability, value) {
      var p = esphome.path(device);
      if (capability === "coverStop" && device.kind === "cover")
        return request({ url: baseUrl(device) + p + "/stop", method: "POST" });
      if (capability === "switch" && device.kind === "cover")
        return request({ url: baseUrl(device) + p + (value ? "/open" : "/close"), method: "POST" });
      if (capability === "switch")
        return request({
          url: baseUrl(device) + p + (value ? "/turn_on" : "/turn_off"),
          method: "POST",
        });
      if (capability === "brightness" && device.kind === "light") {
        return request({
          url:
            baseUrl(device) + p + "/turn_on?brightness=" + Math.round((Number(value) / 100) * 255),
          method: "POST",
        });
      }
      // ESPHome web_server: light turn_on?r=&g=&b= / color_temp (mired); cover set?position=0..1, open, close
      if (capability === "color" && device.kind === "light") {
        var c = hexToRgb(value);
        return request({
          url: baseUrl(device) + p + "/turn_on?r=" + c[0] + "&g=" + c[1] + "&b=" + c[2],
          method: "POST",
        });
      }
      if (capability === "colorTemp" && device.kind === "light") {
        return request({
          url:
            baseUrl(device) + p + "/turn_on?color_temp=" + Math.round(1000000 / toneKelvin(value)),
          method: "POST",
        });
      }
      if (capability === "position" && device.kind === "cover") {
        return request({
          url:
            baseUrl(device) +
            p +
            "/set?position=" +
            Math.max(0, Math.min(100, Math.round(Number(value)))) / 100,
          method: "POST",
        });
      }
      return unsupported("esphome", capability);
    },
  };

  // --- Philips Hue (yerel köprü API v1) --------------------------------------
  // Köprü bir kez eşleştirilir (köprüdeki düğmeye basılır), sonra her lamba ayrı cihaz olur.
  var hue = {
    id: "hue",
    label: "Philips Hue",
    caps: ["switch", "brightness", "color", "colorTemp", "lightScene"],
    probe: function (device) {
      return getJson(baseUrl(device) + "/api/config").then(function (c) {
        if (!c || !c.bridgeid) throw new Error("hue: köprü değil");
        return {
          protocol: "hue",
          model: c.modelid || "Hue Bridge",
          name: c.name || "Hue Köprüsü",
          kind: "bridge",
          bridgeid: c.bridgeid,
        };
      });
    },
    // Köprü düğmesine basıldıktan sonra 30 sn içinde çağrılır; kullanıcı adını döner.
    pair: function (host) {
      var device = { host: host };
      return sendJson(baseUrl(device) + "/api", "POST", { devicetype: "nexus#app" }).then(
        function (r) {
          var item = Array.isArray(r) ? r[0] : r;
          if (item && item.success && item.success.username) return item.success.username;
          if (item && item.error && item.error.type === 101) {
            var e = new Error("Köprüdeki yuvarlak düğmeye bas, sonra tekrar dene.");
            e.code = "link-button";
            throw e;
          }
          throw new Error("hue: eşleştirme başarısız");
        },
      );
    },
    lights: function (host, user) {
      var apiBase = baseUrl({ host: host }) + "/api/" + encodeURIComponent(user);
      // Köprüde kayıtlı sahneler: her ışığa yalnızca o ışığı içeren sahneler sunulur
      var scenesReq = getJson(apiBase + "/scenes").catch(function () {
        return {};
      });
      return Promise.all([getJson(apiBase + "/lights"), scenesReq]).then(function (res) {
        var all = res[0],
          scenes = res[1] || {};
        if (Array.isArray(all) && all[0] && all[0].error) throw new Error("hue: yetki yok");
        return Object.keys(all || {}).map(function (id) {
          var mine = Object.keys(scenes)
            .filter(function (sid) {
              var sc = scenes[sid] || {};
              return Array.isArray(sc.lights) && sc.lights.indexOf(String(id)) !== -1 && sc.name;
            })
            .slice(0, 24)
            .map(function (sid) {
              return [sid, scenes[sid].name];
            });
          var l = all[id] || {};
          var type = String(l.type || "");
          var caps = ["switch"];
          if (/dimmable|color|temperature/i.test(type)) caps.push("brightness");
          if (/color light/i.test(type)) caps.push("color");
          if (/temperature|extended color/i.test(type)) caps.push("colorTemp");
          return {
            id: id,
            name: l.name || "Hue " + id,
            type: type,
            caps: mine.length ? caps.concat(["lightScene"]) : caps,
            options: mine.length ? { scenes: mine } : null,
            model: l.modelid || "Hue",
          };
        });
      });
    },
    url: function (device) {
      return (
        baseUrl(device) +
        "/api/" +
        encodeURIComponent(device.hueUser || "") +
        "/lights/" +
        encodeURIComponent(device.endpointId == null ? 0 : device.endpointId)
      );
    },
    // Eksik eşleştirme verisiyle (hueUser / endpointId) asla istek atılmaz: bozuk kayıt
    // "/api//lights/undefined" gibi anlamsız URL üretirdi. Kullanıcıya net mesaj verilir.
    identityError: function (device) {
      if (!device.hueUser) {
        var e = new Error("Hue köprüsü eşleştirmesi eksik — cihazı silip yeniden eşleştir.");
        e.code = "hue-identity";
        return e;
      }
      if (device.endpointId == null) {
        var e2 = new Error("Hue ışık kimliği eksik — cihazı silip yeniden eşleştir.");
        e2.code = "hue-identity";
        return e2;
      }
      return null;
    },
    firmware: function (device) {
      var bad = hue.identityError(device);
      if (bad) return Promise.reject(bad);
      return getJson(hue.url(device)).then(function (l) {
        var sw = l.swupdate || {};
        return {
          current: l.swversion || null,
          latest: null,
          hasUpdate: sw.state ? sw.state !== "noupdates" : null,
        };
      });
    },
    read: function (device) {
      var bad = hue.identityError(device);
      if (bad) return Promise.reject(bad);
      return getJson(hue.url(device)).then(function (l) {
        if (Array.isArray(l) && l[0] && l[0].error) throw new Error("hue: yetki yok");
        var s = l.state || {};
        return {
          switch: typeof s.on === "boolean" ? s.on : null,
          brightness: typeof s.bri === "number" ? Math.round((s.bri / 254) * 100) : null,
          reachable: s.reachable !== false,
        };
      });
    },
    write: function (device, capability, value) {
      var bad = hue.identityError(device);
      if (bad) return Promise.reject(bad);
      var body = null;
      if (capability === "switch") body = { on: !!value };
      if (capability === "brightness")
        body = { on: Number(value) > 0, bri: Math.max(1, Math.round((Number(value) / 100) * 254)) };
      if (capability === "color") body = { on: true, xy: rgbToXy(hexToRgb(value)) };
      if (capability === "colorTemp")
        body = { on: true, ct: Math.round(1000000 / toneKelvin(value)) }; // Hue ct: mired (153–500)
      // Sahne çağırma: PUT /api/<user>/groups/0/action {scene}; sahnedeki tüm ışıklar o sahneye geçer
      if (capability === "lightScene") {
        var known = ((device.options && device.options.scenes) || []).some(function (s) {
          return String(s[0]) === String(value);
        });
        if (!known) return unsupported("hue", capability);
        return sendJson(
          baseUrl(device) + "/api/" + encodeURIComponent(device.hueUser) + "/groups/0/action",
          "PUT",
          { scene: String(value) },
        ).then(function (r) {
          if (Array.isArray(r) && r[0] && r[0].error)
            throw new Error("hue: " + r[0].error.description);
          return r;
        });
      }
      if (!body) return unsupported("hue", capability);
      return sendJson(hue.url(device) + "/state", "PUT", body).then(function (r) {
        if (Array.isArray(r) && r[0] && r[0].error)
          throw new Error("hue: " + r[0].error.description);
        return r;
      });
    },
  };

  // Uygulamadaki "Sıcak / Doğal / Soğuk" seçimi → Kelvin (Hue için 153–500 mired aralığına denk gelir)
  function toneKelvin(tone) {
    if (typeof tone === "number" && isFinite(tone))
      return Math.max(2000, Math.min(6500, Math.round(tone)));
    return tone === "warm" ? 2700 : tone === "cool" ? 6500 : 4000;
  }

  function rgbToXy(rgb) {
    var c = rgb.map(function (v) {
      v = v / 255;
      return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
    });
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
    switch: { kind: "switch", caps: ["switch"] },
    input_boolean: { kind: "switch", caps: ["switch"] },
    fan: { kind: "switch", caps: ["switch"] },
    humidifier: { kind: "purifier", caps: ["switch", "airQuality"] }, // airQuality yeteneği hava panelini seçtirir
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
      headers: {
        Authorization: "Bearer " + (token || device.haToken || ""),
        "Content-Type": "application/json",
      },
      timeoutMs: 6000,
    }).then(function (res) {
      if (res.status === 401 || res.status === 403) {
        var e = new Error("Jeton geçersiz ya da süresi dolmuş.");
        e.code = "auth";
        throw e;
      }
      if (res.status < 200 || res.status >= 300)
        throw new Error("homeassistant: http " + res.status);
      try {
        return JSON.parse(res.text);
      } catch (x) {
        return res.text;
      }
    });
  }
  // Uygulamadaki sabit seçenek anahtarlarını (cool/heat/fan/auto, low/mid/high/auto) varlığın bildirdiği
  // değerlere eşler; eşleşmeyen seçenek cihaz için hiç sunulmaz (gönderilemeyen kontrol gösterilmez).
  var HA_HVAC_CANDIDATES = {
    cool: ["cool"],
    heat: ["heat"],
    fan: ["fan_only"],
    auto: ["auto", "heat_cool"],
  };
  var HA_FAN_CANDIDATES = {
    low: ["low", "quiet", "silent", "1"],
    mid: ["medium", "mid", "middle", "2"],
    high: ["high", "strong", "turbo", "3"],
    auto: ["auto"],
  };
  function haPickMap(candidates, available) {
    var low = (available || []).map(function (v) {
      return [String(v).toLowerCase(), v];
    });
    var out = {},
      any = false;
    Object.keys(candidates).forEach(function (key) {
      for (var i = 0; i < candidates[key].length; i++) {
        var hit = low.filter(function (p) {
          return p[0] === candidates[key][i];
        })[0];
        if (hit) {
          out[key] = hit[1];
          any = true;
          return;
        }
      }
    });
    return any ? out : null;
  }
  // media_player / vacuum supported_features bit alanları (Home Assistant geliştirici belgeleri)
  var HA_MEDIA_VOLUME_SET = 4,
    HA_MEDIA_VOLUME_MUTE = 8,
    HA_MEDIA_SELECT_SOURCE = 2048,
    HA_VACUUM_FAN_SPEED = 32;

  function haEntityOptions(st) {
    var domain = String(st.entity_id || "").split(".")[0];
    var a = st.attributes || {},
      f = Number(a.supported_features) || 0,
      caps = [],
      options = {};
    if (domain === "light" && (a.supported_color_modes || []).indexOf("color_temp") !== -1)
      caps.push("colorTemp");
    // humidifier.set_humidity (hedef nem %), cover.set_cover_tilt_position (SET_TILT_POSITION=128)
    if (domain === "humidifier") {
      caps.push("targetHumidity");
      options.humidity = {
        min: Number(a.min_humidity) || 0,
        max: Number(a.max_humidity) || 100,
      };
    }
    if (domain === "cover" && f & 128) caps.push("tilt");
    // fan: SET_SPEED=1 (yüzde), OSCILLATE=2 — Home Assistant fan.set_percentage / fan.oscillate
    if (domain === "fan") {
      if (f & 1) {
        caps.push("fanMode");
        options.fanMap = { low: 33, mid: 66, high: 100 };
      }
      if (f & 2) {
        caps.push("swing");
        options.swing = { oscillate: true };
      }
    }
    if (domain === "climate") {
      var hv = haPickMap(HA_HVAC_CANDIDATES, a.hvac_modes);
      if (hv) {
        caps.push("hvacMode");
        options.hvacMap = hv;
      }
      var fm = haPickMap(HA_FAN_CANDIDATES, a.fan_modes);
      if (fm) {
        caps.push("fanMode");
        options.fanMap = fm;
      }
      var sw = a.swing_modes || [];
      var off = sw.filter(function (m) {
        return String(m).toLowerCase() === "off";
      })[0];
      var on = ["both", "on", "vertical", "horizontal"]
        .map(function (w) {
          return sw.filter(function (m) {
            return String(m).toLowerCase() === w;
          })[0];
        })
        .filter(Boolean)[0];
      if (off && on) {
        caps.push("swing");
        options.swing = { on: on, off: off };
      }
    }
    if (domain === "media_player") {
      // Oynat / duraklat / önceki / sonraki: yalnızca varlığın bildirdiği özellik bitleri (PLAY=16384, PAUSE=1, PREVIOUS=16, NEXT=32)
      var tr = [];
      if (f & 16384) tr.push("play");
      if (f & 1) tr.push("pause");
      if (f & 16) tr.push("previous");
      if (f & 32) tr.push("next");
      if (tr.length) {
        caps.push("transport");
        options.transport = tr;
      }
      if (f & HA_MEDIA_VOLUME_SET) caps.push("volume");
      if (f & HA_MEDIA_VOLUME_MUTE) caps.push("mute");
      if (f & HA_MEDIA_SELECT_SOURCE && Array.isArray(a.source_list) && a.source_list.length) {
        caps.push("source");
        options.source = a.source_list.slice(0, 24);
      }
    }
    if (
      domain === "vacuum" &&
      f & HA_VACUUM_FAN_SPEED &&
      Array.isArray(a.fan_speed_list) &&
      a.fan_speed_list.length
    ) {
      caps.push("suction");
      options.suction = a.fan_speed_list.slice(0, 12);
    }
    return { caps: caps, options: options };
  }

  // Salt okunur sensörler (device_class'a göre). Tüm sensor.* varlıkları (işlemci ısısı, sürüm vb.) listelenmez;
  // yalnızca ev ölçümleri ve olay sensörleri. Okuma: GET /api/states/<entity_id>.
  var HA_SENSOR_CLASSES = {
    temperature: { kind: "climatesensor", caps: ["temperature"], label: "Sıcaklık" },
    humidity: { kind: "envsensor", caps: ["sensor"], label: "Nem" },
    illuminance: { kind: "envsensor", caps: ["sensor"], label: "Işık düzeyi" },
    pm25: { kind: "envsensor", caps: ["sensor"], label: "PM2.5" },
    pm10: { kind: "envsensor", caps: ["sensor"], label: "PM10" },
    carbon_dioxide: { kind: "envsensor", caps: ["sensor"], label: "CO₂" },
    pressure: { kind: "envsensor", caps: ["sensor"], label: "Basınç" },
    battery: { kind: "envsensor", caps: ["sensor"], label: "Pil" },
    power: { kind: "envsensor", caps: ["sensor"], label: "Güç" },
    energy: { kind: "envsensor", caps: ["sensor"], label: "Enerji" },
  };
  var HA_BINARY_CLASSES = {
    motion: { kind: "motion", caps: ["motion"] },
    occupancy: { kind: "motion", caps: ["motion"] },
    presence: { kind: "motion", caps: ["motion"] },
    door: { kind: "contact", caps: ["contact"] },
    window: { kind: "contact", caps: ["contact"] },
    garage_door: { kind: "contact", caps: ["contact"] },
    opening: { kind: "contact", caps: ["contact"] },
    moisture: { kind: "alarm", caps: ["alarm"] },
    smoke: { kind: "alarm", caps: ["alarm"] },
    gas: { kind: "alarm", caps: ["alarm"] },
    carbon_monoxide: { kind: "alarm", caps: ["alarm"] },
  };
  function haSensorDef(st) {
    var domain = String(st.entity_id || "").split(".")[0];
    var cls = String((st.attributes || {}).device_class || "");
    if (domain === "sensor" && HA_SENSOR_CLASSES[cls]) return HA_SENSOR_CLASSES[cls];
    if (domain === "binary_sensor" && HA_BINARY_CLASSES[cls]) return HA_BINARY_CLASSES[cls];
    return null;
  }

  function haEntityCaps(st) {
    var domain = String(st.entity_id || "").split(".")[0];
    var sensor = haSensorDef(st);
    if (sensor) {
      return {
        kind: sensor.kind,
        caps: sensor.caps.slice(),
        options: sensor.label ? { label: sensor.label } : null,
      };
    }
    var def = HA_DOMAINS[domain];
    if (!def) return null;
    var caps = def.caps.slice();
    var a = st.attributes || {};
    if (domain === "light") {
      var modes = a.supported_color_modes || [];
      if (
        modes.some(function (m) {
          return m !== "onoff";
        }) ||
        typeof a.brightness === "number"
      )
        caps.push("brightness");
      if (
        modes.some(function (m) {
          return /^(hs|xy|rgb|rgbw|rgbww)$/.test(m);
        })
      )
        caps.push("color");
    }
    var extra = haEntityOptions(st);
    extra.caps.forEach(function (c) {
      if (caps.indexOf(c) === -1) caps.push(c);
    });
    return { kind: def.kind, caps: caps, options: extra.options };
  }
  var homeassistant = {
    id: "homeassistant",
    label: "Home Assistant",
    caps: [
      "switch",
      "brightness",
      "color",
      "colorTemp",
      "cover",
      "position",
      "target",
      "lock",
      "vacuum",
      "hvacMode",
      "fanMode",
      "swing",
      "volume",
      "mute",
      "source",
      "suction",
      "transport",
      "targetHumidity",
      "tilt",
      "coverStop",
    ],
    probe: function (device) {
      var d = { host: haBase(device) };
      return getJson(d.host + "/manifest.json").then(function (m) {
        if (!m || !/home assistant/i.test(String(m.name || "")))
          throw new Error("homeassistant: değil");
        return {
          protocol: "homeassistant",
          model: "Home Assistant",
          name: "Home Assistant",
          kind: "bridge",
          host: d.host,
        };
      });
    },
    // Jetonu doğrular ve NEXUS'un kontrol edebildiği varlıkları (entity) listeler.
    entities: function (host, token) {
      var device = { host: host };
      return haCall(device, "GET", "/api/states", null, token).then(function (all) {
        if (!Array.isArray(all)) throw new Error("homeassistant: beklenmeyen yanıt");
        return all
          .map(function (st) {
            var info = haEntityCaps(st);
            if (!info) return null;
            return {
              entity: st.entity_id,
              name: (st.attributes && st.attributes.friendly_name) || st.entity_id,
              kind: info.kind,
              caps: info.caps,
              options: info.options,
              model: "Home Assistant · " + st.entity_id.split(".")[0],
            };
          })
          .filter(Boolean);
      });
    },
    read: function (device) {
      return haCall(device, "GET", "/api/states/" + encodeURIComponent(device.entity)).then(
        function (st) {
          var a = st.attributes || {},
            s = String(st.state || "");
          var out = { reachable: s !== "unavailable" };
          var domain = String(device.entity || "").split(".")[0];
          if (domain === "sensor" || domain === "binary_sensor") {
            // Salt okunur: unavailable/unknown durumunda değer uydurulmaz (null)
            if (domain === "binary_sensor") {
              out.active = s === "on" ? true : s === "off" ? false : null;
            } else {
              var num = parseFloat(s);
              var isTemp = a.device_class === "temperature";
              var val = isFinite(num) ? num : null;
              if (isTemp) out.temperature = val;
              else {
                out.value = val;
                if (typeof a.unit_of_measurement === "string") out.unit = a.unit_of_measurement;
              }
            }
            return out;
          }
          if (domain === "cover") {
            out.position =
              typeof a.current_position === "number"
                ? a.current_position
                : s === "open"
                  ? 100
                  : s === "closed"
                    ? 0
                    : null;
            out.switch = s === "open" || s === "opening";
            if (typeof a.current_tilt_position === "number") out.tilt = a.current_tilt_position;
          } else if (domain === "lock") out.locked = s === "locked";
          else if (domain === "vacuum") {
            out.mode = s === "cleaning" ? "cleaning" : "docked";
            if (typeof a.fan_speed === "string") out.suction = a.fan_speed;
          } else if (domain === "humidifier") {
            out.switch = s === "on";
            if (typeof a.humidity === "number") out.targetHumidity = a.humidity;
          } else if (domain === "fan") {
            out.switch = s === "on";
            if (typeof a.percentage === "number" && a.percentage > 0)
              out.fan = a.percentage <= 33 ? "low" : a.percentage <= 66 ? "mid" : "high";
            if (typeof a.oscillating === "boolean") out.swing = a.oscillating;
          } else if (domain === "climate") {
            out.switch = s !== "off";
            if (typeof a.temperature === "number") out.target = a.temperature;
            var o = device.options || {};
            Object.keys(o.hvacMap || {}).forEach(function (k) {
              if (o.hvacMap[k] === s) out.mode = k;
            });
            Object.keys(o.fanMap || {}).forEach(function (k) {
              if (o.fanMap[k] === a.fan_mode) out.fan = k;
            });
            if (o.swing && typeof a.swing_mode === "string")
              out.swing = a.swing_mode === o.swing.on;
          } else {
            out.switch = s === "on" || s === "playing";
            if (domain === "media_player") {
              if (typeof a.volume_level === "number") out.volume = Math.round(a.volume_level * 100);
              if (typeof a.is_volume_muted === "boolean") out.muted = a.is_volume_muted;
              if (typeof a.source === "string") out.source = a.source;
            }
          }
          if (typeof a.brightness === "number")
            out.brightness = Math.round((a.brightness / 255) * 100);
          return out;
        },
      );
    },
    write: function (device, capability, value) {
      var id = device.entity,
        domain = String(id || "").split(".")[0];
      function svc(d, name, extra) {
        var body = { entity_id: id };
        Object.keys(extra || {}).forEach(function (k) {
          body[k] = extra[k];
        });
        return haCall(device, "POST", "/api/services/" + d + "/" + name, body);
      }
      if (capability === "switch") {
        if (domain === "cover") return svc("cover", value ? "open_cover" : "close_cover");
        if (domain === "lock" || domain === "vacuum")
          return unsupported("homeassistant", capability);
        return svc(
          domain === "input_boolean" ? "input_boolean" : domain,
          value ? "turn_on" : "turn_off",
        );
      }
      if (capability === "brightness")
        return Number(value) > 0
          ? svc("light", "turn_on", { brightness_pct: Math.round(Number(value)) })
          : svc("light", "turn_off");
      if (capability === "color") return svc("light", "turn_on", { rgb_color: hexToRgb(value) });
      if (capability === "coverStop" && domain === "cover") return svc("cover", "stop_cover");
      if (capability === "position" && domain === "cover") {
        var pos = Math.round(Number(value));
        if (pos >= 100) return svc("cover", "open_cover");
        if (pos <= 0) return svc("cover", "close_cover");
        return svc("cover", "set_cover_position", { position: pos });
      }
      if (capability === "target" && domain === "climate")
        return svc("climate", "set_temperature", { temperature: Number(value) });
      var opts = device.options || {};
      if (capability === "colorTemp" && domain === "light")
        return svc("light", "turn_on", { color_temp_kelvin: toneKelvin(value) });
      if (capability === "hvacMode" && domain === "climate") {
        var hv = opts.hvacMap && opts.hvacMap[value];
        return hv
          ? svc("climate", "set_hvac_mode", { hvac_mode: hv })
          : unsupported("homeassistant", capability);
      }
      if (capability === "targetHumidity" && domain === "humidifier") {
        var hr = opts.humidity || { min: 0, max: 100 };
        return svc("humidifier", "set_humidity", {
          humidity: Math.max(hr.min, Math.min(hr.max, Math.round(Number(value)))),
        });
      }
      if (capability === "tilt" && domain === "cover")
        return svc("cover", "set_cover_tilt_position", {
          tilt_position: Math.max(0, Math.min(100, Math.round(Number(value)))),
        });
      if (capability === "fanMode" && domain === "fan") {
        var pct = opts.fanMap && opts.fanMap[value];
        return pct
          ? svc("fan", "set_percentage", { percentage: pct })
          : unsupported("homeassistant", capability);
      }
      if (capability === "swing" && domain === "fan")
        return opts.swing && opts.swing.oscillate
          ? svc("fan", "oscillate", { oscillating: !!value })
          : unsupported("homeassistant", capability);
      if (capability === "fanMode" && domain === "climate") {
        var fm = opts.fanMap && opts.fanMap[value];
        return fm
          ? svc("climate", "set_fan_mode", { fan_mode: fm })
          : unsupported("homeassistant", capability);
      }
      if (capability === "swing" && domain === "climate") {
        return opts.swing
          ? svc("climate", "set_swing_mode", { swing_mode: value ? opts.swing.on : opts.swing.off })
          : unsupported("homeassistant", capability);
      }
      if (capability === "volume" && domain === "media_player")
        return svc("media_player", "volume_set", {
          volume_level: Math.max(0, Math.min(100, Number(value))) / 100,
        });
      if (capability === "mute" && domain === "media_player")
        return svc("media_player", "volume_mute", { is_volume_muted: !!value });
      if (capability === "source" && domain === "media_player") {
        return (opts.source || []).indexOf(value) !== -1
          ? svc("media_player", "select_source", { source: value })
          : unsupported("homeassistant", capability);
      }
      if (capability === "suction" && domain === "vacuum") {
        return (opts.suction || []).indexOf(value) !== -1
          ? svc("vacuum", "set_fan_speed", { fan_speed: value })
          : unsupported("homeassistant", capability);
      }
      if (capability === "lock" && domain === "lock") return svc("lock", value ? "lock" : "unlock");
      if (capability === "vacuum" && domain === "vacuum")
        return svc(
          "vacuum",
          value === "cleaning" ? "start" : value === "paused" ? "pause" : "return_to_base",
        );
      if (capability === "transport" && domain === "media_player") {
        var svcName = {
          play: "media_play",
          pause: "media_pause",
          next: "media_next_track",
          previous: "media_previous_track",
        }[value];
        return svcName && (opts.transport || []).indexOf(value) !== -1
          ? svc("media_player", svcName)
          : unsupported("homeassistant", capability);
      }
      return unsupported("homeassistant", capability);
    },
  };

  // --- TP-Link Kasa (TCP 9999, XOR) — yalnızca masaüstü uygulamasında ----------
  // Kasa protokolü UTF-8 baytları üzerinde XOR "otomatik anahtar" şifrelemesi kullanır
  function utf8Bytes(str) {
    if (typeof TextEncoder !== "undefined") return Array.from(new TextEncoder().encode(str));
    return unescape(encodeURIComponent(str))
      .split("")
      .map(function (c) {
        return c.charCodeAt(0);
      });
  }
  function utf8String(bytes) {
    if (typeof TextDecoder !== "undefined")
      return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
    return decodeURIComponent(escape(String.fromCharCode.apply(null, bytes)));
  }
  function kasaEncrypt(str) {
    var key = 171,
      out = [],
      bytes = utf8Bytes(str);
    for (var i = 0; i < bytes.length; i++) {
      var c = bytes[i] ^ key;
      key = c;
      out.push(c);
    }
    return out;
  }
  function kasaDecrypt(bytes) {
    var key = 171,
      out = [];
    for (var i = 0; i < bytes.length; i++) {
      out.push(bytes[i] ^ key);
      key = bytes[i];
    }
    return utf8String(out);
  }
  var kasa = {
    id: "kasa",
    label: "TP-Link Kasa",
    caps: ["switch", "brightness", "color", "colorTemp", "indicator"],
    needsTcp: true,
    send: function (device, obj) {
      var tcp = tcpBridge();
      if (!tcp) return Promise.reject(new Error("kasa: TCP yalnızca masaüstü uygulamasında"));
      var blocked = lanAddressError(hostOnly(device));
      if (blocked) return Promise.reject(blocked);
      var payload = kasaEncrypt(JSON.stringify(obj));
      var framed = [
        (payload.length >>> 24) & 255,
        (payload.length >>> 16) & 255,
        (payload.length >>> 8) & 255,
        payload.length & 255,
      ].concat(payload);
      return tcp({
        host: hostOnly(device),
        port: 9999,
        bytes: framed,
        timeoutMs: scanTimeoutMs || DEFAULT_TIMEOUT_MS,
        lengthPrefixed: true,
      }).then(function (resp) {
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
        var isLight = s.brightness != null || /bulb|light/i.test(s.mic_type || s.type || "");
        var res = {
          protocol: "kasa",
          model: s.model,
          name: s.alias || s.model,
          kind: isLight ? "light" : "plug",
        };
        // Ampul yetenekleri cihazın kendi bildirdiği is_color / is_variable_color_temp alanlarından gelir
        res.caps = isLight
          ? ["switch", "brightness"].concat(
              s.is_color ? ["color"] : [],
              s.is_variable_color_temp ? ["colorTemp"] : [],
            )
          : ["switch", "indicator"];
        return res;
      });
    },
    read: function (device) {
      return kasa.send(device, { system: { get_sysinfo: {} } }).then(function (r) {
        var s = r.system.get_sysinfo;
        var ls = s.light_state || {};
        return {
          indicator: s.led_off != null ? s.led_off === 0 : undefined,
          switch: s.relay_state != null ? s.relay_state === 1 : ls.on_off === 1,
          brightness:
            s.brightness != null ? s.brightness : ls.brightness != null ? ls.brightness : null,
        };
      });
    },
    write: function (device, capability, value) {
      if (capability === "switch") {
        if (device.kind === "light")
          return kasa.send(device, {
            "smartlife.iot.smartbulb.lightingservice": {
              transition_light_state: { on_off: value ? 1 : 0 },
            },
          });
        return kasa.send(device, { system: { set_relay_state: { state: value ? 1 : 0 } } });
      }
      if (capability === "brightness") {
        if (device.kind === "light")
          return kasa.send(device, {
            "smartlife.iot.smartbulb.lightingservice": {
              transition_light_state: { on_off: 1, brightness: Math.round(value) },
            },
          });
        return kasa.send(device, {
          "smartlife.iot.dimmer": { set_brightness: { brightness: Math.round(value) } },
        });
      }
      // Kasa akıllı ampul: transition_light_state içinde hue (0–360), saturation (0–100), color_temp (Kelvin; 0 = renk modu)
      if (capability === "color" && device.kind === "light") {
        var hsb = rgbToHsb(hexToRgb(value));
        return kasa.send(device, {
          "smartlife.iot.smartbulb.lightingservice": {
            transition_light_state: {
              on_off: 1,
              color_temp: 0,
              hue: Math.round(hsb.h * 360) % 360,
              saturation: Math.round(hsb.s * 100),
              brightness: Math.max(1, Math.round(hsb.v * 100)),
            },
          },
        });
      }
      if (capability === "colorTemp" && device.kind === "light") {
        return kasa.send(device, {
          "smartlife.iot.smartbulb.lightingservice": {
            transition_light_state: { on_off: 1, color_temp: toneKelvin(value) },
          },
        });
      }
      // set_led_off: off=1 göstergeyi söndürür (TP-Link smart plug sistem API'si)
      if (capability === "indicator")
        return kasa.send(device, { system: { set_led_off: { off: value ? 0 : 1 } } });
      return unsupported("kasa", capability);
    },
  };

  // --- Yeelight (TCP 55443, JSON satırları; "LAN Control" açık olmalı) — masaüstü ---
  // [kimlik, ad, yöntem, parametreler]; start_cf ifadesi "süre,mod,değer,parlaklık" (mod 1 = RGB)
  var YEELIGHT_SCENES = [
    ["read", "Okuma", "set_scene", ["ct", 2700, 80]],
    ["day", "Gün ışığı", "set_scene", ["ct", 5000, 100]],
    ["night", "Gece lambası", "set_scene", ["ct", 2000, 5]],
    ["romance", "Romantik", "set_scene", ["color", 0xff3366, 40]],
    ["pulse", "Nabız", "start_cf", [0, 0, "1000,1,16711680,100,1000,1,16711680,1"]],
  ];
  var yeelight = {
    id: "yeelight",
    label: "Yeelight",
    caps: ["switch", "brightness", "color", "colorTemp", "lightScene"],
    needsTcp: true,
    send: function (device, method, params) {
      var tcp = tcpBridge();
      if (!tcp) return Promise.reject(new Error("yeelight: TCP yalnızca masaüstü uygulamasında"));
      var blocked = lanAddressError(hostOnly(device));
      if (blocked) return Promise.reject(blocked);
      var line = JSON.stringify({ id: 1, method: method, params: params }) + "\r\n";
      return tcp({
        host: hostOnly(device),
        port: 55443,
        text: line,
        timeoutMs: scanTimeoutMs || DEFAULT_TIMEOUT_MS,
        untilNewline: true,
      }).then(function (resp) {
        var first = String(resp).split(/\r?\n/).filter(Boolean)[0] || "{}";
        var r = JSON.parse(first);
        if (r.error) throw new Error("yeelight: " + r.error.message);
        return r.result;
      });
    },
    probe: function (device) {
      return yeelight
        .send(device, "get_prop", ["power", "bright", "name", "model"])
        .then(function (r) {
          if (!Array.isArray(r)) throw new Error("yeelight: yanıt yok");
          return {
            protocol: "yeelight",
            model: "Yeelight " + (r[3] || ""),
            name: r[2] || "Yeelight",
            kind: "light",
            options: {
              scenes: YEELIGHT_SCENES.map(function (s) {
                return [s[0], s[1]];
              }),
            },
          };
        });
    },
    read: function (device) {
      return yeelight.send(device, "get_prop", ["power", "bright"]).then(function (r) {
        return { switch: r[0] === "on", brightness: Number(r[1]) || null };
      });
    },
    write: function (device, capability, value) {
      if (capability === "switch")
        return yeelight.send(device, "set_power", [value ? "on" : "off", "smooth", 300]);
      if (capability === "brightness")
        return yeelight.send(device, "set_bright", [Math.max(1, Math.round(value)), "smooth", 300]);
      if (capability === "color")
        return yeelight.send(device, "set_rgb", [
          parseInt(String(value).replace("#", ""), 16),
          "smooth",
          300,
        ]);
      if (capability === "colorTemp")
        return yeelight.send(device, "set_ct_abx", [toneKelvin(value), "smooth", 300]);
      // Yeelight set_scene ("ct" / "color") ve start_cf (renk akışı): Yeelight Inter-Operation Spec
      if (capability === "lightScene") {
        var scene = YEELIGHT_SCENES.filter(function (s) {
          return s[0] === value;
        })[0];
        if (!scene) return unsupported("yeelight", capability);
        return yeelight.send(device, scene[2], scene[3]);
      }
      return unsupported("yeelight", capability);
    },
  };

  // --- UDP köprüsü (yalnızca masaüstü uygulaması) — WiZ, LIFX, Govee --------------
  function udpBridge() {
    var d = desktopBridge();
    return d && typeof d.udp === "function" ? d.udp : null;
  }
  function udpSend(opts) {
    var udp = udpBridge();
    if (!udp) return Promise.reject(new Error("UDP yalnızca masaüstü uygulamasında"));
    var blocked = lanAddressError(opts.host);
    if (blocked) return Promise.reject(blocked);
    opts.timeoutMs = opts.timeoutMs || scanTimeoutMs || DEFAULT_TIMEOUT_MS;
    return Promise.resolve().then(function () {
      return udp(opts);
    });
  }

  // --- WiZ (UDP 38899, JSON) ----------------------------------------------------
  // WiZ yerleşik sahneleri (setPilot sceneId, WiZ yerel UDP API belgesindeki numaralandırma)
  var WIZ_SCENES = [
    [1, "Okyanus"],
    [2, "Romantik"],
    [3, "Gün batımı"],
    [4, "Parti"],
    [5, "Şömine"],
    [6, "Rahat"],
    [7, "Orman"],
    [8, "Pastel renkler"],
    [9, "Uyanış"],
    [10, "Yatma vakti"],
    [11, "Sıcak beyaz"],
    [12, "Gün ışığı"],
    [13, "Soğuk beyaz"],
    [14, "Gece lambası"],
    [15, "Odaklanma"],
    [16, "Dinlenme"],
    [18, "TV zamanı"],
    [19, "Bitki yetiştirme"],
    [20, "İlkbahar"],
    [21, "Yaz"],
    [22, "Sonbahar"],
    [23, "Derin dalış"],
    [24, "Cangıl"],
    [25, "Mojito"],
    [26, "Kulüp"],
    [27, "Noel"],
    [28, "Cadılar Bayramı"],
    [29, "Mum ışığı"],
    [30, "Altın beyaz"],
    [31, "Nabız"],
    [32, "Steampunk"],
  ];
  var wiz = {
    id: "wiz",
    label: "WiZ",
    caps: ["switch", "brightness", "color", "colorTemp", "lightScene"],
    needsUdp: true,
    call: function (device, method, params) {
      return udpSend({
        host: hostOnly(device),
        port: 38899,
        text: JSON.stringify({ id: 1, method: method, params: params || {} }),
      }).then(function (r) {
        var j = JSON.parse(r.text);
        if (j.error) throw new Error("wiz: " + (j.error.message || j.error.code));
        return j.result || {};
      });
    },
    probe: function (device) {
      return wiz.call(device, "getSystemConfig").then(function (r) {
        if (!r.mac && !r.moduleName) throw new Error("wiz: kimlik yok");
        return {
          protocol: "wiz",
          model: "WiZ " + (r.moduleName || ""),
          name:
            "WiZ " +
            String(r.mac || "")
              .slice(-4)
              .toUpperCase(),
          kind: "light",
          options: { scenes: WIZ_SCENES },
        };
      });
    },
    read: function (device) {
      return wiz.call(device, "getPilot").then(function (r) {
        return {
          switch: typeof r.state === "boolean" ? r.state : null,
          brightness: typeof r.dimming === "number" ? r.dimming : null,
        };
      });
    },
    write: function (device, capability, value) {
      if (capability === "switch") return wiz.call(device, "setPilot", { state: !!value });
      if (capability === "brightness")
        return wiz.call(device, "setPilot", {
          state: true,
          dimming: Math.max(10, Math.min(100, Math.round(value))),
        });
      if (capability === "color") {
        var c = hexToRgb(value);
        return wiz.call(device, "setPilot", { state: true, r: c[0], g: c[1], b: c[2] });
      }
      if (capability === "colorTemp")
        return wiz.call(device, "setPilot", { state: true, temp: toneKelvin(value) });
      if (capability === "lightScene") {
        var sid = Number(value);
        return WIZ_SCENES.some(function (s) {
          return s[0] === sid;
        })
          ? wiz.call(device, "setPilot", { state: true, sceneId: sid })
          : unsupported("wiz", capability);
      }
      return unsupported("wiz", capability);
    },
  };

  // --- LIFX (UDP 56700, ikili LAN protokolü) ----------------------------------------
  function lifxPacket(type, payload) {
    var size = 36 + payload.length;
    var b = new Array(size).fill(0);
    b[0] = size & 255;
    b[1] = (size >> 8) & 255;
    b[2] = 0x00;
    b[3] = 0x14; // protokol 1024 + addressable
    b[4] = 0x4e;
    b[5] = 0x58;
    b[6] = 0;
    b[7] = 0; // kaynak kimliği ("NX"), sıfırdan farklı olmalı
    b[22] = 0x01; // res_required
    b[32] = type & 255;
    b[33] = (type >> 8) & 255;
    for (var i = 0; i < payload.length; i++) b[36 + i] = payload[i];
    return b
      .map(function (x) {
        return (x < 16 ? "0" : "") + x.toString(16);
      })
      .join("");
  }
  function u16(n) {
    n = Math.max(0, Math.min(65535, Math.round(n)));
    return [n & 255, (n >> 8) & 255];
  }
  function u32(n) {
    return [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
  }
  function hexBytes(h) {
    var o = [];
    for (var i = 0; i + 1 < h.length; i += 2) o.push(parseInt(h.substr(i, 2), 16));
    return o;
  }
  function rgbToHsb(rgb) {
    var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255,
      mx = Math.max(r, g, b),
      mn = Math.min(r, g, b),
      d = mx - mn,
      h = 0;
    if (d) {
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h: h / 360, s: mx ? d / mx : 0, v: mx };
  }
  var lifx = {
    id: "lifx",
    label: "LIFX",
    caps: ["switch", "brightness", "color", "colorTemp"],
    needsUdp: true,
    call: function (device, type, payload) {
      return udpSend({
        host: hostOnly(device),
        port: 56700,
        hex: lifxPacket(type, payload || []),
      }).then(function (r) {
        return hexBytes(r.hex);
      });
    },
    state: function (device) {
      return lifx.call(device, 101).then(function (b) {
        var t = b[32] | (b[33] << 8);
        if (t !== 107 || b.length < 36 + 52) throw new Error("lifx: beklenmeyen yanıt");
        var p = 36,
          w = function (o) {
            return b[p + o] | (b[p + o + 1] << 8);
          };
        var label = "";
        for (var i = 0; i < 32 && b[p + 12 + i]; i++) label += String.fromCharCode(b[p + 12 + i]);
        return { hue: w(0), sat: w(2), bright: w(4), kelvin: w(6), power: w(10), label: label };
      });
    },
    probe: function (device) {
      return lifx.state(device).then(function (s) {
        return { protocol: "lifx", model: "LIFX", name: s.label || "LIFX", kind: "light" };
      });
    },
    read: function (device) {
      return lifx.state(device).then(function (s) {
        return { switch: s.power > 0, brightness: Math.round((s.bright / 65535) * 100) };
      });
    },
    write: function (device, capability, value) {
      if (capability === "switch")
        return lifx.call(device, 117, u16(value ? 65535 : 0).concat(u32(0)));
      return lifx.state(device).then(function (s) {
        var h = s.hue,
          sat = s.sat,
          br = s.bright,
          kelvin = s.kelvin || 3500;
        if (capability === "brightness") br = (Math.max(1, Math.min(100, value)) / 100) * 65535;
        else if (capability === "color") {
          var c = rgbToHsb(hexToRgb(value));
          h = c.h * 65535;
          sat = c.s * 65535;
          br = Math.max(c.v, 0.05) * 65535;
        } else if (capability === "colorTemp") {
          h = 0;
          sat = 0;
          kelvin = toneKelvin(value);
        } // doygunluk 0 = beyaz ışık, ton Kelvin ile
        else return unsupported("lifx", capability);
        return lifx.call(device, 102, [0].concat(u16(h), u16(sat), u16(br), u16(kelvin), u32(250)));
      });
    },
  };

  // --- Govee (UDP, "LAN Control" uygulamadan açık olmalı; yanıtlar 4002'ye gelir) ---
  var govee = {
    id: "govee",
    label: "Govee",
    caps: ["switch", "brightness", "color", "colorTemp"],
    needsUdp: true,
    ask: function (device, port, cmd, data) {
      return udpSend({
        host: hostOnly(device),
        port: port,
        replyPort: 4002,
        text: JSON.stringify({ msg: { cmd: cmd, data: data || {} } }),
      }).then(function (r) {
        var j = JSON.parse(r.text);
        return (j.msg && j.msg.data) || {};
      });
    },
    tell: function (device, cmd, data) {
      return udpSend({
        host: hostOnly(device),
        port: 4003,
        noReply: true,
        text: JSON.stringify({ msg: { cmd: cmd, data: data } }),
      });
    },
    probe: function (device) {
      return govee.ask(device, 4001, "scan", { account_topic: "reserve" }).then(function (d) {
        if (!d.sku && !d.device) throw new Error("govee: kimlik yok");
        return {
          protocol: "govee",
          model: "Govee " + (d.sku || ""),
          name: "Govee " + (d.sku || String(d.device || "").slice(-5)),
          kind: /^H508/i.test(d.sku || "") ? "plug" : "light",
        };
      });
    },
    read: function (device) {
      return govee.ask(device, 4003, "devStatus").then(function (d) {
        return {
          switch: d.onOff == null ? null : d.onOff === 1,
          brightness: typeof d.brightness === "number" ? d.brightness : null,
        };
      });
    },
    write: function (device, capability, value) {
      if (capability === "switch") return govee.tell(device, "turn", { value: value ? 1 : 0 });
      if (capability === "brightness")
        return govee.tell(device, "brightness", {
          value: Math.max(1, Math.min(100, Math.round(value))),
        });
      if (capability === "color") {
        var c = hexToRgb(value);
        return govee.tell(device, "colorwc", {
          color: { r: c[0], g: c[1], b: c[2] },
          colorTemInKelvin: 0,
        });
      }
      // Govee LAN API: colorwc içinde renk 0,0,0 + colorTemInKelvin → beyaz ton
      if (capability === "colorTemp")
        return govee.tell(device, "colorwc", {
          color: { r: 0, g: 0, b: 0 },
          colorTemInKelvin: toneKelvin(value),
        });
      return unsupported("govee", capability);
    },
  };

  // --- Sonoff DIY modu (HTTP 8081, eWeLink DIY arayüzü) ----------------------------
  var sonoff = {
    id: "sonoff",
    label: "Sonoff (DIY)",
    caps: ["switch", "powerOn"],
    call: function (device, path, data) {
      return sendJson("http://" + hostOnly(device) + ":8081/zeroconf/" + path, "POST", {
        deviceid: "",
        data: data || {},
      }).then(function (j) {
        if (!j || j.error !== 0) throw new Error("sonoff: hata " + (j && j.error));
        return j.data || {};
      });
    },
    probe: function (device) {
      return sonoff.call(device, "info").then(function (d) {
        if (!d.switch && !(d.switches && d.switches.length)) throw new Error("sonoff: kimlik yok");
        return {
          protocol: "sonoff",
          model: "Sonoff DIY",
          name: "Sonoff " + String(d.deviceid || "").slice(-4),
          kind: "switch",
          channels: d.switches && d.switches.length > 1 ? d.switches.length : 1,
        };
      });
    },
    read: function (device) {
      return sonoff.call(device, "info").then(function (d) {
        // Çok kanallı modeller: info.switches[{switch, outlet}]
        var ch = d.switches && d.switches.length > 1 ? d.switches[device.endpointId || 0] : null;
        return {
          switch: ch ? ch.switch === "on" : d.switch ? d.switch === "on" : null,
          powerOn: d.startup ? (d.startup === "stay" ? "last" : d.startup) : undefined,
        };
      });
    },
    write: function (device, capability, value) {
      // eWeLink DIY API: /zeroconf/startup → "on" | "off" | "stay" (son durum)
      if (capability === "powerOn")
        return sonoff.call(device, "startup", {
          startup: value === "on" ? "on" : value === "off" ? "off" : "stay",
        });
      // Çok kanallı: /zeroconf/switches {switches:[{switch, outlet}]}; endpointId kanal numarasıdır
      if (capability === "switch" && device.channels > 1)
        return sonoff.call(device, "switches", {
          switches: [{ switch: value ? "on" : "off", outlet: device.endpointId || 0 }],
        });
      if (capability === "switch")
        return sonoff.call(device, "switch", { switch: value ? "on" : "off" });
      return unsupported("sonoff", capability);
    },
  };

  // --- Güvenli yerel protokoller: Tuya (LAN 3.3 / 3.4) ve TP-Link Tapo (KLAP / securePassthrough) ---
  // UYARI (CLAUDE.md kural 1-2): bu iki bağlayıcı yayımlanmış protokol belgelerine (tinytuya, python-kasa)
  // göre yazıldı; paket/şifreleme biçimi testlerle doğrulanır ama GERÇEK CİHAZLA DENENMEDİ. Kimlik bilgisi /
  // yerel anahtar yoksa, köprü yoksa ya da cihaz yanıt vermezse hata döner; asla "gitti" gibi gösterilmez.
  // Gizli bilgiler (Tapo hesap e-postası+şifresi, Tuya yerel anahtarı) cihaz kaydına DEĞİL, yalnızca bu cihazın
  // yerel deposundaki "nexusLanSecrets" anahtarına yazılır; buluta (cloud-sync) hiç gitmez.

  function toU8(a) {
    return a instanceof Uint8Array ? a : new Uint8Array(a || []);
  }
  function cat() {
    var parts = [],
      n = 0,
      i;
    for (i = 0; i < arguments.length; i++) {
      var p = arguments[i];
      p = typeof p === "string" ? new Uint8Array(utf8Bytes(p)) : toU8(p);
      parts.push(p);
      n += p.length;
    }
    var out = new Uint8Array(n),
      o = 0;
    parts.forEach(function (p) {
      out.set(p, o);
      o += p.length;
    });
    return out;
  }
  function strBytes(s) {
    return new Uint8Array(utf8Bytes(String(s)));
  }
  function bytesEq(a, b) {
    a = toU8(a);
    b = toU8(b);
    if (a.length !== b.length) return false;
    var d = 0;
    for (var i = 0; i < a.length; i++) d |= a[i] ^ b[i];
    return d === 0;
  }
  function toHex(u8) {
    return Array.prototype.map
      .call(toU8(u8), function (x) {
        return (x < 16 ? "0" : "") + x.toString(16);
      })
      .join("");
  }
  function b64enc(u8) {
    var s = "";
    u8 = toU8(u8);
    for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return btoa(s);
  }
  function b64dec(str) {
    var s = atob(String(str).replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, ""));
    var out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  function u32be(n) {
    return new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
  }
  function readU32(u8, o) {
    return ((u8[o] << 24) | (u8[o + 1] << 16) | (u8[o + 2] << 8) | u8[o + 3]) >>> 0;
  }
  function randomBytes(n) {
    var c = subtleApi(),
      out = new Uint8Array(n);
    if (!c) throw new Error("güvenli rastgele sayı üreteci bu ortamda yok");
    c.getRandomValues(out);
    return out;
  }
  function bareHost(h) {
    return String(h || "")
      .trim()
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      .split(":")[0];
  }
  function secureError(message, code) {
    var e = new Error(message);
    if (code) e.code = code;
    return e;
  }

  function subtleApi() {
    var c =
      (typeof crypto !== "undefined" && crypto) || (typeof window !== "undefined" && window.crypto);
    return c && c.subtle ? c : null;
  }
  function needSubtle() {
    var c = subtleApi();
    return c
      ? Promise.resolve(c.subtle)
      : Promise.reject(secureError("Güvenli şifreleme bu ortamda kullanılamıyor.", "no-crypto"));
  }
  function digest(alg, data) {
    return needSubtle()
      .then(function (s) {
        return s.digest(alg, toU8(data));
      })
      .then(toU8);
  }
  function sha1(d) {
    return digest("SHA-1", d);
  }
  function sha256(d) {
    return digest("SHA-256", d);
  }
  function hmac256(key, data) {
    return needSubtle()
      .then(function (s) {
        return s
          .importKey("raw", toU8(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
          .then(function (k) {
            return s.sign("HMAC", k, toU8(data));
          });
      })
      .then(toU8);
  }
  // AES-CBC + PKCS7 (WebCrypto uygular): KLAP ve securePassthrough
  function aesCbc(mode, key, iv, data) {
    return needSubtle()
      .then(function (s) {
        return s.importKey("raw", toU8(key), { name: "AES-CBC" }, false, [mode]).then(function (k) {
          return s[mode]({ name: "AES-CBC", iv: toU8(iv) }, k, toU8(data));
        });
      })
      .then(toU8);
  }

  // CRC-32 (IEEE) — Tuya 3.3 çerçeve sağlaması
  var CRC_TABLE = (function () {
    var t = [];
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(data) {
    data = toU8(data);
    var c = 0xffffffff;
    for (var i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  // AES-128 ECB (WebCrypto ECB desteklemez; Tuya yerel anahtarı 16 bayttır). FIPS-197'ye göre; testte Node crypto ile çapraz doğrulanır.
  var SBOX = [],
    INV_SBOX = [];
  (function () {
    var p = 1,
      q = 1,
      i;
    function rotl8(x, s) {
      return ((x << s) | (x >> (8 - s))) & 255;
    }
    do {
      p = (p ^ (p << 1) ^ (p & 0x80 ? 0x11b : 0)) & 255;
      q ^= (q << 1) & 255;
      q ^= (q << 2) & 255;
      q ^= (q << 4) & 255;
      if (q & 0x80) q ^= 0x09;
      SBOX[p] = (q ^ rotl8(q, 1) ^ rotl8(q, 2) ^ rotl8(q, 3) ^ rotl8(q, 4) ^ 0x63) & 255;
    } while (p !== 1);
    SBOX[0] = 0x63;
    for (i = 0; i < 256; i++) INV_SBOX[SBOX[i]] = i;
  })();
  function xtime(a) {
    a <<= 1;
    return (a & 0x100 ? a ^ 0x11b : a) & 255;
  }
  function gmul(a, b) {
    var r = 0;
    while (b) {
      if (b & 1) r ^= a;
      a = xtime(a);
      b >>= 1;
    }
    return r;
  }
  function aesExpandKey(key) {
    key = toU8(key);
    if (key.length !== 16) throw secureError("AES anahtarı 16 bayt olmalı.", "bad-key");
    var w = new Uint8Array(176),
      rcon = 1,
      i,
      j;
    w.set(key);
    for (i = 16; i < 176; i += 4) {
      var t = [w[i - 4], w[i - 3], w[i - 2], w[i - 1]];
      if (i % 16 === 0) {
        t = [SBOX[t[1]] ^ rcon, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]];
        rcon = xtime(rcon);
      }
      for (j = 0; j < 4; j++) w[i + j] = w[i - 16 + j] ^ t[j];
    }
    return w;
  }
  function addRoundKey(s, rk, r) {
    for (var i = 0; i < 16; i++) s[i] ^= rk[r * 16 + i];
  }
  function shiftRows(s, inv) {
    var t = s.slice();
    for (var c = 0; c < 4; c++)
      for (var r = 0; r < 4; r++) {
        if (inv) s[r + 4 * ((c + r) % 4)] = t[r + 4 * c];
        else s[r + 4 * c] = t[r + 4 * ((c + r) % 4)];
      }
  }
  function mixColumns(s, inv) {
    var m = inv ? [14, 11, 13, 9] : [2, 3, 1, 1];
    for (var c = 0; c < 4; c++) {
      var a = [s[4 * c], s[4 * c + 1], s[4 * c + 2], s[4 * c + 3]];
      for (var r = 0; r < 4; r++) {
        s[4 * c + r] =
          gmul(a[0], m[(4 - r) % 4]) ^
          gmul(a[1], m[(5 - r) % 4]) ^
          gmul(a[2], m[(6 - r) % 4]) ^
          gmul(a[3], m[(7 - r) % 4]);
      }
    }
  }
  function aesBlock(rk, block, decrypt) {
    var s = Array.prototype.slice.call(block),
      r,
      i;
    if (!decrypt) {
      addRoundKey(s, rk, 0);
      for (r = 1; r <= 10; r++) {
        for (i = 0; i < 16; i++) s[i] = SBOX[s[i]];
        shiftRows(s, false);
        if (r < 10) mixColumns(s, false);
        addRoundKey(s, rk, r);
      }
    } else {
      addRoundKey(s, rk, 10);
      for (r = 9; r >= 0; r--) {
        shiftRows(s, true);
        for (i = 0; i < 16; i++) s[i] = INV_SBOX[s[i]];
        addRoundKey(s, rk, r);
        if (r > 0) mixColumns(s, true);
      }
    }
    return s;
  }
  function aesEcbEncrypt(key, data, noPad) {
    var rk = aesExpandKey(key),
      d = toU8(data),
      out;
    if (noPad) {
      if (d.length % 16) throw secureError("AES bloğu 16 baytın katı olmalı.", "bad-block");
    } else {
      var pad = 16 - (d.length % 16);
      d = cat(d, new Uint8Array(pad).fill(pad));
    }
    out = new Uint8Array(d.length);
    for (var o = 0; o < d.length; o += 16) out.set(aesBlock(rk, d.subarray(o, o + 16), false), o);
    return out;
  }
  // PKCS7 payı geçerliyse atılır; değilse veri olduğu gibi döner (Tuya 3.4 oturum yanıtı payı belirsiz kalabilir).
  function aesEcbDecrypt(key, data) {
    var rk = aesExpandKey(key),
      d = toU8(data);
    if (!d.length || d.length % 16)
      throw secureError("Şifreli veri uzunluğu geçersiz.", "bad-block");
    var out = new Uint8Array(d.length);
    for (var o = 0; o < d.length; o += 16) out.set(aesBlock(rk, d.subarray(o, o + 16), true), o);
    var n = out[out.length - 1],
      ok = n >= 1 && n <= 16 && n <= out.length;
    for (var i = 0; ok && i < n; i++) if (out[out.length - 1 - i] !== n) ok = false;
    return ok ? out.slice(0, out.length - n) : out;
  }

  // --- gizli bilgi deposu (bu cihaza özel, buluta gitmez) ----------------------------------------
  var SECRET_KEY = "nexusLanSecrets";
  function readSecrets() {
    try {
      var raw =
        typeof window.nexusGetItem === "function"
          ? window.nexusGetItem(SECRET_KEY)
          : localStorage.getItem(SECRET_KEY);
      var all = JSON.parse(raw || "{}");
      return all && typeof all === "object" ? all : {};
    } catch (e) {
      return {};
    }
  }
  function writeSecrets(all) {
    try {
      var raw = JSON.stringify(all);
      if (typeof window.nexusSetItem === "function") window.nexusSetItem(SECRET_KEY, raw);
      else localStorage.setItem(SECRET_KEY, raw);
      return true;
    } catch (e) {
      return false;
    }
  }
  function secretsFor(device) {
    if (device && device.lanSecret) return device.lanSecret; // yalnızca bellek içi çağrılar (eşleştirme doğrulaması)
    var all = readSecrets();
    return (device && device.id && all[device.id]) || null;
  }
  var secrets = {
    get: function (id) {
      return readSecrets()[id] || null;
    },
    set: function (id, obj) {
      var all = readSecrets();
      all[id] = Object.assign({}, all[id] || {}, obj);
      return writeSecrets(all);
    },
    remove: function (id) {
      var all = readSecrets();
      delete all[id];
      return writeSecrets(all);
    },
  };

  // --- köprü yetenekleri ---------------------------------------------------------------------------
  function binBridge() {
    var d = desktopBridge();
    return d && d.binaryHttp === true ? d : null;
  }
  function tcpSessionBridge() {
    var d = desktopBridge();
    return d &&
      d.tcpSession &&
      typeof d.tcpSession.open === "function" &&
      typeof d.tcpSession.exchange === "function"
      ? d.tcpSession
      : null;
  }
  var SECURE_TIMEOUT_MS = 4000;

  // =================================== TUYA ===================================
  var TUYA_CMD = {
    SESS_START: 3,
    SESS_RESP: 4,
    SESS_FIN: 5,
    CONTROL: 7,
    STATUS: 8,
    DP_QUERY: 10,
    CONTROL_NEW: 13,
    DP_QUERY_NEW: 16,
  };
  var TUYA_NO_HEADER = [9, 10, 16, 18, 3, 4, 5];
  var TUYA_PREFIX = 0x000055aa,
    TUYA_SUFFIX = 0x0000aa55;
  function tuyaVersionHeader(v) {
    return cat(v, new Uint8Array(12));
  }

  // payload: bayt dizisi (düz). 3.3: AES-ECB + CRC32; 3.4: AES-ECB + HMAC-SHA256 (tinytuya ile aynı).
  function tuyaEncode(version, cmd, seq, payload, key) {
    var withHeader = TUYA_NO_HEADER.indexOf(cmd) === -1;
    try {
      if (version === "3.3") {
        var enc = aesEcbEncrypt(key, payload);
        var body = withHeader ? cat(tuyaVersionHeader("3.3"), enc) : enc;
        var pre = cat(u32be(TUYA_PREFIX), u32be(seq), u32be(cmd), u32be(body.length + 8), body);
        return Promise.resolve(cat(pre, u32be(crc32(pre)), u32be(TUYA_SUFFIX)));
      }
      var plain = withHeader ? cat(tuyaVersionHeader("3.4"), payload) : toU8(payload);
      var enc4 = aesEcbEncrypt(key, plain);
      var pre4 = cat(u32be(TUYA_PREFIX), u32be(seq), u32be(cmd), u32be(enc4.length + 36), enc4);
      return hmac256(key, pre4).then(function (h) {
        return cat(pre4, h, u32be(TUYA_SUFFIX));
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // Cihazdan gelen tek çerçeveyi doğrular ve çözer → { seq, cmd, retcode, data(bayt) }
  function tuyaDecode(version, frame, key) {
    var f = toU8(frame),
      trailer = version === "3.4" ? 36 : 8;
    if (f.length < 16 + trailer || readU32(f, 0) !== TUYA_PREFIX)
      return Promise.reject(secureError("Tuya yanıtı geçersiz.", "bad-frame"));
    var total = 16 + readU32(f, 12);
    if (total !== f.length || readU32(f, total - 4) !== TUYA_SUFFIX)
      return Promise.reject(secureError("Tuya yanıtı eksik ya da bozuk.", "bad-frame"));
    var signed = f.subarray(0, total - trailer),
      sig = f.subarray(total - trailer, total - 4);
    var body = f.subarray(16, total - trailer);
    var verified =
      version === "3.4"
        ? hmac256(key, signed).then(function (h) {
            return bytesEq(h, sig);
          })
        : Promise.resolve(crc32(signed) === readU32(sig, 0));
    return verified.then(function (ok) {
      if (!ok)
        throw secureError(
          "Tuya yanıtının doğrulama değeri tutmuyor (yerel anahtar ya da sürüm yanlış olabilir).",
          "bad-mac",
        );
      var retcode = 0;
      if (body.length >= 4 && (readU32(body, 0) & 0xffffff00) === 0) {
        retcode = readU32(body, 0);
        body = body.subarray(4);
      }
      var data = new Uint8Array(0);
      if (version === "3.3") {
        if (body.length >= 15 && body[0] === 0x33 && body[1] === 0x2e && body[2] === 0x33)
          body = body.subarray(15);
        if (body.length) data = aesEcbDecrypt(key, body);
      } else if (body.length) {
        data = aesEcbDecrypt(key, body);
        if (data.length >= 15 && data[0] === 0x33 && data[1] === 0x2e && data[2] === 0x34)
          data = data.subarray(15);
      }
      return { seq: readU32(f, 4), cmd: readU32(f, 8), retcode: retcode, data: data };
    });
  }

  // 3.4 oturum anahtarı: yerel anahtarla nonce değişimi → oturum anahtarı = AES-ECB(yerel anahtar, yerelNonce XOR uzakNonce)
  function tuyaNegotiate(xchg, key) {
    var localNonce = randomBytes(16);
    return xchg("3.4", key, TUYA_CMD.SESS_START, localNonce, [TUYA_CMD.SESS_RESP])
      .then(function (frame) {
        return tuyaDecode("3.4", frame, key);
      })
      .then(function (r) {
        if (r.data.length < 48)
          throw secureError("Tuya oturum anahtarı yanıtı geçersiz.", "bad-frame");
        var remoteNonce = r.data.slice(0, 16),
          remoteMac = r.data.slice(16, 48);
        return hmac256(key, localNonce)
          .then(function (h) {
            if (!bytesEq(h, remoteMac))
              throw secureError(
                "Tuya yerel anahtarı yanlış görünüyor (oturum doğrulanamadı).",
                "bad-key",
              );
            return hmac256(key, remoteNonce);
          })
          .then(function (fin) {
            return xchg("3.4", key, TUYA_CMD.SESS_FIN, fin, null);
          })
          .then(function () {
            var x = new Uint8Array(16);
            for (var i = 0; i < 16; i++) x[i] = localNonce[i] ^ remoteNonce[i];
            return aesEcbEncrypt(key, x, true);
          });
      });
  }

  function tuyaSessionOpen(host) {
    var b = tcpSessionBridge();
    if (!b)
      return Promise.reject(
        secureError("Tuya yerel kontrolü yalnızca masaüstü uygulamasında çalışır.", "no-bridge"),
      );
    var blocked = lanAddressError(host);
    if (blocked) return Promise.reject(blocked);
    return Promise.resolve(b.open({ host: host, port: 6668, timeoutMs: SECURE_TIMEOUT_MS })).then(
      function (id) {
        return {
          exchange: function (frame, reply) {
            return Promise.resolve(
              b.exchange(
                reply
                  ? {
                      id: id,
                      bytes: Array.from(frame),
                      untilCmd: reply,
                      timeoutMs: SECURE_TIMEOUT_MS,
                    }
                  : { id: id, bytes: Array.from(frame), noReply: true },
              ),
            ).then(toU8);
          },
          close: function () {
            try {
              return Promise.resolve(b.close(id)).catch(function () {});
            } catch (e) {
              return Promise.resolve();
            }
          },
        };
      },
    );
  }

  // kind: "query" | "control" → çözülmüş JSON ({dps:…} ya da onay)
  function tuyaRun(host, creds, kind, dps) {
    var v = creds.version === "3.4" ? "3.4" : "3.3";
    if (creds.version && creds.version !== "3.3" && creds.version !== "3.4") {
      return Promise.reject(
        secureError(
          "Tuya protokol sürümü " + creds.version + " desteklenmiyor (yalnızca 3.3 ve 3.4).",
          "bad-version",
        ),
      );
    }
    var id = String(creds.id),
      key = strBytes(creds.key),
      seq = 0,
      ts = String(Math.floor(Date.now() / 1000));
    if (key.length !== 16)
      return Promise.reject(secureError("Tuya yerel anahtarı 16 karakter olmalı.", "bad-key"));
    return tuyaSessionOpen(host).then(function (s) {
      function xchg(version, k, cmd, payload, reply) {
        seq += 1;
        return tuyaEncode(version, cmd, seq, payload, k).then(function (frame) {
          return s.exchange(frame, reply);
        });
      }
      var ready = v === "3.3" ? Promise.resolve(key) : tuyaNegotiate(xchg, key);
      return ready
        .then(function (sessKey) {
          var cmd, body, reply;
          if (kind === "query") {
            cmd = v === "3.3" ? TUYA_CMD.DP_QUERY : TUYA_CMD.DP_QUERY_NEW;
            // tinytuya yük şablonları: 3.3 DP_QUERY {gwId, devId}; 3.4 DP_QUERY_NEW (0x10) boş nesne {} ile sorulur
            body = v === "3.3" ? { gwId: id, devId: id } : {};
            reply = [cmd];
          } else if (v === "3.3") {
            cmd = TUYA_CMD.CONTROL;
            body = { devId: id, uid: id, t: ts, dps: dps };
            reply = [TUYA_CMD.CONTROL, TUYA_CMD.STATUS];
          } else {
            cmd = TUYA_CMD.CONTROL_NEW;
            body = {
              data: { ctype: 0, devId: id, gwId: id, uid: id, dps: dps },
              protocol: 5,
              t: Number(ts),
            };
            reply = [cmd];
          }
          return xchg(v, sessKey, cmd, strBytes(JSON.stringify(body)), reply).then(
            function (frame) {
              return tuyaDecode(v, frame, sessKey);
            },
          );
        })
        .then(function (r) {
          if (r.retcode !== 0)
            throw secureError("Tuya cihazı komutu reddetti (kod " + r.retcode + ").", "rejected");
          if (!r.data.length) return {};
          var text = utf8String(Array.from(r.data));
          try {
            return JSON.parse(text);
          } catch (e) {
            throw secureError("Tuya yanıtı çözülemedi — yerel anahtar yanlış olabilir.", "bad-key");
          }
        })
        .then(
          function (out) {
            return s.close().then(function () {
              return out;
            });
          },
          function (err) {
            return s.close().then(function () {
              throw err;
            });
          },
        );
    });
  }

  // Standart Tuya veri noktaları (DP): ampul "20" (açık), "22" (parlaklık 10-1000), "24" (HSV, 12 onaltılık); priz/anahtar "1".
  // Cihazın gerçekte bildirdiği noktalara bakılır; olmayan işlev yetenek olarak eklenmez.
  function tuyaMapFromDps(dps) {
    dps = dps || {};
    var m = {};
    // Ampul tipleri (tinytuya belgesi): tip B = DP 20 anahtar, 21 mod, 22 parlaklık (10–1000), 23 beyaz tonu, 24 renk (hhhhssssvvvv, 12 hane);
    // tip A (eski) = DP 1 anahtar, 2 mod, 3 parlaklık (25–255), 4 beyaz tonu, 5 renk (rrggbbhhhhssvv, 14 hane).
    if (typeof dps["20"] === "boolean") {
      m.switch = "20";
      m.kind = "light";
      m.scale = 1000;
      m.min = 10;
      if (typeof dps["22"] === "number") m.brightness = "22";
      if (typeof dps["24"] === "string" && /^[0-9a-f]{12}$/i.test(dps["24"])) {
        m.color = "24";
        m.mode = "21";
        m.format = "hsv";
      }
    } else if (
      typeof dps["1"] === "boolean" &&
      typeof dps["2"] === "string" &&
      /^(white|colour|scene|music)$/.test(dps["2"]) &&
      typeof dps["3"] === "number"
    ) {
      m.switch = "1";
      m.kind = "light";
      m.scale = 255;
      m.min = 25;
      m.brightness = "3";
      if (typeof dps["5"] === "string" && /^[0-9a-f]{14}$/i.test(dps["5"])) {
        m.color = "5";
        m.mode = "2";
        m.format = "rgbhsv";
      }
    } else if (typeof dps["1"] === "boolean") {
      m.switch = "1";
      m.kind = "plug";
    } else {
      return null;
    }
    return m;
  }
  function tuyaCapsFromMap(m) {
    return ["switch"].concat(m.brightness ? ["brightness"] : [], m.color ? ["color"] : []);
  }
  function tuyaDpsOf(resp) {
    return (resp && (resp.dps || (resp.data && resp.data.dps))) || null;
  }
  function tuyaCredsFor(device) {
    var s = secretsFor(device);
    if (!s || !s.tuyaId || !s.tuyaKey) return null;
    return {
      id: s.tuyaId,
      key: s.tuyaKey,
      version: s.tuyaVersion || "3.3",
      map: s.tuyaMap || null,
    };
  }
  function tuyaMissing() {
    return Promise.reject(
      secureError(
        "Bu Tuya cihazının yerel anahtarı bu cihazda kayıtlı değil. Cihazı yeniden ekle.",
        "no-secret",
      ),
    );
  }

  function tuyaHex(n, width) {
    var s = Math.round(n).toString(16);
    while (s.length < width) s = "0" + s;
    return s;
  }
  // Tip B: hhhh ssss vvvv (h 0–360, s ve v 0–1000)
  function tuyaHsv(hex) {
    var hsb = rgbToHsb(hexToRgb(hex));
    return tuyaHex(hsb.h * 360, 4) + tuyaHex(hsb.s * 1000, 4) + tuyaHex(hsb.v * 1000, 4);
  }
  // Tip A: rrggbb hhhh ss vv (h 0–360, s ve v 0–255)
  function tuyaRgbHsv(hex) {
    var rgb = hexToRgb(hex),
      hsb = rgbToHsb(rgb);
    return (
      tuyaHex(rgb[0], 2) +
      tuyaHex(rgb[1], 2) +
      tuyaHex(rgb[2], 2) +
      tuyaHex(hsb.h * 360, 4) +
      tuyaHex(hsb.s * 255, 2) +
      tuyaHex(hsb.v * 255, 2)
    );
  }

  var tuyaLocal = {
    id: "tuya-local",
    label: "Tuya (Yerel)",
    caps: ["switch", "brightness", "color"],
    needsTcpSession: true,
    discoverable: false, // yerel anahtar olmadan tanınamaz; yalnızca anahtar girilerek eklenir
    // Eşleştirme: IP + cihaz kimliği + yerel anahtar + sürüm ile durumu sorar; yanıt çözülemezse eklenmez.
    verify: function (host, creds) {
      host = bareHost(host);
      return tuyaRun(host, creds, "query").then(function (resp) {
        var dps = tuyaDpsOf(resp);
        var m = dps && tuyaMapFromDps(dps);
        if (!m)
          throw secureError(
            "Cihaz yanıt verdi ama anahtar ya da ampul veri noktası bulunamadı (desteklenen: priz/anahtar/ampul).",
            "unsupported-dps",
          );
        return {
          host: host,
          protocol: "tuya-local",
          model: "Tuya " + (m.kind === "light" ? "Ampul" : "Priz / Anahtar"),
          name: "Tuya " + (m.kind === "light" ? "Ampul" : "Priz"),
          kind: m.kind,
          caps: tuyaCapsFromMap(m),
          secret: { tuyaId: creds.id, tuyaKey: creds.key, tuyaVersion: creds.version, tuyaMap: m },
        };
      });
    },
    probe: function () {
      return Promise.reject(secureError("tuya-local: yerel anahtar gerekli", "no-secret"));
    },
    read: function (device) {
      var c = tuyaCredsFor(device);
      if (!c) return tuyaMissing();
      return tuyaRun(hostOnly(device), c, "query").then(function (resp) {
        var dps = tuyaDpsOf(resp);
        if (!dps) throw secureError("Tuya cihazı durum bilgisi vermedi.", "no-dps");
        var m = c.map || tuyaMapFromDps(dps) || {};
        var sw = m.switch ? dps[m.switch] : null,
          br = m.brightness ? dps[m.brightness] : null;
        return {
          switch: typeof sw === "boolean" ? sw : null,
          brightness:
            typeof br === "number"
              ? Math.max(1, Math.min(100, Math.round((br / (m.scale || 1000)) * 100)))
              : null,
        };
      });
    },
    write: function (device, capability, value) {
      var c = tuyaCredsFor(device);
      if (!c) return tuyaMissing();
      var m = c.map;
      if (!m || !m[capability]) return unsupported("tuya-local", capability);
      var dps = {};
      if (capability === "switch") dps[m.switch] = !!value;
      else if (capability === "brightness") {
        var scale = m.scale || 1000,
          lo = m.min || 10;
        dps[m.brightness] = Math.max(
          lo,
          Math.min(scale, Math.round((Number(value) / 100) * scale)),
        );
      } else if (capability === "color") {
        dps[m.mode] = "colour";
        dps[m.color] = m.format === "rgbhsv" ? tuyaRgbHsv(value) : tuyaHsv(value);
      } else return unsupported("tuya-local", capability);
      return tuyaRun(hostOnly(device), c, "control", dps);
    },
  };

  // =================================== TAPO ===================================
  function binHttp(url, method, bytes, headers) {
    var d = binBridge();
    if (!d)
      return Promise.reject(
        secureError("Tapo yerel kontrolü yalnızca masaüstü uygulamasında çalışır.", "no-bridge"),
      );
    var blocked = lanAddressError(url);
    if (blocked) return Promise.reject(blocked);
    return Promise.resolve(
      d.http({
        url: url,
        method: method || "POST",
        headers: headers || {},
        bodyBytes: bytes ? Array.from(bytes) : undefined,
        binary: true,
        timeoutMs: SECURE_TIMEOUT_MS,
      }),
    ).then(function (r) {
      return { status: r.status, bytes: toU8(r.bytes || []), headers: r.headers || {} };
    });
  }
  function sessionCookie(headers) {
    var sc = headers && (headers["set-cookie"] || headers["Set-Cookie"]);
    var list = Array.isArray(sc) ? sc : sc ? [sc] : [];
    for (var i = 0; i < list.length; i++) {
      var m = /TP_SESSIONID=[^;\s]+/.exec(list[i]);
      if (m) return m[0];
    }
    return "";
  }
  function tapoCreds(device) {
    var s = secretsFor(device);
    return s && s.tapoUser && s.tapoPass
      ? { user: String(s.tapoUser), pass: String(s.tapoPass) }
      : null;
  }

  // --- KLAP (python-kasa klaptransport.py): el sıkışma 1/2, sonra AES-CBC + SHA-256 imzalı /app/request ---
  function klapAuthHash(creds) {
    return Promise.all([sha1(strBytes(creds.user)), sha1(strBytes(creds.pass))]).then(function (h) {
      return sha256(cat(h[0], h[1]));
    });
  }
  function klapDerive(localSeed, remoteSeed, authHash) {
    var base = cat(localSeed, remoteSeed, authHash);
    return Promise.all([
      sha256(cat("lsk", base)),
      sha256(cat("iv", base)),
      sha256(cat("ldk", base)),
    ]).then(function (h) {
      var ivSeq = h[1],
        dv = new DataView(ivSeq.buffer, ivSeq.byteOffset, ivSeq.byteLength);
      return {
        key: h[0].slice(0, 16),
        iv: ivSeq.slice(0, 12),
        seq: dv.getInt32(28, false),
        sig: h[2].slice(0, 28),
      };
    });
  }
  function klapHandshake(host, creds) {
    var base = "http://" + host,
      localSeed = randomBytes(16);
    return binHttp(base + "/app/handshake1", "POST", localSeed, {
      "Content-Type": "application/octet-stream",
    }).then(function (r1) {
      if (r1.status !== 200 || r1.bytes.length !== 48)
        throw secureError(
          "Tapo KLAP el sıkışması yanıtlanmadı (http " + r1.status + ").",
          "handshake",
        );
      var remoteSeed = r1.bytes.slice(0, 16),
        serverHash = r1.bytes.slice(16),
        cookie = sessionCookie(r1.headers);
      return klapAuthHash(creds).then(function (auth) {
        return sha256(cat(localSeed, remoteSeed, auth))
          .then(function (expected) {
            if (!bytesEq(expected, serverHash))
              throw secureError(
                "Tapo hesabı e-postası ya da şifresi cihaz tarafından kabul edilmedi.",
                "auth",
              );
            return sha256(cat(remoteSeed, localSeed, auth));
          })
          .then(function (proof) {
            var headers = { "Content-Type": "application/octet-stream" };
            if (cookie) headers.Cookie = cookie;
            return binHttp(base + "/app/handshake2", "POST", proof, headers);
          })
          .then(function (r2) {
            if (r2.status !== 200)
              throw secureError(
                "Tapo KLAP el sıkışması tamamlanamadı (http " + r2.status + ").",
                "handshake",
              );
            return klapDerive(localSeed, remoteSeed, auth);
          })
          .then(function (k) {
            k.type = "klap";
            k.cookie = cookie;
            k.base = base;
            return k;
          });
      });
    });
  }
  function klapRequest(sess, json) {
    sess.seq = (sess.seq + 1) | 0;
    var seqBytes = new Uint8Array(4);
    new DataView(seqBytes.buffer).setInt32(0, sess.seq, false);
    var iv = cat(sess.iv, seqBytes);
    return aesCbc("encrypt", sess.key, iv, strBytes(json))
      .then(function (cipher) {
        return sha256(cat(sess.sig, seqBytes, cipher)).then(function (sig) {
          var headers = { "Content-Type": "application/octet-stream" };
          if (sess.cookie) headers.Cookie = sess.cookie;
          return binHttp(
            sess.base + "/app/request?seq=" + sess.seq,
            "POST",
            cat(sig, cipher),
            headers,
          );
        });
      })
      .then(function (r) {
        if (r.status !== 200)
          throw secureError(
            "Tapo isteği reddedildi (http " + r.status + ").",
            r.status === 403 ? "session" : "http",
          );
        if (r.bytes.length <= 32) throw secureError("Tapo yanıtı boş.", "session");
        return aesCbc("decrypt", sess.key, iv, r.bytes.slice(32));
      })
      .then(function (plain) {
        return utf8String(Array.from(plain));
      });
  }

  // --- securePassthrough (eski yazılımlar): RSA-1024 el sıkışması + AES-CBC, JSON /app ---
  // WebCrypto RSAES-PKCS1-v1_5 çözmeyi desteklemez: anahtar çifti RSA-OAEP olarak üretilir, özel anahtar JWK'dan
  // alınıp çözme BigInt ile yapılır (PKCS#1 v1.5 tipi 2 dolgusu elle ayıklanır).
  function bigFromBytes(u8) {
    var hex = toHex(u8);
    return BigInt("0x" + (hex || "0"));
  }
  function modPow(b, e, m) {
    var r = BigInt(1),
      zero = BigInt(0),
      one = BigInt(1),
      two = BigInt(2);
    b = b % m;
    while (e > zero) {
      if (e % two === one) r = (r * b) % m;
      e = e / two;
      b = (b * b) % m;
    }
    return r;
  }
  function rsaPkcs1Decrypt(jwk, cipher) {
    var n = bigFromBytes(b64dec(jwk.n)),
      d = bigFromBytes(b64dec(jwk.d)),
      k = b64dec(jwk.n).length;
    var hex = modPow(bigFromBytes(cipher), d, n).toString(16);
    while (hex.length < k * 2) hex = "0" + hex;
    var em = new Uint8Array(k);
    for (var i = 0; i < k; i++) em[i] = parseInt(hex.substr(i * 2, 2), 16);
    if (em[0] !== 0 || em[1] !== 2) throw secureError("Tapo el sıkışması çözülemedi.", "handshake");
    var z = 2;
    while (z < k && em[z] !== 0) z++;
    return em.slice(z + 1);
  }
  function pemFromSpki(spki) {
    var b = b64enc(spki),
      lines = [];
    for (var i = 0; i < b.length; i += 64) lines.push(b.substr(i, 64));
    return "-----BEGIN PUBLIC KEY-----\n" + lines.join("\n") + "\n-----END PUBLIC KEY-----\n";
  }
  function jsonPost(url, obj, cookie) {
    var headers = { "Content-Type": "application/json" };
    if (cookie) headers.Cookie = cookie;
    return binHttp(url, "POST", strBytes(JSON.stringify(obj)), headers).then(function (r) {
      if (r.status !== 200)
        throw secureError(
          "Tapo isteği reddedildi (http " + r.status + ").",
          r.status === 403 ? "session" : "http",
        );
      var j;
      try {
        j = JSON.parse(utf8String(Array.from(r.bytes)));
      } catch (e) {
        throw secureError("Tapo yanıtı çözülemedi.", "http");
      }
      return { json: j, headers: r.headers };
    });
  }
  function ptWrap(sess, obj) {
    return aesCbc("encrypt", sess.key, sess.iv, strBytes(JSON.stringify(obj))).then(function (c) {
      return { method: "securePassthrough", params: { request: b64enc(c) } };
    });
  }
  function ptUnwrap(sess, resp) {
    if (resp.error_code !== 0 || !resp.result || !resp.result.response)
      throw tapoError(resp.error_code);
    return aesCbc("decrypt", sess.key, sess.iv, b64dec(resp.result.response)).then(function (p) {
      return JSON.parse(utf8String(Array.from(p)));
    });
  }
  function ptHandshake(host, creds) {
    var base = "http://" + host,
      subtle;
    return needSubtle()
      .then(function (s) {
        subtle = s;
        return s.generateKey(
          {
            name: "RSA-OAEP",
            modulusLength: 1024,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-1",
          },
          true,
          ["encrypt", "decrypt"],
        );
      })
      .then(function (kp) {
        return Promise.all([
          subtle.exportKey("spki", kp.publicKey),
          subtle.exportKey("jwk", kp.privateKey),
        ]);
      })
      .then(function (ex) {
        return jsonPost(base + "/app", {
          method: "handshake",
          params: { key: pemFromSpki(toU8(ex[0])) },
          requestTimeMils: 0,
        }).then(function (r) {
          if (r.json.error_code !== 0 || !r.json.result || !r.json.result.key)
            throw secureError("Tapo el sıkışması yanıtlanmadı.", "handshake");
          var kv = rsaPkcs1Decrypt(ex[1], b64dec(r.json.result.key));
          if (kv.length !== 32)
            throw secureError("Tapo el sıkışma anahtarı geçersiz.", "handshake");
          return {
            type: "pt",
            base: base,
            key: kv.slice(0, 16),
            iv: kv.slice(16, 32),
            cookie: sessionCookie(r.headers),
            token: "",
          };
        });
      })
      .then(function (sess) {
        return sha1(strBytes(creds.user)).then(function (h) {
          var login = {
            method: "login_device",
            params: {
              username: b64enc(strBytes(toHex(h))),
              password: b64enc(strBytes(creds.pass)),
            },
            requestTimeMils: 0,
          };
          return ptWrap(sess, login)
            .then(function (w) {
              return jsonPost(base + "/app", w, sess.cookie);
            })
            .then(function (r) {
              return ptUnwrap(sess, r.json);
            })
            .then(function (inner) {
              if (inner.error_code !== 0 || !inner.result || !inner.result.token)
                throw tapoError(inner.error_code);
              sess.token = inner.result.token;
              return sess;
            });
        });
      });
  }

  function tapoError(code) {
    if (code === -1501 || code === -1005 || code === 1002)
      return secureError(
        "Tapo hesabı e-postası ya da şifresi cihaz tarafından kabul edilmedi.",
        "auth",
      );
    if (code === 9999 || code === 1003 || code === -1012)
      return secureError("Tapo oturumu doldu.", "session");
    return secureError("Tapo cihazı hata döndü (kod " + code + ").", "device");
  }

  // Oturumlar adres+kullanıcı başına tutulur; her oturumda istekler sıraya girer (KLAP sıra numarası artmalı).
  var tapoSessions = {};
  function tapoConnect(host, creds) {
    return klapHandshake(host, creds).catch(function (klapErr) {
      if (klapErr && klapErr.code === "auth") throw klapErr;
      return ptHandshake(host, creds).catch(function (ptErr) {
        // Cihaz KLAP konuştuysa (el sıkışma 200 verdi) asıl hata odur; yoksa eski yöntemin hatası
        throw ptErr && ptErr.code === "auth" ? ptErr : klapErr || ptErr;
      });
    });
  }
  function tapoSend(sess, method, params) {
    var req = { method: method, params: params || {}, requestTimeMils: 0 };
    if (sess.type === "klap") {
      return klapRequest(sess, JSON.stringify(req)).then(function (text) {
        return JSON.parse(text);
      });
    }
    return ptWrap(sess, req)
      .then(function (w) {
        return jsonPost(sess.base + "/app?token=" + encodeURIComponent(sess.token), w, sess.cookie);
      })
      .then(function (r) {
        return ptUnwrap(sess, r.json);
      });
  }
  function tapoCall(host, creds, method, params) {
    var key = host + "|" + creds.user;
    var entry = tapoSessions[key] || (tapoSessions[key] = { sess: null, queue: Promise.resolve() });
    function attempt(retry) {
      var ready = entry.sess
        ? Promise.resolve(entry.sess)
        : tapoConnect(host, creds).then(function (s) {
            entry.sess = s;
            return s;
          });
      return ready
        .then(function (s) {
          return tapoSend(s, method, params);
        })
        .then(function (resp) {
          if (resp.error_code === 9999 || resp.error_code === 1003)
            throw secureError("Tapo oturumu doldu.", "session");
          if (resp.error_code !== 0) throw tapoError(resp.error_code);
          return resp.result || {};
        })
        .catch(function (err) {
          entry.sess = null;
          if (retry && err && (err.code === "session" || err.code === "http" || !err.code))
            return attempt(false);
          throw err;
        });
    }
    var run = entry.queue.then(function () {
      return attempt(true);
    });
    entry.queue = run.catch(function () {});
    return run;
  }
  function tapoNickname(info) {
    try {
      return utf8String(Array.from(b64dec(info.nickname)));
    } catch (e) {
      return "";
    }
  }
  function tapoKindCaps(info) {
    var type = String(info.type || "") + " " + String(info.model || "");
    if (/BULB|LIGHT|^L\d/i.test(type)) {
      var caps = ["switch"];
      if (info.brightness != null) caps.push("brightness");
      if (info.hue != null && info.saturation != null) caps.push("color");
      // Beyaz tonu (Kelvin): yalnızca cihaz color_temp alanı bildiriyorsa (L520/L530/L535 gibi; L510 bildirmez)
      if (info.color_temp != null) caps.push("colorTemp");
      return { kind: "light", caps: caps };
    }
    if (/PLUG/i.test(type) || /\bP\d{3}/i.test(type)) return { kind: "plug", caps: ["switch"] };
    if (/SWITCH/i.test(type) || /\bS\d{3}/i.test(type)) return { kind: "switch", caps: ["switch"] };
    return null;
  }

  function tapoMissing() {
    return Promise.reject(
      secureError(
        "Bu Tapo cihazının hesap bilgisi bu cihazda kayıtlı değil. Cihazı yeniden ekle.",
        "no-secret",
      ),
    );
  }
  var tapo = {
    id: "tapo",
    label: "TP-Link Tapo",
    caps: ["switch", "brightness", "color", "colorTemp"],
    needsBinHttp: true,
    // Kimlik bilgisi olmadan yalnızca cihazın Tapo/KLAP el sıkışmasına yanıt verdiği anlaşılır (model bilinmez).
    probe: function (device) {
      var host = hostOnly(device);
      if (!binBridge())
        return Promise.reject(
          secureError("tapo: ikili HTTP yalnızca masaüstü uygulamasında", "no-bridge"),
        );
      var generic = {
        protocol: "tapo",
        model: "TP-Link Tapo",
        name: device.name || "TP-Link Tapo",
        kind: "plug",
        caps: ["switch"],
        needsCredentials: true,
      };
      return binHttp("http://" + host + "/app/handshake1", "POST", randomBytes(16), {
        "Content-Type": "application/octet-stream",
      })
        .then(function (r) {
          if (r.status === 200 && r.bytes.length === 48) return generic;
          throw new Error("tapo: klap yok");
        })
        .catch(function (err) {
          // Eski (securePassthrough) yazılımlar: tarama sırasında yanlış pozitifi önlemek için yalnızca elle IP girilince denenir.
          if (scanTimeoutMs) throw err;
          return jsonPost("http://" + host + "/app", {
            method: "handshake",
            params: { key: "x" },
            requestTimeMils: 0,
          }).then(function (r) {
            if (typeof r.json.error_code === "number" && !r.json.result) return generic;
            throw err;
          });
        });
    },
    // Hesap bilgisiyle bağlanır, cihaz bilgisini okur → eklenebilir kayıt (gizli bilgi "secret" alanında, cihaz kaydına yazılmaz)
    verify: function (host, user, pass) {
      host = bareHost(host);
      var creds = { user: String(user || "").trim(), pass: String(pass || "") };
      if (!creds.user || !creds.pass)
        return Promise.reject(
          secureError("TP-Link hesabının e-postasını ve şifresini yaz.", "no-secret"),
        );
      delete tapoSessions[host + "|" + creds.user];
      return tapoCall(host, creds, "get_device_info").then(function (info) {
        var kc = tapoKindCaps(info);
        if (!kc)
          throw secureError(
            "Bu Tapo cihaz türü (" +
              (info.model || info.type || "bilinmiyor") +
              ") henüz desteklenmiyor.",
            "unsupported",
          );
        return {
          host: host,
          protocol: "tapo",
          model: "Tapo " + (info.model || ""),
          name: tapoNickname(info) || "Tapo " + (info.model || ""),
          kind: kc.kind,
          caps: kc.caps,
          secret: { tapoUser: creds.user, tapoPass: creds.pass },
        };
      });
    },
    read: function (device) {
      var c = tapoCreds(device);
      if (!c) return tapoMissing();
      return tapoCall(hostOnly(device), c, "get_device_info").then(function (info) {
        return {
          switch: typeof info.device_on === "boolean" ? info.device_on : null,
          brightness: typeof info.brightness === "number" ? info.brightness : null,
        };
      });
    },
    write: function (device, capability, value) {
      var c = tapoCreds(device);
      if (!c) return tapoMissing();
      var params;
      if (capability === "switch") params = { device_on: !!value };
      else if (capability === "brightness")
        params = { brightness: Math.max(1, Math.min(100, Math.round(value))) };
      else if (capability === "color") {
        var hsb = rgbToHsb(hexToRgb(value));
        params = {
          hue: Math.round(hsb.h * 360) % 360,
          saturation: Math.round(hsb.s * 100),
          color_temp: 0,
        };
      } else if (capability === "colorTemp")
        params = { color_temp: Math.max(2500, Math.min(6500, toneKelvin(value))) };
      else return unsupported("tapo", capability);
      return tapoCall(hostOnly(device), c, "set_device_info", params);
    },
  };

  // --- Wake-on-LAN (WoL — Sihirli Paket Uyandırma) ----------------------------
  // Hedef bilgisayarın/TV'nin MAC adresine yerel ağdan UDP sihirli paketi (magic packet)
  // göndererek uykudan uyandırır (Home Assistant standardı).
  function buildMagicPacket(mac) {
    var clean = String(mac || "")
      .replace(/[^0-9a-fA-F]/g, "")
      .toLowerCase();
    if (clean.length !== 12) throw new Error("Geçersiz MAC adresi (12 onaltılık karakter gerekli)");
    var hex = "ffffffffffff";
    for (var i = 0; i < 16; i++) hex += clean;
    return hex;
  }

  function wakeOnLan(mac, host) {
    var targetHost = host || "255.255.255.255";
    var hex = buildMagicPacket(mac);
    var u = udpBridge();
    if (u) {
      return u({ host: targetHost, port: 9, hex: hex, noReply: true }).then(function () {
        return { success: true, mac: mac, host: targetHost };
      });
    }
    return Promise.reject(
      new Error("Wake-on-LAN bu ortamda desteklenmiyor (UDP köprüsü gerekli)."),
    );
  }

  var wol = {
    id: "wol",
    label: "Wake-on-LAN (PC / TV)",
    needsUdp: true,
    caps: ["switch"],
    // WoL uyuyan cihazla konuşmaz: cevap yoktur, bu yüzden bir IP'de "var mı" diye yoklanamaz.
    // Tarama/IP tanıma bu protokolü atlar; yalnızca MAC bilinerek elle eklenir.
    discoverable: false,
    probe: function (device) {
      if (!device || !device.mac) return Promise.reject(new Error("wol: MAC adresi gerekli"));
      return Promise.resolve({
        protocol: "wol",
        model: "Wake-on-LAN PC/TV",
        name: device.name || "Ağ Cihazı (WoL)",
        kind: "plug",
      });
    },
    read: function () {
      return Promise.resolve({ switch: false });
    },
    write: function (device, capability, value) {
      if (capability === "switch" && value) {
        return wakeOnLan(device.mac || device.host, device.host);
      }
      return Promise.resolve({ ignored: true });
    },
  };

  // =================================== NANOLEAF ===================================
  // Nanoleaf Open API (yerel HTTP, bağlantı noktası 16021). Belgelenmiş akış:
  //   eşleştirme: cihazın güç düğmesi 5–7 sn basılı tutulur, ~30 sn içinde POST /api/v1/new -> {"auth_token": "..."}
  //   (eşleştirme modunda değilken cihaz 403 döner); sonraki her istek /api/v1/<token>/ altındadır, geçersiz token 401.
  //   GET  /api/v1/<token>/        -> {name, model, manufacturer, state:{on:{value}, brightness:{value,min,max},
  //                                    hue:{value,min,max}, sat:{value,min,max}, ct:{value,min,max}, colorMode}}
  //   PUT  /api/v1/<token>/state   -> {"on":{"value":true}} | {"brightness":{"value":50}} | {"hue":{"value":120}} |
  //                                    {"sat":{"value":80}} | {"ct":{"value":4000}} (başarıda 204, gövde yok)
  // Token koddan değil, cihaz başına nexusLan.secrets içinden okunur (nanoleafToken).
  // UYARI: Gerçek donanımla DOĞRULANMADI; yalnızca belgelenmiş biçimlere karşı test edildi.
  // KAYNAK DOĞRULAMASI (2026-10-30): Resmi Open API belgesi ULAŞILAMADI (forum.nanoleaf.me/docs/openapi ->
  //   301 -> support.nanoleaf.me 403; resmi GitHub org'unda yalnızca aurora-sdk-* var, OpenAPI spec yok;
  //   Wayback'teki Postman kopyası yalnızca boş kabuk döndürüyor). Aşağıdakiler yalnızca topluluk istemcisi
  //   aionanoleaf'ın (milanmeu/aionanoleaf, Home Assistant'ın kullandığı) kaynağıyla karşılaştırıldı:
  //   port 16021, POST /new (403 = eşleştirme modu kapalı), 401 = geçersiz token, GET /, PUT /state gövdeleri
  //   (on/brightness/hue/sat/ct {value}), "on" anahtarının gövdede sonda olması, info.state.* alanları.
  //   Yalnızca topluluk kaynaklı kalanlar: 204 yanıtı, 30 sn eşleştirme penceresi, ct 1200–6500 aralığı
  //   (HA cihazın kendi min/max'ını kullanır), 422 (aralık dışı değer) davranışı.
  // GERÇEK CİHAZLA DOĞRULANMASI GEREKENLER: (1) POST /new yanıtı ve eşleştirme dışı 403; (2) PUT /state
  //   başarı kodu (200/204); (3) renk yazımı: hue+sat+on tek istekte, on son; (4) ct sınırları (GET / yanıtındaki
  //   state.ct.min/max ile 1200–6500 örtüşüyor mu); (5) geçersiz token'da 401; (6) brightness
  //   min/max ile yüzde dönüşümü; (7) colorMode "ct" dışında colorTemp'in okunmaması.
  function nanoleafBase(device, token) {
    return nanoleafOrigin(device) + "/api/v1/" + encodeURIComponent(token);
  }
  function nanoleafOrigin(device) {
    return "http://" + hostOnly(device) + ":16021";
  }
  function nanoleafToken(device) {
    var s = secretsFor(device);
    return s && s.nanoleafToken ? String(s.nanoleafToken) : null;
  }
  function nanoleafNeedsPairing() {
    return Promise.reject(
      secureError(
        "Nanoleaf eşleştirmesi gerekli: güç düğmesini 5–7 sn basılı tut, ışık yanıp sönünce eşleştir.",
        "no-secret",
      ),
    );
  }
  function nanoleafCheck(res) {
    if (res.status === 401)
      throw secureError("Nanoleaf token'ı geçersiz — cihazı yeniden eşleştir.", "no-secret");
    if (res.status < 200 || res.status >= 300) throw new Error("nanoleaf: http " + res.status);
    return res;
  }
  function nanoleafInfo(device, token) {
    return request({ url: nanoleafBase(device, token) + "/" }).then(function (res) {
      nanoleafCheck(res);
      var info = JSON.parse(res.text);
      if (!info || !info.state || !info.state.on) throw new Error("nanoleaf: beklenen yanıt yok");
      return info;
    });
  }
  function nanoleafVal(o) {
    return o && typeof o.value === "number" ? o.value : null;
  }
  var nanoleaf = {
    id: "nanoleaf",
    label: "Nanoleaf",
    caps: ["switch", "brightness", "color", "colorTemp"],
    discoverable: false, // token olmadan hiçbir uç yanıt vermez; yalnızca eşleştirilerek eklenir
    // Güç düğmesine basıldıktan sonra çağrılır; token'ı döndürür (saklamak çağıranın işi: secrets.set).
    pair: function (host) {
      var device = { host: host };
      return request({ url: nanoleafOrigin(device) + "/api/v1/new", method: "POST" }).then(
        function (res) {
          if (res.status === 403)
            throw secureError(
              "Güç düğmesini 5–7 sn basılı tut, sonra tekrar dene.",
              "pairing-mode",
            );
          nanoleafCheck(res);
          var body = JSON.parse(res.text);
          if (!body || !body.auth_token) throw new Error("nanoleaf: eşleştirme başarısız");
          return body.auth_token;
        },
      );
    },
    verify: function (host, creds) {
      var device = { host: host };
      return nanoleafInfo(device, creds.token).then(function (info) {
        return {
          host: host,
          protocol: "nanoleaf",
          model: info.model || "Nanoleaf",
          name: info.name || "Nanoleaf",
          kind: "light",
          caps: nanoleaf.caps,
          secret: { nanoleafToken: creds.token },
        };
      });
    },
    probe: function (device) {
      var token = nanoleafToken(device);
      if (!token) return nanoleafNeedsPairing();
      return nanoleafInfo(device, token).then(function (info) {
        return {
          protocol: "nanoleaf",
          model: info.model || "Nanoleaf",
          name: info.name || "Nanoleaf",
          kind: "light",
        };
      });
    },
    read: function (device) {
      var token = nanoleafToken(device);
      if (!token) return nanoleafNeedsPairing();
      return nanoleafInfo(device, token).then(function (info) {
        var st = info.state,
          br = st.brightness || {};
        var min = typeof br.min === "number" ? br.min : 0,
          max = typeof br.max === "number" ? br.max : 100;
        var raw = nanoleafVal(br);
        var out = {
          switch: typeof st.on.value === "boolean" ? st.on.value : null,
          brightness:
            raw === null || max === min ? null : Math.round(((raw - min) / (max - min)) * 100),
        };
        if (st.colorMode === "ct" && nanoleafVal(st.ct) !== null) out.colorTemp = st.ct.value;
        return out;
      });
    },
    write: function (device, capability, value) {
      var token = nanoleafToken(device);
      if (!token) return nanoleafNeedsPairing();
      var body = null;
      if (capability === "switch") body = { on: { value: !!value } };
      else if (capability === "brightness")
        body = { brightness: { value: Math.max(0, Math.min(100, Math.round(Number(value)))) } };
      else if (capability === "colorTemp")
        body = {
          ct: {
            value:
              typeof value === "number" && isFinite(value)
                ? Math.max(1200, Math.min(6500, Math.round(value)))
                : toneKelvin(value),
          },
        };
      else if (capability === "color") {
        var hsb = rgbToHsb(hexToRgb(value));
        // "on" son anahtar olmalı (aionanoleaf set_state notu); toneKelvin'in 2000 alt sınırı Nanoleaf için dar.
        body = {
          hue: { value: Math.round(hsb.h * 360) % 360 },
          sat: { value: Math.round(hsb.s * 100) },
          on: { value: true },
        };
      } else return unsupported("nanoleaf", capability);
      return request({
        url: nanoleafBase(device, token) + "/state",
        method: "PUT",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }).then(nanoleafCheck);
    },
  };

  var protocols = [
    shelly,
    shellyRpc,
    tasmota,
    wled,
    esphome,
    hue,
    homeassistant,
    kasa,
    tapo,
    yeelight,
    sonoff,
    wiz,
    nanoleaf,
    lifx,
    govee,
    tuyaLocal,
    wol,
  ];

  function available(p) {
    return (
      (!p.needsTcp || !!tcpBridge()) &&
      (!p.needsUdp || !!udpBridge()) &&
      (!p.needsBinHttp || !!binBridge()) &&
      (!p.needsTcpSession || !!tcpSessionBridge())
    );
  }
  function discoverable(p) {
    return available(p) && p.discoverable !== false;
  }

  // Manuel IP ile ekleme: cihazın hangi protokolü konuştuğunu sırayla dener.
  function identify(host) {
    var device = { host: host };
    var lastError = null;
    return protocols
      .filter(discoverable)
      .reduce(function (chain, protocol) {
        return chain.then(function (found) {
          if (found) return found;
          return protocol
            .probe(device)
            .then(function (info) {
              var out = { host: host };
              Object.keys(info).forEach(function (k) {
                out[k] = info[k];
              });
              return out;
            })
            .catch(function (error) {
              lastError = error;
              return null;
            });
        });
      }, Promise.resolve(null))
      .then(function (found) {
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
    var value = String(input || "")
      .trim()
      .replace(/\.+$/, "");
    if (!/^\d{1,3}(\.\d{1,3}){2,3}$/.test(value)) return null;
    var parts = value.split(".");
    if (parts.length === 4) parts.pop();
    if (parts.length !== 3) return null;
    var ok = parts.every(function (p) {
      return Number(p) >= 0 && Number(p) <= 255;
    });
    return ok ? parts.join(".") : null;
  }

  // Masaüstü uygulaması bilgisayarın alt ağını bilir; telefonda kullanıcı girer.
  function guessSubnet() {
    var d = desktopBridge();
    if (d && typeof d.subnets === "function") {
      return Promise.resolve(d.subnets()).then(function (list) {
        return (list && list[0]) || null;
      });
    }
    return Promise.resolve(null);
  }

  // Tarama için hızlı tanıma: tüm protokoller aynı anda yoklanır, sıradaki ilk başarılı olan seçilir.
  function identifyFast(host) {
    var device = { host: host };
    return Promise.all(
      protocols.filter(discoverable).map(function (protocol) {
        return protocol
          .probe(device)
          .then(function (info) {
            var out = { host: host };
            Object.keys(info).forEach(function (k) {
              out[k] = info[k];
            });
            return out;
          })
          .catch(function () {
            return null;
          });
      }),
    ).then(function (all) {
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
        if (nextHost > 254 && active === 0) {
          settled = true;
          scanTimeoutMs = 0;
          resolvePromise(found);
        }
      }
      function pump() {
        while (active < concurrency && nextHost <= 254) {
          if (opts.shouldStop && opts.shouldStop()) {
            nextHost = 255;
            break;
          }
          (function (host) {
            active += 1;
            identifyFast(host)
              .then(function (info) {
                found.push(info);
                if (opts.onFound) opts.onFound(info, found.length);
              })
              .catch(function () {
                /* cevap vermeyen adres normal */
              })
              .then(function () {
                active -= 1;
                if (opts.onProgress) opts.onProgress(host);
                finishIfDone();
                pump();
              });
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
        var finish = function (v) {
          if (done) return;
          done = true;
          try {
            pc.close();
          } catch (e) {}
          resolve(v);
        };
        pc.createDataChannel("nx");
        pc.onicecandidate = function (e) {
          if (!e || !e.candidate) return finish(null);
          var m = /(\b(?:192\.168|10\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3})\.\d{1,3}\b/.exec(
            e.candidate.candidate,
          );
          if (m) finish(normalizeSubnetBase(m[1] + ".0"));
        };
        pc.createOffer()
          .then(function (o) {
            return pc.setLocalDescription(o);
          })
          .catch(function () {
            finish(null);
          });
        setTimeout(function () {
          finish(null);
        }, 1500);
      } catch (e) {
        resolve(null);
      }
    });
  }

  var COMMON_PREFIXES = [
    "192.168.1",
    "192.168.0",
    "192.168.2",
    "192.168.10",
    "192.168.100",
    "192.168.178",
    "10.0.0",
    "10.0.1",
    "10.1.1",
    "172.16.0",
  ];

  // Kullanıcıdan hiçbir şey istemeden ağı tarar: önce cihazın kendi alt ağı (masaüstü / WebRTC),
  // sonra yaygın modem aralıkları. İlk cihaz bulunan alt ağda durur.
  // options: onPrefix(prefix,index,total), onFound, shouldStop, prefixes (ek öncelikli ön ekler)
  function autoScan(options) {
    var opts = options || {};
    return Promise.all([
      guessSubnet().catch(function () {
        return null;
      }),
      rtcPrefix(),
    ]).then(function (known) {
      var list = [];
      function add(p) {
        p = p && normalizeSubnetBase(p);
        if (p && list.indexOf(p) === -1) list.push(p);
      }
      (opts.prefixes || []).forEach(add);
      known.forEach(add);
      COMMON_PREFIXES.forEach(add);
      var all = [];
      var i = 0;
      function next() {
        if (i >= list.length || (opts.shouldStop && opts.shouldStop())) return Promise.resolve(all);
        var prefix = list[i++];
        if (opts.onPrefix) opts.onPrefix(prefix, i, list.length);
        return scanSubnet(prefix, {
          onFound: function (info, n) {
            all.push(info);
            if (opts.onFound) opts.onFound(info, all.length);
          },
          shouldStop: opts.shouldStop,
          onProgress: opts.onProgress,
        }).then(function () {
          return all.length ? all : next();
        });
      }
      return next();
    });
  }

  window.nexusLan = {
    setTransport: setTransport,
    request: request,
    usingNativeTransport: function () {
      return !!transport || !!desktopBridge() || !!nativeHttpPlugin();
    },
    hasTcp: function () {
      return !!tcpBridge();
    },
    hasUdp: function () {
      return !!udpBridge();
    },
    protocols: protocols,
    protocolFor: protocolFor,
    supports: supports,
    identify: identify,
    scanSubnet: scanSubnet,
    autoScan: autoScan,
    guessSubnet: guessSubnet,
    normalizeSubnetBase: normalizeSubnetBase,
    wakeOnLan: wakeOnLan,
    buildMagicPacket: buildMagicPacket,
    // Tapo / Tuya: eşleştirme doğrulaması (gerçek el sıkışma/sorgu) ve cihaza özel gizli bilgi deposu
    tapo: { verify: tapo.verify },
    tuya: { verify: tuyaLocal.verify },
    hasSecure: function () {
      return { tapo: !!binBridge(), tuya: !!tcpSessionBridge() };
    },
    secrets: secrets,
    internals: {
      aesEcbEncrypt: aesEcbEncrypt,
      aesEcbDecrypt: aesEcbDecrypt,
      crc32: crc32,
      tuyaEncode: tuyaEncode,
      tuyaDecode: tuyaDecode,
      klapDerive: klapDerive,
      klapAuthHash: klapAuthHash,
      rsaPkcs1Decrypt: rsaPkcs1Decrypt,
      tuyaHsv: tuyaHsv,
      tuyaMapFromDps: tuyaMapFromDps,
    },
    hue: { pair: hue.pair, lights: hue.lights },
    homeassistant: { entities: homeassistant.entities },
    read: function (device) {
      if (window.nexusPreview) return Promise.reject(new Error("önizleme"));
      var p = protocolFor(device.protocol);
      return p && available(p)
        ? p.read(device)
        : Promise.reject(new Error("bu ortamda desteklenmeyen protokol"));
    },
    // Yazılım sürümü: { current, latest, hasUpdate } — bilinmeyen alanlar null
    firmware: function (device) {
      var p = protocolFor(device.protocol);
      if (!p || !available(p))
        return Promise.reject(new Error("bu ortamda desteklenmeyen protokol"));
      if (typeof p.firmware !== "function")
        return Promise.reject(new Error("bu cihaz sürüm bilgisi vermiyor"));
      return p.firmware(device);
    },
    write: function (device, capability, value) {
      if (window.nexusPreview) return Promise.reject(new Error("önizleme"));
      var p = protocolFor(device.protocol);
      if (!p || !available(p))
        return Promise.reject(new Error("bu ortamda desteklenmeyen protokol"));
      // HTTP taşıyan protokollerde 4xx/5xx yanıtı başarı sayılmaz. Bazı yazma
      // uçları ham {status,text} döner (Shelly, ESPHome); eskiden bunlar da
      // "komut gitti" sayılıyordu. Artık gerçek yanıt kodu denetlenir.
      return Promise.resolve(p.write(device, capability, value)).then(function (res) {
        if (res && typeof res.status === "number" && (res.status < 200 || res.status >= 300)) {
          throw new Error("http " + res.status);
        }
        return res;
      });
    },
  };
})();
