// NEXUS — tablet / yatay ekran denetimi (issue #84). Ekranları tablet ve yatay telefon boyutlarında,
// dokunmatik cihaz olarak açar ve ölçer: yatay taşma, ekran dışına taşan sabit öğeler (alt menü vb.),
// görünür alanın dışında kalan içerik. qa-ui-states.mjs ile aynı düzen: www/ yerel sunucudan, dış ağ kapalı.
//   node scripts/audit-tablet-layout.mjs            → profil bazında özetle
//   node scripts/audit-tablet-layout.mjs --strict   → ihlal varsa çıkış kodu 1
//   node scripts/audit-tablet-layout.mjs --list     → ihlalli ekranları tek tek yaz
import http from "node:http";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WWW = join(ROOT, "www");
const STRICT = process.argv.includes("--strict");
const LIST = process.argv.includes("--list");
const USER = "qa@nexus.local";
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};
const PUBLIC = /^nexus-(login|onboarding|register|forgot-password)\.html$/;
const PROFILES = {
  "tablet-dikey 768x1024": { width: 768, height: 1024 },
  "tablet-yatay 1024x768": { width: 1024, height: 768 },
  "telefon-yatay 844x390": { width: 844, height: 390 },
};
const DEVICE = {
  name: "Salon Prizi",
  room: "Salon",
  host: "http://192.168.1.50",
  protocol: "shelly",
  caps: ["switch"],
  state: { switch: true },
};

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
  const out = [];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const de = document.documentElement;
  if (de.scrollWidth > vw + 1) out.push("yatay-tasma|" + de.scrollWidth + ">" + vw);
  // Sabit konumlu görünür öğeler (alt menü, üst şerit) ekranın dışına taşmamalı.
  document.querySelectorAll("body *").forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.position !== "fixed" || cs.display === "none" || cs.visibility === "hidden") return;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    if (r.right < 0 || r.left > vw || r.bottom < 0 || r.top > vh) return; // bilinçli gizli (ekran dışı kaydırılmış)
    if (r.right > vw + 1 || r.left < -1)
      out.push(
        "sabit-yatay|" +
          (el.id ||
            el.tagName.toLowerCase() +
              "." +
              String(el.className).split(/\s+/).slice(0, 2).join(".")),
      );
    else if (r.height > vh + 1 && cs.overflowY === "visible")
      out.push(
        "sabit-yuksek|" +
          (el.id || el.tagName.toLowerCase()) +
          " " +
          Math.round(r.height) +
          ">" +
          vh,
      );
  });
  // >= 1024 px genişlikte iki bölmeli (yan menülü) düzen açık olmalı (#84).
  if (vw >= 1024 && !de.classList.contains("nx-desk"))
    out.push("iki-bolme-yok|" + vw + "px, html.nx-desk yok");
  // Alçak (yatay telefon) ekranda alt menü görünür yüksekliğin %15'inden fazlasını yememeli.
  const nav = document.querySelector('nav[data-purpose="bottom-nav"]');
  if (nav && vh < 500) {
    const nr = nav.getBoundingClientRect();
    if (nr.height > 0 && nr.height / vh > 0.15)
      out.push("alt-menu-yuksek|" + Math.round(nr.height) + "/" + vh + "px");
  }
  // Normal akışta sağa taşan geniş öğeler (kaydırma kabı içinde olmayanlar).
  let n = 0;
  new Set(document.querySelectorAll("main *, body > *")).forEach((el) => {
    if (n >= 3) return;
    const cs = getComputedStyle(el);
    if (cs.position === "fixed" || cs.display === "none" || cs.visibility === "hidden") return;
    if (/sr-only/.test(String(el.className)) || cs.clip !== "auto" || cs.clipPath !== "none")
      return; // yalnızca ekran okuyucuya
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.right <= vw + 1) return;
    for (let p = el.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === "auto" || o === "scroll" || o === "hidden") return;
    }
    n++;
    out.push(
      "tasan-oge|" +
        el.tagName.toLowerCase() +
        "." +
        String(el.className).split(/\s+/).slice(0, 3).join(".") +
        " sağ=" +
        Math.round(r.right),
    );
  });
  return out;
}

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const pages = readdirSync(WWW).filter((f) => /^nexus-.*\.html$/.test(f) && !PUBLIC.test(f));
const browser = await chromium.launch();
const rows = [];
for (const [profile, vp] of Object.entries(PROFILES)) {
  for (const [state, devices] of [
    ["yeni-kullanici", []],
    ["bir-cihaz", [DEVICE]],
  ]) {
    const ctx = await browser.newContext({ viewport: vp, isMobile: true, hasTouch: true });
    await ctx.addInitScript(
      ({ user, devices }) => {
        try {
          localStorage.setItem("nexusCurrentUser", user);
          localStorage.setItem(user + "_nexusUserEmail", user);
          localStorage.setItem(user + "_nexusUserName", "QA");
          localStorage.setItem(user + "_nexusNotifSetupDone", "1");
          if (devices.length)
            localStorage.setItem(user + "_nexusPairedDevices", JSON.stringify(devices));
        } catch (e) {}
      },
      { user: USER, devices },
    );
    await ctx.route(new RegExp(`^https?://(?!127\\.0\\.0\\.1:${port}).*`), (r) => r.abort());
    for (const page of pages) {
      const p = await ctx.newPage();
      try {
        await p.goto(`http://127.0.0.1:${port}/${page}`, { timeout: 10000 });
        await p.waitForTimeout(500);
        if (!/\/nexus-(login|onboarding|register)/.test(p.url())) {
          for (const item of await p.evaluate(measure)) rows.push({ profile, state, page, item });
        }
      } catch (e) {
        rows.push({ profile, state, page, item: "acilmadi|" + String(e.message).slice(0, 60) });
      }
      await p.close();
    }
    await ctx.close();
  }
}
await browser.close();
server.close();

console.log(`${pages.length} ekran × ${Object.keys(PROFILES).length} profil × 2 durum tarandı.`);
for (const profile of Object.keys(PROFILES)) {
  const mine = rows.filter((r) => r.profile === profile);
  const overflowPages = new Set(
    mine.filter((r) => r.item.startsWith("yatay-tasma")).map((r) => r.page),
  );
  console.log(`${profile}: ${mine.length} bulgu, yatay taşan ekran: ${overflowPages.size}`);
}
if (LIST || rows.length <= 40)
  for (const r of rows) console.log(`  ${r.profile} | ${r.state} | ${r.page} | ${r.item}`);
if (STRICT && rows.length) process.exit(1);
