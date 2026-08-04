/**
 * NEXUS AI — Desktop front end
 *
 * The desktop surface: a native-style application window (title bar with window
 * controls + a persistent left sidebar) that renders the *same* screen bodies as
 * the web and mobile front ends. It reuses:
 *   - design tokens (@nexus/design-system) for brand-consistent colors/spacing,
 *   - screen view-models + the shared `renderScreenBody` (@nexus/web) so every
 *     platform draws identical content through its own chrome.
 *
 * Like the rest of the codebase this is a dependency-free `data -> HTML string`
 * renderer: deterministic, unit-testable, and viewable as a standalone file. A
 * production build wraps this markup in a real desktop shell — that
 * native packaging is an external boundary; the *design* lives here.
 *
 * This package (packages/desktop/src) is the single source of truth for ALL
 * desktop shell HTML: the runtime authenticated shell below and the first-run
 * setup wizard (setup.ts, emitted by build.ts into packages/desktop/dist and
 * packaged into the Electron app). The desktop application UI itself is the
 * shared React SPA loaded from /app — no static preview shells exist.
 */

import { getTheme, type DesignTokens, type ThemeName } from "@nexus/design-system";

import { type ScreenDescriptor, type ScreenId } from "@nexus/interface";
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

import { renderSideIcon, renderWindowControls } from "./utils.js";

/** Persistent left navigation rail, one entry per accessible screen. */
export function renderSidebar(
  primary: string,
  nav: readonly ScreenDescriptor[],
  activeId: ScreenId,
): string {
  const links = nav
    .map((s) => {
      const on = s.id === activeId;
      return (
        `<a class="${on ? "active" : ""}" href="#${s.id}" data-nav="${s.id}"` +
        `${on ? ' aria-current="page"' : ""}>${renderSideIcon(s.id)}` +
        `<span>${escapeHtml(label(s.titleKey))}</span></a>`
      );
    })
    .join("");
  return (
    `<aside class="sidebar">` +
    `<div class="brandrow">${renderLogo(primary)}<span class="brand">NEXUS</span></div>` +
    `<nav class="side" aria-label="Primary">${links}</nav>` +
    `<div class="sidefoot">v3.14.2 · ${escapeHtml(label("plan.family"))}</div>` +
    `</aside>`
  );
}

/** Desktop chrome on top of the shared token-driven component styles. */
export function renderDesktopStyles(t: DesignTokens): string {
  return `${renderStyles(t)}
@keyframes win-open {
  from { opacity: 0; transform: scale(0.975) translateY(10px); }
  to   { opacity: 1; transform: none; }
}
@keyframes sidebar-pulse {
  0%,100% { box-shadow: inset 0 0 0 1px color-mix(in srgb,var(--primary) 28%,transparent); }
  50%      { box-shadow: inset 0 0 0 1px color-mix(in srgb,var(--primary) 52%,transparent),
                         0 0 14px color-mix(in srgb,var(--primary) 18%,transparent); }
}
@keyframes content-slide {
  from { opacity: 0; transform: translateX(14px); }
  to   { opacity: 1; transform: none; }
}
body.desktop { padding: ${t.space[6]}px; background: #05060a; font-family: 'Space Grotesk', Inter, system-ui, sans-serif; }
.window {
  max-width: 1120px; margin: 0 auto; background: var(--bg);
  border: 1px solid color-mix(in srgb, var(--primary) 22%, var(--surface)); border-radius: ${t.radius.lg}px; overflow: hidden;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6), 0 0 1px 1px color-mix(in srgb, var(--primary) 20%, transparent);
  animation: win-open 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.titlebar {
  display: flex; align-items: center; gap: ${t.space[4]}px;
  height: 44px; padding: 0 ${t.space[4]}px; position: relative;
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 92%, var(--primary)) 0%, var(--surface) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 0;
}
.titlebar::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent 0%, color-mix(in srgb,var(--primary) 60%,transparent) 30%, color-mix(in srgb,var(--primary) 60%,transparent) 70%, transparent 100%);
}
.wctl { display: flex; gap: ${t.space[1]}px; }
.wctl-btn {
  width: 28px; height: 28px; border-radius: var(--radius);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--muted); transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}
.gnome-btn {
  width: 22px; height: 22px; border-radius: 50%; background: color-mix(in srgb, var(--surface) 75%, var(--text));
  color: var(--muted); display: inline-flex; align-items: center; justify-content: center;
}
.gnome-btn:hover { background: color-mix(in srgb, var(--surface) 50%, var(--text)); color: var(--text); }
.gnome-btn.close:hover { background: #ef4444; color: #fff; box-shadow: 0 0 10px rgba(239,68,68,0.45); }
.wctl-btn:hover { background: color-mix(in srgb, var(--text) 8%, transparent); color: var(--text); transform: translateY(-1px); }
.wctl-btn.close:hover { background: #ef4444; color: #fff; box-shadow: 0 0 12px rgba(239,68,68,0.5); transform: translateY(-1px); }
.titlebar .title { flex: 1; text-align: center; font-size: ${t.font.size.sm}px; color: var(--muted); letter-spacing: 0.03em; font-weight: 600; }
.titlebar .title-actions { display: flex; align-items: center; gap: ${t.space[3]}px; }
.title-lang { display: inline-flex; gap: 4px; font-size: ${t.font.size.sm}px; }
.title-lang a { color: var(--muted); text-decoration: none; }
.title-lang a.active { color: var(--primary); font-weight: 700; }
.title-logout {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 28px; padding: 0 ${t.space[3]}px; border-radius: var(--radius);
  border: 1px solid var(--border-strong); background: transparent; color: var(--muted);
  font-size: ${t.font.size.sm}px; cursor: pointer; transition: border-color .18s ease, color .18s ease, background .18s ease;
}
.title-logout:hover { border-color: var(--primary); color: var(--primary); }
.titlebar .avatar-wrap { display: inline-flex; }
.app { display: flex; min-height: 620px; }
.sidebar {
  width: 248px; flex: none; background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 92%, var(--primary) 8%) 0%, var(--surface) 100%);
  backdrop-filter: blur(16px); padding: ${t.space[5]}px;
  border-right: 1px solid color-mix(in srgb, var(--text) 8%, transparent); display: flex; flex-direction: column; gap: ${t.space[5]}px;
}
.brandrow { display: flex; align-items: center; gap: ${t.space[3]}px; }
nav.side { display: flex; flex-direction: column; gap: ${t.space[1]}px; margin: 0; position: relative; }
.side-indicator {
  position: absolute; left: 0; width: 3px; border-radius: 0 3px 3px 0;
  background: var(--primary); pointer-events: none;
  transition: top 0.28s cubic-bezier(0.22,1,0.36,1), height 0.28s cubic-bezier(0.22,1,0.36,1);
}
nav.side a {
  display: flex; align-items: center; gap: ${t.space[3]}px;
  padding: ${t.space[3]}px ${t.space[4]}px; border: 0; border-radius: var(--radius);
  background: transparent; color: var(--muted); font-size: ${t.font.size.md}px; font-weight: 500;
  text-decoration: none; transition: background 0.2s ease, color 0.2s ease;
}
nav.side a .sideicon { flex: none; transition: transform 0.2s ease; }
nav.side a:hover { background: var(--bg); color: var(--text); }
nav.side a:hover .sideicon { transform: scale(1.12); }
nav.side a.active {
  background: var(--tint); color: var(--primary);
  animation: sidebar-pulse 3s ease infinite;
}
.sidefoot { margin-top: auto; color: var(--muted); font-size: ${t.font.size.sm}px; }
.content { flex: 1; padding: ${t.space[6]}px; overflow: auto; }
.content h2:first-child { margin-top: 0; }
html.js-tabs .content section[hidden] { display: none; }
.content section.content-enter { animation: content-slide 0.24s cubic-bezier(0.22,1,0.36,1) both; }
@media (prefers-reduced-motion: reduce) {
  .window { animation: none; }
  nav.side a.active { animation: none; }
  .side-indicator { transition: none; }
  nav.side a, nav.side a .sideicon, .wctl-btn, .title-logout { transition: none; }
  .content section.content-enter { animation: none; }
}
@media (max-width: 720px) {
  body.desktop { padding: 0; }
  .app { flex-direction: column; }
  .sidebar { width: auto; flex-direction: row; flex-wrap: wrap; }
  nav.side { flex-direction: row; flex-wrap: wrap; }
}`;
}

/** Progressive-enhancement tab switching for the desktop content pane. */
const DESKTOP_NAV_SCRIPT = `
document.documentElement.classList.add("js-tabs");
var sections = Array.prototype.slice.call(document.querySelectorAll(".content > section"));
var links = Array.prototype.slice.call(document.querySelectorAll("nav a[data-nav]"));
var indicator = null;
function positionIndicator() {
  var nav = document.querySelector("nav.side");
  if (!nav) return;
  if (!indicator) {
    indicator = document.createElement("span");
    indicator.className = "side-indicator";
    nav.appendChild(indicator);
  }
  var active = nav.querySelector("a.active");
  if (active) {
    var navRect = nav.getBoundingClientRect();
    var aRect = active.getBoundingClientRect();
    indicator.style.top = (aRect.top - navRect.top) + "px";
    indicator.style.height = aRect.height + "px";
  }
}
function show(id) {
  sections.forEach(function (s) {
    var becoming = s.id === id;
    if (becoming && s.hidden) {
      s.hidden = false;
      s.classList.remove("content-enter");
      void s.offsetWidth;
      s.classList.add("content-enter");
    } else if (!becoming) {
      s.hidden = true;
    }
  });
  links.forEach(function (a) {
    var on = a.getAttribute("data-nav") === id;
    a.classList.toggle("active", on);
    if (on) { a.setAttribute("aria-current", "page"); } else { a.removeAttribute("aria-current"); }
  });
  positionIndicator();
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

export interface DesktopOptions {
  readonly theme?: ThemeName;
  readonly userAgent?: string;
  readonly os?: "windows" | "mac" | "linux";
  /** Real per-user screens (defaults to the demo fixtures for the standalone preview). */
  readonly screens?: DemoScreens;
  /** Signed-in user's display name — drives the avatar initial and title-bar identity. */
  readonly displayName?: string;
  /** Active locale, so the title bar can offer a language switch that matches the web/mobile apps. */
  readonly locale?: string;
  /** When true, render the authenticated chrome (logout, language switch, installable PWA). */
  readonly authenticated?: boolean;
}

/** Render the desktop shell as one HTML document (demo fixtures by default, real user data when provided). */
export function renderDesktopDocument(options: DesktopOptions = {}): string {
  const themeName: ThemeName = options.theme ?? "dark";
  const os = options.os ?? "windows";
  const userAgent = options.userAgent ?? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";
  const theme = getTheme(themeName);
  if (options.locale) setLocale(options.locale);
  const authed = options.authenticated ?? false;
  const screens = options.screens ?? buildDemoScreens();

  const sections = screens.nav
    .map(
      (s) =>
        `<section id="${s.id}">${renderScreenBody(s.id, screens, userAgent, "desktop")}</section>`,
    )
    .join("\n");

  const locale = options.locale ?? CURRENT_LOCALE;
  const titleText = `NEXUS — ${label("desktop.title")}`;

  // Authenticated chrome carries a language switch + letter avatar + logout, mirroring
  // the web top bar and mobile app bar; the standalone shell keeps a neutral spacer.
  const nameForInitial = options.displayName || screens.personalization.userAddress || "N";
  const initial = escapeHtml(nameForInitial.trim().charAt(0).toUpperCase() || "N");
  const titleRight = authed
    ? `<div class="title-actions">` +
      `<span class="title-lang"><select class="lang-dropdown" onchange="location.href='?lang='+this.value" aria-label="Language">${SUPPORTED_LOCALES.map((l) => `<option value="${l}"${l === locale ? " selected" : ""}>${l.toUpperCase()}</option>`).join("")}</select></span>` +
      `<div class="avatar-wrap">${renderAvatar(undefined, initial)}</div>` +
      `<button type="button" class="title-logout" id="desk-logout">` +
      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>` +
      `<span>${escapeHtml(label("auth.logout"))}</span></button>` +
      `</div>`
    : `<div class="wctl" style="width:68px"></div>`;

  // Installable-PWA wiring only in the authenticated app (served by the sync server,
  // where /manifest.webmanifest and /sw.js exist); the standalone preview stays a plain file.
  const pwaHead = authed ? `\n<link rel="manifest" href="/manifest.webmanifest" />` : "";
  const authScript = authed
    ? `\n<script>\nif("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").catch(function(){});}\nvar _dl=document.getElementById("desk-logout");if(_dl){_dl.addEventListener("click",function(){fetch("/api/logout",{method:"POST"}).then(function(){location.href="/login";});});}\n</script>`
    : "";

  return `<!doctype html>
<html lang="${locale}" data-theme="${escapeHtml(themeName)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="theme-color" content="${theme.color.bg}" />${pwaHead}
<title>NEXUS Desktop</title>
<style>${renderDesktopStyles(theme)}</style>
<script>${DESKTOP_NAV_SCRIPT}</script>
</head>
<body class="desktop">
<div class="window">
  <div class="titlebar">
    ${renderWindowControls(os)}
    <div class="title">${titleText}</div>
    ${titleRight}
  </div>
<div class="app">
${renderSidebar(theme.color.primary, screens.nav, screens.nav[0]?.id ?? "today")}
<main class="content" id="main">
${sections}
</main>
</div>
</div>
<script>${DESKTOP_NAV_SCRIPT}</script>${authScript}
</body>
</html>`;
}

export const moduleName = "desktop" as const;
export const implemented = true;

export * from "./utils.js";
export * from "./setup.js";
