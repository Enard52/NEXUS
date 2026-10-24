# NEXUS — Manuel Adımlar

Bu dosya yalnızca **sizin yapmanız gereken** işleri listeler. Tamamlanmış işler buradan çıkarıldı.
Tamamlanan kısımlar: masaüstü (Windows, Linux), Android test APK'sı, Supabase projesi ve veritabanı, site.

## Desteklenen platformlar (düşük maliyet)

- **Windows** — ücretsiz, imzasız (SmartScreen'de "Ek bilgi → Yine de çalıştır").
- **Linux** — ücretsiz, AppImage ve .deb.
- **Android** — şimdilik test APK'sı (ayarlardan "bilinmeyen kaynaklardan kurulum" izni).
- **macOS ve iOS** — kapsam dışı (Apple geliştirici hesabı yıllık 99 USD gerektirir).

## 1. Google ile hızlı giriş (ücretsiz)

Hızlı giriş, sitede, masaüstünde ve mobilde "Google ile devam et" olarak sunulacak. Bunun için:

1. **Google Cloud Console** (console.cloud.google.com) → yeni proje → "APIs & Services → OAuth consent screen": uygulama adı "NEXUS", destek e-postası, gizlilik politikası ve kullanım koşulları bağlantıları.
2. **Credentials → Create credentials → OAuth client ID** (Web application). **Authorized redirect URI**: Supabase'in verdiği adres (Supabase → Authentication → Providers → Google sayfasında yazar, `https://flbctyolowzcizwwzbke.supabase.co/auth/v1/callback`).
3. Oluşan **Client ID** ve **Client Secret** değerlerini Supabase → Authentication → Providers → Google bölümüne girin ve etkinleştirin.
4. Client Secret'ı bana değil, yalnızca Supabase paneline girin.

İsteğe bağlı: GitHub ile giriş de aynı şekilde eklenebilir (GitHub → Settings → Developer settings → OAuth App).

## 2. Hesap ve veritabanı güvenliği

- Supabase → **Authentication → Passwords** → "Leaked password protection" seçeneğini açın.
- Supabase → **Authentication → Email** → e-posta doğrulamayı canlı ortamda açık tutun.

## 3. Yayın ve test

- **Masaüstü 1.0.7 (Windows, Linux):** Yayında. Kurulu uygulamanızda "Güncellemeleri Kontrol Et" ile güncelleyin.
- **Android APK:** 1.0.7 sürümünde. Telefonda kurup bulut senkronunu deneyin.
- **Canlı test listesi:**
  - Site: giriş/kayıt, plan sayfası, indirme kartları (Windows, Linux, Android).
  - Masaüstü: giriş, cihaz ekleme, senkron, güncelleme.
  - Telefon: giriş, cihaz ekleme, senkron, tablet görünümü.
  - Aynı hesapla üç taraftan birden senkron kontrolü.

## 4. Lisans ve hukuk

- Kökteki `LICENSE` dosyası taslak. Yayından önce bir avukat incelemesi yapın.
- Gizlilik politikası, hesap verisi ve kullanım koşulları güncel olmalı.

## 5. Ödeme (ileride)

- Gerçek ödeme için İyzico veya Stripe hesabı gerekir. Şu an planlar "yakında" olarak gösteriliyor ve özellik kilidi yok. Bu karar sizin.

## 6. Bildirmeniz gerekenler

- Yukarıdaki adımları tamamladığınızda, Google girişini uygulamaya bağlamak için bana haber verin. Client ID'yi yazmanız yeterli; secret'ı paylaşmayın.
