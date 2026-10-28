// Otomasyon motoru canlı doğrulaması (issue #24) — Playwright/Chromium.
// ---------------------------------------------------------------------
// Sahte oturum + saati 2 dakika önce geçmiş bir zaman tetikleyicili
// otomasyon ekler; motorun evaluate() çağrısında kuralı gerçekten
// çalıştırıp nexusAutomationRuns + nexusEvents kayıtlarını yazdığını
// doğrular. Ardından dürüstlük düzeltmesi yapılan ekranların görünümünü
// denetler (enerji "—", kameralar boş durum, ev planı boş durum).
//
// Kullanım: node scripts/verify-automation-live.mjs

import http from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4823;
const USER = "probe@nexus.local";
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

const past = new Date(Date.now() - 2 * 60 * 1000);
const pastHHMM =
  String(past.getHours()).padStart(2, "0") + ":" + String(past.getMinutes()).padStart(2, "0");

// NOT: addInitScript kapama değişkenlerini taşımaz VE bu Playwright sürümünde
// tek argüman güvenlidir; değerler TEK nesne olarak geçirilir. Aksi halde
// tohumlama sayfada sessizce bozulur (undefined alanlar JSON'a yazılmaz) ve
// auth guard ölçümü başka sayfaya yönlendirir.
const seed = (cfg) => {
  localStorage.setItem("nexusCurrentUser", cfg.user);
  localStorage.setItem(
    cfg.user + "_nexusCustomAutomations",
    JSON.stringify([
      {
        id: "test-auto-1",
        title: "Test Otomasyonu",
        desc: "motor doğrulaması",
        icon: "clock",
        bgClass: "bg-blue-100",
        colorClass: "text-[#4C7DFF]",
        enabled: true,
        showOnHome: true,
        showInRoom: false,
        trigger: { type: "time", value: cfg.hhmm, repeat: "daily" },
        sceneId: "good-morning",
        actions: [],
      },
    ]),
  );
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "tr-TR" });
await ctx.addInitScript(seed, { user: USER, hhmm: pastHHMM });

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log((ok ? "✓ " : "✗ ") + name + (detail ? " — " + detail : ""));
};

// --- 1) Motor: zaman tetikleyicisi gerçekten çalışıyor mu? ---
{
  const pg = await ctx.newPage();
  await pg.goto(`http://127.0.0.1:${PORT}/stitch-home.html`, { waitUntil: "networkidle" });
  await pg
    .waitForFunction(() => window.NexusAutomationEngine, null, { timeout: 15000 })
    .catch(() => {});
  const engine = await pg.evaluate(() => !!window.NexusAutomationEngine);
  check("automation-engine.js yüklendi", engine);
  if (engine) {
    const ran = await pg.evaluate(() => window.NexusAutomationEngine.evaluate());
    await pg.waitForTimeout(800); // yürütme + log asenkron
    const state = await pg.evaluate((user) => {
      const k = (key) => user + "_" + key;
      const runs = JSON.parse(localStorage.getItem(k("nexusAutomationRuns")) || "{}");
      const evs = JSON.parse(localStorage.getItem(k("nexusEvents")) || "[]");
      return {
        run: runs["test-auto-1"] || null,
        event: evs.find((e) => e.type === "automation") || null,
      };
    }, USER);
    check(
      "tetikleyici çalıştı (runs kaydı)",
      !!state.run,
      state.run ? new Date(state.run.ts).toISOString() : "kayıt yok",
    );
    check(
      "olay günlüğüne yazıldı (nexusEvents)",
      !!state.event,
      state.event ? state.event.detail : "olay yok",
    );
  }
  await pg.close();
}

// --- 2) Enerji ekranı: uydurma kWh yok, dürüst boş durum ---
{
  const pg = await ctx.newPage();
  await pg.goto(`http://127.0.0.1:${PORT}/stitch-energy.html`, { waitUntil: "networkidle" });
  const power = await pg.textContent("#live-power");
  const note = await pg.textContent("#live-power-note");
  check(
    "enerji: anlık tüketim boş durumda '—'",
    power.trim() === "—",
    "değer: '" + power.trim() + "'",
  );
  check("enerji: dürüst açıklama var", note.includes("Güç ölçen"), note.trim());
  await pg.close();
}

// --- 3) Kameralar: cihaz yoksa dürüst boş durum; sahte KAYITTA yok ---
{
  const pg = await ctx.newPage();
  await pg.goto(`http://127.0.0.1:${PORT}/stitch-multi-video.html`, { waitUntil: "networkidle" });
  const emptyVisible = await pg.isVisible("#camera-empty");
  const hasFakeBadge = (await pg.content()).includes("KAYITTA");
  const body = await pg.textContent("body");
  check("kameralar: boş durum görünüyor", emptyVisible);
  check("kameralar: sahte 'KAYITTA' yok", !hasFakeBadge);
  check("kameralar: stok 'canlı' iddiası yok", !/Tüm Kameralar \(Canlı\)/.test(body));
  await pg.close();
}

// --- 4) Ev Planı: gerçek otomasyon listelenir, uydurma program yok ---
{
  const pg = await ctx.newPage();
  await pg.goto(`http://127.0.0.1:${PORT}/stitch-home-schedule.html`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(400);
  const cards = await pg.locator("#schedule-list a").count();
  const hasFake = (await pg.textContent("body")).includes("Kahve Makinesi");
  check("ev planı: tohumlanmış otomasyon listelendi", cards === 1, "kart: " + cards);
  check("ev planı: uydurma 'Kahve Makinesi' programı yok", !hasFake);
  await pg.close();
}

// --- 5) Beceriler: sahne seçici + dürüstlük notu ---
{
  const pg = await ctx.newPage();
  await pg.goto(`http://127.0.0.1:${PORT}/stitch-skills.html?type=automation`, {
    waitUntil: "networkidle",
  });
  await pg.click('button.nx-reset:has-text("Konum")');
  await pg.waitForTimeout(300);
  const note = await pg.isVisible("text=Bu tetikleyici türü henüz otomatik çalışmıyor");
  const sceneButtons = await pg.locator("#scene-option-list button").count();
  check("beceriler: dürüstlük notu görünüyor (Konum kartı)", note);
  check("beceriler: senaryo seçici dolu", sceneButtons > 5, "seçenek: " + sceneButtons);
  await pg.close();
}

// --- 6) Akıllı sayfa: motor notu + son çalışma bilgisi ---
{
  const pg = await ctx.newPage();
  await pg.goto(`http://127.0.0.1:${PORT}/stitch-smart.html?tab=tab-automation`, {
    waitUntil: "networkidle",
  });
  await pg.waitForTimeout(400);
  const noteVisible = await pg.isVisible('[data-purpose="automation-engine-note"]');
  const meta = (
    await pg.locator("#custom-automations-container .text-\\[10px\\]").allTextContents()
  ).join(" | ");
  check("akıllı: çalışma bilgisi notu var", noteVisible);
  check("akıllı: kartta saat/son çalışma bilgisi var", meta.includes(pastHHMM), meta || "meta yok");
  await pg.close();
}

await browser.close();
server.close();
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `\n${failed} DENETİM BAŞARISIZ` : "\nTÜM DENETİMLER GEÇTİ ✓");
process.exit(failed ? 1 : 0);
