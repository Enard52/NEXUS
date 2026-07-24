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
