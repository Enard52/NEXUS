// i18n kapsama raporu (issue #32 kararı: mevcut sözlük mimarisi kalıyor)
// -------------------------------------------------------------------------
// Ekranlardaki Türkçe metinleri lang-en.js sözlüğüyle karşılaştırır ve İngilizce
// karşılığı olmayanları raporlar. Üç kaynağa bakar: HTML metin düğümleri, çevrilen
// öznitelikler (placeholder/title/aria-label/alt…) ve JS katalog alanları
// (name/label/note/title/desc/… — ekranların önemli kısmı HTML'de değil veri
// dosyalarında duruyor). BAŞARISIZLIK üretmez —
// kılavuzdur: yeni metin eklerken sözlüğü güncellemeyi hatırlatır.
// TEK İSTİSNA: sözlük hiç okunamazsa (biçim değişti) çıkış kodu 1 — aksi halde
// "hepsi eksik" ya da "hepsi tamam" diye boş bir rapor verir ve denetim
// sessizce işlevsiz kalır (bir kez tam da böyle olmuştu).
// Kullanım: node scripts/i18n-coverage.mjs [sayfaAdı] [--json]
//   --json: makine-okur çıktı (packages/core/src/i18n-coverage.test.ts bunu
//           çalıştırıp gaps listesinin boş olmasını KAPI olarak denetler;
//           betiğin kendisi yine başarısızlık üretmez ki elle kullanım rahat kalsın).
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ARGS = process.argv.slice(2);
const JSON_OUT = ARGS.includes("--json");
// Sayfa filtresi bayrak olmayan ilk argüman: eskiden process.argv[2] okunuyordu ve
// "--json" sayfa adı sanılıp hiçbir dosya eşleşmiyordu (rapor 0/0 = sessizce "temiz").
const only = ARGS.find((a) => !a.startsWith("--"));
// Ekranlar ve sözlük kökte değil, src/app'de duruyor (tek kaynak kuralı). Betik
// eskiden kökü tarıyordu: ya ENOENT ile çöküyor ya da hiç sayfa bulamıyordu.
const APP = join(ROOT, "src", "app");
const dict = readFileSync(join(APP, "lang-en.js"), "utf8");
const DICT_TEXT = new Set();

/* Sözlük REGEX'LE okunmaz, ÇALIŞTIRILARAK okunur.
   Dil dosyası bir JS modülüdür (window.NEXUS_EN = { text, html, slots, patterns }).
   Eskiden kalıp eşleşmesiyle taranıyordu ve biçimlendirici her geçtiğinde sessizce
   çürüdü: tek kelimelik anahtarların tırnağı kalkınca ("text" → text) sayaç 0'a
   düştü, tırnak içinde tırnak olan anahtarlar tek tırnağa geçince görünmez oldu.
   Çalıştırma her iki yazımda da aynı nesneyi verir — denetim, denetlenen şeyin
   biçimine bağımlı olmaktan çıkar. */
function readDictionary(source) {
  const win = {};
  new Function("window", source)(win);
  return win.NEXUS_EN || {};
}

const EN = readDictionary(dict);
let dictBroken = false;
const frag = (s) => String(s).replace(/\s+/g, " ").trim();
const templOf = (s) =>
  String(s)
    .replace(/[+-]?\d+(?:[.,]\d+)*/g, "{0}")
    .replace(/\s+/g, " ")
    .trim();
const addFragments = (key) => {
  DICT_TEXT.add(frag(key));
  // DİKKAT: anahtarın sayısız hâli (templOf(anahtar)) KAPSAMA SAYILMAZ. lookup()
  // yalnızca çevrilecek metnin sayısız hâline bakar (TEXT[templ(s)]); sözlük anahtarı
  // "Örn. 2,50" ise "Örn. 150" çevrilmez — şablon anahtarı "Örn. {0}" olarak yazılmalı.
  // Eskiden buraya templOf(anahtar) ekleniyordu ve sayı içeren anahtarlar yüzünden
  // denetim yanlışlıkla "kapalı" görünüyordu.
  // html anahtarlarında satır içi etiket var (<strong>…): çalışma zamanı metni
  // parçalara böler, bu yüzden etiketten arındırılmış hâli de çevrilmiş sayılır.
  for (const part of String(key)
    .replace(/<[^>]*>/g, "")
    .split(/\{\d+\}/)) {
    const t = frag(part);
    if (t) DICT_TEXT.add(t);
  }
};

/* ÇALIŞMA ZAMANI MODELİ — denetim, çeviricinin gerçekten baktığı yerleri sayar.
   i18n.js'de düz bir metin/öznitelik_node'u lookup() ile çevrilir ve lookup YALNIZ
   `text` grubuna (birebir, sonra sayılar {0} yapılmış hâliyle) ve `patterns`
   dizisine bakar. Satır içi etiketli öğeler doMixed'e gider: orada `slots` anahtarı
   "{0}"-yer tutuculu DOM anahtarıyla eşleşir, eşleşmezse düğüm düğüm `text` denenir.
   Sonuç: `slots` düz metin kapsamı DEĞİLDİR. 2026-10-31'de 45 anahtar yanlışlıkla
   slots'a yazılmış ve İngilizce arayüzde Türkçe görünüyordu — tarayıcı denetimi bunu
   buldu, statik denetim bulamıyordu çünkü slots'u kapsama sayıyordu. */
for (const group of ["text", "html"]) {
  for (const key of Object.keys(EN[group] || {})) addFragments(key);
}
/* slots: YALNIZ {n} yer tutuculu anahtarlar bir şeye yarar ve onların da kapsamı
   parçaları kadardır — doMixed bütün öğeyi şablonla yeniden yazıyor, parçaları değil.
   Yer tutucusuz bir slots anahtarı ise hiçbir yoldan okunmaz (aşağıda SLOTS-ÖLÜ). */
for (const key of Object.keys(EN.slots || {})) {
  if (!/\{\d+\}/.test(key)) continue;
  for (const part of String(key)
    .replace(/<[^>]*>/g, "")
    .split(/\{\d+\}/)) {
    const t = frag(part);
    if (t) DICT_TEXT.add(t);
  }
}
const PATTERNS = (EN.patterns || []).map((p) => new RegExp(p[0]));
const deadSlots = Object.keys(EN.slots || {}).filter((k) => !/\{\d+\}/.test(k));

/* YİNELEYEN ANAHTAR: çalışma zamanında son yazılan kazanır, yani ilk satır sessizce
   ölü kopyadır — ve iki satırın değeri farklıysa ekranda hangisinin görüneceği satır
   sırasına bağlı olur. Sözlük ~3100 satır; gözle bulunamaz. Satır satır taranır
   çünkü nesne okuma (readDictionary) yineleneni zaten tek değere indirmiş oluyor. */
const dupes = [];
{
  let group = "";
  const seen = new Map();
  const lines = dict.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^(text|html|slots|patterns):/.test(line)) group = line.split(":")[0];
    const key = line.match(/^"((?:[^"\\]|\\.)*)":/) || line.match(/^([A-ZÇĞİÖŞÜçğıöşü][^\s:"]*):/);
    if (!key) continue;
    const gk = group + "|" + key[1];
    if (seen.has(gk))
      dupes.push(`${group}: ${key[1].slice(0, 70)} (satır ${seen.get(gk)} ve ${i + 1})`);
    else seen.set(gk, i + 1);
  }
}
if (DICT_TEXT.size < 500) {
  // Sözlük okunamazsa rapor "hepsi eksik" diye bağırır; bu, denetimin kendisinin
  // bozulduğunun işaretidir — sessizce yanlış yüzde verme.
  dictBroken = true;
  console.error(
    `HATA: sözlükte yalnız ${DICT_TEXT.size} anahtar okundu — lang-en.js biçimi/ada değişmiş olabilir.`,
  );
  process.exitCode = 1;
}
const TR = /[çğıöşüÇĞİÖŞÜ]/;
/* Şapkasız Türkçe sözcükler: "Vurgu Rengi", "Turuncu", "Oturum Aç", "Etkin" gibi
   Türkçe karakter İÇERMEYEN metinler tek başına kaçıyor ve İngilizce arayüzde
   Türkçe kalıyordu (tarayıcı denetiminde bulundu: aksan renkleri, oturum ekranları).
   Yalnız bu arayüzde görülen Türkçe sözcükler; İngilizce karşılıkları listeye alınmadı. */
const TR_WORDS =
  /\b(mavi|mor|turuncu|pembe|turkuaz|gri|siyah|beyaz|vurgu|renk|renkli|oturum|etkin|arama|klavye|genişlet|daralt|sürüm|haftalık|aylık|günlük|yıllık|sonuç|parola|yedek|davet|onay|iptal|kaydet|düzenle|yenile|sohbet|mesaj|bildirim|titreşim|hareket|sessiz|kapali|acik|giris|cikis)\b/i;
const isTurkish = (t) => TR.test(t) || TR_WORDS.test(t);
// Dil ADLARI çevrilmez: arayüzde her zaman kendi yazımıyla durur ("Türkçe" seçeneği
// İngilizce arayüzde de "Türkçe"dir). Bunlar kapsama sayılmaz — eksik çeviri değildir.
const UNTRANSLATABLE = new Set(["Türkçe", "İngilizce"]);
// i18n.js doAttrs: bu öznitelikler de çevrilir, yani statik metin kadar kapsanmalı.
// (Eskiden yalnız >metin< taranıyordu; "Aramayı temizle" gibi aria-label'lar sessizce
// dışarıda kalıyordu ve İngilizce arayüzde Türkçe okunuyordu.)
const ATTRS = ["placeholder", "title", "aria-label", "alt", "data-tooltip", "label"];
const isCovered = (t) =>
  DICT_TEXT.has(t) || DICT_TEXT.has(templOf(t)) || PATTERNS.some((re) => re.test(t));

let total = 0,
  covered = 0;
const gaps = [];
let pages = 0;
for (const f of readdirSync(APP)
  .filter((x) => /^nexus-.*\.html$/.test(x))
  .sort()) {
  if (only && !f.includes(only)) continue;
  pages++;
  const raw = readFileSync(join(APP, f), "utf8");
  const html = raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  // {4,120} idi: 120 karakteri aşan paragraflar hiç taranmıyordu ve eksik çeviriler görünmez kalıyordu.
  for (const [, text] of html.matchAll(/>([^<>]{4,400})</g)) {
    const t = text.replace(/\s+/g, " ").trim();
    if (!t || !isTurkish(t)) continue;
    if (UNTRANSLATABLE.has(t)) continue;
    total++;
    if (isCovered(t)) covered++;
    else gaps.push(f + ": " + t.slice(0, 80));
  }
  // Öznitelik metinleri: <button aria-label="…"> / <input placeholder="…">
  for (const a of ATTRS) {
    // (?<![-\w]) / (?![-\w]): "aria-label" taranırken aynı ada önden yapışan
    // `label="…"` parçası ayrıca eşleşmesin — her şey iki kere sayılıyordu.
    for (const [, v] of raw.matchAll(
      new RegExp(`(?<![-\\w])${a}(?![-\\w])="([^"]{4,400})"`, "g"),
    )) {
      const t = v.replace(/\s+/g, " ").trim();
      if (!t || !isTurkish(t) || UNTRANSLATABLE.has(t)) continue;
      total++;
      if (isCovered(t)) covered++;
      else gaps.push(f + " [" + a + "]: " + t.slice(0, 80));
    }
  }
}
// Yanlış grup = ölü anahtar: slots'taki yer tutucusuz anahtar lookup() tarafından
// hiç okunmaz; yazıldığı an İngilizce arayüzde Türkçe kalmaya mahkûmdur.
for (const k of deadSlots) gaps.push("SLOTS-ÖLÜ (text'e taşınmalı): " + k.slice(0, 80));
for (const d of dupes) gaps.push("YİNELEYEN ANAHTAR (silinmeli): " + d);
/* JS KATALOG ALANLARI — ekranın yarısı HTML'de değil veri dosyalarında durur:
   supported-devices.js marka/model listeleri, quick-scenes.js senaryo özetleri,
   household-page.js davet/izin satırları. Ne ">metin<" ne de öznitelik taramasına
   girerler, yani statik denetim bunları hiç göremezdi; 2026-10-31 tarayıcı denetimi
   İngilizce arayüzde Türkçe kalan 63 metnin çoğunun burada olduğunu gösterdi.
   Dar kural: yalnız görüntüleme alanlarının (name/label/note/title/desc/…) alıntıeli
   dizi değerleri. Template literal ve nexusT(tr, en) ikili çağı kapsam dışı — ilki
   parçalanıyor, ikincisi zaten iki dili birden taşıyor. */
const JS_FIELDS =
  "name|label|note|title|desc|description|placeholder|caption|subtitle|hint|message|heading|text|question|body";
const jsFiles = readdirSync(APP)
  .filter((x) => x.endsWith(".js") && x !== "lang-en.js")
  .sort();
let jsTotal = 0;
for (const f of jsFiles) {
  if (only && !f.includes(only)) continue;
  const src = readFileSync(join(APP, f), "utf8");
  for (const q of ['"', "'"]) {
    const re = new RegExp(
      `\\b(?:${JS_FIELDS})\\s*:\\s*${q}((?:[^${q}\\\\]|\\\\.){3,1200})${q}`,
      "g",
    );
    for (const [, v] of src.matchAll(re)) {
      const t = v.replace(/\s+/g, " ").trim();
      if (t.length < 4 || t.length > 400) continue;
      if (!isTurkish(t) || UNTRANSLATABLE.has(t)) continue;
      jsTotal++;
      total++;
      if (isCovered(t)) covered++;
      else gaps.push(f + " [dizi]: " + t.slice(0, 80));
    }
  }
}
if (JSON_OUT) {
  // Tek satır JSON: test kapısı bunu okur. `gaps` tam liste (kırpılmamış) — insan
  // çıktısındaki "ilk 25" sınırı burada yok, yoksa kapı 26. eksiği görmezdi.
  console.log(
    JSON.stringify({
      total,
      covered,
      percent: total ? Math.round((covered / total) * 100) : 0,
      gaps,
      pages,
      filter: only || null,
      dictKeys: DICT_TEXT.size,
      dictBroken,
      deadSlots: deadSlots.length,
      dupes: dupes.length,
      jsStrings: jsTotal,
    }),
  );
} else {
  console.log(
    `Türkçe metin (HTML düğüm + öznitelik + JS katalog alanı): ${total} · sözlükte karşılığı var: ${covered} (${total ? Math.round((covered / total) * 100) : 0}%)`,
  );
  console.log(
    `  JS katalog alanından gelen: ${jsTotal} · yinelenen sözlük anahtarı: ${dupes.length}`,
  );
  if (gaps.length) {
    console.log(`\nKarşılığı olmayan (${gaps.length}) — ilk 25:`);
    gaps.slice(0, 25).forEach((g) => console.log("  " + g));
    console.log(
      gaps.length > 25
        ? "  …"
        : '\nİpucu: lang-en.js "text" bölümüne anahtar=Türkçe metin, değer=İngilizce karşılık ekleyin.\n' +
            '       "slots" YALNIZca {0} yer tutuculu satır içi etiketli cümleler içindir — oraya yazılan\n' +
            "       düz metin çalışma zamanında hiç okunmaz (lookup yalnız text + patterns'e bakar).",
    );
  }
}
