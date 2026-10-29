// i18n kapsama raporu (issue #32 kararı: mevcut sözlük mimarisi kalıyor)
// -------------------------------------------------------------------------
// Ekranlardaki statik Türkçe metinleri lang-en.js sözlüğüyle karşılaştırır
// ve İngilizce karşılığı olmayanları raporlar. BAŞARISIZLIK üretmez —
// kılavuzdur: yeni metin eklerken sözlüğü güncellemeyi hatırlatır.
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
{
  const m = dict.match(/"text":\s*\{([\s\S]*?)\n\s*\},/);
  // Yakalanan anahtar ham metindir: "A \"B\" C" içindeki ters bölüler AYNI KALIR.
  // Çözümlemeden karşılaştırırsak tırnak içeren her anahtar yanlışça "eksik çeviri" sayılır.
  const unesc = (k) => { try { return JSON.parse('"' + k + '"'); } catch { return k; } };
  if (m) for (const [, k] of m[1].matchAll(/"((?:[^"\\]|\\.)*)":\s*"/g)) { DICT_TEXT.add(k); DICT_TEXT.add(unesc(k)); }
}
{
  // "slots" anahtarları satır içi vurgulu (<strong>/<b>) cümlelerdir. Çalışma zamanı cümleyi
  // {0} yer tutucusundan böler; bu yüzden parçaların kendisi de "çevrilmiş" sayılmalı,
  // aksi halde kapsama raporu doğru anahtarları eksik gösterir.
  const m = dict.match(/"slots":\s*\{([\s\S]*?)\n\},/);
  const unesc = (k) => { try { return JSON.parse('"' + k + '"'); } catch { return k; } };
  if (m)
    for (const [, k] of m[1].matchAll(/"((?:[^"\\]|\\.)*)":\s*"/g))
      for (const frag of unesc(k).split(/\{\d+\}/)) {
        const t = frag.replace(/\s+/g, " ").trim();
        if (t) DICT_TEXT.add(t);
      }
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
