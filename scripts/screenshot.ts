import { chromium, type Page } from "playwright";
import * as path from "node:path";
import * as url from "node:url";
import * as fs from "node:fs";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCRATCH_DIR = "C:\\Users\\ensar\\.gemini\\antigravity\\brain\\f2a0d4be-b441-47c4-a125-7b52d8ad09f8\\scratch";
const DOCS_DIR = path.join(ROOT, "docs", "screenshots");

fs.mkdirSync(SCRATCH_DIR, { recursive: true });
fs.mkdirSync(DOCS_DIR, { recursive: true });

async function savePic(page: Page, fileName: string, fullPage = true) {
  const scratchPath = path.join(SCRATCH_DIR, fileName);
  const docsPath = path.join(DOCS_DIR, fileName);
  await page.screenshot({ path: scratchPath, fullPage });
  await page.screenshot({ path: docsPath, fullPage });
  console.log(`Saved ${fileName}`);
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    timezoneId: "Europe/Istanbul",
    colorScheme: "dark",
  });

  const page = await context.newPage();

  // 1. WEB SCREENSHOTS
  const webRes = { width: 1280, height: 800 };
  await page.setViewportSize(webRes);

  const webLocales = [
    { code: "tr", path: "tr/index.html", lightPath: "tr/light.html" },
    { code: "en", path: "index.html", lightPath: "light.html" },
  ];

  for (const loc of webLocales) {
    // Authentic public landing page (Sticky Header, Hero, Features, App Showcase, Download Center, Rich Footer)
    const targetUrl = url.pathToFileURL(path.join(ROOT, "packages", "web", "dist", loc.path)).href;
    await page.goto(targetUrl, { waitUntil: "networkidle" });
    await savePic(page, `web_${loc.code}_dark_landing_full.png`, true);

    // Light version landing page
    const lightUrl = url.pathToFileURL(path.join(ROOT, "packages", "web", "dist", loc.lightPath)).href;
    await page.goto(lightUrl, { waitUntil: "networkidle" });
    await savePic(page, `web_${loc.code}_light_landing_full.png`, true);

    // Tabbed interactive views for each section
    const sections = [
      "today",
      "home-state",
      "suggestions",
      "skills",
      "devices",
      "family",
      "personalization",
      "billing",
      "download-center",
    ];

    for (const sec of sections) {
      await page.goto(`${targetUrl}#${sec}`, { waitUntil: "networkidle" });
      await savePic(page, `web_${loc.code}_dark_section_${sec}.png`, false);
    }
  }

  // 2. DESKTOP APP SCREENSHOTS
  const deskRes = { width: 1024, height: 768 };
  const setupRes = { width: 800, height: 600 };
  const desktopScreens = [
    "today",
    "home-state",
    "suggestions",
    "skills",
    "devices",
    "family",
    "personalization",
    "billing",
    "download-center",
  ];

  for (const loc of ["tr", "en"]) {
    for (const os of ["windows", "mac"]) {
      await page.setViewportSize(deskRes);
      const relPath = loc === "en" ? `${os}/index.html` : `tr/${os}/index.html`;
      const deskUrl = url.pathToFileURL(path.join(ROOT, "packages", "desktop", "dist", relPath)).href;

      for (const sec of desktopScreens) {
        await page.goto(`${deskUrl}#${sec}`, { waitUntil: "networkidle" });
        await savePic(page, `desktop_${loc}_dark_${os}_${sec}.png`, false);
      }

      // Setup wizard all 5 steps
      await page.setViewportSize(setupRes);
      const setupRelPath = loc === "en" ? `${os}/setup.html` : `tr/${os}/setup.html`;
      const setupUrl = url.pathToFileURL(path.join(ROOT, "packages", "desktop", "dist", setupRelPath)).href;
      await page.goto(setupUrl, { waitUntil: "networkidle" });

      const setupSteps = ["welcome", "license", "location", "installing", "finish"];
      for (let i = 0; i < setupSteps.length; i++) {
        const stepId = setupSteps[i];
        await page.evaluate((idx) => {
          if (typeof (window as any).__nx_goToStep === "function") {
            (window as any).__nx_goToStep(idx);
          }
        }, i);
        await page.waitForTimeout(300);
        await savePic(page, `desktop_${loc}_dark_setup_${os}_step_${stepId}.png`, false);
      }
    }
  }

  // 3. MOBILE APP SCREENSHOTS
  const mobileRes = { width: 390, height: 844 };
  await page.setViewportSize(mobileRes);

  const mobileScreens = [
    "today",
    "home-state",
    "devices",
    "family",
    "more",
    "suggestions",
    "skills",
    "personalization",
    "billing",
    "download-center",
  ];

  for (const loc of ["tr", "en"]) {
    const relPath = loc === "en" ? "index.html" : "tr/index.html";
    const mobUrl = url.pathToFileURL(path.join(ROOT, "packages", "mobile", "dist", relPath)).href;

    for (const sec of mobileScreens) {
      await page.goto(`${mobUrl}#${sec}`, { waitUntil: "networkidle" });
      await savePic(page, `mobile_${loc}_dark_screen_${sec}.png`, false);
    }
  }

  await browser.close();
  console.log("All comprehensive screenshots captured successfully!");
}

main().catch(console.error);
