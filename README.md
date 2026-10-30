<p align="center">
  <img src="branding/banner-en.png" alt="NEXUS+ — The Intelligence Layer for Your Smart Home" width="880"/>
</p>

# NEXUS — local-first smart home

One app that talks to your devices **directly on your local network** — no hub, no
vendor cloud, no subscription required. Windows · Linux · macOS · Android. iOS: sideload the unsigned IPA or build from source.

> **House rule: the app never pretends.** Real device states, automations that
> actually run, honest energy numbers. Anything not supported yet is clearly
> labelled in the UI.

<p align="center">
  <img src="www/public/images/shots/en/home.png" width="200" alt="Home (mobile)"/>
  <img src="www/public/images/shots/en/scenes.png" width="200" alt="Scenes (mobile)"/>
  <img src="www/public/images/shots/en/energy.png" width="200" alt="Energy (mobile)"/>
  <img src="www/public/images/shots/en/chat.png" width="200" alt="AI chat (mobile)"/>
</p>

## Why NEXUS

- **Local-first control.** Shelly, Tasmota, WLED, ESPHome, Philips Hue, Home Assistant
  and Sonoff (DIY) over local HTTP; TP-Link Kasa/Tapo, Yeelight and Tuya over local TCP/HTTP;
  WiZ, LIFX and Govee over UDP; Wake-on-LAN; a HomeKit bridge on desktop. Pairing is
  instant LAN discovery — no account creation per device. Connectors are written from public
  protocol documentation and tested against simulated devices; **most are not yet verified on
  real hardware** — see [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) and help us verify yours.
- **Desktop with real tray automations.** The Windows/Linux program runs the same
  UI in a desktop shell with a sidebar, sits in the system tray, and keeps
  schedules and sunset triggers running even with the window closed.
- **Built-in AI assistant, free tier included.** Chat runs device commands locally
  ("turn off the living room lights", "set the AC to 22"); cloud fallback uses a
  multi-provider chain (Cloudflare → Groq → Gemini → OpenRouter) with a free
  daily credit quota.
- **Privacy by architecture.** Device commands never leave your network. Cloud
  sync is optional and stores only profile/settings — never device credentials.
- **Bilingual UI** (English/Turkish) with an automated 100% translation-coverage
  gate.

## Desktop

The desktop program is not a wrapped web page — it gets a dedicated wide layout
with a navigation sidebar, tray mode and background automation worker:

<p align="center">
  <img src="www/public/images/shots/desktop/home.png" width="640" alt="Desktop dashboard"/>
</p>

## Screens & app

| Platform | Install |
| --- | --- |
| Windows x64 + arm64 | [Download installer](https://github.com/Enard52/nexus-releases/releases/latest) (auto-update built in) |
| Linux x64 + ARM64 (Raspberry Pi) | AppImage + deb + rpm from the same releases page (`NEXUS-linux*`, `NEXUS-linux-arm64*`) |
| Android | Signed APK from the same releases page |
| macOS | .dmg / .zip from the same releases page |
| iOS | Unsigned `.ipa` for sideloading with a free Apple ID (AltStore / Sideloadly), attached to a release when built; or build from source — see [docs/BUILD-ALL-PLATFORMS.md](docs/BUILD-ALL-PLATFORMS.md). Push notifications need a paid Apple account and are not available on iOS. |
| Web | [nexus-smarthome.pages.dev](https://nexus-smarthome.pages.dev) — account, downloads & billing |

## Architecture (single source, three shells)

```
src/app (single source)                generated copies — never edit by hand
├─ nexus-*.html   64 screens  →  www/  (sync-www.mjs)        → same UI in desktop & Android
├─ *.js (theme, data, device-    →  desktop/app (prepare-app)  → Electron (nexus:// protocol)
│  controls, lan-connectors,     →  android assets (cap sync)  → Capacitor APK (signed)
│  automation-engine.js)
├─ css/            design system + shell metrics (--nx-header-h/--nx-nav-h)
├─ www/public/     marketing site (site-content.mjs + site-build.mjs) → nexus-smarthome.pages.dev
├─ supabase/       Edge Functions + migrations (accounts, billing webhooks, invites)
├─ scripts/        build/verify tooling (measure-layout, verify-site, site-*, legal-pdf…)
├─ packages/       unit-tested modules (vitest: 1200+ tests) — mirror & hygiene guards included
└─ desktop/        Electron main/preload (tray mode, auto-update, automation worker)
```

- **Accounts & sync:** Supabase (email + Google); device data stays local.
- **Billing:** Whop (NEXUS+ monthly/yearly, TRY/USD) → signed webhook → entitlements.
- **Automations:** `automation-engine.js` runs on-device; survives on the desktop
  tray (`automation-worker.html`).

## Development

```bash
pnpm install
pnpm test                              # full suite (unit + guard tests)
node scripts/sync-www.mjs              # root → www
node desktop/scripts/prepare-app.cjs   # → desktop/app
npx cap sync android                   # → android (rebuild APK for release)
npm run audit:ui                       # 63 screens × 4 device profiles audit
npm run audit:i18n:coverage            # translation coverage gate
```

Release flow: push to `main` → marketing site deploys; tag `v*` → signed desktop +
Android builds land in
[nexus-releases](https://github.com/Enard52/nexus-releases) (checksums + SBOM).

## Documentation

- `docs/ARCHITECTURE.md` — the full architecture map (single source, shells, security posture, release flow)
- `docs/QA.md` — verification ladder: CI gates, recorded UI/flow audit results, what still needs real hardware
- `docs/BUILD-ALL-PLATFORMS.md` — platform build matrix
- `docs/INTEGRATIONS.md` — integration roadmap (zero-budget first)
- `docs/USABILITY.md` — usability audit results and next quick wins
- `ROADMAP.md` — what is done, in progress, and what the community can take
- `docs/COMPATIBILITY.md` — device compatibility and real-device reports (file a [device report](https://github.com/Enard52/NEXUS/issues/new?template=device_report.yml))
- `docs/REMOTE-ACCESS.md` — reach your home from outside with a free VPN
- `GOVERNANCE.md` — how decisions and reviews work
- `CLAUDE.md` — contributor rules (honesty, secrets, single-source pricing)
- Legal (TR/EN): `legal-pdf/` — regenerate with `node scripts/legal-pdf.mjs`

## License

[Apache-2.0](LICENSE) — the same license Home Assistant uses: anyone may use,
modify and ship NEXUS, with an explicit patent grant. The NEXUS name and logo
stay with the project (see `TRADEMARKS.md`).
