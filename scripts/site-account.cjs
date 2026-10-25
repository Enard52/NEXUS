// Site account entry points: the web app is the account portal. Idempotent. Usage: node site-account.cjs <siteDir>
const fs = require("fs");
const path = require("path");
const root = process.argv[2];
const APP = "https://nexus-web-jre.pages.dev/";
const L = { en: { account: "Account", signin: "Sign in", t: "Sign in to NEXUS", d: "Redirecting you to the NEXUS web app…", b: "Open the NEXUS web app" }, tr: { account: "Hesabım", signin: "Giriş yap", t: "NEXUS'a giriş yap", d: "NEXUS web uygulamasına yönlendiriliyorsun…", b: "NEXUS web uygulamasını aç" } };
let n = 0;
for (const [file, lang] of [["index.html","en"],["tr/index.html","tr"],["about.html","en"],["tr/about.html","tr"],["privacy.html","en"],["tr/privacy.html","tr"],["terms.html","en"],["tr/terms.html","tr"],["refund.html","en"],["tr/refund.html","tr"],["light.html","en"],["tr/light.html","tr"],["404.html","en"],["tr/404.html","tr"]]) {
  const p = path.join(root, file); if (!fs.existsSync(p)) continue;
  let h = fs.readFileSync(p, "utf8"); const o = h; const t = L[lang];
  // duplicate head meta lines produced by earlier passes
  h = h.replace(/(<meta name="(?:application-name|apple-mobile-web-app-title)"[^>]*>\s*)\1+/g, "$1");
  const seen = new Set(); h = h.replace(/^[ \t]*<meta name="(application-name|apple-mobile-web-app-title)"[^>]*>\r?\n/gm, (m, k) => seen.has(k) ? "" : (seen.add(k), m));
  // mobile CTA
  h = h.replace(/<a class="mobile-nav-cta mobile-nav-login" href="[^"]*">[^<]*<\/a>/, `<a class="mobile-nav-cta mobile-nav-login" href="${APP}" rel="noopener">${t.signin}</a>`);
  // primary nav link (once)
  if (!h.includes("data-nx-account")) h = h.replace(/(<a class="nav-link" href="#downloads">[^<]*<\/a>)/, `$1\n          <a class="nav-link" data-nx-account href="${APP}" rel="noopener">${t.account}</a>`);
  if (h !== o) { fs.writeFileSync(p, h); n++; }
}
for (const [file, lang] of [["login.html","en"],["tr/login.html","tr"]]) {
  const p = path.join(root, file); if (!fs.existsSync(p)) continue; const t = L[lang];
  fs.writeFileSync(p, `<!doctype html><html lang="${lang}" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t.t} — NEXUS</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${APP}"><style>:root{color-scheme:dark light}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#09090b;color:#e5e7eb;font:16px system-ui,sans-serif;text-align:center}a{display:inline-block;margin-top:16px;padding:12px 20px;border-radius:12px;background:#818cf8;color:#09090b;font-weight:700;text-decoration:none}</style></head><body><main><h1>${t.t}</h1><p>${t.d}</p><a href="${APP}">${t.b}</a></main><script>location.replace("${APP}")</script></body></html>`);
  n++;
}
console.log("site-account updated", n, "files");
