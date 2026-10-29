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

## Android (yerel kabuk) — 2. faz (bilinçli olarak ertelendi)

Web/PWA push yukarıdakiyle tam çalışır. Android APK'nın kapalıyken de push
alması için ayrıca:
1. Firebase konsolunda **Android uygulaması** ekle (paket: `com.nexus.app`) →
   `google-services.json` → `android/app/` içine koy (repoya GİRMEZ).
2. `npm i @capacitor/push-notifications` + `npx cap sync android` +
   gradle'da google-services eklentisi (CI'da dosyayı secret'tan açan bir adım).
3. APK yeniden derlenir. push.js Capacitor ortamını `platformName()` ile ayırır;
   eklenti gelmeden Android'de push, WebView'da web push kurallarına düşer
   (Android WebView SW push desteği sınırlı — bu yüzden 2. faz gerekli).

Bu fazın gradle/CI kısmı `google-services.json` olmadan bozuk derleme
üreteceğinden bilerek uygulanmadı; JSON geldiğinde 30 dakikalık iştir.

## Güvenlik notları

- Servis hesabı JSON **yalnızca** Supabase secrets'ta; repoya girmaz.
- Alıcı opt-in: token kaydettirmemiş kullanıcıya hiçbir push gitmez.
- Gönderen için saatte 30, hedef başına saatte 20 gönderim sınırı var.
- push-send hedefi çağıranın kendisi olamaz (yerel bildirim zaten düşer);
  spam azaltmak için e-posta listesi 12 hedefle sınırlı.
