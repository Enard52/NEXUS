# Changelog / Değişim Günlüğü

_Bu dosya `node scripts/bump-version.mjs --changelog` ile Conventional Commits'ten üretilir; elle düzenlenmez._

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

