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
const dict = readFileSync(join(ROOT, "lang-en.js"), "utf8");
const DICT_TEXT = new Set();
{
  const m = dict.match(/"text":\s*\{([\s\S]*?)\n\s*\},/);
  if (m) for (const [, k] of m[1].matchAll(/"((?:[^"\\]|\\.)*)":\s*"/g)) DICT_TEXT.add(k);
}
const templ = (s) =>
  s
    .replace(/[+-]?\d+(?:[.,]\d+)*/g, "{0}")
    .replace(/\s+/g, " ")
    .trim();
const TR = /[çğıöşüÇĞİÖŞÜ]/;
const only = process.argv[2];

let total = 0,
  covered = 0;
const gaps = [];
for (const f of readdirSync(ROOT)
  .filter((x) => /^stitch-.*\.html$/.test(x))
  .sort()) {
  if (only && !f.includes(only)) continue;
  const html = readFileSync(join(ROOT, f), "utf8")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  for (const [, text] of html.matchAll(/>([^<>]{4,120})</g)) {
    const t = text.replace(/\s+/g, " ").trim();
    if (!t || !TR.test(t)) continue;
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
