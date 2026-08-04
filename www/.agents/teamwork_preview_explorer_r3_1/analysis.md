# Comprehensive Architectural & Code Analysis Report: R3 & R4 (Installer Fixes & Desktop App Overhaul)

## Executive Summary

This report presents a forensic investigation of the NEXUS codebase for requirements **R3 (Installer Fixes)** and **R4 (Desktop App Overhaul)**. The investigation covers 10 primary target files, associated test suites, asset generation tools, and server routing mechanisms. All 300 existing Vitest tests currently pass. This document details exact line numbers, code deficiencies, proposed implementation blueprints (with before/after diffs), and verification procedures to prepare for implementation.

---

## Scope & Target Files Index

| Requirement Module | File Path | Line Range | Role / Purpose |
|---|---|---|---|
| R3.1, R3.2 | `installer/wizard.html` | 17, 350–361, 564–585, 605–626, 731–743 | Setup wizard UI layout, license text block, logo SVGs, primary color token |
| R3.3 | `packages/desktop/src/setup.ts` | 431–452, 618 | Desktop setup renderer, multi-platform paths & descriptions |
| R3.4, R4.5 | `installer/main.js` | 6, 72–80 | Setup wizard Electron main process (appName, AppUserModelId) |
| R3.4, R4.5 | `installer/package.json` | 4 | Setup wizard package metadata |
| R4.1, R4.2, R4.5 | `desktop-app/main.cjs` | 1, 15, 21, 35, 105–108 | Desktop app Electron main process (root URL, window titles, UA) |
| R4.2, R4.5 | `packages/server/src/app.ts` | 255–257, 686–701, 756–774 | Sync server routes (`/app`, `/login`), User-Agent desktop detector |
| R4.3 | `scripts/gen-icons.cjs` | 23, 108–161, 229–248 | Dependency-free brand icon generator (`icon.png`, `icon.ico`, `tray.png`) |
| R4.3 | `desktop-app/gen-tray-icon.cjs` | 15, 87–90 | Tray icon generator script |
| R4.4, R4.5 | `packages/desktop/src/index.ts` | 61–158, 250, 280 | Desktop UI renderer & CSS styles (glass-morphism, animations, typography) |
| R4.4, R4.5 | `packages/desktop/src/utils.ts` | 10–31, 34–52 | Desktop window controls & sidebar navigation icon primitives |

---

## Detailed Requirement-by-Requirement Analysis

### R3. Phase 3: Installer Fixes

#### R3.1: Format License Text with Proper Spacing and Bold Headers (`installer/wizard.html`)
- **Current Observation**:
  In `installer/wizard.html` lines 731–743, the license agreement text inside `<div class="license-box">` is rendered as a single unformatted, continuous string of text without line breaks or visual structure.
  ```html
  731: <div class="license-box">
  732:   NEXUS AI YAZILIM LİSANS SÖZLEŞMESİ Telif Hakkı © 2026 NEXUS Technologies Inc. Tüm
  733:   hakları saklıdır. LÜTFEN YAZILIMI YÜKLEMEDEN VEYA KULLANMADAN ÖNCE BU LİSANS
  734:   SÖZLEŞMESİNİ DİKKATLE OKUYUN. 1. LİSANS VERİLMESİ. Bu Sözleşmenin koşullarına tabi
  735:   olarak NEXUS Technologies, NEXUS AI'yı yalnızca kişisel, ticari olmayan amaçlarınız
  736:   için yüklemeniz ve kullanmanız amacıyla size münhasır olmayan, devredilemez bir lisans
  737:   verir. 2. KISITLAMALAR. Şunları yapamazsınız: ...
  743: </div>
  ```
- **Proposed Solution**:
  Reformat the contents of `<div class="license-box">` to use semantic paragraph tags (`<p>`), bold headings (`<strong>`), and explicit spacing between articles. In addition, ensure CSS `.license-box` (lines 350–361) supports clean line heights (`line-height: 1.6`) and paragraph margins.
- **Blueprint**:
  ```html
  <div class="license-box">
    <p><strong>NEXUS AI YAZILIM LİSANS SÖZLEŞMESİ</strong></p>
    <p>Telif Hakkı © 2026 NEXUS Technologies Inc. Tüm hakları saklıdır.</p>
    <br />
    <p>LÜTFEN YAZILIMI YÜKLEMEDEN VEYA KULLANMADAN ÖNCE BU LİSANS SÖZLEŞMESİNİ DİKKATLE OKUYUN.</p>
    <br />
    <p><strong>1. LİSANS VERİLMESİ.</strong> Bu Sözleşmenin koşullarına tabi olarak NEXUS Technologies, NEXUS AI'yı yalnızca kişisel, ticari olmayan amaçlarınız için yüklemeniz ve kullanmanız amacıyla size münhasır olmayan, devredilemez bir lisans verir.</p>
    <br />
    <p><strong>2. KISITLAMALAR.</strong> Şunları yapamazsınız: (a) Yazılımı kopyalamak, değiştirmek veya dağıtmak; (b) Yazılıma tersine mühendislik uygulamak; (c) Yazılımı alt lisanslamak veya satmak.</p>
    <br />
    <p><strong>3. GİZLİLİK.</strong> Yazılım öncelikle cihaz üzerinde çalışır. Tüm bulut özellikleri açık onay gerektirir ve ayrı Gizlilik Politikasına tabidir.</p>
    <br />
    <p><strong>4. FERAGAT.</strong> YAZILIM HERHANGİ BİR GARANTİ OLMAKSIZIN "OLDUĞU GİBİ" SAĞLANIR.</p>
    <br />
    <p><strong>5. FESHETME.</strong> Bu lisans, buradaki herhangi bir şartın ihlali durumunda otomatik olarak sona erer.</p>
  </div>
  ```

---

#### R3.2: Update Installer Logo to Match Web Gradient Logo (`installer/wizard.html`)
- **Current Observation**:
  In `installer/wizard.html`:
  1. Primary CSS variable at line 17: `:root { --primary: #5b8dff; ... }`. Per Acceptance Criteria #72, the installer primary color must be `#7C5CFF` (matching `@nexus/design-system` dark theme primary).
  2. Titlebar logo SVG at lines 564–585:
     ```html
     <rect width="32" height="32" rx="6" fill="#5b8dff" />
     <text x="16" y="22" font-size="18" font-weight="bold" text-anchor="middle" fill="white" font-family="system-ui, 'Segoe UI', sans-serif">N</text>
     ```
  3. Rail logo SVG at lines 605–626:
     ```html
     <rect width="32" height="32" rx="6" fill="#5b8dff" />
     <text x="16" y="22" font-size="18" font-weight="bold" text-anchor="middle" fill="white" font-family="system-ui, 'Segoe UI', sans-serif">N</text>
     ```
  Both logos are flat solid blue squares with text "N", rather than the SVG gradient N logo defined in `packages/web/src/render.ts` (`renderLogo()`).
- **Proposed Solution**:
  1. Change CSS `--primary` in `installer/wizard.html` line 17 from `#5b8dff` to `#7C5CFF`.
  2. Replace both hardcoded text-based logo SVGs with the full linear-gradient logo mark:
     ```html
     <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="NEXUS logo" role="img">
       <defs>
         <linearGradient id="nxlogo" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
           <stop stop-color="#6f9bff"/><stop offset="0.55" stop-color="#7C5CFF"/><stop offset="1" stop-color="#8b7bff"/>
         </linearGradient>
         <linearGradient id="nxsheen" x1="16" y1="1" x2="16" y2="17" gradientUnits="userSpaceOnUse">
           <stop stop-color="#ffffff" stop-opacity="0.30"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
         </linearGradient>
       </defs>
       <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxlogo)"/>
       <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxsheen)"/>
       <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="#ffffff" stroke-opacity="0.22"/>
       <path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
     </svg>
     ```

---

#### R3.3: Multi-Platform Installer Paths and Descriptions (`packages/desktop/src/setup.ts`)
- **Current Observation**:
  In `packages/desktop/src/setup.ts` lines 431–452, `stepLocation()` takes zero parameters and hardcodes the Windows installation path `C:\Program Files\NEXUS`:
  ```ts
  function stepLocation(): string {
    const isTr = CURRENT_LOCALE === "tr";
    return (
      `<h2>${isTr ? "Kurulum Konumu" : "Installation Location"}</h2>` +
      ...
      `<input type="text" id="install-path" value="C:\\Program Files\\NEXUS" aria-label="Installation path">` +
      ...
    );
  }
  ```
  However, `renderSetupDocument` (line 504) accepts `os?: "windows" | "mac"`.
- **Proposed Solution**:
  Update `stepLocation(os: "windows" | "mac" = "windows")` to dynamically populate:
  - Default path:
    - Windows: `C:\Program Files\NEXUS`
    - macOS: `/Applications/NEXUS.app`
  - Descriptive text:
    - Windows TR/EN: "NEXUS AI uygulamasının nereye yükleneceğini seçin. Çoğu kullanıcı için varsayılan konum önerilir." / "Choose where NEXUS AI will be installed. The default location is recommended for most users."
    - macOS TR/EN: "NEXUS AI uygulamasının nereye yükleneceğini seçin. macOS için /Applications klasörü önerilir." / "Choose where NEXUS AI will be installed. The /Applications folder is recommended on macOS."
  - Pass `os` from `renderSetupDocument` to `stepLocation(os)` on line 618.

---

#### R3.4: Hide "Electron" Name in Installer (`installer/main.js`, `installer/package.json`)
- **Current Observation**:
  1. `installer/main.js`: Does not call `app.setName(...)` or `app.setAppUserModelId(...)`. On Windows systems, Electron applications default to process name `Electron` in Windows Task Manager and Windows Notification Center if not explicitly set.
  2. `installer/package.json` line 4:
     `"description": "NEXUS AI — real, runnable Windows setup wizard (Electron)"`
- **Proposed Solution**:
  1. In `installer/main.js`, configure identity properties before creating windows:
     ```js
     app.setName("NEXUS Setup");
     app.setAppUserModelId("ai.nexus.setup");
     ```
  2. In `installer/package.json`, remove "(Electron)" from `description`:
     `"description": "NEXUS AI — real, runnable Windows setup wizard"`

---

### R4. Phase 4: Desktop App Overhaul

#### R4.1: Fix Desktop App Root URL to `/app` Instead of `/` (`desktop-app/main.cjs`)
- **Current Observation**:
  In `desktop-app/main.cjs` line 21:
  `const APP_URL = http://localhost:${PORT}/;`
  `win.loadURL(APP_URL)` loads `http://localhost:4178/`, which serves the marketing landing page (`renderMarketingDocument`) instead of the authenticated application interface (`/app`).
- **Proposed Solution**:
  Update line 21 in `desktop-app/main.cjs`:
  `const APP_URL = http://localhost:${PORT}/app;`
  (Keep server probing in `probeServer()` targeting `http://localhost:${PORT}/` so connectivity health checks succeed whether signed in or out).

---

#### R4.2: Ensure Login Redirection Works (`desktop-app/main.cjs` & `packages/server/src/app.ts`)
- **Current Observation**:
  In `packages/server/src/app.ts` lines 756–757:
  ```ts
  if (path === "/app" && method === "GET") {
    if (!account) return redirect(res, "/login");
  ```
  When the desktop app opens `http://localhost:4178/app` without an active session cookie, the server redirects (302) to `/login`. Once the user logs in via `/api/login` or `/api/guest`, the server sets cookie `nx_session` and redirects to `/app`.
  In `desktop-app/main.cjs` lines 105–106:
  ```js
  const ua = `${win.webContents.getUserAgent()} NexusDesktop/3.14.2`;
  win.webContents.setUserAgent(ua);
  ```
  The `NexusDesktop/3.14.2` User-Agent string ensures `isDesktopUserAgent(ua)` in `app.ts` returns `true`, rendering `renderDesktopAppDocument(account, data)`.
  In `desktop-app/main.cjs` line 112–116:
  `win.webContents.setWindowOpenHandler` allows in-app navigation for `http://localhost` while opening external URLs in the system default browser.
- **Proposed Solution**:
  Verify that navigation to `/login` and post-login redirection to `/app` functions smoothly within the Electron webContents frame.

---

#### R4.3: Update App Icons Using Gradient N Logo (`scripts/gen-icons.cjs`, `assets/`)
- **Current Observation**:
  In `scripts/gen-icons.cjs` line 23:
  `const BRAND = [91, 141, 255, 255]; // #5b8dff`
  The generator draws a flat, solid `#5b8dff` background rather than a primary gradient matching `#7C5CFF` to `#8B7BFF`.
  Same in `desktop-app/gen-tray-icon.cjs` line 15.
- **Proposed Solution**:
  Update `scripts/gen-icons.cjs` to sample a brand gradient from `#7C5CFF` (or `#6F9BFF`) to `#8B7BFF`.
  Regenerate raster icons for both `desktop-app/assets` and `installer/assets`:
  - `icon.png` (512x512 RGBA)
  - `icon.ico` (multi-resolution ICO: 256, 128, 64, 48, 32, 16)
  - `tray.png` (32x32 RGBA)

---

#### R4.4: Enrich Desktop UI with Premium Touches (`packages/desktop/src/index.ts`, `packages/desktop/src/utils.ts`)
- **Current Observation**:
  In `packages/desktop/src/index.ts` lines 61–158:
  - Font family uses token: `font-family: ${t.font.family};` (which maps to `'Space Grotesk', 'Inter', system-ui, sans-serif`).
  - `.window` border (line 79) is basic `1px solid var(--surface)`.
  - `.sidebar` (line 116) lacks glass-morphism backdrop filter and subtle border highlights.
- **Proposed Solution**:
  1. Add Space Grotesk Google Font `@import` to `renderDesktopStyles` header:
     `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');`
  2. Enhance `.window` styling with subtle neon gradient border and dual-layer shadow:
     ```css
     border: 1px solid color-mix(in srgb, var(--primary) 22%, var(--surface));
     box-shadow: 0 32px 80px rgba(0, 0, 0, 0.65), 0 0 1px 1px color-mix(in srgb, var(--primary) 25%, transparent);
     ```
  3. Enhance `.sidebar` styling with glass-morphism:
     ```css
     background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 92%, var(--primary) 8%) 0%, var(--surface) 100%);
     backdrop-filter: blur(16px);
     border-right: 1px solid color-mix(in srgb, var(--text) 8%, transparent);
     ```
  4. Refine hover and active states for navigation links and window control buttons.

---

#### R4.5: Ensure Brand Name "NEXUS" Appears Everywhere (`desktop-app/main.cjs`, `desktop-app/package.json`, `packages/desktop/src/utils.ts`)
- **Current Observation**:
  1. `desktop-app/main.cjs`: Missing explicit process identity configuration (`app.setName("NEXUS")` and `app.setAppUserModelId("ai.nexus.desktop")`).
  2. `desktop-app/package.json` line 4: Description contains `(Electron)`.
  3. `installer/package.json` line 4: Description contains `(Electron)`.
  4. Code comments in `desktop-app/main.cjs` and `installer/main.js` reference `Electron main process`.
- **Proposed Solution**:
  1. Add `app.setName("NEXUS");` and `app.setAppUserModelId("ai.nexus.desktop");` at the top of `desktop-app/main.cjs`.
  2. Update descriptions in `desktop-app/package.json` and `installer/package.json` to eliminate visible developer tool names.
  3. Ensure all user-facing strings, tooltips, taskbar badges, and window titles exclusively display "NEXUS".

---

## Comprehensive Proposed Code Changes Blueprint

### Blueprint 1: `installer/wizard.html`
```diff
--- installer/wizard.html
+++ installer/wizard.html
@@ 17 @@
-        --primary: #5b8dff;
+        --primary: #7C5CFF;

@@ 564,22 +564,26 @@
-        <svg
-          width="18"
-          height="18"
-          viewBox="0 0 32 32"
-          fill="none"
-          xmlns="http://www.w3.org/2000/svg"
-          aria-label="NEXUS logo"
-          role="img"
-        >
-          <rect width="32" height="32" rx="6" fill="#5b8dff" />
-          <text
-            x="16"
-            y="22"
-            font-size="18"
-            font-weight="bold"
-            text-anchor="middle"
-            fill="white"
-            font-family="system-ui, 'Segoe UI', sans-serif"
-          >
-            N
-          </text>
-        </svg>
+        <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="NEXUS logo" role="img">
+          <defs>
+            <linearGradient id="nxlogo-tb" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
+              <stop stop-color="#6f9bff"/><stop offset="0.55" stop-color="#7C5CFF"/><stop offset="1" stop-color="#8b7bff"/>
+            </linearGradient>
+            <linearGradient id="nxsheen-tb" x1="16" y1="1" x2="16" y2="17" gradientUnits="userSpaceOnUse">
+              <stop stop-color="#ffffff" stop-opacity="0.30"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
+            </linearGradient>
+          </defs>
+          <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxlogo-tb)"/>
+          <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxsheen-tb)"/>
+          <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="#ffffff" stroke-opacity="0.22"/>
+          <path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
+        </svg>

@@ 731,14 +735,21 @@
-            <div class="license-box">
-              NEXUS AI YAZILIM LİSANS SÖZLEŞMESİ Telif Hakkı © 2026 NEXUS Technologies Inc. Tüm
-              hakları saklıdır. LÜTFEN YAZILIMI YÜKLEMEDEN VEYA KULLANMADAN ÖNCE BU LİSANS
-              SÖZLEŞMESİNİ DİKKATLE OKUYUN. 1. LİSANS VERİLMESİ. Bu Sözleşmenin koşullarına tabi
-              olarak NEXUS Technologies, NEXUS AI'yı yalnızca kişisel, ticari olmayan amaçlarınız
-              için yüklemeniz ve kullanmanız amacıyla size münhasır olmayan, devredilemez bir lisans
-              verir. 2. KISITLAMALAR. Şunları yapamazsınız: (a) Yazılımı kopyalamak, değiştirmek
-              veya dağıtmak; (b) Yazılıma tersine mühendislik uygulamak; (c) Yazılımı alt
-              lisanslamak veya satmak. 3. GİZLİLİK. Yazılım öncelikle cihaz üzerinde çalışır. Tüm
-              bulut özellikleri açık onay gerektirir ve ayrı Gizlilik Politikasına tabidir. 4.
-              FERAGAT. YAZILIM HERHANGİ BİR GARANTİ OLMAKSIZIN "OLDUĞU GİBİ" SAĞLANIR. 5. FESHETME.
-              Bu lisans, buradaki herhangi bir şartın ihlali durumunda otomatik olarak sona erer.
-            </div>
+            <div class="license-box">
+              <p><strong>NEXUS AI YAZILIM LİSANS SÖZLEŞMESİ</strong></p>
+              <p>Telif Hakkı © 2026 NEXUS Technologies Inc. Tüm hakları saklıdır.</p>
+              <br />
+              <p>LÜTFEN YAZILIMI YÜKLEMEDEN VEYA KULLANMADAN ÖNCE BU LİSANS SÖZLEŞMESİNİ DİKKATLE OKUYUN.</p>
+              <br />
+              <p><strong>1. LİSANS VERİLMESİ.</strong> Bu Sözleşmenin koşullarına tabi olarak NEXUS Technologies, NEXUS AI'yı yalnızca kişisel, ticari olmayan amaçlarınız için yüklemeniz ve kullanmanız amacıyla size münhasır olmayan, devredilemez bir lisans verir.</p>
+              <br />
+              <p><strong>2. KISITLAMALAR.</strong> Şunları yapamazsınız: (a) Yazılımı kopyalamak, değiştirmek veya dağıtmak; (b) Yazılıma tersine mühendislik uygulamak; (c) Yazılımı alt lisanslamak veya satmak.</p>
+              <br />
+              <p><strong>3. GİZLİLİK.</strong> Yazılım öncelikle cihaz üzerinde çalışır. Tüm bulut özellikleri açık onay gerektirir ve ayrı Gizlilik Politikasına tabidir.</p>
+              <br />
+              <p><strong>4. FERAGAT.</strong> YAZILIM HERHANGİ BİR GARANTİ OLMAKSIZIN "OLDUĞU GİBİ" SAĞLANIR.</p>
+              <br />
+              <p><strong>5. FESHETME.</strong> Bu lisans, buradaki herhangi bir şartın ihlali durumunda otomatik olarak sona erer.</p>
+            </div>
```

### Blueprint 2: `installer/main.js` & `installer/package.json`
```diff
--- installer/main.js
+++ installer/main.js
@@ 6,2 +6,5 @@
 const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
+app.setName("NEXUS Setup");
+app.setAppUserModelId("ai.nexus.setup");

--- installer/package.json
+++ installer/package.json
@@ 4 @@
-  "description": "NEXUS AI — real, runnable Windows setup wizard (Electron)",
+  "description": "NEXUS AI — real, runnable Windows setup wizard",
```

### Blueprint 3: `packages/desktop/src/setup.ts`
```diff
--- packages/desktop/src/setup.ts
+++ packages/desktop/src/setup.ts
@@ 431,14 +431,21 @@
-function stepLocation(): string {
+function stepLocation(os: "windows" | "mac" = "windows"): string {
   const isTr = CURRENT_LOCALE === "tr";
+  const defaultPath = os === "mac" ? "/Applications/NEXUS.app" : "C:\\Program Files\\NEXUS";
+  const desc = isTr
+    ? (os === "mac"
+        ? "NEXUS AI uygulamasının nereye yükleneceğini seçin. macOS için /Applications klasörü önerilir."
+        : "NEXUS AI uygulamasının nereye yükleneceğini seçin. Çoğu kullanıcı için varsayılan konum önerilir.")
+    : (os === "mac"
+        ? "Choose where NEXUS AI will be installed. The /Applications folder is recommended on macOS."
+        : "Choose where NEXUS AI will be installed. The default location is recommended for most users.");
   return (
     `<h2>${isTr ? "Kurulum Konumu" : "Installation Location"}</h2>` +
-    `<p>${
-      isTr
-        ? "NEXUS AI uygulamasının nereye yükleneceğini seçin. Çoğu kullanıcı için varsayılan konum önerilir."
-        : "Choose where NEXUS AI will be installed. The default location is recommended for most users."
-    }</p>` +
+    `<p>${desc}</p>` +
     `<div class="field">` +
-    `<input type="text" id="install-path" value="C:\\Program Files\\NEXUS" aria-label="Installation path">` +
+    `<input type="text" id="install-path" value="${escapeHtml(defaultPath)}" aria-label="Installation path">` +
     ...
   );
 }

@@ 618 @@
-    location: stepLocation(),
+    location: stepLocation(os),
```

### Blueprint 4: `desktop-app/main.cjs` & `desktop-app/package.json`
```diff
--- desktop-app/main.cjs
+++ desktop-app/main.cjs
@@ 15,2 +15,5 @@
 const { app, BrowserWindow, Tray, Menu, ipcMain, shell, nativeImage } = require("electron");
+app.setName("NEXUS");
+app.setAppUserModelId("ai.nexus.desktop");

@@ 21 @@
-const APP_URL = `http://localhost:${PORT}/`;
+const APP_URL = `http://localhost:${PORT}/app`;

--- desktop-app/package.json
+++ desktop-app/package.json
@@ 4 @@
-  "description": "NEXUS AI — real desktop application (Electron): tray + background, loads the synced app.",
+  "description": "NEXUS AI — real desktop application: tray + background, loads the synced app.",
```

### Blueprint 5: `packages/desktop/src/index.ts`
```diff
--- packages/desktop/src/index.ts
+++ packages/desktop/src/index.ts
@@ 61,12 +61,16 @@
 export function renderDesktopStyles(t: DesignTokens): string {
-  return `${renderStyles(t)}
+  return `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
+${renderStyles(t)}
 ...
 .window {
   max-width: 1120px; margin: 0 auto; background: var(--bg);
-  border: 1px solid var(--surface); border-radius: ${t.radius.lg}px; overflow: hidden;
-  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
+  border: 1px solid color-mix(in srgb, var(--primary) 22%, var(--surface)); border-radius: ${t.radius.lg}px; overflow: hidden;
+  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6), 0 0 1px 1px color-mix(in srgb, var(--primary) 20%, transparent);
   animation: win-open 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
 }
 ...
 .sidebar {
-  width: 248px; flex: none; background: var(--surface); padding: ${t.space[5]}px;
+  width: 248px; flex: none; background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 92%, var(--primary) 8%) 0%, var(--surface) 100%);
+  backdrop-filter: blur(16px); padding: ${t.space[5]}px;
+  border-right: 1px solid color-mix(in srgb, var(--text) 8%, transparent); display: flex; flex-direction: column; gap: ${t.space[5]}px;
 }
```

---

## Verification & Test Plan

1. **Vitest Suite Validation**:
   - Command: `pnpm test`
   - Target: All 44 test files and 300 tests must pass cleanly.
   - Specific setup test assertions in `packages/desktop/src/setup.test.ts` and `packages/desktop/src/render.test.ts` verify:
     - `setup-window` markup and 5-step rail.
     - Monochrome window controls (`.wctl`).
     - Gradient logo rendering (`aria-label="NEXUS logo"`).
     - Theme tokens (`--primary:`).

2. **Zero Developer Tool Name Leak Verification**:
   - Command: `grep -ri "Electron" installer/ desktop-app/ packages/desktop/`
   - Verification: Ensure no user-facing string, process name (`app.setName`), or package metadata contains "Electron" or "Node.js".

3. **Desktop URL & Authentication Verification**:
   - Verify `desktop-app/main.cjs` loads `http://localhost:${PORT}/app`.
   - Verify unauthenticated requests redirect to `/login` and authenticated sessions display the desktop shell.
