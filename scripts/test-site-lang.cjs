const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });

  // 1. Turkish user visiting site
  const trContext = await browser.newContext({ locale: "tr-TR" });
  const trPage = await trContext.newPage();
  await trPage.goto("http://127.0.0.1:8766/public/tr/index.html", { waitUntil: "networkidle" });
  const trData = await trPage.evaluate(() => {
    const sw = document.querySelector(".lang-switch");
    return {
      homeLangAttr: document.documentElement.getAttribute("data-home-lang"),
      langSwitchDisplay: sw ? window.getComputedStyle(sw).display : "not found"
    };
  });
  console.log("Turkish User on Website:", trData);

  // 2. Foreign user visiting site
  const usContext = await browser.newContext({ locale: "en-US", timezoneId: "America/New_York" });
  const usPage = await usContext.newPage();
  await usPage.goto("http://127.0.0.1:8766/public/index.html", { waitUntil: "networkidle" });
  const usData = await usPage.evaluate(() => {
    const sw = document.querySelector(".lang-switch");
    return {
      homeLangAttr: document.documentElement.getAttribute("data-home-lang"),
      langSwitchDisplay: sw ? window.getComputedStyle(sw).display : "not found"
    };
  });
  console.log("Foreign User on Website:", usData);

  await browser.close();
})();
