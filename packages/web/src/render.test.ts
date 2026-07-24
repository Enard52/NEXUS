import { describe, expect, it } from "vitest";
import { darkTheme } from "@nexus/design-system";
import {
  buildTodayModel,
  buildDeviceListModel,
  buildSuggestionsModel,
  buildSkillsModel,
  buildFamilyModel,
  buildBillingModel,
  buildPersonalizationModel,
  buildHomeStateModel,
} from "@nexus/interface";
import {
  demoReleases,
  escapeHtml,
  moduleName,
  renderAppIconSvg,
  renderDemoDocument,
  renderDownloadCenter,
  renderFeatures,
  renderHero,
  renderOgImageSvg,
  renderStyles,
  renderTodayPanel,
  renderHomeState,
  renderDevices,
  renderSuggestions,
  renderSkills,
  renderFamily,
  renderBilling,
  renderPersonalization,
} from "./index.js";

describe("@nexus/web renderer", () => {
  it("exposes its module identity", () => {
    expect(moduleName).toBe("web");
  });

  it("escapes untrusted text", () => {
    expect(escapeHtml('<img src=x onerror="1">')).toBe("&lt;img src=x onerror=&quot;1&quot;&gt;");
  });

  it("drives styles from the design tokens (no hardcoded brand colors)", () => {
    const css = renderStyles(darkTheme);
    expect(css).toContain(`--bg: ${darkTheme.color.bg};`);
    expect(css).toContain(`--primary: ${darkTheme.color.primary};`);
  });

  it("renders a valid, themed HTML document with the core surfaces", () => {
    const html = renderDemoDocument({ theme: "dark" });
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('data-theme="dark"');
    // The brand mark is NEXUS; the AI assistant is referenced as "NEXUS AI".
    expect(html).toContain("NEXUS AI");
    // Today dashboard energy card is computed from 2720 Wh → 2.72 kWh.
    expect(html).toContain("2.72 kWh");
    // Premium stat cards carry an icon chip alongside the value.
    expect(html).toContain('<span class="cardicon">');
    // Navigation is access-filtered: family admin sees the Family screen.
    expect(html).toContain(">Family<");
  });

  it("renders every main screen as its own anchored section", () => {
    const html = renderDemoDocument({ theme: "dark" });
    for (const id of [
      "today",
      "home-state",
      "suggestions",
      "skills",
      "devices",
      "family",
      "personalization",
      "billing",
      "download-center",
    ]) {
      expect(html).toContain(`<section id="${id}">`);
    }
    // Skills are ordered most-used first (88× before 31×).
    expect(html.indexOf("88&times;")).toBeLessThan(html.indexOf("31&times;"));
    // Family admin badge and a suggestion action are present.
    expect(html).toContain(">admin<");
    expect(html).toContain(">Accept<");
  });

  it("ships accessible semantic landmarks, a brand mark, and a footer", () => {
    const html = renderDemoDocument({ theme: "dark" });
    expect(html).toContain('<header class="site-header">');
    expect(html).toContain('<main id="main">');
    expect(html).toContain('<nav class="web-nav" aria-label="Primary">');
    expect(html).toContain('<footer class="footer">');
    // Brand mark is an inline SVG (no external asset needed).
    expect(html).toContain('aria-label="NEXUS logo"');
    // The brand wordmark is a span so the hero can own the single <h1>.
    expect(html).toContain('<span class="brand">NEXUS</span>');
    // Exactly one <h1> on the page (SEO/a11y heading hierarchy).
    expect(html.match(/<h1[ >]/g)?.length).toBe(1);
    // Progressive enhancement: nav carries data hooks + interactive script.
    expect(html).toContain('data-nav="today"');
    expect(html).toContain("js-tabs");
  });

  it("renders a keyword-rich marketing hero and feature cards", () => {
    const hero = renderHero();
    expect(hero).toContain('<section class="hero">');
    expect(hero).toMatch(/<h1>[^<]+<\/h1>/);
    expect(hero).toContain('href="#download-center"');
    expect(hero).toContain('href="#today"');

    const features = renderFeatures();
    expect(features).toContain('<section class="features"');
    expect(features).toContain('class="feature-grid"');
    // Four benefit pillars, each with its own subheading.
    expect(features.match(/<h3>/g)?.length).toBe(4);
    expect(features).toContain("Voice-first control");
    expect(features).toContain("Private by design");

    // The hero + features live in the full document, hero above nav.
    const html = renderDemoDocument({ theme: "dark" });
    expect(html.indexOf('class="hero"')).toBeLessThan(html.indexOf("<nav"));
    expect(html.indexOf('class="features"')).toBeGreaterThan(html.indexOf("</main>"));
  });

  it("embeds the SEO head: description, canonical, OG, and JSON-LD", () => {
    const html = renderDemoDocument({ theme: "dark" });
    expect(html).toContain('<meta name="description"');
    expect(html).toContain('<link rel="canonical"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain("SoftwareApplication");
    // Favicon is inlined as a data URI.
    expect(html).toContain('rel="icon" href="data:image/svg+xml,');
    // The Home screen groups devices by room (Living room has 2 devices).
    expect(html).toContain(">Living room<");
  });

  it("links the PWA manifest, apple-touch-icon, OG image, and a skip link", () => {
    const html = renderDemoDocument({ theme: "dark" });
    expect(html).toContain('<link rel="manifest" href="manifest.webmanifest" />');
    expect(html).toContain('<link rel="apple-touch-icon" href="icon.svg" />');
    // og:image points at a real, deployable raster asset (not a dangling ref).
    expect(html).toContain(
      'property="og:image" content="https://nexus-ai.example.com/og-cover.png"',
    );
    // Accessibility: keyboard users can skip straight to the content.
    expect(html).toContain('<a class="skip" href="#main">Skip to content</a>');
    expect(html).toContain('<main id="main">');
  });

  it("renders a valid branded OG cover and app icon SVG", () => {
    const cover = renderOgImageSvg(darkTheme);
    expect(cover.startsWith("<svg")).toBe(true);
    expect(cover).toContain('width="1200" height="630"');
    expect(cover).toContain(">NEXUS</text>");
    expect(cover).toContain(darkTheme.color.primary);

    const icon = renderAppIconSvg(darkTheme.color.primary);
    expect(icon).toContain('viewBox="0 0 512 512"');
    expect(icon).toContain(darkTheme.color.primary);
  });

  it("features the visitor's platform and lists verifiable checksums", () => {
    const svc = demoReleases();
    const win = renderDownloadCenter(svc, "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    expect(win).toContain("Download for Windows");
    // The real SHA-256 checksum is present, never blank/hardcoded.
    expect(win).toContain(svc.get("windows")!.checksumSha256);

    const mac = renderDownloadCenter(svc, "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)");
    expect(mac).toContain("Download for macOS");
  });

  it("falls back to manual choice for an unknown platform", () => {
    const svc = demoReleases();
    const unknown = renderDownloadCenter(svc, "curl/8.0");
    expect(unknown).toContain("Choose your platform");
  });
});

describe("renderTodayPanel — in-app bento dashboard", () => {
  function makeTodayModel(pendingSuggestions = 2) {
    return buildTodayModel({
      devicesOnline: 3,
      devicesTotal: 4,
      energyWhToday: 1500,
      activeRoutines: 5,
      pendingSuggestions,
    });
  }

  it("renders a bento grid container", () => {
    const html = renderTodayPanel(makeTodayModel());
    expect(html).toContain('<div class="bento">');
  });

  it("renders the featured tile with devices ring SVG", () => {
    const html = renderTodayPanel(makeTodayModel());
    expect(html).toContain('class="bento-tile featured"');
    expect(html).toContain('<svg class="ring"');
    expect(html).toContain("% online");
  });

  it("renders energy wide tile, routines tile and suggestions tile", () => {
    const html = renderTodayPanel(makeTodayModel());
    expect(html).toContain('class="bento-tile wide"');
    expect(html).toContain("kWh");
  });

  it("renders the NEXUS AI assistant strip", () => {
    const html = renderTodayPanel(makeTodayModel());
    expect(html).toContain('class="assistant-strip"');
    expect(html).toContain("NEXUS AI");
    expect(html).toContain('data-nav="suggestions"');
  });

  it("shows nudge dot when there are pending suggestions", () => {
    const html = renderTodayPanel(makeTodayModel(3));
    expect(html).toContain('<span class="nudge"');
    expect(html).toContain("suggestions ready for you");
  });

  it("hides nudge dot when no suggestions are pending", () => {
    const html = renderTodayPanel(makeTodayModel(0));
    expect(html).not.toContain('<span class="nudge"');
    expect(html).toContain("You're all caught up.");
  });

  it("landing-page renderToday is unaffected (still uses cards layout)", () => {
    // renderDemoDocument internally calls renderToday (landing path) — the
    // bento change must NOT break the existing card-based landing layout.
    const doc = renderDemoDocument({ theme: "dark" });
    expect(doc).toContain('<span class="cardicon">');
    // The demo document still contains the original card grid (landing).
    expect(doc).toContain("2.72 kWh");
  });
});

describe("bento layout screen renderers (Section E)", () => {
  it("renderHomeState renders room-card bento grid", () => {
    const model = buildHomeStateModel([{ room: "living", online: true }]);
    const html = renderHomeState(model);
    expect(html).toContain('<div class="bento-grid">');
    expect(html).toContain('class="room-card"');
    expect(html).toContain("1/1 devices online");
  });

  it("renderDevices renders device-pill bento tile grid", () => {
    const model = buildDeviceListModel([{ id: "d1", nameKey: "Living Room TV", online: true }]);
    const html = renderDevices(model);
    expect(html).toContain('<div class="bento-grid">');
    expect(html).toContain('class="device-pill"');
    expect(html).toContain('class="dot on"');
  });

  it("renderSuggestions renders suggest-card bento grid", () => {
    const model = buildSuggestionsModel([{ id: "s1", textKey: "sug.text", at: "14:00" }]);
    const html = renderSuggestions(model);
    expect(html).toContain('<div class="bento-grid">');
    expect(html).toContain('class="suggest-card"');
    expect(html).toContain("Accept");
  });

  it("renderSkills renders skill-bar-wrap inside bento grid", () => {
    const model = buildSkillsModel([{ id: "sk1", nameKey: "Weather", usageCount: 50 }]);
    const html = renderSkills(model);
    expect(html).toContain('<div class="bento-grid wide">');
    expect(html).toContain('class="skill-bar-wrap"');
    expect(html).toContain('style="width: 100%"');
  });

  it("renderFamily renders member-card bento grid", () => {
    const model = buildFamilyModel([{ id: "m1", nameKey: "Alice", role: "admin" }]);
    const html = renderFamily(model);
    expect(html).toContain('<div class="bento-grid">');
    expect(html).toContain('class="member-card"');
    expect(html).toContain("admin");
  });

  it("renderBilling renders plan-card bento grid", () => {
    const model = buildBillingModel("premium");
    const html = renderBilling(model);
    expect(html).toContain('<div class="bento-grid wide">');
    expect(html).toContain('class="plan-card"');
    expect(html).toContain("Premium");
  });

  it("renderPersonalization renders field-row inside bento grid", () => {
    const model = buildPersonalizationModel({
      assistantName: "NEXUS AI",
      language: "en-US",
      userAddress: "Ensar",
    });
    const html = renderPersonalization(model);
    expect(html).toContain('class="field-row"');
    expect(html).toContain("NEXUS AI");
  });
});
