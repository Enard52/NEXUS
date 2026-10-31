#!/usr/bin/env node
/* Canlı i18n denetimi — uygulamanın TÜM ekranlarını İNGİLİZCE modda açar ve
   ekranda hâlâ Türkçe kalan metni ölçer.
   -------------------------------------------------------------------------
   Neden bu betik var: statik denetim (scripts/i18n-coverage.mjs) kaynak HTML'i
   okuyor; ama bir metin çalışma zamanında JS ile yazılabiliyor, yanlış sözlük
   grubuna düşebiliyor (2026-10-31: 45 anahtar `slots` bölgesinde duruyordu ve
   lookup() oraya hiç bakmıyordu) ya da şapkasız Türkçe olabiliyor ("Vurgu Rengi",
   "Oturum Aç", "Turuncu"). Bunların hiçbiri statik taramada görünmüyordu; hepsi
   kullanıcının ekranında Türkçe kalıyordu. Bu betik kullanıcıyı taklit eder.

   Kullanım:
     node scripts/i18n-live-check.mjs              # tüm ekranlar (www)
     node scripts/i18n-live-check.mjs settings     # adı "settings" olan ekranlar
     SERVE_DIR=src/app node scripts/i18n-live-check.mjs

   Çıkış kodu 1: ekranda Türkçe kalan satır ya da çevrilmemiş Türkçe anahtar var.
   Gürültü önlemi: sözlüğün İngilizce değerlerinde zaten geçen metinler (ör.
   "Back", "Home (Alt+1)") şikâyet edilmez — çevrilecek bir şey yoktur.

   Playwright gerekir (depoda kurulu: npm run audit:ui de kullanıyor). CI'da
   tarayıcı kurulmadığı için bu denetim `pnpm test`e değil, `npm run audit:all`
   ve elle yayına-hazırlık akışına bağlıdır. */
import http from "node:http";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SERVE_DIR = process.env.SERVE_DIR || "www";
const SERVE = join(ROOT, SERVE_DIR);
const PORT = Number(process.env.PORT || 4901);
const filter = process.argv[2];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".cjs": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
};

if (!existsSync(SERVE)) {
  console.error(`SERVE_DIR yok: ${SERVE} — önce \`npm run sync:www\` çalıştırın.`);
  process.exit(1);
}

const PAGES = readdirSync(SERVE)
  .filter((f) => /^nexus-.*\.html$/.test(f) && (!filter || f.includes(filter)))
  .sort();

/* Sözlüğün İngilizce tarafı: "çevrilmemiş" saymak için Türkçe görünümlü olmalı,
   salt "lookup'ta yok" yeterli değil (İngilizce arayüz metinleri de listeye düşüyor). */
const dictWin = {};
new Function("window", readFileSync(join(ROOT, "src", "app", "lang-en.js"), "utf8"))(dictWin);
const EN = dictWin.NEXUS_EN || {};
const EN_VALUES = new Set(
  Object.values(EN.text || {})
    .concat(Object.values(EN.slots || {}), Object.values(EN.html || {}))
    .map((v) => String(v).replace(/\s+/g, " ").trim()),
);
const TR = /[çğıöşüÇĞİÖŞÜ]/;
// Şapkasız Türkçe sözcükler (i18n-coverage.mjs'deki listeyle aynı amaçta).
const TR_WORDS =
  /\b(mavi|mor|turuncu|pembe|turkuaz|gri|siyah|beyaz|vurgu|renk|renkli|oturum|etkin|arama|klavye|genişlet|daralt|sürüm|haftalık|aylık|günlük|yıllık|sonuç|parola|yedek|davet|onay|iptal|kaydet|düzenle|yenile|sohbet|mesaj|bildirim|titreşim|hareket|sessiz|giris|cikis)\b/i;
/* Dil ADLARI ve ülke adları çevrilmez: İngilizce arayüzde de kendi yazımıyla durur
   ("Türkçe" seçeneği, saat dilimi satırındaki "Türkiye"). Bunlar eksik çeviri sayılmaz. */
const UNTRANSLATABLE = new Set(["Türkçe", "İngilizce", "Türkiye"]);
const looksTurkish = (s) => {
  const t = String(s).replace(/\s+/g, " ").trim();
  if (!t || UNTRANSLATABLE.has(t) || EN_VALUES.has(t)) return false;
  if (TR.test(t)) {
    /* Birleşik satırda (ör. saat dilimi satırı "Türkiye · 05:11 AM") tek Türkçe parça
       çevrilmeyen özel ada düşüyorsa bu eksik çeviri değil: Intl, tarihi İngilizce
       arayüzde de ülke adıyla yazar. Sözcük sözcük bakılır. */
    const words = t.match(/[^\s·|—–,]+/g) || [];
    if (words.every((w) => !TR.test(w) || UNTRANSLATABLE.has(w))) return false;
  }
  return TR.test(t) || TR_WORDS.test(t);
};

const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent((req.url || "/").split("?")[0]);
    if (p === "/" || p === "") p = "/index.html";
    const data = await readFile(join(SERVE, p.replace(/^\//, "")));
    res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: "en-US",
});
// İngilizce arayüz + oturumlu kullanıcı: aksi halde her ekran karşılamaya düşer ve
// denetim yalnızca onboarding sayfasını görür (bir kez tam da böyle "temiz" çıkmıştı).
await ctx.addInitScript(() => {
  try {
    localStorage.setItem("nexusLanguage", "en");
    localStorage.setItem("nexusCurrentUser", "qa@nexus.local");
    localStorage.setItem("nexusEverLoggedIn", "1");
    localStorage.setItem("nexusOnboarded", "1");
  } catch (e) {}
});

const CONCURRENCY = 4;
const results = [];
let cursor = 0;
async function worker() {
  for (;;) {
    const i = cursor++;
    if (i >= PAGES.length) return;
    const page = PAGES[i];
    const pg = await ctx.newPage();
    const errors = [];
    pg.on("pageerror", (e) => errors.push(String(e && e.message ? e.message : e)));
    try {
      await pg.goto(`http://127.0.0.1:${PORT}/${page}`, {
        waitUntil: "domcontentloaded",
        timeout: 25000,
      });
      await pg.waitForTimeout(1800);
      const data = await pg.evaluate(() => ({
        url: location.href,
        lang: document.documentElement.getAttribute("lang"),
        i18n: !!window.__nexusI18n,
        text: document.body ? document.body.innerText : "",
        missing: Object.keys(window.__i18nMissing || {}).concat(
          Object.keys(window.__i18nMissingHtml || {}),
        ),
      }));
      const visible = data.text
        .split("\n")
        .map((s) => s.replace(/\s+/g, " ").trim())
        .filter((s) => looksTurkish(s));
      results.push({
        page,
        redirected: !data.url.endsWith(page),
        lang: data.lang,
        i18n: data.i18n,
        untranslated: [...new Set(data.missing.filter(looksTurkish))],
        visible,
        errors: errors.slice(0, 3),
      });
    } catch (err) {
      results.push({
        page,
        failed: true,
        mesaj: String(err && err.message ? err.message : err).split("\n")[0],
      });
    } finally {
      await pg.close();
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await browser.close();
server.close();

results.sort((a, b) => a.page.localeCompare(b.page));
const bad = results.filter((r) => r.failed || r.visible.length || r.untranslated.length);
for (const r of bad) {
  if (r.failed) {
    console.log(`✗ ${r.page} — açılamadı: ${r.mesaj}`);
    continue;
  }
  console.log(
    `✗ ${r.page}${r.redirected ? " (yönlendirildi)" : ""} — çevrilmemiş ${r.untranslated.length}: ` +
      r.untranslated.join(" | "),
  );
  if (r.visible.length) console.log("    ekranda görünen Türkçe: " + r.visible.join(" | "));
  if (r.errors.length) console.log("    sayfa hatası: " + r.errors.join(" | "));
}
console.log(
  `\nCANLI i18n: ${results.length} ekran İngilizce açıldı · ${bad.length} ekranında Türkçe kaldı` +
    (PAGES.length === 0 ? " · HİÇ EKRAN BULUNAMADI (denetim işlevsiz)" : ""),
);
if (PAGES.length === 0) process.exitCode = 1;
else process.exitCode = bad.length ? 1 : 0;
