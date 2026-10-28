# Changelog / Değişim Günlüğü

_Bu dosya `node scripts/bump-version.mjs --changelog` ile Conventional Commits'ten üretilir; elle düzenlenmez._

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

