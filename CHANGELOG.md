# Changelog / Değişim Günlüğü

_Bu dosya `node scripts/bump-version.mjs --changelog` ile Conventional Commits'ten üretilir; elle düzenlenmez._

## v1.0.57

### 🐛 Fixed
- billing: link NEXUS+ payments to the account id, not the checkout email

### 📚 Docs
- store: refine Store listing drafts with clear purpose and benefits
- add comprehensive Microsoft Store Partner Center listing drafts for v1.0.56

### 🛠 Maintenance
- release: complete v1.0.56 changelog, winget manifest and site version chips

### 🧩 Other
- v1.0.57
- fix prettier formatting in site-translations.test.ts

## v1.0.56

### ✨ Added
- site-i18n: expand localized site content and UI strings across all 68 languages
- i18n: finalize 68-language coverage across site UI dictionaries and fix screenshot fallback
- site: build RTL pages, site-ui extraction tools and localized site assets
- ai: ensure assistant strictly replies in the user-selected language across all 68 languages
- site: complete 68-language marketing site translations and fix loader

### 🐛 Fixed
- i18n: fill every untranslated UI string in 35 languages, rtl site pages, site-content checker
- legal: drop the convenience-translation notice, right-to-left legal pages, regenerated PDFs

### 📚 Docs
- reflect 68 supported languages across repo documentation and AI facts

### 🛠 Maintenance
- release: v1.0.56
- i18n: add ts-expect-error annotations for script imports
- site: assert registered community language translation and unregistered fallback

### 🧩 Other
- prettier format for the legal translation tests

## v1.0.55

### ✨ Added
- legal: privacy, terms and refund texts in all 66 community languages (PDF + site)
- i18n: populate full UI translations for all 66 community languages
- stop offering connectors that need an account, local key or broker (Tapo, Tuya local, Zigbee2MQTT)
- site: show country flags in the language menu

### 🐛 Fixed
- site: remove footer star pill; contributor ranking skips bots and counts issue/comment help
- site: installer repo links for macOS/iPhone, swap Windows buttons, mark connectors that need credentials
- site: center the language menu under its button and hide its scrollbar
- site: language menu no longer wraps or clips entries

### 🛠 Maintenance
- site: update 68-language static marketing site for v1.0.54

### 🧩 Other
- v1.0.55
- ﻿feat: typed desktop notification icons, plan list in checkout, 66-language UI, iOS package path fix

## v1.0.54

### 🐛 Fixed
- desktop: allow NSIS language fallbacks instead of failing the Windows build

### 🧩 Other
- v1.0.54

## v1.0.53

### 🐛 Fixed
- desktop: drop Romanian from the NSIS installer languages
- site: replace the 68-pill language bar with a dropdown

### 🧩 Other
- v1.0.53

## v1.0.52

### ✨ Added
- i18n: auto-detect native system language for desktop, onboarding, and installer

### 🐛 Fixed
- web: drop unsupported brands and Matter/HomeKit claims from marketing copy

### 🧩 Other
- v1.0.52

## v1.0.51

### ✨ Added
- app: single-page device catalog, flicker fix, faster scan, smaller desktop bundle

### 🛠 Maintenance
- site: update version badge to v1.0.50 following desktop dependency bump
- deps: bump the minor-and-patch group with 6 updates (#173)
- deps-dev: bump electron from 44.9.3 to 45.2.1 in /desktop (#172)
- deps: bump electron-updater from 6.8.9 to 6.8.11 in /desktop (#171)
- deps: bump actions/setup-java from 4 to 6 (#170)
- deps: bump actions/attest-build-provenance from 2 to 4 (#169)

### 🧩 Other
- v1.0.51

## v1.0.50

### ✨ Added
- v1.0.50 - network scan stays on the device's own subnet instead of sweeping 9 more ranges
- i18n: add community translations for 65 languages (closes #180, closes #181, closes #182, closes #183, closes #184, closes #185, closes #186, closes #187, closes #188, closes #195, closes #196, closes #197, closes #198, closes #199, closes #200, closes #201, closes #202, closes #203, closes #204, closes #205, closes #206, closes #207, closes #208, closes #209, closes #210, closes #211, closes #212, closes #213, closes #214, closes #215, closes #216, closes #217, closes #218, closes #219, closes #220, closes #221, closes #222, closes #223, closes #224, closes #225, closes #226, closes #227, closes #228, closes #229, closes #230, closes #231, closes #232, closes #233, closes #234, closes #235, closes #236, closes #237, closes #238, closes #239, closes #240, closes #241, closes #242, closes #243, closes #244, closes #245, closes #246, closes #247, closes #248, closes #249, closes #250)

## v1.0.49

### ✨ Added
- v1.0.49 - page no longer reloads every 45 s from cloud sync; local device fields (mac) survive sync
- i18n: add German (de) translation (closes #179)
- legal: make legal pages and PDFs language-agnostic with English fallback (closes #191)
- site: generate marketing site for every registered language (closes #190)

### 🐛 Fixed
- sync: preserve local fields during remote device merge and ignore timestamp churn

## v1.0.48

### ✨ Added
- v1.0.48 - remove Matter (needed a manual pairing code, not automatic)

### 🐛 Fixed
- i18n: push notifications and voice input beyond Turkish/English (#193)
- i18n: desktop menu, tray and jump list in every language (#192)
- i18n: eliminate dynamic strings in nexusT calls (#194)

### 🛠 Maintenance
- gitleaks allowlist for Tuya public broadcast key and synthetic test key

## v1.0.47

### ✨ Added
- v1.0.47 - Matter, Wake-on-LAN, Tuya LAN discovery, unified notice component
- searchable full-screen language picker; code-built strings and regex patterns are translatable; assistant replies in the chosen language
- community language layer (lang-<code>.js overlay, registry, lang-tool, docs)

## v1.0.46

### ✨ Added
- v1.0.46 - full-screen panels, real assistant-created scenes, more scenes/triggers, Siri shortcuts

### 🐛 Fixed
- guest mode icon in Discover was clipped at the top (standard users glyph)

## v1.0.45

### ✨ Added
- v1.0.45 - automatic anonymous error reports (incl. unhandled promises), no GitHub copy flow

## v1.0.44

### 🐛 Fixed
- v1.0.44 - update progress shows 100% only once

## v1.0.43

### 🐛 Fixed
- v1.0.43 - macOS universal build no longer fails the audit on the stub asar (Linux/Windows audit the same payload)

## v1.0.42

### 🛠 Maintenance
- site: MQTT is now a real connector; stop banning it in the site check
- site: install dependencies before building the site (simple-icons import broke site deploys)

### 🧩 Other
- fix/feat: v1.0.42 - Android Keystore secrets, macOS audit fix, docs refresh

## v1.0.41

### ✨ Added
- security-mode trigger/action, home arrive/leave trigger, remote address, Android widget (v1.0.41)

## v1.0.40

### 🐛 Fixed
- ui: notification sound/vibration toggles spacing, drop duplicate column labels

### 🛠 Maintenance
- bump version to 1.0.40
- allowlist verified gitleaks false positives (PEM markers, test dummies)
- run gitleaks from the official binary (action was blocked at startup)

### 🧩 Other
- ﻿feat: custom time picker, weekly Supabase backup, Android provenance, docs

## v1.0.39

### ✨ Added
- v1.0.39 - MQTT/Zigbee2MQTT, encrypted device secrets, error log, header auto-hide
- app: energy monitoring plan sheet and standalone voice input module
- catalog: manual catalog lists every supported model, risky generic items hidden (#168)
- pair: hide desktop-only brands on phone and browser (#167)
- SSDP auto-discovery, sensor catalog, tidier Add Device page (#166)
- site: Windows download points to the Microsoft Store; direct .exe stays as a secondary link (#161)

### 🐛 Fixed
- deps: patch minimatch DoS and glob traversal advisories
- checkout requires an account, FAQ corrections, plain Turkish wording (#163)
- site: signing notes reflect the Microsoft Store package vs the unsigned direct .exe (#162)
- desktop: Store tile background transparent so the rounded logo has no dark corners (#160)

### 🛠 Maintenance
- git: auto-push post-commit hook (commit on main = instant cloud backup)
- ci: encoding gate + i18n live check, tracked git hooks, new tests
- site: rebuild www/public from sources (signing notes, copy refreshes)

## v1.0.38

### 🐛 Fixed
- family: chat bubble wrap, banner flashing, avatar sync, board add feedback (#158)

### 🛠 Maintenance
- release: 1.0.38 (#159)

## v1.0.37

### 🐛 Fixed
- ui: Ev Ayari overlay transparent in dark mode (#156)
- site: site verifier reads household-page.js; refresh baked version badge to v1.0.36 (#155)

### 🛠 Maintenance
- release: 1.0.37 (#157)

## v1.0.36

### ✨ Added
- app: family set, device images, protocol cards, button icons (#153)
- desktop: Microsoft Store (MSIX/appx) package and manual build workflow (#152)
- layout: tablet landscape uses the two-pane layout, slim bottom nav on landscape phones, tablet audit (Part of #84) (#150)
- a11y: focus management for bottom sheets + consistent focus rings (Part of #75) (#137)
- ux: retry + help link on LAN scan errors in the pair screen (Part of #60) (#129)
- energy: include stored history in CSV/JSON export (#125)
- device: optional custom photo per device, stored locally only (#59) (#118)
- energy: local usage history chart and tariff-based cost estimate (Part of #82) (#117)
- automation: weather trigger (temp/wind/rain threshold) (Part of #98) (#116)
- ux: login-error reset link + settings search (Part of #60) (#112)
- app: in-app new-version banner for the mobile shell (#111)
- energy: export the latest real power readings as CSV or JSON (#106)

### 🐛 Fixed
- platform: stop shell/AppleScript injection in macOS adapter (Part of #89) (#136)
- platform: stop shell/PowerShell injection in Windows adapter (Part of #89) (#135)
- nanoleaf: on-last colour body, ct floor 1200 K, verification notes (Part of #51) (#130)
- security: quote arguments in Linux platform adapter shell commands (#124)
- ci: remove unused import that broke typecheck on main (#121)
- a11y: dark-mode contrast sweep - muted text, accent text, amber boxes, status chips (#114)
- ci: ios-unsigned copies web assets and config.xml with cap copy before building
- ci: serialize desktop release jobs (release-creation race, 422); iOS Package.swift points at the geolocation version in the lockfile
- ci: ios-unsigned installs dependencies so the local Swift packages resolve

### 📚 Docs
- ai: community registry of free OpenAI-compatible providers (Part of #69) (#115)
- make the remote-access guide match the code (local-address guard, UDP/TCP limits) (#110)
- step-by-step guide to authoring a LAN connector (starter template + test skeleton) (#105)

### 🧹 Refactoring
- app: move nexus-integrations inline script to its own file (Part of #102) (#151)

### 🛠 Maintenance
- release: 1.0.36 (#154)
- scripts: remove 11 dead :8766 probes, add scripts/README.md (Part of #102) (#149)
- web: unit tests for drag-to-dismiss sheet gestures (Part of #89) (#147)
- ai-fab: cover exclusions, preference, single button, docking and navigation (Part of #89) (#146)
- assistant: unit tests for nexus-assistant + DND phrase fix (#145)
- edge: notify-email logic + tests, subject CR/LF fix (Part of #89) (#144)
- web: unit tests for smart-scene-page.js (Part of #89) (#143)
- edge: daily-stats pure logic extracted + real behavior tests (Part of #89) (#142)
- edge: push-send pure logic extraction + tests (Part of #89) (#141)
- client-error: extract logic + tests, fix null-body crash (Part of #89) (#140)
- edge: delete-account logic extracted + real behavior tests (Part of #89) (#139)
- card-detail-state: empty states and device-derived pages + Turkish vacuum keyword fix (#134)
- security: rate-limit tests + fix retryAfterMs accuracy (Part of #89) (#133)
- server: unit tests for per-user data store (Part of #89) (#132)
- i18n: runtime tests for src/app/i18n.js against a minimal DOM (Part of #89) (#131)
- event-bridge: cover desktop tray status bridge (Part of #89) (#128)
- voice: unit tests for voice-profile speaker store and embedders (Part of #89) (#127)
- setup-codes: cover setup-code parsing; reject out-of-range IPv4 octets (#126)
- security: cover email-blocklist matching edge cases and list integrity (#123)
- notify: bring verify-notify up to date with the current UI (#104)
- Discord notifications for new issues, PRs, stars and failed workflows (needs DISCORD_WEBHOOK_URL repo secret; skipped without it)

### 🧩 Other
- ﻿docs: generated connector support matrix with staleness test (Part of #91) (#148)
- 44px back/action hit area in page headers + guard (Part of #88) (#138)
- ﻿feat(device): tap the product illustration to add/replace the device photo (Closes #59) (#122)
- ﻿feat(mqtt): MQTT 3.1.1 packet codec + Zigbee2MQTT/Tasmota topic mapping (Part of #50) (#120)
- ﻿feat(connector): Nanoleaf local Open API (Part of #51) (#119)
- unify page-header side insets (Part of #88) (#113)
- /contribute page (EN/TR) with connector guide, good first issues and credit policy (#108)
- grow the FAQ with 7 answers from real docs and issues (EN + TR) (#107)
- keyboard access + html label guard test (part of #75) (#109)
- more-downloads line (macOS, AppImage, rpm, Linux ARM64, iPhone guide)
- code signing policy page (EN/TR) linked from the footer; rebuild refreshes the fallback version badge

## v1.0.35

### 🐛 Fixed
- ci: build Linux arm64 with explicit AppImage/deb/rpm targets (snap was attempted and failed); feat(monitoring): hourly check also reports DB/user limit warnings and failed workflow runs to Discord

### 🧩 Other
- v1.0.35
- docs/ci: iOS build guide, operations (free-tier limits) and health-check script, post-release smoke workflow

## v1.0.34

### ✨ Added
- remove test-notification and separate permission buttons (system toggle asks for permission itself); Linux ARM64 + rpm builds; unsigned iOS IPA workflow for free-Apple-ID sideloading (unverified on a real iPhone)
- ui: accent color (6 presets + free color picker, default blue; override layer generated from the Tailwind build), in-app notification sound choice
- ui: font size setting, floating button toggles with hide-on-scroll search bubble, keyboard shortcuts overlay (?), desktop favorites grid fills rows
- monitoring: Discord dashboard with real stats (users, plus, family, GitHub, downloads, CI, free-tier) and corrected health checks (dead web-app host and wrong worker subdomain removed)

### 🛠 Maintenance
- android: a malformed GOOGLE_SERVICES_JSON secret no longer fails the release; the APK builds without push and the reason is logged

### 🧩 Other
- v1.0.34

## v1.0.33

### ✨ Added
- family: server-backed households, invites, permissions, chat, activity feed; Android push (FCM)
- app: notifications, sensor events, automations, backup, a11y, push groundwork

### 🐛 Fixed
- site: rebuild baked site at v1.0.32; gate allows real connectors (WiZ/LIFX/Govee now implemented)

### 📚 Docs
- governance and security policy match the new repository protection and private reporting
- roadmap: hand testing of Family and push to the community; server side is deployed
- roadmap, governance, compatibility table, remote-access guide; privacy policy names BigDataCloud

### 🛠 Maintenance
- android: write google-services.json from the GOOGLE_SERVICES_JSON secret when it exists (no secret, no push)
- audit-only job no longer uses the pnpm cache (Post Setup Node step failed with no store path)
- remove stray empty/error files from the repo root (cd, npx)
- CodeQL, 3-state UI audit with accessibility basics, device report form, CODEOWNERS

### 🧩 Other
- docs/test: README reflects the real connector list, platforms and test count; raise vitest timeouts (load flakes)

## v1.0.32

### ✨ Added
- settings: a11y mode live (html.nx-a11y), notifications card + DND shortcut, appearance header, in-app subscription management, energy sheet fixes, icon consistency
- notifications: surface ntfy + webhook channels, add email channel via notify-email Edge Function (self-address only, Resend; no client secrets)
- desktop: HomeKit (HAP) bridge — NEXUS devices become real Apple Home accessories; Apple Home command path via setField
- settings: honest badges — CarPlay Yakında + HomeKit Rehber, corrected CarPlay step-1 copy (screen is Android-free; bridge on desktop instead)

### 🐛 Fixed
- desktop: package-lock sync — hap-nodejs dependency tree missing from lockfile (broke macOS build)
- release: NEXUS_APP_VERSION 1.0.32 (version-consistency guard)

### 📚 Docs
- qa: HomeKit bridge protocol e2e (real module, hap-controller pair-setup) + iPhone pairing as human-gated step
- release: changelog entry for v1.0.31

### 🧩 Other
- prettier on 7 test files (CI format gate)
- v1.0.32 — desktop/android version bump, SW shell v10
- carry concurrent wave — lan/device/notify hardening, QR pairing, undo stack, a11y verify script, 5 new test suites
- carry concurrent wave — lan/device/notify hardening, new lan test suites, test brittleness fixes
- carry concurrent lan/device/notify wave + restore lang mirror identity

## v1.0.31

### ✨ Added
- feedback: tap/navigation sounds wired to the global click capture

### 🐛 Fixed
- site: emit the decode-guard U+FFFD as an escaped token
- release: bump-version mirrors the version constant into the www screen copy

### 📚 Docs
- release: changelog entry for v1.0.30

### 🧩 Other
- v1.0.31
- carry concurrent modal-head/product-image UI edits
- carry concurrent dialog/settings/scene edits + feedback-motion guard
- rebuild public pages with the v1.0.30 version chip

## v1.0.30

### 📚 Docs
- architecture guide, README accuracy, mirror-hygiene rule in CLAUDE.md
- release: changelog entry for v1.0.29

### 🧹 Refactoring
- finish the stitch->nexus rebrand across screens, mirrors and assets

### 🛠 Maintenance
- release-integrity: CI dependency-audit gate, opt-in macOS signing, recorded QA evidence
- add single-source mirror guard; deflake brand-assets splash test
- app: carry screen tweaks (pair, smart, welcome-home) and resync www/ios mirrors
- repo hygiene - drop unreferenced React SPA, binary junk and stale ignores

### 🧩 Other
- v1.0.30

## v1.0.29

### 🐛 Fixed
- mobile: ship the NEXUS brand mark as the app icon and splash
- ios: add the location usage description and lock capability declarations to a test

### 📚 Docs
- release: changelog entry for v1.0.28

### 🧩 Other
- v1.0.29

## v1.0.28

### 🐛 Fixed
- site: make the download mirror an explicit emergency brake
- desktop: losing the single-instance lock must exit before building UI
- android: declare CAMERA so QR pairing can actually open the camera
- site: never downgrade a visitor to a stale installer when the release API is blocked

### 🛠 Maintenance
- release: v1.0.28

## v1.0.27

### 🐛 Fixed
- site: download-card button points at the installer repository
- desktop: never call ready-gated Electron APIs while loading main

### 🛠 Maintenance
- release: v1.0.27 — Windows açılış çökmesi düzeltildi

### 🧩 Other
- stop horizontal content shift when a modal opens

## v1.0.26

### 🧩 Other
- NEXUS — local-first smart home: initial public release (v1.0.26)

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

