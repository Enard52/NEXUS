// Verifies the freshly built premium static pages and copies web dist → public/
// without touching public/downloads.
// Run after: pnpm --filter @nexus/web build:site
// Usage: node scripts/verify-premium-static.mjs
import { readFileSync, cpSync } from "node:fs";

function check(file, needles, absent = []) {
  const html = readFileSync(file, "utf8");
  const missing = needles.filter((n) => !html.includes(n));
  const present = absent.filter((n) => html.includes(n));
  if (missing.length || present.length) {
    console.error(`FAIL ${file}`, { missing, present });
    process.exitCode = 1;
  } else {
    console.log(`OK   ${file} (${html.length} bytes)`);
  }
}

check(
  "packages/web/dist/index.html",
  ['class="downloads-grid"', 'hreflang="vi"', "Download for Windows", 'data-theme="dark"'],
  ["onerror="],
);
check(
  "packages/web/dist/light.html",
  ['data-theme="light"', 'class="downloads-grid"'],
  ["onerror="],
);
check(
  "packages/web/dist/tr/index.html",
  ['<html lang="tr"', "Senin evin.", "Windows için indir", "Sürüm 3.14.2 · x64"],
  ["onerror=", ">Your home.<"],
);
check("packages/web/dist/404.html", []);
check("packages/web/dist/privacy.html", []);

if (process.exitCode) process.exit(1);

// Selective copy: only the web-owned files, keep desktop/mobile/downloads intact.
const entries = [
  "index.html",
  "light.html",
  "privacy.html",
  "terms.html",
  "404.html",
  "sitemap.xml",
  "robots.txt",
  "og-cover.svg",
  "icon.svg",
  "manifest.webmanifest",
  "tr",
  "fonts",
];
for (const e of entries) {
  cpSync(`packages/web/dist/${e}`, `public/${e}`, { recursive: true, force: true });
  console.log(`copied dist/${e} -> public/${e}`);
}
