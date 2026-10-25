# Changelog / Değişim Günlüğü

_Bu dosya `node scripts/bump-version.mjs --changelog` ile Conventional Commits'ten üretilir; elle düzenlenmez._

## Unreleased / Yayınlanmamış

### ✨ Yeni / New
- ai: only real AI answers use credits; local commands free; whop webhook handles real payload shapes

### 🐛 Düzeltmeler / Fixes
- gradle comment encoding

### 🔒 Güvenlik / Security
- stronger web app headers; remove stray files with local paths

### 📚 Belgeler / Docs
- manual steps now point to GitHub issues
- manual steps updated

### 🧩 Diğer / Other
- operator shown as NEXUS only (no personal name)
- PolyForm Shield 1.0.0 (no personal name); neutral author; remove personal paths/email from scripts
- remove site AI widget and its worker origin
- natural, varied replies (TR/EN)
- ai worker: per-IP spam rate limit (15/min)

## v1.0.13

### ✨ Yeni / New
- devices: WiZ, LIFX, Govee (desktop UDP bridge) and Sonoff DIY connectors with protocol tests
- monitor: hourly health check and daily summary to Discord
- Discord daily stats + payment notifications, signed Android release build, Android no longer test
- site: account links and login redirect
- ai: real AI fallback in app chat via Workers AI; worker source in scripts
- site: floating NEXUS AI helper backed by Workers AI

### 📚 Belgeler / Docs
- manual steps - releases are published, catch-up automated
- renumber manual steps
- manual steps final (Google OAuth + email templates done)
- manual steps trimmed
- manual steps after Whop legal/webhook completion
- pending manual steps updated (release blocked by Actions quota)

### 🛠 Bakım / Maintenance
- version 1.0.13
- web/site auto-deploy, signed Android release workflow, one-time automation setup script, weekly backup, dev rules
- catch-up workflow finishes local-built releases automatically once Actions works

### 🧩 Diğer / Other
- privacy policy covers Workers AI chat; fix PDF generation
- IndexNow key

## v1.0.12

### ✨ Yeni / New
- billing: TRY and USD NEXUS+ plans, honest plan cards and Plus features, new site title; 1.0.12
- legal: single-source TR/EN privacy, terms, refund policies; site pages and Whop PDFs

### 📚 Belgeler / Docs
- Whop business branded; remaining Whop legal docs
- SMTP done
- no captcha (email verification is enough)
- manual steps reflect current verified state
- manual steps updated for Whop webhook, SMTP and live tests

### 🛠 Bakım / Maintenance
- site: sync footer fixes into www/public

## v1.0.11

### ✨ Yeni / New
- billing: NEXUS+ subscriptions via Whop (webhook -> Supabase entitlements), real AI credit allowance (30/day free, 2000/month NEXUS+), real pricing on site; 1.0.11

## v1.0.10

### ✨ Yeni / New
- brand support email (nexus.smarthome.app@gmail.com) in site, privacy pages, app feedback form and package metadata; 1.0.10

### 📚 Belgeler / Docs
- free branded Gmail SMTP path, Whop suspension note
- drop Yandex from manual steps
- manual steps updated; site: Search Console verification file
- remove completed Supabase steps
- manual steps list only pending items
- captcha note; sync site fallback version 1.0.9

### 🛠 Bakım / Maintenance
- seo: Bing verification meta, manual steps updated

## v1.0.9

### ✨ Yeni / New
- account: real Supabase account sync (profile/settings/scenes restore), real password reset + change, session key fix, auto-sync on every page; desktop: background update checks + compact green update icon beside theme toggle; 1.0.9

### 🛠 Bakım / Maintenance
- drop legacy server-bundle job (pipeline replaced by desktop-release + www sync)
- cloud-config.js is generated, not tracked
- site: sync www/public with published site (1.0.8)
- point stale tests at www/public and scripts/sync-www.mjs; docs: search-engine registration steps

### 🧩 Diğer / Other
- normalize line endings (prettier lf) for flagged files

## v1.0.8

### ✨ Yeni / New
- site,app: SEO + brand download cards, remove unverified contact emails, point to nexus-smarthome.pages.dev, drop 500MB placeholder installers from web bundle; bump 1.0.8
- auth: Google sign-in via Supabase OAuth redirect; set user before writing session

### 🧩 Diğer / Other
- remove outdated docs, backups, debug images, macOS build target; update README and manual guide

## v1.0.7

### 🛠 Bakım / Maintenance
- desktop: bump to 1.0.7 (cloud sync enabled)
- desktop: inject cloud config from repo variables; add proprietary LICENSE; legal step in manual guide
- desktop: write cloud-config.js from repo variables so released builds have cloud sync

## v1.0.6

### 🐛 Düzeltmeler / Fixes
- plus: no fake subscription; show coming-soon message

### 📚 Belgeler / Docs
- account, Supabase and sync test steps in manual guide
- manual steps guide (lowest-cost path)

### 🛠 Bakım / Maintenance
- desktop: bump to 1.0.6

### 🧩 Diğer / Other
- English translations for new desktop/app strings
- prettier formatting for CI

## v1.0.5

### ✨ Yeni / New
- NEXUS 1.0.3 — update download, AI card, device warnings, option pickers, sticky desktop header, responsive fixes
- desktop: redesign update card and NEXUS AI sidebar button; bump to 1.0.2
- authentic brand SVGs, full Turkish localization, and Live badge alignment

### 🐛 Düzeltmeler / Fixes
- home: quick-run card icons match default card icon size, no circle wrapper
- home: quick-run cards use the same size and 2-column grid as other home cards
- desktop: AI card full width, icon aligned with profile avatar
- settings: hide empty update card
- ui: center dialog title and message
- ui: primary action buttons use brand blue in both themes
- ui: stable scrollbar gutter and page fade-in to prevent content shift on navigation
- desktop: sticky header and message tabs; final browser sweep fixes
- marketing: resolve footer redirect loop, fix text overflow in cards, and optimize 60fps scrolling

### 🧹 Kod düzeni / Refactoring
- marketing: remove context tags from automation card

### 🛠 Bakım / Maintenance
- desktop: bump to 1.0.5 (windows, macos, linux)
- desktop: bump to 1.0.4
- remove 59 unreferenced product JPGs (replaced by PNG catalog images, -12.9 MB)
- desktop: bump version to 1.0.1

### 🧩 Diğer / Other
- NEXUS update 2026-10-24 17:06
- NEXUS update 2026-10-24 03:52
- NEXUS update 2026-10-24 03:44
- NEXUS update 2026-10-24 03:33

