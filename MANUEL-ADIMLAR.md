# NEXUS — Manuel Adımlar (en düşük maliyetli yol)

Bu dosya, kodla yapılamayan ve sizin yapmanız gereken işleri listeler. Sıra önemlidir: önce ücretsiz adımlar, sonra isteğe bağlı ücretli adımlar.

Son güncelleme: 24 Ekim 2026. Masaüstü sürümü: 1.0.5 (Windows, macOS, Linux). Android: test APK'sı.

## 0. Önemli: şu an gerçekte olanlar

- **Planlar ve ödeme yok.** Site ve uygulamada "satın al" ekranı var, ama bu ekran yalnızca yerel bir kayıt yazıyor. Gerçek ödeme alınmıyor ve hiçbir özellik plana göre kilitlenmiyor. Gerçek ödeme almadan önce ya plan sayfasını "yakında" olarak işaretleyin ya da ödeme sağlayıcısını bağlayın.
- **Hesaplar yerel.** Bulut eşitlemesi için Supabase kurulumu gerekiyor (aşağıda 2. madde). Kurulmadan hesap özellikleri cihaza özel çalışır.
- **Mobil uygulama test APK'sıdır.** Mağaza sürümü için imzalama ve mağaza hesabı gerekir.

## 1. Ücretsiz yapılması gerekenler

1. **Canlıda test edin:** Masaüstü (1.0.5 kurulumu) ve telefon (APK). Test listesi için bölüm 5'e bakın.
2. **Telefonda APK kurulumu:** Ayarlar → Güvenlik → "Bilinmeyen kaynaklardan kurulum" iznini uygulamanıza verin. Sadece test için.
3. **Site sürüm yazıları:** Otomatik. Yeni sürüm yayınlandığında elle bir şey yapmanız gerekmez.
4. **Gizlilik politikası ve kullanım koşulları:** Site sayfalarında taslak var, ancak hukuki onay yok. Ücretsiz seçenek: şimdilik "taslak" ibaresi kalsın, ticari kullanımdan önce bir avukat incelemesi yapın (öğrenci kulüplerinde ücretsiz hukuk danışmanlığı olabilir).

## 2. Bulut hesapları (ücretsiz)

1. Supabase'de ücretsiz bir proje açın (eu-region).
2. `supabase/migrations/0001_nexus_devices.sql` dosyasını SQL editöründe çalıştırın.
3. Projede `cloud-config.example.js` dosyasını `cloud-config.js` olarak kopyalayıp `url` ve `anonKey` değerlerini girin. Bu dosya `.gitignore`'da, anahtarlar repoya girmez.
4. Giriş ekranından gerçek bir hesapla kayıt olup cihaz eşitlemesini deneyin.

## 3. Masaüstü kod imzalama (en önemli maliyet kalemi)

Windows, imzasız uygulamaları SmartScreen ve Uygulama Denetimi ile engelleyebilir. Kullanıcılar "Yine de çalıştır" diyerek açabilir, ama bu güven sorunu yaratır.

- **Ücretsiz seçenek:** Şimdilik imzasız bırakın ve sitede kısa bir kurulum notu ekleyin: "Windows uyarısı çıkarsa 'Ek bilgi → Yine de çalıştır'".
- **Ücretli seçenekler (yıllık, fiyatlar değişir, güncel fiyatı kontrol edin):** Windows için kod imzalama sertifikası. Açık kaynak ya da öğrenciye özel ücretsiz programlar bazen olur; sorun, başvuruların kurumsal bilgi isteyebilmesi.
- **macOS:** Apple Developer hesabı yıllık ücretlidir. Ücretsiz yol: kullanıcı uygulamayı sağ tıklayıp "Aç" ile açar. Sitede bu notu ekleyin.
- **Linux:** İmza gerekmez.

**Tavsiye:** Başlangıçta imzasız dağıtın, notları sitede verin. Kullanıcı sayısı arttığında sertifikayı düşünün.

## 4. Mobil mağazalar

- **Google Play:** Tek seferlik 25 USD. Android mağaza sürümü için gerekli. En düşük maliyetli mağaza yolu budur.
- **Apple App Store:** Yıllık 99 USD. iOS'u şimdilik kapsam dışı tutmanızı öneririm.
- Mağaza için: release APK/AAB imzalama anahtarı oluşturun (keystore) ve anahtarı kaybetmeyin. Bu dosyayı yedekleyin.

## 5. Canlı test listesi

**Masaüstü (1.0.5):**
- Kurulum, açılış, sidebar ve AI kartı.
- Ana sayfa kartları: aynı boyut ve ikon.
- Güncelleme: "Güncellemeleri Kontrol Et" ve otomatik indirme anahtarı.
- Ayarlar: sıcaklık birimi ve dil seçenek listeleri.
- Cihaz ekle: katalog, bağlanmamış cihazın gizlenmesi.

**Telefon (APK):**
- Açılış, alt menü, ana sayfa kartları.
- Cihaz ekle ve senaryo başlatma uyarısı.
- Ayarlar: seçenek pencereleri.
- Kamera izni gerektiren sayfalar (QR ve kurulum kodu).

**Tablet:** Aynı liste, yatay ve dikey yönlerde.

## 6. Ücretli işler (isteğe bağlı, bütçeye göre)

| Konu | Yaklaşık maliyet | Zorunlu mu |
| --- | --- | --- |
| Windows kod imzalama | Yıllık, fiyat değişir | Hayır (ilk etapta) |
| Google Play hesabı | 25 USD bir kez | Mağaza için evet |
| Apple Developer | 99 USD/yıl | Hayır (iOS kapsam dışı) |
| Ödeme sağlayıcı (İyzico/Stripe) | İşlem başına komisyon | Gerçek ödeme için evet |
| Supabase | Ücretsiz katman | Hayır |
| Domain | Yıllık | Hayır (GitHub Pages ücretsiz) |

**Önerilen en düşük maliyetli yol:** Google Play 25 USD bir kez. Diğer her şey ücretsiz başlar.

## 7. Eski dosya hakkında

`EXTERNAL-REQUIREMENTS.md` eskidir ve masaüstü uygulaması hakkında yanlış bilgi içerir. Bu dosya, güncel manuel işleri içeren tek kaynak olarak kullanılmalıdır.
