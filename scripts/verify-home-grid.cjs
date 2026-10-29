const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // standard iPhone / mobile screen
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  // Test 1: With 2 paired devices (matching the user's scenario: Salon Lambası + Tavan Aydınlatması)
  await page.addInitScript(() => {
    localStorage.setItem('nexusCurrentUser', 'Test User');
    localStorage.setItem('nexusPairedDevices', JSON.stringify([
      { id: 'paired-1', name: 'Salon Lambası', type: 'light', state: 'Açık' },
      { id: 'paired-2', name: 'Tavan Aydınlatması', type: 'light', state: 'Kapalı' }
    ]));
  });

  await page.goto('http://localhost:8766/nexus-home.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const cardEnergy = await page.$('#card-energy');
  const dev1 = await page.$('#dyn-card-paired-1');
  const dev2 = await page.$('#dyn-card-paired-2');

  const bEnergy = await cardEnergy.boundingBox();
  const bDev1 = await dev1.boundingBox();
  const bDev2 = await dev2.boundingBox();

  console.log('Energy card box:', bEnergy);
  console.log('Device 1 (Salon Lambası) box:', bDev1);
  console.log('Device 2 (Tavan Aydınlatması) box:', bDev2);

  // Verification 1: Energy and Device 1 are in the SAME row! (same y position, side-by-side)
  const isSameRow1 = Math.abs(bEnergy.y - bDev1.y) < 5;
  console.log('Energy and Salon Lambası on same row?', isSameRow1);

  // Verification 2: Salon Lambası is to the right of Energy
  const isRightOfEnergy = bDev1.x > bEnergy.x;
  console.log('Salon Lambası to the right of Energy?', isRightOfEnergy);

  // Verification 3: Device 2 is on the next row below Energy
  const isNextRow = bDev2.y > bEnergy.y;
  console.log('Tavan Aydınlatması on next row?', isNextRow);

  const shotsDir = path.join(__dirname, '..', '.audit-shots');
  if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });

  const shotPath = path.join(shotsDir, 'home-grid-2-devices.png');
  await page.screenshot({ path: shotPath, fullPage: false });
  console.log('Screenshot saved to:', shotPath);

  // Test 2: With 0 devices (checking the 4th slot Cihaz Ekle card)
  await page.evaluate(() => {
    localStorage.setItem('nexusPairedDevices', '[]');
    localStorage.removeItem('nexusDashboardCards');
    renderDevices();
  });
  await page.waitForTimeout(300);

  const addCard = await page.$('#dyn-card-add-device');
  const bAdd = await addCard.boundingBox();
  const bEnergy2 = await (await page.$('#card-energy')).boundingBox();
  console.log('Add card box:', bAdd);
  console.log('Energy box with 0 devices:', bEnergy2);

  const isSameRowAdd = Math.abs(bEnergy2.y - bAdd.y) < 5;
  console.log('Energy and Cihaz Ekle card on same row when 0 devices?', isSameRowAdd);

  const shotPathEmpty = path.join(shotsDir, 'home-grid-0-devices.png');
  await page.screenshot({ path: shotPathEmpty, fullPage: false });
  console.log('Screenshot saved to:', shotPathEmpty);

  await browser.close();

  if (isSameRow1 && isRightOfEnergy && isNextRow && isSameRowAdd) {
    console.log('SUCCESS: All grid assertions passed!');
    process.exit(0);
  } else {
    console.error('FAILURE: Grid layout assertions failed.');
    process.exit(1);
  }
})();
