lucide.createIcons();

function focusCatalogSearch() {
  const input = document.getElementById("catalog-search");
  if (!input) return;
  input.focus();
  input.select();
}

// Gömülü mod: pair.html içinde iframe olarak gösterilince kendi başlığını gizle
if (new URLSearchParams(location.search).has("embed")) {
  var _ih = document.getElementById("int-header");
  if (_ih) _ih.style.display = "none";
}

// ---- Tam 1:1 NEXUS Katalog Verisi (Tuya Referanslı) ----
// Katalog yalnızca NEXUS'un gerçekten bağlanabildiği cihaz türlerini gösterir (supported-devices.js tek kaynaktır).
// Eskiden burada 2000 satırlık genel bir ürün listesi vardı; aynı görsel birden çok kategoride tekrarlanıyordu.
// Artık her cihaz türü tek bir kutucuk olarak, tek sayfada, kategori başlıklarının altında listelenir.
function escapeCatalogHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeCatalogText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

var CATALOG_FUNCTION_IMAGE = {
  "control-double-wall-switch.png": "control-single-wall-switch.png",
  "control-triple-wall-switch.png": "control-single-wall-switch.png",
  "control-four-gang-switch.png": "control-single-wall-switch.png",
  "control-touch-switch.png": "control-single-wall-switch.png",
  "security-motion-sensor.png": "generic-motion-sensor.png",
};
function catalogFunctionImage(file) {
  return CATALOG_FUNCTION_IMAGE[file] || file;
}

function catalogTileHtml(item, groupTitle) {
  var safe = escapeCatalogHtml(item.n);
  var safeGroup = escapeCatalogHtml(groupTitle || "Genel");
  var image = catalogFunctionImage(item.img || "generic-smart-hub.png");
  var imageVersion = "20261031-products-11";
  return (
    '<button type="button" class="product-tile product-card text-left active:scale-[0.98] transition-transform cursor-pointer group" onclick="searchAndPairDevice(this, \'' +
    safe +
    "')\">" +
    '<div class="product-image-stage">' +
    '<img src="assets/products/' +
    image +
    "?v=" +
    imageVersion +
    '" data-file="' +
    image +
    '" alt="' +
    safe +
    '" class="catalog-img object-contain transition-transform duration-300 group-active:scale-95" loading="lazy" onerror="this.onerror=null;this.src=&quot;assets/products/generic-smart-hub.png?v=' +
    imageVersion +
    '&quot;;" />' +
    "</div>" +
    '<div class="px-1 pt-1 flex min-h-[30px] flex-col items-center justify-start">' +
    '<span class="product-name">' +
    safe +
    "</span>" +
    '<span class="product-category-pill">' +
    safeGroup +
    "</span>" +
    "</div>" +
    "</button>"
  );
}

function catalogGroupHtml(title, items) {
  if (!items.length) return "";
  return (
    '<section class="mb-9">' +
    '<h2 class="catalog-heading mb-4 text-lg font-black text-slate-900">' +
    escapeCatalogHtml(title) +
    "</h2>" +
    '<div class="product-grid">' +
    items
      .map(function (item) {
        return catalogTileHtml(item, title);
      })
      .join("") +
    "</div>" +
    "</section>"
  );
}

var MATRIX_CATEGORIES = [
  "Aydınlatma",
  "Priz ve Enerji",
  "Anahtar ve Röle",
  "Perde ve Panjur",
  "Sensörler",
  "İklimlendirme",
  "Kamera ve Kilit",
  "Diğer Cihazlar",
];

var MATRIX_TYPES = [
  [/kamera/, "Kamera", "Kamera ve Kilit"],
  [/kilit/, "Akıllı Kilit", "Kamera ve Kilit"],
  [/perde/, "Perde Motoru", "Perde ve Panjur"],
  [/priz|plug/, "Akıllı Priz", "Priz ve Enerji"],
  [/anahtar/, "Akıllı Anahtar", "Anahtar ve Röle"],
  [/4 kanalli/, "Röle", "Anahtar ve Röle"],
  [/role paneli/, "Çoklu Röle", "Anahtar ve Röle"],
  [/role|\b1pm\b/, "Röle", "Anahtar ve Röle"],
  [/hareket|motion/, "Hareket Sensörü", "Sensörler"],
  [/kapi|door/, "Kapı ve Pencere Sensörü", "Sensörler"],
  [/su baskin|su sizinti|flood/, "Su Baskını Sensörü", "Sensörler"],
  [/duman|smoke/, "Duman Dedektörü", "Sensörler"],
  [/gaz ve co/, "Gaz ve CO Dedektörü", "Sensörler"],
  [/hava sensoru|hava kalitesi/, "Hava Kalitesi Sensörü", "Sensörler"],
  [/sicaklik/, "Sıcaklık ve Nem Sensörü", "Sensörler"],
  [/termostat|klima/, "Termostat / Klima", "İklimlendirme"],
  [/\bfan\b/, "Fan", "İklimlendirme"],
  [/nemlendirici/, "Nemlendirici", "İklimlendirme"],
  [/serit|rgbw/, "LED Şerit / Işık Paneli", "Aydınlatma"],
  [/tavan lambasi/, "Tavan Lambası", "Aydınlatma"],
  [/masa lambasi/, "Masa Lambası", "Aydınlatma"],
  [/dimmer/, "Dimmer", "Aydınlatma"],
  [/panel/, "LED Şerit / Işık Paneli", "Aydınlatma"],
  [/ampul|bulb|isik/, "Akıllı Ampul", "Aydınlatma"],
  [/medya/, "TV / Bilgisayar", "Diğer Cihazlar"],
  [/wake|\bpc\b/, "TV / Bilgisayar", "Diğer Cihazlar"],
  [/robot supurge/, "Robot Süpürge", "Diğer Cihazlar"],
];

// Genel tür adı → kategori, yetenekler ve görsel (tıklanınca ağda aynı türdeki cihaz aranır).
var MATRIX_GENERIC = {};

function matrixTypeOf(m) {
  var name = normalizeCatalogText(m.name || "");
  for (var i = 0; i < MATRIX_TYPES.length; i++) {
    if (MATRIX_TYPES[i][0].test(name))
      return { name: MATRIX_TYPES[i][1], category: MATRIX_TYPES[i][2] };
  }
  return { name: m.name, category: "Diğer Cihazlar" };
}

function supportedMatrixCategory() {
  var groups =
    typeof nexusVisibleSupportedDevices === "function" ? nexusVisibleSupportedDevices() : [];
  var byCategory = {};
  var byType = {};
  groups.forEach(function (g) {
    (g.models || []).forEach(function (m) {
      var t = matrixTypeOf(m);
      var item = byType[t.name];
      if (!item) {
        item = byType[t.name] = { n: t.name, img: m.img, nx: 1, q: "", caps: m.caps || [] };
        (byCategory[t.category] = byCategory[t.category] || []).push(item);
      }
      // Türün en zengin yetenekli modeli görseli ve yetenekleri belirler (ör. renkli ampul).
      if ((m.caps || []).length > item.caps.length) {
        item.caps = m.caps;
        item.img = m.img;
      }
      item.q += " " + m.name;
    });
  });
  var out = [];
  MATRIX_CATEGORIES.forEach(function (cat) {
    if (!byCategory[cat]) return;
    byCategory[cat].forEach(function (item) {
      MATRIX_GENERIC[item.n] = { caps: item.caps.slice(), img: item.img };
    });
    out.push({ title: cat, items: byCategory[cat] });
  });
  return out;
}

// Tek sayfa: kategori menüsü yok; her tür bir kez, kategorisinin altında görünür.
function getVisibleCatalog() {
  return supportedMatrixCategory();
}

function renderCatalogContent() {
  var content = document.getElementById("catalog-content");
  if (!content) return;
  var query = normalizeCatalogText(
    ((document.getElementById("catalog-search") || {}).value || "").trim(),
  );
  var groups = getVisibleCatalog()
    .map(function (g) {
      return {
        title: g.title,
        items: g.items.filter(function (it) {
          return !query || normalizeCatalogText(it.n + " " + (it.q || "")).indexOf(query) !== -1;
        }),
      };
    })
    .filter(function (g) {
      return g.items.length;
    });
  content.innerHTML = groups.length
    ? groups
        .map(function (g) {
          return catalogGroupHtml(g.title, g.items);
        })
        .join("")
    : '<div class="px-6 py-16 text-center"><p class="text-sm font-medium text-slate-500 dark:text-slate-300">' +
      (query
        ? "Aramanla eşleşen cihaz bulunamadı."
        : "Bu uygulamada eklenebilen cihaz türü bulunamadı.") +
      "</p></div>";
  content.scrollTop = 0;
}

function openCodeModal() {
  window.location.href = "nexus-setup-code.html";
}

function closeCodeModal() {
  const modal = document.getElementById("code-modal");
  const content = document.getElementById("code-modal-content");
  content.classList.remove("scale-100");
  content.classList.add("scale-95");
  setTimeout(() => {
    modal.classList.add("hidden");
    document.getElementById("setup-code-input").value = "";
  }, 200);
}

function submitCode() {
  const input = document.getElementById("setup-code-input").value;
  if (input.length < 4) {
    showIntegrationsToast("Lütfen geçerli bir kod girin.");
    return;
  }
  closeCodeModal();
  setTimeout(() => {
    window.location.href = "nexus-setup-code.html";
  }, 150);
}

// Cihaza özel tarama: seçilen ürünü ağda arar (aynı protokol / aynı tür), bulursa gerçek adresiyle ekler.
// Bulamazsa kullanıcı onaylarsa cihaz yine de ürün görseliyle eklenir.
var _search = null;

function catalogKindOf(caps) {
  caps = caps || [];
  if (caps.indexOf("brightness") !== -1 || caps.indexOf("color") !== -1) return "light";
  if (caps.indexOf("energy") !== -1) return "plug";
  if (caps.indexOf("switch") !== -1) return "switch";
  return "";
}

function catalogMatches(info, resolved, name) {
  if (!info) return false;
  if (info.kind === "bridge") return !!resolved.protocol && resolved.protocol === info.protocol;
  if (resolved.protocol && resolved.protocol !== "unknown")
    return resolved.protocol === info.protocol;
  var want = catalogKindOf(resolved.caps);
  var label =
    String(info.name || "").toLocaleLowerCase("tr-TR") +
    " " +
    String(info.model || "").toLocaleLowerCase("tr-TR");
  var tokens = String(name || "")
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .filter(function (t) {
      return t.length > 3;
    });
  if (
    tokens.some(function (t) {
      return label.indexOf(t) !== -1;
    })
  )
    return true;
  return !!want && info.kind === want;
}

function makePairedEntry(s, found) {
  // Katalogdan eklenen cihaz henüz gerçekten bağlanmadı; bağlantı (host) yoksa "bağlı" denmez.
  const entry = {
    id: "catalog-" + encodeURIComponent(s.safeName),
    name: s.safeName,
    icon: "cpu",
    room: "Katalog · bağlı değil",
  };
  entry.protocol = s.resolved.protocol;
  entry.brand = s.resolved.brand;
  entry.caps = s.resolved.caps;
  entry.img = s.resolved.img;
  if (s.tileFile) entry.img = s.tileFile;
  if (found) {
    const host = /^https?:\/\//.test(found.host) ? found.host : "http://" + found.host;
    entry.id = ("lan-" + host).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    entry.host = host;
    entry.protocol = found.protocol;
    entry.kind = found.kind;
    entry.model = found.model;
    entry.endpointId = found.endpointId != null ? found.endpointId : 0;
    entry.entity = found.entity || null;
    if (found.caps) entry.caps = found.caps;
    entry.room = "Yerel ağ";
  }
  return entry;
}

function savePairedEntry(entry) {
  const paired = getPairedDevices();
  if (
    !paired.some(
      (d) =>
        d &&
        (d.name === entry.name || (entry.host && d.host === entry.host && d.name === entry.name)),
    )
  ) {
    paired.push(entry);
    nexusSetItem("nexusPairedDevices", JSON.stringify(paired));
    if (window.nexusCloud) window.nexusCloud.notifyLocalChange();
  }
}

function searchAndPairDevice(el, deviceName) {
  const safeName = (deviceName || "Yeni cihaz").trim();
  const groupTitle = nexusSrcText(el && el.querySelector(".product-category-pill"));
  // Desteklenen cihaz türleri markasızdır: ağda aynı türdeki (desteklenen protokolden) cihaz aranır.
  const generic = MATRIX_GENERIC[safeName];
  const resolved = generic
    ? { protocol: "unknown", brand: "", caps: generic.caps.slice(), img: generic.img }
    : typeof nexusResolveDevice === "function"
      ? nexusResolveDevice(safeName, groupTitle)
      : { protocol: "unknown", brand: "", caps: ["other"], img: "generic-smart-hub.png" };
  const tileImg = el && el.querySelector("img");
  const tileFile = tileImg ? tileImg.getAttribute("data-file") || "" : "";
  const s = {
    safeName: safeName,
    resolved: resolved,
    tileFile: tileFile,
    stop: false,
    found: null,
    done: false,
  };
  if (_search) _search.stop = true;
  _search = s;

  const overlay = document.getElementById("loading-overlay");
  overlay.style.display = "flex";
  document.getElementById("loading-spinner").classList.remove("hidden");
  document.getElementById("loading-notfound").classList.add("hidden");
  document.getElementById("loading-notfound").classList.remove("flex");
  document.getElementById("loading-title").textContent = safeName + " aranıyor…";
  document.getElementById("loading-sub").textContent =
    "Wi-Fi ağındaki cihazlar taranıyor. Cihazın açık olduğundan emin ol.";

  const finishSearch = function () {
    if (s.done || _search !== s) return;
    s.done = true;
    if (s.found) {
      // Köprüler (Hue, Home Assistant) kullanıcı onayı gerektirir: eşleştirme ekranı devralır.
      if (s.found.kind === "bridge") {
        window.location.href =
          "nexus-pair.html?host=" +
          encodeURIComponent(String(s.found.host).replace(/^https?:\/\//, ""));
        return;
      }
      savePairedEntry(makePairedEntry(s, s.found));
      navigateAfterPair();
      return;
    }
    if (s.cancelled) return;
    document.getElementById("loading-spinner").classList.add("hidden");
    const nf = document.getElementById("loading-notfound");
    nf.classList.remove("hidden");
    nf.classList.add("flex");
    if (window.lucide) lucide.createIcons();
  };

  if (!window.nexusLan || !window.nexusLan.autoScan) {
    setTimeout(finishSearch, 600);
    return;
  }
  const taken = {};
  getPairedDevices().forEach(function (d) {
    if (d && d.host) taken[d.host] = 1;
  });
  const limit = setTimeout(function () {
    s.stop = true;
  }, 25000);
  window.nexusLan
    .autoScan({
      shouldStop: function () {
        return s.stop;
      },
      onFound: function (info) {
        const host = /^https?:\/\//.test(info.host) ? info.host : "http://" + info.host;
        if (!s.found && !taken[host] && catalogMatches(info, resolved, safeName)) {
          s.found = info;
          s.stop = true;
        }
      },
    })
    .catch(function () {})
    .then(function () {
      clearTimeout(limit);
      finishSearch();
    });
}

function cancelDeviceSearch() {
  if (_search) {
    _search.stop = true;
    _search.cancelled = true;
    _search.done = true;
  }
  hideOverlay();
}

function hideOverlay() {
  if (_search) _search.stop = true;
  document.getElementById("loading-overlay").style.display = "none";
}

function getPairedDevices() {
  let devices = [];
  try {
    devices = JSON.parse(nexusGetItem("nexusPairedDevices") || "[]");
  } catch (error) {}
  return Array.isArray(devices) ? devices : [];
}

function navigateAfterPair() {
  const target = "nexus-home.html";
  if (window.top && window.top !== window) {
    window.top.location.href = target;
    return;
  }
  window.location.href = target;
}

var _catalogSearchEl = document.getElementById("catalog-search");
if (_catalogSearchEl) {
  _catalogSearchEl.addEventListener("input", renderCatalogContent);
}

renderCatalogContent();
