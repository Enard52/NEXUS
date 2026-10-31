// NEXUS — Tasarruf stratejileri kullanıcının cihazlarına göre seçilir ve sıralanır (nexus-energy.html, nexus-energy-devices.html).
// Bir strateji yalnızca ona uyan (cihaz türü eşleşen) bir cihaz varsa önerilir; sıralama uygun cihaz sayısına ve
// ölçülebilen güç okumasına (gerçek tasarruf ölçülebilir) göre yapılır. Cihaz yoksa ya da hiçbiri uymuyorsa liste
// dürüst bir boş durum gösterir; sabit örnek strateji gösterilmez.
// Strateji BAŞLIKLARI otomasyon motoruyla (automation-engine.js ENERGY_NIGHT_TITLE) ve kayıtlı etkin haritasıyla
// eşleştiği için değiştirilmez.
(function () {
  var CATALOG = [
    {
      id: "lights-away",
      title: "Evden çıktıktan sonra ışığı otomatik olarak kapat",
      desc: "Evden çıktıktan sonra ışığı otomatik olarak kapatın ve eve döndükten sonra açın.",
      category: "Aydınlatma",
      trigger: "Konum tabanlı",
      icon: "lightbulb-off",
      tint: "bg-[#4C7DFF]/10 text-[#4C7DFF]",
      kinds: ["light"]
    },
    {
      id: "ac-away",
      title: "Kimse yokken klimayı kapat",
      desc: "Evde kimse yokken klimayı otomatik olarak kapatın, gereksiz tüketimi önleyin.",
      category: "Klima",
      trigger: "Konum tabanlı",
      icon: "air-vent",
      tint: "bg-[#22D3EE]/10 text-[#0EA5C4]",
      kinds: ["ac", "thermostat"]
    },
    {
      id: "standby-night",
      title: "Gece bekleme tüketimini kes",
      desc: "Gece belirlediğin saatte bekleme modundaki cihazların gücünü otomatik olarak kesin.",
      category: "Akıllı Priz",
      trigger: "Zamanlama tabanlı",
      icon: "plug-zap",
      tint: "bg-emerald-500/10 text-emerald-600",
      kinds: ["switch", "energy", "media"]
    }
  ];

  function nx() { return window.NX || null; }
  function kindOf(d) { try { return nx().kindOf(d); } catch (e) { return "generic"; } }
  // "Ölçülebilen": cihazdan gerçekten bir güç değeri okunmuş (fields.power sayı); yalnızca aç/kapa yeteneği yetmez
  function metered(d) {
    var p = d && d.fields && d.fields.power;
    return typeof p === "number" && isFinite(p);
  }

  function matches(strategy, devices) {
    return (devices || []).filter(function (d) {
      return d && d.name && strategy.kinds.indexOf(kindOf(d)) !== -1;
    });
  }

  // Uygun cihazı olan stratejiler, en uygun olan başta. Eşit puanda katalog sırası korunur.
  function rank(devices) {
    var out = [];
    CATALOG.forEach(function (s, i) {
      var devs = matches(s, devices);
      if (!devs.length) return;
      var meter = devs.filter(metered).length;
      out.push({ strategy: s, devices: devs, score: devs.length * 10 + meter * 5, order: i });
    });
    out.sort(function (a, b) { return b.score - a.score || a.order - b.order; });
    return out;
  }

  // Strateji için cihaz listesi: uygun cihazlar önde (ölçülebilenler önce), diğerleri sonda
  function sortDevicesFor(title, devices) {
    var s = CATALOG.filter(function (c) { return c.title === title; })[0];
    var list = (devices || []).slice();
    if (!s) return list;
    function w(d) { return s.kinds.indexOf(kindOf(d)) !== -1 ? (metered(d) ? 2 : 1) : 0; }
    return list
      .map(function (d, i) { return { d: d, i: i, w: w(d) }; })
      .sort(function (a, b) { return b.w - a.w || a.i - b.i; })
      .map(function (x) { return x.d; });
  }

  function isRelevant(title, device) {
    var s = CATALOG.filter(function (c) { return c.title === title; })[0];
    return !!(s && s.kinds.indexOf(kindOf(device)) !== -1);
  }

  function T(tr, en) { return typeof window.nexusT === "function" ? window.nexusT(tr, en) : tr; }
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function names(devs) {
    var shown = devs.slice(0, 2).map(function (d) { return d.name; }).join(", ");
    return shown + (devs.length > 2 ? " +" + (devs.length - 2) : "");
  }

  function emptyHtml(hasAny) {
    return '<div class="nx-empty"><div class="nx-empty__icon" aria-hidden="true"><i data-lucide="plug-zap"></i></div>' +
      '<p class="nx-empty__title">' + esc(hasAny ? T("Cihazların için uygun strateji yok", "No strategy fits your devices") : T("Strateji için önce cihaz ekle", "Add a device first to get strategies")) + "</p>" +
      '<p class="nx-empty__text">' + esc(hasAny
        ? T("Işık, klima veya akıllı priz eklediğinde stratejiler burada önerilir.", "Strategies appear here when you add a light, an air conditioner or a smart plug.")
        : T("Stratejiler eklediğin cihazlara göre seçilir; cihaz yokken örnek göstermiyoruz.", "Strategies are picked from the devices you added; we do not show examples without devices.")) + "</p>" +
      '<a href="nexus-pair.html" class="mt-3 inline-flex min-h-[40px] items-center rounded-full bg-[#4C7DFF] px-4 text-sm font-bold text-white">' + esc(T("Cihaz ekle", "Add device")) + "</a></div>";
  }

  function render(host, devices) {
    if (!host) return;
    var ranked = rank(devices);
    if (!ranked.length) { host.innerHTML = emptyHtml((devices || []).length > 0); return; }
    host.innerHTML = ranked.map(function (r) {
      var s = r.strategy;
      var meter = r.devices.filter(metered).length;
      var sub = T(s.trigger, s.trigger === "Konum tabanlı" ? "Location-based" : "Schedule-based") + " · " + names(r.devices) +
        (meter ? " · " + T("güç okunuyor", "power readings available") : "");
      return '<a class="block bg-white rounded-3xl card-shadow p-5 flex items-center gap-4 active:scale-[0.99] transition-transform" href="nexus-energy-strategy.html"' +
        ' data-strategy="' + esc(s.id) + '" data-desc="' + esc(s.desc) + '" data-device="' + esc(s.category) + '" data-title="' + esc(s.title) + '">' +
        '<div class="w-12 h-12 rounded-2xl ' + s.tint + ' flex items-center justify-center flex-shrink-0"><i class="w-6 h-6" data-lucide="' + s.icon + '"></i></div>' +
        '<div class="min-w-0 flex-grow"><h3 class="font-bold leading-snug">' + esc(s.title) + '</h3>' +
        '<p class="text-xs text-slate-400 mt-1"><span data-no-i18n>' + esc(sub) + '</span><span class="strategy-state hidden ml-2 text-emerald-600 font-bold">· Etkin</span></p></div>' +
        '<i class="w-5 h-5 text-slate-300 flex-shrink-0" data-lucide="chevron-right"></i></a>';
    }).join("");
  }

  window.nexusEnergyStrategies = { CATALOG: CATALOG, matches: matches, rank: rank, sortDevicesFor: sortDevicesFor, isRelevant: isRelevant, render: render };
})();
