# Push Bildirimleri (FCM) — Kurulum Rehberi

Amaç: uygulama **kapalıyken** aile üyesinin kritik olayının (ve ileride aile
sohbeti bildiriminin) alıcının bildirim merkezine düşmesi.

## Mimari (ne nerede çalışıyor)

```
Üye A'nın cihazı (olay oluşur)
  → notify.js "push" kanalı  (DND / sessiz saat / kategori filtreleri burada)
  → nexusCloud.pushSend()    (cloud-sync.js)
  → push-send Edge Function  (Supabase; hedef e-postaları auth kullanıcısına çözer)
  → FCM HTTP v1              (servis hesabı JWT, WebCrypto ile imzalanır)
  → Üye B'nin cihazı:
       • uygulama kapalı  → firebase-messaging-sw.js → OS bildirimi
       • uygulama açık    → notify.js ingestRemoteEvent (olay akışına yazılır,
                            kanallara TEKRAR dağıtılmaz — döngü yok)
```

- Token tablosu: `nexus_push_tokens` (migration `20261029_push_tokens.sql`,
  RLS: kullanıcı yalnızca kendi satırını yazar/okur/siler).
- Token kaydı: `src/app/push.js` — oturum açılınca kendini kaydeder, çıkışta
  satır silinir (cloud-sync signOut), 12 günde bir yeniler.
- Yapılandırma `cloud-config.js` içindeki `window.NEXUS_FIREBASE`'ten gelir
  (gitignore'da; CI'da `ensure-cloud-config.mjs` ortam değişkenlerinden üretir).
  Değer yoksa push modülü **no-op** — hiçbir ağ çağrısı yok, kanal hata da üretmez.

## KULLANICI ADIMLARI — Firebase konsolu (tek seferlik)

> Bu adımlar senin Google hesabını gerektirir; otomasyonla yapılamaz.

1. **Proje oluştur**: <https://console.firebase.google.com> → "Add project"
   → ad: örn. `nexus-push` (Analytics'i kapatabilirsin).
2. **Web uygulaması ekle**: Proje ayarları → General → "Your apps" → `</>`
   (Web) → takma ad `nexus-web` → Register.
   Açılan `firebaseConfig` değerlerini bir yere kopyala:
   `apiKey`, `projectId`, `messagingSenderId`, `appId`.
3. **Web Push sertifikası (VAPID)**: Project settings → Cloud Messaging →
   "Web Push certificates" → **Generate key pair** → `Key pair` değerini kopyala
   (Bu, tarayıcı push'unun zorunlu anahtarı.)
4. **Servis hesabı** (sunucunun FCM'e konuşması için): Project settings →
   Service accounts → **Generate new private key** → JSON iner.
   Supabase'e TEK SATIR olarak ver (terminalde):
   ```
   supabase secrets set FCM_SERVICE_ACCOUNT_JSON=<JSON dosyasının tek satır hâli>
   supabase functions deploy push-send
   ```
   (JSON'u tek satıra indirmek: PowerShell'te `(Get-Content key.json -Raw) -replace '\s+',' '`
   — tırnaklara dikkat; veya dosyayı olduğu gibi `$(Get-Content -Raw key.json)` ile aktar.)
5. **Tabloyu kur**: Supabase Dashboard → SQL Editor →
   `supabase/migrations/20261029_push_tokens.sql` içeriğini çalıştır
   (ya da CLI: `supabase db push`).
6. **Yapılandırmayı projeye ver** — iki yer:
   - **Yerel**: kökteki `cloud-config.js` dosyasına ekle:
     ```js
     window.NEXUS_FIREBASE = {
       apiKey: "<adım 2>",
       projectId: "<adım 2>",
       messagingSenderId: "<adım 2>",
       appId: "<adım 2>",
       vapidKey: "<adım 3>",
     };
     ```
   - **CI (yayın paketleri)**: GitHub repo → Settings → Secrets and variables →
     Actions → Variables olarak gir: `NEXUS_FIREBASE_API_KEY`,
     `NEXUS_FIREBASE_PROJECT_ID`, `NEXUS_FIREBASE_SENDER_ID`,
     `NEXUS_FIREBASE_APP_ID`, `NEXUS_FIREBASE_VAPID_KEY`.
     (`ensure-cloud-config.mjs` bunları derlemede cloud-config.js'e yazar.)

## Doğrulama

1. Sitede/uygulamada hesabınla giriş yap (push yalnız oturumda çalışır).
2. Anlık Bildirimler → "Cihazlar Arası Push" açık olsun → tarayıcı izin sorusu
   "İzin ver".
3. "Test bildirimi gönder" → kendi cihazında bildirim düşmeli (bu, token
   kaydını da doğrular: `nexus_push_tokens` satırı kontrol edilebilir).
4. İki cihaz/hesap testi: hesap B'de push açık olsun; A'nın ev verisinde
   B'nin e-postası olsun; A'da kritik bir olay üret → B kapalıyken bildirim
   B'nin cihazına düşmeli.

## Android + aile bildirimleri (sunucu tetiklemeli) — `push-notify`

Web/PWA yolu yukarıda (istemci tetiklemeli, `push-send`). Android uygulamasının **kapalıyken** aile
mesajı ve ev sahibinin açtığı kritik olay aktarımını alması için ikinci bir yol vardır; bu yol
**sunucudan** tetiklenir (istemci çağırmaz):

```
household_messages / household_activity (INSERT)
  → Supabase Database Webhook  (gizli başlık x-webhook-secret)
  → push-notify Edge Function  (FCM HTTP v1, servis hesabı Supabase Secret'ta)
  → push_tokens tablosundaki Android cihazlar  (@capacitor/push-notifications)
```

Kullanıcı adımları (hepsi senin hesaplarınla; kodda secret yok):

1. **Android uygulaması**: Firebase'de `com.nexus.app` kayıtlı olmalı ve `google-services.json`
   `android/app/` içinde durmalı (`.gitignore`'da; CI'da bir secret'tan açılır).
2. **Migration**: `supabase/migrations/20261031_push_tokens.sql` (tablo `push_tokens`; web yolunun
   `nexus_push_tokens` tablosundan ayrıdır). Aile tabloları için önce `20261029_households.sql` ve
   `20261030_households_activity.sql`.
3. **Secret'lar**: `FCM_SERVICE_ACCOUNT` (Firebase servis hesabı JSON'unun tamamı) ve
   `PUSH_WEBHOOK_SECRET` (kendi seçtiğin uzun rastgele değer). Web yolundaki
   `FCM_SERVICE_ACCOUNT_JSON` ile aynı JSON'dur; iki ad ayrı fonksiyonlar içindir.
4. **Fonksiyon**: `supabase functions deploy push-notify --no-verify-jwt` (webhook JWT taşımaz;
   doğrulama gizli başlıkla yapılır).
5. **Database Webhook'lar**: Supabase → Database → Webhooks: `household_messages` ve
   `household_activity` tablolarında INSERT için `push-notify` fonksiyonunu çağır; HTTP başlığı
   `x-webhook-secret: <PUSH_WEBHOOK_SECRET>`.
6. Android APK'yı yeniden derle (`@capacitor/push-notifications` eklendi).

Gerçek cihazla doğrulanmadı (issue #95, #97). Secret'lardan biri yoksa fonksiyon dürüstçe
"push yapılandırılmadı" döner ve hiçbir şey göndermez. iOS için APNs (Apple geliştirici hesabı) gerekir; yok.
## Güvenlik notları

- Servis hesabı JSON **yalnızca** Supabase secrets'ta; repoya girmaz.
- Alıcı opt-in: token kaydettirmemiş kullanıcıya hiçbir push gitmez.
- Gönderen için saatte 30, hedef başına saatte 20 gönderim sınırı var.
- push-send hedefi çağıranın kendisi olamaz (yerel bildirim zaten düşer);
  spam azaltmak için e-posta listesi 12 hedefle sınırlı.
