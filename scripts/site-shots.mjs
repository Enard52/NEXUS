// Gerçek uygulama ekran görüntüleri (issue #2 — sahte/stok görsel yok).
// Uygulamanın KENDİ SAYFALARINDAN Playwright ile yakalanır:
//   node scripts/site-shots.mjs
// Çıktı: www/public/images/shots/{home,energy,smart,chat}.png
import http from "node:http";
import { readFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "www", "public", "images", "shots");
const PORT = 4833;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent((req.url || "/").split("?")[0]);
    const data = await readFile(join(ROOT, p.replace(/^\//, "")));
    res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
mkdirSync(OUT, { recursive: true });

// Hava durumu kartı ağ isteğini beklemesin: açık-meteo'ya kısa süre tanınır.
const PAGES = [
  { name: "home", path: "stitch-home.html", wait: 1400 },
  { name: "energy", path: "stitch-energy.html", wait: 700 },
  { name: "smart", path: "stitch-smart.html", wait: 700 },
  { name: "chat", path: "stitch-chat.html", wait: 900 },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2, // net metin
  isMobile: true,
  hasTouch: true,
  locale: "tr-TR",
});
// Boş ev durumu yerine dürüst varsayılanlar yeterli; sahte cihaz eklemiyoruz.
await ctx.addInitScript(() => {
  localStorage.setItem("nexusCurrentUser", "shots@nexus.local");
  localStorage.setItem("shots@nexus.local_nexusOnboarded", "true");
});

for (const p of PAGES) {
  const pg = await ctx.newPage();
  await pg.goto(`http://127.0.0.1:${PORT}/${p.path}`, { waitUntil: "networkidle", timeout: 20000 });
  await pg.waitForTimeout(p.wait);
  await pg.screenshot({ path: join(OUT, `${p.name}.png`) });
  console.log("✓", p.name + ".png");
  await pg.close();
}
await browser.close();
server.close();
console.log("Ekran görüntüleri hazır:", OUT);
