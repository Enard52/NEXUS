// i18n kapsama raporu (issue #32 kararı: mevcut sözlük mimarisi kalıyor)
// -------------------------------------------------------------------------
// Ekranlardaki statik Türkçe metinleri lang-en.js sözlüğüyle karşılaştırır
// ve İngilizce karşılığı olmayanları raporlar. BAŞARISIZLIK üretmez —
// kılavuzdur: yeni metin eklerken sözlüğü güncellemeyi hatırlatır.
// TEK İSTİSNA: sözlük hiç okunamazsa (biçim değişti) çıkış kodu 1 — aksi halde
// "hepsi eksik" ya da "hepsi tamam" diye boş bir rapor verir ve denetim
// sessizce işlevsiz kalır (bir kez tam da böyle olmuştu).
// Kullanım: node scripts/i18n-coverage.mjs [sayfaAdı]
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
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
const frag = (s) => String(s).replace(/\s+/g, " ").trim();
const addFragments = (key) => {
  DICT_TEXT.add(frag(key));
  // html anahtarlarında satır içi etiket var (<strong>…): çalışma zamanı metni
  // parçalara böler, bu yüzden etiketten arındırılmış hâli de çevrilmiş sayılır.
  for (const part of String(key).replace(/<[^>]*>/g, "").split(/\{\d+\}/)) {
    const t = frag(part);
    if (t) DICT_TEXT.add(t);
  }
};
for (const group of ["text", "html", "slots"]) {
  for (const key of Object.keys(EN[group] || {})) addFragments(key);
}
if (DICT_TEXT.size < 500) {
  // Sözlük okunamazsa rapor "hepsi eksik" diye bağırır; bu, denetimin kendisinin
  // bozulduğunun işaretidir — sessizce yanlış yüzde verme.
  console.error(
    `HATA: sözlükte yalnız ${DICT_TEXT.size} anahtar okundu — lang-en.js biçimi/ada değişmiş olabilir.`,
  );
  process.exitCode = 1;
}
const templ = (s) =>
  s
    .replace(/[+-]?\d+(?:[.,]\d+)*/g, "{0}")
    .replace(/\s+/g, " ")
    .trim();
const TR = /[çğıöşüÇĞİÖŞÜ]/;
// Dil ADLARI çevrilmez: arayüzde her zaman kendi yazımıyla durur ("Türkçe" seçeneği
// İngilizce arayüzde de "Türkçe"dir). Bunlar kapsama sayılmaz — eksik çeviri değildir.
const UNTRANSLATABLE = new Set(["Türkçe", "İngilizce"]);
const only = process.argv[2];

let total = 0,
  covered = 0;
const gaps = [];
for (const f of readdirSync(APP)
  .filter((x) => /^nexus-.*\.html$/.test(x))
  .sort()) {
  if (only && !f.includes(only)) continue;
  const html = readFileSync(join(APP, f), "utf8")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  // {4,120} idi: 120 karakteri aşan paragraflar hiç taranmıyordu ve eksik çeviriler görünmez kalıyordu.
  for (const [, text] of html.matchAll(/>([^<>]{4,400})</g)) {
    const t = text.replace(/\s+/g, " ").trim();
    if (!t || !TR.test(t)) continue;
    if (UNTRANSLATABLE.has(t)) continue;
    total++;
    if (DICT_TEXT.has(t) || DICT_TEXT.has(templ(t))) covered++;
    else gaps.push(f + ": " + t.slice(0, 80));
  }
}
console.log(
  `Statik TR metin: ${total} · sözlükte karşılığı var: ${covered} (${total ? Math.round((covered / total) * 100) : 0}%)`,
);
if (gaps.length) {
  console.log(`\nKarşılığı olmayan (${gaps.length}) — ilk 25:`);
  gaps.slice(0, 25).forEach((g) => console.log("  " + g));
  console.log(
    gaps.length > 25
      ? "  …"
      : '\nİpucu: lang-en.js "text" bölümüne anahtar=TR metin, değer=EN karşılık olarak ekleyin.',
  );
}
