# NEXUS Mobile Premium Redesign + 5 Feature Listesi (Tek Seferde)

Bu plan 5 bölümden oluşur: (1) veri/model temeli, (2) mobil tasarım güzelleştirme, (3) cihaza özel kontroller, (4) iki yeni ekran (abonelik + eşleştirme), (5) test/build. Tüm değişiklikler `packages/` içinde; `public/mobile/*.html` build çıktıları yeniden üretilir.

## Bölüm 1 — Veri/Model Temeli (zorunlu altyapı)

### 1a. `packages/interface/src/index.ts`
- **`DeviceRow` genişletme** (L104): `type?: DeviceTypeId` ve `capabilities?: readonly Capability[]` alanları ekle. `DeviceTypeId = "lamp"|"tv"|"ac"|"lock"|"speaker"|"camera"|"thermostat"|"curtain"` ve `Capability` (`@nexus/devices`'tan re-export veya interface içinde tanımla: `{kind, value, min?, max?}`). `CapabilityKind`'a `"volume"|"channel"|"position"|"mode"` ekle (TV/ses/perde için).
- **`ScreenId`** (L21): `"billing-manage"` ve `"add-device"` ekle.
- **`SCREENS`** (L50): iki yeni `ScreenDescriptor` ekle (`billing-manage` admin-gated, `add-device` herkese açık).
- **`BillingManageModel`** + `buildBillingManageModel(plan)`: plan bilgileri, ödeme yöntemi (last4/brand), sonraki yenileme tarihi, fatura geçmişi, iptal akışı. `DemoScreens`'a `billingManage` alanı ekle.

### 1b. `packages/web/src/index.ts`
- **Demo cihazlara `type` + `capabilities` doldur** (L216-341): lamp→brightness/colorTemp, tv→volume/channel/source, ac→temperature/mode/fanSpeed, thermostat→targetTemp/mode, speaker→volume, lock→lockState, curtain→position, camera→privacyMode/quality.
- **`buildDemoScreens`**: `billingManage` modelini üret (L483 civarı).
- **`renderScreenBody`** switch (L540): `case "billing-manage"` ve `case "add-device"` ekle → web renderer'larına yönlendir.

### 1c. Ürün görselleri (vendor etme yaklaşımı — hotlink DEĞİL)
- **`public/img/devices/`** klasörü oluştur; 8 demo cihaz için yüksek kaliteli temsil görseli ekle. Kaynaklar: üretici press kit (indirme), Wikimedia Commons CC0/PD (indirme + attribution). **Hotlink yok** (önceki iptallerin sebebi kırılganlık).
- **`public/img/devices/LICENSE.md`**: her görselin kaynağı + lisansı + attribution.
- `DeviceRow.imageUrl` alanları demo fixture'da `"/img/devices/lamp.webp"` vb. olarak doldur.
- `renderDeviceTile` (mobile L794) ve web karşılığını güncelle: `imageUrl` varsa `<img class="dev-photo">` göster, yoksa mevcut gradyan+logo döşen. **Test bağımlılığı:** `<img class="dev-logo">` sibling yapısı + `onload/onerror` sözleşmesi korunur.

> **Risk notu:** Görsel bulma/lisans doğrulama adımı yavaştır ve üçüncü kez iptal riski taşır. Eğer güvenilir CC0 görsel bulamazsam, **fallback**: mevcut gradyan tile + daha büyük marka logosu yaklaşımını korur, `imageUrl`'ı boş bırakırım — bunu implementation sırasında karar verip raporlarım.

---

## Bölüm 2 — Mobil Tasarım Gzelleştirme (`packages/mobile/src/index.ts`)

### 2a. Sahneler → Temalı gradyan kartlar (`renderHomeSection` L868-880 + CSS L319-333)
Sahne verisine göre temalı gradyan paleti:
- Gün Doğumu → `#ff9a56→#ff6a88`, Gece → `#1e3a8a→#7c3aed`, Sinema → `#4c1d95→#0f172a`, Eve Geliş → `#0ea5e9→#22d3ee`, Dışarı Çıkış → `#f43f5e→#fb923c`, Uyku → `#312e81→#1e1b4b`.
- **`scene-card`** (2'li grid, `.fav-grid` ile uyumlu): gradyan dolu kart, beyaz SVG ikon (sol-üst), sahne adı (bold, beyaz), alt metin "3 cihaz · 2 eylem" (beyaz %80), sağ-alt küçük ▶ çalıştır butonu (cam efektli). Çalışınca glow + ripple animasyonu. **Class kancaları korunur:** `scene-chip`, `sc-ico`, `data-run` (test `scene-strip` kullanmıyor ama CSS'i güncellerim; `data-run` + spinner→check JS akışı korunur).

### 2b. Rutinler → Akış kartları (`renderSmartSection` L935-948)
- **`routine-card`**: sol gradyan ikon + rutin adı (bold) + **koşul→eylem mini-akışı**: `[ trigger rozeti ] → [ eylem ikonları + özet]`. Örn: `🕐 18:00 → 💡 Işıklar 💯 🌡 21°C`. Tetikleyici türü rozeti (Zamanlanmış/Sensör/Manuel/AI). Alt satır: "Her gün · bu hafta 12 kez çalıştı". Sağda toggle (açık/kapalı) + Çalıştır butonu.
- Demo veriden capabilities'i kullanarak eylem ikonlarını gerçekçi üret.

### 2c. Genel premium his (CSS güncellemeleri)
- `.fcard`, `.device-card`, `.menu-list`: daha derin gölgeler (`box-shadow` katmanları), ince highlight border-top, daha fazla nefes (padding).
- **Hero özet kartı** Home başlığının altına: cam (glassmorphism) kart "Evin hazır · 8 çevrimiçi · 2.72 kWh bugün · 5 rutin". Durum pill'leri (`.live-pills`) hero içine taşınır.
- Tutamlı radius skalası (24px kartlar, 16px ikonlar), daha yumuşak geçişler.

### 2d. Kutusuz canlı ikonlar (CSS L301-317 `.fav-ico`, L415-420 `.menu-ico`)
- **`.fav-ico::after` gloss** ve **gradyan kutu gölgesi** kaldırılır. Bunun yerine: ikon SVG'si *canlı, kendi renginde* (her ikon tipine özel dolu renk — lamba sarı, klima camcuse, kilit turuncu vb.), hafif renkli arka plan dairesi (`color-mix` %12). **Class adları korunur** (`fav-ico`, `menu-ico`, `bg-*`) — test `class="fav-ico bg-green"` bekliyor (L75), `bg-green` görünür kalsın diye arka plan halkası `bg-*`'ten renk alır.

---

## Bölüm 3 — Cihaza Özel Detay Kontrolleri (`renderDeviceDetailSection` L1253)

`d.type` ve `d.capabilities`'e göre **tip bazlı kontrol bloğu** (power + energy + spec arasına, `detail-controls` sınıfı):
- **lamp**: parlaklık slider (0-100), renk sıcaklığı slider (2700K-6500K), renk seçici (gradient bar).
- **ac**: hedef sıcaklık dial (16-30°C), mod seçici (Soğut/Isıt/Otomatik/Nemli), fan hızı.
- **thermostat**: hedef sıcaklık, mod (Isıt/Soğut/Otomatik).
- **tv**: ses slider, kanal +/-, kaynak seçici (HDMI1/HDMI2/Streaming).
- **speaker**: ses slider, oynat/duraklat.
- **curtain**: konum slider (0-100% açık).
- **lock**: kilitle/aç (büyük durum butonu), geçmiş.
- **camera**: gizlilik modu toggle, kalite seçici.

Kontroller demo-local çalışır (`data-toggle`, yeni `data-slider`/`data-set` — JS'e range input handler eklenir). **Görsel:** premium control widget'leri — dial için dairesel SVG arc, slider için kalın track + glow thumb.

---

## Bölüm 4 — İki Yeni Ekran

### 4a. Abonelik Yönetimi (`#billing-manage`, `renderBillingManageSection`)
`renderBillingSection`'daki "Planı yönet" butonunu `data-nav="billing-manage"` yap (L1347). Yeni section:
- **Plan karşılaştırma**: Free/Premium/Family kartları (mevcut plan vurgulu), özellik karşılaştırma tablosu (checkmark grid).
- **Ödeme yöntemi** kartı: kart markası (logo) + `•••• 4242`, "Değiştir" butonu.
- **Sonraki yenileme**: tarih + tutar, "Yenilemeyi iptal et" (uyarı modal).
- **Fatura geçmişi**: aylık satırlar (tarih, tutar, PDF indir).

### 4b. Cihaz Ekleme/Eşleştirme (`#add-device`, `renderAddDeviceSection`)
Home'daki "Cihazlarım" başlığına **+ butonu** ekle (`data-nav="add-device"`). Yeni section:
- **Marka grid'i**: `ConnectorStore.catalog()` / `getRegionalBrands(locale)`'dan gelen markalar (Philips Hue, Tuya, IKEA, Xiaomi, Sonoff + daha). Her marka: Simple Icons logosu + ad + "kurulu/kilitli" durumu (premium gating). Yerel dile göre sıralı.
- **Manuel eşleştirme**: "Diğer / Bluetooth / Matter / Wi-Fi" seçenekleri.
- **Ağ tarama** simülasyonu: "Cihazları ara..." spinner → mock keşfedilen cihaz listesi (LocalNetworkConnector mantığıyla).
- "Yardım: cihazını eşleştirme moduna al" ipucu kartı.

İki section da `RECOMPOSED_IDS`/`MOBILE_HIDDEN_IDS` filtrelerine uygun eklenir; mobile override ternary (L1518) genişletilir.

---

## Bölüm 5 — Testler & Build

### 5a. `packages/mobile/src/render.test.ts` güncellemeleri
- Mevcut 189 satırlık testlerin **tümü geçmeye devam etmeli** (class kancaları korundu). Yeni assertion'lar ekle: `id="billing-manage"`, `id="add-device"`, `data-nav="billing-manage"`, `data-nav="add-device"`, `class="scene-card"` (veya güncellenmiş sahne class'ı), `class="routine-card"`, `class="detail-controls"`, cihaz tipi kontrolleri (`type="range"` slider'lar).
- Web testleri (`packages/web/src/*.test.ts`, `empirical-ui-verification.test.ts`) yeni screen case'leri için güncellenir.

### 5b. Build
- `pnpm build` (tüm paketler).
- `pnpm test` (764 mevcut test + yeniler) — tümü geçmeli.
- `public/mobile/index.html`, `public/mobile/light.html`, `public/mobile/tr/index.html`, `public/mobile/tr/light.html` `scripts/copy-static.mjs` ile yeniden üretilir.
- Manuel görsel doğrulama: tarayıcıda/ekran görüntüsünde Sahneler + Rutinler + yeni ekranlar.

---

## Riskler & Garantiler
- **Class sözleşmesi**: Test-pinned class adlarının tamamı korunur (`device-card`, `fav-ico bg-green`, `tgl`, `menu-row agent-card`, `ag-badge active`, vb.). Yeni class'lar eklenir, eskiler silinmez.
- **Ürün görselleri**: Hotlink yok; repo'ya vendor edilir + LICENSE.md. Güvenilir CC0 bulunamazsa mevcut gradyan+logo yaklaşımı korunur (raporlarım).
- **Demo-local davranış**: Tüm yeni kontroller (`data-slider`, `data-set`) mevcut progressive-enhancement JS modeline uygun, dead/placeholder UI yok.
- **Bu büyük bir değişiklik**: Implementation sırasında her bölümü ayrı commit mantığıyla sırayla yaparım; testleri her bölüm sonunda çalıştırırım.

## Uygulama Sırası
1. Bölüm 1 (interface + web model) → build altyapı hazır
2. Bölüm 2d (kutusuz ikonlar — en izole) → test
3. Bölüm 2a/2b/2c (sahneler/rutinler/premium) → test
4. Bölüm 3 (cihaz kontrolleri) → test
5. Bölüm 4a/4b (yeni ekranlar) → test
6. Bölüm 5 (build + HTML yeniden üret + görsel doğrulama)