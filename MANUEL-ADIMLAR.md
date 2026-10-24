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

- **ÖNEMLİ — Bot koruması (CAPTCHA):** Supabase → **Authentication → Attack Protection** sayfasında "Enable Captcha protection" (hCaptcha) şu an **açık**. Uygulama hCaptcha göstermediği için e-posta ile giriş, kayıt ve şifre sıfırlama bu ayar açıkken çalışmaz ("captcha protection: request disallowed"). Anahtarı **kapatın** (e-posta doğrulaması ve Supabase hız sınırları koruma sağlamaya devam eder) ya da hCaptcha'yı uygulamaya eklememi isteyin. Google ile giriş bu ayardan etkilenmez.
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

## 6. Arama motorlarına kayıt (SEO)

Site adresi: `https://nexus-smarthome.pages.dev/` — site haritası: `https://nexus-smarthome.pages.dev/sitemap.xml`.
Site haritası, robots.txt, canonical/hreflang, Open Graph ve JSON-LD hazır. Kalan, sahiplik doğrulaması:

1. **Google Search Console** (search.google.com/search-console) → "Mülk ekle" → **URL öneki** → `https://nexus-smarthome.pages.dev/` yazın.
   - Doğrulama yöntemi olarak **HTML etiketi**ni seçin. Verilen `<meta name="google-site-verification" content="...">` satırındaki **content değerini** bana yazın; ben iki dildeki ana sayfaya eklerim.
   - Sonra sol menüde **Site haritaları** → kutuya `sitemap.xml` yazıp gönderin.
   - İsteğe bağlı: **URL denetimi** → `https://nexus-smarthome.pages.dev/` ve `/tr/` için "Dizine eklenmesini iste".
2. **Bing Webmaster Tools** (bing.com/webmasters): "Google Search Console'dan içe aktar" seçeneği en kolayı (ek doğrulama gerekmez). Elle eklerseniz `msvalidate.01` meta etiketinin content değerini bana yazın; site haritası olarak `https://nexus-smarthome.pages.dev/sitemap.xml` girin.
3. İsteğe bağlı: Yandex Webmaster (yandex.com/webmaster) — verdiği `yandex-verification` değerini bana yazın.

Not: `pages.dev` ortak bir alan adıdır; arama sıralaması için kendi alan adınız (yıllık ~10 USD) daha iyi sonuç verir. Alan adı alırsanız bana yazın, tüm adresleri tek seferde değiştiririm.

## 7. Kurumsal e-posta

Sitedeki ve uygulamadaki doğrulanmamış adresler (`destek@` / `privacy@nexus-ai.app`, `@nexusai`) kaldırıldı; gizlilik sayfalarında "iletişim adresi yakında" yazıyor, uygulamadaki geri bildirim formu mesajı cihazda saklıyor.
Gerçek adresleri oluşturunca bana yazın (ör. destek adresi ve gizlilik adresi); şunlara eklerim: gizlilik sayfaları, ana sayfa geri bildirim düğmesi, uygulama geri bildirim formu, JSON-LD iletişim bilgisi, masaüstü paket bilgisi.

## 8. Bildirmeniz gerekenler

- Yukarıdaki adımları tamamladığınızda, Google girişini uygulamaya bağlamak için bana haber verin. Client ID'yi yazmanız yeterli; secret'ı paylaşmayın.
