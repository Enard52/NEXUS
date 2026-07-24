# NEXUS AI — Geliştirme Faz Planı (Agent Yol Haritası) — v3

> Bu doküman, "NEXUS AI Personal Operating System" spesifikasyonunun uçtan uca, sıralı ve test edilebilir fazlara bölünmüş halidir. Bir coding agent'a (Claude Code vb.) bu dosyayı verip fazları sırayla tamamlatacaksın.

## v3'te Neler Eklendi / Düzeltildi (Tam Denetim Notu)

Önceki versiyonda ürün _özellikleri_ iyi kapsanmıştı ama gerçek bir "bitmiş, satılabilir ürün" için zorunlu olan şu aşamalar eksikti veya yüzeyseldi. Bu sürümde eklendi:

- **Sesli Etkileşim Motoru** (uyandırma kelimesi/STT/TTS) — önceki versiyonda "kişiselleştirme" isim seçimi vardı ama bunu gerçekten çalıştıracak ses motoru ayrı bir faz olarak yoktu.
- **Hesap Sistemi ve Kimlik Doğrulama** — abonelik modelinin ön koşulu, ayrı faz olarak çıkarıldı.
- **Abonelik ve Gelir Modeli (Monetization)** — eskiden "Ticari Altyapı" içinde tek satırdı; şimdi fiyatlandırma katmanları, ödeme altyapısı, deneme süresi, iptal/yenileme, fatura/vergi, başarısız ödeme yönetimi, promosyon ve gelir metrikleriyle tam bir faz.
- **Kapsamlı Test, Güvenlik Denetimi ve QA** — her fazın kendi testi vardı ama uçtan uca entegrasyon testi, penetrasyon testi, yük testi hiç yoktu.
- **DevOps, Altyapı ve Production Deployment** — CI/CD, ölçeklenebilirlik, izleme/alerting, yedekleme ve felaket kurtarma hiç ele alınmamıştı.
- **Yasal ve Uyumluluk** — Kullanım Şartları, Gizlilik Politikası, KVKK/GDPR, ödeme için PCI-DSS uyumu hiç yoktu; abonelik satan bir ürün için zorunlu.
- **Onboarding, Müşteri Desteği ve Analitik** — yeni kullanıcı kurulum akışı ve destek sistemi eksikti.
- **Beta Test ve Yayına Alma** — "kod bitti" ile "gerçek kullanıcıya güvenle satılabilir" arasındaki köprü yoktu.

Bu ekler olmadan yol haritası "çalışan bir prototip" ile biterdi; "tamamen bitmiş, abonelik satan bir ürün" ile bitmezdi. Şimdi ikisi arasındaki fark kapatıldı.

## Kullanım Talimatı (Agent İçin)

1. Fazları **sırayla** uygula. Bir faz "Bitiş Kriteri"ni karşılamadan bir sonrakine geçme.
2. Her fazın sonunda çalışan, test edilmiş bir kod tabanı ve kısa "ne yapıldı / ne test edildi / hangi varsayımı yaptım" özeti üret.
3. Dosya yapısı: `NEXUS/core, ai, voice, memory, agents, devices, connectors, skills, security, database, interface, platform, i18n, design-system, billing, accounts, infra, legal, support, plugins`.
4. Her cihaz/servis entegrasyonu Universal Capability formatına uymalı; ajanlar marka adı bilmez.
5. Riskli işlemler ilk günden Security Engine'in risk seviyelerinden geçer.
6. Tüm metinler baştan i18n-ready yazılır.
7. Ödeme kartı bilgisi **hiçbir zaman** doğrudan NEXUS sunucusunda saklanmaz — her zaman PCI-DSS uyumlu bir ödeme sağlayıcısına (Stripe, Iyzico vb.) devredilir.
8. Gerçek bulut hesapları/cihazlar/ödeme sağlayıcıları bağlanmadan önce kullanıcıdan gerçek kimlik bilgisi iste; sahteyle "başarılı" gösterme.

---

## FAZ 0 — Proje Temelleri ve İskelet

- Dil/çatı seçimi (gerekçeli).
- Monorepo iskeleti (yukarıdaki klasörler).
- Config, secrets yönetimi, loglama, temel test altyapısı, CI iskeleti.

**Bitiş Kriteri:** Repo tek komutla ayağa kalkıyor; boş çalışan çekirdek servis log basıyor.

---

## FAZ 1 — Çekirdek Motor + Kişiselleştirme Temeli

- AI Adapter (soyut arayüz, tek sağlayıcıya bağlı geliştirme modu).
- NEXUS Core: niyet çıkarma → ajan seçimi → plan → sonuç takibi (mock ajanlarla).
- Kısa süreli hafıza + kullanıcı hafızası şeması iskeleti.
- Security Engine v0 (risk seviyesi enum'u + karar noktası).
- Kişiselleştirme: kullanıcı sisteme hangi isimle sesleneceğini ve sistemin ona nasıl hitap edeceğini (isim/lakap, ton, dil) seçer; merkezi `User Memory`'de tutulur.

**Bitiş Kriteri:** Kullanıcı isim/hitap/dil tercihini değiştirdiğinde tüm yanıtlar bunu anında yansıtıyor.

---

## FAZ 2 — Sesli Etkileşim Motoru (Uyandırma Kelimesi, STT, TTS)

**Amaç:** Faz 1'de seçilen özel ismin/uyandırma ifadesinin gerçekten sesle çalışması.

- Yerel (cihaz üzerinde) uyandırma kelimesi tespiti — kullanıcının seçtiği özel isim/ifade için model eğitilebilir veya fonetik eşleştirme kullanılabilir; agent en uygun yaklaşımı gerekçelendirsin.
- Speech-to-Text (STT) entegrasyonu, Text-to-Speech (TTS) entegrasyonu — seçilen dile göre (Faz 13 i18n ile bağlantılı).
- Gürültü/aksan toleransı testi, gecikme (latency) optimizasyonu.
- Ses profiliyle kullanıcı ayrımı (Faz 12 multi-user ile bağlantılı — "kimin konuştuğunu" ayırt etme).

**Bitiş Kriteri:** Kullanıcı, seçtiği özel isimle sisteme seslenip sesli yanıt alabiliyor; farklı aile üyeleri farklı seslerle ayırt edilebiliyor.

---

## FAZ 3 — PC Agent (İlk Platform: macOS)

- Uygulama kontrolü, dosya/klasör işlemleri, sistem kontrolü.
- Platform Abstraction Layer'ın ilk somutlaşması.
- "Çalışma modu" senaryosu uçtan uca; riskli aksiyonlarda onay.

**Bitiş Kriteri:** Gerçek Mac'te sesli/yazılı komutla senaryo çalışıyor; riskli aksiyonlar onay istiyor.

---

## FAZ 4 — Device Sistemi ve Geniş Marka/Protokol Desteği

- Universal Capability şeması + Device Manager.
- Sıralı connector'lar: Tuya → Philips Hue → Xiaomi/Mi Home → Samsung SmartThings → LG ThinQ → Google Home → Amazon Alexa → Apple HomeKit → yerel protokoller (Matter, Zigbee, MQTT, LAN/UPnP).
- Marka adı geçmediğini doğrulayan otomatik test.

**Bitiş Kriteri:** En az 5-6 marka/protokol çalışıyor; yeni marka eklenirken Core/Agent kodu değişmiyor.

---

## FAZ 5 — Skill Sistemi

- Deneyim hafızası, tekrar eden aksiyonların otomatik Skill'e dönüşmesi (kullanıcı onayıyla).

**Bitiş Kriteri:** Sistem tekrar eden ince ayarları Skill olarak önerip kaydediyor, sonraki isteklerde otomatik uyguluyor.

---

## FAZ 6 — Digital Twin ve Deneyim Hafızasının Derinleştirilmesi

- Ev/ortam ve kullanıcı durum modeli; Core'un plan üretirken bunu sorgulaması.

**Bitiş Kriteri:** Aynı niyet, farklı ortam durumunda tutarlı farklı planlar üretiyor.

---

## FAZ 7 — Multi-Agent Sistemi

- Home, PC, Life, Knowledge, Research, Learning, Finance, Security, Communication ajanları; mesajlaşma protokolü; kapsam bazlı yetkiler.

**Bitiş Kriteri:** En az 4 ajan gerçek işlev görüyor; istekler doğru ajan(lar)a yönlendirilip birleştiriliyor.

---

## FAZ 8 — Cross-Platform Masaüstü Desteği (Windows, Linux)

- Windows Agent (PowerShell/Windows API/UI Automation), Linux Agent (Shell/masaüstü API'leri).

**Bitiş Kriteri:** Aynı Core kodu, değişiklik yapılmadan Windows ve Linux'ta çalışıyor.

---

## FAZ 9 — Mobil Uygulamalar (iOS & Android)

- iOS/Android (native veya gerekçeli cross-platform).
- Masaüstüyle özellik paritesi: niyet, cihaz kontrolü, skill, hafıza/Digital Twin, sesli etkileşim (Faz 2).
- Uzaktan erişim, bildirimler, store gereksinimleri (gizlilik/izin ekranları).

**Bitiş Kriteri:** iOS ve Android'de masaüstündeki tüm temel senaryolar tam etkileşimle çalışıyor.

---

## FAZ 10 — Tasarım Sistemi ve Arayüz

- Marka kimliği, design token, tema/erişilebilirlik, çok dilli arayüz altyapısı.
- Ana ekranlar: Bugün özeti, Ev durumu, Öneriler, Skill yönetimi, Aile/izin ekranı, Cihaz listesi, Kişiselleştirme, **Abonelik/Faturalandırma ekranı** (Faz 15 ile bağlantılı).

**İndirme Merkezi Sayfası (web sitesi — Faz 18 backend'i ile bağlantılı):**

- Ziyaretçinin algılanan işletim sistemine (Faz 18 OS algılama servisi) göre **öne çıkan tek bir ana indirme butonu**; hemen altında "başka bir işletim sistemi mi kullanıyorsun?" başlığıyla diğer tüm seçeneklerin (Windows / macOS / Linux / iOS / Android) manuel de seçilebildiği bir liste.
- **Mobil linkler (App Store / Google Play) her zaman görünür ve erişilebilir kalır** — algılanan platform ne olursa olsun gizlenmez; yalnızca öne çıkan buton platforma göre değişir.
- Her indirme seçeneğinin yanında **sürüm numarası ve minimum sistem gereksinimi** (ör. "Windows 10 ve üzeri") görsel olarak gösterilir; bu değerler Faz 18'deki sürüm bilgisi API'sinden gelir (sitede hardcoded değildir).
- Her indirme seçeneğinin yanında ayrıca **checksum (SHA-256) değeri** görünür ve **kopyalanabilir** şekilde gösterilir; böylece kullanıcı indirdiği dosyanın bütünlüğünü doğrulayabilir.
- **Mobil ziyaretçiler için** indirme butonlarının **deep link** ile doğru çalıştığından emin olunur (tasarım tarafında buton davranışı test edilir; Faz 18'deki Universal Links / App Links altyapısıyla uyumlu, buton doğrudan mağaza uygulama sayfasına yönlendirir).
- Sayfa, ziyaretçinin **tarayıcı diline göre otomatik olarak doğru dilde** açılır (Faz 13 i18n altyapısıyla uyumlu).
- Sayfa, genel marka kimliği/design token sistemiyle **tam tutarlıdır** — ayrı bir tasarım dili kullanılmaz.

**Bitiş Kriteri:** Tutarlı tasarım masaüstü+mobilde uygulanmış; en az iki dilde sorunsuz; İndirme Merkezi ziyaretçinin OS'una göre doğru ana butonu öne çıkarıyor, tüm platform seçenekleri ile mobil mağaza linkleri her durumda erişilebilir kalıyor, her seçeneğin sürüm/sistem gereksinimi ve kopyalanabilir SHA-256 checksum değeri gösteriliyor, mobil butonlar deep link ile doğrudan mağaza sayfasına düşüyor ve sayfa tarayıcı diline göre açılıyor.

---

## FAZ 11 — Security Engine'in Tam Devreye Alınması

- Tüm aksiyonların tek middleware'den geçmesi, politika dosyası, onay akışları, değişmez loglama.

**Bitiş Kriteri:** Yüksek riskli hiçbir aksiyon onaysız gerçekleşmiyor; loglar denetlenebilir.

---

## FAZ 12 — Multi-User & Aile Sistemi

- Admin aile üyelerini davet edip cihaz bazlı yetki tanımlar (Admin/Aile Üyesi/Misafir).
- Paylaşılan Digital Twin senkron; her üye kendi kişiselleştirme/hitap tercihini bağımsız tanımlar.

**Bitiş Kriteri:** 3 yetki seviyesi gerçek cihazlarla test edilmiş; kişiselleştirme tercihleri doğru ayrışıyor.

---

## FAZ 13 — Uluslararasılaştırma (i18n / l10n)

- Çoklu dil (arayüz + AI yanıtları + STT/TTS), bölgesel cihaz ekosistemi önceliklendirmesi, tarih/saat/birim formatı, çok para birimi hazırlığı, veri saklama şeffaflığı.

**Bitiş Kriteri:** En az iki dilde tam işlevsel; dil/bölge değişince arayüz+ses tutarlı değişiyor.

---

## FAZ 14 — Hesap Sistemi ve Kimlik Doğrulama

**Amaç:** Abonelik modelinin zorunlu ön koşulu.

- Kayıt/giriş (e-posta, sosyal giriş opsiyonel), şifre sıfırlama, oturum yönetimi, cihaz eşleştirme.
- Rol/yetki modelinin (Faz 12) hesap sistemine bağlanması.
- Hesap silme / veri indirme (kullanıcının kendi verisini talep edip silebilmesi — Faz 19 Legal ile bağlantılı).

**Bitiş Kriteri:** Kullanıcı güvenli şekilde hesap açıp birden fazla cihazdan giriş yapabiliyor; hesabını ve verisini silebiliyor.

---

## FAZ 15 — Abonelik ve Gelir Modeli (Monetization)

**Amaç:** Kullanıcının ana talebi — abonelik satarak gelir sağlama. Bu fazın eksiksiz olması kritik.

**Yapılacaklar:**

- **Fiyatlandırma katmanları:** ör. Free (sınırlı cihaz sayısı/temel skill), Premium (sınırsız cihaz, tüm skill'ler, öncelikli hafıza), Family (Faz 12'deki çoklu kullanıcı/aile yönetimi tam erişim). Katman sınırları, hangi özelliklerin hangi planda olacağı net tanımlanır.
- **Ödeme altyapısı:** Stripe gibi uluslararası bir sağlayıcı (Faz 13 i18n ile uyumlu, çoklu para birimi/yerel ödeme yöntemleri — ör. Türkiye için Iyzico gibi yerel bir seçenek de değerlendirilir).
- **Abonelik yaşam döngüsü:** ücretsiz deneme süresi, otomatik yenileme, plan yükseltme/düşürme, kullanıcının kendi kendine iptal edebilmesi (self-service, gizli engel olmadan).
- **Fatura ve vergi:** ülkeye göre KDV/vergi hesaplama, otomatik fatura oluşturma ve kullanıcıya gönderme.
- **Başarısız ödeme yönetimi (dunning):** kart reddi durumunda kullanıcıyı bilgilendirme, nazik yeniden deneme, süre sonunda plan düşürme (aniden erişim kesmeden).
- **Promosyon ve büyüme araçları:** promosyon kodu, referans/tavsiye sistemi (opsiyonel ama gelir artırıcı).
- **Abonelik yönetim paneli:** kullanıcının kendi planını, fatura geçmişini, ödeme yöntemini görüp değiştirebildiği ekran (Faz 10 tasarımıyla entegre).
- **İç gelir metrikleri:** MRR, churn oranı, plan bazlı dağılım gibi temel SaaS metriklerini gösteren bir iç yönetim paneli (admin tool).
- **Güvenlik:** kart bilgisi asla NEXUS sunucusunda tutulmaz; PCI-DSS uyumu ödeme sağlayıcısına devredilir.

**Bitiş Kriteri:** Gerçek (veya sandbox) bir ödeme sağlayıcısıyla uçtan uca akış çalışıyor: kullanıcı plan seçip ödeme yapabiliyor, deneme süresi sonunda otomatik ücretlendiriliyor, istediği an iptal edebiliyor, fatura alıyor, ödeme başarısız olduğunda nazikçe yönetiliyor.

---

## FAZ 16 — Connector Mağazası ve Cloud Memory

- Yeni cihaz/servis entegrasyonlarının plugin olarak eklenip kaldırılabildiği mağaza (Faz 4'ün ötesine sürekli genişleme yolu).
- Kullanıcı hafızasının cihazlar arası senkron için buluta taşınması (Faz 22 Cross-Platform Sync'in ön koşulu).
- Mağazadaki bazı connector'ların premium plana (Faz 15) bağlı olması senaryosu.

**Bitiş Kriteri:** Kullanıcı mağazadan yeni bir connector kurup kullanabiliyor; hafızası cloud'da güvenli şekilde saklanıyor.

---

## FAZ 17 — Kapsamlı Test, Güvenlik Denetimi ve Kalite Güvencesi (QA)

**Amaç:** Faz bazlı testlerin ötesinde, uçtan uca "bitmiş ürün" güvencesi.

- **Entegrasyon testi:** tüm ajanlar, cihazlar, platformlar birlikte gerçek senaryolarla test edilir (ör. "Film izleyeceğim" — macOS + mobil + 3 farklı marka cihazla).
- **Yük testi:** çok sayıda eşzamanlı kullanıcı/cihaz altında performans.
- **Güvenlik denetimi / penetrasyon testi:** özellikle Security Engine, hesap sistemi, ödeme akışı ve cihaz connector'ları için bağımsız veya agent destekli pentest.
- **Erişilebilirlik testi:** Faz 10'daki tasarımın gerçekten erişilebilir olduğunun doğrulanması.
- **Regresyon test paketi:** her yeni faz/özellik eklendiğinde önceki fazların bozulmadığının otomatik doğrulanması.

**Bitiş Kriteri:** Kritik güvenlik açığı kalmıyor; belirlenen eşzamanlı kullanıcı/cihaz sayısı altında sistem kararlı; tüm ana senaryolar otomatik regresyon testleriyle korunuyor.

---

## FAZ 18 — DevOps, Altyapı ve Production Deployment

**Amaç:** Kod tabanının gerçek kullanıcılara güvenle sunulabilmesi.

- CI/CD hattı (otomatik test + otomatik dağıtım).
- Production altyapısı (bulut sağlayıcı seçimi, ölçeklenebilirlik, bölgesel dağıtım — Faz 13 i18n ile uyumlu).
- İzleme/alerting (uptime, hata oranı, gecikme).
- Yedekleme ve felaket kurtarma planı (kullanıcı hafızası/cloud memory kaybolmayacak şekilde).
- Sürüm yönetimi ve OTA (over-the-air) güncelleme stratejisi (masaüstü + mobil).

**İndirme ve Dağıtım Altyapısı (İndirme Merkezi'nin backend'i — Faz 10 ile bağlantılı):**

- **OS algılama servisi:** Gelen isteğin `User-Agent` bilgisinden ziyaretçinin işletim sistemini (Windows / macOS / Linux / iOS / Android) tahmin eden ve İndirme Merkezi'nin öne çıkan butonunu belirleyen backend servisi. Tahmin yanlış olsa bile kullanıcı manuel seçebildiği için hata toleranslıdır.
- **CDN dağıtımı:** Tüm masaüstü paketleri (`.exe`/`.msi`, `.dmg`/`.pkg`, `.AppImage`/`.deb`/`.rpm`) bir CDN üzerinden sunulur; hangi ülkeden indirilirse indirilsin indirme hızı düşmez.
- **Kod imzalama (teyit + açık gereklilik):** Windows paketleri **Authenticode**, macOS paketleri **Apple notarization** ile imzalıdır. Bu, güvenilir dağıtımın ön koşuludur ve bu fazın **zorunlu çıktısı** olarak açıkça belirtilir.
- **SHA-256 checksum:** Her masaüstü kurulum paketi (`.exe`/`.msi`, `.dmg`/`.pkg`, `.AppImage`/`.deb`/`.rpm`) için bir SHA-256 checksum üretilir ve "sürüm bilgisi" API'sinde ilgili dosyanın yanında yayınlanır; kullanıcı isterse indirdiği dosyanın bütünlüğünü doğrulayabilir.
- **Mobil akıllı yönlendirme (deep link):** iOS'ta **Universal Links**, Android'de **App Links** kurulur; telefondan siteye giren bir ziyaretçi "İndir" butonuna bastığında doğrudan mağazadaki uygulama sayfasına düşer, genel bir arama/mağaza arama sonucuna değil.
- **Sürüm bilgisi API'si:** Güncel sürüm numarası, platform bazlı minimum sistem gereksinimi (ör. "Windows 10 ve üzeri") ve her paketin SHA-256 checksum'ı backend'deki bir "sürüm bilgisi" endpoint'inden döner; site bu bilgiyi **hardcoded tutmaz**, her zaman API'den çeker.
- **Mağaza linki kontrol noktası:** App Store / Google Play linklerinin güncel ve doğru olduğunu doğrulayan bir kontrol noktası (CI adımı veya periyodik sağlık kontrolü); linkler bozulduğunda/değiştiğinde uyarı verir.

**Bitiş Kriteri:** Yeni bir sürüm tek komutla/otomatik hatla production'a çıkabiliyor; sistem kesintisi anında izleme uyarı veriyor; veri kaybı senaryosunda geri dönüş test edilmiş; masaüstü paketleri imzalı (Authenticode/notarization) şekilde CDN'den dağıtılıyor; her paketin SHA-256 checksum'ı üretilip sürüm bilgisi API'sinde yayınlanıyor; sürüm bilgisi API'si güncel sürüm ve sistem gereksinimini doğru döndürüyor; mobil deep link (Universal Links/App Links) kullanıcıyı doğrudan mağaza sayfasına düşürüyor; mağaza linki kontrol noktası aktif.

---

## FAZ 19 — Yasal ve Uyumluluk (Legal & Compliance)

**Amaç:** Abonelik satan, kişisel veri (ses, ev durumu, alışkanlık) işleyen bir ürün için zorunlu.

- Kullanım Şartları, Gizlilik Politikası, Çerez Politikası (varsa web) hazırlanır (agent taslak hazırlayabilir, nihai onay için hukuki danışman önerilir — agent hukuki tavsiye vermez, sadece taslak/yapı sunar).
- KVKK/GDPR gibi veri koruma gerekliliklerine uygun veri işleme kayıtları, kullanıcının verisini indirme/silme hakkının teknik olarak desteklenmesi (Faz 14 ile bağlantılı).
- Ödeme tarafında PCI-DSS uyumu (Faz 15 ile bağlantılı, sağlayıcı üzerinden).
- Ses kaydı/işleme için açık rıza akışı (özellikle sürekli dinleme özelliği varsa).

**Bitiş Kriteri:** Kullanım Şartları ve Gizlilik Politikası arayüzde erişilebilir; veri indirme/silme talepleri teknik olarak çalışıyor; hukuki taslaklar gerçek bir hukuk danışmanı onayına hazır durumda.

---

## FAZ 20 — Onboarding, Müşteri Desteği ve Ürün Analitiği

- İlk kurulum sihirbazı: hesap oluşturma → dil/hitap tercihi → ilk cihaz bağlama → ilk skill önerisi.
- Destek sistemi: SSS, destek talebi oluşturma, temel bir destek talebi takip mekanizması.
- Opt-in ürün analitiği ve hata (crash) raporlama — kişisel verilerden bağımsız, kullanım desenlerini anlamak için.

**Bitiş Kriteri:** Yeni bir kullanıcı hiçbir dış yardım almadan hesap açıp ilk cihazını bağlayıp ilk skill'i deneyimleyebiliyor; bir sorun yaşadığında destek talebi oluşturabiliyor.

---

## FAZ 21 — Beta Test ve Yayına Alma (Launch)

**Amaç:** "Kod bitti" ile "gerçek kullanıcıya satılabilir" arasındaki son köprü.

- Sınırlı sayıda gerçek kullanıcıyla kapalı beta (farklı marka/cihaz kombinasyonları, farklı diller, farklı aile yapıları test edilir).
- Beta geri bildirimlerine göre son düzeltmeler.
- App Store / Google Play başvuru ve onay süreci.
- Yayın sonrası ilk hafta için yakın izleme (Faz 18'deki monitoring ile).

**Bitiş Kriteri:** Uygulama mağazalarında yayında; gerçek ödeyen ilk kullanıcı kohortu sorunsuz şekilde abone olup ürünü kullanabiliyor.

---

## FAZ 22 — Cross-Platform Sync ve Sürüm Sonrası Büyüme (Tam Vizyon)

- Tek hesap altında masaüstü + mobil arasında tercih/hafıza/skill senkronizasyonu.
- Genişleme noktaları: TV, ek smart home hub'ları, yeni diller, yeni marka connector'ları (Faz 16 mağazası üzerinden sürekli).

**Bitiş Kriteri:** Kullanıcı bir platformda öğrettiği skill'i/tercihi başka cihazda anında buluyor; ürün sürüm sonrası büyümeye hazır bir altyapıya sahip.

---

## "Tamamen Bitmiş Proje" Tanımı (Definition of Done — v1.0)

Bu yol haritası uçtan uca uygulandığında, v1.0 şu koşulları karşılıyorsa **tamamen bitmiş** sayılır:

1. Faz 0-13: Tüm temel özellikler (çekirdek, ses, PC agent, cihazlar, skill, çoklu ajan, çoklu platform masaüstü+mobil, tasarım, güvenlik, aile, i18n) çalışıyor.
2. Faz 14-16: Hesap, abonelik/ödeme ve connector mağazası/cloud memory production'da gerçek para akışıyla çalışıyor.
3. Faz 17-19: Kapsamlı test/güvenlik denetimi geçilmiş, altyapı production'a hazır, yasal doküman ve uyumluluk yerinde.
4. Faz 20-21: Onboarding/destek akışları çalışıyor, gerçek kullanıcılarla beta test edilmiş ve mağazalarda yayında.

**Önemli gerçekçilik notu:** "Geniş marka desteği" ve "uluslararasılaşma" gibi hedefler doğaları gereği sürekli genişler (yeni marka, yeni dil hep çıkar) — bunlar Faz 16/13'teki genişleyebilir yapılarla çözülür; bu, v1.0'ın "bitmemiş" olduğu anlamına gelmez, "büyümeye açık" tasarlandığı anlamına gelir. Geri kalan her şey (hesap, ödeme, güvenlik, yasal, dağıtım, destek) yukarıdaki fazlarla gerçekten kapatılmış ve v1.0 launch-ready durumdadır.
