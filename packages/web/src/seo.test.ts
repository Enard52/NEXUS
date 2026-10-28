import { describe, expect, it } from "vitest";
import {
  organizationData,
  renderHead,
  renderManifest,
  renderRobotsTxt,
  renderSitemap,
  structuredData,
  type SeoConfig,
} from "./seo.js";

const CONFIG: SeoConfig = {
  title: "NEXUS AI — Personal OS",
  description: "Voice-first personal operating system.",
  url: "https://nexus-ai.example.com/",
  siteName: "NEXUS AI",
  locale: "en_US",
  alternates: [
    { lang: "en", url: "https://nexus-ai.example.com/" },
    { lang: "tr", url: "https://nexus-ai.example.com/tr/" },
  ],
  image: "https://nexus-ai.example.com/og-cover.png",
  keywords: ["personal AI", "voice assistant"],
  themeColor: "#5b8dff",
  twitterSite: "@nexusai",
};

describe("seo", () => {
  it("renders the primary meta contract", () => {
    const head = renderHead(CONFIG);
    expect(head).toContain("<title>NEXUS AI — Personal OS</title>");
    expect(head).toContain(
      '<meta name="description" content="Voice-first personal operating system." />',
    );
    expect(head).toContain('<meta name="robots" content="index,follow" />');
    expect(head).toContain('<link rel="canonical" href="https://nexus-ai.example.com/" />');
    expect(head).toContain('<meta name="theme-color" content="#5b8dff" />');
  });

  it("renders Open Graph and Twitter Card tags with the image", () => {
    const head = renderHead(CONFIG);
    expect(head).toContain('<meta property="og:type" content="website" />');
    expect(head).toContain('<meta property="og:title" content="NEXUS AI — Personal OS" />');
    expect(head).toContain(
      '<meta property="og:image" content="https://nexus-ai.example.com/og-cover.png" />',
    );
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(head).toContain('<meta name="twitter:site" content="@nexusai" />');
  });

  it("emits hreflang alternates plus an x-default", () => {
    const head = renderHead(CONFIG);
    expect(head).toContain(
      '<link rel="alternate" hreflang="en" href="https://nexus-ai.example.com/" />',
    );
    expect(head).toContain(
      '<link rel="alternate" hreflang="tr" href="https://nexus-ai.example.com/tr/" />',
    );
    expect(head).toContain('hreflang="x-default"');
  });

  it("falls back to summary card and no keywords when absent", () => {
    const head = renderHead({
      title: "T",
      description: "D",
      url: "https://x.test/",
      siteName: "X",
      locale: "en_US",
    });
    expect(head).toContain('<meta name="twitter:card" content="summary" />');
    expect(head).not.toContain('name="keywords"');
    expect(head).not.toContain("hreflang");
  });

  it("produces valid, escape-safe SoftwareApplication JSON-LD", () => {
    const jsonLd = structuredData(CONFIG);
    expect(jsonLd).toContain('type="application/ld+json"');
    // The raw "<" of a nested tag must be escaped so it cannot break out.
    expect(jsonLd).not.toMatch(/<\/script>\s*"/);
    const body = jsonLd.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    const parsed = JSON.parse(body.replace(/\\u003c/g, "<"));
    expect(parsed["@type"]).toBe("SoftwareApplication");
    expect(parsed.offers.price).toBe("0");
    expect(parsed.operatingSystem).toContain("Windows");
  });

  it("generates a valid sitemap with loc/priority", () => {
    const xml = renderSitemap([
      { url: "https://x.test/", lastmod: "2026-07-23", changefreq: "weekly", priority: 1 },
    ]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<loc>https://x.test/</loc>");
    expect(xml).toContain("<priority>1.0</priority>");
    expect(xml).toContain("<changefreq>weekly</changefreq>");
  });

  it("generates robots.txt that points at the sitemap", () => {
    const txt = renderRobotsTxt("https://x.test/sitemap.xml");
    expect(txt).toContain("User-agent: *");
    expect(txt).toContain("Allow: /");
    expect(txt).toContain("Sitemap: https://x.test/sitemap.xml");
  });

  it("emits Organization and WebSite JSON-LD", () => {
    const jsonLd = organizationData(CONFIG);
    expect(jsonLd).toContain('"@type": "Organization"');
    expect(jsonLd).toContain('"@type": "WebSite"');
    expect(jsonLd).toContain('"logo": "https://nexus-ai.example.com/og-cover.png"');
    // The multilingual site advertises its languages.
    const site = jsonLd.slice(jsonLd.indexOf("WebSite"));
    expect(site).toContain('"tr"');
  });

  it("includes both software and organization graphs in the head", () => {
    const head = renderHead(CONFIG);
    expect(head).toContain("SoftwareApplication");
    expect(head).toContain("Organization");
    expect(head).toContain("WebSite");
  });

  it("generates an installable web app manifest", () => {
    const manifest = JSON.parse(
      renderManifest({
        name: "NEXUS AI",
        shortName: "NEXUS",
        description: "Voice-first personal OS.",
        themeColor: "#5b8dff",
        backgroundColor: "#0e0f12",
        iconPath: "icon.svg",
      }),
    );
    expect(manifest.name).toBe("NEXUS AI");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#5b8dff");
    expect(manifest.icons[0].src).toBe("icon.svg");
    expect(manifest.icons[0].purpose).toContain("maskable");
  });
});
