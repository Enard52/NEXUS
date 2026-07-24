/**
 * NEXUS AI — Mobile front end (FAZ 9/10)
 *
 * The mobile surface: a phone-framed app shell (status bar + app bar + a bottom
 * tab bar) that renders the *same* screen bodies as the web and desktop front
 * ends via the shared `renderScreenBody` (@nexus/web). Primary screens live on
 * the tab bar; secondary screens are reached from a "More" tab — an authentic
 * mobile information architecture.
 *
 * Dependency-free, deterministic `data -> HTML string` renderer. A production
 * build would host this in a native/WebView shell (React Native / Capacitor);
 * that packaging is an external boundary — the *design* lives here.
 */

import { getTheme, type DesignTokens, type ThemeName } from "@nexus/design-system";
import { type ScreenId } from "@nexus/interface";
import {
  buildDemoScreens,
  escapeHtml,
  label,
  renderAvatar,
  renderLogo,
  renderScreenBody,
  renderStyles,
  setLocale,
  CURRENT_LOCALE,
  type DemoScreens,
} from "@nexus/web";

/** The four primary tabs shown on the bottom bar; the rest go under "More". */
const PRIMARY_TABS: readonly { id: ScreenId; label: string; icon: TabIcon }[] = [
  { id: "today", label: "Today", icon: "today" },
  { id: "home-state", label: "Home", icon: "home" },
  { id: "devices", label: "Devices", icon: "devices" },
  { id: "family", label: "Family", icon: "family" },
];

type TabIcon =
  | "today"
  | "home"
  | "devices"
  | "family"
  | "more"
  | "suggestions"
  | "skills"
  | "personalization"
  | "billing"
  | "download-center";

/** Small inline tab-bar icons — dependency-free, currentColor line art. */
export function renderTabIcon(name: TabIcon): string {
  const paths: Record<TabIcon, string> = {
    today: `<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>`,
    home: `<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/>`,
    devices: `<rect x="2" y="4" width="14" height="10" rx="1.5"/><rect x="16" y="9" width="6" height="11" rx="1.5"/>`,
    family: `<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20a6 6 0 0 1 12 0M15 20a5 5 0 0 1 7 0"/>`,
    more: `<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>`,
    suggestions: `<path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.1V17h6v-1.4c0-.8.4-1.5 1-2.1A6 6 0 0 0 12 3ZM9 20h6"/>`,
    skills: `<path d="m12 3 2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5Z"/>`,
    personalization: `<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>`,
    billing: `<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>`,
    "download-center": `<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>`,
  };
  return (
    `<svg width="22" height="22" viewBox="0 0 24 24" role="img" aria-hidden="true" ` +
    `fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ` +
    `stroke-linejoin="round">${paths[name]}</svg>`
  );
}

/** iOS-style status bar (decorative): time on the left, system glyphs on the right. */
export function renderStatusBar(): string {
  return (
    `<div class="statusbar" aria-hidden="true">` +
    `<span class="time">9:41</span>` +
    `<span class="sys">` +
    `<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="4" width="3" height="8" rx="1"/><rect x="10" y="1" width="3" height="11" rx="1"/><rect x="15" y="1" width="3" height="11" rx="1" opacity="0.4"/></svg>` +
    `<svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 11 1 4a10 10 0 0 1 14 0Z" opacity="0.9"/></svg>` +
    `<svg width="26" height="12" viewBox="0 0 26 12" fill="none" stroke="currentColor" stroke-width="1"><rect x="1" y="1" width="21" height="10" rx="2.5"/><rect x="3" y="3" width="15" height="6" rx="1" fill="currentColor" stroke="none"/><rect x="23.5" y="4" width="1.5" height="4" rx="0.75" fill="currentColor" stroke="none"/></svg>` +
    `</span></div>`
  );
}

/** Bottom tab bar: four primary tabs plus a "More" tab for secondary screens. */
export function renderTabBar(activeId: ScreenId | "more"): string {
  const primaryTabs: readonly { id: ScreenId; titleKey: string; icon: TabIcon }[] = [
    { id: "today", titleKey: "screen.today", icon: "today" },
    { id: "home-state", titleKey: "screen.homeState", icon: "home" },
    { id: "devices", titleKey: "screen.devices", icon: "devices" },
    { id: "family", titleKey: "screen.family", icon: "family" },
  ];
  const primaryIds = new Set<string>(primaryTabs.map((t) => t.id));
  const isMoreActive = activeId === "more" || !primaryIds.has(activeId);

  const tabs = [
    ...primaryTabs.map((t) => ({ id: t.id, label: label(t.titleKey), icon: t.icon })),
    { id: "more", label: CURRENT_LOCALE === "tr" ? "Daha Fazla" : "More", icon: "more" as TabIcon },
  ];
  const items = tabs
    .map((t) => {
      const on = t.id === "more" ? isMoreActive : t.id === activeId;
      return (
        `<a class="${on ? "active" : ""}" href="#${t.id}" data-nav="${t.id}"` +
        `${on ? ' aria-current="page"' : ""}>${renderTabIcon(t.icon)}` +
        `<span>${escapeHtml(t.label)}</span></a>`
      );
    })
    .join("");
  return `<nav class="tabbar" aria-label="Primary">${items}</nav>`;
}

/** Mobile chrome on top of the shared token-driven component styles. */
export function renderMobileStyles(t: DesignTokens): string {
  return `${renderStyles(t)}
body.mobile {
  background: #05060a; padding: ${t.space[6]}px;
  display: flex; justify-content: center; align-items: flex-start; min-height: 100vh;
}
.phone {
  width: 390px; max-width: 100%; height: 844px; background: var(--bg);
  border: 12px solid #000; border-radius: 52px; overflow: hidden;
  display: flex; flex-direction: column; position: relative;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
}
.statusbar {
  height: 48px; flex: none; display: flex; align-items: center; justify-content: space-between;
  padding: 0 ${t.space[6]}px; color: var(--text); font-size: 15px; font-weight: 600;
}
.statusbar .sys { display: flex; align-items: center; gap: ${t.space[2]}px; }
.appbar {
  flex: none; display: flex; align-items: center; gap: ${t.space[3]}px;
  padding: ${t.space[2]}px ${t.space[5]}px ${t.space[3]}px; border-bottom: 1px solid var(--surface);
}
.appbar .logo { width: 26px; height: 26px; }
.appbar .apptitle {
  font-family: 'Outfit', sans-serif; font-weight: 800; font-size: ${t.font.size.lg}px; letter-spacing: -0.02em;
  color: var(--text);
}
.appbar-right { margin-left: auto; display: flex; align-items: center; gap: ${t.space[3]}px; }
.appbar .avatar-wrap { display: flex; }
.m-lang { display: inline-flex; gap: 4px; font-size: 11px; }
.m-lang a { color: var(--muted); text-decoration: none; }
.m-lang a.active { color: var(--primary); font-weight: 700; }
.m-logout { display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: var(--radius); border: 1px solid var(--border);
  background: transparent; color: var(--muted); cursor: pointer; transition: all .15s ease; }
.m-logout:hover { border-color: var(--primary); color: var(--primary); }
.screen { flex: 1; overflow-y: auto; padding: ${t.space[5]}px; }
.screen h2:first-child { margin-top: 0; }
.screen .cards { grid-template-columns: 1fr 1fr; }
/* The phone frame is a fixed-width container, so the shared bento/grids must
   collapse to fit the frame — not the viewport — or they overflow on wide
   screens (e.g. the desktop-served mobile view or a preview file). */
.screen .bento { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.screen .bento-tile.featured { grid-column: 1 / -1; grid-row: auto; }
.screen .bento-tile.wide { grid-column: 1 / -1; }
.screen .bento-grid, .screen .bento-grid.wide { grid-template-columns: 1fr; }
.screen .assistant-strip { flex-wrap: wrap; }
.screen .assistant-strip .btn { margin-left: 0; }
.screen .quick-commands-grid { grid-template-columns: repeat(2, 1fr); }
.screen .ring-wrap { gap: ${t.space[4]}px; }
.tabbar {
  flex: none; display: flex; border-top: 1px solid var(--surface);
  background: var(--surface); padding-bottom: ${t.space[3]}px; margin: 0;
}
.tabbar a {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: ${t.space[2]}px ${t.space[1]}px; color: var(--muted);
  text-decoration: none; font-size: 10px; background: transparent; border: 0; border-radius: 0;
}
.tabbar a.active { background: transparent; box-shadow: none; color: var(--primary); }
.morelist { list-style: none; margin: 0; padding: 0; display: grid; gap: ${t.space[2]}px; }
.morerow {
  display: flex; align-items: center; gap: ${t.space[3]}px;
  background: var(--surface); border-radius: var(--radius); padding: ${t.space[4]}px;
  color: var(--text); text-decoration: none;
}
.morerow svg { color: var(--primary); }
html.js-tabs .screen > section[hidden] { display: none; }
@media (max-width: 480px) {
  body.mobile { padding: 0; }
  .phone {
    width: 100%; max-width: 100%; height: 100vh; height: 100dvh;
    border: 0; border-radius: 0; box-shadow: none;
  }
  .screen .cards { grid-template-columns: 1fr; }
  .screen .bento-tile, .screen .plan-card, .screen .skill-card-rich, .screen .suggestion-card { padding: 14px; }
  .screen .badge { white-space: normal; word-break: break-word; }
  .screen * { word-wrap: break-word; overflow-wrap: break-word; }

}`;
}

/** Progressive-enhancement tab switching for the phone's screen stack. */
const MOBILE_NAV_SCRIPT = `
document.documentElement.classList.add("js-tabs");
var sections = Array.prototype.slice.call(document.querySelectorAll(".screen > section"));
var links = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
function show(id) {
  var primaryIds = ["today", "home-state", "devices", "family"];
  var isMoreScreen = primaryIds.indexOf(id) < 0;
  sections.forEach(function (s) { s.hidden = s.id !== id; });
  links.forEach(function (a) {
    var target = a.getAttribute("data-nav");
    var on = target === id || (isMoreScreen && target === "more");
    if (a.parentNode && a.parentNode.className && a.parentNode.className.indexOf("tabbar") >= 0) {
      a.classList.toggle("active", on);
      if (on) { a.setAttribute("aria-current", "page"); } else { a.removeAttribute("aria-current"); }
    }
  });
}
function fromHash() {
  var id = location.hash.replace("#", "");
  show(sections.some(function (s) { return s.id === id; }) ? id : sections[0].id);
}
links.forEach(function (a) {
  a.addEventListener("click", function (e) {
    e.preventDefault();
    var id = a.getAttribute("data-nav");
    if (history.replaceState) { history.replaceState(null, "", "#" + id); } else { location.hash = id; }
    show(id);
  });
});
window.addEventListener("hashchange", fromHash);
fromHash();
`.trim();

export interface MobileOptions {
  readonly theme?: ThemeName;
  readonly userAgent?: string;
  /** Real per-user screens (defaults to the demo fixtures for the standalone preview). */
  readonly screens?: DemoScreens;
  /** Signed-in user's display name — drives the avatar initial and app-bar identity. */
  readonly displayName?: string;
  /** Active locale, so the app bar can offer a language switch that matches the web app. */
  readonly locale?: string;
  /** When true, render the authenticated chrome (logout, language switch, installable PWA). */
  readonly authenticated?: boolean;
}

/** Render the phone-framed mobile app as one HTML document (demo fixtures by default, real user data when provided). */
export function renderMobileDocument(options: MobileOptions = {}): string {
  const themeName: ThemeName = options.theme ?? "dark";
  const userAgent = options.userAgent ?? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";
  const theme = getTheme(themeName);
  if (options.locale) setLocale(options.locale);
  const authed = options.authenticated ?? false;
  const screens = options.screens ?? buildDemoScreens();

  const primaryIds = new Set<string>(PRIMARY_TABS.map((t) => t.id));
  const moreScreens = screens.nav.filter((s) => !primaryIds.has(s.id));

  const appScreens = screens.nav
    .map(
      (s) =>
        `<section id="${s.id}">${renderScreenBody(s.id, screens, userAgent, "mobile")}</section>`,
    )
    .join("\n");

  const isTr = CURRENT_LOCALE === "tr";
  const moreSubtitles: Record<string, string> = {
    suggestions: isTr
      ? "Zamanlanmış 3 akıllı otomasyon önerisi"
      : "3 scheduled smart automation suggestions",
    skills: isTr
      ? "Öğrenilen 5 aktif ses yeteneği & senaryo"
      : "5 learned active voice skills & scenarios",
    personalization: isTr
      ? "Asistan adı, ses modeli & gizlilik ayarları"
      : "Assistant name, voice model & privacy settings",
    billing: isTr
      ? "NEXUS Aile Paketi · Aktif Abonelik"
      : "NEXUS Family Plan · Active Subscription",
    "download-center": isTr
      ? "Çevrimdışı dosyalar & yerel model önbelleği"
      : "Offline files & local model cache",
  };

  const moreBadges: Record<string, string> = {
    suggestions: "3",
    skills: "5",
    personalization: isTr ? "Yön" : "Adm",
    billing: "PRO",
    "download-center": "140 MB",
  };

  const moreRows = moreScreens
    .map((s) => {
      // Authenticated view shows only real, on-brand rows — no demo subtitles/badges.
      const sub = authed ? "" : (moreSubtitles[s.id] ?? "");
      const badge = authed ? "" : (moreBadges[s.id] ?? "");
      return (
        `<li><a class="morerow" href="#${s.id}" data-nav="${s.id}">` +
        `<span style="width:36px;height:36px;border-radius:10px;background:color-mix(in srgb,var(--primary) 12%,var(--surface));display:flex;align-items:center;justify-content:center;color:var(--primary);flex:none;">${renderTabIcon(s.id as TabIcon)}</span>` +
        `<div style="flex:1;min-width:0;">` +
        `<div style="font-weight:600;font-size:14px;display:flex;align-items:center;gap:6px;">${escapeHtml(label(s.titleKey))}` +
        `${badge ? `<span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:999px;background:var(--tint);color:var(--primary);">${badge}</span>` : ""}` +
        `</div>` +
        `<div style="font-size:11px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(sub)}</div>` +
        `</div>` +
        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--muted);flex:none;"><polyline points="9 18 15 12 9 6"/></svg>` +
        `</a></li>`
      );
    })
    .join("");

  const systemStatusBanner =
    `<div style="background:linear-gradient(135deg,color-mix(in srgb,var(--primary) 15%,var(--surface)),var(--surface) 90%);border:1px solid color-mix(in srgb,var(--primary) 30%,var(--border));border-radius:var(--radius-lg);padding:14px;margin-bottom:14px;">` +
    `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">` +
    `<div style="font-weight:700;font-size:13px;color:var(--text);">${isTr ? "NEXUS Sistem Durumu" : "NEXUS System Status"}</div>` +
    `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(16,185,129,0.15);color:#10b981;">● ${isTr ? "%100 Çevrimdışı" : "100% Offline"}</span>` +
    `</div>` +
    `<div style="font-size:11px;color:var(--muted);line-height:1.4;">${isTr ? "Yerel Ses Motoru: v3.14-Tr (Çalışıyor) · 6/8 Cihaz Çevrimiçi" : "Local AI Engine: v3.14-Tr (Active) · 6/8 Devices Online"}</div>` +
    `</div>`;

  const quickSettingsCard =
    `<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:14px;margin-top:14px;display:flex;flex-direction:column;gap:10px;">` +
    `<div style="font-weight:700;font-size:12px;color:var(--muted);letter-spacing:0.04em;">${isTr ? "HIZLI KONTROLLER" : "QUICK CONTROLS"}</div>` +
    `<div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;"><span style="color:var(--text);">${isTr ? "Çevrimdışı Gizlilik Kalkanı" : "Offline Privacy Shield"}</span><span style="color:#10b981;font-weight:700;">✓ ${isTr ? "Aktif" : "Active"}</span></div>` +
    `<div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;"><span style="color:var(--text);">${isTr ? 'Sesle Uyanma ("NEXUS")' : 'Voice Wake ("NEXUS")'}</span><span style="color:var(--primary);font-weight:700;">✓ ${isTr ? "Açık" : "On"}</span></div>` +
    `<div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;"><span style="color:var(--text);">${isTr ? "Otomatik Ev Yedeği" : "Auto Home Backup"}</span><span style="color:var(--muted);">${isTr ? "Her Gün 03:00" : "Daily 03:00"}</span></div>` +
    `</div>`;

  const moreSection =
    `<section id="more">` +
    `<h2>${isTr ? "Daha Fazla" : "More"}</h2>` +
    `${authed ? "" : systemStatusBanner}` +
    `<ul class="morelist">${moreRows}</ul>` +
    `${authed ? "" : quickSettingsCard}` +
    `</section>`;

  const nameForInitial = options.displayName || screens.personalization.userAddress || "N";
  const initial = escapeHtml(nameForInitial.trim().charAt(0).toUpperCase() || "N");

  const locale = options.locale ?? CURRENT_LOCALE;
  const other = locale === "tr" ? "en" : "tr";

  // Authenticated app bar carries a language switch + logout; the standalone demo
  // keeps a decorative avatar only. Both reuse the shared avatar (letter fallback).
  const appbarRight = authed
    ? `<span class="m-lang"><a href="?lang=${locale}" class="active">${locale.toUpperCase()}</a>` +
      `<a href="?lang=${other}">${other.toUpperCase()}</a></span>` +
      `<div class="avatar-wrap">${renderAvatar(undefined, initial)}</div>` +
      `<button class="m-logout" id="m-logout" type="button" aria-label="${escapeHtml(label("auth.logout"))}">` +
      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></button>`
    : `<div class="avatar-wrap" aria-hidden="true">${renderAvatar(screens.personalization.avatarUrl, initial)}</div>`;

  // Installable-PWA wiring only in the authenticated app (served by the sync server,
  // where /manifest.webmanifest and /sw.js exist); the standalone demo stays a plain file.
  const pwaHead = authed
    ? `<link rel="manifest" href="/manifest.webmanifest" />\n<link rel="apple-touch-icon" href="/icon.svg" />`
    : "";
  const authScript = authed
    ? `\n<script>\nif("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").catch(function(){});}\nvar _lo=document.getElementById("m-logout");if(_lo){_lo.addEventListener("click",function(){fetch("/api/logout",{method:"POST"}).then(function(){location.href="/login";});});}\n</script>`
    : "";

  return `<!doctype html>
<html lang="${locale}" data-theme="${escapeHtml(themeName)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<meta name="theme-color" content="${theme.color.bg}" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="NEXUS" />
${pwaHead}
<title>NEXUS${authed ? "" : " Mobile"}</title>
<style>${renderMobileStyles(theme)}</style>
<script>${MOBILE_NAV_SCRIPT}</script>
</head>
<body class="mobile">
<div class="phone">
${renderStatusBar()}
<header class="appbar">${renderLogo(theme.color.primary)}<span class="apptitle">NEXUS</span><div class="appbar-right">${appbarRight}</div></header>
<main class="screen" id="main">
${appScreens}
${moreSection}
</main>
${renderTabBar("today")}
</div>
<script>${MOBILE_NAV_SCRIPT}</script>${authScript}
</body>
</html>`;
}

export const moduleName = "mobile" as const;
export const implemented = true;
