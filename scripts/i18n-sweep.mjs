#!/usr/bin/env node
// NEXUS i18n taraması — arayüzü İngilizce yükleyip ekranda kalan Türkçe metni sayar.
// -------------------------------------------------------------------------
// Statik kapsam denetimi (scripts/i18n-coverage.mjs) kaynak HTML'i, öznitelikleri ve
// JS katalog alanlarını okur. Ama bir metin çalışma zamanında JS ile üretilebilir,
// yanlış sözlük grubuna düşebilir (2026-10-31: 45 anahtar `slots` bölgesinde duruyordu
// ve lookup() oraya hiç bakmıyordu) ya da şapkasız Türkçe olabilir ("Vurgu Rengi",
// "Oturum Aç", "Turuncu"). Bu araç kullanıcıyı taklit eder: ekranı İngilizce açar,
// ekranda ve çevirmenin eksik-listesinde kalan Türkçe metni ölçer.
//
// Kullanım:
//   node scripts/i18n-sweep.mjs              # tüm ekranlar (www), masaüstü + telefon
//   node scripts/i18n-sweep.mjs settings     # adı "settings" içeren ekranlar
//   SERVE_DIR=src/app node scripts/i18n-sweep.mjs
//
// Çıkış kodu 1: çevrilmemiş Türkçe metin var. Eskiden yalnız bilgi verip 0 çıkıyordu,
// bu yüzden liste birikse de hiçbir yerde durmuyordu.
//
// Gürültü önlemleri — bunlar eksik çeviri SAYILMAZ:
//   • sözlüğün İngilizce değerlerinde zaten geçen metinler ("Back", "Home (Alt+1)")
//   • dil ve ülke adları ("Türkçe", "İngilizce", "Türkiye"): Intl tarihi İngilizce
//     arayüzde de "Türkiye · 05:11 AM" diye yazar
//   • şapkasız/akran metinler yerine gerçek sözlük anahtarı baz alınır (TR_WORDS)
//   Fixture cihaz adları bilerek İNGİLİZCE: kullanıcı kendi cihazına Türkçe isim
//     verirse o veri çevrilmez (kullanıcı verisi ≠ arayüz metni). Eski fixture Türkçe
//     adlar taşıyordu ve 36 "kalıntı" satırının neredeyse tamamı cihaz/oda/ülke
//     adıydı — rapor o gürültüde çeviri eksiği hiç okunmuyordu.
//
// Playwright gerekir (depoda kurulu: npm run audit:ui de kullanıyor). CI'da tarayıcı
// kurulmadığı için bu denetim `pnpm test`e değil, `npm run audit:all` ve elle
// yayına-hazırlık akışına bağlıdır.
import http from "node:http";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SERVE = join(ROOT, process.env.SERVE_DIR || "www");
const PORT = Number(process.env.PORT || 4835);
// Sayfa filtresi: bayrak olmayan ilk argüman (argümanı yanlış sanmak denetimi
// sessizce 0 ekranla "temiz" gösterebilir).
const filter = process.argv.slice(2).find((a) => !a.startsWith("--"));

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

/* Sözlüğün İngilizce tarafı: "çevrilmedi" saymak için metnin Türkçe görünümlü olması
   gerek; salt "lookup'ta yok" yetmez (İngilizce arayüz metinleri de eksik-listeye
   düşüyor). Sözlük REGEX'le değil ÇALIŞTIRILARAK okunur — biçimlendirici her
   geçtiğinde kalıp eşleşmesi sessizce çürüyor. */
const dictWin = {};
new Function("window", readFileSync(join(ROOT, "src", "app", "lang-en.js"), "utf8"))(dictWin);
const EN = dictWin.NEXUS_EN || {};
const EN_VALUES = new Set(
  Object.values(EN.text || {})
    .concat(Object.values(EN.slots || {}), Object.values(EN.html || {}))
    .map((v) => String(v).replace(/\s+/g, " ").trim()),
);
const norm = (s) => String(s).replace(/\s+/g, " ").trim();
const TR = /[çğıöşüÇĞİÖŞÜ]/;
// Şapkasız Türkçe sözcükler (i18n-coverage.mjs'deki listeyle aynı amaçta).
const TR_WORDS =
  /\b(mavi|mor|turuncu|pembe|turkuaz|gri|siyah|beyaz|vurgu|renk|renkli|oturum|etkin|arama|klavye|genişlet|daralt|sürüm|haftalık|aylık|günlük|yıllık|sonuç|parola|yedek|davet|onay|iptal|kaydet|düzenle|yenile|sohbet|mesaj|bildirim|titreşim|hareket|sessiz|giris|cikis)\b/i;
// Dil ADLARI ve ülke adları çevrilmez: İngilizce arayüzde de kendi yazımıyla durur.
const UNTRANSLATABLE = new Set(["Türkçe", "İngilizce", "Türkiye"]);
const looksTurkish = (s) => {
  const t = norm(s);
  // Uzunluk EŞİĞİ yok: "Mor", "Gri" gibi üç harfli aksan adları gerçek birer çeviri
  // eksiği ve eşik bunları sessizce düşürürdü.
  if (!t || UNTRANSLATABLE.has(t) || EN_VALUES.has(t)) return false;
  if (TR.test(t)) {
    /* Birleşik satırda (ör. "Türkiye · 05:11 AM") Türkçe karakter taşıyan her parça
       çevrilmeyen özel ada düşüyorsa bu eksik çeviri değil. Sözcük sözcük bakılır. */
    const words = t.match(/[^\s·|—–,]+/g) || [];
    if (words.every((w) => !TR.test(w) || UNTRANSLATABLE.has(w))) return false;
  }
  return TR.test(t) || TR_WORDS.test(t);
};

const QA_USER = "qa@nexus.local";
/* Eşleşmiş cihaz olmadan panel/rozet gibi veriden ÜRETİLEN metinler hiç görünmez
   (ekran boş durumda kalır). Adlar İNGİLİZCE — bkz. dosya başındaki gürültü notu. */
const SEEDED = [
  {
    id: "dev-1",
    name: "Living Room Lamp",
    host: "192.168.1.31",
    protocol: "hue",
    model: "Hue Bridge",
    kind: "light",
    icon: "lightbulb",
    room: "Living Room",
  },
  {
    id: "dev-2",
    name: "Kitchen Plug",
    host: "192.168.1.32",
    protocol: "tplink",
    model: "Tapo P110",
    kind: "plug",
    icon: "zap",
    room: "Kitchen",
  },
  {
    id: "dev-3",
    name: "Bedroom AC",
    host: "192.168.1.33",
    protocol: "daikin",
    model: "Daikin",
    kind: "climate",
    icon: "thermometer",
    room: "Bedroom",
  },
  {
    id: "dev-4",
    name: "Front Door Camera",
    host: "192.168.1.34",
    protocol: "onvif",
    model: "ONVIF",
    kind: "camera",
    icon: "video",
    room: "Entry",
  },
];

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

/* İki profil: arayüz duyarlı — kimi kart/panel yalnız dar ya da yalnız geniş ekranda
   kuruluyor. Tek profille bakmak o metinleri hiç görmez. */
const PROFILES = {
  masaüstü: { viewport: { width: 1280, height: 900 } },
  telefon: {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  },
};

const browser = await chromium.launch();
const contexts = {};
for (const [pk, opts] of Object.entries(PROFILES)) {
  const ctx = await browser.newContext({ ...opts, locale: "en-US" });
  // İngilizce arayüz + oturumlu kullanıcı + eşleşmiş cihazlar: aksi halde her ekran
  // karşılamaya düşer ve denetim yalnızca onboarding sayfasını görür (bir kez tam da
  // böyle "temiz" çıkmıştı).
  await ctx.addInitScript(
    ([user, devices]) => {
      try {
        localStorage.setItem("nexusLanguage", "en");
        localStorage.setItem("nexusCurrentUser", user);
        localStorage.setItem("nexusEverLoggedIn", "1");
        localStorage.setItem("nexusOnboarded", "1");
        localStorage.setItem(`${user}_nexusPairedDevices`, JSON.stringify(devices));
      } catch (e) {}
    },
    [QA_USER, SEEDED],
  );
  contexts[pk] = ctx;
}

const jobs = [];
for (const pk of Object.keys(PROFILES)) for (const page of PAGES) jobs.push({ pk, page });

const results = [];
let cursor = 0;
const CONCURRENCY = 4;
async function worker() {
  for (;;) {
    const i = cursor++;
    if (i >= jobs.length) return;
    const { pk, page } = jobs[i];
    const pg = await contexts[pk].newPage();
    const errors = [];
    pg.on("pageerror", (e) => errors.push(String(e && e.message ? e.message : e)));
    try {
      await pg.goto(`http://127.0.0.1:${PORT}/${page}`, {
        waitUntil: "domcontentloaded",
        timeout: 25000,
      });
      await pg.waitForTimeout(1800);
      const data = await pg.evaluate(
        (names) => ({
          url: location.href,
          lang: document.documentElement.getAttribute("lang"),
          i18n: !!window.__nexusI18n,
          // Tohumlu cihaz ekranın görünen metnine gerçekten düştü mü (denetim boş olmasın).
          fixture: names.some((n) => (document.body ? document.body.innerText.includes(n) : false)),
          // Çevirmenin "bulamadım" dediği anahtarlar (düğüm düğüm + satır içi etiketli).
          missing: Object.keys(window.__i18nMissing || {}).concat(
            Object.keys(window.__i18nMissingHtml || {}),
          ),
          // Ekranda GERÇEKTEN duran Türkçe: öğenin kendi metin düğümleri. innerText değil
          // bu okunur çünkü (a) gizli panelleri de yakalar (sonradan açılıyorlar),
          // (b) [data-no-i18n] bölgelerini çevirmenin atladığı gibi atlar.
          nodes: (() => {
            const out = [];
            const skip = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);
            for (const el of document.querySelectorAll("body *")) {
              if (skip.has(el.tagName)) continue;
              if (el.closest("[data-no-i18n]")) continue;
              const own = [...el.childNodes]
                .filter((n) => n.nodeType === 3)
                .map((n) => n.nodeValue)
                .join(" ")
                .replace(/\s+/g, " ")
                .trim();
              if (own.length > 3) out.push(own);
            }
            return out;
          })(),
        }),
        SEEDED.map((d) => d.name),
      );
      results.push({
        pk,
        page,
        redirected: !data.url.endsWith(page),
        lang: data.lang,
        i18n: data.i18n,
        fixture: data.fixture,
        textNodes: data.nodes.length,
        untranslated: [...new Set(data.missing.filter(looksTurkish))],
        visible: [...new Set(data.nodes.filter(looksTurkish))],
        errors: errors.slice(0, 3),
      });
    } catch (err) {
      results.push({
        pk,
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

results.sort((a, b) => a.pk.localeCompare(b.pk) || a.page.localeCompare(b.page));
const bad = results.filter((r) => r.failed || r.visible.length || r.untranslated.length);

/* "0 bulgu" iki ayrı sebepten de çıkabilir: gerçekten temiz ya da denetim hiç
   çalışmıyor. Geçmişte ikisi de yaşandı: sayfa filtresi bayrağı yutduğu için tarama
   0 ekranla "temiz" döndü, oturumsuz bağlamda her ekran karşılamaya düşüp yalnız
   onboarding okundu. Bu yüzden temizlik iddiası, denetimin çalıştığını kanıtlayan
   bekçilere bağlandı — biri düşerse çıkış kodu bulgu sayısından bağımsız 1 olur. */
const failedCount = results.filter((r) => r.failed).length;
const openedEn = results.filter((r) => r.i18n && r.lang === "en").length;
const redirected = results.filter((r) => r.redirected).length;
// Test cihazının adı ekrana düşmediyse oturum/cihaz tohumu tutmamış demektir: panel
// ve rozet metinleri hiç üretilmemiştir, "temiz" raporu boş bir iddiadır.
const deviceSeen = results.some((r) => r.fixture);
const emptyScreens = results.filter((r) => !r.failed && r.textNodes === 0).length;
const guards = [
  [PAGES.length > 0, `hiç ekran bulunamadı (SERVE: ${SERVE}) — önce npm run sync:www`],
  [results.length > 0, "hiç ekran-profil açılamadı"],
  [
    openedEn >= results.length - failedCount,
    `${results.length - failedCount - openedEn} ekranda İngilizce çevirmeni yüklenmedi (lang-en.js/i18n.js)`,
  ],
  [redirected < results.length, "tüm ekranlar karşılamaya yönlendi — oturum tohumu tutmadı"],
  [deviceSeen, "tohumlu cihaz adı ekranda görünmedi — cihazlı durum hiç test edilmedi"],
];
const broken = guards.filter(([ok]) => !ok).map(([, why]) => why);

for (const r of bad) {
  if (r.failed) {
    console.log(`✗ [${r.pk}] ${r.page} — açılamadı: ${r.mesaj}`);
    continue;
  }
  console.log(
    `✗ [${r.pk}] ${r.page}${r.redirected ? " (yönlendirildi)" : ""} — çevrilmemiş ${r.untranslated.length}: ` +
      r.untranslated.slice(0, 8).join(" | "),
  );
  if (r.untranslated.length > 8) console.log(`    … +${r.untranslated.length - 8} anahtar`);
  if (r.visible.length)
    console.log("    ekranda görünen Türkçe: " + r.visible.slice(0, 8).join(" | "));
  if (r.errors.length) console.log("    sayfa hatası: " + r.errors.join(" | "));
}
console.log(
  `\nCANLI i18n: ${results.length} ekran-profil İngilizce açıldı (${PAGES.length} ekran × ${Object.keys(PROFILES).length} profil) · ${bad.length} Türkçe kaldı`,
);
// Kanıt satırı: raporu okuyan kişi "temiz" mi yoksa "hiç bakmadı" mı olduğunu ayırabilsin.
console.log(
  `kanıt: ${openedEn}/${results.length} ekran İngilizce çevirmenle açıldı · ` +
    `${results.length - redirected} ekran kendi üstünde kaldı · cihaz tohumu ${deviceSeen ? "ekranda göründü" : "GÖRÜNMEDİ"} · ` +
    `${emptyScreens} ekran boş (metin düğümü yok)`,
);
if (emptyScreens) {
  console.log(`uyarı: ${emptyScreens} ekran-profilde hiç metin düğümü yok — açılmamış olabilir`);
}
for (const why of broken) console.error(`BEKÇİ İHLALİ: ${why}`);
process.exitCode = broken.length || bad.length ? 1 : 0;
