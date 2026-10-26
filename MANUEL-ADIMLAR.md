# NEXUS — Sizin yapmanız gerekenler (26 Ekim 2026)

Yalnızca kendi hesaplarınızdan yapılabilen işler. Kod tarafında yapılabilecekler bu listede yok.

1. **GitHub kart/ödeme uyarısı** (Settings → Billing → Payment information). Kalkınca `v*` etiketi Actions ile masaüstü ve Android yayınını kendisi keser. Şimdilik indirmeler mevcut `v1.0.14` sürümünün üstüne yazılıyor; uygulama içi sürüm yazısı 1.0.15.
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
7. **Supabase e-posta şablonları:** Dashboard'dan özelleştirilmedi. Management API için `SUPABASE_ACCESS_TOKEN` gerekir; parola yazılmadı.
8. **Depo halka açılmadan önce:** GitHub profilinde e-posta gizleme, commit geçmişindeki e-postalar ve `nexus-releases` deposundaki commit yazarı.
9. **İsteğe bağlı:** Gelir gelince işletme/unvan (yasal metinde veri sorumlusu), kendi alan adı.
