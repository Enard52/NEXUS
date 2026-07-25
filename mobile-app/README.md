# NEXUS Mobile App

Native Android & iOS application wrapping the NEXUS mobile web UI via [Capacitor](https://capacitorjs.com/).

The app loads the same premium HTML/CSS/JS mobile interface that powers `public/mobile/` inside a native WebView shell — single source of truth for the design, zero duplicated UI code.

## Prerequisites

- **Node.js** ≥ 20
- **Android**: Android Studio or Android SDK command-line tools (SDK 34+, build-tools 34.0.0+)
- **iOS** (macOS only): Xcode 15+, CocoaPods

## Quick Start

```bash
# Install dependencies
npm install

# Build the web bundle (copies public/mobile/ → www/ with path rewrites)
npm run build:web

# Sync to both native platforms
npx cap sync
```

## Android

### Build & Run from CLI

```bash
# Build + sync + launch on connected device/emulator
npm run run:android
```

### Build APK Manually

```bash
npm run build:web
npx cap sync android
cd android
./gradlew assembleDebug
# APK at: android/app/build/outputs/apk/debug/app-debug.apk
```

### Open in Android Studio

```bash
npm run android    # build:web + sync + opens Android Studio
```

## iOS (macOS only)

```bash
# Build + sync + open in Xcode
npm run ios
```

Then in Xcode:
1. Select a simulator or connected device
2. Build & Run (⌘R)

> **Note:** `pod install` runs automatically on macOS during `cap sync`. On Windows, pods are not installed — run `pod install` inside `ios/App` on macOS before first build.

## Project Structure

```
mobile-app/
├─ capacitor.config.json      # Capacitor config (appId, webDir, etc.)
├─ package.json               # Dependencies & scripts
├─ scripts/
│  └─ build-web.mjs           # Bundle builder: copies HTML + fonts, rewrites paths
├─ www/                       # Generated web bundle (gitignored, rebuilt by build:web)
│  ├─ index.html              # Main page (dark theme)
│  ├─ light.html              # Light theme variant
│  ├─ tr/                     # Turkish locale variants
│  └─ fonts/                  # woff2 font files
├─ android/                   # Android native project (Capacitor-generated)
└─ ios/                       # iOS native project (Capacitor-generated)
```

## Bundle Builder (`scripts/build-web.mjs`)

The mobile web UI references fonts with root-relative paths (`/fonts/...`). In the Capacitor WebView, root-relative URLs resolve against the app origin and break. The builder rewrites every `/fonts/...` to `fonts/...` so the bundle is fully self-contained and offline.

## Updating the App

1. Modify the mobile UI in `packages/mobile/src/index.ts`
2. Rebuild: `pnpm build:static` (from repo root)
3. Rebuild native bundle: `cd mobile-app && npm run build:web && npx cap sync`
4. Rebuild & deploy the native app

## License

UNLICENSED — NEXUS Technologies Inc.
