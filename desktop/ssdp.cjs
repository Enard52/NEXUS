// SSDP keşfi (UPnP Device Architecture 1.1, §1.3): 239.255.255.250:1900'e M-SEARCH gönderir, gelen
// 200 OK yanıtlarından cihazın adresini ve ST/USN/SERVER/LOCATION başlıklarını okur.
// Yalnızca özel (LAN) adreslerden gelen yanıtlar kabul edilir. Gerçek ağda doğrulanmadı: paket biçimi
// belgeye göre yazıldı, ayrıştırma testle (packages/web/src/lan-ssdp.test.ts) korunur.
"use strict";
const dgram = require("node:dgram");

const SSDP_ADDR = "239.255.255.250";
const SSDP_PORT = 1900;

function buildMSearch(st, mx) {
  return Buffer.from(
    [
      "M-SEARCH * HTTP/1.1",
      "HOST: " + SSDP_ADDR + ":" + SSDP_PORT,
      'MAN: "ssdp:discover"',
      "MX: " + (mx || 2),
      "ST: " + (st || "ssdp:all"),
      "",
      "",
    ].join("\r\n"),
    "utf8",
  );
}

function isPrivateV4(ip) {
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(String(ip || ""));
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}

// "HTTP/1.1 200 OK" yanıtı (veya NOTIFY) → { address, st, usn, server, location } ya da null
function parseResponse(buf, address) {
  if (!isPrivateV4(address)) return null;
  const lines = String(buf).split(/\r?\n/);
  if (!/^(HTTP\/1\.[01] 200|NOTIFY \* HTTP\/1\.1)/i.test(lines[0] || "")) return null;
  const h = {};
  for (let i = 1; i < lines.length; i++) {
    const k = /^([^:]+):\s*(.*)$/.exec(lines[i]);
    if (k) h[k[1].trim().toLowerCase()] = k[2].trim();
  }
  return {
    address,
    st: h.st || h.nt || "",
    usn: h.usn || "",
    server: h.server || "",
    location: h.location || "",
  };
}

// Yanıtları timeoutMs boyunca toplar; adres başına tek kayıt (ilk yanıt).
function discover(opts) {
  const timeoutMs = Math.min(Math.max(Number(opts && opts.timeoutMs) || 2500, 500), 8000);
  return new Promise((resolve) => {
    const found = new Map();
    const sock = dgram.createSocket({ type: "udp4", reuseAddr: true });
    let closed = false;
    const finish = () => {
      if (closed) return;
      closed = true;
      try {
        sock.close();
      } catch {
        /* kapalı */
      }
      resolve(Array.from(found.values()));
    };
    sock.on("message", (msg, rinfo) => {
      const r = parseResponse(msg, rinfo.address);
      if (r && !found.has(r.address)) found.set(r.address, r);
    });
    sock.on("error", finish);
    sock.bind(0, () => {
      const packet = buildMSearch("ssdp:all", 2);
      // UDP kaybolabilir: belge de birden fazla gönderimi önerir
      sock.send(packet, SSDP_PORT, SSDP_ADDR, () => {});
      setTimeout(() => sock.send(packet, SSDP_PORT, SSDP_ADDR, () => {}), 400);
    });
    setTimeout(finish, timeoutMs);
  });
}

module.exports = { buildMSearch, parseResponse, isPrivateV4, discover };
