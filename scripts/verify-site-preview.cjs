const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Open the marketing site served by localhost:8766 under /public/tr/index.html
  await page.goto('http://localhost:8766/public/tr/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const phoneMockup = await page.$('#phoneMockup');
  console.log('Phone mockup found on marketing site?', phoneMockup !== null);

  // Take a screenshot of the phone frame section on the landing page
  const shotsDir = path.join(__dirname, '..', '.audit-shots');
  const shotPath = path.join(shotsDir, 'site-phone-mockup.png');
  if (phoneMockup) {
    await phoneMockup.screenshot({ path: shotPath });
    console.log('Site phone mockup screenshot saved to:', shotPath);
  }

  await browser.close();
  console.log('Site phone verification complete!');
})();
