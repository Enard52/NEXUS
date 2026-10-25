// Yasal PDF üretici (TR + EN) — issue kapsamı: kullanıcı talebi (25 Ekim 2026)
// ------------------------------------------------------------------------
// scripts/legal-content.cjs içindeki iki dilli içerikten hem HTML hem PDF üretir.
// PDF: Playwright/Chromium print-to-pdf (A4). Çıktılar legal-pdf/ altına:
//   NEXUS-Gizlilik-Politikasi.{html,pdf}      NEXUS-Privacy-Policy.{html,pdf}
//   NEXUS-Hizmet-Sartlari.{html,pdf}          NEXUS-Terms-of-Service.{html,pdf}
//   NEXUS-Iade-ve-Iptal-Politikasi.{html,pdf} NEXUS-Refund-Policy.{html,pdf}
// Kullanım: node scripts/legal-pdf.mjs

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
const _mod = await import("../scripts/legal-content.cjs");
const { EMAIL, UPDATED, docs } = _mod.default || _mod;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "legal-pdf");
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const TITLES = {
  privacy: { tr: "Gizlilik Politikası", en: "Privacy Policy" },
  terms: { tr: "Hizmet Şartları", en: "Terms of Service" },
  refund: { tr: "İade ve İptal Politikası", en: "Refund and Cancellation Policy" },
};
const FILENAMES = {
  privacy: { tr: "NEXUS-Gizlilik-Politikasi", en: "NEXUS-Privacy-Policy" },
  terms: { tr: "NEXUS-Hizmet-Sartlari", en: "NEXUS-Terms-of-Service" },
  refund: { tr: "NEXUS-Iade-ve-Iptal-Politikasi", en: "NEXUS-Refund-Policy" },
};

function renderHtml(docKey, lang) {
  const doc = docs[docKey][lang];
  const t = TITLES[docKey][lang];
  const updated = new Date(UPDATED).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const sec = (s) => `
    <section>
      <h2>${esc(s.h)}</h2>
      ${s.p ? s.p.map((p) => `<p>${esc(p)}</p>`).join("") : ""}
      ${s.ul ? `<ul>${s.ul.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>` : ""}
    </section>`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8"/>
<title>${esc(t)} — NEXUS</title>
<style>
  @page { size: A4; margin: 22mm 18mm; }
  body { font: 11pt/1.65 Inter, -apple-system, "Segoe UI", Roboto, sans-serif; color: #0F172A; margin: 0; }
  .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
  .brand svg { width: 34px; height: 34px; }
  .brand b { font-size: 20px; letter-spacing: -.02em; }
  h1 { font-size: 21px; margin: 14px 0 4px; letter-spacing: -.01em; }
  .meta { color: #64748B; font-size: 9.5pt; margin: 0 0 18px; }
  h2 { font-size: 13pt; margin: 18px 0 6px; }
  p, li { font-size: 10.5pt; margin: 6px 0; }
  ul { padding-left: 18px; margin: 6px 0; }
  footer { margin-top: 26px; padding-top: 10px; border-top: 1px solid #E2E8F0; color: #64748B; font-size: 9pt; }
</style>
</head>
<body>
  <div class="brand">
    <svg viewBox="0 0 32 32" fill="none"><defs><linearGradient id="g" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse"><stop stop-color="#6f9bff"/><stop offset=".55" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b7bff"/></linearGradient></defs><rect x="1" y="1" width="30" height="30" rx="9" fill="url(#g)"/><path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <b>NEXUS</b>
  </div>
  <h1>${esc(t)}</h1>
  <p class="meta">${lang === "tr" ? "Son güncelleme" : "Last updated"}: ${esc(updated)} · ${lang === "tr" ? "İşleten" : "Operated by"}: NEXUS · ${esc(EMAIL)}</p>
  <p>${esc(doc.intro)}</p>
  ${doc.sections.map(sec).join("")}
  <footer>NEXUS · ${esc(EMAIL)} · ${lang === "tr" ? "Bu belge nexus-smarthome.pages.dev adresindeki yürürlükteki metinle birlikte okunur." : "This document is read together with the current text at nexus-smarthome.pages.dev."}</footer>
</body>
</html>`;
}

const browser = await chromium.launch();
for (const docKey of Object.keys(docs)) {
  for (const lang of ["en"]) { // Whop: yalnızca İngilizce belgeler
    const html = renderHtml(docKey, lang);
    const base = FILENAMES[docKey][lang];
    const htmlPath = join(OUT, base + ".html");
    writeFileSync(htmlPath, html);
    const page = await browser.newPage();
    await page.goto("file:///" + htmlPath.replace(/\\/g, "/"), { waitUntil: "load" });
    await page.pdf({ path: join(OUT, base + ".pdf"), format: "A4", printBackground: true });
    await page.close();
    console.log("✓", base + ".pdf");
  }
}
await browser.close();
console.log("Tamam:", OUT);
