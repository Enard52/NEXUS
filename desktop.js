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
      ["discover", "Keşfet", "stitch-discover.html", "compass"]
    ] },
    { group: "Ev", items: [
      ["pair", "Cihaz Ekle", "stitch-pair.html", "circle-plus"],
      ["energy", "AI Enerji Tasarrufu", "stitch-energy.html", "zap"],
      ["household", "Aile", "stitch-household.html", "users"],
      ["messages", "Mesaj Merkezi", "stitch-messages.html", "bell"]
    ] },
    { group: "Hesap", items: [
      ["profile", "Profil", "stitch-profile.html", "user"],
      ["settings", "Ayarlar", "stitch-settings.html", "settings"]
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
    "stitch-user-info.html": "profile", "stitch-account-security.html": "profile", "stitch-menu.html": "profile",
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
      '<button type="button" id="nx-side-upd" class="nx-side-upd" hidden><span class="nx-side-upd-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg></span><span class="nx-side-upd-txt"></span></button>' +
      '<nav class="nx-side-nav" aria-label="Ana menü">' +
      NAV.map(function (g) {
        return (g.group ? '<p class="nx-side-group">' + esc(g.group) + "</p>" : "") + g.items.map(function (it) {
          var active = it[0] === activeKey;
          return '<a href="' + it[2] + '" class="nx-side-link' + (active ? " is-active" : "") + '"' + (active ? ' aria-current="page"' : "") + ">" +
            '<i data-lucide="' + it[3] + '"></i><span>' + esc(it[1]) + "</span></a>";
        }).join("");
      }).join("") + "</nav>" +
      '<a href="stitch-chat.html" class="nx-side-ai' + (page === "stitch-chat.html" ? " is-active" : "") + '"><span class="nx-side-ai-ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#3F6FFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="nx-side-ai-txt"><b>NEXUS AI\'a sor</b><small>Sor · kontrol et</small></span><span class="nx-side-ai-dot" aria-hidden="true"></span><svg class="nx-side-ai-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></a>' +
      '<div class="nx-side-foot">' +
      '<a href="stitch-profile.html" class="nx-side-user"><span class="nx-side-avatar">' + esc(initials || "M") + '</span><span class="min-w-0"><b>' + esc(name) + '</b><small>Profili görüntüle</small></span></a>' +
      '<button type="button" class="nx-side-theme" id="nx-side-theme" aria-label="Temayı değiştir" title="Temayı değiştir"><i data-lucide="' + (dark ? "sun" : "moon") + '"></i></button>' +
      "</div>";
    var aside = document.createElement("aside");
    aside.id = "nx-side";
    aside.className = "nx-side";
    aside.innerHTML = html;
    document.body.insertBefore(aside, document.body.firstChild);
    // Menü sabit bir yüzeydir: sayfa değişse de kaydırma konumu korunur.
    try { aside.scrollTop = +sessionStorage.getItem("nxSideScroll") || 0; } catch (e) {}
    aside.addEventListener("scroll", function () {
      try { sessionStorage.setItem("nxSideScroll", aside.scrollTop); } catch (e) {}
    }, { passive: true });
    document.getElementById("nx-side-theme").addEventListener("click", function () {
      var on = document.documentElement.classList.contains("dark");
      set("nexusThemeSystem", "false");
      set("nexusDarkMode", on ? "false" : "true");
      window.dispatchEvent(new Event("themeChanged"));
      var btn = document.getElementById("nx-side-theme");
      btn.innerHTML = '<i data-lucide="' + (on ? "moon" : "sun") + '"></i>';
      if (window.lucide) lucide.createIcons();
    });
    if (window.lucide) lucide.createIcons();
    wireSideUpdate();
  }

  // Güncelleme bulununca menüde hızlı indirme/kurma butonu. Yalnızca masaüstü uygulamasında çalışır.
  function wireSideUpdate() {
    var api = window.nexusDesktop && window.nexusDesktop.updates;
    var btn = document.getElementById("nx-side-upd");
    if (!api || !btn) return;
    var T = window.nexusT || function (tr) { return tr; };
    var label = btn.querySelector(".nx-side-upd-txt");
    var current = null;
    function render(st) {
      if (!st) return;
      current = st;
      var v = st.availableVersion ? " " + st.availableVersion : "";
      btn.hidden = !(st.state === "available" || st.state === "downloading" || st.state === "ready");
      btn.disabled = st.state === "downloading";
      if (st.state === "available") label.textContent = T("Güncelleme indir" + v, "Download update" + v);
      else if (st.state === "downloading") label.textContent = T("İndiriliyor %" + (st.progress || 0), "Downloading " + (st.progress || 0) + "%");
      else if (st.state === "ready") label.textContent = T("Kur ve yeniden başlat", "Install and restart");
    }
    btn.addEventListener("click", function () {
      if (!current) return;
      if (current.state === "available") api.download();
      else if (current.state === "ready") api.install();
    });
    api.onState(render);
    if (api.getState) api.getState().then(render);
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
    stickyHeader();
  }

  // Masaüstünde üst başlık ve hemen altındaki sekme çubuğu kaydırmada yerinde kalır (sticky).
  // Sekme çubuğu, başlığın yüksekliği kadar aşağıdan yapışır.
  function stickyHeader() {
    var header = document.querySelector("body > header.nx-desk-col");
    if (!header) return;
    if (!isDesk()) return;
    var pageBg = getComputedStyle(document.body).backgroundColor;
    if (pageBg === "rgba(0, 0, 0, 0)") pageBg = document.documentElement.classList.contains("dark") ? "#0f172a" : "#F3F2F9";
    header.style.position = "sticky";
    header.style.top = "0";
    header.style.zIndex = "30";
    if (getComputedStyle(header).backgroundColor === "rgba(0, 0, 0, 0)") header.style.background = pageBg;
    // Sekme çubuğu: başlıktan sonra gelen ilk sabit olmayan NAV (alt gezinme sabit olduğu için atlanır)
    var tabs = null;
    for (var s = header.nextElementSibling; s; s = s.nextElementSibling) {
      if (s.tagName === "NAV" && getComputedStyle(s).position !== "fixed") { tabs = s; break; }
    }
    if (tabs && tabs.classList.contains("nx-desk-col")) {
      tabs.style.position = "sticky";
      tabs.style.top = header.offsetHeight + "px";
      tabs.style.zIndex = "29";
      tabs.style.background = pageBg;
    }
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
  // ---- Masaüstüne özel: klavye kısayolları ve fare ipuçları (telefonda çalışmaz) ----
  function typingTarget(t) { return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); }
  function visible(el) {
    var cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden" && cs.opacity !== "0" && cs.pointerEvents !== "none" && el.getBoundingClientRect().width > 0;
  }
  function closeTopSheet() {
    var bd = document.querySelectorAll('[id$="backdrop"]');
    for (var i = 0; i < bd.length; i++) {
      if (bd[i].classList.contains("hidden") || !visible(bd[i])) continue;
      bd[i].click();
      return true;
    }
    return false;
  }
  function addTips() {
    if (!isDesk()) return;
    var iconBtns = document.querySelectorAll("a[aria-label], button[aria-label]");
    for (var i = 0; i < iconBtns.length; i++) if (!iconBtns[i].title) iconBtns[i].title = iconBtns[i].getAttribute("aria-label");
    var links = document.querySelectorAll(".nx-side-link");
    for (var j = 0; j < links.length && j < 5; j++) links[j].title = links[j].textContent.trim() + " (Alt+" + (j + 1) + ")";
  }
  window.addEventListener("load", function () { setTimeout(addTips, 400); });
  document.addEventListener("keydown", function (e) {
    if (!isDesk() || e.defaultPrevented) return;
    if (e.key === "Escape") { if (closeTopSheet()) e.preventDefault(); return; }
    if (e.ctrlKey || e.metaKey) return;
    if (e.altKey && /^[1-5]$/.test(e.key)) {
      var link = document.querySelectorAll(".nx-side-link")[Number(e.key) - 1];
      if (link && !link.classList.contains("is-active")) { e.preventDefault(); location.href = link.getAttribute("href"); }
      return;
    }
    if (e.key === "/" && !e.altKey && !typingTarget(e.target)) {
      var fields = document.querySelectorAll('input[type="text"], input[type="search"], input:not([type]), textarea');
      for (var k = 0; k < fields.length; k++) {
        if (!visible(fields[k]) || fields[k].disabled || fields[k].readOnly) continue;
        e.preventDefault(); fields[k].focus(); return;
      }
    }
  });

  window.nexusLayout = { isDesk: isDesk, isTab: isTab, isMobileDevice: MOBILE_DEVICE, refresh: function () { classifyFixed(); transferBackground(); } };
})();
