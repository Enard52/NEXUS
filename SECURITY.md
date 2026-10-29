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
