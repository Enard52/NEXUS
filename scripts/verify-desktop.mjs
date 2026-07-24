const B = process.env.VBASE || "http://localhost:4178";
// A representative Electron desktop User-Agent (contains "Electron" + our marker).
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) NEXUS/3.14.2 Chrome/130 Electron/33.2.0 Safari/537.36 NexusDesktop/3.14.2";
const CREDS = { email: "qa.visual@example.com", password: "CorrectHorse9" };

// Log in (or register if this is a fresh DB) to obtain a real session.
async function auth(path) {
  return fetch(B + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(CREDS),
  });
}
let r1 = await auth("/api/login");
if (r1.status !== 200) r1 = await auth("/api/register");
const ck = (r1.headers.getSetCookie().find((c) => c.startsWith("nx_session")) || "").split(";")[0];
console.log("auth ->", r1.status);

const r2 = await fetch(B + "/", { headers: { cookie: ck, "user-agent": UA } });
const h = await r2.text();
console.log("desktop GET / ->", r2.status);
console.log("  window shell :", h.includes('<div class="window">'));
console.log("  title bar    :", h.includes('<div class="titlebar">'));
console.log("  sidebar      :", h.includes('<aside class="sidebar">'));
console.log("  window ctrls :", h.includes('class="wctl"'));
console.log("  lang switch  :", h.includes('class="title-lang"'));
console.log("  logout btn   :", h.includes('id="desk-logout"'));
console.log("  manifest     :", h.includes('rel="manifest"'));
console.log("  sw register  :", h.includes("serviceWorker"));

const r3 = await fetch(B + "/sw.js");
console.log("sw.js ->", r3.status, r3.headers.get("content-type"));
