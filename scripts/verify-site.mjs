// Site yapısal doğrulaması (kalıcı denetim — npm run verify:site).
// ------------------------------------------------------------------
// İki katman:
//   --smoke  : tarayıcı gerektirmeyen statik denetimler (hızlı; CI + audit:all buradan geçer)
//   (yok)    : smoke'a ek olarak Playwright ile gerçek render — taşma, dokunma hedefi,
//              fiyat geçişi, konsol hatası, görseller, dil geçişi, masaüstü düzeni.
// Ne deniyor: fiyatların GERÇEKLİĞİ (PRICES tek kaynağı + gerçek indirim oranı), olmayan
// marka/protokol vaatleri (supported-devices.js ile çelişmemeli), canonical/hreflang/JSON-LD,
// sitemap/robots/manifest tutarlılığı, ölü dosya bağlantıları, BOM/mojibake, dokunma
// hedefleri, yatay taşma, konsol hataları ve Supabase ANAHTARININ takipteki derleme
// çıktısına sızmaması (bulut ayarı yalnız gitignore'daki assets/cloud-config.js'te).
// Kaynak: scripts/site-build.mjs + scripts/site-content.mjs.
import { execSync } from "node:child_process";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PRICES, APP_URL, CHECKOUT_URLS } from "./site-content.mjs";

const SMOKE = process.argv.includes("--smoke");
/* --live: yayından SONRA gerçek adreste denetlenir (Cloudflare'in temiz URL, 404 ve
   başlık davranışı yerel sunucudan taklit edilemez). Statik dosya denetimleri o zaman
   atlanır; tarayıcı denetimleri https://nexus-smarthome.pages.dev üzerinde koşar. */
const LIVE = process.argv.includes("--live");
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const PUB = join(ROOT, "www", "public");
const PORT = 4835;
const SITE_ORIGIN = "https://nexus-smarthome.pages.dev";

const savePct = (cur) => {
  const num = (v) => {
    const s = String(v).replace(/[^\d.,]/g, "");
    return s.includes(",") ? parseFloat(s.replace(/\./g, "").replace(",", ".")) : parseFloat(s);
  };
  return Math.round((1 - num(PRICES[cur].yearly) / (num(PRICES[cur].monthly) * 12)) * 100);
};
const SAVE = { TRY: savePct("TRY"), USD: savePct("USD") };

let failed = 0;
let notes = 0;
const check = (name, ok, detail) => {
  if (!ok) failed++;
  console.log(
    (ok ? "✓ " : "✗ ") + name + (detail && !ok ? " — " + detail : detail ? " (" + detail + ")" : "")
  );
};
const info = (name, detail) => {
  notes++;
  console.log("ℹ " + name + (detail ? " — " + detail : ""));
};

const PAGES = {
  "index.html": "en",
  "tr/index.html": "tr",
  "about.html": "en",
  "tr/about.html": "tr",
  "privacy.html": "en",
  "tr/privacy.html": "tr",
  "terms.html": "en",
  "tr/terms.html": "tr",
  "refund.html": "en",
  "tr/refund.html": "tr",
  "404.html": "en",
  "tr/404.html": "tr",
  "light.html": "en",
  "tr/light.html": "tr",
  "login.html": "en",
  "tr/login.html": "tr",
};

const attr = (html, re) => (html.match(re) || [])[1] || "";
const stripNoise = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");

/* ================================================== 1) STATİK DENETİM (her zaman) */
console.log(SMOKE ? "\n— smoke (tarayıcısız) —" : "\n— 1) statik —");
if (!LIVE) {

for (const [file, lang] of Object.entries(PAGES)) {
  const p = join(PUB, file);
  if (!existsSync(p)) {
    check(`${file}: üretildi`, false, "dosya yok — node scripts/site-build.mjs");
    continue;
  }
  const buf = readFileSync(p);
  const html = buf.toString("utf8");
  const label = file.replace("tr/", "TR ").replace(".html", "") || "EN ana";
  check(`${label}: BOM yok`, !(buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf));
  check(`${label}: düzgün UTF-8`, !/\uFFFD/.test(html));
  // Kaynak şablonundan sızan undefined/NaN (render'da eksik alan belirtisi).
  const text = stripNoise(html);
  check(`${label}: undefined/NaN sızmamış`, !/\bundefined\b|\bNaN\b/.test(text), text.match(/\w*(undefined|NaN)\w*/)?.[0]);
  // Bayat elle-kopya çıktıların imzası: düz karakter yerine çift-kodlanmış Türkçe.
  // DİZİLER KAÇIŞ YAZIMIYLA kuruluyor — packages/core/encoding-guard.test.ts tüm
  // izlenen metin dosyalarında bu imzaları arıyor; düz yazsaydık dedektör kendini basardı.
  const MOJI = [
    "\u00C3\u00B6", // ö
    "\u00C3\u00BC", // ü
    "\u00C3\u00A2", // â
    "\u00C4\u00B1", // ı
    "\u00C5\u00B8", // ş
    "\u00C5\u009F", // ğ
    "\u00C2\u00B7", // ·
    "\u00E2\u20AC\u201D", // —
  ];
  check(`${label}: mojibake yok`, !MOJI.some((m) => html.includes(m)));
  const hasLang = /<html[^>]+lang="(en|tr)"/.test(html);
  if (!/light/.test(file)) check(`${label}: <html lang> doğru`, hasLang && html.includes(`lang="${lang}"`));
}

/* --- ana sayfa içerik doğruluğu (tarayıcıya gerek yok: değerler build'de yazılıyor) --- */
for (const [file, cur, saveText] of [
  ["index.html", "USD", `Save ${SAVE.USD}%`],
  ["tr/index.html", "TRY", `%${SAVE.TRY} Tasarruf`],
]) {
  if (!existsSync(join(PUB, file))) continue;
  const html = readFileSync(join(PUB, file), "utf8");
  const text = stripNoise(html);
  const label = file.startsWith("tr") ? "TR ana" : "EN ana";
  check(`${label}: aylık fiyat gerçek (${PRICES[cur].monthly})`, text.includes(PRICES[cur].monthly));
  check(`${label}: indirim oranı gerçek (${saveText})`, text.includes(saveText));
  // Uygulamanın olmadığı marka/protokol vaatleri (supported-devices.js ile çelişiyorlardı).
  const banned = ["HomeKit", "WiZ", "LIFX", "Govee", "Sonoff DIY", "MQTT"];
  const found = banned.filter((b) => text.includes(b));
  check(`${label}: olmayan marka vaat edilmiyor`, found.length === 0, found.join(","));
  // Bayat elle-kopya çıktıların imzası: iç sayfalar .html ile anılıyor.
  const dirty = [
    ...html.matchAll(/href="\/(?:tr\/)?(?:about|privacy|terms|refund|login|light)\.html"/g),
  ].map((m) => m[0]);
  check(`${label}: iç bağlantılar temiz URL`, dirty.length === 0, dirty.slice(0, 3).join(", "));
  for (const id of ["pricing", "downloads", "faq", "integrations", "features", "how"])
    check(`${label}: #${id} bölümü işaretli`, new RegExp(`id="${id}"`).test(html));
  check(`${label}: web uygulaması adresi geçiyor`, html.includes(APP_URL), APP_URL);
  // Sürüm rozetinin yedek değeri bayatlamasın (GitHub API hız sınırında görünür olan değer).
  const baked = attr(html, /data-nexus-ver>(v[0-9.]+)</);
  const pkgVer = "v" + JSON.parse(readFileSync(join(ROOT, "desktop", "package.json"), "utf8")).version;
  check(`${label}: yedek sürüm rozeti güncel (${baked})`, baked === pkgVer, `beklenen ${pkgVer}`);
}

/* --- meta / SEO --- */
for (const [label, file, canonical] of [
  ["EN", "index.html", `${SITE_ORIGIN}/`],
  ["TR", "tr/index.html", `${SITE_ORIGIN}/tr/`],
]) {
  if (!existsSync(join(PUB, file))) continue;
  const html = readFileSync(join(PUB, file), "utf8");
  const relCanonical = attr(html, /<link rel="canonical" href="([^"]+)"/);
  check(`${label} meta: canonical temiz URL`, relCanonical === canonical, relCanonical);
  const alts = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(
    (m) => m[1] + "=" + m[2]
  );
  check(
    `${label} meta: tr + en hreflang çifti`,
    alts.some((a) => a.startsWith("tr=") && a.includes("/tr/")) &&
      alts.some((a) => a.startsWith("en=") && !a.includes("/tr/")),
    alts.join(" ")
  );
  check(`${label} meta: x-default var`, alts.some((a) => a.startsWith("x-default=")));
  check(
    `${label} meta: og:image + twitter kartı`,
    html.includes('property="og:image"') && html.includes('name="twitter:card"')
  );
  check(
    `${label} meta: og:locale doğru`,
    attr(html, /<meta property="og:locale" content="([^"]+)"/) === (label === "TR" ? "tr_TR" : "en_US")
  );
  check(
    `${label} meta: og:image dosyası depoda`,
    existsSync(join(PUB, "og-cover.png")),
    "www/public/og-cover.png"
  );
  const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (m) => m[1]
  );
  let parsed = null;
  let ldError = "";
  try {
    parsed = JSON.parse(ldBlocks[0] || "null");
  } catch (e) {
    ldError = String(e).slice(0, 80);
  }
  check(`${label} meta: JSON-LD ayrışıyor`, !!parsed && !ldError, ldError);
  const types =
    parsed && (parsed["@graph"] ? parsed["@graph"].map((n) => n["@type"]) : [parsed["@type"]]);
  check(
    `${label} meta: Organization + SoftwareApplication + FAQPage`,
    ["Organization", "SoftwareApplication", "FAQPage"].every((t) => (types || []).includes(t)),
    (types || []).join(",")
  );
  check(`${label} meta: favicon + apple-touch-icon`, html.includes('rel="icon"') && html.includes('rel="apple-touch-icon"'));
  check(`${label} meta: manifest bağlantısı var`, html.includes('rel="manifest"'));
}

/* --- keşif dosyaları: üretilen sayfalarla birebir aynı adresleri söylemeli --- */
{
  const robotsPath = join(PUB, "robots.txt");
  const sitemapPath = join(PUB, "sitemap.xml");
  const manifestPath = join(PUB, "manifest.webmanifest");
  check("robots.txt üretildi", existsSync(robotsPath));
  check("sitemap.xml üretildi", existsSync(sitemapPath));
  check("manifest.webmanifest üretildi", existsSync(manifestPath));
  if (existsSync(sitemapPath) && existsSync(robotsPath)) {
    const sm = readFileSync(sitemapPath, "utf8");
    const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    check("sitemap: .html adresi yok", !locs.some((l) => l.endsWith(".html")), locs.filter((l) => l.endsWith(".html")).join(","));
    check("sitemap: 10 adres (5 sayfa × 2 dil)", locs.length === 10, `${locs.length}`);
    for (const want of [`${SITE_ORIGIN}/`, `${SITE_ORIGIN}/tr/`, `${SITE_ORIGIN}/about`, `${SITE_ORIGIN}/tr/privacy`])
      check(`sitemap: ${want.replace(SITE_ORIGIN, "")} listeli`, locs.includes(want));
    check("sitemap: XML gövdesi kapalı", sm.trimEnd().endsWith("</urlset>"));
    check("robots: sitemap satırı doğru origin", readFileSync(robotsPath, "utf8").includes(`${SITE_ORIGIN}/sitemap.xml`));
    check("robots: login/light taramada değil", /Disallow: \/login/.test(readFileSync(robotsPath, "utf8")));
  }
  if (existsSync(manifestPath)) {
    let mf = null;
    try {
      mf = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch (e) {
      mf = null;
    }
    check("manifest: JSON ayrışıyor", !!mf);
    check("manifest: macOS vaat etmeyen dürüst tanım", !!mf && !/macOS/i.test(mf.description || ""), mf && mf.description);
    check("manifest: ikon dosyası var", existsSync(join(PUB, "icon.svg")));
  }
}

/* --- iç referanslar gerçekten dosyaya iniyor mu (ölü asset avı) --- */
{
  const refs = new Set();
  for (const file of Object.keys(PAGES)) {
    const p = join(PUB, file);
    if (!existsSync(p)) continue;
    const html = readFileSync(p, "utf8");
    for (const m of html.matchAll(/(?:src|href|content)="([^"]+)"/g)) {
      let v = m[1];
      if (v.startsWith(SITE_ORIGIN)) v = v.slice(SITE_ORIGIN.length);
      if (!v.startsWith("/") || /\s/.test(v) || v.startsWith("//")) continue;
      const last = v.split("/").pop() || "";
      if (!last.includes(".")) continue; // temiz URL (/about, /tr/) — dosya değil
      refs.add(v.split("?")[0].split("#")[0]);
    }
  }
  // _redirects tarafından sunulanlar (favicon.ico → icon.svg gibi) dosya olarak yoktur.
  const handled = new Set(["/favicon.ico"]);
  const missing = [...refs].filter((r) => !handled.has(r) && !existsSync(join(PUB, r)));
  check(`ölü dosya bağlantısı yok (${refs.size} benzersi hedef)`, missing.length === 0, missing.slice(0, 6).join(", "));
}

/* --- bulut ayarı: anahtar takipteki çıktuya sızmaz, yayınlanan dosya yalnız anon --- */
{
  const siteJsPath = join(PUB, "assets", "site.js");
  const cloudPath = join(PUB, "assets", "cloud-config.js");
  const siteJs = existsSync(siteJsPath) ? readFileSync(siteJsPath, "utf8") : "";
  check("assets/site.js üretildi", siteJs.length > 2000);
  /* Sözdizimi kapısı (ölçülen gerçek hata): pageJs() bir şablon metin olduğu için
     kaçışlar tek kere yazılınca üretilen JS bozuluyor ve sitede TUM JavaScript
   ölüyordu — fiyat geçişi, tema, SSS, giriş formu dahil. Canlıda da görüldü. */
  for (const jsFile of ["assets/site.js", "assets/site-boot.js"]) {
    let ok = false;
    let why = "";
    try {
      execSync(`node --check "www/public/${jsFile}"`, { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
      ok = true;
    } catch (e) {
      why = String(e.stderr || e.message).split("\n").slice(0, 2).join(" ").slice(0, 120);
    }
    check(`${jsFile}: sözdizimi geçerli`, ok, why);
  }
  // Fiyat geçişi uydurma rakam gösteremesin: NR_BILLING paketi PRICES'ın kendisidir.
  for (const cur of ["USD", "TRY"]) {
    const all = [PRICES[cur].monthly, PRICES[cur].perMonthOfYear, PRICES[cur].yearly];
    const absent = all.filter((v) => !siteJs.includes(v));
    check(`site.js fiyat paketi ${cur} değerlerini taşıyor`, absent.length === 0, "eksik: " + absent.join(","));
  }
  check("site.js: Supabase anahtarı gömülü değil", !/eyJ[A-Za-z0-9_-]{20,}\.eyJ/.test(siteJs));
  check("site.js: proje URL'i gömülü değil", !/https:\/\/[a-z]+\.supabase\.co/.test(siteJs));
  check("cloud-config.js ayrı dosyada üretiliyor", existsSync(cloudPath));
  if (existsSync(cloudPath)) {
    const cc = readFileSync(cloudPath, "utf8");
    const key = (cc.match(/anonKey:\s*"([^"]*)"/) || [])[1] || "";
    const url = (cc.match(/url:\s*"([^"]*)"/) || [])[1] || "";
    if (key) {
      let role = "";
      try {
        role = JSON.parse(Buffer.from(key.split(".")[1], "base64").toString("utf8")).role || "";
      } catch {
        role = "çözülemedi";
      }
      // service_role sızarsa bu denetim patlamalı: yayınlanan site yalnız kamu anahtarı taşır.
      check("cloud-config.js: anahtar rolü anon", role === "anon", role);
      check("cloud-config.js: URL supabase projesi", /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url), url.replace(/^https:\/\//, ""));
    } else {
      info("cloud-config.js boş — site girişi 'kullanımda değil' modunda", "NEXUS_SUPABASE_* tanımla veya cloud-config.js kopyala");
    }
  }
  const ignored = readFileSync(join(ROOT, ".gitignore"), "utf8");
  check(".gitignore cloud-config.js'yi dışlıyor", /(^|\n)cloud-config\.js/.test(ignored));
  let tracked = "";
  try {
    tracked = execSync('git ls-files -- "www/public/assets/cloud-config.js"', {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    tracked = "";
  }
  check("cloud-config.js NEXUS deposunda takip edilmiyor", tracked === "", tracked);
  for (const dead of ["assets/site-downloads.js", "assets/site-shots.js"])
    check(`ölü çıktı temizlendi: ${dead}`, !existsSync(join(PUB, dead)));
  for (const f of ["index.html", "tr/index.html"]) {
    if (!existsSync(join(PUB, f))) continue;
    const html = readFileSync(join(PUB, f), "utf8");
    check(
      `${f}: cloud-config, site.js'ten ÖNCE yükleniyor`,
      html.indexOf("cloud-config.js") > -1 && html.indexOf("cloud-config.js") < html.indexOf("assets/site.js")
    );
  }
  // Giriş kısa yolları web uygulamasına gitmeli (elle kopyalanmış adresler bayatlıyordu).
  for (const f of ["login.html", "tr/login.html"]) {
    if (!existsSync(join(PUB, f))) continue;
    const html = readFileSync(join(PUB, f), "utf8");
    check(`${f}: ${APP_URL} adresine yönlendiriyor`, html.includes(APP_URL));
    check(`${f}: noindex`, /robots" content="noindex/.test(html));
  }
}
} // !LIVE — statik denetimler yalnız yerel çıktıda

if (SMOKE) {
  console.log(
    failed
      ? `\n${failed} DENETİM BAŞARISIZ ✗`
      : `\nSMOKE GEÇTİ ✓ (${notes} bilgi notu)`
  );
  process.exit(failed ? 1 : 0);
}

/* ================================================== 2) TARAYICI DENETİMİ */
const BASE = LIVE ? SITE_ORIGIN : `http://127.0.0.1:${PORT}`;
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
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};
let server = null;
if (!LIVE) {
server = http.createServer(async (req, res) => {
  const send = async (file) => {
    const data = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(data);
  };
  try {
    const p = decodeURIComponent((req.url || "/").split("?")[0]);
    const clean = p.replace(/^\//, "").replace(/\/$/, "");
    const base = clean === "" ? "index.html" : clean;
    // Cloudflare Pages temiz URL'leri de sunabiliyor: /tr/ → tr/index.html, /about → about.html
    for (const file of [join(PUB, base), join(PUB, base + ".html"), join(PUB, base, "index.html")]) {
      try {
        await send(file);
        return;
      } catch {
        /* sıradaki adayı dene */
      }
    }
    throw new Error("no candidate");
  } catch {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    try {
      res.end(await readFile(join(PUB, "404.html")));
    } catch {
      res.end("not found");
    }
  }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
}

const { chromium } = await import("playwright");
console.log("\n— 2) tarayıcı —");
const browser = await chromium.launch();

function newCtx(opts = {}) {
  return browser.newContext({ viewport: { width: 390, height: 844 }, ...opts });
}
async function openPage(ctxInit, url) {
  const ctx = await newCtx();
  for (const [k, v] of Object.entries(ctxInit)) {
    await ctx.addInitScript(([key, val]) => localStorage.setItem(key, val), [k, v]);
  }
  const pg = await ctx.newPage();
  const errors = [];
  const blocked = [];
  pg.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  pg.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text().slice(0, 160)));
  pg.on("response", (r) => {
    if (r.status() >= 400 && !r.url().startsWith(BASE)) blocked.push(r.status() + " " + r.url());
  });
  await pg.goto(`${BASE}${url}`, { waitUntil: "load" });
  await pg.waitForTimeout(400);
  /* api.github.com 403 = ziyaretçi başına hız sınırı (60 istek/saat); sitenin hatası
     değil: sürüm rozeti build'den gelen değeri göstermeye devam ediyor ve isteğin
     düşürülmesi için yakalanmış. Yerel/üretim farkı üretmesin diye ayrıştırıldı. */
  const gh = blocked.filter((b) => b.includes("api.github.com"));
  const clean = errors.filter(
    (e) => !(gh.length && /Failed to load resource/.test(e) && !/127\.0\.0\.1|pages\.dev/.test(e))
  );
  if (gh.length) info(`${url} — GitHub API ${gh[0].split(" ")[0]} (hız sınırı, siteyi etkilemiyor)`);
  return { ctx, pg, errors: clean };
}

const EN_LANG = { "nx-lang": "en" };
const TR_LANG = { "nx-lang": "tr" };

/* ---------------------------------------------------------------- ana sayfalar */
for (const [label, url, lang, price, saveText] of [
  ["EN", "/", EN_LANG, PRICES.USD.monthly, `Save ${SAVE.USD}%`],
  ["TR", "/tr/", TR_LANG, PRICES.TRY.monthly, `%${SAVE.TRY} Tasarruf`],
]) {
  const { ctx, pg, errors } = await openPage(lang, url);
  const missing = [];
  for (const s of [
    "#features",
    "#how",
    "#integrations",
    "#pricing",
    "#downloads",
    "#faq",
    "header.hd",
    "footer.ft",
  ])
    if ((await pg.locator(s).count()) === 0) missing.push(s);
  check(`${label} render: tüm bölümler var`, missing.length === 0, missing.join(","));

  const body = await pg.textContent("body");
  check(`${label} render: aylık fiyat gerçek (${price})`, body.includes(price));
  check(`${label} render: indirim oranı gerçek (${saveText})`, body.includes(saveText));

  const overflow = await pg.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  check(`${label} render: 390px'te yatay taşma yok`, overflow <= 0, `fark ${overflow}px`);
  check(`${label} render: konsol/sayfa hatası yok`, errors.length === 0, errors[0]);

  // Yalnız GÖRÜNÜR görseller: pasif hero sekmeleri kasıtlı olarak sonradan yüklenir
  // (hepsinin kutusu üst üste; .shot-slide:not(.active) bu yüzden elenir) ve statik
  // denetim tüm /images/... yollarının dosyada var olduğunu zaten doğruluyor.
  const broken = await pg.evaluate(() =>
    [...document.images]
      .filter((i) => !i.closest(".shot-slide:not(.active)"))
      .filter((i) => {
        const r = i.getBoundingClientRect();
        return r.width > 1 && r.height > 1 && r.top < window.innerHeight * 2;
      })
      .filter((i) => !i.complete || i.naturalWidth === 0)
      .map((i) => i.currentSrc || i.src)
  );
  check(`${label} render: görünen görseller yüklü`, broken.length === 0, broken.slice(0, 2).join(","));

  // Hero sekmeleri: her sekme gerçekten bir ekran görüntüsünü gösteriyor mu?
  const shotTabs = await pg.locator(".phone-dot").count();
  if (shotTabs > 1) {
    await pg.click(".phone-dot:nth-of-type(2)");
    await pg.waitForTimeout(700);
    const shot = await pg.evaluate(() => {
      const slide = document.querySelector(".shot-slide.active");
      const img = slide && slide.querySelector("img");
      return {
        label: slide ? slide.getAttribute("data-shot") : null,
        loaded: !!img && img.complete && img.naturalWidth > 0,
        src: img ? img.getAttribute("src") : null,
      };
    });
    check(
      `${label} render: ikinci sekme ekran görüntüsünü yüklüyor (${shot.label})`,
      shot.loaded,
      shot.src
    );
  } else info(`${label}: hero sekmesi yok (${shotTabs})`);

  // Bulut ayarı gerçekten yükleniyor mu (site.js nxCloudConfig() üzerinden okuyor).
  const cloud = await pg.evaluate(() => {
    const c = window.NEXUS_CLOUD || null;
    return { present: !!c, url: c && c.url ? c.url : "" };
  });
  check(`${label} render: cloud-config.js sayfada okunuyor`, cloud.present, "window.NEXUS_CLOUD tanımsız — script sırası bozuk");
  if (cloud.present && !cloud.url)
    info(`${label}: bulut yapılandırması boş — site girişi 'kullanımda değil' der`);

  // Site JS'i gerçekten çalışıyor mu (syntax hatası tüm işlevleri öldürüyordu).
  const jsAlive = await pg.evaluate(() => ({
    fns: typeof window.nxSetBilling === "function" && typeof window.nxCloudConfig === "function",
    listeners: document.querySelectorAll("[data-billing], #billingYearly, .theme-t").length,
  }));
  check(`${label} render: site.js çalışıyor (yardımcılar tanımlı)`, jsAlive.fns, "nxSetBilling/nxCloudConfig yok — site.js ölü");

  // Entegrasyon listesi supported-devices.js'ten gelmeli (elle yazılmış liste değil).
  const chips = await pg.$$eval("#integrations .chip", (els) => els.map((e) => e.textContent.trim()));
  const matrix = (() => {
    const win = {};
    new Function("window", readFileSync(join(ROOT, "supported-devices.js"), "utf8"))(win);
    return win.NEXUS_SUPPORTED_DEVICES || [];
  })();
  const wantAll = matrix.filter((d) => d.availability === "all").length;
  check(
    `${label}: entegrasyon çipleri cihaz matrisinden (${chips.length} çip)`,
    chips.length >= wantAll,
    `matris 'all' = ${wantAll}`
  );

  const hrefs = await pg.$$eval("a", (els) => els.map((e) => e.href));
  check(`${label}: web uygulaması bağlantısı tıklanabilir`, hrefs.some((h) => h.startsWith(APP_URL)), APP_URL);

  // Fiyat geçişi: yıllık seçilince gerçek yıllık rakam + etiket + ödeme bağlantısı.
  await pg.click("#billingYearly");
  await pg.waitForTimeout(200);
  const yearly = await pg.evaluate(() => ({
    price: document.getElementById("planPriceVal")?.textContent || "",
    note: document.getElementById("planPriceNote")?.textContent || "",
    cta: document.getElementById("nexusPlusCta")?.textContent.trim() || "",
    href: document.getElementById("nexusPlusCta")?.href || "",
  }));
  const cur = label === "TR" ? "TRY" : "USD";
  check(`${label}: yıllık fiyat ${PRICES[cur].perMonthOfYear}`, yearly.price === PRICES[cur].perMonthOfYear, yearly.price);
  check(
    `${label}: yıllık not gerçek toplamı ve oranı gösteriyor`,
    yearly.note.includes(PRICES[cur].yearly) && yearly.note.includes(String(SAVE[cur])),
    yearly.note
  );
  check(`${label}: yıllık CTA 7 gün deneme diyor (aylık 3 gün)`, /7/.test(yearly.cta), yearly.cta);
  check(`${label}: yıllık ödeme bağlantısı doğru planda`, yearly.href === CHECKOUT_URLS[cur].yearly, yearly.href);
  await pg.click("#billingMonthly");
  await pg.waitForTimeout(150);
  const backMonthly = await pg.evaluate(() => ({
    price: document.getElementById("planPriceVal")?.textContent || "",
    href: document.getElementById("nexusPlusCta")?.href || "",
  }));
  check(
    `${label}: aylığa dönünce fiyat ve link geri alıyor`,
    backMonthly.price === PRICES[cur].monthly && backMonthly.href === CHECKOUT_URLS[cur].monthly,
    backMonthly.price + " " + backMonthly.href
  );

  // Dokunma hedefleri: 24px'ten küçük kutuların dokunma alanı pseudo-elemanla
  // genişletilmiş mi? elementFromPoint ile gerçek isabet ölçülür (kutuya bakmak yetmez).
  const small = await pg.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll("a, button")) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (r.height >= 24 && r.width >= 24) continue;
      const x = Math.round(r.left + r.width / 2);
      const y = Math.round(r.top + r.height / 2);
      let hit = false;
      for (const dy of [-9, 9]) {
        const p = document.elementFromPoint(x, y + dy);
        if (p && (p === el || el.contains(p) || p.contains(el))) hit = true;
      }
      if (!hit) bad.push(`${(el.className || el.tagName)} ${Math.round(r.height)}px`);
    }
    return [...new Set(bad)].slice(0, 5);
  });
  check(`${label}: 24px altı dokunma hedefi yok`, small.length === 0, small.join(" | "));
  const intMore = await pg.evaluate(
    () => Math.round(document.querySelector(".int-more")?.getBoundingClientRect().height || 0)
  );
  check(`${label}: bağlayıcı isteği düğmesi ≥ 40px`, intMore >= 40, `${intMore}px`);

  // Geri-dönüş: JS'siz tarayıcı/crawler da SSS metnini ve düğmeyi görmeli.
  const faqStatic = await pg.evaluate(() => ({
    items: document.querySelectorAll(".faq-item").length,
    buttons: document.querySelectorAll(".faq-item button.faq-q").length,
    answers: document.querySelectorAll(".faq-item .faq-a p").length,
    firstAnswer: (document.querySelector(".faq-item .faq-a p")?.textContent || "").trim().length,
  }));
  check(
    `${label}: SSS JS'siz de metin + düğme olarak var (${faqStatic.items} soru)`,
    faqStatic.items >= 4 && faqStatic.items === faqStatic.buttons && faqStatic.answers === faqStatic.items && faqStatic.firstAnswer > 60,
    JSON.stringify(faqStatic)
  );

  await ctx.close();
}

/* ---------------------------------------------------------------- alt sayfalar */
for (const [label, url, lang, needle] of [
  ["EN about", "/about/", EN_LANG, "NEXUS"],
  ["TR hakkında", "/tr/about/", TR_LANG, "NEXUS"],
  ["EN privacy", "/privacy/", EN_LANG, "Supabase"],
  ["TR gizlilik", "/tr/privacy/", TR_LANG, "Supabase"],
  ["EN terms", "/terms/", EN_LANG, "NEXUS"],
  ["TR şartlar", "/tr/terms/", TR_LANG, "NEXUS"],
  ["EN iade", "/refund/", EN_LANG, "refund"],
  ["TR iade", "/tr/refund/", TR_LANG, "NEXUS"],
]) {
  const { ctx, pg, errors } = await openPage(lang, url);
  const text = await pg.textContent("body");
  check(`${label}: içerik var`, (text || "").length > 600, `${(text || "").length} karakter`);
  check(`${label}: "${needle}" geçiyor`, (text || "").toLowerCase().includes(needle.toLowerCase()));
  check(`${label}: sayfa hatası yok`, errors.length === 0, errors[0]);
  const overflow = await pg.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  check(`${label}: yatay taşma yok`, overflow <= 0, `${overflow}px`);
  await ctx.close();
}

/* ---------------------------------------------------------------- 404 */
{
  const ctx = await newCtx();
  await ctx.addInitScript(() => localStorage.setItem("nx-lang", "en"));
  const pg = await ctx.newPage();
  const badAssets = [];
  // Ana belge zaten 404 dönecek; asıl merak ettiğimiz 404'e düşen ALT varlıklar.
  pg.on("response", (r) => {
    if (r.status() >= 400 && !r.url().endsWith("/olmayan-bir-sayfa") && !r.url().includes("api.github.com"))
      badAssets.push(r.status() + " " + r.url());
  });
  const resp = await pg.goto(`${BASE}/olmayan-bir-sayfa`, { waitUntil: "load" });
  await pg.waitForTimeout(300);
  check("404: durum kodu 404", resp && resp.status() === 404, resp && String(resp.status()));
  const body = (await pg.textContent("body")) || "";
  check("404: özel sayfa sunuluyor", /404/.test(body) && /NEXUS/.test(body), body.slice(0, 40));
  const home = await pg.$$eval("a", (els) => els.map((e) => e.getAttribute("href")));
  check("404: ana sayfaya dönüş bağlantısı var", home.some((h) => h === "/" || h === "/tr/"), home.join(" "));
  check("404: alt varlık 404'e düşmüyor", badAssets.length === 0, badAssets.slice(0, 3).join(" | "));
  await ctx.close();
}

/* ---------------------------------------------------------------- dil geçişi */
{
  const { ctx, pg } = await openPage(EN_LANG, "/");
  await pg.click(".lang-btn:not(.active)");
  await pg.waitForTimeout(700);
  check("TR'ye geçiş /tr/ adresine gidiyor", pg.url().includes("/tr/"), pg.url());
  await ctx.close();
}

/* ---------------------------------------------------------------- tema */
{
  const { ctx, pg, errors } = await openPage(EN_LANG, "/");
  const before = await pg.evaluate(() => document.documentElement.getAttribute("data-theme"));
  const toggle = pg.locator(".theme-t");
  if ((await toggle.count()) > 0) {
    await toggle.click();
    await pg.waitForTimeout(250);
    const after = await pg.evaluate(() => document.documentElement.getAttribute("data-theme"));
    check("tema geçişi data-theme değiştiriyor", before !== after, `${before} → ${after}`);
    const persisted = await pg.evaluate(() => localStorage.getItem("nx-site-theme"));
    check("tema tercihi saklanıyor", !!persisted, persisted || "boş");
  } else check("tema düğmesi bulunuyor", false, ".theme-t yok");
  check("tema geçişinde hata yok", errors.length === 0, errors[0]);
  await ctx.close();
}

/* ---------------------------------------------------------------- SSS akordeonu */
{
  const { ctx, pg, errors } = await openPage(EN_LANG, "/");
  const items = await pg.locator(".faq-item").count();
  check(`SSS bölümden üretiliyor (${items} soru)`, items >= 4, `${items}`);
  if (items >= 2) {
    await pg.click(".faq-item:nth-of-type(2) .faq-q");
    await pg.waitForTimeout(250);
    const open = await pg.evaluate(() => document.querySelectorAll(".faq-item.open").length);
    check("SSS tek-açıklık davranışı", open === 1, `açık: ${open}`);
    const expanded = await pg.evaluate(
      () => document.querySelector(".faq-item:nth-of-type(2) .faq-q")?.getAttribute("aria-expanded")
    );
    check("SSS düğmesi aria-expanded taşıyor", expanded === "true", String(expanded));
  }
  check("SSS etkileşiminde hata yok", errors.length === 0, errors[0]);
  await ctx.close();
}

/* ---------------------------------------------------------------- masaüstü */
{
  const ctx = await newCtx({ viewport: { width: 1360, height: 900 } });
  await ctx.addInitScript(() => localStorage.setItem("nx-lang", "en"));
  const pg = await ctx.newPage();
  const errors = [];
  pg.on("pageerror", (e) => errors.push(String(e).slice(0, 120)));
  await pg.goto(`${BASE}/`, { waitUntil: "load" });
  await pg.waitForTimeout(400);
  check("masaüstü: menü görünür", await pg.isVisible("nav.nav"));
  const cols = await pg.evaluate(
    () => getComputedStyle(document.querySelector(".plans")).gridTemplateColumns.split(" ").length
  );
  check("masaüstü: üç plan yan yana", cols === 3, `sütun ${cols}`);
  const dlCols = await pg.evaluate(
    () => getComputedStyle(document.querySelector(".dl-grid")).gridTemplateColumns.split(" ").length
  );
  check("masaüstü: indirme kartları yan yana", dlCols >= 2, `sütun ${dlCols}`);
  check(
    "masaüstü: yatay taşma yok",
    (await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0
  );
  check("masaüstü: sayfa hatası yok", errors.length === 0, errors[0]);
  await ctx.close();
}

/* ---------------------------------------------------------------- tablet */
{
  const ctx = await newCtx({ viewport: { width: 820, height: 1180 } });
  await ctx.addInitScript(() => localStorage.setItem("nx-lang", "tr"));
  const pg = await ctx.newPage();
  await pg.goto(`${BASE}/tr/`, { waitUntil: "load" });
  await pg.waitForTimeout(400);
  const overflow = await pg.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  check("tablet (820px TR): yatay taşma yok", overflow <= 0, `${overflow}px`);
  await ctx.close();
}

/* ---------------------------------------------------------------- canlı HTTP katmanı */
if (LIVE) {
  const head = async (path) => {
    const r = await fetch(BASE + path, { redirect: "manual" });
    return {
      status: r.status,
      loc: r.headers.get("location") || "",
      ct: r.headers.get("content-type") || "",
      csp: r.headers.get("content-security-policy") || "",
      hsts: r.headers.get("strict-transport-security") || "",
      txt: r.status === 200 || r.status === 404 ? await r.text() : "",
    };
  };
  const home = await head("/");
  check("canlı: / 200", home.status === 200, String(home.status));
  check("canlı: CSP başlığı gönderiliyor", home.csp.includes("script-src"), home.csp.slice(0, 60));
  check("canlı: HSTS başlığı gönderiliyor", /max-age=\d{6,}/.test(home.hsts), home.hsts.slice(0, 40));
  const cfg = await head("/assets/cloud-config.js");
  check("canlı: /assets/cloud-config.js yayınlanıyor", cfg.status === 200 && /NEXUS_CLOUD/.test(cfg.txt), String(cfg.status));
  // Yayınlanan anahtar kamu (anon) anahtarı olmalı; service_role asla istemciye inmez.
  const pubKey = (cfg.txt.match(/anonKey:\s*"([^"]*)"/) || [])[1] || "";
  let pubRole = "";
  try {
    pubRole = JSON.parse(Buffer.from(pubKey.split(".")[1], "base64").toString("utf8")).role || "";
  } catch {
    pubRole = "";
  }
  check("canlı: yayınlanan anahtarın rolü anon", pubKey === "" || pubRole === "anon", pubRole || "anahtar yok");
  check("canlı: service_role sızmamış", !cfg.txt.includes("service_role") && !home.txt.includes("service_role"));
  const js = await head("/assets/site.js");
  let jsOk = true;
  try {
    new Function(js.txt);
  } catch (e) {
    jsOk = false;
  }
  check("canlı: yayınlanan site.js ayrışıyor", js.status === 200 && jsOk, js.status + " " + (jsOk ? "" : "syntax"));
  for (const [path, want] of [["/about", 200], ["/tr/", 200], ["/tr/about", 200], ["/privacy", 200], ["/terms", 200], ["/refund", 200], ["/sitemap.xml", 200], ["/robots.txt", 200], ["/manifest.webmanifest", 200], ["/icons/icon-192.png", 200], ["/og-cover.png", 200]]) {
    const r = await head(path);
    check(`canlı: ${path} → ${want}`, r.status === want, String(r.status));
  }
  const nf = await head("/boyle-bir-sayfa-yok");
  check("canlı: olmayan adres 404 + özel sayfa", nf.status === 404 && /404/.test(nf.txt), `${nf.status}`);
  const htmlUrl = await head("/about.html");
  check("canlı: .html adresi temiz URL'e yönleniyor", [301, 302, 307, 308].includes(htmlUrl.status) && htmlUrl.loc.includes("/about"), `${htmlUrl.status} → ${htmlUrl.loc}`);
  const login = await head("/login");
  check("canlı: /login web uygulamasına yönlendiriyor", login.status === 200 && login.txt.includes(APP_URL), String(login.status));
}

await browser.close();
if (server) server.close();
console.log(
  failed
    ? `\n${failed} DENETİM BAŞARISIZ ✗ (${notes} bilgi notu)`
    : `\nSİTE DOĞRULAMASI GEÇTİ ✓ (${notes} bilgi notu)`
);
process.exit(failed ? 1 : 0);
