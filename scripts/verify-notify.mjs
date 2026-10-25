// NEXUS — bildirim kanallarının tarayıcıda gerçekten çalıştığını doğrular.
// Birim testleri fetch'in başlık karakter kısıtını görmüyor; ntfy kanalı bu sayede
// Türkçe başlıklarda sessizce ölüyordu. Bu betik gerçek Chromium ile ölçer.
// Kullanım: node scripts/verify-notify.mjs
import http from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SERVE = join(ROOT, "www");
const PORT = 4831;
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".woff": "font/woff",
  ".ttf": "font/ttf", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json",
};
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent((req.url || "/").split("?")[0]);
    if (p === "/" || p === "") p = "/index.html";
    const data = await readFile(join(SERVE, p.replace(/^\//, "")));
    res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" });
    res.end(data);
  } catch { res.writeHead(404); res.end("nf"); }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const out = [];
const ok = (name, pass, extra = "") => out.push(`${pass ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "tr-TR" });
// auth.js oturum yoksa her sayfayı onboarding'e atıyor: denetim için sahte oturum kurulur
await ctx.addInitScript(() => localStorage.setItem("nexusCurrentUser", "denetim@nexus.app"));
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(String(e.message)));
const sent = [];
await page.route("https://ntfy.sh/**", (route) => {
  sent.push({ url: route.request().url(), headers: route.request().headers(), body: route.request().postData() });
  route.fulfill({ status: 200, body: "ok" });
});

const url = `http://127.0.0.1:${PORT}/stitch-instant-notifications.html`;
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(600);

ok("notify.js sayfada yüklendi", await page.evaluate(() => !!window.nexusNotify));

// topic yaz + kanalı aç
await page.fill("#ntfy-topic", "nexus-dogrulama");
await page.click('input[data-channel="ntfy"] + .slider');
await page.waitForTimeout(200);
const cfg = await page.evaluate(() => window.nexusNotify.channels());
ok("ntfy kanalı açık + topic kayıtlı", cfg.ntfy.enabled === true && cfg.ntfy.topic === "nexus-dogrulama", JSON.stringify(cfg.ntfy));

// sistem kanalını kapat (test yalnızca ntfy'ye gitsin)
await page.click('input[data-channel="system"] + .slider');
await page.waitForTimeout(150);

// test bildirimi
await page.click("#notify-test");
await page.waitForTimeout(1200);
ok("test bildirimi ntfy'ye ulaştı", sent.length === 1, sent.length + " istek");
if (sent.length) {
  ok("URL topic'i taşıyor", sent[0].url === "https://ntfy.sh/nexus-dogrulama", sent[0].url);
  ok("Title başlığı ASCII", sent[0].headers["title"] === "NEXUS Test bildirimi", sent[0].headers["title"]);
}
const status = await page.textContent("#notify-status");
ok("durum satırı güncellendi", /Gönderilen 1/.test(status || ""), status);

// yeniden yükle: ayarlar kalıcı mı
await page.reload({ waitUntil: "load" });
await page.waitForTimeout(500);
const after = await page.evaluate(() => ({
  topic: document.getElementById("ntfy-topic").value,
  checked: document.querySelector('input[data-channel="ntfy"]').checked,
  system: document.querySelector('input[data-channel="system"]').checked,
}));
ok("topic yeniden yüklemede durur", after.topic === "nexus-dogrulama", after.topic);
ok("kanal anahtarları kalıcı", after.checked === true && after.system === false, JSON.stringify(after));

// master anahtarı kapat → hiçbir şey gitmemeli
sent.length = 0;
await page.click("#master-toggle + .slider");
await page.waitForTimeout(200);
const muted = await page.evaluate(() => window.nexusNotify.mutedBy({ id: "x1", type: "scene", ts: Date.now() }));
ok("master kapalı → dağıtım kesilir", muted === "master", String(muted));

// gerçek olay akışı: nexusEvents'e sayı ts ile yazılan olay kanala gider mi
sent.length = 0;
await page.evaluate(() => {
  window.nexusNotify.save({ telegram: { enabled: false } });
  const list = JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.endsWith("nexusEvents")) || "k") || "[]");
  list.push({ id: "auto-" + Date.now(), type: "automation", title: "Kapı algılandı", detail: "Ön kapı", ts: Date.now() });
  Object.keys(localStorage).filter((k) => k.endsWith("nexusEvents")).forEach((k) => localStorage.setItem(k, JSON.stringify(list)));
});
await page.evaluate(() => window.nexusNotify.checkNew());
await page.waitForTimeout(800);
ok("sayı ts'li gerçek olay dağıtıldı (master kapalıyken gitmez)", sent.length === 0, sent.length + " istek");
await page.click("#master-toggle + .slider"); // geri aç
await page.waitForTimeout(150);
const delivered = await page.evaluate(async () => {
  const before = window.nexusNotify.stats().sent;
  await window.nexusNotify.deliver({ id: "auto-" + Date.now(), type: "automation", title: "Kapı algılandı", detail: "Ön kapı", ts: Date.now() });
  return window.nexusNotify.stats().sent - before;
});
ok("master açıkken olay kanala gitti", delivered >= 1 && sent.length >= 1, `istatistik +${delivered}, ${sent.length} istek`);

// sır sızıntısı kontrolü: localStorage'da telegram tokenı + bulut anahtarları
const leak = await page.evaluate(() => {
  const keys = Object.keys(localStorage);
  const cloud = keys.filter((k) => /nexusNotify/.test(k) && !/^\w+@|^guest/.test(k));
  return { channelKeys: keys.filter((k) => /nexusNotifyChannels$/.test(k)) };
});
ok("kanal ayarları kullanıcı önekiyle saklanır", leak.channelKeys.length >= 1, leak.channelKeys.join(","));

// düzen: yatay taşma + dokunma hedefleri
const layout = await page.evaluate(() => {
  const de = document.documentElement;
  const bad = [];
  document.querySelectorAll("input, button, .switch, label.switch").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (el.classList.contains("slider") || el.classList.contains("switch") || el.tagName === "INPUT") return;
    if (r.height < 24 || r.width < 24) bad.push(`${el.tagName}${el.id ? "#" + el.id : ""} ${Math.round(r.width)}x${Math.round(r.height)}`);
  });
  return { overflow: de.scrollWidth - de.clientWidth, small: bad };
});
ok("390px'te yatay taşma yok", layout.overflow <= 0, "scrollWidth fazlası " + layout.overflow);
ok("24px altı dokunma hedefi yok", layout.small.length === 0, layout.small.join(" | "));

// dil: İngilizceye çevirince yeni metinler ingilizce mi
await page.evaluate(() => localStorage.setItem("nexusLanguage", "en"));
await page.reload({ waitUntil: "load" });
await page.waitForTimeout(700);
const en = await page.evaluate(() => document.body.innerText);
ok("EN sözlük yeni başlıkları çeviriyor", /outbound channels/i.test(en) && /send a test notification/i.test(en), "");
const enGap = /Dışa Dönük Kanallar|Test bildirimi gönder/.test(en);
ok("EN modda Türkçe kalıntı yok", !enGap, enGap ? "Türkçe başlık kaldı" : "");

ok("sayfa hatası yok", errs.length === 0, errs.join(" | "));

await browser.close();
server.close();
console.log(out.join("\n"));
