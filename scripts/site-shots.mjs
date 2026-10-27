// Gerçek uygulama ekran görüntüleri (issue #2 — sahte/stok görsel yok).
// Uygulamanın KENDİ SAYFALARINDAN Playwright ile yakalanır:
//   node scripts/site-shots.mjs
// Çıktı: www/public/images/shots/<ad>.png (Türkçe) + images/shots/en/<ad>.png (İngilizce).
// Ekranların hangi sayfadan geldiği site-build'in hero etiketleriyle birebir aynı olmalı;
// scripts/verify-site.mjs bu listeyi okuyup karşılaştırıyor.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_TR = join(ROOT, "www", "public", "images", "shots");
const OUT_EN = join(ROOT, "www", "public", "images", "shots", "en");
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
mkdirSync(OUT_TR, { recursive: true });
mkdirSync(OUT_EN, { recursive: true });

// Hava durumu kartı ağ isteğini beklemesin: açık-meteo'ya kısa süre tanınır.
const PAGES = [
  { name: "home", path: "stitch-home.html", wait: 1400 },
  // "Cihaz Ekleme Merkezi": uygulamanin gercek cihaz ekleme/protokol secim ekrani.
  // Onceki "devices" kaynagi stitch-device.html (tek cihaz DETAYI) idi; kimlik secilmeden
  // acildiginda "Cihaz bulunamadi" hata karti yakalaniyordu (canli sitede olculdu).
  { name: "pair", path: "stitch-pair.html", wait: 1000 },
  { name: "energy", path: "stitch-energy.html", wait: 800 },
  { name: "smart", path: "stitch-smart.html", wait: 800 },
  { name: "chat", path: "stitch-chat.html", wait: 900 },
  { name: "lighting", path: "stitch-lighting-master.html", wait: 800 },
  { name: "scenes", path: "stitch-movie-mode.html", wait: 800 },
  { name: "settings", path: "stitch-settings.html", wait: 800 },
];

// Pazarlama sitesinin hero'su bu görselleri "şu ekran" diye etiketliyor. Bazı uygulama
// sayfaları kimlik/parametre olmadan açıldığında boşluk veya HATA kartı gösteriyor
// (stitch-device.html → "Cihaz bulunamadı"): canlı sitede o hata kartı "Cihazlar &
// Odalar" etiketiyle yayınlanmıştı. Ekran görüntüsü hata/boş durum yakalarsa betik
// durur — bayat ya da yanlış görsel üretim hattına giremez.
// Aşağıdaki diziler UYGULAMANIN KENDİ metinleridir (ölçüldü), uydurma değil.
const BANNED = [
  // kırık/hatalı durum
  "cihaz bulunamadı", "device not found",
  // cihaz bekleyen boş durumlar: hero'da "boş ekran" pazarlanmaz
  "aydınlatma cihazı yok", "no lighting devices",
  "önce cihaz ekle", "add a device first",
  "henüz eklenmiş cihaz yok", "henüz kayıtlı cihaz yok",
];

// Örnek ev: ekranlar uygulamanın KENDİ depolama biçimiyle doldurulur (nexusPairedDevices /
// nexusHousehold), yani görseldeki arayüz gerçek arayüzün ta kendisidir; yalnızca içindeki
// veri bir kullanıcının kurulu evi gibi görünür. protocol alanı BİLEREK yazılmaz:
// device-controls.js isLan() protocol istediği için hiçbir cihaz ağa pinglenmez —
// yakalama çevrimdışı da aynı çıkar ve ağ bekleyerek zaman kaybedilmez.
const SAMPLE_HOME = {
  tr: {
    rooms: ["Salon", "Yatak Odası", "Mutfak"],
    devices: [
      { id: "paired-0", name: "Salon Ampulü", host: "192.168.1.21", icon: "lightbulb", img: "generic-led-bulb.png", room: "Salon" },
      { id: "paired-1", name: "Tavan Aydınlatması", host: "192.168.1.22", icon: "lightbulb", img: "generic-ceiling-light.png", room: "Salon" },
      { id: "paired-2", name: "Yatak Odası Lambası", host: "192.168.1.23", icon: "lightbulb", img: "generic-table-lamp.png", room: "Yatak Odası" },
      { id: "paired-3", name: "Mutfak Prizi", host: "192.168.1.24", icon: "plug", img: "generic-smart-plug.png", room: "Mutfak" },
      { id: "paired-4", name: "Salon Hoparlörü", host: "192.168.1.25", icon: "speaker", img: "generic-smart-speaker.png", room: "Salon" },
    ],
  },
  en: {
    rooms: ["Living Room", "Bedroom", "Kitchen"],
    devices: [
      { id: "paired-0", name: "Living Room Light", host: "192.168.1.21", icon: "lightbulb", img: "generic-led-bulb.png", room: "Living Room" },
      { id: "paired-1", name: "Ceiling Light", host: "192.168.1.22", icon: "lightbulb", img: "generic-ceiling-light.png", room: "Living Room" },
      { id: "paired-2", name: "Bedroom Lamp", host: "192.168.1.23", icon: "lightbulb", img: "generic-table-lamp.png", room: "Bedroom" },
      { id: "paired-3", name: "Kitchen Plug", host: "192.168.1.24", icon: "plug", img: "generic-smart-plug.png", room: "Kitchen" },
      { id: "paired-4", name: "Living Room Speaker", host: "192.168.1.25", icon: "speaker", img: "generic-smart-speaker.png", room: "Living Room" },
    ],
  },
};

// addInitScript fonksiyonu seri hale getirildiği için kapanış kullanamaz: veriler
// ikinci argümanla (SEED_ARG) geçilir.
const seedFn = (h) => {
  localStorage.setItem("nexusLanguage", h.lang);
  localStorage.setItem("nexusCurrentUser", "shots@nexus.local");
  localStorage.setItem("shots@nexus.local_nexusOnboarded", "true");
  localStorage.setItem("shots@nexus.local_nexusPairedDevices", JSON.stringify(h.devices));
  localStorage.setItem("shots@nexus.local_nexusHousehold", JSON.stringify([{ name: "Ev", rooms: h.rooms }]));
};
const SEED_ARG = {
  tr: { lang: "tr", devices: SAMPLE_HOME.tr.devices, rooms: SAMPLE_HOME.tr.rooms },
  en: { lang: "en", devices: SAMPLE_HOME.en.devices, rooms: SAMPLE_HOME.en.rooms },
};

const browser = await chromium.launch();

// Ortak: sayfayı aç, hata/boş durum var mı diye metnine bak, sonra yakala.
async function shoot(context, p, outDir, tag) {
  const pg = await context.newPage();
  await pg.goto(`http://127.0.0.1:${PORT}/${p.path}`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await pg.waitForTimeout(p.wait);
  // FAB gerçek telefonda sağ kenara yapışık (right:0, sol köşeleri yuvarlak). Kaydırma
  // çubuğu ve dock animasyonu onu içeride yüzer gibi gösteriyordu.
  await pg.addStyleTag({
    content:
      "html,body{overflow:hidden!important;margin:0}" +
      ".nexus-ai-fab{transform:none!important;opacity:1!important;right:0!important}" +
      ".nexus-ai-fab .fab-label{display:none!important}",
  });
  await pg.evaluate(() => {
    const fab = document.querySelector(".nexus-ai-fab");
    if (fab) {
      fab.classList.remove("docked", "show-label", "pulse");
    }
  });
  const body = (await pg.evaluate(() => document.body.innerText)).toLowerCase();
  const bad = BANNED.filter((b) => body.includes(b));
  if (bad.length) {
    console.error(`✗ ${tag} ${p.name}: kaynakta hata/boş durum var (${bad.join(" | ")}) — ${p.path}`);
    console.error("  Hero'da bu ekran pazarlanamaz: ya örnek evi genişlet (SAMPLE_HOME),\n  ya da PAGES listesinden dolu bir ekran seç.");
    process.exitCode = 1;
    await pg.close();
    return false;
  }
  await pg.screenshot({ path: join(outDir, `${p.name}.png`) });
  console.log(`✓ ${tag}: ${p.name}.png`);
  await pg.close();
  return true;
}

// 1. Türkçe Ekran Görüntüleri
const ctxTr = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "tr-TR",
});
await ctxTr.addInitScript(seedFn, SEED_ARG.tr);

console.log("→ Türkçe ekran görüntüleri yakalanıyor…");
for (const p of PAGES) await shoot(ctxTr, p, OUT_TR, "TR");
await ctxTr.close();

// 2. İngilizce Ekran Görüntüleri
const ctxEn = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "en-US",
});
await ctxEn.addInitScript(seedFn, SEED_ARG.en);

console.log("→ İngilizce ekran görüntüleri yakalanıyor…");
for (const p of PAGES) await shoot(ctxEn, p, OUT_EN, "EN");
await ctxEn.close();

await browser.close();
server.close();
if (process.exitCode) {
  console.error("✗ Ekran görüntüleri eksik: yukarıdaki hata/boş durum sayfalarını düzelt.");
} else {
  console.log("Tüm ekran görüntüleri (TR & EN) hazır:", OUT_TR);
}
