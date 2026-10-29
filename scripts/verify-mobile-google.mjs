// NEXUS mobil Google girişi uçtan uca testi (tarayıcıda Capacitor taklidi).
// Düğme görünürlüğü, sistem tarayıcısında açılan Supabase adresi, site aktarımına
// dönüş, nexus://auth derin bağlantısı ve oturumun kurulup ana sayfaya geçişi doğrulanır.
// Supabase yanıtları sahtedir; gerçek anahtar/ağ gerekmez. Playwright gerekir.
// Kullanım: node scripts/verify-mobile-google.mjs
import http from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { chromium } from "playwright";

const PORT = 4864;
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".webmanifest": "application/manifest+json",
};
const server = http.createServer(async (req, res) => {
  try {
    const p = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\//, "") || "index.html";
    const f = join(process.cwd(), p);
    res.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" });
    res.end(await readFile(f));
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "tr-TR" });
await ctx.addInitScript(() => {
  window.__opened = "";
  window.__listeners = {};
  window.Capacitor = {
    isNativePlatform: () => true,
    Plugins: {
      Browser: {
        open: (opts) => {
          window.__opened = (opts && opts.url) || "";
          return Promise.resolve();
        },
      },
      App: {
        addListener: (name, fn) => {
          window.__listeners[name] = fn;
          return Promise.resolve({ remove: () => {} });
        },
        getLaunchUrl: () => Promise.resolve(null),
      },
    },
  };
});
const page = await ctx.newPage();
await page.route(/https:\/\/[a-z0-9]+\.supabase\.co\/.*/i, (route) => {
  const url = route.request().url();
  if (url.includes("/auth/v1/user")) {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "u-e2e",
        email: "e2e@nexus.local",
        user_metadata: { full_name: "E2E Kullanıcı", avatar_url: "" },
      }),
    });
  }
  if (url.includes("/auth/v1/factors")) {
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  }
  return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
});

let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  if (ok) { pass++; console.log("PASS", name); }
  else { fail++; console.log("FAIL", name, detail); }
};

await page.goto(`http://127.0.0.1:${PORT}/nexus-login.html`, { waitUntil: "load" });
await page.waitForTimeout(500);
const visibility = await page.evaluate(() => ({
  button: getComputedStyle(document.getElementById("google-login-btn")).display,
  hint: document.getElementById("google-hint").classList.contains("hidden"),
}));
check("Google button visible on native", visibility.button !== "none", JSON.stringify(visibility));
check("native hint hidden", visibility.hint, JSON.stringify(visibility));

await page.click("#google-login-btn");
await page.waitForTimeout(200);
const opened = await page.evaluate(() => window.__opened);
const auth = new URL(opened || "about:blank");
check("Browser opens Supabase authorize", auth.hostname.endsWith(".supabase.co") && auth.pathname === "/auth/v1/authorize", opened);
check("provider is google", auth.searchParams.get("provider") === "google", opened);
check("redirect returns to site relay", auth.searchParams.get("redirect_to") === "https://nexus-smarthome.pages.dev/app-auth.html", opened);

await page.evaluate(() => {
  window.__listeners.appUrlOpen({
    url: "nexus://auth#access_token=fake-access&refresh_token=fake-refresh&expires_in=3600",
  });
});
await page.waitForURL("**/nexus-home.html", { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(500);
const result = await page.evaluate(() => {
  const user = localStorage.getItem("nexusCurrentUser") || "";
  let session = null;
  try { session = JSON.parse(localStorage.getItem(user + "_nexusCloudSession") || "null"); } catch (e) {}
  return { path: location.pathname, user, token: session && session.accessToken, hash: location.hash };
});
check("lands on home after deep link", /nexus-home\.html$/.test(result.path), JSON.stringify(result));
check("session user set", result.user === "e2e@nexus.local", JSON.stringify(result));
check("session token stored", result.token === "fake-access", JSON.stringify(result));

await browser.close();
server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
