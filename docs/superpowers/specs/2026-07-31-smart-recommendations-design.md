# NEXUS Akilli Oneriler ve AI Uygulama Akisi Tasarimi

## Hedef

`stitch-smart.html` icindeki `Akilli Uygulama` ve `Tikla ve Calistir` alanlarini daha urunlesmis hale getirmek:

- Oneri kartlari cihazlara gore degissin.
- Oneri kartina basinca tam sayfa detay ekrani acilsin.
- Ayni oneriden ister detay ekranina gidilsin, ister direkt AI sohbetine hazir prompt gonderilsin.
- `Create Yours` akisi `stitch-chat.html` icinde kullanici yazmadan hazir prompt ile baslasin.
- `Tikla ve Calistir` tabinin en altinda cihaz bazli `Onerilen` hizli aksiyonlari olsun.
- Otomasyon ve senaryo alanlarina basit filtreleme eklensin.
- Sayfalardaki AI input icindeki islevsiz sag ikon anlamli bir yone baglansin.

Bu is fazda tam cihaz kontrol UI'lari uretilmeyecek. Sadece mevcut veri modeliyle anlamli, hafif ve gercekci bir yonlendirme/otomasyon katmani kurulacak.

## Kapsam

Bu fazda yapilacaklar:

- Akilli oneriler veri modelinin tanimlanmasi
- Cihaza gore dinamik onerilerin secilmesi
- Oneri detay tam sayfasinin eklenmesi
- AI prompt gecis akisinin kurulmasi
- `Tikla ve Calistir` tabinda cihaz bazli onerilen hizli kartlar
- Otomasyon ve senaryolar icin basit filtre chip'leri
- AI input sag ikonunun `hazir komutlar` amaciyla islev kazanmasi

Bu fazda yapilmayacaklar:

- Tam cihaz kontrol panelleri
- Gelismis otomasyon editoru
- Gercek cihaz protokol entegrasyonlari
- Lovable ile tasarlanacak buyuk kapsamli premium sayfalar

## Urun Davranisi
## 1. Akilli Uygulama Onerileri

`Akilli Uygulama` tabinda varsayilan olarak 3 onerili kart gorunur. Ancak bu 3 kart artik sabit degil, mevcut cihaz tiplerine gore secilir.

Oneri secim mantigi:

- Isik veya lamba tipi cihaz varsa `Tum Ev Aydinlatma Kontrolu`
- Klima veya termostat varsa `Iklim Konfor Paneli`
- Kamera, sensor veya kilit varsa `Ev Guvenlik Merkezi`
- TV veya media cihazi varsa `Sinema ve Medya Modu`
- Priz veya enerji odakli cihazlar varsa `Enerji Tasarruf Merkezi`

Oneri siralamasi:

1. Kullanici cihazlariyla en cok eslesen oneriler
2. Kalan bosluklari NEXUS varsayilan oneri katalogundan tamamlayan kartlar
3. Toplam kart sayisi bu fazda 3 ile sinirli

Cihaz yoksa:

- Varsayilan 3 oneri gosterilir
- Ama `cihaza gore sekilleniyor` hissi verecek bos bir UX kurulmaz

## 2. Oneri Karti Etkilesimi

Her oneri kartinda iki giris noktasi olur:

- Kart govdesine dokunma: tam sayfa detay ekranina gider
- Kucuk ikincil aksiyon: direkt AI ile olusturma akisini baslatir

Boylece iki akis da desteklenir:

- Kesfet -> detay incele -> `Create Yours`
- Hizli davran -> direkt AI prompt gonder

## 3. Oneri Detay Sayfasi

Yeni bir tam sayfa detay ekran ailesi eklenecek. Bu ekran mantik olarak kullanicinin gonderdigi ornege benzer olur ama NEXUS gorsel diliyle daha iyi uygulanir.

Icerik yapisi:

- Ust bar: geri, baslik
- Buyuk hero gorseli
- Kisa `Introduction`
- Ozellik chip alanlari
- Alt sabit veya guclu bir `Create Yours` butonu

Bu ekranlar bu fazda tam cihaz kontrol sayfasi gibi davranmaz. Bunlar:

- ilham veren
- ne olusturulacagini aciklayan
- AI uretim akisina gecis yapan

urun tanitim/detay sayfalari olur.

## 4. Create Yours -> AI Sohbet Akisi

`Create Yours` basildiginda `stitch-chat.html` tam sayfa acilir ve kullanici yazmadan hazir prompt otomatik gonderilir.

Prompt kurallari:

- Secilen onerinin amacini acik ifade eder
- Kullanici cihaz tiplerini prompta ekler
- Varsa oda mantigini da kullanir
- UI veya otomasyon hedefini net soyler

Ornek prompt yapisi:

`Tum evi oda bazli kontrol eden bir akilli isik paneli olustur. Her oda icin ac/kapat, parlaklik ve renk sicakligi kontrolleri olsun. Hemen kullanilabilecek hizli yuzdeler ve tumunu ac/tumunu kapat aksiyonlari ekle.`

Chat sayfasinda bu mesaj:

- kullanici mesaji gibi degil
- AI olusturma istegi / hazir prompt karti gibi

gosterilebilir. Ama bu fazda mevcut chat mimarisini bozmadan en hafif entegrasyon tercih edilir.

## 5. Tikla ve Calistir Altinda Onerilen

`Tikla ve Calistir` tabinda mevcut kullanici senaryolarinin altina `Onerilen` bolumu eklenir.

Bu bolum:

- eklenmis cihazlara gore uretilecek
- tek tikla calisacak
- detayli cihaz kontrol gerektirmeyecek

hafif aksiyonlar sunar.

Ornekler:

- Isik varsa `Tum Isiklari Ac`, `Tum Isiklari Kapat`, `Aksam Ortami`
- Klima varsa `Konfor Modu`, `Serinlet`, `Eko Sicaklik`
- TV varsa `Film Baslat`, `Eglence Modu`
- Kamera/kilit varsa `Evden Ciktim`, `Guvenlik Kontrolu`

Bu kartlarin ilk faz davranisi:

- local state veya mevcut hafif veri modeli uzerinden islenir
- mumkun olan yerde kullaniciya durum mesaji/veri geri yazilir
- detayli cihaz sayfasi gerektiren senaryolarda sahte kontrol verilmez

## 6. Otomasyon ve Senaryo Filtreleri

Su an kullanicinin ekledigi otomasyon ve senaryolar filtrelenemiyor. Basit filtre chip sistemi eklenecek.

`Tikla ve Calistir` tabi filtreleri:

- Tumu
- Onerilen
- Benim Olusturduklarim
- Cihaz Bazli

`Otomasyon` tabi filtreleri:

- Tumu
- Aktif
- Onerilen
- Benim Olusturduklarim

Ilk fazda bu filtreler local veriye dayali calisir. Karma etiketleme gerektiren yerlerde veri modeline su alanlar eklenir:

- `source`: `system` veya `user`
- `category`: `lighting`, `climate`, `security`, `media`, `energy`
- `recommended`: boolean

## 7. AI Input Sag Ikonu

Sayfalardaki AI input icinde mikrofonun sagindaki ikon bosta duruyor. Bu fazda en mantikli kullanim:

- `Hazir Komutlar`
- `Akilli Fikirler`
- `Neler yapabilirim?`

amacli bir alt sheet veya mini panel acmasi.

Onerilen davranis:

- Ikona basinca kucuk bir alt sheet acilir
- Bu sheet'te 4-6 hazir prompt satiri olur
- Satira basinca ilgili chat sayfasi veya mevcut sayfa baglamina gore AI akisi baslar

Bu tercih:

- islevsiz ikon sorununu cozer
- sesli ozellik gelmeden anlamli bir ara cozum sunar
- kullaniciyi bos sayfaya atmaz

## Ekranlar

Yeni sayfalar:

- `stitch-smart-app-detail.html`
  - query param ile farkli oneri icerigi render eder
- Gerekirse:
  - `stitch-smart-app-create.html` yerine mevcut `stitch-chat.html` kullanilir
  - ayrica yeni create sayfasi acilmaz

Mevcut sayfalarda degisiklik:

- `stitch-smart.html`
- `stitch-chat.html`
- `data.js`
- gerekirse `theme.js` veya ortak UI yardimcilari

## Veri Tasarimi

Yeni lokal katalog:

- `window.NEXUS_SMART_APP_TEMPLATES`
- her kayit:
  - `id`
  - `title`
  - `subtitle`
  - `category`
  - `deviceTypes`
  - `heroImage`
  - `introduction`
  - `features`
  - `prompt`
  - `quickRunLabel`

Yeni yardimci fonksiyonlar:

- `getSmartDeviceProfile()`
- `getRecommendedSmartApps(limit)`
- `getRecommendedQuickRuns(limit)`
- `filterSmartItems(items, filterKey)`

Chat entegrasyonu icin:

- query string veya local transient state kullanilabilir
- onerilen yontem: query string + fallback localStorage

Ornek:

- `stitch-chat.html?promptId=whole-home-light-control`
- chat sayfasi acilinca katalogdan promptu okur ve otomatik yollar

## UX ve Gorsel Yakinlasim

Referans mantik korunur ama birebir kopya yapilmaz.

Gorsel hedef:

- daha temiz bosluk sistemi
- daha premium hero alanlari
- NEXUS mor/camgobegi aksanlari
- hem acik hem dark mod uyumu
- CTA'larda daha guclu hiyerarsi
- kartlarda daha net ikincil aksiyon alanlari

Detay sayfasi dili:

- sade
- premium
- urun demosu hissi veren
- ama mevcut uygulama yapisindan kopmayan

## Hata ve Bos Durumlar

- Cihaz yoksa varsayilan oneri 3'lusu gosterilir
- Ilgili kategoriye uygun cihaz yoksa o oneri secilmez
- Chat promptu bulunamazsa chat normal modda acilir
- Onerilen hizli calistir karti gercek aksiyon veremiyorsa kullaniciya sahte cihaz geri bildirimi verilmez
- Filtre sonucu bos ise ilgili bos durum gosterilir

## Test Kriterleri

- Cihaz tipine gore `Akilli Uygulama` oneri kartlari degisiyor mu
- Oneri kartina basinca detail sayfasi aciliyor mu
- Onerideki hizli AI aksiyon chat'e hazir prompt gonderiyor mu
- `Create Yours` chat ekranini hazir prompt ile aciyor mu
- `Tikla ve Calistir` altinda cihaz bazli oneriler dogru cikiyor mu
- Filtreler kullanici ve sistem itemlarini dogru ayiriyor mu
- Sag input ikonu bos durmuyor ve hazir komut sheet'i aciyor mu
- Acik/dark temada okunabilirlik korunuyor mu

## Uygulama Sirasi

1. Oneri veri modeli ve cihaz profili cikarimi
2. `stitch-smart.html` dinamik oneriler
3. Oneri detay sayfasi
4. Chat hazir prompt akisi
5. `Tikla ve Calistir` altinda onerilen bolumu
6. Filtre chip'leri
7. AI input sag ikon sheet'i

## Riskler

- Mevcut chat dosyasi buyuk; hazir prompt entegrasyonu dikkatli yapilmali
- `stitch-smart.html` su an statik ve kalabalik; parca parca refactor gerekebilir
- Cihaz tip tespiti isim tabanli fallback kullandigi icin bazi cihazlar yanlis kategorize olabilir

## Tavsiye

Bu fazda hedef:

- kullanicinin akilli cihaz ekledikce daha canli bir `Akilli` sayfasi gormesi
- AI uygulama fikrinin soyut degil, elle tutulur hale gelmesi
- tam cihaz kontrol UI'lari gelmeden once bile urun hissinin belirgin sekilde artmasi

Bu nedenle en dogru yaklasim:

- detay ekranlari `ilham + AI gecis`
- `Tikla ve Calistir` onerileri `hafif ve aninda`
- tam kontrol sistemleri ise sonraki faz
