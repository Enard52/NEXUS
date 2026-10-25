# NEXUS — Manuel Adımlar (Sahibi El Kitabı)

> **Nasıl kullanılır:** Aşağıdaki adımlar yalnız senin hesaplarından yapılabilir. Her adımın sonunda **"✋ Burada dur"** yazan yerde kontrolü bana geri ver (ZCode'a "adım X'i yaptım" demen yeterli); doğrulamasını ben yapar, sonra sıradaki adıma geçersin. Hata alırsan ekran görüntüsünü/status metnini bana paste le — gerisini ben çözerim.
>
> Sıra önemlidir: A1 → A2 → B → C → D. Toplam ~45 dk aktif süre (derlemeler beklerken çay molası).

---

## A. Yayın zincirini aç (bütün otomatikler buna bağlı) — ~5 dk

### A1. GitHub ödeme yöntemini düzelt (issue #7)
1. Tarayıcıda https://github.com/settings/billing → **Payment information**.
2. Geçerli bir kart ekle/güncelle ("Invalid payment method – authorization hold failed" uyarısı kaybolmalı).
3. Açık destek talebine (ensarharmanci52@gmail) yanıt gelmişse onu da kapat.
**Beklenen:** https://github.com/Enard52/NEXUS/actions sayfasında `startup_failure` yazan iş akışları "queued/in progress"e döner.
**✋ Burada dur** — bana söyle, ben `gh workflow run web-deploy.yml` ile akışları çalıştırıp çıktıyı doğrulayayım (Linux derlemesi de #10'u çözer).

### A2. main'e push (site + web uygulaması yayına girsin)
- Ben commit'leri hazırladım; push komutunu senden onay alınca ben çalıştırırım (bkz. Son Aşama notu). Push sonrası site ve web uygulaması otomatik güncellenir; **yeni site tasarımını** nexus-smarthome.pages.dev'de görürsün.
**✋ Burada dur** — yayını ben doğrulayayım.

---

## B. Supabase sunucu paketi (hesap silme, hata raporu, AI kredisi, temizlik) — ~10 dk

Tek seferde hepsi: **Supabase Dashboard → proje → SQL Editor → New query** → deponun `supabase/migrations/20261025_server_side_pack.sql` dosyasının **tam içeriğini** yapıştır → **Run**.
**Beklenen:** "Success. No rows returned" (eski tablolar silinir — yedek istersen önce Aşağıdaki B0).

### B0 (önerilen, 1 dk): şema yedeği
Dashboard → Database → Backups → güncel yedeği indir (SQL çalıştırmadan ÖNCE).

### B1. Edge Function'ları dağıt (sırayla, her biri ~30 sn)
Dashboard → Edge Functions → **New function**:
1. Ad: `delete-account` → deponun `supabase/functions/delete-account/index.ts` içeriğini yapıştır → Deploy.
2. Ad: `client-error` → `supabase/functions/client-error/index.ts` → Deploy.
3. `daily-stats` mevcut: düzenle → deponun `supabase/functions/daily-stats/index.ts` ile değiştir (DB boyutu satırı eklenir) → Deploy.
**Beklenen:** Functions listesinde üçü de yeşil. Denemek için uygulamada Ayarlar → Hesap Güvenliği → "Hesabımı Sil" artık gerçek silme yapar (denemek için değerli bir hesap kullanma!).

### B2 (isteğe bağlı): Turnstile koruması (#14)
1. https://dash.cloudflare.com → Turnstile → Add site (domain: nexus-web-jre.pages.dev) → **Site Key + Secret** al.
2. Supabase → Authentication → Providers → Captcha → Cloudflare Turnstile seç, Site Key'i yapıştır, kaydet.
3. Bana söyle: kayıt/giriş sayfalarına widget kodunu ben bağlayayım (şimdilik sunucu tarafı hazır, istemci widget'ı anahtar gelince eklenir).

**✋ Burada dur** — sonucu söyle, doğrulama testlerini ben yazıp çalıştırayım.

---

## C. Masaüstü: tepsi arka plan çalışanı (otomasyonlar kapanınca da çalışsın) — ~15 dk

Yeni `main.cjs` (gizli otomasyon penceresi) kurulum dosyasına ancak **yeniden derleme** ile girer:
1. Depoda `desktop/` klasörü → `npm install` (yapılmadıysa).
2. `npm run dist` (Windows kurulumu üretir) — VEYA A1 sonrası `v*` etiketi ile Actions da derler (kart kilitli değilse tercih bu).
3. Yeni `NEXUS-Setup.exe`'yi kur.
**Test (2 dk):** Uygulamada Akıllı → Otomasyonlar → + ile "Zamanlayıcı" → saat: **şu andan 3 dk sonra** → senaryo: "Günaydın" → kaydet. Uygulamayı **X ile kapat** (tepsiye iner). Süre dolunca bildirim/toast + Akıllı listesinde "Son: HH:MM" görünüyor mu?
**✋ Burada dur** — sonucu söyle.

## C2. Android APK yeniden derleme (#4)
1. `cd android && .\gradlew assembleRelease` (imza ayarın yerel makinende hazır) → `android/app/build/outputs/apk/release/` içindeki APK'yı telefona at-kur.
   - VEYA A1 sonrası `android-release.yml` iş akışı imzalı APK'yı nexus-releases'e koyar; sitedeki indirme bağlantısı otomatik güncellenir.
**Test (5 dk, gerçek telefon):** kurulum → otomasyon oluştur → **uygulama açıkken** çalışıyor mu (kapalıyken çalışmaz; arayüz bunu söylüyor — Android arka plan #35 issue'su). Kameralar ekranı, cihaz sıfırlama satırı, sesli giriş (Chrome WebView'ta mikrofon izni) kontrolü.

---

## D. Gerçek cihaz kabulleri (2'şer dk)

| # | Nerede | Ne kontrol |
|---|--------|-----------|
| D1 | Ana ekran ↔ Akıllı ↔ Keşfet ↔ Profil | Başlık aynı hizada, alt menü 72px sabit, geçişte zıplama yok |
| D2 | Sohbet | Mikrofona bas → konuş → metin girişine düşmeli (telefonda Chrome/Edge WebView) |
| D3 | Enerji mini uygulaması | Güç ölçen cihaz (ör. Shelly PM) varsa gerçek W; yoksa dürüst "—" |
| D4 | Cihaz → Cihaz bilgileri | "Fabrika sıfırlama" satırı markana göre doğru mu |
| D5 | Kameralar | Kamera cihazı varsa kart+gizlilik; yoksa boş durum; "KAYITTA" gibi sahte rozet yok |
| D6 | Plus → ödeme | Whop deneme (#8): kendi e-postanla NEXUS+ dene (TRY), hemen iptal; Discord'a "üyelik başladı" düşmeli |
| D7 | Web (bilgisayar) | nexus-web-jre.pages.dev → adres çubuğu menüsünden **"Uygulamayı yükle"** → ayrı pencere + görev çubuğunda NEXUS (arka planda tepsi bekleyişi masaüstü uygulamasının işi; web PWA'sı pencere kapanınca durur — bu tarayıcı kuralı) |

### E-posta doğrulama görününtüsü
Kayıt olurken doğru/yanlış e-posta dene; şablon İngilizce "NEXUS" gönderenli, linke tıklayınca eve dönmeli. Kötü görünüyorsa söyle — şablonu ben düzeltirim.

---

## E. Repoyu halka açma (issue #22 — istediğinde; acele yok)

1. **Önce yedek:** depoyu ZIP indir + `nexus-signing-backup` güncel mi bak.
2. `git filter-repo` geçmiş temizliği planı bende hazır (eski 150 MB kurulum dosyaları + kullanıcı yolu sızıntıları; etiketleri yeniden bağlarız). **Bana "halka açalım" de** — betiği hazırlayıp senin onayınla çalıştırırım.
3. Açıldıktan sonra: Settings → Code security → **Secret scanning + Push protection** tek tık AÇ (özel depoda ücretsiz değil, halka açıkta bedava; Dependabot zaten açık).
4. Issue listesi halka görünür — istemediklerin varsa o an taşırız.

---

## F. Yayın sonrası (benim işim, senin onayınla)
- Yeni sürüm: `node scripts/bump-version.mjs 1.0.14 --commit` → `git push && git push --tags` → Actions derler, site "İndir" kartları otomatik güncellenir.
- CHANGELOG: `node scripts/bump-version.mjs --changelog` (elle düzenilmez).
- İngilizce yasal PDF'ler: `legal-pdf/NEXUS-{Privacy-Policy,Terms-of-Service,Refund-Policy}.pdf` hazır — Whop ürün ayarlarında istenirse yükle (iade şartları kutusuna).

---

## Not defteri (ıssues)
- Tüm açık işler: https://github.com/Enard52/NEXUS/issues — yol haritası #21'de.
- Benim öneri issue'larım: **#34** kamera akışı · **#35** Android arka plan+geofence · **#36** TOTP 2FA · **#37** yeni bağlayıcılar (Nanoleaf/mDNS/MQTT/Tapo/Tuya).
- Vergi/muhasebe (#30) ve alan adı (#19): ilk gelir gelince; döküman #30'da.
