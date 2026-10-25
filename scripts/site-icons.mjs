#!/usr/bin/env node
/**
 * Site ikonları: www/public/icon.svg'den apple-touch-icon ve manifest için gereken
 * kare PNG'leri üretir (192 ve 512).
 * ------------------------------------------------------------------
 * Neden: pazarlama sitesi başlığı uzun süredir /icons/icon-192.png'yi işaret ediyordu
 * ama depoda yalnızca web UYGULAMASININ .webp ikonları vardı (www/icons/). iOS'ta
 * "Ana Ekrana Ekle" ve Android kurulum ikonu 404'e düşüyordu. Denetim kapısı
 * (scripts/verify-site.mjs) ölü dosya bağlantılarını taradığı için artık görünür.
 *
 * Kullanım:  node scripts/site-icons.mjs       (çıktı: www/public/icons/*.png)
 * Gereksinim: playwright + chromium (depoda kurulu; npm run verify:site de kullanıyor).
 * SVG'yi tarayıcıda 1:1 ölçekleyip PNG'e çevirir; ikon dosyaları üretilmiş varlık olarak
 * depoda durur (og-cover.png gibi), build her seferinde tarayıcı açmasın.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUB = join(ROOT, "www", "public");
const SVG = join(PUB, "icon.svg");
const OUT = join(PUB, "icons");

const svg = readFileSync(SVG, "utf8");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(
  `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
     html,body{margin:0;padding:0;background:transparent}
     svg{display:block}
   </style></head><body>${svg}</body></html>`,
  { waitUntil: "load" }
);

for (const size of [192, 512]) {
  await page.evaluate((s) => {
    const el = document.querySelector("svg");
    el.setAttribute("width", s);
    el.setAttribute("height", s);
  }, size);
  const box = await page.locator("svg").boundingBox();
  const shot = await page.screenshot({
    clip: { x: box.x, y: box.y, width: size, height: size },
    omitBackground: true,
  });
  const file = join(OUT, `icon-${size}.png`);
  writeFileSync(file, shot);
  console.log(`✓ icons/icon-${size}.png (${shot.length} bayt)`);
}

await browser.close();
