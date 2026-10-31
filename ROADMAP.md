# Roadmap

NEXUS is local-first: it controls devices over your own network, with no hub and no vendor cloud.
This page says what is done, what is being built, and where help is welcome. Everything is free to
contribute to; no hardware purchase or paid account is required for the items marked _code-only_.

Honesty rule: a feature is "done" only if it works for real. Connectors are written from public
protocol documentation and covered by automated tests, but **most have not been verified on real
hardware yet** — see [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) and
[docs/HARDWARE-VERIFICATION.md](docs/HARDWARE-VERIFICATION.md).

## Done

- Local control for 16 device families (Shelly, Tasmota, WLED, ESPHome, Hue, Home Assistant, Kasa, Tapo,
  Yeelight, Sonoff DIY, WiZ, LIFX, Govee LAN, Tuya local, Zigbee2MQTT, Wake-on-LAN) and a HomeKit bridge on desktop
- Sensor events (motion, door/window, smoke/water) with critical alerts that pass quiet hours
- Automations with time, device-state, weather, sensor, security-mode and (mobile app, while open) arrive/leave-home triggers
- Optional remote address for a device or hub (VPN or port forwarding), tried only when the local address does not answer
- Android home-screen widget showing the last device state saved by the app (built, not yet tried on a real phone)
- Notification setup after sign-in, per-category sound and vibration, Android action buttons
- Account security: two-factor authentication; honest empty, offline and error states on every screen
- Device credentials stay on the device; on desktop they are encrypted with the operating-system keychain
- Local error log you can read and copy, adjustable sync interval, headers that hide while scrolling
- Backup and restore of local settings, automations and the device list (no secrets are ever exported)
- Automated checks on every change: typecheck, 2000+ tests, format, dependency audit, secret scan, UI states and
  accessibility checks
- Release checksums (SHA-256) for every platform; build provenance for Android

## Built, waiting for real-world testing

The code is in place; what is missing is someone trying it on real hardware. Nothing below has been verified end
to end yet.

- Server-backed Family (shared home, invites, permissions, chat, activity feed)
- Push notifications when the app is closed (web and Android)
- The Android-specific notification features on a real phone

## Help wanted

| Area                   | What                                                                                                        | Needs                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------- |
| **Verify on hardware** | Try your device and file a [device report][device-report]                                                   | A real device, 10 minutes |
| **Test Family**        | Create a home, invite a second account, chat, check permissions                                             | Two accounts, two devices |
| **Test push**          | Closed-app notification on a phone or browser                                                               | A phone                   |
| New brands             | Open a [device support request][device-support] or write a connector                                        | Code, ideally the device  |
| Translations           | Add or fix languages                                                                                        | Code-only                 |
| Tablet / landscape     | Layouts for tablets, iPad PWA, 2-in-1                                                                       | Code-only                 |
| Background location    | Arrive/leave triggers while the app is closed (needs background-location permission and review)             | Code, a phone to test     |
| Windows arm64 build    | Add an arm64 Windows installer without breaking the x64 auto-update manifest, and test it on arm64 hardware | An arm64 Windows device   |
| CSP hardening          | Remove `unsafe-inline` by moving inline scripts/styles to files and checking every screen for violations    | Code-only                 |
| Cameras                | Live view over RTSP/ONVIF on desktop                                                                        | Code, an IP camera        |
| Matter                 | Open-source SDK, long term                                                                                  | Experience with Matter    |
| Screen-reader pass     | Manual accessibility testing with real assistive tech                                                       | A screen reader           |

[device-report]: https://github.com/Enard52/NEXUS/issues/new?template=device_report.yml
[device-support]: https://github.com/Enard52/NEXUS/issues/new?template=device_support.yml

## How to take something

1. Open an issue or comment on an existing one so nobody duplicates the work.
2. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the rules in [CLAUDE.md](CLAUDE.md) (nothing fake, no secrets in the repo, every screen works in three states).
3. Open a pull request. CI must pass; a maintainer reviews it ([GOVERNANCE.md](GOVERNANCE.md)).

Not planned: anything that needs a vendor cloud, hides a failure behind a fake success, or sends
user data to a service we do not name in the privacy policy.
