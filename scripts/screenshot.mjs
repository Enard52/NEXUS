import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  console.log("Starting browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1440, height: 1024 });
  page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.text()));
  page.on("pageerror", (error) => console.log("BROWSER ERROR:", error.message));

  // Web Landing Page
  const url = `file:///${path.resolve("public/index.html").replace(/\\/g, "/")}`;
  console.log("Navigating to", url);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500); // Wait for aurora and rise animations

  const destDir =
    "C:\\Users\\ensar\\.gemini\\antigravity\\brain\\cfbdd3ae-ecda-4bf8-9160-f64d151f06d7";
  await page.screenshot({ path: path.join(destDir, "landing_page.png"), fullPage: true });

  // Desktop Setup Wizard
  // const setupUrl = `file:///${path.resolve('public/windows/setup.html').replace(/\\/g, '/')}`;
  // console.log('Navigating to', setupUrl);
  // await page.goto(setupUrl, { waitUntil: 'networkidle' });
  // await page.waitForTimeout(1500);
  // await page.screenshot({ path: path.join(destDir, 'setup_wizard.png') });

  // Mobile Web View
  await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12 Pro size
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(destDir, "landing_page_mobile.png"), fullPage: true });

  await browser.close();
  console.log("Screenshots saved successfully!");
})();
