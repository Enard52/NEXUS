# Security Policy

## Reporting a Vulnerability

Please report security issues privately — do not open a public issue.

- **Email:** nexus.smarthome.app@gmail.com
- **GitHub:** [private vulnerability report](https://github.com/Enard52/NEXUS/security/advisories/new) (visible only to the maintainers)
- **Subject:** `[SECURITY] NEXUS — <short summary>`

Include: affected component (desktop, Android, site, Edge Functions, AI worker), steps to reproduce, and impact. We aim to respond within 72 hours and will credit reporters after a fix unless you prefer to stay anonymous.

## Scope

- `nexus-smarthome.pages.dev` (account, downloads and billing site)
- NEXUS desktop (Windows/Linux) releases — https://github.com/Enard52/nexus-releases
- NEXUS Android APK (site download)
- Supabase Edge Functions (whop-webhook, daily-stats, weekly-backup, delete-account, client-error, household-invite)
- Cloudflare Worker `nexus-ai` (app AI chat)

Out of scope: self-hosted Home Assistant instances, your local network devices, spam/social engineering, issues in dependencies already tracked upstream (report those upstream; we track via Dependabot).

## Disclosure

Coordinated disclosure preferred; please allow up to 90 days before public disclosure.

## Threat model (summary)

| Asset | Where it lives | Protection | Known limits |
|---|---|---|---|
| Device credentials (Tuya local keys, Tapo password, MQTT login) | This device only (`nexusLanSecrets`); never synced to the cloud or included in backups | Desktop app: encrypted with the OS keychain (Electron `safeStorage`); old plain records are migrated on first read. Android: encrypted with a non-exportable Android Keystore key (AES-GCM) | Browser and keychain-less environments store them unencrypted in local storage; the UI says so. Neither keychain path has been verified on real hardware yet. |
| Account data (Supabase) | Supabase with row-level security | Per-user policies; only publishable keys ship in the app | Depends on correct RLS; report issues via the policy above |
| LAN control traffic | Local network | Desktop bridge only talks to private addresses | Many LAN protocols are plain by design (device firmware); a hostile local network can observe them |
| Error reports | Optional, opt-in toggle in Settings | Only page, version, platform and message; local log can be viewed and cleared | None known |
| Release binaries | GitHub Releases | Published from CI; checksums provided | Windows builds are not yet signed with a paid certificate |

### Known hardening work (not done, and why)

- **Content-Security-Policy `unsafe-inline`:** the app and site still rely on inline scripts and styles in many pages. Removing it safely means moving every inline block to files (or hashing them) and re-testing every screen for CSP violations; doing it blind would break the live app, so it is tracked as planned work rather than rushed.
- **Windows code signing:** builds are not signed with a paid certificate yet (SmartScreen warning); see `docs/VERIFY-DOWNLOAD.md` for how to verify downloads.
