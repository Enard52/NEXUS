// Site içerik çevirisi denetleyicisi: scripts/site-content.<kod>.mjs dosyasını İngilizce kaynakla (site-content.en.mjs)
// karşılaştırır. Yapı (anahtarlar, dizi uzunlukları), bağlantılar, simge adları, sayılar ve fiyatlar korunmalı.
// Kullanım: node scripts/check-site-content.mjs <kod> [<kod> ...]   |   --all
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RELEASES_URL } from "./site-constants.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export function loadContentFile(file) {
  const code = fs.readFileSync(file, "utf8").replace(/^﻿/, "").replace(/^import[^\n]*\n/gm, "");
  return new Function("RELEASES_URL", `${code.replace(/export\s+const\s+\w+\s*=/, "return ")};`)(RELEASES_URL);
}

const KEEP_KEYS = new Set(["lang", "htmlLang", "canonical", "alternate"]);
const isFixed = (s) =>
  /^(#|javascript:|https?:|\/|mailto:)/.test(s) || /^[a-z0-9_-]+$/.test(s) || /^[\d\s.,%$₺€+\-–·/:]+$/.test(s) || s === "";

export function checkSiteContent(code) {
  const problems = [];
  const file = path.join(HERE, `site-content.${code}.mjs`);
  if (!fs.existsSync(file)) return { problems: [`${code}: dosya yok`], same: 0, total: 0 };
  let x;
  try {
    x = loadContentFile(file);
  } catch (e) {
    return { problems: [`${code}: dosya yüklenemedi (${e.message})`], same: 0, total: 0 };
  }
  const en = loadContentFile(path.join(HERE, "site-content.en.mjs"));
  let same = 0;
  let total = 0;
  (function walk(a, b, p) {
    if (Array.isArray(a)) {
      if (!Array.isArray(b)) return problems.push(`${code}: ${p} dizi olmalı`);
      if (a.length !== b.length) return problems.push(`${code}: ${p} uzunluk ${b.length} ≠ ${a.length}`);
      a.forEach((v, i) => walk(v, b[i], `${p}[${i}]`));
    } else if (a && typeof a === "object") {
      if (!b || typeof b !== "object" || Array.isArray(b)) return problems.push(`${code}: ${p} nesne olmalı`);
      for (const k of Object.keys(a)) {
        // lang/htmlLang/canonical/alternate üst düzeyde isteğe bağlı: getContent() bunları kendisi atar.
        if (!(k in b)) {
          if (p || !KEEP_KEYS.has(k)) problems.push(`${code}: ${p}.${k} eksik`);
        } else if (!KEEP_KEYS.has(k) || p) walk(a[k], b[k], p ? `${p}.${k}` : k);
      }
      for (const k of Object.keys(b)) if (!(k in a)) problems.push(`${code}: ${p}.${k} fazladan`);
    } else if (typeof a === "string") {
      if (typeof b !== "string") return problems.push(`${code}: ${p} metin olmalı`);
      // Bağlantılar (dil ön ekli yollar, Whop planları, iletişim formu konusu), fiyatlar ve dönem metinleri dile göre değişebilir.
      if (/\.(icon|id)$/.test(p)) {
        if (a !== b) problems.push(`${code}: ${p} değişmemeli ("${a}" ≠ "${b}")`);
      } else if (isFixed(a) || /\.(price|period)$/.test(p)) {
        if (a && !b.trim()) problems.push(`${code}: ${p} boş`);
      } else {
        total++;
        if (a === b) same++;
        if (!b.trim()) problems.push(`${code}: ${p} boş`);
      }
    } else if (a !== b) problems.push(`${code}: ${p} değişmemeli`);
  })(en, x, "");
  if ("lang" in x && x.lang !== code) problems.push(`${code}: lang "${code}" olmalı`);
  if ("htmlLang" in x && x.htmlLang !== code) problems.push(`${code}: htmlLang "${code}" olmalı`);
  if ("canonical" in x && x.canonical !== `/${code}/`) problems.push(`${code}: canonical "/${code}/" olmalı`);
  if (total && same / total > 0.35) problems.push(`${code}: metinlerin %${Math.round((100 * same) / total)}'i İngilizceyle aynı (çevrilmemiş)`);
  return { problems, same, total };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let codes = process.argv.slice(2);
  if (codes.includes("--all"))
    codes = fs
      .readdirSync(HERE)
      .map((f) => /^site-content\.([a-zA-Z0-9_-]+)\.mjs$/.exec(f)?.[1])
      .filter((c) => c && c !== "en" && c !== "tr");
  let bad = 0;
  for (const c of codes) {
    const r = checkSiteContent(c);
    console.log(r.problems.length ? `✗ ${c}\n  ${r.problems.slice(0, 12).join("\n  ")}` : `✓ ${c} (${r.total - r.same}/${r.total} çevrildi)`);
    bad += r.problems.length ? 1 : 0;
  }
  process.exit(bad ? 1 : 0);
}
