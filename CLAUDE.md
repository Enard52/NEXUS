# NEXUS — geliştirici kuralları (Claude ve diğer geliştiriciler için; kullanıcıya gösterilmez)

1. **Sahte/demo/mock hiçbir şey eklenmez.** Cihaz, veri, istatistik, abonelik, fiyat ya da yapay zekâ yanıtı uydurulmaz.
   Bir özellik çalışmıyorsa (köprü yok, cihaz yanıt vermiyor, kota doldu) arayüz bunu dürüstçe söyler; asla "başarılı" gibi görünmez.
   Bu uyarılar kod YORUMLARINDA durur (ör. `lan-connectors.js` başlığı); kullanıcıya görünen metinde "sahte/test" ifadesi geçmez.
2. Yeni bağlayıcı (protokol) yalnızca gerçek protokol belgesine göre yazılır ve `packages/web/src/lan-*.test.ts` içinde paket/yanıt biçimi testiyle gelir.
   Gerçek cihazla denenmemişse commit mesajında / MANUEL-ADIMLAR.md'de belirtilir.
3. Gizli anahtar (token, parola, webhook adresi) depoya, sohbete ya da koda yazılmaz. Supabase Secrets / GitHub Secrets kullanılır.
4. Fiyatlar ve plan metinleri tek kaynaktan gelir: `scripts/site-pricing.cjs`, `cloud-sync.js` (prices), Whop planları. Biri değişince hepsi birlikte güncellenir.
5. Yayın: `main`'e push → site/web otomatik (`web-deploy.yml`); `v*` etiketi → masaüstü + Android (`desktop-release.yml`, `android-release.yml`);
   `release-catchup.yml` eksik kalan sürümleri tamamlar. Elle yayın gerekirse `MANUEL-ADIMLAR.md` ve `LOCAL-BUILD.txt` kuralına bakın.
6. Android imzası: `~/NEXUS-signing/` (yedek: özel depo `nexus-signing-backup`). Depoya anahtar dosyası eklenmez.

7. **Her ekran 3 durumda denenir:** (a) yeni kullanıcı: hesap/cihaz YOK, (b) 1 cihaz eşleşmiş, (c) çevrimdışı/hata. Cihaz, yetenek ya da veri olmadan bir eylem düğmesi (Başlat, Çalıştır, Kaydet...) gösterilmez; yerine boş durum ve dürüst bir sonraki adım (örn. 'Önce cihaz ekle') gösterilir. Test hesabı hep dolu veriyle denenmemeli.
