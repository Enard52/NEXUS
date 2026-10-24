# NEXUS — Yapılacaklar (yalnızca sizin işleriniz)

Bitmiş her şey bu listeden çıkarıldı. Aşağıdakiler sırayla yapılacak.

## 1. Supabase'te bot korumasını kapatın (ilk iş)

Supabase → **Authentication → Attack Protection** → "Enable Captcha protection" anahtarını **kapatın**.
Açıkken e-posta ile giriş, kayıt ve şifre sıfırlama hata verir ("captcha protection: request disallowed").
E-posta doğrulaması ve Supabase hız sınırları koruma sağlamaya devam eder.
Kapatmak istemezseniz bana "hCaptcha'yı ekle" yazın.

## 2. Supabase güvenlik ayarları

- **Authentication → Passwords** → "Leaked password protection" seçeneğini açın.
- **Authentication → Email** → e-posta doğrulamasını açık tutun.

## 3. Canlı test (1. adımdan sonra)

- Web (`https://nexus-web-jre.pages.dev`): e-postayla kayıt → doğrulama e-postası → giriş; Google ile giriş; "Şifremi Unuttum".
- Masaüstü ve telefon: aynı e-postayla giriş; profil, ayar ve cihazların geri geldiğini kontrol edin.
- Bir cihazda ayar değiştirin, diğerinde birkaç dakika içinde göründüğünü doğrulayın.

## 4. Arama motorlarına kayıt

Site: `https://nexus-smarthome.pages.dev/` — site haritası: `https://nexus-smarthome.pages.dev/sitemap.xml`

1. **Google Search Console** (search.google.com/search-console) → "Mülk ekle" → **URL öneki** → site adresini yazın.
   - Doğrulama: **HTML etiketi**. Verilen `<meta name="google-site-verification" content="...">` içindeki **content değerini bana yazın**, ben sayfalara eklerim.
   - Sonra **Site haritaları** → `sitemap.xml` yazıp gönderin.
2. **Bing Webmaster Tools** (bing.com/webmasters) → "Google Search Console'dan içe aktar" (ek kod gerekmez).
3. İsteğe bağlı: Yandex Webmaster — verdiği `yandex-verification` değerini bana yazın.

## 5. Kurumsal e-posta adresleri

Sitedeki sahte adresler kaldırıldı. Gerçek **destek** ve **gizlilik** adreslerini oluşturunca bana yazın; gizlilik sayfalarına, geri bildirim düğmesine ve uygulamaya eklerim.

## 6. İleride

- Kendi alan adı (yıllık ~10 USD): arama sıralaması için daha iyi. Alırsanız bana yazın, tüm adresleri ben değiştiririm.
- `LICENSE`, gizlilik politikası ve kullanım koşulları için avukat incelemesi.
- Gerçek ödeme (İyzico veya Stripe hesabı) — şimdilik planlar "yakında" gösteriliyor.
