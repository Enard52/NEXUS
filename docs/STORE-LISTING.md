# Store listing drafts

Drafts for Google Play (and, if ever used, the App Store). Answers follow the real data flows; re-check them
against the privacy policy before submitting. Nothing here is submitted automatically.

## Short description (80 chars)

Control your smart home over your own network. Free, local-first, no hub.

## Long description

NEXUS controls lights, plugs and other devices directly over your home network: no hub, no vendor cloud.
Create automations (time, device state, weather, sensors), get sensor alerts, and keep a local backup.
Signing in is optional and only adds cloud sync and a shared Family home.

Honest limits: most device connectors are written from public protocol documentation and have not yet been
verified on every real device. Some brands only work in the desktop app.

## Screenshot list

1. Home with devices and scenes
2. Device pairing / discovery
3. Automations
4. Notifications and quiet hours settings
5. Backup and privacy settings

(Capture from a build with real paired devices, never mock data.)

## Google Play: Data safety draft

| Question | Draft answer |
| --- | --- |
| Data collected | Account email (only if the user signs in); synced settings, automations and device list names (only if cloud sync is used); optional error reports (page, app version, platform, message) |
| Shared with third parties | Hosting/auth/database provider (Supabase) as a processor; push delivery (Firebase) if enabled; AI provider only when the user uses the AI assistant with their own request text |
| Encrypted in transit | Yes (HTTPS) |
| Deletion | User can delete the account and data in the app |
| Device credentials | Never leave the device (not collected) |
| Location | Not collected today |
| Ads / tracking | None |

## App Store privacy draft

Data linked to the user: email (account), user content (synced settings). Data not linked: diagnostics (optional error
reports). No tracking.
