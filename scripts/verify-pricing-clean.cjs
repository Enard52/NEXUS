const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:8766/public/tr/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  const pricingSection = await page.$('#pricing');
  const planLogos = await page.$$('.plan-logo');
  console.log('Number of .plan-logo elements found in DOM:', planLogos.length);

  const shotsDir = path.join(__dirname, '..', '.audit-shots');
  const pricingShot = path.join(shotsDir, 'pricing-clean.png');
  if (pricingSection) {
    await pricingSection.screenshot({ path: pricingShot });
    console.log('Pricing screenshot saved to:', pricingShot);
  }

  await browser.close();

  if (planLogos.length === 0) {
    console.log('SUCCESS: Plan card logo icons completely removed!');
    process.exit(0);
  } else {
    console.error('FAILURE: Plan logo icons still present.');
    process.exit(1);
  }
})();
