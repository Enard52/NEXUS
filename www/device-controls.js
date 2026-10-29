/**
 * NEXUS — cihaz kontrol modeli (Kontrol Panelleri + cihaz kontrol ekranı ortak kullanır)
 * Aynı işlevi gören cihazlar aynı "kind"e düşer ve aynı kontrol ekranı şablonunu paylaşır.
 * Gerçek LAN komutu yalnızca lan-connectors.js'in desteklediği işlevlere (aç/kapat, parlaklık) gider;
 * diğer ayarlar cihaz kaydında (state) tutulur.
 */
(function () {
  var IMAGE_VERSION = "20261029-products-10";

  var IMAGE_RENAMES = {
    // Eski katalog JPG'leri (düz mavi arka planlı) şeffaf PNG ürün görselleriyle değiştirildi; kayıtlı cihazlar da düzelsin.
    "camera.jpg": "security-indoor-camera.png",
    "dimmer.jpg": "control-dimmer-knob.png",
    "door_lock.jpg": "security-keypad-lock.png",
    "door-sensor.jpg": "security-door-sensor.png",
    "light-switch.jpg": "control-single-wall-switch.png",
    "motion-detector.jpg": "security-motion-sensor.png",
    "smart_appliance.jpg": "generic-smart-hub.png",
    "smart_bulb.jpg": "generic-led-bulb.png",
    "smart_hub.jpg": "generic-smart-hub.png",
    "smart_plug.jpg": "generic-smart-plug.png",
    "smart_scale.jpg": "generic-smart-scale.png",
    "temp-humidity.jpg": "generic-temp-humidity.png",
    "thermostat.jpg": "generic-thermostat-c.png",
    "vacuum.jpg": "generic-robot-vacuum.png",
    "generic-thermostat.png": "generic-thermostat-c.png",
    "health-toothbrush.png": "health-toothbrush-v2.png",
    "sport-wrist-ball.png": "sport-wrist-ball-v3.png",
    "sport-wrist-ball-v2.png": "sport-wrist-ball-v3.png",
    "generic-wall-switch.png": "control-single-wall-switch.png",
    "generic-door-lock.png": "security-keypad-lock.png",
    "generic-indoor-camera.png": "security-indoor-camera.png",
    // Gerçek ürün fotoğrafı olmayan eski düz ikonlar kaldırıldı; bu adlarla kayıtlı cihazlar işlevine uygun fotoğrafı gösterir.
    "air-conditioner.png": "generic-air-conditioner.png",
    "air-quality.png": "generic-air-quality.png",
    "camera.png": "security-indoor-camera.png",
    "dishwasher.png": "generic-dishwasher.png",
    "door-lock.png": "security-keypad-lock.png",
    "door-sensor.png": "security-door-sensor.png",
    "fan.png": "generic-fan.png",
    "fridge.png": "generic-refrigerator.png",
    "humidifier.png": "generic-humidifier.png",
    "idea.png": "generic-led-bulb.png",
    "light.png": "generic-led-bulb.png",
    "light-on.png": "generic-led-bulb.png",
    "light-automation.png": "generic-led-bulb.png",
    "motion-detector.png": "generic-motion-sensor.png",
    "power-strip.png": "generic-power-strip.png",
    "robot.png": "generic-robot-vacuum.png",
    "vacuum-cleaner.png": "generic-robot-vacuum.png",
    "solar-panel.png": "generic-solar-panel.png",
    "speaker.png": "generic-smart-speaker.png",
    "switch.png": "control-single-wall-switch.png",
    "temperature.png": "generic-temp-humidity.png",
    "temperature-inside.png": "generic-temp-humidity.png",
    "thermometer.png": "generic-temp-humidity.png",
    "tv.png": "generic-smart-tv.png",
    "tv-show.png": "generic-smart-tv.png",
    "monitor.png": "generic-smart-tv.png",
    "washing-machine.png": "generic-washing-machine.png",
    "wifi-router.png": "generic-router.png",
    "bridge.png": "generic-smart-hub.png",
    "hub.png": "generic-smart-hub.png",
    "zigbee.png": "generic-smart-hub.png",
    "home-automation.png": "generic-smart-hub.png",
  };

  function readDevices() {
    var devices = [];
    try {
      devices = JSON.parse(nexusGetItem("nexusPairedDevices") || "[]");
    } catch (e) {
      devices = [];
    }
    return Array.isArray(devices) ? devices : [];
  }

  function writeDevices(devices) {
    nexusSetItem("nexusPairedDevices", JSON.stringify(devices));
    if (window.nexusCloud && window.nexusCloud.notifyLocalChange)
      window.nexusCloud.notifyLocalChange();
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function deviceCaps(device) {
    // LAN modellerinde kayıtlı yetenekler kesindir; katalogdan eklenenlerde addan yeniden çözülür.
    var known = device && device.protocol && device.protocol !== "unknown";
    if (known && Array.isArray(device.caps) && device.caps.length) return device.caps;
    var resolved =
      typeof nexusResolveDevice === "function"
        ? nexusResolveDevice(device && device.name, "")
        : null;
    if (resolved && resolved.caps && resolved.caps[0] !== "other") return resolved.caps;
    return device && Array.isArray(device.caps) && device.caps.length ? device.caps : ["other"];
  }

  function hasCap(device, cap) {
    return deviceCaps(device).indexOf(cap) !== -1;
  }

  function panelOf(device) {
    if (typeof nexusPanelOf === "function") return nexusPanelOf(deviceCaps(device));
    return { id: "other", label: "Diğer cihazlar", icon: "cpu" };
  }

  function thumbFor(device) {
    if (device.img) return IMAGE_RENAMES[device.img] || device.img;
    var resolved =
      typeof nexusResolveDevice === "function" ? nexusResolveDevice(device.name, "") : null;
    return (resolved && resolved.img) || "generic-smart-hub.png";
  }

  function imageUrl(device) {
    return "assets/products/" + encodeURIComponent(thumbFor(device)) + "?v=" + IMAGE_VERSION;
  }

  function stateOf(device) {
    return device && device.state ? device.state : {};
  }

  function clamp(value, min, max, fallback) {
    var n = Number(value);
    if (!isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  // Kontrol ekranı şablonu
  function kindOf(device) {
    var caps = deviceCaps(device);
    var has = function (c) {
      return caps.indexOf(c) !== -1;
    };
    var name = String(device.name || "").toLocaleLowerCase("tr-TR");
    if (has("camera")) return "camera";
    if (has("vacuum")) return "vacuum";
    if (has("lock")) return "lock";
    if (has("alarm")) return "alarm";
    if (has("cover")) return "cover";
    if (has("color") || has("brightness")) return "light";
    if (has("airQuality")) return has("switch") ? "purifier" : "airsensor";
    if (has("motion")) return "motion";
    if (has("contact")) return "contact";
    if (has("pet")) return "pet";
    if (has("garden")) return "garden";
    if (has("media")) return "media";
    if (has("temperature")) {
      if (/termostat|thermostat|trv|vana/.test(name)) return "thermostat";
      if (has("switch")) return "ac";
      return "climatesensor";
    }
    if (has("illuminance") || has("sensor")) return "envsensor";
    if (has("energy")) return "energy";
    if (has("switch")) return "switch";
    return "generic";
  }

  // Ortak kontrol ekranında hangi bölümlerin görüneceği: cihazın yeteneklerinden (caps) ve
  // model adından çıkarılır. Aynı paneli kullanan cihazlarda bölümler cihazdan cihaza değişir,
  // ekran düzeni aynı kalır. Kayıtta device.features varsa o esas alınır.
  // --- Gönderilebilirlik kapısı ------------------------------------------------------------------
  // Bir kontrol ancak cihaza GERÇEKTEN gönderilebiliyorsa gösterilir: cihaz yerel ağa bağlı olmalı ve
  // protokolü o işlevi yazabilmeli. Aksi halde düğme "çalışıyormuş" gibi görünüp yalnızca uygulamada
  // saklanırdı (sahte başarı). Salt okunur gösterimler (ölçüm, pil, tüketim) etkilenmez.
  // Kontrol -> gereken yazma işlevi (lan-connectors protokol "caps" listesi):
  var CONTROL_CAP = {
    power: "switch",
    brightness: "brightness",
    presets: "brightness",
    color: "color",
    colorTemp: "colorTemp",
    position: "position",
    coverButtons: "position",
    coverStop: "coverStop",
    target: "target",
    acModes: "hvacMode",
    fanSpeed: "fanMode",
    swing: "swing",
    lockButton: "lock",
    vacuumButtons: "vacuum",
    suction: "suction",
    volume: "volume",
    mute: "mute",
    source: "source",
    indicator: "indicator",
    transport: "transport",
    powerOn: "powerOn",
    effect: "effect",
    lightScene: "lightScene",
    targetHumidity: "targetHumidity",
    tilt: "tilt",
  };
  // Cihaz bazında değişen yetenekler: protokol destekliyor olsa da cihazın kendi listesinde bulunmalı.
  var PER_DEVICE_CAP = {
    brightness: 1,
    color: 1,
    colorTemp: 1,
    hvacMode: 1,
    fanMode: 1,
    swing: 1,
    suction: 1,
    volume: 1,
    mute: 1,
    source: 1,
    indicator: 1,
    transport: 1,
    powerOn: 1,
    effect: 1,
    lightScene: 1,
    targetHumidity: 1,
    tilt: 1,
  };
  // Hiçbir protokolle cihaza gönderilemeyen, yalnızca uygulamada saklanan alanlar: gösterilmez.
  var LOCAL_ONLY = {
    profile: 1,
    sleep: 1,
    lockNotify: 1,
    autoLock: 1,
    privacy: 1,
    nightVision: 1,
    motionNotify: 1,
    notify: 1,
    childLock: 1,
    display: 1,
    cleanMode: 1,
    duration: 1,
    feed: 1,
    portion: 1,
    preview: 1,
  };

  function canSend(device, capability) {
    if (!isLan(device) || typeof window.nexusLan === "undefined") return false;
    if (!window.nexusLan.supports(device, capability)) return false;
    return PER_DEVICE_CAP[capability] ? hasCap(device, capability) : true;
  }

  function featuresOf(device) {
    var all = rawFeaturesOf(device);
    return all.filter(function (feature) {
      if (LOCAL_ONLY[feature]) return false;
      var cap = CONTROL_CAP[feature];
      return cap ? canSend(device, cap) : true;
    });
  }

  function rawFeaturesOf(device) {
    if (device && Array.isArray(device.features) && device.features.length)
      return device.features.slice();
    var caps = deviceCaps(device);
    var has = function (c) {
      return caps.indexOf(c) !== -1;
    };
    var n = String(device.name || "").toLocaleLowerCase("tr-TR");
    var f = [];
    var add = function () {
      for (var i = 0; i < arguments.length; i++)
        if (f.indexOf(arguments[i]) === -1) f.push(arguments[i]);
    };
    if (has("switch")) add("power");
    // Cihazın kendi bildirdiği yetenekler (ör. Home Assistant varlık öznitelikleri) isimden bağımsız olarak gösterilir.
    var CAP_FEATURE = {
      hvacMode: "acModes",
      fanMode: "fanSpeed",
      swing: "swing",
      volume: "volume",
      mute: "mute",
      source: "source",
      suction: "suction",
      transport: "transport",
      indicator: "indicator",
      colorTemp: "colorTemp",
      powerOn: "powerOn",
      effect: "effect",
      lightScene: "lightScene",
      targetHumidity: "targetHumidity",
      tilt: "tilt",
    };
    Object.keys(CAP_FEATURE).forEach(function (c) {
      if (has(c)) add(CAP_FEATURE[c]);
    });
    switch (kindOf(device)) {
      case "light":
        if (has("brightness")) add("brightness", "presets");
        if (has("color")) add("color");
        if (has("colorTemp") || /beyaz|white|tunable|cct/.test(n)) add("colorTemp");
        break;
      case "cover":
        add("coverButtons", "coverStop");
        if (!/garaj|kapı açıcı|gate/.test(n)) add("position"); // garaj kapıları yalnızca aç/durdur/kapat
        break;
      case "ac":
        if (/vantilatör|fan(?!us)|tavan pervane/.test(n)) {
          add("fanSpeed", "swing");
          break;
        }
        if (/ısıtıcı|soba|heater|kalorifer|şömine|battaniye|radyatör|ısıtmalı/.test(n)) {
          add("target");
          break;
        }
        if (/kombi|ısı pompa/.test(n)) {
          add("target", "profile");
          break;
        }
        add("target", "acModes", "fanSpeed", "swing", "sleep");
        break;
      case "thermostat":
        add("target", "profile", "readTemp");
        if (has("humidity")) add("readHumidity");
        break;
      case "lock":
        add("lockButton", "lockNotify", "battery");
        if (/kapı kilidi|akıllı kilit|door lock|parmak izi|şifreli/.test(n)) add("autoLock");
        break;
      case "camera":
        add("preview", "motionNotify");
        if (!/nvr|dvr|baz istasyon|video baz/.test(n)) add("privacy", "nightVision");
        break;
      case "vacuum":
        add("vacuumButtons");
        if (/robot süpürge|vacuum|elektrikli süpürge/.test(n)) add("suction");
        if (/paspas|mop|silme/.test(n)) add("cleanMode");
        break;
      case "media":
        if (
          /televizyon|tv|hoparlör|speaker|soundbar|amplifier|amfi|kulaklık|earphone|projektör|projeksiyon/.test(
            n,
          )
        )
          add("volume", "mute");
        if (/televizyon|tv|projektör|projeksiyon/.test(n)) add("source");
        break;
      case "purifier":
        add("fanSpeed", "display");
        if (/temizley|purifier/.test(n)) add("readPm25", "childLock");
        if (/nem/.test(n)) add("readHumidity");
        break;
      case "energy":
        if (/priz|plug|sayaç|meter|power strip/.test(n) || has("energy")) add("metering");
        if (/priz|plug|power strip/.test(n)) add("powerOn", "childLock");
        break;
      case "switch":
        if (!has("appliance") && !has("health") && !has("fitness") && !has("baby"))
          add("powerOn", "indicator");
        break;
      case "garden":
        if (/sulama|vana|fiskiye|sprinkler/.test(n)) add("duration");
        if (/toprak|bitki/.test(n)) add("readSoil");
        if (/sensör|sensor|monitör/.test(n) && f.indexOf("duration") === -1)
          f.splice(f.indexOf("power"), f.indexOf("power") === -1 ? 0 : 1);
        break;
      case "pet":
        if (/besleyici|feeder|mama/.test(n)) add("feed", "portion");
        break;
      case "motion":
      case "contact":
      case "alarm":
        add("notify", "battery");
        break;
      case "climatesensor":
        add("readTemp");
        if (has("humidity")) add("readHumidity");
        break;
      case "airsensor":
        add("readPm25", "readHumidity");
        break;
      case "envsensor":
        add("readValue", "battery");
        break;
      default:
        add("battery");
    }
    return f;
  }

  // Her panelin tek bir kontrol ekranı vardır; aynı paneldeki tüm cihazlar onu kullanır.
  var PANEL_SCREEN = {
    camera: "camera",
    vacuum: "vacuum",
    lock: "lock",
    cover: "cover",
    "color-light": "light",
    light: "light",
    climate: "climate",
    air: "air",
    motion: "sensor",
    contact: "sensor",
    alarm: "sensor",
    env: "sensor",
    media: "media",
    garden: "garden",
    pet: "pet",
  };
  function screenOf(device) {
    return PANEL_SCREEN[panelOf(device).id] || "onoff";
  }

  function hasFeature(device, feature) {
    return featuresOf(device).indexOf(feature) !== -1;
  }

  var AC_MODES = [
    ["cool", "Soğut", "snowflake"],
    ["heat", "Isıt", "flame"],
    ["fan", "Fan", "fan"],
    ["auto", "Oto", "sparkles"],
  ];
  var FAN_SPEEDS = [
    ["low", "Düşük"],
    ["mid", "Orta"],
    ["high", "Yüksek"],
    ["auto", "Oto"],
  ];
  var VACUUM_STATES = { docked: "Şarjda", cleaning: "Temizliyor", paused: "Duraklatıldı" };

  function label(list, key, fallbackIndex) {
    var hit = list.filter(function (m) {
      return m[0] === key;
    })[0];
    return (hit || list[fallbackIndex])[1];
  }

  // Sıcaklıklar °C saklanır; Ayarlar > Sıcaklık Birimi °F ise gösterimde çevrilir.
  function tempUnit() {
    try {
      return (typeof nexusGetItem === "function"
        ? nexusGetItem("nexusTempUnit")
        : localStorage.getItem("nexusTempUnit")) === "F"
        ? "F"
        : "C";
    } catch (e) {
      return "C";
    }
  }
  function tempNum(c) {
    var v = tempUnit() === "F" ? Math.round(((c * 9) / 5 + 32) * 10) / 10 : c;
    return v.toLocaleString(window.nexusLocale || "tr-TR");
  }
  function tempSymbol() {
    return tempUnit() === "F" ? "°F" : "°";
  }
  function fmtTemp(v) {
    return tempNum(v) + tempSymbol();
  }

  // Kısa durum metni + rozet tonu
  function statusOf(device, index) {
    if (index != null && LAN_ONLINE[index] === false)
      return { text: "Ulaşılamıyor", badge: "warn" };
    // Katalogdan eklenmiş ama ağda bağlanmamış cihaz: "Bağlı" yazmak yanlış bilgi olur.
    if (device && !device.host && /^(catalog-|paired-)/.test(String(device.id || "")))
      return { text: "Eşleşme bekleniyor", badge: "warn" };
    var kind = kindOf(device);
    var st = stateOf(device);
    var on = st.switch === true;
    switch (kind) {
      case "light":
        if (!on) return { text: "Kapalı", badge: "idle" };
        return {
          text: hasCap(device, "brightness")
            ? "Açık · %" + clamp(st.brightness, 0, 100, 60)
            : "Açık",
          badge: "on",
        };
      case "cover":
        var pos = clamp(st.position, 0, 100, 0);
        return {
          text: pos === 0 ? "Kapalı" : pos === 100 ? "Tamamen açık" : "%" + pos + " açık",
          badge: pos > 0 ? "on" : "idle",
        };
      case "lock":
        // Durum cihazdan okunmadıysa "Kilitli" demek yanlış güvence verir.
        if (st.locked === true) return { text: "Kilitli", badge: "ok" };
        if (st.locked === false) return { text: "Kilit açık", badge: "warn" };
        return { text: "Durum okunmadı", badge: "idle" };
      case "camera":
        if (st.privacy === true) return { text: "Gizlilik modu", badge: "idle" };
        return {
          text: st.notify === false ? "Bildirimler kapalı" : "İzlemede",
          badge: st.notify === false ? "idle" : "on",
        };
      case "vacuum":
        var mode = st.mode || "docked";
        return {
          text: VACUUM_STATES[mode] || "Şarjda",
          badge: mode === "cleaning" ? "on" : mode === "paused" ? "warn" : "idle",
        };
      case "ac":
        if (!on) return { text: "Kapalı", badge: "idle" };
        var parts = [];
        if (hasFeature(device, "acModes") && st.mode) parts.push(label(AC_MODES, st.mode, 3));
        else if (hasFeature(device, "fanSpeed"))
          parts.push("Fan " + label(FAN_SPEEDS, st.fan || "auto", 3).toLocaleLowerCase("tr-TR"));
        if (hasFeature(device, "target")) parts.push(fmtTemp(clamp(st.target, 16, 30, 22)));
        return { text: parts.length ? parts.join(" · ") : "Açık", badge: "on" };
      case "thermostat":
        // Hedef cihazdan okunmadıysa varsayılan bir sıcaklık göstermek yanlış bilgi olur.
        if (typeof st.target !== "number" || !isFinite(st.target))
          return { text: "Hedef okunmadı", badge: "idle" };
        return { text: "Hedef " + fmtTemp(clamp(st.target, 5, 30, 21)), badge: "on" };
      case "media":
        if (!on) return { text: "Kapalı", badge: "idle" };
        if (!hasFeature(device, "volume")) return { text: "Açık", badge: "on" };
        return {
          text: st.muted ? "Açık · Sessiz" : "Açık · Ses %" + clamp(st.volume, 0, 100, 30),
          badge: "on",
        };
      case "purifier":
        return on
          ? { text: "Açık · " + label(FAN_SPEEDS, st.fan || "auto", 3), badge: "on" }
          : { text: "Kapalı", badge: "idle" };
      case "garden":
        return on
          ? { text: "Sulanıyor · " + (st.duration || 10) + " dk", badge: "on" }
          : { text: "Kapalı", badge: "idle" };
      case "pet":
        if (!hasFeature(device, "feed"))
          return st.switch === true
            ? { text: "Açık", badge: "on" }
            : { text: hasCap(device, "switch") ? "Kapalı" : "Bağlı", badge: "idle" };
        return st.lastFed
          ? { text: "Son besleme " + st.lastFed, badge: "ok" }
          : { text: "Henüz beslenmedi", badge: "idle" };
      case "motion":
      case "contact":
      case "alarm": {
        // Gerçek durum yalnızca cihazdan okunduysa gösterilir; "izlemede" gibi uydurma bir durum yazılmaz
        if (typeof st.active !== "boolean") return { text: "Durum okunmadı", badge: "idle" };
        if (kind === "motion")
          return st.active
            ? { text: "Hareket algılandı", badge: "on" }
            : { text: "Hareket yok", badge: "ok" };
        if (kind === "contact")
          return st.active ? { text: "Açık", badge: "on" } : { text: "Kapalı", badge: "ok" };
        return st.active ? { text: "Alarm!", badge: "on" } : { text: "Normal", badge: "ok" };
      }
      case "airsensor":
      case "climatesensor":
      case "envsensor":
        return { text: "Bağlı", badge: "idle" };
      default:
        if (hasCap(device, "switch"))
          return on ? { text: "Açık", badge: "on" } : { text: "Kapalı", badge: "idle" };
        return { text: "Bağlı", badge: "idle" };
    }
  }

  // Ana aç/kapat anahtarı olan şablonlar
  var POWER_KINDS = {
    light: 1,
    ac: 1,
    media: 1,
    purifier: 1,
    garden: 1,
    energy: 1,
    switch: 1,
    generic: 1,
    pet: 1,
  };
  function hasPower(device) {
    return !!POWER_KINDS[kindOf(device)] && hasCap(device, "switch");
  }

  var LAN_ERRORS = {};
  var LAN_ONLINE = {}; // index -> true/false (son okuma sonucu); kayıt yoksa bilinmiyor
  var LAN_STATUS = {}; // index -> "pending" | "ok" | "error" (gönderilen son komutun sonucu)
  var listeners = [];

  function onError(fn) {
    listeners.push(fn);
  }
  function notify(index) {
    listeners.forEach(function (fn) {
      fn(index);
    });
  }

  function isLan(device) {
    return !!(device && device.host && device.protocol && device.protocol !== "unknown");
  }

  // Son komutun gerçek durumu: sohbet/ekranlar "gönderildi" ile "cihaza ulaştı"yı ayırabilsin.
  function lanStatus(index) {
    return LAN_STATUS[index] || null;
  }
  function lanError(index) {
    return LAN_ERRORS[index] || null;
  }

  function sendCommand(device, capability, value, index) {
    if (!isLan(device) || typeof window.nexusLan === "undefined") return;
    if (!window.nexusLan.supports(device, capability)) return;
    delete LAN_ERRORS[index];
    LAN_STATUS[index] = "pending";
    window.nexusLan
      .write(device, capability, value)
      .then(function () {
        LAN_ONLINE[index] = true;
        LAN_STATUS[index] = "ok";
        notify(index);
      })
      .catch(function (err) {
        LAN_ONLINE[index] = false;
        LAN_STATUS[index] = "error";
        var msg = err && err.message ? String(err.message) : "";
        LAN_ERRORS[index] = /kullanılamıyor|desteklenmiyor|yalnızca masaüstü|yerel değil/.test(msg)
          ? msg
          : "Komut cihaza ulaşamadı — cihazın açık ve aynı Wi-Fi ağında olduğunu doğrula.";
        notify(index);
      });
  }

  // Yerel ağ cihazının gerçek durumunu okuyup kayda işler (açılışta / yenilemede).
  function refreshFromDevice(index) {
    var devices = readDevices();
    var device = devices[index];
    if (!isLan(device) || typeof window.nexusLan === "undefined") return Promise.resolve(null);
    return window.nexusLan
      .read(device)
      .then(function (live) {
        var all = readDevices();
        if (!all[index]) return null;
        var st = all[index].state || {};
        Object.keys(live || {}).forEach(function (k) {
          if (live[k] != null && k !== "reachable") st[k] = live[k];
        });
        all[index].state = st;
        writeDevices(all);
        LAN_ONLINE[index] = live && live.reachable === false ? false : true;
        delete LAN_ERRORS[index];
        notify(index);
        return st;
      })
      .catch(function () {
        LAN_ONLINE[index] = false;
        notify(index);
        return null;
      });
  }

  function applyField(device, field, value) {
    var st = device.state || {};
    if (field === "coverAction") {
      if (value === "open") st.position = 100;
      else if (value === "close") st.position = 0;
      st.switch = (st.position || 0) > 0;
    } else if (field === "position") {
      st.position = value;
      st.switch = value > 0;
    } else if (field === "target") {
      st.target = Math.round(value * 2) / 2;
    } else if (field === "brightness" || field === "volume") {
      st[field] = value;
      if (value > 0 && hasCap(device, "switch")) st.switch = true;
    } else if (field === "preset") {
      st.brightness = value.brightness;
      if (value.tone) st.tone = value.tone;
      if (value.color) st.color = value.color;
      if (hasCap(device, "switch")) st.switch = true;
    } else {
      st[field] = value;
    }
    device.state = st;
    return device;
  }

  // Tek alan değişikliği: kaydet + (destekleniyorsa) LAN komutu gönder.
  // Anahtar (switch) çevrildiğinde tek cihaz sesi + kartta "komut gitti" nabzı;
  // senaryo içi çağrılarda (SCENE_QUIET) ses çıkmaz, senaryo tek sesle biter.
  var SCENE_QUIET = false;

  function setField(index, field, value) {
    // Aile izni: tüm evlerinde "cihazları kontrol et" izni kapalı bir üye (ör. Misafir) komut gönderemez.
    if (window.nexusHouseholdCloud && !window.nexusHouseholdCloud.canControl()) {
      if (window.nexusDialog) window.nexusDialog({ icon: "warning", title: "İzin yok", message: "Bu evde cihaz kontrol iznin yok. Ev sahibi izni açabilir." });
      return null;
    }
    var devices = readDevices();
    if (!devices[index]) return null;
    var prev = stateOf(devices[index]);
    var prevSwitch = prev.switch;
    var prevBrightness = prev.brightness;
    devices[index] = applyField(devices[index], field, value);
    writeDevices(devices);
    var st = devices[index].state;
    var flipped = st.switch !== prevSwitch && hasCap(devices[index], "switch");
    if (flipped) {
      if (SCENE_QUIET) {
        /* senaryo: tek sahne sesi yeter */
      } else if (window.nexusFeedback) {
        var card = document.getElementById("dyn-card-" + devices[index].id);
        window.nexusFeedback.power(st.switch, card);
      }
      sendCommand(devices[index], "switch", st.switch, index);
    }
    if (st.brightness !== prevBrightness && hasCap(devices[index], "brightness"))
      sendCommand(devices[index], "brightness", st.brightness, index);
    if (
      field === "color" ||
      (field === "preset" && value && value.color && hasCap(devices[index], "color"))
    )
      sendCommand(devices[index], "color", st.color, index);
    sendExtra(devices[index], field, index, value);
    return devices[index];
  }

  // Perde konumu, termostat hedefi, kilit ve süpürge komutları (destekleyen protokollerde, ör. Home Assistant)
  function sendExtra(device, field, index, value) {
    var st = device.state || {};
    // "Durdur": hareketi cihazda durdurur; kayıtlı konumu yeniden göndermek perdeyi yine hareket ettirirdi
    if (field === "coverAction" && value === "stop") {
      if (canSend(device, "coverStop")) sendCommand(device, "coverStop", true, index);
    } else if ((field === "position" || field === "coverAction") && typeof st.position === "number")
      sendCommand(device, "position", st.position, index);
    else if (field === "mode" && kindOf(device) !== "vacuum" && canSend(device, "hvacMode"))
      sendCommand(device, "hvacMode", st.mode, index);
    else if (field === "effect" && canSend(device, "effect"))
      sendCommand(device, "effect", st.effect, index);
    else if (field === "lightScene" && canSend(device, "lightScene"))
      sendCommand(device, "lightScene", st.lightScene, index);
    else if (field === "targetHumidity" && canSend(device, "targetHumidity"))
      sendCommand(device, "targetHumidity", st.targetHumidity, index);
    else if (field === "tilt" && canSend(device, "tilt")) sendCommand(device, "tilt", st.tilt, index);
    else if (field === "powerOn" && canSend(device, "powerOn")) sendCommand(device, "powerOn", st.powerOn, index);
    else if (field === "transport" && canSend(device, "transport"))
      sendCommand(device, "transport", st.transport, index);
    else if (field === "indicator" && canSend(device, "indicator"))
      sendCommand(device, "indicator", st.indicator !== false, index);
    else if (field === "fan" && canSend(device, "fanMode"))
      sendCommand(device, "fanMode", st.fan, index);
    else if (field === "swing" && canSend(device, "swing"))
      sendCommand(device, "swing", st.swing === true, index);
    else if (field === "volume" && canSend(device, "volume"))
      sendCommand(device, "volume", st.volume, index);
    else if (field === "muted" && canSend(device, "mute"))
      sendCommand(device, "mute", st.muted === true, index);
    else if (field === "source" && canSend(device, "source"))
      sendCommand(device, "source", st.source, index);
    else if (field === "suction" && canSend(device, "suction"))
      sendCommand(device, "suction", st.suction, index);
    else if ((field === "tone" || (field === "preset" && st.tone)) && st.tone)
      sendCommand(device, "colorTemp", st.tone, index);
    else if (field === "target" && typeof st.target === "number")
      sendCommand(device, "target", st.target, index);
    else if (field === "locked") sendCommand(device, "lock", !!st.locked, index);
    else if (field === "mode" && kindOf(device) === "vacuum")
      sendCommand(device, "vacuum", st.mode, index);
  }

  function groupAction(panelId, action) {
    var devices = readDevices();
    var touched = [];
    devices.forEach(function (device, index) {
      if (panelOf(device).id !== panelId) return;
      var kind = kindOf(device);
      var before = stateOf(device).switch;
      if (action === "on" || action === "off") {
        if (!hasPower(device)) return;
        applyField(device, "switch", action === "on");
      } else if (action === "open" || action === "close") {
        if (kind !== "cover") return;
        applyField(device, "coverAction", action);
      } else if (action === "lock") {
        if (kind !== "lock") return;
        applyField(device, "locked", true);
      } else if (action === "clean" || action === "dock") {
        if (kind !== "vacuum") return;
        applyField(device, "mode", action === "clean" ? "cleaning" : "docked");
      } else if (action === "notify-on" || action === "notify-off") {
        applyField(device, "notify", action === "notify-on");
      }
      if (stateOf(device).switch !== before && hasCap(device, "switch")) touched.push(index);
    });
    writeDevices(devices);
    // Grup hareketi TEK ses: hepsini aç/kapat kabusu olmasın (cihaz başına değil).
    if (touched.length && window.nexusFeedback) {
      SCENE_QUIET = true;
      try {
        window.nexusFeedback.power(action === "on", null);
      } finally {
        SCENE_QUIET = false;
      }
    }
    touched.forEach(function (index) {
      sendCommand(devices[index], "switch", devices[index].state.switch, index);
    });
    devices.forEach(function (device, index) {
      if (panelOf(device).id !== panelId) return;
      var kind = kindOf(device);
      if ((action === "open" || action === "close") && kind === "cover")
        sendExtra(device, "position", index);
      else if (action === "lock" && kind === "lock") sendExtra(device, "locked", index);
      else if ((action === "clean" || action === "dock") && kind === "vacuum")
        sendExtra(device, "mode", index);
    });
  }

  function removeDevice(index) {
    var devices = readDevices();
    if (!devices[index]) return;
    devices.splice(index, 1);
    writeDevices(devices);
  }

  function renameDevice(index, name) {
    var devices = readDevices();
    if (!devices[index] || !String(name || "").trim()) return;
    devices[index].name = String(name).trim().slice(0, 60);
    writeDevices(devices);
  }

  // ---------- Senaryolar: gerçek cihaz durumlarını değiştirir, yerel ağ cihazlarına komut gönderir ----------
  // Her senaryo, cihazın kontrol ekranı türüne (kind) göre uygulanacak alan/değer çiftlerini döndürür.
  // Güvenlik: hiçbir senaryo kilidi otomatik AÇMAZ, prizleri (buzdolabı vb.) kapatmaz.
  var SCENES = {
    "good-morning": {
      title: "Günaydın",
      act: function (k, d) {
        if (k === "light")
          return [
            ["switch", true],
            ["brightness", 80],
            ["tone", "warm"],
          ];
        if (k === "cover") return [["coverAction", "open"]];
        if (k === "climate" || k === "ac")
          return hasFeature(d, "target")
            ? [
                ["switch", true],
                ["target", 22],
              ]
            : [];
        if (k === "thermostat")
          return [
            ["target", 22],
            ["profile", "comfort"],
          ];
      },
    },
    "leave-home": { title: "Evden çıkış", act: awayActs },
    "leave-home-summary": { title: "Evden çıkış", act: awayActs },
    "away-home": { title: "Evden uzakta", act: awayActs },
    "welcome-home": {
      title: "Eve geldim",
      act: function (k, d) {
        if (k === "light")
          return [
            ["switch", true],
            ["brightness", 70],
          ];
        if (k === "cover") return [["coverAction", "open"]];
        if (k === "ac")
          return hasFeature(d, "target")
            ? [
                ["switch", true],
                ["target", 22],
              ]
            : [["switch", true]];
        if (k === "thermostat")
          return [
            ["target", 22],
            ["profile", "comfort"],
          ];
        if (k === "vacuum") return [["mode", "docked"]];
      },
    },
    "sleep-prep": { title: "Gece hazırlığı", act: sleepActs },
    "sleep-mode": { title: "Uyku modu", act: sleepActs },
    "night-security": {
      title: "Gece güvenliği",
      act: function (k) {
        if (k === "lock") return [["locked", true]];
        if (k === "cover") return [["coverAction", "close"]];
        if (k === "camera")
          return [
            ["privacy", false],
            ["notify", true],
          ];
        if (k === "motion" || k === "contact" || k === "alarm") return [["notify", true]];
      },
    },
    "movie-mode": {
      title: "Film modu",
      act: function (k) {
        if (k === "light")
          return [
            ["switch", true],
            ["brightness", 15],
            ["tone", "warm"],
          ];
        if (k === "cover") return [["coverAction", "close"]];
        if (k === "media") return [["switch", true]];
      },
    },
    "clean-start": {
      title: "Temizlik",
      act: function (k) {
        if (k === "vacuum") return [["mode", "cleaning"]];
      },
    },
    "guest-mode": {
      title: "Misafir modu",
      act: function (k) {
        if (k === "light")
          return [
            ["switch", true],
            ["brightness", 70],
          ];
        if (k === "camera") return [["privacy", true]];
      },
    },
    "comfort-room": {
      title: "Oda konforu",
      act: function (k, d) {
        if (k === "ac")
          return hasFeature(d, "target")
            ? [
                ["switch", true],
                ["target", 22.5],
              ]
            : [["switch", true]];
        if (k === "thermostat")
          return [
            ["target", 22],
            ["profile", "comfort"],
          ];
        if (k === "purifier")
          return [
            ["switch", true],
            ["fan", "auto"],
          ];
      },
    },
    "home-health": {
      title: "Ev sağlığı",
      act: function (k) {
        if (k === "purifier")
          return [
            ["switch", true],
            ["fan", "auto"],
          ];
      },
    },
  };
  function awayActs(k) {
    if (k === "light" || k === "media" || k === "purifier") return [["switch", false]];
    if (k === "ac") return [["switch", false]];
    if (k === "lock") return [["locked", true]];
    if (k === "cover") return [["coverAction", "close"]];
    if (k === "camera")
      return [
        ["privacy", false],
        ["notify", true],
      ];
    if (k === "motion" || k === "contact" || k === "alarm") return [["notify", true]];
  }
  function sleepActs(k, d) {
    if (k === "light" || k === "media") return [["switch", false]];
    if (k === "cover") return [["coverAction", "close"]];
    if (k === "lock") return [["locked", true]];
    if (k === "ac")
      return hasFeature(d, "sleep")
        ? [
            ["sleep", true],
            ["target", 21],
          ]
        : [];
    if (k === "thermostat")
      return [
        ["target", 20],
        ["profile", "eco"],
      ];
    if (k === "motion" || k === "contact") return [["notify", true]];
  }

  // Senaryoyu uygular: { changed: kaç cihaz, lan: kaçına gerçek komut gitti, title }
  // Bir senaryonun bu cihazda gerçekten uygulayacağı alan/değer çiftleri (cihazda olmayan özellikler elenir).
  function sceneActs(scene, device) {
    var acts = scene.act(kindOf(device), device) || [];
    // Yalnızca cihaza GERÇEKTEN gönderilebilen alanlar senaryoya girer; yalnızca uygulamada saklanacak adımlar
    // (bildirim, gizlilik, uyku, profil…) "cihaz ayarlandı" gibi görünmesin diye elenir.
    var FIELD_CAP = {
      switch: "switch",
      brightness: "brightness",
      tone: "colorTemp",
      color: "color",
      coverAction: "position",
      position: "position",
      target: "target",
      locked: "lock",
      mode: "vacuum",
    };
    return acts.filter(function (a) {
      var cap = FIELD_CAP[a[0]];
      if (!cap) return false;
      if (cap === "switch" && !hasCap(device, "switch")) return false;
      return canSend(device, cap);
    });
  }

  // Senaryodan etkilenecek eşleşmiş cihaz sayısı (değişiklik yapmadan); bilinmeyen senaryoda -1.
  function sceneAffected(id) {
    var scene = SCENES[id];
    if (!scene) return -1;
    return readDevices().filter(function (d) {
      return sceneActs(scene, d).length > 0;
    }).length;
  }

  function runScene(id) {
    var scene = SCENES[id];
    if (!scene) return { changed: 0, lan: 0, title: id, unknown: true };
    var devices = readDevices();
    var changed = 0,
      lan = 0,
      lanDevices = [];
    var cmds = [];
    // Toplu uygulama sessiz: her cihaz için ayrı toggle sesi değil, bitişte tek sahne sesi
    // (smart-scene-page.js finish içinde çalar).
    SCENE_QUIET = true;
    try {
      devices.forEach(function (device, index) {
        var acts = sceneActs(scene, device);
        if (!acts.length) return;
        // stateOf canlı referans döndürür; applyField aynı nesneyi yerinde
        // değiştirir. Karşılaştırma ilkel kopyalarla yapılır (setField'teki gibi),
        // yoksa "değişti mi" testi her zaman yanlış çıkar ve komut gitmez.
        var before = stateOf(device);
        var prev = { switch: before.switch, brightness: before.brightness };
        acts.forEach(function (a) {
          applyField(devices[index], a[0], a[1]);
          cmds.push({ index: index, field: a[0], value: a[1], prev: prev });
        });
        changed += 1;
        if (isLan(device)) {
          lan += 1;
          lanDevices.push({ index: index, name: device.name });
        }
      });
    } finally {
      SCENE_QUIET = false;
    }
    // Tek toplu yazım: her cihaz×alan için ayrı localStorage okuma/yazma yerine
    // değiştirilmiş listenin tamamı bir kez kaydedilir.
    writeDevices(devices);
    // Komut gönderimi setField ile aynı koşullarda: alan gerçekten değiştiyse.
    cmds.forEach(function (c) {
      var device = devices[c.index];
      var st = stateOf(device);
      if (c.field === "switch") {
        if (st.switch !== c.prev.switch && hasCap(device, "switch"))
          sendCommand(device, "switch", st.switch, c.index);
      } else if (c.field === "brightness") {
        if (st.brightness !== c.prev.brightness && hasCap(device, "brightness"))
          sendCommand(device, "brightness", st.brightness, c.index);
      } else if (c.field === "color") {
        sendCommand(device, "color", st.color, c.index);
      } else if (c.field === "preset") {
        if (c.value && c.value.color && hasCap(device, "color"))
          sendCommand(device, "color", st.color, c.index);
      } else if (c.field === "coverAction") {
        // setField davranışı: perde hareketi switch'i çevirirse o komut da gider
        // (pozisyon komutu sendExtra ile ayrıca yollanır).
        if (st.switch !== c.prev.switch && hasCap(device, "switch"))
          sendCommand(device, "switch", st.switch, c.index);
      }
      sendExtra(device, c.field, c.index);
    });
    return { changed: changed, lan: lan, lanDevices: lanDevices, title: scene.title };
  }

  function sceneSummary(r) {
    if (r.unknown) return "Senaryo bulunamadı.";
    if (!r.changed) return "Bu senaryodan etkilenen cihaz yok — önce uygun cihaz ekle.";
    return (
      r.title +
      ": " +
      r.changed +
      " cihaz ayarlandı" +
      (r.lan ? " (" + r.lan + " cihaza yerel ağdan komut gitti)" : "") +
      "."
    );
  }

  function deviceUrl(index) {
    return "nexus-device.html?i=" + index;
  }

  window.NX = {
    IMAGE_VERSION: IMAGE_VERSION,
    AC_MODES: AC_MODES,
    FAN_SPEEDS: FAN_SPEEDS,
    VACUUM_STATES: VACUUM_STATES,
    LAN_ERRORS: LAN_ERRORS,
    LAN_ONLINE: LAN_ONLINE,
    lanStatus: lanStatus,
    lanError: lanError,
    isLan: isLan,
    refreshFromDevice: refreshFromDevice,
    readDevices: readDevices,
    writeDevices: writeDevices,
    escapeHtml: escapeHtml,
    deviceCaps: deviceCaps,
    hasCap: hasCap,
    panelOf: panelOf,
    thumbFor: thumbFor,
    imageUrl: imageUrl,
    stateOf: stateOf,
    clamp: clamp,
    kindOf: kindOf,
    featuresOf: featuresOf,
    screenOf: screenOf,
    hasFeature: hasFeature,
    statusOf: statusOf,
    hasPower: hasPower,
    setField: setField,
    groupAction: groupAction,
    removeDevice: removeDevice,
    renameDevice: renameDevice,
    deviceUrl: deviceUrl,
    runScene: runScene,
    sceneAffected: sceneAffected,
    // Senaryonun bu cihazda gerçekten uygulayacağı alan/değer çiftleri (önizleme için).
    sceneActsOf: function (id, device) {
      var s = SCENES[id];
      return s ? sceneActs(s, device) : [];
    },
    sceneSummary: sceneSummary,
    SCENES: SCENES,
    onError: onError,
    fmtTemp: fmtTemp,
    tempNum: tempNum,
    tempUnit: tempUnit,
    tempSymbol: tempSymbol,
  };
})();
