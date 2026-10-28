const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });

  // 1. Mobile verification
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 950 },
    deviceScaleFactor: 2
  });
  const page = await mobileCtx.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('nexusCurrentUser', 'Test User');
    localStorage.setItem('Test User_nexusPairedDevices', JSON.stringify([
      { id: 'dev-1', name: 'Salon Lambası', type: 'light', state: 'Açık', host: '192.168.1.50' },
      { id: 'dev-2', name: 'Tavan Aydınlatması', type: 'light', state: 'Kapalı', host: '192.168.1.51' }
    ]));
  });

  await page.goto('http://localhost:8766/stitch-home.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Check Favorites Section
  const weather = await page.$('#card-weather');
  const dnd = await page.$('#card-dnd');
  const energy = await page.$('#card-energy');
  const aiProtect = await page.$('#card-ai-protect');

  const bWeather = await weather.boundingBox();
  const bDnd = await dnd.boundingBox();
  const bEnergy = await energy.boundingBox();
  const bAiProtect = await aiProtect.boundingBox();

  console.log('--- FAVORITES GRID (MOBILE) ---');
  console.log('Weather (R1, C1):', bWeather.x, bWeather.y);
  console.log('DND (R1, C2):', bDnd.x, bDnd.y);
  console.log('Energy (R2, C1):', bEnergy.x, bEnergy.y);
  console.log('AI Protect (R2, C2):', bAiProtect.x, bAiProtect.y);

  // Row 1 alignment: Weather and DND must have same y
  const favRow1Aligned = Math.abs(bWeather.y - bDnd.y) < 3;
  // Row 2 alignment: Energy and AI Protect must have same y
  const favRow2Aligned = Math.abs(bEnergy.y - bAiProtect.y) < 3;
  // Column alignment: Weather and Energy same x; DND and AI Protect same x
  const col1Aligned = Math.abs(bWeather.x - bEnergy.x) < 3;
  const col2Aligned = Math.abs(bDnd.x - bAiProtect.x) < 3;

  console.log('Favoriler Row 1 aligned?', favRow1Aligned);
  console.log('Favoriler Row 2 aligned?', favRow2Aligned);
  console.log('Favoriler Column 1 aligned?', col1Aligned);
  console.log('Favoriler Column 2 aligned?', col2Aligned);

  // Check Devices Section
  const devTitle = await page.$('#devices-section h2');
  const devTitleText = (await devTitle.textContent()).trim();
  const devBadge = await page.$('#devices-count-badge');

  console.log('--- DEVICES SECTION ---');
  console.log('Devices Title text:', devTitleText);
  console.log('Devices Badge exists?', devBadge !== null);

  const dev1 = await page.$('#dyn-card-paired-0');
  const dev2 = await page.$('#dyn-card-paired-1');
  const bDev1 = await dev1.boundingBox();
  const bDev2 = await dev2.boundingBox();

  console.log('Device 1 (Salon Lambası):', bDev1.x, bDev1.y);
  console.log('Device 2 (Tavan Aydınlatması):', bDev2.x, bDev2.y);

  // Device 1 and Device 2 must share same y (side-by-side in 2-column grid)
  const devRowAligned = Math.abs(bDev1.y - bDev2.y) < 3;
  console.log('Devices side-by-side in same row?', devRowAligned);

  const shotsDir = path.join(__dirname, '..', '.audit-shots');
  if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });

  const shotMobile = path.join(shotsDir, 'categorized-home-mobile.png');
  await page.screenshot({ path: shotMobile, fullPage: false });
  console.log('Mobile screenshot saved to:', shotMobile);

  // 2. Desktop verification
  const deskCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  const deskPage = await deskCtx.newPage();

  await deskPage.addInitScript(() => {
    localStorage.setItem('nexusCurrentUser', 'Test User');
    localStorage.setItem('Test User_nexusPairedDevices', JSON.stringify([
      { id: 'dev-1', name: 'Salon Lambası', type: 'light', state: 'Açık', host: '192.168.1.50' },
      { id: 'dev-2', name: 'Tavan Aydınlatması', type: 'light', state: 'Kapalı', host: '192.168.1.51' },
      { id: 'dev-3', name: 'Akıllı Priz', type: 'plug', state: 'Açık', host: '192.168.1.52' }
    ]));
  });

  await deskPage.goto('http://localhost:8766/stitch-home.html', { waitUntil: 'networkidle' });
  await deskPage.waitForTimeout(600);

  const shotDesk = path.join(shotsDir, 'categorized-home-desktop.png');
  await deskPage.screenshot({ path: shotDesk, fullPage: false });
  console.log('Desktop screenshot saved to:', shotDesk);

  await browser.close();

  if (favRow1Aligned && favRow2Aligned && col1Aligned && col2Aligned && devRowAligned && devBadge === null && devTitleText === 'Cihazlar') {
    console.log('ALL VERIFICATIONS PASSED PERFECTLY: No badges on headers, perfect grid alignments!');
    process.exit(0);
  } else {
    console.error('VERIFICATION FAILED!');
    process.exit(1);
  }
})();
