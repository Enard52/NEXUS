// scripts/inspect-live-8766.cjs
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const OUT_DIR = path.resolve(__dirname, "..", ".audit-shots");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  // Desktop context
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await desktopContext.newPage();
  const consoleErrors = [];
  page.on("console", msg => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", err => consoleErrors.push(err.message));

  // Seed sample local storage
  await page.addInitScript(() => {
    try {
      localStorage.setItem("nexusCurrentUser", "Murat Can");
      localStorage.setItem("nexusUserEmail", "murat@nexus.internal");
      localStorage.setItem("nexusEverLoggedIn", "1");
      localStorage.setItem("nexusLang", "tr");
    } catch(e) {}
  });

  console.log("Navigating to http://127.0.0.1:8766/nexus-home.html...");
  await page.goto("http://127.0.0.1:8766/nexus-home.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // Take screenshot of desktop home
  const homeDeskPath = path.join(OUT_DIR, "live-home-desktop.png");
  await page.screenshot({ path: homeDeskPath, fullPage: false });
  console.log("Captured live desktop home screenshot:", homeDeskPath);

  // Inspect sidebar AI icon details vs input AI icon details
  const logoComparison = await page.evaluate(() => {
    const sideAiIco = document.querySelector(".nx-side-ai-ico");
    const sideAiSvg = sideAiIco ? sideAiIco.innerHTML : null;
    const inputAiIco = document.querySelector("[data-purpose='ai-search-container'] svg");
    const inputAiSvg = inputAiIco ? inputAiIco.outerHTML : null;
    
    // Check brand logo at top of sidebar
    const brandSvg = document.querySelector(".nx-side-brand svg");
    
    return {
      sideAiSvg: sideAiSvg ? sideAiSvg.slice(0, 150) : null,
      inputAiSvg: inputAiSvg ? inputAiSvg.slice(0, 150) : null,
      brandSvg: brandSvg ? brandSvg.outerHTML.slice(0, 150) : null
    };
  });
  console.log("Logo Comparison:", JSON.stringify(logoComparison, null, 2));

  // Inspect sidebar styles
  const sideStyles = await page.evaluate(() => {
    const side = document.getElementById("nx-side");
    if (!side) return null;
    const cs = window.getComputedStyle(side);
    return {
      width: cs.width,
      display: cs.display,
      position: cs.position,
      height: cs.height,
      zIndex: cs.zIndex
    };
  });
  console.log("Sidebar Computed Styles:", JSON.stringify(sideStyles, null, 2));

  // Inspect Smart page
  await page.goto("http://127.0.0.1:8766/nexus-smart.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, "live-smart-desktop.png") });

  // Inspect Chat page
  await page.goto("http://127.0.0.1:8766/nexus-chat.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, "live-chat-desktop.png") });

  // Inspect Settings page
  await page.goto("http://127.0.0.1:8766/nexus-settings.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, "live-settings-desktop.png") });

  // Inspect Profile page
  await page.goto("http://127.0.0.1:8766/nexus-profile.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, "live-profile-desktop.png") });

  // Mobile Context
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const mobPage = await mobileContext.newPage();
  await mobPage.addInitScript(() => {
    try {
      localStorage.setItem("nexusCurrentUser", "Murat Can");
      localStorage.setItem("nexusUserEmail", "murat@nexus.internal");
      localStorage.setItem("nexusEverLoggedIn", "1");
      localStorage.setItem("nexusLang", "tr");
    } catch(e) {}
  });

  await mobPage.goto("http://127.0.0.1:8766/nexus-home.html", { waitUntil: "networkidle" });
  await mobPage.waitForTimeout(300);
  await mobPage.screenshot({ path: path.join(OUT_DIR, "live-home-mobile.png") });

  console.log("All screenshots captured. Total console errors:", consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log("Errors:", consoleErrors);
  }

  await browser.close();
}

run().catch(console.error);
