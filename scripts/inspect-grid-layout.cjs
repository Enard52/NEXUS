const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ headless: true });

  const devices = [
    { id: "dev-1", name: "Salon Lambası", type: "light", room: "Salon", state: { on: true, brightness: 80 } },
    { id: "dev-2", name: "Tavan Aydınlatması", type: "light", room: "Salon", state: { on: false } }
  ];

  // 1. Mobile Test
  const mobContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const mobPage = await mobContext.newPage();
  await mobPage.addInitScript((devs) => {
    localStorage.setItem("nexusCurrentUser", "Test User");
    localStorage.setItem("Test User_nexusPairedDevices", JSON.stringify(devs));
    localStorage.setItem("nexusPairedDevices", JSON.stringify(devs));
  }, devices);

  await mobPage.goto("http://127.0.0.1:8766/nexus-home.html", { waitUntil: "networkidle" });
  await mobPage.waitForTimeout(400);

  const mobBoxes = await mobPage.evaluate(() => {
    const favItems = Array.from(document.querySelectorAll("#favorites-grid > a")).map(el => ({
      id: el.id,
      text: el.querySelector("h3")?.innerText,
      rect: el.getBoundingClientRect()
    }));
    const devItems = Array.from(document.querySelectorAll("#dynamic-devices-grid > div")).map(el => ({
      text: el.querySelector(".font-bold")?.innerText,
      rect: el.getBoundingClientRect()
    }));
    return { favItems, devItems };
  });

  await mobPage.screenshot({ path: path.resolve(".audit-shots/real-mobile-home-grid.png") });
  console.log("Mobile Grid Layout:", JSON.stringify(mobBoxes, null, 2));

  // 2. Desktop Test
  const deskContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const deskPage = await deskContext.newPage();
  await deskPage.addInitScript((devs) => {
    localStorage.setItem("nexusCurrentUser", "Test User");
    localStorage.setItem("Test User_nexusPairedDevices", JSON.stringify(devs));
    localStorage.setItem("nexusPairedDevices", JSON.stringify(devs));
  }, devices);

  await deskPage.goto("http://127.0.0.1:8766/nexus-home.html", { waitUntil: "networkidle" });
  await deskPage.waitForTimeout(400);

  const deskBoxes = await deskPage.evaluate(() => {
    const favItems = Array.from(document.querySelectorAll("#favorites-grid > a")).map(el => ({
      id: el.id,
      text: el.querySelector("h3")?.innerText,
      rect: el.getBoundingClientRect()
    }));
    const devItems = Array.from(document.querySelectorAll("#dynamic-devices-grid > div")).map(el => ({
      text: el.querySelector(".font-bold")?.innerText,
      rect: el.getBoundingClientRect()
    }));
    return { favItems, devItems };
  });

  await deskPage.screenshot({ path: path.resolve(".audit-shots/real-desktop-home-grid.png") });
  console.log("Desktop Grid Layout:", JSON.stringify(deskBoxes, null, 2));

  await browser.close();
})();
