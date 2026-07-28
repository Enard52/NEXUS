import { describe, expect, it } from "vitest";

import { renderMarketingPremiumDocument } from "./marketing-premium.js";
import { renderPremiumBody, type PremiumDynamicParts } from "./marketing-premium-body.js";

const dyn: PremiumDynamicParts = {
  langCode: "EN",
  langMenu:
    '<div class="language-menu" role="menu"><a class="active" href="?lang=en">English</a></div>',
  winVersion: "Version 3.14.2 · x64",
  macVersion: "Version 3.14.1 · Universal",
  linuxVersion: "Version 3.13.8 · AppImage",
  winHref: "/downloads/NEXUS-Setup-3.14.2.exe",
  macHref: "/downloads/NEXUS-3.14.1.dmg",
  linuxHref: "/downloads/NEXUS-3.13.8.AppImage",
};

describe("premium marketing body (generated)", () => {
  const body = renderPremiumBody(dyn);

  it("contains the premium landmarks", () => {
    expect(body).toContain('id="nav-shell"');
    expect(body).toContain('class="downloads-grid"');
    expect(body).toContain('class="flow-shell flow-shell-v4');
    expect(body).toContain('id="mobile-apps"');
    expect(body).toContain('id="faq"');
  });

  it("has no inline event handlers left", () => {
    expect(body).not.toContain("onerror=");
    expect(body).not.toContain("onclick=");
    expect(body).toContain('addEventListener("error", fail)');
  });

  it("injects the dynamic download parts", () => {
    expect(body).toContain("Version 3.14.2 · x64");
    expect(body).toContain('href="/downloads/NEXUS-3.14.1.dmg"');
    expect(body).toContain('href="/downloads/NEXUS-3.13.8.AppImage"');
  });

  it("does not depend on remote logo or avatar CDNs", () => {
    expect(body).not.toContain("https://cdn.simpleicons.org");
    expect(body).not.toContain("https://images.unsplash.com");
  });
});

describe("renderMarketingPremiumDocument", () => {
  it("renders the full English page with SEO head", () => {
    const html = renderMarketingPremiumDocument("en");
    expect(html).toContain('<html lang="en" data-theme="dark">');
    expect(html).toContain('hreflang="tr" href="/?lang=tr"');
    expect(html).toContain('hreflang="vi" href="/?lang=vi"');
    expect(html).toContain('"@type": "SoftwareApplication"');
    expect(html).toContain("Download for Windows");
    expect(html).not.toContain("https://cdn.simpleicons.org");
    expect(html).not.toContain("https://images.unsplash.com");
  });

  it("renders the Turkish page with an active menu entry", () => {
    const html = renderMarketingPremiumDocument("tr");
    expect(html).toContain('<html lang="tr" data-theme="dark">');
    expect(html).toContain('<a class="active" href="?lang=tr">');
    expect(html).toContain("Philips Hue");
    expect(html).not.toContain("https://cdn.simpleicons.org");
    expect(html).not.toContain("https://images.unsplash.com");
  });

  it("marks RTL locales and keeps EN fallback copy", () => {
    const html = renderMarketingPremiumDocument("ar");
    expect(html).toContain('<html lang="ar" data-theme="dark" dir="rtl">');
    expect(html).toContain("Download desktop app");
  });

  it("honors the light theme attribute", () => {
    const html = renderMarketingPremiumDocument("en", "light");
    expect(html).toContain('<html lang="en" data-theme="light">');
    expect(html).toContain('content="#f6f7fb"');
  });
});
