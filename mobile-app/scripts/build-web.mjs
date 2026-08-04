/**
 * NEXUS Mobile App — web bundle builder.
 *
 * Capacitor, `www/` klasörünün içeriğini native WebView içinde
 * `https://localhost` originiyle sunar. Uygulamanın mobil arayüzü artık
 * repo kökündeki yeni NEXUS tasarım sistemi sayfalarıdır (stitch-*.html):
 * Tailwind CDN + Lucide + Inter ile çalışan, birbirine bağlı, tamamen
 * Türkçe statik sayfalar. Aralarındaki durum paylaşımı localStorage ile
 * yapılır (nexusUserName, nexusHomeLocation, nexusDndState, ...).
 *
 * Bu script:
 *   1. www/ klasörünü temizler,
 *   2. tüm stitch-*.html sayfalarını kopyalar,
 *   3. Kullanım Koşulları / Gizlilik gibi bağlanan hukuk sayfalarını kopyalar,
 *   4. Capacitor'ın giriş noktası olan index.html'i (stitch-home yönlendirmesi)
 *      üretir.
 *
 * Sonrasında `npx cap sync` bu paketi android/ ve ios/ shell'lerine taşır.
 */
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "..");
const REPO_ROOT = join(APP_ROOT, "..");
const OUT_DIR = join(APP_ROOT, "www");

// 1. Temiz www/ ile başla — eski React bundle'ından kalıntı sızmasın.
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

// 2. Tüm NEXUS tasarım sayfalarını kopyala.
const pages = readdirSync(REPO_ROOT).filter(
  (f) => f.startsWith("stitch-") && f.endsWith(".html"),
);
if (pages.length === 0) {
  throw new Error(`Repo kökünde stitch-*.html sayfası bulunamadı: ${REPO_ROOT}`);
}
for (const page of pages) {
  copyFileSync(join(REPO_ROOT, page), join(OUT_DIR, page));
}

// 2b. Sayfaların ortak script'leri.
// Bazi stitch ekranlari bu dosyalari dogrudan kullaniyor; eksik kalirlarsa
// mobil paketleme sonrasi sessiz kirik referanslar olusuyor.
const SHARED_SCRIPTS = [
  "auth.js",
  "theme.js",
  "data.js",
  "ai-fab.js",
  "sheet-gestures.js",
  "smart-scene-page.js",
  "smart-card-detail-state.js",
];
for (const file of SHARED_SCRIPTS) {
  const src = join(REPO_ROOT, file);
  if (existsSync(src)) copyFileSync(src, join(OUT_DIR, file));
}

const SHARED_ASSETS = ["siri-logo.png"];
for (const file of SHARED_ASSETS) {
  const src = join(REPO_ROOT, file);
  if (existsSync(src)) copyFileSync(src, join(OUT_DIR, file));
}

const PRODUCT_ASSETS_SRC = join(REPO_ROOT, "assets", "products");
const PRODUCT_ASSETS_OUT = join(OUT_DIR, "assets", "products");
if (existsSync(PRODUCT_ASSETS_SRC)) {
  mkdirSync(join(OUT_DIR, "assets"), { recursive: true });
  cpSync(PRODUCT_ASSETS_SRC, PRODUCT_ASSETS_OUT, { recursive: true });
}

// 3. Sayfalardan bağlanan statik hukuk sayfaları (stitch-plus -> public/terms.html).
const LEGAL_FILES = ["terms.html", "privacy.html"];
const PUBLIC_SRC = join(REPO_ROOT, "public");
const PUBLIC_OUT = join(OUT_DIR, "public");
mkdirSync(PUBLIC_OUT, { recursive: true });
for (const file of LEGAL_FILES) {
  const src = join(PUBLIC_SRC, file);
  if (existsSync(src)) copyFileSync(src, join(PUBLIC_OUT, file));
}

// 4. Capacitor giriş noktası: index.html -> stitch-home.html yönlendirmesi.
writeFileSync(
  join(OUT_DIR, "index.html"),
  `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0, viewport-fit=cover" name="viewport"/>
<title>NEXUS</title>
<meta http-equiv="refresh" content="0; url=stitch-home.html"/>
<style>body{margin:0;background:#F2F4F9;}</style>
</head>
<body>
<script>location.replace("stitch-home.html");</script>
</body>
</html>
`,
);

const entries = readdirSync(OUT_DIR);
console.log(`copied ${pages.length} pages + index.html -> www/ (${entries.length} entries)`);
console.log("\nBundle ready in mobile-app/www/. Run `npx cap sync` next.");
