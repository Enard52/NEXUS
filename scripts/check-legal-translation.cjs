// Yasal metin çevirisi denetleyicisi: scripts/legal-translations/<kod>.json dosyasını İngilizce kaynakla karşılaştırır.
// Yapı (bölüm / paragraf / madde sayısı), e-posta, rakam ve marka adları korunmalı; boş değer olmamalı.
// Kullanım: node scripts/check-legal-translation.cjs <kod> [<kod> ...]   |   --all
const fs = require("fs");
const path = require("path");
const { docs, EMAIL } = require("./legal-content.cjs");

const DIR = path.join(__dirname, "legal-translations");
const KEEP = ["NEXUS", "NEXUS+"]; // her belgede en az bir kez geçmesi gerekenler (kaynakta geçiyorsa)

function digits(s) {
  // Binlik ayırıcı biçimleri dile göre değişir (2,000 / 2.000 / 2000 / 2 000); yalnız rakam dizisi karşılaştırılır.
  return String(s).replace(/\D/g, "");
}

function flat(doc) {
  const out = [doc.title, doc.intro];
  for (const s of doc.sections) {
    out.push(s.h);
    for (const p of s.p || []) out.push(p);
    for (const li of s.ul || []) out.push(li);
  }
  return out;
}

function check(code) {
  const problems = [];
  const file = path.join(DIR, `${code}.json`);
  if (!fs.existsSync(file)) return [`${code}: dosya yok`];
  let j;
  try {
    j = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    return [`${code}: geçersiz JSON (${e.message})`];
  }
  if (j.code !== code) problems.push(`${code}: "code" alanı ${code} olmalı`);
  for (const k of ["updated"]) if (!j[k] || typeof j[k] !== "string") problems.push(`${code}: "${k}" eksik`);
  // notice isteğe bağlıdır (boş olabilir); diğerleri zorunlu.
  for (const k of ["updated", "operatedBy", "footer"])
    if (!j.labels || !j.labels[k]) problems.push(`${code}: labels.${k} eksik`);
  if (!j.labels || typeof j.labels.notice !== "string") problems.push(`${code}: labels.notice alanı (boş olabilir) eksik`);
  if (/Last updated/i.test(String(j.updated)) && code !== "en") problems.push(`${code}: "updated" çevrilmemiş`);
  for (const key of Object.keys(docs)) {
    const en = docs[key].en;
    const t = j.docs && j.docs[key];
    if (!t) {
      problems.push(`${code}: ${key} belgesi yok`);
      continue;
    }
    if (!t.title || !t.intro) problems.push(`${code}/${key}: title/intro boş`);
    if ((t.sections || []).length !== en.sections.length) {
      problems.push(`${code}/${key}: bölüm sayısı ${(t.sections || []).length} ≠ ${en.sections.length}`);
      continue;
    }
    en.sections.forEach((s, i) => {
      const x = t.sections[i];
      if (!x.h) problems.push(`${code}/${key}#${i}: başlık boş`);
      if ((s.p || []).length !== (x.p || []).length) problems.push(`${code}/${key}#${i}: paragraf sayısı farklı`);
      if ((s.ul || []).length !== (x.ul || []).length) problems.push(`${code}/${key}#${i}: madde sayısı farklı`);
      (s.p || []).forEach((p, n) => {
        if (!x.p || !x.p[n]) return problems.push(`${code}/${key}#${i}.p${n}: boş`);
        if (digits(p) !== digits(x.p[n]) && !/^[؀-ۿ]/.test(x.p[n]))
          problems.push(`${code}/${key}#${i}.p${n}: sayılar farklı (${digits(p)} ≠ ${digits(x.p[n])})`);
      });
      (s.ul || []).forEach((p, n) => {
        if (!x.ul || !x.ul[n]) return problems.push(`${code}/${key}#${i}.ul${n}: boş`);
      });
    });
    const src = flat(en).join("\n");
    const dst = flat(t).join("\n");
    if (src.includes(EMAIL) && !dst.includes(EMAIL)) problems.push(`${code}/${key}: e-posta ${EMAIL} korunmamış`);
    for (const w of KEEP) if (src.includes(w) && !dst.includes(w)) problems.push(`${code}/${key}: "${w}" korunmamış`);
    for (const w of ["Whop", "Supabase", "Google"])
      if (src.includes(w) && !dst.includes(w)) problems.push(`${code}/${key}: "${w}" korunmamış`);
  }
  return problems;
}

function main() {
  let codes = process.argv.slice(2);
  if (codes.includes("--all"))
    codes = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)) : [];
  let bad = 0;
  for (const c of codes) {
    const p = check(c);
    console.log(p.length ? `✗ ${c}\n  ` + p.join("\n  ") : `✓ ${c}`);
    bad += p.length ? 1 : 0;
  }
  process.exit(bad ? 1 : 0);
}

if (require.main === module) main();
module.exports = { check };
