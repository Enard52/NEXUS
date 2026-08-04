# Mobil Smart Akis Duzeltme Plani

## Summary

Bu plan, mobil uygulamadaki `Akilli` akisi icinde kullanilan mevcut ekranlari sifirdan tasarlamadan toparlamayi hedefler. Odak; `stitch-smart.html` icindeki senaryo kartlari, `Tikla ve Calistir`, `Otomasyon`, `Siri'ye Ekle` yerlesimi ve kullanicinin olusturdugu kartlara basinca acilan detay sayfalarindaki referans ve butunluk sorunlarini gidermektir.

Plan bilerek su alanlari kapsam disi birakir:

- API ile calisan ozellikleri aktif hale getirme
- Yeni entegrasyon veya servis baglama
- Cihazlar icin detayli kontrol paneli tasarlama
- Tasarim dilini buyuk capta degistirme

Yaklasim, mevcut tasarimci cikislarini koruyup sadece kirik veri akislarini, kayip script referanslarini ve kucuk yerlesim problemlerini duzeltmektir.

## Current State Analysis

### Kaynak ve paketleme yapisi

- Mobil uygulamanin asil kaynak ekranlari repo kokundeki `stitch-*.html` dosyalaridir.
- `mobile-app/scripts/build-web.mjs`, kokteki `stitch-*.html` sayfalarini `mobile-app/www` altina kopyalayarak mobil kabugu besler.
- Ayni script su an yalnizca `theme.js`, `data.js` ve `ai-fab.js` dosyalarini kopyaliyor.
- Fakat bircok sayfa `auth.js`, `sheet-gestures.js` ve `smart-scene-page.js` scriptlerine de bagimli; sonraki mobil paketlemede bu dosyalar eksik kalirsa kirik referans uretme riski var.

### Smart akisindaki mevcut sorunlar

- `stitch-smart.html`, olusturulan `Tikla ve Calistir` ve `Otomasyon` kartlarini `nexusCustomClickRun` ve `nexusCustomAutomations` uzerinden render ediyor.
- Bu kartlar `stitch-skills.html` ve `stitch-smart-app-detail.html` tarafindan local storage'a ekleniyor; ancak eklenen nesnelerde tutarli bir `id`, `type`, `source` ve detay sayfasinin kullanabilecegi zengin baglam her zaman yok.
- `stitch-smart.html` icindeki kart tiklamalari `stitch-scenario-settings.html` sayfasina gidiyor ama bu sayfa su an sabit placeholder metinler, kismi Ingilizce etiketler ve baglamsiz cihaz verisi (`Quick Feed`) kullaniyor.
- `stitch-siri-shortcuts.html` mevcut `Tikla ve Calistir` verisini okuyabiliyor ancak sayfa yapisi cok temel ve `Siri'ye Ekle` butonunun asil giris noktasi `stitch-smart.html` icinde alt nav/profile alani uzerine bindirilmis durumda.
- `stitch-smart.html` icindeki `Siri'ye Ekle` butonu su an profil nav item'i ustune mutlak konumla bindiriliyor; bu hem gorunus hem de dokunma alani acisindan zayif.
- `stitch-skills.html` icinde bozuk karakterler bulunan metinler var; bu dosya ayni zamanda kart olusturma akisinda veri modelini besledigi icin hem metin hem veri tarafinda iyilestirme gerekiyor.

### Hazirda kullanilabilecek mevcut sayfalar

- `stitch-smart-app-detail.html` zaten `data.js` icindeki `NEXUS_SMART_APP_TEMPLATES` ve `getSmartPromptById()` ile iliskili bir tam sayfa detay yapisina sahip.
- `stitch-scenario-settings.html` tamamen sifirdan atilmak zorunda degil; mevcut iskelet korunup kullanici olusturdugu kartin turune gore anlamli detay gosteren ortak detay sayfasina donusturulebilir.
- `stitch-siri-shortcuts.html` da mevcut yapisi korunarak daha duzgun bir liste ve giris deneyimine cekilebilir.

## Proposed Changes

### 1. Mobil paketleme scriptini ortak bagimliliklarla uyumlu hale getir

**Dosya:** `mobile-app/scripts/build-web.mjs`

**Ne degisecek**

- Ortak script kopyalama listesi yalnizca `theme.js`, `data.js`, `ai-fab.js` ile sinirli kalmayacak.
- Repo kokundeki mevcut sayfalarin kullandigi ama mobil pakete duzenli alinmayan ortak JS dosyalari da kopyalanacak:
  - `auth.js`
  - `sheet-gestures.js`
  - `smart-scene-page.js`

**Neden**

- Smart akisinin disindaki sayfalarda bile mobil build sonrasi sessiz kirik referans olusmasi muhtemel.
- Senin yasadigin "referans hatalari"nin bir bolumu veri akisi kadar paketleme eksiginden de geliyor olabilir.

**Nasil**

- Script'teki ortak dosya listesi genisletilecek.
- Kopyalama mantigi mevcut sade yapi korunarak devam edecek; yeni build araci veya tasarim degisikligi olmayacak.

### 2. Smart akisinda kullanilan storage modelini normalize et

**Dosya:** `data.js`

**Ne degisecek**

- `Tikla ve Calistir` ve `Otomasyon` ogeleri icin ortak bir hafif veri modeli tanimlanacak.
- Yardimci fonksiyonlarla su alanlar standardize edilecek:
  - `id`
  - `type` (`clickrun` veya `automation`)
  - `title`
  - `desc`
  - `icon`
  - `bgClass`
  - `colorClass`
  - `source` (`user` veya `system`)
  - `category`
  - `recommended`
  - mumkunse `createdAt`
- Var olan kayitlar icin geriye donuk uyum korunacak; eksik alanlar render aninda veya migration benzeri hafif normalize adimiyla tamamlanacak.
- Kullanici olusturdugu karti `id` veya query param ile bulmayi kolaylastiran helper'lar eklenecek.

**Neden**

- Su an kartlar aciliyor ama detay sayfasina anlamli baglam tasimakta zayif kaliyor.
- `id` eksikligi veya tutarsiz nesne formati, detay sayfasi ve geri donus akislarinda referans kopukluguna neden oluyor.

**Nasil**

- `data.js` icinde saf, localStorage tabanli yardimci fonksiyonlar tanimlanacak.
- API baglantisi veya uzaktan veri cekme eklenmeyecek.
- `NEXUS_SMART_APP_TEMPLATES` ile var olan smart-oneri yapisi korunacak; sadece kullanici olusturdugu ogeler daha tutarli hale getirilecek.

### 3. Senaryo olusturma sayfasini mevcut tasarimi bozmadan veri acisindan dogru kayit uretir hale getir

**Dosya:** `stitch-skills.html`

**Ne degisecek**

- `addAutomation()` fonksiyonu storage'a yalnizca basit bir nesne push etmek yerine normalize edilmis veri kaydi olusturacak.
- `type=clickrun` ve `type=automation` ayrimi korunacak.
- Bozuk karakterli metinler duzeltilecek.
- Hizli olusturma listesi ve tetikleyici kartlari mevcut gorunumu korunarak daha tutarli metadata ile kayit uretecek.

**Neden**

- Bu sayfa hem `Tikla ve Calistir` hem `Otomasyon` olusturma akislarinin merkezi.
- Buradaki zayif veri kaydi tum sonraki sayfalara kirik baglam tasiyor.

**Nasil**

- Mevcut butonlar ve kart tasarimi korunacak.
- Kayit sirasinda gerekli alanlar eklenecek.
- Gecis yine `stitch-smart.html?tab=...` uzerinden kalacak.

### 4. Smart oneriden olusturma akisinda da ayni normalize modeli kullan

**Dosya:** `stitch-smart-app-detail.html`

**Ne degisecek**

- `Uygulamayi Olustur` aksiyonu local storage'a ekledigi otomasyon kaydini normalize edilmis ortak model uzerinden yazacak.
- Template bazli kayitlarda `source: user` veya uygun gorulen ayristirici alanla, hangi oneri/sablondan turetildigi izlenebilir hale getirilecek.
- Sayfa, mevcut hero + feature chip tasarimini koruyacak.

**Neden**

- Smart uygulama onerilerinden gelen otomasyonlar ile `stitch-skills.html` uzerinden olusturulan kayitlar ayni render akisini besliyor.
- Iki farkli kaynagin farkli sekilde nesne yazmasi tekrar referans hatasi uretir.

**Nasil**

- Detay sayfasi yeniden tasarlanmayacak.
- Yalnizca create aksiyonu ve gerekirse baslik/aciklama baglami daha saglam hale getirilecek.

### 5. Akilli ana ekranda kart render ve gecis mantigini toparla

**Dosya:** `stitch-smart.html`

**Ne degisecek**

- `renderCustomAutomations()` icindeki `Tikla ve Calistir` ve `Otomasyon` render akisi normalize veriyle uyumlu hale getirilecek.
- Kart tiklamalari, hangi ogenin acildigini guvenilir sekilde detay sayfasina tasiyacak.
- `Siri'ye Ekle` giris noktasi alt navigation/profil ustune bindirilmis halden cikarilacak.
- `Siri'ye Ekle` aksiyonu `Tikla ve Calistir` sekmesine bagli kalacak ama sayfa hiyerarsisine uygun bir yere alinacak:
  - tab ustu sag aksiyon
  - veya `Tikla ve Calistir` bolumu icindeki ayri bir chip/CTA satiri
- Kartlarda sadece kucuk layout polish yapilacak:
  - spacing
  - vurgu hiyerarsisi
  - dokunma alani

**Neden**

- Ana problem kullanicinin gordugu bozukluk burada ortaya cikiyor.
- Siri butonunun mevcut yeri hem goz yoruyor hem de nav mantigini bozuyor.
- Kartlarin tiklamasi calissa bile arka tarafta baglam zayif oldugu icin detay sayfasi anlamsiz kaliyor.

**Nasil**

- Tab yapisi ve genel sayfa duzeni korunacak.
- Alt nav ve genel renk dili bozulmayacak.
- Sadece mevcut komponent hiyerarsisi icinde, tasarimci cikisina sadik bir yeniden yerlestirme yapilacak.

### 6. Kullanici olusturdugu kartlar icin mevcut ayar sayfasini gercek detay sayfasina cevir

**Dosya:** `stitch-scenario-settings.html`

**Ne degisecek**

- Sayfa mevcut haliyle kalmayacak; sabit `Quick Feed`, `Show on Homepage`, `Show in Room` gibi baglamsiz ve kismi Ingilizce placeholder alanlar kaldirilacak veya baglama gore yeniden yazilacak.
- Sayfa, query param ve storage kaydi uzerinden ilgili kartin detayini yukleyecek.
- Tek ortak sayfa iki farkli moda hizmet edecek:
  - `clickrun` icin: hizli aksiyon detay/ozet sayfasi
  - `automation` icin: tetikleyici + hedef aksiyon ozeti olan detay sayfasi
- Icerik seviyesi API'siz ve hafif tutulacak:
  - kart basligi
  - aciklama
  - ikon/renk kimligi
  - kategori/nereden olusturuldugu
  - aktiflik veya gorunurluk gibi lokal ayarlar
  - gerekiyorsa `Siri'ye ekle`ye gecis veya `Tikla ve Calistir` ile iliskili baglanti
- Sayfa tasarimi mevcut rounded-card sistemine yakin tutulacak; sifirdan yeni bir stil dili yazilmayacak.

**Neden**

- Kullanici tarafinda "olusturulan kartlara tiklayinca ilgili detayli bir sayfa acilsin" beklentisi var.
- Bu ihtiyac zaten kismen olusturulmus bir sayfa ile karsilanabilir; asil problem onun ilgili veriyle beslenmemesi.

**Nasil**

- Sayfa bir "hafif detay + ayar" ekrani gibi davranacak.
- Gercek cihaz kontrol paneli taklidi yapilmayacak.
- API gerektiren toggle veya komutlar eklenmeyecek; yalnizca local state ve navigasyon seviyesinde davranilacak.

### 7. Siri kisayollari sayfasini mevcut akisla uyumlu hale getir

**Dosya:** `stitch-siri-shortcuts.html`

**Ne degisecek**

- Sayfa `nexusCustomClickRun` verisini normalize model uzerinden okuyacak.
- Bos durum, kart listesi ve tipografi `stitch-smart.html` ile daha tutarli hale getirilecek.
- Fiziksel Siri entegrasyonu eklenmeyecek; mevcut hafif davranis korunacak.
- Gerekirse secilen senaryonun basligina ve ikonuna gore daha ilgili bir onay/geri bildirim sunulacak.

**Neden**

- Senin ozellikle belirttigin gorunus ve konum sorununun bir parcasi da burada biten akis hissinin zayif olmasi.
- Mevcut sayfa zaten var; en dusuk riskli cozum bu sayfayi iyilestirip ana ekrandaki CTA'yi dogru yere tasimak.

**Nasil**

- Sayfa sifirdan yapilmayacak.
- Yalnizca spacing, liste satiri kalitesi ve veri uyumu iyilestirilecek.

## Assumptions & Decisions

- Kaynak dosya olarak repo kokundeki `stitch-*.html` dosyalari esas alinacak; `www/` ve `mobile-app/www/` turetilmis cikti kabul edilecek.
- Smart akisinin bu fazdaki odagi yerel veri, navigasyon ve gorunur butunluk olacak.
- API veya cihaza gercek komut gonderen davranis eklenmeyecek.
- Cihaz detay kontrol panelleri bu plana bilerek dahil edilmeyecek.
- Mevcut tasarim dili korunacak; yalnizca kucuk layout/polish duzeltmeleri yapilacak.
- Kart detaylari icin yeni bir ekran ailesi eklemek yerine var olan `stitch-scenario-settings.html` ve `stitch-smart-app-detail.html` yeniden kullanilacak.
- `stitch-smart.html` icindeki smart-oneri alani ile kullanici olusturdugu senaryo/otomasyon alani farkli kalsin; ancak veri modeli ve gecis mantigi olabildigince ortaklastirilsin.

## Verification Steps

### Statik dogrulama

- `stitch-smart.html`, `stitch-skills.html`, `stitch-scenario-settings.html`, `stitch-siri-shortcuts.html`, `stitch-smart-app-detail.html`, `data.js` ve `mobile-app/scripts/build-web.mjs` icindeki degisiklikler birbiriyle tutarli okunacak.
- Yeni veri alanlarinin mevcut localStorage verisi yoksa da sayfalari bozmadigi kontrol edilecek.

### Build dogrulamasi

- `mobile-app` icinde `npm run build:web` calistirilacak.
- Uretilen `mobile-app/www` altinda gerekli ortak scriptlerin kopyalandigi kontrol edilecek:
  - `auth.js`
  - `theme.js`
  - `data.js`
  - `ai-fab.js`
  - `sheet-gestures.js`
  - `smart-scene-page.js`

### Akis dogrulamasi

- `stitch-smart.html` acildiginda varsayilan tab ve diger tab gecisleri bozulmamis olmali.
- `Tikla ve Calistir` sekmesinde `Siri'ye Ekle` CTA'si yeni yerinde tasarimi bozmadan gorunmeli.
- `stitch-skills.html?type=clickrun` uzerinden eklenen kart `Tikla ve Calistir` listesinde gorunmeli.
- `stitch-skills.html?type=automation` uzerinden eklenen kart `Otomasyon` listesinde gorunmeli.
- Olusturulan kartlara dokununca `stitch-scenario-settings.html` ilgili kart baglamiyla acilmali.
- `stitch-smart-app-detail.html` uzerinden olusturulan akilli uygulama `Otomasyon` listesine dogru veriyle donmeli.
- `stitch-siri-shortcuts.html` sayfasi mevcut `Tikla ve Calistir` senaryolarini listelemeli ve bos durumda kirilmamali.

### Risk kontrolu

- Tasarimda buyuk yapisal sapma olmamali.
- API baglantisi bekleyen alanlar dummy davranisla "calisiyor gibi" gosterilmemeli.
- Geriye donuk kayitlar `id` veya metadata eksik olsa da en azindan okunabilir ve acilabilir kalmali.
