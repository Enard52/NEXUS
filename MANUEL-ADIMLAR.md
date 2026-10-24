# NEXUS — Yapılacaklar

Yalnızca **henüz yapılmamış** işler. Son kontrol: 25 Ekim 2026. SMTP ve e-posta doğrulaması çalışıyor (test e-postası geldi).

## A. Sizin yapmanız gerekenler (hesap / gizli anahtar gerektirir)

1. **Whop webhook gizli anahtarı** (bu olmadan ödeme olsa bile plan hesaba işlenmez; işlev şu an "503 secret yok" veriyor)
   - Whop → Nexus-smarthome → Geliştirici → Web kancaları → "NEXUS Supabase" gizli anahtarı (`ws_...`) → kopyalayın.
   - Supabase → Edge Functions → Secrets → `WHOP_WEBHOOK_SECRET` = kopyaladığınız anahtar.
   - Whop'ta aynı webhook için "test olayı" gönderin; Edge Functions → whop-webhook → Logs'ta 200 görünmeli.
2. **Whop ürün sayfası:** ₺499,99'un üstünde çizili "₺624,99 / %20 tasarruf" görünüyorsa plan ayarlarından kaldırın (gerçek indirim yok).
3. **Canlı testler** (1'den sonra), `https://nexus-web-jre.pages.dev`:
   - Kayıt → gelen doğrulama e-postası → bağlantı → otomatik giriş.
   - Şifremi Unuttum → e-posta → yeni şifre → giriş.
   - Google ile giriş (yalnızca web).
   - NEXUS+ → Ücretsiz Dene → hesabınızın e-postasıyla ödeme (3 gün denemede ücret alınmaz, iptal edebilirsiniz) → plan Plus/Faturalandırma'da görünmeli.
   - Masaüstü ve telefon: aynı hesapla giriş, verilerin gelmesi.
4. **Bing:** Webmaster → Sitemaps → `https://nexus-smarthome.pages.dev/sitemap.xml` tekrar gönderin (ilk deneme sunucu hatası verdi).

## B. Karar bekleyenler (bana "yap" demeniz yeterli)

- **Google giriş onay ekranını yeni hesaba taşımak:** destek e-postası şu an eski Google Cloud projesinde. Yeni projeyi `nexus.smarthome.app@gmail.com` altında açmak gerekiyor (Client Secret'ı Supabase'e siz girersiniz).
- **Gerçek yapay zekâ:** "NEXUS AI" şu an çevrimdışı komut eşleştirici. Bulut yapay zekâ (çok sağlayıcılı yedekli, isteğe bağlı) eklenebilir; gizlilik metinleri güncellenmeli, "sınırsız" denmemeli.

## C. İleride

- Kendi alan adı (yıllık ~10 USD): arama sıralaması ve `destek@alanadı` için.
- Aile planı ürünü (sitede "Yakında").
- Avukat incelemesi: `LICENSE`, gizlilik, kullanım koşulları, iade/iptal şartları (satış başlayınca).
- Supabase Pro'ya geçerseniz: "Leaked password protection".
