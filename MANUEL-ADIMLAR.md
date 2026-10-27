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

## 27 Ekim 2026 turu 2: Çoklu AI + kullanılabilirlik paketi (v1.0.22) — SENDEN BEKLENENLER

Kod tarafı bitti, tüm paketlere dağıtıldı (www → desktop/app → android assets), testler 980/980 yeşil,
UI denetimi 386 ölçümde sıfır yeni kırılma. Sıra sende:

1. **Android APK'yı yeniden derle ve telefona kur** (`npx cap open android` → Build). Bu turda yerel kod değişti (NexusKeepAlivePlugin eklendi, MainActivity güncellendi) — web sync yetmez, native derleme ŞART.
2. **Telefonda "Arka Plan Otomasyonu"nu dene:** Ayarlar → Ses ve Hareket kartının en altında (yalnız Android'de görünür). Açınca bildirimde "NEXUS Yerel Otomasyon Motoru" şeridi düşmeli, uygulamayı kapatınca otomasyonlar çalışmaya devam etmeli. Kapatınca şerit kalkar. Varsayılan KAPALI (pil tercihi sende).
3. **Enter ile kaydetme kontrolü:** Giriş'te e-posta/şifre yazıp Enter → doğrudan giriş; Kayıt 4 alan → Enter; Ev/oda ekle, üye daveti, cihaz adlandırma (Ad → Kaydet), Kurulum kodu, Home Assistant jetonu → hepsi Enter ile gönderiyor. Telefon klavyesinde tuşun adı "Git/Tamam"a döner.
4. **Windows kurulumu:** programı açınca güncelleme merkezi 1.0.22'yi önerecek (ya da Setup.exe'yi yeniden çalıştır).
5. **AI yedek sağlayıcı anahtarları (10 dakika, ücretsiz):** Worker artık sırayla Cloudflare → Groq → Gemini → OpenRouter deniyor; anahtar girmezsen o sağlayıcı sessizce atlanır. En az bir yedek girmen önerilir:
   - Groq: console.groq.com → API Keys → anahtarı kopyala
   - Google Gemini: aistudio.google.com → Get API key
   - OpenRouter (isteğe bağlı): openrouter.ai → Keys
   - Girme komutu (bu klasörde): `cd cloudflare-worker\nexus-ai` sonra `npx wrangler secret put GROQ_API_KEY` (ve/veya GEMINI_API_KEY, OPENROUTER_API_KEY) → yapıştır. Model değiştirmek istersen `GROQ_MODEL` / `GEMINI_MODEL` / `OPENROUTER_MODEL` sırrı.

### v1.0.22'de ne yapıldı (özet)

- **Çoklu ücretsiz AI sağlayıcı zinciri:** nexus-ai worker'ı Cloudflare Workers AI yanıt vermezse Groq → Gemini → OpenRouter'ı sırayla dener; yanıt `via` alanıyla hangi sağlayıcıdan geldiğini taşır. CANLI'ya dağıtıldı (duman testi ✓).
- **Enter ile kaydetme:** theme.js'e ortak yardımcı; 16 sayfada 30+ girdi `data-enter` ile işaretlendi. Otomatik kaydeden alanlarda (bildirim kanalları) Enter değişikliği kesinleştirir. İşaretsiz girdilerde davranış değişmez (sıfır risk).
- **İkon/metin düğme denetimi:** 4 kuralın taraması yapıldı — başlıkta+düğmede ikon tekrarı YOK, birincil eylemler hep metinli, yalnız-ikon düğmelerin tamamı evrensel eylem. 11 düğmeye eksik aria-label eklendi (+ "Odayı kaldır" sözlüğü).
- **Android arka plan servisi:** NexusKeepAlivePlugin (Java) + MainActivity kaydı + Ayarlar anahtarı + theme.js açılış kancası; servis bildirimi iki dilli (TR/EN, açılış diline göre).
- **Zoom kilidi kaldırıldı:** 52 sayfada `user-scalable=no` → `maximum-scale=3.0` (WCAG %200 yakınlaştırma artık çalışır, 3× üst sınırla düzen korunur). index.html'e eksik viewport meta eklendi.
- **Performans:** `js/lucide.js` (596 KB) 51 sayfada head'den gövde sonuna taşındı — ilk boyama artık ikon kütüphanesini beklemez (harici çağrılar `window.lucide` korumalı, ikonlar test edildi ✓). Senaryo çalıştırma artık tüm cihaz listesini bir kez yazıyor (cihaz×alan yerine — ölçüldü: 4 yazı → 1 yazı). Sözlük `document.write` bilinçli kaldı (İngilizce'de Türkçe parlama yaşanmasın).

### Hâlâ kararın bekleyenler

- **CSP `unsafe-inline`:** uzun vadeli büyük iş; acele değil. Sayfalardaki satır içi betikler harici dosyalara taşınırsa konulabilir.
- **lucide ikon küçültme:** sayfa başına yalnız kullanılan ikonlarla özel derleme (build hattı ister).
- **Depo halka açılmadan önce** (üstteki madde 8): GitHub e-posta gizliliği + nexus-releases commit yazarı.

---

## 27 Ekim 2026 turu 1: Ses / Hareket / düzeltmeler (v1.0.21) — YAYINLANDI ✓

Canlıya çıktı: site v1.0.21 gösteriyor, nexus-releases'te tüm kurulum dosyaları var, updater manifest 1.0.21.
Telefonda/PC'de doğrulama maddeleri (ses anahtarları, tepsi bildirimi, sesli konuşma kırmızı halkası) aynen geçerli —
1.0.22 APK'sıyla birlikte test edebilirsin.
