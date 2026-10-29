# NEXUS — Architecture Guide

This is the map of how the repo fits together — for contributors and reviewers.
The five-line version lives in the [README](../README.md); this file explains
the *why* behind each layer and the rules that keep it shippable.

> House rule (binding): **the app never pretends.** Unsupported means labelled
> unsupported. Failures are visible. See `CLAUDE.md` and the guard tests below.

---

## 1. Single source, four mirrors

Everything user-facing is edited exactly once, in `src/app` (+ root `css/`),
and mirrored to the shells by generated copies. **Never edit a mirror by hand.**

| Source | Mirrored to | By | Consumer |
| --- | --- | --- | --- |
| `src/app/*.js`, `index.html`, `sw.js`, `manifest.webmanifest`, `automation-worker.html` | `www/` | `node scripts/sync-www.mjs` | Web, and the `webDir` of Capacitor |
| `www/` (full, delete-copy) | `ios/App/App/public/` | same script (Windows) | iOS shell (Xcode build needs macOS) |
| `src/app` + `css/` | `desktop/app/` (gitignored) | `node desktop/scripts/prepare-app.cjs` | Electron shell, served via `nexus://` |
| `www/` (via cap sync) | `android/app/src/main/assets/public/` | `npx cap sync android` | Signed APK |

The 62 screens are `src/app/nexus-*.html` — a multi-page app (MPA). Each page
loads the same vanilla-JS module set and talks to the real device layer; there
is no router framework and no build step for app JS.

**Enforced by tests** (so mirrors can't silently rot):

- `packages/core/src/repo-source.test.ts` — name-set identity of
  `src/app` ↔ `www` top level, byte-identity of same-named files, no stale
  `stitch-*` names/refs, no `tmp-*.mjs|*.log|*.exe` junk in `scripts/`,
  and exactly 62 screens on both sides.
  Only exceptions (documented in that test): `cloud-config.js` (gitignored,
  generated per machine/deploy), and Cloudflare Pages site files
  (`_headers`, `robots.txt`) in `www`'s top level.
- `packages/core/src/version-consistency.test.ts` — the version lives in four
  places and may only change via `scripts/bump-version.mjs`.
- `packages/platform/src/mobile-brand-assets.test.ts` — launcher/splash brand
  integrity across Android densities and iOS sizes.

## 2. App layer (`src/app`)

Vanilla ES5-style IIFE modules sharing a `window.*` namespace. No bundler:
pages load plain `<script>`s, which keeps every shell (browser/Electron/
WebView) identical. Big modules:

- `auth.js` — session gate; `index.html` redirects to `nexus-home.html` or
  `nexus-onboarding.html`.
- `data.js` + `supported-devices.js` — device catalog and state.
- `device-controls.js` — capability → control mapping.
- `lan-connectors.js` — **15 local protocols**: Shelly Gen1 REST & Gen2 RPC,
  Tasmota, WLED, ESPHome, Philips Hue, Home Assistant (token), Kasa (TCP
  9999), Yeelight (TCP 55443), WiZ (UDP 38899), LIFX (UDP 56700, binary
  packets), Govee (UDP 4001/4003, XOR checksum), Sonoff DIY, Tuya Local
  (TCP 6668), Tapo, Wake-on-LAN.
- `automation-engine.js` — runs schedules/sunset triggers on-device.
- `cloud-sync.js` — optional Supabase profile/settings sync. Device
  credentials never leave the LAN.
- `lang-en.js` — English overlay over the Turkish base string table.

Transport selection cascades, in order: Electron `lan:` bridge (privileged,
main-process) → `CapacitorHttp` (native, bypasses WebView mixed-content) →
plain `fetch` (dev only). When no transport applies, connectors report
*"not supported"* rather than inventing success.

## 3. Automation engine

`automation-engine.js` elects a single owner across tabs/workers with a 2.5 s
heartbeat, ticks every 30 s (±90 min late tolerance), logs honest
`"missed (app was closed)"` events, and computes sunrise/sunset from saved
home coordinates (NOAA approximation). On desktop, a hidden
`automation-worker.html` window (negotiated via a `localStorage` heartbeat so
it never runs twice) keeps automations alive while the main window is closed —
that's why the desktop tray is "closed ≠ quit".

## 4. Desktop shell (`desktop/`)

Electron with a hard security posture:

- Both windows: `contextIsolation: true`, `nodeIntegration: false`,
  `sandbox: true`.
- App content is served through the privileged custom `nexus://` protocol
  (`protocol.handle`) with a path-traversal guard (403 outside the app dir).
- The preload exposes a small curated API (~25 methods). The LAN bridge is
  restricted to private address ranges (`isPrivateHost`), a fixed TCP/UDP
  port set, 15 s timeouts, and 2 MB response caps — an attacker cannot pivot
  to arbitrary internet hosts.
- Auto-update via `electron-updater` → GitHub Releases (`nexus-releases`),
  opt-in download, 3 h background checks with backoff, tray balloon flows.
- Tray-first behavior on Windows/Linux, single-instance lock (and a clean
  exit if the lock is lost), `Ctrl+Alt+N` global shortcut, rate-limited
  notifications (4/10 s).

Known trade-off: macOS builds are intentionally unsigned (`identity: "-"`,
hardened runtime off) behind a `MACOS_BUILD` repo variable to protect
private-runner minutes. Documented in `docs/BUILD-ALL-PLATFORMS.md`.

## 5. Mobile shells

Capacitor 8 (`appId: com.nexus.app`, `webDir: www`, `CapacitorHttp` enabled).
`AndroidManifest.xml`: `allowBackup="false"`, deep link `nexus://auth`,
deliberate `network_security_config` with cleartext LAN traffic —
because Shelly/WLED/Tasmota-era devices speak plain HTTP on the LAN and
Android's config cannot express "cleartext to private IP ranges only".
Internet-facing traffic (accounts, sync) is HTTPS-only.

Native additions are small: `NexusTileService` (Quick Settings tile),
`NexusKeepAliveService` (foreground background-automations), stock Capacitor
stubs (~175 LOC of Java). iOS shell is config + the synced `public/` mirror;
`ios/App/App/public/` is gitignored (generated on Windows by `sync-www.mjs`).

## 6. Cloud (opt-in) — `supabase/` + workers

- Accounts/sessions (email + Google), RLS on every user table
  (`nexus_devices`, `nexus_user_state`, `nexus_entitlements`, `nexus_stats_log`,
  `nexus_ai_usage`); `nexus_client_errors` has RLS with **zero policies**
  (service-role only writes).
- Billing: Whop → `whop-webhook` verifies **Standard Webhooks** HMAC
  (both `webhook-*` and `svix-*` headers, ±300 s freshness, constant-time
  compare) and deactivates entitlements on refunds. Company API key lives in
  Supabase Vault (migration `0006_nexus_whop_api_key.sql`).
- `daily-stats` Edge Function posts the daily digest to Discord and health-
  checks the real endpoints; it asserts public endpoints behave (webhook
  must 401 without a signature).
- Assistant: chat commands run locally; cloud fallback is a multi-provider
  chain (Cloudflare Worker → Groq → Gemini → OpenRouter) with a free daily
  credit quota. The worker proxies and never stores prompts.

Secrets policy: `.env`, `cloud-config.js` and keystore material are
gitignored and must never be committed (`CLAUDE.md` rule 3). CI greps the
published site bundle for `service_role` leaks before deploying
(`.github/workflows/web-deploy.yml`).

## 7. Release flow

1. Version changes go through `scripts/bump-version.mjs` (desktop/package.json,
   Android `versionName`/`versionCode`, settings About text, site emergency
   brake). `--changelog` regenerates `CHANGELOG.md` from Conventional Commits.
2. Push to `main` → marketing site deploys (path-filtered, smoke-verified
   before `wrangler pages deploy`).
3. Tag `v*` → signed Windows (x64/arm64) + Linux (AppImage/deb) + Android
   (signed APK) land in `nexus-releases` with checksums + SBOM.
4. `release-catchup.yml` (6 h cron) self-heals incomplete release tags by
   re-dispatching the desktop build.

## 8. Repository hygiene rules

- Generated mirrors (`www/` app mirrors, `desktop/app/`, `ios/App/App/public/`,
  Android `assets/public`) are never hand-edited; the `www/` app mirrors are
  committed as the Capacitor source of truth, but must stay byte-identical to
  `src/app` (guard test above).
- `scripts/` holds real tooling plus Playwright/CDP verification scripts
  (`verify-*.mjs`). One-off probes (`tmp-*.mjs`), logs and binaries are
  forbidden — the guard test fails the suite if they accumulate.
- No fake data anywhere (rule 1 of `CLAUDE.md`); connectors are written only
  against real protocol docs (rule 2); every screen is tested in
  new-user / paired / offline states (rule 7).
