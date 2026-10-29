# Outreach drafts

Ready-to-post texts. They stay honest on purpose: say what works, say what is unverified, ask for the one
thing we cannot do ourselves — **trying devices and reporting back**. Post them yourself; edit freely.

## Show HN

**Title:** Show HN: NEXUS – local-first smart home app, no hub and no vendor cloud (Apache-2.0)

NEXUS controls smart-home devices directly over your LAN (Shelly, Tasmota, WLED, ESPHome, Hue, Home
Assistant, Kasa/Tapo, Yeelight, Sonoff DIY, WiZ, LIFX, Govee, Tuya local, Wake-on-LAN) from one app on
Windows, macOS, Linux, Android and iOS. Automations and sensor alerts run on your own device.

What I want to be upfront about: connectors are written from public protocol docs and covered by
automated tests, but most are not yet verified on real hardware. If you own any of these devices, a
10-minute test report ("works / partly / fails") is the most useful contribution right now:
<link to the Device test report form>

Source, roadmap and compatibility table: <repo link>

## r/selfhosted · r/homeautomation

**Title:** I'm building a local-only smart home app (no cloud account needed) — looking for people to test their devices

Short version of the Show HN text, plus: what it does _not_ do (cloud-only devices, Matter for now) and a link to the
[compatibility table](COMPATIBILITY.md) and [roadmap](../ROADMAP.md). Reply to every comment, including negative ones.

## Awesome-list pull requests

Targets: awesome-selfhosted (Home Automation section), awesome-home-assistant (if/when a Home Assistant
integration path is documented). Read each list's contribution rules first; most require an
open-source license (Apache-2.0 ✔), a working demo or docs, and an active repository.

**Entry text:** `[NEXUS](<repo link>) - Local-first smart home app controlling devices directly over the LAN, no hub or vendor cloud. ([Source Code](<repo link>)) Apache-2.0 JavaScript/Electron/Capacitor`

## Distribution channels that are free

- **winget / Scoop** (Windows): a package manifest that points at a GitHub release asset and its SHA256.
- **F-Droid** (Android, no Google Play account): needs a reproducible build and no proprietary dependencies — check the F-Droid inclusion policy before applying; Firebase push is a proprietary dependency, so an F-Droid flavor would build without it.
- **Flathub** (Linux).
- **Windows code signing:** apply to [SignPath Foundation](https://signpath.org/) (free for open-source projects) to remove the SmartScreen warning.

Do not claim a channel works until a real install from it has been tested.
