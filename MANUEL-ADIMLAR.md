# NEXUS — Sizin yapmanız gerekenler (25 Ekim 2026 güncel)

Yalnızca kendi hesaplarınızdan yapılabilen işler. Ayrıntılar ilgili issue'larda.

1. **GitHub kart/ödeme uyarısı** (Settings → Billing → Payment information). Kalkınca Actions çalışır, Linux ve otomatik yayın kendiliğinden tamamlanır. → #10, #19... (#7)
2. **Canlı ödeme denemesi:** web uygulamasında NEXUS+ → Ücretsiz dene (TRY ve USD, 3 gün, hemen iptal edilebilir). Discord'a "üyelik başladı" düşmeli, uygulamada Plus ve 2.000 kredi görünmeli. → #8
3. **Canlı testler (cihazlı):**
   - Android APK (gerçek telefon): kurulum, giriş, cihaz ekleme, kontrol. → #4
   - Windows kurulum (1.0.14 yerelde derlendi): açılış, tepsi, cihaz. → #5
   - Web: iki tarayıcıda giriş ve senkron. → #6
   - Yeni bir hesapla (cihazsız) ilk açılışı gezin: boş durumlar, "Başlat" düğmeleri. → #33, #25
4. **Supabase eski tabloları silme onayı:** `supabase/migrations/20261025_server_side_pack.sql` içinde 10 boş eski tablo ve `vector` uzantısı silme komutları var. Güvenlik izin sistemi bu silmeyi otomatik engelledi; tablolar 0 satır. Onaylarsanız uygularım (önce Dashboard → Database → Backups). → #26
5. **Android imza klasörü:** `C:\Users\MSI\NEXUS-signing\` (özel depo `nexus-signing-backup` da var). Kaybolursa Android güncellenemez.
6. **Discord webhook:** Supabase → Edge Functions → Secrets → `DISCORD_WEBHOOK_URL`. Adres sohbette açıkta kaldığı için Discord'da webhook'u yenileyip güncelleyin.
7. **Depo halka açılmadan önce:** GitHub profilinde e-posta gizleme, commit geçmişindeki e-postalar ve `nexus-releases` deposundaki commit yazarı. → #22
8. **İsteğe bağlı:** Gelir gelince işletme/unvan (yasal metinde veri sorumlusu), kendi alan adı (#19).
