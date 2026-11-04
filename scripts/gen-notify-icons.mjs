// Masaüstü bildirim ikonu üreticisi.
//
// Windows bildirim başlığında marka logosu zaten var (AppUserModelID kaydı); gövdedeki ikon ise olayın
// TÜRÜNÜ gösterir (otomasyon, enerji, güvenlik...). Türler nexusEvents[].type değerleridir;
// desktop/main.cjs ve src/app/event-bridge.js aynı eşlemeyi kullanır.
//
// Kullanım:  node scripts/gen-notify-icons.mjs
// Gereksinim: playwright chromium (gen-tray-gear.mjs ile aynı)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "desktop", "resources", "notify");
const SIZE = 128;

const BRAND = ["#a99bff", "#5b8cff"];

// Her ikon 64×64 birimlik tuval üzerinde, beyaz yuvarlak uçlu çizgilerle çizilir.
const ICONS = {
  info: {
    bg: BRAND,
    glyph: `<path d="M20 41H44L41 36V29A9 9 0 0 0 23 29V36Z"/><path d="M28 46A4 4 0 0 0 36 46"/>`,
  },
  automation: {
    bg: BRAND,
    glyph: `<circle cx="32" cy="32" r="15"/><path d="M32 23V32L39 36"/>`,
  },
  scene: {
    bg: ["#b79cff", "#7c5cff"],
    glyph: `<path d="M32 15L36.5 27.5L49 32L36.5 36.5L32 49L27.5 36.5L15 32L27.5 27.5Z"/>`,
  },
  energy: {
    bg: ["#fbbf24", "#f59e0b"],
    glyph: `<path d="M35 14L21 34H31L29 50L43 29H33Z"/>`,
  },
  security: {
    bg: ["#34d399", "#10b981"],
    glyph: `<path d="M32 14L47 20V32C47 41 40 47 32 51C24 47 17 41 17 32V20Z"/><path d="M25 32L30 37L39 27"/>`,
  },
  emergency: {
    bg: ["#f87171", "#dc2626"],
    glyph: `<path d="M32 16L50 47H14Z"/><path d="M32 28V38"/><circle cx="32" cy="43.5" r="1.4" fill="#fff"/>`,
  },
  weather: {
    bg: ["#60a5fa", "#3b82f6"],
    glyph: `<path d="M22 44H42A9 9 0 0 0 43 26A12 12 0 0 0 20 30A7 7 0 0 0 22 44Z"/>`,
  },
  location: {
    bg: ["#2dd4bf", "#0d9488"],
    glyph: `<path d="M32 50C32 50 19 38 19 29A13 13 0 0 1 45 29C45 38 32 50 32 50Z"/><circle cx="32" cy="29" r="5"/>`,
  },
  family: {
    bg: ["#f472b6", "#db2777"],
    glyph: `<path d="M16 30L32 16L48 30"/><path d="M20 27V47H44V27"/><path d="M28 47V37H36V47"/>`,
  },
};

function svg(name, { bg, glyph }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 64 64">
<defs><linearGradient id="g-${name}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient></defs>
<rect width="64" height="64" rx="15" fill="url(#g-${name})"/>
<rect x="1.5" y="1.5" width="61" height="61" rx="13.5" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.5"/>
<g fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>
</svg>`;
}

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: SIZE, height: SIZE },
    deviceScaleFactor: 1,
  });
  for (const [name, def] of Object.entries(ICONS)) {
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${svg(name, def)}</body></html>`,
    );
    await page.screenshot({
      path: path.join(OUT, `${name}.png`),
      omitBackground: true,
      clip: { x: 0, y: 0, width: SIZE, height: SIZE },
    });
    console.log("wrote", `desktop/resources/notify/${name}.png`);
  }
} finally {
  await browser.close();
}
