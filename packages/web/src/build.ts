/**
 * NEXUS AI — Web demo generator
 *
 * Writes the rendered demo pages to `packages/web/dist/` so the design can be
 * opened in a browser. Run with: `pnpm --filter @nexus/web build:demo`.
 * Pure output of {@link renderDemoDocument}; no server or bundler required.
 */

import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL } from "./index.js";
import { renderAppIconSvg, renderOgImageSvg } from "./render.js";
import { getTheme } from "@nexus/design-system";
import { renderManifest, renderRobotsTxt, renderSitemap } from "./seo.js";
import {
  renderMarketingDocument,
  renderLegalPage,
  renderNotFoundPage,
  renderLoginDocument,
  renderAboutPage,
} from "../../server/src/pages.js";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "dist");
mkdirSync(outDir, { recursive: true });

// Copy self-hosted font files to dist so the static server can serve them.
const fontsSource = join(here, "..", "..", "..", "public", "fonts");
const fontsDest = join(outDir, "fonts");
cpSync(fontsSource, fontsDest, { recursive: true });
// eslint-disable-next-line no-console
if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production")
  console.log("copied public/fonts → dist/fonts");

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
    const html = renderMarketingDocument(
      loc,
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      page.theme,
    );
    writeFileSync(join(locDir, page.file), html, "utf8");
    // eslint-disable-next-line no-console
    console.log(
      `wrote ${join(loc === "en" ? "dist" : "dist/" + loc, page.file)} (${html.length} bytes, ${page.theme} theme)`,
    );
  }

  // Legal pages
  for (const legalPage of ["privacy", "terms"] as const) {
    const html = renderLegalPage(loc, "dark", legalPage);
    writeFileSync(join(locDir, `${legalPage}.html`), html, "utf8");
    // eslint-disable-next-line no-console
    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production")
      console.log(`wrote ${join(loc === "en" ? "dist" : "dist/" + loc, legalPage + ".html")}`);
  }

  // Login page
  const loginHtml = renderLoginDocument(loc, "dark");
  writeFileSync(join(locDir, "login.html"), loginHtml, "utf8");
  if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production")
    console.log(`wrote ${join(loc === "en" ? "dist" : "dist/" + loc, "login.html")}`);

  // 404 page
  const notFound = renderNotFoundPage(loc, "dark");
  writeFileSync(join(locDir, "404.html"), notFound, "utf8");
  // eslint-disable-next-line no-console
  if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production")
    console.log(`wrote ${join(loc === "en" ? "dist" : "dist/" + loc, "404.html")}`);

  // About page
  const aboutHtml = renderAboutPage(loc, "dark");
  writeFileSync(join(locDir, "about.html"), aboutHtml, "utf8");
  if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production")
    console.log(`wrote ${join(loc === "en" ? "dist" : "dist/" + loc, "about.html")}`);
}

// SEO discovery files, generated from the same canonical origin as the pages.
const today = new Date().toISOString().slice(0, 10);
const sitemap = renderSitemap([
  { url: SITE_URL, lastmod: today, changefreq: "weekly", priority: 1 },
  { url: `${SITE_URL}tr/`, lastmod: today, changefreq: "weekly", priority: 0.9 },
  { url: `${SITE_URL}privacy.html`, lastmod: today, changefreq: "monthly", priority: 0.3 },
  { url: `${SITE_URL}terms.html`, lastmod: today, changefreq: "monthly", priority: 0.3 },
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
if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production")
  console.log("wrote dist/sitemap.xml, robots.txt, og-cover.svg, icon.svg, manifest.webmanifest");
