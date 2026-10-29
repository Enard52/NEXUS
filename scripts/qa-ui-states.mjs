// NEXUS — her ekranı 3 durumda açıp temel kalite denetimi yapar (CLAUDE.md kural 7).
//   a) yeni kullanıcı: hesap var, cihaz yok
//   b) bir cihaz eşli: yerel ağda tek priz
//   c) çevrimdışı/hata: ağ kapalı, eşli cihaza ulaşılamıyor
// Denetimler (her durumda): yakalanmamış JS hatası yok; yatay taşma yok (412 px); temel erişilebilirlik
// (html lang, görsellerde alt, adsız buton/bağlantı yok, etiketsiz alan yok); yalnızca (a)'da: ekranda
// uydurma sayı+birim (°, %, kWh, W, AQI …) görünmez — cihaz yokken ölçüm gösterilemez.
// Dışa giden tüm ağ istekleri engellenir; bu denetim hiçbir dış servise gitmez.
// Mevcut borç scripts/qa-ui-baseline.json'da tutulur: yeni ihlal CI'ı kırar, eskiler yalnızca listelenir.
//   node scripts/qa-ui-states.mjs                    → denetle
//   node scripts/qa-ui-states.mjs --update-baseline  → mevcut durumu taban çizgisi yap (bilinçli karar)
import http from "node:http";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WWW = join(ROOT, "www");
const BASELINE = join(ROOT, "scripts", "qa-ui-baseline.json");
const UPDATE = process.argv.includes("--update-baseline");
const USER = "qa@nexus.local";
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".jpg": "image/jpeg", ".webp": "image/webp" };
const FAKE_DATA = /\d[\d.,]*\s*(°|%|kWh|kW\b|W\b|AQI|ppm|lux|Mbps)/i;
const PUBLIC = /^nexus-(login|onboarding|register|forgot-password)\.html$/;

const server = http.createServer((req, res) => {
  const file = join(WWW, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(WWW) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});

const STATES = {
  "yeni-kullanici": { devices: [], offline: false },
  "bir-cihaz": { devices: [{ name: "Salon Prizi", room: "Salon", host: "http://192.168.1.50", protocol: "shelly", caps: ["switch"], state: { switch: true } }], offline: false },
  "cevrimdisi": { devices: [{ name: "Salon Prizi", room: "Salon", host: "http://192.168.1.50", protocol: "shelly", caps: ["switch"], state: { switch: true } }], offline: true },
};

// Sayfa içinde çalışır: temel erişilebilirlik ve taşma denetimi.
function audit() {
  const out = [];
  const name = (el) => (el.getAttribute("aria-label") || el.getAttribute("title") || el.getAttribute("aria-labelledby") || el.textContent || "").trim();
  if (!document.documentElement.getAttribute("lang")) out.push("html-lang|<html lang> yok");
  document.querySelectorAll("img").forEach((img) => {
    if (!img.hasAttribute("alt")) out.push("img-alt|" + (img.getAttribute("src") || "").split("/").pop());
  });
  document.querySelectorAll("button, a[href], [role=button]").forEach((el) => {
    if (el.hidden || el.closest("[hidden], .hidden")) return;
    const hasImgAlt = el.querySelector("img[alt]:not([alt=''])");
    if (!name(el) && !hasImgAlt) out.push("ad-yok|" + el.tagName.toLowerCase() + "#" + (el.id || el.className.toString().slice(0, 40)));
  });
  document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea").forEach((el) => {
    if (el.closest("[hidden], .hidden")) return;
    const labelled = el.getAttribute("aria-label") || el.getAttribute("title") || el.getAttribute("aria-labelledby") || el.placeholder || (el.id && document.querySelector('label[for="' + el.id + '"]')) || el.closest("label");
    if (!labelled) out.push("alan-etiketi|" + el.tagName.toLowerCase() + "#" + (el.id || el.name || el.type));
  });
  if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push("yatay-tasma|" + document.documentElement.scrollWidth + ">" + window.innerWidth);
  return out;
}

const found = new Set();
const log = (page, state, kind, detail) => found.add(`${page}|${state}|${kind}|${detail}`);

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const pages = readdirSync(WWW).filter((f) => /^nexus-.*\.html$/.test(f) && !PUBLIC.test(f));
const browser = await chromium.launch();
for (const [state, cfg] of Object.entries(STATES)) {
  for (const page of pages) {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 900 } });
    await ctx.addInitScript(({ user, devices }) => {
      try {
        localStorage.setItem("nexusCurrentUser", user);
        localStorage.setItem(user + "_nexusUserEmail", user);
        localStorage.setItem(user + "_nexusUserName", "QA");
        localStorage.setItem(user + "_nexusNotifSetupDone", "1");
        if (devices.length) localStorage.setItem(user + "_nexusPairedDevices", JSON.stringify(devices));
      } catch (e) {}
    }, { user: USER, devices: cfg.devices });
    await ctx.route(new RegExp(`^https?://(?!127\\.0\\.0\\.1:${port}).*`), (r) => r.abort());
    const p = await ctx.newPage();
    p.on("pageerror", (e) => log(page, state, "js-hata", String(e.message).slice(0, 90)));
    try {
      await p.goto(`http://127.0.0.1:${port}/${page}`, { timeout: 10000 });
      // Çevrimdışı durum: sayfa yüklendikten sonra ağ kesilir; sayfanın sonraki istekleri ve
      // eşli cihaza ulaşma denemeleri başarısız olur (ekranın hata durumunu böyle görürüz).
      if (cfg.offline) await ctx.setOffline(true);
      await p.waitForTimeout(700);
      if (!/\/nexus-(login|onboarding|register)/.test(p.url())) {
        for (const item of await p.evaluate(audit)) {
          const [kind, ...rest] = item.split("|");
          log(page, state, kind, rest.join("|"));
        }
        if (state === "yeni-kullanici") {
          const text = await p.evaluate(() => document.body.innerText || "");
          for (const line of text.split("\n").map((l) => l.trim())) {
            if (line && line.length < 140 && FAKE_DATA.test(line)) log(page, state, "uydurma-veri", line);
          }
        }
      }
    } catch (e) {
      log(page, state, "acilmadi", String(e.message).slice(0, 80));
    }
    await ctx.close();
  }
}
await browser.close();
server.close();

const now = [...found].sort();
if (UPDATE) {
  writeFileSync(BASELINE, JSON.stringify(now, null, 2) + "\n");
  console.log(`Taban çizgisi yazıldı: ${now.length} bilinen ihlal.`);
  process.exit(0);
}
const base = new Set(existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : []);
const fresh = now.filter((k) => !base.has(k));
const fixed = [...base].filter((k) => !found.has(k));
console.log(`${pages.length} ekran × ${Object.keys(STATES).length} durum tarandı. Bilinen borç: ${base.size}, şimdi: ${now.length}, çözülen: ${fixed.length}.`);
if (fixed.length) console.log("Çözülenler taban çizgisinden düşürülebilir: --update-baseline");
if (fresh.length) {
  console.error(`\nYENİ ihlal (${fresh.length}):`);
  for (const k of fresh.slice(0, 60)) console.error("  " + k);
  process.exit(1);
}
