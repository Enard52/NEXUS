/**
 * NEXUS AI — Theme runtime
 *
 * Maps the shared @nexus/design-system tokens onto CSS custom properties so
 * every component styles itself from the same source of truth as the rest of
 * the product. Persists the user's explicit choice; defaults to the system.
 */

import { getTheme, detectSystemTheme, type ThemeName } from "@nexus/design-system";

const THEME_KEY = "nexus_theme";

export function currentTheme(): ThemeName {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return detectSystemTheme() ?? "dark";
}

export function applyTheme(name: ThemeName): void {
  const tokens = getTheme(name);
  const root = document.documentElement;
  root.setAttribute("data-theme", name);
  const c = tokens.color;
  root.style.setProperty("--bg", c.bg);
  root.style.setProperty("--surface", c.surface);
  root.style.setProperty("--text", c.text);
  root.style.setProperty("--text-muted", c.textMuted);
  root.style.setProperty("--primary", c.primary);
  root.style.setProperty("--on-primary", c.onPrimary);
  root.style.setProperty("--accent", c.accent);
  root.style.setProperty("--radius-sm", `${tokens.radius.sm}px`);
  root.style.setProperty("--radius-md", `${tokens.radius.md}px`);
  root.style.setProperty("--radius-lg", `${tokens.radius.lg}px`);
  root.style.setProperty("--shadow-md", tokens.shadow.md);
  root.style.setProperty("--shadow-lg", tokens.shadow.lg);
  root.style.setProperty("--ring", tokens.shadow.ring);
  root.style.setProperty("--transition-fast", tokens.transition.fast);
  root.style.setProperty("--transition-normal", tokens.transition.normal);
  root.style.setProperty("--font-family", tokens.font.family);
  root.style.setProperty("--font-mono", tokens.font.familyMono);
}

export function setTheme(name: ThemeName): void {
  localStorage.setItem(THEME_KEY, name);
  applyTheme(name);
}
