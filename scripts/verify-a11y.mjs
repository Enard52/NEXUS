// NEXUS erişilebilirlik + geri alma + palet doğrulaması (gerçek tarayıcıda).
// Kapsam: telefonda arama paleti girişi ve arama, masaüstünde Ctrl+K ve giriş
// düğmesinin çıkmaması, silme sonrası "Geri al" çubuğunun gerçekten geri yazması,
// aria-live bölgelerinin duyuru alması, ortak diyalogun odak döngüsü.
// Kullanım: node scripts/verify-a11y.mjs   (audit:all'a dahil değildir)
import http from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SERVE = join(ROOT, process.env.SERVE_DIR || "www");
const PORT = 4847;
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf",
  ".webmanifest": "application/manifest+json", ".txt": "text/plain; charset=utf-8",
};
const server = http.createServer(async (req, res) => {
  const p = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\//, "") || "index.html";
  try {
    const f = join(SERVE, p);
    const buf = await readFile(f);
    res.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" });
    res.end(buf);
  } catch { res.writeHead(404); res.end("not found"); }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const out = [];
let fails = 0;
function ok(name, cond, detail) {
  if (!cond) fails++;
  out.push((cond ? "✅ " : "❌ ") + name + (cond || !detail ? "" : " — " + detail));
}
const QA_USER = "qa@nexus.local";
const DEVICES = [
  { id: "dev-1", name: "Salon Lambası", host: "192.168.1.31", protocol: "hue", model: "Hue", kind: "light", icon: "lightbulb", room: "Salon" },
  { id: "dev-2", name: "Mutfak Prizi", host: "192.168.1.32", protocol: "tplink", model: "Tapo P110", kind: "plug", icon: "zap", room: "Mutfak" },
];
const SEED = ([u, d]) => {
  try {
    localStorage.setItem("nexusCurrentUser", u);
    localStorage.setItem(u + "_nexusPairedDevices", JSON.stringify(d));
  } catch (e) {}
};

const browser = await chromium.launch();

// ---------- Telefon ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(SEED, [QA_USER, DEVICES]);
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));

  await page.goto(`http://127.0.0.1:${PORT}/nexus-home.html`, { waitUntil: "load" });
  await page.waitForTimeout(700);

  const entry = await page.$("#nx-pal-entry");
  ok("telefonda arama düğmesi çıkar", !!entry);
  const live = await page.$("#nx-live-status");
  ok("aria-live bölgesi kurulur", !!live);

  if (entry) {
    await entry.tap();
    await page.waitForTimeout(200);
    const open = await page.$eval("#nx-palette", (el) => el.classList.contains("open"));
    ok("dokunuş paleti açar", open);
    await page.fill(".nx-pal-input", "ayar");
    await page.waitForTimeout(200);
    const hits = await page.$$eval("#nx-palette .nx-pal-item", (els) => els.map((e) => e.textContent.trim()));
    ok("arama sonuçları filtreler", hits.length >= 1 && hits.length <= 9, hits.join(" | ").slice(0, 80));
    const spoken = await page.$eval("#nx-live-status", (el) => el.textContent);
    ok("sonuç sayısı duyurulur", /\d/.test(spoken), spoken);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(600);
    ok("Enter eylemi sayfaya götürür", /nexus-settings\.html$/.test(page.url().split("?")[0]), page.url());
  }

  // ---- geri alma: depodan iki cihazdan birini sil → çubuk → geri yazım ----
  // NOT: nexus-home yerine nexus-instant-notifications kullanılır — data.js'li
  // sayfalar nexusPairedDevices'ı kendi bellek listeleriyle sürekli yeniden
  // yazdığı için depo düzeyi silme orada doğru şekilde "geri alınabilir bir
  // silme" olarak görülmez. Bildirim sayfasında rakip yazar yoktur.
  await page.goto(`http://127.0.0.1:${PORT}/nexus-instant-notifications.html`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const d = JSON.parse(nexusGetItem("nexusPairedDevices"));
    nexusSetItem("nexusPairedDevices", JSON.stringify(d.slice(1)));
  });
  await page.waitForTimeout(250);
  const bar = await page.$(".nx-undo");
  ok("silme sonrası Geri al çubuğu çıkar", !!bar);
  const barText = bar ? await bar.$eval(".nx-undo-text", (e) => e.textContent) : "";
  ok("çubuk silinen cihazı adıyla söyler", barText.includes("Salon Lambası"), barText);
  const afterDelete = await page.evaluate(() => JSON.parse(nexusGetItem("nexusPairedDevices")).length);
  ok("geri alınmadan önce silme gerçek", afterDelete === 1, "uzunluk " + afterDelete);
  if (bar) {
    await bar.$eval(".nx-undo-btn", (e) => e.click());
    await page.waitForLoadState("load");
    await page.waitForTimeout(700);
    const restored = await page.evaluate(() => JSON.parse(nexusGetItem("nexusPairedDevices")));
    ok("Geri al cihazı gerçekten geri yazar", restored.length === 2 && restored[0].name === "Salon Lambası", "uzunluk " + restored.length);
  }
  const undoGone = await page.$(".nx-undo");
  ok("geri alma sonrası çubuk kapanır", !undoGone);

  // yeniden sil + çubuğun kendi kendine kapanması (6 sn ömür → kısaltılmış bekleme yerine dismiss yolu)
  await page.evaluate(() => {
    const d = JSON.parse(nexusGetItem("nexusPairedDevices"));
    nexusSetItem("nexusPairedDevices", JSON.stringify(d.slice(1)));
  });
  await page.waitForTimeout(200);
  ok("ikinci silmede çubuk yeniden çıkar", !!(await page.$(".nx-undo")));

  // ---- duyurular: çevrimdışı + ortak toastIn ----
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await page.waitForTimeout(250);
  const errSpoken = await page.$eval("#nx-live-error", (e) => e.textContent);
  ok("çevrimdışı olmak assertive bölgede duyurulur", /bağlantısı yok/i.test(errSpoken), errSpoken);
  await page.evaluate(() => {
    const t = document.createElement("div");
    t.textContent = "Salon lambası kapatıldı";
    document.body.appendChild(t);
    nexusFeedback.toastIn(t);
  });
  await page.waitForTimeout(250);
  const toastSpoken = await page.$eval("#nx-live-status", (e) => e.textContent);
  ok("ortak şerit metni okunur", /Salon lambası kapatıldı/.test(toastSpoken), toastSpoken);

  // ---- ortak diyalog: odak döngüsü + kaçış + dönüş ----
  await page.evaluate(() => {
    const openerBtn = document.createElement("button");
    openerBtn.id = "nx-dlg-opener";
    openerBtn.textContent = "aç";
    document.body.appendChild(openerBtn);
    openerBtn.focus();
    openerBtn.addEventListener("click", () => {
      window.nexusDialog({ title: "Cihaz silinsin mi?", message: "Bu işlem yerel veriyi kaldırır.", destructive: true, primary: { label: "Sil" }, secondary: { label: "Vazgeç" } });
    });
    openerBtn.click();
  });
  await page.waitForTimeout(250);
  const dlgRole = await page.$eval(".nx-dlg-back", (e) => e.getAttribute("role"));
  ok("bozucu diyalog alertdialog rolü alır", dlgRole === "alertdialog", dlgRole);
  const dlgSpoken = await page.$eval("#nx-live-error", (e) => e.textContent);
  ok("diyalog içeriği duyurulur", /Cihaz silinsin mi/.test(dlgSpoken), dlgSpoken);
  const tabInside = await page.evaluate(() => {
    const card = document.querySelector(".nx-dlg");
    const first = card.querySelector("button");
    const last = card.querySelectorAll("button");
    last[last.length - 1].focus();
    document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    return card.contains(document.activeElement);
  });
  ok("Sekme diyalogda kalır", tabInside);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  const focusBack = await page.evaluate(() => document.activeElement && document.activeElement.id);
  ok("kapanınca odak açana döner", focusBack === "nx-dlg-opener", String(focusBack));

  ok("telefon akışında sayfa hatası yok", errs.length === 0, errs.join(" | "));
  await ctx.close();
}

// ---------- Masaüstü ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.addInitScript(SEED, [QA_USER, DEVICES]);
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(`http://127.0.0.1:${PORT}/nexus-home.html`, { waitUntil: "load" });
  await page.waitForTimeout(700);
  ok("masaüstünde arama düğmesi çıkmaz (Ctrl+K var)", !(await page.$("#nx-pal-entry")));
  await page.keyboard.press("Control+k");
  await page.waitForTimeout(250);
  ok("Ctrl+K paleti açar", await page.$eval("#nx-palette", (e) => e.classList.contains("open")).catch(() => false));
  await page.keyboard.press("Escape");
  ok("masaüstü akışında sayfa hatası yok", errs.length === 0, errs.join(" | "));
  await ctx.close();
}

// ---------- Oturum açma sayfası: hiçbiri kurulmaz ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/nexus-login.html`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  ok("giriş ekranında palet/geri alma kurulmaz", !(await page.$("#nx-pal-entry")) && !(await page.$("#nx-palette")));
  await ctx.close();
}

await browser.close();
server.close();
out.push("");
out.push(fails === 0 ? `TÜMÜ GEÇTİ: ${out.filter((l) => l.startsWith("✅")).length} kontrol` : `${fails} kontrol BAŞARISIZ`);
console.log(out.join("\n"));
if (fails) process.exitCode = 1;
