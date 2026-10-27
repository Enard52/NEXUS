const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:8766/public/tr/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  const footer = await page.$('footer.ft');
  const footerText = await footer.textContent();

  const hasPrivacyText = footerText.includes('Cihaz komutları yerel ağında çalışır');
  console.log('Does footer contain "Cihaz komutları yerel ağında çalışır"?', hasPrivacyText);

  const ftPrivacy = await page.$('.ft-privacy');
  console.log('Does .ft-privacy element exist in DOM?', ftPrivacy !== null);

  const shotsDir = path.join(__dirname, '..', '.audit-shots');
  const footerShot = path.join(shotsDir, 'footer-clean.png');
  await footer.screenshot({ path: footerShot });
  console.log('Footer screenshot saved to:', footerShot);

  await browser.close();

  if (!hasPrivacyText && ftPrivacy === null) {
    console.log('SUCCESS: Footer privacy text completely removed!');
    process.exit(0);
  } else {
    console.error('FAILURE: Footer still has privacy text.');
    process.exit(1);
  }
})();
