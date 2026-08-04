# NEXUS Mobil - Eksik Kalanlar

Bu belge, akış olarak çalışan ama görsel kalite, bütünlük veya ürün hissi açısından hala tamamlanması gereken alanları listeler. Bunlar yeni işlev üretmekten çok mevcut çalışan yüzeyleri daha güçlü hale getirme işidir.

## Tarama ve Manuel Ekleme

- Tarama ekranı alt aksiyon alanı: Kurulum kodu, fener ve albüm aksiyonları işlevsel olsa da görsel olarak daha premium bir seviyeye çıkarılmalı.
- Manuel ekleme CTA satırı: `QR bulunamadıysa manuel ekleyin` alanı çalışıyor fakat görsel hiyerarşi zayıf.
- Kurulum kodu giriş noktası: `Kurulum Kodu Girin` yüzeyi ikonografi, boşluk ve vurgu açısından rafine edilmeli.
- Kurulum kodu tam ekranı: Akış doğru, fakat giriş alanı, üst boşluklar ve başlık dengesi daha iyi tasarlanmalı.
- Cihaz ekleme merkezi (`stitch-pair.html`): Akış bağlı, ama radar hero, manuel katalog kabuğu ve alt CTA alanı aynı tasarım ailesinde daha güçlü görünmeli.
- Manuel katalog kabuğu: Katalog çalışıyor, fakat kapsayıcı yüzey, geçiş hissi ve içerik derinliği yükseltilmeli.

## Kart Ekle

- Smart Home listesi: Seçim mantığı çalışıyor, fakat kart satırları hala fazla düz görünüyor.
- Devices sekmesi: Gerçek cihaz verisi gösteriliyor, ama secondary metadata ve seçili durum görselliği güçlendirilmeli.
- Tap-to-Run sekmesi: Kısayollar çalışıyor, fakat ürün hissi ve senaryo kimliği zayıf.

## Anasayfa Polish

- Sonradan eklenen kartlar: Veri modeliyle görünüyorlar, ama bazı kartların görsel seviyesi hala temel.
- Tap-to-Run bölümü: Çalışıyor, fakat bölüm hiyerarşisi ve dokunma hissi geliştirilmeli.
- Yarım açılan modüller: Sürükleyerek kapatma davranışı var, ama handle ve motion hissi daha rafine olabilir.
- Koyu tema son polish: Yeni ve mevcut sayfalar light/dark birlikte kontrol edilerek son kontrast ayarı geçirilmeli.

## Superdesign Draft Durumu

- `NEXUS Device Add Center` draftı hazır: `61fca7ae-76d8-467d-bbfb-9030fc892318`
  Hedef: `stitch-pair.html` içindeki cihaz ekleme merkezi, radar hero, manuel ekleme CTA alanı ve katalog kabuğunu aynı tasarım ailesinde yenilemek.
- `NEXUS Premium Discover Screen` draftı hazır: `d9e03b23-132d-49b5-b253-9f9a7a7e3454`
  Hedef: `stitch-discover.html` içindeki önerilen kartların daha premium gösterimi ve ilgili tam sayfa akışlara görsel devamlılık sağlamak.
- `NEXUS Add Card Flow` draftı hazır: `1541bb72-cefb-4d5b-a85b-f77524400536`
  Hedef: `stitch-cards.html` içindeki `Smart Home`, `Devices` ve `Tap-to-Run` sekmelerini mevcut gerçek seçim mantığını bozmadan daha ürün seviyesi bir seçme deneyimine taşımak.

## Uygulama Planı

- Önce ilgili Superdesign draft HTML çıktıları alınacak.
- Her draft yalnızca mevcut davranışı görsele taşıyacak; seçim mantığına ve gerçek veri akışına dokunulmayacak.
- `stitch-pair.html` içinde radar bölgesi, manuel katalog kabuğu ve kategori gezinmesi yeni tasarımla güncellenecek.
- `stitch-discover.html` içinde kart sunumu ve ilgili detay sayfalarına geçiş hissi iyileştirilecek.
- `stitch-cards.html` içinde kart görünümü, seçili durumlar ve sekme hiyerarşisi yenilenecek.
- Tüm bağlama işlemleri light ve dark tema birlikte kontrol edilerek tamamlanacak.
