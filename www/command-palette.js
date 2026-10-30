/**
 * NEXUS — komut paleti: sayfalar, cihazlar ve hızlı eylemler tek kutuda aranır.
 *
 * Masaüstünde Ctrl+K (Electron tepsideyken Ctrl+Alt+N → main.cjs palette:open).
 * Telefon/tablette Ctrl+K olmaz; palet, ekranın sağ altındaki küçük arama düğmesiyle
 * açılır (AI asistan düğmesinin üstünde; karışmasın diye ondan bir tık küçük ve
 * farklı simgeli). Aynı arama, aynı sonuç listesi — platform yalnızca GİRİŞ noktasını
 * değiştirir.
 *
 * Erişilebilirlik: liste kutusu role="listbox"/option ile işaretlidir, ok tuşları
 * aria-activedescendant'ı taşır, sonuç sayısı nexusAnnounce ile duyurulur ve kapanınca
 * odak açan düğmeye döner.
 */
(function () {
  if (window.__nexusPalette) return;
  try {
    var u = typeof nexusGetItem === "function" ? nexusGetItem("nexusCurrentUser") : localStorage.getItem("nexusCurrentUser");
    if (!u || !String(u).trim()) return;
  } catch (e) { return; }
  // Oturum açma/şifre akışlarında arama anlamı yok; o sayfalarda hiç kurulmaz.
  var AUTH = ["index", "nexus-login", "nexus-register", "nexus-forgot-password", "nexus-onboarding", "nexus-setup-code", ""];
  var page = (location.pathname.split("/").pop() || "").replace(/\.html$/, "");
  if (AUTH.indexOf(page) !== -1) return;
  window.__nexusPalette = true;

  var T = function (tr, en) { return (window.nexusT || function (a) { return a; })(tr, en); };
  var el = null, input = null, listEl = null, items = [], active = 0;
  var opener = null; // odağın kapanınca döneceği düğme

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
      { icon: "home", label: T("Ev", "Home"), hint: T("Sayfa", "Page"), run: function () { location.href = "nexus-home.html"; } },
      { icon: "layout-grid", label: T("Akıllı", "Smart"), hint: T("Sayfa", "Page"), run: function () { location.href = "nexus-smart.html"; } },
      { icon: "circle-plus", label: T("Cihaz Ekle", "Add device"), hint: T("Sayfa", "Page"), run: function () { location.href = "nexus-pair.html"; } },
      { icon: "bell", label: T("Mesaj Merkezi", "Message Center"), hint: T("Sayfa", "Page"), run: function () { location.href = "nexus-messages.html"; } },
      { icon: "bell-ring", label: T("Anlık Bildirimler", "Instant Notifications"), hint: T("Sayfa", "Page"), run: function () { location.href = "nexus-instant-notifications.html"; } },
      { icon: "plug", label: T("Entegrasyonlar", "Integrations"), hint: T("Sayfa", "Page"), run: function () { location.href = "nexus-integrations.html"; } },
      { icon: "users", label: T("Hanedan", "Household"), hint: T("Sayfa", "Page"), run: function () { location.href = "nexus-household.html"; } },
      { icon: "zap", label: T("AI Enerji Tasarrufu", "AI Energy Saving"), hint: T("Sayfa", "Page"), run: function () { location.href = "nexus-energy.html"; } },
      { icon: "settings", label: T("Ayarlar", "Settings"), hint: T("Sayfa", "Page"), run: function () { location.href = "nexus-settings.html"; } },
      { icon: "sparkles", label: T("NEXUS AI'a sor", "Ask NEXUS AI"), hint: T("Sayfa", "Page"), run: function () { location.href = "nexus-chat.html"; } },
      { icon: "sun-moon", label: T("Temayı değiştir", "Toggle theme"), hint: T("Eylem", "Action"),
        run: function () {
          var on = document.documentElement.classList.contains("dark");
          nexusSetItem("nexusThemeSystem", "false");
          nexusSetItem("nexusDarkMode", on ? "false" : "true");
          window.dispatchEvent(new Event("themeChanged"));
        } },
    ];
  }

  // Ana sayfa kartıyla aynı ürün görseli (NX.imageUrl); yoksa simge kalır
  function deviceImage(d) {
    try { return window.NX && typeof NX.imageUrl === "function" && d ? NX.imageUrl(d) : ""; } catch (e) { return ""; }
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
        img: deviceImage(d),
        label: name,
        hint: d && d.room ? d.room : T("Cihaz", "Device"),
        run: function () { location.href = "nexus-device.html?i=" + i; },
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
    el.setAttribute("aria-label", T("Komut paleti", "Command palette"));
    el.innerHTML =
      '<div class="nx-pal-backdrop"></div>' +
      '<div class="nx-pal-card">' +
      '<div class="nx-pal-row"><svg class="nx-pal-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5" stroke-linecap="round"></path></svg>' +
      '<input class="nx-pal-input" type="text" placeholder="' + esc(T("Ara: sayfa, cihaz, eylem…", "Search: page, device, action…")) + '" aria-label="' + esc(T("Komut ara", "Search commands")) + '"/>' +
      '<kbd class="nx-pal-kbd">Esc</kbd></div>' +
      '<div class="nx-pal-list" role="listbox" aria-label="' + esc(T("Sonuçlar", "Results")) + '"></div>' +
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
      return '<button type="button" id="nx-pal-opt-' + i + '" role="option" class="nx-pal-item' + (i === 0 ? " is-active" : "") + '" data-i="' + i + '">' +
        (it.img
          ? '<img src="' + esc(it.img) + '" alt="" width="24" height="24" style="width:24px;height:24px;object-fit:contain;flex-shrink:0" loading="lazy" decoding="async" onerror="this.style.visibility=\'hidden\'"/>'
          : '<i data-lucide="' + it.icon + '"></i>') +
        '<span class="nx-pal-label">' + esc(it.label) + "</span>" +
        '<span class="nx-pal-hint">' + esc(it.hint) + "</span></button>";
    }).join("") : '<p class="nx-pal-empty">' + esc(T("Sonuç yok", "No results")) + "</p>";
    Array.prototype.forEach.call(listEl.querySelectorAll(".nx-pal-item"), function (btn) {
      btn.addEventListener("click", function () {
        var it = items[+btn.getAttribute("data-i")];
        if (it) { close(); it.run(); }
      });
    });
    if (items.length) listEl.setAttribute("aria-activedescendant", "nx-pal-opt-0");
    else listEl.removeAttribute("aria-activedescendant");
    if (window.nexusAnnounce && input && input.value) {
      var n = items.length;
      window.nexusAnnounce(n === 0 ? T("Sonuç yok", "No results") : n + " " + T("sonuç", n === 1 ? "result" : "results"));
    }
    if (window.lucide) lucide.createIcons();
  }

  function move(dir) {
    if (!items.length) return;
    active = (active + dir + items.length) % items.length;
    Array.prototype.forEach.call(listEl.querySelectorAll(".nx-pal-item"), function (btn, i) {
      btn.classList.toggle("is-active", i === active);
      btn.id = "nx-pal-opt-" + i;
      if (i === active) {
        listEl.setAttribute("aria-activedescendant", btn.id);
        btn.scrollIntoView({ block: "nearest" });
      }
    });
  }

  function open(from) {
    ensureDom();
    opener = from || null;
    el.classList.add("open");
    input.value = "";
    render(buildItems(""));
    input.focus();
  }

  function close() {
    if (el) el.classList.remove("open");
    if (opener && typeof opener.focus === "function") { try { opener.focus(); } catch (e) {} }
    opener = null;
  }

  window.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && String(e.key).toLowerCase() === "k") {
      e.preventDefault();
      if (el && el.classList.contains("open")) close(); else open();
    }
  });
  // ---- klavye kısayolları penceresi ("?" tuşu) ----
  var keysEl = null;
  function closeKeys() {
    if (keysEl) { keysEl.remove(); keysEl = null; }
  }
  function openKeys() {
    if (keysEl) return;
    var mod = /Mac/i.test(navigator.platform || "") ? "⌘" : "Ctrl";
    var rows = [
      [mod + " + K", T("Komut paleti: sayfa, cihaz, eylem ara", "Command palette: search pages, devices, actions")],
      [mod + " + B", T("Yan menüyü aç / kapat", "Toggle the sidebar")],
      ["?", T("Bu kısayol listesi", "This shortcut list")],
      ["Esc", T("Açık pencereyi kapat", "Close the open dialog")]
    ];
    keysEl = document.createElement("div");
    keysEl.setAttribute("role", "dialog");
    keysEl.setAttribute("aria-modal", "true");
    keysEl.setAttribute("aria-label", T("Klavye kısayolları", "Keyboard shortcuts"));
    keysEl.style.cssText = "position:fixed;inset:0;z-index:2147482000;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:16px";
    var dark = document.documentElement.classList.contains("dark");
    var html = '<div style="max-width:440px;width:100%;border-radius:20px;padding:22px;box-shadow:0 24px 60px -12px rgba(15,23,42,.45);background:' + (dark ? "#1e293b" : "#fff") + ";color:" + (dark ? "#f1f5f9" : "#0f172a") + '">' +
      '<p style="font-size:17px;font-weight:800;margin:0 0 14px">' + esc(T("Klavye kısayolları", "Keyboard shortcuts")) + "</p>";
    rows.forEach(function (r) {
      html += '<div style="display:flex;align-items:center;gap:12px;padding:8px 0;font-size:14px"><kbd style="min-width:78px;text-align:center;padding:3px 8px;border-radius:8px;font:700 12px inherit;background:' + (dark ? "#334155" : "#f1f5f9") + '">' + esc(r[0]) + "</kbd><span>" + esc(r[1]) + "</span></div>";
    });
    html += "</div>";
    keysEl.innerHTML = html;
    keysEl.addEventListener("click", function (e) { if (e.target === keysEl) closeKeys(); });
    document.body.appendChild(keysEl);
  }
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && keysEl) { closeKeys(); return; }
    var t = e.target, tag = t && t.tagName ? t.tagName.toLowerCase() : "";
    if (e.key !== "?" || e.ctrlKey || e.metaKey || e.altKey) return;
    if (tag === "input" || tag === "textarea" || tag === "select" || (t && t.isContentEditable)) return;
    if (el && el.classList.contains("open")) return;
    e.preventDefault();
    if (keysEl) closeKeys(); else openKeys();
  });
  window.nexusOpenShortcuts = openKeys;

  if (window.nexusDesktop && window.nexusDesktop.onPaletteOpen) window.nexusDesktop.onPaletteOpen(function () { open(); });
  window.nexusOpenPalette = open;

  // ---- dokunmatik giriş düğmesi ----
  // Klavye kısayolu olmayan ortamlar için: AI asistan düğmesinin üstünde küçük bir
  // arama balonu. Masaüstünde (fare + klavye) çıkmaz; Ctrl+K zaten var, iki giriş
  // noktası kalabalık olur. AI düğmesi yoksa da aynı köşede tek başına durur.
  function addTouchEntry() {
    try {
      var coarse = window.matchMedia && (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 1023px)").matches);
      if (!coarse || document.getElementById("nx-pal-entry")) return;
      var pref = typeof nexusGetItem === "function" ? nexusGetItem("nexusFabSearch") : localStorage.getItem("nexusFabSearch");
      if (pref === "false") return;
      var s = document.createElement("style");
      s.id = "nx-pal-entry-style";
      s.textContent =
        "#nx-pal-entry{position:fixed;right:18px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:90;" +
        "width:44px;height:44px;border-radius:999px;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;" +
        "background:rgba(255,255,255,.92);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);" +
        "box-shadow:0 10px 24px -8px rgba(15,23,42,.28);color:var(--nx-accent,#4C7DFF);transition:transform .15s ease,opacity .2s ease}" +
        "html.dark #nx-pal-entry,html[data-theme='dark'] #nx-pal-entry{background:rgba(30,41,59,.92);color:#8fb0ff}" +
        "#nx-pal-entry:active{transform:scale(.92)}" +
        "#nx-pal-entry:focus-visible{outline:2px solid var(--nx-accent,#4C7DFF);outline-offset:2px}" +
        "#nx-pal-entry svg{width:21px;height:21px}" +
        ".no-nav ~ #nx-pal-entry,#nx-pal-entry.no-nav{bottom:calc(140px + env(safe-area-inset-bottom))}";
      document.head.appendChild(s);

      var b = document.createElement("button");
      b.id = "nx-pal-entry";
      b.type = "button";
      b.setAttribute("aria-label", T("Ara: sayfa, cihaz, eylem", "Search: page, device, action"));
      b.setAttribute("aria-haspopup", "dialog");
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>';
      b.addEventListener("click", function () { open(b); });
      document.body.appendChild(b);
      // Aşağı kaydırırken balon içeriği kapatmasın: gizlenir, yukarı kaydırınca geri gelir.
      var lastY = window.pageYOffset || 0;
      window.addEventListener("scroll", function () {
        var y = window.pageYOffset || 0;
        if (Math.abs(y - lastY) < 8) return;
        var down = y > lastY && y > 80;
        b.style.opacity = down ? "0" : "";
        b.style.pointerEvents = down ? "none" : "";
        lastY = y;
      }, { passive: true });
    } catch (e) { /* giriş düğmesi çıkamazsa Ctrl+K/olay köprüsü yolu açık kalır */ }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addTouchEntry);
  else addTouchEntry();
})();
