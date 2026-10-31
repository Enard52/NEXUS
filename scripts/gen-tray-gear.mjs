// Ayarlar tepsi/jump-list ikonu üreticisi.
//
// Sorun: desktop/resources/tray/settings.png ve desktop/resources/icons/settings.ico
// yanlışlıkla parlaklık (güneş) çizimiyle üretilmişti. Bu betik, Ev/Cihaz Ekle ikonlarıyla
// aynı düz mavi (brand) paleti kullanarak, toplu şekilde Ayarlar'a uygun DIŞLİ ikonunu üretir:
//   - desktop/resources/tray/settings.png      (32×32, tepsi menüsü)
//   - desktop/resources/icons/settings.ico     (16/24/32/48, görev çubuğu jump list)
//
// Kullanım:  node scripts/gen-tray-gear.mjs
// Gereksinim: playwright chromium (repo test/şot betikleriyle aynı gereklilik)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TRAY = path.join(ROOT, "desktop", "resources", "tray");
const ICONS = path.join(ROOT, "desktop", "resources", "icons");

// Dişli parametreleri (32 birim canvas; örnek referans dişliye göre ayarlı)
const P = {
  size: 32,
  center: 16,
  baseR: 9.8, // diş arası dişli gövdesi
  toothW: 5.6, // diş genişliği
  reach: 13.7, // dışa ulaşan tepe noktası
  toothBaseR: 9.4, // diş gövdeye gömülme sınırı
  toothRX: 2.4, // diş köşe yumuşatması (tam kapsül değil; üst kenar hafif düz)
  hole: 6.0, // merkez boşluk kenarı
  holeRX: 1.7, // boşluk köşe yumuşatması
  sizes: [16, 24, 32, 48],
};

function gearSvg(color) {
  const { center: c, baseR, toothW, reach, toothBaseR, toothRX, hole, holeRX } = P;
  // Dişler: 8 adet, 45° arayla; ilki tam 12 yönünde (kuzey)
  const teeth = [];
  for (let k = 0; k < 8; k++) {
    teeth.push(
      `<rect x="${c - toothW / 2}" y="${c - reach}" width="${toothW}" height="${reach - toothBaseR}" rx="${toothRX}" fill="${color}" transform="rotate(${k * 45} ${c} ${c})"/>`,
    );
  }
  // Maske: beyaz = görünür; boşluk (delik) siyah → gerçekten şeffaf kalır
  const holeHalf = hole / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${P.size}" height="${P.size}" viewBox="0 0 ${P.size} ${P.size}">
  <mask id="m">
    <rect width="${P.size}" height="${P.size}" fill="white"/>
    <rect x="${c - holeHalf}" y="${c - holeHalf}" width="${hole}" height="${hole}" rx="${holeRX}" fill="black"/>
  </mask>
  <g mask="url(#m)">
    <circle cx="${c}" cy="${c}" r="${baseR}" fill="${color}"/>
    ${teeth.join("\n    ")}
  </g>
</svg>`;
  return svg;
}

function packIco(images) {
  // images: [{ size, rgba(buf, üstten alta BGRA değil RGBA) }, ...] → BMP tabanlı ICO
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  let dataParts = [];
  let offset = 6 + count * 16;
  const entries = [];
  const sorted = [...images].sort((a, b) => a.size - b.size);
  for (const img of sorted) {
    const s = img.size;
    const xor = Buffer.alloc(s * s * 4);
    const rgba = img.rgba;
    for (let y = 0; y < s; y++) {
      const src = (s - 1 - y) * s * 4; // satırlar aşağıdan yukarı
      for (let x = 0; x < s; x++) {
        const i = src + x * 4;
        const o = (y * s + x) * 4;
        xor[o] = rgba[i + 2]; // B
        xor[o + 1] = rgba[i + 1]; // G
        xor[o + 2] = rgba[i]; // R
        xor[o + 3] = rgba[i + 3]; // A
      }
    }
    const andStride = Math.ceil(s / 32) * 4; // 1bpp satır, 4 bayt hizalı
    const and = Buffer.alloc(andStride * s); // tümü 0 = tamamen opak (alfa belirler)
    const bmp = Buffer.alloc(40 + xor.length + and.length);
    bmp.writeUInt32LE(40, 0);
    bmp.writeInt32LE(s, 4);
    bmp.writeInt32LE(s * 2, 8); // XOR + AND toplam yükseklik
    bmp.writeUInt16LE(1, 12);
    bmp.writeUInt16LE(32, 14);
    bmp.writeUInt32LE(xor.length + and.length, 20);
    xor.copy(bmp, 40);
    and.copy(bmp, 40 + xor.length);
    const entry = Buffer.alloc(16);
    if (s >= 256) {
      entry[0] = 0;
      entry[1] = 0;
    } else {
      entry[0] = s;
      entry[1] = s;
    }
    entry[4] = 1;
    entry.writeUInt32LE(bmp.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    dataParts.push(bmp);
    offset += bmp.length;
  }
  for (const entry of entries) dataParts.push(entry);
  // ICO'da dizin dizileri başlıkta, gövde arkada → yeniden sırala: entry'ler head'de
  const head = Buffer.concat([header, ...entries]);
  return Buffer.concat([head, ...dataParts]);
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("about:blank");

// 1) Ev ikonundan marka mavisini örnekle (en sık opak renk)
const homeBase64 = fs
  .readFileSync(path.join(TRAY, "home.png"))
  .toString("base64");
const brandColor = await page.evaluate(async (b64) => {
  const img = new Image();
  img.src = "data:image/png;base64," + b64;
  await img.decode();
  const cv = document.createElement("canvas");
  cv.width = img.width;
  cv.height = img.height;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
  const tally = new Map();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 220) continue; // opak piksel
    const key = `${d[i] >> 3},${d[i + 1] >> 3},${d[i + 2] >> 3}`;
    tally.set(key, (tally.get(key) || 0) + 1);
  }
  let best = null;
  let bestN = 0;
  for (const [k, n] of tally) if (n > bestN) ((best = k), (bestN = n));
  const [r, g, b] = best.split(",").map((v) => (v << 3) + 4);
  return `rgb(${r},${g},${b})`;
}, homeBase64);

// 2) Dişliyi her boyutta rasterle
const svgData = Buffer.from(gearSvg(brandColor)).toString("base64");
const rendered = await page.evaluate(async (b64) => {
  const img = new Image();
  img.src = "data:image/svg+xml;base64," + b64;
  await img.decode();
  const out = [];
  for (const size of [32, 16, 24, 48]) {
    const cv = document.createElement("canvas");
    cv.width = size;
    cv.height = size;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, size, size);
    if (size === 32) {
      out.push({ size: 32, png: cv.toDataURL("image/png").split(",")[1] });
    }
    out.push({
      size,
      rgba: Array.from(ctx.getImageData(0, 0, size, size).data),
    });
  }
  return out;
}, svgData);

await browser.close();

// 3) Dosyaları yaz
const png32 = rendered.find((r) => r.png);
fs.writeFileSync(
  path.join(TRAY, "settings.png"),
  Buffer.from(png32.png, "base64"),
);
fs.writeFileSync(
  path.join(ICONS, "settings.ico"),
  packIco(rendered.filter((r) => r.rgba)),
);
console.log(
  `dişli üretildi  mavi: ${brandColor}\n  tray/settings.png (32×32)\n  icons/settings.ico (${P.sizes.join("/")})`,
);
