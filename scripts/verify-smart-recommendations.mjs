import { chromium } from 'playwright';

const baseUrl = 'http://127.0.0.1:8098';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 430, height: 932 } });

  const failures = [];

  await page.goto(baseUrl + '/stitch-smart.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('nexusPairedDevices', JSON.stringify([
      { name: 'Salon Klima', icon: 'cpu' },
      { name: 'Koridor Isik', icon: 'lightbulb' }
    ]));
    localStorage.setItem('nexusCustomClickRun', JSON.stringify([
      { title: 'Benim Senaryom', desc: 'Elle olusturuldu', icon: 'sparkles', bgClass: 'bg-blue-500/10', colorClass: 'text-blue-500' }
    ]));
    localStorage.setItem('nexusCustomAutomations', JSON.stringify([
      { title: 'Ev Modu', desc: 'Elle olusturuldu', icon: 'home', bgClass: 'bg-emerald-500/10', colorClass: 'text-emerald-500' }
    ]));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);

  const smartTitles = await page.locator('[data-smart-recommendation-title]').allTextContents();
  if (!smartTitles.some(title => /iklim|klima/i.test(title))) {
    failures.push('Expected a climate recommendation when a climate device exists.');
  }
  if (!smartTitles.some(title => /isik|aydinlatma/i.test(title))) {
    failures.push('Expected a lighting recommendation when a lighting device exists.');
  }

  const aiCreateButtons = await page.locator('[data-smart-ai-create]').count();
  if (aiCreateButtons < 1) {
    failures.push('Expected smart recommendation cards to include a direct AI create action.');
  }

  await page.locator('#btn-tab-clickrun').click();
  await page.waitForTimeout(250);
  const quickRunRecommendations = await page.locator('[data-recommended-quickrun]').count();
  if (quickRunRecommendations < 1) {
    failures.push('Expected the Click-Run tab to render recommended quick actions.');
  }

  const clickFilterCount = await page.locator('[data-clickrun-filter]').count();
  if (clickFilterCount < 2) {
    failures.push('Expected Click-Run filters to exist.');
  }

  await page.locator('#btn-tab-automation').click();
  await page.waitForTimeout(250);
  const automationFilterCount = await page.locator('[data-automation-filter]').count();
  if (automationFilterCount < 2) {
    failures.push('Expected Automation filters to exist.');
  }

  await page.goto(baseUrl + '/stitch-chat.html?promptText=Merhaba%20NEXUS', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  const chatMessages = await page.locator('#chat-messages').textContent();
  if (!/Merhaba NEXUS/i.test(chatMessages || '')) {
    failures.push('Expected chat to auto-send a ready prompt from the query string.');
  }

  await page.goto(baseUrl + '/stitch-home.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  const helperActionCount = await page.locator('[data-ai-helper-action]').count();
  if (helperActionCount < 1) {
    failures.push('Expected a functional AI helper action in the shared AI input.');
  }

  await browser.close();

  if (failures.length > 0) {
    console.error('verify-smart-recommendations: FAIL');
    failures.forEach(failure => console.error('- ' + failure));
    process.exit(1);
  }

  console.log('verify-smart-recommendations: PASS');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
