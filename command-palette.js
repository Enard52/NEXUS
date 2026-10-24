/**
 * NEXUS — Masaüstü komut paleti (yalnızca Electron uygulamasında çalışır).
 * Ctrl+K: sayfalar, cihazlar ve hızlı eylemler tek kutuda aranır; Enter ile çalışır.
 * Uygulama tepsideyken Ctrl+Alt+N global kısayolu pencereyi paletle birlikte açar
 * (main.cjs → palette:open). Telefon görünümü etkilenmez.
 */
(function () {
  if (!window.nexusDesktop || window.__nexusPalette) return;
  window.__nexusPalette = true;

  var T = function (tr, en) { return (window.nexusT || function (a) { return a; })(tr, en); };
  var el = null, input = null, listEl = null, items = [], active = 0;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function devices() {
    try {
      var d = JSON.parse(nexusGetItem("nexusPairedDevices") || "[]");
      return Array.isArray(d) ? d : [];
    } catch (e) { return []; }
  }

  function actions() {
    return [
      { icon: "home", label: T("Ev", "Home"), hint: T("Sayfa", "Page"), run: function () { location.href = "stitch-home.html"; } },
      { icon: "layout-grid", label: T("Akıllı", "Smart"), hint: T("Sayfa", "Page"), run: function () { location.href = "stitch-smart.html"; } },
      { icon: "circle-plus", label: T("Cihaz Ekle", "Add device"), hint: T("Sayfa", "Page"), run: function () { location.href = "stitch-pair.html"; } },
      { icon: "bell", label: T("Mesaj Merkezi", "Message Center"), hint: T("Sayfa", "Page"), run: function () { location.href = "stitch-messages.html"; } },
      { icon: "settings", label: T("Ayarlar", "Settings"), hint: T("Sayfa", "Page"), run: function () { location.href = "stitch-settings.html"; } },
      { icon: "sparkles", label: T("NEXUS AI'a sor", "Ask NEXUS AI"), hint: T("Sayfa", "Page"), run: function () { location.href = "stitch-chat.html"; } },
      { icon: "zap", label: T("AI Enerji Tasarrufu", "AI Energy Saving"), hint: T("Sayfa", "Page"), run: function () { location.href = "stitch-energy.html"; } },
      { icon: "sun-moon", label: T("Temayı değiştir", "Toggle theme"), hint: T("Eylem", "Action"),
        run: function () {
          var on = document.documentElement.classList.contains("dark");
          nexusSetItem("nexusThemeSystem", "false");
          nexusSetItem("nexusDarkMode", on ? "false" : "true");
          window.dispatchEvent(new Event("themeChanged"));
        } },
    ];
  }

  function buildItems(q) {
    var query = String(q || "").trim().toLocaleLowerCase("tr-TR");
    var out = [];
    actions().forEach(function (a) { if (!query || a.label.toLocaleLowerCase("tr-TR").indexOf(query) !== -1) out.push(a); });
    devices().forEach(function (d, i) {
      var name = d && d.name ? d.name : T("Adsız cihaz", "Unnamed device");
      if (query && name.toLocaleLowerCase("tr-TR").indexOf(query) === -1) return;
      out.push({
        icon: d && d.state && d.state.switch === true ? "power" : "cpu",
        label: name,
        hint: d && d.room ? d.room : T("Cihaz", "Device"),
        run: function () { location.href = "stitch-device.html?i=" + i; },
      });
    });
    return out.slice(0, 9);
  }

  function ensureDom() {
    if (el) return;
    el = document.createElement("div");
    el.id = "nx-palette";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.innerHTML =
      '<div class="nx-pal-backdrop"></div>' +
      '<div class="nx-pal-card">' +
      '<div class="nx-pal-row"><svg class="nx-pal-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5" stroke-linecap="round"></path></svg>' +
      '<input class="nx-pal-input" type="text" placeholder="' + esc(T("Ara: sayfa, cihaz, eylem…", "Search: page, device, action…")) + '" aria-label="' + esc(T("Komut ara", "Search commands")) + '"/>' +
      '<kbd class="nx-pal-kbd">Esc</kbd></div>' +
      '<div class="nx-pal-list" role="listbox"></div>' +
      "</div>";
    document.body.appendChild(el);
    input = el.querySelector(".nx-pal-input");
    listEl = el.querySelector(".nx-pal-list");
    el.querySelector(".nx-pal-backdrop").addEventListener("click", close);
    input.addEventListener("input", function () { render(buildItems(input.value)); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { close(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { var it = items[active]; if (it) { close(); it.run(); } }
    });
  }

  function render(list) {
    items = list;
    active = 0;
    listEl.innerHTML = items.length ? items.map(function (it, i) {
      return '<button type="button" role="option" class="nx-pal-item' + (i === 0 ? " is-active" : "") + '" data-i="' + i + '">' +
        '<i data-lucide="' + it.icon + '"></i><span class="nx-pal-label">' + esc(it.label) + "</span>" +
        '<span class="nx-pal-hint">' + esc(it.hint) + "</span></button>";
    }).join("") : '<p class="nx-pal-empty">' + esc(T("Sonuç yok", "No results")) + "</p>";
    Array.prototype.forEach.call(listEl.querySelectorAll(".nx-pal-item"), function (btn) {
      btn.addEventListener("click", function () {
        var it = items[+btn.getAttribute("data-i")];
        if (it) { close(); it.run(); }
      });
    });
    if (window.lucide) lucide.createIcons();
  }

  function move(dir) {
    if (!items.length) return;
    active = (active + dir + items.length) % items.length;
    Array.prototype.forEach.call(listEl.querySelectorAll(".nx-pal-item"), function (btn, i) {
      btn.classList.toggle("is-active", i === active);
      if (i === active) btn.scrollIntoView({ block: "nearest" });
    });
  }

  function open() {
    ensureDom();
    el.classList.add("open");
    input.value = "";
    render(buildItems(""));
    input.focus();
  }

  function close() { if (el) el.classList.remove("open"); }

  window.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && String(e.key).toLowerCase() === "k") {
      e.preventDefault();
      if (el && el.classList.contains("open")) close(); else open();
    }
  });
  if (window.nexusDesktop.onPaletteOpen) window.nexusDesktop.onPaletteOpen(function () { open(); });
})();
