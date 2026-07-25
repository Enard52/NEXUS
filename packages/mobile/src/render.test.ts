import { describe, expect, it } from "vitest";
import { darkTheme } from "@nexus/design-system";
import {
  moduleName,
  renderMobileDocument,
  renderMobileStyles,
  renderStatusBar,
  renderTabBar,
  renderTabIcon,
} from "./index.js";

describe("@nexus/mobile", () => {
  it("exposes its module identity", () => {
    expect(moduleName).toBe("mobile");
  });

  it("renders a phone frame with a status bar", () => {
    const html = renderMobileDocument({ theme: "dark" });
    expect(html).toContain('<body class="mobile">');
    expect(html).toContain('<div class="phone">');
    expect(html).toContain('<header class="appbar">');
    // The app bar now carries the brand logo and a profile avatar.
    expect(html).toContain('aria-label="NEXUS logo"');
    expect(html).toContain('<span class="avatar"');
    expect(renderStatusBar()).toContain('class="statusbar');
    expect(renderStatusBar()).toContain('aria-hidden="true"');
    expect(renderStatusBar()).toContain(">9:41<");
  });

  it("renders a bottom tab bar with the primary tabs plus More", () => {
    const bar = renderTabBar("today");
    expect(bar).toContain('<nav class="tabbar" aria-label="Primary">');
    // The active tab is marked for a11y + styling.
    expect(bar).toContain('data-nav="today"');
    expect(bar).toContain('aria-current="page"');
    // The primary tabs and the More entry are present.
    for (const id of ["today", "home-state", "devices", "family", "more"]) {
      expect(bar).toContain(`data-nav="${id}"`);
    }
    // Icons are inline SVGs.
    expect(renderTabIcon("today")).toContain("<svg");
  });

  it("renders every screen body plus a More section", () => {
    const html = renderMobileDocument({ theme: "dark" });
    expect(html).toContain('<main class="screen" id="main">');
    expect(html).toContain('<section id="today">');
    expect(html).toContain('<section id="download-center">');
    expect(html).toContain('<section id="more">');
    // The Today dashboard's live data flows through the shared renderer.
    expect(html).toContain("Devices online");
    // Rooms from the Home screen are present too.
    expect(html).toContain(">Living room<");
  });

  it("drives all chrome colors from the design tokens", () => {
    const css = renderMobileStyles(darkTheme);
    expect(css).toContain(`--primary: ${darkTheme.color.primary};`);
    // Reuses the shared component styles (cards) plus mobile-only chrome.
    expect(css).toContain(".phone {");
    expect(css).toContain(".tabbar a.active");
    // The active tab must stay transparent (no leaked web nav-pill background).
    expect(css).toContain(".tabbar a.active { background: transparent;");
    // Glassmorphism header and tabbar styles
    expect(css).toContain("backdrop-filter: blur(20px)");
    expect(css).toContain(".statusbar-android");
  });

  it("renders new tab icons for platform, agents, and admin-dashboard (R5.1)", () => {
    expect(renderTabIcon("platform")).toContain("<svg");
    expect(renderTabIcon("platform")).toContain('<rect x="2" y="3"');
    expect(renderTabIcon("agents")).toContain("<svg");
    expect(renderTabIcon("agents")).toContain('<circle cx="12" cy="5"');
    expect(renderTabIcon("admin-dashboard")).toContain("<svg");

    const html = renderMobileDocument({ theme: "dark", authenticated: true });
    expect(html).toContain('data-nav="platform"');
    expect(html).toContain('data-nav="agents"');
    expect(html).toContain('data-nav="admin-dashboard"');
  });

  it("supports Android status bar variant with punch-hole camera (R6.2)", () => {
    const iosBar = renderStatusBar("ios");
    expect(iosBar).toContain("statusbar-ios");
    expect(iosBar).toContain("dynamic-island");
    expect(iosBar).toContain("9:41");

    const androidBar = renderStatusBar("android");
    expect(androidBar).toContain("statusbar-android");
    expect(androidBar).toContain("punch-hole");
    expect(androidBar).toContain("10:00");
    expect(androidBar).toContain("5G");

    const html = renderMobileDocument({ theme: "dark", platform: "android" });
    expect(html).toContain("statusbar-android");
    expect(html).toContain("punch-hole");
  });
});
