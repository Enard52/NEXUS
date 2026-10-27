// NEXUS LAN uçtan uca testi: gerçek HTTP isteği yerel bir sahte Shelly cihazına gider.
// Komutun cihaza ulaştığını, 4xx/5xx yanıtının başarı sayılmadığını, cihazdan durum
// okunduğunu ve özel ağ dışı adresin engellendiğini doğrular. Playwright gerekir.
// Kullanım: node scripts/verify-lan-e2e.mjs
import http from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const APP_PORT = 4862;
const DEVICE_PORT = 4863;
const seen = [];
let deviceMode = "ok";

const pageHtml = `<!doctype html><html><head><meta charset="utf-8"><title>LAN E2E</title></head>
<body>
<script>
  var store = {};
  window.nexusGetItem = function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; };
  window.nexusSetItem = function (k, v) { store[k] = String(v); };
  window.nexusLocale = "tr-TR";
</script>
<script src="/device-controls.js"></script>
<script src="/lan-connectors.js"></script>
<script>
  window.__seed = function () {
    store["nexusPairedDevices"] = JSON.stringify([{
      id: "e2e-shelly",
      name: "E2E Mutfak Prizı",
      host: "http://127.0.0.1:${DEVICE_PORT}",
      protocol: "shelly",
      model: "Shelly Plug S",
      kind: "plug",
      caps: ["switch"],
      room: "Mutfak",
      state: { switch: false }
    }]);
  };
  window.__toggle = function (on) { return window.NX.setField(0, "switch", on); };
  window.__status = function () {
    return {
      status: window.NX.lanStatus(0),
      online: window.NX.LAN_ONLINE[0],
      error: window.NX.lanError(0),
      state: window.NX.stateOf(window.NX.readDevices()[0])
    };
  };
</script>
</body></html>`;

const appServer = http.createServer(async (req, res) => {
  const url = (req.url || "/").split("?")[0];
  if (url === "/" || url === "/index.html") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(pageHtml);
  }
  try {
    const file = join(process.cwd(), url.replace(/^\//, ""));
    const body = await readFile(file);
    res.writeHead(200, { "content-type": "text/javascript; charset=utf-8" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

const deviceServer = http.createServer((req, res) => {
  const url = req.url || "/";
  seen.push(url);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  if (deviceMode === "fail" && url.startsWith("/relay/")) {
    res.writeHead(500);
    return res.end(JSON.stringify({ error: "boom" }));
  }
  if (url.startsWith("/relay/")) {
    res.writeHead(200);
    return res.end(JSON.stringify({ ison: /turn=on/.test(url) }));
  }
  if (url === "/status") {
    res.writeHead(200);
    return res.end(JSON.stringify({ relays: [{ ison: true }], meters: [{ power: 12.4 }] }));
  }
  if (url === "/settings") {
    res.writeHead(200);
    return res.end(JSON.stringify({ device: { type: "SHPLG-S", hostname: "e2e" }, name: "E2E" }));
  }
  res.writeHead(404);
  res.end("{}");
});

await new Promise((r) => appServer.listen(APP_PORT, "127.0.0.1", r));
await new Promise((r) => deviceServer.listen(DEVICE_PORT, "127.0.0.1", r));

const browser = await chromium.launch();
const page = await browser.newPage();
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  if (ok) { pass++; console.log("PASS", name); }
  else { fail++; console.log("FAIL", name, detail); }
};

await page.goto(`http://127.0.0.1:${APP_PORT}/`, { waitUntil: "load" });
await page.evaluate(() => window.__seed());

// 1) Gerçek HTTP isteği: aç komutu cihaza gider ve onaylanır.
await page.evaluate(() => window.__toggle(true));
await page.waitForTimeout(400);
let st = await page.evaluate(() => window.__status());
check("on command reached device", seen.includes("/relay/0?turn=on"), JSON.stringify(seen));
check("on command marked ok", st.status === "ok" && st.online === true, JSON.stringify(st));
check("local state on", st.state.switch === true, JSON.stringify(st.state));

// 2) Cihaz hata dönerse başarı gösterilmez.
deviceMode = "fail";
await page.evaluate(() => window.__toggle(false));
await page.waitForTimeout(400);
st = await page.evaluate(() => window.__status());
check("failing command reached device", seen.includes("/relay/0?turn=off"), JSON.stringify(seen));
check("failing command marked error", st.status === "error" && st.online === false, JSON.stringify(st));
check("failing command explains", /ulaşamadı|http 500/.test(st.error || ""), st.error);

// 3) Cihazdan gerçek durum okunur (cihaz açık diyor; yerel kayıt güncellenir).
deviceMode = "ok";
await page.evaluate(() => window.NX.refreshFromDevice(0));
await page.waitForTimeout(300);
st = await page.evaluate(() => window.__status());
check("read status from device", seen.includes("/status"), JSON.stringify(seen));
check("live state applied", st.state.switch === true, JSON.stringify(st.state));
check("device online after read", st.online === true, JSON.stringify(st));

// 4) Özel ağ dışı adres engellenir (komut internete kaçmaz).
const blocked = await page.evaluate(() => window.nexusLan.write(
  { protocol: "shelly", host: "http://example.com", kind: "plug" }, "switch", true
).then(() => "resolved", (e) => String(e.message || e)));
check("public host blocked", /yalnızca yerel ağ|yerel ağ/i.test(blocked), blocked);

await browser.close();
appServer.close();
deviceServer.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
