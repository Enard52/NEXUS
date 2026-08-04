# NEXUS — Premium UI Yapılacaklar

Bu belge iki ana işi ve ilgili tespitleri içerir:

- **A** Bento kontrol paneli (uygulama içi Today — masaüstü + mobil)
- **B** Masaüstü kurulum sihirbazı ekranı (markalı, premium)
- **C** Testler · **D** Doğrulama + görseller · **E** Diğer ekranlar
- **F** Kimlik doğrulama & avatar (tespit + öneri)

> İlke: **landing page bileşenlerine dokunma.** Sadece uygulama içi yüzeyler (masaüstü/mobil kabuk) zenginleşecek. Veri uydurma; görseli sunumla veya gerçek view-model'i genişleterek zenginleştir. Renkler daima token değişkenlerinden (`var(--primary)` vb.) gelsin.

---

## A) Bento kontrol paneli — uygulama içi Today

Ayrım noktası: web landing `renderToday`'i doğrudan kullanır; masaüstü/mobil ise `renderScreenBody` üzerinden gider. Bu yüzden yalnızca `renderScreenBody`'deki `"today"` dalını değiştirmek yeterli; landing etkilenmez.

### A1. Yardımcılar + panel fonksiyonu — `packages/web/src/render.ts`

`renderToday`'in (satır ~364) hemen altına ekle:

```ts
/** "a/b" biçimli değeri ("3/4") { a, b } olarak ayrıştırır; değilse null. */
function parseRatio(value: string): { a: number; b: number } | null {
  const m = /^(\d+)\s*\/\s*(\d+)$/.exec(value.trim());
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return b > 0 ? { a, b } : null;
}

/** Deterministik dairesel ilerleme halkası (0..1). Merkeze metin yazar. */
function renderRing(pct: number, center: string): string {
  const radius = 34;
  const circ = 2 * Math.PI * radius;
  const filled = Math.max(0, Math.min(1, pct)) * circ;
  return (
    `<svg class="ring" width="96" height="96" viewBox="0 0 96 96" role="img" aria-hidden="true">` +
    `<circle cx="48" cy="48" r="${radius}" fill="none" stroke="var(--border)" stroke-width="9"/>` +
    `<circle cx="48" cy="48" r="${radius}" fill="none" stroke="var(--primary)" stroke-width="9" ` +
    `stroke-linecap="round" stroke-dasharray="${filled.toFixed(1)} ${circ.toFixed(1)}" ` +
    `transform="rotate(-90 48 48)"/>` +
    `<text x="48" y="54" text-anchor="middle" font-size="22" font-weight="700" fill="var(--text)">` +
    `${escapeHtml(center)}</text></svg>`
  );
}

/** Tek bir bento kutucuğu (ikon başlık + büyük değer). */
function bentoTile(
  icon: Parameters<typeof renderStatIcon>[0],
  title: string,
  value: string,
  extraClass = "",
): string {
  return (
    `<article class="bento-tile${extraClass ? ` ${extraClass}` : ""}">` +
    `<div class="tile-head"><span class="cardicon">${renderStatIcon(icon)}</span>` +
    `<span class="tile-title">${escapeHtml(title)}</span></div>` +
    `<div class="value">${escapeHtml(value)}</div></article>`
  );
}

/** Uygulama içi Today paneli — bento düzeni (landing kartlarından farklı). */
export function renderTodayPanel(model: TodayModel): string {
  const byKey = (k: string): string => model.cards.find((c) => c.labelKey === k)?.value ?? "";
  const devicesVal = byKey("today.devicesOnline");
  const ratio = parseRatio(devicesVal);
  const pct = ratio ? ratio.a / ratio.b : 0;
  const offline = ratio ? ratio.b - ratio.a : 0;

  const featured =
    `<article class="bento-tile featured">` +
    `<div class="tile-head"><span class="cardicon">${renderStatIcon("devices")}</span>` +
    `<span class="tile-title">${escapeHtml(label("today.devicesOnline"))}</span></div>` +
    `<div class="ring-wrap">${renderRing(pct, devicesVal)}` +
    `<div class="ring-meta"><span class="value">${Math.round(pct * 100)}% online</span>` +
    `<span class="label">${offline > 0 ? `${offline} offline` : "All devices online"}</span>` +
    `</div></div></article>`;

  const energy = bentoTile("energy", label("today.energy"), byKey("today.energy"), "wide");
  const routines = bentoTile(
    "routines",
    label("today.activeRoutines"),
    byKey("today.activeRoutines"),
  );
  const suggestions = bentoTile(
    "suggestions",
    label("today.suggestions"),
    byKey("today.suggestions"),
  );

  const sug = byKey("today.suggestions");
  const msg = model.hasNudge
    ? `${sug} suggestion${sug === "1" ? "" : "s"} ready for you.`
    : "You're all caught up.";
  const strip =
    `<div class="assistant-strip"><span class="cardicon">${renderStatIcon("suggestions")}</span>` +
    `<div><span class="who">NEXUS AI</span> <span class="msg">${escapeHtml(msg)}</span></div>` +
    `<a class="btn" href="#suggestions" data-nav="suggestions">Review</a></div>`;

  const nudge = model.hasNudge ? '<span class="nudge" aria-label="new"></span>' : "";
  return (
    `<h2>${escapeHtml(label(model.titleKey))}${nudge}</h2>` +
    `<div class="bento">${featured}${energy}${routines}${suggestions}${strip}</div>`
  );
}
```

### A2. Bento CSS — `renderStyles` içinde

`.nudge { ... }` satırının (satır ~206) hemen altına ekle:

```css
/* In-app control-center: bento dashboard (desktop + mobile shells). */
.bento { display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: minmax(96px, auto); gap: var(--gap); }
.bento-tile {
  position: relative; display: flex; flex-direction: column; gap: ${t.space[3]}px;
  background: linear-gradient(155deg, var(--tint-soft), var(--surface) 62%);
  border: 1px solid var(--border); border-radius: var(--radius-lg); padding: ${t.space[5]}px;
}
.bento-tile .tile-head { display: flex; align-items: center; gap: ${t.space[3]}px; color: var(--muted); }
.bento-tile .tile-head .tile-title { font-size: ${t.font.size.sm}px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
.bento-tile .value { font-size: 30px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; margin-top: auto; }
.bento-tile .label { color: var(--muted); font-size: ${t.font.size.sm}px; }
.bento-tile.featured { grid-column: span 2; grid-row: span 2; justify-content: space-between; overflow: hidden; }
.bento-tile.featured::after {
  content: ""; position: absolute; right: -30px; bottom: -30px; width: 170px; height: 170px;
  background: radial-gradient(circle at center, var(--tint), transparent 70%); pointer-events: none;
}
.bento-tile.wide { grid-column: span 2; }
.ring-wrap { position: relative; display: flex; align-items: center; gap: ${t.space[5]}px; }
.ring { flex: none; }
.ring-meta { display: flex; flex-direction: column; }
.ring-meta .value { font-size: 22px; margin-top: 0; }
.assistant-strip {
  grid-column: 1 / -1; display: flex; align-items: center; gap: ${t.space[4]}px;
  background: linear-gradient(120deg, var(--tint), transparent 60%), var(--surface);
  border: 1px solid var(--border-strong); border-radius: var(--radius-lg);
  padding: ${t.space[4]}px ${t.space[5]}px;
}
.assistant-strip .cardicon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: var(--radius);
  background: var(--tint); color: var(--primary); flex: none;
}
.assistant-strip .who { font-weight: 700; }
.assistant-strip .msg { color: var(--muted); }
.assistant-strip .btn { margin-left: auto; white-space: nowrap; }
@media (max-width: 600px) {
  .bento { grid-template-columns: 1fr 1fr; }
  .bento-tile.featured { grid-column: 1 / -1; grid-row: auto; }
  .bento-tile.wide { grid-column: 1 / -1; }
  .assistant-strip { flex-wrap: wrap; }
  .assistant-strip .btn { margin-left: 0; }
}
```

### A3. Bağlama — `packages/web/src/index.ts` (`renderScreenBody`)

- `./render.js` importuna `renderTodayPanel` ekle.
- `renderScreenBody` içindeki `case "today":` dalında `renderToday(s.today)` → **`renderTodayPanel(s.today)`**.
- `renderDemoDocument` (landing) `renderToday`'i kullanmaya **devam etsin** — dokunma, importunu silme.

> ⚠️ CSS sızıntısı notu: `.bento`/`.assistant-strip` sınıfları `nav` altında olmadığından önceki `nav a` sızıntı sorunu burada oluşmaz. Yine de mobil derlemeden sonra ekran görüntüsüyle doğrula.

---

## B) Masaüstü kurulum sihirbazı ekranı

### B1. Yeni dosya: `packages/desktop/src/setup.ts`

- **Importlar:** `@nexus/design-system`'den `getTheme`/tokens; `@nexus/web`'den `renderStyles`, `escapeHtml`, `renderLogo`; `./index.js`'den `renderWindowControls`.
- `renderSetupStyles(t)` = `renderStyles(t)` + kurulum penceresi CSS'i.
- `renderSetupDocument({ theme })` → tam HTML belgesi.
- **5 adım** (sol rayda dikey stepper + sağ içerik):
  1. **Welcome** — büyük logo + "Welcome to NEXUS Setup" + kısa açıklama + 3 madde.
  2. **License** — kaydırılabilir lisans kutusu + "I accept the agreement" onay kutusu.
  3. **Location** — kurulum yolu input (`C:\Program Files\NEXUS`) + "Browse…" + "Space required 240 MB / available".
  4. **Installing** — determinate ilerleme çubuğu (%) + durum satırı ("Installing core services…").
  5. **Finish** — ✓ ikonu + "NEXUS is ready" + "Launch NEXUS now" onay kutusu.
- **Alt bar:** solda "Cancel", sağda "Back" + birincil buton (adıma göre "Continue" / "Install" / "Finish").
- Küçük inline `<script>`: adım geçişi, aktif/tamamlanmış stepper durumu, buton etiketleri; install adımında çubuğu CSS animasyonuyla 0→%100 doldur.

**CSS sınıfları (renderSetupStyles içinde):**

```
body.setup        koyu zemin, min-height 100vh, grid place-items center
.setup-window     genişlik ~640; .window kabuğu: border, radius-lg, elev gölge
.setup-rail       sol; brand hero + .steps
.steps li         numara rozeti + etiket; .done / .active durumları
.setup-main       sağ; .step paneller, yalnızca .active görünür
.progress         yükseklik 8, radius, bg=--border  >  .progress-fill (bg=--primary, width animasyon)
.license-box      max-height ~150, overflow auto, border, bg=--bg, küçük font
.field            input + Browse; input bg=--bg, border, radius
.setup-footer     flex, space-between, üst border
```

> Pencere kontrollerinde `renderWindowControls()` kullan → renkli 3 nokta olmasın (monokrom).

### B2. Export + build

- `packages/desktop/src/index.ts` sonuna: `export * from "./setup.js";`
- `packages/desktop/src/build.ts`'e ekle:

```ts
import { renderSetupDocument } from "./index.js";
const setupDark = renderSetupDocument({ theme: "dark" });
const setupLight = renderSetupDocument({ theme: "light" });
writeFileSync(join(dist, "setup.html"), setupDark, "utf8");
writeFileSync(join(dist, "setup-light.html"), setupLight, "utf8");
console.log(`wrote dist\\setup.html (${setupDark.length} bytes)`);
```

---

## C) Testler

- `packages/web/src/render.test.ts`: `renderTodayPanel` importla; doğrula →
  `<div class="bento"`, `class="bento-tile featured"`, `<svg class="ring"`, `assistant-strip`, `% online`, `NEXUS AI`.
- **Yeni** `packages/desktop/src/setup.test.ts`: `renderSetupDocument({ theme: "dark" })` içersin →
  `class="setup-window"`, `class="steps"`, `I accept`, `class="progress"`, logo (`aria-label="NEXUS logo"`), `class="wctl"`; ayrıca `.not.toContain("tl red")`.
- Mevcut masaüstü/mobil testleri `"Devices online"` bekliyor → `renderTodayPanel` bunu koruyor, kırılmamalı.

---

## D) Doğrulama + görseller (PowerShell — `;` ile, `&&` değil)

```powershell
cd c:\Users\ensar\Downloads\NEXUS-AI
pnpm -w exec tsc --noEmit
pnpm format
pnpm -w test                                   # 235+ test yeşil olmalı
pnpm --filter @nexus/web build:demo
pnpm --filter @nexus/desktop build:demo        # index.html + setup.html üretir
pnpm --filter @nexus/mobile build:demo
```

Ekran görüntüsü (headless Chrome — **her çağrıda benzersiz `--user-data-dir`**, yoksa ikinci Chrome ilkine bağlanır ve dosya yazılmaz):

```powershell
$chrome="C:\Program Files\Google\Chrome\Application\chrome.exe"; $s=Get-Date -Format HHmmss
& $chrome --headless=new --disable-gpu --hide-scrollbars --force-color-profile=srgb --user-data-dir="$PWD\.shot-setup$s" --window-size=760,620 --screenshot="$PWD\packages\desktop\dist\setup-$s.png" ("file:///"+$PWD.Path.Replace('\','/')+"/packages/desktop/dist/setup.html")
```

> **Önemli:** çıktı dosya adını her seferinde değiştir (`-$s`), yoksa görüntüleyici önbellekten eski resmi gösterir.

---

## E) Sonraki adım — diğer ekranları aynı dile taşı

Today oturunca aynı bento dilini şu render fonksiyonlarına uygula: `renderHomeState`, `renderDeviceList`, `renderSuggestions`, `renderSkills`, `renderFamily`, `renderPersonalization`, `renderBilling`. Satır/liste düzenlerini bento kutucuklarına veya gruplu panellere çevir. **Landing page bileşenlerine dokunma.**

---

## F) Kimlik doğrulama & avatar (tespit + öneri)

### Mevcut durum (tespit)

- **Giriş yöntemi:** yalnızca **e‑posta + parola** (`packages/accounts/src/index.ts`, FAZ 14). scrypt+salt hash, 24s oturum, parola sıfırlama, çoklu cihaz, GDPR export/silme. **OAuth/sosyal giriş, passkey, SSO YOK.** Store in-memory (gerçek backend FAZ 18).
- **Avatar:** `Account` (`id/email/role/createdAt`) ve `PersonalizationModel` (`assistantName/userAddress/language`) içinde **avatar görseli alanı yok**. Mobil app bar rozeti **her zaman harf fallback'i** (`userAddress` ilk harfi). Gerçek avatar–fallback senkron mantığı **yok**.

### Öneri (istenirse yapılacaklar)

1. `PersonalizationModel`'e opsiyonel `avatarUrl?: string` ekle (`packages/interface/src/index.ts`) ve `buildPersonalizationModel` girişine taşı.
2. Ortak bir `renderAvatar({ url?, initial })` yardımcı fonksiyonu (`packages/web/src/render.ts`): `url` varsa `<img class="avatar-img" src alt>`, yoksa harf fallback'i (`<span class="avatar">initial</span>`).
3. Mobil (`packages/mobile/src/index.ts`) ve — eklenecekse — masaüstü/web app bar'ında bu yardımcıyı kullan; böylece "gerçek avatar varsa onu göster, yoksa harfe düş" davranışı tek yerden gelir.
4. Baş harfi `userAddress` yerine (veya buna ek) oturumdaki hesabın `email`/görünen adından türetmek istenirse, app bar'a `NavContext`/hesap bilgisini geçir.
5. Sosyal giriş isteniyorsa: `accounts` paketine sağlayıcı soyutlaması (OAuth/passkey) eklemek ayrı bir FAZ işi — detaylı plan **H bölümünde**. OAuth profili `avatarUrl` taşıdığı için 1. maddedeki alanı doğrudan besler.

---

## G) Bot & kötüye kullanım koruması (giriş/kayıt)

> Amaç: otomatik botların kayıt olması, kaba kuvvet (brute-force) ve credential-stuffing saldırıları, hesap sayımı (enumeration) ve sahte/atılabilir hesap üretimini engellemek. Soyutlamalar `packages/security/src/`'e, uygulama `packages/accounts/src/index.ts`'e girer. Dev'de in-memory; FAZ 18'de Redis/backend'e taşınır.

### Zaten var (korunacak)

- Sabit-zamanlı parola karşılaştırması + hesap yokken sahte hash (timing sızıntısı yok).
- Genel hata mesajı (`Invalid email or password.`) → e-posta enumeration engeli.
- Yüksek entropili oturum/reset token'ları (`randomBytes`).

### Eklenecekler

1. **Hız sınırlama (rate limiting):** IP + e-posta bazlı sliding-window/token-bucket. `login`, `register`, `requestPasswordReset` çağrılarında eşik aşılınca `429/AuthError`. `packages/security/src/rate-limit.ts` içinde `RateLimiter` sınıfı (dev: in-memory Map, prod: Redis).
2. **Kademeli kilit (lockout/backoff):** Ardışık N başarısız girişte üstel bekleme; hesabı geçici kilitle. Başarılı girişte sayaç sıfırlanır.
3. **CAPTCHA / challenge:** Kayıt formunda ve başarısız giriş eşiği sonrası gizlilik dostu challenge (Cloudflare Turnstile / hCaptcha). Sunucu tarafı token doğrulaması `packages/security/src/captcha.ts`; sağlayıcı anahtarı `@nexus/config`/env'den (repoya yazma).
4. **E-posta doğrulama (double opt-in):** Kayıtta tek kullanımlık doğrulama token'ı; yalnızca doğrulanmış hesap oturum/plan alır. Atılabilir bot kayıtlarını büyük ölçüde keser.
5. **Atılabilir e-posta engel listesi:** Bilinen throwaway domain'leri reddet (`packages/security/src/email-blocklist.ts`).
6. **Honeypot + süre kontrolü:** Web kayıt formunda gizli sahte alan + minimum doldurma süresi (ör. <1.5 sn = bot). Sunucuda reddet.
7. **Anormal hız sinyalleri:** Aynı IP'den kısa sürede çok hesap, aynı cihaz parmak izi vb. loglanır (`@nexus/logger`) ve eşikte challenge tetikler.
8. **Testler:** `packages/security/src/*.test.ts` — rate limit eşiği, lockout, captcha doğrulama mock'u, blocklist. Deterministik saat enjeksiyonu (`now: () => number`) kullan (AccountService zaten destekliyor).

---

## H) Platform (OAuth / sosyal) giriş desteği

> Neden şu an yok: FAZ 14 minimum e-posta+parola store'u ile çıktı; federe kimlik bilinçli ertelendi. Bu bölüm onu ekler.

### Mimari

1. **Sağlayıcı soyutlaması** — `packages/accounts/src/oauth.ts`:
   ```ts
   export interface ExternalProfile {
     readonly provider: string; // "google" | "apple" | "microsoft" | "github"
     readonly sub: string; // sağlayıcıdaki kalıcı kullanıcı kimliği
     readonly email?: string;
     readonly emailVerified?: boolean;
     readonly name?: string;
     readonly avatarUrl?: string;
   }
   export interface AuthProvider {
     readonly id: string;
     authorizeUrl(state: string, pkceChallenge: string, nonce: string): string;
     exchange(code: string, pkceVerifier: string): Promise<ExternalProfile>;
   }
   ```
2. **Sağlayıcılar:** Google, Apple, Microsoft, GitHub (hepsi OIDC/OAuth2). Ek olarak **passkey/WebAuthn** modern seçenek olarak planlanabilir.
3. **Hesap bağlama (linking):** `Account`'a `identities: { provider: string; sub: string }[]` ekle. Callback'te `sub` ile eşleş; yoksa **doğrulanmış e-posta** ile mevcut hesaba bağla, o da yoksa yeni hesap oluştur. `AccountService`'e `loginWithProvider(profile): Session` ekle.
4. **Avatar entegrasyonu:** `ExternalProfile.avatarUrl` → F bölümündeki `avatarUrl` alanını besler (gerçek avatar otomatik gelir, yoksa harf fallback'i).

### Güvenlik (zorunlu)

- OAuth 2.0 **Authorization Code + PKCE**; `state` ile CSRF koruması; OIDC `nonce` doğrulaması.
- `id_token` imzası, `iss`/`aud`/`exp` doğrulaması; redirect URI **allowlist**.
- Client ID/secret yalnızca `@nexus/config`/env'den — **repoya asla yazma**.
- Apple'ın "Hide My Email" relay adreslerini destekle.

### UI

- Giriş ekranına markalı **"Continue with Google / Apple / Microsoft / GitHub"** butonları + e-posta/parola fallback'i. Her sağlayıcının marka rehberine uy (logo/renk).
- Butonlar ortak `renderStyles` token'larıyla; sağlayıcı ikonları inline SVG.

### Dev & test

- Dependency-free kalması için dev/test'te **mock `AuthProvider`** (sabit `ExternalProfile` döndürür). Gerçek ağ çağrısı yok; deterministik testler.
- `packages/accounts/src/oauth.test.ts`: state/PKCE üretimi, linking (yeni vs mevcut e-posta), mock exchange.

> Not: Gerçek sağlayıcı entegrasyonu (ağ, secret yönetimi) FAZ 18 backend işiyle birlikte gider; bu paket soyutlama + mock ile hazır durur.
