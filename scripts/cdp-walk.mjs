// CDP sayfa gezicisi: her sayfayı açar, console hatalarını toplar, görüntü kaydeder.
// Kullanım: node scripts/cdp-walk.mjs <sayfa-listesi.txt> <cikti-klasoru> [en|tr]
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:9222";
const listFile = process.argv[2];
const OUT = process.argv[3] || "C:/Users/MSI/AppData/Local/Temp/nexus-shots";
const LANG = process.argv[4] || "tr";
fs.mkdirSync(OUT, { recursive: true });

const targets = await (await fetch(BASE + "/json/list")).json();
const page = targets.find((t) => t.type === "page");
if (!page) { console.error("Sayfa hedefi yok"); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });

let idc = 0;
const pending = new Map();
const events = [];
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else if (msg.method) events.push(msg);
});
function send(method, params) {
  return new Promise((res) => { const id = ++idc; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function evalJs(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true, silent: true });
  return r.result?.result?.value;
}

await send("Runtime.enable");
await send("Page.enable");
await send("Log.enable");

// Test tohumu: auth bekçisini geç (test kimliği), dil ayarı
await evalJs(
  `try { localStorage.setItem('nexusCurrentUser','test@nexus.test');` +
  ` localStorage.setItem('nexusEverLoggedIn','1');` +
  ` localStorage.setItem('nexusUserName','Test Kullanici');` +
  ` localStorage.setItem('nexusLanguage','${LANG}'); 'ok'; } catch(e) { String(e); }`
);

const pages = fs.readFileSync(listFile, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
const report = [];
for (const p of pages) {
  const before = events.length;
  await send("Page.navigate", { url: "https://localhost/" + p });
  await sleep(1500);
  const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 55 });
  if (shot.result?.data) fs.writeFileSync(path.join(OUT, p.replace(/\.html$/, "") + ".jpg"), Buffer.from(shot.result.data, "base64"));
  const errs = events.slice(before).filter((e) =>
    e.method === "Runtime.exceptionThrown" ||
    (e.method === "Runtime.consoleAPICalled" && e.params.type === "error") ||
    (e.method === "Log.entryAdded" && e.params.entry && (e.params.entry.level === "error")));
  const errTexts = errs.map((e) => {
    if (e.method === "Log.entryAdded") return (e.params.entry.source || "?") + ": " + (e.params.entry.text || "") + " " + (e.params.entry.url || "") + (e.params.entry.lineNumber != null ? " @" + (e.params.entry.lineNumber + 1) : "");
    if (e.method === "Runtime.exceptionThrown") return e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || "exception";
    return (e.params.args || []).map((a) => {
      if (a.value !== undefined && a.value !== null) return String(a.value);
      if (a.description && a.description !== "Object") return a.description;
      if (a.preview?.properties) return a.preview.properties.map((p) => p.name + "=" + p.value).join(", ");
      return "[object]";
    }).join(" | ");
  }).slice(0, 4);
  const missingI18n = LANG === "en" ? await evalJs("window.__i18nMissing ? Object.keys(window.__i18nMissing).slice(0,10).join(' || ') : ''") : "";
  const landed = (await evalJs("location.pathname.split('/').pop()")) || "?";
  report.push({ page: p, landed, errors: errTexts, missingI18n });
  console.log(p + " -> " + landed + (errTexts.length ? "  [HATA:" + errTexts.length + "] " + errTexts[0].slice(0, 90) : "") + (missingI18n ? "  [i18n]" : ""));
}
fs.writeFileSync(path.join(OUT, "report-" + LANG + ".json"), JSON.stringify(report, null, 2));
console.log("TAMAM: " + pages.length + " sayfa -> " + OUT);
ws.close();
