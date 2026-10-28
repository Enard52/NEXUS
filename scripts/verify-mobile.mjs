const B = process.env.VBASE || "http://localhost:4178";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148";
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
console.log("mobile GET / ->", r2.status);
console.log("  phone frame :", h.includes('<div class="phone">'));
console.log("  bottom tabs :", h.includes('class="tabbar"'));
console.log("  manifest    :", h.includes('rel="manifest"'));
console.log("  logout btn  :", h.includes('id="m-logout"'));
console.log("  lang switch :", h.includes("m-lang"));
console.log("  sw register :", h.includes("serviceWorker"));
console.log("  bento fix   :", h.includes("repeat(2, minmax(0, 1fr))"));

const r3 = await fetch(B + "/sw.js");
console.log("sw.js ->", r3.status, r3.headers.get("content-type"));
