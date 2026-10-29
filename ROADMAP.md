# Roadmap

NEXUS is local-first: it controls devices over your own network, with no hub and no vendor cloud.
This page says what is done, what the maintainers are still working on, and what we are
**asking the community to take**. Everything is free to contribute to; no hardware purchase or
paid account is required for the items marked _code-only_.

Honesty rule: a feature is "done" only if it works for real. Connectors are written from public
protocol documentation and covered by automated tests, but **most have not been verified on real
hardware yet** — see [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md).

## Done

- Local control for 15 device families (Shelly, Tasmota, WLED, ESPHome, Hue, Home Assistant, Kasa, Tapo,
  Yeelight, Sonoff DIY, WiZ, LIFX, Govee LAN, Tuya local, Wake-on-LAN) and a HomeKit bridge on desktop
- Sensor events (motion, door/window, smoke/water) with critical alerts that pass quiet hours
- Automations with time, device-state and sensor triggers
- Notification setup after sign-in, per-category sound and vibration, Android action buttons (the Android parts have not been tried on a real phone yet)
- Account security: two-factor authentication, honest empty/offline/error states on every screen
- Automated checks on every change: typecheck, 1000+ tests, format, dependency audit, UI states (3 states per screen) and basic accessibility checks
- Privacy policy names every third-party service that receives data (#94)

## In progress (maintainers)

- Server-backed Family: shared home, invites, permissions, chat, activity feed — code written,
  needs verification against a real server and two devices ([#97](https://github.com/Enard52/NEXUS/issues/97))
- Push notifications when the app is closed: web push is implemented; Android is the second phase
  ([#95](https://github.com/Enard52/NEXUS/issues/95))
- Backup and restore of local settings and automations ([#83](https://github.com/Enard52/NEXUS/issues/83))

## Help wanted (the community picks these up)

| Area                   | What                                                                                                                                                                   | Needs                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **Verify on hardware** | Try your device and file a [device report](https://github.com/Enard52/NEXUS/issues/new?template=device_report.yml) ([#96](https://github.com/Enard52/NEXUS/issues/96)) | A real device, 10 minutes |
| New brands             | Open a [device support request](https://github.com/Enard52/NEXUS/issues/new?template=device_support.yml) or write a connector (needs a documented local protocol)      | Code, ideally the device  |
| Translations           | Add or fix languages ([translation issues](https://github.com/Enard52/NEXUS/labels/translation))                                                                       | Code-only                 |
| iOS build-from-source  | Write and test the guide for a free Apple ID ([#76](https://github.com/Enard52/NEXUS/issues/76))                                                                       | A Mac                     |
| Android widgets        | Device toggle and scene shortcuts ([#80](https://github.com/Enard52/NEXUS/issues/80))                                                                                  | Android Studio            |
| Android in-app update  | "New version available" banner ([#78](https://github.com/Enard52/NEXUS/issues/78))                                                                                     | Code-only                 |
| Tablet / landscape     | Layouts for tablets, iPad PWA, 2-in-1 ([#84](https://github.com/Enard52/NEXUS/issues/84))                                                                              | Code-only                 |
| Linux ARM64 builds     | Raspberry Pi release builds ([#85](https://github.com/Enard52/NEXUS/issues/85))                                                                                        | A Pi to verify            |
| Energy history         | Usage charts and local tariff estimate ([#82](https://github.com/Enard52/NEXUS/issues/82))                                                                             | Code-only                 |
| Location automations   | Arrive/leave geofence triggers ([#81](https://github.com/Enard52/NEXUS/issues/81))                                                                                     | Code, a phone to test     |
| Matter                 | Open-source SDK, long term ([#86](https://github.com/Enard52/NEXUS/issues/86))                                                                                         | Experience with Matter    |
| Screen-reader pass     | Manual accessibility testing with real assistive tech ([#75](https://github.com/Enard52/NEXUS/issues/75))                                                              | A screen reader           |

## How to take something

1. Comment on the issue so nobody duplicates the work.
2. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the rules in [CLAUDE.md](CLAUDE.md) (nothing fake, no secrets in the repo, every screen works in three states).
3. Open a pull request. CI must pass; a maintainer reviews it ([GOVERNANCE.md](GOVERNANCE.md)).

Not planned: anything that needs a vendor cloud, hides a failure behind a fake success, or sends
user data to a service we do not name in the privacy policy.
