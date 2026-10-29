# NEXUS — QA Ladder

What is verified automatically, on which channel, and what still needs a
human with hardware. Last recorded run: **2026-10-29** (Windows host, Node 24,
pnpm 10).

## Always-on (CI, every push/PR)

| Gate | Channel | Last result |
| --- | --- | --- |
| Typecheck (`tsc --noEmit`) | `ci.yml` → build | ✅ clean |
| Unit + integration suite (vitest) | `ci.yml` → build | ✅ 68 files / **1045/1045** |
| Mirror & hygiene guards (byte-identity `src/app ↔ www`, 62-screen invariant, no `stitch` residue, no `scripts/` junk) | inside the suite | ✅ |
| Brand assets (launcher/splash, 26 Android densities + iOS) | inside the suite | ✅ |
| Prettier format check | `ci.yml` → build | ✅ |
| Dependency audit ≥ high | `ci.yml` → security | ✅ 0 open (2026-10-29) |
| Site bundle secret scan (`service_role` grep) | `web-deploy.yml` | ✅ |
| Translation coverage gate | `audit:i18n:coverage` | ✅ **655/655 = 100%** |

## Release channels (tag `v*` or `main` push)

| Channel | What it proves |
| --- | --- |
| `web-deploy.yml` | Site builds → smoke-verifies → deploys to `nexus-smarthome.pages.dev` |
| `desktop-release.yml` | Signed? no → unsigned but consistent Windows/Linux installers + checksums; macOS gated behind `MACOS_BUILD`, now signable via `MACOS_SIGN` (see below) |
| `android-release.yml` | Signed APK + `.sha256.txt` (keystore from secrets) |
| `release-catchup.yml` | Self-heals any release tag missing assets |

## Automated UI / flow audits (local host, `pnpm` scripts)

Recorded 2026-10-29 against the current `www/` mirror:

- **UI grid audit** (`node scripts/ui-audit.mjs --only=home,smart,pair,settings --profiles=phone,desktop --no-shots`):
  52 page/profile measurements across 13 pages → **no layout or functional
  failures**; 4 findings, all the *intentional* behavior of
  `nexus-smart-app-detail.html` redirecting to `nexus-smart.html` when opened
  without a device context.
- **Login / MFA flow** (Playwright/Chromium, phone viewport 420×750, via
  `scripts/local-dev-server.cjs`):
  - Google button visible, MFA step hidden on load ✅
  - `showMfaStep()` reveals the MFA form ✅
  - Logged-out visit to `nexus-home.html` redirects to `nexus-onboarding.html` ✅
  - **0 uncaught page errors** ✅

## Requires a human (cannot be faked — house rule number 1)

- **Real-device LAN QA**: power-cycling a real Shelly/Tasmota/Kasa device and
  re-running `node scripts/verify-lan-e2e.mjs`, recording the transcript here.
- **macOS signing/notarization**: request Apple Developer credentials, then
  set repo *secrets* `MACOS_IDENTITY`, `APPLE_ID`,
  `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`, set *variable*
  `MACOS_SIGN=true` and rebuild a `v*` tag. The unsigned build remains the
  default until then.
- **Third app language**: `lang-en.js` is a full overlay (~2.9k keys) behind a
  100%-coverage gate; a third language needs committed translations, not a
  partial skeleton (the gate would fail it — by design).
