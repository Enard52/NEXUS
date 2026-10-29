// scripts/desktop-web-audit.cjs
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const PORT = 3891;
const ROOT = path.resolve(__dirname, "..");
const SHOTS_DIR = path.resolve(__dirname, "..", ".audit-shots");

if (!fs.existsSync(SHOTS_DIR)) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff"
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split("?")[0]);
  if (reqPath === "/" || reqPath === "") reqPath = "/nexus-home.html";

  let filePath = path.join(ROOT, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // Try www folder fallback
    let wwwPath = path.join(ROOT, "www", reqPath);
    if (fs.existsSync(wwwPath) && !fs.statSync(wwwPath).isDirectory()) {
      filePath = wwwPath;
    } else {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found: " + reqPath);
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";

  res.writeHead(200, {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache"
  });
  fs.createReadStream(filePath).pipe(res);
});

async function runAudit() {
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  console.log(`Server started on http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });

  const pagesToTest = [
    "nexus-home.html",
    "nexus-smart.html",
    "nexus-discover.html",
    "nexus-chat.html",
    "nexus-pair.html",
    "nexus-settings.html",
    "nexus-profile.html",
    "nexus-household.html",
    "nexus-energy.html",
    "nexus-login.html"
  ];

  const results = [];

  for (const pageName of pagesToTest) {
    const page = await context.newPage();
    const consoleLogs = [];
    const errors = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
      else consoleLogs.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    // Seed mock local storage
    await page.addInitScript(() => {
      try {
        localStorage.setItem("nexusCurrentUser", "Murat Can");
        localStorage.setItem("nexusUserEmail", "murat@nexus.internal");
        localStorage.setItem("nexusEverLoggedIn", "1");
        localStorage.setItem("nexusLang", "tr");
        if (!localStorage.getItem("nexusPairedDevices")) {
          localStorage.setItem("nexusPairedDevices", JSON.stringify([
            { id: "dev-1", name: "Salon Lambası", type: "light", room: "Salon", state: { on: true, brightness: 80 } },
            { id: "dev-2", name: "Klima", type: "ac", room: "Salon", state: { on: true, temp: 22 } },
            { id: "dev-3", name: "Akıllı Kilit", type: "lock", room: "Giriş", state: { locked: true } }
          ]));
        }
      } catch (e) {}
    });

    try {
      await page.goto(`http://127.0.0.1:${PORT}/${pageName}`, { waitUntil: "networkidle", timeout: 10000 });

      // Check desktop sidebar
      const sidebar = await page.$("#nx-side");
      const sidebarVisible = sidebar ? await sidebar.isVisible() : false;

      // Check AI button in sidebar
      const sidebarAi = await page.$(".nx-side-ai");
      const sidebarAiVisible = sidebarAi ? await sidebarAi.isVisible() : false;

      // Check Input AI logo
      const inputAi = await page.$("[data-purpose='ai-search-container']");
      const inputAiVisible = inputAi ? await inputAi.isVisible() : false;

      // Check horizontal overflow (horizontal scrollbar bug)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      // Capture screenshot
      const shotPath = path.join(SHOTS_DIR, `${pageName.replace(".html", "")}-desktop.png`);
      await page.screenshot({ path: shotPath });

      results.push({
        page: pageName,
        sidebarVisible,
        sidebarAiVisible,
        inputAiVisible,
        hasHorizontalScroll,
        errors,
        shot: shotPath
      });
      console.log(`[PASS] ${pageName}: sidebar=${sidebarVisible}, horizScroll=${hasHorizontalScroll}, errors=${errors.length}`);
    } catch (err) {
      console.error(`[FAIL] ${pageName}: ${err.message}`);
      results.push({ page: pageName, error: err.message });
    } finally {
      await page.close();
    }
  }

  // Also test Dark Mode toggle on nexus-home.html
  const darkPage = await context.newPage();
  try {
    await darkPage.goto(`http://127.0.0.1:${PORT}/nexus-home.html`, { waitUntil: "networkidle" });
    const themeBtn = await darkPage.$("#nx-side-theme");
    if (themeBtn) {
      await themeBtn.click();
      await darkPage.waitForTimeout(400);
      const isDark = await darkPage.evaluate(() => document.documentElement.classList.contains("dark"));
      const darkShot = path.join(SHOTS_DIR, `nexus-home-dark.png`);
      await darkPage.screenshot({ path: darkShot });
      console.log(`[PASS] Dark mode toggle: isDark=${isDark}`);
    }
  } catch (e) {
    console.error(`[FAIL] Dark mode test: ${e.message}`);
  } finally {
    await darkPage.close();
  }

  await browser.close();
  server.close();

  console.log("\n--- AUDIT SUMMARY ---");
  console.log(JSON.stringify(results, null, 2));
}

runAudit().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
