// NEXUS i18n taraması — arayüzü İngilizce yükleyip ekranda kalan Türkçe metinleri sayar.
// Statik kapsama testi (scripts/i18n-coverage.mjs) yalnızca HTML'de yazılı metinleri görür;
// bu araç JavaScript ile üretilen satırları da yakaladığı için ikisi birlikte çalışır.
// Kullanım: SERVE_DIR=www node scripts/i18n-sweep.mjs   (pnpm audit:i18n)
// Kalıntı listesinde cihaz/oda adları çıkarsa bunlar kullanıcı verisidir, çeviri eksiği değil.
import http from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SERVE = join(ROOT, process.env.SERVE_DIR || "www");
const PORT = 4835;
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf",
  ".webmanifest": "application/manifest+json", ".txt": "text/plain; charset=utf-8",
};
const server = http.createServer(async (req, res) => {
  try {
    const p = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\//, "") || "index.html";
    const f = join(SERVE, p);
    res.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" });
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end("not found"); }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const pages = (await readdir(SERVE)).filter((f) => /^nexus-.*\.html$/.test(f)).sort();
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  locale: "en-US", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
});
// Cihazlı durum da denenir: panel/rozet/ad gibi JS verisinden ÜRETİLEN metinler
// yalnızca eşleşmiş cihaz varken görünür (aksi halde boş durum ekranı okunur).
const QA_USER = "qa@nexus.local";
const SEEDED = [
  { id: "dev-1", name: "Oturma Odası Lambası", host: "192.168.1.31", protocol: "hue", model: "Hue Bridge", kind: "light", icon: "lightbulb", room: "Oturma Odası" },
  { id: "dev-2", name: "Mutfak Prizi", host: "192.168.1.32", protocol: "tplink", model: "Tapo P110", kind: "plug", icon: "zap", room: "Mutfak" },
  { id: "dev-3", name: "Yatak Odası Kliması", host: "192.168.1.33", protocol: "daikin", model: "Daikin", kind: "climate", icon: "thermometer", room: "Yatak Odası" },
  { id: "dev-4", name: "Güvenlik Kamerası", host: "192.168.1.34", protocol: "onvif", model: "ONVIF", kind: "camera", icon: "video", room: "Giriş" },
];
await ctx.addInitScript(([u, d]) => {
  try {
    localStorage.setItem("nexusCurrentUser", u);
    localStorage.setItem("nexusLanguage", "en");
    localStorage.setItem(u + "_nexusPairedDevices", JSON.stringify(d));
  } catch (e) {}
}, [QA_USER, SEEDED]);
const page = await ctx.newPage();
const TR = /[çğıöşüÇĞİÖŞÜ]/;
let total = 0;
for (const file of pages) {
  await page.goto(`http://127.0.0.1:${PORT}/${file}`, { waitUntil: "load" }).catch(() => {});
  await page.waitForTimeout(600);
  const leftovers = await page.evaluate((re) => {
    const out = [];
    const skip = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);
    for (const el of document.querySelectorAll("body *")) {
      if (skip.has(el.tagName)) continue;
      if (el.closest("[data-no-i18n]")) continue;
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join(" ").replace(/\s+/g, " ").trim();
      if (own.length > 3 && new RegExp(re).test(own)) out.push(own.slice(0, 90));
    }
    return out;
  }, TR.source);
  const uniq = [...new Set(leftovers)];
  if (uniq.length) {
    total += uniq.length;
    console.log(`\n${file} (${uniq.length})`);
    for (const u of uniq.slice(0, 8)) console.log("   • " + u);
    if (uniq.length > 8) console.log(`   … +${uniq.length - 8}`);
  }
}
await browser.close();
server.close();
console.log(`\nİNGİLİZCE arayüzde kalan Türkçe metin düğümü: ${total}`);
