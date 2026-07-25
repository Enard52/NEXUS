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
import { SUPPORTED_LOCALES } from "@nexus/i18n";
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
  | "download-center"
  | "platform"
  | "agents"
  | "admin-dashboard";

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
    platform: `<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>`,
    agents: `<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 15h.01M16 15h.01"/>`,
    "admin-dashboard": `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>`,
  };
  return (
    `<svg width="22" height="22" viewBox="0 0 24 24" role="img" aria-hidden="true" ` +
    `fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ` +
    `stroke-linejoin="round">${paths[name] ?? ""}</svg>`
  );
}

/** Dynamic-island (iOS) or Punch-hole (Android) status bar (decorative). */
export function renderStatusBar(platform: "ios" | "android" = "ios"): string {
  if (platform === "android") {
    return (
      `<div class="statusbar statusbar-android" aria-hidden="true">` +
      `<span class="time">10:00</span>` +
      `<span class="punch-hole" aria-hidden="true"></span>` +
      `<span class="sys">` +
      `<span class="net-type" style="font-size:10px;font-weight:800;margin-right:2px;letter-spacing:-0.5px;">5G</span>` +
      `<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="4" width="3" height="8" rx="1"/><rect x="10" y="1" width="3" height="11" rx="1"/><rect x="15" y="1" width="3" height="11" rx="1"/></svg>` +
      `<svg width="26" height="12" viewBox="0 0 26 12" fill="none" stroke="currentColor" stroke-width="1"><rect x="1" y="1" width="21" height="10" rx="2.5"/><rect x="3" y="3" width="16" height="6" rx="1" fill="currentColor" stroke="none"/><rect x="23.5" y="4" width="1.5" height="4" rx="0.75" fill="currentColor" stroke="none"/></svg>` +
      `</span></div>`
    );
  }
  return (
    `<div class="statusbar statusbar-ios" aria-hidden="true">` +
    `<span class="time">9:41</span>` +
    `<span class="dynamic-island" aria-hidden="true"></span>` +
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
    { id: "more", label: label("mobile.menu"), icon: "more" as TabIcon },
  ];
  const items = tabs
    .map((t) => {
      const on = (t.id === "more" && isMoreActive) || t.id === activeId;
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
@keyframes phone-float {
  0%,100% { transform: translateY(0px); box-shadow: 0 30px 80px rgba(0,0,0,0.55); }
  50%      { transform: translateY(-7px); box-shadow: 0 38px 90px rgba(0,0,0,0.48); }
}
@keyframes screen-slide-in {
  from { opacity: 0; transform: translateX(18px); }
  to   { opacity: 1; transform: none; }
}
@keyframes tab-pill-slide {
  from { opacity: 0; transform: scaleX(0.5); }
  to   { opacity: 1; transform: scaleX(1); }
}
@keyframes more-row-in {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: none; }
}
@keyframes status-pulse {
  0% { opacity: 0.6; box-shadow: 0 0 4px #10b981; }
  50% { opacity: 1; box-shadow: 0 0 12px #10b981; transform: scale(1.1); }
  100% { opacity: 0.6; box-shadow: 0 0 4px #10b981; }
}
@keyframes shimmer {
  0%   { background-position: -300px 0; }
  100% { background-position: 300px 0; }
}
body.mobile {
  background: #05060a; padding: ${t.space[6]}px;
  display: flex; justify-content: center; align-items: flex-start; min-height: 100vh;
}
.phone {
  width: 390px; max-width: 100%; height: 844px; background: var(--bg);
  border: 12px solid #000; border-radius: 52px; overflow: hidden;
  display: flex; flex-direction: column; position: relative;
  animation: phone-float 5s ease-in-out infinite;
}
.statusbar {
  height: 52px; flex: none; display: flex; align-items: center; justify-content: space-between;
  padding: 0 ${t.space[6]}px; color: var(--text); font-size: 15px; font-weight: 600;
  position: relative;
}
.statusbar-android {
  padding: 0 ${t.space[5]}px;
}
.dynamic-island {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  width: 120px; height: 34px; background: #000; border-radius: 20px;
  box-shadow: 0 0 0 1.5px rgba(255,255,255,0.06);
  pointer-events: none;
}
.statusbar .punch-hole {
  position: absolute; top: 18px; left: 50%; transform: translateX(-50%);
  width: 14px; height: 14px; background: #000; border-radius: 50%;
  box-shadow: 0 0 0 1.5px rgba(255,255,255,0.06); pointer-events: none;
}
.statusbar .sys { display: flex; align-items: center; gap: ${t.space[2]}px; }
.appbar {
  flex: none; display: flex; align-items: center; gap: ${t.space[3]}px;
  padding: ${t.space[2]}px ${t.space[5]}px ${t.space[3]}px;
  background: rgba(15, 18, 28, 0.75);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid color-mix(in srgb, var(--primary) 18%, var(--surface));
  position: relative;
}
.appbar::after {
  content: ''; position: absolute; bottom: 0; left: 10%; right: 10%; height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb,var(--primary) 40%,transparent), transparent);
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
  background: transparent; color: var(--muted); cursor: pointer;
  transition: border-color .18s ease, color .18s ease; }
.m-logout:hover { border-color: var(--primary); color: var(--primary); }
.screen { flex: 1; overflow-y: auto; padding: ${t.space[5]}px; }
.screen h2:first-child { margin-top: 0; }
.screen section.screen-enter { animation: screen-slide-in 0.26s cubic-bezier(0.22,1,0.36,1) both; }
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
  flex: none; display: flex; border-top: 1px solid color-mix(in srgb, var(--primary) 15%, var(--border));
  background: rgba(15, 18, 28, 0.75); backdrop-filter: blur(20px) saturate(180%);
  padding-bottom: calc(${t.space[3]}px + 20px); margin: 0; position: relative;
}
.tabbar a {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: ${t.space[2]}px ${t.space[1]}px; color: var(--muted);
  text-decoration: none; font-size: 10px; background: transparent; border: 0; border-radius: 0;
  position: relative; transition: color 0.22s ease;
}
.tabbar a svg { transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1); }
.tabbar a.active { background: transparent; box-shadow: none; color: var(--primary); }
.tabbar a.active svg { transform: scale(1.18) translateY(-1px); }
.tab-indicator {
  position: absolute; top: 0; height: 2.5px; border-radius: 0 0 3px 3px;
  background: var(--primary); pointer-events: none;
  transition: left 0.28s cubic-bezier(0.22,1,0.36,1), width 0.28s cubic-bezier(0.22,1,0.36,1);
  box-shadow: 0 0 8px color-mix(in srgb,var(--primary) 50%,transparent);
}
.morelist { list-style: none; margin: 0; padding: 0; display: grid; gap: ${t.space[2]}px; }
.morerow {
  display: flex; align-items: center; gap: ${t.space[3]}px;
  background: var(--surface); border-radius: var(--radius); padding: ${t.space[4]}px;
  color: var(--text); text-decoration: none; transition: background 0.18s ease, transform 0.18s ease;
}
.morerow:hover { background: color-mix(in srgb, var(--surface) 80%, var(--primary)); transform: translateY(-1px); }
.morerow svg { color: var(--primary); transition: transform 0.18s ease; }
.morerow:hover > svg:last-child { transform: translateX(3px); }
.morelist li { opacity: 0; animation: more-row-in 0.28s cubic-bezier(0.22,1,0.36,1) forwards; }
.morelist li:nth-child(1) { animation-delay: 0.04s; }
.morelist li:nth-child(2) { animation-delay: 0.08s; }
.morelist li:nth-child(3) { animation-delay: 0.12s; }
.morelist li:nth-child(4) { animation-delay: 0.16s; }
.morelist li:nth-child(5) { animation-delay: 0.20s; }
.morelist li:nth-child(6) { animation-delay: 0.24s; }
.morelist li:nth-child(7) { animation-delay: 0.28s; }
.morelist li:nth-child(8) { animation-delay: 0.32s; }
html.js-tabs .screen > section[hidden] { display: none; }
@media (prefers-reduced-motion: reduce) {
  .phone { animation: none; }
  .tabbar a svg, .tabbar a, .m-logout, .morerow, .morerow svg { transition: none; }
  .screen section.screen-enter { animation: none; }
  .morelist li { animation: none; opacity: 1; }
  .tab-indicator { transition: none; }
}
@media (max-width: 480px) {
  body.mobile { padding: 0; }
  .phone {
    width: 100%; max-width: 100%; height: 100vh; height: 100dvh;
    border: 0; border-radius: 0; box-shadow: none; animation: none;
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
var tabIndicator = null;
function positionTabIndicator() {
  var tabbar = document.querySelector(".tabbar");
  if (!tabbar) return;
  if (!tabIndicator) {
    tabIndicator = document.createElement("span");
    tabIndicator.className = "tab-indicator";
    tabbar.appendChild(tabIndicator);
  }
  var active = tabbar.querySelector("a.active");
  if (active) {
    var barRect = tabbar.getBoundingClientRect();
    var aRect = active.getBoundingClientRect();
    tabIndicator.style.left = (aRect.left - barRect.left) + "px";
    tabIndicator.style.width = aRect.width + "px";
  }
}
function show(id) {
  var primaryIds = ["today", "home-state", "devices", "family"];
  var isMoreScreen = primaryIds.indexOf(id) < 0;
  sections.forEach(function (s) {
    var becoming = s.id === id;
    if (becoming && s.hidden) {
      s.hidden = false;
      s.classList.remove("screen-enter");
      void s.offsetWidth;
      s.classList.add("screen-enter");
    } else if (!becoming) {
      s.hidden = true;
    }
  });
  links.forEach(function (a) {
    var target = a.getAttribute("data-nav");
    var on = target === id || (isMoreScreen && target === "more");
    if (a.parentNode && a.parentNode.className && a.parentNode.className.indexOf("tabbar") >= 0) {
      a.classList.toggle("active", on);
      if (on) { a.setAttribute("aria-current", "page"); } else { a.removeAttribute("aria-current"); }
    }
  });
  positionTabIndicator();
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

  const moreSubtitles: Record<string, string> = {
    suggestions: label("mobile.moreSub.suggestions"),
    skills: label("mobile.moreSub.skills"),
    personalization: label("mobile.moreSub.personalization"),
    billing: label("mobile.moreSub.billing"),
    "download-center": label("mobile.moreSub.downloads"),
    platform: label("mobile.moreSub.platform"),
    agents: label("mobile.moreSub.agents"),
    "admin-dashboard": label("mobile.moreSub.admin"),
  };

  const moreBadges: Record<string, string> = {
    suggestions: "3",
    skills: "5",
    personalization: "Adm",
    billing: "PRO",
    "download-center": "140 MB",
    platform: "3 OS",
    agents: "4 Active",
    "admin-dashboard": "LIVE",
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
    `<div style="position:relative; background:rgba(20,22,35,0.6); backdrop-filter:blur(12px); border:1px solid color-mix(in srgb, var(--primary) 20%, var(--border)); border-radius: 20px; padding: 18px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05); overflow:hidden;">` +
    `<div style="position:absolute; top:-20px; right:-20px; width:100px; height:100px; background:var(--primary); filter:blur(50px); opacity:0.15; border-radius:50%;"></div>` +
    `<div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom: 14px; position:relative; z-index:1;">` +
    `<div style="display:flex; align-items:center; gap: 8px;">` +
    `<div style="width:32px; height:32px; border-radius:10px; background:color-mix(in srgb, var(--primary) 15%, transparent); color:var(--primary); display:flex; align-items:center; justify-content:center;">` +
    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>` +
    `</div>` +
    `<div>` +
    `<div style="font-weight:700; font-size:14px; color:var(--text); letter-spacing:-0.01em;">${label("mobile.systemStatus")}</div>` +
    `<div style="font-size:11px; color:var(--muted); margin-top:2px;">${label("mobile.localNetwork")}</div>` +
    `</div>` +
    `</div>` +
    `<div style="display:flex; align-items:center; gap:6px; background:rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); padding: 4px 10px; border-radius: 999px;">` +
    `<span style="width:6px; height:6px; border-radius:50%; background:#10b981; box-shadow: 0 0 8px #10b981; animation: status-pulse 2s infinite;"></span>` +
    `<span style="font-size:11px; font-weight:700; color:#10b981;">${label("mobile.offline")}</span>` +
    `</div>` +
    `</div>` +
    `<div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; position:relative; z-index:1;">` +
    `<div style="background:rgba(0,0,0,0.2); border-radius: 12px; padding: 10px; display:flex; flex-direction:column; gap:4px;">` +
    `<div style="display:flex; align-items:center; gap:6px; color:var(--muted); font-size:11px; font-weight:600;">` +
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10z"></path><path d="M12 6v6l4 2"></path></svg>` +
    `${label("mobile.localAI")}` +
    `</div>` +
    `<div style="font-size:12px; font-weight:700; color:var(--text);">v3.14-Tr <span style="color:var(--primary); font-weight:600; font-size:11px; margin-left:4px;">(Aktif)</span></div>` +
    `</div>` +
    `<div style="background:rgba(0,0,0,0.2); border-radius: 12px; padding: 10px; display:flex; flex-direction:column; gap:4px;">` +
    `<div style="display:flex; align-items:center; gap:6px; color:var(--muted); font-size:11px; font-weight:600;">` +
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"></path><path d="M4 8h16"></path><path d="M8 4v4"></path></svg>` +
    `${label("mobile.deviceNetwork")}` +
    `</div>` +
    `<div style="font-size:12px; font-weight:700; color:var(--text);">6/8 <span style="color:var(--muted); font-weight:500; font-size:11px; margin-left:4px;">${label("mobile.online")}</span></div>` +
    `</div>` +
    `</div>` +
    `</div>`;

  const quickSettingsCard =
    `<div style="background:rgba(20,22,35,0.6); backdrop-filter:blur(12px); border:1px solid color-mix(in srgb, var(--border) 60%, transparent); border-radius: 20px; padding: 6px; margin-top: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);">` +
    `<div style="padding: 12px 14px 6px; display:flex; align-items:center; gap:6px;">` +
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--primary);"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20v-4"></path></svg>` +
    `<div style="font-weight:800; font-size:11px; color:var(--muted); letter-spacing:0.06em;">${label("mobile.quickControls")}</div>` +
    `</div>` +
    `<div style="display:flex; flex-direction:column; gap:4px; padding:4px;">` +
    `<div style="display:flex; align-items:center; justify-content:space-between; padding: 12px; background:var(--surface); border-radius:14px; border:1px solid transparent; transition:border 0.2s;">` +
    `<div style="display:flex; align-items:center; gap:10px;">` +
    `<div style="width:28px; height:28px; border-radius:8px; background:rgba(16,185,129,0.15); color:#10b981; display:flex; align-items:center; justify-content:center;">` +
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>` +
    `</div>` +
    `<span style="color:var(--text); font-size:13px; font-weight:600;">${label("mobile.privacyShield")}</span>` +
    `</div>` +
    `<div style="background:#10b981; color:#000; font-size:11px; font-weight:800; padding:4px 10px; border-radius:999px; display:flex; align-items:center; gap:4px;">` +
    `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> ${label("mobile.active")}` +
    `</div>` +
    `</div>` +
    `<div style="display:flex; align-items:center; justify-content:space-between; padding: 12px; background:var(--surface); border-radius:14px; border:1px solid transparent; transition:border 0.2s;">` +
    `<div style="display:flex; align-items:center; gap:10px;">` +
    `<div style="width:28px; height:28px; border-radius:8px; background:color-mix(in srgb, var(--primary) 15%, transparent); color:var(--primary); display:flex; align-items:center; justify-content:center;">` +
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>` +
    `</div>` +
    `<span style="color:var(--text); font-size:13px; font-weight:600;">${label("mobile.voiceWake")}</span>` +
    `</div>` +
    `<div style="background:var(--primary); color:#fff; font-size:11px; font-weight:800; padding:4px 10px; border-radius:999px; display:flex; align-items:center; gap:4px;">` +
    `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> ${label("mobile.on")}` +
    `</div>` +
    `</div>` +
    `<div style="display:flex; align-items:center; justify-content:space-between; padding: 12px; background:var(--surface); border-radius:14px; border:1px solid transparent; transition:border 0.2s;">` +
    `<div style="display:flex; align-items:center; gap:10px;">` +
    `<div style="width:28px; height:28px; border-radius:8px; background:rgba(255,255,255,0.05); color:var(--muted); display:flex; align-items:center; justify-content:center;">` +
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>` +
    `</div>` +
    `<span style="color:var(--text); font-size:13px; font-weight:600;">${label("mobile.autoBackup")}</span>` +
    `</div>` +
    `<div style="color:var(--muted); font-size:12px; font-weight:600; padding:4px 4px; display:flex; align-items:center; gap:4px;">` +
    `${label("mobile.backupTime")}` +
    `</div>` +
    `</div>` +
    `</div>` +
    `</div>`;

  const moreSection =
    `<section id="more">` +
    `<h2>${label("mobile.more")}</h2>` +
    `${authed ? "" : systemStatusBanner}` +
    `<ul class="morelist">${moreRows}</ul>` +
    `${authed ? "" : quickSettingsCard}` +
    `</section>`;

  const nameForInitial = options.displayName || screens.personalization.userAddress || "N";
  const initial = escapeHtml(nameForInitial.trim().charAt(0).toUpperCase() || "N");

  const locale = options.locale ?? CURRENT_LOCALE;

  // Authenticated app bar carries a language dropdown + logout; the standalone demo
  // keeps a decorative avatar only. Both reuse the shared avatar (letter fallback).
  const langLabels: Record<string, string> = {
    en: "EN", tr: "TR", es: "ES", fr: "FR", de: "DE", it: "IT", pt: "PT", nl: "NL", pl: "PL", cs: "CS",
    ru: "RU", uk: "UK", ar: "AR", he: "HE", hi: "HI", ja: "JA", ko: "KO", "zh-Hans": "中简", "zh-Hant": "中繁", vi: "VI",
  };
  const langItems = SUPPORTED_LOCALES.map(
    (l) => `<a class="ld-item${l === locale ? " active" : ""}" href="?lang=${l}" data-lang="${l}">${langLabels[l] || l.toUpperCase()}</a>`
  ).join("");
  const appbarRight = authed
    ? `<div class="lang-picker">` +
      `<button class="lang-picker-btn" type="button" aria-expanded="false" aria-haspopup="listbox">` +
      `<span>${langLabels[locale] || locale.toUpperCase()}</span>` +
      `<svg class="ld-caret" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>` +
      `</button>` +
      `<div class="ld-menu" role="listbox">${langItems}</div>` +
      `</div>` +
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
${renderStatusBar(options.platform)}
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

// ─── FAZ 9: Native Bridge Layer Exports ──────────────────────────────────────
export { type MobileBridge, type MobilePlatform, type BatteryInfo, type NetworkStatus, type GeoPosition, type HapticStyle, type AppInfo, type SharePayload, CapacitorBridge, MockBridge } from "./bridge.js";
export { PushManager, DEFAULT_CHANNELS, type PushToken, type NotificationPayload, type NotificationChannel, type NotificationHandler } from "./notifications.js";
export { PermissionsManager, getDefaultPermissions, FEATURE_PERMISSION_MAP, type PermissionName, type PermissionStatus, type PermissionEntry, type FeaturePermissionMap } from "./permissions.js";
export { MobileVoiceBridge, DEFAULT_VOICE_CONFIG, type VoiceBridgeConfig, type VoiceSession, type VoiceSessionState, type AudioSessionCategory, type VoiceBridgeEvent } from "./voice-bridge.js";
export { RemoteConnection, DEFAULT_CONNECTION_OPTIONS, type ConnectionMode, type ConnectionState, type ServerEndpoint, type ConnectionOptions, type RemoteRequest, type RemoteResponse } from "./remote-access.js";
export { DeepLinkRouter, type DeepLinkResult, type DeepLinkAction, type DeepLinkHandler } from "./deep-links.js";
export { MobileService, type MobileServiceConfig, type AppLifecycleState, type ServiceEvent, type ServiceEventHandler } from "./mobile-service.js";
