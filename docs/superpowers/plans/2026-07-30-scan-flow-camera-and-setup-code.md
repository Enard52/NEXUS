# Scan Flow Camera And Setup Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the mobile scan flow so it uses a real camera preview, a full-screen setup-code entry screen, improved manual-add CTA layout, and working camera/torch permissions where the runtime supports them.

**Architecture:** Keep the scan experience in the existing static mobile HTML flow, but split the manual setup-code entry into its own full-screen page and move camera control into explicit runtime helpers. Use browser QR detection when available, keep a graceful fallback message when the current preview environment cannot expose camera or torch, and add native permission metadata for mobile wrappers.

**Tech Stack:** Static HTML, Tailwind CDN, vanilla JavaScript, localStorage, browser media APIs, optional `BarcodeDetector`, Capacitor iOS/Android manifests.

## Global Constraints

- Preserve the existing static mobile file structure across root, `www/`, and `mobile-app/www/`.
- Keep the scan UI aligned with the existing NEXUS visual language, not a direct copy of the reference screenshots.
- Use a full-screen setup-code entry page instead of a bottom sheet everywhere in the scan flow.
- Real camera and torch behavior must degrade honestly when the current environment cannot provide secure camera access.
- Native wrappers must declare camera/flash permissions needed for iOS and Android builds.

---

### Task 1: Add A Focused Regression Test Script For Scan Flow

**Files:**
- Create: `scripts/verify-scan-flow.mjs`
- Test: `scripts/verify-scan-flow.mjs`

**Interfaces:**
- Consumes: preview URL `http://127.0.0.1:8098`
- Produces: a one-shot verification script that checks scan UI structure and setup-code navigation

- [ ] **Step 1: Write the failing test**

```js
// scripts/verify-scan-flow.mjs
// Expected before implementation:
// - scan page does not show dedicated manual-add row
// - setup code still uses a sheet instead of full-page navigation
// - scan page lacks video preview surface
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/verify-scan-flow.mjs`
Expected: FAIL because the old scan page still contains the bottom sheet and no camera preview surface.

- [ ] **Step 3: Write minimal implementation**

```js
import { chromium } from "playwright";

// Assert for:
// - #camera-preview
// - link/button to stitch-setup-code.html
// - horizontal manual-add CTA
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/verify-scan-flow.mjs`
Expected: PASS after the new scan flow is implemented.

- [ ] **Step 5: Commit**

```bash
git add scripts/verify-scan-flow.mjs
git commit -m "test: add scan flow verification script"
```

### Task 2: Rebuild The Scan Page And Setup-Code Flow

**Files:**
- Modify: `stitch-scan.html`
- Modify: `www/stitch-scan.html`
- Modify: `mobile-app/www/stitch-scan.html`
- Create: `stitch-setup-code.html`
- Create: `www/stitch-setup-code.html`
- Create: `mobile-app/www/stitch-setup-code.html`
- Test: `scripts/verify-scan-flow.mjs`

**Interfaces:**
- Consumes: localStorage key `nexusPairedDevices`
- Produces: `openSetupCodeEntry()`, `appendPairedDeviceFromSetupCode(code)`, full-page code entry route

- [ ] **Step 1: Write the failing test**

Add assertions in `scripts/verify-scan-flow.mjs` for:

```js
expect(scanHtml).toContain('id="camera-preview"');
expect(scanHtml).toContain('stitch-setup-code.html');
expect(scanHtml).not.toContain('id="code-sheet"');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/verify-scan-flow.mjs`
Expected: FAIL because the old scan page still has `id="code-sheet"` and no `camera-preview`.

- [ ] **Step 3: Write minimal implementation**

Implement:

```html
<video id="camera-preview" ...></video>
<a href="stitch-setup-code.html">Kurulum Kodunu Girin</a>
<button id="manual-add-cta">QR bulunamadıysa manuel ekleyin</button>
```

and create `stitch-setup-code.html` with:

```html
<main class="min-h-screen bg-black text-white ...">
  <h1>Kurulum Kodunu Girin</h1>
  <input id="setup-code-input" />
  <button onclick="confirmSetupCode()">Devam Et</button>
</main>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/verify-scan-flow.mjs`
Expected: PASS with the new full-screen setup-code page and updated scan layout.

- [ ] **Step 5: Commit**

```bash
git add stitch-scan.html stitch-setup-code.html www/stitch-scan.html www/stitch-setup-code.html mobile-app/www/stitch-scan.html mobile-app/www/stitch-setup-code.html
git commit -m "feat: rebuild scan and setup-code flow"
```

### Task 3: Implement Real Camera, Torch, And QR Detection Helpers

**Files:**
- Modify: `stitch-scan.html`
- Modify: `www/stitch-scan.html`
- Modify: `mobile-app/www/stitch-scan.html`
- Test: `scripts/verify-scan-flow.mjs`

**Interfaces:**
- Consumes: `navigator.mediaDevices.getUserMedia`, `MediaStreamTrack.getCapabilities()`, optional `window.BarcodeDetector`
- Produces: `initCameraPreview()`, `toggleTorch()`, `scanLoop()`, honest unsupported-state messaging

- [ ] **Step 1: Write the failing test**

Extend `scripts/verify-scan-flow.mjs` to assert:

```js
expect(scanScript).toContain('navigator.mediaDevices.getUserMedia');
expect(scanScript).toContain('BarcodeDetector');
expect(scanScript).toContain('toggleTorch');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/verify-scan-flow.mjs`
Expected: FAIL because the old code has no full camera preview lifecycle or QR detection loop.

- [ ] **Step 3: Write minimal implementation**

Implement:

```js
async function initCameraPreview() { ... }
async function scanLoop() { ... }
async function toggleTorch() { ... }
```

with explicit fallbacks:

```js
showScanStatus("Bu önizleme ortamı kamerayı desteklemiyor.");
showTorchUnsupported("Bu cihaz veya bağlantı torch desteği sunmuyor.");
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/verify-scan-flow.mjs`
Expected: PASS and preview DOM contains camera/scan lifecycle hooks.

- [ ] **Step 5: Commit**

```bash
git add stitch-scan.html www/stitch-scan.html mobile-app/www/stitch-scan.html scripts/verify-scan-flow.mjs
git commit -m "feat: add camera and qr detection flow"
```

### Task 4: Add Native Camera Permission Metadata

**Files:**
- Modify: `mobile-app/ios/App/App/Info.plist`
- Modify: `mobile-app/android/app/src/main/AndroidManifest.xml`
- Test: manual file verification

**Interfaces:**
- Consumes: iOS Info.plist, Android manifest
- Produces: declared camera/flash permissions for native builds

- [ ] **Step 1: Write the failing test**

Use file assertions in `scripts/verify-scan-flow.mjs` or a manual note:

```text
Expected before implementation:
- Info.plist lacks NSCameraUsageDescription
- AndroidManifest lacks android.permission.CAMERA and flash capability
```

- [ ] **Step 2: Run test to verify it fails**

Run: inspect the files
Expected: FAIL because camera permission metadata is missing.

- [ ] **Step 3: Write minimal implementation**

Add:

```xml
<key>NSCameraUsageDescription</key>
<string>NEXUS cihaz kurulumu için kameraya erişir.</string>
```

and:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.FLASHLIGHT" />
<uses-feature android:name="android.hardware.camera.any" android:required="false" />
<uses-feature android:name="android.hardware.camera.flash" android:required="false" />
```

- [ ] **Step 4: Run test to verify it passes**

Run: inspect the files again
Expected: permission metadata exists in both native targets.

- [ ] **Step 5: Commit**

```bash
git add mobile-app/ios/App/App/Info.plist mobile-app/android/app/src/main/AndroidManifest.xml
git commit -m "chore: add mobile camera permissions"
```
