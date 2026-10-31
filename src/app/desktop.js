/**
 * NEXUS — Masaüstü düzeni
 * Telefon tasarımına dokunmaz. Masaüstünde (masaüstü uygulaması ya da fareli geniş ekran)
 * aynı nexus sayfaları sol menülü, ortalanmış içerik sütunlu düzene geçer.
 * Telefon ve tablette (Android/iOS uygulaması ya da dokunmatik cihaz) her zaman telefon
 * tasarımı kullanılır; tablette yalnızca ortalanır. theme.js tarafından yüklenir.
 */
(function () {
  if (typeof window === "undefined") return;
  if (window.__nexusDesktop) return;
  window.__nexusDesktop = true;

  var MQ = window.matchMedia("(min-width: 1024px)");
  var MQT = window.matchMedia("(min-width: 640px)");
  // Telefon/tablet: mobil uygulama (Capacitor) ya da yalnızca dokunmatik cihaz. Bunlarda masaüstü düzeni hiç açılmaz.
  var MOBILE_DEVICE = (function () {
    try {
      if (window.nexusDesktop) return false; // masaüstü uygulaması (Electron)
      if (window.Capacitor && typeof Capacitor.isNativePlatform === "function" && Capacitor.isNativePlatform()) return true;
      if (!window.matchMedia("(hover: none) and (pointer: coarse)").matches) return false;
      // Tablet (kısa kenarı >= 600 px) yatayda >= 1024 px genişliğe ulaşırsa iki bölmeli düzeni kullanır (#84);
      // telefonlar ve tabletin dikey/dar hâli ortalanmış telefon sütununda (nx-tab) kalır.
      return Math.min(screen.width, screen.height) < 600;
    } catch (e) { return false; }
  })();
  var root = document.documentElement;
  var rawPage = (location.pathname.split("/").pop() || "").toLowerCase();
  var page = rawPage || "index.html";

  // Giriş/kayıt/onboarding ekranlarında menü yok; ortalanmış tek kart
  var AUTH = [
    "nexus-login.html", "nexus-register.html", "nexus-forgot-password.html", "nexus-onboarding.html", "index.html",
    "nexus-login", "nexus-register", "nexus-forgot-password", "nexus-onboarding", "index", ""
  ];
  // Geniş içerikli (ızgara/pano) sayfalar
  var WIDE = ["nexus-home.html", "nexus-smart.html", "nexus-discover.html", "nexus-integrations.html",
    "nexus-pair.html", "nexus-map.html", "nexus-household.html", "nexus-skills.html", "nexus-multi-video.html",
    "nexus-cards.html", "nexus-energy.html", "nexus-device.html", "nexus-chat.html", "nexus-plus.html", "nexus-billing.html"];

  function get(key) {
    try { return typeof nexusGetItem === "function" ? nexusGetItem(key) : localStorage.getItem(key); } catch (e) { return null; }
  }
  function set(key, val) {
    try { if (typeof nexusSetItem === "function") nexusSetItem(key, val); else localStorage.setItem(key, val); } catch (e) {}
  }

  function isLoggedIn() {
    try {
      var u = get("nexusCurrentUser");
      return !!(u && String(u).trim());
    } catch (e) { return false; }
  }

  function isAuthPage() {
    var clean = (location.pathname.split("/").pop() || "").toLowerCase();
    if (!clean || clean === "index.html" || clean === "index") return true;
    return AUTH.indexOf(clean) !== -1 || AUTH.indexOf(clean.replace(/\.html$/, "")) !== -1;
  }

  var NAV = [
    { group: "", items: [
      ["home", "Ev", "nexus-home.html", "home"],
      ["smart", "Akıllı", "nexus-smart.html", "layout-grid"],
      ["discover", "Keşfet", "nexus-discover.html", "compass"]
    ] },
    { group: "Ev", items: [
      ["pair", "Cihaz Ekle", "nexus-pair.html", "circle-plus"],
      ["energy", "AI Enerji Tasarrufu", "nexus-energy.html", "zap"],
      ["household", "Aile", "nexus-household.html", "users"],
      ["messages", "Mesaj Merkezi", "nexus-messages.html", "bell"]
    ] },
    { group: "Hesap", items: [
      ["profile", "Profil", "nexus-profile.html", "user"],
      ["settings", "Ayarlar", "nexus-settings.html", "settings"]
    ] }
  ];

  // Alt sayfaların hangi menü öğesine ait olduğu
  var PARENT = {
    "nexus-device.html": "home", "nexus-integrations.html": "pair", "nexus-scan.html": "pair", "nexus-setup-code.html": "pair",
    "nexus-energy-devices.html": "energy", "nexus-energy-strategy.html": "energy",
    "nexus-smart-app-detail.html": "smart", "nexus-skills.html": "smart", "nexus-program.html": "smart", "nexus-scenario-settings.html": "smart",
    "nexus-cards.html": "home", "nexus-map.html": "home", "nexus-lighting-master.html": "discover", "nexus-cleaning-start.html": "discover",
    "nexus-air-quality.html": "discover", "nexus-room-comfort.html": "discover", "nexus-movie-mode.html": "discover", "nexus-multi-video.html": "discover",
    "nexus-night-security.html": "discover", "nexus-ai-protect.html": "discover", "nexus-home-health.html": "discover",
    "nexus-user-info.html": "profile", "nexus-account-security.html": "profile", "nexus-menu.html": "profile",
    "nexus-feedback.html": "settings", "nexus-privacy-mode.html": "settings", "nexus-instant-notifications.html": "settings",
    "nexus-device-updates.html": "settings", "nexus-dnd.html": "settings", "nexus-logs.html": "settings", "nexus-services.html": "settings",
    "nexus-homekit.html": "settings", "nexus-siri-shortcuts.html": "settings", "nexus-carplay.html": "settings", "nexus-web.html": "settings",
    "nexus-guest-mode.html": "household", "nexus-board.html": "household"
  };

  var activeKey = null;
  NAV.forEach(function (g) { g.items.forEach(function (it) { if (it[2] === page) activeKey = it[0]; }); });
  if (!activeKey) activeKey = PARENT[page] || null;

  root.setAttribute("data-nx-page", page.replace(/^nexus-|\.html$/g, ""));

  function isDesk() { return !MOBILE_DEVICE && MQ.matches; }
  function isTab() { return MQT.matches && !isDesk(); }

  // Sol menü: tam genişlik ↔ dar simge şeridi. Tercih saklanır ("1" dar, "0" geniş); hiç seçilmediyse
  // pencere dar olunca (1100px altı) kendiliğinden daralır. Ctrl+B ile de değişir.
  var SIDE_KEY = "nexusSideCollapsed";
  function sidePref() { try { return localStorage.getItem(SIDE_KEY); } catch (e) { return null; } }
  function applySide() {
    var p = sidePref();
    var collapsed = p === "1" || (p !== "0" && window.innerWidth < 1100);
    root.classList.toggle("nx-side-collapsed", collapsed);
    var btn = document.getElementById("nx-side-toggle");
    if (btn) {
      var label = collapsed ? "Menüyü genişlet (Ctrl+B)" : "Menüyü daralt (Ctrl+B)";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      btn.title = label;
      btn.innerHTML = '<i data-lucide="' + (collapsed ? "panel-left-open" : "panel-left-close") + '"></i>';
      if (window.lucide) lucide.createIcons();
    }
    // Daralmış menüde yazılar gizli: simgenin üstüne gelince adı görünsün
    var links = document.querySelectorAll(".nx-side-link");
    for (var i = 0; i < links.length; i++) {
      var span = links[i].querySelector("span");
      if (collapsed && span) links[i].setAttribute("title", span.textContent);
      else links[i].removeAttribute("title");
    }
  }
  function toggleSide() {
    var collapsed = root.classList.contains("nx-side-collapsed");
    try { localStorage.setItem(SIDE_KEY, collapsed ? "0" : "1"); } catch (e) {}
    applySide();
  }
  var sideResizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(sideResizeTimer);
    sideResizeTimer = setTimeout(applySide, 120);
  });

  function applyMode() {
    var on = isDesk();
    var authMode = isAuthPage() || !isLoggedIn();
    root.classList.toggle("nx-desk", on);
    root.classList.toggle("nx-desk-auth", on && authMode);
    root.classList.toggle("nx-logged-in", isLoggedIn() && !authMode);
    root.classList.toggle("nx-desk-wide", on && !authMode && WIDE.indexOf(page) !== -1);
    root.classList.toggle("nx-tab", isTab());
    applySide(); // ilk boyamadan önce: menü genişliği titremesin

    if (authMode) {
      var existingSide = document.getElementById("nx-side");
      if (existingSide) existingSide.remove();
    }
  }
  applyMode(); // ilk boyamadan önce: titreme olmasın

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function buildSidebar() {
    if (isAuthPage() || !isLoggedIn()) {
      var existingSide = document.getElementById("nx-side");
      if (existingSide) existingSide.remove();
      return;
    }
    if (document.getElementById("nx-side")) return;
    var name = get("nexusUserName") || "Misafir";
    var initials = name.trim().split(/\s+/).map(function (p) { return p.charAt(0); }).join("").slice(0, 2).toLocaleUpperCase("tr-TR");
    var avatar = get("nexusAvatar");
    var avatarHtml = avatar
      ? '<img src="' + esc(avatar) + '" alt="" class="nx-side-avatar" style="object-fit:cover;" onerror="this.outerHTML=\'<span class=\\\'nx-side-avatar\\\'>' + esc(initials || "M") + '</span>\'"/>'
      : '<span class="nx-side-avatar">' + esc(initials || "M") + '</span>';
    var dark = root.classList.contains("dark");
    var html = '<a href="nexus-home.html" class="nx-side-brand" aria-label="NEXUS ana sayfa">' +
      '<span class="nx-side-logo" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
      "<span>NEXUS</span></a>" +
      '<button type="button" id="nx-side-toggle" class="nx-side-toggle" aria-label="Menüyü daralt (Ctrl+B)"></button>' +
      '<nav class="nx-side-nav" aria-label="Ana menü">' +
      NAV.map(function (g) {
        return (g.group ? '<p class="nx-side-group">' + esc(g.group) + "</p>" : "") + g.items.map(function (it) {
          var active = it[0] === activeKey;
          return '<a href="' + it[2] + '" class="nx-side-link' + (active ? " is-active" : "") + '"' + (active ? ' aria-current="page"' : "") + ">" +
            '<i data-lucide="' + it[3] + '"></i><span>' + esc(it[1]) + "</span></a>";
        }).join("");
      }).join("") + "</nav>" +
      '<a href="nexus-chat.html" class="nx-side-ai' + (page === "nexus-chat.html" ? " is-active" : "") + '"><span class="nx-side-ai-ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#3F6FFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="nx-side-ai-txt"><b>NEXUS AI\'a sor</b><small>Sor · kontrol et</small></span><span class="nx-side-ai-dot" aria-hidden="true"></span><svg class="nx-side-ai-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></a>' +
      '<div class="nx-side-foot">' +
      '<a href="nexus-profile.html" class="nx-side-user">' + avatarHtml + '<span class="min-w-0"><b>' + esc(name) + '</b><small>Profili görüntüle</small></span></a>' +
      '<button type="button" id="nx-side-upd" class="nx-side-upd" hidden></button>' +
      '<button type="button" class="nx-side-theme" id="nx-side-theme" aria-label="Temayı değiştir" title="Temayı değiştir"><i data-lucide="' + (dark ? "sun" : "moon") + '"></i></button>' +
      "</div>";
    var aside = document.createElement("aside");
    aside.id = "nx-side";
    aside.className = "nx-side";
    aside.innerHTML = html;
    document.body.insertBefore(aside, document.body.firstChild);
    // Menü sabit bir yüzeydir: bağlantı listesinin (nx-side-nav) kaydırma konumu
    // sayfa değişse de korunur. Menünün kendisi (aside) overflow:clip — hiçbir
    // şey onu kaydıramaz; eskiden aside üzerinden saklanan konum, odak kaydırmalarıyla
    // menü içeriğini istemsizce "bir tık" aşağı itiyordu.
    var sideNav = aside.querySelector(".nx-side-nav");
    if (sideNav) {
      try { sideNav.scrollTop = +sessionStorage.getItem("nxSideNavScroll") || 0; } catch (e) {}
      sideNav.addEventListener("scroll", function () {
        try { sessionStorage.setItem("nxSideNavScroll", sideNav.scrollTop); } catch (e) {}
      }, { passive: true });
    }
    try { sessionStorage.removeItem("nxSideScroll"); } catch (e) {} // eski anahtar temizliği
    document.getElementById("nx-side-theme").addEventListener("click", function () {
      var on = document.documentElement.classList.contains("dark");
      set("nexusThemeSystem", "false");
      set("nexusDarkMode", on ? "false" : "true");
      window.dispatchEvent(new Event("themeChanged"));
      var btn = document.getElementById("nx-side-theme");
      btn.innerHTML = '<i data-lucide="' + (on ? "moon" : "sun") + '"></i>';
      if (window.lucide) lucide.createIcons();
    });
    document.getElementById("nx-side-toggle").addEventListener("click", toggleSide);
    applySide(); // düğmenin simgesi/etiketi ve (daralmışsa) bağlantı ipuçları
    if (window.lucide) lucide.createIcons();
    wireSideUpdate();
    window.addEventListener("nexusAvatarChanged", function () {
      var sideUser = document.querySelector(".nx-side-user");
      if (!sideUser) return;
      var av = get("nexusAvatar");
      var nm = get("nexusUserName") || "Misafir";
      var inits = nm.trim().split(/\s+/).map(function (p) { return p.charAt(0); }).join("").slice(0, 2).toLocaleUpperCase("tr-TR");
      var currentAv = sideUser.querySelector(".nx-side-avatar");
      if (currentAv) {
        if (av) {
          if (currentAv.tagName === "IMG") {
            currentAv.src = av;
          } else {
            var newImg = document.createElement("img");
            newImg.src = av;
            newImg.className = "nx-side-avatar";
            newImg.style.objectFit = "cover";
            newImg.onerror = function() { newImg.outerHTML = '<span class="nx-side-avatar">' + esc(inits || "M") + '</span>'; };
            currentAv.replaceWith(newImg);
          }
        } else {
          if (currentAv.tagName === "IMG") {
            var span = document.createElement("span");
            span.className = "nx-side-avatar";
            span.textContent = inits || "M";
            currentAv.replaceWith(span);
          }
        }
      }
    });
  }

  // Güncelleme bulununca menüde hızlı indirme/kurma butonu. Yalnızca masaüstü uygulamasında çalışır.
  function wireSideUpdate() {
    var api = window.nexusDesktop && window.nexusDesktop.updates;
    var btn = document.getElementById("nx-side-upd");
    if (!api || !btn) return;
    var T = window.nexusT || function (tr) { return tr; };
    var ICON_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>';
    var ICON_RESTART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>';
    var current = null;
    function setLabel(text) { btn.title = text; btn.setAttribute("aria-label", text); }
    function render(st) {
      if (!st) return;
      current = st;
      var v = st.availableVersion ? " " + st.availableVersion : "";
      var show = st.state === "available" || st.state === "downloading" || st.state === "ready";
      btn.hidden = !show;
      btn.disabled = st.state === "downloading";
      btn.classList.toggle("is-available", st.state === "available" || st.state === "ready");
      if (st.state === "available") { btn.innerHTML = ICON_DOWN; setLabel(T("Yeni sürüm" + v + " — indir", "New version" + v + " — download")); }
      else if (st.state === "downloading") { btn.innerHTML = '<span class="nx-side-upd-pct">' + (st.progress || 0) + "</span>"; setLabel(T("İndiriliyor %" + (st.progress || 0), "Downloading " + (st.progress || 0) + "%")); }
      else if (st.state === "ready") { btn.innerHTML = ICON_RESTART; setLabel(T("Güncelleme hazır — kur ve yeniden başlat", "Update ready — install and restart")); }
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
        (el.tagName === "NAV" && el.querySelector('a[href="nexus-home.html"]') && el.querySelector('a[href="nexus-profile.html"]'));
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
    // Sayfa gövdesindeki doğrudan içerik blokları ortalanmış sütuna alınır.
    // .nx-sr-only (ekran okuyucu live bölgesi) kesinlikle hariç: sütun kuralının
    // width/padding dayatması 1px'lik mutlak kutuyu genişletip görünmez kutuyla
    // belgeyi yatay kaydırılabilir yapıyordu (33 sayfada +64px).
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (/^(SCRIPT|STYLE|LINK|TEMPLATE|ASIDE)$/.test(el.tagName) || el.id === "nx-side") return;
      if (el.classList.contains("nx-sr-only")) return;
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
    // Önceki çağrıda yazdığımız zemin rengini sıfırla: tema (açık/koyu) değişince eski renk kalmasın
    var prevTabs = header.__nxAutoTabs;
    if (header.__nxAutoBg) { header.style.background = ""; header.style.backdropFilter = ""; header.style.webkitBackdropFilter = ""; header.__nxAutoBg = false; }
    if (prevTabs) { prevTabs.style.background = ""; prevTabs.style.backdropFilter = ""; prevTabs.style.webkitBackdropFilter = ""; header.__nxAutoTabs = null; }
    if (!header.__nxThemeWatch && window.MutationObserver) {
      header.__nxThemeWatch = true;
      new MutationObserver(function () { stickyHeader(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    }
    var pageBg = getComputedStyle(document.body).backgroundColor;
    var gradientBody = pageBg === "rgba(0, 0, 0, 0)" && getComputedStyle(document.body).backgroundImage !== "none";
    if (pageBg === "rgba(0, 0, 0, 0)") {
      // Gövde saydamsa (degrade arka plan) başlık, sayfanın gerçek zemin rengini alır; sabit gri-lila bir bant görünmesin
      var rootBg = getComputedStyle(document.documentElement).backgroundColor;
      pageBg = rootBg && rootBg !== "rgba(0, 0, 0, 0)" ? rootBg : document.documentElement.classList.contains("dark") ? "#0f172a" : "#F3F2F9";
    }
    header.style.position = "sticky";
    header.style.top = "0";
    header.style.zIndex = "30";
    // theme.js otomatik gizlenen başlığın zeminini kendisi boyar (kaydırma konumuna göre); burada boyanmaz.
    if (!header.__nxHdrAuto && getComputedStyle(header).backgroundColor === "rgba(0, 0, 0, 0)") {
      var m = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(pageBg);
      if (gradientBody && m) {
        // Degrade zeminde düz renkli bir bant, degradenin ilerleyen tonundan ayrışır: yarı saydam + bulanıklık
        header.style.background = "rgba(" + m[1] + "," + m[2] + "," + m[3] + ",0.22)";
        header.style.backdropFilter = "blur(14px)";
        header.style.webkitBackdropFilter = "blur(14px)";
      } else header.style.background = pageBg;
      header.__nxAutoBg = true;
    }
    // Sekme çubuğu: başlıktan sonra gelen ilk sabit olmayan NAV (alt gezinme sabit olduğu için atlanır)
    var tabs = null;
    for (var s = header.nextElementSibling; s; s = s.nextElementSibling) {
      var isTabBar = s.tagName === "NAV" || s.getAttribute("data-purpose") === "message-tabs" || !!s.querySelector("#tabs");
      if (isTabBar && getComputedStyle(s).position !== "fixed") { tabs = s; break; }
    }
    if (tabs) {
      tabs.style.position = "sticky";
      tabs.style.top = header.offsetHeight + "px";
      tabs.style.zIndex = "29";
      // Sekme çubuğu başlıkla aynı zemini alır (degrade sayfada aynı yarı saydam ton), aradan çizgi görünmesin
      var tm = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(pageBg);
      if (gradientBody && tm) {
        tabs.style.background = "rgba(" + tm[1] + "," + tm[2] + "," + tm[3] + ",0.22)";
        tabs.style.backdropFilter = "blur(14px)";
        tabs.style.webkitBackdropFilter = "blur(14px)";
      } else tabs.style.background = pageBg;
      header.__nxAutoTabs = tabs;
    }

    // Kaydırınca gizlenme/geri gelme ve zemin rengi theme.js'tedir (tüm ekranlarda aynı davranış).
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
    // QR sayfası siyah kalır; arka planı lila zemine taşımak başlığı silikleştirir.
    if (root.getAttribute("data-nx-page") === "scan") return;
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
    if (isAuthPage() || !isLoggedIn()) return;
    if (e.key === "Escape") { if (closeTopSheet()) e.preventDefault(); return; }
    // Ctrl/Cmd+B: menüyü daralt / genişlet (yazı alanında yazarken tetiklenmez)
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === "b" || e.key === "B")) {
      var tg = e.target && e.target.tagName;
      if (tg === "INPUT" || tg === "TEXTAREA" || (e.target && e.target.isContentEditable)) return;
      e.preventDefault();
      toggleSide();
      return;
    }
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
