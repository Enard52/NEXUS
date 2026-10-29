// EN modunda tum sayfalarda __i18nMissing sozlugu toplanir; benzersiz anahtarlar dosyaya yazilir.
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:9222";
const listFile = process.argv[2];
const OUT = process.argv[3];

const targets = await (await fetch(BASE + "/json/list")).json();
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
let idc = 0; const pending = new Map(); const events = [];
ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method) events.push(m); });
const send = (method, params) => new Promise((res) => { const id = ++idc; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function evalJs(expr) { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, silent: true }); return r.result?.result?.value; }

await send("Runtime.enable"); await send("Page.enable");
await evalJs(`localStorage.setItem('nexusCurrentUser','test@nexus.test'); localStorage.setItem('nexusEverLoggedIn','1'); localStorage.setItem('nexusUserName','Test Kullanici'); localStorage.setItem('nexusLanguage','en'); 'ok'`);

const pages = fs.readFileSync(listFile, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
const agg = {}; // key -> [sayfalar]
for (const p of pages) {
  await send("Page.navigate", { url: "https://localhost/" + p });
  await sleep(1300);
  const obj = await evalJs("window.__i18nMissing ? JSON.stringify(window.__i18nMissing) : '{}'");
  let map = {};
  try { map = JSON.parse(obj || "{}"); } catch (e) {}
  for (const k of Object.keys(map)) {
    if (!agg[k]) agg[k] = [];
    if (agg[k].length < 6 && !agg[k].includes(p)) agg[k].push(p);
  }
}
fs.writeFileSync(OUT, JSON.stringify(agg, null, 2), "utf8");
const keys = Object.keys(agg);
console.log("Benzersiz eksik anahtar: " + keys.length);
ws.close();
