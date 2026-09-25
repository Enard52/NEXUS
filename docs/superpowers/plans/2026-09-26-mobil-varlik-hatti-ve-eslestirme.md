# Mobil Paket Varlık Hattı + Eşleştirme Cihaz Görselleri — Implementation Plan (Plan 2)

**Goal:** Mobil bundle'ı offline çalışır hale getirmek (css/js/fonts + ikon çözümü) ve eşleştirme
akışında yalnızca desteklenen cihazların isim + gerçek görsellerini göstermek.

**Architecture:** Kaynak sayfalar repo kökünde `stitch-*.html`; `mobile-app/scripts/build-web.mjs`
bunları `mobile-app/www/` içine kopyalar ve Capacitor WebView `https://localhost` originsiyle sunar.
Varlıklar (`css/tailwind.css`, `js/lucide.js`, `fonts/inter/`) `www/` ayna klasöründe build
çıktısı olarak üretiliyor ama bundle'a hiç kopyalanmıyordu. İkonlar 21 sayfada `<iconify-icon>`
kullanıyor ve Iconify script'i hiçbir yerde yüklenmiyor → 179 ikon görünmüyor.

**Tech Stack:** Statik HTML + yerel Tailwind CSS çıktısı + lucide UMD (`js/lucide.js`), Node build
scripti, vitest.

**Spec:** `docs/superpowers/specs/2026-09-26-mobil-oncelikli-yayin-design.md` (Bölüm 3.1, 8)

## Global Constraints

- Mevcut tasarım dili korunur: `glass-card ... rounded-[2.5rem]`, `plain-card ... rounded-2xl`,
  `dark:` varyantları, `nexusPurple`/`nexusCyan` renkleri, Türkçe metin, inline SVG ikon, emoji yok.
- Dış CDN yasak (offline kuralı). Görseller `assets/products/` altından, hotlink yok.
- Task başında `pnpm test` yeşil; her task sonunda ilgili doğrulama komutu yeşil.
- Uretilen ciktilar (`public/`, `mobile-app/www/`) commit'e karıştırılmaz; bundle rebuild'i
  Yayın Planı'nda (Plan 6) bilinçli yapılır.

---

### Task 1: Bundle varlık hattı (css / js / fonts kopyalama)

**Files:**
- Modify: `mobile-app/scripts/build-web.mjs` (SHARED_ASSETS bloğu civarı, satır ~59-75)

**Interfaces:**
- Produces: `mobile-app/www/css/tailwind.css`, `mobile-app/www/js/lucide.js`,
  `mobile-app/www/fonts/inter/*` — bundle'daki her sayfa bunları relative yoldan bulur.

- [ ] **Step 1: Başarısız doğrulama — bundle'da varlıklar yok**

Run: `ls mobile-app/www/css mobile-app/www/js mobile-app/www/fonts`
Expected: üçü de "No such file or directory" (mevcut kırıklığın kanıtı).

- [ ] **Step 2: Varlıkları üret**

Run: `pnpm build:tailwind && pnpm copy:fonts && pnpm copy:lucide`
Expected: `www/css/tailwind.css`, `www/fonts/inter/`, `www/js/lucide.js` oluşur.

- [ ] **Step 3: build-web.mjs'ye varlık kopyalama ekle**

`SHARED_ASSETS` bloğunun hemen sonrasına ekle:

```js
// 2c. Ortak stiller, ikon kütüphanesi ve fontlar — sayfa başlıkları bunları
// relative yoldan (css/, js/, fonts/) bekliyor; kopyalanmazsa bundle'daki
// sayfalar stilsiz ve iconsuz açılır.
const SHARED_DIRS = [
  { from: join(REPO_ROOT, "www", "css"), to: join(OUT_DIR, "css") },
  { from: join(REPO_ROOT, "www", "js"), to: join(OUT_DIR, "js") },
  { from: join(REPO_ROOT, "www", "fonts"), to: join(OUT_DIR, "fonts") },
];
for (const dir of SHARED_DIRS) {
  if (!existsSync(dir.from)) {
    throw new Error(
      `Bundle varlığı eksik: ${dir.from} — once 'pnpm build:tailwind && pnpm copy:fonts && pnpm copy:lucide' calistirin.`,
    );
  }
  cpSync(dir.from, dir.to, { recursive: true });
}
```

- [ ] **Step 4: Bundle'ı yeniden kur ve doğrula**

Run: `cd mobile-app && npm run build:web && cd .. && ls mobile-app/www/css mobile-app/www/js mobile-app/www/fonts/inter`
Expected: üç klasör de dolu; build hatasız.

---

### Task 2: Iconify → lucide dönüşümü (CDN'suz ikonlar)

**Files:**
- Modify: 21 `stitch-*.html` (toplam 179 `<iconify-icon icon="lucide:...">` kullanım)
- Modify: iconify kullanıp `lucide.createIcons()` çağırmayan sayfaların script blokları

- [ ] **Step 1: Codemod**

Tüm `<iconify-icon icon="lucide:X" class="Y"></iconify-icon>` → `<i data-lucide="X" class="Y"></i>`.
Kural: `icon="lucide:NAME"` → `data-lucide="NAME"`, diğer attribute'lar (class vb.) aynen kalır,
etiket adı `i` olur, kapanış `</iconify-icon>` → `</i>`. Tek satırda kapanmayan/özyapan varyant
yok (grep ile doğrulandı); yine de script her iki yazımı desteklemeli.

- [ ] **Step 2: createIcons() kuyruğunu sağla**

`data-lucide` içerip `lucide.createIcons()` çağırmayan sayfa kalmasın; eksikse sayfadaki
`<script>` bloğunun sonuna ekle:

```js
if (typeof lucide !== 'undefined') lucide.createIcons();
```

- [ ] **Step 3: Doğrulama**

Run: `grep -c "iconify-icon" stitch-*.html | grep -v ":0" ; grep -l "code.iconify.design" stitch-*.html`
Expected: iki komut da boş çıktı (iconify tamamen kalktı, CDN referansı yok).

Run: `grep -L "lucide.createIcons" $(grep -l "data-lucide" stitch-*.html)`
Expected: boş.

- [ ] **Step 4: Commit (Task 1-2 birlikte)**

```bash
git add mobile-app/scripts/build-web.mjs stitch-*.html
git commit -m "fix(mobile): bundle local css/js/fonts and replace unloaded iconify with local lucide"
```

---

### Task 3: Desteklenen cihaz matrisi (tek kaynak)

**Files:**
- Create: `supported-devices.js` (kök; `data.js` deseniyle global `NEXUS_SUPPORTED_DEVICES`)
- Modify: `mobile-app/scripts/build-web.mjs` → SHARED_SCRIPTS listesine ekle

**Interfaces:**
- Produces: `NEXUS_SUPPORTED_DEVICES` — `{ brand, protocol, models: [{ name, img, caps }] }[]`
- Tüketir: Task 4 (eşleştirme sayfası), Plan 3 (paneller), Plan 4 (connector'lar)

- [ ] **Step 1: Veri dosyasını yaz**

Kapsam = LAN'dan, bulut parası ödemeden kontrol edebildiğimiz cihazlar (spec §2.1):

```js
// NEXUS destekli cihaz matrisi — tek kaynak.
// protocol: connector anahtarı (Plan 4); img: assets/products altindaki gercek urun gorseli.
const NEXUS_SUPPORTED_DEVICES = [
  {
    brand: "Shelly",
    protocol: "shelly",
    models: [
      { name: "Shelly Plug S", img: "smart_plug.jpg", caps: ["switch", "energy"] },
      { name: "Shelly Bulb", img: "smart_bulb.jpg", caps: ["switch", "brightness", "colorTemp"] },
      { name: "Shelly Motion", img: "motion-detector.jpg", caps: ["sensor"] },
    ],
  },
  {
    brand: "TP-Link Tapo",
    protocol: "tapo",
    models: [
      { name: "Tapo P110 Akıllı Priz", img: "smart_plug.jpg", caps: ["switch", "energy"] },
      { name: "Tapo L530E Ampul", img: "smart_bulb.jpg", caps: ["switch", "brightness"] },
      { name: "Tapo C200 Kamera", img: "security_camera.jpg", caps: ["camera"] },
    ],
  },
  {
    brand: "TP-Link Kasa",
    protocol: "kasa",
    models: [
      { name: "Kasa KP105 Priz", img: "smart_plug.jpg", caps: ["switch", "energy"] },
      { name: "Kasa KL110 Ampul", img: "smart_bulb.jpg", caps: ["switch", "brightness"] },
    ],
  },
  {
    brand: "Yeelight",
    protocol: "yeelight",
    models: [
      { name: "Yeelight Star Aydınlatma", img: "ceiling_light.jpg", caps: ["switch", "brightness", "color"] },
      { name: "Yeelight Şerit", img: "led_strip.jpg", caps: ["switch", "brightness", "color"] },
    ],
  },
  {
    brand: "WLED",
    protocol: "wled",
    models: [{ name: "WLED Şerit Kontrolcü", img: "led_strip.jpg", caps: ["switch", "brightness", "color"] }],
  },
  {
    brand: "ESPHome",
    protocol: "esphome",
    models: [{ name: "ESPHome Anahtar", img: "control-single-wall-switch.png", caps: ["switch"] }],
  },
  {
    brand: "Philips Hue",
    protocol: "hue",
    models: [{ name: "Hue White & Color Ambiance", img: "smart_bulb.jpg", caps: ["switch", "brightness", "color"] }],
  },
  {
    brand: "Tuya (yerel)",
    protocol: "tuya-local",
    note: "Gelişmiş: cihaz yerel anahtarı gerekir",
    models: [
      { name: "Tuya Akıllı Priz", img: "smart_plug.jpg", caps: ["switch"] },
      { name: "Tuya RGB Ampul", img: "smart_bulb.jpg", caps: ["switch", "brightness", "color"] },
    ],
  },
];
window.NEXUS_SUPPORTED_DEVICES = NEXUS_SUPPORTED_DEVICES;
```

Not: `img` dosyaları `assets/products/` içinde GERÇEKTEN var olmalı; olmayan dosya
`generic-smart-hub.png` fallback'ine düşer — Task 4'te liste diskteki dosyalarla doğrulanır.

- [ ] **Step 2: Dosya varlık doğrulaması**

Run: `node -e "const fs=require('fs');const s=fs.readFileSync('supported-devices.js','utf8');const imgs=[...s.matchAll(/img:\s*\"([^\"]+)\"/g)].map(m=>m[1]);const miss=imgs.filter(i=>!fs.existsSync('assets/products/'+i));console.log(miss.length? 'EKSIK: '+miss.join(', ') : 'tum gorseller mevcut')" `
Expected: `tum gorseller mevcut` (eksikler gerçek dosyalarla değiştirilir).

- [ ] **Step 3: Bundle listesine ekle**

`build-web.mjs` içindeki `SHARED_SCRIPTS` dizisine `"supported-devices.js"` ekle.

---

### Task 4: Eşleştirme sayfasında desteklenen cihazlar (isim + gerçek görsel)

**Files:**
- Modify: `stitch-pair.html` (manuel katalog bölümü ~157-279 arası)

**Interfaces:**
- Consumes: `NEXUS_SUPPORTED_DEVICES`, `assets/products/*`

- [ ] **Step 1: "Desteklenen Cihazlar" bölümü ekle**

`manual-catalog-section` üstüne, MEVCUT kart dilini kullanarak (`product-tile product-card`
deseni `stitch-integrations.html:2610-2618`), markaya göre gruplu bir liste render edilir:
gerçek ürün görseli (`<img src="assets/products/IMG?v=...">`, onerror → generic fallback),
cihaz adı, tek satır marka/protokol etiketi. Kategori kutuları (8 tile) aynen kalır; yeni
bölüm "hangilerini destekliyoruz" sorusunu görselle cevaplar.

Render kodu (script bloğuna):

```js
function renderSupportedDevices() {
  var host = document.getElementById("supported-devices-list");
  if (!host || typeof NEXUS_SUPPORTED_DEVICES === "undefined") return;
  host.innerHTML = NEXUS_SUPPORTED_DEVICES.map(function (group) {
    var items = group.models.map(function (m) {
      return '<button type="button" class="product-tile product-card" data-protocol="' +
        escapeHtml(group.protocol) + '" data-name="' + escapeHtml(m.name) + '">' +
        '<span class="product-image-stage"><img src="assets/products/' + encodeURIComponent(m.img) +
        '?v=20260801-products-4" alt="' + escapeHtml(m.name) + '" loading="lazy" decoding="async"' +
        ' onerror="this.onerror=null;this.src=\'assets/products/generic-smart-hub.png\'"></span>' +
        '<span class="product-name">' + escapeHtml(m.name) + '</span>' +
        '<span class="product-category-pill">' + escapeHtml(group.brand) + '</span></button>';
    }).join("");
    return '<section class="mt-5"><h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">' +
      escapeHtml(group.brand) + '</h4><div class="grid grid-cols-3 gap-2.5">' + items + '</div></section>';
  }).join("");
}
```

- [ ] **Step 2: `onerror` kısıtını tasarım kuralıyla değiştir**

Proje kuralı inline/yerel görsel + CDN yok; `onerror` attribute'u mevcut bundle'da
kullanılıyor (`stitch-integrations.html:2612`) — aynı deseni tekrarla, test
`has no inline event handlers` kuralı yalnızca premium marketing body için geçerli (kontrol et:
`marketing-premium.test.ts`), stitch sayfaları için değil.

- [ ] **Step 3: Kategori slug hizalaması**

`stitch-pair.html` içindeki `openCatalogCategory(...)` slug'ları `stitch-integrations.html`
`CATALOG` anahtarlarıyla/`CATALOG_ALIAS` ile eşleşmiyor (`kapi-ve-erisim` düşüyor,
`enerji-tasarrufu` yanlış etiketli). Eşleşmeyen slug'ları doğru anahtarlarla değiştir;
`grep -n "CATALOG = \|CATALOG_ALIAS" stitch-integrations.html` ile anahtar listesini al.

- [ ] **Step 4: Doğrulama**

Run: `cd mobile-app && npm run build:web && cd ..`
Sonra lokal sunucuyla bundle'ı aç ve eşleştirme sayfasını görüntüle:
`npx --yes serve -l 4188 mobile-app/www` → `stitch-pair.html` sayfasında stiller, ikonlar ve
desteklenen cihaz görselleri görünmeli (tarayıcıda screenshot ile kontrol edilir).

- [ ] **Step 5: Commit**

```bash
git add supported-devices.js stitch-pair.html mobile-app/scripts/build-web.mjs
git commit -m "feat(mobile): show supported devices with real product images on pairing screen"
```
