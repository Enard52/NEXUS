# NEXUS — local-first smart home / yerel-öncelikli akıllı ev

Cihazlarınla yerel ağda konuşan tek uygulama; hub veya bulut ücreti gerektirmez. Windows · Linux · Android · Web (PWA).

> **Temel kural:** uygulama asla rol yapmaz. Gerçek cihaz durumu, gerçekten çalışan otomasyonlar, dürüst enerji rakamları. Henüz desteklenmeyen şey arayüzde açıkça söylenir (`CLAUDE.md`).

## Mimariye hızlı bakış

```
depo kökü (tek kaynak)               üretilen kopyalar — elle düzenlenmez
├─ stitch-*.html   62 ekran    →  www/  (sync-www.mjs)        → web uygulaması (Cloudflare Pages: nexus-web)
├─ *.js (theme, data, device-    →  desktop/app (prepare-app)  → Electron (nexus:// protokolü)
│  controls, lan-connectors,     →  android assets (cap sync)  → Capacitor APK (imzalı)
│  automation-engine.js)
├─ css/            tasarım sistemi + kabuk ölçüleri (--nx-header-h/--nx-nav-h)
├─ www/public/     tanıtım sitesi (site-content.mjs + site-build.mjs) → nexus-smarthome.pages.dev
├─ supabase/       Edge Functions (whop-webhook, daily-stats, weekly-backup, delete-account, client-error) + migration'lar
├─ scripts/        derleme/doğrulama araçları (measure-layout, verify-automation-live, site-*, legal-pdf, bump-version…)
├─ packages/       birim-testli modüller (vitest: 900+ test)
└─ desktop/        Electron main/preload (tepsi modu, otomatik güncelleme, otomasyon çalışanı)
```

- **Hesap & senkron:** Supabase (e-posta + Google); profil/ayar senkronu isteğe bağlı, cihazlar yerel kalır.
- **Ödeme:** Whop (NEXUS+ aylık/yıllık, TRY/USD) → imzalı webhook → yetkiler.
- **Yapay zekâ:** yerel komutlar ücretsiz; bulut sohbet Workers AI (hız limitli), kredi sayacı istemcide; sunucu tarafı RPC hazır (`supabase/migrations/20261025_server_side_pack.sql`).
- **Otomasyonlar:** `automation-engine.js` — saat ve gün batımı tetikleyicileri cihazda yürür; masaüstünde tepsideyken de sürer (`automation-worker.html`).

## Sık kullanılan komutlar

```bash
pnpm install
pnpm test                              # tüm süit (birim + koruma testleri)
node scripts/sync-www.mjs              # kök → www
node desktop/scripts/prepare-app.cjs   # → desktop/app
npx cap sync android                   # → android (yayın için APK yeniden derlenir)
npm run site:full                      # ekran görüntüleri + site derlemesi
node scripts/bump-version.mjs <x.y.z> [--commit] [--changelog] [--notes <v>]
node scripts/measure-layout.mjs --check        # kabuk tutarlılık kapısı
node scripts/verify-automation-live.mjs        # otomasyon motoru E2E (Playwright)
node scripts/verify-site.mjs                   # site E2E (Playwright)
```

## Yayın akışı

- `main`'e push → site + web uygulaması otomatik (`web-deploy.yml`).
- `v*` etiketi → masaüstü + Android derlemeleri [nexus-releases](https://github.com/Enard52/nexus-releases)'e (sağlama + SBOM: `release-manifest.mjs`). Sürüm artırma: `scripts/bump-version.mjs`.
- Bulut ayarları: `cloud-config.js` yerelde, Git'te yok (örnek: `cloud-config.example.js`).

## Belgeler

- `CLAUDE.md` — geliştirici kuralları (dürüstlük, gizli anahtar, fiyat tek kaynağı)
- `CONTRIBUTING.md` — katkı rehberi
- `SECURITY.md` — güvenlik açığı bildirimi
- `MANUEL-ADIMLAR.md` — sahibinin manuel adımları (Türkçe, adım adım)
- Yasal (TR/EN): `legal-pdf/` — üretim: `node scripts/legal-pdf.mjs`

Lisans: PolyForm Shield 1.0.0 (`LICENSE`).
