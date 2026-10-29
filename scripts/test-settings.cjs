const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });

  // 1. Turkish user
  const trContext = await browser.newContext({ locale: "tr-TR" });
  const trPage = await trContext.newPage();
  await trPage.addInitScript(() => {
    localStorage.setItem("nexusCurrentUser", "Ahmet Yılmaz");
  });
  await trPage.goto("http://127.0.0.1:8766/nexus-settings.html", { waitUntil: "networkidle" });
  const trData = await trPage.evaluate(() => ({
    url: location.href,
    homeLang: window.nexusHomeLang,
    hasRow: !!document.getElementById("language-row"),
    label: document.getElementById("language-label")?.textContent
  }));
  console.log("Turkish User in Settings:", trData);

  // 2. Foreign user
  const usContext = await browser.newContext({ locale: "en-US", timezoneId: "America/New_York" });
  const usPage = await usContext.newPage();
  await usPage.addInitScript(() => {
    localStorage.setItem("nexusCurrentUser", "John Doe");
  });
  await usPage.goto("http://127.0.0.1:8766/nexus-settings.html", { waitUntil: "networkidle" });
  const usData = await usPage.evaluate(() => ({
    url: location.href,
    homeLang: window.nexusHomeLang,
    hasRow: !!document.getElementById("language-row"),
    lang: window.nexusLang
  }));
  console.log("Foreign User in Settings:", usData);

  await browser.close();
})();
