# NEXUS Routes

Proje dosya tabanlı router yerine statik çok sayfalı HTML yapısı kullanıyor. Her `stitch-*.html` ekranı doğrudan bir route olarak davranıyor.

## Ana rotalar
- `/stitch-home.html` -> ana ekran, favoriler, cihaz kartları, hızlı aksiyonlar
- `/stitch-smart.html` -> akıllı uygulama, tıkla-çalıştır, otomasyon sekmeleri
- `/stitch-discover.html` -> keşfet / mini app listesi
- `/stitch-profile.html` -> profil özeti ve menü
- `/stitch-settings.html` -> ayarlar merkezi
- `/stitch-login.html` -> giriş
- `/stitch-pair.html` -> cihaz ekleme merkezi
- `/stitch-scan.html` -> QR tarama
- `/stitch-setup-code.html` -> kurulum kodu girişi
- `/stitch-cards.html` -> kart seçimi / ana sayfa görünürlüğü

## Eksik ekran ihtiyacı olan mevcut giriş noktaları
- `stitch-discover.html`
  - `SMS ve Çağrı Bildirimleri`
  - `AI Aydınlatma Ustası`
  - `AI Lens`
- `stitch-settings.html`
  - `Hesap ve Güvenlik`
  - `Cihaz Güncellemesi`
  - `Anlık Bildirimler`
- `stitch-login.html`
  - `Şifremi Unuttum`

## Kullanılan ortak layout mantığı
- Üstte iOS benzeri safe-area header
- Çoğu ekranda alt sabit gezinme
- Home selector ve bottom sheet modal kalıbı
- Cam efektli beyaz kartlar + açık lila/mavi arka plan gradientleri

## Router config
Bu projede merkezi bir `router/index.ts` benzeri dosya yok; sayfalar arası geçiş `href="stitch-*.html"` ve `window.location.href` ile yapılıyor.
