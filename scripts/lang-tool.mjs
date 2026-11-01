// Topluluk dili aracı (docs/TRANSLATING.md).
//   node scripts/lang-tool.mjs new <kod>     src/app/lang-<kod>.js iskeletini üretir (değerler boş)
//   node scripts/lang-tool.mjs check <kod>   dosyayı doğrular: yer tutucular, boş/fazla anahtar, kapsama %
// Çevirmen: yalnızca değerleri doldurur. Boş bırakılan metin uygulamada İngilizce görünür.
// Anahtarlar lang-en.js ile aynıdır (Türkçe kaynak metin ya da İngilizce kaynaklı metin);
// yanındaki "// EN:" yorumu, çevirinin kaynağı olan İngilizce karşılıktır.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.join(ROOT, "src", "app");
const CODE = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;
const SECTIONS = ["text", "html", "slots"];

function read(file, name) {
  const win = {};
  new Function("window", fs.readFileSync(file, "utf8"))(win);
  return win[name] || {};
}

// "{0}", "{name}" ve HTML etiketleri çeviride aynen korunmalı.
const tokens = (s) =>
  [...String(s).matchAll(/\{[^}\s]+\}|<\/?[a-z][^>]*>/gi)].map((m) => m[0]).sort().join("|");

export function checkLanguage(code, dir = APP) {
  const file = path.join(dir, `lang-${code}.js`);
  if (!fs.existsSync(file)) return { ok: false, problems: [`${file} yok`], total: 0, done: 0 };
  const en = read(path.join(APP, "lang-en.js"), "NEXUS_EN");
  const lang = read(file, "NEXUS_LANG");
  const problems = [];
  let total = 0;
  let done = 0;
  for (const sec of SECTIONS) {
    const src = en[sec] || {};
    const dst = lang[sec] || {};
    for (const k of Object.keys(dst)) if (!(k in src)) problems.push(`${sec}: sözlükte olmayan anahtar "${k}"`);
    for (const k of Object.keys(src)) {
      total++;
      const v = dst[k];
      if (typeof v !== "string" || !v.trim()) continue;
      done++;
      if (tokens(v) !== tokens(src[k])) problems.push(`${sec}: yer tutucu/etiket uyuşmuyor "${k}"`);
    }
  }
  return { ok: problems.length === 0, problems, total, done };
}

export function skeleton(code) {
  const en = read(path.join(APP, "lang-en.js"), "NEXUS_EN");
  const q = JSON.stringify;
  const out = [
    `/* NEXUS — ${code} language file. Fill in the values; leave a value "" to fall back to English. */`,
    `/* Keep {0}, {name} and HTML tags exactly as in the English reference. See docs/TRANSLATING.md. */`,
    `window.NEXUS_LANG = {`,
  ];
  for (const sec of SECTIONS) {
    out.push(`  ${sec}: {`);
    for (const [k, v] of Object.entries(en[sec] || {})) {
      out.push(`    ${q(k)}: "", // EN: ${String(v).replace(/\s+/g, " ")}`);
    }
    out.push(`  },`);
  }
  out.push(`};`, ``);
  return out.join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, code] = process.argv.slice(2);
  if (!CODE.test(code || "") || !["new", "check"].includes(cmd)) {
    console.error("Kullanım: node scripts/lang-tool.mjs new|check <kod>   (ör. de, pt-BR)");
    process.exit(2);
  }
  if (cmd === "new") {
    const file = path.join(APP, `lang-${code}.js`);
    if (fs.existsSync(file)) {
      console.error(`${file} zaten var; üzerine yazılmadı.`);
      process.exit(1);
    }
    fs.writeFileSync(file, skeleton(code), "utf8");
    console.log(`Oluşturuldu: src/app/lang-${code}.js — değerleri doldur, sonra: node scripts/lang-tool.mjs check ${code}`);
  } else {
    const r = checkLanguage(code);
    r.problems.slice(0, 40).forEach((p) => console.log("  ✗ " + p));
    console.log(`${code}: ${r.done}/${r.total} çevrildi (%${r.total ? Math.round((r.done / r.total) * 100) : 0}), ${r.problems.length} sorun`);
    process.exit(r.ok ? 0 : 1);
  }
}
