# Security Policy / Güvenlik Politikası

## Reporting a Vulnerability / Açık Bildirme

Please report security issues privately — do not open a public issue.

Güvenlik açıklarını lütfen özel olarak bildirin; herkese açık issue açmayın.

- **Email:** nexus.smarthome.app@gmail.com
- Konu başlığı / Subject: `[SECURITY] NEXUS — <kısa özet>`

Include: affected component (web app, desktop, Android, site, Edge Functions, AI worker), steps to reproduce, and impact. We aim to respond within 72 hours and will credit reporters after a fix unless you prefer to stay anonymous.

Ekleyin: etkilenen bileşen (web uygulaması, masaüstü, Android, site, Edge Functions, AI worker), yeniden üretme adımları ve etki. 72 saat içinde yanıt hedefliyoruz; düzeltmeden sonra (isimsiz kalmak istemezseniz) bildirenleri belirtiriz.

## Scope / Kapsam

- `nexus-web-jre.pages.dev` (web app), `nexus-smarthome.pages.dev` (site)
- NEXUS desktop (Windows/Linux) releases — https://github.com/Enard52/nexus-releases
- NEXUS Android APK (site download)
- Supabase Edge Functions (whop-webhook, daily-stats, weekly-backup, delete-account, client-error)
- Cloudflare Worker `nexus-ai` (app AI chat)

Out of scope: self-hosted Home Assistant instances, your local network devices, spam/social engineering, issues in dependencies already tracked upstream (report those upstream; we track via Dependabot).

## Disclosure

Coordinated disclosure preferred; please allow up to 90 days before public disclosure.
