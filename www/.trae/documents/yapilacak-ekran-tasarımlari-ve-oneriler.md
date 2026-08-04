# Yapılacak Ekran Tasarımları ve Öneriler

Bu belge, NEXUS mobil uygulamasındaki **mevcut sayfaların yönlendirmelerini düzenlemek**, **küçük tasarımsal düzeltmeler yapmak** ve **analiz raporunda belirtilen önerileri uygulamak** için bir rehber niteliğindedir. **Sıfırdan tasarım yapılmayacak**, yalnızca **mevcut tasarıma sadık kalınarak** iyileştirmeler gerçekleştirilecektir.

---

## **1. Cihaz Kontrol Panelleri**
### **Yapılacaklar**
- **Durum Göstergeleri İyileştirmesi**
  - Mevcut durum göstergelerine (yükleniyor, hata, çevrimdışı vb.) **animasyonlar ve renk geçişleri** ekleyerek **görsel hiyerarşiyi güçlendir**.
  - **Örnek**:
    - Yükleniyor: Dairesel bir yükleme animasyonu.
    - Hata: Kırmızı renkli bir uyarı ikonu ve titreşim efekti.
    - Çevrimdışı: Gri tonlarda bir bulut ikonu.

- **Gelişmiş Ayarlar Bölümü**
  - **Akordeon menü veya sekme tabanlı** bir yapıya dönüştürerek **erişilebilirliği artır**.
  - **Örnek**:
    - "Gelişmiş Ayarlar" butonuna tıklandığında **alt menü açılacak** ve **ayrıntılı kontroller** görünecek.

- **Favori Cihazlar ve Otomasyon Bağlantıları**
  - **Ana ekranda hızlı erişim** için **vurgula**.
  - **Örnek**:
    - Favori cihazlar, **ana ekranın üst kısmında** veya **ayrı bir "Favoriler" sekmesinde** gösterilebilir.
    - Otomasyon bağlantıları, **cihaz kontrol panellerinin altında** veya **ayrı bir "Otomasyonlar" sekmesinde** yer alabilir.

- **Performans İyileştirmeleri**
  - **WebSocket veya MQTT** kullanarak **gerçek zamanlı güncellemeleri hızlandır**.
  - **Çevrimdışı modda** cihaz durumlarının **yerel olarak saklanmasını** ve **bağlantı yeniden sağlandığında senkronize edilmesini** sağla.

- **Erişilebilirlik İyileştirmeleri**
  - **Büyük metin ve yüksek kontrast modu** ekle.
  - **Ekran okuyucu desteğini** tüm panellerde **tam olarak sağla**.

---

## **2. API Entegrasyonları**
### **Yapılacaklar**
- **Gerçek Zamanlı İletişim**
  - **WebSocket veya MQTT** kullanarak **cihaz kontrol komutlarının yanıt süresini kısalt**.

- **Hata Yönetimi İyileştirmeleri**
  - **Kullanıcıya net hata mesajları** sunarak **sorun giderme sürecini kolaylaştır**.
  - **Örnek**:
    - "Cihazla bağlantı kurulamadı. Lütfen cihazın açık olduğundan ve ağa bağlı olduğundan emin olun."

- **Güvenlik ve Gizlilik**
  - **Üçüncü taraf cihaz entegrasyonları** için **gizlilik politikalarını netleştir** ve **kullanıcı onayı** al.
  - **Uzaktan erişimi**, **ücretsiz kullanıcılar için sınırlı özelliklerle** sun.

---

## **3. Manuel Ekleme Sayfası**
### **Yapılacaklar**
- **Manuel Ekleme CTA Satırı**
  - **Görsel olarak vurgula** ve **kullanıcıların dikkatini çek**.
  - **Örnek**:
    - "QR bulunamadıysa **buraya tıklayarak** manuel ekleyin" şeklinde **renkli bir buton veya ikon** ekle.

- **Kurulum Kodu Giriş Alanı**
  - **Daha kullanıcı dostu** hale getir ve **hata yönetimini iyileştir**.
  - **Örnek**:
    - Giriş alanına **örnek bir kurulum kodu** (örn. "ABC123") yerleştir.
    - Hatalı girişlerde **net geri bildirim** sun (örn. "Geçersiz kod, lütfen tekrar deneyin.").

- **Cihaz Kataloğu**
  - **Arama ve filtreleme özellikleri** ekleyerek **kullanılabilirliği artır**.
  - **Örnek**:
    - Marka veya cihaz türüne göre **filtreleme seçenekleri** sun.
    - Popüler cihazları **ön plana çıkar**.

---

## **4. Görsel Eşleşmeler (Image Matching)**
### **Yapılacaklar**
- **Görsel Eşleşme Entegrasyonu**
  - **Cihaz ekleme sürecine entegre et** ve **kullanıcı dostu bir akış** sağla.
  - **Örnek**:
    - "Cihaz fotoğrafını çekin veya galeriden seçin" butonu ekle.
    - Görsel eşleşme başarılı olduğunda **onay mesajı** göster.

- **Hata Yönetimi**
  - **Kullanıcıya net geri bildirim** sun.
  - **Örnek**:
    - "Cihaz tanınamadı, lütfen tekrar deneyin veya manuel ekleyin."

---

## **5. Genel Kullanıcı Deneyimi (UX)**
### **Yapılacaklar**
- **Tasarım Tutarsızlıklarını Gider**
  - **Butonlar, ikonlar ve metinler** için **standart stil ve boyutlar** kullan.
  - **Boşluk ve hizalamayı** tüm ekranlarda **düzenli ve tutarlı** hale getir.

- **Navigasyon ve Akışları İyileştir**
  - **Ana ekranı** daha **sade ve kullanıcı dostu** hale getir.
  - **Cihaz ekleme sürecini** **adım adım rehberler ve görsel yardımlarla** destekle.

- **Performans İyileştirmeleri**
  - **Uygulama başlatma süresini** optimizasyonlarla kısalt.
  - **Cihaz kontrol komutlarını** **gerçek zamanlı** hale getir.

- **Erişilebilirlik İyileştirmeleri**
  - **Ekran okuyucu desteğini** tüm ekranlarda **tam olarak sağla**.
  - **Büyük metin ve yüksek kontrast modu** ekle.

- **Kişiselleştirme ve Özelleştirme**
  - Kullanıcıların **ana ekran düzenini sürükle-bırak** yöntemiyle **özelleştirebilmesini** sağla.
  - **Sık kullanılan cihazlar veya rutinleri**, **hızlı erişim için sabitleme** özelliği ekle.

---

## **6. Öncelikli Eylem Planı**
Aşağıdaki adımlar, **kısa vadede uygulanabilir** ve **yüksek etkili** iyileştirmeler sunmaktadır:

| **Öncelik** | **Yapılacak İş** | **Açıklama** |
|-------------|------------------|-------------|
| **Yüksek**  | Durum göstergelerine animasyonlar ekle | Mevcut durum göstergelerini daha görsel ve kullanıcı dostu hale getir. |
| **Yüksek**  | Gelişmiş ayarlar bölümünü akordeon menüye dönüştür | Erişilebilirliği artırarak kullanıcı deneyimini iyileştir. |
| **Yüksek**  | Manuel ekleme CTA satırını vurgula | Kullanıcıların dikkatini çekerek manuel ekleme sürecini kolaylaştır. |
| **Yüksek**  | WebSocket veya MQTT entegrasyonu | Gerçek zamanlı cihaz kontrolünü hızlandır. |
| **Orta**    | Favori cihazlar ve otomasyon bağlantıları için hızlı erişim ekle | Kullanıcıların sık kullandığı cihazlara ve otomasyonlara kolay erişim sağla. |
| **Orta**    | Erişilebilirlik ayarları ekle | Büyük metin, yüksek kontrast ve ekran okuyucu desteği sağla. |
| **Düşük**   | Görsel eşleşme özelliğini entegre et | Cihaz ekleme sürecini daha kullanıcı dostu hale getir. |

---

## **7. Uygulama Adımları**
1. **Mevcut sayfaların yönlendirmelerini düzenle**:
   - **`stitch-smart.html`**, **`stitch-skills.html`**, **`stitch-scenario-settings.html`**, **`stitch-siri-shortcuts.html`** ve **`stitch-smart-app-detail.html`** sayfalarındaki **yönlendirme ve veri akışlarını** iyileştir.
   - **Normalize edilmiş veri modelini** tüm sayfalarda kullanarak **referans sorunlarını gider**.

2. **Küçük tasarımsal düzeltmeler yap**:
   - **Durum göstergeleri**, **butonlar**, **ikonlar** ve **metinler** için **küçük görsel iyileştirmeler** uygula.
   - **Boşluk ve hizalama** sorunlarını düzelt.

3. **Öneri ve fikirleri uygula**:
   - **Analiz raporunda belirtilen önerileri** hayata geçirerek **kullanıcı deneyimini iyileştir**.

4. **Test ve doğrulama**:
   - **Tüm değişiklikleri test et** ve **kullanıcı deneyiminin sorunsuz çalıştığından emin ol**.

---

## **8. Referanslar**
- [Kontrol Paneli Planı](file:///c:/Users/ensar/Desktop/NEXUS-main/docs/kontrol-paneli-plani.md)
- [Eksik Ekranlar](file:///c:/Users/ensar/Desktop/NEXUS-main/docs/eksik-ekranlar.md)
- [Eksik Kalanlar](file:///c:/Users/ensar/Desktop/NEXUS-main/docs/eksik-kalanlar.md)
- [Mobile Service Orchestrator](file:///c:/Users/ensar/Desktop/NEXUS-main/packages/mobile/src/mobile-service.ts)
- [API İstemcisi](file:///c:/Users/ensar/Desktop/NEXUS-main/packages/client/src/api.ts)