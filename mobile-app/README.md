# NEXUS Mobile App

Native Android & iOS application shipping the shared NEXUS React SPA (`packages/client`) via [Capacitor](https://capacitorjs.com/).

The app bundles the exact same React application that the desktop shell and the web `/app` route run — single source of truth for the UI, zero duplicated code. The bundle talks to the user's NEXUS core over HTTP with bearer-token auth.

## Prerequisites

- **Node.js** ≥ 20
- **Android**: Android Studio or Android SDK command-line tools (SDK 34+, build-tools 34.0.0+)
- **iOS** (macOS only): Xcode 15+, CocoaPods

## Quick Start

```bash
# Install dependencies
npm install

# Build the web bundle (builds packages/client in mobile mode → www/)
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
│  └─ build-web.mjs           # Bundle builder: builds the React SPA (mobile mode) into www/
├─ www/                       # Generated web bundle (gitignored, rebuilt by build:web)
│  ├─ index.html              # SPA entry
│  ├─ assets/                 # Hashed JS/CSS chunks
│  └─ fonts/                  # woff2 font files
├─ android/                   # Android native project (Capacitor-generated)
└─ ios/                       # iOS native project (Capacitor-generated)
```

## Bundle Builder (`scripts/build-web.mjs`)

Runs `pnpm --filter @nexus/client build:mobile` (Vite build with relative base and bearer-token transport) and copies `packages/client/dist-mobile/` into `www/` so `cap sync` ships the exact same code as every other platform.

## Updating the App

1. Modify the shared UI in `packages/client/src/`
2. Rebuild native bundle: `cd mobile-app && npm run build:web && npx cap sync`
3. Rebuild & deploy the native app

## License

UNLICENSED — NEXUS Technologies Inc.
