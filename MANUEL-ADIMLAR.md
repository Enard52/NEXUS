# NEXUS — Sizin yapmanız gerekenler (26 Ekim 2026)

Yalnızca kendi hesaplarınızdan yapılabilen işler. Kod tarafında yapılabilecekler bu listede yok.

1. **GitHub Actions** yeniden çalışıyor. Yeni sürüm `v*` etiketiyle `nexus-releases` deposuna gider. Elle aynı etiketin üstüne dosya yazmaya gerek yok.
2. **Canlı ödeme denemesi:** masaüstü programda veya Android uygulamasında NEXUS+ → Ücretsiz dene (TRY ve USD, 3 gün, hemen iptal edilebilir). Discord'a "üyelik başladı" düşmeli, hesapta Plus ve 2.000 kredi görünmeli. Tarayıcı uygulaması ürün olarak yayınlanmıyor.
3. **Canlı cihaz testleri:**
   - Android: kurulum, giriş, cihaz ekleme, kontrol.
   - Windows kurulum: açılış, tepsi, cihaz.
   - Linux: sitedeki paket Debian/Ubuntu `.deb`. AppImage bu Windows makinede simge bağlantısı izni yüzünden paketlenemedi; Linux bir makinede ayrıca üretilebilir.
   - macOS paketi yok; bu makinede üretilemez.
   - Yeni bir hesapla (cihazsız) ilk açılışı gezin: boş durumlar, eylem düğmeleri.
4. **Supabase eski tabloları silme onayı:** `supabase/migrations/20261025_server_side_pack.sql` içinde 10 boş eski tablo ve `vector` uzantısı silme komutları var. Güvenlik izin sistemi bu silmeyi otomatik engelledi; tablolar 0 satır. Onaylarsanız uygularım (önce Dashboard → Database → Backups).
5. **Android imza klasörü:** `C:\Users\MSI\NEXUS-signing\` (özel depo `nexus-signing-backup` da var). Kaybolursa Android güncellenemez.
6. **Discord webhook:** Supabase → Edge Functions → Secrets → `DISCORD_WEBHOOK_URL`. Adres sohbette açıkta kaldığı için Discord'da webhook'u yenileyip sırrı güncelleyin.
7. ~~Supabase e-posta şablonları~~ **TAMAM (27 Ekim):** 13 şablonun tamamı panelde iki dilli (`.Data.lang` koşullu — kullanıcıya yalnızca kendi dilinde gider), 7 güvenlik bildirimi açık ve `household-invite` Edge Function'ı panel editöründen dağıtıldı (canlı). "Üye Davet Et" artık gerçek davet mektubu gönderir: kod yalnızca e-postayla iletilir, uygulamada/programda gösterilmez; her davet kendi tek kullanımlık kodunu alır. Kalan tek manuel adım yok. Denemek: uygulamada bir davet gönder, davetliye gelen mektubun dilini kontrol et.
8. **Depo halka açılmadan önce:** GitHub profilinde e-posta gizleme, commit geçmişindeki e-postalar ve `nexus-releases` deposundaki commit yazarı.
9. **İsteğe bağlı:** Gelir gelince işletme/unvan (yasal metinde veri sorumlusu), kendi alan adı.

---

## 27 Ekim 2026 turu: Ses / Hareket / düzeltmeler (v1.0.21)

Kod tarafı bitti, tüm paketlere dağıtıldı (www → desktop/app → android assets), testler 980/980 yeşil.
Sıra sende — cihazlarda doğrula:

1. **Android APK'yı yeniden derle ve telefona kur** (`npx cap open android` → Build). Ses/titreşim/animasyon anahtarları Ayarlar → "Ses ve Hareket"te. Cihaz aç/kapat kısa ses + kart nabzı, senaryo bitişte tek arpej, bildirimde zil çalmalı. Cihazda denedikten sonra beğenmezsen tek anahtarla susturulur.
2. **Windows kurulumu yenile** (installer rebuild — `desktop/app` değişti): tepsi bildirimleri artık gerçekten çalışmalı (event-bridge ilk kez yükleniyor).
3. **Sesli konuşma kontrolü (telefonda):** Sohbet → mikrofona dokun → kırmızı halka animasyonu + "Dinliyorum…" şeridi. Kayıt bitince metin geliyor mu?
4. **Site güncel değil** — bu turda site tasarımı değişmedi, ama sürüm ilerlediyse istersen `npm run publish:site` ile siteyi de yenile (GitHub kartı açıksa Actions zaten halleder).

### Sahibin kararı bekleyen öneriler (kod istemiyor, sadece karar)

- **Çoklu ücretsiz AI sağlayıcısı:** Asistan şu an yalnızca Cloudflare Workers AI'ya bağlı (kota/erişim kesilirse sohbet AI'sı susar). Ücretsiz katmanlı ikinci/üçüncü sağlayıcı (Groq, Google Gemini free tier, OpenRouter ücretsiz modeller) yedek zinciri önerilir; worker tarafında anahtar yönetimiyle kurulur. "Başla" de, araştırıp kurayım.
- **Enter ile kaydetme paketi (onayını bekliyor):** Taramada görüldü — sohbet dışında HİÇBİR ekran Enter ile göndermiyor: giriş e-posta/şifre/2FA, kayıt 4 alan, şifre sıfırlama, ev/oda/üye adları, cihaz adı yeniden adlandırma, kişisel bilgi adı, ntfy/webhook/telegram alanları. Tek ortak yardımcıyla (theme.js) tümü bağlanır; telefon klavyesinde "git/enter" da çalışır. Onayla, bir turda bitireyim.
- **İkon/metin düğme denetimi (onayını bekliyor):** Kural önerisi: (1) kart/satır listelerinde ikon yalnız satır başındadır, düğme metindir; (2) başlıkta ikon varsa aynı bölümün eylem düğmesinde ikon TEKRARLANMAZ; (3) yalnız-ikon düğmeler yalnızca evrensel eylemlerdir (kapat ×, geri ‹, ekle +) ve aria-label zorunlu; (4) birincil eylem her zaman metinlidir (Cihaz Ekle, Kaydet). 62 ekranın tek tek dökümünü çıkarıp tutarlı hale getireyim — onayla.
- **Android arka plan servisi:** Telefonda otomasyonlar yalnız uygulama açıkken çalışıyor (masaüstünde tepsi var). NexusKeepAliveService manifest'te kayıtlı ama hiç başlatılmıyor — başlatma kararı akü tüketimi tartışması ister; istersen etkinleştirme yolu yazılır.
- **Zoom kilidi (erişilebilirlik):** 52 sayfada pinch-zoom kapalı (`user-scalable=no`). WCAG için tartışmalı; kapatmak tasarımı korur, açmak erişilebilirliği artırır. Karar senin.
- **CSP `unsafe-inline`:** Tüm sayfalarda satır içi betiklere izin veriliyor; uzun vadede harici dosyaya taşıma önerilir (büyük iş, acele değil).
- **Performans notları (acele değil):** `js/lucide.js` 596 KB her sayfada senkron yükleniyor (kullanılan ikon küçültülebilir); İngilizce kullanıcıya 153 KB sözlük `document.write` ile ekleniyor; senaryo çalıştırma cihaz×alan başına tüm cihaz listesini okuyup yazıyor (tek yazıma sadeleştirilebilir).
