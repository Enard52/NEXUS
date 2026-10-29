// Hesap Guvenligi sayfasini ac, TR ekran goruntusu + koyu tema orneklerini al.
import fs from "node:fs";

const BASE = "http://127.0.0.1:9222";
const OUT = "C:/Users/MSI/AppData/Local/Temp/nexus-final";
fs.mkdirSync(OUT, { recursive: true });

const targets = await (await fetch(BASE + "/json/list")).json();
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
let idc = 0; const pending = new Map();
ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params) => new Promise((res) => { const id = ++idc; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function evalJs(expr) { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, silent: true }); return r.result?.result?.value; }
async function shot(name) {
  const s = await send("Page.captureScreenshot", { format: "jpeg", quality: 60 });
  if (s.result?.data) fs.writeFileSync(OUT + "/" + name + ".jpg", Buffer.from(s.result.data, "base64"));
  console.log(name + " alindi");
}
await send("Runtime.enable"); await send("Page.enable");

await evalJs(`localStorage.setItem('nexusCurrentUser','test@nexus.test'); localStorage.setItem('nexusEverLoggedIn','1'); localStorage.setItem('nexusUserName','Test Kullanici'); localStorage.setItem('nexusLanguage','tr'); 'ok'`);
await send("Page.navigate", { url: "https://localhost/nexus-account-security.html" });
await sleep(1600);
await shot("hesap-guvenlik-tr");

// Koyu tema ornegi: html.dark ekleyip ana sayfa + smart
await evalJs(`document.documentElement.classList.add('dark'); 'ok'`);
await send("Page.navigate", { url: "https://localhost/nexus-home.html" });
await sleep(1600);
await evalJs(`document.documentElement.classList.add('dark'); 'ok'`);
await shot("home-koyu");
await send("Page.navigate", { url: "https://localhost/nexus-smart.html" });
await sleep(1500);
await evalJs(`document.documentElement.classList.add('dark'); 'ok'`);
await shot("smart-koyu");
ws.close();
console.log("TAMAM");
