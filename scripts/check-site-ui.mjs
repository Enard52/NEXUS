// Site arayüz metni sözlüğü denetleyicisi: scripts/site-ui/<kod>.json dosyasını site-build.mjs içindeki
// tx()/nxU() anahtarlarıyla karşılaştırır. Her anahtar çevrilmiş olmalı; yer tutucular ({0}, {1}) korunmalı;
// metinde tırnak, ters bölü, < > ve ters tırnak olmamalı (sayfaya ve betiğe olduğu gibi yerleştirilir).
// Kullanım: node scripts/check-site-ui.mjs <kod> [<kod> ...]   |   --all   |   --keys (anahtar listesini yazar)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractKeys, UI_DIR } from "./site-ui.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const holes = (s) => (String(s).match(/\{\d\}/g) || []).sort().join("");

export function allKeys() {
  const k = extractKeys();
  return [...new Set([...k.server, ...k.client])].sort();
}

export function checkSiteUi(code) {
  const problems = [];
  const file = path.join(UI_DIR, `${code}.json`);
  if (!fs.existsSync(file)) return { problems: [`${code}: dosya yok`], same: 0, total: 0 };
  let d;
  try {
    d = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch (e) {
    return { problems: [`${code}: geçersiz JSON (${e.message})`], same: 0, total: 0 };
  }
  const keys = allKeys();
  let same = 0;
  for (const k of keys) {
    const v = d[k];
    if (typeof v !== "string" || !v.trim()) {
      problems.push(`${code}: eksik "${k}"`);
      continue;
    }
    if (/['"\\<>`]|\$\{/.test(v)) problems.push(`${code}: yasaklı karakter "${k}"`);
    if (holes(v) !== holes(k)) problems.push(`${code}: yer tutucu uyuşmuyor "${k}"`);
    if (/^\s/.test(k) !== /^\s/.test(v) || /\s$/.test(k) !== /\s$/.test(v)) problems.push(`${code}: baştaki/sondaki boşluk korunmalı "${k}"`);
    if (/^\//.test(k) &&!/^\//.test(v)) problems.push(`${code}: "/" ile başlamalı "${k}"`);
    if (v === k && /[A-Za-z]{4,}/.test(v)) same++;
  }
  for (const k of Object.keys(d)) if (!keys.includes(k)) problems.push(`${code}: kodda olmayan anahtar "${k}"`);
  if (same / keys.length > 0.4) problems.push(`${code}: metinlerin %${Math.round((100 * same) / keys.length)}'i İngilizceyle aynı`);
  return { problems, same, total: keys.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes("--keys")) {
    console.log(JSON.stringify(allKeys(), null, 1));
    process.exit(0);
  }
  let codes = args;
  if (args.includes("--all"))
    codes = fs.existsSync(UI_DIR)
      ? fs.readdirSync(UI_DIR).filter((f) => /\.json$/.test(f) && !f.startsWith("_")).map((f) => f.slice(0, -5))
      : [];
  let bad = 0;
  for (const c of codes) {
    const r = checkSiteUi(c);
    console.log(r.problems.length ? `✗ ${c}\n  ${r.problems.slice(0, 12).join("\n  ")}` : `✓ ${c} (${r.total - r.same}/${r.total} farklı)`);
    bad += r.problems.length ? 1 : 0;
  }
  process.exit(bad ? 1 : 0);
}
