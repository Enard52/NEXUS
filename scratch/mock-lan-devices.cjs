// Sahte LAN cihazları — connector katmanını gerçek donanım olmadan doğrulamak için.
// Shelly Gen1 REST (:8080), WLED JSON (:8081), ESPHome web (:8082).
// Gerçek cihazlar da CORS'u "*" ile servis eder; mock da aynı davranır.
const http = require("node:http");

function send(res, code, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  });
  res.end(body);
}

function corsPreflight(req, res) {
  if (req.method !== "OPTIONS") return false;
  res.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  });
  res.end();
  return true;
}

// --- Shelly ---
const shelly = { relays: [{ turn: "off" }], lights: [{ turn: "off", brightness: 40 }] };
http
  .createServer((req, res) => {
    if (corsPreflight(req, res)) return;
    const url = req.url || "/";
    if (url.startsWith("/settings")) return send(res, 200, { device: { type: "SHSW-1", hostname: "nexus-shelly-1" } });
    if (url.startsWith("/status")) {
      return send(res, 200, {
        power: [{ turn: shelly.relays[0].turn }],
        relays: shelly.relays,
        light: shelly.lights,
      });
    }
    const relay = url.match(/\/relay\/0\?turn=(on|off)/);
    if (relay) {
      shelly.relays[0].turn = relay[1];
      return send(res, 200, { relays: [{ turn: relay[1], is_valid: true }] });
    }
    const light = url.match(/\/light\/0\?(.+)/);
    if (light) {
      const params = new URLSearchParams(light[1]);
      if (params.get("turn")) shelly.lights[0].turn = params.get("turn");
      if (params.get("brightness")) shelly.lights[0].brightness = Number(params.get("brightness"));
      return send(res, 200, { lights: [Object.assign({}, shelly.lights[0], { brightness: shelly.lights[0].brightness })] });
    }
    send(res, 404, { errors: [{ code: 404 }] });
  })
  .listen(8080, () => console.log("mock Shelly :8080"));

// --- WLED ---
const wled = { on: false, bri: 128, ps: [{ col: ["#ffaa00"] }] };
http
  .createServer((req, res) => {
    if (corsPreflight(req, res)) return;
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const url = req.url || "/";
      if (url.startsWith("/json/info")) return send(res, 200, { ver: "0.14.2", name: "nexus-wled" });
      if (url.startsWith("/json/state")) {
        if (req.method === "POST" || req.method === "PUT") {
          try {
            Object.assign(wled, JSON.parse(Buffer.concat(chunks).toString() || "{}"));
          } catch (e) {
            return send(res, 400, { err: true });
          }
        }
        return send(res, 200, wled);
      }
      send(res, 404, { err: true });
    });
  })
  .listen(8081, () => console.log("mock WLED :8081"));

// --- ESPHome ---
const esp = { lights: [{ state: "OFF", brightness: 60 }], switches: [{ state: "OFF" }] };
http
  .createServer((req, res) => {
    if (corsPreflight(req, res)) return;
    const url = req.url || "/";
    if (url.startsWith("/edit?json=1")) {
      return send(res, 200, { light: esp.lights, switch: esp.switches });
    }
    const on = url.match(/\/(light|switch)\/0\/(on|off)/);
    if (on) {
      const target = on[1] === "light" ? esp.lights[0] : esp.switches[0];
      target.state = on[2] === "on" ? "ON" : "OFF";
      return send(res, 200, { ok: true });
    }
    const bri = url.match(/\/light\/0\?brightness=(\d+)/);
    if (bri) {
      esp.lights[0].brightness = Number(bri[1]);
      return send(res, 200, { ok: true });
    }
    send(res, 404, { error: "not found" });
  })
  .listen(8082, () => console.log("mock ESPHome :8082"));

console.log("sahte LAN cihazları hazır: 8080 shelly, 8081 wled, 8082 esphome");
