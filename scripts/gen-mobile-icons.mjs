#!/usr/bin/env node
/**
 * NEXUS — mobil marka varlıkları üretici (Android + iOS ikon/splash + kaynak görseller)
 * =============================================================================
 * Neden var: 29 Ekim'de kullanıcı APK'yı kurdu ve "marka logosu yok, farklı bir şey
 * görünüyor" dedi. İki ayrı bozuk varlık bulundu:
 *   1) android res/mipmap-<dpi>/ic_launcher PNG'leri ve drawable-<...>/splash.png,
 *      depoda bir ANDROID STUDIO EKRAN GÖRÜNTÜSÜ olan assets/icon.png'den
 *      (1024x721 — kare bile değil) üretilmişti. Telefonda ikonun yerinde README
 *      ekran görüntüsünün küçültülmüş hali duruyordu.
 *   2) ios AppIcon-512@2x.png ve Splash.imageset dosyaları FİGMA logosuydu
 *      (Capacitor şablonunun örnek görselleri hiç değiştirilmemiş).
 *
 * Bu script tek doğruluk kaynağı olarak www/public/icon.svg'yi (markanın vektörü)
 * kullanır ve iki platformun İSTEDİĞİ tüm boyutları deterministik üretir:
 *
 *   • mipmap-<dpi>/ic_launcher.png          legacy kare ikon   (36/48/72/96/144/192)
 *   • mipmap-<dpi>/ic_launcher_round.png    legacy yuvarlak    (aynı boyutlar)
 *   • mipmap-<dpi>/ic_launcher_foreground.png  adaptive ön katman (108dp tuval: 81..432)
 *   • mipmap-<dpi>/ic_launcher_background.png  adaptive arka katman (tam taşımalı degrade)
 *   • mipmap-<dpi>/ic_launcher_monochrome.png  Android 13+ temalı ikon
 *   • drawable-<yön>-<dpi>/splash.png        Android açılış ekranı (gece + gündüz, port + land)
 *   • mipmap-anydpi-v26/ic_launcher{,_round}.xml  adaptive katman tanımları
 *   • ios AppIcon-512@2x.png                 1024x1024, ALFA KANALSIZ (App Store şartı;
 *      köşeleri iOS kendi yuvarlar, o yüzden tam taşan karo çizilir)
 *   • ios Splash.imageset/splash-2732x2732*.png   LaunchScreen scaleAspectFill
 *   • assets/icon.png / logo.png / splash.png  kaynak görseller — bir daha ekran
 *     görüntüsüyle karışmasın diye markanın kendisiyle ezilir
 *
 * Kullanım:  node scripts/gen-mobile-icons.mjs   ( sonra: node scripts/sync-www.mjs )
 * Gereksinim: playwright + chromium (depoda kurulu; verify-site.mjs de kullanıyor).
 * Doğrulanır: packages/platform/src/mobile-brand-assets.test.ts — üretilen dosyaların
 * boyut ve renk istatistiklerini markayla karşılaştırır; biri eski görselle
 * değiştirilirse test kırmızıya döner.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RES = join(ROOT, "android", "app", "src", "main", "res");
const SVG_SRC = join(ROOT, "www", "public", "icon.svg");

// ── Markanın parçaları (icon.svg ile birebir aynı geometri) ─────────────────
// 512x512 viewBox kullanılıyor; icon.svg'nin kendi tuvali de 512.
const GLYPH = "M168 360V168L344 360V168";
const STROKE = 41.6;

const DEFS = `
  <defs>
    <linearGradient id="nxicon" x1="48" y1="32" x2="464" y2="480" gradientUnits="userSpaceOnUse">
      <stop stop-color="#8b7bff"/><stop offset="0.55" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b7bff"/>
    </linearGradient>
    <linearGradient id="nxiconsheen" x1="256" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" stop-opacity="0.30"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>`;

const glyphEl = (color = "#ffffff") =>
  `<path d="${GLYPH}" fill="none" stroke="${color}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"/>`;

/** Kök <svg> sarmalayıcı: degrade tanımları her çıktıda hazır bulunur. */
const wrap = (body, vb = "0 0 512 512") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${DEFS}${body}</svg>`;

/** Kare/normal legacy ikon: köşeleri yuvarlatılmış marka karo'su. */
const TILE = wrap(`
    <rect width="512" height="512" rx="144" fill="url(#nxicon)"/>
    <rect width="512" height="512" rx="144" fill="url(#nxiconsheen)"/>
    <rect x="24" y="24" width="464" height="464" rx="136" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="12"/>
    ${glyphEl()}`);

/** Legacy yuvarlak ikon: tam taşımalı dairenin içinde marka. */
const ROUND = wrap(`
    <clipPath id="nxcircle"><circle cx="256" cy="256" r="256"/></clipPath>
    <g clip-path="url(#nxcircle)">
      <rect width="512" height="512" fill="url(#nxicon)"/>
      <rect width="512" height="512" fill="url(#nxiconsheen)"/>
      ${glyphEl()}
    </g>`);

/**
 * Adaptive ön katman: ŞEFFAF tuvalde yalnızca glif.
 * Android 108dp tuvalin dışını maskeyle keser; görünen güvenli alan merkezdeki
 * 72dp (= 341.3/512). Glifin köşe yarıçapı ölçek 1'de ~160px < 170.7px olduğu
 * için hiçbir maskeye takılmaz.
 */
const foregroundSvg = (color = "#ffffff") => wrap(glyphEl(color));

/** Adaptive arka katman: köşesiz, tuvali tamamen dolduran degrade. */
const BG = wrap(`
    <rect width="512" height="512" fill="url(#nxicon)"/>
    <rect width="512" height="512" fill="url(#nxiconsheen)"/>`);

/**
 * Açılış ekranı: koyu zemin + ortalanmış marka. Karo gövdesi 512 koordinat
 * sisteminde çizilip ölçek-öteleme ile tuvale oturtulur.
 */
function splashSvg(w, h, dark) {
  const bg = dark ? "#09090b" : "#f4f6fb";
  const size = Math.round(Math.min(w, h) * 0.42);
  const x = (w - size) / 2;
  const y = (h - size) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${DEFS}
    <rect width="${w}" height="${h}" fill="${bg}"/>
    <g transform="translate(${x} ${y}) scale(${size / 512})">
      <rect width="512" height="512" rx="144" fill="url(#nxicon)"/>
      <rect width="512" height="512" rx="144" fill="url(#nxiconsheen)"/>
      <rect x="24" y="24" width="464" height="464" rx="136" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="12"/>
      ${glyphEl()}
    </g>
  </svg>`;
}

// ── Android yoğunluk tablosu ────────────────────────────────────────────────
const LEGACY = { ldpi: 36, mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const ADAPTIVE = { ldpi: 81, mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

// Splash tuval boyutları: depoda zaten duran klasörlerle birebir aynı olmalı,
// yoksa AAPT başka bir yoğunluğa düşüp ikon gibi bozuk ölçeklenir.
const SPLASH = {
  "drawable": [320, 480],
  "drawable-night": [320, 240],
  "drawable-port-ldpi": [240, 320],
  "drawable-port-mdpi": [320, 480],
  "drawable-port-hdpi": [480, 800],
  "drawable-port-xhdpi": [720, 1280],
  "drawable-port-xxhdpi": [960, 1600],
  "drawable-port-xxxhdpi": [1280, 1920],
  "drawable-port-night-ldpi": [240, 320],
  "drawable-port-night-mdpi": [320, 480],
  "drawable-port-night-hdpi": [480, 800],
  "drawable-port-night-xhdpi": [720, 1280],
  "drawable-port-night-xxhdpi": [960, 1600],
  "drawable-port-night-xxxhdpi": [1280, 1920],
  "drawable-land-ldpi": [320, 240],
  "drawable-land-mdpi": [480, 320],
  "drawable-land-hdpi": [800, 480],
  "drawable-land-xhdpi": [1280, 720],
  "drawable-land-xxhdpi": [1600, 960],
  "drawable-land-xxxhdpi": [1920, 1280],
  "drawable-land-night-ldpi": [320, 240],
  "drawable-land-night-mdpi": [480, 320],
  "drawable-land-night-hdpi": [800, 480],
  "drawable-land-night-xhdpi": [1280, 720],
  "drawable-land-night-xxhdpi": [1600, 960],
  "drawable-land-night-xxxhdpi": [1920, 1280],
};

// ── Rasterizasyon ───────────────────────────────────────────────────────────
if (!existsSync(SVG_SRC)) {
  console.error(`✗ kaynak vektör bulunamadı: ${SVG_SRC}`);
  process.exit(1);
}
// icon.svg yalnızca geometri referansı olarak okunuyor; çıktılar yukarıdaki
// fonksiyonlardan üretiliyor (katmanlar ayrıştırılması gerektiği için).
void readFileSync(SVG_SRC, "utf8");

const browser = await chromium.launch();

let page = null;

/**
 * Bir SVG metnini tam `w`×`h` piksel PNG'e çevirir.
 * NEDEN viewport: Playwright varsayılan 1280x720 pencere açar ve `clip` bu
 * sınırın dışına taşamaz — 1920x1280 splash üretimi sessizce 1280x720'e kırpılıyordu.
 * Her çıktı için viewport'u tam hedef boyuta çekip tüm ekranı alıyor.
 */
async function raster(markup, w, h, transparent) {
  if (page) await page.close();
  page = await browser.newPage({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
       html,body{margin:0;padding:0;background:transparent;overflow:hidden}svg{display:block}
     </style></head><body>${markup}</body>`,
    { waitUntil: "load" },
  );
  await page.evaluate(
    ({ w, h }) => {
      const el = document.querySelector("svg");
      el.setAttribute("width", w);
      el.setAttribute("height", h);
    },
    { w, h },
  );
  const shot = await page.screenshot({ omitBackground: transparent });
  if (shot.length === 0) throw new Error("boş PNG üretildi");
  return shot;
}

let written = 0;
async function emitTo(baseDir, relPath, markup, w, h, transparent) {
  const png = await raster(markup, w, h, transparent);
  const file = join(baseDir, relPath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, png);
  written++;
}
const emit = (relPath, markup, w, h, transparent) =>
  emitTo(RES, relPath, markup, w, h, transparent);

const FG = foregroundSvg();
const MONO = foregroundSvg("#ffffff");

for (const [dpi, px] of Object.entries(LEGACY)) {
  await emit(`mipmap-${dpi}/ic_launcher.png`, TILE, px, px, true);
  await emit(`mipmap-${dpi}/ic_launcher_round.png`, ROUND, px, px, true);
}
for (const [dpi, px] of Object.entries(ADAPTIVE)) {
  await emit(`mipmap-${dpi}/ic_launcher_foreground.png`, FG, px, px, true);
  await emit(`mipmap-${dpi}/ic_launcher_background.png`, BG, px, px, false);
  await emit(`mipmap-${dpi}/ic_launcher_monochrome.png`, MONO, px, px, true);
}

// Adaptive katman tanımları: inset YOK. Eski şablon hem arka hem ön katmanı
// %16.7 içerlek basıyordu; bu, maskeleme sonrası ikonun etrafında boşluk bırakıp
// "kare içinde ikon" görünüyordu. Doğrusu: arka tam taşar, ön güvenli bölgede.
const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<!-- ÜRETİM: node scripts/gen-mobile-icons.mjs — elle düzenlemeyin.
     Arka katman tuvali doldurur, launcher maskelediği şekle keser; ön katman
     merkezdeki 72dp güvenli alanında durur. monochrome = Android 13 temalı ikon. -->
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />
</adaptive-icon>
`;
writeFileSync(join(RES, "mipmap-anydpi-v26", "ic_launcher.xml"), adaptiveIconXml);
writeFileSync(join(RES, "mipmap-anydpi-v26", "ic_launcher_round.xml"), adaptiveIconXml);

// values/ic_launcher_background.xml: artık PNG katmanı kullanılıyor ama renk
// kaydı da markayı göstersin (bazı araçlar yedek olarak bunu okur).
writeFileSync(
  join(RES, "values", "ic_launcher_background.xml"),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#5B8DFF</color>
</resources>
`,
);

// Açılış ekranları. Gece ve gündüz ayrı: gündüz açık zemin, gece koyu.
for (const [dir, [w, h]] of Object.entries(SPLASH)) {
  const dark = dir.includes("night") || dir === "drawable";
  await emit(`${dir}/splash.png`, splashSvg(w, h, dark), w, h, false);
}

// ── iOS ─────────────────────────────────────────────────────────────────────
// App Store / Xcode: AppIcon alfa KANALI İÇERMEZ ve köşeleri yuvarlatılmış
// sürüm istenmez — iOS maskeyi kendisi uygular. O yüzden tam taşan karo çizilir.
const IOS_APPICON = wrap(`
    <rect width="512" height="512" fill="url(#nxicon)"/>
    <rect width="512" height="512" fill="url(#nxiconsheen)"/>
    ${glyphEl()}`);
const IOS_ASSETS = join(ROOT, "ios", "App", "App", "Assets.xcassets");
await emitTo(
  IOS_ASSETS,
  "AppIcon.appiconset/AppIcon-512@2x.png",
  IOS_APPICON,
  1024,
  1024,
  false,
);
// LaunchScreen.storyboard "Splash" görseli scaleAspectFill: kare tuval telefonda
// dikeyden taşar, marka merkezde kalır. Gündüz/gece fark etmez — koyu zemin.
for (const name of [
  "splash-2732x2732.png",
  "splash-2732x2732-1.png",
  "splash-2732x2732-2.png",
]) {
  await emitTo(
    IOS_ASSETS,
    `Splash.imageset/${name}`,
    splashSvg(2732, 2732, true),
    2732,
    2732,
    false,
  );
}

// Kaynak görseller: @capacitor/assets bir gün tekrar çalıştırılırsa bunları okur.
// Ekran görüntüsü durdukları yerde bozuk ikon üretmesin diye markayla ezilir.
const assets = join(ROOT, "assets");
mkdirSync(assets, { recursive: true });
writeFileSync(join(assets, "icon.png"), await raster(TILE, 1024, 1024, true));
writeFileSync(join(assets, "logo.png"), await raster(TILE, 1024, 1024, true));
writeFileSync(
  join(assets, "splash.png"),
  await raster(splashSvg(2732, 2732, true), 2732, 2732, false),
);

await browser.close();
console.log(
  `✓ ${written} mobil marka varlığı üretildi (icon.svg → Android res + iOS xcassets) + assets/`,
);
console.log("  sonraki adım: node scripts/sync-www.mjs  (www ve ios/App/App/public'e taşır)");
