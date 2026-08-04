import { describe, expect, it } from "vitest";
import { darkTheme } from "@nexus/design-system";
import { buildNavigation } from "@nexus/interface";
import {
  moduleName,
  renderDesktopDocument,
  renderDesktopStyles,
  renderSidebar,
  renderWindowControls,
} from "./index.js";

describe("@nexus/desktop", () => {
  it("exposes its module identity", () => {
    expect(moduleName).toBe("desktop");
  });

  it("renders window chrome with neutral window controls and a titled bar", () => {
    const html = renderDesktopDocument({ theme: "dark" });
    expect(html).toContain('<body class="desktop">');
    expect(html).toContain('<div class="window">');
    expect(html).toContain('<div class="titlebar">');
    expect(renderWindowControls()).toContain('<div class="wctl"');
    // The colored macOS traffic lights were replaced with premium monochrome controls.
    expect(renderWindowControls()).not.toContain("tl red");
    expect(html).toContain('<div class="title">NEXUS — Personal Operating System</div>');
  });

  it("renders a sidebar with one nav entry per accessible screen", () => {
    const nav = buildNavigation({ authenticated: true, plan: "family", role: "admin" });
    const sidebar = renderSidebar(darkTheme.color.primary, nav, "today");
    expect(sidebar).toContain('<aside class="sidebar">');
    expect(sidebar).toContain('<nav class="side" aria-label="Primary">');
    // Active screen is marked for a11y + styling.
    expect(sidebar).toContain('data-nav="today"');
    expect(sidebar).toContain('aria-current="page"');
    // Every navigable screen appears as a link.
    for (const s of nav) expect(sidebar).toContain(`data-nav="${s.id}"`);
  });

  it("renders every screen body as a switchable content section", () => {
    const html = renderDesktopDocument({ theme: "dark" });
    expect(html).toContain('<main class="content" id="main">');
    expect(html).toContain('<section id="today">');
    expect(html).toContain('<section id="download-center">');
    // The Today dashboard's live data flows through the shared renderer.
    expect(html).toContain("Devices online");
    // Rooms from the Home screen are present too.
    expect(html).toContain(">Living room<");
  });

  it("drives all chrome colors from the design tokens", () => {
    const css = renderDesktopStyles(darkTheme);
    expect(css).toContain(`--primary: ${darkTheme.color.primary};`);
    // Reuses the shared component styles (cards) plus desktop-only chrome.
    expect(css).toContain(".window {");
    expect(css).toContain("nav.side a.active");
    // Neutral window controls replace the old colored traffic lights.
    expect(css).toContain(".wctl-btn");
  });

  it("renders authenticated chrome (language switch + logout + PWA) when signed in", () => {
    const html = renderDesktopDocument({
      theme: "dark",
      authenticated: true,
      displayName: "Ada Lovelace",
      locale: "en",
    });
    // Language switch mirrors the web top bar / mobile app bar.
    expect(html).toContain('class="title-lang"');
    // Logout control is wired to the shared /api/logout endpoint.
    expect(html).toContain('id="desk-logout"');
    expect(html).toContain("/api/logout");
    // Installable-PWA wiring is present only in the authenticated app.
    expect(html).toContain('rel="manifest"');
    expect(html).toContain("/sw.js");
  });

  it("stays a plain standalone shell (no auth chrome) by default", () => {
    const html = renderDesktopDocument({ theme: "dark" });
    expect(html).not.toContain('id="desk-logout"');
    expect(html).not.toContain('rel="manifest"');
  });

  it("supports Linux GNOME circular window controls (R6.1)", () => {
    const linuxWctl = renderWindowControls("linux");
    expect(linuxWctl).toContain("wctl-gnome");
    expect(linuxWctl).toContain("gnome-btn");

    const html = renderDesktopDocument({ theme: "dark", os: "linux" });
    expect(html).toContain("wctl-gnome");
    expect(html).toContain("gnome-btn");
  });
});
