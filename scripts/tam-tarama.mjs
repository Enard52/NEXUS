// TAM TARAMA: tum sayfalar, tek geciste tum kontroller.
// Kullanim: node scripts/tam-tarama.mjs <sayfalar.txt> <bos|cihazli> <acik|koyu>
// Cikti: konsol raporu + <OUT>/report-<mod>-<tema>.json + sorunlu sayfa goruntuleri.
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:9222";
const listFile = process.argv[2];
const MOD = process.argv[3] || "bos";
const TEMA = process.argv[4] || "acik";
const OUT = "C:/Users/MSI/AppData/Local/Temp/nexus-tam/" + MOD + "-" + TEMA;
fs.mkdirSync(OUT, { recursive: true });

const targets = await (await fetch(BASE + "/json/list")).json();
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
let idc = 0; const pending = new Map(); const events = [];
ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method) events.push(m); });
const send = (method, params) => new Promise((res) => { const id = ++idc; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function evalJs(expr) { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, silent: true }); return r.result?.result?.value; }

await send("Runtime.enable"); await send("Page.enable"); await send("Log.enable");

// Tohumlama (nexusGetItem kullanici onekli okur: test@nexus.test_* anahtari sart)
const CIHAZLAR = JSON.stringify([
  { name: "Salon Işığı", host: "192.168.1.45", protocol: "tplink", caps: ["brightness", "colorTemp", "switch"] },
  { name: "Akıllı TV", host: "192.168.1.50", protocol: "unknown", caps: ["media", "switch"] },
  { name: "Klima", host: "192.168.1.52", protocol: "unknown", caps: ["switch", "target", "sleep"] },
  { name: "Kapı Kilidi", host: "192.168.1.53", protocol: "unknown", caps: ["lock"] },
  { name: "Perde", host: "192.168.1.54", protocol: "unknown", caps: ["cover"] },
  { name: "Robot Süpürge", host: "192.168.1.55", protocol: "unknown", caps: ["vacuum"] },
  { name: "Hareket Sensörü", host: "192.168.1.56", protocol: "unknown", caps: ["motion"] },
  { name: "Kamera", host: "192.168.1.57", protocol: "unknown", caps: ["camera"] },
]);
const seed = [
  "localStorage.setItem('nexusCurrentUser','test@nexus.test')",
  "localStorage.setItem('nexusEverLoggedIn','1')",
  "localStorage.setItem('nexusUserName','Test Kullanici')",
  "localStorage.setItem('nexusLanguage','tr')",
  "localStorage.setItem('nexusDarkMode','" + (TEMA === "koyu" ? "true" : "false") + "')",
  "localStorage.setItem('test@nexus.test_nexusDarkMode','" + (TEMA === "koyu" ? "true" : "false") + "')",
  MOD === "cihazli"
    ? "localStorage.setItem('test@nexus.test_nexusPairedDevices', JSON.stringify(" + CIHAZLAR + "))"
    : "localStorage.removeItem('test@nexus.test_nexusPairedDevices')",
  "localStorage.removeItem('nexusMfaPending')",
  "'ok'"
].join("; ");
await evalJs(seed);

const CHECK = `(() => {
  const out = {}; const vw = innerWidth, vh = innerHeight;
  const de = document.documentElement;
  out.hOverflow = Math.max(0, de.scrollWidth - de.clientWidth);
  out.badImgs = [...document.images].filter(i => i.src && i.complete && i.naturalWidth === 0 && !i.src.startsWith('data:')).map(i => i.getAttribute('src')).slice(0, 3);
  const btns = [...document.querySelectorAll('a,button,[role="switch"],[onclick]')];
  out.tiny = btns.filter(el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 0 && (r.width < 16 || r.height < 16); }).length;
  out.covered = btns.filter(el => {
    const r = el.getBoundingClientRect(); if (r.width < 24 || r.height < 24) return false;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (cx < 0 || cy < 0 || cx > vw || cy > vh) return false;
    if (cy > vh - 130) return false; // sabit alt cubuk bolgesi: scroll'la acilir, hata sayma
    const hit = document.elementFromPoint(cx, cy);
    return hit && !el.contains(hit) && !hit.contains(el);
  }).map(el => (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 22)).filter(Boolean).slice(0, 3);
  out.staleIcons = [...document.querySelectorAll('i[data-lucide]')].filter(el => el.textContent === '' && !el.closest('svg') && el.offsetParent !== null).length;
  out.blankish = (document.body.innerText || '').trim().length < 40 && !document.querySelector('.nx-empty, [class*="empty"]');
  // Ikileme: ortada "cihaz ekle" uyarisi + alt bolgede aksiyon
  const notices = [], actions = [];
  for (const el of document.querySelectorAll('a,button,p,h1,h2,h3,span,div')) {
    if (el.children.length > 2) continue;
    if (el.closest('a,button,[onclick]')) continue;      // bir aksiyonun parcasıysa uyarı sayma
    if (el.querySelector('a,button,[onclick]')) continue; // icinde aksiyon varsa uyarı sayma
    const t = (el.textContent || '').trim();
    if (!t || t.length > 60) continue;
    const tl = t.toLowerCase();
    if (!tl.includes('cihaz ekle') && !tl.includes('cihaz eklemelisin') && !tl.includes('cihaz ekley')) continue;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
    if (r.width < 10 || r.height < 10 || r.bottom < 0 || r.top > vh) continue;
    notices.push(t.slice(0, 40));
  }
  for (const el of document.querySelectorAll('a,button,[onclick]')) {
    const t = ((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '')).trim();
    const tl = t.toLowerCase();
    if (!tl.includes('cihaz ekle')) continue;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
    if (r.width < 10 || r.height < 10 || r.top > vh) continue;
    if (r.top > vh * 0.6) actions.push(t.slice(0, 30));
  }
  if (notices.length && actions.length) out.ikileme = { notices: notices.slice(0, 2), actions: actions.slice(0, 2) };
  return JSON.stringify(out);
})()`;

const pages = fs.readFileSync(listFile, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
const report = [];
for (const p of pages) {
  const ev0 = events.length;
  await send("Page.navigate", { url: "https://localhost/" + p });
  await sleep(2200);
  const raw = await evalJs(CHECK);
  let o = {}; try { o = JSON.parse(raw || "{}"); } catch (e) {}
  const errs = events.slice(ev0).filter((e) =>
    e.method === "Runtime.exceptionThrown" ||
    (e.method === "Runtime.consoleAPICalled" && e.params.type === "error") ||
    (e.method === "Log.entryAdded" && e.params.entry && e.params.entry.level === "error"));
  const errTexts = errs.map((e) => {
    if (e.method === "Log.entryAdded") return (e.params.entry.text || "").slice(0, 110);
    if (e.method === "Runtime.exceptionThrown") return (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || "exception").slice(0, 110);
    return (e.params.args || []).map((a) => String(a.value ?? a.description ?? "[obj]")).join(" ").slice(0, 110);
  }).filter((t) => t && !/net::|Failed to connect|ERR_/i.test(t)).slice(0, 3);
  const flags = [];
  if (errTexts.length) flags.push("HATA: " + errTexts.join(" || "));
  if (o.hOverflow > 2) flags.push("YATAY TASMA " + o.hOverflow + "px");
  if (o.badImgs?.length) flags.push("KIRIK GORSEL " + o.badImgs.join(","));
  if (o.tiny > 0) flags.push(o.tiny + " ufak buton");
  if (o.covered?.length) flags.push("KAPALI: " + o.covered.join("|"));
  if (o.staleIcons > 2) flags.push(o.staleIcons + " ikon");
  if (o.blankish) flags.push("BOS");
  if (o.ikileme) flags.push("IKILEME: " + JSON.stringify(o.ikileme));
  const item = { page: p, flags };
  if (flags.length) {
    item.flags = flags;
    const s = await send("Page.captureScreenshot", { format: "jpeg", quality: 55 });
    if (s.result?.data) fs.writeFileSync(path.join(OUT, p.replace(/nexus-|\.html/g, "") + ".jpg"), Buffer.from(s.result.data, "base64"));
    console.log("SORUN  " + p + "\n       " + flags.join("\n       "));
  } else console.log("OK     " + p);
  report.push(item);
}
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
const bad = report.filter((r) => r.flags.length).length;
console.log("\nBITTI: " + (pages.length - bad) + " OK, " + bad + " sorunlu  [" + MOD + "/" + TEMA + "]  -> " + OUT);
ws.close();
