# NEXUS Kontrol Paneli Plani

Bu dokuman, NEXUS mobil uygulamasinda hangi cihaz ve sistemler icin ayri kontrol panelleri olusturulacagini netlestirmek icin hazirlanmistir.

Amac, markaya ozel ekranlar yapmak yerine ayni ozellik grubuna sahip cihazlarin ortak bir kontrol panelini kullanmasidir. Boylece hem gelistirme hizi korunur hem de uygulama uzun vadede yonetilebilir kalir.

Bu plan tasarimdan bagimsizdir. Buradaki hedef, hangi panelin neden gerekli oldugunu, hangi ozellikleri icermesi gerektigini ve hangi veri yapisina dayanacagini belirlemektir.

## Temel Prensipler

- Her kontrol paneli gercek cihaz durumlariyla calismalidir.
- Sahte veri, gostermelik buton veya islevsiz kontrol bulunmamalidir.
- Ayni yetenekteki farkli markalar ortak panel yapisini kullanmalidir.
- Tum paneller acik tema ve koyu tema ile tam uyumlu olmalidir.
- Tum panellerde yukleniyor, baglaniyor, cevrimdisi, hata ve son senkron zamani durumlari bulunmalidir.
- Tum panellerde oda atamasi, cihaz adi, favori durumu ve otomasyon baglantilari gorunebilmelidir.
- Tum panellerde cihaz ozeti ile gelismis ayarlar ayri katmanlarda ele alinmalidir.

## Tasarim Yonlendirmesi

- Tum kontrol panelleri mevcut NEXUS tasarim diliyle uyumlu kalmalidir.
- Yeni kontrol panelleri mevcut ekranlardan daha premium ve daha teknik gorunmelidir.
- Gorunum dili oyuncak hissi vermemeli, muhendislik urunu hissi vermelidir.
- Ana kontrol alanlari net, guven veren ve yuksek okunurlukte olmalidir.
- Teknik veriler, telemetri kartlari ve durum etiketleri birincil arayuz parcasi gibi ele alinmalidir.
- Acik tema ve koyu tema icin ayni kalite seviyesi korunmalidir.
- Tasarimlar konsept degil, gercek cihaz kullanimi icin uygulanabilir olmalidir.
- Superdesign briefleri bu premium ve teknik yonlendirmeyi temel alarak hazirlanmalidir.

## Panel Katmanlari

Her kontrol paneli asagidaki ortak katman mantigini takip etmelidir.

- Hizli kontrol alani
- Durum ozeti alani
- Gelismis ayarlar alani
- Otomasyon ve senaryo baglantilari
- Gecmis, log veya son islem kaydi
- Cihaz bilgisi, baglanti tipi ve yazilim surumu

## 1. Aydinlatma Kontrol Panelleri

### 1.1 Temel Ac Kapat Isik Paneli

- Acik veya kapali durum
- Tek dokunusla ac kapat
- Parlaklik destegi varsa parlaklik cubugu
- Son kullanilan seviye bilgisi
- Zamanlama ve otomasyon baglantilari
- Oda bazli grup kontrolune gecis

### 1.2 Dimmer Paneli

- Ac kapat
- Parlaklik yuzdesi
- Hazir sahneler
- Kaydirma ile hizli seviye degisimi
- Son seviye hafizasi
- Gece modu kisayolu

### 1.3 Renkli Ampul Paneli

- Ac kapat
- Parlaklik
- Renk secici
- Sicak ve soguk ton gecisi
- Hazir atmosfer profilleri
- Muzik, film, uyku ve odak gibi hizli modlar

### 1.4 LED Serit ve Ortam Isigi Paneli

- Ac kapat
- Renk ve efekt secimi
- Alan bolgesi varsa bolgesel renk yonetimi
- Ekran yansitma destekleniyorsa acma kapama
- Ritim veya efekt hizi ayari
- Favori efekt kaydetme

### 1.5 Tavan, Masa, Panel ve Dis Mekan Isigi Paneli

- Ac kapat
- Parlaklik
- Renk sicakligi
- Enerji tuketimi bilgisi destekleniyorsa gosterim
- Gun dogumu ve gun batimi tetikleri
- Cihaz sagligi ve baglanti durumu

## 2. Priz ve Enerji Anahtari Panelleri

### 2.1 Akilli Priz Paneli

- Ac kapat
- Anlik guc tuketimi
- Gunluk ve aylik enerji ozeti
- Cihaza isim verme
- Cocuk kilidi veya guvenli mod
- Gecikmeli kapanma

### 2.2 Coklu Priz Paneli

- Her priz cikisi icin ayri ac kapat
- Toplam tuketim
- Kanal bazli tuketim varsa ayri gosterim
- Cizelgeli calisma
- Asiri yuk uyarisi
- Grup kapatma

### 2.3 Akilli Anahtar ve Rolesi Paneli

- Kanal bazli ac kapat
- Bagli fiziksel buton davranisi
- Ters lojik veya anahtar tipi ayari
- Enerji kesintisi sonrasi varsayilan durum
- Otomasyon baglantilari
- Guvenli kilitleme

## 3. Iklim ve Hava Kontrol Panelleri

### 3.1 Klima Paneli

- Ac kapat
- Sicaklik hedefi
- Mod secimi
- Fan hizi
- Kanat yonu
- Zamanlayici

### 3.2 Termostat Paneli

- Anlik sicaklik
- Hedef sicaklik
- Isitma veya sogutma durumu
- Programli calisma
- Evdeyim, disardayim ve uyku modlari
- Oda bazli bagli cihaz listesi

### 3.3 Hava Temizleyici Paneli

- Ac kapat
- Fan seviyesi
- Otomatik mod
- Hava kalitesi puani
- Filtre omru
- Sessiz mod

### 3.4 Nemlendirici ve Nem Alma Paneli

- Ac kapat
- Hedef nem seviyesi
- Anlik nem orani
- Su seviyesi veya hazne durumu
- Cocuk kilidi
- Gece sessiz modu

### 3.5 Fan, Hava Sirkulasyonu ve Isi Pompasi Paneli

- Ac kapat
- Kademe secimi
- Yon salinimi
- Mod secimi
- Program ayari
- Enerji ve calisma suresi ozeti

## 4. Guvenlik ve Kamera Panelleri

### 4.1 Ic ve Dis Mekan Kamera Paneli

- Canli goruntu
- Ses acma kapama
- Mikrofonla konusma
- Kayit baslatma veya izleme
- Bildirim hassasiyeti
- Hareket algilama bolgeleri

### 4.2 PTZ Kamera Paneli

- Canli goruntu
- Saga sola yukari asagi kontrol
- Yaklastirma
- Hazir pozisyon kaydi
- Takip modu
- Devriye rotasi

### 4.3 Kapi Zili Paneli

- Canli goruntu
- Zil gecmisi
- Cift yonlu ses
- Hizli yanitlar
- Kapida biri algilandi bildirimi
- Bagli kilidi acma kisayolu

### 4.4 Alarm ve Siren Paneli

- Alarm acik veya kapali
- Kismi kurulum ve tam kurulum
- Son tetikleme nedeni
- Siren test modu
- Yetkili kullanici listesi
- Sessize alma suresi

### 4.5 Duman, Gaz, Su Baskini ve Acil Durum Sensor Paneli

- Anlik guvenlik durumu
- Son alarm zamani
- Pil durumu
- Test kaydi
- Olay gecmisi
- Bagli otomasyonlar

## 5. Kapi, Kilit ve Erisim Panelleri

### 5.1 Akilli Kapi Kilidi Paneli

- Kilitli veya kilitsiz durum
- Tek dokunusla acma ve kilitleme
- Gecici erisim kodlari
- Kullanici bazli erisim gecmisi
- Otomatik kilitleme suresi
- Ev modu ile baglantili davranis

### 5.2 Garaj Kapisi ve Motorlu Gecis Paneli

- Acik, kapali veya hareket halinde durumu
- Ac kapa komutu
- Konum yuzdesi destekleniyorsa gosterim
- Engel algilama uyarisi
- Uzaktan onayli acma
- Gecis gecmisi

### 5.3 Giris Kontrol ve Turnike Paneli

- Acik veya kilitli durumu
- Yetki seviyesi
- Gecis loglari
- Anlik acma komutu
- Cihaz saglik durumu
- Ariza bildirimi

## 6. Sensor Kontrol ve Gozlem Panelleri

### 6.1 Hareket ve Varlik Sensor Paneli

- Son hareket zamani
- Hassasiyet seviyesi
- Bildirim acma kapama
- Otomasyon baglantisi
- Pil durumu
- Cihaz sinyal gucu

### 6.2 Sicaklik, Nem ve Cevre Sensor Paneli

- Anlik veriler
- Son 24 saat ve son 7 gun grafik
- Esik deger uyarilari
- Oda kiyaslamasi
- Veri yenilenme zamani
- Otomasyon tetikleyicileri

### 6.3 Hava Kalitesi ve Kimyasal Sensor Paneli

- PM, VOC, CO2 veya ilgili degerler
- Risk seviyesi
- Grafik gecmisi
- Onerilen aksiyon
- Alarm esikleri
- Bagli iklim cihazlariyla otomatik etki

### 6.4 Kapi, Pencere ve Titresim Sensor Paneli

- Acik kapali durumu
- Son acilma zamani
- Alarm baglantilari
- Pil durumu
- Sessiz saatler
- Olay kayitlari

## 7. Temizlik Cihazlari Kontrol Panelleri

### 7.1 Robot Supurge Paneli

- Harita goruntusu
- Baslat, duraklat ve standa don
- Oda secerek temizlik
- Guclu temizlik ve sessiz mod
- Sarj seviyesi
- Temizlik gecmisi

### 7.2 Cam Temizlik Robotu Paneli

- Baslat ve durdur
- Temizlik modu
- Kenar algilama durumu
- Pil veya enerji baglantisi
- Guvenlik uyarilari
- Gorev gecmisi

### 7.3 Genel Temizlik Cihazi Paneli

- Ac kapat
- Kademe secimi
- Parca veya filtre durumu
- Bakim uyarilari
- Planli calisma
- Hata kodu gosterimi

## 8. Mutfak ve Beyaz Esya Kontrol Panelleri

### 8.1 Buzdolabi Paneli

- Icindeki bolumler icin sicaklik
- Kapak acik kaldi uyarisi
- Hizli sogutma
- Tatil modu
- Filtre ve bakim bilgisi
- Enerji ozeti

### 8.2 Camasir ve Bulasik Makinesi Paneli

- Program secimi
- Kalan sure
- Baslat, duraklat ve iptal
- Uzaktan baslatma izni
- Hata kodlari
- Tuketim ozeti

### 8.3 Firin, Ocak ve Pisirme Cihazi Paneli

- Sicaklik kontrolu
- Program secimi
- Zamanlayici
- Guvenlik kilidi
- Pisirme bildirimleri
- Son kullanilan tarif veya mod

### 8.4 Kucuk Mutfak Cihazi Paneli

- Ac kapat
- Mod ve kademe secimi
- Kalan sure
- Hazir senaryolar
- Bakim uyarilari
- Guvenlik durumlari

## 9. Medya ve Eglence Kontrol Panelleri

### 9.1 Akilli TV Paneli

- Ac kapat
- Ses kontrolu
- Girdi secimi
- Kanal veya uygulama kisayollari
- Ortam modu
- Cihazlar arasi sahne tetikleri

### 9.2 Hoparlor ve Ses Sistemi Paneli

- Oynat, duraklat ve atla
- Ses seviyesi
- Oda secimi
- Grup calisma
- Kaynak secimi
- Sessize alma

### 9.3 Ekran Senkron ve Ambiyans Paneli

- Senkron ac kapat
- Bagli ekran secimi
- Isik tepkime hizi
- Renk yogunlugu
- Profil secimi
- Gece kisitlamasi

## 10. Ev Merkezi ve Baglanti Panelleri

### 10.1 Hub ve Gateway Paneli

- Cevrimici veya cevrimdisi durumu
- Bagli alt cihaz sayisi
- Son senkron zamani
- Firmware durumu
- Ag gucu
- Yeniden baslatma

### 10.2 Router ve Ag Gecidi Paneli

- Baglanti durumu
- Bagli cihaz sayisi
- Hiz ozeti
- Misafir agi
- Ebeveyn kontrolu baglantilari
- Yeniden baslatma

### 10.3 Enerji Merkezi Paneli

- Toplam tuketim
- Uretim varsa uretim miktari
- Kritik cihaz tuketimi
- Gunluk ve aylik karsilastirma
- Hedef bazli tasarruf takibi
- Enerji otomasyonlari

## 11. Dis Mekan, Bahce ve Tarim Panelleri

### 11.1 Sulama Paneli

- Bolge secimi
- Sulama baslatma ve durdurma
- Takvim olusturma
- Hava durumuna gore erteleme
- Nem sensor baglantisi
- Su tuketim ozeti

### 11.2 Dis Mekan Takip ve Kamera Paneli

- Canli goruntu veya son kare
- Hareket olaylari
- Gece modu durumu
- Pil veya gunes destegi durumu
- Alarm baglantilari
- Olay gecmisi

### 11.3 Tarim ve Cevre Sensor Paneli

- Toprak nemi
- Sicaklik
- Hava kalitesi veya basinc verileri
- Sulama tavsiyesi
- Esik uyarilari
- Uzun donem trend

## 12. Saglik, Yasam ve Kisisel Bakim Panelleri

### 12.1 Akilli Tarti ve Vucut Takip Paneli

- Son olcum
- Gecmis grafik
- Kullanici bazli veri ayrimi
- Hedef takibi
- Veri esitleme durumu
- Gizlilik secenekleri

### 12.2 Uyku ve Konfor Paneli

- Uyku durumu
- Oda sicakligi ve nemi
- Bagli senaryolar
- Beyaz gurultu veya dinlenme cihazlari
- Gece otomasyonlari
- Sabah rutini baglantisi

### 12.3 Kisisel Bakim Cihaz Paneli

- Ac kapat
- Mod secimi
- Kalan sure
- Bakim veya sarf malzeme bilgisi
- Son kullanim kaydi
- Guvenlik kilidi

## 13. Ortak Ayar ve Yonetim Ekranlari

Bu ekranlar cihaz tipinden bagimsiz olarak tum kontrol panellerine destek vermelidir.

- Cihaz bilgisi ve teknik detay ekrani
- Firmware guncelleme ekrani
- Oda ve ev atama ekrani
- Bildirim tercihleri ekrani
- Kullanici ve erisim yetkisi ekrani
- Otomasyon baglama ekrani
- Cihaz gecmisi ve log ekrani
- Sorun giderme ekrani

## Oncelik Sirasi

Ilk fazda olusturulmasi gereken paneller:

- Temel ac kapat isik paneli
- Dimmer paneli
- Renkli ampul paneli
- Akilli priz paneli
- Klima paneli
- Termostat paneli
- Ic ve dis mekan kamera paneli
- Akilli kapi kilidi paneli
- Hareket sensor paneli
- Robot supurge paneli

Ikinci fazda olusturulmasi gereken paneller:

- LED serit ve ortam isigi paneli
- Coklu priz paneli
- Hava temizleyici paneli
- Kapi zili paneli
- Duman, gaz ve su baskini paneli
- Buzdolabi paneli
- Camasir ve bulasik makinesi paneli
- Akilli TV paneli
- Hoparlor paneli
- Hub ve gateway paneli

Ucuncu fazda olusturulmasi gereken paneller:

- Sulama paneli
- Tarim ve cevre sensor paneli
- Kisisel bakim paneli
- Uyku ve konfor paneli
- Enerji merkezi paneli
- Ekran senkron ve ambiyans paneli
- Giris kontrol ve turnike paneli
- Ozel amacli diger cihaz panelleri

## Ilk Superdesign Uretim Sirasi

Superdesign ile ilk uretilecek kontrol paneli seti asagidaki cekirdek cihaz gruplari olmalidir:

- Aydinlatma kontrol paneli sistemi
- Akilli priz ve enerji anahtari paneli
- Klima ve termostat paneli
- Kamera ve kapi zili paneli
- Akilli kapi kilidi paneli
- Robot supurge paneli
- Hareket, sicaklik ve cevre sensor paneli

Bu ilk set onaylandiktan sonra ayni sistem dili su cihazlara genisletilmelidir:

- Hava temizleyici ve nem yonetimi panelleri
- Coklu priz ve role panelleri
- Alarm, duman, gaz ve su baskini panelleri
- Buzdolabi, camasir, bulasik ve firin panelleri
- Akilli TV, hoparlor ve ambiyans paneli
- Hub, gateway ve enerji merkezi paneli

## Teknik Hazirlik Gereksinimleri

- Her cihaz tipi icin ortak bir capability modeli tanimlanmali
- Kontrol panelleri capability bazli render edilmeli
- Her panelde command gonderme, durum okuma ve hata yakalama akisi ayni standarda baglanmali
- Gercek zamanli guncellemeler icin websocket veya benzeri olay akisi yapisi dusunulmeli
- Gecmis verisi gereken paneller icin zaman serisi veri modeli tanimlanmali
- Offline cihazlar icin okunur hata metinleri ve yeniden dene akisi bulunmali

## Cikis Hedefi

Bu plan tamamlandiginda uygulamada eksik ekran kalmamis olacak, geriye agirlikli olarak su basliklar kalacak:

- Dis kaynak API entegrasyonlari
- Gercek cihaz protokol baglantilari
- Marka veya platform bazli ozel adapter katmanlari
- Otomasyon motorunun derinlestirilmesi
- Gerekli yerlerde performans ve guvenlik sertlestirmesi


