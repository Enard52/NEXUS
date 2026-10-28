# Changelog / Değişim Günlüğü

_Bu dosya `node scripts/bump-version.mjs --changelog` ile Conventional Commits'ten üretilir; elle düzenlenmez._

## Unreleased

### 🐛 Fixed
- site: make the download mirror an explicit emergency brake
- desktop: losing the single-instance lock must exit before building UI
- android: declare CAMERA so QR pairing can actually open the camera
- site: never downgrade a visitor to a stale installer when the release API is blocked

## v1.0.27

### 🐛 Fixed
- site: download-card button points at the installer repository
- desktop: never call ready-gated Electron APIs while loading main

### 🛠 Maintenance
- release: v1.0.27 — Windows açılış çökmesi düzeltildi

### 🧩 Other
- stop horizontal content shift when a modal opens

