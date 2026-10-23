/**
 * NEXUS AI — Web demo generator
 *
 * Writes the rendered demo pages to `packages/web/dist/` so the design can be
 * opened in a browser. Run with: `pnpm --filter @nexus/web build:demo`.
 * Pure output of {@link renderDemoDocument}; no server or bundler required.
 */

import { cpSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
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
import { OAUTH_PROVIDERS } from "../../server/src/oauth.js";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "dist");
mkdirSync(outDir, { recursive: true });

// Copy self-hosted font files to dist so the static server can serve them.
const fontsSource = join(here, "..", "..", "..", "public", "fonts");
const fontsDest = join(outDir, "fonts");
cpSync(fontsSource, fontsDest, { recursive: true });
const imagesSource = join(here, "..", "..", "..", "public", "images");
if (existsSync(imagesSource)) {
  const imagesDest = join(outDir, "images");
  cpSync(imagesSource, imagesDest, { recursive: true });
}
// Raster social card (og:image needs PNG); rendered from og-cover.svg.
const ogPng = join(here, "..", "assets", "og-cover.png");
if (existsSync(ogPng)) cpSync(ogPng, join(outDir, "og-cover.png"));
// eslint-disable-next-line no-console
if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  console.log("copied public/fonts → dist/fonts");
  if (existsSync(imagesSource)) console.log("copied public/images → dist/images");
}

// Static hosting has no server to read Accept-Language, so each page carries a tiny
// script: a visitor's own choice (?lang= or the language menu) is remembered; with no
// choice, visitors from the Turkic world (TR, TRNC, AZ, KZ, UZ, KG, TM — by browser
// language, language region or time zone) are sent to /tr/, everyone else stays on
// English. Turkish pages never redirect away on detection alone (keeps /tr/ indexable).
const LANG_SCRIPT = `<script>(function(){try{var L=location,p=L.pathname,tr=/^\\/tr(\\/|$)/.test(p);
var q=new URLSearchParams(L.search).get("lang"),s=null;try{s=localStorage.getItem("nx-lang")}catch(e){}
if(q==="tr"||q==="en"){s=q;try{localStorage.setItem("nx-lang",q)}catch(e){}}
function d(){var a=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language]).filter(Boolean);
for(var i=0;i<a.length;i++){var x=String(a[i]).replace("_","-").split("-");if(i===0&&/^(tr|az|kk|uz|ky|tk|tt|ba|crh|gag)$/i.test(x[0]))return"tr";
for(var j=1;j<x.length;j++)if(/^(TR|AZ|KZ|UZ|KG|TM)$/i.test(x[j]))return"tr"}
var z="";try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||""}catch(e){}
if(/^(Europe\\/Istanbul|Asia\\/Istanbul|Asia\\/Famagusta|Asia\\/Baku|Asia\\/(Almaty|Qyzylorda|Aqtobe|Aqtau|Atyrau|Oral|Qostanay)|Asia\\/(Tashkent|Samarkand)|Asia\\/Bishkek|Asia\\/(Ashgabat|Ashkhabad)|Turkey)$/.test(z))return"tr";
for(var k=1;k<a.length;k++)if(/^tr$/i.test(String(a[k]).split(/[-_]/)[0]))return"tr";return"en"}
if(!s&&tr)return;var w=s||d();var f=p.replace(/^\\/tr(\\/|$)/,"/").replace(/^\\/+/,"");if(f==="index.html")f="";
var t=(w==="tr"?"/tr/":"/")+f;if(t!==p&&!(t+"index.html"===p))L.replace(t+L.hash)}catch(e){}})();</script>`;
function withLang(html: string): string {
  return html.replace(/<head>/i, "<head>\n" + LANG_SCRIPT);
}

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
    writeFileSync(join(locDir, page.file), withLang(html), "utf8");
    // eslint-disable-next-line no-console
    console.log(
      `wrote ${join(loc === "en" ? "dist" : "dist/" + loc, page.file)} (${html.length} bytes, ${page.theme} theme)`,
    );
  }

  // Legal pages
  for (const legalPage of ["privacy", "terms"] as const) {
    const html = renderLegalPage(loc, "dark", legalPage);
    writeFileSync(join(locDir, `${legalPage}.html`), withLang(html), "utf8");
    // eslint-disable-next-line no-console
    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production")
      console.log(`wrote ${join(loc === "en" ? "dist" : "dist/" + loc, legalPage + ".html")}`);
  }

  // Login page
  const loginHtml = renderLoginDocument(loc, { theme: "dark", providers: OAUTH_PROVIDERS });
  writeFileSync(join(locDir, "login.html"), withLang(loginHtml), "utf8");
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
  writeFileSync(join(locDir, "about.html"), withLang(aboutHtml), "utf8");
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
