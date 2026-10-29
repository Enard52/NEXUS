// A katmani: tum sayfalarda otomatik duzen denetimi.
// Yatay tasma, kapali/zero-boyutlu butonlar, yuklenmeyen gorseller,
// render olmamis lucide ikonlari, supheli bos ekranlar.
import fs from "node:fs";

const BASE = "http://127.0.0.1:9222";
const listFile = process.argv[2];

const targets = await (await fetch(BASE + "/json/list")).json();
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
let idc = 0; const pending = new Map();
ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params) => new Promise((res) => { const id = ++idc; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function evalJs(expr) { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, silent: true }); return r.result?.result?.value; }

await send("Runtime.enable"); await send("Page.enable");
await evalJs(`localStorage.setItem('nexusCurrentUser','test@nexus.test'); localStorage.setItem('nexusEverLoggedIn','1'); localStorage.setItem('nexusUserName','Test Kullanici'); localStorage.setItem('nexusLanguage','tr'); 'ok'`);

const CHECK = `(() => {
  const out = {};
  const de = document.documentElement;
  out.hOverflow = Math.max(0, de.scrollWidth - de.clientWidth);
  out.badImgs = [...document.images].filter(i => i.src && i.naturalWidth === 0 && !i.src.startsWith('data:')).map(i => i.getAttribute('src')).slice(0, 4);
  const btns = [...document.querySelectorAll('button, [role="switch"], [onclick]')];
  out.tinyButtons = btns.filter(el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && (r.width > 0 ? (r.width < 16 || r.height < 16) : false); }).length;
  out.coveredButtons = btns.filter(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 24) return false;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) return false;
    const hit = document.elementFromPoint(cx, cy);
    return hit && !el.contains(hit) && !hit.contains(el);
  }).map(el => (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)).filter(Boolean).slice(0, 4);
  out.staleIcons = [...document.querySelectorAll('i[data-lucide]')].filter(el => el.textContent === '' && !el.closest('svg')).length;
  out.blankish = (document.body.innerText || '').trim().length < 40;
  return JSON.stringify(out);
})()`;

const pages = fs.readFileSync(listFile, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
const issues = [];
for (const p of pages) {
  await send("Page.navigate", { url: "https://localhost/" + p });
  await sleep(1400);
  const raw = await evalJs(CHECK);
  let o = {};
  try { o = JSON.parse(raw || "{}"); } catch (e) {}
  const flags = [];
  if (o.hOverflow > 2) flags.push("YATAY TASMA " + o.hOverflow + "px");
  if (o.badImgs?.length) flags.push("KIRIK GORSEL: " + o.badImgs.join(", "));
  if (o.tinyButtons > 0) flags.push(o.tinyButtons + " ufak buton");
  if (o.coveredButtons?.length) flags.push("KAPALI BUTON: " + o.coveredButtons.join(" | "));
  if (o.staleIcons > 2) flags.push(o.staleIcons + " render olmayan ikon");
  if (o.blankish) flags.push("BOS EKRAN?");
  if (flags.length) { issues.push(p + "  <<  " + flags.join(" ; ")); console.log(p + "  <<  " + flags.join(" ; ")); }
  else console.log(p + "  OK");
}
console.log("\nSorunlu sayfa: " + issues.length + "/" + pages.length);
ws.close();
