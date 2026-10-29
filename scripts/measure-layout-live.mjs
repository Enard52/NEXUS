// Issue #1 canlı doğrulama: tarayıcıda (Chromium, 390×844) ekran kabuğu ölçümü.
// ---------------------------------------------------------------------------
// scripts/measure-layout.mjs statik tarama yapar; bu betik aynı metrikleri
// GERÇEK render üzerinde ölçer: başlık kutusu, alt menü, içerik sütunu genişliği.
// Kullanım:  node scripts/measure-layout-live.mjs [sayfa1 sayfa2 ...]
// (Playwright chromium gerekir; yoksa: npx playwright install chromium)

import http from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4817;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

// Statik dosya sunucusu (kök dizin; nexus-*.html kaynağı burada)
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent((req.url || "/").split("?")[0]);
    if (p === "/" || p === "") p = "/index.html";
    const file = join(ROOT, p.replace(/^\//, ""));
    const data = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

// Issue #1'deki kritik geçiş aileleri
const DEFAULT_PAGES = [
  "nexus-home.html",
  "nexus-smart.html",
  "nexus-discover.html",
  "nexus-profile.html",
  "nexus-chat.html",
  "nexus-menu.html",
  "nexus-user-info.html",
  "nexus-settings.html",
  "nexus-plus.html",
  "nexus-billing.html",
  "nexus-energy.html",
  "nexus-energy-strategy.html",
  "nexus-energy-devices.html",
  "nexus-device.html",
  "nexus-dnd.html",
  "nexus-panels.html",
  "nexus-lighting-master.html",
  "nexus-air-quality.html",
  "nexus-scenario-settings.html",
  "nexus-forgot-password.html",
];
const pages = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_PAGES;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, // iPhone 12/13 benzeri
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: "tr-TR",
});
// auth.js guard'ı atlat: sahte oturum (yalnızca bu ölçüm bağlamında).
// Public (auth) sayfalar OTURUMSUZ bağlamda ölçülür; aksi halde guard
// örneği nexus-home.html'e yönlendirir ve ev sahibi ölçülür.
const anonCtx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: "tr-TR",
});
const PUBLIC_PAGES = [
  "nexus-login.html",
  "nexus-onboarding.html",
  "nexus-forgot-password.html",
  "nexus-register.html",
];
await ctx.addInitScript(() => localStorage.setItem("nexusCurrentUser", "layout-probe@nexus.local"));

const results = [];
for (const page of pages) {
  const useCtx = PUBLIC_PAGES.includes(page) ? anonCtx : ctx;
  const pg = await useCtx.newPage();
  try {
    await pg.goto(`http://127.0.0.1:${PORT}/${page}`, { waitUntil: "networkidle", timeout: 20000 });
    await pg.waitForTimeout(150); // ilk boyama + lucide ikonları otursun
    const m = await pg.evaluate(() => {
      const r = (el) => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { top: b.top, bottom: b.bottom, height: b.height, width: b.width };
      };
      const header = r(document.querySelector("header"));
      const main = r(document.querySelector("main") || document.querySelector(".picker-shell"));
      const nav = r(document.querySelector('nav[data-purpose="bottom-nav"]'));
      // Başlıklı sayfada içerik başlangıcı = başlığın altı; başlıksızda main üstü
      const contentStart = header ? header.bottom : main ? main.top : null;
      // CLS: bu sayfanın yaşamı boyunca birikmiş layout-shift ölçütü
      let cls = 0;
      try {
        for (const e of performance.getEntriesByType("layout-shift")) {
          if (!e.hadRecentInput) cls += e.value;
        }
      } catch {}
      return {
        header,
        main,
        nav,
        contentStart,
        cls,
        scrollH: document.documentElement.scrollHeight,
      };
    });
    results.push({ page, ...m });
  } catch (e) {
    results.push({ page, error: String(e).slice(0, 120) });
  }
  await pg.close();
}
await browser.close();
server.close();

// Rapor
const w = Math.max(...pages.map((p) => p.length)) + 2;
console.log(`\nCANLI KABUK ÖLÇÜMÜ (390×844) — ${results.length} sayfa\n`);
console.log("sayfa".padEnd(w) + "başlıkY  başlıkH  içerikY  menüH   sütunW   CLS");
for (const r of results) {
  if (r.error) {
    console.log(`${r.page.padEnd(w)} HATA: ${r.error}`);
    continue;
  }
  const f = (n) => (n === null || n === undefined ? "  —  " : String(Math.round(n)).padStart(4));
  const cls = r.cls === undefined ? "  —  " : r.cls.toFixed(3);
  console.log(
    `${r.page.padEnd(w)}${f(r.header?.top)}   ${f(r.header?.height)}   ${f(r.contentStart)}   ${f(r.nav?.height)}   ${f(r.main?.width)}   ${cls}`,
  );
}
const badCls = results.filter((r) => !r.error && r.cls > 0.05);
if (badCls.length)
  console.log(`CLS > 0.05: ${badCls.map((r) => `${r.page} (${r.cls.toFixed(3)})`).join(", ")}`);

// Uyum değerlendirmesi: başlıklı sayfalarda içerik başlangıcı tek seviyede mi?
const contentStarts = results
  .filter((r) => !r.error && r.contentStart !== null && r.header)
  .map((r) => ({ page: r.page, y: r.contentStart }));
if (contentStarts.length) {
  const ys = contentStarts.map((c) => c.y);
  const min = Math.min(...ys),
    max = Math.max(...ys);
  console.log(
    `\nBaşlık altı içerik başlangıcı: min ${Math.round(min)}px · max ${Math.round(max)}px · fark ${Math.round(max - min)}px`,
  );
  const outliers = contentStarts.filter((c) => Math.abs(c.y - min) > 6 && Math.abs(c.y - max) > 6);
  const spread = contentStarts.filter((c) => c.y !== min && c.y !== max);
  if (max - min > 6 && spread.length) {
    console.log("  Uyarı — farklı seviyeler:");
    for (const c of contentStarts) console.log(`    ${Math.round(c.y)}px  ${c.page}`);
  } else {
    console.log("  Tek seviye ✓");
  }
}
const navHeights = [...new Set(results.filter((r) => r.nav).map((r) => Math.round(r.nav.height)))];
console.log(
  `Alt menü yükseklikleri: ${navHeights.join("px, ") + "px"} (${results.filter((r) => r.nav).length} sayfada)`,
);
