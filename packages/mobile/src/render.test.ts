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

  it("renders a phone frame with a status bar and Tuya-style chrome", () => {
    const html = renderMobileDocument({ theme: "dark" });
    expect(html).toContain('<body class="mobile">');
    expect(html).toContain('<div class="phone">');
    expect(html).toContain('<header class="appbar">');
    // The app bar carries the brand (logo + wordmark) on the left and the
    // AI orb + profile avatar on the right.
    expect(html).toContain('aria-label="NEXUS logo"');
    expect(html).toContain('<span class="apptitle">NEXUS</span>');
    expect(html).toContain('class="m-profile" type="button" data-nav="profile"');
    expect(html).toContain('<span class="avatar"');
    expect(html).toContain('class="ai-orb" type="button" data-nav="assistant"');
    expect(renderStatusBar()).toContain('class="statusbar');
    expect(renderStatusBar()).toContain('aria-hidden="true"');
    expect(renderStatusBar()).toContain(">9:41<");
  });

  it("renders a four-tab bottom bar (Home/Smart/Discover/Profile)", () => {
    const bar = renderTabBar("home");
    expect(bar).toContain('<nav class="tabbar" aria-label="Primary">');
    // The active tab is marked for a11y + styling.
    expect(bar).toContain('data-nav="home"');
    expect(bar).toContain('aria-current="page"');
    // Only the four Tuya-style destinations sit on the tab bar.
    for (const id of ["home", "smart", "discover", "profile"]) {
      expect(bar).toContain(`data-nav="${id}"`);
    }
    // Legacy/admin-like entries never sit on the primary tab bar.
    for (const id of ["rooms", "devices", "automations", "billing", "more", "today"]) {
      expect(bar).not.toContain(`data-nav="${id}"`);
    }
    // Icons are inline SVGs.
    expect(renderTabIcon("home")).toContain("<svg");
    expect(renderTabIcon("smart")).toContain("<svg");
    expect(renderTabIcon("discover")).toContain("<svg");
    expect(renderTabIcon("profile")).toContain("<svg");
  });

  it("renders the four tab sections plus the assistant and settings screens", () => {
    const html = renderMobileDocument({ theme: "dark" });
    expect(html).toContain('<main class="screen" id="main">');
    for (const id of ["home", "smart", "discover", "profile", "assistant", "settings"]) {
      expect(html).toContain(`<section id="${id}">`);
    }
    // Secondary account/system surfaces stay reachable behind the Profile hub.
    expect(html).toContain('<section id="billing">');
    // Web-only / admin surfaces are intentionally absent from the phone app.
    expect(html).not.toContain('<section id="download-center">');
    expect(html).not.toContain('<section id="platform">');
    expect(html).not.toContain('<section id="admin-dashboard">');
    // The old dashboard-first sections are recomposed, not rendered standalone.
    expect(html).not.toContain('<section id="today">');
    expect(html).not.toContain('<section id="home-state">');
    expect(html).not.toContain('<section id="rooms">');
    expect(html).not.toContain('<section id="automations">');
    expect(html).not.toContain('<section id="more">');
    // Home composes the glossy favourites grid from the real Today model.
    expect(html).toContain('class="fav-grid"');
    expect(html).toContain('class="fav-ico bg-green"');
    expect(html).toContain("2.72 kWh");
    // Device cards carry the real room + live state and an iOS toggle.
    expect(html).toContain('class="device-card"');
    expect(html).toContain("Living room");
    expect(html).toContain('class="tgl" type="button" data-toggle');
    // Each device card opens its own detail screen (specs + energy analysis).
    expect(html).toContain('data-nav="device-lamp"');
    expect(html).toContain('<section id="device-lamp">');
    expect(html).toContain("192.168.1.104");
  });

  it("keeps every interactive surface real (toggles, runs, suggestions)", () => {
    const html = renderMobileDocument({ theme: "dark" });
    // Device tiles reflect real online state and flip locally.
    expect(html).toContain("data-toggle");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
    // Routines/scenes run with feedback; suggestions can be accepted/dismissed.
    expect(html).toContain("data-run");
    expect(html).toContain("data-accept");
    expect(html).toContain("data-dismiss");
    // Run feedback is icon-only — the legacy "… → ✓" label swap is gone.
    expect(html).not.toContain("data-running=");
    // Usage counters no longer clutter the automation / quick-command rows.
    expect(html).not.toContain("runs</span>");
    // Smart tab: AI command bar + grouped menu rows are real controls.
    expect(html).toContain('class="ai-bar"');
    expect(html).toContain('class="menu-list"');
    expect(html).toContain('class="menu-row"');
    // Discover tab: glossy feature tiles come from the real skills/agents models.
    expect(html).toContain('class="fav-tile"');
    // The assistant entry points are real navigation targets.
    expect(html).toContain('class="fav-tile" href="#assistant" data-nav="assistant"');
    // Profile: gradient identity card over the menu-list hub rows.
    expect(html).toContain('class="profile-id"');
    expect(html).toContain('class="field-row"');
    // Smart tab hosts the reference "Smart App" empty-state card.
    expect(html).toContain('class="empty-app"');
    expect(html).toContain('class="btn-create" type="button" data-nav="assistant"');
    // Billing is a mobile-native plan hero, not the web comparison tables.
    expect(html).toContain('class="plan-hero"');
    // No fake badge metrics survive from the old More drawer.
    expect(html).not.toContain(">140 MB<");
    expect(html).not.toContain(">LIVE<");
    expect(html).not.toContain(">PRO<");
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
    // Tuya-style glossy control surfaces: fav tiles, device cards, menus, AI orb + bar.
    expect(css).toContain(".fav-grid");
    expect(css).toContain(".fav-ico");
    expect(css).toContain(".device-card");
    expect(css).toContain(".tgl");
    expect(css).toContain(".menu-list");
    expect(css).toContain(".profile-id");
    expect(css).toContain(".ai-orb");
    expect(css).toContain(".ai-bar");
    expect(css).toContain(".mic-hero");
    expect(css).toContain(".logout-btn");
    expect(css).toContain(".detail-hero");
    expect(css).toContain(".plan-hero");
    expect(css).toContain(".empty-app");
  });

  it("renders the premium redesign: scene cards, routine flows, device controls", () => {
    const html = renderMobileDocument({ theme: "dark" });
    // Home hero — glass summary card above the favourites grid.
    expect(html).toContain('class="hero-card"');
    // Scenes — themed gradient cards on a 2-col grid (data-run flow kept).
    expect(html).toContain('class="scene-grid"');
    expect(html).toContain("scene-card");
    expect(html).toContain("--sc-grad:linear-gradient(135deg");
    // Routines — flow cards: trigger badge → action summary + toggle/run.
    expect(html).toContain('class="routine-card"');
    expect(html).toContain('class="rc-trigger"');
    // Device detail — type-specific controls: sliders, segments, dial, lock.
    expect(html).toContain('class="detail-controls"');
    expect(html).toContain('type="range"');
    expect(html).toContain("data-slider");
    expect(html).toContain("data-set");
    expect(html).toContain('class="dial-arc"');
    expect(html).toContain("data-lockbig");
  });

  it("renders the subscription-management and device-pairing screens", () => {
    const html = renderMobileDocument({ theme: "dark" });
    // Billing links into the native subscription-management screen.
    expect(html).toContain('<section id="billing-manage">');
    expect(html).toContain('data-nav="billing-manage"');
    expect(html).toContain('class="plan-cmp"');
    expect(html).toContain("•••• 4242");
    expect(html).toContain("data-cancel");
    // Home's "+" opens the pairing screen: brand grid + protocols + LAN scan.
    expect(html).toContain('<section id="add-device">');
    expect(html).toContain('data-nav="add-device"');
    expect(html).toContain('class="brand-grid"');
    expect(html).toContain("Philips Hue");
    expect(html).toContain("data-scan");
    expect(html).toContain("data-scan-results");
  });

  it("keeps agents on mobile but drops web-only admin surfaces (R5.1)", () => {
    expect(renderTabIcon("agents")).toContain("<svg");
    expect(renderTabIcon("agents")).toContain('<circle cx="12" cy="5"');

    const html = renderMobileDocument({ theme: "dark", authenticated: true });
    // User feedback: admin panel, platform hub and download center are web-only.
    expect(html).not.toContain('data-nav="platform"');
    expect(html).not.toContain('data-nav="admin-dashboard"');
    expect(html).not.toContain('data-nav="download-center"');
    // The authenticated Settings screen offers a real logout button.
    expect(html).toContain('id="m-logout-row"');
  });

  it("uses a unified layout for agent cards without text-only rows", () => {
    const html = renderMobileDocument({ theme: "dark" });
    // Agent cards are unified: no separate textual description row.
    expect(html).not.toContain('class="ag-desc"');
    // All agent rows are rendered consistently with toggles.
    expect(html).toContain('class="menu-row agent-card"');
    expect(html).toContain('class="ag-badge active"');
  });

  it("removes product avatar fallbacks and relies on real images", () => {
    const html = renderMobileDocument({ theme: "dark" });
    // Product photo should not have an onerror fallback.
    expect(html).not.toMatch(/class="dev-photo"[^>]*onerror="this\.remove\(\)"/);
    // Brand slug / dev-logo fallbacks are gone.
    expect(html).not.toContain('class="dev-logo"');
  });

  it("removes separate run buttons from automation cards in favor of toggles", () => {
    const html = renderMobileDocument({ theme: "dark" });
    // Verify routine-card does not have btn-run
    expect(html).toContain('<div class="rc-side"><button class="tgl"');
    expect(html).not.toContain('<div class="rc-side"><button class="tgl" type="button" data-toggle aria-pressed="true" aria-label="Morning"></button><button class="btn-run"');
  });

  it("defaults to the iOS shell and supports the Android variant (R6.2)", () => {
    const iosBar = renderStatusBar("ios");
    expect(iosBar).toContain("statusbar-ios");
    expect(iosBar).toContain("dynamic-island");
    expect(iosBar).toContain("9:41");

    const androidBar = renderStatusBar("android");
    expect(androidBar).toContain("statusbar-android");
    expect(androidBar).toContain("punch-hole");
    expect(androidBar).toContain("10:00");
    expect(androidBar).toContain("5G");

    // iOS-first: the document defaults to the iOS status chrome.
    const defaultDoc = renderMobileDocument({ theme: "dark" });
    expect(defaultDoc).toContain("statusbar-ios");

    const html = renderMobileDocument({ theme: "dark", platform: "android" });
    expect(html).toContain("statusbar-android");
    expect(html).toContain("punch-hole");
  });
});
