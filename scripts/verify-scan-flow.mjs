import { chromium } from "playwright";

const BASE = process.env.SCAN_BASE || "http://127.0.0.1:8098";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(`${BASE}/stitch-scan.html`, { waitUntil: "networkidle" });

  const scanHtml = await page.content();
  assert(scanHtml.includes('id="camera-preview"'), "scan page missing #camera-preview");
  assert(scanHtml.includes("stitch-setup-code.html"), "scan page missing full-screen setup code link");
  assert(!scanHtml.includes('id="code-sheet"'), "scan page still contains bottom sheet setup UI");
  assert(scanHtml.includes("QR bulunamadıysa"), "scan page missing manual-add CTA copy");
  assert(scanHtml.includes("navigator.mediaDevices.getUserMedia"), "scan page missing camera init");
  assert(scanHtml.includes("BarcodeDetector"), "scan page missing QR detection hook");

  await page.goto(`${BASE}/stitch-setup-code.html`, { waitUntil: "networkidle" });
  const setupText = await page.locator("body").innerText();
  assert(setupText.includes("Kodunu Girin"), "setup page missing full-screen heading");
  assert(setupText.includes("Devam Et"), "setup page missing primary action");

  console.log("verify-scan-flow: PASS");
} finally {
  await browser.close();
}
