// Konum tetikleyicisi arayüzü (nexus-skills.html): eve gelince / evden çıkınca. Tetikleyicinin kendisi
// automation-engine.js içindeki watchLocation'dır. DÜRÜSTLÜK: yalnızca mobil uygulamada (Capacitor Geolocation) ve
// uygulama AÇIKKEN çalışır; arka plan konumu istenmez. Merkez, haritada seçilen ev konumudur (nexusWeatherCoords).
// İzin penceresi yalnızca burada, kullanıcı düğmeye bastığında açılır.
(function () {
  if (window.nexusLocationTrigger) return;

  var EVENTS = [
    ["arrive", "Eve gelince"],
    ["leave", "Evden çıkınca"],
  ];
  var RADII = [100, 150, 300, 500];

  function isNative() {
    var c = window.Capacitor;
    return !!(c && c.isNativePlatform && c.isNativePlatform());
  }
  function geo() {
    var c = window.Capacitor;
    return isNative() && c.Plugins && c.Plugins.Geolocation ? c.Plugins.Geolocation : null;
  }
  function homeCoords() {
    try {
      var c = JSON.parse(nexusGetItem("nexusWeatherCoords") || "null");
      return c && isFinite(c.lat) && isFinite(c.lon) ? c : null;
    } catch (e) {
      return null;
    }
  }
  function granted(p) {
    return !!p && (p.location === "granted" || p.coarseLocation === "granted");
  }
  function permission() {
    var g = geo();
    if (!g) return Promise.resolve("unavailable");
    return g.checkPermissions().then(
      function (p) { return granted(p) ? "granted" : "needed"; },
      function () { return "unavailable"; },
    );
  }
  function requestPermission() {
    var g = geo();
    if (!g) return Promise.resolve("unavailable");
    return g.requestPermissions().then(
      function (p) { return granted(p) ? "granted" : "denied"; },
      function () { return "denied"; },
    );
  }
  function chip(attr, val, label, on) {
    return '<button type="button" class="qs-chip' + (on ? " is-on" : "") + '" ' + attr + '="' + val + '">' + label + "</button>";
  }
  function link(href, text) {
    return '<a href="' + href + '">' + text + "</a>";
  }

  function triggerHtml(L) {
    if (!isNative()) {
      return '<div class="qs-note">Konum tetikleyicisi yalnızca mobil uygulamada çalışır; bu cihazda kurulamaz.</div>';
    }
    if (!homeCoords()) {
      return '<div class="qs-note">Ev konumu seçilmedi. Önce ' + link("nexus-map.html", "konum seç") + "; sonra bu tetikleyiciyi kurabilirsin.</div>";
    }
    return (
      '<p class="qs-sub">Ev konumuna göre çalışır. Yalnızca uygulama açıkken denetlenir (arka planda konum izlenmez); yaklaşık dakikada bir okunur.</p>' +
      '<div class="qs-chips">' +
      EVENTS.map(function (e) { return chip("data-locev", e[0], e[1], L.event === e[0]); }).join("") +
      '</div><div class="qs-chips" style="margin-top:10px">' +
      RADII.map(function (r) { return chip("data-locrad", r, r + " m", L.radius === r); }).join("") +
      '</div><p class="qs-sub" id="qs-locperm" style="margin:10px 0 0"></p>'
    );
  }
  // Konum izni durumunu satıra yazar; izin yoksa düğme sunar.
  function fillStatus() {
    if (!document.getElementById("qs-locperm")) return;
    permission().then(function (s) {
      var cur = document.getElementById("qs-locperm");
      if (!cur) return;
      if (s === "granted") cur.textContent = "Konum izni verildi.";
      else if (s === "unavailable") cur.textContent = "Konum servisi bu cihazda kullanılamıyor.";
      else cur.innerHTML = 'Konum izni verilmedi, tetikleyici çalışmaz. <button type="button" class="qs-link-btn" data-locperm="1">Konum izni ver</button>';
    });
  }
  // Boş = kaydedilebilir; doluysa kullanıcıya gösterilecek neden.
  function problem() {
    if (!isNative()) return "Konum tetikleyicisi yalnızca mobil uygulamada çalışır.";
    if (!homeCoords()) return "Önce ev konumunu seç.";
    return "";
  }
  function summary(L) {
    var label = "";
    EVENTS.forEach(function (e) { if (e[0] === L.event) label = e[1]; });
    return label + " (" + L.radius + " m)";
  }

  window.nexusLocationTrigger = {
    isNative: isNative,
    fresh: function () { return { event: "arrive", radius: 150 }; },
    triggerHtml: triggerHtml,
    fillStatus: fillStatus,
    requestPermission: requestPermission,
    problem: problem,
    summary: summary,
  };
})();
