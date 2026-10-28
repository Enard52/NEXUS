# Changelog / Değişim Günlüğü

_Bu dosya `node scripts/bump-version.mjs --changelog` ile Conventional Commits'ten üretilir; elle düzenlenmez._

## Unreleased

### 🐛 Fixed
- email change migrates local state to the new address — cloud rows survive re-login

### 🔒 Security
- harden contributors render - whitelist fields, DOM API, no innerHTML injection

### 📚 Docs
- launch gate - device verification and Whop redirect confirmed

### 🧩 Other
- founder chips with Owner/Maintainer labels, theme-aware badges, typo fix; docs: TRADEMARKS
- prettier pass over the patched test files

## v1.0.25

### ✨ Added
- all-OS readiness - iOS shell synced in pipeline, macOS CI job (flagged), build docs

### 🐛 Fixed
- normalize .gitignore (CRLF broke new patterns) and untrack scripts/archive for real
- verify-site read the moved screens from the repo root (broke CI on linux)

### 🧹 Refactoring
- single-source tree - app screens and JS move from repo root to src/app

### 🛠 Maintenance
- ship 1.0.25 - proper favicon, contributors section ready, all post-1.0.24 fixes
- ignore tool state folders (.wrangler, .audit-shots)
- untrack scripts/archive from the repo (kept on disk)
- move owner-private files out of the repo, untrack legacy archive; community flywheel plan
- remove accidentally committed empty file
- ignore gh-models.tmp

### 🧩 Other
- contributors section (fills when repo goes public); docs scrub private filename
- docs+issues: unsigned-only policy for macOS/iOS - no paid Apple accounts, ever
- natural Turkish downloads heading, FAQ typo fix
- site+docs: drop GitHub/host mentions from downloads copy; changelog English-only
- drop the docs file path from the downloads note (developer speak)
- downloads section covers every published OS package

## v1.0.24

### ✨ Added
- neutral workers.dev subdomain (privacy) + AI fallback models refreshed
- language switcher available to everyone (app, desktop, site)
- payment webhook closes refunds, whop user-id bridge; root og back to EN cover
- branded banners everywhere - og covers, email banners, modal shift fix, invite welcome

### 🐛 Fixed
- site device card shows full TR name; neutral og cover for the bare-domain link; crisp screenshots

### 📚 Docs
- desktop README section down to one authentic EN shot (Demo User, sidebar profile no longer Turkish)
- Apache-2.0 license, desktop screenshots, EN-first README; repo consolidation plan
- TR/EN payment return screenshots
- OSS launch plan, integration roadmap, usability review; professional EN README with brand hero
- manual steps for 1.0.23 (owner checklist + paste-ready SQL)

### 🛠 Maintenance
- ship 1.0.24 - neutral AI subdomain, AI fallback keys live, language switcher for everyone
- remove stray key temp file from history tip; ignore _tmp artifacts
- pass CLOUDFLARE_ACCOUNT_ID for pages deploy (Pages:Edit token cannot auto-discover account)
- site pipeline can upload straight to Cloudflare Pages (single-repo path)
- remove temp patch script

## v1.0.23

### 🐛 Fixed
- clear all small-touch-target findings (25 -> 0) with invisible hit-area expansion

### 🛠 Maintenance
- ship 1.0.23 - security dependency updates and touch-target polish
- remove stray alert-dump file
- deps: close all open security advisories (23 -> 0)
- deps: bump actions/checkout from 4 to 7 (#40)
- deps: bump actions/upload-artifact from 4 to 7 (#41)
- deps: bump the minor-and-patch group across 1 directory with 9 updates (#44)

## v1.0.22

### ✨ Added
- v1.0.22 - multi-provider AI fallback, enter-to-save, android background service, accessibility zoom, perf

### 🐛 Fixed
- scene LAN commands fire again - prev state was a live alias after batch-write rewrite

### 🛠 Maintenance
- desktop artifact upload is informational - never fail the release run for it

### 🧩 Other
- prettier cloud-sync.test.ts

## v1.0.21

### ✨ Added
- sound & motion feedback pack, review fixes, Oct 25-27 pending work

### 🛠 Maintenance
- refresh www output for 1.0.21
- ignore tool state and runtime logs (mimosa, supabase temp, desktop logs)

## v1.0.19

### 🐛 Fixed
- ship 1.0.19 so desktop switches, the camera, and home location stay usable
- stop publishing the web app and keep the site on the same screens

## v1.0.18

### 🐛 Fixed
- keep desktop sign-in inside the app and show the welcome button

## v1.0.17

### 🐛 Fixed
- ship 1.0.17 so the Android release can be signed

## v1.0.16

### ✨ Added
- site: tighten responsive layout and honest platform download CTAs

### 🐛 Fixed
- publish 1.0.16 and keep English fixed outside Turkish devices
- close the remaining honest-product gaps in the app and site
- site: keep platform logos off the footer

## v1.0.15

### ✨ Added
- unify light-theme lilac canvas and ship v1.0.15
- integrations: promote TP-Link Tapo to active local HTTP protocols, remove coming-soon badge, update site and FAQ
- site: polish steps, account hub, lilac theme, live preview and contact modal
- complete cross-platform parity, zero-cost mobile features, desktop background resilience, and site modernization
- site: telefonun içinde gezilebilir gerçek uygulama + dürüst hero ekranları
- app: realtime sync + notification layer, honest platform copy, permanent audits
- site: add avatar & full name handling, rich profile settings, branded contact modal

### 🐛 Fixed
- desktop: hide app menu on onboarding and login, remove language switch pill
- site: refine phone preview mockup, remove web app downloads, and sync with Enard52.github.io
- a11y: dokunma hedefleri gerçek isabet alanıyla ölçülüyor; AA altı iki kontrol kapatıldı
- app: Film/Misafir modunda katalogda olmayan marka adları kaldırıldı
- site: download links, minSdk copy, honest family plan, claim gate
- site: single-source build, honest claims, and a permanent site gate
- site: compact scroll-less modals, full-width buttons, custom dialog alerts, profile redesign, fit pricing cards
- site: harmonize footer column gaps, add english phone screenshots, clarify native vs browser in faq
- ui: align footer logo with flex, sleek segmented navbar lang switcher, universal native push dispatcher, polished bilingual copy
- site: 8 real app screens with interactive tabs in phone mockup, symmetrical responsive plan cards, 100% english parity
- site: modernize legal pages, direct GitHub release downloads, honest plan descriptions
- site: eliminate undefined in pricing/integrations, add robust language switcher, enrich NEXUS+ features
- site: responsive phone mockup sizing and perfect aspect-ratio to fit laptops and mobile
- site: showcase revamp, brand svgs, smartphone preview, remove web-app ctas, expanded footer account links

### 📚 Docs
- manual steps rewritten to the real remaining list

### 🛠 Maintenance
- repo: pin LF line endings for generated text (CRLF churn source)

### 🧩 Other
- modals: polish auth and contact modal alignment and mobile scrolling
- NEXUS update 2026-10-25 19:49
- NEXUS update 2026-10-25 19:42
- NEXUS update 2026-10-25 19:33
- NEXUS update 2026-10-25 19:23
- NEXUS update 2026-10-25 19:14
- NEXUS update 2026-10-25 19:06
- NEXUS update 2026-10-25 18:54
- NEXUS update 2026-10-25 18:47
- NEXUS update 2026-10-25 17:22
- web-app browser links removed; download grid fix
- download version honesty and footer fix (mirror)
- English-only PDFs for Whop (no personal name), generator script

## v1.0.14

### ✨ Added
- server-side pack (delete account, client errors, migrations), automation engine, layout shell, legal PDFs, site polish, scene/device guards, license PolyForm Shield, format fixes
- ai: only real AI answers use credits; local commands free; whop webhook handles real payload shapes

### 🐛 Fixed
- gradle comment encoding

### 🔒 Security
- stronger web app headers; remove stray files with local paths

### 📚 Docs
- rule - test every screen with no devices / one device / offline
- manual steps now point to GitHub issues
- manual steps updated

### 🛠 Maintenance
- release 1.0.14 (version bump)

### 🧩 Other
- scene button says 'no compatible device' when paired devices cannot run the scene
- AI protect scan button says 'add a device first' when no devices
- scene CTA says 'add a device first' when no devices are paired
- operator shown as NEXUS only (no personal name)
- PolyForm Shield 1.0.0 (no personal name); neutral author; remove personal paths/email from scripts
- remove site AI widget and its worker origin
- natural, varied replies (TR/EN)
- ai worker: per-IP spam rate limit (15/min)

## v1.0.13

### ✨ Added
- devices: WiZ, LIFX, Govee (desktop UDP bridge) and Sonoff DIY connectors with protocol tests
- monitor: hourly health check and daily summary to Discord
- Discord daily stats + payment notifications, signed Android release build, Android no longer test
- site: account links and login redirect
- ai: real AI fallback in app chat via Workers AI; worker source in scripts
- site: floating NEXUS AI helper backed by Workers AI

### 📚 Docs
- manual steps - releases are published, catch-up automated
- renumber manual steps
- manual steps final (Google OAuth + email templates done)
- manual steps trimmed
- manual steps after Whop legal/webhook completion
- pending manual steps updated (release blocked by Actions quota)

### 🛠 Maintenance
- version 1.0.13
- web/site auto-deploy, signed Android release workflow, one-time automation setup script, weekly backup, dev rules
- catch-up workflow finishes local-built releases automatically once Actions works

### 🧩 Other
- privacy policy covers Workers AI chat; fix PDF generation
- IndexNow key

## v1.0.12

### ✨ Added
- billing: TRY and USD NEXUS+ plans, honest plan cards and Plus features, new site title; 1.0.12
- legal: single-source TR/EN privacy, terms, refund policies; site pages and Whop PDFs

### 📚 Docs
- Whop business branded; remaining Whop legal docs
- SMTP done
- no captcha (email verification is enough)
- manual steps reflect current verified state
- manual steps updated for Whop webhook, SMTP and live tests

### 🛠 Maintenance
- site: sync footer fixes into www/public

## v1.0.11

### ✨ Added
- billing: NEXUS+ subscriptions via Whop (webhook -> Supabase entitlements), real AI credit allowance (30/day free, 2000/month NEXUS+), real pricing on site; 1.0.11

## v1.0.10

### ✨ Added
- brand support email (nexus.smarthome.app@gmail.com) in site, privacy pages, app feedback form and package metadata; 1.0.10

### 📚 Docs
- free branded Gmail SMTP path, Whop suspension note
- drop Yandex from manual steps
- manual steps updated; site: Search Console verification file
- remove completed Supabase steps
- manual steps list only pending items
- captcha note; sync site fallback version 1.0.9

### 🛠 Maintenance
- seo: Bing verification meta, manual steps updated

## v1.0.9

### ✨ Added
- account: real Supabase account sync (profile/settings/scenes restore), real password reset + change, session key fix, auto-sync on every page; desktop: background update checks + compact green update icon beside theme toggle; 1.0.9

### 🛠 Maintenance
- drop legacy server-bundle job (pipeline replaced by desktop-release + www sync)
- cloud-config.js is generated, not tracked
- site: sync www/public with published site (1.0.8)
- point stale tests at www/public and scripts/sync-www.mjs; docs: search-engine registration steps

### 🧩 Other
- normalize line endings (prettier lf) for flagged files

## v1.0.8

### ✨ Added
- site,app: SEO + brand download cards, remove unverified contact emails, point to nexus-smarthome.pages.dev, drop 500MB placeholder installers from web bundle; bump 1.0.8
- auth: Google sign-in via Supabase OAuth redirect; set user before writing session

### 🧩 Other
- remove outdated docs, backups, debug images, macOS build target; update README and manual guide

## v1.0.7

### 🛠 Maintenance
- desktop: bump to 1.0.7 (cloud sync enabled)
- desktop: inject cloud config from repo variables; add proprietary LICENSE; legal step in manual guide
- desktop: write cloud-config.js from repo variables so released builds have cloud sync

## v1.0.6

### 🐛 Fixed
- plus: no fake subscription; show coming-soon message

### 📚 Docs
- account, Supabase and sync test steps in manual guide
- manual steps guide (lowest-cost path)

### 🛠 Maintenance
- desktop: bump to 1.0.6

### 🧩 Other
- English translations for new desktop/app strings
- prettier formatting for CI

## v1.0.5

### ✨ Added
- NEXUS 1.0.3 — update download, AI card, device warnings, option pickers, sticky desktop header, responsive fixes
- desktop: redesign update card and NEXUS AI sidebar button; bump to 1.0.2
- authentic brand SVGs, full Turkish localization, and Live badge alignment

### 🐛 Fixed
- home: quick-run card icons match default card icon size, no circle wrapper
- home: quick-run cards use the same size and 2-column grid as other home cards
- desktop: AI card full width, icon aligned with profile avatar
- settings: hide empty update card
- ui: center dialog title and message
- ui: primary action buttons use brand blue in both themes
- ui: stable scrollbar gutter and page fade-in to prevent content shift on navigation
- desktop: sticky header and message tabs; final browser sweep fixes
- marketing: resolve footer redirect loop, fix text overflow in cards, and optimize 60fps scrolling

### 🧹 Refactoring
- marketing: remove context tags from automation card

### 🛠 Maintenance
- desktop: bump to 1.0.5 (windows, macos, linux)
- desktop: bump to 1.0.4
- remove 59 unreferenced product JPGs (replaced by PNG catalog images, -12.9 MB)
- desktop: bump version to 1.0.1

### 🧩 Other
- NEXUS update 2026-10-24 17:06
- NEXUS update 2026-10-24 03:52
- NEXUS update 2026-10-24 03:44
- NEXUS update 2026-10-24 03:33

