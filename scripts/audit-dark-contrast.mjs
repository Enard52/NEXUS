// NEXUS — karanlık modda her ekranın metin/arka plan kontrastını WCAG AA'ya göre ölçer (issue #68).
// qa-ui-states.mjs ile aynı düzen: www/ yerel sunucudan, dış ağ kapalı. Gerçek hesaplanmış renkler
// okunur; arka plan görüntü/gradyan ise o öğe "ölçülemedi" sayılır (tahmin edilmez).
//   node scripts/audit-dark-contrast.mjs            → ihlalleri sınıf/renk bazında özetle
//   node scripts/audit-dark-contrast.mjs --strict   → ihlal varsa çıkış kodu 1
import http from "node:http";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WWW = join(ROOT, "www");
const STRICT = process.argv.includes("--strict");
const USER = "qa@nexus.local";
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".jpg": "image/jpeg", ".webp": "image/webp" };
const PUBLIC = /^nexus-(login|onboarding|register|forgot-password)\.html$/;

const server = http.createServer((req, res) => {
  const file = join(WWW, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(WWW) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});

// Sayfa içinde çalışır.
function measure() {
  const parse = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (top, bot) => {
    const a = top.a + bot.a * (1 - top.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    const f = (t, b) => (t * top.a + b * bot.a * (1 - top.a)) / a;
    return { r: f(top.r, bot.r), g: f(top.g, bot.g), b: f(top.b, bot.b), a };
  };
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  // Efektif arka plan: atalara doğru alfa birleştir; görüntü/gradyan görülürse null.
  const bgOf = (el) => {
    const stack = [];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return null;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) stack.push(c);
      if (c && c.a === 1) break;
    }
    let acc = { r: 15, g: 15, b: 20, a: 1 }; // tarayıcı dışı kök: koyu zemin varsayımı yapılmaz, body zaten boyalıdır
    const body = parse(getComputedStyle(document.body).backgroundColor);
    if (body && body.a > 0) acc = body.a === 1 ? body : over(body, { r: 255, g: 255, b: 255, a: 1 });
    for (let i = stack.length - 1; i >= 0; i--) acc = over(stack[i], acc);
    return acc;
  };
  const out = [];
  let unmeasured = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    if (!t.nodeValue.trim()) continue;
    const el = t.parentElement;
    if (!el || seen.has(el) || el.closest("script,style,noscript,[hidden],.hidden,svg")) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const fg = parse(cs.color);
    const bg = bgOf(el);
    if (!fg || !bg) { unmeasured++; continue; }
    const eff = over({ ...fg, a: fg.a * (Number(cs.opacity) || 1) }, bg);
    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    const cr = ratio(eff, bg);
    if (cr < need) out.push({ cls: (el.className && el.className.toString().slice(0, 60)) || el.tagName.toLowerCase(), fg: hex(eff), bg: hex(bg), cr: Math.round(cr * 100) / 100, need, text: el.textContent.trim().slice(0, 30) });
  }
  return { out, unmeasured };
}

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const pages = readdirSync(WWW).filter((f) => /^nexus-.*\.html$/.test(f) && !PUBLIC.test(f));
const browser = await chromium.launch();
const groups = new Map();
let unmeasuredTotal = 0;
for (const page of pages) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 900 }, colorScheme: "dark" });
  await ctx.addInitScript(({ user }) => {
    try {
      localStorage.setItem("nexusCurrentUser", user);
      localStorage.setItem(user + "_nexusUserEmail", user);
      localStorage.setItem(user + "_nexusUserName", "QA");
      localStorage.setItem(user + "_nexusNotifSetupDone", "1");
      localStorage.setItem("nexusDarkMode", "true");
      localStorage.setItem(user + "_nexusDarkMode", "true");
    } catch (e) {}
  }, { user: USER });
  await ctx.route(new RegExp(`^https?://(?!127\\.0\\.0\\.1:${port}).*`), (r) => r.abort());
  const p = await ctx.newPage();
  try {
    await p.goto(`http://127.0.0.1:${port}/${page}`, { timeout: 15000 });
    await p.waitForTimeout(500);
    if (!/\/nexus-(login|onboarding|register)/.test(p.url()) && (await p.evaluate(() => document.documentElement.classList.contains("dark")))) {
      const { out, unmeasured } = await p.evaluate(measure);
      unmeasuredTotal += unmeasured;
      for (const v of out) {
        const key = `${v.fg} on ${v.bg}`;
        const g = groups.get(key) || { cr: v.cr, need: v.need, count: 0, pages: new Set(), classes: new Set(), sample: v.text };
        g.count++;
        g.pages.add(page);
        g.classes.add(v.cls);
        groups.set(key, g);
      }
    } else {
      console.log("karanlık mod uygulanmadı / yönlendirildi:", page);
    }
  } catch (e) {
    console.log("açılmadı:", page, String(e.message).slice(0, 60));
  }
  await ctx.close();
}
await browser.close();
server.close();

const rows = [...groups.entries()].sort((a, b) => b[1].count - a[1].count);
for (const [key, g] of rows) {
  console.log(`${key}  oran ${g.cr} < ${g.need}  ×${g.count}  ${g.pages.size} ekran  örn: "${g.sample}"  sınıf: ${[...g.classes].slice(0, 3).join(" | ")}`);
}
console.log(`${pages.length} ekran tarandı. İhlal grubu: ${rows.length}, ölçülemeyen (gradyan/görüntü): ${unmeasuredTotal}.`);
if (STRICT && rows.length) process.exit(1);
