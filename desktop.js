/**
 * NEXUS — Masaüstü düzeni
 * Telefon tasarımına dokunmaz. Masaüstünde (masaüstü uygulaması ya da fareli geniş ekran)
 * aynı stitch sayfaları sol menülü, ortalanmış içerik sütunlu düzene geçer.
 * Telefon ve tablette (Android/iOS uygulaması ya da dokunmatik cihaz) her zaman telefon
 * tasarımı kullanılır; tablette yalnızca ortalanır. theme.js tarafından yüklenir.
 */
(function () {
  if (window.__nexusDesktop) return;
  window.__nexusDesktop = true;

  var MQ = window.matchMedia("(min-width: 1024px)");
  var MQT = window.matchMedia("(min-width: 640px)");
  // Telefon/tablet: mobil uygulama (Capacitor) ya da yalnızca dokunmatik cihaz. Bunlarda masaüstü düzeni hiç açılmaz.
  var MOBILE_DEVICE = (function () {
    try {
      if (window.nexusDesktop) return false; // masaüstü uygulaması (Electron)
      if (window.Capacitor && typeof Capacitor.isNativePlatform === "function" && Capacitor.isNativePlatform()) return true;
      return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    } catch (e) { return false; }
  })();
  var root = document.documentElement;
  var page = (location.pathname.split("/").pop() || "stitch-home.html").toLowerCase();

  // Giriş/kayıt ekranlarında menü yok; ortalanmış tek kart
  var AUTH = ["stitch-login.html", "stitch-register.html", "stitch-forgot-password.html", "stitch-onboarding.html", "index.html"];
  // Geniş içerikli (ızgara/pano) sayfalar
  var WIDE = ["stitch-home.html", "stitch-smart.html", "stitch-discover.html", "stitch-panels.html", "stitch-integrations.html",
    "stitch-pair.html", "stitch-map.html", "stitch-household.html", "stitch-skills.html", "stitch-multi-video.html",
    "stitch-cards.html", "stitch-energy.html", "stitch-device.html", "stitch-chat.html", "stitch-plus.html", "stitch-billing.html"];

  var NAV = [
    { group: "", items: [
      ["home", "Ev", "stitch-home.html", "home"],
      ["smart", "Akıllı", "stitch-smart.html", "layout-grid"],
      ["discover", "Keşfet", "stitch-discover.html", "compass"],
      ["panels", "Kontrol Panelleri", "stitch-panels.html", "sliders-horizontal"]
    ] },
    { group: "Ev", items: [
      ["pair", "Cihaz ekle", "stitch-pair.html", "circle-plus"],
      ["energy", "Enerji", "stitch-energy.html", "zap"],
      ["household", "Hane", "stitch-household.html", "users"],
      ["messages", "Mesajlar", "stitch-messages.html", "bell"]
    ] },
    { group: "Hesap", items: [
      ["profile", "Profil", "stitch-profile.html", "user"],
      ["settings", "Ayarlar", "stitch-settings.html", "settings"],
      ["plus", "NEXUS+", "stitch-plus.html", "sparkles"]
    ] }
  ];

  // Alt sayfaların hangi menü öğesine ait olduğu
  var PARENT = {
    "stitch-device.html": "panels", "stitch-integrations.html": "pair", "stitch-scan.html": "pair", "stitch-setup-code.html": "pair",
    "stitch-energy-devices.html": "energy", "stitch-energy-strategy.html": "energy",
    "stitch-smart-app-detail.html": "smart", "stitch-skills.html": "smart", "stitch-program.html": "smart", "stitch-scenario-settings.html": "smart",
    "stitch-cards.html": "home", "stitch-map.html": "home", "stitch-lighting-master.html": "discover", "stitch-cleaning-start.html": "discover",
    "stitch-air-quality.html": "discover", "stitch-room-comfort.html": "discover", "stitch-movie-mode.html": "discover", "stitch-multi-video.html": "discover",
    "stitch-night-security.html": "discover", "stitch-ai-protect.html": "discover", "stitch-home-health.html": "discover",
    "stitch-user-info.html": "profile", "stitch-account-security.html": "profile", "stitch-menu.html": "profile", "stitch-billing.html": "plus",
    "stitch-feedback.html": "settings", "stitch-privacy-mode.html": "settings", "stitch-instant-notifications.html": "settings",
    "stitch-device-updates.html": "settings", "stitch-dnd.html": "settings", "stitch-logs.html": "settings", "stitch-services.html": "settings",
    "stitch-homekit.html": "settings", "stitch-siri-shortcuts.html": "settings", "stitch-carplay.html": "settings", "stitch-web.html": "settings",
    "stitch-guest-mode.html": "household"
  };

  var activeKey = null;
  NAV.forEach(function (g) { g.items.forEach(function (it) { if (it[2] === page) activeKey = it[0]; }); });
  if (!activeKey) activeKey = PARENT[page] || null;

  root.setAttribute("data-nx-page", page.replace(/^stitch-|\.html$/g, ""));

  function isDesk() { return !MOBILE_DEVICE && MQ.matches; }
  function isTab() { return MQT.matches && !isDesk(); }

  function applyMode() {
    var on = isDesk();
    root.classList.toggle("nx-desk", on);
    root.classList.toggle("nx-desk-auth", on && AUTH.indexOf(page) !== -1);
    root.classList.toggle("nx-desk-wide", on && WIDE.indexOf(page) !== -1);
    root.classList.toggle("nx-tab", isTab());
  }
  applyMode(); // ilk boyamadan önce: titreme olmasın

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function get(key) {
    try { return typeof nexusGetItem === "function" ? nexusGetItem(key) : localStorage.getItem(key); } catch (e) { return null; }
  }
  function set(key, val) {
    try { if (typeof nexusSetItem === "function") nexusSetItem(key, val); else localStorage.setItem(key, val); } catch (e) {}
  }

  function buildSidebar() {
    if (document.getElementById("nx-side") || AUTH.indexOf(page) !== -1) return;
    var name = get("nexusUserName") || "Misafir";
    var initials = name.trim().split(/\s+/).map(function (p) { return p.charAt(0); }).join("").slice(0, 2).toLocaleUpperCase("tr-TR");
    var dark = root.classList.contains("dark");
    var html = '<a href="stitch-home.html" class="nx-side-brand" aria-label="NEXUS ana sayfa">' +
      '<span class="nx-side-logo" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
      "<span>NEXUS</span></a>" +
      '<a href="stitch-chat.html" class="nx-side-ai' + (page === "stitch-chat.html" ? " is-active" : "") + '"><i data-lucide="sparkles"></i><span>NEXUS AI\'a sor</span></a>' +
      '<nav class="nx-side-nav" aria-label="Ana menü">' +
      NAV.map(function (g) {
        return (g.group ? '<p class="nx-side-group">' + esc(g.group) + "</p>" : "") + g.items.map(function (it) {
          var active = it[0] === activeKey;
          return '<a href="' + it[2] + '" class="nx-side-link' + (active ? " is-active" : "") + '"' + (active ? ' aria-current="page"' : "") + ">" +
            '<i data-lucide="' + it[3] + '"></i><span>' + esc(it[1]) + "</span></a>";
        }).join("");
      }).join("") + "</nav>" +
      '<div class="nx-side-foot">' +
      '<a href="stitch-profile.html" class="nx-side-user"><span class="nx-side-avatar">' + esc(initials || "M") + '</span><span class="min-w-0"><b>' + esc(name) + '</b><small>Profili görüntüle</small></span></a>' +
      '<button type="button" class="nx-side-theme" id="nx-side-theme" aria-label="Temayı değiştir" title="Temayı değiştir"><i data-lucide="' + (dark ? "sun" : "moon") + '"></i></button>' +
      "</div>";
    var aside = document.createElement("aside");
    aside.id = "nx-side";
    aside.className = "nx-side";
    aside.innerHTML = html;
    document.body.insertBefore(aside, document.body.firstChild);
    document.getElementById("nx-side-theme").addEventListener("click", function () {
      var on = get("nexusDarkMode") === "true";
      set("nexusDarkMode", on ? "false" : "true");
      window.dispatchEvent(new Event("themeChanged"));
      var btn = document.getElementById("nx-side-theme");
      btn.innerHTML = '<i data-lucide="' + (on ? "moon" : "sun") + '"></i>';
      if (window.lucide) lucide.createIcons();
    });
    if (window.lucide) lucide.createIcons();
  }

  // Sabit konumlu öğeleri masaüstü düzenine göre sınıflandır
  function classifyFixed() {
    if (!isDesk() && !isTab()) return;
    var vh = window.innerHeight;
    Array.prototype.forEach.call(document.body.querySelectorAll("*"), function (el) {
      if (el.id === "nx-side" || el.closest("#nx-side")) return;
      var cs = getComputedStyle(el);
      if (cs.position !== "fixed") return;
      if (el.classList.contains("nexus-ai-fab")) return;
      var navLike = el.matches('nav[data-purpose="bottom-nav"]') ||
        (el.tagName === "NAV" && el.querySelector('a[href="stitch-home.html"]') && el.querySelector('a[href="stitch-profile.html"]'));
      if (navLike) { el.classList.add("nx-desk-hide"); return; }
      var r = el.getBoundingClientRect();
      var cls = String(el.className || "");
      if (/(^|\s)inset-0(\s|$)/.test(cls) || (r.height >= vh * 0.9 && r.width >= window.innerWidth * 0.9)) {
        // Yüklenişte görünen tam ekran kapsayıcı sayfanın kendisidir (ör. QR tarama); gizli olanlar modal arka planıdır
        var visible = cs.display !== "none" && cs.visibility !== "hidden" && parseFloat(cs.opacity) > 0.5 && !/hidden/.test(cls);
        el.classList.add(visible && !el.classList.contains("nx-desk-overlay") ? "nx-desk-page" : "nx-desk-overlay");
        return;
      }
      var bottomAnchored = cs.bottom === "0px" || /bottom-0/.test(cls);
      if (bottomAnchored && (/sheet|rounded-t/.test(cls))) { el.classList.add("nx-desk-sheet"); return; }
      if (bottomAnchored) { el.classList.add("nx-desk-bottom"); return; }
      if (cs.top === "0px" && r.width >= window.innerWidth * 0.6) el.classList.add("nx-desk-top");
    });
    // Sayfa gövdesindeki doğrudan içerik blokları ortalanmış sütuna alınır
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (/^(SCRIPT|STYLE|LINK|TEMPLATE|ASIDE)$/.test(el.tagName) || el.id === "nx-side") return;
      if (getComputedStyle(el).position === "fixed") return;
      el.classList.add("nx-desk-col");
    });
  }

  // Telefon tasarımında arka plan çoğu sayfada en dıştaki sarmalayıcıdadır; masaüstünde
  // sütunun dışı beyaz kalmasın diye o arka plan sayfa gövdesine taşınır.
  var bgOwner = null;
  function transferBackground() {
    var body = document.body;
    if (bgOwner) { bgOwner.style.removeProperty("background"); bgOwner = null; }
    body.style.removeProperty("background-image");
    body.style.removeProperty("background-color");
    body.style.removeProperty("background-attachment");
    if (!isDesk() && !isTab()) return;
    var vh = window.innerHeight;
    var cols = document.querySelectorAll("body > .nx-desk-col");
    for (var i = 0; i < cols.length; i++) {
      var el = cols[i];
      var cs = getComputedStyle(el);
      var hasBg = cs.backgroundImage !== "none" || !/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(cs.backgroundColor);
      if (!hasBg || el.getBoundingClientRect().height < vh * 0.6) continue;
      body.style.backgroundImage = cs.backgroundImage;
      body.style.backgroundColor = cs.backgroundColor;
      body.style.backgroundAttachment = "fixed";
      el.style.setProperty("background", "transparent", "important");
      bgOwner = el;
      break;
    }
  }

  function ensureIcons(cb) {
    if (window.lucide) return cb();
    var s = document.createElement("script");
    s.src = "js/lucide.js";
    s.onload = function () { if (window.lucide) lucide.createIcons(); cb(); };
    document.head.appendChild(s);
  }

  function init() {
    applyMode();
    if (isDesk()) ensureIcons(buildSidebar);
    classifyFixed();
    transferBackground();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  window.addEventListener("load", function () { classifyFixed(); transferBackground(); });
  [MQ, MQT].forEach(function (q) { q.addEventListener ? q.addEventListener("change", init) : q.addListener(init); });
  window.addEventListener("themeChanged", function () {
    setTimeout(transferBackground, 0);
    var btn = document.getElementById("nx-side-theme");
    if (btn) { btn.innerHTML = '<i data-lucide="' + (root.classList.contains("dark") ? "sun" : "moon") + '"></i>'; if (window.lucide) lucide.createIcons(); }
  });
  window.nexusLayout = { isDesk: isDesk, isTab: isTab, isMobileDevice: MOBILE_DEVICE, refresh: function () { classifyFixed(); transferBackground(); } };
})();
