// Yasal sayfaları (gizlilik, koşullar, iade) scripts/legal-content.cjs'den üretir. Idempotent.
// Kullanım:
//   node scripts/site-legal.cjs <siteDir> [pdfDir]
// siteDir: privacy.html, terms.html, tr/privacy.html ... içeren klasör (refund.html yoksa terms.html'den kopyalanır).
// pdfDir (isteğe bağlı): Whop için çift dilli (TR + EN) PDF'leri Microsoft Edge ile üretir.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { docs, UPDATED } = require("./legal-content.cjs");

const siteDir = process.argv[2];
const pdfDir = process.argv[3];
if (!siteDir) throw new Error("kullanım: node scripts/site-legal.cjs <siteDir> [pdfDir]");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const link = (s) =>
  esc(s).replace(/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,})/g, '<a href="mailto:$1">$1</a>');

function body(doc, lang) {
  const d = doc[lang];
  let h = `<h1>${esc(d.title)}</h1>\n<p class="legal-updated">${UPDATED[lang]}</p>\n<p>${link(d.intro)}</p>\n`;
  for (const s of d.sections) {
    h += `<h3>${esc(s.h)}</h3>\n`;
    for (const p of s.p || []) h += `<p>${link(p)}</p>\n`;
    if (s.ul) h += "<ul>\n" + s.ul.map((li) => `<li>${link(li)}</li>`).join("\n") + "\n</ul>\n";
  }
  return h;
}

const MAIN_RE = /<main class="legal-content main-content">[\s\S]*?<\/main>/;
let written = 0;
for (const key of Object.keys(docs)) {
  for (const lang of ["en", "tr"]) {
    const rel = lang === "tr" ? `tr/${key}.html` : `${key}.html`;
    const file = path.join(siteDir, rel);
    if (!fs.existsSync(file) && key === "refund") {
      const base = path.join(siteDir, lang === "tr" ? "tr/terms.html" : "terms.html");
      if (!fs.existsSync(base)) continue;
      fs.writeFileSync(file, fs.readFileSync(base, "utf8"));
    }
    const targets = [file];
    if (lang === "en") targets.push(path.join(siteDir, key, "index.html"));
    for (const t of targets) {
      if (!fs.existsSync(t)) continue;
      const html = fs.readFileSync(t, "utf8");
      if (!MAIN_RE.test(html)) {
        console.log("WARN main not found:", t);
        continue;
      }
      const next = html.replace(
        MAIN_RE,
        () => `<main class="legal-content main-content">\n${body(docs[key], lang)}</main>`,
      );
      if (next !== html) fs.writeFileSync(t, next);
      written++;
    }
  }
}
console.log("legal pages written:", written);

if (pdfDir) {
  fs.mkdirSync(pdfDir, { recursive: true });
  const edge = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].find((p) => fs.existsSync(p));
  if (!edge) throw new Error("Microsoft Edge bulunamadı; PDF üretilemedi");
  const names = {
    privacy: "NEXUS-Gizlilik-Politikasi",
    terms: "NEXUS-Hizmet-Sartlari",
    refund: "NEXUS-Iade-ve-Iptal-Politikasi",
  };
  const css =
    "body{font-family:'Segoe UI',Arial,sans-serif;font-size:11pt;line-height:1.5;color:#111;margin:0 8px}h1{font-size:20pt;margin:0 0 4px}h3{font-size:12.5pt;margin:16px 0 4px}p,li{margin:4px 0}.legal-updated{color:#555;font-size:10pt}.pb{page-break-before:always}a{color:#1a56db}";
  for (const key of Object.keys(docs)) {
    const html =
      `<!doctype html><html><head><meta charset="utf-8"><title>${esc(docs[key].tr.title)}</title><style>${css}</style></head><body>` +
      `<div lang="tr">${body(docs[key], "tr")}</div><div lang="en" class="pb">${body(docs[key], "en")}</div></body></html>`;
    const htmlPath = path.resolve(pdfDir, names[key] + ".html");
    const pdfPath = path.resolve(pdfDir, names[key] + ".pdf");
    fs.writeFileSync(htmlPath, html);
    execFileSync(
      edge,
      [
        "--headless=new",
        "--disable-gpu",
        "--user-data-dir=" + path.join(require("os").tmpdir(), "nexus-edge-pdf"),
        "--no-pdf-header-footer",
        `--print-to-pdf=${pdfPath}`,
        "file:///" + htmlPath.replace(/\\/g, "/"),
      ],
      { stdio: "ignore", timeout: 90000 },
    );
    console.log("pdf:", pdfPath, fs.statSync(pdfPath).size, "bytes");
  }
}
