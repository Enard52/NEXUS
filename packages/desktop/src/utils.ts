/**
 * NEXUS AI — Desktop UI Utilities (Section 0 — circular-import fix)
 *
 * Shared primitives used by both the main desktop shell (index.ts) and the
 * setup wizard (setup.ts). Extracted here so neither file needs to import
 * from the other, eliminating the circular dependency.
 */

/** Premium monochrome window controls (minimize / maximize / close). Decorative. */
export function renderWindowControls(os: "windows" | "mac" = "windows"): string {
  if (os === "mac") {
    const dot = (color: string) => `<circle cx="6" cy="6" r="6" fill="${color}"/>`;
    return (
      `<div class="wctl" style="gap: 8px; margin-right: auto;" aria-hidden="true">` +
      `<svg width="12" height="12">${dot("#ff5f56")}</svg>` +
      `<svg width="12" height="12">${dot("#ffbd2e")}</svg>` +
      `<svg width="12" height="12">${dot("#27c93f")}</svg>` +
      `</div>`
    );
  }
  const btn = (path: string, cls = ""): string =>
    `<span class="wctl-btn${cls ? " " + cls : ""}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" ` +
    `stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg></span>`;
  return (
    `<div class="wctl" aria-hidden="true">` +
    btn(`<path d="M5 12h14"/>`) +
    btn(`<rect x="5" y="5" width="14" height="14" rx="2"/>`) +
    btn(`<path d="M6 6l12 12M18 6 6 18"/>`, "close") +
    `</div>`
  );
}

/** Sidebar nav glyphs, keyed by screen id — dependency-free currentColor line art. */
export const SIDE_ICON: Record<string, string> = {
  today: `<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>`,
  "home-state": `<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/>`,
  suggestions: `<path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.1V17h6v-1.4c0-.8.4-1.5 1-2.1A6 6 0 0 0 12 3ZM9 20h6"/>`,
  skills: `<path d="m12 3 2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5Z"/>`,
  devices: `<rect x="2" y="4" width="14" height="10" rx="1.5"/><rect x="16" y="9" width="6" height="11" rx="1.5"/>`,
  family: `<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20a6 6 0 0 1 12 0M15 20a5 5 0 0 1 7 0"/>`,
  personalization: `<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>`,
  billing: `<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>`,
  "download-center": `<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>`,
};

export function renderSideIcon(id: string): string {
  return (
    `<svg class="sideicon" width="18" height="18" viewBox="0 0 24 24" role="img" aria-hidden="true" ` +
    `fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ` +
    `stroke-linejoin="round">${SIDE_ICON[id] ?? SIDE_ICON.today}</svg>`
  );
}
