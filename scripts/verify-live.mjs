// Live-server smoke test: home page (QR modal, no stale CDN links) + previews.
import http from "node:http";

function get(p) {
  return new Promise((resolve) => {
    http.get({ host: "localhost", port: 4178, path: p }, (res) => {
      let b = "";
      res.on("data", (c) => (b += c));
      res.on("end", () => resolve({ s: res.statusCode, b }));
    });
  });
}

const home = await get("/");
console.log("/ status:", home.s);
console.log("  openQrModal fn:", home.b.includes("window.openQrModal"));
console.log('  qr-modal div:', home.b.includes('id="qr-modal"'));
console.log("  store badges wired:", (home.b.match(/openQrModal\('(apple|google)'\)/g) || []).length);
console.log("  cdn.nexus-ai.com refs:", (home.b.match(/cdn\.nexus-ai\.com/g) || []).length);
console.log(
  "  download links:",
  [...new Set(home.b.match(/\/downloads\/NEXUS[^"']+/g) || [])],
);

for (const p of ["/installer", "/preview/desktop", "/preview/mobile", "/mobile", "/desktop"]) {
  const r = await get(p);
  console.log(`${p} status:`, r.s, "len:", r.b.length);
}
