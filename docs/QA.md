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
- **Tap-sound engine e2e** (`nexusTapSoundsEnabled`, recorded with real
  Chromium; oscillator starts counted on the settings screen, 0 page errors):
  master sound OFF-click = 0 tones (pending tap dies with the master) ✅ ·
  ON-click = exactly one `toggle-on` (620 Hz) ✅ · `nav()` + `power()` in the
  same task = ONE sound, the tap is cancelled ✅ · double `nav()` = one tap
  (520 Hz, rate-limit) ✅ · taps disabled via the new "Dokunma Sesleri" row =
  silent click ✅ · re-enabling from the row = one confirmation tap ✅
- **HomeKit (HAP) bridge protocol e2e, v1.0.32** — against the REAL module
  `desktop/kit/bridge.cjs` (no mock), fresh persist dir → fresh identity
  (random MAC, default pin `154-87-269`, port 51826), driven by
  `hap-controller`, which implements the same protocol steps as the Apple Home
  app (SRP pair-setup, encrypted sessions). Transcript:
  1. `startKn` with a light (with brightness) + an outlet ▶ `running: true`,
     `accessoryCount: 2` ✅
  2. mDNS discovery matched by the published MAC (foreign bridges ignored) ✅
  3. `pairSetup(<pin>)` ▶ **EŞLEŞME: OK** ✅
  4. `getAccessories()` ▶ Lightbulb×1 (with Brightness) + Outlet×1 ✅
  5. Initial `On` read-back = `0`: start state is published **without**
     emitting `set` (`updateValue` guard added after the first run showed
     startup echoes that would command-spam real devices) ✅
  6. `setCharacteristics {"aid.10": true}` ▶ bridge `onCommand` log
     `{switch: true}` ▶ read-back `value: 1` ✅
  7. `setCharacteristics {"aid.bri": 40}` ▶ log `{brightness: 40}` ✅
  8. Outlet `On:=true` ▶ log `{switch: true}` ✅
  Verdict line: `KİT-E2E: TAMAM` (scratch log database under gitignored
  `.audit-shots/kit-e2e/`). Same flow the i18n suite tests app-side surfaces:
  suite total after this release is 1089/1089; i18n static coverage 657/657
  (100%). Honest boundary: nothing here claims a real iPhone completed the
  pairing — that is the human step below.

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
- **HomeKit: real iPhone/iPad pairing**: the bridge follows HomeKit
  `pairSetup` correctly (proven by `hap-controller` on the same machine), but
  an actual Apple Home pairing (device adds NEXUS bridge, real device flips
  observed end-to-end over Wi-Fi) still needs a human with an Apple device and
  an iPhone on the same LAN. When done, record the phone transcript here.
