# Building NEXUS for every platform

NEXUS is a single-source project: one codebase drives the web site, the desktop
program (Electron) and the mobile app (Capacitor). A change made once propagates
to every shell through the sync pipeline — no per-platform code duplication.

```
root (single source: nexus-*.html + JS + CSS)
 ├─ npm run sync:www                  → www/            (web + sync pipeline)
 │    └─ npm run site:build           → www/public/     (marketing site → Cloudflare Pages)
 ├─ node desktop/scripts/prepare-app.cjs → desktop/app/  (Electron shell)
 ├─ npx cap sync android              → android/...     (Capacitor APK shell)
 └─ scripts/sync-www.mjs (automatic)  → ios/App/App/public (Capacitor iOS shell, synced here too)
```

## What ships today

| Platform | Package | How |
| --- | --- | --- |
| Windows x64 + arm64 | NSIS installer (`NEXUS-Setup.exe`) | `npx electron-builder --win` |
| Linux x64 | AppImage + deb (`NEXUS-linux.*`) | `npx electron-builder --linux` |
| Android | Signed APK (`NEXUS-Android.apk`) | `npx cap sync android` + Gradle release build |
| Web | Marketing site + account/downloads | `npm run site:build` → Cloudflare Pages |

Release automation: tag `v*` → `.github/workflows/desktop-release.yml` +
`android-release.yml` build and publish everything with checksums and SBOM.

## Prepared and ready (flip a flag)

| Platform | State | How to activate |
| --- | --- | --- |
| **macOS** | electron-builder config already has `mac` targets (dmg + zip, universal, unsigned) and `main.cjs` is darwin-aware (tray PNG fallback, login-item guards). CI job exists. | Set the repo variable `MACOS_BUILD = true`, then re-run the tag workflow. Unsigned dmg (Gatekeeper: right-click → Open). **Project policy: unsigned only — no Apple Developer account.** |
| **iOS** | Capacitor shell already synced in `ios/App` (assets auto-refresh on every `npm run sync:www`). Native build requires macOS + Xcode + a free Apple ID (free-account signing renews every 7 days; personal use). | On a Mac: `npm install && npm run build:full`, then `npx cap sync ios`, open `ios/App/App.xcworkspace` in Xcode, build. |

## Building locally (any OS with Node 22)

```bash
npm install          # pnpm install also works
npm run build:full   # assets + sync www
npm test             # 980+ unit/guard tests

# Desktop shells
node desktop/scripts/prepare-app.cjs
cd desktop && npx electron-builder --win --linux --mac   # pick your OS target

# Mobile shells
npx cap sync android && cd android && ./gradlew assembleRelease
npx cap sync ios && open ios/App/App.xcworkspace        # macOS only
```

Platform parity rules the project follows (see `CLAUDE.md`):

- One change in the root source reaches www → desktop → android → iOS through the
  sync pipeline; generated folders are never edited by hand.
- Platform-specific behaviour lives behind `process.platform` (desktop) or
  `Capacitor.getPlatform()` (mobile) checks with graceful fallbacks — every shell
  stays feature-honest on every OS.
