# NEXUS — Canlıya Alma Yol Haritası

Bu dosya sırayla uygulanır. Her adımın başındaki kutu tamamlandıkça işaretlenir.
**Kim yapar:** 👤 = Sen (fiziksel/elle), 🤖 = Asistan / Otomasyon.

Kural: Bütçe yok. Her adım ücretsiz yoldan hayata geçirildi.

---

## AŞAMA 1 — Kurulum dosyalarını GitHub'a koy (TAMAMLANDI ✅)

Kurulum dosyaları (Windows ≈125 MB, Mac ≈127 MB, Linux ≈126 MB) GitHub Releases üzerinden ücretsiz ve 2 GB sınırla dağıtılmaktadır.

- [x] 👤 **1.1 Herkese açık repo aç:** `Enard52/nexus-releases` açıldı (Public).
- [x] 👤 **1.2 Token üret:** `RELEASES_TOKEN` erişim anahtarı üretildi.
- [x] 👤 **1.3 Secret ekle:** `Enard52/NEXUS` deposuna `RELEASES_TOKEN` tanımlandı.
- [x] 🤖 **1.4 Masaüstü sürümlerini derle:** GitHub Actions `desktop-release.yml` (v1.0.0) Windows, macOS ve Linux için başarıyla derlendi.
- [x] 👤 **1.5 Doğrula:** `https://github.com/Enard52/nexus-releases/releases/tag/v1.0.0` altında şu dosyalar yayında ve indirme adresleri çalışıyor:
  - Windows: https://github.com/Enard52/nexus-releases/releases/latest/download/NEXUS-Setup.exe
  - macOS: https://github.com/Enard52/nexus-releases/releases/latest/download/NEXUS-mac.dmg
  - Linux AppImage: https://github.com/Enard52/nexus-releases/releases/latest/download/NEXUS-linux.AppImage
  - Linux Deb: https://github.com/Enard52/nexus-releases/releases/latest/download/NEXUS-linux.deb
  - Sürüm dosyaları: `latest.yml`, `latest-mac.yml`, `latest-linux.yml`, `SHA256SUMS-*.txt`

> Sonraki sürümler: kodu güncelle → `git tag v1.0.1` → `git push origin v1.0.1`.

---

## AŞAMA 2 — Gerçek cihaz ve telefon testi (Fiziksel Cihaz Gerektirir 📱)

Kod tarafındaki 860 testin tamamı yeşildir. Bu aşama kullanıcının elindeki fiziksel cihazlarla test edilmelidir:

- [ ] 👤 **2.1 APK'yı telefona kur** (Android Studio veya derleme çıktısı) ve ana ekran, dil, giriş, cihaz ekleme akışlarını aç.
- [ ] 👤 **2.2 En az bir gerçek cihazla dene:** Elinde Shelly, Tasmota, WLED, ESPHome, Hue, Kasa ya da Yeelight varsa telefonla aynı Wi-Fi'da "Cihaz ekle → tara" yap, aç/kapat çalışıyor mu bak.
- [ ] 👤 **2.3 Home Assistant testi (isteğe bağlı):** HA kuruluysa Ayarlar → Profil → Uzun Süreli Erişim Belirteci üret, NEXUS'ta "Home Assistant" ile bağla.
- [x] 🤖 **2.4 Dil algılama kontrolü:** Türkçe ve İngilizce otomatik yönlendirme ve i18n altyapısı hazırlandı ve doğrulandı.

---

## AŞAMA 3 — Cloudflare Pages ile Canlıya Alma (TAMAMLANDI ✅)

- [x] 👤 **3.1 Altyapı kararı:** Cloudflare Pages seçildi.
- [x] 🤖 **3.2 Cloudflare Pages Yayını:**
  - **Canlı Adres (Cloudflare):** https://nexus-b6p.pages.dev/
  - **Türkçe Sayfa (Cloudflare):** https://nexus-b6p.pages.dev/tr/
  - **Güvenlik ve Yönlendirme:** `public/_headers` (HSTS, CSP, Permissions, Cache) ve `public/_redirects` Cloudflare Pages üzerinde aktif.
  - **Tek Komutla Dağıtım:** `pnpm deploy:pages` komutu eklendi.
- [x] 🤖 **3.3 Bağlantılar ve SEO güncellendi:** Site URL'leri, og:url, og:image, sitemap.xml ve robots.txt `https://nexus-b6p.pages.dev/` adresine güncellendi.
- [x] 👤 **3.4 Canlı doğrulama:**
  - Ana sayfa: `curl -I https://nexus-b6p.pages.dev` -> HTTP 200 OK (Server: cloudflare)
  - Türkçe sayfa: `curl -I https://nexus-b6p.pages.dev/tr/` -> HTTP 200 OK (Server: cloudflare)
  - İndirme butonları: `https://nexus-b6p.pages.dev/` üzerinden tıklandığında doğrudan GitHub Releases'tan son sürümü indiriyor.

---

## AŞAMA 4 — Mağazalar (İsteğe Bağlı, Sonra)

- Android Play Store: Ücretli hesap açılana kadar APK indirmeleri GitHub Releases / Site üzerinden dağıtılır.
- iOS App Store: Apple Developer hesabı ($99/yıl) açılana kadar Web/PWA ("Ana ekrana ekle") kullanılır.

---

## AŞAMA 5 — Temizlik (TAMAMLANDI ✅)

- [x] 👤 **5.1 Eski dalı temizle:** GitHub üzerindeki eski `site-desktop-downloads` dalı silindi ve `archive/site-desktop-downloads` etiketiyle arşivlendi.
- [ ] 👤 **5.2 Dal koruması (isteğe bağlı):** GitHub repo ayarlarından `main` için Branch Protection açılabilir.
- [ ] 👤 **5.3 Güvenlik:** `RELEASES_TOKEN` parola yöneticisinde saklanmalı.

---

## Durum Özeti

- **Canlı Cloudflare Web Sitesi:** https://nexus-b6p.pages.dev/
- **İndirme Deposu:** https://github.com/Enard52/nexus-releases/releases/latest
- **Testler:** 860/860 test başarıyla geçiyor (CI yeşil).
- **TypeScript & Build:** Hata yok, `build:static`, `build:client`, `build:server` sorunsuz tamamlanıyor.
- **Cloudflare Dağıtım Komutu:** `pnpm deploy:pages`
