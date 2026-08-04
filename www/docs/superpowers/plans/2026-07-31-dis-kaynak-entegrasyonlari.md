# Dis Kaynak Entegrasyonlari Plani

Tarih: 2026-07-31
Durum: Plan hazir
Kapsam: NEXUS mobil uygulamasinda cihaz yonetimi, yapay zeka, davet akislari, bildirimler, canli veri ve yayin hazirligi icin gerekli dis servisleri netlestirmek

## Hedef

Kontrol panelleri ve uygulama ici ana akislari tamamlandiginda, urunun gercek hayata baglanmasi icin gereken tum servis katmanlarini siralamak. Bu plan tamamlandiginda ekip hangi API'lerin alinacagini, hangi sirayla entegre edilecegini ve her entegrasyonun uygulamada hangi ekrani ya da ozelligi besleyecegini net olarak gorecek.

## Cikis Kriteri

- Yapay zeka, cihaz, bildirim, kimlik, davet, medya ve analiz katmanlari icin hangi servislerin zorunlu oldugu netlesmis olacak.
- Her entegrasyon icin kullanim amaci, uygulamadaki baglandigi alan ve teknik notlar hazir olacak.
- MVP icin zorunlu entegrasyonlar ile ikinci faz entegrasyonlar ayrilmis olacak.

## Oncelik Sirasi

### 1. Gemini Live API

Amac:
- Kullanicinin hem sesli hem metin olarak yapay zeka ile insan gibi akis halinde konusabilmesi
- Canli komut, soru-cevap, cihaz yonlendirme ve akilli sahne olusturma akisini desteklemek

Uygulamada baglanacagi yerler:
- Tam ekran yapay zeka sohbet sayfasi
- Mikrofon ile canli konusma akisi
- Akilli uygulama olusturma ve otomasyon yardimcisi
- SSS ve geri bildirim alanlarinda tam ekran AI yardimi
- Kontrol paneli uzerinden baglamsal yardim

Teknik gereksinimler:
- Streaming ses girisi
- Streaming ses cikisi
- Gercek zamanli metin cikti guncellemesi
- Oturum durumu ve konusma gecmisi yonetimi
- Araca/aksiyona donusturulecek komutlar icin function-calling veya tool bridge katmani

Notlar:
- Bu entegrasyon ana AI omurgasi olacak.
- Sesli komut ile cihaz aksiyonu arasina izin, dogrulama ve audit log katmani eklenmeli.
- Gecikme, baglanti kopmasi ve sessiz ortamlarda fallback olarak metin moduna donus olmalı.

### 2. Kimlik Dogrulama ve Kullanici Hesap Servisi

Amac:
- Kullanicilarin guvenli giris yapmasi
- Oturum yonetimi
- Ev, uye, rol ve cihaz yetkilerinin hesap bazli tutulmasi

Uygulamada baglanacagi yerler:
- Kayit / giris akislari
- Sifre sifirlama
- Ev uyelik sistemi
- Uye davet kabul akisi
- Rol ve izin yonetimi

Onerilen kapsam:
- Email + sifre
- Sosyal giris opsiyonlari gerekiyorsa ikinci faz
- Refresh token, cihaz bazli oturum takibi, session revoke

### 3. Email / Davet / Iletisim Servisi

Amac:
- Eve uye davet etme
- Dogrulama email'i
- Sifre sifirlama
- Guvenlik ve sistem bildirimleri

Uygulamada baglanacagi yerler:
- Eve uye ekle
- Davet kodu / davet linki
- Hesap dogrulama
- Destek ve geri bildirim teyit mailleri

Notlar:
- Davet kabul edilmeden kullanici eve eklenmemeli.
- Davet linki, davet kodu ve son kullanim tarihi desteklenmeli.

### 4. Push Notification Altyapisi

Amac:
- Alarm, guvenlik, otomasyon, cihaz durumu ve davet bildirimlerini anlik iletmek

Uygulamada baglanacagi yerler:
- Guvenlik ve sensor alarmlari
- Otomasyon tamamlandi / basarisiz oldu bildirimleri
- Ev uyelik daveti
- Cihaz baglandi / koptu / pil dusuk uyari akislari

Teknik notlar:
- iOS push altyapisi
- Sessiz push ile arka plan veri yenileme
- Bildirim kategorileri ve deep-link yonlendirmeleri

### 5. Gercek Zamanli Olay ve Senkronizasyon Katmani

Amac:
- Uygulamadaki cihaz durumlarinin, otomasyonlarin ve ev verilerinin anlik guncellenmesi

Uygulamada baglanacagi yerler:
- Anasayfa kartlari
- Kontrol panelleri
- Cihaz detaylari
- Uye ve yetki guncellemeleri
- Otomasyon calisma durumu

Teknik notlar:
- WebSocket veya SSE tabanli olay akisi
- Offline / reconnect stratejisi
- Event ordering ve optimistic UI rollback destegi

### 6. Hava Durumu ve Cevresel Veri API'si

Amac:
- Hava durumu kartlarini ve hava temelli otomasyonlari gercek veri ile beslemek

Uygulamada baglanacagi yerler:
- Hava durumu karti
- Akilli oneriler
- Sicaklik / nem / dis ortam bazli otomasyonlar

Notlar:
- Lokasyon verisi ile baglanmali
- Saatlik ve gunluk tahmin desteklenmeli
- Sehir bazli fallback olmali

### 7. Konum, Harita ve Geocoding Servisi

Amac:
- Ev konumunu otomatik algilamak
- Adres, konum ve bolgesel otomasyon senaryolarini desteklemek

Uygulamada baglanacagi yerler:
- Ev konumu ayari
- Hava durumu
- Eve gelince / evden cikinca otomasyonlari
- Birden fazla ev / mekan yonetimi

Notlar:
- Kullanici isterse manuel duzeltme yapabilmeli
- Reverse geocoding ile okunabilir adres tutulmali

### 8. Cihaz Bulutu ve Akilli Ev Platformu Entegrasyonlari

Amac:
- Marka ve ekosistem fark etmeksizin gercek cihazlari baglamak

MVP icin onerilen entegrasyon aileleri:
- Matter
- MQTT
- Home Assistant bridge
- Tuya / Smart Life cloud
- SmartThings

Ikinci fazda dusunulebilecekler:
- Zigbee gateway bridge
- Z-Wave bridge
- Shelly
- Tapo / Kasa
- SwitchBot
- Aqara bridge

Uygulamada baglanacagi yerler:
- Cihaz ekleme
- Manuel ekleme
- QR ile baglama
- Kontrol panelleri
- Otomasyon motoru

Notlar:
- Marka bazli kontrol paneli degil, capability bazli soyutlama kullanilmali.
- Ornek: tum dimmer cihazlar ayni kontrol paneline baglanmali.

### 9. Medya, Dosya ve Guvenli Depolama Katmani

Amac:
- Kamera snapshot'lari
- Kullanici profil gorselleri
- AI veya cihazdan gelen medya dosyalari
- Log export ve tanisal dosyalar

Uygulamada baglanacagi yerler:
- Kamera akislari
- Gecmis kayitlar
- Destek / hata raporu ekleri
- Ev ve profil gorselleri

Notlar:
- Signed URL ve erisim suresi yonetimi olmali
- Hassas medya icin rol bazli erisim gerekir

### 10. Analitik, Hata Takibi ve Crash Reporting

Amac:
- Gercek kullanim verisini izlemek
- Hata ve performans problemlerini yayin sonrasi hizli yakalamak

Uygulamada baglanacagi yerler:
- Tum ekranlar
- AI akislari
- Cihaz ekleme akisi
- Kontrol paneli kullanim olaylari

Toplanmasi gereken ana sinyaller:
- Cihaz ekleme basari / hata orani
- Kontrol paneli kullanim yogunlugu
- Otomasyon basari / iptal / hata olaylari
- AI sohbet terk oranlari
- Kamera ve sensor alarm akislarindaki hata noktalar

### 11. Abonelik / Odeme Altyapisi

Amac:
- Premium AI, gelismis otomasyon, bulut kayit, coklu ev, sinirsiz kamera gibi ucretli paketlerin yonetimi

Uygulamada baglanacagi yerler:
- Premium ekranlari
- Satin alma akislari
- Kredi / kota mantigi varsa AI kullanim alanlari

Notlar:
- Eger ilk yayinda monetization varsa MVP zorunlu olur.
- Yoksa ikinci faza alinabilir.

### 12. Ses, Konusma ve Medya Yardimci Katmani

Amac:
- Gemini Live ana motor olsa bile cihaz seviyesinde ses kaydi, yanki azaltma, arka plan mikrofon yonetimi ve iOS medya oturumu tarafini saglamlastirmak

Uygulamada baglanacagi yerler:
- Mikrofon akisi
- Canli konusma
- Hoparlor / kulaklik gecisi
- Kesinti sonrasi oturum devam ettirme

Notlar:
- Bu madde ayri bir AI degil, ses deneyimini urun kalitesine uygun hale getiren yardimci katmandir.

### 13. Yerel Cihaz Ozellikleri Kosesi

Amac:
- Kamera, el feneri, mikrofon, bildirim, konum ve arka plan izinlerini gercek cihaz davranisina gore yonetmek

Uygulamada baglanacagi yerler:
- QR tarama
- Kurulum kodu girme
- Canli AI konusma
- Konum bazli otomasyonlar

Notlar:
- Dis API gibi gorunmese de gercek urun hissi icin zorunlu katmandir.
- Kamera ve torch davranisi simulasyon degil, gercek izin ve donanim akislari ile calismali.

## Fazlara Gore Gruplama

### Faz 1 - Yayina cikis icin zorunlu

- Gemini Live API
- Kimlik dogrulama ve kullanici hesap servisi
- Email / davet servisi
- Push notification altyapisi
- Gercek zamanli olay ve senkronizasyon katmani
- Hava durumu API'si
- Konum / geocoding servisi
- En az bir cihaz bulutu veya akilli ev bridge katmani
- Yerel cihaz ozellikleri kosesi
- Analitik ve hata takibi

### Faz 2 - Urunu guclendiren katmanlar

- Medya ve guvenli depolama
- Odeme / abonelik
- Ek cihaz platformlari
- Gelismis ses ve medya yardimci katmani

### Faz 3 - Olceklenme ve ileri seviye

- Coklu cihaz ekosistemi adapter katmani
- Gelismis enerji servisleri
- Marka ozel cloud adapter'lari
- Uzun sureli kamera kayit ve olay arsivi

## Ekran ve Ozellik Baglantisi Ozeti

### Yapay zeka tarafini besleyecekler

- Gemini Live API
- Kimlik dogrulama
- Gercek zamanli olay katmani
- Analitik

### Ev ve uye yonetimini besleyecekler

- Kimlik dogrulama
- Email / davet servisi
- Push notification
- Konum servisi

### Cihaz ekleme ve kontrol tarafini besleyecekler

- Cihaz bulutu / protokol adapter'lari
- Kamera / torch / mikrofon izinleri
- Gercek zamanli olay katmani
- Medya depolama

### Kartlar ve canli veri tarafini besleyecekler

- Hava durumu API'si
- Konum servisi
- Gercek zamanli olay katmani

## Kritik Mimari Kararlar

### 1. Capability-first cihaz modeli

Markaya gore degil, cihazin yetenegine gore kontrol ve otomasyon akisi kurulacak.

Ornek capability gruplari:
- ac / kapa
- parlaklik
- renk sicakligi
- rgb renk
- sicaklik ayari
- fan hizi
- kamera izleme
- kilit ac / kapa
- enerji tuketimi
- sensor veri akisi

### 2. Tek AI girisi, coklu islev ciktisi

Gemini Live tek sohbet ve ses deneyimini yonetecek; ancak arka tarafta:
- cihaz kontrolu
- otomasyon olusturma
- yardim / destek
- ozetleme
- bildirim aciklama
gibi farkli amaclara yonlendirilecek.

### 3. Davet kabul edilmeden uye ekleme yok

Ev uyelik sistemi her zaman:
- davet olustur
- email veya kod gonder
- kullanici kabul etsin
- sonra eve rol ile eklensin
mantiginda calismali.

## Sonuc

Bu plan uygulandiginda kontrol panelleri tek basina guzel gorunen ekranlar olmaktan cikip gercek veri ve gercek cihaz davranisi ile calisan urun modullerine donusecek.

Kontrol paneli plani tamamlandiktan sonra ana teknik is yukunun buyuk kismi bu dosyadaki entegrasyonlara kayacak. Bu entegrasyonlar da tamamlandiginda geriye agirlikli olarak:
- cihaz bazli ince adapter farklari
- otomasyon mantigini derinlestirme
- performans sertlestirme
- guvenlik sertlestirme
kalacak.
