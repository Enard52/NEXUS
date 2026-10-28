// Ekran kabuğu tutarlılık ölçümü (issue #1)
// ------------------------------------------------------------
// Tüm stitch-*.html ekranlarını statik tarar ve kabuk metriklerini
// karşılaştırır: üst başlık dolgusu (pt/pb), alt menü varlığı, sayfa
// içerik sütunu (ortalı max-w-*), sayfa zemini imzası.
//
// Kullanım:
//   node scripts/measure-layout.mjs            → rapor (insan okur)
//   node scripts/measure-layout.mjs --check    → uyum ihlallerinde çıkış kodu 1 (CI)
//   node scripts/measure-layout.mjs --json     → ham JSON
//
// Standart (bkz. nexus-ui.css / nexus-desktop.css):
//   - Tüm ekranlarda başlık dikey dolgusu TEK ritimde olmalı
//     (pt-12 pb-4 = 48/16px; pt-14 CSS ile 48px'e indirilir).
//   - Alt menü (nav[data-purpose="bottom-nav"]) ana sekme ailesindedir;
//     diğer ekranlar aynı alt boşluğu (nav rezervi) bırakır.
//   - Sayfa içerik sütunu tek genişlik ailesinde olmalı (masaüstünde
//     nexus-desktop.css --page-max ile 1080px'e sabitlenir).

import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "src", "app");
const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const JSON_OUT = args.includes("--json");

// Tailwind 4px tabanlı dolgu sınıfları → piksel
const PAD = (n) => n * 4;
const padValue = (cls, prefix) => {
  const m = cls.match(new RegExp(`(?:^|\\s)${prefix}-(\\d+)(?:\\s|$)`));
  return m ? PAD(Number(m[1])) : null;
};
// pt/pb toplamı: py-N her ikisini de kapsar, pt-N/pb-N onu ezer
const effectivePad = (cls, side) => {
  const both = padValue(cls, "py");
  const one = padValue(cls, side);
  return one ?? both ?? null;
};

const pages = readdirSync(APP)
  .filter((f) => /^stitch-.*\.html$/.test(f))
  .sort();

const report = [];
for (const page of pages) {
  const html = readFileSync(join(APP, page), "utf8");
  // Statik kabuk ölçümü: satır içi betiklerden gelen şablon dizileri
  // (JS ile üretilen class'lar) harici tutulur — sayfanın kendi HTML'i ölçülür.
  const staticHtml = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");

  // İlk <header> etiketi (class özniteliğiyle)
  const headerMatch = staticHtml.match(/<header\b([^>]*)>/i);
  const headerCls = headerMatch ? (headerMatch[1].match(/class="([^"]*)"/) || [])[1] || "" : null;
  const headerPurpose = headerMatch
    ? (headerMatch[1].match(/data-purpose="([^"]*)"/) || [])[1] || ""
    : "";

  // header.pt-14 CSS ile 48px'e iner (nexus-ui.css) → etkin değeri hesapla.
  // Gövdenin kendi üst dolgusu (ör. Plus sayfası body p-6) başlığın gerçek
  // konumunu aşağı iter: etkin üst = gövde pt + başlık pt.
  let pt = headerCls ? effectivePad(headerCls, "pt") : null;
  let pb = headerCls ? effectivePad(headerCls, "pb") : null;
  if (headerCls && /(^|\s)pt-14(\s|$)/.test(headerCls)) pt = 48;
  const bodyPt = (() => {
    const bc = (staticHtml.match(/<body\b[^>]*class="([^"]*)"/i) || [])[1] || "";
    const p = effectivePad(bc, "p") ?? effectivePad(bc, "pt");
    return p ?? 0;
  })();
  if (pt !== null) pt += bodyPt;

  const hasBottomNav = /<nav\b[^>]*data-purpose="bottom-nav"/i.test(staticHtml);

  // Sayfa sütunu: mx-auto ile ortalanan max-w-* SAYFA DÜZEYİ sarmalayıcılar.
  // İç kart/alt-sayfa (bottom sheet, rounded kart) genişlikleri bu denetimin
  // dışıdır — sayfa geçişinde sütun genişliğini onlar değil sarmalayıcı belirler.
  // Sayfa kabuğu belirtisi: main etiketi veya sayfa-iskeleti sınıfları.
  const isPageShell = (tag, cls) =>
    tag === "main" || /min-h-screen|h-\[100dvh\]|h-full|flex\s+flex-col/.test(cls);
  const colWidths = [
    ...new Set(
      [
        ...staticHtml.matchAll(
          /<(main|div)\b[^>]*class="([^"]*\bmax-w-(xs|sm|md|lg|xl|2xl|\[[^\]]+\])\b[^"]*m[xy]-auto[^"]*)"/gi,
        ),
        ...staticHtml.matchAll(
          /<(main|div)\b[^>]*class="([^"]*\bm[xy]-auto[^"]*\bmax-w-(xs|sm|md|lg|xl|2xl|\[[^\]]+\])\b[^"]*)"/gi,
        ),
      ]
        .filter((m) => isPageShell(m[1], m[2]))
        .map((m) => m[2].match(/max-w-(xs|sm|md|lg|xl|2xl|\[[^\]]+\])/i)?.[1]),
    ),
  ].filter(Boolean);

  // Gövde zemin imzası (bg-* sınıf ailesi)
  const bodyCls = (staticHtml.match(/<body\b[^>]*class="([^"]*)"/i) || [])[1] || "";
  const bgSig = (bodyCls.match(/bg-[\w\[\]#./()-]+/g) || []).join(" ");

  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || "";

  report.push({
    page,
    title,
    header: headerCls
      ? { pt, pb, padSum: (pt ?? 0) + (pb ?? 0), purpose: headerPurpose, cls: headerCls.trim() }
      : null,
    bottomNav: hasBottomNav,
    contentColumns: colWidths,
    bg: bgSig,
  });
}

// ---- Standart denetimi ----
// Kabuk ritmi bilinçli olarak farklı olan ekran aileleri (tasarım kararı):
const HEADER_EXEMPT = {
  "stitch-map.html": "harita üstü yüzen başlık (tam ekran harita)",
  "stitch-cards.html": "picker-shell kabuğu dolguyu sağlar (İptal/Ekle çubuğu)",
  "stitch-onboarding.html": "ilk kurulum/auth akışı (kendi düzeni)",
  "stitch-register.html": "auth akışı (dikey ortalı)",
  "stitch-login.html": "auth akışı (dikey ortalı)",
  "stitch-forgot-password.html": "auth akışı (dikey ortalı)",
  "stitch-smart-app-detail.html": "main.pt-12 kabuğu ritmi sağlar",
  "stitch-menu.html": "main.pt-12 içinde nav başlık satırı",
  "stitch-profile.html": "main.pt-12 kabuğu (sekme ailesi)",
  "stitch-setup-code.html": "auth-bitişik kurulum akışı",
};
const isExempt = (page) => Object.prototype.hasOwnProperty.call(HEADER_EXEMPT, page);

const TAB_PAGES = report.filter((r) => r.bottomNav).map((r) => r.page);
const violations = [];

// 1) Başlık ritmi: header'lı ekranların etkin pt+pb dolgusu tek ailede mi?
const headerPads = new Map();
for (const r of report) {
  if (!r.header || isExempt(r.page)) continue;
  const key = `${r.header.pt}/${r.header.pb}`;
  if (!headerPads.has(key)) headerPads.set(key, []);
  headerPads.get(key).push(r.page);
}
const STANDARD_PAD = "48/16"; // pt-12 pb-4 (pt-14 normalize edilmiş)
for (const [key, pagesList] of headerPads) {
  if (key !== STANDARD_PAD) {
    violations.push(
      `BAŞLIK DOLGUSU ${key}px (standart ${STANDARD_PAD}px): ${pagesList.join(", ")}`,
    );
  }
}

// 2) Başlıksız ekranlar listelenir (bilgi; sekme ailesinde başlık zorunlu)
const noHeader = report.filter((r) => !r.header).map((r) => r.page);

// 3) Alt menü ailesi değişkenlere göre sabit kalmalı (yeni sekme eklenirse güncelle)
const EXPECTED_TABS = [
  "stitch-home.html",
  "stitch-smart.html",
  "stitch-discover.html",
  "stitch-profile.html",
];
const tabSet = new Set(TAB_PAGES);
for (const t of EXPECTED_TABS) {
  if (!tabSet.has(t)) violations.push(`ALT MENÜ EKSİK: ${t} ana sekme ama bottom-nav içermiyor`);
}
for (const t of TAB_PAGES) {
  if (!EXPECTED_TABS.includes(t))
    violations.push(`ALT MENÜ BEKLENMEDİK: ${t} bottom-nav içeriyor (standart dışı)`);
}

// 4) İçerik sütunu: mx-auto ortalı sayfa sütunları tek genişlik ailesinde mi?
const colUsage = new Map();
for (const r of report) {
  if (isExempt(r.page)) continue;
  for (const c of r.contentColumns) {
    if (!colUsage.has(c)) colUsage.set(c, []);
    colUsage.get(c).push(r.page);
  }
}
// Masaüstü penceresinde fark edilir olanlar: Tailwind sabit ölçekleri
const DESK_VISIBLE = ["xs", "sm", "md", "lg", "xl", "2xl"];
const usedFamilies = DESK_VISIBLE.filter((f) => colUsage.has(f));
if (usedFamilies.length > 1) {
  violations.push(
    `İÇERİK SÜTUNU ÇOK AİLE: ${usedFamilies.join(", ")} → ` +
      usedFamilies.map((f) => `${f}: ${colUsage.get(f).slice(0, 6).join(", ")}`).join(" | "),
  );
}

// ---- Çıktı ----
if (JSON_OUT) {
  console.log(JSON.stringify({ report, violations, tabPages: TAB_PAGES, noHeader }, null, 2));
} else {
  const w = Math.max(...report.map((r) => r.page.length)) + 2;
  console.log(`\nKABUK ÖLÇÜMÜ — ${report.length} ekran\n`);
  for (const r of report) {
    const h = r.header ? `pt/pb ${r.header.pt}/${r.header.pb}` : "başlık yok      ";
    console.log(
      `${r.page.padEnd(w)} ${h}  nav:${r.bottomNav ? "✔" : "✗"}  col:[${r.contentColumns.join(",") || "-"}]`,
    );
  }
  console.log(`\nAlt menülü ekranlar (${TAB_PAGES.length}): ${TAB_PAGES.join(", ")}`);
  console.log(`Başlıksız ekranlar (${noHeader.length}): ${noHeader.join(", ")}`);
  console.log(
    `\nSütun genişliği kullanımı:`,
    Object.fromEntries([...colUsage].map(([k, v]) => [k, v.length])),
  );

  if (violations.length) {
    console.log(`\nİHLALLER (${violations.length}):`);
    violations.forEach((v) => console.log("  ✗ " + v));
  } else {
    console.log("\nSTANDART UYUMLU ✓");
  }
}

if (CHECK && violations.length) process.exit(1);
