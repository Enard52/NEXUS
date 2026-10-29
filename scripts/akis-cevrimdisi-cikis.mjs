// Cevrimdisi davranis + cikis akisi testi.
import fs from "node:fs";
const OUT = "C:/Users/MSI/AppData/Local/Temp/nexus-akis";
const adb = "C:/Users/MSI/AppData/Local/Packages/AnthropicPBC.Claude_fnn82j28hfe8t/LocalCache/Local/Android/Sdk/platform-tools/adb.exe";
const { execSync } = await import("node:child_process");
function adbSync(cmd) { try { return execSync('"' + adb + '" ' + cmd, { encoding: "utf8" }); } catch (e) { return "ERR"; } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  const pid = adbSync("-s emulator-5554 shell pidof com.nexus.app").trim();
  adbSync("-s emulator-5554 forward --remove tcp:9222");
  adbSync("-s emulator-5554 forward tcp:9222 localabstract:webview_devtools_remote_" + pid);
  await sleep(800);
  const targets = await (await fetch("http://127.0.0.1:9222/json/list")).json();
  const t = targets.find((x) => x.type === "page");
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
  let idc = 0; const pending = new Map(); const events = [];
  ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method) events.push(m); });
  const send = (method, params) => new Promise((res) => { const id = ++idc; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  const evalJs = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, silent: true }); return r.result?.result?.value; };
  return { ws, send, evalJs, events };
}

// --- CEVRIMDISI ---
console.log("== CEVRIMDISI ==");
adbSync("-s emulator-5554 shell cmd connectivity airplane-mode enable");
await sleep(3000);
const c = await connect();
await c.send("Page.enable"); await c.send("Runtime.enable");
const ev0 = c.events.length;
await c.evalJs(`location.href='nexus-home.html'; 'ok'`);
await sleep(2500);
const nav = await c.evalJs(`(function(){
  var online = navigator.onLine;
  var cards = document.querySelectorAll('#dynamic-devices-grid > *').length;
  return 'onLine=' + online + ' cihazKarti=' + cards + ' render=' + (document.body.innerText.length > 200 ? 'tam' : 'eksik');
})()`);
console.log("  cevrimdisi durum: " + nav);
const offlineErrors = c.events.slice(ev0).filter((e) => e.method === "Runtime.exceptionThrown").length;
await (async () => { const s = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 60 }); if (s.result?.data) fs.writeFileSync(OUT + "/cevrimdisi.jpg", Buffer.from(s.result.data, "base64")); })();
console.log("  cevrimdisi JS istisnasi: " + offlineErrors + " (beklenen: senaryo komutlari sessizce basarisiz, sayfa calisir)");
adbSync("-s emulator-5554 shell cmd connectivity airplane-mode disable");
await sleep(4000);
const back = await c.evalJs(`'onLine=' + navigator.onLine`);
console.log("  tekrar cevrimici: " + back);
c.ws.close();

// --- CIKIS AKISI ---
console.log("== CIKIS AKISI ==");
const c2 = await connect();
await c2.send("Page.enable"); await c2.send("Runtime.enable");
await c2.evalJs(`location.href='nexus-profile.html'; 'ok'`);
await sleep(1800);
const logoutBtn = await c2.evalJs(`(function(){
  var els = document.querySelectorAll('a,button,[onclick]');
  for (var i = 0; i < els.length; i++) {
    var t = (els[i].textContent || '').toLowerCase();
    if (t.indexOf('çıkış yap') !== -1 || t.indexOf('cikis yap') !== -1 || t === 'çıkış' ) return i + ':' + t.trim().slice(0, 20);
  }
  return 'bulunamadi';
})()`);
console.log("  cikis butonu: " + logoutBtn);
if (logoutBtn !== 'bulunamadi') {
  const idx = Number(String(logoutBtn).split(':')[0]);
  await c2.evalJs(`document.querySelectorAll('a,button,[onclick])[${idx}] ? 'yok' : 'yok'`);
  // Indeks ile guvenli tiklama
  await c2.evalJs(`(function(){ var els = document.querySelectorAll('a,button,[onclick]'); var el = els[${idx}]; if (el) el.click(); return el ? 'tiklandi' : 'yok'; })()`);
  await sleep(1200);
  // Onay diyalogu varsa onayla
  const confirm = await c2.evalJs(`(function(){
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].textContent || '').toLowerCase();
      var r = btns[i].getBoundingClientRect();
      if (r.width > 0 && (t.indexOf('çıkış yap') !== -1 || t.indexOf('evet') !== -1 || t.indexOf('onayla') !== -1)) { btns[i].click(); return 'onaylandi: ' + t.trim().slice(0, 20); }
    }
    return 'diyalog-yok';
  })()`);
  console.log("  onay: " + confirm);
  await sleep(2000);
  const landed = await c2.evalJs("location.pathname.split('/').pop()");
  console.log("  cikis sonrasi sayfa: " + landed);
} else {
  console.log("  (profilde cikis butonu yok — baska yerde olabilir)");
}
c2.ws.close();
console.log("TAMAM");
