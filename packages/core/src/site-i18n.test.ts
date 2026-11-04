import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getContent, getSiteLanguages } from "../../../scripts/site-content.mjs";

describe("marketing site multi-language generation (Issue #190)", () => {
  const root = process.cwd();
  const pubDir = join(root, "www", "public");

  it("registers at least en and tr as default site languages", () => {
    const langs = getSiteLanguages();
    expect(langs).toContain("en");
    expect(langs).toContain("tr");
    expect(langs[0]).toBe("en");
  });

  it("provides complete content structure for en and tr", () => {
    const en = getContent("en");
    const tr = getContent("tr");

    expect(en.features.heading).toBe("Powerful infrastructure. Effortless control.");
    expect(tr.features.heading).toBe("Güçlü yerel altyapı. Zahmetsiz kontrol.");

    expect(en.pricing.currencyNote).toBe("Prices in USD");
    expect(tr.pricing.currencyNote).toBe("Fiyatlar TL cinsinden");
  });

  it("falls back gracefully to English with USD pricing for any unregistered language", () => {
    const unk = getContent("unregistered");
    // Deep fallback should provide all keys from English
    expect(unk.features.heading).toBe("Powerful infrastructure. Effortless control.");
    expect(unk.pricing.currencyNote).toBe("Prices in USD");
    expect(unk.footer.rights).toContain("All rights reserved");
  });

  it("provides translated content for community languages like de", () => {
    const de = getContent("de");
    expect(de.features.heading).toBe("Leistungsstarke Infrastruktur. Mühelose Steuerung.");
  });

  it("builds pages for all registered site languages with correct canonical and hreflang tags", () => {
    const langs = getSiteLanguages();

    for (const lang of langs) {
      const isEn = lang === "en";
      const indexHtmlPath = isEn ? join(pubDir, "index.html") : join(pubDir, lang, "index.html");

      expect(existsSync(indexHtmlPath), `${indexHtmlPath} should exist`).toBe(true);
      const html = readFileSync(indexHtmlPath, "utf8");

      // Canonical link must match language
      const expectedCanonical = isEn
        ? "https://nexus-smarthome.pages.dev/"
        : `https://nexus-smarthome.pages.dev/${lang}/`;
      expect(html).toContain(`rel="canonical" href="${expectedCanonical}"`);

      // hreflang alternate links must be present for all registered languages + x-default
      for (const targetLang of langs) {
        expect(html).toContain(`hreflang="${targetLang}"`);
      }
      expect(html).toContain('hreflang="x-default" href="https://nexus-smarthome.pages.dev/"');
    }
  });

  it("sitemap contains all registered language routes", () => {
    const sitemapPath = join(pubDir, "sitemap.xml");
    expect(existsSync(sitemapPath)).toBe(true);
    const sitemap = readFileSync(sitemapPath, "utf8");

    const langs = getSiteLanguages();
    for (const lang of langs) {
      const prefix =
        lang === "en"
          ? "https://nexus-smarthome.pages.dev"
          : `https://nexus-smarthome.pages.dev/${lang}`;
      expect(sitemap).toContain(`<loc>${prefix}/</loc>`);
      expect(sitemap).toContain(`<loc>${prefix}/about</loc>`);
      expect(sitemap).toContain(`<loc>${prefix}/privacy</loc>`);
      expect(sitemap).toContain(`<loc>${prefix}/terms</loc>`);
      expect(sitemap).toContain(`<loc>${prefix}/refund</loc>`);
      expect(sitemap).toContain(`<loc>${prefix}/contribute</loc>`);
      expect(sitemap).toContain(`<loc>${prefix}/code-signing</loc>`);
    }
  });
});
