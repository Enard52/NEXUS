# NEXUS — Yapılacaklar (yalnızca sizin işleriniz)

Bitmiş her şey bu listeden çıkarıldı. Sırayla yapın: 1 ve 2 satışa çıkmadan önce şart.

## 1. E-posta gönderimi (kayıt doğrulama + şifre sıfırlama gerçek kullanıcılara ulaşsın)

Hesap hazır: `nexus.smarthome.app@gmail.com`. Kalanlar:

1. Bu Gmail hesabında **2 adımlı doğrulamayı** açın (Google Hesabı → Güvenlik).
2. Aynı yerden **Uygulama şifreleri** → ad "NEXUS" → 16 haneli şifreyi kopyalayın.
3. Google Hesabı → Kişisel bilgiler → **Ad**: `NEXUS Support` yapın.
4. Supabase → Authentication → **SMTP Settings** → Custom SMTP açın: host `smtp.gmail.com`, port `465`, kullanıcı adı = Gmail adresi, şifre = uygulama şifresi, gönderen e-posta = Gmail adresi, gönderen adı `NEXUS Support` → Save.
5. Bana "SMTP girdim" yazın; doğrulama e-postasının geldiğini test ederim.

Şifreyi bana yazmayın.

## 2. Whop ödeme bağlantısı (webhook gizli anahtarı)

NEXUS+ planları Whop'ta hazır (Aylık ₺499,99 / 3 gün deneme, Yıllık ₺3.999,99 / 7 gün deneme). Ödeme olduğunda planın hesaba işlenmesi için webhook gizli anahtarını Supabase'e girmeniz gerekiyor:

1. Whop → işletme **Nexus-smarthome** → **Geliştirici** → aşağıda "Web kancaları" → **NEXUS Supabase** satırındaki gizli anahtarı (`ws_...`) kopyalayın.
2. Supabase → **Edge Functions** → **Secrets** (Manage secrets) → yeni sır: ad `WHOP_WEBHOOK_SECRET`, değer = kopyaladığınız anahtar → Save.
3. Whop'ta aynı webhook için **Send test event / Test** gönderin; Supabase → Edge Functions → `whop-webhook` → Logs'ta 200 görünmeli. (Gizli anahtar girilmeden işlev 503 döner.)
4. Whop → **Ürünler → NEXUS+**: ürün sayfasında ₺499,99'un üstünde çizili bir eski fiyat/"%20 tasarruf" görünüyorsa kaldırın (Plan ayarları'nda karşılaştırma/başlangıç fiyatı alanı). Gerçek indirim olmadığı için kalmamalı.
5. **Gerçek ödeme testi:** uygulamada (web) hesabınızla girip NEXUS+ → Ücretsiz Dene → ödemeyi tamamlayın (aylık plan 3 gün deneme verir, ücret alınmadan önce iptal edebilirsiniz). Ödemede **hesabınızın e-postasını** kullanın. Birkaç saniye sonra Plus ve Faturalandırma sayfasında plan görünmeli; iptali Faturalandırma → Whop'a Git ile deneyin.

Not: Whop bakiyesi USD gösteriyor; TL ödemeler Whop tarafından dönüştürülür. Komisyon ve ödeme çekme koşullarını Whop panelinde kontrol edin.

## 3. Canlı test (parola/hesap gerektirdiği için sizin elinizle)

Web: `https://nexus-web-jre.pages.dev`

1. **Kayıt:** kendi e-postanızla kayıt olun → gelen doğrulama e-postasındaki bağlantıya tıklayın → otomatik giriş yapılmalı.
2. **Şifremi Unuttum:** e-postanızı yazın → gelen bağlantıya tıklayın → yeni şifre belirleyin → yeni şifreyle girin.
3. **Google ile giriş** (yalnızca web adresinde görünür).
4. **Masaüstü ve telefon:** aynı e-postayla girin; profil, ayar ve cihazlarınızın geldiğini kontrol edin.

Sorun görürseniz ekran görüntüsüyle bana yazın.

## 4. Arama motorları (kalan küçük iş)

- **Bing:** site eklendi ve doğrulandı. Site haritası gönderimi geçici sunucu hatası verdi. Yarın Bing Webmaster → site → **Sitemaps → Submit sitemap** → `https://nexus-smarthome.pages.dev/sitemap.xml`. Hata sürerse sorun değil: `robots.txt` zaten haritayı gösteriyor.

## 5. İleride

- Kendi alan adı (yıllık ~10 USD): arama sıralaması ve marka e-postası için. Alırsanız bana yazın, tüm adresleri ben değiştiririm.
- Aile planı için ürün/plan tanımı (şimdilik sitede "Yakında").
- `LICENSE`, gizlilik politikası ve kullanım koşulları için avukat incelemesi (ödeme alınmaya başlandığında iade/iptal şartları da eklenmeli).
- Supabase Pro plana geçerseniz: Authentication → Passwords → "Leaked password protection".
