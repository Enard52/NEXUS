# NEXUS — Yapılacaklar

Yalnızca **henüz yapılmamış** işler. Son kontrol: 25 Ekim 2026. Webhook sırrı, Whop yasal PDF'leri, ürün açıklaması ve çizili fiyat tamamlandı.

## A. Sizin yapmanız gerekenler

1. **v1.0.12 masaüstü/Android yayını:** GitHub Actions bu hesapta başlamıyor (startup_failure); GitHub Billing'de 'Invalid payment method - authorization hold failed' uyarısı var. Destek talebi 25 Ekim'de gönderildi, yanıt ensarharmanci52@gmail.com adresine gelecek. Kota 1 Kasım'da yenilenir ya da GitHub → Settings → Billing'den harcama limiti açın. Sonra bana yazın: `gh workflow run desktop-release.yml --ref v1.0.12` çalıştırıp APK'yı (`%TEMP%\nexus-apk-out`) yüklerim. Bu arada indirmeler v1.0.11 olarak çalışıyor.
2. **Canlı testler**, `https://nexus-web-jre.pages.dev`:
   - Kayıt → doğrulama e-postası → otomatik giriş; Şifremi Unuttum; Google ile giriş.
   - NEXUS+ → Ücretsiz Dene → kendi hesabınızın e-postasıyla ödeme (TRY ve USD planı ayrı ayrı; denemede ücret alınmaz, sonra iptal edin) → plan Faturalandırma'da görünmeli.
   - Masaüstü ve telefon: aynı hesapla giriş, verilerin gelmesi.

## B. Karar bekleyenler (bana "yap" demeniz yeterli)

- **Uygulama içi NEXUS AI'ı gerçek yapay zekâya bağlamak** (sitedeki asistan zaten Workers AI ile çalışıyor; gizlilik metinleri güncellenmeli).

## C. İleride

- Kendi alan adı (yıllık ~10 USD).
- Aile planı ürünü (sitede "Yakında").
- Supabase Pro'ya geçerseniz: "Leaked password protection".

