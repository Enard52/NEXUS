# NEXUS — Yapılacaklar (yalnızca sizin işleriniz)

Bitmiş her şey bu listeden çıkarıldı.

## 1. Canlı test (parola/hesap gerektirdiği için sizin elinizle)

Web: `https://nexus-web-jre.pages.dev`

1. **Kayıt:** kendi e-postanızla kayıt olun → gelen doğrulama e-postasındaki bağlantıya tıklayın → otomatik giriş yapılmalı.
2. **Şifremi Unuttum:** e-postanızı yazın → gelen bağlantıya tıklayın → yeni şifre belirleyin → yeni şifreyle girin.
3. **Google ile giriş** (yalnızca web adresinde görünür).
4. **Masaüstü ve telefon:** aynı e-postayla girin; profil, ayar ve cihazlarınızın geldiğini kontrol edin. Bir cihazda ayar değiştirin, diğerinde birkaç dakika içinde görünmeli.

Sorun görürseniz ekran görüntüsüyle bana yazın.

## 2. Arama motorları (kalan küçük işler)

- **Bing:** site eklendi ve doğrulandı. Site haritası gönderimi Bing tarafında geçici sunucu hatası verdi. Yarın şuraya girip tekrar deneyin: Bing Webmaster → site → **Sitemaps → Submit sitemap** → `https://nexus-smarthome.pages.dev/sitemap.xml`. Hata sürerse sorun değil: `robots.txt` zaten site haritasını gösteriyor, Bing kendi bulur.

## 3. Markalı e-posta (ücretsiz başlangıç, alan adı gelene kadar)

1. Marka için yeni bir **Gmail** açın (örn. `nexus.destek@gmail.com`).
2. Bu hesapta **2 adımlı doğrulamayı** açın, sonra Google Hesabı → Güvenlik → **Uygulama şifreleri**'nden "NEXUS" adıyla bir şifre üretin.
3. Bana yalnızca **adresi** yazın; ben sitede, gizlilik sayfalarında ve uygulamada kullanırım.
4. Uygulama şifresini bana yazmayın: Supabase → Authentication → **SMTP Settings**'e kendiniz girin (host `smtp.gmail.com`, port `465`, kullanıcı adı = Gmail adresi, şifre = uygulama şifresi). Böylece kayıt doğrulama ve şifre sıfırlama e-postaları gerçek kullanıcılara gider.

Alan adı alınınca Cloudflare Email Routing (ücretsiz) ve Resend (ücretsiz) ile `destek@alanadı` adresine geçeriz.

## 4. Whop (ödeme)

Hesabınızdaki mevcut işletme **"Takipçi Durağım" askıya alınmış** görünüyor. NEXUS için yeni işletme açmadan önce askı nedenini Whop panelinde/e-postanızda kontrol edin; yeni bir işletme açmak Whop kurallarına aykırı sayılabilir ve ödemeleri riske atabilir. Sonucu bana yazın.

## 4. İleride

- Kendi alan adı (yıllık ~10 USD): arama sıralaması için daha iyi. Alırsanız bana yazın, tüm adresleri ben değiştiririm.
- `LICENSE`, gizlilik politikası ve kullanım koşulları için avukat incelemesi.
- Supabase Pro plana geçerseniz: Authentication → Passwords → "Leaked password protection" (ücretsiz planda kilitli).
