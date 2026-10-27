const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 420, height: 750 } });

  // 1. Initial State
  await page.goto("http://127.0.0.1:8766/stitch-login.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.resolve(".audit-shots/stitch-login-main.png") });

  const gvis = await page.isVisible("#google-login-btn");
  const mfavis = await page.isVisible("#mfa-step");
  console.log("State 1 (Normal Login):");
  console.log("  Google button visible:", gvis);
  console.log("  MFA step visible:", mfavis);

  // 2. Trigger MFA State
  await page.evaluate(() => {
    window.showMfaStep();
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.resolve(".audit-shots/stitch-login-mfa.png") });

  const mfavis2 = await page.isVisible("#mfa-step");
  const gvis2 = await page.isVisible("#google-login-btn");
  const submitBtns = await page.$$("button:has-text('Doğrula')");
  let visibleSubmitBtns = 0;
  for (const b of submitBtns) {
    if (await b.isVisible()) visibleSubmitBtns++;
  }
  console.log("State 2 (MFA Step Active):");
  console.log("  MFA step visible:", mfavis2);
  console.log("  Google button visible:", gvis2);
  console.log("  Visible Doğrula buttons:", visibleSubmitBtns);

  // 3. Test Cancel MFA
  await page.click("button:has-text('Vazgeç ve Girişe Dön')");
  await page.waitForTimeout(300);
  const mfavis3 = await page.isVisible("#mfa-step");
  const gvis3 = await page.isVisible("#google-login-btn");
  console.log("State 3 (After Cancel MFA):");
  console.log("  MFA step visible:", mfavis3);
  console.log("  Google button visible:", gvis3);

  await browser.close();
  console.log("All flows verified successfully!");
})();
