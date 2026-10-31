    if (typeof lucide !== 'undefined') lucide.createIcons();

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

    function renderPairedDevices() {
      var devices = getPairedDevices();
      var countEl = document.getElementById("paired-device-count");
      var listEl = document.getElementById("paired-devices-list");
      countEl.textContent = String(devices.length);
      countEl.setAttribute("aria-label", devices.length + " cihaz");

      if (!devices.length) {
        listEl.innerHTML = '<div class="nx-empty">' +
          '<div class="nx-empty__icon" aria-hidden="true"><i data-lucide="cpu"></i></div>' +
          '<p class="nx-empty__title">Henüz eklenmiş cihaz yok</p>' +
          '<p class="nx-empty__text">QR, kurulum kodu veya manuel katalog ile eklediğin cihazlar burada görünür.</p></div>';
        if (typeof lucide !== "undefined") lucide.createIcons();
        return;
      }

      listEl.innerHTML = devices.map(function (device, index) {
        var name = device && device.name ? device.name : "Adsız cihaz";
        var room = device && device.room ? device.room : "Ana sayfaya bağlı";
        return '<div class="plain-card flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-4 dark:border-slate-800">' +
          '<div class="flex min-w-0 items-center gap-3">' +
          (window.NX ? '<img class="device-thumb w-11 h-11 object-contain shrink-0" src="' + NX.imageUrl(device) + '" alt="" loading="lazy" decoding="async">'
            : '<div class="w-11 h-11 rounded-2xl bg-slate-100 text-[#4C7DFF] flex items-center justify-center shrink-0 dark:bg-slate-800"><i data-lucide="cpu" class="w-5 h-5"></i></div>') +
          '<a href="nexus-device.html?i=' + index + '" class="min-w-0 block"><p class="font-semibold line-clamp-2">' + escapeHtml(name) + '</p>' +
          '<p class="text-xs text-slate-500 dark:text-slate-300 truncate">' + escapeHtml(room) + '</p></a></div>' +
          '<button type="button" onclick="removePairedDevice(' + index + ')" class="rounded-full bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">Kaldır</button>' +
          '</div>';
      }).join("");
      if (typeof lucide !== "undefined") lucide.createIcons();
    }

    function removePairedDevice(index) {
      var devices = getPairedDevices();
      devices.splice(index, 1);
      nexusSetItem("nexusPairedDevices", JSON.stringify(devices));
      if (window.nexusCloud) window.nexusCloud.notifyLocalChange();
      renderPairedDevices();
      if (typeof window.refreshDashboardSupplements === "function") {
        window.refreshDashboardSupplements();
      }
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

    // Hata durumunda (retry verilirse) sonraki adım: "Tekrar dene" + yardım bağlantısı.
    function setScanStatus(message, tone, retry) {
      var el = document.getElementById("lan-scan-status");
      el.textContent = message;
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
        el.appendChild(row);
      }
      el.classList.toggle("text-rose-500", tone === "error");
      el.classList.toggle("text-emerald-600", tone === "ok");
    }

    // Bulunan cihaz için kullanıcıya anlaşılır protokol adı ve gerçekten gönderilebilen komutların özeti
    var CAP_LABELS = { "switch": "aç/kapat", brightness: "parlaklık", color: "renk", colorTemp: "ışık tonu", position: "konum",
      lightScene: "sahne", effect: "efekt", target: "sıcaklık", lock: "kilit", vacuum: "süpürge", volume: "ses" };
    function protocolLabel(found) {
      var p = window.nexusLan && window.nexusLan.protocolFor ? window.nexusLan.protocolFor(found.protocol) : null;
      return (p && p.label) || found.protocol;
    }
    function controlSummary(found) {
      var p = window.nexusLan && window.nexusLan.protocolFor ? window.nexusLan.protocolFor(found.protocol) : null;
      var supported = (p && p.caps) || [];
      if (!supported.length) return "bu sürümde kontrol edilemiyor";
      var base = found.caps || (found.kind === "light" ? ["switch", "brightness"] : found.kind === "cover" ? ["position"] : ["switch"]);
      var names = [];
      base.concat(found.options && found.options.scenes ? ["lightScene"] : [], found.options && found.options.effects ? ["effect"] : []).forEach(function (c) {
        if (supported.indexOf(c) !== -1 && CAP_LABELS[c] && names.indexOf(CAP_LABELS[c]) === -1) names.push(CAP_LABELS[c]);
      });
      return names.length ? "yerel ağda: " + names.join(", ") : "yerel ağda kontrol edilir";
    }

    // Bulunan cihazın görseli: eklendikten sonra listede görünenle aynı kaynaktan (found.img → protokol → tür) çözülür
    function foundImageUrl(found) {
      var profile = KIND_PROFILE[found.kind] || KIND_PROFILE.switch;
      var record = { name: found.name, model: found.model, kind: found.kind, caps: found.caps || profile.caps,
        img: found.img || PROTOCOL_IMG[found.protocol] || profile.img };
      return window.NX && NX.imageUrl ? NX.imageUrl(record) : "assets/products/" + record.img;
    }
    function foundImageHtml(found, cls) {
      return '<img class="' + (cls || "w-11 h-11") + ' object-contain shrink-0" src="' + foundImageUrl(found) + '" alt="" decoding="async">';
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
      window.nexusLan.identify(host).then(function (found) {
        setScanStatus(found.name + " bulundu · " + protocolLabel(found) + (found.model ? " · " + found.model : ""), "ok");
        window.__nexusScannedDevice = found;
        if (found.protocol === "hue") { renderHuePairing(resultHost, host); return; }
        if (found.protocol === "homeassistant") { renderHaPairing(resultHost, found.host); return; }
        if (found.protocol === "tapo") { renderTapoPairing(resultHost, host); return; }
        resultHost.innerHTML = (found.protocol === "esphome" && !found.entity
          ? '<label class="block mb-2 text-xs font-semibold text-slate-500 dark:text-slate-300">ESPHome bileşen kimliği (YAML\'daki id, ör. relay)' +
            '<input id="esphome-entity" data-enter="addScannedDevice" enterkeyhint="go" class="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm dark:bg-slate-900 dark:border-slate-700" placeholder="relay"></label>'
          : '') +
          '<button type="button" onclick="addScannedDevice()" ' +
          'class="plain-card w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left active:scale-[0.99] dark:border-slate-800 flex items-center gap-3">' +
          foundImageHtml(found, "device-thumb w-11 h-11") +
          '<span class="min-w-0 flex-1"><span class="block text-sm font-bold truncate">' + escapeHtml(found.name) + "</span>" +
          '<span class="block text-[11px] text-slate-500 dark:text-slate-300">' + escapeHtml(host) +
          " · " + controlSummary(found) + "</span></span></button>";
      }).catch(function () {
        setScanStatus("Bu adreste bilinen bir NEXUS cihazı bulunamadı. Cihazın aynı ağda ve açık olduğundan emin ol.", "error", scanLanHost);
      }).finally(function () {
        btn.disabled = false;
      });
    }

    function storeFoundDevice(found) {
      // Çok kanallı röleler (Sonoff DIY): her kanal ayrı cihaz olarak eklenir
      if (found.channels > 1 && !found.channelOf) {
        var any = false;
        for (var ch = 0; ch < found.channels; ch++) {
          var copy = {};
          Object.keys(found).forEach(function (k) { copy[k] = found[k]; });
          copy.channelOf = true; copy.endpointId = ch; copy.name = found.name + " · Kanal " + (ch + 1);
          if (storeFoundDevice(copy)) any = true;
        }
        return any;
      }
      var devices = getPairedDevices();
      var normalizedHost = /^https?:\/\//.test(found.host) ? found.host : "http://" + found.host;
      var key = normalizedHost + "#" + (found.endpointId != null ? found.endpointId : 0);
      // Tapo hesabı / Tuya yerel anahtarı cihaz kaydına yazılmaz: yalnızca bu cihazın yerel gizli deposuna (buluta gitmez).
      if (found.secret && window.nexusLan && window.nexusLan.secrets) {
        var secretId = ("lan-" + normalizedHost + (found.endpointId != null && found.endpointId !== 0 ? "-" + found.endpointId : "")).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
        window.nexusLan.secrets.set(secretId, found.secret);
      }
      if (!devices.some(function (d) { return d && (d.host + "#" + (d.endpointId != null ? d.endpointId : 0)) === key; })) {
        var profile = KIND_PROFILE[found.kind] || KIND_PROFILE.switch;
        var caps = (found.caps || profile.caps).slice();
        (PROTOCOL_EXTRA[found.protocol] || []).forEach(function (c) { if (found.kind === "light" && caps.indexOf(c) === -1) caps.push(c); });
        // Renkli ampuller beyaz tonunu da ayarlar (Yeelight / WiZ / LIFX); renk yeteneği olmayan cihaza eklenmez.
        if (PROTOCOL_CT[found.protocol] && found.kind === "light" && caps.indexOf("color") !== -1 && caps.indexOf("colorTemp") === -1) caps.push("colorTemp");
        // Cihazın kendi bildirdiği efekt ve sahne listeleri (WLED / WiZ): liste varsa yetenek de vardır
        // Yeelight sahneleri renk/ton gerektirir: yalnızca renkli ampullerde sunulur
        if (found.options && found.options.scenes && found.options.scenes.length && caps.indexOf("lightScene") === -1 && (found.protocol !== "yeelight" || caps.indexOf("color") !== -1)) caps.push("lightScene");
        if (found.options && found.options.effects && found.options.effects.length && caps.indexOf("effect") === -1) caps.push("effect");
        // Röle tabanlı cihazlarda "elektrik gelince" başlangıç durumu protokolün kendi ayarıdır (Sonoff / Shelly / Tasmota)
        if (PROTOCOL_POWERON[found.protocol] && (found.kind === "switch" || found.kind === "plug") && caps.indexOf("powerOn") === -1) caps.push("powerOn");
        // Kasa prizlerinin durum ışığı set_led_off ile gerçekten yönetilir
        if (found.protocol === "kasa" && found.kind === "plug" && caps.indexOf("indicator") === -1) caps.push("indicator");
        devices.push({
          id: ("lan-" + normalizedHost + (found.endpointId != null && found.endpointId !== 0 ? "-" + found.endpointId : "")).replace(/[^a-z0-9]+/gi, "-").toLowerCase(),
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
          hueUser: found.hueUser || null,
          haToken: found.haToken || null,
          options: found.options || null,
          channels: found.channels > 1 ? found.channels : null,
        });
        nexusSetItem("nexusPairedDevices", JSON.stringify(devices));
        if (window.nexusCloud) window.nexusCloud.notifyLocalChange();
        renderPairedDevices();
        return true;
      }
      return false;
    }

    function homeLinkHtml() {
      return '<a href="nexus-home.html" class="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white active:scale-[0.98]">' +
        '<i data-lucide="home" class="w-3.5 h-3.5"></i>Ana Sayfa</a>';
    }

    function addScannedDevice() {
      var found = window.__nexusScannedDevice;
      if (!found) return;
      var entityInput = document.getElementById("esphome-entity");
      if (entityInput) {
        var entity = entityInput.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
        if (!entity) { setScanStatus("ESPHome bileşen kimliğini yaz (cihazın YAML dosyasındaki id).", "error"); return; }
        found.entity = entity;
      }
      var isNew = storeFoundDevice(found);
      if (isNew) {
        setScanStatus("Eklendi.", "ok");
        document.getElementById("lan-scan-result").innerHTML =
          '<div class="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-4 py-4 flex items-center gap-3">' +
          foundImageHtml(found, "device-thumb w-11 h-11") +
          '<div class="min-w-0 flex-1">' +
          '<p class="text-sm font-bold text-emerald-700 dark:text-emerald-400">' + escapeHtml(found.name) + ' eklendi</p>' +
          '<p class="text-[11px] text-emerald-600/70 dark:text-emerald-400/60 mt-0.5">Ana sayfadan yönetebilirsin</p></div>' +
          homeLinkHtml() + '</div>';
      } else {
        setScanStatus("Bu cihaz zaten ekli.", "ok");
      }
      if (typeof lucide !== "undefined") lucide.createIcons();
    }

    // Philips Hue: köprü bir kez eşleştirilir, her lamba ayrı cihaz olarak eklenir.
    function renderHuePairing(target, host) {
      target.innerHTML = '<div class="plain-card rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800">' +
        '<p class="text-sm font-bold">Hue köprüsü bulundu</p>' +
        '<p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">Köprünün üstündeki yuvarlak düğmeye bas, ardından 30 saniye içinde “Köprüyü bağla”ya dokun.</p>' +
        '<button type="button" id="hue-pair-btn" onclick="pairHueBridge(\'' + escapeHtml(host) + '\')" class="mt-3 w-full min-h-[44px] rounded-full bg-[#4C7DFF] text-sm font-bold text-white active:scale-[0.98]">Köprüyü bağla</button>' +
        '<p id="hue-pair-status" class="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-300"></p></div>';
    }

    function pairHueBridge(host) {
      var btn = document.getElementById("hue-pair-btn");
      var status = document.getElementById("hue-pair-status");
      btn.disabled = true;
      status.textContent = "Köprüyle eşleşiliyor…";
      window.nexusLan.hue.pair(host).then(function (user) {
        status.textContent = "Bağlandı, lambalar okunuyor…";
        return window.nexusLan.hue.lights(host, user).then(function (lights) {
          var added = 0;
          lights.forEach(function (l) {
            var ok = storeFoundDevice({
              host: host, name: l.name, protocol: "hue", kind: "light", model: l.model,
              caps: l.caps, options: l.options, endpointId: l.id, hueUser: user,
              img: l.caps.indexOf("color") !== -1 ? "generic-led-bulb.png" : "generic-led-bulb.png",
            });
            if (ok) added += 1;
          });
          status.textContent = lights.length ? added + " lamba eklendi. Ana sayfadan yönetebilirsin." : "Köprüye bağlı lamba bulunamadı.";
          setScanStatus("Hue köprüsü bağlandı.", "ok");
        });
      }).catch(function (e) {
        status.textContent = e && e.code === "link-button" ? e.message : "Köprüye bağlanılamadı. Aynı ağda olduğundan emin ol ve tekrar dene.";
      }).then(function () { btn.disabled = false; });
    }

    // Home Assistant: kullanıcının kendi HA sunucusu. Uzun ömürlü erişim jetonu bir kez girilir,
    // HA'daki ışık, priz, perde, klima, kilit, süpürge ve medya cihazları tek tek eklenir.
    var haEntities = [];
    var haConn = null;
    function renderHaPairing(target, host) {
      haConn = { host: host, token: null };
      target.innerHTML = '<div class="plain-card rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800">' +
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
      if (!token) { status.textContent = "Erişim jetonunu yapıştır."; return; }
      btn.disabled = true;
      status.textContent = "Home Assistant'a bağlanılıyor…";
      window.nexusLan.homeassistant.entities(haConn.host, token).then(function (list) {
        haConn.token = token;
        haEntities = list;
        status.textContent = list.length ? list.length + " cihaz bulundu. Eklemek istediklerini seç." : "Home Assistant'ta NEXUS'un kontrol edebileceği cihaz bulunamadı.";
        setScanStatus("Home Assistant bağlandı.", "ok");
        renderHaEntities();
      }).catch(function (e) {
        status.textContent = e && e.code === "auth" ? "Jeton geçersiz. Home Assistant'ta yeni bir jeton oluşturup tekrar dene." : "Home Assistant'a bağlanılamadı. Adresin doğru ve aynı ağda olduğundan emin ol.";
      }).then(function () { btn.disabled = false; });
    }

    function haDeviceRecord(item) {
      var IMG = { light: "generic-led-bulb.png", cover: "control-curtain-motor.png", lock: "security-keypad-lock.png", vacuum: "generic-robot-vacuum.png", ac: "generic-air-conditioner.png", media: "generic-smart-tv.png",
        climatesensor: "generic-temp-humidity.png", envsensor: "generic-air-quality.png", motion: "generic-motion-sensor.png",
        contact: "security-door-sensor.png", alarm: "security-smoke-detector.png", purifier: "generic-humidifier.png" };
      return { host: haConn.host, name: item.name, protocol: "homeassistant", kind: item.kind, model: item.model, caps: item.caps, options: item.options || null,
        endpointId: item.entity, entity: item.entity, haToken: haConn.token, img: IMG[item.kind] };
    }

    function renderHaEntities() {
      var host = document.getElementById("ha-list");
      if (!host) return;
      var devices = getPairedDevices();
      var addedKeys = {};
      devices.forEach(function (d) { if (d && d.protocol === "homeassistant") addedKeys[d.entity] = 1; });
      var rest = haEntities.filter(function (it) { return !addedKeys[it.entity]; }).length;
      host.innerHTML = (rest > 1 ? '<button type="button" onclick="addAllHaEntities()" class="w-full min-h-[40px] rounded-full bg-slate-900 text-xs font-bold text-white active:scale-[0.98] dark:bg-slate-100 dark:text-slate-900">Tümünü ekle (' + rest + ')</button>' : '') +
        haEntities.map(function (it, i) {
          return '<div class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800">' +
            '<div class="min-w-0"><p class="text-sm font-bold truncate">' + escapeHtml(it.name) + '</p>' +
            '<p class="text-[11px] text-slate-500 truncate dark:text-slate-300">' + escapeHtml(it.entity) + '</p></div>' +
            (addedKeys[it.entity]
              ? '<span class="shrink-0 text-[11px] font-bold text-emerald-600">ekli</span>'
              : '<button type="button" class="shrink-0 rounded-full bg-[#4C7DFF] px-3 py-1.5 text-[11px] font-bold text-white active:scale-[0.98]" onclick="addHaEntity(' + i + ')">Ekle</button>') +
            '</div>';
        }).join("");
    }

    function addHaEntity(i) {
      if (!haEntities[i] || !haConn || !haConn.token) return;
      storeFoundDevice(haDeviceRecord(haEntities[i]));
      renderHaEntities();
    }

    function addAllHaEntities() {
      if (!haConn || !haConn.token) return;
      var n = 0;
      haEntities.forEach(function (it) { if (storeFoundDevice(haDeviceRecord(it))) n += 1; });
      document.getElementById("ha-status").textContent = n + " cihaz eklendi. Ana sayfadan yönetebilirsin.";
      renderHaEntities();
    }

    // TP-Link Tapo: yerel kontrol TP-Link hesabının e-postası + şifresiyle yapılır (cihaz bunu ister).
    // Bilgiler yalnızca bu cihazda saklanır; doğrulama cihaza gerçek el sıkışmayla yapılır.
    var FIELD_CLS = 'mt-2 w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm dark:bg-slate-900 dark:border-slate-700';
    var BTN_CLS = 'mt-3 w-full min-h-[44px] rounded-full bg-[#4C7DFF] text-sm font-bold text-white active:scale-[0.98]';
    function renderTapoPairing(target, host) {
      target.innerHTML = '<div class="plain-card rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800">' +
        '<p class="text-sm font-bold">Tapo cihazı bulundu</p>' +
        '<p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">Yerel kontrol için Tapo uygulamasında kullandığın TP-Link hesabının e-postasını ve şifresini gir. Bilgiler yalnızca bu cihazda saklanır, buluta gönderilmez.</p>' +
        '<input id="tapo-user" type="email" autocomplete="off" spellcheck="false" class="' + FIELD_CLS + '" placeholder="TP-Link hesabı e-postası">' +
        '<input id="tapo-pass" type="password" autocomplete="off" data-enter="connectTapo" enterkeyhint="go" class="' + FIELD_CLS + '" placeholder="TP-Link hesabı şifresi">' +
        '<button type="button" id="tapo-btn" onclick="connectTapo(\'' + escapeHtml(host) + '\')" class="' + BTN_CLS + '">Bağlan ve ekle</button>' +
        '<p id="tapo-status" class="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-300"></p></div>';
    }

    function connectTapo(host) {
      var status = document.getElementById("tapo-status");
      var btn = document.getElementById("tapo-btn");
      btn.disabled = true;
      status.textContent = "Cihaza bağlanılıyor…";
      window.nexusLan.tapo.verify(host, document.getElementById("tapo-user").value, document.getElementById("tapo-pass").value).then(function (found) {
        var isNew = storeFoundDevice(found);
        status.textContent = isNew ? found.name + " eklendi. Ana sayfadan yönetebilirsin." : "Bu cihaz zaten ekli (hesap bilgisi güncellendi).";
        setScanStatus("Tapo cihazı bağlandı.", "ok");
      }).catch(function (e) {
        status.textContent = e && e.message ? e.message : "Cihaza bağlanılamadı. Aynı ağda olduğundan emin ol.";
      }).then(function () { btn.disabled = false; });
    }

    // Tuya: cihaz yerel ağda şifreli TCP konuşur; ücretsiz Tuya IoT hesabından alınan cihaz kimliği + yerel anahtar gerekir.
    function renderTuyaPairing() {
      var host = document.getElementById("tuya-pair-card");
      if (!host) return;
      var avail = window.nexusLan && window.nexusLan.hasSecure && window.nexusLan.hasSecure().tuya;
      host.innerHTML = '<details class="plain-card rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800"' + (avail ? '' : ' open') + '>' +
        '<summary class="cursor-pointer text-sm font-bold">Tuya cihazı ekle (yerel anahtarla)</summary>' +
        (avail
          ? '<p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">Cihazın kimliğini ve yerel anahtarını ücretsiz Tuya IoT hesabından (iot.tuya.com → Cloud → cihazlar) al. Anahtar yalnızca bu cihazda saklanır. Desteklenen sürümler: 3.3 ve 3.4.</p>' +
            '<input id="tuya-host" inputmode="decimal" autocomplete="off" class="' + FIELD_CLS + '" placeholder="Cihazın IP adresi (ör. 192.168.1.60)">' +
            '<input id="tuya-id" autocomplete="off" spellcheck="false" class="' + FIELD_CLS + '" placeholder="Cihaz kimliği (Device ID)">' +
            '<input id="tuya-key" type="password" autocomplete="off" spellcheck="false" class="' + FIELD_CLS + '" placeholder="Yerel anahtar (Local Key, 16 karakter)">' +
            '<select id="tuya-ver" class="' + FIELD_CLS + '"><option value="3.3">Protokol sürümü 3.3</option><option value="3.4">Protokol sürümü 3.4</option></select>' +
            '<button type="button" id="tuya-btn" onclick="connectTuya()" class="' + BTN_CLS + '">Bağlan ve ekle</button>' +
            '<p id="tuya-status" class="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-300"></p>'
          : '<p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">Tuya yerel kontrolü şifreli TCP gerektirir; şimdilik yalnızca NEXUS masaüstü uygulamasında çalışır. Telefonda ya da tarayıcıda bu cihazı ekleyemezsin.</p>') +
        '</details>';
    }

    function connectTuya() {
      var status = document.getElementById("tuya-status");
      var btn = document.getElementById("tuya-btn");
      var ip = normalizeHost(document.getElementById("tuya-host").value);
      var id = document.getElementById("tuya-id").value.trim();
      var key = document.getElementById("tuya-key").value.trim();
      if (!ip || !id || !key) { status.textContent = "IP adresini, cihaz kimliğini ve yerel anahtarı yaz."; return; }
      btn.disabled = true;
      status.textContent = "Cihaza bağlanılıyor…";
      window.nexusLan.tuya.verify(ip, { id: id, key: key, version: document.getElementById("tuya-ver").value }).then(function (found) {
        var isNew = storeFoundDevice(found);
        status.textContent = isNew ? found.name + " eklendi. Ana sayfadan yönetebilirsin." : "Bu cihaz zaten ekli (yerel anahtar güncellendi).";
        setScanStatus("Tuya cihazı bağlandı.", "ok");
      }).catch(function (e) {
        status.textContent = e && e.message ? e.message : "Cihaza bağlanılamadı. Aynı ağda olduğundan, IP adresinin ve yerel anahtarın doğru olduğundan emin ol.";
      }).then(function () { btn.disabled = false; });
    }

    var subnetFindings = [];

    function renderSubnetFindings() {
      var host = document.getElementById("lan-subnet-results");
      var devices = getPairedDevices();
      var PROTO_ICON = { wled: "lamp", tasmota: "plug-zap", shelly: "plug-zap", hue: "lightbulb", homeassistant: "home", esphome: "cpu" };
      var PROTO_COLOR = { wled: "bg-cyan-50 text-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-300", tasmota: "bg-lime-50 text-lime-600 dark:bg-lime-500/10 dark:text-lime-300", shelly: "bg-lime-50 text-lime-600 dark:bg-lime-500/10 dark:text-lime-300", hue: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-300", homeassistant: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-300", esphome: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300" };
      host.innerHTML = subnetFindings.map(function (found, index) {
        var normalizedHost = /^https?:\/\//.test(found.host) ? found.host : "http://" + found.host;
        var already = devices.some(function (d) { return d && d.host === normalizedHost; });
        var proto = (found.protocol || "").toLowerCase();
        var icon = PROTO_ICON[proto] || "cpu";
        var colorCls = PROTO_COLOR[proto] || "bg-nexusPurple/10 text-nexusPurple";
        var protoLabel = found.protocol ? found.protocol.charAt(0).toUpperCase() + found.protocol.slice(1) : "LAN";
        return '<div class="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">' +
          '<div class="flex items-center gap-3 min-w-0">' +
          foundImageHtml(found, "device-thumb w-11 h-11") +
          '<div class="min-w-0">' +
          '<p class="text-sm font-bold truncate dark:text-white">' + escapeHtml(found.name) + '</p>' +
          '<p class="text-[11px] text-slate-500 truncate dark:text-slate-400">' + protoLabel + ' · ' + escapeHtml(found.host) + '</p>' +
          '</div></div>' +
          (already
            ? '<span class="shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-600"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i>Ekli</span>'
            : '<button type="button" class="shrink-0 rounded-full bg-nexusPurple px-4 py-2 text-[11px] font-bold text-white active:scale-[0.98]" onclick="addSubnetFinding(' + index + ')">Ekle</button>') +
          '</div>';
      }).join("");
      if (typeof lucide !== "undefined") lucide.createIcons();
    }

    function addSubnetFinding(index) {
      var found = subnetFindings[index];
      if (!found) return;
      if (found.protocol === "hue" || found.protocol === "homeassistant" || found.protocol === "tapo" || (found.protocol === "esphome" && !found.entity)) {
        document.getElementById("lan-scan-host").value = String(found.host).replace(/^https?:\/\//, "");
        scanLanHost();
        document.getElementById("lan-scan-host").scrollIntoView({ behavior: "smooth", block: "center" });
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
      btn.innerHTML = '<i data-lucide="' + icon + '" class="w-3.5 h-3.5"></i><span>' + label + "</span>";
      if (window.lucide) lucide.createIcons();
    }
    function startAutoScan(auto) {
      var btn = document.getElementById("lan-auto-btn");
      var bar = document.getElementById("lan-auto-bar");
      if (autoScanning) { autoScanStop = true; return; }
      if (!window.nexusLan || !window.nexusLan.autoScan) {
        setScanStatus(auto
          ? "Otomatik tarama bu ortamda yok. QR, kurulum kodu veya katalogla devam edebilirsin."
          : "Bu ortamda ağ taraması kullanılamıyor.", "");
        return;
      }
      // Tarayıcıdan doğrudan LAN'a fetch CORS'a takılır (masaüstü LAN köprüsü ve
      // CapacitorHttp bu kısıtı aşar). Tarayıcıda boş yere yüzlerce hatalı istek
      // atıp konsolu doldurmak yerine kullanıcıyı elle adres girmeye yönlendir.
      if (typeof window.nexusLan.usingNativeTransport === "function" &&
          !window.nexusLan.usingNativeTransport()) {
        setScanStatus("Tarayıcıda otomatik ağ taraması yapılamaz. Cihaz adresini elle gir ya da masaüstü/telefon uygulamasını kullan.", "");
        setRadarBadge("NEXUS Hazır", false);
        return;
      }
      autoScanning = true;
      autoScanStop = false;
      subnetFindings = [];
      document.getElementById("lan-subnet-results").innerHTML = "";
      document.getElementById("lan-scan-result").innerHTML = "";
      setScanBtn(btn, "Durdur", "square");
      bar.style.width = "4%";
      setRadarBadge("Ağ taranıyor…", true);
      setScanStatus("Ağ taranıyor…", "");
      var done = 0;
      window.nexusLan.autoScan({
        shouldStop: function () { return autoScanStop; },
        onPrefix: function (prefix) { done = 0; setScanStatus(prefix + ".x ağı taranıyor…", ""); },
        onProgress: function () { done += 1; bar.style.width = Math.min(96, 4 + Math.round(done / 254 * 92)) + "%"; },
        onFound: function (info, count) {
          subnetFindings.push(info);
          setScanStatus(count + " cihaz bulundu · tarama sürüyor", "ok");
          renderSubnetFindings();
        },
      })
        .then(function (all) {
          if (all.length) setScanStatus(all.length + " cihaz bulundu. Ekle'ye dokunarak listeye ekleyebilirsin.", "ok");
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
        });
    }

    renderPairedDevices();

    // "Köprüler ve açık kaynak": destek matrisindeki category:"bridge" grupları (Home Assistant, Tasmota, WLED, ESPHome, Wake-on-LAN)
    (function renderBridges() {
      var groups = (window.NEXUS_SUPPORTED_DEVICES || []).filter(function (g) { return g.category === "bridge"; });
      var section = document.getElementById("bridge-section");
      var list = document.getElementById("bridge-list");
      if (!groups.length || !section || !list) return;
      // Köprü başına simge ve renk; tek kaynak olarak yalnızca görünüm (protokol mantığı lan-connectors.js'de)
      var BRIDGE_STYLE = {
        homeassistant: { icon: "house", color: "#0ea5e9" },
        tasmota: { icon: "plug-zap", color: "#f59e0b" },
        wled: { icon: "lightbulb", color: "#d946ef" },
        esphome: { icon: "cpu", color: "#10b981" },
        wol: { icon: "power", color: "#6366f1" }
      };
      list.innerHTML = groups.map(function (g) {
        var desk = g.availability === "desktop";
        var st = BRIDGE_STYLE[g.protocol] || { icon: "network", color: "#64748b" };
        // Köprünün gerçekten ekleyebildiği cihaz türleri: tekrarsız ürün görselleri (en fazla 4)
        var seen = {};
        var thumbs = (g.models || []).filter(function (m) {
          if (!m || !m.img || seen[m.img]) return false;
          seen[m.img] = 1;
          return true;
        }).slice(0, 4).map(function (m) {
          var src = window.NX && NX.imageUrl ? NX.imageUrl({ img: m.img }) : "assets/products/" + m.img;
          return '<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800" title="' + escapeHtml(m.name || "") + '">' +
            '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(m.name || "") + '" class="h-7 w-7 object-contain" loading="lazy" decoding="async" onerror="this.style.visibility=\'hidden\'"></span>';
        }).join("");
        return '<div class="plain-card flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3 dark:border-slate-800">' +
          '<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style="background:' + st.color + '1f;color:' + st.color + '"><i data-lucide="' + st.icon + '" class="h-5 w-5"></i></span>' +
          '<div class="min-w-0 flex-1">' +
          '<div class="flex items-center justify-between gap-2"><p class="truncate text-sm font-bold">' + escapeHtml(g.brand) + "</p>" +
          (desk ? '<span class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold nx-count-badge"><i data-lucide="monitor" class="h-3 w-3"></i>Masaüstü</span>' : "") + "</div>" +
          '<p class="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-300">' + escapeHtml(g.note || "") + "</p>" +
          (thumbs ? '<div class="mt-2.5 flex flex-wrap gap-1.5">' + thumbs + "</div>" : "") +
          "</div></div>";
      }).join("");
      section.classList.remove("hidden");
      if (window.lucide) lucide.createIcons();
    })();
    renderTuyaPairing();
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
    if (!new URLSearchParams(location.search).get("host")) setTimeout(function () { startAutoScan(true); }, 400);
    window.addEventListener("pageshow", renderPairedDevices);
    window.addEventListener("DOMContentLoaded", function () {
      if (window.location.hash === "#manual-catalog-section") {
        setTimeout(scrollToManualCatalog, 120);
      }
    });
  
