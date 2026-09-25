import { describe, expect, it } from "vitest";

import { renderMarketingPremiumDocument } from "./marketing-premium.js";
import { renderPremiumBody, type PremiumDynamicParts } from "./marketing-premium-body.js";

const dyn: PremiumDynamicParts = {
  langCode: "EN",
  langMenu:
    '<div class="language-menu" role="menu"><a class="active" href="?lang=en">English</a></div>',
  androidVersion: "Version 3.14.2 · Android 12+",
  iosVersion: "Version 3.14.2 · iOS 17+",
  playHref: "https://play.google.com/store/apps/details?id=ai.nexus.app",
  appStoreHref: "https://apps.apple.com/app/id0000000000",
  apkHref: "/downloads/NEXUS-3.14.2.apk",
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
    expect(body).toContain("Version 3.14.2 · Android 12+");
    expect(body).toContain('href="/downloads/NEXUS-3.14.2.apk"');
    expect(body).toContain('href="https://apps.apple.com/app/id0000000000"');
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
    expect(html).toContain("Get it on Google Play");
    expect(html).not.toContain("NEXUS-Setup");
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
    expect(html).toContain("Get the mobile app");
  });

  it("honors the light theme attribute", () => {
    const html = renderMarketingPremiumDocument("en", "light");
    expect(html).toContain('<html lang="en" data-theme="light">');
    expect(html).toContain('content="#f6f7fb"');
  });
});
