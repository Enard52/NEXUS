/**
 * NEXUS AI — Mobile front end (FAZ 9/10)
 *
 * The mobile surface: a Tuya-style *smart-home companion app*. Four bottom
 * tabs — Home / Smart / Discover / Profile — with the NEXUS AI assistant one
 * tap away behind the gradient AI orb in the app bar. Home is a favourites
 * grid of glossy gradient tiles over device cards with toggles; Smart hosts
 * the AI command bar, routines and suggestions; Discover showcases NEXUS AI
 * features built from real skill/agent data; Profile carries the identity
 * card, menu rows and a Settings screen. System surfaces (family, billing,
 * platforms, agents, admin…) stay behind Profile and still render the shared
 * screen bodies via `renderScreenBody` (@nexus/web).
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
  ADD_DEVICE_BRANDS,
  SCAN_RESULTS,
  CURRENT_LOCALE,
  type DemoScreens,
} from "@nexus/web";

/** Inline EN/TR copy for mobile-only compositions (same idiom as render.ts). */
function tt(en: string, tr: string): string {
  return CURRENT_LOCALE === "tr" ? tr : en;
}

/** The four Tuya-style tabs on the bottom bar (assistant lives behind the AI orb). */
export type MobileTabId = "home" | "smart" | "discover" | "profile";

const PRIMARY_TABS: readonly { id: MobileTabId; icon: TabIcon }[] = [
  { id: "home", icon: "home" },
  { id: "smart", icon: "smart" },
  { id: "discover", icon: "discover" },
  { id: "profile", icon: "profile" },
];

/** Shared-screen ids that are recomposed into the mobile tabs (no own section). */
const RECOMPOSED_IDS: readonly ScreenId[] = ["today", "home-state", "suggestions", "skills", "devices"];
/** Web-only / admin surfaces the mobile app intentionally leaves out
 * (user feedback: no admin panel, download center or platform hub on phone). */
const MOBILE_HIDDEN_IDS: readonly ScreenId[] = ["platform", "admin-dashboard", "download-center"];
/** Screens opened from within another surface (billing hero / Home "+"), so
 * they render their own section but stay out of the Profile hub row list. */
const SUBSCREEN_IDS: readonly ScreenId[] = ["billing-manage", "add-device"];

type TabIcon =
  | "today"
  | "home"
  | "rooms"
  | "devices"
  | "automations"
  | "assistant"
  | "smart"
  | "discover"
  | "profile"
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
    rooms: `<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M2 21h20"/><path d="M13 11.5v1"/>`,
    devices: `<rect x="2" y="4" width="14" height="10" rx="1.5"/><rect x="16" y="9" width="6" height="11" rx="1.5"/>`,
    automations: `<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>`,
    assistant: `<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>`,
    smart: `<path d="M7.6 17.4V6.6l8.8 10.8V6.6"/>`,
    discover: `<circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-4 2 2-5Z"/>`,
    profile: `<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>`,
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
      `<span class="net-type" style="font-size: var(--text-xs);font-weight: var(--font-bold);margin-right:2px;letter-spacing:-0.5px;">5G</span>` +
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

/** Bottom tab bar: four Tuya-style tabs — Home / Smart / Discover / Profile. */
export function renderTabBar(activeId: MobileTabId): string {
  const titles: Record<MobileTabId, string> = {
    home: tt("Home", "Ev"),
    smart: tt("Smart", "Akıllı"),
    discover: tt("Discover", "Keşfet"),
    profile: tt("Profile", "Profil"),
  };
  const items = PRIMARY_TABS.map((t) => {
    const on = t.id === activeId;
    return (
      `<a class="${on ? "active" : ""}" href="#${t.id}" data-nav="${t.id}"` +
      `${on ? ' aria-current="page"' : ""}>${renderTabIcon(t.icon)}` +
      `<span>${escapeHtml(titles[t.id])}</span></a>`
    );
  }).join("");
  return `<nav class="tabbar" aria-label="Primary">${items}</nav>`;
}

/** Mobile chrome on top of the shared token-driven component styles. */
export function renderMobileStyles(t: DesignTokens): string {
  return `${renderStyles(t)}
@keyframes screen-slide-in {
  from { opacity: 0; transform: translateX(18px); }
  to   { opacity: 1; transform: none; }
}
@keyframes more-row-in {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: none; }
}
@keyframes status-pulse {
  0% { opacity: 0.6; box-shadow: 0 0 4px var(--color-success); }
  50% { opacity: 1; box-shadow: 0 0 12px var(--color-success); transform: scale(1.1); }
  100% { opacity: 0.6; box-shadow: 0 0 4px var(--color-success); }
}
@keyframes mic-pulse {
  0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--primary) 45%, transparent); }
  100% { box-shadow: 0 0 0 22px transparent; }
}
@keyframes chip-spin {
  to { transform: rotate(360deg); }
}
:root {
  --color-success: var(--color-success);
  --color-warning: var(--color-warning);
  --color-danger:  var(--color-danger);
  --color-accent-cyan: var(--color-accent-cyan);
  
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 14px;
  --text-md: 16px;
  --text-lg: 20px;
  --text-xl: 28px;

  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 24px;
  --radius-full: 999px;

  --shadow-sm: 0 4px 12px rgba(15,23,42,0.06);
  --shadow-md: 0 12px 28px rgba(15,23,42,0.10);
  --shadow-lg: 0 18px 40px rgba(15,23,42,0.14);

  --duration-fast: var(--duration-fast);
  --duration-normal: var(--duration-normal);
  
  --z-base: 1;
  --z-sticky: 10;
  --z-overlay: 100;
  --z-modal: 200;
  --z-toast: 300;
}
:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
body.mobile {
  background: var(--bg);
  padding: 0;
  display: flex;
  justify-content: stretch;
  align-items: stretch;
  min-height: 100vh;
  min-height: 100dvh;
}
.phone {
  width: 100%;
  max-width: 1440px;
  /* dvh keeps the tab bar above the browser chrome on real phones; the plain
   * vh line stays first as the fallback for engines without dynamic units. */
  height: 100vh;
  height: 100dvh;
  /* Flat, deep app background — the glossy gradient tiles carry the color. */
  background: var(--bg);
  border: 0;
  border-radius: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  animation: none;
  box-shadow: none;
  margin: 0 auto;
}
.statusbar {
  height: 52px; flex: none; display: flex; align-items: center; justify-content: space-between;
  padding: env(safe-area-inset-top, 0) ${t.space[6]}px 0; color: var(--text); font-size: var(--text-md); font-weight: var(--font-semibold);
  position: relative;
}
.statusbar-android {
  padding: 0 ${t.space[5]}px;
}
.dynamic-island {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  width: 120px; height: 34px; background: #000; border-radius: var(--radius-lg);
  box-shadow: 0 0 0 1.5px rgba(255,255,255,0.06);
  pointer-events: none;
}
.statusbar .punch-hole {
  position: absolute; top: 18px; left: 50%; transform: translateX(-50%);
  width: 14px; height: 14px; background: #000; border-radius: 50%;
  box-shadow: 0 0 0 1.5px rgba(255,255,255,0.06); pointer-events: none;
}
.dynamic-island,
.statusbar .punch-hole {
  display: none;
}
.statusbar .sys { display: flex; align-items: center; gap: ${t.space[2]}px; }
.appbar {
  flex: none; display: flex; align-items: center; gap: ${t.space[3]}px;
  padding: ${t.space[2]}px ${t.space[5]}px ${t.space[3]}px;
  background: color-mix(in srgb, var(--bg) 55%, transparent);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid color-mix(in srgb, var(--primary) 18%, var(--surface));
  position: relative;
}
.appbar .apptitle { font-family: 'Outfit', sans-serif; font-weight: var(--font-bold); font-size: var(--text-lg); letter-spacing: -0.02em; }
.appbar-right { margin-left: auto; display: flex; align-items: center; gap: ${t.space[3]}px; }
.appbar .avatar-wrap { display: flex; }
.ai-orb {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 50%; border: 0; cursor: pointer; color: #fff;
  background: linear-gradient(135deg, var(--primary), var(--color-accent-cyan));
  box-shadow: 0 6px 16px color-mix(in srgb, var(--primary) 45%, transparent);
  transition: transform var(--duration-fast) ease;
  position: relative;
}
/* Invisible hit-area extenders — keep the compact visuals but give every
 * small control the 44px minimum touch target. */
.ai-orb::before, .m-profile::before, .backrow::before, .tgl::before {
  content: ''; position: absolute; inset: -6px;
}
.m-profile::before { inset: -8px; }
.backrow::before { inset: -11px 0; }
.tgl::before { inset: -9px -4px; }
.ai-orb:hover { transform: scale(1.06); }
.ai-orb:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.m-profile { display: inline-flex; padding: 0; border: 0; background: transparent; cursor: pointer; border-radius: 50%; position: relative; }
.m-profile:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.m-lang { display: inline-flex; gap: 4px; font-size: var(--text-xs); }
.m-lang a { color: var(--muted); text-decoration: none; }
.m-lang a.active { color: var(--primary); font-weight: var(--font-bold); }
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
/* ── iOS-first control-app chrome ─────────────────────────────────────────── */
.ios-title {
  font-family: 'Outfit', sans-serif; font-size: var(--text-xl); font-weight: var(--font-bold);
  letter-spacing: -0.03em; margin: 0 0 ${t.space[4]}px; color: var(--text);
}
.ios-title small { display: block; font-size: var(--text-base); font-weight: var(--font-semibold); color: var(--muted); letter-spacing: 0; margin-top: 2px; }
.live-pills { display: flex; flex-wrap: wrap; gap: ${t.space[2]}px; margin-bottom: ${t.space[4]}px; }
.pill {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
  border-radius: var(--radius-full); background: var(--surface); border: 1px solid var(--border);
  font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text);
}
.pill .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--color-success); animation: status-pulse 2s infinite; }
.pill.warn .dot { background: var(--color-warning); box-shadow: 0 0 6px var(--color-warning); animation: none; }
/* ── Home hero — glassmorphism summary card under the greeting (2c) ── */
.hero-card {
  border-radius: var(--radius-lg); padding: ${t.space[4]}px ${t.space[5]}px; margin-bottom: ${t.space[4]}px;
  background: linear-gradient(150deg, color-mix(in srgb, var(--primary) 18%, var(--surface)), color-mix(in srgb, var(--surface) 88%, transparent) 70%);
  border: 1px solid color-mix(in srgb, var(--primary) 22%, var(--border));
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  box-shadow: var(--shadow-lg), inset 0 1px 0 rgba(255,255,255,0.14);
}
.hero-card { text-align: center; }
.hero-card .hero-line { font-size: var(--text-md); font-weight: var(--font-bold); letter-spacing: -0.01em; margin-bottom: ${t.space[3]}px; }
.hero-card .live-pills { margin-bottom: 0; justify-content: center; }
.fcard {
  border-radius: var(--radius-lg); padding: ${t.space[5]}px; margin-bottom: ${t.space[4]}px;
  background: linear-gradient(145deg, color-mix(in srgb, var(--primary) 20%, var(--surface)), var(--surface) 65%);
  border: 1px solid color-mix(in srgb, var(--primary) 26%, var(--border));
  box-shadow: var(--shadow-lg), 0 2px 6px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.10);
}
.fcard-head { display: flex; align-items: baseline; justify-content: space-between; gap: ${t.space[3]}px; margin-bottom: ${t.space[3]}px; }
.fcard-head h3 { margin: 0; font-size: var(--text-lg); font-weight: var(--font-bold); letter-spacing: -0.02em; }
.fcard-head .sub { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--muted); white-space: nowrap; }
/* ── Favourites grid (Ev) — glossy gradient icon tiles, Tuya-style ── */
.fav-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: ${t.space[4]}px; margin-bottom: ${t.space[5]}px; }
.fav-tile {
  background: var(--surface); border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  border-radius: var(--radius-lg); padding: ${t.space[5]}px; text-decoration: none; color: var(--text);
  display: flex; flex-direction: column; gap: ${t.space[4]}px; min-height: 150px;
  position: relative; overflow: hidden;
}
a.fav-tile { cursor: pointer; transition: transform var(--duration-fast) ease; }
a.fav-tile:hover { transform: translateY(-2px); }
.fav-tile:active, .device-card:active, .menu-row:active, .scene-card:active { transform: scale(0.97); transition: transform 0.1s ease; }
.fav-ico {
  width: 52px; height: 52px; border-radius: 50%; flex: none;
  display: flex; align-items: center; justify-content: center;
}
.fav-info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.fav-title { font-size: var(--text-md); font-weight: var(--font-bold); color: var(--text); }
.fav-sub { font-size: var(--text-base); color: var(--muted); font-weight: var(--font-semibold); margin-top: 2px; }
.fav-val { font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text); margin-top: 2px; }
/* Vivid gradient swatches for icon tiles (shared by fav/menu/device icons);
 * --ico-c is the vivid accent colour each swatch feeds to boxless icons. */
.bg-blue { --ico-c: #3b9eff; background: linear-gradient(135deg, #4facfe, #00f2fe); }
.bg-purple { --ico-c: #a855f7; background: linear-gradient(135deg, #a18cd1, #fbc2eb); }
.bg-green { --ico-c: var(--color-success); background: linear-gradient(135deg, #43e97b, #38f9d7); }
.bg-cyan { --ico-c: #06b6d4; background: linear-gradient(135deg, #667eea, #764ba2); }
.bg-orange { --ico-c: #f97316; background: linear-gradient(135deg, #ff8177, #ff867a); }
.bg-yellow { --ico-c: #f5a524; background: linear-gradient(135deg, #f6d365, #fda085); }
.bg-brand { --ico-c: var(--primary); background: linear-gradient(135deg, var(--primary), var(--color-accent-cyan)); }
/* Boxless vivid icons — fav/menu icons drop the glossy gradient box: the icon
 * keeps its own vivid colour over a soft tint circle. The bg-* class stays in
 * the markup (test contract) and only feeds the accent via --ico-c. */
.fav-ico[class], .menu-ico[class] {
  color: var(--ico-c, var(--primary));
  background: color-mix(in srgb, var(--ico-c, var(--primary)) 12%, transparent);
  box-shadow: none;
}
.scene-strip { display: flex; gap: ${t.space[2]}px; overflow-x: auto; padding-bottom: 4px; margin-bottom: ${t.space[4]}px; scrollbar-width: none; }
.scene-strip::-webkit-scrollbar { display: none; }
.scene-chip {
  flex: none; display: inline-flex; align-items: center; gap: 7px; padding: 9px 14px;
  border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface);
  color: var(--text); font-size: var(--text-sm); font-weight: var(--font-bold); cursor: pointer;
  transition: border-color var(--duration-fast) ease, color var(--duration-fast) ease;
}
.scene-chip svg { color: var(--primary); }
.scene-chip:hover { border-color: var(--primary); }
.scene-chip.done { border-color: var(--color-success); color: var(--color-success); }
/* Scene run feedback lives on the icon — the label never flickers away. */
.scene-chip .sc-ico { display: inline-flex; color: var(--primary); }
.scene-chip.running .sc-ico svg { animation: chip-spin 0.8s linear infinite; }
.scene-chip.done .sc-ico { color: var(--color-success); }
/* ── Scene cards (2a) — themed gradient tiles; scene-chip/sc-ico/data-run hooks kept ── */
.scene-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: ${t.space[3]}px; margin-bottom: ${t.space[5]}px; }
.scene-chip.scene-card {
  position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: flex-start;
  gap: 4px; min-height: 118px; padding: ${t.space[4]}px; border: 0; border-radius: var(--radius-lg);
  background: var(--sc-grad, linear-gradient(135deg, var(--primary), var(--color-accent-cyan))); color: #fff; text-align: left;
  box-shadow: 0 14px 30px color-mix(in srgb, var(--sc-glow, var(--primary)) 32%, transparent), inset 0 1px 0 rgba(255,255,255,0.22);
  transition: transform var(--duration-fast) ease, box-shadow var(--duration-normal) ease;
}
.scene-chip.scene-card:hover { transform: translateY(-2px); }
/* Inner icons must stay white — .scene-chip svg would tint them primary,
 * which disappears over the saturated gradients. */
.scene-chip.scene-card svg { color: #fff; }
/* Run feedback — soft ripple/glow washes over the card while it executes. */
.scene-card::before {
  content: ''; position: absolute; inset: 0; opacity: 0; transition: opacity 0.3s ease;
  background: radial-gradient(circle at 78% 82%, rgba(255,255,255,0.35), transparent 55%);
}
.scene-card.running::before, .scene-card.done::before { opacity: 1; }
.scene-card .sc-ico {
  width: 32px; height: 32px; border-radius: 11px; margin-bottom: 4px;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.2); color: #fff;
}
.scene-chip.scene-card.done { color: #fff; box-shadow: inset 0 0 0 2px rgba(255,255,255,0.45), 0 14px 34px color-mix(in srgb, var(--sc-glow, var(--primary)) 45%, transparent); }
.scene-chip.scene-card.done .sc-ico { color: #fff; }
.scene-card .sc-name { font-size: var(--text-base); font-weight: var(--font-bold); letter-spacing: -0.01em; }
.scene-card .sc-meta { font-size: var(--text-sm); font-weight: var(--font-semibold); color: rgba(255,255,255,0.82); }
.scene-card .sc-go {
  position: absolute; right: 12px; bottom: 12px; width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: #fff;
  background: rgba(255,255,255,0.22); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
}
/* ── Device cards (Ev) — image-style gradient tile + name/room + toggle ── */
.device-card {
  background: var(--surface); border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  border-radius: var(--radius-lg); padding: ${t.space[4]}px;
  display: flex; align-items: center; gap: ${t.space[4]}px; margin-bottom: ${t.space[3]}px;
  box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.07);
}
.dev-img {
  width: 64px; height: 64px; border-radius: var(--radius-md); flex: none;
  display: flex; align-items: center; justify-content: center; color: #fff;
  box-shadow: var(--shadow-md); position: relative; overflow: hidden;
}
.dev-img::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 50%; background: linear-gradient(to bottom, rgba(255,255,255,0.22), transparent); }
/* Real product photo — covers the whole tile. */
.dev-img .dev-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; padding: 2px; background: #fff; }
.dev-open { flex: 1; min-width: 0; display: flex; align-items: center; gap: ${t.space[4]}px; text-decoration: none; color: inherit; cursor: pointer; }
.dev-info { flex: 1; min-width: 0; }
.dev-name { font-size: var(--text-base); font-weight: var(--font-bold); color: var(--text); line-height: 1.35;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.dev-room { font-size: var(--text-sm); color: var(--muted); margin-top: 2px; font-weight: var(--font-semibold); }
/* ── iOS-style toggle ── */
.tgl {
  flex: none; width: 46px; height: 27px; border-radius: var(--radius-full); border: 1px solid var(--border);
  background: color-mix(in srgb, var(--muted) 22%, var(--surface)); position: relative; cursor: pointer; padding: 0;
  transition: background var(--duration-fast) ease, border-color var(--duration-fast) ease;
}
.tgl::after {
  content: ''; position: absolute; top: 2px; left: 2px; width: 21px; height: 21px; border-radius: 50%;
  background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.35); transition: transform var(--duration-fast) ease;
}
.tgl[aria-pressed="true"] { background: var(--primary); border-color: var(--primary); }
.tgl[aria-pressed="true"]::after { transform: translateX(19px); }
/* ── Device-specific detail controls (3) — sliders, dial, segments, lock ── */
.detail-controls {
  background: var(--surface); border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  border-radius: var(--radius-lg); padding: ${t.space[4]}px; margin-bottom: ${t.space[4]}px;
  box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.07);
}
.ctl-row { padding: ${t.space[3]}px 0; border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent); }
.ctl-row:first-child { padding-top: 0; }
.ctl-row:last-child { border-bottom: none; padding-bottom: 0; }
.ctl-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.ctl-val { font-size: var(--text-base); font-weight: var(--font-bold); color: var(--primary); }
.ctl-inline { display: flex; justify-content: space-between; align-items: center; }
.ctl-slider {
  -webkit-appearance: none; appearance: none; width: 100%; height: 10px; border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--primary) 18%, var(--surface)); outline: none; cursor: pointer;
}
.ctl-slider::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none; width: 24px; height: 24px; border-radius: 50%;
  background: #fff; border: 3px solid var(--primary);
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--primary) 22%, transparent); cursor: pointer;
}
.ctl-slider::-moz-range-thumb {
  width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 3px solid var(--primary);
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--primary) 22%, transparent); cursor: pointer;
}
.ctl-slider.temp-bar { background: linear-gradient(90deg, #fbbf24, #e2e8f0, #60a5fa); }
.ctl-slider.color-bar { background: linear-gradient(90deg, var(--color-danger), var(--color-warning), #22c55e, #06b6d4, #6366f1, #d946ef, var(--color-danger)); }
.seg { display: flex; gap: 6px; flex-wrap: wrap; }
.seg-btn {
  border: 1px solid var(--border); background: transparent; color: var(--muted); border-radius: var(--radius-full);
  padding: 7px 13px; font-size: var(--text-sm); font-weight: var(--font-bold); cursor: pointer;
  transition: color var(--duration-fast) ease, background var(--duration-fast) ease, border-color var(--duration-fast) ease;
}
.seg-btn.active {
  background: color-mix(in srgb, var(--primary) 16%, var(--surface)); color: var(--primary);
  border-color: color-mix(in srgb, var(--primary) 45%, var(--border));
}
.stepper { display: flex; align-items: center; gap: 16px; }
.dial-btn {
  width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--border);
  background: var(--surface); color: var(--text); font-size: var(--text-lg); font-weight: var(--font-bold); cursor: pointer;
}
.dial-btn:hover { border-color: var(--primary); color: var(--primary); }
.step-val { font-size: var(--text-md); font-weight: var(--font-bold); min-width: 44px; text-align: center; }
.dial-row { display: flex; flex-direction: column; align-items: center; gap: ${t.space[3]}px; }
.dial-wrap { position: relative; width: 132px; height: 132px; }
.dial-track, .dial-arc { fill: none; stroke-width: 10; stroke-linecap: round; stroke-dasharray: 245 327; }
.dial-track { stroke: color-mix(in srgb, var(--border) 80%, transparent); }
.dial-arc { stroke: var(--primary); transition: stroke-dashoffset var(--duration-normal) ease; }
.dial-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.dial-center .step-val { font-size: var(--text-lg); }
.dial-center span { font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--muted); }
.dial-ctrls { display: flex; gap: 28px; align-items: center; }
.lock-big {
  width: 100%; display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 18px;
  border-radius: var(--radius-lg); cursor: pointer; font-family: inherit;
  border: 1px solid rgba(var(--color-success-rgb),0.4); background: rgba(var(--color-success-rgb),0.10); color: var(--color-success);
  transition: background var(--duration-fast) ease, border-color var(--duration-fast) ease, color var(--duration-fast) ease;
}
.lock-big.unlocked { border-color: rgba(var(--color-danger-rgb),0.4); background: rgba(var(--color-danger-rgb),0.10); color: var(--color-danger); }
.lock-big b { font-size: var(--text-md); font-weight: var(--font-bold); }
.lock-big span { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--muted); }
.lock-log { margin-top: 10px; display: grid; gap: 6px; font-size: var(--text-sm); color: var(--muted); font-weight: var(--font-semibold); }
.play-btn {
  border: 0; border-radius: var(--radius-full); padding: 10px 22px; cursor: pointer;
  background: color-mix(in srgb, var(--primary) 16%, var(--surface)); color: var(--primary);
  font-size: var(--text-base); font-weight: var(--font-bold);
}
/* ── Device detail screen — hero tile, energy analysis, spec rows ── */
.detail-hero { display: flex; flex-direction: column; align-items: center; text-align: center; gap: ${t.space[3]}px; padding: ${t.space[2]}px 0 ${t.space[5]}px; }
.detail-hero .dev-img { width: 96px; height: 96px; border-radius: var(--radius-lg); }
.detail-hero .dev-img svg { width: 44px; height: 44px; }
.detail-name { font-size: var(--text-lg); font-weight: var(--font-bold); letter-spacing: -0.01em; }
.detail-sub { font-size: var(--text-base); font-weight: var(--font-semibold); color: var(--muted); margin-top: 2px; }
.chart-card {
  background: var(--surface); border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  border-radius: var(--radius-lg); padding: ${t.space[4]}px; margin-bottom: ${t.space[4]}px;
}
.bars { display: flex; align-items: flex-end; gap: ${t.space[2]}px; }
.bar-col { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; gap: 6px; }
.bar-col i { display: block; border-radius: 8px 8px 3px 3px; background: linear-gradient(180deg, var(--primary), var(--color-accent-cyan)); }
.bar-col b { font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--muted); text-align: center; }
.anomaly-badge {
  display: flex; align-items: center; gap: 8px; margin-bottom: ${t.space[4]}px; padding: 10px 14px;
  border-radius: var(--radius-md); background: rgba(var(--color-warning-rgb),0.12); border: 1px solid rgba(var(--color-warning-rgb),0.35);
  color: var(--color-warning); font-size: var(--text-sm); font-weight: var(--font-bold);
}
/* ── AI command bar (Akıllı) — rainbow gradient border, white inner pill ── */
.ai-bar {
  border-radius: var(--radius-lg); padding: 2px; margin-bottom: ${t.space[4]}px;
  background: linear-gradient(120deg, var(--primary), var(--color-accent-cyan), var(--color-warning), #ec4899, var(--primary));
  box-shadow: 0 10px 26px color-mix(in srgb, var(--primary) 22%, transparent);
}
.ai-bar-inner {
  width: 100%; display: flex; align-items: center; gap: ${t.space[3]}px; text-align: left;
  border: 0; border-radius: 22px; padding: 12px ${t.space[4]}px; cursor: pointer;
  background: var(--surface); color: var(--text);
}
.ai-bar .ab-spark { font-size: var(--text-md); line-height: 1; }
.ai-bar .ai-bar-text { flex: 1; min-width: 0; font-size: var(--text-base); font-weight: var(--font-semibold); color: var(--muted); }
.ai-bar .ab-mic {
  flex: none; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--primary), var(--color-accent-cyan)); color: #fff;
}
/* ── Menu lists — grouped rows with glossy gradient icons (Tuya-style) ── */
.menu-list {
  background: var(--surface); border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  border-radius: var(--radius-lg); overflow: hidden; margin-bottom: ${t.space[4]}px;
  box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.07);
}
.menu-row {
  width: 100%; display: flex; align-items: center; gap: ${t.space[4]}px; padding: ${t.space[4]}px;
  border: 0; border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  background: transparent; color: var(--text); text-align: left; text-decoration: none;
  cursor: pointer; transition: background var(--duration-fast) ease; font-family: inherit;
}
.menu-row:last-child { border-bottom: none; }
.menu-row:hover { background: color-mix(in srgb, var(--surface-2, var(--surface)) 70%, var(--primary) 4%); }
.menu-ico {
  width: 44px; height: 44px; border-radius: 50%; flex: none;
  display: flex; align-items: center; justify-content: center;
}
.menu-text { flex: 1; min-width: 0; font-size: var(--text-md); font-weight: var(--font-semibold); color: var(--text); }
.menu-sub { display: block; font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--muted); margin-top: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.menu-arrow { color: var(--muted); flex: none; }
.btn-run {
  flex: none; border: 0; border-radius: var(--radius-full); padding: 7px 14px; cursor: pointer;
  background: color-mix(in srgb, var(--primary) 18%, var(--surface)); color: var(--primary);
  font-size: var(--text-sm); font-weight: var(--font-bold); transition: background var(--duration-fast) ease;
}
.btn-run:hover { background: color-mix(in srgb, var(--primary) 30%, var(--surface)); }
.btn-run.done { background: rgba(var(--color-success-rgb),0.15); color: var(--color-success); }
.btn-run .run-fb { display: inline-flex; vertical-align: -1px; margin-right: 5px; }
.btn-run.running .run-fb svg { animation: chip-spin 0.8s linear infinite; }
/* ── Routine flow cards (2b) — trigger → action mini-flow with toggle + run ── */
.routine-card {
  display: flex; align-items: flex-start; gap: ${t.space[3]}px;
  background: var(--surface); border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  border-radius: var(--radius-lg); padding: ${t.space[4]}px; margin-bottom: ${t.space[3]}px;
  box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.07);
}
.rc-ico {
  width: 44px; height: 44px; border-radius: var(--radius-md); flex: none;
  display: flex; align-items: center; justify-content: center; color: #fff;
  box-shadow: 0 6px 14px rgba(0,0,0,0.18);
}
.rc-main { flex: 1; min-width: 0; }
.rc-name { font-size: var(--text-base); font-weight: var(--font-bold); letter-spacing: -0.01em; }
.rc-flow { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.rc-trigger {
  display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--primary) 14%, transparent); color: var(--primary);
  font-size: var(--text-xs); font-weight: var(--font-bold); white-space: nowrap;
}
.rc-arrow { color: var(--muted); font-size: var(--text-sm); font-weight: var(--font-bold); }
.rc-actions { font-size: var(--text-sm); font-weight: var(--font-bold); color: var(--text); display: inline-flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.rc-trigger svg, .rc-actions svg { flex: none; }
.rc-meta { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--muted); margin-top: 6px; }
.rc-side { display: flex; flex-direction: column; align-items: flex-end; gap: ${t.space[2]}px; flex: none; }
.suggestion-item {
  border-radius: var(--radius-lg); padding: ${t.space[4]}px; margin-bottom: ${t.space[2]}px;
  background: linear-gradient(140deg, color-mix(in srgb, var(--primary) 12%, var(--surface)), var(--surface) 70%);
  border: 1px solid color-mix(in srgb, var(--primary) 22%, var(--border));
  box-shadow: var(--shadow-sm);
}
.suggestion-item .si-text { font-size: var(--text-base); font-weight: var(--font-semibold); line-height: 1.45; }
.suggestion-item .si-meta { font-size: var(--text-xs); color: var(--muted); margin: 4px 0 ${t.space[3]}px; }
.suggestion-item .si-actions { display: flex; gap: ${t.space[2]}px; }
.btn-ghost {
  border: 1px solid var(--border); border-radius: var(--radius-full); padding: 7px 14px; cursor: pointer;
  background: transparent; color: var(--muted); font-size: var(--text-sm); font-weight: var(--font-bold);
}
.mic-hero-wrap { display: flex; flex-direction: column; align-items: center; gap: ${t.space[3]}px; padding: ${t.space[5]}px 0 ${t.space[6]}px; }
.mic-hero {
  width: 88px; height: 88px; border-radius: 50%; border: 0; cursor: pointer;
  background: radial-gradient(circle at 30% 25%, color-mix(in srgb, var(--primary) 85%, #fff), var(--primary));
  color: #fff; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 14px 34px color-mix(in srgb, var(--primary) 40%, transparent);
}
.mic-hero.listening { animation: mic-pulse 1.4s ease-out infinite; }
.mic-hint { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--muted); }
.ag-badge {
  display: inline-flex; align-items: center; gap: 5px; flex: none;
  padding: 3px 9px; border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: var(--font-bold); letter-spacing: 0.2px;
}
.ag-badge::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.ag-badge.active { color: var(--color-success); background: rgba(var(--color-success-rgb),0.14); }
.ag-badge.learning { color: var(--color-warning); background: rgba(var(--color-warning-rgb),0.16); }
.ag-badge.sleeping { color: var(--muted); background: color-mix(in srgb, var(--muted) 16%, transparent); }
.agent-card .menu-sub { display: flex; align-items: center; gap: 7px; white-space: normal; margin-top: 4px; }
.section-label {
  font-size: var(--text-base); font-weight: var(--font-bold); color: var(--text); text-transform: none; letter-spacing: 0;
  margin: ${t.space[5]}px 0 ${t.space[3]}px;
  display: flex; justify-content: space-between; align-items: center;
}
.section-label span { color: var(--muted); font-weight: var(--font-medium); font-size: var(--text-sm); }
.backrow {
  display: inline-flex; align-items: center; gap: 4px; margin-bottom: ${t.space[3]}px;
  color: var(--primary); font-size: var(--text-base); font-weight: var(--font-bold); text-decoration: none; cursor: pointer;
  position: relative;
}
/* ── Profile identity card + settings rows (Tuya-style) ── */
.profile-id {
  display: flex; align-items: center; gap: ${t.space[4]}px; border-radius: var(--radius-lg);
  padding: ${t.space[5]}px; margin-bottom: ${t.space[5]}px;
  background: linear-gradient(145deg, color-mix(in srgb, var(--primary) 14%, var(--surface)), var(--surface) 70%);
  border: 1px solid color-mix(in srgb, var(--primary) 20%, var(--border));
}
.profile-id .avatar, .profile-id .avatar-img { width: 64px !important; height: 64px !important; font-size: 24px !important; }
.profile-id .pi-name { font-size: var(--text-lg); font-weight: var(--font-bold); letter-spacing: -0.01em; }
.profile-id .pi-plan { font-size: var(--text-base); font-weight: var(--font-semibold); color: var(--muted); margin-top: 2px; }
.field-row {
  width: 100%; display: flex; justify-content: space-between; align-items: center; gap: ${t.space[3]}px;
  padding: ${t.space[4]}px; border: 0; text-align: left; text-decoration: none; font-family: inherit;
  border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  background: transparent; cursor: pointer; transition: background var(--duration-fast) ease;
}
.field-row:last-child { border-bottom: none; }
.field-row:hover { background: color-mix(in srgb, var(--surface) 80%, var(--primary)); }
.field-label { color: var(--text); font-size: var(--text-md); font-weight: var(--font-medium); }
.field-val { font-weight: var(--font-semibold); color: var(--muted); font-size: var(--text-base); display: flex; align-items: center; gap: ${t.space[2]}px; }
.logout-btn {
  width: 100%; padding: ${t.space[4]}px; margin-top: ${t.space[5]}px;
  background: rgba(var(--color-danger-rgb), 0.1); border: 1px solid rgba(var(--color-danger-rgb), 0.3); border-radius: ${t.radius.md}px;
  color: var(--color-danger); font-size: var(--text-md); font-weight: var(--font-bold); cursor: pointer;
}
.logout-btn:hover { background: rgba(var(--color-danger-rgb), 0.18); }
/* ── Smart App empty state (reference design) ── */
.empty-app {
  background: var(--surface); border: 1px dashed color-mix(in srgb, var(--border) 80%, var(--primary));
  border-radius: var(--radius-lg); padding: 30px 20px 26px; margin-bottom: ${t.space[5]}px;
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: ${t.space[2]}px;
}
.ea-ico {
  width: 84px; height: 84px; border-radius: var(--radius-lg); margin-bottom: ${t.space[2]}px;
  display: flex; align-items: center; justify-content: center; color: #fff;
  box-shadow: 0 14px 30px rgba(0,0,0,0.3); position: relative; overflow: hidden;
}
.ea-ico::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 50%; background: linear-gradient(to bottom, rgba(255,255,255,0.25), transparent); }
.ea-title { font-size: var(--text-md); font-weight: var(--font-bold); }
.ea-desc { font-size: var(--text-base); font-weight: var(--font-semibold); color: var(--muted); line-height: 1.55; max-width: 280px; }
.btn-create {
  margin-top: ${t.space[2]}px; border: 0; border-radius: var(--radius-full); padding: 11px 26px; cursor: pointer;
  background: linear-gradient(135deg, var(--primary), var(--color-accent-cyan)); color: #fff; font-size: var(--text-base); font-weight: var(--font-bold);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--primary) 40%, transparent);
}
/* ── Billing — gradient plan hero + feature rows (mobile-native) ── */
.plan-hero {
  position: relative; overflow: hidden; border-radius: var(--radius-lg); padding: ${t.space[5]}px;
  margin-bottom: ${t.space[4]}px; background: linear-gradient(135deg, var(--primary), var(--color-accent-cyan)); color: #fff;
  box-shadow: 0 14px 34px color-mix(in srgb, var(--primary) 35%, transparent);
}
.plan-hero::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 55%; background: linear-gradient(to bottom, rgba(255,255,255,0.22), transparent); }
.ph-badge { position: absolute; top: 16px; right: 16px; z-index: 1; background: rgba(255,255,255,0.22); border-radius: var(--radius-full); padding: 5px 12px; font-size: var(--text-xs); font-weight: var(--font-bold); }
.ph-kicker { position: relative; z-index: 1; font-size: var(--text-xs); font-weight: var(--font-bold); letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.85; }
.ph-plan { position: relative; z-index: 1; font-family: 'Outfit', sans-serif; font-size: var(--text-xl); font-weight: var(--font-bold); letter-spacing: -0.02em; margin-top: 4px; }
.ph-sub { position: relative; z-index: 1; font-size: var(--text-sm); font-weight: var(--font-semibold); opacity: 0.92; margin-top: 4px; }
.billing-actions { display: flex; gap: ${t.space[3]}px; margin-bottom: ${t.space[4]}px; }
.billing-actions .btn-create { flex: 1; margin-top: 0; }
.billing-actions .btn-ghost { flex: 1; text-align: center; padding: 11px; font-size: var(--text-base); }
/* ── Subscription management (billing-manage) — mobile-native (4a) ── */
.plan-cmp { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 16px; }
.plan-cmp-card {
  border-radius: var(--radius-lg); padding: 12px 10px; background: var(--surface);
  border: 1px solid var(--border); display: flex; flex-direction: column; gap: 6px;
}
.plan-cmp-card.current {
  border-color: var(--primary);
  background: linear-gradient(160deg, color-mix(in srgb, var(--primary) 16%, var(--surface)), var(--surface));
  box-shadow: 0 10px 24px color-mix(in srgb, var(--primary) 22%, transparent);
}
.pc-badge {
  font-size: var(--text-xs); font-weight: var(--font-bold); letter-spacing: 0.05em; text-transform: uppercase;
  color: #fff; background: var(--primary); border-radius: var(--radius-full); padding: 2px 7px; align-self: flex-start;
}
.pc-name { font-size: var(--text-base); font-weight: var(--font-bold); }
.pc-price { font-size: var(--text-md); font-weight: var(--font-bold); }
.pc-price small { font-size: var(--text-xs); color: var(--muted); font-weight: var(--font-semibold); }
.pc-feat { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; font-size: var(--text-xs); font-weight: var(--font-semibold); }
.pc-feat li { display: flex; align-items: center; gap: 5px; }
.pc-feat li.off { color: var(--muted); opacity: 0.6; }
.pm-card, .renew-card {
  display: flex; align-items: center; gap: 12px; background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 14px 16px; margin-bottom: 10px;
  box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.07);
}
.pm-brand {
  width: 46px; height: 30px; border-radius: 7px; flex: none;
  display: inline-flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #1a1f71, #3949ab); color: #fff;
  font-size: var(--text-xs); font-weight: var(--font-bold); letter-spacing: 0.06em; text-transform: uppercase;
}
.pm-main { flex: 1; min-width: 0; }
.pm-title { font-size: var(--text-base); font-weight: var(--font-bold); }
.pm-sub { font-size: var(--text-sm); color: var(--muted); font-weight: var(--font-semibold); }
.btn-cancel { color: var(--color-danger); border-color: color-mix(in srgb, var(--color-danger) 40%, var(--border)); }
.inv-amount { font-size: var(--text-base); font-weight: var(--font-bold); flex: none; }
.inv-status { font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--color-success); }
.inv-pdf {
  border: 1px solid var(--border); background: transparent; color: var(--primary);
  font-weight: var(--font-bold); font-size: var(--text-sm); border-radius: 10px; padding: 6px 10px; cursor: pointer; flex: none;
}
/* ── Device pairing (add-device) — brand grid, manual pairing + LAN scan (4b) ── */
.section-label .sl-add {
  width: 26px; height: 26px; border-radius: 50%; border: 0; cursor: pointer;
  background: color-mix(in srgb, var(--primary) 16%, transparent); color: var(--primary);
  font-size: var(--text-md); font-weight: var(--font-bold); line-height: 1;
  display: inline-flex; align-items: center; justify-content: center; margin-left: 8px; margin-right: auto; vertical-align: middle;
}
.brand-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 6px; }
.brand-card {
  display: flex; align-items: center; gap: 10px; text-align: left; cursor: pointer;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 12px;
  color: var(--text); font: inherit;
}
.bc-logo {
  width: 40px; height: 40px; border-radius: var(--radius-md); flex: none;
  display: inline-flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}
.bc-main { flex: 1; min-width: 0; }
.bc-name { display: block; font-size: var(--text-sm); font-weight: var(--font-bold); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bc-proto { display: block; font-size: var(--text-xs); color: var(--muted); font-weight: var(--font-semibold); }
.bc-badge { font-size: var(--text-xs); font-weight: var(--font-bold); padding: 2px 7px; border-radius: var(--radius-full); flex: none; }
.bc-badge.installed { background: color-mix(in srgb, var(--color-success) 18%, transparent); color: var(--color-success); }
.bc-badge.premium { background: color-mix(in srgb, var(--color-warning) 18%, transparent); color: var(--color-warning); }
.bc-badge.add { background: color-mix(in srgb, var(--primary) 14%, transparent); color: var(--primary); }
.pair-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; }
.pair-row .btn-ghost { flex: 1; min-width: 96px; text-align: center; }
.scan-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 14px 16px;
  box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.07);
}
.scan-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.scan-results { display: grid; gap: 8px; margin-top: 12px; }
.scan-results[hidden] { display: none; }
.scan-row {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent); border-radius: var(--radius-md);
}
.scan-row .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-success); flex: none; animation: status-pulse 2s infinite; }
.tip-card {
  display: flex; align-items: flex-start; gap: 9px;
  margin-top: 14px; padding: 13px 15px; border-radius: var(--radius-lg); font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--muted);
  background: color-mix(in srgb, var(--primary) 8%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--primary) 25%, var(--border));
}
.tabbar {
  flex: none; display: flex; border-top: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  background: color-mix(in srgb, var(--surface) 82%, transparent); backdrop-filter: blur(20px) saturate(180%);
  padding-bottom: calc(env(safe-area-inset-bottom, 20px) + ${t.space[3]}px); margin: 0; position: relative;
}
.tabbar a {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: ${t.space[2]}px ${t.space[1]}px; color: var(--muted);
  text-decoration: none; font-size: var(--text-xs); background: transparent; border: 0; border-radius: 0;
  position: relative; transition: color 0.22s ease;
}
.tabbar a svg { transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1); }
.tabbar a.active { background: transparent; box-shadow: none; color: var(--primary); }
.tabbar a.active svg { transform: scale(1.18) translateY(-1px); }
.tab-indicator {
  position: absolute; top: 0; height: 2.5px; border-radius: 0 0 3px 3px;
  background: var(--primary); pointer-events: none;
  transition: left var(--duration-normal) cubic-bezier(0.22,1,0.36,1), width var(--duration-normal) cubic-bezier(0.22,1,0.36,1);
  box-shadow: 0 0 8px color-mix(in srgb,var(--primary) 50%,transparent);
}
.morelist { list-style: none; margin: 0; padding: 0; display: grid; gap: ${t.space[2]}px; }
.morerow {
  display: flex; align-items: center; gap: ${t.space[3]}px;
  background: var(--surface); border-radius: var(--radius-lg); padding: ${t.space[4]}px;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  box-shadow: var(--shadow-sm);
  color: var(--text); text-decoration: none; transition: background var(--duration-fast) ease, transform var(--duration-fast) ease;
}
.morerow:hover { background: color-mix(in srgb, var(--surface) 80%, var(--primary)); transform: translateY(-1px); }
.morerow svg { color: var(--primary); transition: transform var(--duration-fast) ease; }
.morerow:hover > svg:last-child { transform: translateX(3px); }
.morelist li { opacity: 0; animation: more-row-in var(--duration-normal) cubic-bezier(0.22,1,0.36,1) forwards; }
.morelist li:nth-child(1) { animation-delay: 0.04s; }
.morelist li:nth-child(2) { animation-delay: 0.08s; }
.morelist li:nth-child(3) { animation-delay: 0.12s; }
.morelist li:nth-child(4) { animation-delay: 0.16s; }
.morelist li:nth-child(5) { animation-delay: 0.20s; }
.morelist li:nth-child(6) { animation-delay: 0.24s; }
.morelist li:nth-child(7) { animation-delay: var(--duration-normal); }
.morelist li:nth-child(8) { animation-delay: 0.32s; }
html.js-tabs .screen > section[hidden] { display: none; }
@media (prefers-reduced-motion: reduce) {
  .phone { animation: none; }
    .tabbar a svg, .tabbar a, .m-logout, .morerow, .morerow svg, .ai-orb, a.fav-tile, .menu-row, .tgl, .tgl::after { transition: none; }
  .screen section.screen-enter { animation: none; }
  .morelist li { animation: none; opacity: 1; }
  .tab-indicator { transition: none; }
  .pill .dot, .mic-hero.listening { animation: none; }
  .scene-chip.running .sc-ico svg { animation: none; }
  .btn-run.running .run-fb svg { animation: none; }
}
@media (max-width: 480px) {
  .phone {
    width: 100%; max-width: 100%; height: 100vh; height: 100dvh;
    border: 0; border-radius: 0; box-shadow: none; animation: none;
  }
  /* On a real phone-width viewport the decorative hardware chrome supports the
     product illusion; on wide desktop previews it would float mid-screen. */
  .statusbar-ios .dynamic-island, .statusbar-android .punch-hole { display: block; }
  .screen .cards { grid-template-columns: 1fr; }
  .screen .bento-tile, .screen .plan-card, .screen .skill-card-rich, .screen .suggestion-card { padding: 14px; }
  .screen .badge { white-space: normal; word-break: break-word; }
  .screen * { word-wrap: break-word; overflow-wrap: break-word; }
}`;
}

/** Progressive-enhancement tab switching + local demo interactions. */
const MOBILE_NAV_SCRIPT = `
document.documentElement.classList.add("js-tabs");
var sections = Array.prototype.slice.call(document.querySelectorAll(".screen > section"));
var links = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
var screenEl = document.querySelector(".screen");
var tabIndicator = null;
// Legacy screen ids (deep links, old bookmarks) map onto the four-tab IA.
var alias = { "today": "home", "home-state": "home", "rooms": "home", "devices": "home", "suggestions": "smart", "skills": "smart", "automations": "smart", "more": "profile" };
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
    tabIndicator.style.opacity = "1";
  } else {
    tabIndicator.style.opacity = "0";
  }
}
function show(id) {
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
    var on = target === id;
    if (a.parentNode && a.parentNode.className && String(a.parentNode.className).indexOf("tabbar") >= 0) {
      a.classList.toggle("active", on);
      if (on) { a.setAttribute("aria-current", "page"); } else { a.removeAttribute("aria-current"); }
    }
  });
  if (screenEl) screenEl.scrollTop = 0;
  positionTabIndicator();
}
function fromHash() {
  var id = location.hash.replace("#", "");
  if (alias[id]) id = alias[id];
  show(sections.some(function (s) { return s.id === id; }) ? id : sections[0].id);
}
links.forEach(function (a) {
  a.addEventListener("click", function (e) {
    e.preventDefault();
    var id = a.getAttribute("data-nav");
    if (alias[id]) id = alias[id];
    if (history.replaceState) { history.replaceState(null, "", "#" + id); } else { location.hash = id; }
    show(id);
  });
});
window.addEventListener("hashchange", fromHash);
fromHash();
// ── Local control interactions (demo-local state; no fake dead surfaces) ──
document.addEventListener("click", function (e) {
  var el = e.target.closest ? e.target.closest("[data-toggle],[data-run],[data-accept],[data-dismiss],[data-mic],[data-set],[data-step],[data-lockbig],[data-play],[data-scan],[data-cancel]") : null;
  if (!el) return;
  if (el.hasAttribute("data-toggle")) {
    var pressed = el.getAttribute("aria-pressed") === "true";
    var next = !pressed;
    el.setAttribute("aria-pressed", next ? "true" : "false");
    var ann = document.getElementById("a11y-live");
    if (ann) ann.textContent = next ? "Açık" : "Kapalı";
    document.dispatchEvent(new CustomEvent("nexus:toggle", { detail: { state: next } }));
    if (window.Capacitor?.Plugins?.Haptics) window.Capacitor.Plugins.Haptics.impact({ style: "Light" });
    else if (navigator.vibrate) navigator.vibrate(10);
    var card = el.closest(".device-card");
    if (card) {
      var st = card.querySelector(".dev-state");
      if (st) st.textContent = next ? st.getAttribute("data-on") : st.getAttribute("data-off");
    }
    // Agent cards swap their status badge + description between awake and sleeping.
    var agc = el.closest(".agent-card");
    if (agc) {
      var bd = agc.querySelector(".ag-badge");
      if (bd) {
        bd.textContent = next ? bd.getAttribute("data-on-label") : bd.getAttribute("data-off-label");
        bd.className = "ag-badge " + (next ? bd.getAttribute("data-on-class") : "sleeping");
      }
      var dsc = agc.querySelector(".ag-desc");
      if (dsc) dsc.textContent = next ? dsc.getAttribute("data-on-desc") : dsc.getAttribute("data-off-desc");
    }
    return;
  }
  if (el.hasAttribute("data-run")) {
    if (el.classList.contains("done") || el.classList.contains("running")) return;
    var spin = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9"/></svg>';
    var check = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
    // Scene chips animate their icon (spinner → check) so the label never changes.
    var ico = el.querySelector(".sc-ico");
    if (ico) {
      var icoOrig = ico.innerHTML;
      el.classList.add("running");
    var ann = document.getElementById("a11y-live");
    if (ann) ann.textContent = "Çalıştırılıyor...";
    document.dispatchEvent(new CustomEvent("nexus:action", { detail: { type: "run" } }));
    if (window.Capacitor?.Plugins?.Haptics) window.Capacitor.Plugins.Haptics.impact({ style: "Medium" });
      ico.innerHTML = spin;
      setTimeout(function () {
        el.classList.remove("running");
        el.classList.add("done");
    if (window.Capacitor?.Plugins?.Haptics) window.Capacitor.Plugins.Haptics.notification({ type: "Success" });
        ico.innerHTML = check;
        setTimeout(function () { el.classList.remove("done"); ico.innerHTML = icoOrig; }, 2200);
      }, 900);
      return;
    }
    // Pill buttons keep their label too — a small leading icon spins, then checks.
    var origHtml = el.innerHTML;
    el.classList.add("running");
    var ann = document.getElementById("a11y-live");
    if (ann) ann.textContent = "Çalıştırılıyor...";
    document.dispatchEvent(new CustomEvent("nexus:action", { detail: { type: "run" } }));
    el.innerHTML = '<span class="run-fb" aria-hidden="true">' + spin + "</span>" + origHtml;
    setTimeout(function () {
      el.classList.remove("running");
      el.classList.add("done");
      var fb = el.querySelector(".run-fb");
      if (fb) fb.innerHTML = check;
      setTimeout(function () { el.classList.remove("done"); el.innerHTML = origHtml; }, 2200);
    }, 900);
    return;
  }
  if (el.hasAttribute("data-accept") || el.hasAttribute("data-dismiss")) {
    var item = el.closest(".suggestion-item");
    if (!item) return;
    if (el.hasAttribute("data-accept")) {
       var ann = document.getElementById("a11y-live");
       if (ann) ann.textContent = "Öneri kabul edildi";
       document.dispatchEvent(new CustomEvent("nexus:accept", { detail: { success: true } }));
      var doneEl = document.createElement("div");
      doneEl.className = "si-text";
      doneEl.style.color = "var(--color-success)";
      doneEl.textContent = el.getAttribute("data-done") || "✓";
      item.textContent = "";
      item.appendChild(doneEl);
      setTimeout(function () { item.style.display = "none"; showEmptyIfNone(); }, 1400);
    } else {
      item.style.display = "none";
      showEmptyIfNone();
    }
    return;
  }
  if (el.hasAttribute("data-set")) {
    var segWrap = el.closest(".seg");
    if (segWrap) Array.prototype.forEach.call(segWrap.querySelectorAll(".seg-btn"), function (b) { b.classList.remove("active"); });
    el.classList.add("active");
    return;
  }
  if (el.hasAttribute("data-step")) {
    var wrap = el.closest("[data-stepper]");
    if (!wrap) return;
    var v = parseInt(wrap.getAttribute("data-value"), 10) + parseInt(el.getAttribute("data-step"), 10);
    var mn = parseInt(wrap.getAttribute("data-min"), 10);
    var mx = parseInt(wrap.getAttribute("data-max"), 10);
    if (v < mn) v = mn;
    if (v > mx) v = mx;
    wrap.setAttribute("data-value", String(v));
    var sv = wrap.querySelector(".step-val");
    if (sv) sv.textContent = v + (wrap.getAttribute("data-unit") || "");
    var arc = wrap.querySelector(".dial-arc");
    if (arc) arc.style.strokeDashoffset = String(Math.round(245 * (1 - (v - mn) / (mx - mn))));
    return;
  }
  if (el.hasAttribute("data-lockbig")) {
    var unlocked = el.classList.toggle("unlocked");
    var lb = el.querySelector("b");
    if (lb) lb.textContent = unlocked ? el.getAttribute("data-unlocked") : el.getAttribute("data-locked");
    return;
  }
  if (el.hasAttribute("data-play")) {
    var paused = el.classList.toggle("paused");
    el.textContent = paused ? el.getAttribute("data-play-label") : el.getAttribute("data-pause-label");
    return;
  }
  if (el.hasAttribute("data-scan")) {
    if (el.classList.contains("running")) return;
    var scanSpin = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9"/></svg>';
    var scanOrig = el.innerHTML;
    el.classList.add("running");
    var ann = document.getElementById("a11y-live");
    if (ann) ann.textContent = "Çalıştırılıyor...";
    document.dispatchEvent(new CustomEvent("nexus:action", { detail: { type: "run" } }));
    el.innerHTML = '<span class="run-fb" aria-hidden="true">' + scanSpin + "</span>" + (el.getAttribute("data-scanning") || scanOrig);
    setTimeout(function () {
      el.classList.remove("running");
      el.innerHTML = el.getAttribute("data-rescan") || scanOrig;
      var res = document.querySelector("[data-scan-results]");
       if (res) res.hidden = false;
       var ann = document.getElementById("a11y-live");
       if (ann) ann.textContent = "Tarama tamamlandı";
       document.dispatchEvent(new CustomEvent("nexus:scan", { detail: { success: true } }));
    }, 1400);
    return;
  }
  if (el.hasAttribute("data-cancel")) {
    if (!window.confirm(el.getAttribute("data-confirm") || "?")) return;
    var rc = el.closest(".renew-card");
    if (rc) {
      var sub = rc.querySelector(".pm-sub");
      if (sub) sub.textContent = el.getAttribute("data-done") || sub.textContent;
    }
    el.disabled = true;
    el.style.opacity = "0.5";
    return;
  }
  if (el.hasAttribute("data-mic")) {
    var listening = el.classList.toggle("listening");
    var hint = document.querySelector(".mic-hint");
    if (hint) hint.textContent = listening ? hint.getAttribute("data-listening") : hint.getAttribute("data-idle");
  }
});
// Range sliders (detail controls) update their value bubble as they move.
document.addEventListener("input", function (e) {
  var s = e.target;
  if (!s || !s.hasAttribute || !s.hasAttribute("data-slider")) return;
  var row = s.closest ? s.closest(".ctl-row") : null;
  var val = row ? row.querySelector(".ctl-val") : null;
  if (val) val.textContent = s.value + (s.getAttribute("data-unit") || "");
});
function showEmptyIfNone() {
  var wrap = document.querySelector("[data-suggestion-list]");
  if (!wrap) return;
  var visible = Array.prototype.slice.call(wrap.querySelectorAll(".suggestion-item")).filter(function (n) { return n.style.display !== "none"; });
  var empty = wrap.querySelector("[data-suggestions-empty]");
  if (empty) empty.hidden = visible.length > 0;
}
`.trim();

// ─── Control-first section compositions (shared data, mobile-native layout) ──

/** Play triangle used on scene/routine chips. */
const PLAY_ICON =
  `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;

const MIC_ICON =
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>`;

const CHEVRON_ICON =
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--muted);flex:none;" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>`;

const MENU_ARROW =
  `<svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>`;

/** Per-device gradient swatch + line-art icon — no external product photos
 * (Unsplash hotlinks are blocked; the glossy tile keeps the Tuya look). */
const DEVICE_TILE_STYLE: Record<string, { grad: string; icon: string }> = {
  lamp: { grad: "bg-yellow", icon: `<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V18h6v-1.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z"/>` },
  tv: { grad: "bg-blue", icon: `<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>` },
  ac: { grad: "bg-cyan", icon: `<path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19"/>` },
  lock: { grad: "bg-orange", icon: `<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4M12 15v2"/>` },
  speaker: { grad: "bg-purple", icon: `<rect x="6" y="2" width="12" height="20" rx="2"/><circle cx="12" cy="15" r="3.4"/><circle cx="12" cy="7" r="1.4"/>` },
  camera: { grad: "bg-green", icon: `<path d="M15 8.5 21 6v12l-6-2.5"/><rect x="2" y="6" width="13" height="12" rx="2"/>` },
  thermostat: { grad: "bg-orange", icon: `<path d="M14 4a2 2 0 1 0-4 0v9.5a4 4 0 1 0 4 0Z"/><path d="M12 9v6"/>` },
  curtain: { grad: "bg-purple", icon: `<path d="M4 3h16v18"/><path d="M4 3v18M8 3v18M12 3v18M16 3v18M20 3v18" opacity="0.75"/>` },
};
const DEVICE_GRAD_CYCLE = ["bg-blue", "bg-purple", "bg-green", "bg-cyan", "bg-orange", "bg-yellow"];

function renderDeviceTile(
  d: { readonly id: string; readonly manufacturer?: string; readonly imageUrl?: string },
  index: number,
): string {
  const t = DEVICE_TILE_STYLE[d.id];
  const grad = t?.grad ?? DEVICE_GRAD_CYCLE[index % DEVICE_GRAD_CYCLE.length];
  const icon = t?.icon ?? `<rect x="2" y="4" width="14" height="10" rx="1.5"/><rect x="16" y="9" width="6" height="11" rx="1.5"/>`;
  const photo = d.imageUrl
    ? `<img class="dev-photo" src="${escapeHtml(d.imageUrl)}" alt="" loading="lazy"/>`
    : "";
  return (
    `<span class="dev-img ${grad}" aria-hidden="true">` +
    `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>${photo}</span>`
  );
}

/** NEXUS brand monogram — the "N" stroke from the product icon; used wherever
 * our own AI/smart features need a mark (never a generic star/sparkle). */


/** Skill/agent feature icons — glossy gradient tiles keyed by the data icon name. */
const FEATURE_ICON_STYLE: Record<string, { grad: string; icon: string }> = {
  shield: { grad: "bg-blue", icon: `<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5Z"/>` },
  leaf: { grad: "bg-green", icon: `<path d="M6 21c0-9 4-15 14-16-1 10-7 14-14 16Z"/><path d="M6 21c2-6 6-10 10-12"/>` },
  film: { grad: "bg-purple", icon: `<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v16M17 4v16M2 9h5M2 15h5M17 9h5M17 15h5"/>` },
  zap: { grad: "bg-yellow", icon: `<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>` },
  thermometer: { grad: "bg-orange", icon: `<path d="M14 4a2 2 0 1 0-4 0v9.5a4 4 0 1 0 4 0Z"/><path d="M12 9v6"/>` },
  clipboard: { grad: "bg-cyan", icon: `<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 2h6v4H9z"/><path d="M9 12h6M9 16h4"/>` },
  users: { grad: "bg-green", icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>` },
  sparkles: { grad: "bg-brand", icon: renderLogo(16) },
  infinity: { grad: "bg-cyan", icon: `<path d="M12 12c-2-2.7-3.6-4-5.5-4a4 4 0 1 0 0 8c1.9 0 3.5-1.3 5.5-4Zm0 0c2 2.7 3.6 4 5.5 4a4 4 0 1 0 0-8c-1.9 0-3.5 1.3-5.5 4Z"/>` },
  headset: { grad: "bg-orange", icon: `<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z"/>` },
};

function renderFeatureIco(name: string, index: number, cls: "fav-ico" | "menu-ico" = "menu-ico"): string {
  const f = FEATURE_ICON_STYLE[name];
  const grad = f?.grad ?? DEVICE_GRAD_CYCLE[index % DEVICE_GRAD_CYCLE.length];
  const icon = f?.icon ?? renderLogo(16);
  const size = cls === "fav-ico" ? 26 : 22;
  return (
    `<span class="${cls} ${grad}" aria-hidden="true">` +
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></span>`
  );
}

/** Themed gradient palettes + icons for the home scene cards (2a), keyed by
 * the demo skill id. Unknown scenes fall back to the "Uyku" night palette. */
const SCENE_STYLE: Record<string, { grad: readonly [string, string]; icon: string; devices: number; actions: number }> = {
  k2: { grad: ["#ff9a56", "#ff6a88"], icon: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`, devices: 4, actions: 3 },
  k3: { grad: ["var(--color-danger)", "#fb923c"], icon: `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>`, devices: 5, actions: 2 },
  k5: { grad: ["#1e3a8a", "#7c3aed"], icon: `<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>`, devices: 3, actions: 2 },
  k1: { grad: ["#4c1d95", "#0f172a"], icon: `<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v16M17 4v16M2 9h5M2 15h5M17 9h5M17 15h5"/>`, devices: 3, actions: 3 },
  k4: { grad: ["#0ea5e9", "var(--color-accent-cyan)"], icon: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>`, devices: 2, actions: 2 },
};
const SCENE_FALLBACK_GRAD: readonly [string, string] = ["#312e81", "#1e1b4b"];

/** Trigger → action mini-flows for the routine cards (2b); [en, tr] pairs.
 * Icons are inline SVG names (RF_ICON) — never unicode emoji. */
const RF_ICON: Record<string, string> = {
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  exit: `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>`,
  moon: `<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>`,
  film: `<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v16M17 4v16M2 9h5M2 15h5M17 9h5M17 15h5"/>`,
  bot: renderLogo(16),
  bulb: `<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V18h6v-1.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z"/>`,
  therm: `<path d="M14 4a2 2 0 1 0-4 0v9.5a4 4 0 1 0 4 0Z"/>`,
  lock: `<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>`,
  cam: `<path d="M15 8.5 21 5v14l-6-3.5"/><rect x="2" y="6" width="13" height="12" rx="2"/>`,
  tv: `<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8"/>`,
  curtain: `<path d="M4 3h16v18H4z"/><path d="M12 3v18"/>`,
  mute: `<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>`,
};
const rfIco = (n: string): string =>
  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${RF_ICON[n] ?? ""}</svg>`;
type RfStep = { readonly icon: string; readonly text: readonly [string, string] };
const ROUTINE_FLOW: Record<string, { type: readonly [string, string]; trigger: RfStep; actions: readonly RfStep[] }> = {
  k2: { type: ["Scheduled", "Zamanlanmış"], trigger: { icon: "clock", text: ["07:00", "07:00"] }, actions: [{ icon: "bulb", text: ["100%", "%100"] }, { icon: "therm", text: ["22°C", "22°C"] }] },
  k3: { type: ["Manual", "Manuel"], trigger: { icon: "exit", text: ["On exit", "Çıkışta"] }, actions: [{ icon: "lock", text: ["Lock", "Kilitle"] }, { icon: "bulb", text: ["Off", "Kapat"] }] },
  k5: { type: ["Sensor", "Sensör"], trigger: { icon: "moon", text: ["23:00", "23:00"] }, actions: [{ icon: "cam", text: ["Record", "Kayıt"] }, { icon: "lock", text: ["Lock", "Kilit"] }] },
  k1: { type: ["Manual", "Manuel"], trigger: { icon: "film", text: ["Movie", "Film"] }, actions: [{ icon: "tv", text: ["On", "Aç"] }, { icon: "bulb", text: ["20%", "%20"] }, { icon: "curtain", text: ["Curtain", "Perde"] }] },
  k4: { type: ["AI", "AI"], trigger: { icon: "bot", text: ["Focus", "Odak"] }, actions: [{ icon: "bulb", text: ["70%", "%70"] }, { icon: "mute", text: ["Silent", "Sessiz"] }] },
};

/** Home ("Ev") — greeting, glossy favourites grid, device cards, AI quick menu. */
function renderHomeSection(screens: DemoScreens): string {
  const devices = screens.devices.rows;
  const online = devices.filter((d) => d.online).length;
  const scenes = screens.skills.rows.slice(0, 4);
  const onLabel = tt("On", "Açık");
  const offLabel = tt("Off", "Kapalı");
  // Today view-model exposes ready-formatted cards keyed by i18n label.
  const todayCard = (k: string): string => screens.today.cards.find((c) => c.labelKey === k)?.value ?? "—";

  const head =
    `<h2 class="ios-title">${tt("Hello", "Merhaba")}, ${escapeHtml(screens.personalization.userAddress)}` +
    `<small>${tt("Your home, fully in your control", "Evin kontrolü tamamen sende")} · ${escapeHtml(label(screens.billing.planLabelKey))}</small></h2>`;

  // Glass hero — one-line home summary with live status pills (2c).
  const hero =
    `<div class="hero-card">` +
    `<div class="hero-line">${tt("Your home is ready", "Evin hazır")}</div>` +
    `<div class="live-pills">` +
    `<span class="pill"><span class="dot"></span>${online}/${devices.length} ${tt("online", "çevrimiçi")}</span>` +
    `<span class="pill"><span class="dot"></span>${escapeHtml(todayCard("today.energy"))} ${tt("today", "bugün")}</span>` +
    `<span class="pill"><span class="dot"></span>${screens.skills.rows.length} ${tt("routines", "rutin")}</span>` +
    `</div></div>`;

  // Favourites: glossy gradient tiles over real view-model numbers only.
  const favTile = (grad: string, icon: string, title: string, value: string, sub: boolean): string =>
    `<div class="fav-tile">` +
    `<span class="fav-ico ${grad}" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></span>` +
    `<div><div class="fav-title">${title}</div>` +
    (sub ? `<div class="fav-sub">${value}</div>` : `<div class="fav-val">${value}</div>`) +
    `</div></div>`;
  const favourites =
    `<div class="fav-grid">` +
    favTile("bg-green", `<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>`, escapeHtml(label("today.energy")), escapeHtml(todayCard("today.energy")), false) +
    favTile("bg-blue", `<path d="M5 12a10 10 0 0 1 14 0M8 15a6 6 0 0 1 8 0M12 19h.01"/>`, escapeHtml(label("today.devicesOnline")), `${online}/${devices.length}`, false) +
    favTile("bg-purple", `<path d="M17 2v6h-6M7 22v-6h6"/><path d="M3.5 13a8.5 8.5 0 0 0 14 4.5M20.5 11a8.5 8.5 0 0 0-14-4.5"/>`, escapeHtml(label("today.activeRoutines")), escapeHtml(todayCard("today.activeRoutines")), false) +
    `<a class="fav-tile" href="#smart" data-nav="smart">` +
    `<span class="fav-ico bg-orange" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V18h6v-1.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z"/></svg></span>` +
    `<div><div class="fav-title">${escapeHtml(label("today.suggestions"))}</div>` +
    `<div class="fav-val">${escapeHtml(todayCard("today.suggestions"))}</div></div></a>` +
    `</div>`;

  const sceneStrip =
    scenes.length > 0
      ? `<div class="section-label">${tt("Scenes", "Sahneler")}<span>${screens.skills.rows.length} ${tt("routines", "rutin")}</span></div>` +
        `<div class="scene-grid">` +
        scenes
          .map((s) => {
            const st = SCENE_STYLE[s.id];
            const [g1, g2] = st?.grad ?? SCENE_FALLBACK_GRAD;
            const icon = st?.icon ?? `<path d="M8 5v14l11-7z"/>`;
            return (
              `<button class="scene-chip scene-card" type="button" data-run style="--sc-grad:linear-gradient(135deg,${g1},${g2});--sc-glow:${g2}">` +
              `<span class="sc-ico" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></span>` +
              `<span class="sc-name">${escapeHtml(s.nameKey)}</span>` +
              `<span class="sc-meta">${st?.devices ?? 3} ${tt("devices", "cihaz")} · ${st?.actions ?? 2} ${tt("actions", "eylem")}</span>` +
              `<span class="sc-go" aria-hidden="true">${PLAY_ICON}</span>` +
              `</button>`
            );
          })
          .join("") +
        `</div>`
      : "";

  // Device cards — brand tile + name + live state; the card opens the device
  // detail screen (specs + energy analysis), the toggle switches it locally.
  const deviceCards =
    `<div class="section-label">${tt("My devices", "Cihazlarım")}<button class="sl-add" type="button" data-nav="add-device" aria-label="${tt("Add device", "Cihaz ekle")}">+</button><span>${online}/${devices.length} ${tt("online", "çevrimiçi")}</span></div>` +
    devices
      .map(
        (d, i) =>
          `<div class="device-card">` +
          `<a class="dev-open" href="#device-${d.id}" data-nav="device-${d.id}">` +
          renderDeviceTile(d, i) +
          `<div class="dev-info"><div class="dev-name">${escapeHtml(d.nameKey)}</div>` +
          `<div class="dev-room">${escapeHtml(d.room ?? "")} · <span class="dev-state" data-on="${onLabel}" data-off="${offLabel}">${d.online ? onLabel : offLabel}</span></div></div>` +
          `</a>` +
          `<button class="tgl" type="button" data-toggle aria-pressed="${d.online ? "true" : "false"}" aria-label="${escapeHtml(d.nameKey)}"></button>` +
          `</div>`,
      )
      .join("");

  // Quick menu — real AI destinations only (assistant + discover).
  const quickMenu =
    `<div class="section-label">${tt("Quick menu", "Hızlı Menü")}<span>${tt("AI tools", "AI Araçları")}</span></div>` +
    `<div class="menu-list">` +
    `<button class="menu-row" type="button" data-nav="assistant">` +
    `<span class="menu-ico bg-brand" aria-hidden="true">${MIC_ICON}</span>` +
    `<span class="menu-text">${escapeHtml(screens.personalization.assistantName)}` +
    `<span class="menu-sub">${tt("Voice assistant — ask anything", "Sesli asistan — her şeyi sor")}</span></span>` +
    MENU_ARROW +
    `</button>` +
    `<button class="menu-row" type="button" data-nav="discover">` +
    `<span class="menu-ico bg-cyan" aria-hidden="true">${renderTabIcon("discover")}</span>` +
    `<span class="menu-text">${tt("Discover", "Keşfet")}` +
    `<span class="menu-sub">${tt("AI skills and agents", "AI yetenekleri ve ajanlar")}</span></span>` +
    MENU_ARROW +
    `</button>` +
    `</div>`;

  return head + hero + favourites + sceneStrip + deviceCards + quickMenu;
}

/** Smart ("Akıllı") — AI command bar over routines, suggestions & discoverables. */
function renderSmartSection(screens: DemoScreens): string {
  const runLabel = tt("Run", "Çalıştır");
  const suggestions = screens.suggestions.rows;

  // Rainbow-bordered AI command bar — the whole pill opens the assistant.
  const aiBar =
    `<div class="ai-bar"><button class="ai-bar-inner" type="button" data-nav="assistant">` +
    `<span class="ab-spark" aria-hidden="true">${renderLogo(18)}</span>` +
    `<span class="ai-bar-text">${tt("Describe an automation to NEXUS AI…", "NEXUS AI'ya bir otomasyon tarif et…")}</span>` +
    `<span class="ab-mic">${MIC_ICON}</span>` +
    `</button></div>`;

  // Automations — flow cards: trigger badge → action summary + toggle/run (2b).
  const routines =
    `<div class="section-label">${tt("Automations", "Otomasyonlar")}<span>${screens.skills.rows.length} ${tt("routines", "rutin")}</span></div>` +
    screens.skills.rows
      .map((s, i) => {
        const f = ROUTINE_FLOW[s.id];
        const typeBadge = f ? tt(f.type[0], f.type[1]) : tt("Manual", "Manuel");
        const trigger = f
          ? `${rfIco(f.trigger.icon)} ${tt(f.trigger.text[0], f.trigger.text[1])}`
          : rfIco("clock");
        const actions = f
          ? f.actions.map((a) => `${rfIco(a.icon)} ${tt(a.text[0], a.text[1])}`).join(" · ")
          : tt("Run actions", "Eylemleri çalıştır");
        return (
          `<div class="routine-card">` +
          `<span class="rc-ico ${DEVICE_GRAD_CYCLE[i % DEVICE_GRAD_CYCLE.length]}" aria-hidden="true">${renderTabIcon("automations")}</span>` +
          `<div class="rc-main"><div class="rc-name">${escapeHtml(s.nameKey)}</div>` +
          `<div class="rc-flow"><span class="rc-trigger">${typeBadge} · ${trigger}</span><span class="rc-arrow">→</span><span class="rc-actions">${actions}</span></div>` +
          `<div class="rc-meta">${tt("Every day", "Her gün")} · ${tt(`ran ${s.usageCount} times this week`, `bu hafta ${s.usageCount} kez çalıştı`)}</div></div>` +
          `<div class="rc-side">` +
          `<button class="tgl" type="button" data-toggle aria-pressed="true" aria-label="${escapeHtml(s.nameKey)}"></button>` +
          `</div></div>`
        );
      })
      .join("");

  // Suggestions — demo-local accept/dismiss with a real empty state.
  const suggest =
    `<div class="section-label">${escapeHtml(label("screen.suggestions"))}<span>${suggestions.length} ${tt("new", "yeni")}</span></div>` +
    `<div data-suggestion-list>` +
    suggestions
      .map(
        (s) =>
          `<div class="suggestion-item">` +
          `<div class="si-text">${escapeHtml(s.textKey)}</div>` +
          `<div class="si-meta">${tt("Proposed for", "Önerilen saat")} ${escapeHtml(s.at)}</div>` +
          `<div class="si-actions">` +
          `<button class="btn-run" type="button" data-accept data-done="${tt("Added to routines ✓", "Rutinlere eklendi ✓")}">${tt("Accept", "Kabul et")}</button>` +
          `<button class="btn-ghost" type="button" data-dismiss>${tt("Dismiss", "Yoksay")}</button>` +
          `</div></div>`,
      )
      .join("") +
    `<p class="muted" data-suggestions-empty${suggestions.length > 0 ? " hidden" : ""}>${escapeHtml(label("status.caughtUp"))}</p>` +
    `</div>`;

  // Recommended — discoverable skills as add-new rows (reference "Önerilen").
  const recommended =
    `<div class="section-label">${tt("Recommended", "Önerilen")}<span>${tt("Add new", "Yeni ekle")}</span></div>` +
    `<div class="menu-list">` +
    screens.skills.discoverable
      .map(
        (s, i) =>
          `<div class="menu-row">` +
          renderFeatureIco(s.icon, i) +
          `<span class="menu-text">${escapeHtml(s.nameKey)}` +
          `<span class="menu-sub">${escapeHtml(s.descriptionKey)}</span></span>` +
          `<button class="btn-run" type="button" data-run>${tt("Add", "Ekle")}</button>` +
          `</div>`,
      )
      .join("") +
    `</div>`;

  // Smart App — reference empty-state card: no custom scenario app is
  // assigned yet; "Create" hands the user to the assistant to describe one.
  const smartApp =
    `<div class="section-label">Smart App<span>${tt("Your custom smart scenarios", "Özel akıllı senaryolarınız")}</span></div>` +
    `<div class="empty-app">` +
    `<span class="ea-ico bg-purple" aria-hidden="true">` +
    `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><rect x="8.5" y="8.5" width="7" height="7" rx="2"/></svg></span>` +
    `<div class="ea-title">${tt("No app available", "Kullanılabilir uygulama yok")}</div>` +
    `<div class="ea-desc">${tt(
      "No smart app is assigned to this section yet. Create your own custom automation scenarios.",
      "Şu an bu bölüme atanmış akıllı uygulama yok. Kendi özel otomasyon senaryolarınızı oluşturun.",
    )}</div>` +
    `<button class="btn-create" type="button" data-nav="assistant">${tt("Create", "Oluştur")}</button>` +
    `</div>`;

  return (
    `<h2 class="ios-title">${tt("Smart", "Akıllı")}` +
    `<small>${screens.skills.rows.length} ${tt("routines", "rutin")} · ${suggestions.length} ${tt("suggestions", "öneri")}</small></h2>` +
    aiBar +
    routines +
    suggest +
    smartApp +
    recommended
  );
}

/** Discover ("Keşfet") — glossy NEXUS AI feature tiles over real skill/agent data. */
function renderDiscoverSection(screens: DemoScreens): string {
  const statusLabels: Record<string, string> = {
    active: tt("Active", "Aktif"),
    learning: tt("Learning", "Öğreniyor"),
    sleeping: tt("Sleeping", "Uykuda"),
  };

  // Hero tile: the assistant itself, plus every discoverable skill as a
  // glossy gradient tile with a working demo-local "Add" action.
  // Using .fav-info to stretch the text area and push content naturally without gaps.
  const assistantTile =
    `<a class="fav-tile" href="#assistant" data-nav="assistant">` +
    `<span class="fav-ico bg-brand" aria-hidden="true">${MIC_ICON}</span>` +
    `<div class="fav-info"><div class="fav-title">${escapeHtml(screens.personalization.assistantName)}</div>` +
    `<div class="fav-sub">${tt("Voice assistant — ask anything", "Sesli asistan — her şeyi sor")}</div></div></a>`;
  const skillTiles = screens.skills.discoverable
    .map(
      (s, i) =>
        `<div class="fav-tile">` +
        renderFeatureIco(s.icon, i, "fav-ico") +
        `<div class="fav-info"><div class="fav-title">${escapeHtml(s.nameKey)}</div>` +
        `<div class="fav-sub">${escapeHtml(s.descriptionKey)}</div></div>` +
        `<button class="btn-run" type="button" data-run>${tt("Add", "Ekle")}</button>` +
        `</div>`,
    )
    .join("");

  // Agents — unified toggle-based agent rows.
  const agentRows =
    `<div class="section-label">${tt("AI agents", "AI ajanları")}` +
    `<span>${screens.agents.rows.filter((a) => a.status === "active").length} ${tt("active", "aktif")}</span></div>` +
    `<div class="menu-list">` +
    screens.agents.rows
      .map((a, i) => {
        const onStatus = a.status === "sleeping" ? "active" : a.status;
        const awake = a.status !== "sleeping";
        return (
          `<div class="menu-row agent-card">` +
          renderFeatureIco(a.icon, i) +
          `<span class="menu-text">${escapeHtml(a.nameKey)}` +
          `<span class="menu-sub">` +
          `<span class="ag-badge ${a.status}" data-on-label="${statusLabels[onStatus]}" data-off-label="${statusLabels.sleeping}" data-on-class="${onStatus}">${statusLabels[a.status] ?? a.status}</span>` +
          `</span></span>` +
          `<button class="tgl" type="button" data-toggle aria-pressed="${awake ? "true" : "false"}" aria-label="${escapeHtml(a.nameKey)}"></button>` +
          `</div>`
        );
      })
      .join("") +
    `</div>`;

  // "More" rows were dropped with the Download Center — it is web-only now.
  return (
    `<h2 class="ios-title">${tt("Discover", "Keşfet")}` +
    `<small>${tt("NEXUS AI features", "NEXUS AI özellikleri")}</small></h2>` +
    `<div class="section-label">${tt("AI skills", "AI yetenekleri")}` +
    `<span>${screens.skills.discoverable.length + 1} ${tt("features", "özellik")}</span></div>` +
    `<div class="fav-grid">` +
    assistantTile +
    skillTiles +
    `</div>` +
    agentRows
  );
}

/** Assistant — voice hero, quick commands, live agent status. */
function renderAssistantSection(screens: DemoScreens): string {
  const statusLabels: Record<string, string> = {
    active: tt("Active", "Aktif"),
    learning: tt("Learning", "Öğreniyor"),
    sleeping: tt("Sleeping", "Uykuda"),
  };
  const micHero =
    `<div class="mic-hero-wrap">` +
    `<button class="mic-hero" type="button" data-mic aria-label="${tt("Talk to the assistant", "Asistanla konuş")}">` +
    `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>` +
    `</button>` +
    `<span class="mic-hint" data-idle="${tt("Tap to speak", "Konuşmak için dokun")}" data-listening="${tt("Listening…", "Dinliyor…")}">${tt("Tap to speak", "Konuşmak için dokun")}</span>` +
    `</div>`;

  // Quick commands — voice-quote rows with glossy icons and a real run action.
  const quickChips =
    `<div class="section-label">${tt("Quick commands", "Hızlı komutlar")}<span>${tt("say it or tap", "söyle ya da dokun")}</span></div>` +
    `<div class="menu-list">` +
    screens.skills.rows
      .slice(0, 4)
      .map(
        (s, i) =>
          `<div class="menu-row">` +
          `<span class="menu-ico ${DEVICE_GRAD_CYCLE[i % DEVICE_GRAD_CYCLE.length]}" aria-hidden="true">` +
          `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8Z"/></svg></span>` +
          `<span class="menu-text">“${escapeHtml(s.nameKey)}”` +
          `<span class="menu-sub">${tt("Voice command", "Sesli komut")}</span></span>` +
          `<button class="btn-run" type="button" data-run>${tt("Run", "Çalıştır")}</button>` +
          `</div>`,
      )
      .join("") +
    `</div>`;

  const agentRows =
    screens.agents.rows.length > 0
      ? `<div class="section-label">${escapeHtml(label("screen.agents"))}` +
        `<span>${screens.agents.rows.filter((a) => a.status === "active").length} ${tt("active", "aktif")}</span></div>` +
        `<div class="menu-list">` +
        screens.agents.rows
          .map((a, i) => {
            const onStatus = a.status === "sleeping" ? "active" : a.status;
            const awake = a.status !== "sleeping";
            return (
              `<div class="menu-row agent-card">` +
              renderFeatureIco(a.icon, i) +
              `<span class="menu-text">${escapeHtml(a.nameKey)}` +
              `<span class="menu-sub">` +
              `<span class="ag-badge ${a.status}" data-on-label="${statusLabels[onStatus]}" data-off-label="${statusLabels.sleeping}" data-on-class="${onStatus}">${statusLabels[a.status] ?? a.status}</span>` +
              `</span></span>` +
              `<button class="tgl" type="button" data-toggle aria-pressed="${awake ? "true" : "false"}" aria-label="${escapeHtml(a.nameKey)}"></button>` +
              `</div>`
            );
          })
          .join("") +
        `</div>`
      : `<p class="muted">${escapeHtml(label("screen.agents.empty"))}</p>`;

  return (
    `<h2 class="ios-title">${escapeHtml(screens.personalization.assistantName)}` +
    `<small>${escapeHtml(label("mobile.localAI"))} · ${escapeHtml(label("mobile.privacyShield"))} ${escapeHtml(label("mobile.active"))}</small></h2>` +
    micHero +
    quickChips +
    agentRows
  );
}

/** Profile — gradient identity card, glossy hub rows and the Settings screen link. */
function renderProfileSection(screens: DemoScreens, displayName: string): string {
  // Real-data subtitles only — every row opens a fully rendered shared screen.
  const subtitles: Partial<Record<ScreenId, string>> = {
    family: `${screens.family.members.length} ${tt("members", "üye")}`,
    personalization: escapeHtml(screens.personalization.assistantName),
    billing: escapeHtml(label(screens.billing.planLabelKey)),
    agents: `${screens.agents.rows.filter((a) => a.status === "active").length} ${tt("active", "aktif")}`,
  };
  const navGrads: Partial<Record<ScreenId, string>> = {
    family: "bg-green",
    personalization: "bg-purple",
    billing: "bg-blue",
    agents: "bg-orange",
  };
  const rows = screens.nav
    .filter((s) => !RECOMPOSED_IDS.includes(s.id) && !MOBILE_HIDDEN_IDS.includes(s.id) && !SUBSCREEN_IDS.includes(s.id))
    .map(
      (s, i) =>
        `<a class="menu-row" href="#${s.id}" data-nav="${s.id}">` +
        `<span class="menu-ico ${navGrads[s.id] ?? DEVICE_GRAD_CYCLE[i % DEVICE_GRAD_CYCLE.length]}" aria-hidden="true">${renderTabIcon(s.id as TabIcon)}</span>` +
        `<span class="menu-text">${escapeHtml(label(s.titleKey))}` +
        `<span class="menu-sub">${subtitles[s.id] ?? ""}</span></span>` +
        MENU_ARROW +
        `</a>`,
    )
    .join("");

  const initial = escapeHtml(displayName.trim().charAt(0).toUpperCase() || "N");

  // Settings lives on its own screen (reference IA) — one row opens it.
  const settingsRow =
    `<div class="menu-list">` +
    `<a class="menu-row" href="#settings" data-nav="settings">` +
    `<span class="menu-ico bg-cyan" aria-hidden="true">` +
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg></span>` +
    `<span class="menu-text">${tt("Settings", "Ayarlar")}` +
    `<span class="menu-sub">${tt("Theme, language & session", "Tema, dil ve oturum")}</span></span>` +
    MENU_ARROW +
    `</a></div>`;

  return (
    `<h2 class="ios-title">${tt("Profile", "Profil")}</h2>` +
    `<div class="profile-id">${renderAvatar(screens.personalization.avatarUrl, initial)}` +
    `<div><div class="pi-name">${escapeHtml(displayName)}</div>` +
    `<div class="pi-plan">${escapeHtml(label(screens.billing.planLabelKey))} · ${escapeHtml(screens.personalization.assistantName)}</div></div></div>` +
    settingsRow +
    `<div class="section-label">${tt("Account & system", "Hesap ve sistem")}</div>` +
    `<div class="menu-list">${rows}</div>`
  );
}

/** Settings — its own screen (reference IA): grouped field rows + logout. */
function renderSettingsSection(
  screens: DemoScreens,
  chrome: { themeName: ThemeName; locale: string; authed: boolean },
): string {
  // Real links only. The generated demo variants swap theme/locale by file
  // (index/light × en/tr); the authed shell keeps language in the app bar
  // and gets a working logout button instead.
  const themeHref = chrome.themeName === "dark" ? "light.html" : "index.html";
  const langBase = chrome.themeName === "dark" ? "index.html" : "light.html";
  const langHref = chrome.locale === "tr" ? `../${langBase}` : `tr/${langBase}`;
  const fieldRow = (href: string, labelText: string, value: string): string =>
    `<a class="field-row" href="${href}">` +
    `<span class="field-label">${labelText}</span>` +
    `<span class="field-val">${value}${CHEVRON_ICON}</span></a>`;
  // Demo-local switches — same iOS toggle as the device cards, flips in place.
  const toggleRow = (labelText: string, on: boolean): string =>
    `<div class="field-row"><span class="field-label">${labelText}</span>` +
    `<button class="tgl" type="button" data-toggle aria-pressed="${on ? "true" : "false"}" aria-label="${labelText}"></button></div>`;

  const general =
    `<div class="section-label">${tt("General", "Genel")}</div>` +
    `<div class="menu-list">` +
    fieldRow(
      themeHref,
      tt("Dark mode", "Karanlık Mod"),
      chrome.themeName === "dark" ? tt("On", "Açık") : tt("Off", "Kapalı"),
    ) +
    fieldRow(langHref, tt("Language", "Dil"), chrome.locale.toUpperCase()) +
    `</div>`;

  const notifications =
    `<div class="section-label">${tt("Notifications", "Bildirimler")}</div>` +
    `<div class="menu-list">` +
    toggleRow(tt("Push notifications", "Anlık bildirimler"), true) +
    toggleRow(tt("Routine suggestions", "Rutin önerileri"), true) +
    toggleRow(tt("Weekly email summary", "Haftalık e-posta özeti"), false) +
    `</div>`;

  const assistant =
    `<div class="section-label">${tt("Assistant", "Asistan")}</div>` +
    `<div class="menu-list">` +
    `<a class="field-row" href="#personalization" data-nav="personalization">` +
    `<span class="field-label">${tt("Assistant name", "Asistan adı")}</span>` +
    `<span class="field-val">${escapeHtml(screens.personalization.assistantName)}${CHEVRON_ICON}</span></a>` +
    toggleRow(tt("Voice wake word", "Sesle uyandırma"), true) +
    toggleRow(tt("Sound effects", "Ses efektleri"), true) +
    `</div>`;

  const privacy =
    `<div class="section-label">${tt("Privacy", "Gizlilik")}</div>` +
    `<div class="menu-list">` +
    toggleRow(tt("On-device AI processing", "Cihaz üstü AI işleme"), true) +
    toggleRow(tt("Share anonymous analytics", "Anonim analitik paylaşımı"), false) +
    `</div>`;

  const logout = chrome.authed
    ? `<button class="logout-btn" id="m-logout-row" type="button">${escapeHtml(label("auth.logout"))}</button>`
    : "";

  return (
    `<h2 class="ios-title">${tt("Settings", "Ayarlar")}</h2>` +
    general +
    notifications +
    assistant +
    privacy +
    logout
  );
}

/** Device detail — hero tile, local power toggle, energy analysis + specs. */
/** Localized labels for capability kinds and enum values (detail controls). */
const CAP_KIND_LABEL: Record<string, readonly [string, string]> = {
  brightness: ["Brightness", "Parlaklık"],
  colorTemp: ["Color temperature", "Renk sıcaklığı"],
  color: ["Color", "Renk"],
  volume: ["Volume", "Ses"],
  channel: ["Channel", "Kanal"],
  source: ["Source", "Kaynak"],
  temperature: ["Target temperature", "Hedef sıcaklık"],
  mode: ["Mode", "Mod"],
  fanSpeed: ["Fan speed", "Fan hızı"],
  position: ["Position", "Konum"],
  quality: ["Quality", "Kalite"],
  privacyMode: ["Privacy mode", "Gizlilik modu"],
};
const CAP_VALUE_LABEL: Record<string, readonly [string, string]> = {
  cool: ["Cool", "Soğut"],
  heat: ["Heat", "Isıt"],
  auto: ["Auto", "Otomatik"],
  dry: ["Dry", "Nemli"],
  low: ["Low", "Düşük"],
  medium: ["Medium", "Orta"],
  high: ["High", "Yüksek"],
  locked: ["Locked", "Kilitli"],
  unlocked: ["Unlocked", "Kilit Açık"],
};

/** Type-specific control widgets (3) — driven entirely by d.capabilities. */
function renderDeviceControls(d: DemoScreens["devices"]["rows"][number]): string {
  const caps = d.capabilities ?? [];
  if (caps.length === 0) return "";
  const kindLabel = (kind: string): string => {
    const p = CAP_KIND_LABEL[kind];
    return p ? tt(p[0], p[1]) : kind;
  };
  const valueLabel = (v: string): string => {
    const p = CAP_VALUE_LABEL[v];
    return p ? tt(p[0], p[1]) : v;
  };
  const slider = (name: string, value: number, min: number, max: number, unit: string, extra = ""): string =>
    `<div class="ctl-row"><div class="ctl-head"><span class="field-label">${name}</span><span class="ctl-val">${value}${unit}</span></div>` +
    `<input class="ctl-slider${extra ? ` ${extra}` : ""}" type="range" min="${min}" max="${max}" value="${value}" data-slider data-unit="${unit}" aria-label="${name}"/></div>`;
  const seg = (name: string, value: string, options: readonly string[]): string =>
    `<div class="ctl-row"><div class="ctl-head"><span class="field-label">${name}</span></div><div class="seg">` +
    options
      .map((o) => `<button class="seg-btn${o === value ? " active" : ""}" type="button" data-set>${escapeHtml(valueLabel(o))}</button>`)
      .join("") +
    `</div></div>`;
  const dial = (name: string, value: number, min: number, max: number): string => {
    const off = Math.round(245 * (1 - (value - min) / (max - min)));
    return (
      `<div class="ctl-row dial-row" data-stepper data-value="${value}" data-min="${min}" data-max="${max}" data-unit="°C">` +
      `<div class="ctl-head" style="align-self:stretch;"><span class="field-label">${name}</span></div>` +
      `<div class="dial-wrap"><svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true">` +
      `<circle class="dial-track" cx="66" cy="66" r="52" transform="rotate(135 66 66)"/>` +
      `<circle class="dial-arc" cx="66" cy="66" r="52" transform="rotate(135 66 66)" style="stroke-dashoffset:${off}"/>` +
      `</svg><div class="dial-center"><b class="step-val">${value}°C</b><span>${tt("Target", "Hedef")}</span></div></div>` +
      `<div class="dial-ctrls"><button class="dial-btn" type="button" data-step="-1" aria-label="${tt("Decrease", "Azalt")}">−</button>` +
      `<button class="dial-btn" type="button" data-step="1" aria-label="${tt("Increase", "Artır")}">+</button></div></div>`
    );
  };
  const stepperRow = (name: string, value: number): string =>
    `<div class="ctl-row"><div class="ctl-head"><span class="field-label">${name}</span></div>` +
    `<div class="stepper" data-stepper data-value="${value}" data-min="1" data-max="999">` +
    `<button class="dial-btn" type="button" data-step="-1" aria-label="${tt("Previous", "Önceki")}">−</button>` +
    `<b class="step-val">${value}</b>` +
    `<button class="dial-btn" type="button" data-step="1" aria-label="${tt("Next", "Sonraki")}">+</button></div></div>`;
  const lockBig = (locked: boolean): string =>
    `<div class="ctl-row">` +
    `<div role="button" tabindex="0" class="lock-big${locked ? "" : " unlocked"}" type="button" data-lockbig data-locked="${tt("Locked", "Kilitli")}" data-unlocked="${tt("Unlocked", "Kilit Açık")}">` +
    `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4M12 15v2"/></svg>` +
    `<b>${locked ? tt("Locked", "Kilitli") : tt("Unlocked", "Kilit Açık")}</b>` +
    `<span>${tt("Tap to lock/unlock", "Kilitlemek/açmak için dokun")}</span></button>` +
    `<div class="lock-log" aria-hidden="true">` +
    `<span>${rfIco("clock")} 08:12 · ${tt("Locked by routine", "Rutinle kilitlendi")}</span>` +
    `<span>${rfIco("clock")} ${tt("Yesterday", "Dün")} 22:47 · ${tt("Unlocked manually", "Elle açıldı")}</span>` +
    `</div></div>`;
  const playRow = (): string =>
    `<div class="ctl-row ctl-inline"><span class="field-label">${tt("Playback", "Oynatma")}</span>` +
    `<button class="play-btn" type="button" data-play data-play-label="▶ ${tt("Play", "Oynat")}" data-pause-label="⏸ ${tt("Pause", "Duraklat")}">⏸ ${tt("Pause", "Duraklat")}</button></div>`;

  const rows = caps
    .map((c) => {
      const name = kindLabel(c.kind);
      switch (c.kind) {
        case "brightness":
        case "volume":
        case "position":
          return slider(name, Number(c.value), c.min ?? 0, c.max ?? 100, "%");
        case "colorTemp":
          return slider(name, Number(c.value), c.min ?? 2700, c.max ?? 6500, "K", "temp-bar");
        case "color":
          return slider(name, 30, 0, 360, "°", "color-bar");
        case "temperature":
          return dial(name, Number(c.value), c.min ?? 16, c.max ?? 30);
        case "channel":
          return stepperRow(name, Number(c.value));
        case "mode":
        case "fanSpeed":
        case "source":
        case "quality":
          return seg(name, String(c.value), c.options ?? []);
        case "lockState":
          return lockBig(String(c.value) === "locked");
        case "privacyMode":
          return (
            `<div class="ctl-row ctl-inline"><span class="field-label">${name}</span>` +
            `<button class="tgl" type="button" data-toggle aria-pressed="${c.value ? "true" : "false"}" aria-label="${name}"></button></div>`
          );
        case "switch":
          return d.type === "speaker" ? playRow() : "";
        default:
          return "";
      }
    })
    .filter(Boolean);
  if (rows.length === 0) return "";
  return (
    `<div class="section-label">${tt("Controls", "Kontroller")}</div>` +
    `<div class="detail-controls">${rows.join("")}</div>`
  );
}

function renderDeviceDetailSection(
  d: DemoScreens["devices"]["rows"][number],
  index: number,
): string {
  const onLabel = tt("On", "Açık");
  const offLabel = tt("Off", "Kapalı");
  const connLabels: Record<string, string> = {
    online: tt("Online", "Çevrimiçi"),
    offline: tt("Offline", "Çevrimdışı"),
    error: tt("Connection error", "Bağlantı hatası"),
  };

  const hero =
    `<div class="detail-hero">${renderDeviceTile(d, index)}` +
    `<div><div class="detail-name">${escapeHtml(d.nameKey)}</div>` +
    `<div class="detail-sub">${escapeHtml(d.room ?? "")} · ${d.online ? onLabel : offLabel}</div></div></div>`;

  const power =
    `<div class="menu-list"><div class="field-row">` +
    `<span class="field-label">${tt("Power", "Güç")}</span>` +
    `<button class="tgl" type="button" data-toggle aria-pressed="${d.online ? "true" : "false"}" aria-label="${escapeHtml(d.nameKey)}"></button>` +
    `</div></div>`;

  // Energy analysis — real per-device daily watt-hours from the view-model.
  const daily = d.analytics?.dailyUsageWh ?? [];
  let usage = "";
  if (daily.length > 0) {
    const max = Math.max(...daily);
    const dayKeys =
      CURRENT_LOCALE === "tr"
        ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const total = daily.reduce((a, b) => a + b, 0);
    const totalLabel = total >= 1000 ? `${(total / 1000).toFixed(2)} kWh` : `${total} Wh`;
    usage =
      `<div class="section-label">${tt("Energy analysis", "Enerji analizi")}` +
      `<span>${tt("last 7 days", "son 7 gün")} · ${totalLabel}</span></div>` +
      `<div class="chart-card"><div class="bars">` +
      daily
        .map(
          (v, i) =>
            `<div class="bar-col"><i style="height:${6 + Math.round((v / max) * 78)}px"></i><b>${dayKeys[i % 7]}</b></div>`,
        )
        .join("") +
      `</div></div>`;
  }
  const anomaly = d.analytics?.anomalyDetected
    ? `<div class="anomaly-badge"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;vertical-align:-2px;"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg> ${tt("Unusual consumption detected this week", "Bu hafta olağan dışı tüketim algılandı")}</div>`
    : "";

  // Spec sheet — every row is real device metadata from the view-model.
  const spec = (labelText: string, value?: string): string =>
    value
      ? `<div class="field-row"><span class="field-label">${labelText}</span>` +
        `<span class="field-val">${escapeHtml(value)}</span></div>`
      : "";
  const lastSeen = d.lastSeen
    ? new Date(d.lastSeen).toLocaleString(CURRENT_LOCALE, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;
  const specs =
    `<div class="section-label">${tt("Device details", "Cihaz detayları")}</div>` +
    `<div class="menu-list">` +
    spec(tt("Manufacturer", "Üretici"), d.manufacturer) +
    spec(tt("Model", "Model"), d.model) +
    spec(tt("Firmware", "Yazılım sürümü"), d.firmwareVersion) +
    spec(tt("Connection", "Bağlantı"), d.connectionStatus ? connLabels[d.connectionStatus] : undefined) +
    spec(tt("IP address", "IP adresi"), d.ipAddress) +
    spec(tt("MAC address", "MAC adresi"), d.macAddress) +
    spec(tt("Last seen", "Son görülme"), lastSeen) +
    `</div>`;

  return hero + power + renderDeviceControls(d) + anomaly + usage + specs;
}

/** Billing — gradient plan hero, real plan facts and demo-local actions. */
function renderBillingSection(screens: DemoScreens): string {
  const b = screens.billing;
  const hero =
    `<div class="plan-hero"><span class="ph-badge">${tt("Active", "Aktif")}</span>` +
    `<div class="ph-kicker">NEXUS</div>` +
    `<div class="ph-plan">${escapeHtml(label(b.planLabelKey))}</div>` +
    `<div class="ph-sub">${screens.family.members.length} ${tt("member profiles", "üye profili")} · ` +
    `${screens.agents.rows.length} ${tt("AI agents", "AI ajanı")} · ${screens.skills.rows.length} ${tt("routines", "rutin")}</div></div>`;

  const actions =
    `<div class="billing-actions">` +
    (b.canUpgrade
      ? `<button class="btn-create" type="button" data-run>${tt("Upgrade", "Yükselt")}</button>`
      : "") +
    `<button class="btn-ghost" type="button" data-nav="billing-manage">${escapeHtml(label(b.manageActionKey))}</button>` +
    `</div>`;

  // Plan inclusions — counts come from the live family/agents/skills models.
  const features: { icon: string; title: string; sub: string }[] = [
    {
      icon: "users",
      title: tt("Family profiles", "Aile profilleri"),
      sub: `${screens.family.members.length} ${tt("personalized member profiles", "kişiselleştirilmiş üye profili")}`,
    },
    {
      icon: "sparkles",
      title: tt("All AI agents", "Tüm AI ajanları"),
      sub: `${screens.agents.rows.length} ${tt("agents included", "ajan dahil")}`,
    },
    {
      icon: "infinity",
      title: tt("Unlimited automations", "Sınırsız otomasyon"),
      sub: `${screens.skills.rows.length} ${tt("routines running", "rutin çalışıyor")}`,
    },
    {
      icon: "headset",
      title: tt("Priority support", "Öncelikli destek"),
      sub: tt("24/7 live help for your plan", "Planına özel 7/24 canlı destek"),
    },
  ];
  const checkIcon =
    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex:none;" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;
  const featureRows =
    `<div class="section-label">${tt("Plan includes", "Plan içeriği")}<span>${escapeHtml(label(b.planLabelKey))}</span></div>` +
    `<div class="menu-list">` +
    features
      .map(
        (f, i) =>
          `<div class="menu-row">${renderFeatureIco(f.icon, i)}` +
          `<span class="menu-text">${f.title}<span class="menu-sub">${f.sub}</span></span>` +
          checkIcon +
          `</div>`,
      )
      .join("") +
    `</div>`;

  return (
    `<h2 class="ios-title">${escapeHtml(label(b.titleKey))}` +
    `<small>${tt("Manage your NEXUS plan", "NEXUS planını yönet")}</small></h2>` +
    hero +
    actions +
    featureRows
  );
}

/** Subscription management — plan comparison, payment method, renewal + invoices (4a). */
function renderBillingManageSection(screens: DemoScreens): string {
  const m = screens.billingManage;
  const check =
    `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex:none;" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;

  // Plan comparison — current plan highlighted, checkmark grid per feature.
  const planCards = m.plans
    .map((p) => {
      const feats = m.featureKeys
        .map((k, i) =>
          p.includes[i]
            ? `<li>${check}${escapeHtml(label(k))}</li>`
            : `<li class="off">– ${escapeHtml(label(k))}</li>`,
        )
        .join("");
      return (
        `<div class="plan-cmp-card${p.current ? " current" : ""}">` +
        (p.current ? `<span class="pc-badge">${tt("Current", "Mevcut")}</span>` : "") +
        `<div class="pc-name">${escapeHtml(label(p.labelKey))}</div>` +
        `<div class="pc-price">${escapeHtml(p.price)} <small>/ ${tt("mo", "ay")}</small></div>` +
        `<ul class="pc-feat">${feats}</ul></div>`
      );
    })
    .join("");

  const payment =
    `<div class="section-label">${tt("Payment method", "Ödeme yöntemi")}</div>` +
    `<div class="pm-card"><span class="pm-brand">${escapeHtml(m.paymentMethod.brand)}</span>` +
    `<div class="pm-main"><div class="pm-title">•••• ${escapeHtml(m.paymentMethod.last4)}</div>` +
    `<div class="pm-sub">${tt("Expires", "Son kullanma")} ${escapeHtml(m.paymentMethod.expires)}</div></div>` +
    `<button class="btn-ghost" type="button" data-run>${escapeHtml(label(m.changeActionKey))}</button></div>`;

  // Cancelling asks for confirmation, then flips the renewal line demo-locally.
  const renewal = m.nextRenewal
    ? `<div class="renew-card"><div class="pm-main"><div class="pm-title">${tt("Next renewal", "Sonraki yenileme")}</div>` +
      `<div class="pm-sub">${escapeHtml(m.nextRenewal.date)} · ${escapeHtml(m.nextRenewal.amount)}</div></div>` +
      `<button class="btn-ghost btn-cancel" type="button" data-cancel` +
      ` data-confirm="${tt("Cancel renewal? Your plan reverts to Free at period end.", "Yenileme iptal edilsin mi? Dönem sonunda planın Ücretsiz plana döner.")}"` +
      ` data-done="${tt("Renewal cancelled — plan ends at period end", "Yenileme iptal edildi — plan dönem sonunda biter")}">` +
      `${escapeHtml(label(m.cancelActionKey))}</button></div>`
    : "";

  const invoices = m.invoices.length
    ? `<div class="section-label">${tt("Invoice history", "Fatura geçmişi")}<span>${m.invoices.length} ${tt("invoices", "fatura")}</span></div>` +
      `<div class="menu-list">` +
      m.invoices
        .map(
          (inv) =>
            `<div class="menu-row">` +
            `<span class="menu-text">${escapeHtml(inv.date)}` +
            `<span class="menu-sub inv-status">${inv.status === "paid" ? tt("Paid", "Ödendi") : tt("Due", "Bekliyor")}</span></span>` +
            `<span class="inv-amount">${escapeHtml(inv.amount)}</span>` +
            `<button class="inv-pdf" type="button" data-run>PDF</button>` +
            `</div>`,
        )
        .join("") +
      `</div>`
    : "";

  return (
    `<h2 class="ios-title">${escapeHtml(label(m.titleKey))}` +
    `<small>${tt("Plans, payment & invoices", "Plan, ödeme ve faturalar")}</small></h2>` +
    `<div class="plan-cmp">${planCards}</div>` +
    payment +
    renewal +
    invoices
  );
}

/** Device pairing — brand catalog, manual protocols + simulated LAN scan (4b). */
function renderAddDeviceSection(): string {
  // Brand catalog — same deterministic connector list as the web pairing screen.
  const brands = ADD_DEVICE_BRANDS.map((b) => {
    const badge = b.installed
      ? `<span class="bc-badge installed">${tt("Installed", "Kurulu")}</span>`
      : b.premium
        ? `<span class="bc-badge premium">Premium</span>`
        : `<span class="bc-badge add">${tt("Add", "Ekle")}</span>`;
    return (
      `<button class="brand-card" type="button" data-run>` +
      `<span class="bc-logo"><img src="https://cdn.simpleicons.org/${b.slug}" alt="" width="22" height="22" loading="lazy" onerror="this.remove()"/></span>` +
      `<span class="bc-main"><span class="bc-name">${escapeHtml(b.name)}</span>` +
      `<span class="bc-proto">${escapeHtml(b.protocol)}</span></span>` +
      badge +
      `</button>`
    );
  }).join("");

  const protocols = ["Bluetooth", "Matter", "Wi-Fi", tt("Other", "Diğer")]
    .map((p) => `<button class="btn-ghost" type="button" data-run>${p}</button>`)
    .join("");

  // Simulated LAN scan — the button spins, then the mock discoveries appear.
  const scanRows = SCAN_RESULTS.map(
    (r) =>
      `<div class="scan-row"><span class="dot" aria-hidden="true"></span>` +
      `<span class="bc-main"><span class="bc-name">${escapeHtml(r.name)}</span>` +
      `<span class="bc-proto">${escapeHtml(r.detail)}</span></span>` +
      `<button class="btn-ghost" type="button" data-run>${tt("Pair", "Eşleştir")}</button></div>`,
  ).join("");
  const scan =
    `<div class="section-label">${tt("Network scan", "Ağ taraması")}</div>` +
    `<div class="scan-card"><div class="scan-head">` +
    `<div class="pm-sub">${tt("Find devices already on your network", "Ağındaki hazır cihazları bul")}</div>` +
    `<button class="btn-ghost" type="button" data-scan` +
    ` data-scanning="${tt("Scanning…", "Aranıyor…")}" data-rescan="${tt("Scan again", "Yeniden tara")}">${tt("Scan for devices", "Cihazları ara")}</button></div>` +
    `<div class="scan-results" data-scan-results hidden>${scanRows}</div></div>`;

  const tip =
    `<div class="tip-card"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;color:var(--primary);">${RF_ICON.bulb}</svg> ${tt(
      "Help: hold the button on your device for 5s to enter pairing mode.",
      "Yardım: Cihazını eşleştirme moduna almak için üzerindeki düğmeye 5 sn basılı tut.",
    )}</div>`;

  return (
    `<h2 class="ios-title">${escapeHtml(label("screen.addDevice"))}` +
    `<small>${tt("Brands, pairing & network scan", "Marka, eşleştirme ve ağ taraması")}</small></h2>` +
    `<div class="section-label">${tt("Add by brand", "Markaya göre ekle")}<span>${ADD_DEVICE_BRANDS.length} ${tt("brands", "marka")}</span></div>` +
    `<div class="brand-grid">${brands}</div>` +
    `<div class="section-label">${tt("Manual pairing", "Manuel eşleştirme")}</div>` +
    `<div class="pair-row">${protocols}</div>` +
    scan +
    tip
  );
}

/** Agents — mobile-native hub: live status pills + glossy per-agent rows. */
function renderAgentsSection(screens: DemoScreens): string {
  const rows = screens.agents.rows;
  const statusLabels: Record<string, string> = {
    active: tt("Active", "Aktif"),
    learning: tt("Learning", "Öğreniyor"),
    sleeping: tt("Sleeping", "Uykuda"),
  };
  const statusDesc: Record<string, string> = {
    active: tt("Watching over your home right now", "Şu anda evini izliyor"),
    learning: tt("Learning your daily habits", "Günlük alışkanlıklarını öğreniyor"),
    sleeping: tt("On standby — wakes when needed", "Beklemede — gerektiğinde uyanır"),
  };
  const active = rows.filter((a) => a.status === "active").length;
  const learning = rows.filter((a) => a.status === "learning").length;

  const pills =
    `<div class="live-pills">` +
    `<span class="pill"><span class="dot"></span>${active} ${tt("active", "aktif")}</span>` +
    (learning > 0
      ? `<span class="pill warn"><span class="dot"></span>${learning} ${tt("learning", "öğreniyor")}</span>`
      : "") +
    `</div>`;

  const agentRows =
    rows.length > 0
      ? `<div class="menu-list">` +
        rows
          .map((a, i) => {
            // Toggling pauses/wakes the agent: awake state restores the real status.
            const onStatus = a.status === "sleeping" ? "active" : a.status;
            const awake = a.status !== "sleeping";
            return (
              `<div class="menu-row agent-card">` +
              renderFeatureIco(a.icon, i) +
              `<span class="menu-text">${escapeHtml(a.nameKey)}` +
              `<span class="menu-sub">` +
              `<span class="ag-badge ${a.status}" data-on-label="${statusLabels[onStatus]}" data-off-label="${statusLabels.sleeping}" data-on-class="${onStatus}">${statusLabels[a.status] ?? a.status}</span>` +
              `</span></span>` +
              `<button class="tgl" type="button" data-toggle aria-pressed="${awake ? "true" : "false"}" aria-label="${escapeHtml(a.nameKey)}"></button>` +
              `</div>`
            );
          })
          .join("") +
        `</div>`
      : `<p class="muted">${escapeHtml(label("screen.agents.empty"))}</p>`;

  return (
    `<h2 class="ios-title">${escapeHtml(label(screens.agents.titleKey))}` +
    `<small>${rows.length} ${tt("AI agents on duty", "görevde AI ajanı")}</small></h2>` +
    pills +
    agentRows
  );
}

export interface MobileOptions {
  readonly theme?: ThemeName;
  readonly userAgent?: string;
  readonly platform?: "ios" | "android";
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
  const userAgent =
    options.userAgent ??
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
  const theme = getTheme(themeName);
  if (options.locale) setLocale(options.locale);
  const authed = options.authenticated ?? false;
  const screens = options.screens ?? buildDemoScreens();
  // iOS-first shell language; Android keeps its own decorative hardware chrome.
  const platform = options.platform ?? "ios";

  const displayName = options.displayName || screens.personalization.userAddress || "N";
  const initial = escapeHtml(displayName.trim().charAt(0).toUpperCase() || "N");
  const locale = options.locale ?? CURRENT_LOCALE;

  // Primary tabs are mobile-native compositions over the shared view-models.
  const primarySections = [
    `<section id="home">${renderHomeSection(screens)}</section>`,
    `<section id="smart">${renderSmartSection(screens)}</section>`,
    `<section id="discover">${renderDiscoverSection(screens)}</section>`,
  ].join("\n");

  // The assistant lives behind the AI orb (and the Home/Discover cards); it
  // returns to Home with an iOS-style back affordance.
  const backLink = (id: string, text: string): string =>
    `<a class="backrow" href="#${id}" data-nav="${id}">` +
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>` +
    `${text}</a>`;
  const backHomeRow = backLink("home", tt("Home", "Ev"));
  const assistantSection = `<section id="assistant">${backHomeRow}${renderAssistantSection(screens)}</section>`;

  // Per-device detail screens (specs + energy analysis) open from the Home cards.
  const deviceSections = screens.devices.rows
    .map(
      (d, i) =>
        `<section id="device-${d.id}">${backHomeRow}${renderDeviceDetailSection(d, i)}</section>`,
    )
    .join("\n");

  // Secondary surfaces: each shared screen behind the Profile tab, with an
  // iOS-style back affordance instead of a bottom-bar seat. Billing and
  // Agents get mobile-native compositions; web-only surfaces are left out.
  const backRow = backLink("profile", tt("Profile", "Profil"));
  const secondarySections = screens.nav
    .filter((s) => !RECOMPOSED_IDS.includes(s.id) && !MOBILE_HIDDEN_IDS.includes(s.id))
    .map((s) => {
      const body =
        s.id === "billing"
          ? renderBillingSection(screens)
          : s.id === "billing-manage"
            ? renderBillingManageSection(screens)
            : s.id === "add-device"
              ? renderAddDeviceSection()
              : s.id === "agents"
                ? renderAgentsSection(screens)
                : renderScreenBody(s.id, screens, userAgent, "mobile");
      // Sub-screens back out to where they were opened from (billing hero / Home "+").
      const back =
        s.id === "billing-manage"
          ? backLink("billing", tt("Billing", "Abonelik"))
          : s.id === "add-device"
            ? backLink("home", tt("Home", "Ev"))
            : backRow;
      return `<section id="${s.id}">${back}${body}</section>`;
    })
    .join("\n");

  const profileSection = `<section id="profile">${renderProfileSection(screens, displayName)}</section>`;
  // Settings is its own screen (reference IA), reached from the Profile hub.
  const settingsSection = `<section id="settings">${backRow}${renderSettingsSection(screens, { themeName, locale, authed })}</section>`;

  // Authenticated app bar carries a language dropdown + logout; both variants
  // route the avatar to the Profile hub (the secondary account surface).
  const langLabels: Record<string, string> = {
    en: "EN", tr: "TR", es: "ES", fr: "FR", de: "DE", it: "IT", pt: "PT", nl: "NL", pl: "PL", cs: "CS",
    ru: "RU", uk: "UK", ar: "AR", he: "HE", hi: "HI", ja: "JA", ko: "KO", "zh-Hans": "中简", "zh-Hant": "中繁", vi: "VI",
  };
  const langItems = SUPPORTED_LOCALES.map(
    (l) => `<a class="ld-item${l === locale ? " active" : ""}" href="?lang=${l}" data-lang="${l}">${langLabels[l] || l.toUpperCase()}</a>`
  ).join("");
  const profileButton =
    `<button class="m-profile" type="button" data-nav="profile" aria-label="${tt("Profile", "Profil")}">` +
    `<span class="avatar-wrap">${renderAvatar(screens.personalization.avatarUrl, initial)}</span></button>`;
  // The gradient AI orb is the brand mark of the app bar — it opens NEXUS AI
  // and carries the N monogram (our own AI, never a generic sparkle).
  const aiOrb =
    `<button class="ai-orb" type="button" data-nav="assistant" aria-label="${escapeHtml(screens.personalization.assistantName)}">` +
    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    `${renderLogo(18)}</button>`;
  const appbarRight = authed
    ? `<div class="lang-picker">` +
      `<button class="lang-picker-btn" type="button" aria-expanded="false" aria-haspopup="listbox">` +
      `<span>${langLabels[locale] || locale.toUpperCase()}</span>` +
      `<svg class="ld-caret" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>` +
      `</button>` +
      `<div class="ld-menu" role="listbox">${langItems}</div>` +
      `</div>` +
      aiOrb +
      profileButton +
      `<button class="m-logout" id="m-logout" type="button" aria-label="${escapeHtml(label("auth.logout"))}">` +
      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></button>`
    : aiOrb + profileButton;

  // Installable-PWA wiring only in the authenticated app (served by the sync server,
  // where /manifest.webmanifest and /sw.js exist); the standalone demo stays a plain file.
  const pwaHead = authed
    ? `<link rel="manifest" href="/manifest.webmanifest" />\n<link rel="apple-touch-icon" href="/icon.svg" />`
    : "";
  const authScript = authed
    ? `\n<script>\nif("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").catch(function(){});}\nvar _lo=document.getElementById("m-logout");if(_lo){_lo.addEventListener("click",function(){fetch("/api/logout",{method:"POST"}).then(function(){location.href="/login";});});}\nvar _lo2=document.getElementById("m-logout-row");if(_lo2){_lo2.addEventListener("click",function(){fetch("/api/logout",{method:"POST"}).then(function(){location.href="/login";});});}\n</script>`
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
<script>document.documentElement.classList.add("js-tabs");</script>
</head>
<body class="mobile">
<div id="a11y-live" role="status" aria-live="polite" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;"></div>
<div class="phone">
${renderStatusBar(platform)}
<header class="appbar">${renderLogo()}<span class="apptitle">NEXUS</span><div class="appbar-right">${appbarRight}</div></header>
<main class="screen" id="main">
${primarySections}
${deviceSections}
${profileSection}
${settingsSection}
${assistantSection}
${secondarySections}
</main>
${renderTabBar("home")}
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
