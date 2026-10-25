# NEXUS — Yapılacaklar

Yalnızca **henüz yapılmamış** işler. Son kontrol: 25 Ekim 2026. Webhook sırrı, Whop yasal PDF'leri, ürün açıklaması ve çizili fiyat tamamlandı.

## A. Sizin yapmanız gerekenler

1. **GitHub Actions kartı:** Actions şu an çalışmıyor (kart/ödeme kilidi; destek talebi gönderildi). Kimsenin bir şey yapmasına gerek yok: v1.0.12 indirmeleri (Windows, Linux, Android) GitHub'da hazır ve çalışıyor. Actions düzelince `Yayın yakalama` iş akışı 6 saatte bir kontrol edip Linux/Windows'u tam derlemeyle yeniler. Kart uyarısını GitHub → Settings → Billing'den kaldırmanız yeterli.
2. **Canlı ödeme denemesi (isteğe bağlı)**, `https://nexus-web-jre.pages.dev`:
   - Kayıt → doğrulama e-postası → otomatik giriş; Şifremi Unuttum; Google ile giriş.
   - NEXUS+ → Ücretsiz Dene → kendi hesabınızın e-postasıyla ödeme (TRY ve USD planı ayrı ayrı; denemede ücret alınmaz, sonra iptal edin) → plan Faturalandırma'da görünmeli.
   - Masaüstü ve telefon: aynı hesapla giriş, verilerin gelmesi.

3. **Discord istatistik/bildirim kanalı** (kod hazır ve yayında; son adım sizde): Supabase → Edge Functions → Secrets → `DISCORD_WEBHOOK_URL` = Discord webhook adresiniz. Eklenince günlük özet (06:00 UTC) ve yeni NEXUS+ üyelik/iptal bildirimleri o kanala gelir. Webhook adresi sohbette paylaşıldığı için, ister Discord'da webhook'u silip yenisini oluşturun ve onu yapıştırın.
4. **Android imza anahtarını yedekleyin:** `C:\Users\MSI\NEXUS-signing\` klasörünü (nexus-release.jks + keystore.properties) güvenli bir yere kopyalayın. Kaybolursa Android uygulaması güncellenemez. Eski debug imzalı test APK'sı olanlar yeni APK için önce kaldırıp yeniden kurmalıdır.

## B. Karar bekleyenler (bana "yap" demeniz yeterli)

- **Uygulama içi NEXUS AI'ı gerçek yapay zekâya bağlamak** (sitedeki asistan zaten Workers AI ile çalışıyor; gizlilik metinleri güncellenmeli).

## C. İleride

- Kendi alan adı (yıllık ~10 USD).
- Aile planı ürünü (sitede "Yakında").
- Supabase Pro'ya geçerseniz: "Leaked password protection".





