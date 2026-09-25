# NEXUS — Mobil-Öncelikli Kademeli Yayın Tasarımı (Yol A)

> Tarih: 2026-09-26 · Durum: Kullanıcı onaylı · Kapsam: Faz 1 (mobil yayın). Masaüstü hub + Zigbee ayrı bir Faz 2 spec'idir.

## 1. Amaç ve Bağlam

NEXUS, Tuya bulut ücreti veya özel hub altyapısı maliyeti yüzünden durmuştu. Bu tasarım,
**sıfır tekrarlayan maliyetle** yayına çıkmayı sağlayan mimariyi tanımlar:

- Cihaz kontrolü tamamen yerel ağda (LAN) — bulut maliyeti yok, Tuya'ya ödeme yok.
- Hesap/senkron Supabase ücretsiz katmanında — cihaz trafiği buluta hiç uğramaz, kota dolmaz.
- Yayın mobil öncelikli: Google Play + direkt APK; iOS kararı kullanıcıda ($99/yıl veya PWA).
- Masaüstü, Faz 2'de mobil tasarımdan sıfırdan dönüştürülecek; eski Electron kabuğu kaldırılır.

## 2. Sistem Mimarisi — İki Ayrı Düzlem

### 2.1 Kontrol düzlemi (LAN, maliyetsiz)

Telefon aynı Wi-Fi ağındayken cihazlarla doğrudan konuşur. Mevcut connector plugin
mimarisi (`packages/plugins`, `Connector` arayüzü, `UniversalDevice` modeli) korunur;
her protokol ayrı plugin olur:

| Protokol | Taşıyıcı | Kapsam |
|---|---|---|
| Shelly (Gen1 REST / Gen2 RPC) | HTTP | Ana hedef, temiz dokümante |
| WLED | HTTP (JSON API) | LED şeritler |
| ESPHome | HTTP (web server) / native API | DIY cihazlar |
| Yeelight | TCP 55443 (JSON-RPC) | Ampul/şerit |
| TP-Link Kasa / Tapo | Yerel API (XOR / KLAP-AES) | Yaygın priz/ampul |
| Tuya Wi-Fi | Yerel kontrol (localKey gerekir) | Best-effort, "gelişmiş" mod |

- **Keşif:** mDNS/SSDP. Tarayıcı/Capacitor WebView bunu yapamaz → küçük bir native
  Capacitor plugin'i yazılır (Android NSD; iOS Bonjour Faz 1 kapsamı dışında bırakılabilir,
  o durumda iOS'ta manuel IP ekleme).
- Keşif başarısızsa her protokol için **manuel IP ile ekleme** fallback'i zorunludur.

#### Taşıma katmanı kısıtı (2026-09-26 Plan 3 sonrası tespit — Plan 4'ü etkiler)

Mobil uygulama `packages/*` TypeScript kodunu **kullanmıyor**; kök `stitch-*.html`
sayfaları doğrudan WebView'de çalışıyor. Yani connector'lar telefonda gerçekten
çalışabilmek için sayfalardan yüklenen bir JS modülü olarak yazılmalı. İkinci engel:
`capacitor.config.json` içinde `androidScheme: "https"` ve `allowMixedContent: false`
olduğundan, WebView'dan `http://192.168.x.x` cihazlarına yapılan `fetch` çağrıları
**mixed-content olarak tarayıcı tarafından engellenir**. Çözüm seçenekleri:

1. Native HTTP plugin'i (`@capacitor/community-http` gibi) — istek cihaz ağ yığınından
   çıkar, kısıt kalkar. **Önerilen.**
2. `androidScheme: "http"` — kolay ama tüm WebView güvenliğini düşürür.
3. Uygulama içi küçük bir yerel proxy — fazladan karmaşa.

Bu yüzden Plan 4 connector'ları tek bir **transport arayüzü** üzerinden çalışmalı:
`nexusLanTransport.request({url, method, body})` → native HTTP adaptörü (telefonda) veya
`fetch` adaptörü (masaüstü tarayıcıda geliştirme/test için). Aynı arayüz keşif plugin'i
için de geçerli: JS tarafı `nexusLanDiscovery.start()/stop()` sözleşmesini kullanır,
native implementasyon sonradan takılır. Bu ayrım olmadan yazılan connector'lar
telefonda sessizce çalışmaz.


### 2.2 Hesap düzlemi (Supabase ücretsiz katman)

- Auth: e-posta/parola + Google + **Sign in with Apple** (App Store zorunluluğu —
  başka sosyal giriş varsa Apple girişi şart).
- Veri: kullanıcı başına cihaz listesi, oda, yeniden adlandırma, panel tercihleri.
  Postgres + Row Level Security ile kullanıcı izolasyonu.
- Senkron: cihaz kayıtları Supabase'e yazılır; aynı hesapla giren ikinci telefon aynı
  evi görür. Kontrol komutları **asla** bu düzleme girmez.
- Çevrimdışı tolerans: yerel cache ile çalışmaya devam; bağlantı dönünce senkron.
- Anahtarlar kod tabanına gömülmez; ortam değişkeni/yapılandırma ile verilir
  (`EXTERNAL-REQUIREMENTS.md` deseni: kod hazır, gerçek proje anahtarını kullanıcı sağlar).

### 2.3 Kaldırılan masaüstü

- `desktop-app/` (Electron kabuğu) ve `installer/` (masaüstü kurulum betikleri) kaldırılır.
- Paylaşılan `packages/*` kitaplıkları **korunur** — bunlar platformdan bağımsız uygulama
  çekirdeğidir ve mobil bunları kullanır. Kök `package.json`/workspace referansları
  temizlenir; mobil ve site build'leri kırılmadan çalışmaya devam etmelidir.
- Git geçmişi korunduğu için hiçbir şey kaybolmaz; Faz 2 sıfırdan yazılır.

## 3. Mobil İki Eksik — Tasarım Kararları

### 3.1 Eşleştirme sayfası — gerçek cihaz görselleri

- Sayfada **yalnızca desteklenen cihazlar** gösterilir: cihaz adı + gerçek görseli. Başka
  hiçbir şey eklenmez (kullanıcı talimatı: "o kadar").
- Keşifte bulunan cihazın model kimliği (mDNS/SSDP üstbilgisi) → görsel kataloğuyla eşleşir.
- Katalogda olmayan model için marka bazlı fallback görseli; o da yoksa inline SVG
  (proje kuralı: emoji yok, dış görsel bağımlılığı yok, offline çalışmalı).

### 3.2 Kontrol panelleri — işlev bazlı gruplama

- Cihazlar `UniversalDevice.capabilities` kümesine göre gruplanır.
- **Aynı işlev kümesine sahip cihazlar ortak panelde:** toplu aç/kapa, toplu dim/renk;
  tek cihaz kartına dokununca o cihazın ayrıntı kontrolü açılır.
- **Farklı işlev kümesi = farklı panel** (örn. sadece switch'li prizler ile dim+renk
  ampuller aynı panelde olmaz).
- Görsel dil mevcut mobil tasarımla birebir uyumlu olacak: NEXUS renk paleti, tipografi
  stack'i, kart/ köşe/ gölge dili, Türkçe metinler, inline SVG ikonlar, `data-purpose`
  semantik attribute kuralı. Bu sayfa tasarım açısından en kritik yeni yüzeydir.

## 4. Veri Akışı

1. Kullanıcı giriş yapar (Supabase Auth) → cihaz kayıtları çekilir + yerel cache'lenir.
2. "Cihaz ekle" → keşif plugin'i LAN'ı tarar → desteklenen cihazlar görseliyle listelenir
   → kullanıcı seçer → connector üzerinden doğrulama (ping/ilk komut) → kayıt Supabase'e.
3. Kontrol: komut her zaman LAN'dan connector'a; sonuç durumu yerel state + (bağlıysa)
   Supabase'deki son bilinen durum güncellenir.
4. LAN dışındayken: cihazlar salt-okunur, "ev ağında değilsin" durumu; son bilinen durum
   Supabase'den gösterilir.

## 5. Hata ve Kenar Durumları

- Cihaz ulaşılamaz: offline rozeti + `lastSeen` (modelde mevcut).
- Keşif sıfır sonuç: manuel IP ekleme akışına yönlendirme.
- Supabase çevrimdışı/hata: yerel cache ile tam işlev (kontrol zaten LAN); senkron kuyruğu
  bağlanınca boşalır.
- Connector komut hatası: kullanıcıya Türkçe, eyleme döndürülebilir mesaj; teknik detay
  log'a.
- Yanlış localKey (Tuya): doğrulama adımında yakalanır, cihaz eklenmez.

## 6. Test

- Connector'lar: protokol seviyesinde **mock cihaz sunucularına** karşı birim testler
  (mevcut paket test altyapısıyla uyumlu; gerçek donanım olmadan CI'da koşabilmeli).
- Keşif: sahte mDNS/SSDP kayıtlarıyla birim test.
- Panel gruplama: capability kümeleri üzerinden saf fonksiyon testleri.
- Yayın öncesi: release APK gerçek cihazda manuel doğrulama (kullanıcının yerel test
  alışkanlığıyla uyumlu — toplu düzeltme, tek final build).

## 7. Yayın Planı ve Maliyet

| Kalem | Maliyet | Not |
|---|---|---|
| Site hosting (GitHub/Cloudflare Pages) | $0 | Mevcut statik site |
| Supabase free tier | $0 | 500MB DB / 50k MAU |
| Google Play | $25 tek sefer | Play App Signing ücretsiz |
| Direkt APK (siteden, SHA-256 checksum) | $0 | Mevcut indirme altyapısı |
| iOS App Store | $99/yıl | Kullanıcı kararı; ertelenirse PWA |
| Masaüstü hub + Zigbee2MQTT | Faz 2 | Ayrı spec |

## 8. Kısıtlar ve Koruma Kuralları

- Mobil uygulama ve pazarlama sitesi **bozulmayacak**; mevcut ekranlara dokunan her
  değişiklik mevcut tasarım diliyle uyumlu olacak.
- Türkçe UI, inline SVG ikon, emoji yok, `data-purpose` attribute kuralı, NEXUS palet/
  tipografi — mevcut konvansiyonlar aynen geçerli.
- Commit'ler faz tamamlanınca (proje kuralı), kullanıcı yerel + gerçek cihaz doğrulaması
  yapmadan yayın/build dağıtımı yok.
- Faz 1 dışı kalanlar: Zigbee, masaüstü, uzaktan erişim, iOS native keşif (opsiyonel).
