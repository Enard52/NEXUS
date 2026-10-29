# Device compatibility

NEXUS controls devices over your **local network** only. Every connector below is written
against the vendor's public protocol documentation and has packet/response-format tests in
`packages/web/src/lan-*.test.ts`. **Automated tests are not hardware verification**: a connector
counts as _verified_ only when a person reports that it worked on a real device.

Report your device with the
[Device test report](https://github.com/Enard52/NEXUS/issues/new?template=device_report.yml) form.
Never paste passwords, local keys, tokens or account e-mails.

## Connectors

| Connector         | Protocol (local)            | Automated tests        | Real-device reports |
| ----------------- | --------------------------- | ---------------------- | ------------------- |
| Shelly (Gen1)     | HTTP REST                   | yes                    | none yet            |
| Shelly Plus / Pro | HTTP JSON-RPC               | yes                    | none yet            |
| Tasmota           | HTTP commands               | yes                    | none yet            |
| WLED              | HTTP JSON API               | yes                    | none yet            |
| ESPHome           | native HTTP API             | yes                    | none yet            |
| Philips Hue       | local bridge, HTTPS API     | yes                    | none yet            |
| Home Assistant    | REST (long-lived token)     | yes                    | none yet            |
| TP-Link Kasa      | local TCP (XOR protocol)    | yes                    | none yet            |
| TP-Link Tapo      | KLAP v2 / securePassthrough | yes (simulated device) | none yet            |
| Yeelight          | local TCP/JSON              | yes (few cases)        | none yet            |
| Sonoff (DIY mode) | eWeLink DIY HTTP API        | yes                    | none yet            |
| WiZ               | UDP/JSON                    | yes                    | none yet            |
| LIFX              | UDP LAN protocol            | yes (few cases)        | none yet            |
| Govee (LAN)       | UDP/JSON                    | yes                    | none yet            |
| Tuya (local)      | 3.3 / 3.4 (AES-128)         | yes (simulated device) | none yet            |
| Wake-on-LAN       | UDP magic packet            | yes (few cases)        | none yet            |
| HomeKit bridge    | HAP (desktop only)          | protocol e2e           | none yet            |

"Real-device reports" will list verified models here as reports arrive. Maintainers can refresh
this table from the reports with `node scripts/compat-matrix.mjs` (needs the `gh` CLI).

## Not supported (by design)

Cloud-only devices without a documented local protocol are not supported, because NEXUS never
talks to a vendor cloud and never fakes a successful connection. If your device is not listed,
open a [Device support request](https://github.com/Enard52/NEXUS/issues/new?template=device_support.yml).

<!-- compat-reports:start -->

_No device reports yet._

<!-- compat-reports:end -->
