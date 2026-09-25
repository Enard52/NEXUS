# Masaüstü (Electron) Kaldırma + Build Temizliği — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Electron masaüstü uygulaması, installer sihirbazı ve `@nexus/desktop` paketini, hiçbir build/test/site/mobil akışı bozmadan projeden kaldırmak; sitenin indirme bölümünü mobile çevirmek.

**Architecture:** Masaüstü üç katmanda yaşıyor: (1) Electron kabuğu (`desktop-app/`) + installer sihirbazı (`installer/`) + onların script'leri, (2) `@nexus/desktop` workspace paketi (windowed-shell renderer + setup sihirbazı üreteci) ve onu kullanan `packages/server` (`/app` rotasında desktop UA ayrımı) ile `packages/web` testleri, (3) sitenin masaüstü indirme CTA'ları. Kaldırma bu sırayla, her katmanda test+typecheck yeşil tutularak yapılır.

**Tech Stack:** pnpm 10 monorepo, TypeScript, vitest, tsx.

**Spec:** `docs/superpowers/specs/2026-09-26-mobil-oncelikli-yayin-design.md` (Bölüm 2.3)

## Global Constraints

- Mobil uygulama (`mobile-app/`, kök `stitch-*.html`) ve pazarlama sitesi tasarımı **bozulmayacak**.
- Her task sonunda `pnpm typecheck` ve `pnpm test` yeşil olmalı.
- Git geçmişi zaten her şeyi koruyor — silme güvenli; geri dönüş `git` üzerinden.
- Commit mesajları İngilizce, conventional format (`chore:`, `feat:`).
- `EXTERNAL-REQUIREMENTS.md` güncellenecek: "Kod İmzalama & Dağıtım — FAZ 18" masaüstü maddeleri kalkar.

---

### Task 1: Baseline — mevcut yeşil durumu doğrula

**Files:** (yok — sadece doğrulama)

- [ ] **Step 1: Test ve typecheck baseline**

Run: `pnpm typecheck && pnpm test`
Expected: PASS (mevcut durum yeşil). Kırmızıysa DUR — önce mevcut kırığı raporla, kaldırma işine karıştırma.

- [ ] **Step 2: Masaüstü referans envanteri (silme listesi doğrulaması)**

Run: `grep -rln "@nexus/desktop" packages --include="*.ts" --include="*.json" | grep -v node_modules`
Expected (tam liste):
- `packages/server/package.json`
- `packages/server/src/pages.ts`
- `packages/server/src/app.ts`
- `packages/web/src/empirical-ui-verification.test.ts`

Başka dosya çıkarsa plana ekle.

- [ ] **Step 3: Commit yok** — bu task sadece okuma.

---

### Task 2: Electron kabuğu, installer ve script'lerin silinmesi

**Files:**
- Delete: `desktop-app/` (tüm dizin)
- Delete: `installer/` (tüm dizin)
- Delete: `scripts/copy-desktop-resources.mjs`
- Delete: `scripts/verify-desktop.mjs`
- Modify: `package.json` (kök) — script temizliği

**Interfaces:**
- Consumes: yok
- Produces: Kök `package.json` script'lerinde `desktop-app`/`installer`/`copy-desktop-resources`/`verify-desktop` kelimesi geçmemeli.

- [ ] **Step 1: Dizin ve script dosyalarını sil**

Run:
```bash
git rm -r --quiet desktop-app installer scripts/copy-desktop-resources.mjs scripts/verify-desktop.mjs
```

- [ ] **Step 2: Kök `package.json` script temizliği**

`package.json` içinde şu iki satırı sil:
```json
    "build": "pnpm build:static && pnpm build:client && pnpm build:server && node scripts/copy-desktop-resources.mjs",
    "build:desktop": "cd desktop-app && npm install && npm run build:win",
```
yerine:
```json
    "build": "pnpm build:static && pnpm build:client && pnpm build:server",
```
(`build:desktop` satırı tamamen kalkar.)

- [ ] **Step 3: Kalan referans taraması**

Run: `grep -rn "desktop-app\|copy-desktop-resources\|verify-desktop" package.json scripts/*.mjs`
Expected: boş (hiç eşleşme yok).

- [ ] **Step 4: Test + typecheck**

Run: `pnpm typecheck && pnpm test`
Expected: PASS (bu katman silinince TS paketleri etkilenmez; `build:static` henüz `@nexus/desktop build:setup` çağırdığı için `pnpm build:static` BU TASK'TA ÇALIŞTIRILMAZ — Task 4'te düzelecek).

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "chore: remove Electron desktop shell, installer wizard and their build scripts"
```

---

### Task 3: Server'dan desktop yüzey ayrımının kaldırılması

**Files:**
- Modify: `packages/server/src/pages.ts` (satır ~45 import, ~477-496 fonksiyon)
- Modify: `packages/server/src/app.ts` (satır ~35-36 import, ~804-811 UA ayrımı)
- Modify: `packages/server/package.json` (satır 31 dependency)
- Test: `packages/server/src` altındaki ilgili testler (varsa desktop rotası beklentisi)

**Interfaces:**
- Consumes: `renderDesktopDocument` (`@nexus/desktop`), `isDesktopUserAgent` (`packages/server/src/ua.ts` veya benzeri — Task içinde `grep -rn "isDesktopUserAgent" packages/server/src` ile konum doğrulanır)
- Produces: `/app` rotası desktop UA için `renderAppDocument`'a düşer. `renderDesktopAppDocument` export'u kalkar — başka tüketicisi olmadığı Task 1 envanteriyle doğrulandı.

- [ ] **Step 1: Failing test — desktop UA beklentisi kalkmalı**

Önce mevcut davranışı kilitleyen test var mı gör:

Run: `grep -rn "renderDesktopAppDocument\|isDesktopUserAgent\|Desktop" packages/server/src/*.test.ts | head -20`

Desktop UA → windowed-shell bekleyen test varsa, o testi yeni beklentiye çevir: desktop UA artık `renderAppDocument` (web SPA) HTML'i döner — windowed-shell işaretleri (`win-open`, `sidebar-pulse`, `nx-desktop` gibi shell'e özgü string'ler) **içermediğini** assert et. Test adı örnek: `"/app serves the web SPA shell to desktop user agents"`.

Run: `pnpm --filter @nexus/server test`
Expected: FAIL (kod hâlâ desktop shell dönüyor).

- [ ] **Step 2: `pages.ts` — import ve fonksiyon silme**

Şu import satırını sil:
```ts
import { renderDesktopDocument } from "@nexus/desktop";
```
Şu fonksiyonu (docstring'iyle birlikte, satır ~477-496) sil:
```ts
export function renderDesktopAppDocument(
  account: Account,
  data: UserData,
  theme: ThemeName = "dark",
): string {
  setLocale(data.language);
  const { screens } = buildUserScreens(account, data);
  return renderDesktopDocument({
    theme,
    screens,
    displayName: data.displayName,
    locale: data.language,
    authenticated: true,
  });
}
```

- [ ] **Step 3: `app.ts` — import ve UA ayrımı**

İmport listesinden `renderDesktopAppDocument,` satırını sil.
`/app` rotasındaki ayrımı:
```ts
      const html = isDesktopUserAgent(ua)
        ? renderDesktopAppDocument(account, data)
        : isMobileUserAgent(ua)
          ? renderMobileAppDocument(account, data)
          : renderAppDocument(account, data, ua);
```
şuna çevir:
```ts
      const html = isMobileUserAgent(ua)
        ? renderMobileAppDocument(account, data)
        : renderAppDocument(account, data, ua);
```
`isDesktopUserAgent` başka yerde kullanılmıyorsa tanımını da sil (`grep -rn "isDesktopUserAgent" packages/server/src` ile doğrula).

- [ ] **Step 4: `packages/server/package.json`**

Şu satırı sil:
```json
    "@nexus/desktop": "workspace:*",
```

- [ ] **Step 5: Test + typecheck**

Run: `pnpm install && pnpm typecheck && pnpm --filter @nexus/server test`
Expected: PASS (lockfile güncellenir; `@nexus/desktop` hâlâ workspace'te olduğu için import hatası olmamalı — pages.ts temizlendi).

- [ ] **Step 6: Commit**

```bash
git add packages/server
git commit -m "feat(server): drop desktop windowed-shell surface; desktop UAs get the web SPA"
```

---

### Task 4: `@nexus/desktop` paketinin silinmesi + web test temizliği

**Files:**
- Delete: `packages/desktop/` (tüm dizin)
- Modify: `packages/web/src/empirical-ui-verification.test.ts` (satır ~1-15 import, ~291-330 desktop blokları)
- Modify: `package.json` (kök) — `build:static` içinden `pnpm --filter @nexus/desktop build:setup &&` kaldır

**Interfaces:**
- Consumes: Task 3 çıktısı (server artık paketi import etmiyor)
- Produces: Workspace'te `@nexus/desktop` yok; `pnpm build:static` çalışır.

- [ ] **Step 1: Web test dosyası desktop blokları — önce testi boz, sonra temizle**

`packages/web/src/empirical-ui-verification.test.ts` içinde:
- Import bloğundan (satır ~1-15) `../../desktop/src/index.js`'den gelen import'ları (`renderDesktopStyles`, `renderDesktopDocument` vb.) sil.
- `describe("6. Responsive CSS...")` içindeki şu desktop assertion'larını sil (test adları web/mobile'a daraltılır):
  - Satır ~299-300: `const desktopCss = renderDesktopStyles(darkTheme); expect(desktopCss).toContain("backdrop-filter: blur(20px)");`
  - Satır ~315-318: `desktopCss` üç `@keyframes` assertion'ı (`win-open`, `sidebar-pulse`, `content-slide`)
- Dosyada başka `desktop` kelimesi geçen **shell'e özgü** assertion kalmamalı; `render.ts:1772` `.desktop-only` CSS utility sınıfı web yüzeyine aittir, ONA DOKUNMA.

Run: `pnpm --filter @nexus/web test`
Expected: PASS (paket hâlâ diskte; import silinince test bağımsız koşar).

- [ ] **Step 2: Paketi sil**

Run: `git rm -r --quiet packages/desktop`

- [ ] **Step 3: Kök `build:static` temizliği**

`package.json`:
```json
    "build:static": "pnpm --filter @nexus/web build:site && pnpm --filter @nexus/desktop build:setup && node scripts/fix-review-avatars.mjs && node scripts/copy-static.mjs",
```
şuna:
```json
    "build:static": "pnpm --filter @nexus/web build:site && node scripts/fix-review-avatars.mjs && node scripts/copy-static.mjs",
```

- [ ] **Step 4: Kalan tüm referansları süpür**

Run: `grep -rn "@nexus/desktop" packages scripts package.json pnpm-workspace.yaml tsconfig*.json 2>/dev/null | grep -v node_modules`
Expected: boş. Çıkan her eşleşme ilgili dosyadan temizlenir (ör. `scripts/scaffold-modules.mjs` modül listesi, `sbom.json` üretilmiş envanter — sbom için üreten script varsa yeniden üret, yoksa elle ilgili girdileri sil).

- [ ] **Step 5: Tam doğrulama**

Run: `pnpm install && pnpm typecheck && pnpm test && pnpm build:static`
Expected: hepsi PASS; `public/` site çıktısı üretilir.

- [ ] **Step 6: Mobil build etkilenmedi**

Run: `cd mobile-app && npm run build:web`
Expected: `www/` yeniden üretilir, hata yok. (Kök stitch sayfalarına dokunulmadı.)

- [ ] **Step 7: Commit**

```bash
git add -A packages/web package.json pnpm-lock.yaml scripts
git commit -m "chore: remove @nexus/desktop package and desktop setup-wizard build step"
```

---

### Task 5: Site indirme bölümü mobile çevrilsin

**Files:**
- Modify: `packages/web/src/render.ts` (satır ~967-969 nav linkleri)
- Modify: `packages/web/src/marketing-premium.ts` (indirme merkezi bölümü — konum: `grep -n "NEXUS-Setup\|downloads\|Windows\|macOS" packages/web/src/marketing-premium.ts | head -30`)
- Test: `packages/web/src` altında indirme bölümünü assert eden testler (aynı grep ile bulunur)

**Interfaces:**
- Consumes: Task 4 (build:static artık desktop'suz çalışıyor)
- Produces: Sitede masaüstü installer CTA'sı kalmaz; "Android (Google Play — yakında)", "Direkt APK", "iOS (App Store — yakında)" CTA'ları mevcut tasarım diliyle.

- [ ] **Step 1: Failing test — indirme bölümü mobil CTA beklesin**

İndirme bölümünü render eden testte (yoksa marketing render testine ekle):
```ts
expect(html).not.toContain("NEXUS-Setup");
expect(html).toContain("Google Play");
expect(html).toContain("APK");
```
Run: `pnpm --filter @nexus/web test` → FAIL.

- [ ] **Step 2: Nav linkleri**

`render.ts` satır ~967-969:
```ts
          <li><a href="#desktop">Windows</a></li>
          <li><a href="#desktop">macOS</a></li>
          <li><a href="#desktop">Linux</a></li>
```
şuna:
```ts
          <li><a href="#download">Android</a></li>
          <li><a href="#download">iOS</a></li>
```
(Çapa hedefi indirme merkezi bölümünün gerçek `id`'siyle eşleşmeli — marketing-premium.ts'teki bölüm id'si neyse o kullanılır.)

- [ ] **Step 3: İndirme merkezi içeriği**

`marketing-premium.ts` içindeki OS-kart/indirme bölümünü: üç masaüstü kartı yerine iki mobil kart (Android / iOS). Mevcut kart HTML yapısı, ikon dili (inline SVG/Lucide), buton sınıfları **aynen korunur** — sadece içerik ve hedef değişir:
- Android kartı: birincil buton "Google Play" (`href="#"` + `aria-disabled` "yakında" rozeti), ikincil "Direkt APK indir" (`/downloads/` altına Plan 6'da APK gelecek; şimdilik `href="#"` yakında rozetiyle).
- iOS kartı: "App Store" butonu yakında rozetiyle.
- Türkçe + İngilizce her iki locale de güncellenir (i18n deseni dosyada nasılsa öyle).

- [ ] **Step 4: Test + build**

Run: `pnpm --filter @nexus/web test && pnpm build:static`
Expected: PASS; üretilen `public/index.html` içinde `NEXUS-Setup` geçmez.

Run: `grep -c "NEXUS-Setup" public/index.html`
Expected: `0`

- [ ] **Step 5: Commit**

```bash
git add packages/web public
git commit -m "feat(web): switch download center from desktop installers to mobile (Play/APK/App Store)"
```

---

### Task 6: Dokümantasyon ve kapanış doğrulaması

**Files:**
- Modify: `EXTERNAL-REQUIREMENTS.md`
- Modify: `ROADMAP.md` (masaüstü fazına not)

- [ ] **Step 1: `EXTERNAL-REQUIREMENTS.md` güncelle**

"Kod İmzalama & Dağıtım — FAZ 18" bölümünü şununla değiştir:

```markdown
## Kod İmzalama & Dağıtım — FAZ 18 (GÜNCELLENDİ 2026-09-26)

- **Karar:** Electron masaüstü uygulaması kaldırıldı (Yol A: mobil-öncelikli yayın,
  bkz. `docs/superpowers/specs/2026-09-26-mobil-oncelikli-yayin-design.md`).
  Masaüstü, Faz 2'de mobil tasarımdan sıfırdan üretilecek.
- **Gereken (mobil):** Google Play Console hesabı ($25 tek sefer); iOS için Apple
  Developer ($99/yıl, karar kullanıcıda).
- **Yapılacak:** Release APK üretimi + SHA-256 checksum; `public/downloads/` altına
  APK yerleşimi. Authenticode/notarization maddeleri Faz 2'ye ertelendi.
```

- [ ] **Step 2: `ROADMAP.md` notu**

Masaüstü/Electron'dan bahseden satırlara yönlendirme notu: `(2026-09-26: kaldırıldı — bkz. specs/2026-09-26-mobil-oncelikli-yayin-design.md, Faz 2'de sıfırdan)`. ROADMAP'in geri kalanına dokunma.

- [ ] **Step 3: Final tam doğrulama**

Run: `pnpm install && pnpm typecheck && pnpm test && pnpm build:static && cd mobile-app && npm run build:web`
Expected: tümü PASS.

Run (repo kökü): `grep -rln "Electron" packages src scripts *.json 2>/dev/null | grep -v node_modules`
Expected: boş veya sadece yorum/doküman satırları — kalan her eşleşme raporda listelenir.

- [ ] **Step 4: Commit**

```bash
git add EXTERNAL-REQUIREMENTS.md ROADMAP.md
git commit -m "docs: record desktop removal and mobile-first publishing requirements"
```
