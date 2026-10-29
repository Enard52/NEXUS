// B katmani: etkilesim turu — gorunur guvenli butonlara tiklar, hatalari toplar.
// Kullanim: node scripts\etkilesim-tara.mjs <acik|koyu>
import fs from "node:fs";

const BASE = "http://127.0.0.1:9222";
const TEMA = process.argv[2] || "acik";
const PAGES = [
  "nexus-home.html", "nexus-smart.html", "nexus-settings.html", "nexus-profile.html",
  "nexus-energy.html", "nexus-messages.html", "nexus-ai-protect.html", "nexus-sleep-prep.html",
  "nexus-device-updates.html", "nexus-household.html", "nexus-plus.html", "nexus-cards.html",
  "nexus-discover.html", "nexus-menu.html", "nexus-feedback.html",
];
const GUVELI = /sil|kaldır|delete|çıkış|oturum|hesabımı|ödeme|pay|abonelik.*iptal|iptal.*abonelik|fogot|reset/i;

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
await evalJs(`localStorage.setItem('nexusCurrentUser','test@nexus.test'); localStorage.setItem('nexusEverLoggedIn','1'); localStorage.setItem('nexusUserName','Test Kullanici'); localStorage.setItem('nexusLanguage','tr'); localStorage.setItem('nexusDarkMode','${TEMA === "koyu" ? "true" : "false"}'); localStorage.setItem('test@nexus.test_nexusDarkMode','${TEMA === "koyu" ? "true" : "false"}'); 'ok'`);

const FIND = `(() => {
  const out = [];
  for (const el of document.querySelectorAll('button, [role="switch"], [onclick]')) {
    const t = ((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '')).trim();
    if (!t || GUVELI.test(t)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 30 || r.height < 20) continue;
    if (r.top < 0 || r.bottom > innerHeight) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none') continue;
    out.push({ i: out.length, label: t.slice(0, 30) });
    el.setAttribute('data-fuzz-idx', String(out.length - 1));
  }
  return JSON.stringify(out.slice(0, 6));
})()`.replace(/GUVELI/g, "/" + GUVELI.source + "/" + GUVELI.flags);

let totalClicks = 0, errPages = 0;
for (const p of PAGES) {
  const ev0 = events.length;
  await send("Page.navigate", { url: "https://localhost/" + p });
  await sleep(1400);
  const cands = JSON.parse(await evalJs(FIND) || "[]");
  const errsHere = [];
  for (const c of cands) {
    const evc = events.length;
    await evalJs(`(function(){ var el = document.querySelector('[data-fuzz-idx="' + ${c.i} + '"]'); if (el) el.click(); return 'ok'; })()`);
    await sleep(700);
    // Sayfa degistiyse geri gel
    const now = (await evalJs("location.pathname.split('/').pop()")) || "";
    if (now !== p.replace(".html", "")) { await send("Page.navigate", { url: "https://localhost/" + p }); await sleep(1200); }
    const newErrs = events.slice(evc).filter((e) =>
      (e.method === "Runtime.exceptionThrown") ||
      (e.method === "Runtime.consoleAPICalled" && e.params.type === "error") ||
      (e.method === "Log.entryAdded" && e.params.entry && e.params.entry.level === "error"));
    for (const e of newErrs) {
      const txt = e.method === "Log.entryAdded" ? e.params.entry.text : e.method === "Runtime.exceptionThrown"
        ? (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || "exception") : "console.error";
      const clean = String(txt).slice(0, 110);
      if (clean && !/net::|Failed to connect|ERR_|navigator\.vibrate|hasn't tapped/i.test(clean)) errsHere.push(c.label + " -> " + clean);
    }
    totalClicks++;
  }
  if (errsHere.length) { errPages++; console.log("SORUN " + p); errsHere.slice(0, 4).forEach((e) => console.log("       " + e)); }
  else console.log("OK     " + p + " (" + cands.length + " tik)");
}
console.log("\nBITTI: " + totalClicks + " tik, " + errPages + " sayfada hata  [" + TEMA + "]");
ws.close();
