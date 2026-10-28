# NEXUS — Integration Roadmap (recommendations, zero-budget first)

Ordered by impact vs. cost. "Code-only" = no hardware purchase, no service fee —
we can implement and merge ourselves. "Community" = valuable to accept from
contributors. Everything must keep the honesty rule: only advertise what actually
works.

## Tier 1 — highest leverage, code-only

1. **Home Assistant bridge (two-way).** NEXUS already speaks HA over local HTTP.
   Add the reverse: expose NEXUS devices/entities to HA via the HA WebSocket API so
   HA users get NEXUS automations and energy in their dashboards. This is THE
   gateway to the open-source audience — HA users are exactly our early adopters.
2. **MQTT support (generic).** One connector unlocks Zigbee2MQTT, Mosquitto,
   Tasmota-native and dozens of sensors. `lan-connectors.js` gains an MQTT backend
   (browser-side WebSocket MQTT is fine for the app; desktop can use a real socket).
3. **Tuya/SmartLife local control (tuya-local style).** The #1 request SmartLife
   users have. Local keys are extractable by the community; we ship the connector,
   not the extraction guide. This is how we convert the 50M-install audience.
4. **Matter/Thread via bridge.** Do not build a full Matter stack (huge, cert
   costs). Position: "Matter devices join through your Home Assistant or any Matter
   controller and appear in NEXUS via the HA bridge." Honest and cheap.

## Tier 2 — high impact, mostly code-only

5. **Telegram two-way bot.** Notifications exist; add command handling ("status",
   "turn off living room") with a per-user chat pairing. Free, and a demo magnet.
6. **ntfy two-way + self-host docs.** Already integrated one-way; document
   self-hosted ntfy so the privacy crowd gets a fully local notification path.
7. **Widget/shortcuts exports.** Android home-screen widget (device toggle +
   scene), iOS Shortcuts web hooks when iOS ships. Low code, high visibility.
8. **Energy: per-device cost targets + export (CSV/JSON).** Builds on the honest
   energy metrics; community loves exports.

## Tier 3 — community-driven (accept PRs)

9. Device connectors: Sonoff (local DIY mode), WiZ (LAN UDP), LIFX (LAN protocol),
   Govee (LAN), IKEA DIRIGERA. Each is a self-contained connector; perfect
   `good first issue` material once public.
10. Voice: Home Assistant Assist exposure (via the HA bridge) before considering
    any cloud voice integration.
11. Translations: i18n dictionary is the single surface; external contributors can
    add languages without touching layout.

## Explicitly NOT planned (budget + focus)

- Our own Matter/Thread stack, vendor cloud integrations (Tuya cloud, SmartLife
  cloud APIs), paid notification services, a hosted mobile push service (ntfy +
  local notifications cover it), anything requiring paid certificates.
