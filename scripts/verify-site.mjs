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
import { existsSync, readFileSync, readdirSync } from "node:fs";
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
  // Yasak liste: sitede vaat EDİLMEMESİ gereken markalar. WiZ/LIFX/Govee gerçek
  // bağlayıcı olduğundan (UDP köprüsü + lan-connectors handler'ları) listeden
  // çıkarıldı; MQTT/Zigbee2MQTT de artık gerçek bir bağlayıcı (masaüstü; desteklenen cihaz kataloğundan geliyor).
  // HomeKit/Sonoff DIY hâlâ uygulama surface'ünde vaat edilmemeli.
  const banned = ["HomeKit", "Sonoff DIY"];
  const found = banned.filter((b) => text.includes(b));
  check(`${label}: olmayan marka vaat edilmiyor`, found.length === 0, found.join(","));
  // Bayat elle-kopya çıktıların imzası: iç sayfalar .html ile anılıyor.
  const dirty = [
    ...html.matchAll(/href="\/(?:tr\/)?(?:about|privacy|terms|refund|login|light)\.html"/g),
  ].map((m) => m[0]);
  check(`${label}: iç bağlantılar temiz URL`, dirty.length === 0, dirty.slice(0, 3).join(", "));
  for (const id of ["pricing", "downloads", "faq", "integrations", "features", "how"])
    check(`${label}: #${id} bölümü işaretli`, new RegExp(`id="${id}"`).test(html));
  check(`${label}: web uygulaması adresi yok`, !html.includes(APP_URL), APP_URL);
  // Sürüm rozetinin yedek değeri bayatlamasın (GitHub API hız sınırında görünür olan değer).
  const baked = attr(html, /data-nexus-ver>(v[0-9.]+)</);
  const pkgVer = "v" + JSON.parse(readFileSync(join(ROOT, "desktop", "package.json"), "utf8")).version;
  check(`${label}: yedek sürüm rozeti güncel (${baked})`, baked === pkgVer, `beklenen ${pkgVer}`);
}

/* --- site ↔ uygulama/program uyumu: iddialar uygulamanın kendi kodundan türüyor --- */
{
  // Android alt sınırı: sitede yazan sürüm, gradle'daki minSdkVersion'un karşısı olmalı.
  const API_TO_ANDROID = {
    21: "5.0", 22: "5.1", 23: "6.0", 24: "7.0", 26: "8.0", 27: "8.1", 28: "9", 29: "10",
    30: "11", 31: "12", 32: "12L", 33: "13", 34: "14", 35: "15",
  };
  const gradle = existsSync(join(ROOT, "android", "variables.gradle"))
    ? readFileSync(join(ROOT, "android", "variables.gradle"), "utf8")
    : "";
  const minSdk = parseInt((gradle.match(/minSdkVersion\s*=\s*(\d+)/) || [])[1] || "0", 10);
  const androidFloor = API_TO_ANDROID[minSdk] || "";
  check(`depo: android minSdk okunuyor (${minSdk})`, minSdk > 0 && !!androidFloor, String(minSdk));

  // Ev halkası ekranı: rol listesi ve yetki anahtarları sitenin aile kartıyla birebir aynı olmalı.
  // Ekranın betiği household-page.js'e taşındı (satır içi script sınırı, #102): ikisi birlikte okunur.
  const readApp = (f) => (existsSync(join(ROOT, "src", "app", f)) ? readFileSync(join(ROOT, "src", "app", f), "utf8") : "");
  const hh = readApp("nexus-household.html") + readApp("household-page.js");
  const roles = [...hh.matchAll(/<option value="([^"]+)">/g)].map((m) => m[1]);
  check("depo: hane rolleri bulunuyor", roles.length >= 2, roles.join(","));
  const permsBlock = (hh.match(/function defaultPerms[\s\S]{0,220}?return \{([^}]+)\}/) || [])[1] || "";
  const permKeys = [...permsBlock.matchAll(/([a-zA-Z]+)\s*:/g)].map((m) => m[1]);
  check("depo: yetki anahtarları bulunuyor", permKeys.length >= 2, permKeys.join(","));

  const PERM_TR = { control: "kontrol", invite: "davet", settings: "ayar" };
  for (const [file, lang] of [
    ["index.html", "en"],
    ["tr/index.html", "tr"],
  ]) {
    if (!existsSync(join(PUB, file)) || !hh || !androidFloor) continue;
    const text = stripNoise(readFileSync(join(PUB, file), "utf8")).toLowerCase();
    const label = lang === "tr" ? "TR ana" : "EN ana";

    // 1) Android sürüm alt sınırı doğru mu (uygulama API 26 = Android 8.0).
    check(`${label}: Android alt sınırı minSdk ile aynı (Android ${androidFloor}+)`, text.includes(`android ${androidFloor}+`), `minSdk ${minSdk}`);

    // 2) Uydurma kısıt/özellik kalmasın: uygulamanın zorlamadığı sayısal sınır ve
    //    uygulamada olmayan yetki taneliliği (yetkiler üye başına, oda/cihaz bazlı değil).
    const invented = [
      "6 üyeye kadar", "up to 6 members", "for up to 6",
      "oda ve cihaz bazlı", "per-room and per-device",
      "paylaşılan aile sahneleri", "shared family automations",
    ];
    const hit = invented.filter((b) => text.includes(b.toLowerCase()));
    check(`${label}: uygulamada olmayan kısıt vaat edilmiyor`, hit.length === 0, hit.join(" | "));

    // 3) Roller ve yetki adları uygulamanın ekranından gelmeli.
    if (lang === "tr") {
      const missingRoles = roles.filter((r) => !text.includes(r.toLowerCase()));
      check(`${label}: hane rolleri uygulamayla aynı`, missingRoles.length === 0, `eksik: ${missingRoles.join(",")}`);
      const missingPerms = permKeys.filter((k) => PERM_TR[k] && !text.includes(PERM_TR[k]));
      check(`${label}: yetki adları uygulamayla aynı`, missingPerms.length === 0, `eksik: ${missingPerms.join(",")}`);
    }

    // 4) İndirme kartındaki SHA-256 rozeti gerçek bir bağlantı olmalı (dekoratif metin değil).
    const html = readFileSync(join(PUB, file), "utf8");
    const sums = [...html.matchAll(/class="dl-sums"[^>]+href="(https:\/\/github\.com\/[^"]+)"/g)].map((m) => m[1]);
    check(`${label}: indirme kartlarının sağlama bağlantıları var`, sums.length >= 3, `${sums.length}`);
    check(
      `${label}: sağlama bağlantıları platforma göre doğru dosyada`,
      sums.some((u) => /SHA256SUMS-Windows/.test(u)) &&
        sums.some((u) => /SHA256SUMS-Linux/.test(u)) &&
        sums.some((u) => /sha256\.txt/.test(u)),
      sums.join(" ")
    );
    check(`${label}: dekoratif "SHA-256" metni kalmadı`, !/<span>SHA-256<\/span>/.test(html));
  }
}

/* --- hero: telefon çerçevesinde GEZİLEBİLİR gerçek uygulama önizlemesi --- */
{
  const appOrigin = new URL(APP_URL).origin;
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // 1) Çerçeve iki taraflı izinle çalışır: sitede frame-src, uygulamada frame-ancestors.
  if (existsSync(join(PUB, "_headers"))) {
    const h = readFileSync(join(PUB, "_headers"), "utf8");
    check("site: _headers üretimden geliyor (elle kopya değil)", /site-build\.mjs → renderHeaders\(\)/.test(h));
    check("site: CSP frame-src yalnız site", /frame-src 'self'/.test(h) && !h.includes(appOrigin), h.match(/frame-src[^;]*/)?.[0]);
  } else check("site: _headers var", false);
  if (existsSync(join(ROOT, "www", "_headers"))) {
    const a = readFileSync(join(ROOT, "www", "_headers"), "utf8");
    check("uygulama: X-Frame-Options SAMEORIGIN (DENY değil)", /X-Frame-Options: SAMEORIGIN/.test(a), (a.match(/X-Frame-Options: \S+/) || [])[0]);
    check("uygulama: frame-ancestors sitesi tanıyor", new RegExp(`frame-ancestors[^\\n]*${escRe(SITE_ORIGIN.replace("https://", ""))}`).test(a), a.match(/frame-ancestors[^\n]*/)?.[0]);
  } else check("uygulama: www/_headers var", false);

  // 2) Görsel setinin tek kaynağı site-shots.mjs; hero ona uymak zorunda.
  const shotsSrc = existsSync(join(HERE, "site-shots.mjs")) ? readFileSync(join(HERE, "site-shots.mjs"), "utf8") : "";
  const srcPages = [...shotsSrc.matchAll(/\{\s*name:\s*"([a-z-]+)",\s*path:\s*"([^"]+)"/g)].map((m) => ({ name: m[1], path: m[2] }));
  check("depo: site-shots ekran listesi okunuyor", srcPages.length >= 6, `${srcPages.length}`);
  const shotDir = join(PUB, "images", "shots");
  for (const p of srcPages) {
    check(`depo: ${p.path} ekranı var`, existsSync(join(ROOT, "src", "app", p.path)));
    const title = existsSync(join(ROOT, "src", "app", p.path))
      ? (readFileSync(join(ROOT, "src", "app", p.path), "utf8").match(/<title>NEXUS\s*[—-]\s*([^<]+)<\/title>/i) || [])[1] || ""
      : "";
    for (const [file, lang] of [
      ["index.html", "en"],
      ["tr/index.html", "tr"],
    ]) {
      if (!existsSync(join(PUB, file))) continue;
      const html = readFileSync(join(PUB, file), "utf8");
      const slide = new RegExp(`data-shot="${escRe(p.name)}"[^>]*data-label="([^"]*)"`).exec(html);
      check(`${lang === "tr" ? "TR" : "EN"} hero: "${p.name}" ekranı var`, !!slide);
      if (slide) {
        const label = slide[1];
        check(`${lang === "tr" ? "TR" : "EN"} hero ${p.name}: görseli üretilmiş`, existsSync(join(shotDir, lang === "tr" ? `${p.name}.png` : `en/${p.name}.png`)));
        // Etiket, uygulamanın kendi ekran başlığından bir kelime taşımak zorunda:
        // "Cihazlar & Odalar" gibi uygulamada olmayan bir sayfanın pazarlanamaması için.
        if (lang === "tr" && title) {
          const words = title.split(/\s+/).map((w) => w.toLowerCase()).filter((w) => w.length >= 4);
          check(`TR hero ${p.name}: etiket uygulama başlığıyla uyumlu (${label} ↔ ${title.trim()})`, words.some((w) => label.toLowerCase().includes(w)), title.trim());
        }
      }
    }
  }
  for (const dir of [shotDir, join(shotDir, "en")]) {
    if (!existsSync(dir)) continue;
    const known = new Set(srcPages.map((p) => p.name));
    const orphan = readdirSync(dir).filter((f) => f.endsWith(".png") && !known.has(f.replace(/\.png$/, "")));
    check(`${dir.endsWith("en") ? "EN" : "TR"} shots: bayat görsel yok`, orphan.length === 0, orphan.join(","));
  }

  // 3) Önizleme işareti: tembel iframe + mod düğmeleri + ölçekleme fonksiyonu.
  for (const [file, lang] of [
    ["index.html", "en"],
    ["tr/index.html", "tr"],
  ]) {
    if (!existsSync(join(PUB, file))) continue;
    const html = readFileSync(join(PUB, file), "utf8");
    const label = lang === "tr" ? "TR" : "EN";
    check(`${label}: telefon canlı web uygulamasını açmıyor`, !/phonePreviewFrame/.test(html) && !html.includes(APP_URL));
    check(`${label}: telefon uygulama ekran görsellerini gösteriyor`, /class="phone-screen-content"/.test(html) && /data-shot="home"/.test(html));
    const note = /id="phonePreviewNote"[^>]*>([\s\S]{0,400}?)<\/span>/.exec(html);
    check(`${label}: önizleme notu var`, !!note, "phonePreviewNote bulunamadı");
  }
  if (existsSync(join(PUB, "assets", "site.js"))) {
    const js = readFileSync(join(PUB, "assets", "site.js"), "utf8");
    check("site.js: mod geçiş fonksiyonu var", /function nxSetPhoneMode\(/.test(js));
    check("site.js: ölçek iframe iç ekran genişliğinden hesaplanıyor", /--nx-preview-scale/.test(js) && /clientWidth/.test(js));
  } else check("site.js üretildi", false);
}

/* --- uygulama ekranlarında marka taşması: katalogda olmayan marka vaat edilemez ---
   Hero bu ekranların fotoğrafını gösteriyor; ekranda "Sonos" yazan bir adım, uygulamanın
   Sonos'u kontrol ettiğini söyler. Destek kataloğunda (supported-devices.js) olmayan
   markalar için bu kapı patlar. (Ölçüldü: Film Modu "Apple TV & LG OLED / Netflix /
   Sonos", Misafir Modu "Apple TV Açık" adımını taşıyordu — katalogda yoklar.) */
{
  const catalog = existsSync(join(ROOT, "src", "app", "supported-devices.js"))
    ? readFileSync(join(ROOT, "src", "app", "supported-devices.js"), "utf8").toLowerCase()
    : "";
  check("depo: destek kataloğu okunuyor", catalog.length > 1000);
  const BRANDS = ["apple tv", "sonos", "netflix", "lg oled", "chromecast", "roku", "spotify", "alexa", "google home", "samsung smartthings"];
  if (catalog) {
    // Ekranlar tek satırlık büyük HTML'ler: hepsini bir kez okuyup küçük harfe çevir.
    const screens = new Map();
    for (const f of readdirSync(join(ROOT, "src", "app")).filter((n) => /^nexus-.*\.html$/.test(n)))
      screens.set(f, readFileSync(join(ROOT, "src", "app", f), "utf8").toLowerCase());
    const dictText = (existsSync(join(ROOT, "src", "app", "lang-en.js")) ? readFileSync(join(ROOT, "src", "app", "lang-en.js"), "utf8") : "").toLowerCase();
    for (const brand of BRANDS) {
      if (catalog.includes(brand)) continue; // katalogda varsa sorun değil
      const offenders = [...screens].filter(([, t]) => t.includes(brand)).map(([f]) => f);
      if (!offenders.length && dictText.includes(brand)) offenders.push("lang-en.js");
      check(`uygulama: katalogsuz marka geçmiyor (${brand})`, offenders.length === 0, offenders.join(", "));
    }
  }
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
    check("sitemap: 14 adres (7 sayfa × 2 dil)", locs.length === 14, `${locs.length}`);
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
  // Giriş kısa yolu tarayıcı uygulamasına gitmez; kurulum bölümüne iner.
  for (const f of ["login.html", "tr/login.html"]) {
    if (!existsSync(join(PUB, f))) continue;
    const html = readFileSync(join(PUB, f), "utf8");
    const downloads = f.startsWith("tr/") ? "/tr/#downloads" : "/#downloads";
    check(`${f}: web uygulamasına yönlendirmiyor`, !html.includes(APP_URL));
    check(`${f}: indirme bölümüne gidiyor`, html.includes(downloads));
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
  const wantsTr = (ctxInit && ctxInit["nx-lang"] === "tr") || String(url).includes("/tr/");
  const ctx = await newCtx({ locale: wantsTr ? "tr-TR" : "en-US" });
  for (const [k, v] of Object.entries(ctxInit)) {
    await ctx.addInitScript(([key, val]) => localStorage.setItem(key, val), [k, v]);
  }
  const pg = await ctx.newPage();
  const errors = [];
  const blocked = [];
  /* api.github.com 403 = ziyaretçi başına hız sınırı (60 istek/saat); sitenin hatası
     değil: sürüm rozeti build'den gelen değeri göstermeye devam ediyor ve isteğin
     düşürülmesi için yakalanmış. Yerel/üretim farkı üretmesin diye ayrıştırıldı.
     HATA AYIKLAMA NOTU: gürültü filtresi YÜKLEME ANINDA bir kez uygulanmış bir kopya
     DÖNDÜRÜLMEZ — tıklamalardan SONRA çıkan hatalar da görülsün diye itme sırasında
     filtreleniyor; aksi halde "etkileşimde hata yok" denetimleri sessizce kör kalırdı. */
  const ghNoise = (t) =>
    blocked.some((b) => b.includes("api.github.com")) &&
    /Failed to load resource/.test(t) &&
    !/127\.0\.0\.1|pages\.dev/.test(t);
  pg.on("pageerror", (e) => {
    const t = String(e).slice(0, 160);
    if (!ghNoise(t)) errors.push(t);
  });
  pg.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = "console: " + m.text().slice(0, 160);
    if (!ghNoise(t)) errors.push(t);
  });
  pg.on("response", (r) => {
    if (r.status() >= 400 && !r.url().startsWith(BASE)) blocked.push(r.status() + " " + r.url());
  });
  await pg.goto(`${BASE}${url}`, { waitUntil: "load" });
  await pg.waitForTimeout(400);
  const gh = blocked.filter((b) => b.includes("api.github.com"));
  if (gh.length) info(`${url} — GitHub API ${gh[0].split(" ")[0]} (hız sınırı, siteyi etkilemiyor)`);
  return { ctx, pg, errors };
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
  // loading="lazy" olan görüntü ekran dışındayken tarayıcı hiç istek ATMAZ (complete
  // false, currentSrc boş) — bu bir bozukluk değil. Bu yüzden yalnızca yüklemeye
  // BAŞLANMIŞ (currentSrc dolu) görüntüler beklenir ve doğal genişliği 0 kalanlar
  // gerçek bozukluk olarak raporlanır.
  const broken = await pg.evaluate(async () => {
    const cand = [...document.images]
      .filter((i) => !i.closest(".shot-slide:not(.active)"))
      .filter((i) => {
        const r = i.getBoundingClientRect();
        return r.width > 1 && r.height > 1 && r.top < window.innerHeight * 2;
      })
      .filter((i) => i.currentSrc);
    await Promise.all(
      cand.map(
        (i) =>
          i.complete ||
          new Promise((res) => {
            i.addEventListener("load", res, { once: true });
            i.addEventListener("error", res, { once: true });
            setTimeout(res, 4000);
          })
      )
    );
    return cand.filter((i) => i.naturalWidth === 0).map((i) => i.currentSrc || i.src);
  });
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
    new Function("window", readFileSync(join(ROOT, "src", "app", "supported-devices.js"), "utf8"))(win);
    return win.NEXUS_SUPPORTED_DEVICES || [];
  })();
  const wantAll = matrix.filter((d) => d.availability === "all").length;
  check(
    `${label}: entegrasyon çipleri cihaz matrisinden (${chips.length} çip)`,
    chips.length >= wantAll,
    `matris 'all' = ${wantAll}`
  );

  const hrefs = await pg.$$eval("a", (els) => els.map((e) => e.href));
  check(`${label}: tarayıcı uygulamasına giden bağlantı yok`, !hrefs.some((h) => h.startsWith(APP_URL)));

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

/* ------------------------------------------------- telefon: uygulama ekran görselleri
   Web uygulaması yayında değil. Çerçeve, site-shots'un ürettiği aynı ekranları gösterir. */
{
  const { ctx, pg } = await openPage(TR_LANG, "/tr/");
  const geo = await pg.evaluate(() => {
    const b = document.querySelector(".phone-inner-screen");
    return b ? { w: b.clientWidth, h: b.clientHeight } : null;
  });
  check("önizleme: telefon ekranı ölçüldü", !!geo && geo.w > 100, JSON.stringify(geo));
  const state = await pg.evaluate(() => {
    const slide = document.querySelector(".shot-slide.active img");
    const shots = document.querySelector(".phone-screen-content");
    const shown = shots ? getComputedStyle(shots).display !== "none" : false;
    return {
      frame: !!document.getElementById("phonePreviewFrame"),
      shown,
      src: slide ? slide.getAttribute("src") || "" : "",
      w: slide ? Math.round(slide.getBoundingClientRect().width) : 0,
    };
  });
  check("önizleme: web uygulaması çerçevesi yok", !state.frame);
  check("önizleme: ekran görseli görünür", state.shown && state.src.includes("/images/shots/") && state.w > 40, state.src + " " + state.w + "px");
  const overflowLive = await pg.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  check("önizleme: yatay taşma yok", overflowLive <= 0, `fark ${overflowLive}px`);
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
  // Seçici HER ziyaretçiye açık: İngilizce cihazdaki biri de Türkçe sayfaya
  // geçebilmeli. Denetim eskiden "İngilizce'de gizli"yi bekliyordu; arayüz öyle
  // tasarlanmadı — TR|EN iki pil her iki dilde de basılıyor (site-build.mjs).
  check("İngilizce cihazda dil seçici var", await pg.isVisible(".lang-switch"));
  const pills = await pg.$$eval(".lang-btn", (els) =>
    els.map((e) => ({ t: (e.textContent || "").trim(), active: e.classList.contains("active"), href: e.getAttribute("href") }))
  );
  check(
    "İngilizce sayfada aktif pil EN, diğer pil TR'ye bağlı",
    pills.some((p) => p.t === "EN" && p.active) && pills.some((p) => p.t === "TR" && !p.active && (p.href || "").includes("/tr/")),
    JSON.stringify(pills)
  );
  await ctx.close();
}
{
  const ctx = await newCtx({ locale: "tr-TR" });
  await ctx.addInitScript(() => localStorage.setItem("nx-lang", "en"));
  const pg = await ctx.newPage();
  await pg.goto(`${BASE}/`, { waitUntil: "load" });
  await pg.waitForTimeout(400);
  check("Türkçe cihazda dil seçici var", await pg.isVisible(".lang-switch"));
  await pg.click(".lang-btn:not(.active)");
  await pg.waitForTimeout(700);
  check("TR'ye geçiş /tr/ adresine gidiyor", pg.url().includes("/tr/"), pg.url());
  await ctx.close();
}

/* ---------------------------------------------------------------- indirme aynası */
/* site-build.mjs'teki yedek yol: GitHub API'sına ulaşılamazsa (60 istek/saat hız
   sınırı — gerçek ziyaretçilerde görülüyor) bağlantılar /downloads/current.json ile
   çevrilebilir. 28-29 Ekim'de iki başarısızlık modu da ölçüldü: (a) dosya 1.0.26'da
   kaldı → ziyaretçi SESSİZCE çöken eski kurucuya yönlendi; (b) dosya sürümden öne
   düştü → kurucu henüz yüklenmemişken pinli adres 404 verecekti. Çözüm: fren yalnız
   elle "pinned": true yazılırsa devrede. Üç yön de burada kilitleniyor. */
{
  const GH = "https://github.com/Enard52/nexus-releases";
  const siteVer = JSON.parse(readFileSync(join(ROOT, "desktop", "package.json"), "utf8")).version;
  const filesFor = (v) => ({
    "NEXUS-Setup.exe": `${GH}/releases/download/v${v}/NEXUS-Setup.exe`,
    "NEXUS-linux.deb": `${GH}/releases/download/v${v}/NEXUS-linux.deb`,
  });
  const mirror = (o) => JSON.stringify(o);

  async function linksWith(mirrorBody) {
    const ctx = await newCtx();
    await ctx.addInitScript(() => localStorage.setItem("nx-lang", "en"));
    const pg = await ctx.newPage();
    // API kapalı → yedek yol denenebilir durumda.
    await pg.route("https://api.github.com/**", (r) => r.abort());
    await pg.route("**/downloads/current.json", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: mirrorBody }),
    );
    await pg.goto(`${BASE}/`, { waitUntil: "load" });
    await pg.waitForTimeout(900);
    const out = await pg.$$eval('a[href*="nexus-releases/releases"]', (els) =>
      els.map((e) => e.getAttribute("href")),
    );
    await ctx.close();
    return out;
  }
  const allLatest = (l) => l.length > 0 && l.every((h) => h.includes("releases/latest/download/"));

  // (a) fren KAPALI ve ayna BAYAT → hiçbir şey yazılmamalı (28 Ekim vakası).
  const staleUnpinned = await linksWith(mirror({ version: "0.9.9", files: filesFor("0.9.9") }));
  check(
    "İndirme: kapalı fren + BAYAT ayna eski kurucuya geri sarmatıyor",
    allLatest(staleUnpinned),
    staleUnpinned.slice(0, 3).join(" | "),
  );

  // (b) fren KAPALI ve ayna sürümden ÖNE düşmüş → yine yazılmamalı (404 penceresi).
  const futureUnpinned = await linksWith(mirror({ version: "99.0.0", files: filesFor("99.0.0") }));
  check(
    "İndirme: kapalı fren + ÖNDEKİ ayna henüz yayımlanmamış sürüme kilitlemiyor",
    allLatest(futureUnpinned),
    futureUnpinned.slice(0, 3).join(" | "),
  );

  // (c) fren AÇIK (pinned:true) → acil durum geri alması gerçekten çalışmalı.
  const pinned = await linksWith(mirror({ version: siteVer, pinned: true, files: filesFor(siteVer) }));
  check(
    "İndirme: pinned:true ayna acil durum bağlantılarına çeviriyor (fren durmuyor)",
    pinned.some((h) => h.includes(`/releases/download/v${siteVer}/`)),
    pinned.slice(0, 3).join(" | "),
  );
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
  const ctx = await newCtx({ viewport: { width: 820, height: 1180 }, locale: "tr-TR" });
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
  /* Canlı önizleme iki başlığın anlaşmasına bağlı: site çerçeveye izin vermeli,
     uygulama da kendisini çerçevede göstermeye. Yayınlanandan okunur (kaynak değil). */
  const appOriginLive = new URL(APP_URL).origin;
  check("canlı: site web uygulamasını çerçeveye almıyor", !home.csp.includes(appOriginLive) && !home.txt.includes(APP_URL), home.csp.match(/frame-src[^;]*/)?.[0] || "frame-src yok");
  let webStillLive = false;
  try {
    const appHome = await fetch(`${APP_URL}/`, { redirect: "manual" });
    const appBody = appHome.status === 200 ? await appHome.text() : "";
    webStillLive = appHome.status === 200 && /nexus-|NEXUS/.test(appBody);
  } catch { webStillLive = false; }
  check("canlı: web uygulaması yayında değil", !webStillLive);
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
  check("canlı: /login kurulum bölümüne gidiyor", login.status === 200 && !login.txt.includes(APP_URL) && login.txt.includes("/#downloads"), String(login.status));
  // Sitenin vaat ettiği kurulum dosyaları ve sağlama değerleri release'de duruyor mu.
  const DL = "https://github.com/Enard52/nexus-releases/releases/latest/download/";
  const dlLinks = [
    ...new Set(
      [...home.txt.matchAll(/href="(https:\/\/github\.com\/[^"]*nexus-releases\/releases\/latest\/download\/[^"]+)"/g)].map(
        (m) => m[1]
      )
    ),
  ];
  check(
    "canlı: indirme/sağlama bağlantıları sayfada var",
    dlLinks.length >= 6 && dlLinks.every((u) => u.startsWith(DL)),
    `${dlLinks.length}`
  );
  for (const u of dlLinks) {
    let st = 0;
    try {
      st = (await fetch(u, { method: "HEAD", redirect: "follow" })).status;
    } catch {
      st = 0;
    }
    check(`canlı: ${u.slice(DL.length)} → 200`, st === 200, String(st));
  }
}

await browser.close();
if (server) server.close();
console.log(
  failed
    ? `\n${failed} DENETİM BAŞARISIZ ✗ (${notes} bilgi notu)`
    : `\nSİTE DOĞRULAMASI GEÇTİ ✓ (${notes} bilgi notu)`
);
process.exit(failed ? 1 : 0);
