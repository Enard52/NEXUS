// Site yapısal doğrulaması (issue #2) — Playwright.
// Bölümler, fiyat doğruluğu (dile göre), tema geçişi, yatay taşma,
// CLS, görsel yükleme ve konsol hatalarını denetler.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "www", "public");
const PORT = 4835;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent((req.url || "/").split("?")[0]);
    if (p === "/" || p === "") p = "/index.html";
    const data = await readFile(join(ROOT, p.replace(/^\//, "")));
    res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("nf:" + req.url);
  }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const browser = await chromium.launch();
const results = [];
const check = (name, ok, detail) => {
  results.push(ok);
  console.log((ok ? "✓ " : "✗ ") + name + (detail ? " — " + detail : ""));
};

async function audit(url, opts, expectations, label) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...opts.ctx });
  if (opts.theme)
    await ctx.addInitScript((t) => localStorage.setItem("nx-site-theme", t), opts.theme);
  // Dil yönlendirmesini sayfanın kendi dilinde sabitle (TR sayfa EN'e bounce etmesin)
  await ctx.addInitScript((lang) => localStorage.setItem("nx-lang", lang), opts.lang || "en");
  const pg = await ctx.newPage();
  const errors = [];
  pg.on("pageerror", (e) => errors.push(String(e).slice(0, 120)));
  await pg.goto(`http://127.0.0.1:${PORT}${url}`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(500);

  const missing = [];
  for (const s of expectations.sections) if ((await pg.locator(s).count()) === 0) missing.push(s);
  check(
    label + ": bölümler mevcut",
    missing.length === 0,
    missing.length ? "EKSİK: " + missing.join(",") : expectations.sections.join(","),
  );
  const overflow = await pg.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check(label + ": yatay taşma yok", overflow <= 0, "fark: " + overflow + "px");
  check(label + ": konsol hatası yok", errors.length === 0, errors[0] || "");
  if (expectations.price) {
    const body = await pg.textContent("body");
    check(label + ": fiyat (" + expectations.price + ")", body.includes(expectations.price), "");
  }
  const imgs = await pg.evaluate(() =>
    [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src),
  );
  check(label + ": tüm görseller yüklü", imgs.length === 0, imgs.slice(0, 2).join(","));
  const cls = await pg.evaluate(() => {
    let c = 0;
    for (const e of performance.getEntriesByType("layout-shift"))
      if (!e.hadRecentInput) c += e.value;
    return c;
  });
  check(label + ": CLS < 0.05", cls < 0.05, cls.toFixed(3));
  await ctx.close();
  return { pg };
}

// EN ana sayfa
await audit(
  "/",
  {},
  {
    sections: [
      "#features",
      "#how",
      "#integrations",
      "#pricing",
      "#downloads",
      "#faq",
      "header.hd",
      "footer.ft",
    ],
    price: "$11.99",
  },
  "EN",
);

// TR sayfa
await audit(
  "/tr/index.html",
  { lang: "tr", ctx: { locale: "tr-TR" } },
  {
    sections: ["#features", "#pricing", "#downloads"],
    price: "₺499,99",
  },
  "TR",
);

// Tema geçişi
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => localStorage.setItem("nx-lang", "en"));
  const pg = await ctx.newPage();
  await pg.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  const before = await pg.evaluate(
    () =>
      getComputedStyle(document.body).backgroundImage +
      "|" +
      document.documentElement.getAttribute("data-theme"),
  );
  await pg.click(".theme-t");
  const after = await pg.evaluate(
    () =>
      getComputedStyle(document.body).backgroundImage +
      "|" +
      document.documentElement.getAttribute("data-theme"),
  );
  check(
    "tema geçişi çalışıyor",
    before !== after,
    before.split("|")[1] + " → " + after.split("|")[1],
  );
  // SSS akordeonu
  await pg.click("details.faq:nth-of-type(2) summary");
  await pg.waitForTimeout(250); // toggle olayı asenkron ateşlenir
  const open = await pg.evaluate(() => document.querySelectorAll("details.faq[open]").length);
  check("SSS tek-açıklık", open === 1, "açık: " + open);
  // hero ekran görüntüsü sekmeleri
  const tabs = await pg.locator("[data-shot-btn]").count();
  if (tabs) {
    await pg.click('[data-shot-btn="energy"]');
    const shown = await pg.evaluate(() => !document.querySelector('[data-shot="energy"]').hidden);
    check("ekran görüntüsü sekmeleri", shown, "sekmeler: " + tabs);
  } else check("ekran görüntüsü sekmeleri", true, "görsel yok (yapısal olarak sorun değil)");
  await ctx.close();
}

// light.html yönlendirme
{
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem("nx-lang", "en"));
  const pg = await ctx.newPage();
  await pg.goto(`http://127.0.0.1:${PORT}/light.html`, { waitUntil: "commit" });
  await pg.waitForTimeout(600);
  check("light.html → / yönlendirir", pg.url().endsWith("/"), pg.url());
  await ctx.close();
}

// Masaüstü genişlik kontrolü
{
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  await ctx.addInitScript(() => localStorage.setItem("nx-lang", "en"));
  const pg = await ctx.newPage();
  await pg.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  const navVisible = await pg.isVisible(".nav");
  check("masaüstü menü görünür", navVisible);
  const cards3 = await pg.evaluate(
    () =>
      getComputedStyle(document.querySelector(".grid.c3")).gridTemplateColumns.split(" ").length,
  );
  check("masaüstü 3 sütun grid", cards3 === 3, "sütun: " + cards3);
  await ctx.close();
}

await browser.close();
server.close();
const failed = results.filter((r) => !r).length;
console.log(failed ? `\n${failed} DENETİM BAŞARISIZ` : "\nSİTE DOĞRULAMASI GEÇTİ ✓");
process.exit(failed ? 1 : 0);
