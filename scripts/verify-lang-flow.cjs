const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Test 1: Foreign user (en-US, America/New_York)
  const usContext = await browser.newContext({
    locale: "en-US",
    timezoneId: "America/New_York"
  });
  const usPage = await usContext.newPage();
  await usPage.goto("http://127.0.0.1:8766/nexus-settings.html", { waitUntil: "networkidle" });
  const usLang = await usPage.evaluate(() => window.nexusLang);
  const usHomeLang = await usPage.evaluate(() => window.nexusHomeLang);
  const usRow = await usPage.$("#language-row");
  console.log("--- Foreign User (en-US) ---");
  console.log("App Language:", usLang);
  console.log("Home Lang:", usHomeLang);
  console.log("Language Row in Settings exists:", usRow !== null);

  // Test 2: Turkish user (tr-TR, Europe/Istanbul)
  const trContext = await browser.newContext({
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul"
  });
  const trPage = await trContext.newPage();
  await trPage.goto("http://127.0.0.1:8766/nexus-settings.html", { waitUntil: "networkidle" });
  const trLang = await trPage.evaluate(() => window.nexusLang);
  const trHomeLang = await trPage.evaluate(() => window.nexusHomeLang);
  const trRow = await trPage.$("#language-row");
  console.log("--- Turkish User (tr-TR) ---");
  console.log("App Language:", trLang);
  console.log("Home Lang:", trHomeLang);
  console.log("Language Row in Settings exists:", trRow !== null);

  // Test 3: Website for Foreign User
  await usPage.goto("http://127.0.0.1:8766/public/index.html", { waitUntil: "networkidle" });
  const usSiteLangSwitch = await usPage.evaluate(() => {
    const el = document.querySelector(".lang-switch");
    if (!el) return null;
    return window.getComputedStyle(el).display;
  });
  console.log("Website .lang-switch display for US:", usSiteLangSwitch);

  // Test 4: Website for Turkish User
  await trPage.goto("http://127.0.0.1:8766/public/index.html", { waitUntil: "networkidle" });
  const trSiteLangSwitch = await trPage.evaluate(() => {
    const el = document.querySelector(".lang-switch");
    if (!el) return null;
    return window.getComputedStyle(el).display;
  });
  console.log("Website .lang-switch display for TR:", trSiteLangSwitch);

  await browser.close();
})();
