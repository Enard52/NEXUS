if (typeof lucide !== "undefined") lucide.createIcons();

var pendingCatalogCategory = "all";

function openHelp() {
  window.location.href = "nexus-feedback.html";
}

function scrollToManualCatalog() {
  var section = document.getElementById("manual-catalog-section");
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function getPairedDevices() {
  var devices = [];
  try {
    devices = JSON.parse(nexusGetItem("nexusPairedDevices") || "[]");
  } catch (error) {
    devices = [];
  }
  return Array.isArray(devices) ? devices : [];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildCatalogUrl(category) {
  var target = "nexus-integrations.html";
  if (!category || category === "all") return target;
  return target + "?category=" + encodeURIComponent(category);
}

function openCatalogCategory(category) {
  pendingCatalogCategory = category;
  window.location.href = buildCatalogUrl(category);
}

// --- Yerel ağ taraması (manuel IP yolu) -------------------------------
// mDNS keşfi native eklenti gerektirdiği için ilk yol budur; connector'lar
// protokolü kendisi tanır (lan-connectors.js).
function normalizeHost(raw) {
  var value = String(raw || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, "");
  if (/^\d{1,3}(\.\d{1,3}){3}(:\d{1,5})?$/.test(value)) return "http://" + value;
  return null;
}

var KIND_PROFILE = {
  light: { caps: ["switch", "brightness"], img: "generic-led-bulb.png" },
  plug: { caps: ["switch", "energy"], img: "generic-smart-plug.png" },
  switch: { caps: ["switch"], img: "control-single-wall-switch.png" },
};
// Protokolün gerçekten yazabildiği ek yetenekler (renk vb.)
var PROTOCOL_EXTRA = { wled: ["color"], tasmota: [], yeelight: ["color"] };
var PROTOCOL_POWERON = { sonoff: 1, shelly: 1, "shelly-rpc": 1, tasmota: 1 };
var PROTOCOL_CT = { yeelight: 1, wiz: 1, lifx: 1, govee: 1 };
var PROTOCOL_IMG = { wled: "generic-led-strip.png" };

// Kart içi durum metni: ortak uyarı kutusu (.nx-notice); tone: info | ok | warn | error. Boş metin kutuyu gizler.
function setCardStatus(el, text, tone) {
  if (!el) return;
  el.className = "nx-notice nx-notice--" + (tone || "info") + " mt-3" + (text ? "" : " hidden");
  el.setAttribute("role", tone === "error" ? "alert" : "status");
  el.textContent = text || "";
}

// Hata durumunda (retry verilirse) sonraki adım: "Tekrar dene" + yardım bağlantısı.
function setScanStatus(message, tone, retry) {
  var el = document.getElementById("lan-scan-status");
  var kind = tone === "error" ? "error" : tone === "ok" ? "ok" : "info";
  el.className = "nx-notice nx-notice--" + kind + " mt-3" + (message ? "" : " hidden");
  el.setAttribute("role", kind === "error" ? "alert" : "status");
  el.textContent = "";
  var body = document.createElement("span");
  body.className = "min-w-0 flex-1";
  body.textContent = message;
  el.appendChild(body);
  if (tone === "error" && typeof retry === "function") {
    var row = document.createElement("span");
    row.className = "mt-1 flex items-center gap-3";
    var again = document.createElement("button");
    again.type = "button";
    again.className = "font-bold underline";
    again.textContent = "Tekrar dene";
    again.addEventListener("click", retry);
    var help = document.createElement("a");
    help.href = "nexus-feedback.html";
    help.className = "font-bold underline";
    help.textContent = "Yardım al";
    row.appendChild(again);
    row.appendChild(help);
    body.appendChild(row);
  }
}

// Bulunan cihaz için kullanıcıya anlaşılır protokol adı ve gerçekten gönderilebilen komutların özeti
var CAP_LABELS = {
  switch: "aç/kapat",
  brightness: "parlaklık",
  color: "renk",
  colorTemp: "ışık tonu",
  position: "konum",
  lightScene: "sahne",
  effect: "efekt",
  target: "sıcaklık",
  lock: "kilit",
  vacuum: "süpürge",
  volume: "ses",
};
function protocolLabel(found) {
  var p =
    window.nexusLan && window.nexusLan.protocolFor
      ? window.nexusLan.protocolFor(found.protocol)
      : null;
  return (p && p.label) || found.protocol;
}
function controlSummary(found) {
  var p =
    window.nexusLan && window.nexusLan.protocolFor
      ? window.nexusLan.protocolFor(found.protocol)
      : null;
  var supported = (p && p.caps) || [];
  if (!supported.length) return "bu sürümde kontrol edilemiyor";
  var base =
    found.caps ||
    (found.kind === "light"
      ? ["switch", "brightness"]
      : found.kind === "cover"
        ? ["position"]
        : ["switch"]);
  var names = [];
  base
    .concat(
      found.options && found.options.scenes ? ["lightScene"] : [],
      found.options && found.options.effects ? ["effect"] : [],
    )
    .forEach(function (c) {
      if (supported.indexOf(c) !== -1 && CAP_LABELS[c] && names.indexOf(CAP_LABELS[c]) === -1)
        names.push(CAP_LABELS[c]);
    });
  return names.length ? "yerel ağda: " + names.join(", ") : "yerel ağda kontrol edilir";
}

// Bulunan cihazın görseli: eklendikten sonra listede görünenle aynı kaynaktan (found.img → protokol → tür) çözülür
function foundImageUrl(found) {
  var profile = KIND_PROFILE[found.kind] || KIND_PROFILE.switch;
  var record = {
    name: found.name,
    model: found.model,
    kind: found.kind,
    caps: found.caps || profile.caps,
    img: found.img || PROTOCOL_IMG[found.protocol] || profile.img,
  };
  return window.NX && NX.imageUrl ? NX.imageUrl(record) : "assets/products/" + record.img;
}
function foundImageHtml(found, cls) {
  return (
    '<img class="' +
    (cls || "w-11 h-11") +
    ' object-contain shrink-0" src="' +
    foundImageUrl(found) +
    '" alt="" decoding="async">'
  );
}

function scanLanHost() {
  var host = normalizeHost(document.getElementById("lan-scan-host").value);
  var resultHost = document.getElementById("lan-scan-result");
  resultHost.innerHTML = "";
  if (!host) {
    setScanStatus("Cihaz adresi geçersiz. Taramayı yeniden başlat.", "error");
    return;
  }
  var btn = document.getElementById("lan-auto-btn");
  btn.disabled = true;
  setScanStatus("Cihaz tanınıyor…", "");
  window.nexusLan
    .identify(host)
    .then(function (found) {
      setScanStatus(
        found.name +
          " bulundu · " +
          protocolLabel(found) +
          (found.model ? " · " + found.model : ""),
        "ok",
      );
      window.__nexusScannedDevice = found;
      if (plusBlocked(resultHost, found.protocol)) return;
      if (found.protocol === "hue") {
        renderHuePairing(resultHost, host);
        return;
      }
      if (found.protocol === "homeassistant") {
        renderHaPairing(resultHost, found.host);
        return;
      }
      if (found.protocol === "tapo") {
        renderTapoPairing(resultHost, host);
        return;
      }
      resultHost.innerHTML =
        (found.protocol === "esphome" && !found.entity
          ? '<label class="block mb-2 text-xs font-semibold text-slate-500 dark:text-slate-300">ESPHome bileşen kimliği (YAML\'daki id, ör. relay)' +
            '<input id="esphome-entity" data-enter="addScannedDevice" enterkeyhint="go" class="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm dark:bg-slate-900 dark:border-slate-700" placeholder="relay"></label>'
          : "") +
        '<button type="button" onclick="addScannedDevice()" ' +
        'class="plain-card w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left active:scale-[0.99] dark:border-slate-800 flex items-center gap-3">' +
        foundImageHtml(found, "device-thumb w-11 h-11") +
        '<span class="min-w-0 flex-1"><span class="block text-sm font-bold truncate">' +
        escapeHtml(found.name) +
        "</span>" +
        '<span class="block text-[11px] text-slate-500 dark:text-slate-300">' +
        escapeHtml(host) +
        " · " +
        controlSummary(found) +
        "</span></span></button>";
    })
    .catch(function () {
      // Tanınmayan ama ağda açık bir cihaz (ör. bilgisayar, TV): MAC adresi okunabilirse Wake-on-LAN ile uyandırılabilir.
      var lookup =
        window.nexusLan && window.nexusLan.wol
          ? window.nexusLan.wol.lookupMac(host)
          : Promise.resolve(null);
      return lookup.then(function (mac) {
        if (mac) renderWolPairing(resultHost, host, mac);
        else setScanStatus("Bu adreste bilinen bir NEXUS cihazı bulunamadı. Cihazın aynı ağda ve açık olduğundan emin ol.", "error", scanLanHost);
      });
    })
    .finally(function () {
      btn.disabled = false;
    });
}

function storeFoundDevice(found) {
  // Çok kanallı röleler (Sonoff DIY): her kanal ayrı cihaz olarak eklenir
  if (found.channels > 1 && !found.channelOf) {
    var any = false;
    for (var ch = 0; ch < found.channels; ch++) {
      var copy = {};
      Object.keys(found).forEach(function (k) {
        copy[k] = found[k];
      });
      copy.channelOf = true;
      copy.endpointId = ch;
      copy.name = found.name + " · Kanal " + (ch + 1);
      if (storeFoundDevice(copy)) any = true;
    }
    return any;
  }
  var devices = getPairedDevices();
  var normalizedHost = /^https?:\/\//.test(found.host) ? found.host : "http://" + found.host;
  var key = normalizedHost + "#" + (found.endpointId != null ? found.endpointId : 0);
  // Tapo hesabı / Tuya yerel anahtarı cihaz kaydına yazılmaz: yalnızca bu cihazın yerel gizli deposuna (buluta gitmez).
  if (found.secret && window.nexusLan && window.nexusLan.secrets) {
    var secretId = (
      "lan-" +
      normalizedHost +
      (found.endpointId != null && found.endpointId !== 0 ? "-" + found.endpointId : "")
    )
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase();
    window.nexusLan.secrets.set(secretId, found.secret);
  }
  if (
    !devices.some(function (d) {
      return d && d.host + "#" + (d.endpointId != null ? d.endpointId : 0) === key;
    })
  ) {
    var profile = KIND_PROFILE[found.kind] || KIND_PROFILE.switch;
    var caps = (found.caps || profile.caps).slice();
    (PROTOCOL_EXTRA[found.protocol] || []).forEach(function (c) {
      if (found.kind === "light" && caps.indexOf(c) === -1) caps.push(c);
    });
    // Renkli ampuller beyaz tonunu da ayarlar (Yeelight / WiZ / LIFX); renk yeteneği olmayan cihaza eklenmez.
    if (
      PROTOCOL_CT[found.protocol] &&
      found.kind === "light" &&
      caps.indexOf("color") !== -1 &&
      caps.indexOf("colorTemp") === -1
    )
      caps.push("colorTemp");
    // Cihazın kendi bildirdiği efekt ve sahne listeleri (WLED / WiZ): liste varsa yetenek de vardır
    // Yeelight sahneleri renk/ton gerektirir: yalnızca renkli ampullerde sunulur
    if (
      found.options &&
      found.options.scenes &&
      found.options.scenes.length &&
      caps.indexOf("lightScene") === -1 &&
      (found.protocol !== "yeelight" || caps.indexOf("color") !== -1)
    )
      caps.push("lightScene");
    if (
      found.options &&
      found.options.effects &&
      found.options.effects.length &&
      caps.indexOf("effect") === -1
    )
      caps.push("effect");
    // Röle tabanlı cihazlarda "elektrik gelince" başlangıç durumu protokolün kendi ayarıdır (Sonoff / Shelly / Tasmota)
    if (
      PROTOCOL_POWERON[found.protocol] &&
      (found.kind === "switch" || found.kind === "plug") &&
      caps.indexOf("powerOn") === -1
    )
      caps.push("powerOn");
    // Kasa prizlerinin durum ışığı set_led_off ile gerçekten yönetilir
    if (found.protocol === "kasa" && found.kind === "plug" && caps.indexOf("indicator") === -1)
      caps.push("indicator");
    devices.push({
      id: (
        "lan-" +
        normalizedHost +
        (found.endpointId != null && found.endpointId !== 0 ? "-" + found.endpointId : "")
      )
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase(),
      name: found.name,
      room: "Yerel ağ",
      icon: "cpu",
      host: normalizedHost,
      protocol: found.protocol,
      kind: found.kind,
      model: found.model,
      caps: caps,
      img: found.img || PROTOCOL_IMG[found.protocol] || profile.img,
      endpointId: found.endpointId != null ? found.endpointId : 0,
      entity: found.entity || null,
      mac: found.mac || null,
      hueUser: found.hueUser || null,
      haToken: found.haToken || null,
      options: found.options || null,
      channels: found.channels > 1 ? found.channels : null,
    });
    nexusSetItem("nexusPairedDevices", JSON.stringify(devices));
    if (window.nexusCloud) window.nexusCloud.notifyLocalChange();
    return true;
  }
  return false;
}

function homeLinkHtml() {
  return (
    '<a href="nexus-home.html" class="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white active:scale-[0.98]">' +
    '<i data-lucide="home" class="w-3.5 h-3.5"></i>Ana Sayfa</a>'
  );
}

function addScannedDevice() {
  var found = window.__nexusScannedDevice;
  if (!found) return;
  var entityInput = document.getElementById("esphome-entity");
  if (entityInput) {
    var entity = entityInput.value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");
    if (!entity) {
      setScanStatus("ESPHome bileşen kimliğini yaz (cihazın YAML dosyasındaki id).", "error");
      return;
    }
    found.entity = entity;
  }
  var isNew = storeFoundDevice(found);
  if (isNew) {
    setScanStatus("Eklendi.", "ok");
    document.getElementById("lan-scan-result").innerHTML =
      '<div class="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-4 py-4 flex items-center gap-3">' +
      foundImageHtml(found, "device-thumb w-11 h-11") +
      '<div class="min-w-0 flex-1">' +
      '<p class="text-sm font-bold text-emerald-700 dark:text-emerald-400">' +
      escapeHtml(found.name) +
      " eklendi</p>" +
      '<p class="text-[11px] text-emerald-600/70 dark:text-emerald-400/60 mt-0.5">Ana sayfadan yönetebilirsin</p></div>' +
      homeLinkHtml() +
      "</div>";
  } else {
    setScanStatus("Bu cihaz zaten ekli.", "ok");
  }
  if (typeof lucide !== "undefined") lucide.createIcons();
}

// Philips Hue: köprü bir kez eşleştirilir, her lamba ayrı cihaz olarak eklenir.
function renderHuePairing(target, host) {
  target.innerHTML =
    '<div class="plain-card rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800">' +
    '<p class="text-sm font-bold">Hue köprüsü bulundu</p>' +
    '<p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">Köprünün üstündeki yuvarlak düğmeye bas, ardından 30 saniye içinde “Köprüyü bağla”ya dokun.</p>' +
    '<button type="button" id="hue-pair-btn" onclick="pairHueBridge(\'' +
    escapeHtml(host) +
    '\')" class="mt-3 w-full min-h-[44px] rounded-full bg-[#4C7DFF] text-sm font-bold text-white active:scale-[0.98]">Köprüyü bağla</button>' +
    '<p id="hue-pair-status" class="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-300"></p></div>';
}

function pairHueBridge(host) {
  var btn = document.getElementById("hue-pair-btn");
  var status = document.getElementById("hue-pair-status");
  btn.disabled = true;
  setCardStatus(status, "Köprüyle eşleşiliyor…", "info");
  window.nexusLan.hue
    .pair(host)
    .then(function (user) {
      setCardStatus(status, "Bağlandı, lambalar okunuyor…", "info");
      return window.nexusLan.hue.lights(host, user).then(function (lights) {
        var added = 0;
        lights.forEach(function (l) {
          var ok = storeFoundDevice({
            host: host,
            name: l.name,
            protocol: "hue",
            kind: "light",
            model: l.model,
            caps: l.caps,
            options: l.options,
            endpointId: l.id,
            hueUser: user,
            img: l.caps.indexOf("color") !== -1 ? "generic-led-bulb.png" : "generic-led-bulb.png",
          });
          if (ok) added += 1;
        });
        setCardStatus(
          status,
          lights.length
            ? added + " lamba eklendi. Ana sayfadan yönetebilirsin."
            : "Köprüye bağlı lamba bulunamadı.",
          lights.length ? "ok" : "warn",
        );
        setScanStatus("Hue köprüsü bağlandı.", "ok");
      });
    })
    .catch(function (e) {
      setCardStatus(
        status,
        e && e.code === "link-button"
          ? e.message
          : "Köprüye bağlanılamadı. Aynı ağda olduğundan emin ol ve tekrar dene.",
        "error",
      );
    })
    .then(function () {
      btn.disabled = false;
    });
}

// Home Assistant: kullanıcının kendi HA sunucusu. Uzun ömürlü erişim jetonu bir kez girilir,
// HA'daki ışık, priz, perde, klima, kilit, süpürge ve medya cihazları tek tek eklenir.
var haEntities = [];
var haConn = null;
function renderHaPairing(target, host) {
  haConn = { host: host, token: null };
  target.innerHTML =
    '<div class="plain-card rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800">' +
    '<p class="text-sm font-bold">Home Assistant bulundu</p>' +
    '<p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">Home Assistant\'ta Profil → Güvenlik → Uzun ömürlü erişim jetonları bölümünden bir jeton oluştur ve buraya yapıştır. Jeton yalnızca bu cihazda saklanır.</p>' +
    '<input id="ha-token" type="password" autocomplete="off" data-enter="connectHomeAssistant" enterkeyhint="go" class="mt-3 w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm dark:bg-slate-900 dark:border-slate-700" placeholder="Erişim jetonu">' +
    '<button type="button" id="ha-connect-btn" onclick="connectHomeAssistant()" class="mt-3 w-full min-h-[44px] rounded-full bg-[#4C7DFF] text-sm font-bold text-white active:scale-[0.98]">Bağlan</button>' +
    '<p id="ha-status" class="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-300"></p>' +
    '<div id="ha-list" class="mt-3 space-y-2"></div></div>';
}

function connectHomeAssistant() {
  var token = (document.getElementById("ha-token").value || "").trim();
  var status = document.getElementById("ha-status");
  var btn = document.getElementById("ha-connect-btn");
  if (!token) {
    setCardStatus(status, "Erişim jetonunu yapıştır.", "error");
    return;
  }
  btn.disabled = true;
  setCardStatus(status, "Home Assistant'a bağlanılıyor…", "info");
  window.nexusLan.homeassistant
    .entities(haConn.host, token)
    .then(function (list) {
      haConn.token = token;
      haEntities = list;
      setCardStatus(
        status,
        list.length
          ? list.length + " cihaz bulundu. Eklemek istediklerini seç."
          : "Home Assistant'ta NEXUS'un kontrol edebileceği cihaz bulunamadı.",
        list.length ? "ok" : "warn",
      );
      setScanStatus("Home Assistant bağlandı.", "ok");
      renderHaEntities();
    })
    .catch(function (e) {
      setCardStatus(
        status,
        e && e.code === "auth"
          ? "Jeton geçersiz. Home Assistant'ta yeni bir jeton oluşturup tekrar dene."
          : "Home Assistant'a bağlanılamadı. Adresin doğru ve aynı ağda olduğundan emin ol.",
        "error",
      );
    })
    .then(function () {
      btn.disabled = false;
    });
}

function haDeviceRecord(item) {
  var IMG = {
    light: "generic-led-bulb.png",
    cover: "control-curtain-motor.png",
    lock: "security-keypad-lock.png",
    vacuum: "generic-robot-vacuum.png",
    ac: "generic-air-conditioner.png",
    media: "generic-smart-tv.png",
    climatesensor: "generic-temp-humidity.png",
    envsensor: "generic-air-quality.png",
    motion: "generic-motion-sensor.png",
    contact: "security-door-sensor.png",
    alarm: "security-smoke-detector.png",
    purifier: "generic-humidifier.png",
  };
  return {
    host: haConn.host,
    name: item.name,
    protocol: "homeassistant",
    kind: item.kind,
    model: item.model,
    caps: item.caps,
    options: item.options || null,
    endpointId: item.entity,
    entity: item.entity,
    haToken: haConn.token,
    img: IMG[item.kind],
  };
}

function renderHaEntities() {
  var host = document.getElementById("ha-list");
  if (!host) return;
  var devices = getPairedDevices();
  var addedKeys = {};
  devices.forEach(function (d) {
    if (d && d.protocol === "homeassistant") addedKeys[d.entity] = 1;
  });
  var rest = haEntities.filter(function (it) {
    return !addedKeys[it.entity];
  }).length;
  host.innerHTML =
    (rest > 1
      ? '<button type="button" onclick="addAllHaEntities()" class="w-full min-h-[40px] rounded-full bg-slate-900 text-xs font-bold text-white active:scale-[0.98] dark:bg-slate-100 dark:text-slate-900">Tümünü ekle (' +
        rest +
        ")</button>"
      : "") +
    haEntities
      .map(function (it, i) {
        return (
          '<div class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800">' +
          '<div class="min-w-0"><p class="text-sm font-bold truncate">' +
          escapeHtml(it.name) +
          "</p>" +
          '<p class="text-[11px] text-slate-500 truncate dark:text-slate-300">' +
          escapeHtml(it.entity) +
          "</p></div>" +
          (addedKeys[it.entity]
            ? '<span class="shrink-0 text-[11px] font-bold text-emerald-600">ekli</span>'
            : '<button type="button" class="shrink-0 rounded-full bg-[#4C7DFF] px-3 py-1.5 text-[11px] font-bold text-white active:scale-[0.98]" onclick="addHaEntity(' +
              i +
              ')">Ekle</button>') +
          "</div>"
        );
      })
      .join("");
}

function addHaEntity(i) {
  if (!haEntities[i] || !haConn || !haConn.token) return;
  storeFoundDevice(haDeviceRecord(haEntities[i]));
  renderHaEntities();
}

function addAllHaEntities() {
  if (!haConn || !haConn.token) return;
  var n = 0;
  haEntities.forEach(function (it) {
    if (storeFoundDevice(haDeviceRecord(it))) n += 1;
  });
  setCardStatus(
    document.getElementById("ha-status"),
    n + " cihaz eklendi. Ana sayfadan yönetebilirsin.",
    "ok",
  );
  renderHaEntities();
}

// Matter: kurulum kodu / QR içeriği ekranlarından gelen kodla cihaz yerel ağda eşleştirilir (masaüstü uygulaması).
// Kod bu sayfaya adres çubuğuyla değil, oturum belleğiyle taşınır. Eşleştirme 1,5 dakikaya kadar sürebilir.
function startMatterPairing(code) {
  var target = document.getElementById("lan-scan-result");
  var bridge = window.nexusLan && window.nexusLan.matter;
  var hasBridge = !!(window.nexusDesktop && window.nexusDesktop.matter && bridge);
  var card = function (title, text, tone) {
    target.innerHTML =
      '<div class="plain-card rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800">' +
      '<p class="text-sm font-bold">' +
      escapeHtml(title) +
      "</p>" +
      '<p class="nx-notice nx-notice--' +
      (tone === "error" ? "error" : "info") +
      ' mt-3" role="' +
      (tone === "error" ? "alert" : "status") +
      '">' +
      escapeHtml(text) +
      "</p></div>";
  };
  if (!hasBridge) {
    setScanStatus("Matter cihazları şimdilik yalnızca masaüstü uygulamasında eklenir.", "error");
    card(
      "Matter için masaüstü uygulaması gerekir",
      "Bu kodu NEXUS masaüstü uygulamasında gir. Cihaz Wi-Fi ile bağlıysa yerel ağdan IP adresiyle de ekleyebilirsin.",
      "error",
    );
    return;
  }
  setScanStatus("Matter cihazı aranıyor…", "");
  card(
    "Matter cihazı eşleştiriliyor",
    "Cihaz aynı ağda aranıyor ve eşleştiriliyor. Bu bir dakikayı bulabilir; cihazın açık ve eşleştirme modunda olması gerekir.",
  );
  bridge
    .commission(code)
    .then(function (records) {
      var added = 0;
      records.forEach(function (r) {
        if (storeFoundDevice(r)) added += 1;
      });
      var first = records[0];
      setScanStatus("Matter cihazı bağlandı.", "ok");
      target.innerHTML =
        '<div class="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-4 py-4 flex items-center gap-3">' +
        foundImageHtml(first, "device-thumb w-11 h-11") +
        '<div class="min-w-0 flex-1"><p class="text-sm font-bold text-emerald-700 dark:text-emerald-400">' +
        escapeHtml(first.name) +
        (added > 1 ? " ve " + (added - 1) + " bölüm daha" : "") +
        " eklendi</p>" +
        '<p class="text-[11px] text-emerald-600/70 dark:text-emerald-400/60 mt-0.5">Ana sayfadan yönetebilirsin</p></div>' +
        homeLinkHtml() +
        "</div>";
      if (typeof lucide !== "undefined") lucide.createIcons();
    })
    .catch(function (e) {
      var msg = e && e.message ? e.message : "Matter cihazı eşleştirilemedi.";
      setScanStatus("Matter cihazı eklenemedi.", "error");
      card("Matter cihazı eklenemedi", msg, "error");
    });
}

// Wake-on-LAN: cihaz NEXUS protokollerinden birini konuşmuyor ama ağda açık; MAC adresi ağ tablosundan okundu.
// Eklenince ana sayfadaki düğme uyandırma paketi gönderir (cihazda Wake-on-LAN açık olmalı; cevap vermediği için sonuç doğrulanamaz).
function renderWolPairing(target, host, mac) {
  setScanStatus("Bu adreste bir cihaz var ama NEXUS protokolü konuşmuyor.", "");
  target.innerHTML =
    '<div class="plain-card rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800">' +
    '<p class="text-sm font-bold">Uyandırılabilir cihaz</p>' +
    '<p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">' +
    escapeHtml(host) +
    " adresindeki cihazın MAC adresi (" +
    escapeHtml(mac) +
    ") otomatik okundu. Bilgisayar ya da TV ise uykudayken uyandırmak için ekleyebilirsin. Cihazın ayarlarında Wake-on-LAN açık olmalı.</p>" +
    '<input id="wol-name" autocomplete="off" class="' +
    FIELD_CLS +
    '" placeholder="Cihaz adı" value="Bilgisayar / TV">' +
    '<button type="button" id="wol-btn" onclick="addWolDevice(\'' +
    escapeHtml(host) +
    "', '" +
    escapeHtml(mac) +
    '\')" class="' +
    BTN_CLS +
    '">Uyandırma cihazı olarak ekle</button>' +
    '<p id="wol-status" class="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-300" role="status"></p></div>';
}

function addWolDevice(host, mac) {
  var status = document.getElementById("wol-status");
  var name = (document.getElementById("wol-name").value || "").trim() || "Bilgisayar / TV";
  var isNew = storeFoundDevice({
    protocol: "wol",
    host: host,
    mac: mac,
    name: name,
    model: "Wake-on-LAN PC/TV",
    kind: "switch",
    caps: ["switch"],
    img: "generic-smart-tv.png",
  });
  setCardStatus(
    status,
    isNew
      ? name + " eklendi. Ana sayfadaki düğme uyandırma paketi gönderir."
      : "Bu cihaz zaten ekli.",
    "ok",
  );
}

// TP-Link Tapo: yerel kontrol TP-Link hesabının e-postası + şifresiyle yapılır (cihaz bunu ister).
// Bilgiler yalnızca bu cihazda saklanır; doğrulama cihaza gerçek el sıkışmayla yapılır.
var FIELD_CLS =
  "mt-2 w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm dark:bg-slate-900 dark:border-slate-700";
var BTN_CLS =
  "mt-3 w-full min-h-[44px] rounded-full bg-[#4C7DFF] text-sm font-bold text-white active:scale-[0.98]";
function renderTapoPairing(target, host) {
  target.innerHTML =
    '<div class="plain-card rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800">' +
    '<p class="text-sm font-bold">Tapo cihazı bulundu</p>' +
    '<p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">Yerel kontrol için Tapo uygulamasında kullandığın TP-Link hesabının e-postasını ve şifresini gir. Bilgiler yalnızca bu cihazda saklanır, buluta gönderilmez.</p>' +
    '<input id="tapo-user" type="email" autocomplete="off" spellcheck="false" class="' +
    FIELD_CLS +
    '" placeholder="TP-Link hesabı e-postası">' +
    '<input id="tapo-pass" type="password" autocomplete="off" data-enter="connectTapo" enterkeyhint="go" class="' +
    FIELD_CLS +
    '" placeholder="TP-Link hesabı şifresi">' +
    '<button type="button" id="tapo-btn" onclick="connectTapo(\'' +
    escapeHtml(host) +
    '\')" class="' +
    BTN_CLS +
    '">Bağlan ve ekle</button>' +
    '<p id="tapo-status" class="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-300"></p></div>';
}

function connectTapo(host) {
  var status = document.getElementById("tapo-status");
  var btn = document.getElementById("tapo-btn");
  btn.disabled = true;
  setCardStatus(status, "Cihaza bağlanılıyor…", "info");
  window.nexusLan.tapo
    .verify(
      host,
      document.getElementById("tapo-user").value,
      document.getElementById("tapo-pass").value,
    )
    .then(function (found) {
      var isNew = storeFoundDevice(found);
      setCardStatus(
        status,
        isNew
          ? found.name + " eklendi. Ana sayfadan yönetebilirsin."
          : "Bu cihaz zaten ekli (hesap bilgisi güncellendi).",
        "ok",
      );
      setScanStatus("Tapo cihazı bağlandı.", "ok");
    })
    .catch(function (e) {
      setCardStatus(
        status,
        e && e.message ? e.message : "Cihaza bağlanılamadı. Aynı ağda olduğundan emin ol.",
        "error",
      );
    })
    .then(function () {
      btn.disabled = false;
    });
}

// Tuya: cihaz yerel ağda şifreli TCP (6668) konuşur. Ağ taramasında bu kapısı açık bulunan adres ADAY olarak listelenir;
// cihazın gerçekten Tuya olduğu, ücretsiz Tuya IoT hesabından (iot.tuya.com → Cloud → cihazlar) alınan cihaz kimliği +
// yerel anahtarla gerçek bir sorgu yapılınca anlaşılır. Anahtar yalnızca bu cihazda saklanır. Desteklenen sürümler: 3.3 ve 3.4.
// hint (yerel ağ yayınından): cihazın kimliği ve protokol sürümü anahtarsız okunmuştur; yalnızca yerel anahtar eksiktir.
function renderTuyaPairing(target, host, hint) {
  var intro =
    hint && hint.id
      ? " adresindeki Tuya cihazının kimliği ve sürümü otomatik okundu. Eklemek için yalnızca yerel anahtarı (Tuya IoT hesabından) gir. Anahtar yalnızca bu cihazda saklanır."
      : " adresinde Tuya cihazlarının kullandığı kapı açık. Eklemek için cihazın kimliğini ve yerel anahtarını Tuya IoT hesabından al. Anahtar yalnızca bu cihazda saklanır. Desteklenen sürümler: 3.3 ve 3.4.";
  target.innerHTML =
    '<div class="plain-card rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800">' +
    '<p class="text-sm font-bold">' +
    (hint && hint.id ? "Tuya cihazı bulundu" : "Tuya cihazı olabilir") +
    "</p>" +
    '<p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">' +
    escapeHtml(String(host).replace(/^https?:\/\//, "")) +
    intro +
    "</p>" +
    '<input id="tuya-id" autocomplete="off" spellcheck="false" value="' +
    escapeHtml((hint && hint.id) || "") +
    '" class="' +
    FIELD_CLS +
    '" placeholder="Cihaz kimliği (Device ID)">' +
    '<input id="tuya-key" type="password" autocomplete="off" spellcheck="false" data-enter="connectTuya" enterkeyhint="go" class="' +
    FIELD_CLS +
    '" placeholder="Yerel anahtar (Local Key, 16 karakter)">' +
    '<select id="tuya-ver" class="' +
    FIELD_CLS +
    '"><option value="3.3">Protokol sürümü 3.3</option><option value="3.4">Protokol sürümü 3.4</option></select>' +
    '<button type="button" id="tuya-btn" onclick="connectTuya(\'' +
    escapeHtml(host) +
    '\')" class="' +
    BTN_CLS +
    '">Bağlan ve ekle</button>' +
    '<p id="tuya-status" class="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-300" role="status"></p></div>';
  if (hint && (hint.version === "3.3" || hint.version === "3.4"))
    document.getElementById("tuya-ver").value = hint.version;
}

function connectTuya(host) {
  var status = document.getElementById("tuya-status");
  var btn = document.getElementById("tuya-btn");
  var ip = normalizeHost(host);
  var id = document.getElementById("tuya-id").value.trim();
  var key = document.getElementById("tuya-key").value.trim();
  if (!ip || !id || !key) {
    setCardStatus(status, "Cihaz kimliğini ve yerel anahtarı yaz.", "error");
    return;
  }
  btn.disabled = true;
  setCardStatus(status, "Cihaza bağlanılıyor…", "info");
  window.nexusLan.tuya
    .verify(ip, { id: id, key: key, version: document.getElementById("tuya-ver").value })
    .then(function (found) {
      var isNew = storeFoundDevice(found);
      setCardStatus(
        status,
        isNew
          ? found.name + " eklendi. Ana sayfadan yönetebilirsin."
          : "Bu cihaz zaten ekli (yerel anahtar güncellendi).",
        "ok",
      );
      setScanStatus("Tuya cihazı bağlandı.", "ok");
      renderSecureFindings();
    })
    .catch(function (e) {
      setCardStatus(
        status,
        e && e.message
          ? e.message
          : "Cihaza bağlanılamadı. Aynı ağda olduğundan, cihaz kimliğinin ve yerel anahtarın doğru olduğundan emin ol.",
        "error",
      );
    })
    .then(function () {
      btn.disabled = false;
    });
}

// Zigbee2MQTT: ağ taramasında 1883 kapısı açık bulunan adres ADAY olarak listelenir; broker'a (isteğe bağlı kullanıcı/parola
// ile) bağlanılıp cihaz listesi gerçekten okununca eklenebilir. Yalnızca masaüstünde (kalıcı TCP gerekir).
var mqttFound = [];
var mqttBroker = null;
function renderMqttPairing(target, host, port) {
  mqttFound = [];
  mqttBroker = null;
  target.innerHTML =
    '<div class="plain-card rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800">' +
    '<p class="text-sm font-bold">MQTT sunucusu olabilir</p>' +
    '<p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">' +
    escapeHtml(String(host).replace(/^https?:\/\//, "")) +
    ":" +
    port +
    " adresinde MQTT kapısı açık. Sunucuda kullanıcı adı ve parola varsa gir; yoksa boş bırak. Bilgiler yalnızca bu cihazda saklanır. Şimdilik lamba ve prizlerde aç/kapat ve parlaklık desteklenir.</p>" +
    '<input id="mqtt-user" autocomplete="off" spellcheck="false" class="' +
    FIELD_CLS +
    '" placeholder="Kullanıcı adı (yoksa boş bırak)">' +
    '<input id="mqtt-pass" type="password" autocomplete="off" spellcheck="false" class="' +
    FIELD_CLS +
    '" placeholder="Parola (yoksa boş bırak)">' +
    '<input id="mqtt-base" autocomplete="off" spellcheck="false" class="' +
    FIELD_CLS +
    '" placeholder="Temel konu (varsayılan zigbee2mqtt)">' +
    '<button type="button" id="mqtt-btn" onclick="listMqttDevices(\'' +
    escapeHtml(host) +
    "', " +
    Number(port) +
    ')" class="' +
    BTN_CLS +
    '">Cihazları getir</button>' +
    '<p id="mqtt-status" class="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-300" role="status"></p>' +
    '<div id="mqtt-list" class="mt-2 space-y-2"></div></div>';
}

function listMqttDevices(host, port) {
  var status = document.getElementById("mqtt-status");
  var btn = document.getElementById("mqtt-btn");
  var ip = normalizeHost(host);
  var user = document.getElementById("mqtt-user").value.trim();
  var pass = document.getElementById("mqtt-pass").value;
  var base = document.getElementById("mqtt-base").value.trim() || "zigbee2mqtt";
  if (!ip) {
    setCardStatus(status, "Sunucu adresi geçersiz. Taramayı yeniden başlat.", "error");
    return;
  }
  var creds = user ? { mqttUser: user, mqttPass: pass || "" } : null;
  btn.disabled = true;
  setCardStatus(status, "Broker'a bağlanılıyor…", "info");
  document.getElementById("mqtt-list").innerHTML = "";
  window.nexusLan.mqtt
    .listDevices(ip, port, creds, base)
    .then(function (res) {
      mqttFound = res.devices;
      mqttBroker = { host: ip + ":" + port, base: base, creds: creds };
      setCardStatus(
        status,
        res.devices.length
          ? res.devices.length +
              " cihaz bulundu. Eklemek istediklerini seç." +
              (res.skipped ? " (" + res.skipped + " cihaz henüz desteklenmiyor.)" : "")
          : "Broker'da NEXUS'un kontrol edebileceği lamba ya da priz bulunamadı.",
        res.devices.length ? "ok" : "warn",
      );
      renderMqttList();
    })
    .catch(function (e) {
      setCardStatus(
        status,
        e && e.message
          ? e.message
          : "Broker'a bağlanılamadı. Kullanıcı adı ve parolanın doğru olduğundan emin ol.",
        "error",
      );
    })
    .then(function () {
      btn.disabled = false;
    });
}

function renderMqttList() {
  var list = document.getElementById("mqtt-list");
  if (!list) return;
  var devices = getPairedDevices();
  list.innerHTML = mqttFound
    .map(function (d, i) {
      var already = devices.some(function (x) {
        return x && x.protocol === "mqtt" && x.entity === d.name;
      });
      return (
        '<div class="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">' +
        '<div class="min-w-0"><p class="text-sm font-bold truncate dark:text-white">' +
        escapeHtml(d.name) +
        "</p>" +
        '<p class="text-[11px] text-slate-500 truncate dark:text-slate-400">' +
        escapeHtml([d.vendor, d.model].filter(Boolean).join(" ")) +
        "</p></div>" +
        (already
          ? '<span class="shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-600"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i>Ekli</span>'
          : '<button type="button" class="shrink-0 rounded-full bg-nexusPurple px-4 py-2 text-[11px] font-bold text-white active:scale-[0.98]" onclick="addMqttDevice(' +
            i +
            ')">Ekle</button>') +
        "</div>"
      );
    })
    .join("");
  if (window.lucide) lucide.createIcons();
}

function addMqttDevice(index) {
  var d = mqttFound[index];
  if (!d || !mqttBroker) return;
  storeFoundDevice({
    host: mqttBroker.host,
    protocol: "mqtt",
    name: d.name,
    model: [d.vendor, d.model].filter(Boolean).join(" ") || "Zigbee",
    kind: d.kind === "light" ? "light" : "plug",
    caps: d.caps.slice(),
    img: d.kind === "light" ? "generic-led-bulb.png" : "generic-smart-plug.png",
    endpointId: d.name,
    entity: d.name,
    options: { mqttBase: mqttBroker.base, brightnessMax: d.brightnessMax },
    secret: mqttBroker.creds || undefined,
  });
  renderMqttList();
  setScanStatus(d.name + " eklendi.", "ok");
}

var subnetFindings = [];

// Bağlayıcının gerçek cihazla doğrulanıp doğrulanmadığı (supported-devices.js verified alanı)
function verifiedChip(protocol) {
  if (window.nexusIsVerified && nexusIsVerified(protocol)) {
    return '<span class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-emerald-600"><i data-lucide="badge-check" class="h-3 w-3"></i>Doğrulandı</span>';
  }
  return '<span class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold nx-count-badge" title="Bu bağlantı türü henüz gerçek bir cihazla denenmedi.">Henüz doğrulanmadı</span>';
}

function renderSubnetFindings() {
  var host = document.getElementById("lan-subnet-results");
  var devices = getPairedDevices();
  var PROTO_ICON = {
    wled: "lamp",
    tasmota: "plug-zap",
    shelly: "plug-zap",
    hue: "lightbulb",
    homeassistant: "home",
    esphome: "cpu",
  };
  var PROTO_COLOR = {
    wled: "bg-cyan-50 text-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-300",
    tasmota: "bg-lime-50 text-lime-600 dark:bg-lime-500/10 dark:text-lime-300",
    shelly: "bg-lime-50 text-lime-600 dark:bg-lime-500/10 dark:text-lime-300",
    hue: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-300",
    homeassistant: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-300",
    esphome: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300",
  };
  host.innerHTML = subnetFindings
    .map(function (found, index) {
      var normalizedHost = /^https?:\/\//.test(found.host) ? found.host : "http://" + found.host;
      var already = devices.some(function (d) {
        return d && d.host === normalizedHost;
      });
      var proto = (found.protocol || "").toLowerCase();
      var icon = PROTO_ICON[proto] || "cpu";
      var colorCls = PROTO_COLOR[proto] || "bg-nexusPurple/10 text-nexusPurple";
      var protoLabel = found.protocol
        ? found.protocol.charAt(0).toUpperCase() + found.protocol.slice(1)
        : "LAN";
      return (
        '<div class="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">' +
        '<div class="flex items-center gap-3 min-w-0">' +
        foundImageHtml(found, "device-thumb w-11 h-11") +
        '<div class="min-w-0">' +
        '<p class="text-sm font-bold truncate dark:text-white">' +
        escapeHtml(found.name) +
        "</p>" +
        '<p class="text-[11px] text-slate-500 truncate dark:text-slate-400">' +
        protoLabel +
        " · " +
        escapeHtml(found.host) +
        "</p>" +
        '<div class="mt-1">' +
        verifiedChip(proto) +
        "</div>" +
        "</div></div>" +
        (already
          ? '<span class="shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-600"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i>Ekli</span>'
          : '<button type="button" class="shrink-0 rounded-full bg-nexusPurple px-4 py-2 text-[11px] font-bold text-white active:scale-[0.98]" onclick="addSubnetFinding(' +
            index +
            ')">Ekle</button>') +
        "</div>"
      );
    })
    .join("");
  if (typeof lucide !== "undefined") lucide.createIcons();
}

// NEXUS+: gelişmiş bağlantılarla (Home Assistant, MQTT, Tuya, Tapo) YENİ cihaz eklemek Plus'a özeldir.
// Zaten eklenmiş cihazlar çalışmaya devam eder. Plus bilgisi sunucudan gelen abonelik kaydıdır (nexusPlusPlan).
var PLUS_PROTOCOLS = {
  homeassistant: "Home Assistant",
  mqtt: "MQTT / Zigbee2MQTT",
  "tuya-local": "Tuya",
  tapo: "Tapo",
};
function hasPlus() {
  try {
    return !!nexusGetItem("nexusPlusPlan");
  } catch (error) {
    return false;
  }
}
function plusBlocked(target, protocol) {
  if (!PLUS_PROTOCOLS[protocol] || hasPlus()) return false;
  target.innerHTML =
    '<div class="plain-card rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800">' +
    '<p class="text-sm font-bold">' +
    escapeHtml(PLUS_PROTOCOLS[protocol]) +
    " cihazı eklemek NEXUS+ ile açılır</p>" +
    '<p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">Gelişmiş bağlantılar NEXUS+ aboneliğine dahildir. Zaten eklediğin cihazlar çalışmaya devam eder.</p>' +
    '<a href="nexus-plus.html" class="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-full bg-[#4C7DFF] text-sm font-bold text-white active:scale-[0.98]">NEXUS+ planlarını gör</a></div>';
  return true;
}

// Tuya (6668) ve MQTT (1883) cihazları anahtar/kimlik olmadan tanınamaz; ağ taramasından sonra bu kapıları açık olan
// adresler ADAY olarak listelenir ve bilgi istenir. Yalnızca masaüstü uygulamasında çalışır; donanımla doğrulanmadı.
var secureFindings = [];
var secureRun = 0;
var SECURE_TITLES = { tuya: "Tuya cihazı olabilir", mqtt: "MQTT sunucusu olabilir" };
function secureAlready(c, devices) {
  var ip = normalizeHost(c.host);
  return devices.some(function (d) {
    if (!d) return false;
    if (c.kind === "tuya") return d.protocol === "tuya-local" && d.host === ip;
    return d.protocol === "mqtt" && String(d.host).indexOf(ip + ":") === 0;
  });
}
function renderSecureFindings() {
  var host = document.getElementById("lan-secure-results");
  if (!host) return;
  var devices = getPairedDevices();
  host.innerHTML = secureFindings
    .map(function (c, index) {
      var already = secureAlready(c, devices);
      return (
        '<div class="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">' +
        '<div class="min-w-0"><p class="text-sm font-bold truncate dark:text-white">' +
        (c.id ? "Tuya cihazı bulundu" : SECURE_TITLES[c.kind]) +
        "</p>" +
        '<p class="text-[11px] text-slate-500 truncate dark:text-slate-400">' +
        escapeHtml(c.host) +
        ":" +
        c.port +
        (c.id ? " · yalnızca yerel anahtar gerekir" : " · bilgi girilince doğrulanır") +
        "</p></div>" +
        (already
          ? '<span class="shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-600"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i>Ekli</span>'
          : '<button type="button" class="shrink-0 rounded-full bg-nexusPurple px-4 py-2 text-[11px] font-bold text-white active:scale-[0.98]" onclick="connectSecureCandidate(' +
            index +
            ')">Bağla</button>') +
        "</div>"
      );
    })
    .join("");
  if (typeof lucide !== "undefined") lucide.createIcons();
}
function connectSecureCandidate(index) {
  var c = secureFindings[index];
  if (!c) return;
  var target = document.getElementById("lan-scan-result");
  if (plusBlocked(target, c.kind === "tuya" ? "tuya-local" : "mqtt")) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  if (c.kind === "tuya") renderTuyaPairing(target, c.host, c);
  else renderMqttPairing(target, c.host, c.port);
  target.scrollIntoView({ behavior: "smooth", block: "center" });
}
function startSecureScan() {
  var lan = window.nexusLan;
  var avail = lan && lan.hasSecure ? lan.hasSecure() : {};
  if (!lan || !lan.secureScan || !(avail.tuya || avail.mqtt)) return Promise.resolve();
  var run = ++secureRun;
  secureFindings = [];
  renderSecureFindings();
  setRadarBadge("Şifreli cihazlar aranıyor…", true);
  return lan
    .secureScan({
      shouldStop: function () {
        return run !== secureRun;
      },
      onFound: function (item) {
        if (run !== secureRun) return;
        secureFindings.push(item);
        renderSecureFindings();
        setScanStatus(
          secureFindings.length + " şifreli cihaz adayı bulundu. Bağla'ya dokunup bilgisini gir.",
          "ok",
        );
      },
    })
    .catch(function () {
      /* aday bulunamadı: normal tarama sonucu geçerli kalır */
    })
    .then(function () {
      // Tuya cihazlarının kendi yayını: kimlik ve sürüm anahtarsız okunur, böylece yalnızca yerel anahtar kalır.
      if (run !== secureRun || !lan.tuya || !lan.tuya.discover) return;
      setRadarBadge("Tuya cihazları dinleniyor…", true);
      return lan.tuya.discover({ timeoutMs: 8000 }).then(function (list) {
        if (run !== secureRun) return;
        list.forEach(function (t) {
          var known = secureFindings.filter(function (x) {
            return x.kind === "tuya" && x.host === t.host;
          })[0];
          if (known) {
            known.id = t.id;
            known.version = t.version;
          } else
            secureFindings.push({
              kind: "tuya",
              host: t.host,
              port: 6668,
              id: t.id,
              version: t.version,
            });
        });
        if (list.length) {
          renderSecureFindings();
          setScanStatus(
            secureFindings.length + " şifreli cihaz adayı bulundu. Bağla'ya dokunup bilgisini gir.",
            "ok",
          );
        }
      });
    })
    .then(function () {
      if (run === secureRun) setRadarBadge("NEXUS Hazır", false);
    });
}

function addSubnetFinding(index) {
  var found = subnetFindings[index];
  if (!found) return;
  if (
    found.protocol === "hue" ||
    found.protocol === "homeassistant" ||
    found.protocol === "tapo" ||
    (found.protocol === "esphome" && !found.entity)
  ) {
    document.getElementById("lan-scan-host").value = String(found.host).replace(/^https?:\/\//, "");
    scanLanHost();
    document
      .getElementById("lan-scan-host")
      .scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  storeFoundDevice(found);
  renderSubnetFindings();
}

var autoScanning = false;
var autoScanStop = false;

function setRadarBadge(text, scanning) {
  var badge = document.getElementById("radar-badge");
  if (!badge) return;
  badge.textContent = text;
  badge.parentElement.classList.toggle("animate-pulse", !!scanning);
}

// startAutoScan(true) → sayfaya girilirken kendiliğinden başlar (sessiz hata);
// butonla çağrıldığında durum her zaman bildirilir. Tarama bitince buton
// "Yeniden Tara" olur; istenirse durdurulup tekrar başlatılabilir.
// Tarama düğmesi simge + metin taşır; metin değişince simge de yenilenir
function setScanBtn(btn, label, icon) {
  btn.innerHTML =
    '<i data-lucide="' + icon + '" class="w-3.5 h-3.5"></i><span>' + label + "</span>";
  if (window.lucide) lucide.createIcons();
}
function startAutoScan(auto) {
  var btn = document.getElementById("lan-auto-btn");
  var bar = document.getElementById("lan-auto-bar");
  if (autoScanning) {
    autoScanStop = true;
    return;
  }
  if (!window.nexusLan || !window.nexusLan.autoScan) {
    setScanStatus(
      auto
        ? "Otomatik tarama bu ortamda yok. QR, kurulum kodu veya katalogla devam edebilirsin."
        : "Bu ortamda ağ taraması kullanılamıyor.",
      "",
    );
    return;
  }
  // Tarayıcıdan doğrudan LAN'a fetch CORS'a takılır (masaüstü LAN köprüsü ve
  // CapacitorHttp bu kısıtı aşar). Tarayıcıda boş yere yüzlerce hatalı istek
  // atıp konsolu doldurmak yerine kullanıcıyı elle adres girmeye yönlendir.
  if (
    typeof window.nexusLan.usingNativeTransport === "function" &&
    !window.nexusLan.usingNativeTransport()
  ) {
    setScanStatus(
      "Tarayıcıda otomatik ağ taraması yapılamaz. Cihaz adresini elle gir ya da masaüstü/telefon uygulamasını kullan.",
      "",
    );
    setRadarBadge("NEXUS Hazır", false);
    return;
  }
  autoScanning = true;
  autoScanStop = false;
  subnetFindings = [];
  secureRun += 1;
  secureFindings = [];
  renderSecureFindings();
  document.getElementById("lan-subnet-results").innerHTML = "";
  document.getElementById("lan-scan-result").innerHTML = "";
  setScanBtn(btn, "Durdur", "square");
  bar.style.width = "4%";
  setRadarBadge("Ağ taranıyor…", true);
  setScanStatus("Ağ taranıyor…", "");
  var done = 0;
  window.nexusLan
    .autoScan({
      shouldStop: function () {
        return autoScanStop;
      },
      onPrefix: function (prefix) {
        done = 0;
        setScanStatus(prefix + ".x ağı taranıyor…", "");
      },
      onProgress: function () {
        done += 1;
        bar.style.width = Math.min(96, 4 + Math.round((done / 254) * 92)) + "%";
      },
      onFound: function (info, count) {
        subnetFindings.push(info);
        setScanStatus(count + " cihaz bulundu · tarama sürüyor", "ok");
        renderSubnetFindings();
      },
    })
    .then(function (all) {
      if (all.length)
        setScanStatus(
          all.length + " cihaz bulundu. Ekle'ye dokunarak listeye ekleyebilirsin.",
          "ok",
        );
      else setScanStatus(autoScanStop ? "Tarama durduruldu." : "Bu ağda desteklenen bir cihaz bulunamadı. Cihazın açık ve aynı Wi-Fi'da olduğundan emin ol; olmazsa aşağıdan kataloğu ya da QR / kurulum kodunu kullan.", autoScanStop ? "" : "error", function () { startAutoScan(); });
      renderSubnetFindings();
    })
    .catch(function () {
      setScanStatus("Tarama tamamlanamadı. Cihazların aynı ağda olduğundan emin ol.", "error", function () { startAutoScan(); });
    })
    .then(function () {
      autoScanning = false;
      setScanBtn(btn, "Yeniden Tara", "refresh-cw");
      bar.style.width = subnetFindings.length ? "100%" : "0%";
      setRadarBadge("NEXUS Hazır", false);
      if (!autoScanStop) startSecureScan();
    });
}

// Köprü/yazılım kartları ve elle bilgi giren Tuya/Zigbee2MQTT formları Cihaz Ekle'de gösterilmez: cihazlar otomatik taramayla bulunur.
// QR / kurulum kodu ekranından gelen yerel ağ adresi: otomatik doldur ve cihazı tanı
(function () {
  var host = new URLSearchParams(location.search).get("host");
  if (!host) return;
  var input = document.getElementById("lan-scan-host");
  input.value = host;
  document.getElementById("lan-scan-section").scrollIntoView({ block: "center" });
  scanLanHost();
})();
// Sayfa açılınca tarama kendiliğinden başlar (QR / kurulum kodundan adresle gelindiyse o cihaz tanınır).
// Matter kutusu yalnızca köprü varken görünür (kodu işleyecek bir şey yoksa eylem düğmesi gösterilmez).
function addMatterFromInput() {
  var input = document.getElementById("matter-code");
  var code =
    window.nexusLan && window.nexusLan.matterCode ? window.nexusLan.matterCode(input.value) : null;
  if (!code) {
    setScanStatus(
      "Matter kodu geçersiz. 11 haneli kodu ya da MT: ile başlayan QR içeriğini gir.",
      "error",
    );
    return;
  }
  input.value = "";
  startMatterPairing(code);
}
(function revealMatter() {
  var box = document.getElementById("matter-add");
  if (box && window.nexusDesktop && window.nexusDesktop.matter) box.hidden = false;
})();
var pendingMatterCode = null;
try {
  pendingMatterCode = sessionStorage.getItem("nexusMatterCode");
  sessionStorage.removeItem("nexusMatterCode");
} catch (e) {
  pendingMatterCode = null;
}
if (pendingMatterCode)
  setTimeout(function () {
    startMatterPairing(pendingMatterCode);
  }, 300);
else if (!new URLSearchParams(location.search).get("host"))
  setTimeout(function () {
    startAutoScan(true);
  }, 400);
window.addEventListener("DOMContentLoaded", function () {
  if (window.location.hash === "#manual-catalog-section") {
    setTimeout(scrollToManualCatalog, 120);
  }
});
