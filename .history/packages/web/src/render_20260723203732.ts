/**
 * NEXUS AI — Web render helpers (FAZ 9/10/18)
 *
 * Pure HTML-rendering functions used by the web, desktop and mobile front ends.
 * Every function is a deterministic `data -> string` transformation so it can
 * be unit tested without a DOM or browser.
 */

import { type Theme } from "@nexus/design-system";
import { type VersionInfoService } from "@nexus/infra";
import {
  type BillingModel,
  type DeviceListModel,
  type FamilyModel,
  type HomeStateModel,
  type NavItem,
  type PersonalizationModel,
  type SkillsModel,
  type SuggestionsModel,
  type TodayModel,
  type ScreenId,
} from "@nexus/interface";

// ── Locale ────────────────────────────────────────────────────────────────

export let CURRENT_LOCALE: string = "en";

export function setLocale(locale: string): void {
  CURRENT_LOCALE = locale;
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """)
    .replace(/'/g, "&#39;");
}

export function faviconDataUri(primaryColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${primaryColor}"/><text x="16" y="22" font-size="18" font-weight="bold" text-anchor="middle" fill="white">N</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ── Styles ────────────────────────────────────────────────────────────────

export function renderStyles(theme: Theme): string {
  return `:root {
  --bg: ${theme.color.bg};
  --fg: ${theme.color.fg};
  --primary: ${theme.color.primary};
  --secondary: ${theme.color.secondary};
  --accent: ${theme.color.accent};
  --muted: ${theme.color.muted};
  --border: ${theme.color.border};
  --radius: ${theme.radius};
  --font: ${theme.font};
  --shadow: ${theme.shadow};
  --transition: ${theme.transition};
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--fg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--primary); text-decoration: none; }
a:hover { text-decoration: underline; }
.skip { position: absolute; top: -100%; left: 0; z-index: 1000; padding: 0.5rem 1rem; background: var(--primary); color: #fff; }
.skip:focus { top: 0; }
.site-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 2rem; border-bottom: 1px solid var(--border); }
.brand { font-size: 1.5rem; font-weight: 700; color: var(--primary); }
.wrap { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.hero { text-align: center; padding: 4rem 1rem; }
.hero h1 { font-size: 3rem; margin-bottom: 1rem; }
.hero p { font-size: 1.25rem; color: var(--muted); margin-bottom: 2rem; }
.hero .btn-group { display: flex; gap: 1rem; justify-content: center; }
.btn { display: inline-block; padding: 0.75rem 1.5rem; border-radius: var(--radius); font-weight: 600; transition: var(--transition); }
.btn-primary { background: var(--primary); color: #fff; }
.btn-secondary { background: transparent; border: 2px solid var(--primary); color: var(--primary); }
nav { display: flex; gap: 0.5rem; padding: 1rem 0; border-bottom: 1px solid var(--border); overflow-x: auto; }
nav a { padding: 0.5rem 1rem; border-radius: var(--radius); white-space: nowrap; }
nav a.active { background: var(--primary); color: #fff; }
main { padding: 2rem 0; }
section { margin-bottom: 3rem; }
section h2 { font-size: 1.75rem; margin-bottom: 1.5rem; }
.bento { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
.bento-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
.bento-grid.wide { grid-template-columns: 1fr; }
.bento-tile { background: var(--secondary); border-radius: var(--radius); padding: 1.5rem; border: 1px solid var(--border); }
.bento-tile.featured { grid-column: span 2; }
.bento-tile.wide { grid-column: 1 / -1; }
.cardicon { display: inline-block; margin-right: 0.5rem; }
.ring { width: 60px; height: 60px; }
.assistant-strip { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--secondary); border-radius: var(--radius); margin-top: 1rem; }
.nudge { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--accent); margin-left: 0.5rem; }
.room-card { background: var(--secondary); border-radius: var(--radius); padding: 1rem; border: 1px solid var(--border); }
.device-pill { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: var(--secondary); border-radius: var(--radius); border: 1px solid var(--border); }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.on { background: #4caf50; }
.dot.off { background: #f44336; }
.suggest-card { background: var(--secondary); border-radius: var(--radius); padding: 1rem; border: 1px solid var(--border); }
.skill-bar-wrap { background: var(--secondary); border-radius: var(--radius); padding: 1rem; border: 1px solid var(--border); }
.member-card { background: var(--secondary); border-radius: var(--radius); padding: 1rem; border: 1px solid var(--border); }
.plan-card { background: var(--secondary); border-radius: var(--radius); padding: 1.5rem; border: 1px solid var(--border); }
.field-row { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border); }
.features { padding: 4rem 0; }
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }
.feature-card { text-align: center; padding: 2rem; }
.feature-card h3 { margin-bottom: 0.5rem; }
.faq { padding: 4rem 0; }
.faq details { margin-bottom: 1rem; padding: 1rem; background: var(--secondary); border-radius: var(--radius); }
