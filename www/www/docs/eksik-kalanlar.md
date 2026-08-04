# NEXUS Mobil - Eksik Kalanlar ve API Olmadan Yapılabilecekler

Bu belge, akış olarak çalışan ama görsel kalite, bütünlük veya ürün hissi açısından hala tamamlanması gereken alanları listeler. API entegrasyonu olmadan da yapılabilecek düzeltmeler ve iyileştirmeler bu bölümde öne çıkmaktadır.

---

## ✅ Tamamlanan Düzeltmeler (Bu Oturum)

### 1. Temizlik ve Gereksiz Dosya Kaldırma
- ✅ `stitch-radar.html` - Sadece `stitch-pair.html`'e yönlendiren gereksiz dosya silindi
- ✅ Tüm referanslar temizlendi

### 2. UI/UX Düzeltmeleri
- ✅ `stitch-messages.html` - Aile ve Duyurular sekmelerine "Yakında geliyor" placeholder eklendi
- ✅ `stitch-program.html` - Day-pill'lara initial CSS state eklendi (`quickRepeat()` başlangıçta çağrılıyor)
- ✅ `stitch-plus.html` - Plan seçimi sayfa yüklenirken `nexusGetItem('nexusSelectedPlan')` ile persist ediliyor
- ✅ `stitch-home.html` - Çatışan `refreshDashboardSupplements` fonksiyon tanımı kaldırıldı (data.js'deki kullanılıyor)

### 3. Katalog Görsel Düzeltmeleri
- ✅ `stitch-integrations.html` - `inferCatalogImage()` fonksiyonunda dokunmatik switch tanımı multi-gang switch'lerden önceye taşındı
- ✅ Switch kategorileri için `item.img` kontrolü eklendi

---

## 📋 API Olmadan Yapılabilecek Diğer İşler

### Yüksek Öncelikli

#### CDN → Local Geçiş (En Kritik)
- ❌ **Tailwind CSS** - CDN yerine local build kullanılmalı
- ❌ **Google Fonts (Inter)** - Font dosyaları `www/` klasörüne kopyalanmalı
- ❌ **Lucide Icons** - Icon dosyaları local'e çekilmeli
- ❌ **Iconify** - Icon setleri local'e indirilmeli
- **Durum**: Offline çalışma için mutlaka gerekli. Capacitor uygulaması çevrimdışı çalışırken CDN'ler yüklenemez → uygulama tamamen bozuk görünür

#### Build Süreci Netleştirme
- ❌ `www/` klasörü build süreci otomatize edilmeli
- ❌ Manuel senkronizasyon yerine otomatik kopyalama scripti
- **Durum**: Şu an elle senkronize ediliyor

### Orta Öncelikli

#### Tasarım ve Görsel Tutarlılık
- ⚠️ Manuel cihaz ekleme ekranındaki cihaz resimleri ile isimleri tam uyumlu hale getirilmeli
- ⚠️ Cihaz katalogunda eşleştirmelerin yanlış görünmemesi için görsel validasyon
- ⚠️ Tüm sayfalarda NEXUS tasarım sistemine (renk, font, kart stili) uyum kontrolü

#### Kullanıcı Deneyimi
- ⚠️ Boş durum (empty state) mesajları standardize edilmeli
- ⚠️ Loading durumları için tutarlı spinner/placeholder kullanımı
- ⚠️ Hata mesajları daha kullanıcı dostu hale getirilmeli

---

## 🎯 Yayına Çıkmadan Önce Mutlaka Yapılması Gerekenler

### Kritik (❌ = Yapılmadı)

1. **❌ CDN → Local Dönüşümü Tamamlamak**
   - Tailwind CLI build ile local CSS oluşturmak
   - Font dosyalarını (Inter) www/ font klasörüne kopyalamak
   - Icon setlerini (Lucide, Iconify) local'e çekmek
   - Tüm HTML dosyalarında CDN referanslarını local path'lere çevirmek

2. **❌ www/ Build Sürecini Otomatize Etmek**
   - Geliştirme ortamında değişiklik yapıldığında otomatik senkronizasyon
   - Production build scripti oluşturmak
   - Version kontrolü ve cache busting mekanizması

### Tamamlananlar (✅)

3. ✅ Tüm `alert()` kullanımları kaldırıldı
4. ✅ Auth key uyumsuzluğu düzeltildi
5. ✅ 314 ürün görseli www/'ye taşındı

---

## 📝 Sayfa Bazlı Durum Analizi

### ✅ Çalışan ve Tamamlanan Sayfalar
- `stitch-home.html` - Ana ekran, kart gösterimi, favoriler
- `stitch-pair.html` - Cihaz ekleme merkezi
- `stitch-smart.html` - Akıllı cihazlar listesi
- `stitch-cards.html` - Kart ekleme ve yönetim
- `stitch-dnd.html` - Rahatsız Etme modu
- `stitch-energy.html` - Enerji tasarrufu
- `stitch-chat.html` - AI sohbet arayüzü
- `stitch-program.html` - Program ekleme (time picker)
- `stitch-plus.html` - Plus abonelik sayfası
- `stitch-messages.html` - Mesaj merkezi (Uyarılar çalışıyor)

### ⚠️ Kısmen Çalışan Sayfalar
- `stitch-integrations.html` - Entegrasyon katalogu (katalog görselleri çalışıyor)
- `stitch-discover.html` - Keşfet sayfası
- `stitch-settings.html` - Ayarlar
- `stitch-profile.html` - Profil yönetimi

### ❌ API Bağımlı Sayfalar (Offline Çalışmıyor)
- Tüm CDN bağımlılıklarını içeren sayfalar
- Gerçek zamanlı veri gerektiren sayfalar (hava durumu API, vb.)

---

## 🔧 Teknik Altyapı

### Mevcut Durum
- **Framework**: Vanilla JS + Tailwind CSS (CDN)
- **Storage**: localStorage tabanlı nexus* key'leri
- **State Management**: Basit localStorage usage
- **Routing**: Doğrudan HTML sayfaları arasında gezinme

### Geliştirme Önerileri
1. **State Persistence**: localStorage yerine IndexedDB'a geçiş
2. **Routing**: Hash-based routing veya History API
3. **Modularity**: Ortak fonksiyonları ayrı dosyalara bölebilme
4. **Error Handling**: Tutarlı hata yönetim sistemi

---

## 📊 Önceliklendirme Matrisi

| Öncelik | Alan | Durum | Tahmini Süre |
|---------|------|-------|--------------|
| 🔴 Kritik | CDN → Local | ❌ Yapılmadı | 4-6 saat |
| 🔴 Kritik | Build Süreci | ❌ Yapılmadı | 2-3 saat |
| 🟡 Orta | Manuel Cihaz Görselleri | ⚠️ Kısmen | 2-4 saat |
| 🟡 Orta | Empty State Standartizasyon | ⚠️ Kısmen | 1-2 saat |
| 🟢 Düşük | Tasarım Polish | ✅ Tamam | Devam eden |

---

*Son Güncelleme: 04 Ağustos 2026*
