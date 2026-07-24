/**
 * NEXUS AI — Web demo generator
 *
 * Writes the rendered demo pages to `packages/web/dist/` so the design can be
 * opened in a browser. Run with: `pnpm --filter @nexus/web build:demo`.
 * Pure output of {@link renderDemoDocument}; no server or bundler required.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL } from "./index.js";
import { renderAppIconSvg, renderOgImageSvg } from "./render.js";
import { getTheme } from "@nexus/design-system";
import { renderManifest, renderRobotsTxt, renderSitemap } from "./seo.js";
import { renderMarketingDocument } from "../../server/src/pages.js";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "dist");
mkdirSync(outDir, { recursive: true });

const { setLocale } = await import("./render.js");
const pages: ReadonlyArray<{ file: string; theme: "dark" | "light" }> = [
  { file: "index.html", theme: "dark" },
  { file: "light.html", theme: "light" },
];

for (const loc of ["en", "tr"] as const) {
  setLocale(loc);
  const locDir = join(outDir, loc === "en" ? "" : loc);
  mkdirSync(locDir, { recursive: true });
  for (const page of pages) {
    const html = renderMarketingDocument(loc, "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", page.theme);
    writeFileSync(join(locDir, page.file), html, "utf8");
    // eslint-disable-next-line no-console
    console.log(`wrote ${join(loc === "en" ? "dist" : "dist/" + loc, page.file)} (${html.length} bytes, ${page.theme} theme)`);
  }
}

// SEO discovery files, generated from the same canonical origin as the pages.
const today = new Date().toISOString().slice(0, 10);
const sitemap = renderSitemap([
  { url: SITE_URL, lastmod: today, changefreq: "weekly", priority: 1 },
  { url: `${SITE_URL}tr/`, lastmod: today, changefreq: "weekly", priority: 0.9 },
]);
writeFileSync(join(outDir, "sitemap.xml"), sitemap, "utf8");
writeFileSync(join(outDir, "robots.txt"), renderRobotsTxt(`${SITE_URL}sitemap.xml`), "utf8");

// Brand + PWA assets, tinted from the dark theme tokens.
const dark = getTheme("dark");
writeFileSync(join(outDir, "og-cover.svg"), renderOgImageSvg(dark), "utf8");
writeFileSync(join(outDir, "icon.svg"), renderAppIconSvg(dark.color.primary), "utf8");
writeFileSync(
  join(outDir, "manifest.webmanifest"),
  renderManifest({
    name: "NEXUS",
    shortName: "NEXUS",
    description: "Voice-first, privacy-focused personal operating system.",
    themeColor: dark.color.primary,
    backgroundColor: dark.color.bg,
    iconPath: "icon.svg",
  }),
  "utf8",
);
// eslint-disable-next-line no-console
console.log("wrote dist/sitemap.xml, robots.txt, og-cover.svg, icon.svg, manifest.webmanifest");
